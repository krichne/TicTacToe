const express = require('express');
const path    = require('path');
const http    = require('http');
const { WebSocketServer } = require('ws');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocketServer({ server });

// serve everything statically
app.use(express.static(__dirname));

const users  = new Map();      // nickname → ws
const rooms  = new Map();      // roomId → { players, board, turn, finished, winner }
const wsMeta = new Map();      // ws → { nickname, roomId }

wss.on('connection', ws => {
  ws.on('message', msg => {
    let data;
    try { data = JSON.parse(msg); }
    catch { return; }

    switch (data.type) {
      case 'set_nick': {
        const nick = data.nickname.trim();
        if (!nick || users.has(nick)) {
          return ws.send(JSON.stringify({
            type: 'nick_error',
            error: 'Nickname taken or invalid.'
          }));
        }
        users.set(nick, ws);
        wsMeta.set(ws, { nickname: nick, roomId: null });
        ws.send(JSON.stringify({ type: 'nick_ok', nickname: nick }));
        broadcastUserList();
        break;
      }
      case 'challenge': {
        const targetWs = users.get(data.to);
        if (!targetWs) return;
        const from = wsMeta.get(ws).nickname;
        targetWs.send(JSON.stringify({
          type: 'challenge_request', from
        }));
        break;
      }
      case 'challenge_response': {
        const { from, accept } = data;
        const challengerWs = users.get(from);
        const responderMeta = wsMeta.get(ws);
        if (!challengerWs || !responderMeta) return;

        if (accept) {
          // build unique roomId
          const roomId = `${from}#${responderMeta.nickname}#${Date.now()}`;
          const board  = Array(9).fill(null);
          rooms.set(roomId, {
            players: [challengerWs, ws],
            board, turn: 'X', finished: false
          });
          // tag each socket
          wsMeta.get(challengerWs).roomId = roomId;
          wsMeta.get(ws).roomId               = roomId;
          // init both
          challengerWs.send(JSON.stringify({ type:'init', symbol:'X' }));
          ws.send           (JSON.stringify({ type:'init', symbol:'O' }));
          broadcastState(roomId);
        } else {
          challengerWs.send(JSON.stringify({
            type: 'challenge_declined',
            from: responderMeta.nickname
          }));
        }
        break;
      }
      case 'move': {
        const meta = wsMeta.get(ws);
        if (!meta || !meta.roomId) return;
        const room = rooms.get(meta.roomId);
        if (!room || room.finished) return;

        const idx      = data.index;
        const isFirst  = room.players[0] === ws;
        const symbol   = isFirst ? 'X' : 'O';

        if (symbol !== room.turn || room.board[idx]) return;
        room.board[idx] = symbol;

        if    (checkWin(room.board, symbol)) { room.finished = true; room.winner = symbol; }
        else if (!room.board.includes(null))  { room.finished = true; room.winner = 'draw'; }
        else                                  { room.turn = room.turn === 'X' ? 'O' : 'X'; }

        broadcastState(meta.roomId);
        break;
      }
      case 'reset_game': {
        const meta = wsMeta.get(ws);
        if (!meta?.roomId) return;
        const room = rooms.get(meta.roomId);
        if (!room) return;
        // reset board state
        room.board = Array(9).fill(null);
        room.turn = 'X';
        room.finished = false;
        room.winner = null;
        broadcastState(meta.roomId);
        break;
      }
    }
  });

  ws.on('close', () => {
    const meta = wsMeta.get(ws);
    if (meta) {
      const { nickname, roomId } = meta;
      // remove from lobby
      if (nickname) {
        users.delete(nickname);
        broadcastUserList();
      }
      // tear down any active game
      if (roomId && rooms.has(roomId)) {
        const rm = rooms.get(roomId);
        const other = rm.players.find(p => p !== ws);
        if (other?.readyState === other.OPEN) {
          other.send(JSON.stringify({ type: 'opponent_left' }));
          wsMeta.get(other).roomId = null;
        }
        rooms.delete(roomId);
      }
      wsMeta.delete(ws);
    }
  });
});

function broadcastUserList() {
  const list = Array.from(users.keys());
  const payload = JSON.stringify({ type: 'user_list', users: list });
  users.forEach(ws => ws.send(payload));
}

function broadcastState(roomId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify({
    type: 'state',
    board: room.board,
    turn: room.turn,
    finished: room.finished,
    winner: room.winner || null
  });
  room.players.forEach(p => {
    if (p.readyState === p.OPEN) p.send(msg);
  });
}

function checkWin(b, s) {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return wins.some(line => line.every(i => b[i] === s));
}

const PORT = process.env.PORT||3000;
server.listen(PORT,()=>console.log(`Listening on http://localhost:${PORT}`));
