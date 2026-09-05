import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';

export const RATE_LIMIT_POLICY = {
  health: { limit: 60, windowMs: 60_000 },
  websocket: { limit: 8, windowMs: 60_000 },
};

const alphabet = 'BCDFGHJKLMNPQRSTVWXYZ23456789';
const productionOrigin = 'https://couch-crew.sociobot.in';

function send(socket, message) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
}

function clientAddress(request) {
  const forwarded = request.headers['x-forwarded-for'];
  // The ingress appends the connected peer address. Use that proxy-nearest
  // value rather than a client-supplied leading X-Forwarded-For entry.
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',').at(-1).trim();
  return request.socket.remoteAddress || 'unknown';
}

function makeAllowance(limits, now) {
  const buckets = new Map();
  return (kind, request) => {
    const policy = limits[kind];
    const key = `${kind}:${clientAddress(request)}`;
    const requestedAt = now();
    const current = buckets.get(key);
    const bucket = !current || requestedAt >= current.resetAt
      ? { count: 0, resetAt: requestedAt + policy.windowMs }
      : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    if (bucket.count <= policy.limit) return null;
    return Math.max(1, Math.ceil((bucket.resetAt - requestedAt) / 1000));
  };
}

function defaultOriginAllowed(origin) {
  return origin === productionOrigin
    || /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?$/.test(origin || '');
}

function code() {
  let value = randomBytes(4).readUInt32LE();
  let result = '';
  for (let index = 0; index < 4; index += 1) {
    result += alphabet[value % alphabet.length];
    value = Math.floor(value / alphabet.length);
  }
  return result;
}

function ownersFor(playerCount, roleIndex) {
  const owners = {
    3: [[1], [2], [2], [1], [3]],
    4: [[1], [2], [3], [4], [4]],
    5: [[1], [2], [3], [4], [5]],
    6: [[1], [2], [3], [4], [5, 6]],
  };
  return owners[playerCount][roleIndex];
}

export function createRealtimeServer({
  port = Number(process.env.PORT || 8787),
  buildId = process.env.BUILD_ID || process.env.GITHUB_SHA || 'development',
  limits = RATE_LIMIT_POLICY,
  isOriginAllowed = defaultOriginAllowed,
  now = Date.now,
} = {}) {
  const rooms = new Map();
  const allow = makeAllowance(limits, now);

  function roomState(room) {
    return {
      type: 'room-state',
      code: room.code,
      playerCount: room.playerCount,
      connectedPlayers: [...room.controllers.keys()].sort((a, b) => a - b),
      roleOwners: Array.from({ length: 5 }, (_, index) => ownersFor(room.playerCount, index)),
    };
  }

  function broadcast(room, message) {
    send(room.host, message);
    for (const controller of room.controllers.values()) send(controller, message);
  }

  function closeRoom(room, reason = 'The host ended this room.') {
    broadcast(room, { type: 'room-closed', reason });
    rooms.delete(room.code);
  }

  const http = createServer((request, response) => {
    if (request.url === '/health') {
      const retryAfter = allow('health', request);
      if (retryAfter) {
        response.writeHead(429, { 'content-type': 'application/json', 'cache-control': 'no-store', 'retry-after': String(retryAfter) });
        response.end(JSON.stringify({ error: 'Too many health checks. Try again later.' }));
        return;
      }
      response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
      response.end(JSON.stringify({ service: 'couch-crew-realtime', rooms: rooms.size, buildId }));
      return;
    }
    response.writeHead(404, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'Not found' }));
  });
  const wss = new WebSocketServer({ noServer: true });

  http.on('upgrade', (request, socket, head) => {
    const origin = request.headers.origin;
    if (!isOriginAllowed(origin)) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\nContent-Type: application/json\r\n\r\n{"error":"This origin cannot join Couch Crew rooms."}');
      socket.destroy();
      return;
    }
    const retryAfter = allow('websocket', request);
    if (retryAfter) {
      socket.write(`HTTP/1.1 429 Too Many Requests\r\nConnection: close\r\nRetry-After: ${retryAfter}\r\nContent-Type: application/json\r\n\r\n{"error":"Too many room connections. Try again later."}`);
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (websocket) => wss.emit('connection', websocket, request));
  });

  wss.on('connection', (socket) => {
    let membership;
    socket.on('message', (raw) => {
      let message;
      try { message = JSON.parse(raw.toString()); } catch { send(socket, { type: 'error', message: 'Malformed signal.' }); return; }
      if (message.type === 'create') {
        const playerCount = Number(message.playerCount);
        if (!Number.isInteger(playerCount) || playerCount < 3 || playerCount > 6 || membership) {
          send(socket, { type: 'error', message: 'Choose a crew of 3 to 6 players.' }); return;
        }
        let roomCode = code();
        while (rooms.has(roomCode)) roomCode = code();
        const room = { code: roomCode, playerCount, host: socket, controllers: new Map(), createdAt: Date.now() };
        rooms.set(roomCode, room);
        membership = { room, host: true };
        send(socket, { type: 'room-created', code: roomCode, playerCount });
        send(socket, roomState(room));
        return;
      }
      if (message.type === 'join') {
        const room = rooms.get(String(message.code || '').toUpperCase());
        if (!room || membership) { send(socket, { type: 'error', message: 'That room is unavailable. Check the four-letter code.' }); return; }
        const open = Array.from({ length: room.playerCount }, (_, index) => index + 1).find((id) => !room.controllers.has(id));
        if (!open) { send(socket, { type: 'error', message: 'Every controller slot is already filled.' }); return; }
        room.controllers.set(open, socket);
        membership = { room, playerId: open };
        const roleIndexes = Array.from({ length: 5 }, (_, index) => index).filter((index) => ownersFor(room.playerCount, index).includes(open));
        send(socket, { type: 'joined', code: room.code, playerId: open, roleIndexes, playerCount: room.playerCount });
        send(socket, roomState(room));
        if (room.snapshot) send(socket, { type: 'snapshot', snapshot: room.snapshot });
        broadcast(room, roomState(room));
        return;
      }
      if (!membership) { send(socket, { type: 'error', message: 'Join or create a room first.' }); return; }
      const { room } = membership;
      if (message.type === 'snapshot' && membership.host) {
        room.snapshot = message.snapshot;
        for (const controller of room.controllers.values()) send(controller, { type: 'snapshot', snapshot: room.snapshot });
      } else if (message.type === 'action' && !membership.host) {
        const roleIndex = Number(message.roleIndex);
        const actionIndex = Number(message.actionIndex);
        if (!Number.isInteger(roleIndex) || !Number.isInteger(actionIndex) || actionIndex < 0 || actionIndex > 1 || !ownersFor(room.playerCount, roleIndex)?.includes(membership.playerId)) {
          send(socket, { type: 'error', message: 'That control belongs to another phone.' }); return;
        }
        send(room.host, { type: 'controller-action', playerId: membership.playerId, roleIndex, actionIndex });
      }
    });
    socket.on('close', () => {
      if (!membership) return;
      const { room } = membership;
      if (membership.host) closeRoom(room);
      else if (rooms.get(room.code) === room) {
        room.controllers.delete(membership.playerId);
        broadcast(room, roomState(room));
      }
    });
  });

  const roomExpiry = setInterval(() => {
    for (const room of rooms.values()) if (Date.now() - room.createdAt > 30 * 60_000) closeRoom(room, 'This anonymous room expired after 30 minutes.');
  }, 60_000);
  roomExpiry.unref();

  return {
    http,
    rooms,
    listen: () => new Promise((resolve) => http.listen(port, '0.0.0.0', resolve)),
    close: () => new Promise((resolve, reject) => {
      clearInterval(roomExpiry);
      for (const client of wss.clients) client.terminate();
      http.close((error) => error ? reject(error) : resolve());
    }),
  };
}

if (process.argv[1] && new URL(import.meta.url).pathname === process.argv[1]) {
  const testLimits = process.env.COUCH_CREW_TEST_MODE === '1'
    ? { health: { limit: 10_000, windowMs: 60_000 }, websocket: { limit: 10_000, windowMs: 60_000 } }
    : RATE_LIMIT_POLICY;
  const server = createRealtimeServer({ limits: testLimits });
  server.listen().then(() => console.log(`Couch Crew signalling on ${process.env.PORT || 8787}`));
}
