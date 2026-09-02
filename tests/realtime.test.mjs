import assert from 'node:assert/strict';
import { once } from 'node:events';
import { get } from 'node:http';
import test from 'node:test';
import { WebSocket } from 'ws';
import { createRealtimeServer } from '../realtime/server.mjs';

function health(port, client = '198.51.100.44') {
  return new Promise((resolve, reject) => {
    const request = get({ hostname: '127.0.0.1', port, path: '/health', headers: { 'x-forwarded-for': client } }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body }));
    });
    request.on('error', reject);
  });
}

function rejectedUpgrade(url, origin, client = '203.0.113.9') {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url, { origin, headers: { 'x-forwarded-for': client } });
    socket.once('unexpected-response', (_request, response) => {
      response.resume();
      resolve({ status: response.statusCode, headers: response.headers });
    });
    socket.once('error', reject);
  });
}

test('health exposes build identity and both endpoints enforce Retry-After allowances', async () => {
  const server = createRealtimeServer({
    port: 0,
    buildId: 'repair-test-build',
    limits: { health: { limit: 2, windowMs: 60_000 }, websocket: { limit: 2, windowMs: 60_000 } },
  });
  await server.listen();
  const port = server.http.address().port;
  const url = `ws://127.0.0.1:${port}`;
  const sockets = [];
  try {
    const first = await health(port);
    assert.equal(first.status, 200);
    assert.equal(JSON.parse(first.body).buildId, 'repair-test-build');
    await health(port);
    const throttledHealth = await health(port);
    assert.equal(throttledHealth.status, 429);
    assert.match(String(throttledHealth.headers['retry-after']), /^\d+$/);

    const forbidden = await rejectedUpgrade(url, 'https://attacker.example', '203.0.113.10');
    assert.equal(forbidden.status, 403);

    for (let index = 0; index < 2; index += 1) {
      const socket = new WebSocket(url, { origin: 'https://couch-crew.sociobot.in', headers: { 'x-forwarded-for': '203.0.113.9' } });
      sockets.push(socket);
      await once(socket, 'open');
    }
    const throttledSocket = await rejectedUpgrade(url, 'https://couch-crew.sociobot.in');
    assert.equal(throttledSocket.status, 429);
    assert.match(String(throttledSocket.headers['retry-after']), /^\d+$/);
  } finally {
    sockets.forEach((socket) => socket.close());
    await server.close();
  }
});
