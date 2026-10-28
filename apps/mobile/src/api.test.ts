import { fetch as streamingFetch } from 'expo/fetch';
import { sendMessage, type Exchange } from './api';

jest.mock('expo/fetch', () => ({ fetch: jest.fn() }));

const mockFetch = streamingFetch as unknown as jest.Mock;
const encoder = new TextEncoder();

const exchange: Exchange = {
  id: 'ex-1',
  prompt: 'Plan my week',
  reply: 'Rest on Sunday.',
  provider: 'demo',
  created_at: '2026-10-28T09:00:00Z',
};

const event = (data: object) => `data: ${JSON.stringify(data)}\n\n`;

/** A response whose body yields each chunk in turn, then ends.
 * Strings are encoded as UTF-8; byte arrays are passed through as they are. */
function streamOf(chunks: (string | Uint8Array)[]) {
  const queue = chunks.map(chunk => typeof chunk === 'string' ? encoder.encode(chunk) : chunk);
  return {
    ok: true,
    body: {
      getReader: () => ({
        read: async () => queue.length
          ? { done: false, value: queue.shift() }
          : { done: true, value: undefined },
      }),
    },
  };
}

/** A response whose body never sends anything, and fails once the request is aborted. */
function silentStream(signal: AbortSignal) {
  return {
    ok: true,
    body: {
      getReader: () => ({
        read: () => new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
        }),
      }),
    },
  };
}

beforeEach(() => {
  mockFetch.mockReset();
  jest.useRealTimers();
});

describe('sendMessage', () => {
  it('posts the message as JSON and asks for an event stream', async () => {
    mockFetch.mockResolvedValue(streamOf([event({ type: 'done', exchange })]));

    await sendMessage('Plan my week', () => {});

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/chat$/);
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json', Accept: 'text/event-stream' });
    expect(JSON.parse(init.body)).toEqual({ message: 'Plan my week' });
  });

  it('passes each piece of text to onDelta and resolves with the saved exchange', async () => {
    mockFetch.mockResolvedValue(streamOf([
      event({ type: 'delta', text: 'Rest ' }),
      event({ type: 'delta', text: 'on Sunday.' }),
      event({ type: 'done', exchange }),
    ]));
    const deltas: string[] = [];

    await expect(sendMessage('Plan my week', text => deltas.push(text))).resolves.toEqual(exchange);
    expect(deltas).toEqual(['Rest ', 'on Sunday.']);
  });

  it('reassembles events and characters split across chunks', async () => {
    const stream = event({ type: 'delta', text: 'Go 💪' }) + event({ type: 'done', exchange });
    const bytes = encoder.encode(stream);
    // Cut inside the emoji's four bytes, and again between the two events' blank line.
    const emojiStart = encoder.encode(stream.slice(0, stream.indexOf('💪'))).length;
    const blankLine = encoder.encode(stream.slice(0, stream.indexOf('\n\n') + 1)).length;
    mockFetch.mockResolvedValue(streamOf([
      bytes.slice(0, emojiStart + 2),
      bytes.slice(emojiStart + 2, blankLine),
      bytes.slice(blankLine),
    ]));
    const deltas: string[] = [];

    await expect(sendMessage('Hi', text => deltas.push(text))).resolves.toEqual(exchange);
    expect(deltas).toEqual(['Go 💪']);
  });

  it('joins multi-line data and ignores other fields and empty events', async () => {
    mockFetch.mockResolvedValue(streamOf([
      ': keep-alive comment\n\n',
      'event: message\ndata: {"type":"delta",\ndata: "text":"Hi"}\n\n',
      event({ type: 'done', exchange }),
    ]));
    const deltas: string[] = [];

    await sendMessage('Hi', text => deltas.push(text));
    expect(deltas).toEqual(['Hi']);
  });

  it('rejects with the message from an error event, after the text sent before it', async () => {
    mockFetch.mockResolvedValue(streamOf([
      event({ type: 'delta', text: 'Partial' }),
      event({ type: 'error', message: 'The model stopped responding.' }),
    ]));
    const deltas: string[] = [];

    await expect(sendMessage('Hi', text => deltas.push(text))).rejects.toThrow('The model stopped responding.');
    expect(deltas).toEqual(['Partial']);
  });

  it('rejects when the stream ends without a done event', async () => {
    mockFetch.mockResolvedValue(streamOf([event({ type: 'delta', text: 'Partial' })]));

    await expect(sendMessage('Hi', () => {})).rejects.toThrow('The connection closed before the reply finished.');
  });

  it('rejects with the API detail when the request is refused', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({ detail: 'Message is too long.' }) });

    await expect(sendMessage('Hi', () => {})).rejects.toThrow('Message is too long.');
  });

  it('rejects with a generic message when the refusal has no detail', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => { throw new SyntaxError('Not JSON'); } });

    await expect(sendMessage('Hi', () => {})).rejects.toThrow('Request failed. Please try again.');
  });

  it('rejects when the device gives no response body to stream', async () => {
    mockFetch.mockResolvedValue({ ok: true, body: null });

    await expect(sendMessage('Hi', () => {})).rejects.toThrow('Streaming replies are not supported on this device.');
  });

  it('gives up when no data arrives for 60 seconds', async () => {
    jest.useFakeTimers();
    mockFetch.mockImplementation(async (_url: string, init: RequestInit) => silentStream(init.signal!));

    const reply = sendMessage('Hi', () => {});
    const failure = expect(reply).rejects.toThrow('The reply stalled. Please try again.');
    await jest.advanceTimersByTimeAsync(60000);
    await failure;
  });

  it('restarts the 60 second limit whenever data arrives', async () => {
    jest.useFakeTimers();
    let signal!: AbortSignal;
    const chunks = [event({ type: 'delta', text: 'Slow ' }), event({ type: 'done', exchange })];
    // Each chunk arrives 50 seconds after the previous read: 100 seconds in all, but never 60 idle.
    mockFetch.mockImplementation(async (_url: string, init: RequestInit) => {
      signal = init.signal!;
      return {
        ok: true,
        body: {
          getReader: () => ({
            read: () => new Promise((resolve, reject) => {
              signal.addEventListener('abort', () => reject(new Error('Aborted')));
              const chunk = chunks.shift();
              setTimeout(() => resolve(chunk ? { done: false, value: encoder.encode(chunk) } : { done: true }), 50000);
            }),
          }),
        },
      };
    });

    const reply = sendMessage('Hi', () => {});
    await jest.advanceTimersByTimeAsync(100000);
    await expect(reply).resolves.toEqual(exchange);
  });

  it('aborts the request once the reply is complete', async () => {
    let signal!: AbortSignal;
    mockFetch.mockImplementation(async (_url: string, init: RequestInit) => {
      signal = init.signal!;
      return streamOf([event({ type: 'done', exchange })]);
    });

    await sendMessage('Hi', () => {});
    expect(signal.aborted).toBe(true);
  });
});
