// いのちのレース オンライン対戦サーバ（pm2: seisi-race）
// nginx: /dev/seisi/ws → 127.0.0.1:3520
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const core = require('../core.js');

const PORT = +process.env.PORT || 3520;
const rooms = new Map();
let roomSeq = 1;

// 1位のメッセージ（新しい順、最大1000件）。server/data は nginx で非公開
const DATA = path.join(__dirname, 'data');
fs.mkdirSync(DATA, { recursive: true });
const WF = path.join(DATA, 'winners.json');
let winners = [];
try { winners = JSON.parse(fs.readFileSync(WF, 'utf8')); } catch { }
function saveWinner(w) {
  winners.unshift(w);
  if (winners.length > 1000) winners.length = 1000;
  fs.writeFile(WF + '.tmp', JSON.stringify(winners, null, 1), e => { if (!e) fs.rename(WF + '.tmp', WF, () => { }); });
  console.log('winner message', w.country, w.name, w.text);
}
const ROOM_OPT = { allowMsg: true, onMessage: saveWinner };
// Cloudflare が付ける国コード（XX=不明, T1=Tor）
const countryOf = req => { const c = String(req.headers['cf-ipcountry'] || '').toUpperCase(); return /^[A-Z]{2}$/.test(c) && c !== 'XX' && c !== 'T1' ? c : ''; };

// 待機中の部屋 → レース中の部屋で CPU に憑依して途中参戦 → 結果表示中・終盤のレースを観戦（次のレースから参加） → 新しい部屋
function findRoom(now, noSpec) {
  for (const r of rooms.values()) {
    if (r.state === 'wait' && r.headcount() < core.MAX && r.startAt - now > 2500) return r;
  }
  let best = null;
  for (const r of rooms.values()) {
    if (r.state === 'wait' || r.headcount() >= core.MAX) continue;
    // 憑依できるレース（新しく始まった順）＞ 結果表示中（もうすぐ次）＞ 憑依できないレース
    const pos = r.state === 'race' && r.possessable().length > 0;
    if (noSpec && !pos) continue;
    const k = pos ? 0 : r.state === 'result' ? 1 : 2, at = pos ? -r.startAt : r.state === 'result' ? r.nextAt : r.startAt;
    if (!best || k < best.k || (k === best.k && at < best.at)) best = { r, k, at };
  }
  if (best) return best.r;
  const r = new core.Room('r' + (roomSeq++), now, ROOM_OPT);
  rooms.set(r.id, r);
  return r;
}

const server = http.createServer((req, res) => {
  if (req.url === '/winners') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(winners.slice(0, 300)));
    return;
  }
  if (req.url === '/country') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify({ country: countryOf(req) }));
    return;
  }
  if (req.url === '/stats') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ rooms: rooms.size, players: [...rooms.values()].reduce((n, r) => n + r.headcount(), 0) }));
    return;
  }
  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('seisi race server');
});
const wss = new WebSocketServer({ server, maxPayload: 4096 });

wss.on('connection', (ws, req) => {
  let room = null, id = null;
  const country = countryOf(req);
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  const send = m => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); };
  ws.on('message', buf => {
    let m; try { m = JSON.parse(buf); } catch { return; }
    const now = Date.now();
    if (m.t === 'join') {
      if (room) return;
      room = findRoom(now);
      join(m.name, m.color, now);
    } else if (m.t === 'solo' && room && room.specs.has(id)) {
      // 観戦をやめて、すぐ CPU とのレースへ
      const sp = room.specs.get(id);
      leave();
      room = findRoom(now, true);
      join(sp.name, sp.color, now);
    } else if (room) room.onMsg(id, m, now);
  });
  function join(name, color, now) {
    id = room.state === 'wait' ? room.addHuman(name, color, send, now, country)
      : (room.state === 'race' && room.possess(name, color, send, now, country)) || room.addSpectator(name, color, send, now, country);
  }
  function leave() {
    if (!room) return;
    room.removeHuman(id, Date.now());
    if (room.headcount() === 0) rooms.delete(room.id);
    room = null;
  }
  ws.on('close', leave);
});

setInterval(() => { const now = Date.now(); for (const r of rooms.values()) r.tick(now); }, 50);
setInterval(() => {
  for (const ws of wss.clients) { if (!ws.isAlive) { ws.terminate(); continue; } ws.isAlive = false; ws.ping(); }
}, 30000);

server.listen(PORT, '127.0.0.1', () => console.log('seisi race server on', PORT));
