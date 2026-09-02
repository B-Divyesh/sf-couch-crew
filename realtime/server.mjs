import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';

const port = Number(process.env.PORT || 8787);
const alphabet = 'BCDFGHJKLMNPQRSTVWXYZ23456789';
const rooms = new Map();

function send(socket, message) {
  if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message));
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
    response.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify({ service: 'couch-crew-realtime', rooms: rooms.size }));
    return;
  }
  response.writeHead(404, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ error: 'Not found' }));
});
const wss = new WebSocketServer({ server: http });

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

setInterval(() => {
  for (const room of rooms.values()) if (Date.now() - room.createdAt > 30 * 60_000) closeRoom(room, 'This anonymous room expired after 30 minutes.');
}, 60_000).unref();

http.listen(port, '0.0.0.0', () => console.log(`Couch Crew signalling on ${port}`));
