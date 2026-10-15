// 3億分の1 — 3D クライアント
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const C = window.SeisiCore;
const { clamp, lerp, sstep, L } = C;
const $ = id => document.getElementById(id);
const IS_TOUCH = matchMedia('(pointer:coarse)').matches;

/* ================= 言語（日本語 / English） ================= */
// 保存された設定 → なければブラウザの言語（日本語以外は英語）
let LANG = (() => {
  try { const v = localStorage.getItem('seisi_lang'); if (v === 'ja' || v === 'en') return v; } catch (e) { }
  const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
  return /^ja\b/i.test(langs[0] || '') ? 'ja' : 'en';
})();
const ord = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const STR = {
  ja: {
    docTitle: '3億分の1', tag: '1 in 300M', h1: '3億分の1', lead: '一番乗りだけが、いのちになる。',
    namePh: 'なまえ（14文字まで）', online: '発射', offline: '練習', connecting: '接続中…', leave: 'タイトルにもどる',
    langBtn: '🌐 English', press: '圧力', stam: 'ブースト（スペース / 左クリック長押し）', mute: '音のON/OFF（M）',
    fail: 'サーバにつながりませんでした。「練習」で遊べます', lost: 'サーバとの接続が切れました',
    diff: ['ゆるふわコース', 'ふつうコース', '荒れ狂うコース', '地獄コース'],
    course: (n, st) => `コース：${n} ${st}`, joined: n => `${n} が参加！`, left: n => `${n} が退出`,
    place: n => `${n}位！`, time: t => `タイム ${t}`, reached: (n, p) => `${n} が卵子に到達！（${p}位）`,
    lobby: (on, h, c, s) => `${on ? 'オンライン' : '練習'}：${h}人 + CPU ${c}匹 ｜ 発射まで ${s}秒`,
    hint: t => t ? '左ドラッグで舵／BOOSTで加速' : 'マウスかWASDで舵／スペース・左クリックでブースト',
    launch: '発射！！', ring: '加速リング！', memBreak: '膜をぶち破った！', memStuck: '膜にひっかかった…ブーストで破れ！', wbc: '白血球に捕まった！', goal: 'ゴール！',
    anon: 'ななしの精子', rank: (r, n) => [r ? String(r) : '-', `/${n}位`],
    resWin: '🥚 受精成功！あなたが「いのち」に', resPlace: n => `${n}位でゴール`, resFail: 'たどり着けなかった…', resTitle: 'レース結果',
    remain: n => `あと${n}`, next: (c, s) => `${c} ｜ 次のレースまで ${s} 秒（このまま待つと自動で参加）`,
    regions: [['膣', '酸性の海 pH4 — 群れから離れるな'], ['子宮頸管', '粘液の迷宮 — くぼみに吸い込まれるな'], ['子宮', '免疫細胞の縄張り'], ['卵管口', '開閉するゲート — タイミングを狙え'], ['卵管峡部', '壁にくっつくな'], ['卵管膨大部', '卵子のにおいを追え']],
    shield: '群れの精液が酸を中和！', crypt: '頸管腺のくぼみに吸い込まれる！ブーストで脱出', ab: '抗精子抗体がくっついた！ブーストで振り払え', abOff: '抗体を振り払った！',
    mac: 'マクロファージに食べられかけた！', gate: '卵管口が閉じている！開く瞬間を狙え', stick: '卵管の壁にくっついた！真ん中を泳げ',
    capa: '受精能獲得！超活性化でブースト強化', wave: '子宮の蠕動波！光る輪に乗れ', surge: '⚠ 免疫総攻撃！白血球が活発化', trail: '卵子のにおいをキャッチ（化学走性）',
    flow: '線毛の逆流！壁ぎわは流れが弱い', acro: '先体反応！ブーストで透明帯を溶かせ', drill: '透明帯',
    cortical: n => `皮質反応 — ${n} が受精し、卵子が閉じた`, fertMe: '受精！ほかの精子はもう入れない',
    bind: '透明帯にくっついた！連打＆左右にくねって押し込め！', fuse: 'もう少し…卵細胞膜と融合！', fertilized: '受精！',
    blocked: '皮質反応ではじかれた…一番乗りじゃなかった', stBind: '結合', stAcro: '先体反応', stFuse: '融合',
    stages: [['受精卵', '受精直後 — 2つの核が出会う'], ['2細胞期', '約1日'], ['4細胞期', '約2日'], ['8細胞期', '約3日'], ['桑実胚', '約4日'], ['胚盤胞', '約5日 — 透明帯からふ化'], ['胎芽', '約5週 — 心臓が動きはじめる'], ['胎児', '約12週']],
    writing: 'メッセージを書いています…', noWinner: 'だれも受精できなかった…',
    botWin: ['フッ…遺伝子の勝利だ', 'CPUですが、生まれます', '計算どおりの受精です', '人間たちよ、また来世で', 'おぎゃあ（予定）'],
    presets: { congrats: '👏 おめでとう！', frustrated: '😭 くやしい！', again: '🔥 もう一回！', gg: '🤝 GG', cute: '🥚 かわいい' },
    chatPh: 'ひとこと（40文字まで）', sendChat: '送信', ready: '準備OK', readyWait: '準備OK！ほかの人を待っています',
    pickCourse: 'コースを選んでね', random: 'おまかせ',
    possessMe: n => `CPU「${n}」に憑依！レースの途中から参戦`, possessed: (a, n) => `${a} が「${n}」に憑依して乱入！`,
    specJoin: 'レースの途中でした。観戦して、次のレースから参加します', spec: n => `👀 観戦中：${n}`, specSub: '次のレースから参加します（◀ ▶ で見る精子を切り替え）', solo: '待たずにCPUと走る',
    fameBtn: '🏆 受精者たちの声', fameTitle: '🏆 受精者たちの声', fameEmpty: 'まだメッセージはありません。最初の1匹になろう！', close: '閉じる', loading: '読み込み中…',
    winAsk: '🥇 1位の特権！世界にメッセージを残そう', msgPh: 'ひとこと（80文字まで）', post: '残す', skip: 'スキップ', thanks: 'メッセージを残しました！', from: c => `${c} から投稿`, unknown: '不明',
  },
  en: {
    docTitle: '1 in 300M', tag: '3億分の1', h1: '1 in 300M', lead: 'Only the first one becomes a life.',
    namePh: 'Your name (max 14)', online: 'Launch', offline: 'Practice', connecting: 'Connecting…', leave: 'Back to title',
    langBtn: '🌐 日本語', press: 'PRESSURE', stam: 'Boost (Space / hold left click)', mute: 'Sound on/off (M)',
    fail: "Couldn't reach the server. You can still play \"Practice\".", lost: 'Disconnected from the server',
    diff: ['Comfy Course', 'Normal Course', 'Raging Course', 'Hell Course'],
    course: (n, st) => `Course: ${n} ${st}`, joined: n => `${n} joined!`, left: n => `${n} left`,
    place: n => `${ord(n)}!`, time: t => `Time ${t}`, reached: (n, p) => `${n} reached the egg! (${ord(p)})`,
    lobby: (on, h, c, s) => `${on ? 'Online' : 'Practice'}: ${h} player${h > 1 ? 's' : ''} + ${c} CPU ｜ Launch in ${s}s`,
    hint: t => t ? 'Drag on the left to steer / BOOST to speed up' : 'Steer with mouse or WASD / Space or left click to boost',
    launch: 'LAUNCH!!', ring: 'Speed ring!', memBreak: 'Smashed the membrane!', memStuck: 'Stuck in a membrane… boost through it!', wbc: 'Caught by a white blood cell!', goal: 'GOAL!',
    anon: 'Nameless Sperm', rank: (r, n) => [r ? ord(r) : '-', `/${n}`],
    resWin: '🥚 Fertilized! You became a life', resPlace: n => `Finished ${ord(n)}`, resFail: "Didn't make it…", resTitle: 'Results',
    remain: n => `${n} to go`, next: (c, s) => `${c} ｜ Next race in ${s}s (stay here to join automatically)`,
    regions: [['Vagina', 'the acid sea, pH 4 — stay with the swarm'], ['Cervix', 'the mucus maze — avoid the crypts'], ['Uterus', 'immune territory'], ['Utero-tubal junction', 'a gate that opens and shuts'], ['Isthmus', "don't touch the walls"], ['Ampulla', "follow the egg's scent"]],
    shield: "The swarm's semen neutralizes the acid!", crypt: 'Sucked into a cervical crypt! Boost to escape', ab: 'Antisperm antibody attached! Boost to shake it off', abOff: 'Shook off the antibodies!',
    mac: 'A macrophage almost ate you!', gate: 'The tubal gate is shut! Time your entry', stick: 'Stuck to the tube wall! Swim down the middle',
    capa: 'Capacitated! Hyperactivated boost unlocked', wave: 'Uterine contraction wave! Ride the glowing ring', surge: '⚠ Immune surge! White blood cells are frenzied', trail: "Caught the egg's scent (chemotaxis)",
    flow: 'Ciliary counter-current! Weaker near the walls', acro: 'Acrosome reaction! Boost to dissolve the zona', drill: 'ZONA',
    cortical: n => `Cortical reaction — ${n} fertilized the egg. It's sealed.`, fertMe: 'Fertilized! No other sperm can get in now',
    bind: 'Bound to the zona! Mash boost and wiggle left/right to push in!', fuse: 'Almost… fusing with the egg membrane!', fertilized: 'FERTILIZED!',
    blocked: "Bounced off by the cortical reaction… you weren't first", stBind: 'BIND', stAcro: 'ACROSOME', stFuse: 'FUSION',
    stages: [['Zygote', 'just fertilized — two nuclei meet'], ['2-cell stage', 'about day 1'], ['4-cell stage', 'about day 2'], ['8-cell stage', 'about day 3'], ['Morula', 'about day 4'], ['Blastocyst', 'about day 5 — hatching from the zona'], ['Embryo', 'about week 5 — the heart starts beating'], ['Fetus', 'about week 12']],
    writing: 'Writing a message…', noWinner: 'Nobody made it to fertilization…',
    botWin: ['Heh… victory of the genes.', "I'm a CPU, but I'm being born.", 'Fertilization, exactly as calculated.', 'See you in the next life, humans.', 'Waaah (scheduled).'],
    presets: { congrats: '👏 Congrats!', frustrated: '😭 So close!', again: '🔥 One more!', gg: '🤝 GG', cute: '🥚 So cute' },
    chatPh: 'Say something (max 40)', sendChat: 'Send', ready: 'Ready', readyWait: 'Ready! Waiting for others',
    pickCourse: 'Choose a course', random: 'Random',
    possessMe: n => `You possessed CPU "${n}"! Joining mid-race`, possessed: (a, n) => `${a} possessed "${n}" and jumped in!`,
    specJoin: 'A race is in progress. Watch it and join the next one!', spec: n => `👀 Watching: ${n}`, specSub: "You'll join the next race (◀ ▶ to switch view)", solo: "Don't wait — race CPUs now",
    fameBtn: "🏆 Winners", fameTitle: "🏆 Winners", fameEmpty: 'No messages yet. Be the first!', close: 'Close', loading: 'Loading…',
    winAsk: "🥇 Winner's privilege: leave a message for the world", msgPh: 'Your message (max 80)', post: 'Post', skip: 'Skip', thanks: 'Message posted!', from: c => `Posting from ${c}`, unknown: 'Unknown',
  },
};
const T = (k, ...a) => { const v = STR[LANG][k]; return typeof v === 'function' ? v(...a) : v; };
const BOT_EN = { 'ムキムキ太郎': 'Buff Taro', '鞭毛マスター': 'Flagella Master', 'およげたい焼き': 'Swimming Taiyaki', 'ミトコンド里子': 'Mito Chondria', 'ダッシュ丸': 'Dashmaru', 'エリート3号': 'Elite No.3', 'のんびり精': 'Lazy Swimmer', 'ジェット鞭毛': 'Jet Tail', 'スイマー佐藤': 'Swimmer Sato', 'ミスター卵': 'Mr. Egg', 'オタマ': 'Tadpole', 'ターボ精ちゃん': 'Turbo-chan', '一番乗り': 'First In Line', 'DNA運び屋': 'DNA Courier' };
// 名前なしの既定名は、見ている人の言語で表示する
const ANON_NAMES = ['ななしの精子', '名無しの精子', 'Nameless Sperm', 'Anonymous'];
const dname = p => ANON_NAMES.includes(p.name) ? T('anon') : p.bot && LANG === 'en' ? (BOT_EN[p.name] || p.name) : p.name;
const diffName = d => T('diff')[d.lv - 1];
function applyLang() {
  document.documentElement.lang = LANG;
  document.title = T('docTitle');
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = T(el.dataset.i18n);
  const ni = document.getElementById('name');
  ni.placeholder = T('namePh');
  if (!ni.value.trim() || ANON_NAMES.includes(ni.value.trim())) ni.value = T('anon');   // 既定名は言語に合わせて入れておく
  document.getElementById('mute').title = T('mute');
  for (const el of document.querySelectorAll('[data-i18n-ph]')) el.placeholder = T(el.dataset.i18nPh);
}
const LOW = IS_TOUCH;
const TAU = Math.PI * 2;

/* ================= renderer ================= */
const renderer = new THREE.WebGLRenderer({ antialias: !LOW, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1.25 : 1.75));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.prepend(renderer.domElement);

const FOG = new THREE.Color(0x24060c);
const scene = new THREE.Scene();
scene.background = FOG.clone();
scene.fog = new THREE.FogExp2(FOG, 0.0145);
const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.1, 800);
scene.add(camera);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.5, 0.5, 0.9);
composer.addPass(bloom);
composer.addPass(new OutputPass());
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});

scene.add(new THREE.HemisphereLight(0xff9aa6, 0x2a0610, 1.1));
const headLight = new THREE.PointLight(0xffe4d4, 260, 120, 2);
camera.add(headLight); headLight.position.set(0, 2.5, -13);
const fillLight = new THREE.PointLight(0xff5a6e, 300, 80, 2);
scene.add(fillLight);

const uTime = { value: 0 };
const uSqueeze = { value: 0 };   // 発射前の管の収縮

/* ================= procedural textures ================= */
function softTexture(size = 64) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const SOFT = softTexture();

function wallTextures() {
  const S = 512;
  const hash = (i, j, p) => { i = ((i % p) + p) % p; j = ((j % p) + p) % p; let n = Math.imul(i, 374761393) + Math.imul(j, 668265263); n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const vn = (x, y, p) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi, p), b = hash(xi + 1, yi, p), c = hash(xi, yi + 1, p), d = hash(xi + 1, yi + 1, p); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  const hgt = new Float32Array(S * S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const fx = x / S, fy = y / S; let f = 0, amp = .5, rid = 0;
    for (let o = 0; o < 5; o++) { const p = 6 << o; f += vn(fx * p, fy * p, p) * amp; amp *= .5; }
    for (let o = 0; o < 3; o++) { const p = 10 << o; rid += (1 - Math.abs(vn(fx * p, fy * p, p) * 2 - 1)) * (.5 / (o + 1)); }
    hgt[y * S + x] = f * .65 + rid * .45;
  }
  // 血管
  const vc = document.createElement('canvas'); vc.width = vc.height = S; const vg = vc.getContext('2d');
  vg.strokeStyle = '#fff'; vg.lineCap = 'round';
  const walk = (x, y, a, w, n) => {
    for (let i = 0; i < n; i++) {
      const nx = x + Math.cos(a) * 7, ny = y + Math.sin(a) * 7;
      vg.lineWidth = w;
      for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { vg.beginPath(); vg.moveTo(x + ox, y + oy); vg.lineTo(nx + ox, ny + oy); vg.stroke(); }
      x = nx; y = ny; a += (Math.random() - .5) * .7; w = Math.max(.6, w * .985);
      if (Math.random() < .05 && w > 1.4 && n - i > 8) walk(x, y, a + (Math.random() < .5 ? .9 : -.9), w * .6, (n - i) * .6 | 0);
    }
  };
  for (let k = 0; k < 16; k++) walk(Math.random() * S, Math.random() * S, Math.random() * TAU, 2 + Math.random() * 2.5, 50 + Math.random() * 40);
  const bc = document.createElement('canvas'); bc.width = bc.height = S; const bg = bc.getContext('2d');
  bg.filter = 'blur(1.2px)'; bg.drawImage(vc, 0, 0);
  const vein = bg.getImageData(0, 0, S, S).data;
  const col = new Uint8ClampedArray(S * S * 4), nor = new Uint8ClampedArray(S * S * 4), H = new Float32Array(S * S);
  for (let i = 0; i < S * S; i++) H[i] = hgt[i] + vein[i * 4 + 3] / 255 * .35;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = y * S + x, h = hgt[i], vm = vein[i * 4 + 3] / 255;
    let r = lerp(150, 225, h), g = lerp(36, 98, h), b = lerp(56, 112, h);
    r = lerp(r, 92, vm * .75); g = lerp(g, 10, vm * .75); b = lerp(b, 42, vm * .75);
    col[i * 4] = r; col[i * 4 + 1] = g; col[i * 4 + 2] = b; col[i * 4 + 3] = 255;
    const dx = H[y * S + ((x + 1) % S)] - H[y * S + ((x - 1 + S) % S)], dy = H[((y + 1) % S) * S + x] - H[((y - 1 + S) % S) * S + x];
    let nx = -dx * 6, ny = -dy * 6, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    nor[i * 4] = (nx * .5 + .5) * 255; nor[i * 4 + 1] = (ny * .5 + .5) * 255; nor[i * 4 + 2] = (nz * .5 + .5) * 255; nor[i * 4 + 3] = 255;
  }
  const mk = (data, srgb) => { const t = new THREE.DataTexture(data, S, S, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t; };
  return { map: mk(col, true), normal: mk(nor, false) };
}
const WALL_TEX = wallTextures();

/* ================= sperm model ================= */
const HEAD_GEO = new THREE.SphereGeometry(1, 28, 18);
const MID_GEO = new THREE.CylinderGeometry(.13, .2, .9, 10, 1).rotateX(Math.PI / 2).translate(0, 0, -.55);
const TAIL_GEO = new THREE.CylinderGeometry(.018, .085, 8, 6, 90, true).rotateX(-Math.PI / 2).translate(0, 0, -4.9);
function tailShader(mat, perInstance) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uTime;
    sh.uniforms.uPhase = mat.userData.uPhase || { value: 0 };
    sh.uniforms.uAmp = mat.userData.uAmp || { value: .55 };
    sh.uniforms.uFreq = mat.userData.uFreq || { value: 14 };
    sh.vertexShader = 'uniform float uTime,uPhase,uAmp,uFreq;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float zz = -position.z - .9;
      float kk = clamp(zz / 8., 0., 1.);
      float ph = uPhase${perInstance ? ' + float(gl_InstanceID) * 2.17' : ''};
      float ww = zz * 1.1 - uTime * uFreq + ph;
      transformed.x += sin(ww) * uAmp * (.12 + kk);
      transformed.y += cos(ww) * uAmp * .3 * kk;`);
  };
  mat.customProgramCacheKey = () => 'tail' + (perInstance ? 'I' : '');
  return mat;
}
function makeSperm(color, isMe) {
  const g = new THREE.Group();
  const tint = new THREE.Color(color);
  const headMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(1, .97, .97).lerp(tint, .3), roughness: .18, metalness: 0, clearcoat: 1, clearcoatRoughness: .15,
    transparent: true, opacity: .94, emissive: tint.clone().multiplyScalar(isMe ? .16 : .1), sheen: .6, sheenColor: tint
  });
  const capMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .1, clearcoat: 1, transparent: true, opacity: .45, emissive: 0x332228 });
  const head = new THREE.Mesh(HEAD_GEO, headMat); head.scale.set(.58, .36, .9);
  const cap = new THREE.Mesh(HEAD_GEO, capMat); cap.scale.set(.6, .38, .62); cap.position.z = .38;
  const nuc = new THREE.Mesh(HEAD_GEO, new THREE.MeshStandardMaterial({ color: tint.clone().lerp(new THREE.Color(0x553040), .5), roughness: .6, transparent: true, opacity: .55 }));
  nuc.scale.set(.36, .2, .55); nuc.position.z = -.1;
  const mid = new THREE.Mesh(MID_GEO, new THREE.MeshStandardMaterial({ color: 0xf6e6ea, roughness: .35, emissive: tint.clone().multiplyScalar(.15) }));
  const tailMat = tailShader(new THREE.MeshStandardMaterial({ color: new THREE.Color(1, .95, .96).lerp(tint, .25), roughness: .35, transparent: true, opacity: .9, emissive: tint.clone().multiplyScalar(isMe ? .18 : .1) }), false);
  tailMat.userData.uPhase = { value: Math.random() * 6 };
  tailMat.userData.uAmp = { value: .55 };
  tailMat.userData.uFreq = { value: 14 };
  const tail = new THREE.Mesh(TAIL_GEO, tailMat); tail.frustumCulled = false;
  const body = new THREE.Group(); body.add(head, cap, nuc, mid, tail);
  g.add(body);
  g.userData = { body, tailU: tailMat.userData, phase: tailMat.userData.uPhase.value };
  return g;
}
function nameSprite(text, color) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d'); g.font = '900 30px "M PLUS Rounded 1c",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.65)'; g.strokeText(text, 128, 32); g.fillStyle = color; g.fillText(text, 128, 32);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
  s.scale.set(3.6, .9, 1); return s;
}

/* ================= world (course) ================= */
let W = null;
const F = { c: new THREE.Vector3(), t: new THREE.Vector3(), n: new THREE.Vector3(), b: new THREE.Vector3() };
function frameAt(s, out = F) {
  const k0 = (s + C.S0) / W.step, f = clamp(k0, 0, W.M - 1.0001), i = Math.floor(f), k = f - i, a = i * 3, b = a + 3, A = W.arr;
  out.c.set(lerp(A.c[a], A.c[b], k), lerp(A.c[a + 1], A.c[b + 1], k), lerp(A.c[a + 2], A.c[b + 2], k));
  out.t.set(lerp(A.t[a], A.t[b], k), lerp(A.t[a + 1], A.t[b + 1], k), lerp(A.t[a + 2], A.t[b + 2], k)).normalize();
  out.n.set(lerp(A.n[a], A.n[b], k), lerp(A.n[a + 1], A.n[b + 1], k), lerp(A.n[a + 2], A.n[b + 2], k)).normalize();
  out.b.set(lerp(A.b[a], A.b[b], k), lerp(A.b[a + 1], A.b[b + 1], k), lerp(A.b[a + 2], A.b[b + 2], k)).normalize();
  return out;
}
const F2 = { c: new THREE.Vector3(), t: new THREE.Vector3(), n: new THREE.Vector3(), b: new THREE.Vector3() };
function posAt(s, u, v, target) { frameAt(s, F2); return target.copy(F2.c).addScaledVector(F2.n, u).addScaledVector(F2.b, v); }
const visR = s => C.radiusAt(W.course, s) + 2.4;

function buildWorld(seed) {
  if (W) { scene.remove(W.group); W.group.traverse(o => { if (o.geometry && ![HEAD_GEO, MID_GEO, TAIL_GEO].includes(o.geometry)) o.geometry.dispose(); }); }
  const course = C.makeCourse(seed);
  const curve = new THREE.CatmullRomCurve3(course.pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
  const len = curve.getLength(), step = 1, total = C.S0 + L + 90, M = Math.ceil(total / step) + 1;
  const arr = { c: new Float32Array(M * 3), t: new Float32Array(M * 3), n: new Float32Array(M * 3), b: new Float32Array(M * 3) };
  const p = new THREE.Vector3(), t = new THREE.Vector3(), n = new THREE.Vector3(0, 1, 0), b = new THREE.Vector3();
  for (let i = 0; i < M; i++) {
    const u = Math.min(1, i * step / len);
    curve.getPointAt(u, p); curve.getTangentAt(u, t).normalize();
    if (i === 0) { n.set(0, 1, 0).addScaledVector(t, -t.y).normalize(); }
    else { n.addScaledVector(t, -n.dot(t)).normalize(); }
    b.crossVectors(t, n).normalize();
    p.toArray(arr.c, i * 3); t.toArray(arr.t, i * 3); n.toArray(arr.n, i * 3); b.toArray(arr.b, i * 3);
  }
  W = { seed, course, arr, M, step, group: new THREE.Group(), rings: [], mem: [], wbc: [], acid: [], sugarGot: new Set() };
  // 難しいコースほど暗く重い空気に
  const fogCol = [0x2c0a12, 0x24060c, 0x1d030b, 0x15020e][course.diff.lv - 1];
  scene.background.setHex(fogCol); scene.fog.color.setHex(fogCol);
  scene.add(W.group);
  W.abUsed = new Set(); W.macs = course.mac.map(m => ({ ...m, cool: 0 }));
  buildTube(); buildRings(); buildAcid(); buildWbc(); buildMembranes(); buildSugar(); buildEgg(); buildStartGate(); buildCrowd(); buildDust(); buildBio();
}

// 区間ごとの重み（境目はなめらかに混ぜる）
function regionW(s) {
  const w = [1, 0, 0, 0, 0, 0];
  for (let k = 1; k < C.REGIONS.length; k++) { const b = C.REGIONS[k].s0, t = sstep(b - 35, b + 35, s); for (let i = 0; i < k; i++) w[i] *= 1 - t; w[k] += t; }
  return w;
}
// 膣=ピンク、頸管=白っぽい粘膜、子宮=深い赤、卵管口=紫がかった赤、峡部=淡い、膨大部=オレンジがかった赤
const TINT = [[1.08, .84, .9], [1.05, .97, 1], [.92, .66, .7], [.95, .72, .9], [1.06, .9, .86], [1.1, .82, .74]];
function buildTube() {
  const seg = LOW ? 40 : 60, step = LOW ? 1.6 : 1.2, s0 = -C.S0 + 1, s1 = L + 86;
  const rings = Math.ceil((s1 - s0) / step) + 1, cols = seg + 1;
  const pos = new Float32Array(rings * cols * 3), uv = new Float32Array(rings * cols * 2), col = new Float32Array(rings * cols * 3), idx = new Uint32Array((rings - 1) * seg * 6);
  const v = new THREE.Vector3(), ph = W.course.p[2];
  for (let i = 0; i < rings; i++) {
    const s = s0 + i * step; frameAt(s);
    let R = visR(s);
    const rw = regionW(Math.max(0, s));
    const tint = [0, 1, 2].map(k => rw.reduce((acc, w, j) => acc + w * TINT[j][k], 0));
    if (s < -40) R *= sstep(s0, -40, s) * .9 + .1;
    if (s > L + 62) R *= 1 - sstep(L + 62, s1, s) * .97;
    for (let j = 0; j < cols; j++) {
      const a = j / seg * TAU;
      const fold = Math.pow(Math.abs(Math.sin(s * .24 + .4 * Math.sin(a * 2 + s * .05))), 14);
      let bump = (.55 * Math.sin(a * 5 + s * .11 + ph) + .35 * Math.sin(a * 11 - s * .23) + .45 * Math.sin(s * .07 + a * 2)) * (1 - rw[2] * .45) - 1.5 * fold * (1 - rw[5]);
      bump -= rw[0] * 1.3 * Math.pow(Math.abs(Math.sin(s * .45 + Math.sin(a * 3) * .4)), 6);             // 膣のひだ（横向き）
      bump -= rw[1] * .9 * Math.pow(Math.abs(Math.sin(a * 6 + s * .3)), 3);                                // 頸管の斜めのひだ
      bump -= rw[5] * 2.2 * Math.pow(Math.abs(Math.sin(a * 7 + Math.sin(s * .05) * .6)), 2.5);            // 膨大部の縦ひだ
      bump -= (rw[3] + rw[4]) * .5 * Math.pow(Math.abs(Math.sin(a * 5 + s * .08)), 4);
      const r = Math.max(.2, R + bump * Math.min(1, R / 10));
      v.copy(F.c).addScaledVector(F.n, Math.cos(a) * r).addScaledVector(F.b, Math.sin(a) * r);
      const k = (i * cols + j);
      pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = v.z;
      uv[k * 2] = j / seg * 3; uv[k * 2 + 1] = s / 16;
      col[k * 3] = tint[0]; col[k * 3 + 1] = tint[1]; col[k * 3 + 2] = tint[2];
    }
  }
  let q = 0;
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < seg; j++) {
    const a = i * cols + j, b = a + cols;
    idx[q++] = a; idx[q++] = a + 1; idx[q++] = b; idx[q++] = b; idx[q++] = a + 1; idx[q++] = b + 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ map: WALL_TEX.map, normalMap: WALL_TEX.normal, normalScale: new THREE.Vector2(1.4, 1.4), roughness: .32, metalness: 0, side: THREE.DoubleSide, emissive: 0x3a0610, emissiveIntensity: 1, vertexColors: true });
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = uTime; sh.uniforms.uSqueeze = uSqueeze;
    sh.vertexShader = 'uniform float uTime,uSqueeze;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      transformed += objectNormal * sin(uTime * 1.5 - uv.y * 2.2 + position.x * .05) * .28;
      float sv = uv.y * 16.;
      float duct = 1. - smoothstep(8., 40., sv);
      transformed += objectNormal * duct * uSqueeze * (.55 + .45 * sin(uTime * 9. - sv * .6));`);
  };
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false;
  W.group.add(mesh); W.tube = mesh;
}

const _o = new THREE.Object3D(), _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _m = new THREE.Matrix4();
function orientAt(obj, s, u, v) {
  posAt(s, u, v, obj.position); frameAt(s);
  _v.copy(obj.position).add(F.t); obj.up.copy(F.n); obj.lookAt(_v);
}

function buildRings() {
  const geo = new THREE.TorusGeometry(3, .14, 10, 56);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(.5, 2.4, 2.6), toneMapped: false });
  const discMat = new THREE.MeshBasicMaterial({ map: SOFT, color: new THREE.Color(.25, .9, 1), transparent: true, opacity: .25, blending: THREE.AdditiveBlending, depthWrite: false });
  const discGeo = new THREE.CircleGeometry(3, 40);
  for (const r of W.course.rings) {
    const g = new THREE.Group(); orientAt(g, r.s, r.u, r.v);
    const t = new THREE.Mesh(geo, mat), d = new THREE.Mesh(discGeo, discMat);
    const t2 = new THREE.Mesh(geo, mat); t2.scale.setScalar(.7);
    g.add(t, d, t2); W.group.add(g); W.rings.push({ ...r, g, t2, hit: false });
  }
}
function buildAcid() {
  for (const a of W.course.acid) {
    const g = new THREE.Group(); orientAt(g, a.s, a.u, a.v);
    const sprites = [];
    for (let k = 0; k < 9; k++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: new THREE.Color(.55, 1.6, .25), transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false }));
      const d = a.r * .55;
      sp.position.set((Math.random() - .5) * d * 2, (Math.random() - .5) * d * 2, (Math.random() - .5) * d * 2);
      sp.scale.setScalar(a.r * (1 + Math.random() * .8)); sp.userData.ph = Math.random() * 6; sprites.push(sp); g.add(sp);
    }
    const bub = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(Array.from({ length: 90 }, () => (Math.random() - .5) * a.r * 1.6), 3)),
      new THREE.PointsMaterial({ map: SOFT, size: .35, color: 0xc8ff9a, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false }));
    g.add(bub);
    W.group.add(g); W.acid.push({ ...a, g, sprites, bub });
  }
}
const WBC_GEO = new THREE.IcosahedronGeometry(1, LOW ? 3 : 5);
const WBC_MAT = new THREE.MeshPhysicalMaterial({ color: 0xf3efff, roughness: .38, transparent: true, opacity: .8, sheen: 1, sheenColor: 0xaab4ff, emissive: 0x1d1830, clearcoat: .5 });
WBC_MAT.onBeforeCompile = sh => {
  sh.uniforms.uTime = uTime;
  sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
    float nn = sin(position.x*3.1+uTime*1.3)*sin(position.y*2.7+uTime*1.1)*sin(position.z*3.3+uTime*.9)
             + .5*sin(position.x*6.3-uTime*2.)*sin(position.z*5.7+uTime*1.7);
    transformed += normal * nn * .16;`);
};
const NUC_MAT = new THREE.MeshStandardMaterial({ color: 0x6b2f8e, roughness: .5, emissive: 0x1a0626 });
function buildWbc() {
  for (const w of W.course.wbc) {
    const g = new THREE.Group();
    const m = new THREE.Mesh(WBC_GEO, WBC_MAT); m.scale.setScalar(w.r);
    for (let k = 0; k < 3; k++) { const n = new THREE.Mesh(HEAD_GEO, NUC_MAT); n.scale.setScalar(w.r * .32); n.position.set(Math.cos(k * 2.1) * w.r * .3, Math.sin(k * 2.1) * w.r * .3, (k - 1) * w.r * .2); g.add(n); }
    g.add(m); W.group.add(g); W.wbc.push({ ...w, g, cur: { s: 0, u: 0, v: 0 } });
  }
}
function buildMembranes() {
  for (const m of W.course.mem) {
    const R = visR(m.s) + 1.5;
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uTime, uHit: { value: 0 }, uTorn: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: `varying vec2 vUv; uniform float uTime,uHit,uTorn;
        void main(){ vec2 p=vUv*2.-1.; float d=length(p); if(d>1.) discard;
          float rim=smoothstep(.55,1.,d); float wave=sin(d*34.-uTime*2.5-uHit*25.)*.5+.5;
          vec3 c=mix(vec3(1.,.72,.88),vec3(.72,.86,1.),.5+.5*sin(d*10.+uTime*.7+p.x*3.));
          float hole=uTorn*smoothstep(.75,.2,d);
          float a=(.10+.30*rim+.07*wave+uHit*.25)*(1.-hole);
          gl_FragColor=vec4(c*(.8+.5*wave),a); }`
    });
    const mesh = new THREE.Mesh(new THREE.CircleGeometry(R, 64), mat); orientAt(mesh, m.s, 0, 0);
    W.group.add(mesh); W.mem.push({ ...m, mesh, mat, passed: false });
  }
}
function buildSugar() {
  const geo = new THREE.OctahedronGeometry(.42);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.6, .4), toneMapped: false });
  const im = new THREE.InstancedMesh(geo, mat, W.course.sugar.length);
  W.course.sugar.forEach((s, i) => { posAt(s.s, s.u, s.v, _o.position); _o.rotation.set(i, i * 2, 0); _o.scale.setScalar(1); _o.updateMatrix(); im.setMatrixAt(i, _o.matrix); });
  W.group.add(im); W.sugarMesh = im;
}
const EGG_R = 30, ZONA_R = 32.3;
const DENT = { dir: { value: new THREE.Vector3(0, 0, 1) }, amt: { value: 0 } };
function buildEgg() {
  frameAt(L + 31);
  const c = F.c.clone(), t = F.t.clone();
  const g = new THREE.Group(); g.position.copy(c); W.group.add(g);
  const eggMat = new THREE.MeshPhysicalMaterial({ color: 0xffd9c6, roughness: .55, sheen: 1, sheenRoughness: .5, sheenColor: 0xfff0f0, emissive: 0x6a2818, emissiveIntensity: 1, clearcoat: .3 });
  // 押し込まれたところがへこむ
  eggMat.onBeforeCompile = sh => {
    sh.uniforms.uDentDir = DENT.dir; sh.uniforms.uDent = DENT.amt;
    sh.vertexShader = 'uniform vec3 uDentDir; uniform float uDent;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float da = dot(normalize(position), uDentDir);
      transformed -= normal * uDent * .6 * smoothstep(.975, 1., da);`);
  };
  const egg = new THREE.Mesh(new THREE.SphereGeometry(EGG_R, 128, 96), eggMat);
  g.add(egg);
  const zona = new THREE.Mesh(new THREE.SphereGeometry(ZONA_R, 128, 96), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime, uFlash: { value: 0 }, uDentDir: DENT.dir, uDent: DENT.amt },
    vertexShader: 'uniform vec3 uDentDir; uniform float uDent; varying vec3 vN,vV; void main(){ vec3 p=position; float da=dot(normalize(position),uDentDir); float k=smoothstep(.97,1.,da); p-=normal*uDent*k; vec4 mv=modelViewMatrix*vec4(p,1.); vN=normalize(normalMatrix*normalize(normal+(normal-uDentDir)*k*uDent*.6)); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'varying vec3 vN,vV; uniform float uTime,uFlash; void main(){ float f=pow(1.-abs(dot(vN,vV)),2.2); gl_FragColor=vec4(mix(vec3(1.,.82,.88),vec3(.7,.9,1.),uFlash)*f*(1.4+.2*sin(uTime*2.)+uFlash*3.),f*.85+uFlash*.2); }'
  }));
  g.add(zona);
  const n = LOW ? 350 : 700;
  const cor = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xe8956a, roughness: .6, emissive: 0x1c0804 }), n);
  const corPos = [];
  for (let i = 0; i < n; i++) {
    _v.set(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize();
    _o.position.copy(_v).multiplyScalar(33.5 + Math.random() * 7); _o.scale.setScalar(.55 + Math.random() * .8); _o.rotation.set(0, 0, 0); _o.updateMatrix(); cor.setMatrixAt(i, _o.matrix);
    corPos.push(_o.position.clone().add(c));
  }
  g.add(cor);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: 0xff8f70, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  glow.scale.setScalar(150); glow.position.copy(t).multiplyScalar(20); g.add(glow); g.userData.glow = glow;
  const light = new THREE.PointLight(0xffc29a, 1300, 220, 2); light.position.copy(t).multiplyScalar(-60); g.add(light);
  W.egg = { g, egg, c, t, zona, flash: 0 };
  W.clutter = [{ mesh: cor, pos: corPos }];
  // 先体反応の酵素（ドリル中に噴き出す粒）
  const en = 160, epos = new Float32Array(en * 3);
  const ep = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(epos, 3)), new THREE.PointsMaterial({ map: SOFT, size: .45, color: new THREE.Color(1.4, 1.6, .6), transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false }));
  ep.frustumCulled = false; W.group.add(ep);
  W.enz = { pts: ep, pos: epos, vel: new Float32Array(en * 3), life: new Float32Array(en), n: en, next: 0 };
}
/* ---- 生物学的なトラップの見た目 ---- */
const Y_GEO = (() => { const g = new THREE.CylinderGeometry(.09, .09, 1, 6); return g; })();
const AB_MAT = new THREE.MeshStandardMaterial({ color: 0xc89cff, emissive: 0x5a2a99, emissiveIntensity: .8, roughness: .4 });
function makeAntibody() {
  const g = new THREE.Group();
  const stem = new THREE.Mesh(Y_GEO, AB_MAT); stem.position.y = -.45; g.add(stem);
  for (const sgn of [-1, 1]) { const arm = new THREE.Mesh(Y_GEO, AB_MAT); arm.scale.y = .9; arm.rotation.z = sgn * .7; arm.position.set(sgn * .3, .35, 0); g.add(arm); }
  return g;
}
const MAC_MAT = new THREE.MeshPhysicalMaterial({ color: 0xfffaf0, roughness: .4, transparent: true, opacity: .72, sheen: 1, sheenColor: 0xffe7a8, emissive: 0x4a3c22, clearcoat: .5 });
MAC_MAT.onBeforeCompile = WBC_MAT.onBeforeCompile;
function buildBio() {
  const c = W.course;
  // 粘液：もやもやの塊＋糸（頸管粘液のミセル）
  const mMat = new THREE.SpriteMaterial({ map: SOFT, color: 0xf6f0ff, transparent: true, opacity: .3, depthWrite: false });
  for (const m of c.mucus) {
    const g = new THREE.Group(); orientAt(g, m.s, m.u, m.v);
    for (let k = 0; k < 6; k++) { const sp = new THREE.Sprite(mMat); sp.position.set((Math.random() - .5) * m.r, (Math.random() - .5) * m.r, (Math.random() - .5) * m.r); sp.scale.setScalar(m.r * (1.2 + Math.random())); g.add(sp); }
    W.group.add(g);
  }
  const lp = [];
  for (let k = 0; k < (LOW ? 220 : 420); k++) {
    const s0 = 395 + Math.random() * 440, R = C.radiusAt(c, s0) - .5, a = Math.random() * TAU, d = Math.sqrt(Math.random()) * R;
    const u = Math.cos(a) * d, v = Math.sin(a) * d, len = 3 + Math.random() * 8;
    posAt(s0, u, v, _v); lp.push(_v.x, _v.y, _v.z); posAt(s0 + len, u + (Math.random() - .5) * 2, v + (Math.random() - .5) * 2, _v); lp.push(_v.x, _v.y, _v.z);
  }
  const strands = new THREE.LineSegments(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)), new THREE.LineBasicMaterial({ color: 0xfff6ff, transparent: true, opacity: .22, depthWrite: false }));
  W.group.add(strands);
  // 頸管腺のくぼみ：壁にあいた暗い穴
  const cMat = new THREE.SpriteMaterial({ map: SOFT, color: 0x120004, transparent: true, opacity: .9, depthWrite: false });
  for (const k of c.crypt) {
    const R = visR(k.s) - 1.2, sp = new THREE.Sprite(cMat); posAt(k.s, Math.cos(k.a) * R, Math.sin(k.a) * R, sp.position); sp.scale.setScalar(7); W.group.add(sp);
  }
  // 抗精子抗体（Y字）
  W.abs = c.ab.map(() => { const m = makeAntibody(); W.group.add(m); return m; });
  // マクロファージ
  W.macMeshes = c.mac.map(() => {
    const g = new THREE.Group(); const m = new THREE.Mesh(WBC_GEO, MAC_MAT); m.scale.setScalar(4.3); g.add(m);
    for (let k = 0; k < 5; k++) { const n = new THREE.Mesh(HEAD_GEO, new THREE.MeshStandardMaterial({ color: 0xc89a5a, roughness: .6, transparent: true, opacity: .6, emissive: 0x2a1a08 })); n.scale.setScalar(.5 + Math.random() * .6); n.position.set((Math.random() - .5) * 4, (Math.random() - .5) * 4, (Math.random() - .5) * 4); g.add(n); }
    W.group.add(g); return g;
  });
  // 卵管口のゲート（括約筋の花びらが開閉）
  const gate = new THREE.Group(); orientAt(gate, c.gate.s, 0, 0);
  const petalMat = new THREE.MeshStandardMaterial({ map: WALL_TEX.map, normalMap: WALL_TEX.normal, color: 0xd88aa6, roughness: .35, emissive: 0x30060f });
  W.petals = [];
  for (let k = 0; k < 9; k++) { const p = new THREE.Mesh(HEAD_GEO, petalMat); p.scale.set(1.6, .9, 1.4); p.userData.a = k / 9 * TAU; gate.add(p); W.petals.push(p); }
  W.group.add(gate); W.gateR = visR(c.gate.s);
  // 受精能獲得ゾーン（きらめく帯）
  const capR = visR(c.capa.s) - .6;
  const capMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uTime },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: 'varying vec2 vUv; uniform float uTime; void main(){ float b=sin(vUv.x*60.+uTime*3.)*.5+.5; float e=smoothstep(0.,.3,vUv.y)*smoothstep(1.,.7,vUv.y); vec3 c=mix(vec3(.3,1.,.9),vec3(.7,.5,1.),b); gl_FragColor=vec4(c*e*(.5+.5*b),.6*e); }'
  });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(capR, capR, 8, 64, 1, true).rotateX(Math.PI / 2), capMat); orientAt(cap, c.capa.s, 0, 0); W.group.add(cap);
  // 化学走性の道（卵子のにおい）
  const tn = LOW ? 260 : 520; W.trail = { n: tn, pos: new Float32Array(tn * 3), off: Array.from({ length: tn }, () => Math.random()), jit: Array.from({ length: tn }, () => [(Math.random() - .5) * 1.6, (Math.random() - .5) * 1.6]) };
  W.trail.pts = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(W.trail.pos, 3)), new THREE.PointsMaterial({ map: SOFT, size: .55, color: 0xffe08a, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false }));
  W.trail.pts.frustumCulled = false; W.group.add(W.trail.pts);
  // 卵丘細胞
  const cum = new THREE.InstancedMesh(HEAD_GEO, new THREE.MeshStandardMaterial({ color: 0xf2a679, roughness: .6, transparent: true, opacity: .7, emissive: 0x2a0e04 }), c.cumulus.length);
  const cumPos = [];
  c.cumulus.forEach((k, i) => { posAt(k.s, k.u, k.v, _o.position); _o.scale.setScalar(k.r); _o.rotation.set(0, 0, 0); _o.updateMatrix(); cum.setMatrixAt(i, _o.matrix); cumPos.push(_o.position.clone()); });
  W.group.add(cum); W.clutter.push({ mesh: cum, pos: cumPos });
  // 蠕動波（光る輪が子宮を進む）
  W.waveMesh = new THREE.Mesh(new THREE.TorusGeometry(1, .08, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, .5, .9), transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
  W.waveMesh.visible = false; W.group.add(W.waveMesh);
}
function buildStartGate() {
  // 発射口：管の出口に光るリング＋向こう側の光
  const s = 16, R = visR(s);
  const m = new THREE.Mesh(new THREE.TorusGeometry(R - .2, .22, 8, 80), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, .7, 1.3), toneMapped: false }));
  orientAt(m, s, 0, 0); W.group.add(m);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT, color: 0xffd0dc, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false }));
  posAt(s + 30, 0, 0, glow.position); glow.material.opacity = .22; glow.scale.setScalar(26); W.group.add(glow);
}
function buildCrowd() {
  const n = LOW ? 120 : 260;
  const headGeo = HEAD_GEO.clone().scale(.58, .36, .9);
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshPhysicalMaterial({ color: 0xf2e8ea, roughness: .25, clearcoat: 1, transparent: true, opacity: .85, emissive: 0x2a1418 }), n);
  const tailMat = tailShader(new THREE.MeshStandardMaterial({ color: 0xeee2e6, roughness: .4, transparent: true, opacity: .7 }), true);
  const tails = new THREE.InstancedMesh(TAIL_GEO, tailMat, n);
  heads.frustumCulled = tails.frustumCulled = false;
  const list = [];
  for (let i = 0; i < n; i++) list.push(spawnCrowd({}, Math.random() * 200 - 30));
  W.group.add(heads, tails); W.crowd = { heads, tails, list };
}
function spawnCrowd(c, s) {
  const R = Math.max(1, C.radiusAt(W.course, Math.max(0, s)) - 1.5), a = Math.random() * TAU, d = Math.sqrt(Math.random()) * R;
  c.s = s; c.u = Math.cos(a) * d; c.v = Math.sin(a) * d; c.cruise = 8 + Math.random() * 15; c.spd = c.cruise; c.du = (Math.random() - .5) * 2; c.dv = (Math.random() - .5) * 2;
  return c;
}
// 発射前：管の中にぎゅうぎゅう詰め
function packCrowd() {
  for (const c of W.crowd.list) {
    const s = Math.random() < .35 ? -48 + Math.random() * 38 : -3 + Math.random() * 16, R = 5.2, a = Math.random() * TAU, d = Math.sqrt(Math.random()) * R;
    Object.assign(c, { s, u: Math.cos(a) * d, v: Math.sin(a) * d, spd: 0, du: 0, dv: 0, packed: true });
  }
}
function launchCrowd() {
  for (const c of W.crowd.list) if (c.packed) { c.packed = false; c.spd = 45 + Math.random() * 40; c.du = (Math.random() - .5) * 6; c.dv = (Math.random() - .5) * 6; }
}
function buildDust() {
  const n = LOW ? 900 : 2000, pos = new Float32Array(n * 3);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: SOFT, size: .16, color: 0xffc6cf, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false }));
  pts.frustumCulled = false; W.group.add(pts);
  const n2 = 160, pos2 = new Float32Array(n2 * 3);
  const geo2 = new THREE.BufferGeometry(); geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
  const blobs = new THREE.Points(geo2, new THREE.PointsMaterial({ map: SOFT, size: .9, color: 0xff9db0, transparent: true, opacity: .18, blending: THREE.AdditiveBlending, depthWrite: false }));
  blobs.frustumCulled = false; W.group.add(blobs);
  W.dust = [{ pts, pos, n, init: false, r: 32 }, { pts: blobs, pos: pos2, n: n2, init: false, r: 40 }];
}
function updateDust(dt) {
  const cp = camera.position;
  for (const d of W.dust) {
    const p = d.pos;
    for (let i = 0; i < d.n; i++) {
      const k = i * 3;
      const dx = p[k] - cp.x, dy = p[k + 1] - cp.y, dz = p[k + 2] - cp.z;
      if (!d.init || dx * dx + dy * dy + dz * dz > d.r * d.r) {
        p[k] = cp.x + (Math.random() - .5) * d.r * 2; p[k + 1] = cp.y + (Math.random() - .5) * d.r * 2; p[k + 2] = cp.z + (Math.random() - .5) * d.r * 2;
      } else { p[k] += Math.sin(uTime.value + i) * dt * .2; p[k + 1] += Math.cos(uTime.value * .7 + i) * dt * .2; }
    }
    d.init = true; d.pts.geometry.attributes.position.needsUpdate = true;
  }
}

/* ================= 受精後の発生（セレモニーで見せる） ================= */
// 受精卵 → 2細胞 → 4細胞 → 8細胞 → 桑実胚 → 胚盤胞（ふ化）→ 胎芽 → 胎児
const DEV_T = [0, 3.2, 6.2, 9, 11.8, 15, 20, 24.5];
const CELL_MAT = new THREE.MeshPhysicalMaterial({ color: 0xffd9cb, roughness: .32, transparent: true, opacity: .88, sheen: 1, sheenColor: 0xfff2ee, emissive: 0x5a2016, emissiveIntensity: .55, clearcoat: .5 });
const SKIN_MAT = new THREE.MeshPhysicalMaterial({ color: 0xf4b5a4, roughness: .45, transparent: true, opacity: .93, sheen: 1, sheenColor: 0xffe0d8, emissive: 0x4a1410, emissiveIntensity: .45, clearcoat: .3 });
const DARK_MAT = new THREE.MeshStandardMaterial({ color: 0x2a0a10, roughness: .4 });
function fib(n, R) { const out = []; for (let i = 0; i < n; i++) { const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996; out.push(new THREE.Vector3(Math.cos(a) * r * R, y * R, Math.sin(a) * r * R)); } return out; }
function devLayout(k) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  if (k === 0) return [{ p: V(0, 0, 0), r: 29.5 }];
  if (k === 1) return [{ p: V(-10.5, 0, 0), r: 19 }, { p: V(10.5, 0, 0), r: 19 }];
  if (k === 2) return [V(1, 1, 1), V(-1, -1, 1), V(-1, 1, -1), V(1, -1, -1)].map(v => ({ p: v.multiplyScalar(7.6), r: 15.5 }));
  if (k === 3) { const o = []; for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) o.push({ p: V(x, y, z).multiplyScalar(8.4), r: 12 }); return o; }
  if (k === 4) return fib(26, 18.5).map(p => ({ p, r: 8.3 })).concat(fib(6, 6.5).map(p => ({ p, r: 7.5 })));
  // 胚盤胞：外側の栄養外胚葉＋内部細胞塊（片側の塊）
  return fib(76, 27).map(p => ({ p, r: 5.2, flat: true })).concat(fib(12, 5).map(p => ({ p: p.add(V(15, 0, 0)), r: 5.4 })));
}
let DEV = null;
function startDev() {
  endDev();
  const e = W.egg, g = new THREE.Group(); g.position.copy(e.c); W.group.add(g);
  const cells = [];
  for (let i = 0; i < 90; i++) { const m = new THREE.Mesh(HEAD_GEO, CELL_MAT); m.visible = false; g.add(m); cells.push({ m, from: new THREE.Vector3(), to: new THREE.Vector3(), fr: 0, tr: 0, flat: false }); }
  // 前核（精子と卵子の核が近づいて合体）
  const pn = [0, 1].map(i => { const m = new THREE.Mesh(HEAD_GEO, new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.1, .7), toneMapped: false, transparent: true, opacity: .9 })); m.scale.setScalar(3.2); g.add(m); return m; });
  DEV = { g, cells, pn, t: 0, k: -1, anim: 1, embryo: buildEmbryo(), fetus: buildFetus() };
  g.add(DEV.embryo, DEV.fetus);
  e.egg.visible = false; e.g.userData.glow.visible = false;
}
function endDev() {
  if (!DEV) return;
  W.group.remove(DEV.g); DEV = null;
  if (W && W.egg) { W.egg.egg.visible = true; W.egg.g.userData.glow.visible = true; W.egg.zona.visible = true; W.egg.zona.scale.setScalar(1); for (const c of W.clutter) c.mesh.visible = true; }
}
function buildEmbryo() {
  // C字に丸まった胎芽：頭が大きく、体節のふくらみ、心臓のふくらみ、肢芽、眼
  const g = new THREE.Group(); g.visible = false;
  for (let i = 0; i < 34; i++) {
    const a = -.35 * Math.PI + i / 33 * 1.55 * Math.PI, r = lerp(9.5, 2.2, Math.pow(i / 33, .8)) * (1 + .08 * Math.sin(i * 1.9));
    const m = new THREE.Mesh(HEAD_GEO, SKIN_MAT); m.position.set(Math.cos(a) * 13, Math.sin(a) * 13, 0); m.scale.setScalar(r); g.add(m);
  }
  const heart = new THREE.Mesh(HEAD_GEO, new THREE.MeshPhysicalMaterial({ color: 0xc23a48, roughness: .4, emissive: 0x5a0a14, transparent: true, opacity: .9 }));
  heart.position.set(-2, 3, 3); heart.scale.setScalar(4.6); g.add(heart); g.userData.heart = heart;
  const eye = new THREE.Mesh(HEAD_GEO, DARK_MAT); eye.position.set(10, -6, 7); eye.scale.setScalar(1.6); g.add(eye);
  for (const [x, y] of [[-6, 9], [3, 11], [-9, -2], [-4, -8]]) { const b = new THREE.Mesh(HEAD_GEO, SKIN_MAT); b.position.set(x, y, 5); b.scale.set(2.6, 2.6, 3.4); g.add(b); }
  return g;
}
function buildFetus() {
  const g = new THREE.Group(); g.visible = false;
  const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 6, 12);
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.scale.set(sx, sy, sz); g.add(m); return m; };
  add(HEAD_GEO, SKIN_MAT, 0, 11, 2, 0, 0, 0, 12, 12.5, 11.5);                 // 頭
  add(HEAD_GEO, SKIN_MAT, 0, -5, -1, .5, 0, 0, 9, 12, 8.5);                  // 胴（丸まっている）
  add(HEAD_GEO, DARK_MAT, 5.5, 13, 10.6, 0, 0, -.2, 2, .7, .6);              // 閉じた目
  add(HEAD_GEO, SKIN_MAT, 0, 8.5, 12.6, 0, 0, 0, 1.6, 1.4, 1.4);            // 鼻
  add(HEAD_GEO, SKIN_MAT, 11.2, 11, 0, 0, 0, 0, 1.4, 2.6, 2);               // 耳
  add(cap(1.8, 7), SKIN_MAT, 7, 1, 6, 1.1, 0, .5);                           // 腕（胸の前でたたむ）
  add(cap(1.8, 7), SKIN_MAT, -7, 1, 6, 1.1, 0, -.5);
  add(HEAD_GEO, SKIN_MAT, 3, 4, 10.5, 0, 0, 0, 2, 2, 2);                     // 手（顔の前）
  add(HEAD_GEO, SKIN_MAT, -2.5, 3.5, 10.5, 0, 0, 0, 2, 2, 2);
  add(cap(2.4, 11), SKIN_MAT, 6, -14, 5, 1.3, 0, -.3);                       // 脚（たたんでいる）
  add(cap(2.4, 11), SKIN_MAT, -6, -14, 5, 1.3, 0, .3);
  add(HEAD_GEO, SKIN_MAT, 5, -9, 13, 0, 0, 0, 2.4, 1.8, 3.4);                // 足
  add(HEAD_GEO, SKIN_MAT, -5, -9, 13, 0, 0, 0, 2.4, 1.8, 3.4);
  // へその緒と胎盤
  const cord = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -8, 7), new THREE.Vector3(-8, -18, 14), new THREE.Vector3(-20, -14, 8), new THREE.Vector3(-26, -2, -6), new THREE.Vector3(-30, 6, -16)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(cord, 60, 1.3, 8), new THREE.MeshPhysicalMaterial({ color: 0xd8c0c8, roughness: .3, transparent: true, opacity: .9, emissive: 0x2a1018 })));
  add(HEAD_GEO, new THREE.MeshStandardMaterial({ color: 0x8a1c2c, roughness: .5, emissive: 0x2a040a }), -32, 8, -20, 0, .6, 0, 16, 16, 4);
  // 羊膜
  const sac = new THREE.Mesh(new THREE.SphereGeometry(40, 48, 32), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: 'varying vec3 vN,vV; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'varying vec3 vN,vV; void main(){ float f=pow(1.-abs(dot(vN,vV)),2.5); gl_FragColor=vec4(vec3(1.,.8,.85)*f*1.2,f*.6); }'
  }));
  g.add(sac);
  return g;
}
function updateDev(dt) {
  if (!DEV) return;
  const D = DEV, e = W.egg; D.t += dt;
  let k = 0; while (k + 1 < DEV_T.length && D.t >= DEV_T[k + 1]) k++;
  if (k !== D.k) {
    // 新しい段階：細胞は「親」の位置から分かれて移動する
    const prev = D.k >= 0 && D.k <= 5 ? devLayout(D.k) : null, next = k <= 5 ? devLayout(k) : [];
    D.cells.forEach((c, i) => {
      const n = next[i];
      if (!n) { c.m.visible = false; return; }
      const par = prev ? prev[Math.floor(i * prev.length / next.length)] : n;
      c.from.copy(par.p); c.fr = par.r; c.to.copy(n.p); c.tr = n.r; c.flat = !!n.flat; c.m.visible = true;
    });
    D.k = k; D.anim = 0;
    $('stage').innerHTML = `<b>${T('stages')[k][0]}</b><span>${T('stages')[k][1]}</span>`;
    for (const c of W.clutter) c.mesh.visible = k < 5;
    if (k >= 1) sfx.push(true);
  }
  D.anim = Math.min(1, D.anim + dt / 1.3);
  const ea = D.anim * D.anim * (3 - 2 * D.anim), beat = 1 + .025 * Math.max(0, Math.sin(D.t * 7));
  D.cells.forEach(c => {
    if (!c.m.visible) return;
    c.m.position.lerpVectors(c.from, c.to, ea);
    const r = lerp(c.fr, c.tr, ea) * beat;
    if (c.flat) { c.m.scale.set(r, r, r * .55); c.m.lookAt(D.g.localToWorld(_v.copy(c.m.position).multiplyScalar(2))); } else c.m.scale.setScalar(r);
  });
  // 前核が近づいて合体（受精卵の間だけ）
  const pk = clamp(D.t / 2.6, 0, 1);
  D.pn.forEach((m, i) => { m.visible = k === 0; m.position.set((i ? 1 : -1) * lerp(9, 1.2, pk), 0, 0); });
  // 胚盤胞の終わりに透明帯から「ふ化」
  const hatch = clamp((D.t - 17.5) / 2.2, 0, 1);
  e.zona.scale.setScalar(1 + hatch * .25); e.zona.visible = hatch < 1;
  // 胎芽・胎児はふわっと現れる
  const showE = k === 6, showF = k === 7;
  for (const c of D.cells) if (k >= 6) c.m.visible = false;
  D.embryo.visible = showE; D.fetus.visible = showF;
  const grow = clamp((D.t - DEV_T[k]) / 1.6, 0, 1), gs = .3 + .7 * grow * grow * (3 - 2 * grow);
  if (showE) { D.embryo.scale.setScalar(gs * 1.15); D.embryo.userData.heart.scale.setScalar(4.6 * (1 + .18 * Math.max(0, Math.sin(D.t * 9)))); }
  if (showF) D.fetus.scale.setScalar(gs * (1 + .012 * Math.sin(D.t * 2)));
  if (k >= 6) { D.g.lookAt(camera.position); D.g.rotateZ(Math.sin(D.t * .5) * .12); }   // 胎芽・胎児はこちらを向く
  else { D.g.rotation.set(Math.sin(D.t * .2) * .15, D.t * .18, 0); }
  // ほかの精子は消す（少し見せてから）
  if (D.t > 2.5) for (const r of G.racers.values()) r.model.visible = false;
}

/* ================= game state ================= */
const G = {
  mode: 'title', // title | wait | race | result
  net: null, you: 0, startAt: 0, offset: 0, offsetInit: false,
  racers: new Map(), order: [], fin: false, lastSend: 0, finished: [], nextAt: 0,
};
const P = { s: 0, u: 0, v: 0, vu: 0, vv: 0, spd: 0, stam: 100, boost: false, burst: 0, stun: 0, fin: false, draft: 0, inAcid: false, wiggle: 0 };
const serverNow = () => Date.now() + G.offset;
const raceT = () => (serverNow() - G.startAt) / 1000;

function syncClock(now) {
  if (!now) return;
  const s = now - Date.now();
  if (!G.offsetInit) { G.offset = s; G.offsetInit = true; } else G.offset = G.offset * .9 + s * .1;
}

function setRoster(players) {
  for (const r of G.racers.values()) { W && W.group.remove(r.model); }
  G.racers.clear();
  for (const p of players) addRacer(p);
  regrid();
}
function addRacer(p) {
  if (G.racers.has(p.id)) return;
  const me = p.id === G.you;
  const model = makeSperm(p.color, me);
  const r = { ...p, me, model, s: 0, u: 0, v: 0, ts: 0, tu: 0, tv: 0, spd: 0, b: 0, place: 0, time: null, label: null };
  if (!me) { r.label = nameSprite(dname(p), p.color); model.add(r.label); r.label.position.set(0, 1.7, 0); }
  W.group.add(model);
  G.racers.set(p.id, r);
}
function delRacer(id) { const r = G.racers.get(id); if (!r) return; W.group.remove(r.model); G.racers.delete(id); }
function regrid() {
  let i = 0;
  for (const r of G.racers.values()) {
    const { u, v } = C.gridPos(i);
    r.s = r.ts = 0; r.u = r.tu = u; r.v = r.tv = v;
    if (r.me && G.mode !== 'race') { P.s = 0; P.u = u; P.v = v; }
    i++;
  }
}

/* ================= networking ================= */
function handle(m) {
  if (m.now) syncClock(m.now);
  switch (m.t) {
    case 'room': {
      G.you = m.you; G.startAt = m.startAt; camInit = false; G.spec = false; document.body.classList.remove('spec');
      if (!W || W.seed !== m.seed) buildWorld(m.seed);
      resetPlayer();
      setRoster(m.players);
      G.mode = m.state === 'race' ? 'race' : 'wait';
      if (G.mode === 'wait') packCrowd();
      else {
        // 途中参戦：走っていた CPU の位置から
        for (const p of m.players) Object.assign(G.racers.get(p.id), { s: p.s, ts: p.s, u: p.u, tu: p.u, v: p.v, tv: p.v, spd: p.spd, b: p.b, place: p.place, time: p.time });
        const me = m.players.find(p => p.id === G.you);
        if (me) Object.assign(P, { s: me.s, u: me.u, v: me.v, spd: me.spd || 20, launched: true });
        launchCrowd(); uSqueeze.value = 0;
        const f = $('flash'); f.style.transition = 'none'; f.style.opacity = .7; requestAnimationFrame(() => { f.style.transition = 'opacity 1.2s ease-out'; f.style.opacity = 0; });
        kick(1.2);
      }
      { const d = W.course.diff; toast(T('course', diffName(d), stars(d.lv)), DIFF_COL[d.lv - 1]); }
      if (m.from) toast(T('possessMe', dname({ name: m.from, bot: true })), '#c9a6ff');
      endDev(); document.body.classList.remove('cere'); $('chatList').innerHTML = ''; G.ready = false;
      hideOverlays(); $('hud').classList.add('on');
      if (G.winToken) $('result').classList.add('on');   // メッセージを書いている途中なら結果画面は残す
      if (IS_TOUCH) $('boostBtn').style.display = 'block';
      break;
    }
    case 'spec': {
      // レース中に来たので観戦（次のレースから参加）
      G.spec = true; G.you = 0; specLabel = ''; G.startAt = m.startAt; G.nextAt = m.nextAt; G.watch = 0; G.autoWatch = 0; camInit = false;
      if (!W || W.seed !== m.seed) buildWorld(m.seed);
      resetPlayer(); P.launched = true;
      setRoster(m.players);
      for (const p of m.players) Object.assign(G.racers.get(p.id), { s: p.s, ts: p.s, u: p.u, tu: p.u, v: p.v, tv: p.v, spd: p.spd, b: p.b, place: p.place, time: p.time });
      G.mode = m.state === 'result' ? 'result' : 'race';
      launchCrowd(); uSqueeze.value = 0;
      endDev(); document.body.classList.remove('cere'); document.body.classList.add('spec'); $('chatList').innerHTML = ''; G.ready = false;
      hideOverlays(); $('hud').classList.add('on'); $('boostBtn').style.display = 'none';
      toast(T('specJoin'), '#9fe7ff');
      break;
    }
    case 'add': {
      addRacer(m.p);
      if (G.mode === 'wait') regrid();
      else if (m.p.s != null) Object.assign(G.racers.get(m.p.id), { s: m.p.s, ts: m.p.s, u: m.p.u, tu: m.p.u, v: m.p.v, tv: m.p.v, spd: m.p.spd });
      toast(m.from ? T('possessed', dname(m.p), dname({ name: m.from, bot: true })) : T('joined', dname(m.p)), m.p.color);
      break;
    }
    case 'del': { const r = G.racers.get(m.id); if (r && !r.bot && G.mode !== 'result') toast(T('left', dname(r)), '#ccc'); delRacer(m.id); if (G.mode === 'wait') regrid(); break; }
    case 'wait': G.startAt = m.startAt; G.lobbyInfo = m; break;
    case 'go': G.startAt = m.startAt; G.mode = 'race'; break;
    case 'snap':
      for (const [id, s, u, v, spd, b] of m.p) {
        const r = G.racers.get(id); if (!r || r.me) continue;
        r.ts = s; r.tu = u; r.tv = v; r.spd = spd; r.b = b;
      }
      break;
    case 'fin': {
      const r = G.racers.get(m.id); if (!r) break;
      r.place = m.place; r.time = m.time;
      if (r.me && m.place > 1) { P.blocked = true; toast(T('blocked'), '#ffb3c7'); }
      if (m.place === 1) { W.egg.flash = 1; if (r.me) toast(T('fertMe'), '#fff0a0'); else if (!P.fin) { $('sub').textContent = T('cortical', dname(r)); setTimeout(() => { if (!P.fin) $('sub').textContent = ''; }, 4000); } }
      if (r.me) { $('center').textContent = m.place === 1 ? T('fertilized') : T('place', m.place); $('sub').textContent = T('time', fmtTime(m.time)); sfx.fanfare(m.place); }
      else toast(T('reached', dname(r), m.place), r.color);
      break;
    }
    case 'res': G.mode = 'result'; G.nextAt = m.nextAt; G.winner = m.winner; G.resList = m.list; startCeremony(); showResult(m.list); break;
    case 'winMsg': showWinMsg(m); break;
    case 'chat': addChat(m); break;
    case 'win': G.winToken = m.token; break;
    case 'msgOk': G.winToken = null; $('winForm').style.display = 'none'; if (m.posted) toast(T('thanks'), '#ffe08a'); if (G.mode !== 'result') $('result').classList.remove('on'); break;
  }
}

function connectOnline() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const url = `${proto}//${location.host}${location.pathname.replace(/[^/]*$/, '')}ws`;
  let opened = false;
  let ws;
  try { ws = new WebSocket(url); } catch (e) { onFail(); return; }
  const timer = setTimeout(() => { if (!opened) { try { ws.close(); } catch (e) { } onFail(); } }, 5000);
  ws.onopen = () => { opened = true; clearTimeout(timer); ws.send(JSON.stringify({ t: 'join', name: myName(), color: myColor })); };
  ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (er) { return; } handle(m); };
  ws.onclose = () => { clearTimeout(timer); if (!opened) onFail(); else if (G.net && G.net.ws === ws) { G.net = null; backToTitle(T('lost')); } };
  G.net = { ws, send: m => { if (ws.readyState === 1) ws.send(JSON.stringify(m)); }, close: () => { G.net = null; ws.close(); } };
  function onFail() { if (G.net && G.net.ws === ws) G.net = null; $('msg').textContent = T('fail'); setBusy(false); }
}
function startOffline(lv) {
  const room = new C.Room('local', Date.now(), { wait: 4500, cere: 26000, diffLv: lv || 0 });
  let id = 0;
  const iv = setInterval(() => room.tick(Date.now()), 50);
  G.net = { send: m => room.onMsg(id, m, Date.now()), close: () => { clearInterval(iv); room.removeHuman(id, Date.now()); G.net = null; } };
  id = room.addHuman(myName(), myColor, m => handle(m), Date.now());
}

/* ================= input ================= */
const keys = {};
const mouse = { x: innerWidth / 2, y: innerHeight / 2, active: false, down: false };
const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
let boostTouch = false;
// 卵子に押し込むときの連打・くねりは「押した回数」で数える（フレームの間の速い連打も取りこぼさない）
let tapQ = 0, wigQ = 0, lastWigKey = 0;
const wiggleTo = d => { if (d !== lastWigKey) { wigQ++; lastWigKey = d; } };
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') { if (e.code === 'Enter') { if (e.target.id === 'chatIn') sendChat(); else (e.target.id === 'winMsg' ? $('bPost') : $('bOnline')).click(); } return; }
  keys[e.code] = true; mouse.active = false;
  if (!e.repeat) {
    if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') tapQ++;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') wiggleTo(-1);
    if (e.code === 'KeyD' || e.code === 'ArrowRight') wiggleTo(1);
  }
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
});
addEventListener('keyup', e => { keys[e.code] = false; });
addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; if (Math.abs(e.movementX) + Math.abs(e.movementY) > 2) mouse.active = true; });
renderer.domElement.addEventListener('mousedown', e => { if (e.button === 0) { mouse.down = true; tapQ++; } });
addEventListener('mouseup', () => { mouse.down = false; });
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
renderer.domElement.addEventListener('touchstart', e => {
  for (const t of e.changedTouches) if (joy.id === null) { joy.id = t.identifier; joy.ox = joy.x = t.clientX; joy.oy = joy.y = t.clientY; const j = $('joy'); j.style.display = 'block'; j.style.left = joy.ox + 'px'; j.style.top = joy.oy + 'px'; }
  e.preventDefault();
}, { passive: false });
renderer.domElement.addEventListener('touchmove', e => {
  for (const t of e.changedTouches) if (t.identifier === joy.id) {
    joy.x = t.clientX; joy.y = t.clientY;
    const dx = clamp(joy.x - joy.ox, -50, 50), dy = clamp(joy.y - joy.oy, -50, 50);
    $('joy').firstElementChild.style.transform = `translate(${dx}px,${dy}px)`;
  }
  e.preventDefault();
}, { passive: false });
const endTouch = e => { for (const t of e.changedTouches) if (t.identifier === joy.id) { joy.id = null; $('joy').style.display = 'none'; $('joy').firstElementChild.style.transform = ''; } };
renderer.domElement.addEventListener('touchend', endTouch); renderer.domElement.addEventListener('touchcancel', endTouch);
const bb = $('boostBtn');
bb.addEventListener('touchstart', e => { boostTouch = true; tapQ++; bb.classList.add('on'); e.preventDefault(); }, { passive: false });
bb.addEventListener('touchend', e => { boostTouch = false; bb.classList.remove('on'); e.preventDefault(); });
bb.addEventListener('touchcancel', () => { boostTouch = false; bb.classList.remove('on'); });

function readInput() {
  let ix = 0, iy = 0;
  if (keys.KeyA || keys.ArrowLeft) ix -= 1; if (keys.KeyD || keys.ArrowRight) ix += 1;
  if (keys.KeyW || keys.ArrowUp) iy += 1; if (keys.KeyS || keys.ArrowDown) iy -= 1;
  if (joy.id !== null) { ix += clamp((joy.x - joy.ox) / 50, -1, 1); iy -= clamp((joy.y - joy.oy) / 50, -1, 1); }
  else if (mouse.active && !IS_TOUCH) {
    const mx = (mouse.x - innerWidth / 2) / (innerWidth * .3), my = -(mouse.y - innerHeight * .5) / (innerHeight * .3);
    const d = Math.hypot(mx, my);
    if (d > .08) { const k = Math.min(1, (d - .08) / .92) / d; ix += mx * k; iy += my * k; }
  }
  const l = Math.hypot(ix, iy); if (l > 1) { ix /= l; iy /= l; }
  const boost = !!(keys.Space || keys.ShiftLeft || keys.ShiftRight || mouse.down || boostTouch);
  return { ix, iy, boost };
}

/* ================= audio（BGM＝心臓の鼓動＋体内っぽいシンセ） ================= */
// 発射の「イヤ～ン」（ギャグ漫画風の声をフォルマント合成で作る）
// i → ya → a～（音程がうねる）→ n。ctx は AudioContext / OfflineAudioContext どちらでも可
function makeIyan(ctx, dest, t0, vol = 1) {
  const dur = 1.1;
  // 声帯の音：倍音たっぷりの波形
  const N = 48, re = new Float32Array(N), im = new Float32Array(N);
  for (let n = 1; n < N; n++) im[n] = 1 / Math.pow(n, 1.05);
  const o = ctx.createOscillator(); o.setPeriodicWave(ctx.createPeriodicWave(re, im));
  const f = o.frequency;
  f.setValueAtTime(540, t0); f.linearRampToValueAtTime(590, t0 + .1);                   // い
  f.linearRampToValueAtTime(700, t0 + .22);                                                // や（上がる）
  f.linearRampToValueAtTime(800, t0 + .36); f.linearRampToValueAtTime(610, t0 + .54);    // ～（うねる）
  f.linearRampToValueAtTime(720, t0 + .7);
  f.linearRampToValueAtTime(500, t0 + 1);                                                  // ん（下がる）
  const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 6.5; lfoG.gain.value = 14;
  lfo.connect(lfoG).connect(f);
  // 口の形（フォルマント）：い[350,2800,3400] → あ[950,1450,2900] → ん[260,1900,2700]
  const FI = [350, 2800, 3400], FA = [950, 1450, 2900], FN = [260, 1900, 2700], Q = [5, 9, 11], GN = [1, .6, .35];
  const mix = ctx.createGain(); mix.gain.value = 0;
  const nasal = ctx.createBiquadFilter(); nasal.type = 'lowpass'; nasal.Q.value = .7;
  nasal.frequency.setValueAtTime(9000, t0); nasal.frequency.setValueAtTime(9000, t0 + .74); nasal.frequency.linearRampToValueAtTime(900, t0 + .84);
  for (let k = 0; k < 3; k++) {
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = Q[k];
    bp.frequency.setValueAtTime(FI[k], t0); bp.frequency.setValueAtTime(FI[k], t0 + .09);
    bp.frequency.linearRampToValueAtTime(FA[k], t0 + .22); bp.frequency.setValueAtTime(FA[k], t0 + .74);
    bp.frequency.linearRampToValueAtTime(FN[k], t0 + .84);
    const g = ctx.createGain(); g.gain.value = GN[k] * 7;
    o.connect(bp).connect(g).connect(mix);
  }
  // 息の音（出だし）
  const nb = ctx.createBuffer(1, ctx.sampleRate * .25, ctx.sampleRate), nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
  const ns = ctx.createBufferSource(); ns.buffer = nb; const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 3200; nf.Q.value = 1.2;
  const ng = ctx.createGain(); ng.gain.value = .25; ns.connect(nf).connect(ng).connect(mix);
  const env = mix.gain;
  env.setValueAtTime(0, t0); env.linearRampToValueAtTime(.95 * vol, t0 + .04); env.setValueAtTime(.95 * vol, t0 + .74);
  env.linearRampToValueAtTime(.55 * vol, t0 + .84); env.linearRampToValueAtTime(0, t0 + dur);
  mix.connect(nasal).connect(dest);
  o.start(t0); lfo.start(t0); ns.start(t0); o.stop(t0 + dur + .05); lfo.stop(t0 + dur + .05);
}
const sfx = (() => {
  let AC = null, master, music, arpBus, fluid, fluidF, muted = false;
  const iyanBufs = [];
  let mode = 'title', bpm = 72, nextBeat = 0, beat = 0, pr = 0, prog = 0;
  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  try { muted = localStorage.getItem('seisi_mute') === '1'; } catch (e) { }
  function init() {
    if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = AC.createGain(); master.gain.value = muted ? 0 : .8; master.connect(AC.destination);
    // 音楽は少しこもらせて「体の中で聞こえる」感じに
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = .5;
    music = AC.createGain(); music.gain.value = .55; music.connect(lp).connect(master);
    arpBus = AC.createGain(); arpBus.gain.value = 1;
    const dl = AC.createDelay(1), fb = AC.createGain(); dl.delayTime.value = .33; fb.gain.value = .35;
    arpBus.connect(music); arpBus.connect(dl); dl.connect(fb).connect(dl); dl.connect(music);
    // 体液の流れる音
    const len = AC.sampleRate * 3, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { last = (last + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
    const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
    fluidF = AC.createBiquadFilter(); fluidF.type = 'lowpass'; fluidF.frequency.value = 300;
    fluid = AC.createGain(); fluid.gain.value = .2;
    src.connect(fluidF).connect(fluid).connect(master); src.start();
    nextBeat = AC.currentTime + .1;
    setInterval(schedule, 40);
    // 発射の「イヤ～ン」効果音（OtoLogic / CC BY 4.0）
    for (const f of ['se/iyan1.mp3', 'se/iyan2.mp3'])
      fetch(f).then(r => r.arrayBuffer()).then(a => AC.decodeAudioData(a)).then(b => iyanBufs.push(b)).catch(() => { });
  }
  function schedule() {
    if (!AC) return;
    while (nextBeat < AC.currentTime + .2) { playBeat(nextBeat, beat++); nextBeat += 60 / bpm; }
  }
  // 心音：ドクン（lub）＋ドッ（dub）
  function heart(t, v, dub) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.frequency.setValueAtTime(dub ? 82 : 64, t); o.frequency.exponentialRampToValueAtTime(dub ? 44 : 34, t + .16);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .012); g.gain.exponentialRampToValueAtTime(.001, t + (dub ? .18 : .28));
    o.connect(g).connect(master); o.start(t); o.stop(t + .32);
    const n = AC.createBufferSource(), nb = AC.createBuffer(1, AC.sampleRate * .08, AC.sampleRate), x = nb.getChannelData(0);
    for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * (1 - i / x.length);
    n.buffer = nb; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160;
    const ng = AC.createGain(); ng.gain.value = v * .9; n.connect(f).connect(ng).connect(master); n.start(t);
  }
  function bass(t, m, d, v = .16) {
    const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain();
    o.type = 'sawtooth'; o.frequency.value = mf(m); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(160, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(f).connect(g).connect(music); o.start(t); o.stop(t + d + .05);
  }
  function pad(t, notes, d, v = .035) {
    for (const m of notes) for (const det of [-6, 6]) {
      const o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.value = mf(m); o.detune.value = det;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + d * .3); g.gain.linearRampToValueAtTime(0, t + d);
      o.connect(g).connect(music); o.start(t); o.stop(t + d + .05);
    }
  }
  function pluck(t, m, v = .05) {
    const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = mf(m);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + .22); o.connect(g).connect(arpBus); o.start(t); o.stop(t + .25);
  }
  const PROG = [[45, [0, 3, 7]], [41, [0, 4, 7]], [48, [0, 4, 7]], [43, [0, 4, 7]]];  // Am F C G
  function playBeat(t, n) {
    const spb = 60 / bpm;
    // 心臓はどのシーンでも鳴り続ける
    const hv = mode === 'race' ? .75 : mode === 'wait' ? .8 + pr * .4 : .7;
    heart(t, hv, false); heart(t + Math.min(.3, spb * .34), hv * .6, true);
    const [root, ch] = PROG[Math.floor(n / 4) % 4];
    if (mode === 'title' || mode === 'calm') {
      if (n % 8 === 0) pad(t, ch.map(c => root + 12 + c), spb * 8, .03);
    } else if (mode === 'wait') {
      if (n % 2 === 0) bass(t, 45, spb * 1.6, .06 + pr * .1);
      if (pr > .5) pluck(t + spb / 2, 69 + (n % 3) * 3, .02 + pr * .03);
    } else if (mode === 'race') {
      bass(t, root, spb * .9);
      bass(t + spb / 2, root + 12, spb * .4, .09);
      if (n % 4 === 0) pad(t, ch.map(c => root + 24 + c), spb * 4);
      const arp = ch.concat([12]);
      for (let k = 0; k < 2; k++) pluck(t + k * spb / 2, root + 24 + arp[(n * 2 + k) % arp.length] + (prog > .8 ? 12 : 0), .04);
    }
  }
  function tone(f, d, type = 'sine', v = .15, slide = 0, delay = 0) {
    if (!AC) return; const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(f * slide, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0008, t + d); o.connect(g).connect(master); o.start(t); o.stop(t + d + .03);
  }
  function noise(d, f0, f1, v = .3, q = 1.5) {
    if (!AC) return; const t = AC.currentTime, len = AC.sampleRate * d, buf = AC.createBuffer(1, len, AC.sampleRate), x = buf.getChannelData(0);
    for (let i = 0; i < len; i++) x[i] = Math.random() * 2 - 1;
    const s = AC.createBufferSource(); s.buffer = buf; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + d);
    const g = AC.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
    s.connect(f).connect(g).connect(master); s.start(t);
  }
  return {
    init,
    // BGM の状態：title / wait（発射待ち、pr=圧力 0..1）/ race（prog=進み具合）/ calm（ゴール後）
    state(m, p, pg) {
      mode = m; pr = p; prog = pg;
      bpm = m === 'wait' ? 72 + p * 88 : m === 'race' ? 124 + (pg > .8 ? 16 : 0) : m === 'calm' ? 84 : 66;
    },
    toggleMute() { muted = !muted; try { localStorage.setItem('seisi_mute', muted ? '1' : '0'); } catch (e) { } if (master) master.gain.setTargetAtTime(muted ? 0 : .8, AC.currentTime, .05); return muted; },
    speed(k) { if (!AC) return; fluidF.frequency.setTargetAtTime(180 + k * 900, AC.currentTime, .1); fluid.gain.setTargetAtTime(.12 + k * .3, AC.currentTime, .1); },
    launch() {
      if (!AC) return;
      if (iyanBufs.length) { const src = AC.createBufferSource(), g = AC.createGain(); src.buffer = iyanBufs[(Math.random() * iyanBufs.length) | 0]; g.gain.value = 2; src.connect(g).connect(master); src.start(AC.currentTime + .02); }
      else makeIyan(AC, master, AC.currentTime + .02);   // 読み込めなかったときは合成ボイス
      noise(1.8, 150, 4000, .12, .8);
    },
    iyanCount: () => iyanBufs.length,
    ring() { tone(880, .35, 'sine', .14); tone(1320, .45, 'sine', .1, 0, .06); noise(.5, 600, 3000, .12); },
    boost() { noise(.4, 300, 1800, .18, 2); },
    sugar() { tone(1400, .12, 'triangle', .08, 1.4); },
    hit() { tone(110, .4, 'sawtooth', .18, .4); noise(.25, 400, 120, .3); },
    mem(br) { noise(.3, br ? 1200 : 300, br ? 300 : 120, .3, 3); },
    push(soft) { tone(soft ? 150 : 120, .18, 'sine', soft ? .12 : .22, .55); noise(.12, soft ? 500 : 300, 120, soft ? .08 : .16, 2); },
    fuse() { tone(392, 1.2, 'sine', .12); tone(494, 1.2, 'sine', .1, 0, .08); tone(587, 1.4, 'sine', .1, 0, .16); noise(1.2, 200, 2500, .15, .7); },
    beep(go) { tone(go ? 988 : 660, go ? .6 : .2, 'square', .09); },
    fanfare(place) { const n = place === 1 ? [523, 659, 784, 1047] : [523, 622, 784]; n.forEach((f, i) => tone(f, .5, 'triangle', .12, 0, i * .14)); },
  };
})();

/* ================= HUD ================= */
const toasts = [];
function toast(t, col = '#fff') {
  const el = document.createElement('div'); el.textContent = t; el.style.color = col;
  $('toasts').appendChild(el); setTimeout(() => el.remove(), 2200);
  while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
}
const fmtTime = ms => { if (ms == null) return '--'; const s = ms / 1000; return `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`; };
function standings() {
  return [...G.racers.values()].sort((a, b) => {
    const pa = a.place || 99, pb = b.place || 99; if (pa !== pb) return pa - pb;
    return (b.me ? P.s : b.s) - (a.me ? P.s : a.s);
  });
}
let hudTick = 0;
function updateHud(dt) {
  hudTick += dt;
  const st = standings(), myRank = st.findIndex(r => r.me) + 1;
  { const [a, b] = T('rank', myRank, st.length); $('rk').textContent = a; $('rkN').textContent = b; }
  const t = G.mode === 'race' ? Math.max(0, raceT()) : 0;
  const me = G.racers.get(G.you);
  $('clock').textContent = me && me.time != null ? fmtTime(me.time) : fmtTime(t * 1000);
  $('spd').innerHTML = `${Math.round(P.spd * 2)} <small>μm/s</small>`;
  $('stamI').style.width = P.stam + '%';
  $('stamI').style.background = P.boost ? 'linear-gradient(90deg,#fff,#7ff)' : '';
  $('tint').style.opacity = P.inAcid && !P.shield ? 1 : 0;
  $('tint2').style.opacity = P.inMucus ? 1 : 0;
  $('drill').classList.toggle('on', !!P.drilling);
  $('drillI').style.width = (P.drill || 0) + '%';
  if (P.drilling) $('drillL').textContent = T(P.drill < 12 ? 'stBind' : P.drill < 88 ? 'stAcro' : 'stFuse');
  $('where').textContent = P.region >= 0 && G.mode === 'race' ? '📍 ' + T('regions')[P.region][0] + (P.hyper ? ' ⚡' : '') : '';
  if (hudTick > .2) {
    hudTick = 0;
    const tr = $('track'); const dots = tr.querySelectorAll('i');
    let k = 0;
    for (const r of G.racers.values()) {
      let d = dots[k]; if (!d) { d = document.createElement('i'); tr.appendChild(d); }
      d.className = r.me ? 'me' : ''; d.style.background = r.color; d.style.left = (clamp((r.me ? P.s : r.s) / L, 0, 1) * 100) + '%'; k++;
    }
    for (; k < dots.length; k++) dots[k].remove();
    $('board').innerHTML = st.map((r, i) => `<div class="${r.me ? 'me' : ''}"><em>${i + 1}</em><span class="d" style="background:${r.color}"></span>${esc(dname(r))}${r.bot ? '<span class="cpu">CPU</span>' : ''}${r.place ? ' 🏁' : ''}</div>`).join('');
  }
  const lob = $('lobby');
  if (G.mode === 'wait') {
    const left = Math.ceil((G.startAt - serverNow()) / 1000);
    const humans = [...G.racers.values()].filter(r => !r.bot).length;
    lob.style.display = 'block';
    const cd = W.course.diff;
    lob.innerHTML = `<span style="color:${DIFF_COL[cd.lv - 1]}">${diffName(cd)} ${stars(cd.lv)}</span> ｜ ${T('lobby', !!(G.net && G.net.ws), humans, G.racers.size - humans, Math.max(0, left))}<br><small style="opacity:.7;font-weight:400">${T('hint', IS_TOUCH)}</small>`;
    if (left <= 3 && left >= 1) setCenter(String(left)); else if (left > 3) setCenter('');
  } else lob.style.display = 'none';
  const pr = pressure();
  $('press').classList.toggle('on', G.mode === 'wait' && !P.launched);
  $('pressI').style.width = (pr * 100) + '%';
}
let lastCenter = '';
function setCenter(t) { if (t !== lastCenter) { lastCenter = t; $('center').textContent = t; if (/^[123]$/.test(t)) sfx.beep(false); } }
const DIFF_COL = ['#9dffb0', '#ffe08a', '#ffa36b', '#ff5c7c'];
const stars = lv => '★'.repeat(lv) + '☆'.repeat(4 - lv);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function startCeremony() {
  document.body.classList.add('cere'); $('center').textContent = ''; $('sub').textContent = ''; lastCenter = '';
  startDev(); G.ready = false; $('bReady').disabled = false; $('bReady').textContent = T('ready');
  const w = G.winner && G.resList.find(r => r.id === G.winner.id), wb = $('winBanner');
  if (!w) { wb.innerHTML = `<p class="wq">${T('noWinner')}</p>`; return; }
  const who = `<span class="wn">🥇 ${w.country ? flag(w.country) + ' ' : ''}<b style="color:${w.color}">${esc(dname(w))}</b></span>`;
  if (w.bot) wb.innerHTML = who + `<p class="wq">「${esc(T('botWin')[G.winner.botLine] || T('botWin')[0])}」</p>`;
  else if (G.winner.writing) wb.innerHTML = who + `<p class="wq dim">${T('writing')}</p>`;
  else wb.innerHTML = who;
}
function showWinMsg(m) {
  const w = G.resList && G.resList.find(r => r.id === m.id); if (!w) return;
  const who = `<span class="wn">🥇 ${w.country ? flag(w.country) + ' ' : ''}<b style="color:${w.color}">${esc(dname(w))}</b></span>`;
  $('winBanner').innerHTML = who + (m.skip ? '' : `<p class="wq">「${esc(m.text)}」</p>`);
}
function addChat(m) {
  const r = G.racers.get(m.id), col = r ? r.color : '#fff';
  const txt = m.preset ? (T('presets')[m.preset] || '') : m.text;
  const el = document.createElement('div');
  el.innerHTML = `${m.country ? flag(m.country) + ' ' : ''}<b style="color:${col}">${esc(dname({ name: m.name, bot: r && r.bot }))}</b> ${esc(txt)}`;
  const L_ = $('chatList'); L_.appendChild(el); while (L_.children.length > 40) L_.firstChild.remove(); L_.scrollTop = L_.scrollHeight;
}
function sendChat(preset) {
  if (!G.net) return;
  if (preset) { G.net.send({ t: 'chat', preset }); return; }
  const v = $('chatIn').value.trim(); if (!v) return; G.net.send({ t: 'chat', text: v }); $('chatIn').value = '';
}
function showResult(list) {
  const me = list.find(r => r.id === G.you);
  $('resTitle').textContent = me ? (me.rank === 1 ? T('resWin') : me.time != null ? T('resPlace', me.rank) : T('resFail')) : T('resTitle');
  $('presets').innerHTML = C.PRESETS.map(k => `<button data-p="${k}">${T('presets')[k]}</button>`).join('');
  $('resTable').innerHTML = list.map(r => `<tr class="${r.id === G.you ? 'me' : ''}"><td>${r.rank}</td><td><span class="dot" style="background:${r.color}"></span>${r.country ? flag(r.country) + ' ' : ''}${esc(dname(r))}${r.bot ? '<span class="cpu">CPU</span>' : ''}</td><td class="t">${r.time != null ? fmtTime(r.time) : T('remain', Math.max(0, L - r.s))}</td></tr>`).join('');
  $('result').classList.add('on');
  const wf = $('winForm');
  if (G.winToken) {
    wf.style.display = 'block'; $('winMsg').value = ''; $('winFrom').textContent = '';
    fetch('api/country').then(r => r.json()).then(j => { $('winFrom').textContent = T('from', j.country ? flag(j.country) + ' ' + countryName(j.country) : T('unknown')); }).catch(() => { });
    setTimeout(() => $('winMsg').focus(), 300);
  } else wf.style.display = 'none';
}
const flag = c => String.fromCodePoint(...[...c.toUpperCase()].map(ch => 127397 + ch.charCodeAt(0)));
function countryName(c) { try { return new Intl.DisplayNames([LANG], { type: 'region' }).of(c); } catch (e) { return c; } }
function postMsg(skip) {
  if (!G.winToken || !G.net) return;
  const text = $('winMsg').value.trim();
  G.net.send(skip || !text ? { t: 'msgSkip', token: G.winToken } : { t: 'msg', token: G.winToken, text });
}
async function openFame() {
  $('fame').classList.add('on'); const L_ = $('fameList'); L_.textContent = T('loading');
  try {
    const list = await (await fetch('api/winners', { cache: 'no-store' })).json();
    if (!list.length) { L_.textContent = T('fameEmpty'); return; }
    const df = new Intl.DateTimeFormat(LANG === 'ja' ? 'ja-JP' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    L_.innerHTML = list.map(w => `<div class="fm"><div class="fh"><span class="fl">${w.country ? flag(w.country) : '🌐'}</span><b>${esc(dname({ name: w.name }))}</b><span class="fc">${esc(w.country ? countryName(w.country) : T('unknown'))}</span><span class="fd">${df.format(new Date(w.time))} ・ ${stars(w.lv || 2)} ・ ${fmtTime(w.ms)}</span></div><p>${esc(w.text)}</p></div>`).join('');
  } catch (e) { L_.textContent = T('fameEmpty'); }
}
function hideOverlays() { for (const o of document.querySelectorAll('.ov')) o.classList.remove('on'); }
function backToTitle(msg) {
  if (G.net) G.net.close();
  endDev(); document.body.classList.remove('cere');
  G.mode = 'title'; hideOverlays(); $('title').classList.add('on'); $('hud').classList.remove('on'); $('boostBtn').style.display = 'none';
  $('msg').textContent = msg || ''; setBusy(false); setCenter(''); $('sub').textContent = '';
  for (const r of G.racers.values()) W.group.remove(r.model); G.racers.clear();
  G.spec = false; document.body.classList.remove('spec');
}

/* ================= player physics ================= */
function resetPlayer() {
  Object.assign(P, { s: 0, u: 0, v: 0, vu: 0, vv: 0, spd: 0, stam: 100, boost: false, burst: 0, stun: 0, fin: false, draft: 0, inAcid: false, launched: false, hyper: false, drilling: false, drill: 0, mash: 0, fuseT: 99, blocked: false, boostHeld: false, lastWig: 0, abN: 0, region: -1, seen: new Set(), surge: false, inMucus: false, shield: false, onTrail: false });
  if (W) { W.abUsed.clear(); W.macs = W.course.mac.map(m => ({ ...m, cool: 0 })); }
  G.fin = false; $('center').textContent = ''; $('sub').textContent = ''; lastCenter = '';
  if (W) { W.sugarGot.clear(); W.course.sugar.forEach((s, i) => { posAt(s.s, s.u, s.v, _o.position); _o.scale.setScalar(1); _o.rotation.set(i, i * 2, 0); _o.updateMatrix(); W.sugarMesh.setMatrixAt(i, _o.matrix); }); W.sugarMesh.instanceMatrix.needsUpdate = true;
    for (const m of W.mem) { m.passed = false; m.mat.uniforms.uTorn.value = 0; } for (const r of W.rings) r.hit = false; }
}
const wtmp = { s: 0, u: 0, v: 0 };
// 観戦：見ている精子にカメラ（P）を重ねる。おまかせ時はまだ着いていない先頭を追う
function specTarget() {
  let r = G.racers.get(G.watch);
  if (r && r.place && r.s >= L - .1) { G.watch = 0; r = null; }
  if (!r) {
    const run = [...G.racers.values()].filter(q => !q.place).sort((a, b) => b.s - a.s);
    let a = G.racers.get(G.autoWatch);
    if (!a || a.place || (run[0] && run[0] !== a && run[0].s > a.s + 15)) a = run[0] || standings()[0];
    G.autoWatch = a ? a.id : 0; r = a;
  }
  return r;
}
function cycleWatch(d) {
  const list = standings(); if (!list.length) return;
  const cur = specTarget(), i = Math.max(0, list.indexOf(cur));
  G.watch = list[(i + d + list.length) % list.length].id;
}
let specLabel = '';
function updateSpec(dt) {
  const r = specTarget(); if (!r) return;
  P.s = r.s; P.u = r.u; P.v = r.v; P.spd = r.spd || 0; P.boost = !!r.b; P.region = C.regionAt(P.s);
  const t = T('spec', dname(r)); if (t !== specLabel) { specLabel = t; $('specTxt').innerHTML = `<span style="color:${r.color}">${esc(t)}</span>`; }
}
// 発射！
function launch() {
  P.launched = true; G.mode = 'race';
  P.burst = C.LAUNCH_BURST; P.spd = 20;
  launchCrowd(); uSqueeze.value = 0;
  const lt = T('launch'); setCenter(lt); setTimeout(() => { if (lastCenter === lt) setCenter(''); }, 1200);
  const f = $('flash'); f.style.transition = 'none'; f.style.opacity = .9; requestAnimationFrame(() => { f.style.transition = 'opacity 1.1s ease-out'; f.style.opacity = 0; });
  kick(2.4); fovKick = 30; sfx.launch();
}
// 発射前の圧力（0→1）
function pressure() { return G.mode === 'wait' && !P.launched ? clamp(1 - (G.startAt - serverNow()) / 10000, 0, 1) : 0; }
function updatePlayer(dt) {
  const inp = readInput();
  const rt = raceT();
  const racing = G.mode === 'race' && rt >= 0 && !P.fin;
  if ((G.mode === 'wait' || G.mode === 'race') && !P.launched && rt >= 0) launch();
  // 横移動（スタート前もグリッド内で少し動ける）
  const lat = racing ? 15 : 4;
  P.vu += (inp.iy * lat - P.vu) * Math.min(1, dt * 6);
  P.vv += (inp.ix * lat - P.vv) * Math.min(1, dt * 6);
  if (!racing) {
    P.spd = Math.max(0, P.spd - dt * 30);
    if (G.mode === 'race' && P.fin) { P.s += P.spd * dt; P.s = Math.min(P.s, L + 1); }
    P.u += P.vu * dt * (P.fin ? 0 : 1); P.v += P.vv * dt * (P.fin ? 0 : 1);
    clampLat();
    return;
  }
  const c = W.course, t = rt;
  if (!P.drilling) tapQ = wigQ = 0;
  // ブースト（受精能獲得＝超活性化後は強く・長持ち）
  P.boost = inp.boost && P.stam > 0 && P.stun <= 0;
  if (P.boost) { if (!P.wasBoost) sfx.boost(); P.stam = Math.max(0, P.stam - (P.hyper ? 22 : 30) * dt); } else P.stam = Math.min(100, P.stam + 9 * dt);
  P.wasBoost = P.boost;
  // --- 卵子：透明帯にくっつき、先体反応で溶かしながら押し込む
  if (P.drilling) {
    P.spd = 0; P.s = L;
    const sx = Math.abs(inp.ix) > .4 ? Math.sign(inp.ix) : 0;
    if (sx && joy.id !== null) wiggleTo(sx);              // スマホは左ドラッグを左右に振る
    const taps = tapQ, wigs = wigQ; tapQ = wigQ = 0;
    let gain = 1.6 * dt;                                     // じわじわ
    if (inp.boost && P.stam > 0) gain += 4 * dt;              // 押し続ける
    for (let q = 0; q < Math.min(taps, 4); q++) { gain += P.stam > 4 ? 2.8 : 1.3; P.stam = Math.max(0, P.stam - 4); }   // 連打でぐいっ
    if (taps) { P.mash = 1; sfx.push(); kick(.22); }
    if (wigs) { gain += 1.5 * Math.min(wigs, 3); P.mash = Math.max(P.mash, .75); sfx.push(true); }                     // 左右にくねる
    P.drill = Math.min(100, P.drill + gain * (P.hyper ? 1.3 : 1));
    P.mash = Math.max(0, P.mash - dt * 2.2);
    if (P.drill >= 12) once('acroStage', T('acro'), '#f4ff9a');
    if (P.drill >= 88) once('fuseStage', T('fuse'), '#ffe0f0');
    if (P.drill >= 100) { P.fin = true; P.drilling = false; P.fuseT = 0; G.net && G.net.send({ t: 'fin' }); kick(1.5); sfx.fuse(); }
    sendState(); return;
  }
  let target = 26 + (P.boost ? (P.hyper ? 24 : 16) : 0) + P.burst;
  // スリップストリーム
  P.draft = 0;
  for (const r of G.racers.values()) {
    if (r.me) continue; const ds = r.s - P.s;
    if (ds > 1.5 && ds < 10 && Math.hypot(r.u - P.u, r.v - P.v) < 2.8) P.draft = 1;
    if (Math.abs(ds) < 1.6) { const du = P.u - r.u, dv = P.v - r.v, d = Math.hypot(du, dv); if (d < 1.5 && d > .01) { P.u += du / d * (1.5 - d) * .6; P.v += dv / d * (1.5 - d) * .6; } }
  }
  if (P.draft) target *= 1.13;
  // 区間（解剖学的な場所）が変わったら表示
  const reg = C.regionAt(P.s);
  if (reg !== P.region) { P.region = reg; banner(reg); }
  // --- 膣：酸。群れの中にいると精液の緩衝作用で中和される
  P.inAcid = false; P.shield = false;
  for (const a of c.acid) if (Math.abs(a.s - P.s) < a.r && Math.hypot(a.s - P.s, a.u - P.u, a.v - P.v) < a.r) P.inAcid = true;
  if (P.inAcid) {
    P.shield = swarmNear(5) >= 4;
    if (P.shield) { target *= .93; once('shield', T('shield'), '#cfe8ff'); }
    else { target *= .6; P.stam = Math.max(0, P.stam - 8 * dt); }
  }
  // --- 子宮頸管：粘液（遅くなる）・頸管腺のくぼみ（吸い込まれる）
  P.inMucus = false;
  for (const m of c.mucus) if (Math.abs(m.s - P.s) < m.r && Math.hypot(m.s - P.s, m.u - P.u, m.v - P.v) < m.r) P.inMucus = true;
  if (P.inMucus) target *= P.hyper ? .8 : .55;
  for (let i = 0; i < c.crypt.length; i++) {
    const k = c.crypt[i]; if (Math.abs(k.s - P.s) > 4) continue;
    const R = C.radiusAt(c, k.s) - 1, cu = Math.cos(k.a) * R, cv = Math.sin(k.a) * R, d = Math.hypot(k.s - P.s, cu - P.u, cv - P.v);
    if (d < 3.6 && !P.boost) {
      target *= .25; const du = cu - P.u, dv = cv - P.v, dl = Math.hypot(du, dv) || 1;
      P.vu += du / dl * 40 * dt; P.vv += dv / dl * 40 * dt;
      once('crypt' + i, T('crypt'), '#ffcfb0');
    }
  }
  // --- 抗精子抗体：くっつくと遅くなる。ブーストで振り払う
  if (P.abN && P.boost) { P.abN = 0; toast(T('abOff'), '#d7b4ff'); sfx.mem(true); }
  for (let i = 0; i < c.ab.length; i++) {
    if (W.abUsed.has(i)) continue; const a = c.ab[i]; if (Math.abs(a.s - P.s) > 5) continue;
    C.abAt(c, a, t, wtmp);
    if (Math.hypot(wtmp.s - P.s, wtmp.u - P.u, wtmp.v - P.v) < 1.4 && !P.boost) { W.abUsed.add(i); P.abN = Math.min(5, (P.abN || 0) + 1); toast(T('ab'), '#d7b4ff'); sfx.hit(); }
  }
  if (P.abN) target *= 1 - .09 * P.abN;
  // --- 卵管峡部：壁（上皮）にふれるとくっつく
  if (reg === 4) {
    const R = C.radiusAt(c, P.s) - 1.3;
    if (Math.hypot(P.u, P.v) > R - 1.2) { target *= .35; once('stick' + Math.floor(P.s / 60), T('stick'), '#ffd8c0'); }
  }
  // --- 卵管膨大部：においの道（化学走性）と卵丘細胞
  if (P.s > C.AMP_S) {
    C.trailAt(c, P.s, wtmp);
    P.onTrail = Math.hypot(wtmp.u - P.u, wtmp.v - P.v) < 2.8;
    if (P.onTrail) { target *= 1.12; once('trail', T('trail'), '#ffe8a0'); }
    once('flow', T('flow'), '#bfe6ff');
  } else P.onTrail = false;
  if (P.s > L - 160) for (const k of c.cumulus) if (Math.abs(k.s - P.s) < k.r + .6 && Math.hypot(k.s - P.s, k.u - P.u, k.v - P.v) < k.r + .6) { target *= P.hyper ? .85 : .6; break; }
  // --- 子宮の蠕動波：波の上にいると押してもらえる
  const wf = C.waveFront(c, t);
  if (wf >= 0) {
    const wi = c.waves.findIndex(w => t >= w.t && 850 + (t - w.t) * 45 <= 1500);
    if (P.s > 820 && P.s < 1500) once('wave' + wi, T('wave'), '#ffb8d8');
    if (Math.abs(wf - P.s) < 12) target += 14;
  }
  const surge = C.surgeAt(c, t);
  if (surge && !P.surge) toast(T('surge'), '#ff8a8a');
  P.surge = surge;
  if (P.stun > 0) { P.stun -= dt; target = 6; }
  P.spd += (target - P.spd) * Math.min(1, dt * (target > P.spd ? 1.8 : 2.5));
  const prev = P.s;
  // 卵管膨大部の線毛による逆流（中央が強く、壁ぎわは弱い）
  P.s += (P.spd + C.counterFlow(c, P.s, P.u, P.v)) * dt;
  P.burst = Math.max(0, P.burst - 18 * dt);
  P.u += P.vu * dt; P.v += P.vv * dt;
  clampLat();
  // --- 卵管口ゲート：閉じているときは通れない
  if (prev < c.gate.s && P.s >= c.gate.s && C.gateOpen(c, t) < .5) {
    P.s = c.gate.s - .6; P.spd = 0; once('gate' + Math.floor(t / 3), T('gate'), '#ffc0e0'); sfx.mem(false); kick(.6);
  }
  // --- 受精能獲得（超活性化）
  if (!P.hyper && prev < c.capa.s && P.s >= c.capa.s) { P.hyper = true; toast(T('capa'), '#a8fff0'); sfx.ring(); kick(.6); fovKick = 14; }
  // リング（蠕動の流れ）
  for (const r of W.rings) if (!r.hit && prev < r.s && P.s >= r.s) {
    if (Math.hypot(P.u - r.u, P.v - r.v) < r.r + .4) { r.hit = true; P.burst = 22; P.stam = Math.min(100, P.stam + 10); sfx.ring(); toast(T('ring'), '#8ff'); kick(.5); }
  }
  // 膜（粘液栓）
  for (const m of W.mem) if (!m.passed && prev < m.s && P.s >= m.s) {
    m.passed = true; m.mat.uniforms.uHit.value = 1;
    if (P.boost || P.burst > 6) { m.mat.uniforms.uTorn.value = 1; sfx.mem(true); toast(T('memBreak'), '#ffc8ec'); kick(.4); }
    else { P.spd *= .45; sfx.mem(false); toast(T('memStuck'), '#ffb3c7'); }
  }
  // 白血球（好中球）
  for (const w of W.wbc) {
    C.wbcAt(c, w, t, wtmp);
    const ds = wtmp.s - P.s; if (Math.abs(ds) > w.r + 2) continue;
    const d = Math.hypot(ds, wtmp.u - P.u, wtmp.v - P.v);
    if (d < w.r + .7 && P.stun <= 0) {
      P.stun = .7; P.spd *= .25; const du = P.u - wtmp.u, dv = P.v - wtmp.v, dl = Math.hypot(du, dv) || 1; P.vu = du / dl * 14; P.vv = dv / dl * 14;
      sfx.hit(); toast(T('wbc'), '#e0e4ff'); kick(1);
    }
  }
  // マクロファージ：近づくと追いかけてくる
  for (const m of W.macs) {
    m.cool -= dt;
    const ds = P.s - m.s;
    if (Math.abs(ds) < 45) {
      const sp = surge ? 27 : 19;
      m.s += Math.sign(ds) * Math.min(Math.abs(ds), sp * dt);
      const du = P.u - m.u, dv = P.v - m.v, dl = Math.hypot(du, dv) || 1; m.u += du / dl * Math.min(dl, 5 * dt); m.v += dv / dl * Math.min(dl, 5 * dt);
      const R = Math.max(0, C.radiusAt(c, m.s) - 4.5), md = Math.hypot(m.u, m.v); if (md > R) { m.u *= R / md; m.v *= R / md; }
      if (Math.hypot(ds, du, dv) < 5 && m.cool <= 0 && P.stun <= 0) {
        m.cool = 4; P.stun = 1.1; P.spd *= .15; P.vu = du / dl * 16; P.vv = dv / dl * 16; sfx.hit(); toast(T('mac'), '#ffe6a0'); kick(1.3);
      }
    }
  }
  // 糖
  const sg = c.sugar;
  for (let i = 0; i < sg.length; i++) {
    const q = sg[i]; if (W.sugarGot.has(i) || Math.abs(q.s - P.s) > 2) continue;
    if (Math.hypot(q.s - P.s, q.u - P.u, q.v - P.v) < 1.7) {
      W.sugarGot.add(i); P.stam = Math.min(100, P.stam + 18); sfx.sugar();
      _m.makeScale(0, 0, 0); W.sugarMesh.setMatrixAt(i, _m); W.sugarMesh.instanceMatrix.needsUpdate = true;
    }
  }
  // 卵子に到達 → 先体反応スタート
  if (P.s >= L) {
    P.s = L; P.drilling = true; P.drill = 0; P.mash = 0; toast(T('bind'), '#fff0a0'); sfx.push(); kick(.8);
    // 卵丘細胞をかきわけた後なので、くっついた場所のまわりの細胞をどける（カメラの視界も確保）
    posAt(L, P.u, P.v, _v).sub(W.egg.c).normalize(); _v3.copy(W.egg.c).addScaledVector(_v, ZONA_R);
    for (const cl of W.clutter) { let ch = false; cl.pos.forEach((q, i) => { if (q.distanceTo(_v3) < 11) { _m.makeScale(0, 0, 0); cl.mesh.setMatrixAt(i, _m); ch = true; } }); if (ch) cl.mesh.instanceMatrix.needsUpdate = true; }
  }
  sendState();
}
function sendState() {
  const now = performance.now();
  if (now - G.lastSend > 66) { G.lastSend = now; G.net && G.net.send({ t: 'st', s: +P.s.toFixed(2), u: +P.u.toFixed(2), v: +P.v.toFixed(2), spd: +P.spd.toFixed(1), b: P.boost ? 1 : 0 }); }
}
// 近くにいる仲間（群衆＋ライバル）の数
function swarmNear(r) {
  let n = 0;
  for (const q of W.crowd.list) if (!q.packed && Math.abs(q.s - P.s) < r && Math.hypot(q.s - P.s, q.u - P.u, q.v - P.v) < r) n++;
  for (const q of G.racers.values()) if (!q.me && Math.abs(q.s - P.s) < r && Math.hypot(q.s - P.s, q.u - P.u, q.v - P.v) < r) n++;
  return n;
}
// 同じメッセージは一度だけ
function once(key, text, col) { if (P.seen.has(key)) return; P.seen.add(key); toast(text, col); }
function banner(reg) {
  const [name, desc] = T('regions')[reg], el = $('banner');
  el.innerHTML = `<b>${name}</b><span>${desc}</span>`; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
}
function clampLat() {
  const R = C.radiusAt(W.course, P.s) - 1.3, d = Math.hypot(P.u, P.v);
  if (d > R) { P.u *= R / d; P.v *= R / d; const nu = P.u / R, nv = P.v / R, dot = P.vu * nu + P.vv * nv; if (dot > 0) { P.vu -= nu * dot; P.vv -= nv * dot; } }
}
let shake = 0, fovKick = 0;
function kick(k) { shake = Math.max(shake, k * .5); fovKick = Math.max(fovKick, k * 8); }

/* ================= per-frame world update ================= */
const _v3 = new THREE.Vector3(), _v4 = new THREE.Vector3();
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3(), camUp = new THREE.Vector3(0, 1, 0);
let camInit = false, attractS = 0;
function updateRacers(dt) {
  for (const r of G.racers.values()) {
    if (r.me) { r.s = P.s; r.u = P.u; r.v = P.v; r.spd = P.spd; r.b = P.boost ? 1 : 0; }
    else {
      if (G.mode === 'race') {
        r.s += r.spd * dt;
        r.s += (r.ts - r.s) * Math.min(1, dt * 5); r.u += (r.tu - r.u) * Math.min(1, dt * 6); r.v += (r.tv - r.v) * Math.min(1, dt * 6);
      } else { r.s = r.ts; r.u = r.tu; r.v = r.tv; }
      if (r.place) r.s = Math.min(r.s, L);
    }
    const m = r.model;
    const pu = r.me ? P.vu * .05 : 0, pv = r.me ? P.vv * .05 : 0;
    posAt(r.s, r.u, r.v, m.position); frameAt(r.s);
    posAt(r.s + 1.4, r.u + pu, r.v + pv, _v);
    m.up.copy(F.n); m.lookAt(_v);
    const ud = m.userData, sp = r.spd || 0;
    ud.tailU.uFreq.value = 9 + sp * .35 + (r.b ? 8 : 0);
    ud.tailU.uAmp.value = .45 + Math.min(.35, sp * .008) + (r.me && P.hyper ? .3 : 0);
    if (r.me) {
      if (!ud.abs) { ud.abs = []; for (let k = 0; k < 5; k++) { const a = makeAntibody(); a.scale.setScalar(.7); a.position.set(Math.cos(k * 1.3) * .7, Math.sin(k * 1.3) * .5, -.2 - k * .25); a.rotation.z = k; ud.body.add(a); ud.abs.push(a); } }
      ud.abs.forEach((a, k) => { a.visible = k < (P.abN || 0); });
    }
    ud.body.rotation.y = Math.sin(uTime.value * ud.tailU.uFreq.value * .5 + ud.phase) * .06;
    ud.body.rotation.x = ud.body.rotation.z = 0; m.visible = true; m.scale.setScalar(1);
    if (r.s >= L - .05 && W.egg) {
      // 卵子の表面にくっつく（頭を卵子の中心へ向ける）
      const e = W.egg, tt = uTime.value; posAt(L, r.u, r.v, _v).sub(e.c).normalize();
      let depth, k;
      if (r.me && !P.blocked) {
        const pr = (P.drill || 0) / 100;
        depth = P.fin ? lerp(EGG_R - .4, EGG_R - 7, clamp(P.fuseT / 1.4, 0, 1)) : lerp(ZONA_R + .95, EGG_R - .4, pr);
        k = P.fin ? .2 : .35 + P.mash;
        if (P.fin) m.scale.setScalar(1 - clamp(P.fuseT / 1.6, 0, .9) * .3);
      } else if (r.place === 1) { depth = EGG_R - 7; m.visible = false; k = 0; }
      else { depth = ZONA_R + .85 + Math.sin(tt * 9 + ud.phase) * .12; k = .6; }
      m.position.copy(e.c).addScaledVector(_v, depth); m.up.copy(F.n); m.lookAt(e.c);
      ud.body.rotation.set(Math.sin(tt * 13 + ud.phase) * .1 * k, Math.cos(tt * 11 + ud.phase) * .14 * k, Math.sin(tt * 6 + ud.phase) * .35 * k);
      ud.tailU.uFreq.value = 22 + k * 18; ud.tailU.uAmp.value = .7 + k * .5;
      if (r.label) r.label.visible = false;
      continue;
    }
    if (r.label) { const d = m.position.distanceTo(camera.position); r.label.visible = d < 70; r.label.material.opacity = clamp(1.4 - d / 50, 0, 1); }
  }
}
function updateWorld(dt) {
  const t = uTime.value, rt = G.mode === 'race' ? Math.max(0, raceT()) : 0;
  for (const r of W.rings) { r.t2.rotation.z = t * 1.5; r.g.children[0].rotation.z = -t * .7; const k = r.hit ? .35 : 1; r.g.children[0].scale.setScalar(k + (1 - k) * (1 + Math.sin(t * 4 + r.s) * .04)); }
  for (const a of W.acid) for (const sp of a.sprites) { sp.material.rotation = t * .2 + sp.userData.ph; sp.material.opacity = .16 + .08 * Math.sin(t * 1.3 + sp.userData.ph); }
  for (const w of W.wbc) { C.wbcAt(W.course, w, rt, w.cur); posAt(w.cur.s, w.cur.u, w.cur.v, w.g.position); w.g.rotation.y = t * .3 + w.ph; w.g.rotation.x = t * .2; }
  for (const m of W.mem) m.mat.uniforms.uHit.value = Math.max(0, m.mat.uniforms.uHit.value - dt * 1.5);
  const c = W.course;
  W.course.ab.forEach((a, i) => {
    const m = W.abs[i];
    if (W.abUsed.has(i) || Math.abs(a.s - (G.mode === 'title' ? attractS : P.s)) > 120) { m.visible = false; return; }
    m.visible = true; C.abAt(c, a, rt || t, wtmp); posAt(wtmp.s, wtmp.u, wtmp.v, m.position); m.rotation.set(t * a.f + a.ph, t * .7, a.ph);
  });
  W.macs.forEach((m, i) => { posAt(m.s, m.u, m.v, W.macMeshes[i].position); W.macMeshes[i].rotation.y = t * .25 + i; });
  const open = C.gateOpen(c, rt || t), gR = W.gateR;
  for (const p of W.petals) { const a = p.userData.a, d = lerp(1.6, gR - .6, open); p.position.set(Math.cos(a) * d, Math.sin(a) * d, 0); p.lookAt(0, 0, 0); p.scale.set(1.6 + (1 - open) * .8, .9, 1.4 + (1 - open) * 1.2); }
  { const T_ = W.trail, len = L - 40 - (C.AMP_S + 15);
    for (let i = 0; i < T_.n; i++) { const s = C.AMP_S + 15 + ((T_.off[i] + t * .02) % 1) * len; C.trailAt(c, s, wtmp); posAt(s, wtmp.u + T_.jit[i][0], wtmp.v + T_.jit[i][1], _v); T_.pos[i * 3] = _v.x; T_.pos[i * 3 + 1] = _v.y; T_.pos[i * 3 + 2] = _v.z; }
    T_.pts.geometry.attributes.position.needsUpdate = true; }
  const wf = G.mode === 'race' ? C.waveFront(c, rt) : -1;
  W.waveMesh.visible = wf >= 0;
  if (wf >= 0) { orientAt(W.waveMesh, wf, 0, 0); W.waveMesh.scale.setScalar(visR(wf) - .8); }
  // 透明帯のへこみ・酵素の粒
  if (P.drilling || (P.fin && P.fuseT < 2)) {
    posAt(L, P.u, P.v, _v).sub(W.egg.c).normalize(); DENT.dir.value.copy(_v);
    const target = P.drilling ? .5 + (P.drill / 100) * 1.4 + P.mash * .9 : Math.max(0, 1.9 - P.fuseT * 1.5);
    DENT.amt.value = lerp(DENT.amt.value, target, Math.min(1, dt * 12));
    const E = W.enz, rate = P.drilling ? 30 + P.mash * 90 : 0;
    for (let q = 0; q < rate * dt; q++) {
      const i = E.next = (E.next + 1) % E.n;
      E.pos[i * 3] = W.egg.c.x + _v.x * ZONA_R; E.pos[i * 3 + 1] = W.egg.c.y + _v.y * ZONA_R; E.pos[i * 3 + 2] = W.egg.c.z + _v.z * ZONA_R;
      E.vel[i * 3] = _v.x * 2 + (Math.random() - .5) * 5; E.vel[i * 3 + 1] = _v.y * 2 + (Math.random() - .5) * 5; E.vel[i * 3 + 2] = _v.z * 2 + (Math.random() - .5) * 5; E.life[i] = .9;
    }
  } else DENT.amt.value = Math.max(0, DENT.amt.value - dt);
  if (P.fin) P.fuseT += dt;
  { const E = W.enz; for (let i = 0; i < E.n; i++) { if (E.life[i] <= 0) { E.pos[i * 3 + 1] = 1e5; continue; } E.life[i] -= dt; for (let a = 0; a < 3; a++) { E.pos[i * 3 + a] += E.vel[i * 3 + a] * dt; E.vel[i * 3 + a] *= 1 - dt * 2; } }
    E.pts.geometry.attributes.position.needsUpdate = true; }
  if (W.egg.flash > 0) { W.egg.flash = Math.max(0, W.egg.flash - dt * .5); W.egg.zona.material.uniforms.uFlash.value = W.egg.flash; }
  // 群衆（3億のライバルたち）
  const cr = W.crowd, base = G.mode === 'title' ? attractS : P.s;
  for (let i = 0; i < cr.list.length; i++) {
    const c = cr.list[i];
    if (c.packed) { c.u += (Math.random() - .5) * dt * 3; c.v += (Math.random() - .5) * dt * 3; c.s += (Math.random() - .5) * dt * 2 * (1 + uSqueeze.value); }
    else { c.spd += (c.cruise - c.spd) * Math.min(1, dt * .6); c.s += c.spd * dt; c.u += c.du * dt; c.v += c.dv * dt; c.du *= 1 - dt * .5; c.dv *= 1 - dt * .5; }
    const R = C.radiusAt(W.course, Math.max(0, c.s)) - 1.2, d = Math.hypot(c.u, c.v); if (d > R) { c.u *= R / d; c.v *= R / d; c.du = -c.du; c.dv = -c.dv; }
    if (!c.packed && (c.s < base - 25 || c.s > base + 220 || c.s > L - 60)) spawnCrowd(c, Math.min(L - 80, base + 60 + Math.random() * 150));
    posAt(c.s, c.u, c.v, _o.position); frameAt(c.s); _v.copy(_o.position).add(F.t); _o.up.copy(F.n); _o.lookAt(_v); _o.scale.setScalar(.9); _o.updateMatrix();
    cr.heads.setMatrixAt(i, _o.matrix); cr.tails.setMatrixAt(i, _o.matrix);
  }
  cr.heads.instanceMatrix.needsUpdate = cr.tails.instanceMatrix.needsUpdate = true;
  updateDust(dt);
}
function updateCamera(dt) {
  let s, u, v;
  if (G.mode === 'title') { attractS = (attractS + dt * 24) % (L - 200); s = attractS; u = Math.sin(uTime.value * .3) * 3; v = Math.cos(uTime.value * .23) * 2; }
  else { s = P.s; u = P.u; v = P.v; }
  frameAt(s); camUp.lerp(F.n, Math.min(1, dt * 3)).normalize();
  let tp;
  if (DEV && G.mode === 'result') {
    // セレモニー：卵子のまわりをゆっくり回る
    frameAt(L + 31); camUp.lerp(F.n, Math.min(1, dt * 2)).normalize();
    // 部屋（管）の中にとどまるよう、卵子の手前で管の軸のまわりを回る
    const a = DEV.t * .22 + .6, back = DEV.k >= 6 ? 58 : 68, side = DEV.k >= 6 ? 20 : 26;
    tp = _v2.copy(W.egg.c).addScaledVector(F.t, -back).addScaledVector(F.b, Math.sin(a) * side).addScaledVector(F.n, Math.cos(a) * side * .7);
    camLook.lerp(W.egg.c, Math.min(1, dt * 3));
  } else if (G.mode !== 'title' && (P.drilling || (P.fin && P.fuseT < 3.5 && !P.blocked))) {
    // 卵子にくっついたところを横から間近に
    const e = W.egg; posAt(L, P.u, P.v, _v).sub(e.c).normalize();
    _v3.copy(e.c).addScaledVector(_v, ZONA_R);
    _v4.crossVectors(_v, F.n).normalize();
    const a = uTime.value * .15;
    tp = _v2.copy(_v3).addScaledVector(_v, 5.2).addScaledVector(_v4, Math.cos(a) * 4.5).addScaledVector(F.n, 1.6 + Math.sin(a) * 1.5);
    camLook.lerp(_v3, Math.min(1, dt * 4));
  } else if (P.fin && G.mode !== 'title') {
    const a = uTime.value * .25;
    tp = posAt(s - 9, u + Math.cos(a) * 5, v + Math.sin(a) * 5, _v2);
    camLook.lerp(W.egg.g.position, Math.min(1, dt * 2));
  } else {
    tp = posAt(s - 7.5, u * .78, v * .78, _v2).addScaledVector(F.n, 1.9);
    posAt(s + 9, u * .9, v * .9, _v); if (!camInit) camLook.copy(_v); else camLook.lerp(_v, Math.min(1, dt * 10));
  }
  if (!camInit) { camPos.copy(tp); camInit = true; } else camPos.lerp(tp, Math.min(1, dt * 7));
  camera.position.copy(camPos);
  if (shake > 0) { camera.position.x += (Math.random() - .5) * shake; camera.position.y += (Math.random() - .5) * shake; shake = Math.max(0, shake - dt * 1.5); }
  camera.up.copy(camUp); camera.lookAt(camLook);
  fovKick = Math.max(0, fovKick - dt * 10);
  const pr = pressure();
  if (G.mode === 'wait') { uSqueeze.value = .25 + pr * 1.1; shake = Math.max(shake, pr * pr * .25); }
  else uSqueeze.value = Math.max(0, uSqueeze.value - dt);
  sfx.state(G.mode === 'title' ? 'title' : G.mode === 'wait' ? 'wait' : G.mode === 'race' && !P.fin ? 'race' : 'calm', pr, G.mode === 'race' ? P.s / L : 0);
  const sp = G.mode === 'title' ? 24 : P.spd;
  const fov = clamp(68 + (sp - 26) * .45 + fovKick, 62, 96);
  if (Math.abs(camera.fov - fov) > .05) { camera.fov = lerp(camera.fov, fov, Math.min(1, dt * 4)); camera.updateProjectionMatrix(); }
  if (DEV && G.mode === 'result') posAt(L - 25, 0, 0, fillLight.position);   // セレモニー中は手前から照らす（胎児の中に光源が入らないように）
  else posAt(s + 22, 0, 0, fillLight.position);
  scene.fog.density = lerp(.0145, .0045, sstep(L - 450, L - 120, s));
  sfx.speed(G.mode === 'wait' ? .2 + pr * .8 : clamp((sp - 10) / 40, 0, 1));
}

/* ================= title UI ================= */
const COLORS = ['#ffffff', '#ff6b9d', '#4dd4ff', '#ffd23f', '#9b7bff', '#5cff9d', '#ff9f43'];
let myColor = '#ff6b9d';
try { myColor = localStorage.getItem('seisi_color') || myColor; const n = localStorage.getItem('seisi_name') || ''; if (n && !ANON_NAMES.includes(n)) $('name').value = n; } catch (e) { }
function renderSwatches() { $('sw').innerHTML = ''; for (const c of COLORS) { const i = document.createElement('i'); i.style.background = c; if (c === myColor) i.className = 'on'; i.onclick = () => { myColor = c; try { localStorage.setItem('seisi_color', c); } catch (e) { } renderSwatches(); }; $('sw').appendChild(i); } }
renderSwatches();
applyLang();
$('bLang').onclick = () => { LANG = LANG === 'ja' ? 'en' : 'ja'; try { localStorage.setItem('seisi_lang', LANG); } catch (e) { } applyLang(); };
function myName() { const n = $('name').value.trim().slice(0, 14) || T('anon'); try { localStorage.setItem('seisi_name', ANON_NAMES.includes(n) ? '' : n); } catch (e) { } return n; }
function setBusy(b) { $('bOnline').disabled = $('bOffline').disabled = b; $('bOnline').textContent = b ? T('connecting') : T('online'); }
$('bOnline').onclick = () => { sfx.init(); setBusy(true); $('msg').textContent = ''; connectOnline(); };
// 練習：コースを選んでから始める
$('bOffline').onclick = () => {
  const el = $('practiceSel');
  if (el.classList.toggle('on')) el.innerHTML = `<p>${T('pickCourse')}</p>` + [1, 2, 3, 4].map(lv => `<button data-lv="${lv}" style="border-color:${DIFF_COL[lv - 1]}"><b>${T('diff')[lv - 1]}</b><span style="color:${DIFF_COL[lv - 1]}">${stars(lv)}</span></button>`).join('') + `<button data-lv="0"><b>${T('random')}</b><span>🎲</span></button>`;
};
$('practiceSel').onclick = e => { const b = e.target.closest('button'); if (!b) return; $('practiceSel').classList.remove('on'); sfx.init(); startOffline(+b.dataset.lv); };
$('bLeave').onclick = () => { if (G.winToken) postMsg(true); G.winToken = null; backToTitle(); };
$('bPost').onclick = () => postMsg(false);
$('specPrev').onclick = () => cycleWatch(-1); $('specNext').onclick = () => cycleWatch(1);
$('bSolo').onclick = () => { if (G.net && G.spec) G.net.send({ t: 'solo' }); };
addEventListener('keydown', e => { if (G.spec && !e.repeat && e.target.tagName !== 'INPUT') { if (e.code === 'ArrowLeft' || e.code === 'KeyA') cycleWatch(-1); if (e.code === 'ArrowRight' || e.code === 'KeyD') cycleWatch(1); } });
$('bChat').onclick = () => sendChat();
$('presets').onclick = e => { const k = e.target.dataset && e.target.dataset.p; if (k) { sendChat(k); $('presets').classList.remove('on'); } };
$('bMore').onclick = e => { e.stopPropagation(); $('presets').classList.toggle('on'); };
addEventListener('click', e => { if (!e.target.closest || !e.target.closest('#presets')) $('presets').classList.remove('on'); });
$('bReady').onclick = () => { if (G.net && !G.ready) { G.ready = true; G.net.send({ t: 'ready' }); $('bReady').disabled = true; $('bReady').textContent = T('readyWait'); } };
$('bSkip').onclick = () => postMsg(true);
$('bFame').onclick = openFame; $('bFame2').onclick = openFame;
$('bFameClose').onclick = () => $('fame').classList.remove('on');
const muteBtn = $('mute');
try { if (localStorage.getItem('seisi_mute') === '1') muteBtn.textContent = '🔇'; } catch (e) { }
const toggleMute = () => { muteBtn.textContent = sfx.toggleMute() ? '🔇' : '🔊'; };
muteBtn.onclick = () => { sfx.init(); toggleMute(); };
addEventListener('keydown', e => { if (e.code === 'KeyM' && e.target.tagName !== 'INPUT') toggleMute(); });
setInterval(() => {
  if (G.mode === 'result' && $('result').classList.contains('on')) {
    const left = Math.max(0, Math.ceil((G.nextAt - serverNow()) / 1000));
    $('resNext').textContent = T('next', T('course', diffName(W.course.diff), stars(W.course.diff.lv)), left);
  }
}, 250);

/* ================= main loop ================= */
buildWorld(20261016);
const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(.05, clock.getDelta());
  uTime.value += dt;
  if (G.mode !== 'title') { if (G.spec) updateSpec(dt); else updatePlayer(dt); updateRacers(dt); updateHud(dt); }
  updateWorld(dt);
  updateDev(dt);
  updateCamera(dt);
  composer.render();
  requestAnimationFrame(frame);
}
frame();
window.__seisi = { G, P, get W() { return W; }, get DEV() { return DEV; }, camera, recam: () => { camInit = false; },
  sfx, snap: () => { composer.render(); return renderer.domElement.toDataURL('image/jpeg', .85); } };
