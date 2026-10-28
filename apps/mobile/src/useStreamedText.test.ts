import { AccessibilityInfo } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { revealLength, useStreamedText } from './useStreamedText';

describe('revealLength', () => {
  it('reveals at least one character a frame', () => {
    expect(revealLength('Hi there', 0)).toBe(1);
    expect(revealLength('Hi there', 7)).toBe(8);
  });

  it('reveals a share of a large backlog each frame', () => {
    expect(revealLength('x'.repeat(400), 0)).toBe(50);
    expect(revealLength('x'.repeat(400), 380)).toBe(383);
  });

  it('catches up with a burst in well under a second at 60 frames a second', () => {
    const text = 'x'.repeat(2000);
    let shown = 0;
    let frames = 0;
    while (shown < text.length) { shown = revealLength(text, shown); frames += 1; }
    expect(frames).toBeLessThan(60);
  });

  it('never splits an emoji', () => {
    const text = 'Go 💪 now';
    const cut = text.indexOf('💪');
    expect(revealLength(text, cut)).toBe(cut + 2);
  });

  it('stops at the end of the text', () => {
    expect(revealLength('Done', 4)).toBe(4);
    expect(revealLength('', 0)).toBe(0);
  });
});

describe('useStreamedText', () => {
  const burst = 'x'.repeat(200);

  async function render(reduceMotion = false) {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(reduceMotion);
    const hook = await renderHook(() => useStreamedText());
    // Let the reduced-motion check resolve.
    await act(async () => {});
    return hook;
  }

  // Animation frames run only when a test asks, one at a time.
  let requested = new Map<number, FrameRequestCallback>();
  let nextId = 1;

  /** Runs one animation frame. */
  const frame = () => act(() => {
    const due = requested;
    requested = new Map();
    due.forEach(callback => callback(0));
  });

  /** Runs frames until nothing more is requested. */
  const allFrames = async () => {
    for (let i = 0; requested.size && i < 1000; i++) await frame();
  };

  beforeEach(() => {
    requested = new Map();
    jest.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(callback => {
      requested.set(nextId, callback);
      return nextId++;
    });
    jest.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation(id => { requested.delete(id!); });
  });
  afterEach(() => { jest.restoreAllMocks(); });

  it('reveals appended text over several frames rather than all at once', async () => {
    const { result } = await render();

    await act(() => result.current.append(burst));
    expect(result.current.shown).toBe('');
    await frame();
    expect(result.current.shown).toBe(burst.slice(0, 25));
    await frame();
    expect(result.current.shown.length).toBeGreaterThan(25);
    expect(result.current.shown.length).toBeLessThan(burst.length);

    await allFrames();
    expect(result.current.shown).toBe(burst);
  });

  it('keeps revealing text appended while a reveal is under way', async () => {
    const { result } = await render();

    await act(() => result.current.append('Rest '));
    await frame();
    await act(() => result.current.append('on Sunday.'));
    await allFrames();
    expect(result.current.shown).toBe('Rest on Sunday.');
  });

  it('settles only once everything received is on screen', async () => {
    const { result } = await render();
    const settled = jest.fn();

    await act(() => result.current.append(burst));
    void result.current.settled().then(settled);
    await frame();
    expect(settled).not.toHaveBeenCalled();

    await allFrames();
    expect(settled).toHaveBeenCalled();
  });

  it('settles straight away when nothing is waiting to be shown', async () => {
    const { result } = await render();

    await expect(result.current.settled()).resolves.toBeUndefined();
  });

  it('clears the text and releases anyone waiting when reset', async () => {
    const { result } = await render();
    const settled = jest.fn();

    await act(() => result.current.append(burst));
    await frame();
    void result.current.settled().then(settled);
    await act(async () => result.current.reset());

    expect(result.current.shown).toBe('');
    expect(settled).toHaveBeenCalled();
    await allFrames();
    expect(result.current.shown).toBe('');
  });

  it('shows everything in one frame when the device asks for reduced motion', async () => {
    const { result } = await render(true);

    await act(() => result.current.append(burst));
    await frame();
    expect(result.current.shown).toBe(burst);
  });
});
