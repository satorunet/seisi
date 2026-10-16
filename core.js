// 3億分の1 共通コア（ブラウザ / Node 両用）
// コース生成・ルーム進行・CPU 精子の挙動。サーバとオフライン対戦で同じコードを使う。
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SeisiCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const MAX = 8;          // 1レースの最低人数（足りない分は CPU）。人間は何人でも入れる
  const L = 2600;         // ゴール（卵子）までの距離
  const S0 = 60;          // スタート地点より後ろの余白
  const WAIT_MS = 12000;  // 最初の参加者からスタートまで
  const NEXT_MS = 9000;   // 結果表示から次のレース待機開始まで
  const MAX_RACE_MS = 200000;

  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  // コースの難易度（シードから決まる → サーバとクライアントで一致）
  // rs=管の太さ倍率 / 各数=罠の数
  const DIFFS = [
    { lv: 1, name: 'ゆるふわコース', w: 30, rs: 1.12, turn: .7, acid: 10, mucus: 6, crypt: 4, ab: 6, mem: 3, wbc: 5, mac: 1, wf: .8, ring: [60, 130], sugar: 110, gate: [5, .62], surge: 0 },
    { lv: 2, name: 'ふつうコース', w: 35, rs: 1, turn: 1.1, acid: 18, mucus: 10, crypt: 7, ab: 12, mem: 5, wbc: 9, mac: 2, wf: 1, ring: [70, 160], sugar: 90, gate: [4.6, .52], surge: 1 },
    { lv: 3, name: '荒れ狂うコース', w: 25, rs: .9, turn: 1.5, acid: 26, mucus: 14, crypt: 10, ab: 20, mem: 7, wbc: 13, mac: 3, wf: 1.25, ring: [90, 200], sugar: 70, gate: [4.2, .45], surge: 1 },
    { lv: 4, name: '地獄コース', w: 10, rs: .82, turn: 1.9, acid: 36, mucus: 18, crypt: 14, ab: 30, mem: 10, wbc: 18, mac: 5, wf: 1.5, ring: [120, 260], sugar: 50, gate: [3.8, .38], surge: 2 },
  ];
  function pickDiff(seed) {
    const x = rng(seed ^ 0x5bd1e995)() * 100; let a = 0;
    for (const d of DIFFS) { a += d.w; if (x < a) return d; }
    return DIFFS[1];
  }

  // 本物の道のり：膣 → 子宮頸管 → 子宮 → 卵管口 → 卵管峡部 → 卵管膨大部 → 卵子
  const REGIONS = [
    { id: 'vag', s0: 0, R: 11 },
    { id: 'cer', s0: 380, R: 8 },
    { id: 'ute', s0: 850, R: 15 },
    { id: 'utj', s0: 1500, R: 5 },
    { id: 'ist', s0: 1620, R: 6.8 },
    { id: 'amp', s0: 2100, R: 11 },
  ];
  function regionAt(s) { let i = 0; while (i + 1 < REGIONS.length && s >= REGIONS[i + 1].s0) i++; return i; }
  const GATE_S = 1556, CAPA_S = 2050, AMP_S = 2100;

  function radiusAt(c, s) {
    let R = REGIONS[0].R;
    for (let k = 1; k < REGIONS.length; k++) { const b = REGIONS[k].s0, w = k === 3 || k === 4 ? 18 : 35; R = lerp(R, REGIONS[k].R, sstep(b - w, b + w, s)); }
    R = R * c.diff.rs + 1.1 * Math.sin(s / 41 + c.p[1]) * (R / 11) + 1.4 * Math.sin(s / 95 + c.p[0]) * (R / 11);
    R = Math.max(3.9, R);
    R = lerp(6.2, R, sstep(14, 80, s));   // スタートは狭い管（発射口）
    R += sstep(L - 300, L - 40, s) * 34;  // 卵子の部屋
    return R;
  }

  function makeCourse(seed) {
    const r = rng(seed);
    const D = pickDiff(seed);
    const c = { seed, L, S0, diff: D, pts: [], p: [r() * 6, r() * 6, r() * 6], rings: [], acid: [], wbc: [], mem: [], sugar: [], mucus: [], crypt: [], ab: [], mac: [], cumulus: [], waves: [], surges: [] };
    let x = 0, y = 0, z = 0, dx = 0, dy = 0;
    const n = Math.ceil((L + S0 + 260) / 100) + 1;
    for (let i = 0; i < n; i++) {
      c.pts.push([x, y, z]);
      if (i > 1 && i < n - 5) { dx = clamp(dx + (r() - .5) * D.turn, -1, 1); dy = clamp(dy + (r() - .5) * D.turn * .9, -1, 1); }
      else if (i >= n - 5) { dx *= .3; dy *= .3; }
      x += dx * 48 * (.6 + D.turn * .4); y += dy * 36 * (.6 + D.turn * .4); z -= 100;
    }
    const lat = (s, m) => { const R = Math.max(0, radiusAt(c, s) - m); const a = r() * 6.283, d = Math.sqrt(r()) * R; return [Math.cos(a) * d, Math.sin(a) * d]; };
    const rs = (a, b) => a + r() * (b - a);
    // 蠕動の流れ（加速リング）：膣・子宮・膨大部だけ
    for (let s = 140; s < L - 220; s += D.ring[0] + r() * (D.ring[1] - D.ring[0])) {
      const reg = REGIONS[regionAt(s)].id; if (reg !== 'vag' && reg !== 'ute' && reg !== 'amp') continue;
      const [u, v] = lat(s, 3.5); c.rings.push({ s, u, v, r: 3 });
    }
    // 膣：酸（pH4）。一部は頸管の入口にも
    for (let k = 0; k < D.acid; k++) { const s = k < D.acid * .8 ? rs(90, 370) : rs(380, 560); const [u, v] = lat(s, 2); c.acid.push({ s, u, v, r: rs(4, 7.5) }); }
    // 子宮頸管：粘液・頸管腺のくぼみ（罠）・粘液栓（膜）
    for (let k = 0; k < D.mucus; k++) { const s = rs(400, 830); const [u, v] = lat(s, 1); c.mucus.push({ s, u, v, r: rs(2.6, 4.6) }); }
    for (let k = 0; k < D.crypt; k++) { const s = 420 + (400 * (k + r() * .6)) / D.crypt; c.crypt.push({ s, a: r() * 6.283 }); }
    for (let k = 0; k < D.mem; k++) c.mem.push({ s: k < D.mem * .7 ? 430 + (380 * (k + .5)) / Math.ceil(D.mem * .7) : rs(900, 1450) });
    c.mem.sort((a, b) => a.s - b.s);
    // 抗精子抗体（頸管〜子宮）
    for (let k = 0; k < D.ab; k++) { const s = rs(420, 1480); const [u, v] = lat(s, 1.5); c.ab.push({ s, u, v, ph: r() * 6, f: rs(.4, .9) }); }
    // 子宮：白血球（好中球）・マクロファージ
    for (let k = 0; k < D.wbc; k++) {
      const s = k < D.wbc * .8 ? 880 + (590 * (k + r() * .7)) / Math.ceil(D.wbc * .8) : rs(500, 820);
      const amp = (6 + r() * 14) * D.wf; let rmin = 99; for (let q = s - amp; q <= s + amp; q += 2) rmin = Math.min(rmin, radiusAt(c, q));
      const [u, v] = lat(s, 5); c.wbc.push({ s, u, v, r: Math.min(3.4 + r() * .8, rmin * .42), amp, f: (.25 + r() * .35) * D.wf, ph: r() * 6, orb: (2 + r() * 3) * D.wf });
    }
    for (let k = 0; k < D.mac; k++) { const s = 900 + (560 * (k + .5)) / D.mac; const [u, v] = lat(s, 4); c.mac.push({ s, u, v }); }
    // 子宮の蠕動波（レース時間で決まる。子宮を前へ進む波）
    for (let t = 6 + r() * 6; t < 140; t += 18 + r() * 8) c.waves.push({ t });
    // 免疫総攻撃（白血球が一時的に活発化）
    for (let k = 0; k < D.surge; k++) c.surges.push({ t: 22 + k * 30 + r() * 12, dur: 12 });
    // 卵管口のゲート（周期的に開閉）
    c.gate = { s: GATE_S, period: D.gate[0], open: D.gate[1], ph: r() * 10 };
    c.capa = { s: CAPA_S };
    // 卵子のまわりの卵丘細胞
    for (let k = 0; k < 70 + D.lv * 15; k++) { const s = rs(L - 150, L - 12); const [u, v] = lat(s, 1); c.cumulus.push({ s, u, v, r: rs(1.2, 2.2) }); }
    for (let k = 0; k < D.sugar; k++) { const s = 60 + r() * (L - 260); const [u, v] = lat(s, 1.5); c.sugar.push({ s, u, v }); }
    return c;
  }

  // スタートの並び（管の中に 3x3）
  // スタート位置：9人までは 3×3 の格子、それより多いときは発射口の中にひまわり状に詰める（全員 s=0 で公平）
  function gridPos(i) {
    if (i < 9) return { u: ((i % 3) - 1) * 2.9, v: (Math.floor(i / 3) - 1) * 2.9 };
    const k = i - 9, a = k * 2.39996, r = 1.1 + 3.6 * ((k * .618034 + .31) % 1);
    return { u: Math.cos(a) * r, v: Math.sin(a) * r };
  }
  const LAUNCH_BURST = 40;   // 発射の瞬間の初速ボーナス
  // 不正防止：クライアントが送る位置の上限（記録はサーバの時計で測るので、ここで速さを抑えれば縮められない）
  // 全部の糖・リング・蠕動波・スリップストリームを拾い続ける理論上の最速でも平均 55 前後
  const LIM_AVG = 60, LIM_HEAD = 60;     // （Y精子の基本速度ぶん少し余裕をみている）     // スタートからの累計：s ≤ 58 × 秒 + 60
  const LIM_RATE = 85, LIM_CAP = 150;    // 短い区間：毎秒 85 ずつたまる枠（ラグで遅れて届いた分は 150 まで許す）
  const DRILL_MIN_MS = 900;              // 卵子に着いてから受精までの最短（連打し続けても約 1.3 秒）

  // 免疫総攻撃中は白血球の時間が早く進む
  function immuneTime(c, t) { let x = t; for (const g of c.surges) x += .7 * clamp(t - g.t, 0, g.dur); return x; }
  function surgeAt(c, t) { return c.surges.some(g => t >= g.t && t < g.t + g.dur); }
  // 白血球の位置（レース開始からの秒数 t で決まる → 全員で同じ動き）
  function wbcAt(c, w, t, out) {
    t = immuneTime(c, t);
    const s = w.s + Math.sin(t * w.f + w.ph) * w.amp;
    let u = w.u * .7 + Math.cos(t * .7 + w.ph) * w.orb, v = w.v * .7 + Math.sin(t * .9 + w.ph) * w.orb;
    const R = Math.max(0, radiusAt(c, s) - w.r - .5), d = Math.hypot(u, v);
    if (d > R) { u *= R / d; v *= R / d; }
    out.s = s; out.u = u; out.v = v;
    return out;
  }
  // 抗体のただよい
  function abAt(c, a, t, out) {
    out.s = a.s + Math.sin(t * a.f + a.ph) * 3; out.u = a.u + Math.cos(t * a.f * 1.3 + a.ph) * 1.2; out.v = a.v + Math.sin(t * a.f * .9 + a.ph * 2) * 1.2;
    return out;
  }
  // 卵管口ゲート：開き具合 0(閉)〜1(開)
  function gateOpen(c, t) {
    const g = c.gate, ph = (((t + g.ph) % g.period) + g.period) % g.period / g.period;
    return sstep(0, .1, ph) * (1 - sstep(g.open - .1, g.open, ph));
  }
  // 子宮の蠕動波の先頭位置（なければ -1）
  function waveFront(c, t) {
    for (const w of c.waves) { const f = 850 + (t - w.t) * 45; if (t >= w.t && f <= 1500) return f; }
    return -1;
  }
  // 卵管膨大部の線毛による逆流（中央ほど強い）
  function counterFlow(c, s, u, v) {
    if (s < AMP_S || s > L - 60) return 0;
    const R = radiusAt(c, s), k = Math.min(1, Math.hypot(u, v) / R);
    return -9 * (1 - k * k) * sstep(AMP_S, AMP_S + 60, s);
  }
  // 化学走性：卵子のにおいの道すじ
  function trailAt(c, s, out) {
    const R = radiusAt(c, s);
    out.u = Math.sin(s / 37 + c.p[2]) * R * .45; out.v = Math.cos(s / 53 + c.p[0]) * R * .35;
    return out;
  }
  const BOT_NAMES = ['ムキムキ太郎', '鞭毛マスター', 'およげたい焼き', 'ミトコンド里子', 'ダッシュ丸', 'エリート3号', 'のんびり精', 'ジェット鞭毛', 'スイマー佐藤', 'ミスター卵', 'オタマ', 'ターボ精ちゃん', '一番乗り', 'DNA運び屋'];
  // 結果画面のひとこと（定型文はキーで送り、見る人の言語で表示する）
  const PRESETS = ['congrats', 'frustrated', 'again', 'gg', 'cute'];
  const BOT_WIN_LINES = 5;      // CPU が1位のときのセリフの数（文言はクライアント側）
  const CERE_MS = 30000;        // ゴール後のセレモニー（胎児化を見ながらひとこと）
  const BOT_COLORS = ['#ff6b6b', '#4dd4ff', '#ffd23f', '#9b7bff', '#5cff9d', '#ff9f43', '#ff7ad9', '#a0e7ff'];
  // X精子 / Y精子（スタートでランダム）：Y は速いが打たれ弱い、X は遅いが粘り強い（ゲーム的な誇張）
  const CHR = {
    X: { base: 25.2, acid: .72, mucus: .65, stun: .5, hitSpd: .35, regen: 10.5 },
    Y: { base: 27, acid: .5, mucus: .5, stun: .9, hitSpd: .2, regen: 9 },
  };
  const randChr = () => Math.random() < .5 ? 'X' : 'Y';
  const TWIN_P = 1 / 20;
  // アイコン（精子の頭に付ける写真）：ブラウザで 64×64 の JPEG に縮めたものだけ受け付ける
  const ICON_MAX = 12000;
  // face = { icon, wrap }：wrap は写真を頭に巻きつける広さ（角度。小さい丸 .9 〜 頭まるごと 3）
  const okFace = f => { const icon = okIcon(f && f.icon), w = +(f && f.wrap); return icon ? { icon, wrap: w >= .9 && w <= 3 ? Math.round(w * 100) / 100 : 1.65 } : { icon: '', wrap: undefined }; };
  const okIcon = s => typeof s === 'string' && s.length <= ICON_MAX && /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+/]+=*$/.test(s) ? s : '';        // 二卵性双生児（卵子が2個 → 2匹まで受精できる）

  class Room {
    constructor(id, now, opt) {
      this.id = id; this.players = new Map(); this.specs = new Map(); this.nextId = 1; this.lastRes = null;
      this.opt = Object.assign({ wait: WAIT_MS, next: NEXT_MS }, opt || {});
      this.reset(now, this.opt.wait);
    }
    humans() { return [...this.players.values()].filter(p => !p.bot); }
    headcount() { return this.humans().length + this.specs.size; }   // 観戦中の人も数える
    pub(p) { return { id: p.id, name: p.name, color: p.color, bot: !!p.bot, chr: p.chr, icon: p.icon || undefined, wrap: p.icon ? p.wrap : undefined }; }
    // レース中は位置も送る（途中参戦・観戦用）
    pubPos(q) { return Object.assign(this.pub(q), { s: +q.s.toFixed(2), u: +q.u.toFixed(2), v: +q.v.toFixed(2), spd: q.spd, b: q.b, place: q.place, time: q.fin, fert: q.fert }); }
    roomMsg(p, now, extra) {
      return Object.assign({ t: 'room', id: this.id, you: p.id, seed: this.seed, state: this.state, startAt: this.startAt, now, twins: this.twins,
        players: [...this.players.values()].map(q => this.state === 'race' ? this.pubPos(q) : this.pub(q)) }, extra);
    }
    // 途中参戦で乗り移れる CPU（まだ走っていて、ゴールまで余裕がある）
    possessable() { return [...this.players.values()].filter(p => p.bot && p.fin == null && p.s < L - 300); }
    // レース中に来た人は、走っている CPU に憑依してその場から参戦
    possess(name, color, send, now, country, face) {
      const cand = this.possessable(); if (!cand.length) return 0;
      const b = cand[(Math.random() * cand.length) | 0];
      this.players.delete(b.id);
      const id = this.nextId++;
      const p = this.mkHuman(id, name, color, send, country, face);
      // 途中参戦は CPU の走りを引き継ぐので記録にはしない
      Object.assign(p, { s: b.s, u: b.u, v: b.v, spd: b.spd, chr: b.chr, possessed: true });
      this.players.set(id, p);
      for (const q of this.players.values()) if (q !== p && q.send) { q.send({ t: 'del', id: b.id }); q.send({ t: 'add', p: this.pubPos(p), from: b.name }); }
      for (const q of this.specs.values()) { q.send({ t: 'del', id: b.id }); q.send({ t: 'add', p: this.pubPos(p), from: b.name }); }
      send(this.roomMsg(p, now, { from: b.name }));
      return id;
    }
    mkHuman(id, name, color, send, country, face) {
      return { id, name: String(name || 'ななしの精子').slice(0, 14), color: /^#[0-9a-f]{6}$/i.test(color) ? color : '#ffffff', bot: false, send, s: 0, u: 0, v: 0, spd: 0, b: 0, fin: null, place: 0, country: /^[A-Z]{2}$/.test(country || '') ? country : '', chr: randChr(), ...okFace(face) };
    }
    broadcast(m) { for (const p of this.players.values()) if (p.send) p.send(m); for (const p of this.specs.values()) p.send(m); }
    // レース中に来た人は観戦して、次のレースから参加
    specMsg(now) {
      return { t: 'spec', id: this.id, seed: this.seed, state: this.state, startAt: this.startAt, nextAt: this.nextAt, now, twins: this.twins,
        players: [...this.players.values()].map(q => this.pubPos(q)) };
    }
    addSpectator(name, color, send, now, country, face) {
      const id = this.nextId++;
      this.specs.set(id, { id, spec: true, name: String(name || 'ななしの精子').slice(0, 14), color: /^#[0-9a-f]{6}$/i.test(color) ? color : '#ffffff', send, country: /^[A-Z]{2}$/.test(country || '') ? country : '', ready: false, ...okFace(face) });
      send(this.specMsg(now));
      if (this.state === 'result' && this.lastRes) send(Object.assign({}, this.lastRes, { now }));
      return id;
    }
    reset(now, wait) {
      // 練習ではコース（難易度）を指定できる
      do { this.seed = (Math.random() * 1e9) | 0; } while (this.opt.diffLv && pickDiff(this.seed).lv !== this.opt.diffLv);
      // 双子チャンス：卵子が2個（2匹まで受精）
      this.twins = Math.random() < TWIN_P;
      this.eggs = this.twins ? 2 : 1; this.fertN = 0;
      this.state = 'wait'; this.course = makeCourse(this.seed);
      this.startAt = now + wait; this.firstFin = 0; this.finCount = 0; this.lastSnap = 0; this.lastTick = now; this.nextAt = 0; this.winnerPending = false; this.botChats = [];
      for (const p of [...this.players.values()]) {
        if (p.bot) this.players.delete(p.id);
        else Object.assign(p, { s: 0, u: 0, v: 0, spd: 0, b: 0, fin: null, place: 0, ready: false, possessed: false, lim: LIM_HEAD, limAt: 0, reachAt: 0, fert: false, chr: randChr() });
      }
      // 観戦していた人をレースに入れる
      for (const sp of this.specs.values()) {
        this.specs.delete(sp.id);
        this.players.set(sp.id, { id: sp.id, name: sp.name, color: sp.color, bot: false, send: sp.send, country: sp.country, uid: sp.uid, lastChat: sp.lastChat, icon: sp.icon, wrap: sp.wrap, s: 0, u: 0, v: 0, spd: 0, b: 0, fin: null, place: 0, ready: false, chr: randChr() });
      }
      this.lastRes = null;
      this.fillBots();
      this.assignGrid();
      for (const p of this.players.values()) if (p.send) p.send(this.roomMsg(p, now));
    }
    assignGrid() {
      let i = 0;
      for (const p of this.players.values()) { const g = gridPos(i++); p.u = g.u; p.v = g.v; p.s = 0; }
    }
    fillBots() {
      const used = new Set([...this.players.values()].map(p => p.name));
      while (this.players.size < MAX) {
        let name; do { name = BOT_NAMES[(Math.random() * BOT_NAMES.length) | 0]; } while (used.has(name) && used.size < BOT_NAMES.length);
        used.add(name);
        const id = this.nextId++;
        const chr = randChr();
        this.players.set(id, { id, name, color: BOT_COLORS[id % BOT_COLORS.length], bot: true, chr, s: 0, u: 0, v: 0, spd: 0, b: 0, fin: null, place: 0,
          base: 26.5 + (Math.random() * 4.5 - 2) + (chr === 'Y' ? 1 : -.8), ph: Math.random() * 6, bt: 1 + Math.random() * 3, boostT: 0, burst: 0, tu: 0, tv: 0, skill: .4 + Math.random() * .5, nextRing: 0 });
      }
    }
    addHuman(name, color, send, now, country, face) {
      if (this.players.size >= MAX) { const bot = [...this.players.values()].find(p => p.bot); if (bot) { this.players.delete(bot.id); this.broadcast({ t: 'del', id: bot.id }); } }
      const id = this.nextId++;
      const p = this.mkHuman(id, name, color, send, country, face);
      this.players.set(id, p);
      this.assignGrid();
      for (const q of this.players.values()) if (q !== p && q.send) q.send({ t: 'add', p: this.pub(p) });
      send(this.roomMsg(p, now));
      return id;
    }
    removeHuman(id, now) {
      if (this.specs.delete(id)) return;
      const gone = this.players.get(id);
      if (!this.players.delete(id)) return;
      if (gone && gone.token) this.broadcast({ t: 'winMsg', id, skip: true });
      this.broadcast({ t: 'del', id });
      if (this.state === 'wait') { this.fillBots(); this.assignGrid(); for (const p of this.players.values()) if (p.send) p.send(this.roomMsg(p, now)); }
    }
    onMsg(id, m, now) {
      const p = this.players.get(id) || this.specs.get(id); if (!p || !m) return;
      if (p.spec && m.t !== 'chat' && m.t !== 'ready' && m.t !== 'ping') return;
      if (m.t === 'st' && this.state === 'race' && p.fin == null) {
        const s = +m.s, u = +m.u, v = +m.v;
        if (!isFinite(s) || !isFinite(u) || !isFinite(v)) return;
        p.s = this.limitS(p, clamp(s, 0, L), now); p.u = clamp(u, -60, 60); p.v = clamp(v, -60, 60); p.spd = clamp(+m.spd || 0, 0, 120); p.b = m.b ? 1 : 0;
        if (p.s >= L - 15 && !p.reachAt) p.reachAt = now;
      } else if (m.t === 'fin' && this.state === 'race' && p.fin == null && p.s >= L - 15 && p.reachAt && now - p.reachAt >= DRILL_MIN_MS) {
        this.finish(p, now);
      } else if ((m.t === 'msg' || m.t === 'msgSkip') && p.token && m.token === p.token && now < p.tokenExp) {
        // 1位の人だけがメッセージを残せる（1回きり）
        p.token = null;
        const text = m.t === 'msg' ? String(m.text || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80) : '';
        if (text && this.opt.onMessage) this.opt.onMessage({ name: p.name, country: p.country, text, time: Date.now(), ms: p.winMs, lv: p.winLv, icon: p.icon || undefined, color: p.color });
        if (p.send) p.send({ t: 'msgOk', posted: !!text });
        this.broadcast(text ? { t: 'winMsg', id: p.id, name: p.name, country: p.country, text } : { t: 'winMsg', id: p.id, skip: true });
      } else if (m.t === 'chat' && (this.state === 'result' || this.state === 'wait') && now - (p.lastChat || 0) > 1200) {
        // ひとこと：自由入力（40字）か定型文
        p.lastChat = now;
        const preset = PRESETS.includes(m.preset) ? m.preset : null;
        const text = preset ? '' : String(m.text || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 40);
        if (preset || text) this.broadcast({ t: 'chat', id: p.id, name: p.name, country: p.country, preset, text });
      } else if (m.t === 'ready' && this.state === 'result') {
        p.ready = true;
        if (this.humans().every(h => h.ready) && [...this.specs.values()].every(h => h.ready)) this.nextAt = Math.min(this.nextAt, now + 1500);
      } else if (m.t === 'ping') {
        p.send && p.send({ t: 'pong', c: m.c, now });
      }
    }
    // 送られてきた位置を、ありえる速さの範囲におさえる（後ろに戻るのは自由）
    limitS(p, s, now) {
      if (s <= p.s) return s;
      const t = Math.max(0, now - this.startAt) / 1000;
      p.lim = Math.min(LIM_CAP, (p.lim == null ? LIM_HEAD : p.lim) + Math.max(0, now - (p.limAt || this.startAt)) / 1000 * LIM_RATE); p.limAt = now;
      let ns = Math.min(s, p.s + p.lim, LIM_AVG * t + LIM_HEAD);
      // 卵管口ゲート：閉じているあいだは通れない（通信の遅れぶん 1 秒さかのぼって、どこかで開いていれば OK）
      const g = this.course.gate.s;
      if (p.s < g && ns >= g) { let open = false; for (let k = 0; k <= 4 && !open; k++) open = gateOpen(this.course, t - k * .25) >= .5; if (!open) ns = g - .6; }
      ns = Math.max(ns, p.s);
      p.lim -= ns - p.s;
      return ns;
    }
    // 卵子に入りきった順にゴール。卵子の数（ふだん1・双子なら2）までが受精
    finish(p, now) {
      const fert = this.fertN < this.eggs;
      p.fert = fert; p.fin = now - this.startAt;
      p.place = ++this.finCount; p.s = L;
      if (!this.firstFin) this.firstFin = now;
      if (fert) this.fertN++;
      // 自己ベスト・ランキング（サーバの時計で測ったタイムだけ）
      if (!p.bot && !p.possessed && p.uid && this.opt.onRecord) {
        const ms = p.fin;
        const r = this.opt.onRecord({ uid: p.uid, name: p.name, country: p.country, lv: this.course.diff.lv, ms, chr: p.chr });
        if (r && p.send) p.send(Object.assign({ t: 'rec' }, r));
      }
      if (!p.bot && fert && this.fertN === 1 && this.opt.allowMsg) {
        p.token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2); p.tokenExp = now + 10 * 60000;
        p.winMs = p.fin; p.winLv = this.course.diff.lv; this.winnerPending = true;
        if (p.send) p.send({ t: 'win', token: p.token });
      }
      this.broadcast({ t: 'fin', id: p.id, place: p.place, time: p.fin, fert: p.fert });
    }
    stepBot(p, dt, t, now) {
      const c = this.course;
      if (p.fin != null) { p.spd *= .96; return; }
      // 卵子に着いたら先体反応（透明帯を溶かすのに数秒）
      if (p.s >= L) { p.s = L; p.spd = 0; p.drill = (p.drill || 0) + dt; return; }
      p.bt -= dt; p.boostT -= dt;
      if (p.bt <= 0) {
        p.bt = 2.5 + Math.random() * 4;
        if (Math.random() < .35) p.boostT = 1.5 + Math.random() * 1.5;
        const R = radiusAt(c, p.s + 30) * .65, a = Math.random() * 6.283, d = Math.sqrt(Math.random()) * R;
        p.tu = Math.cos(a) * d; p.tv = Math.sin(a) * d;
      }
      while (p.nextRing < c.rings.length && c.rings[p.nextRing].s < p.s) p.nextRing++;
      const ring = c.rings[p.nextRing];
      let tu = p.tu, tv = p.tv;
      if (ring && ring.s - p.s < 45 && p.skill > .55) { tu = ring.u; tv = ring.v; }
      if (p.s > AMP_S && p.skill > .5) { const o = trailAt(c, p.s + 10, {}); tu = o.u; tv = o.v; }
      let target = p.base + Math.sin(t * .35 + p.ph) * 1.6 + (p.boostT > 0 ? 11 : 0) + p.burst;
      const Y = p.chr === 'Y';
      for (const a of c.acid) if (Math.abs(a.s - p.s) < a.r && Math.hypot(a.u - p.u, a.v - p.v) < a.r) target *= Y ? .72 : .85;
      for (const m of c.mucus) if (Math.abs(m.s - p.s) < m.r && Math.hypot(m.u - p.u, m.v - p.v) < m.r) target *= Y ? .62 : .78;
      if (p.s > c.capa.s) target *= 1.08;
      const wf = waveFront(c, t); if (wf >= 0 && Math.abs(wf - p.s) < 12) target += 12;
      p.spd += (target - p.spd) * Math.min(1, dt * 1.5);
      const prev = p.s;
      p.s += (p.spd + counterFlow(c, p.s, p.u, p.v) * .6) * dt;
      // 卵管口ゲートが閉じていたら待つ
      if (prev < c.gate.s && p.s >= c.gate.s && gateOpen(c, t) < .5) { p.s = c.gate.s - .5; p.spd = 0; }
      p.burst = Math.max(0, p.burst - 15 * dt);
      if (ring && prev < ring.s && p.s >= ring.s && Math.random() < p.skill) p.burst = 18;
      const du = tu - p.u, dv = tv - p.v, dd = Math.hypot(du, dv);
      if (dd > .1) { const m = Math.min(dd, 7 * dt); p.u += du / dd * m; p.v += dv / dd * m; }
      const R = radiusAt(c, p.s) - 1.3, d = Math.hypot(p.u, p.v);
      if (d > R) { p.u *= R / d; p.v *= R / d; }
      p.b = p.boostT > 0 ? 1 : 0;
      if (p.s >= L) { p.s = L; p.drillNeed = 2.5 + Math.random() * 3; p.drill = 0; }
    }
    tick(now) {
      const dt = Math.min(.25, (now - this.lastTick) / 1000); this.lastTick = now;
      if (this.state === 'wait') {
        if (now >= this.startAt) { this.state = 'race'; for (const p of this.players.values()) if (p.bot) p.burst = LAUNCH_BURST; this.broadcast({ t: 'go', startAt: this.startAt, now }); }
        else if (now - this.lastSnap > 1000) { this.lastSnap = now; this.broadcast({ t: 'wait', startAt: this.startAt, now, n: this.players.size, humans: this.humans().length }); }
        return;
      }
      if (this.state === 'race') {
        const t = (now - this.startAt) / 1000;
        for (const p of this.players.values()) if (p.bot) {
          this.stepBot(p, dt, t, now);
          if (p.fin == null && p.s >= L && p.drill >= p.drillNeed) this.finish(p, now);
        }
        if (now - this.lastSnap >= 80) {
          this.lastSnap = now;
          const arr = [];
          for (const p of this.players.values()) arr.push([p.id, +p.s.toFixed(2), +p.u.toFixed(2), +p.v.toFixed(2), +p.spd.toFixed(1), p.b]);
          this.broadcast({ t: 'snap', now, p: arr });
        }
        const hs = this.humans();
        const allHumansDone = hs.length > 0 && hs.every(p => p.fin != null);
        if (allHumansDone || (this.firstFin && now - this.firstFin > 30000) || now - this.startAt > MAX_RACE_MS) this.endRace(now);
        return;
      }
      if (this.state === 'result') {
        for (const c of this.botChats) if (!c.sent && now >= c.at && this.players.has(c.id)) { c.sent = true; const b = this.players.get(c.id); this.broadcast({ t: 'chat', id: b.id, name: b.name, country: '', preset: c.preset, text: '' }); }
        if (now >= this.nextAt) this.reset(now, this.opt.wait);
      }
    }
    endRace(now) {
      this.state = 'result'; this.nextAt = now + (this.opt.cere || CERE_MS);   // 胎児化を見ながらひとこと
      const list = [...this.players.values()].sort((a, b) => (a.fin != null) !== (b.fin != null) ? (a.fin != null ? -1 : 1) : a.fin != null ? a.place - b.place : b.s - a.s);
      const win = list[0] && list[0].fert ? list[0] : null, twin = list[1] && list[1].fert ? list[1] : null;
      this.broadcast(this.lastRes = { t: 'res', now, nextAt: this.nextAt, twins: this.twins,
        winner: win ? { id: win.id, writing: !!win.token, botLine: win.bot ? (Math.random() * BOT_WIN_LINES) | 0 : -1, chr: win.chr } : null,
        twin: twin ? { id: twin.id, chr: twin.chr } : null,
        list: list.map((p, i) => ({ id: p.id, name: p.name, color: p.color, bot: !!p.bot, country: p.country || '', rank: i + 1, time: p.fin, fert: !!p.fert, chr: p.chr, s: Math.round(p.s) })) });
      // CPU もときどき一言
      this.botChats = list.filter(p => p.bot && Math.random() < .4).map(p => ({ id: p.id, at: now + 2500 + Math.random() * 18000, preset: p === win ? 'gg' : PRESETS[(Math.random() * PRESETS.length) | 0], sent: false }));
    }
  }

  return { CHR, MAX, L, S0, PRESETS, CERE_MS, DIFFS, REGIONS, GATE_S, CAPA_S, AMP_S, pickDiff, regionAt, LAUNCH_BURST, gridPos, clamp, lerp, sstep, rng, radiusAt, makeCourse, wbcAt, abAt, gateOpen, waveFront, counterFlow, trailAt, surgeAt, immuneTime, Room };
});
