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

test('health exposes the deployed build identity', async () => {
  const server = createRealtimeServer({
    port: 0,
    buildId: 'repair-test-build',
  });
  await server.listen();
  const port = server.http.address().port;
  try {
    const response = await health(port);
    assert.equal(response.status, 200);
    assert.equal(JSON.parse(response.body).buildId, 'repair-test-build');
  } finally {
    await server.close();
  }
});

test('room sockets accept only Couch Crew and local origins @claim:origin-policy', async () => {
  const server = createRealtimeServer({ port: 0 });
  await server.listen();
  const port = server.http.address().port;
  const url = `ws://127.0.0.1:${port}`;
  const sockets = [];
  try {
    const forbidden = await rejectedUpgrade(url, 'https://attacker.example', '203.0.113.10');
    assert.equal(forbidden.status, 403);
    const deceptive = await rejectedUpgrade(url, 'https://couch-crew.sociobot.in.attacker.example', '203.0.113.11');
    assert.equal(deceptive.status, 403);

    for (const origin of ['https://couch-crew.sociobot.in', 'http://127.0.0.1:4173', 'http://localhost:5173']) {
      const socket = new WebSocket(url, { origin, headers: { 'x-forwarded-for': `203.0.113.${20 + sockets.length}` } });
      sockets.push(socket);
      await once(socket, 'open');
    }
  } finally {
    sockets.forEach((socket) => socket.close());
    await server.close();
  }
});

test('each client gets 8 room openings and 60 health checks per minute @claim:rate-limits', async () => {
  const server = createRealtimeServer({ port: 0 });
  await server.listen();
  const port = server.http.address().port;
  const url = `ws://127.0.0.1:${port}`;
  const sockets = [];
  try {
    for (let request = 1; request <= 60; request += 1) {
      const response = await health(port, '198.51.100.60');
      assert.equal(response.status, 200, `health request ${request}`);
    }
    const throttledHealth = await health(port, '198.51.100.60');
    assert.equal(throttledHealth.status, 429);
    assert.equal(throttledHealth.headers['retry-after'], '60');

    for (let opening = 1; opening <= 8; opening += 1) {
      const socket = new WebSocket(url, {
        origin: 'https://couch-crew.sociobot.in',
        headers: { 'x-forwarded-for': '203.0.113.80' },
      });
      sockets.push(socket);
      await once(socket, 'open');
      assert.equal(socket.readyState, WebSocket.OPEN, `room opening ${opening}`);
    }
    const throttledSocket = await rejectedUpgrade(url, 'https://couch-crew.sociobot.in', '203.0.113.80');
    assert.equal(throttledSocket.status, 429);
    assert.equal(throttledSocket.headers['retry-after'], '60');
  } finally {
    sockets.forEach((socket) => socket.close());
    await server.close();
  }
});
