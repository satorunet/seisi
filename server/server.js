// いのちのレース オンライン対戦サーバ（pm2: seisi-race）
// nginx: /dev/seisi/ws → 127.0.0.1:3520
'use strict';
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
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
// 受精者のアイコンは data/icons/<ハッシュ>.<拡張子> に保存して、一覧ではハッシュだけ持つ（同じ写真は1つにまとまる）
const ICONS = path.join(DATA, 'icons');
fs.mkdirSync(ICONS, { recursive: true });
const ICON_EXT = { jpeg: 'jpg', webp: 'webp', png: 'png' }, ICON_TYPE = { jpg: 'image/jpeg', webp: 'image/webp', png: 'image/png' };
function storeIcon(src) {
  const m = /^data:image\/(jpeg|webp|png);base64,([A-Za-z0-9+/]+=*)$/.exec(src || ''); if (!m) return undefined;
  const buf = Buffer.from(m[2], 'base64'), id = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 20) + '.' + ICON_EXT[m[1]];
  const f = path.join(ICONS, id);
  if (!fs.existsSync(f)) fs.writeFile(f, buf, () => { });
  return id;
}
function saveWinner(w) {
  w.ic = storeIcon(w.icon); delete w.icon;
  winners.unshift(w);
  if (winners.length > 1000) winners.length = 1000;
  fs.writeFile(WF + '.tmp', JSON.stringify(winners, null, 1), e => { if (!e) fs.rename(WF + '.tmp', WF, () => { }); });
  console.log('winner message', w.country, w.name, w.text);
}

// コース（難易度）ごとの記録。1人1件＝自己ベスト。キーは端末の秘密ID（uid）のハッシュ
// タイムはサーバの時計で測ったものだけが入る（ブラウザから記録を送る口はない）
const RF = path.join(DATA, 'records.json');
let records = { 1: {}, 2: {}, 3: {}, 4: {} };
try { Object.assign(records, JSON.parse(fs.readFileSync(RF, 'utf8'))); } catch { }
delete records.daily;   // 以前あった「今日のコース」の記録は使わない
const uidKey = uid => crypto.createHash('sha256').update('seisi:' + uid).digest('hex').slice(0, 24);
let recTimer = null;
function saveRecords() {
  if (recTimer) return;
  recTimer = setTimeout(() => { recTimer = null; fs.writeFile(RF + '.tmp', JSON.stringify(records), e => { if (!e) fs.rename(RF + '.tmp', RF, () => { }); }); }, 2000);
}
const byTime = tbl => Object.entries(tbl || {}).sort((a, b) => a[1].ms - b[1].ms || a[1].time - b[1].time);
const sorted = lv => byTime(records[lv]);
function put(tbl, key, rec) {
  const old = tbl[key], newBest = !old || rec.ms < old.ms;
  if (newBest) tbl[key] = rec;
  const i = byTime(tbl).findIndex(e => e[0] === key);
  return { best: tbl[key].ms, prev: old ? old.ms : null, newBest, rank: i + 1, total: Object.keys(tbl).length };
}
function onRecord({ uid, name, country, lv, ms, chr }) {
  const key = uidKey(uid);
  const r = Object.assign({ lv, ms }, put(records[lv] || (records[lv] = {}), key, { name, country, ms, time: Date.now(), chr }));
  if (r.newBest) { saveRecords(); console.log('record', lv, ms, country, name); }
  return r;
}
const pubRec = (k, r, key) => ({ name: r.name, country: r.country, ms: r.ms, time: r.time, chr: r.chr, me: k === key || undefined });
const ROOM_OPT = { allowMsg: true, onMessage: saveWinner, onRecord };
// Cloudflare が付ける国コード（XX=不明, T1=Tor）
const countryOf = req => { const c = String(req.headers['cf-ipcountry'] || '').toUpperCase(); return /^[A-Z]{2}$/.test(c) && c !== 'XX' && c !== 'T1' ? c : ''; };

// 待機中の部屋 → レース中の部屋で CPU に憑依して途中参戦 → 結果表示中・終盤のレースを観戦（次のレースから参加） → 新しい部屋
function findRoom(now, noSpec) {
  for (const r of rooms.values()) {
    if (r.state === 'wait' && r.startAt - now > 2500) return r;
  }
  let best = null;
  for (const r of rooms.values()) {
    if (r.state === 'wait') continue;
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
  const im = /^\/icon\/([0-9a-f]{20}\.(jpg|webp|png))$/.exec(req.url);
  if (im) {
    fs.readFile(path.join(ICONS, im[1]), (e, b) => {
      if (e) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': ICON_TYPE[im[2]], 'cache-control': 'public, max-age=31536000, immutable' }); res.end(b);
    });
    return;
  }
  if (req.url.startsWith('/records')) {
    // 上位 100 件 + 自分（?u=uid）の自己ベストと順位
    const u = new URL(req.url, 'http://x').searchParams.get('u') || '';
    const key = /^[0-9a-f]{32}$/.test(u) ? uidKey(u) : '';
    const out = { top: {}, me: {}, total: {} };
    for (const tab of [1, 2, 3, 4]) {
      const list = sorted(tab);
      out.top[tab] = list.slice(0, 100).map(([k, r]) => pubRec(k, r, key));
      const i = key ? list.findIndex(e => e[0] === key) : -1;
      if (i >= 0) out.me[tab] = { ms: list[i][1].ms, time: list[i][1].time, rank: i + 1 };
      out.total[tab] = list.length;
    }
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
    res.end(JSON.stringify(out));
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
const wss = new WebSocketServer({ server, maxPayload: 16384 });

wss.on('connection', (ws, req) => {
  let room = null, id = null, uid = '';
  const country = countryOf(req);
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  const send = m => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); };
  ws.on('message', buf => {
    let m; try { m = JSON.parse(buf); } catch { return; }
    const now = Date.now();
    if (m.t === 'join') {
      if (room) return;
      uid = /^[0-9a-f]{32}$/.test(m.uid) ? m.uid : '';
      room = findRoom(now);
      join(m.name, m.color, now, { icon: m.icon, wrap: m.wrap });
    } else if (m.t === 'solo' && room && room.specs.has(id)) {
      // 観戦をやめて、すぐ CPU とのレースへ
      const sp = room.specs.get(id);
      leave();
      room = findRoom(now, true);
      join(sp.name, sp.color, now, { icon: sp.icon, wrap: sp.wrap });
    } else if (room) room.onMsg(id, m, now);
  });
  function join(name, color, now, face) {
    id = room.state === 'wait' ? room.addHuman(name, color, send, now, country, face)
      : (room.state === 'race' && room.possess(name, color, send, now, country, face)) || room.addSpectator(name, color, send, now, country, face);
    const p = room.players.get(id) || room.specs.get(id); if (p) p.uid = uid;
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
