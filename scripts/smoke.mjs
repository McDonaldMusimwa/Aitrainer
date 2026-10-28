import assert from 'node:assert/strict';

const base = process.env.API_URL || 'http://localhost:8000';
const health = await fetch(base + '/health');
assert.equal(health.status, 200, 'Backend and database must be healthy');
const invalid = await fetch(base + '/api/v1/chat', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '   ' }),
});
assert.equal(invalid.status, 422, 'Blank messages must be rejected');
const started = Date.now();
const response = await fetch(base + '/api/v1/chat', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
  body: JSON.stringify({ message: 'Hello from the Aitrainer smoke test' }),
  signal: AbortSignal.timeout(100000),
});
assert.equal(response.status, 200, await response.clone().text());
assert.match(response.headers.get('content-type'), /^text\/event-stream/);

const events = [];
let firstDeltaMs;
let buffer = '';
const decoder = new TextDecoder();
for await (const chunk of response.body) {
  buffer += decoder.decode(chunk, { stream: true });
  let boundary;
  while ((boundary = buffer.indexOf('\n\n')) >= 0) {
    const line = buffer.slice(0, boundary);
    buffer = buffer.slice(boundary + 2);
    if (!line.startsWith('data: ')) continue;
    const event = JSON.parse(line.slice(6));
    if (event.type === 'delta' && firstDeltaMs === undefined) firstDeltaMs = Date.now() - started;
    events.push(event);
  }
}
const last = events.at(-1);
assert.notEqual(last?.type, 'error', `Agent reported an error: ${last?.message}`);
assert.equal(last?.type, 'done', 'Stream must end with a done event');
const deltas = events.filter(event => event.type === 'delta');
assert.ok(deltas.length > 0, 'Reply text must be streamed as delta events');
const exchange = last.exchange;
assert.ok(exchange.id && exchange.reply && exchange.provider);
assert.equal(exchange.reply, deltas.map(event => event.text).join(''),
  'Saved reply must match the streamed text');
const history = await fetch(base + '/api/v1/chat');
assert.equal(history.status, 200);
assert.ok((await history.json()).some(item => item.id === exchange.id),
  'Response must persist in PostgreSQL');
console.log(`Passed: health, validation, streamed agent response (first text after ${firstDeltaMs} ms, ${deltas.length} chunks), and database persistence.`);
