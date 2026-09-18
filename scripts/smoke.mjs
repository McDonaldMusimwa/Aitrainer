import assert from 'node:assert/strict';

const base = process.env.API_URL || 'http://localhost:8000';
const health = await fetch(base + '/health');
assert.equal(health.status, 200, 'Backend and database must be healthy');
const invalid = await fetch(base + '/api/v1/chat', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '   ' }),
});
assert.equal(invalid.status, 422, 'Blank messages must be rejected');
const response = await fetch(base + '/api/v1/chat', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello from the Aitrainer smoke test' }),
  signal: AbortSignal.timeout(100000),
});
assert.equal(response.status, 201, await response.clone().text());
const exchange = await response.json();
assert.ok(exchange.id && exchange.reply && exchange.provider);
const history = await fetch(base + '/api/v1/chat');
assert.equal(history.status, 200);
assert.ok((await history.json()).some(item => item.id === exchange.id),
  'Response must persist in PostgreSQL');
console.log('Passed: health, validation, agent response, and database persistence.');
