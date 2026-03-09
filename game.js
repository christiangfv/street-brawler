// ============================================================
//  RADAR FIGHTERS v4 — PIXI.JS v8 EDITION
//  PixiJS v8 · DALL-E portraits · WebGL renderer
//  Scenes: MENU → CHARACTER_SELECT → FIGHT → GAME_OVER
// ============================================================

const SCENES = { MENU: 0, CHARACTER_SELECT: 1, FIGHT: 2, GAME_OVER: 3 };

// ── Game constants ──────────────────────────────────────────
const GRAVITY      = 0.55;
const MOVE_SPEED   = 5;
const ATTACK_DMG   = 12;
const SPECIAL_DMG  = 32;
const ATTACK_RANGE = 95;
const ATTACK_DUR   = 18;
const ATTACK_CD    = 28;
const SPECIAL_CD   = 58;
const HIT_STUN     = 22;
const MAX_HP       = 100;
const ROUND_TIME   = 90;
const DOUBLE_TAP_MS = 350;

// ── SF-style 6-button attack definitions ────────────────────
// kbx = knockback horizontal, kby = launch vertical (negative = up)
const ATTACKS = {
  LP: { dmg: 7,  cd: 14, range: ATTACK_RANGE * 0.85, kbx: 1.5, kby: -1.5, isKick: false, label: 'LP' },
  MP: { dmg: 13, cd: 26, range: ATTACK_RANGE * 1.0,  kbx: 2.5, kby: -2.5, isKick: false, label: 'MP' },
  HP: { dmg: 22, cd: 44, range: ATTACK_RANGE * 1.1,  kbx: 5.0, kby: -3.5, isKick: false, label: 'HP' },
  LK: { dmg: 7,  cd: 14, range: ATTACK_RANGE * 0.9,  kbx: 1.5, kby: -3.5, isKick: true,  label: 'LK' },
  MK: { dmg: 13, cd: 26, range: ATTACK_RANGE * 1.05, kbx: 3.0, kby: -5.5, isKick: true,  label: 'MK' },
  HK: { dmg: 22, cd: 44, range: ATTACK_RANGE * 1.15, kbx: 5.0, kby: -8.0, isKick: true,  label: 'HK' },
};

// ── Character definitions ───────────────────────────────────
const CHARACTERS = [
  // ── Founders ──
  { name: 'HERBERT', title: 'CO-FOUNDER & CEO',   power: 9, speed: 6, defense: 6, color: 0xc0392b, accentColor: 0xff6b6b, portrait: 'assets/char_herbert.png' },
  { name: 'GABO',    title: 'CO-FOUNDER & CTO',   power: 8, speed: 8, defense: 5, color: 0x2980b9, accentColor: 0x74b9ff, portrait: 'assets/char_gabo.png' },
  { name: 'AMANDA',  title: 'CO-FOUNDER & CRO',   power: 8, speed: 8, defense: 5, color: 0xe8735a, accentColor: 0xffb8b8, portrait: 'assets/char_amanda.png' },
  // ── Engineering ──
  { name: 'ARTURO',  title: 'TECH MANAGER',        power: 6, speed: 9, defense: 6, color: 0x2c3e50, accentColor: 0x95a5a6, portrait: 'assets/char_arturo.png' },
  { name: 'JAIME',   title: 'TECH LEAD',           power: 7, speed: 8, defense: 6, color: 0x1abc9c, accentColor: 0x76d7c4, portrait: 'assets/char_jaime.png' },
  { name: 'CHRIS',   title: 'BACKEND ENG LVL 3',  power: 6, speed: 9, defense: 6, color: 0xf39c12, accentColor: 0xffeaa7, portrait: 'assets/char_chris.png' },
  { name: 'KEVIN',   title: 'FULL STACK ENG',      power: 7, speed: 8, defense: 6, color: 0x0984e3, accentColor: 0x74b9ff, portrait: 'assets/char_kevin.png' },
  { name: 'LORENS',  title: 'BACKEND ENG',         power: 6, speed: 9, defense: 6, color: 0xe17055, accentColor: 0xfab1a0, portrait: 'assets/char_lorens.png' },
  { name: 'NELSON',  title: 'BACKEND ENG',         power: 7, speed: 8, defense: 6, color: 0x6c3483, accentColor: 0xaf7ac5, portrait: 'assets/char_nelson.png' },
  { name: 'ANDRÉS',  title: 'DEVOPS ENG',          power: 6, speed: 7, defense: 8, color: 0x117a65, accentColor: 0x52be80, portrait: 'assets/char_andres.png' },
  { name: 'JAVIER',  title: 'FRONTEND DEV',        power: 6, speed: 9, defense: 5, color: 0x34495e, accentColor: 0x85929e, portrait: 'assets/char_javier.png' },
  { name: 'GERARDO', title: 'LOW CODE ENG',        power: 6, speed: 7, defense: 7, color: 0xe74c3c, accentColor: 0xf1948a, portrait: 'assets/char_gerardo.png' },
  // ── Product ──
  { name: 'CARLO',   title: 'PRODUCT LEAD',        power: 8, speed: 7, defense: 6, color: 0x8e44ad, accentColor: 0xd7bde2, portrait: 'assets/char_carlo.png' },
  // ── Business ──
  { name: 'ESTEBAN', title: 'BIZ DEV ASSOC',       power: 8, speed: 8, defense: 5, color: 0xe67e22, accentColor: 0xf8c471, portrait: 'assets/char_esteban.png' },
  { name: 'FRANCISCO',title:'BUSINESS ANALYST',    power: 7, speed: 7, defense: 7, color: 0x6c5ce7, accentColor: 0xa29bfe, portrait: 'assets/char_francisco.png' },
  // ── Sales ──
  { name: 'HÉCTOR',  title: 'SALES MANAGER',       power: 8, speed: 7, defense: 6, color: 0x922b21, accentColor: 0xec7063, portrait: 'assets/char_hector.png' },
  { name: 'ALEX',    title: 'SALES EXEC',           power: 9, speed: 8, defense: 4, color: 0xd4ac0d, accentColor: 0xf9e79f, portrait: 'assets/char_alex.png' },
  // ── Operations ──
  { name: 'DANI',    title: 'OPERATIONS ANALYST',  power: 5, speed: 7, defense: 8, color: 0x27ae60, accentColor: 0xa9dfbf, portrait: 'assets/char_dani.png' },
  { name: 'YONG',    title: 'OPERATIONS MANAGER',  power: 6, speed: 7, defense: 8, color: 0x1a5276, accentColor: 0x5dade2, portrait: 'assets/char_yong.png' },
  // ── Finance ──
  { name: 'GERI',    title: 'ACCOUNTING MANAGER',  power: 5, speed: 6, defense: 9, color: 0xf1c40f, accentColor: 0xfcf3cf, portrait: 'assets/char_geri.png' },
  // ── People ──
  { name: 'MAX',     title: 'PEOPLE & CULTURE',    power: 7, speed: 7, defense: 7, color: 0x00b894, accentColor: 0x55efc4, portrait: 'assets/char_max.png' },
  // ── Marketing / Comms ──
  { name: 'ANDY',    title: 'MARKETING LEAD',      power: 8, speed: 8, defense: 5, color: 0xfd79a8, accentColor: 0xffb8d1, portrait: 'assets/char_andy.png' },
  { name: 'KAREN',   title: 'COMMS ANALYST',       power: 6, speed: 8, defense: 6, color: 0xfdcb6e, accentColor: 0xffeaa7, portrait: 'assets/char_karen.png' },
  // ── 🐬 Secret Boss ──
  { name: 'RADARÍN', title: 'CHIEF CULTURE OFF.',  power:10, speed:10, defense:10, color: 0x0099e5, accentColor: 0x00d2ff, portrait: 'assets/char_radarin.png' },
];

// ── Global state ─────────────────────────────────────────────
let app, currentScene = SCENES.MENU;
let textures = {};
window._textures = textures;
let sceneContainer = null;
let gameMode = '1P';  // '1P' or '2P'
let p1CharIdx = 0, p2CharIdx = 12;
const STAGES = ['bg_ixtapa', 'bg_vallebravo', 'bg_colchagua', 'bg_zapallar'];
let currentStage = null;

let audioCtx = null;
let musicNodes = [];
let bgmPlaying = false;
let musicSessionId = 0; // Incremented on every stopMusic to invalidate pending setTimeout callbacks

// ─── Loading bar helper ──────────────────────────────────────
function setLoading(pct, msg) {
  const bar = document.getElementById('loading-bar');
  const txt = document.getElementById('loading-text');
  if (bar) bar.style.width = pct + '%';
  if (txt) txt.textContent = msg || 'Loading...';
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
async function init() {
  app = new PIXI.Application();
  await app.init({
    resizeTo: window,
    backgroundColor: 0x000000,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });
  document.body.appendChild(app.canvas);

  setLoading(20, 'Loading backgrounds...');

  // Load all assets
  const assetList = [
    { alias: 'menu_bg',   src: 'assets/menu_bg.jpg' },
    { alias: 'select_bg', src: 'assets/select_bg.jpg' },
    { alias: 'bg',           src: 'assets/background.jpg' },
    { alias: 'bg_ixtapa',    src: 'assets/background.jpg' },
    { alias: 'bg_vallebravo',src: 'assets/bg_valle_bravo.jpg' },
    { alias: 'bg_colchagua', src: 'assets/bg_colchagua.jpg' },
    { alias: 'bg_zapallar',  src: 'assets/bg_zapallar.jpg' },
    ...CHARACTERS.map((c, i) => ({ alias: `char_${i}`, src: c.portrait })),
    // also load by name for direct reference
    // Animated sprite frames per character (base 3 poses)
    ...CHARACTERS.map((c, i) => {
      const n = c.portrait.replace('assets/char_', '').replace('.png', '');
      return [
        { alias: `spr_${i}_idle`, src: `assets/spr_${n}_idle.png` },
        { alias: `spr_${i}_atk`,  src: `assets/spr_${n}_atk.png`  },
        { alias: `spr_${i}_hit`,  src: `assets/spr_${n}_hit.png`  },
      ];
    }).flat(),
    // Extended sprite poses (only some characters have these — loading failures are silently ignored)
    ...CHARACTERS.map((c, i) => {
      const n = c.portrait.replace('assets/char_', '').replace('.png', '');
      return ['kick','block','special','win','ko','jump','crouch','throw','taunt','walk'].map(pose => (
        { alias: `spr_${i}_${pose}`, src: `assets/spr_${n}_${pose}.png` }
      ));
    }).flat(),
    // Animated frame variants (idle_f0/f1/f2, walk_f0/f1)
    ...CHARACTERS.map((c, i) => {
      const n = c.portrait.replace('assets/char_', '').replace('.png', '');
      return [
        { alias: `spr_${i}_idle_f0`, src: `assets/spr_${n}_idle_f0.png` },
        { alias: `spr_${i}_idle_f1`, src: `assets/spr_${n}_idle_f1.png` },
        { alias: `spr_${i}_idle_f2`, src: `assets/spr_${n}_idle_f2.png` },
        { alias: `spr_${i}_walk_f0`, src: `assets/spr_${n}_walk_f0.png` },
        { alias: `spr_${i}_walk_f1`, src: `assets/spr_${n}_walk_f1.png` },
      ];
    }).flat(),
  ];

  let loaded = 0;
  for (const asset of assetList) {
    try {
      PIXI.Assets.add(asset);
    } catch(e) {}
    try {
      textures[asset.alias] = await PIXI.Assets.load(asset.src);
    } catch(e) {
      console.warn('Could not load:', asset.src);
    }
    loaded++;
    setLoading(20 + (loaded / assetList.length) * 70, `Loading ${asset.alias}...`);
  }

  setLoading(100, 'Ready!');
  await new Promise(r => setTimeout(r, 300));

  // Hide loading screen
  const ls = document.getElementById('loading-screen');
  if (ls) ls.style.display = 'none';

  // Start music
  initAudio();

  // Start with menu
  showScene(SCENES.MENU);
}

// ═══════════════════════════════════════════════════════════
// AUDIO (Web Audio API 8-bit chiptune)
// ═══════════════════════════════════════════════════════════
function initAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) {
    console.warn('Web Audio not available');
  }
}

function resumeAudio() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      // If music wasn't playing because context was suspended, start it now
      if (!bgmPlaying && currentScene) {
        switch (currentScene) {
          case SCENES.MENU:
          case SCENES.CHARACTER_SELECT:
            playMenuMusic();
            break;
          case SCENES.FIGHT:
            playFightMusic();
            break;
          // GAME_OVER starts its own music in playVictoryMusic
        }
      }
    });
  }
}

function stopMusic() {
  musicSessionId++; // Invalidate all pending scheduleNote callbacks
  musicNodes.forEach(n => {
    try { n.stop(); } catch(e) {}
    try { n.disconnect(); } catch(e) {}
  });
  musicNodes = [];
  bgmPlaying = false;
}

function playMenuMusic() {
  if (!audioCtx || bgmPlaying) return;
  resumeAudio();
  // Don't start music if AudioContext is suspended (will be started on user gesture)
  if (audioCtx.state === 'suspended') return;
  bgmPlaying = true;
  const mySession = musicSessionId; // Capture session at start

  // Simple 8-bit melody
  const notes = [
    523.25, 587.33, 659.25, 698.46, 783.99, 880,
    783.99, 698.46, 659.25, 587.33, 523.25, 493.88,
    440, 493.88, 523.25, 587.33
  ];
  const noteDur = 0.15;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
  gain.connect(audioCtx.destination);
  musicNodes.push(gain);

  let t = audioCtx.currentTime;
  let step = 0;

  function scheduleNote() {
    // Stop if music was stopped OR a new music session started
    if (!bgmPlaying || musicSessionId !== mySession) return;
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(notes[step % notes.length], t);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + noteDur * 0.9);
    musicNodes.push(osc);
    t += noteDur;
    step++;
    // Clean up old nodes
    if (musicNodes.length > 32) musicNodes.splice(0, 16);
    if (bgmPlaying && musicSessionId === mySession) setTimeout(scheduleNote, (noteDur * 1000) * 0.5);
  }
  scheduleNote();
}

function playVictoryMusic(onDone) {
  stopMusic();
  if (!audioCtx) { if (onDone) setTimeout(onDone, 2500); return; }
  resumeAudio();
  bgmPlaying = true;
  const mySession = musicSessionId;

  // Short triumphant fanfare: rising scale → resolve
  const fanfare = [523, 659, 784, 1047, 784, 1047, 1319, 1047, 1319];
  const noteDur = 0.14;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
  gain.connect(audioCtx.destination);
  musicNodes.push(gain);

  let t = audioCtx.currentTime + 0.3; // small delay
  fanfare.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, t);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + noteDur * 0.8);
    musicNodes.push(osc);
    t += noteDur;
  });

  const totalDur = (fanfare.length * noteDur + 0.3) * 1000;
  setTimeout(() => {
    if (musicSessionId !== mySession) return; // aborted
    stopMusic();
    if (onDone) onDone();
  }, totalDur + 600);
}

function playFightMusic() {
  stopMusic();
  if (!audioCtx) return;
  resumeAudio();
  // Don't start music if AudioContext is suspended
  if (audioCtx.state === 'suspended') return;
  bgmPlaying = true;
  const mySession = musicSessionId; // Capture session AFTER stopMusic incremented it

  const fightNotes = [
    220, 246.94, 261.63, 220, 196, 220, 246.94, 261.63,
    293.66, 261.63, 246.94, 220, 196, 174.61, 196, 220
  ];
  const noteDur = 0.12;
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
  gain.connect(audioCtx.destination);
  musicNodes.push(gain);

  let t = audioCtx.currentTime;
  let step = 0;

  function scheduleNote() {
    // Stop if music was stopped OR a new music session started
    if (!bgmPlaying || musicSessionId !== mySession) return;
    const osc = audioCtx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(fightNotes[step % fightNotes.length], t);
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + noteDur * 0.85);
    musicNodes.push(osc);
    t += noteDur;
    step++;
    if (musicNodes.length > 32) musicNodes.splice(0, 16);
    if (bgmPlaying && musicSessionId === mySession) setTimeout(scheduleNote, (noteDur * 1000) * 0.5);
  }
  scheduleNote();
}

function playSFX(type) {
  if (!audioCtx) return;
  resumeAudio();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);

  const t = audioCtx.currentTime;
  if (type === 'punch') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.start(t); osc.stop(t + 0.1);
  } else if (type === 'special') {
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.2);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    osc.start(t); osc.stop(t + 0.3);
  } else if (type === 'ko') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(330, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.6);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.start(t); osc.stop(t + 0.7);
  } else if (type === 'select') {
    osc.type = 'square';
    osc.frequency.setValueAtTime(660, t);
    osc.frequency.setValueAtTime(880, t + 0.05);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.start(t); osc.stop(t + 0.15);
  }
}

// ═══════════════════════════════════════════════════════════
// SCENE MANAGEMENT
// ═══════════════════════════════════════════════════════════
function showScene(scene) {
  stopMusic(); // Always stop music on scene change to prevent overlapping tracks
  if (sceneContainer) {
    app.stage.removeChild(sceneContainer);
    sceneContainer.destroy({ children: true });
  }
  // Reset any lingering screen shake from fight scene
  app.stage.position.set(0, 0);
  sceneContainer = new PIXI.Container();
  app.stage.addChild(sceneContainer);
  currentScene = scene;

  switch (scene) {
    case SCENES.MENU:            buildMenuScene(sceneContainer); break;
    case SCENES.CHARACTER_SELECT: buildSelectScene(sceneContainer); break;
    case SCENES.FIGHT:           buildFightScene(sceneContainer); break;
    case SCENES.GAME_OVER:       buildGameOverScene(sceneContainer); break;
  }
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function W() { return app.screen.width; }
function H() { return app.screen.height; }

function makeText(str, opts = {}) {
  return new PIXI.Text({
    text: str,
    style: {
      fontFamily: opts.font || "'Press Start 2P', monospace",
      fontSize: opts.size || 16,
      fill: opts.color !== undefined ? opts.color : 0xffffff,
      align: opts.align || 'center',
      stroke: opts.stroke ? { color: opts.strokeColor || 0x000000, width: opts.strokeWidth || 4 } : undefined,
      dropShadow: opts.shadow ? {
        color: opts.shadowColor || 0x000000,
        blur: opts.shadowBlur || 4,
        distance: opts.shadowDist || 4,
        angle: Math.PI / 4,
        alpha: 0.8,
      } : undefined,
      wordWrap: opts.wordWrap || false,
      wordWrapWidth: opts.wrapWidth || 400,
    }
  });
}

function makeGlowText(str, size, color) {
  const container = new PIXI.Container();

  // Glow layers
  for (let i = 3; i >= 1; i--) {
    const glow = makeText(str, { size, color, shadow: true, shadowColor: color, shadowBlur: 8 * i, shadowDist: 0 });
    glow.anchor.set(0.5);
    glow.alpha = 0.3 / i;
    container.addChild(glow);
  }

  // Main text
  const main = makeText(str, { size, color, stroke: true, strokeColor: 0x000000, strokeWidth: 3 });
  main.anchor.set(0.5);
  container.addChild(main);

  return container;
}

function fillScreen(container, texture) {
  if (!texture) return;
  const bg = new PIXI.Sprite(texture);
  bg.width = W();
  bg.height = H();
  container.addChild(bg);
  // Keep scaled on resize
  app.renderer.on?.('resize', () => {
    bg.width = W();
    bg.height = H();
  });
  return bg;
}

function makeButton(label, x, y, w, h, opts = {}) {
  const container = new PIXI.Container();
  container.x = x;
  container.y = y;
  container.interactive = true;
  container.cursor = 'pointer';

  const bg = new PIXI.Graphics();
  const color = opts.color || 0x111133;
  const borderColor = opts.border || 0x00ffcc;

  function drawBg(hover) {
    bg.clear();
    bg.roundRect(-w/2, -h/2, w, h, 8);
    bg.fill({ color: hover ? borderColor : color, alpha: hover ? 0.9 : 0.7 });
    bg.stroke({ color: borderColor, width: 2 });
  }
  drawBg(false);
  container.addChild(bg);

  const txt = makeText(label, { size: opts.fontSize || 12, color: opts.textColor !== undefined ? opts.textColor : (opts.color ? 0xffffff : 0x00ffcc) });
  txt.anchor.set(0.5);
  container.addChild(txt);

  container.on('pointerover', () => { drawBg(true); txt.style.fill = opts.color ? 0x000000 : 0x000000; });
  container.on('pointerout',  () => { drawBg(false); txt.style.fill = opts.textColor !== undefined ? opts.textColor : 0x00ffcc; });

  return container;
}

// ═══════════════════════════════════════════════════════════
// SCENE: MENU
// ═══════════════════════════════════════════════════════════
function buildMenuScene(container) {
  // Always clean state before starting menu music — prevents silent menu if bgmPlaying was stale
  stopMusic();
  playMenuMusic();

  // Background with parallax
  const bg = fillScreen(container, textures['menu_bg']);
  let bgOffX = 0;

  // Particle layer
  const particles = [];
  const particleLayer = new PIXI.Container();
  container.addChild(particleLayer);

  for (let i = 0; i < 40; i++) {
    const g = new PIXI.Graphics();
    const r = Math.random() * 3 + 1;
    g.circle(0, 0, r).fill({ color: Math.random() > 0.5 ? 0x00ffcc : 0xff44aa, alpha: 0.8 });
    g.x = Math.random() * W();
    g.y = Math.random() * H();
    g.alpha = Math.random() * 0.6 + 0.2;
    particleLayer.addChild(g);
    particles.push({ sprite: g, vx: (Math.random() - 0.5) * 0.5, vy: -Math.random() * 0.8 - 0.2, life: Math.random() });
  }

  // Dark overlay for readability
  const overlay = new PIXI.Graphics();
  overlay.rect(0, 0, W(), H()).fill({ color: 0x000000, alpha: 0.45 });
  container.addChild(overlay);

  // Title: STREET BRAWLER
  const titleContainer = new PIXI.Container();
  titleContainer.x = W() / 2;
  titleContainer.y = H() * 0.22;
  container.addChild(titleContainer);

  const titleSize = Math.min(Math.floor(W() / 18), 48);
  const titleGlow = makeGlowText('RADAR FIGHTERS', titleSize, 0x00ffcc);
  titleContainer.addChild(titleGlow);

  // Subtitle
  const subtitle = makeText('RADAR FIGHTING CHAMPIONSHIP', {
    size: Math.max(8, Math.floor(W() / 70)),
    color: 0xff44aa,
    shadow: true, shadowColor: 0xff44aa, shadowBlur: 6
  });
  subtitle.anchor.set(0.5);
  subtitle.y = titleSize * 1.4;
  titleContainer.addChild(subtitle);

  // Press Start blinking
  const pressStart = makeText('PRESS START', {
    size: Math.max(8, Math.floor(W() / 65)),
    color: 0xffff00,
    shadow: true, shadowColor: 0xffaa00, shadowBlur: 8
  });
  pressStart.anchor.set(0.5);
  pressStart.x = W() / 2;
  pressStart.y = H() * 0.46;
  container.addChild(pressStart);

  // Buttons
  const btnW = Math.min(280, W() * 0.4);
  const btnH = 44;
  const btnX = W() / 2;
  const btnStartY = H() * 0.57;
  const btnGap = btnH + 14;

  const btn1P = makeButton('1 PLAYER VS AI', btnX, btnStartY, btnW, btnH);
  const btn2P = makeButton('2 PLAYERS', btnX, btnStartY + btnGap, btnW, btnH);
  const btnQuick = makeButton('⚔ QUICK FIGHT', btnX, btnStartY + btnGap * 2, btnW, btnH, { color: 0x003322, border: 0x00ffaa, textColor: 0x00ffaa });
  const btnAbout = makeButton('ABOUT', btnX, btnStartY + btnGap * 3, btnW * 0.6, btnH, { color: 0x221133, border: 0xbb44ff });

  container.addChild(btn1P, btn2P, btnQuick, btnAbout);

  btn1P.on('pointertap', () => { document.removeEventListener('keydown', keyHandler); playSFX('select'); gameMode = '1P'; flashTransition(() => showScene(SCENES.CHARACTER_SELECT)); });
  btn2P.on('pointertap', () => { document.removeEventListener('keydown', keyHandler); playSFX('select'); gameMode = '2P'; flashTransition(() => showScene(SCENES.CHARACTER_SELECT)); });
  btnQuick.on('pointertap', () => {
    document.removeEventListener('keydown', keyHandler);
    playSFX('select');
    gameMode = '1P';
    p1CharIdx = Math.floor(Math.random() * CHARACTERS.length);
    p2CharIdx = Math.floor(Math.random() * CHARACTERS.length);
    if (p2CharIdx === p1CharIdx) p2CharIdx = (p1CharIdx + 1) % CHARACTERS.length;
    flashTransition(() => showScene(SCENES.FIGHT));
  });
  btnAbout.on('pointertap', () => showAboutModal(container));

  // Also press any key to start
  const keyHandler = (e) => {
    if (['Enter', ' ', 'a', 'A'].includes(e.key)) {
      document.removeEventListener('keydown', keyHandler);
      playSFX('select');
      gameMode = '1P';
      flashTransition(() => showScene(SCENES.CHARACTER_SELECT));
    }
  };
  document.addEventListener('keydown', keyHandler);

  // Version tag
  const ver = makeText('RADAR FIGHTERS v1.0 © 2026', { size: 8, color: 0x444444 });
  ver.x = 8; ver.y = H() - 18;
  container.addChild(ver);

  // Animate
  const ticker = (tk) => {
    if (currentScene !== SCENES.MENU) { app.ticker.remove(ticker); return; }

    // Background stays static (no parallax drift)

    // Particles
    particles.forEach(p => {
      p.sprite.x += p.vx;
      p.sprite.y += p.vy;
      p.life += 0.005;
      if (p.sprite.y < -10 || p.life > 1) {
        p.sprite.x = Math.random() * W();
        p.sprite.y = H() + 5;
        p.life = 0;
      }
    });

    // Blink press start
    pressStart.alpha = 0.5 + Math.sin(Date.now() / 400) * 0.5;

    // Title pulse
    titleContainer.scale.set(1 + Math.sin(Date.now() / 2000) * 0.015);
  };
  app.ticker.add(ticker);
}

function showAboutModal(container) {
  const modal = new PIXI.Container();
  modal.interactive = true;

  const overlay = new PIXI.Graphics();
  overlay.rect(0, 0, W(), H()).fill({ color: 0x000000, alpha: 0.8 });
  modal.addChild(overlay);

  const panel = new PIXI.Graphics();
  const pw = Math.min(560, W() * 0.9);
  const ph = 320;
  panel.roundRect(W()/2 - pw/2, H()/2 - ph/2, pw, ph, 12);
  panel.fill({ color: 0x0a0a1a }).stroke({ color: 0x00ffcc, width: 2 });
  modal.addChild(panel);

  const lines = [
    { text: 'RADAR FIGHTERS v4', size: 14, color: 0x00ffcc, y: -90 },
    { text: 'Built with PixiJS v8 + DALL-E', size: 9, color: 0xffffff, y: -55 },
    { text: 'WebGL Renderer · 60fps', size: 9, color: 0xffffff, y: -35 },
    { text: 'Controls (P1):', size: 9, color: 0xffff00, y: -10 },
    { text: 'A/D move  W jump', size: 7, color: 0xaaaaaa, y: 10 },
    { text: 'U/I/O = LP/MP/HP   J/K/L = LK/MK/HK', size: 6, color: 0x88aaff, y: 28 },
    { text: 'Controls (P2):', size: 9, color: 0xffff00, y: 50 },
    { text: '←/→ move  ↑ jump', size: 7, color: 0xaaaaaa, y: 68 },
    { text: '7/8/9 = LP/MP/HP   4/5/6 = LK/MK/HK', size: 6, color: 0xff8866, y: 86 },
    { text: '[ TAP TO CLOSE ]', size: 9, color: 0xff44aa, y: 110 },
  ];

  lines.forEach(l => {
    const t = makeText(l.text, { size: l.size, color: l.color });
    t.anchor.set(0.5);
    t.x = W() / 2;
    t.y = H() / 2 + l.y;
    modal.addChild(t);
  });

  container.addChild(modal);
  overlay.interactive = true;
  overlay.on('pointertap', () => container.removeChild(modal));
}

function flashTransition(callback) {
  const flash = new PIXI.Graphics();
  flash.rect(0, 0, W(), H()).fill({ color: 0xffffff, alpha: 1 });
  flash.alpha = 1;
  app.stage.addChild(flash);

  callback();

  let alpha = 1;
  const fadeOut = (tk) => {
    alpha -= tk.deltaTime * 0.08;
    flash.alpha = alpha;
    if (alpha <= 0) {
      app.stage.removeChild(flash);
      app.ticker.remove(fadeOut);
    }
  };
  app.ticker.add(fadeOut);
}

// ═══════════════════════════════════════════════════════════
// SCENE: CHARACTER SELECT
// ═══════════════════════════════════════════════════════════
function buildSelectScene(container) {
  stopMusic();
  playMenuMusic();

  fillScreen(container, textures['select_bg']);

  // Dark overlay
  const overlay = new PIXI.Graphics();
  overlay.rect(0, 0, W(), H()).fill({ color: 0x000000, alpha: 0.5 });
  container.addChild(overlay);

  // Title
  const title = makeText('SELECT FIGHTER', {
    size: Math.min(Math.floor(W() / 30), 28),
    color: 0xffff00,
    shadow: true, shadowColor: 0xff8800, shadowBlur: 10
  });
  title.anchor.set(0.5);
  title.x = W() / 2;
  title.y = H() * 0.06;
  container.addChild(title);

  // P1/P2 instructions
  const p1inst = makeText(gameMode === '2P' ? 'P1: A/D + ENTER' : 'Pick your fighter, then your rival', { size: 8, color: 0x4488ff });
  p1inst.anchor.set(0.5); p1inst.x = W() * 0.25; p1inst.y = H() * 0.12;
  container.addChild(p1inst);

  if (gameMode === '2P') {
    const p2inst = makeText('P2: ←/→ + L', { size: 8, color: 0xff4444 });
    p2inst.anchor.set(0.5); p2inst.x = W() * 0.75; p2inst.y = H() * 0.12;
    container.addChild(p2inst);
  }

  // Grid of character cards — 6×4 for 24 characters
  const cols = 6, rows = Math.ceil(CHARACTERS.length / 6);
  const cardMargin = Math.floor(W() * 0.012);
  const gridW = W() * 0.94;
  const gridH = H() * 0.72;
  const cardW = (gridW - cardMargin * (cols - 1)) / cols;
  const cardH = (gridH - cardMargin * (rows - 1)) / rows;
  const gridX = (W() - gridW) / 2;
  const gridY = H() * 0.15;

  let p1Hover = p1CharIdx, p2Hover = p2CharIdx;
  let p1Selected = -1, p2Selected = -1;

  const cards = [];
  const cardLayer = new PIXI.Container();
  container.addChild(cardLayer);

  CHARACTERS.forEach((char, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const cx = gridX + col * (cardW + cardMargin) + cardW / 2;
    const cy = gridY + row * (cardH + cardMargin) + cardH / 2;

    const card = new PIXI.Container();
    card.x = cx; card.y = cy;
    card.interactive = true;
    card.cursor = 'pointer';
    cardLayer.addChild(card);

    const bg = new PIXI.Graphics();
    card.addChild(bg);

    // Portrait image
    let portrait = null;
    if (textures[`char_${i}`]) {
      portrait = new PIXI.Sprite(textures[`char_${i}`]);
      portrait.anchor.set(0.5);
      portrait.width = cardW * 0.8;
      portrait.height = cardH * 0.7;
      portrait.y = -cardH * 0.05;
      card.addChild(portrait);
    }

    // Name
    const nameText = makeText(char.name, { size: Math.max(7, Math.floor(cardW / 10)), color: 0xffffff, stroke: true, strokeColor: 0x000000, strokeWidth: 3 });
    nameText.anchor.set(0.5);
    nameText.y = cardH * 0.36;
    card.addChild(nameText);

    function redraw(hover, p1sel, p2sel) {
      bg.clear();
      const isP1Sel = p1sel === i, isP2Sel = p2sel === i;
      const isP1Hov = p1Hover === i, isP2Hov = gameMode === '2P' && p2Hover === i;

      let borderColor = 0x444466, alpha = 0.5;
      if (isP1Sel) { borderColor = 0x4488ff; alpha = 0.85; }
      if (isP2Sel) { borderColor = 0xff4444; alpha = 0.85; }
      if (isP1Hov && !isP1Sel) { borderColor = 0x88aaff; alpha = 0.7; }
      if (isP2Hov && !isP2Sel) { borderColor = 0xff8888; alpha = 0.7; }

      bg.roundRect(-cardW/2, -cardH/2, cardW, cardH, 8);
      bg.fill({ color: char.color, alpha });
      bg.stroke({ color: borderColor, width: isP1Sel || isP2Sel ? 4 : 2 });

      // Dual selection: split border
      if (isP1Sel && isP2Sel) {
        bg.roundRect(-cardW/2, -cardH/2, cardW/2, cardH, 4);
        bg.stroke({ color: 0x4488ff, width: 3 });
        bg.roundRect(0, -cardH/2, cardW/2, cardH, 4);
        bg.stroke({ color: 0xff4444, width: 3 });
      }

      // P1/P2 indicator badges
      if (isP1Sel || isP1Hov) {
        bg.roundRect(-cardW/2 + 4, -cardH/2 + 4, 22, 16, 4);
        bg.fill({ color: 0x4488ff, alpha: 0.9 });
      }
      if (isP2Sel || isP2Hov) {
        bg.roundRect(cardW/2 - 26, -cardH/2 + 4, 22, 16, 4);
        bg.fill({ color: 0xff4444, alpha: 0.9 });
      }
    }
    redraw(false, p1Selected, p2Selected);
    cards.push({ card, redraw, portrait });

    // Hover / click
    card.on('pointerover', () => {
      p1Hover = i;
      if (gameMode === '2P') p2Hover = i; // simplify: both hover same for mouse
      updateCards();
      updatePreview();
    });
    card.on('pointertap', () => {
      playSFX('select');
      if (p1Selected === -1) {
        p1Selected = i;
      } else if (p2Selected === -1 && i !== p1Selected) {
        p2Selected = i;
      } else {
        // Reset and start over with new P1 pick
        p1Selected = i;
        p2Selected = -1;
      }
      updateCards();
      updatePreview();
      checkFightReady();
    });
  });

  function updateCards() {
    cards.forEach((c, i) => c.redraw(false, p1Selected, p2Selected));
  }

  // Preview panel
  const previewPanel = new PIXI.Container();
  previewPanel.y = H() * 0.88;
  container.addChild(previewPanel);

  let p1PreviewSprite = null, p2PreviewSprite = null;
  let p1PreviewName = null, p2PreviewName = null;

  function updatePreview() {
    previewPanel.removeChildren();

    const ph = H() * 0.11;
    const pw = W() * 0.8;
    const panelBg = new PIXI.Graphics();
    panelBg.roundRect(W() * 0.1, 0, pw, ph, 10);
    panelBg.fill({ color: 0x050510, alpha: 0.8 });
    panelBg.stroke({ color: 0x333366, width: 1 });
    previewPanel.addChild(panelBg);

    const selIdx1 = p1Selected >= 0 ? p1Selected : p1Hover;
    const selIdx2 = p2Selected >= 0 ? p2Selected : p2Hover;

    const char1 = CHARACTERS[selIdx1];
    const char2 = CHARACTERS[selIdx2];

    // P1 side
    drawPreviewChar(previewPanel, char1, selIdx1, W() * 0.22, ph * 0.5, 1, 0x4488ff);
    // P2 side
    drawPreviewChar(previewPanel, char2, selIdx2, W() * 0.78, ph * 0.5, -1, 0xff4444);

    // VS text
    const vs = makeText('VS', { size: Math.max(14, Math.floor(ph / 5)), color: 0xffff00, shadow: true, shadowColor: 0xff8800, shadowBlur: 8 });
    vs.anchor.set(0.5);
    vs.x = W() / 2;
    vs.y = ph * 0.4;
    previewPanel.addChild(vs);

    // Stats for P1
    drawStats(previewPanel, char1, W() * 0.15, ph * 0.1, 1);
    drawStats(previewPanel, char2, W() * 0.85, ph * 0.1, -1);
  }

  function drawPreviewChar(panel, char, idx, x, y, dir, labelColor) {
    if (!textures[`char_${idx}`]) return;
    const size = Math.min(H() * 0.14, 80);
    const sprite = new PIXI.Sprite(textures[`char_${idx}`]);
    sprite.anchor.set(0.5);
    sprite.width = size;
    sprite.height = size;
    sprite.x = x;
    sprite.y = y - size * 0.1;
    sprite.scale.x *= dir;
    panel.addChild(sprite);

    const name = makeText(char.name, { size: 8, color: labelColor });
    name.anchor.set(0.5);
    name.x = x;
    name.y = y + size * 0.6;
    panel.addChild(name);
  }

  function drawStats(panel, char, x, y, dir) {
    const labels = ['PWR', 'SPD', 'DEF'];
    const vals = [char.power, char.speed, char.defense];
    const barW = W() * 0.12;
    const colors = [0xff4444, 0x44ff88, 0x4488ff];

    labels.forEach((lbl, i) => {
      const ly = y + i * 22;
      const lt = makeText(lbl, { size: 7, color: 0x888888 });
      lt.anchor.set(dir > 0 ? 0 : 1, 0);
      lt.x = dir > 0 ? x + 5 : x - 5;
      lt.y = ly;
      panel.addChild(lt);

      const bgBar = new PIXI.Graphics();
      const bx = dir > 0 ? x + 35 : x - 35 - barW;
      bgBar.rect(bx, ly, barW, 8).fill({ color: 0x222222 });
      bgBar.rect(bx, ly, barW * vals[i] / 10, 8).fill({ color: colors[i] });
      panel.addChild(bgBar);
    });
  }

  updatePreview();

  // FIGHT button
  const fightBtn = makeButton('⚔ FIGHT!', W() / 2, H() * 0.93, 200, 44, { color: 0x440000, border: 0xff4422, textColor: 0xff4422 });
  fightBtn.alpha = 0.4;
  container.addChild(fightBtn);

  function checkFightReady() {
    const ready = p1Selected >= 0 && p2Selected >= 0;
    fightBtn.alpha = ready ? 1 : 0.4;
    fightBtn.interactive = ready;
  }

  fightBtn.on('pointertap', () => {
    const ready = p1Selected >= 0 && p2Selected >= 0;
    if (!ready) return;
    p1CharIdx = p1Selected;
    p2CharIdx = p2Selected;
    playSFX('select');
    document.removeEventListener('keydown', keydown);
    flashTransition(() => showScene(SCENES.FIGHT));
  });

  // Keyboard navigation
  const keys = {};
  const keydown = (e) => {
    keys[e.key] = true;

    // P1 navigation: A/D
    if (e.key === 'a' || e.key === 'A') {
      p1Hover = (p1Hover - 1 + CHARACTERS.length) % CHARACTERS.length;
      updateCards(); updatePreview();
    }
    if (e.key === 'd' || e.key === 'D') {
      p1Hover = (p1Hover + 1) % CHARACTERS.length;
      updateCards(); updatePreview();
    }
    if (e.key === 'Enter') {
      playSFX('select');
      if (p1Selected === -1) {
        p1Selected = p1Hover;
      } else if (p2Selected === -1 && p1Hover !== p1Selected) {
        p2Selected = p1Hover;
      } else {
        // Reset selection
        p1Selected = p1Hover;
        p2Selected = -1;
      }
      updateCards(); updatePreview(); checkFightReady();
    }

    // P2 navigation: arrow keys
    if (e.key === 'ArrowLeft')  { p2Hover = (p2Hover - 1 + CHARACTERS.length) % CHARACTERS.length; updateCards(); updatePreview(); }
    if (e.key === 'ArrowRight') { p2Hover = (p2Hover + 1) % CHARACTERS.length; updateCards(); updatePreview(); }
    if (e.key === 'l' || e.key === 'L') {
      if (gameMode === '2P') {
        playSFX('select');
        p2Selected = p2Hover;
        updateCards(); updatePreview(); checkFightReady();
      }
    }

    // Auto-start with FIGHT button if both selected
    if (e.key === 'f' || e.key === 'F') {
      const ready = p1Selected >= 0 && p2Selected >= 0;
      if (ready) {
        p1CharIdx = p1Selected;
        p2CharIdx = p2Selected;
        playSFX('select');
        document.removeEventListener('keydown', keydown);
        flashTransition(() => showScene(SCENES.FIGHT));
      }
    }

    if (e.key === 'Escape' || e.key === 'Backspace') {
      document.removeEventListener('keydown', keydown);
      showScene(SCENES.MENU);
    }
  };
  document.addEventListener('keydown', keydown);

}

// ═══════════════════════════════════════════════════════════
// SCENE: FIGHT
// ═══════════════════════════════════════════════════════════
function buildFightScene(container) {
  // playFightMusic() already calls stopMusic() — don't call it twice
  playFightMusic();

  const char1def = CHARACTERS[p1CharIdx];
  const char2def = CHARACTERS[p2CharIdx];

  // Background
  if (!currentStage) currentStage = STAGES[Math.floor(Math.random() * STAGES.length)];
  const bg = fillScreen(container, textures[currentStage]);
  currentStage = null; // reset so next fight picks randomly

  // Ground line visual
  const groundDecor = new PIXI.Graphics();
  const groundY = H() * 0.82;
  groundDecor.rect(0, groundY, W(), H() - groundY).fill({ color: 0x111118, alpha: 0.4 });
  container.addChild(groundDecor);

  // ── Game state ──────────────────────────────────────────
  const GROUND = groundY;
  const FIGHTER_H = Math.min(H() * 0.22, 130);
  const FIGHTER_W = FIGHTER_H * 0.45;

  // Shake state
  let shakeX = 0, shakeY = 0, shakeAmt = 0;

  function triggerShake(amount) {
    shakeAmt = Math.max(shakeAmt, amount);
  }

  function applyStats(fighter, chardef) {
    fighter.speedMult = 0.5 + chardef.speed * 0.1;
    fighter.damageMult = 0.5 + chardef.power * 0.1;
    fighter.defenseMult = 1.5 - chardef.defense * 0.1;
  }

  // ── Fighters ─────────────────────────────────────────────
  function createFighter(chardef, startX, dir) {
    const f = {
      x: startX, y: GROUND,
      vx: 0, vy: 0,
      dir: dir,    // 1 = right, -1 = left
      hp: MAX_HP,
      state: 'idle',  // idle, run, jump, attack, special, hit, ko
      attackTimer: 0,
      attackCd: 0,
      specialCd: 0,
      hitStun: 0,
      speedMult: 1,
      damageMult: 1,
      defenseMult: 1,
      blocking: false,
      isAI: false,
      aiTimer: 0,
      chardef,
      faceTexture: null,
      hitEffects: [],
      container: null,
      bodyGfx: null,
      faceSprite: null,
      shadowGfx: null,
    };
    applyStats(f, chardef);
    return f;
  }

  let p1 = createFighter(char1def, W() * 0.25, 1);
  p1.faceTexture = textures[`char_${p1CharIdx}`];
  let p2 = createFighter(char2def, W() * 0.75, -1);
  p2.faceTexture = textures[`char_${p2CharIdx}`];
  p2.isAI = (gameMode === '1P');

  // Build sprite containers
  const fightLayer = new PIXI.Container();
  container.addChild(fightLayer);

  function buildFighterSprite(fighter) {
    const cont = new PIXI.Container();
    fightLayer.addChild(cont);
    fighter.container = cont;

    // Shadow
    const shadow = new PIXI.Graphics();
    shadow.ellipse(0, 0, FIGHTER_H * 0.21, 10).fill({ color: 0x000000, alpha: 0.4 });
    shadow.y = 4;
    cont.addChild(shadow);
    fighter.shadowGfx = shadow;

    // Main sprite — the full DALL-E portrait scaled to fighter height
    if (fighter.faceTexture) {
      // Enable nearest-neighbor filtering for crisp pixel art
      fighter.faceTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

      const spr = new PIXI.Sprite(fighter.faceTexture);
      spr.anchor.set(0.5, 1); // anchor bottom-center
      const baseScaleY = FIGHTER_H / fighter.faceTexture.height;
      const baseScaleX = (FIGHTER_H * 0.75) / fighter.faceTexture.width;
      spr.scale.set(baseScaleX, baseScaleY);
      spr.y = 0;
      fighter._baseScaleX = baseScaleX;
      fighter._baseScaleY = baseScaleY;

      cont.addChild(spr);
      fighter.mainSprite = spr;
      fighter.outlineSprite = null;

      // Store animated frames
      const idx = CHARACTERS.indexOf(fighter.chardef);
      fighter._texIdle = textures[`spr_${idx}_idle`] || fighter.faceTexture;
      fighter._texAtk  = textures[`spr_${idx}_atk`]  || fighter.faceTexture;
      fighter._texHit  = textures[`spr_${idx}_hit`]  || fighter.faceTexture;
      // Extended poses (fallback to base textures if not available)
      fighter._texKick    = textures[`spr_${idx}_kick`]    || fighter._texAtk;
      fighter._texBlock   = textures[`spr_${idx}_block`]   || fighter._texIdle;
      fighter._texSpecial = textures[`spr_${idx}_special`] || fighter._texAtk;
      fighter._texWin     = textures[`spr_${idx}_win`]     || fighter._texIdle;
      fighter._texKo      = textures[`spr_${idx}_ko`]      || fighter._texHit;
      fighter._texJump    = textures[`spr_${idx}_jump`]    || fighter._texIdle;
      fighter._texCrouch  = textures[`spr_${idx}_crouch`]  || fighter._texIdle;
      fighter._texThrow   = textures[`spr_${idx}_throw`]   || fighter._texAtk;
      fighter._texTaunt   = textures[`spr_${idx}_taunt`]   || fighter._texIdle;
      fighter._texWalk    = textures[`spr_${idx}_walk`]    || fighter._texIdle;
      // Animated frame arrays (for cycling idle/walk)
      const idleF0 = textures[`spr_${idx}_idle_f0`];
      const idleF1 = textures[`spr_${idx}_idle_f1`];
      const idleF2 = textures[`spr_${idx}_idle_f2`];
      fighter._idleFrames = (idleF0 && idleF1 && idleF2)
        ? [idleF0, idleF1, idleF0, idleF2]  // ping-pong: 0→1→0→2
        : null;
      const walkF0 = textures[`spr_${idx}_walk_f0`];
      const walkF1 = textures[`spr_${idx}_walk_f1`];
      fighter._walkFrames = (walkF0 && walkF1)
        ? [walkF0, walkF1]
        : null;
      fighter._animFrame = 0;
      fighter._animTimer = 0;
      fighter._lastAtkIsKick = false;
    }

    // Color aura ring (glows during special)
    const aura = new PIXI.Graphics();
    aura.ellipse(0, -FIGHTER_H * 0.5, FIGHTER_H * 0.41, FIGHTER_H * 0.55).fill({ color: fighter.chardef.color, alpha: 0 });
    cont.addChild(aura);
    fighter.auraGfx = aura;

    // bodyGfx kept as empty Graphics for hit flash overlays
    const body = new PIXI.Graphics();
    cont.addChild(body);
    fighter.bodyGfx = body;
  }

  function drawFighterBody(fighter) {
    if (!fighter.mainSprite) return;
    const spr = fighter.mainSprite;
    const aura = fighter.auraGfx;
    const gfx = fighter.bodyGfx;
    const t = Date.now() / 1000;
    const bx = fighter._baseScaleX || 1;
    const by = fighter._baseScaleY || 1;
    // NOTE: container already handles flip via scale.x = dir, so sprite uses +bx always

    // ── Swap sprite frame based on state ──────────────────
    if (fighter._texIdle) {
      let wantTex;
      let useFrameCycle = false;

      switch (fighter.state) {
        case 'attack':
          wantTex = fighter._lastAtkIsKick ? fighter._texKick : fighter._texAtk;
          break;
        case 'special':
          wantTex = fighter._texSpecial;
          break;
        case 'hit':
          wantTex = fighter._texHit;
          break;
        case 'ko':
          wantTex = fighter._texKo;
          break;
        case 'block':
          wantTex = fighter._texBlock;
          break;
        case 'jump':
          wantTex = fighter._texJump;
          break;
        case 'run':
          if (fighter._walkFrames) {
            useFrameCycle = true;
          } else {
            wantTex = fighter._texWalk;
          }
          break;
        case 'win':
          wantTex = fighter._texWin;
          break;
        default: // idle
          if (fighter._idleFrames) {
            useFrameCycle = true;
          } else {
            wantTex = fighter._texIdle;
          }
      }

      // Frame cycling for animated poses
      if (useFrameCycle) {
        const frames = fighter.state === 'run' ? fighter._walkFrames : fighter._idleFrames;
        const fps = fighter.state === 'run' ? 8 : 4; // walk faster, idle slower
        const frameIdx = Math.floor(t * fps) % frames.length;
        wantTex = frames[frameIdx];
      } else {
        fighter._animFrame = 0;
      }

      if (spr.texture !== wantTex) {
        spr.texture = wantTex;
      }
    }

    // ── Hit flash ─────────────────────────────────────────
    if (fighter._hitFlash === undefined) fighter._hitFlash = 0;
    if (fighter._squash === undefined) fighter._squash = 1;
    if (fighter._squashV === undefined) fighter._squashV = 0;

    // Decay hit flash
    if (fighter._hitFlash > 0) {
      fighter._hitFlash = Math.max(0, fighter._hitFlash - 0.12);
      spr.tint = lerpColor(0xffffff, 0xff3333, fighter._hitFlash);
    } else {
      spr.tint = 0xffffff;
    }

    // Spring-based squash & stretch
    const squashTarget = 1;
    fighter._squashV += (squashTarget - fighter._squash) * 0.35;
    fighter._squashV *= 0.65;
    fighter._squash += fighter._squashV;

    // Clear attack graphics each frame
    gfx.clear();

    // ── State animations ──────────────────────────────────
    switch (fighter.state) {
      case 'idle': {
        const bob = Math.sin(t * 2.5) * 1.5;
        spr.scale.set(bx, by * (fighter._squash + Math.sin(t * 2.5) * 0.015));
        spr.y = bob;
        spr.rotation = 0;
        if (aura) aura.clear();
        break;
      }
      case 'run': {
        const bounce = Math.abs(Math.sin(t * 12)) * 0.04;
        const lean = 0.06;
        spr.scale.set(bx * (1 - bounce * 0.5), by * (fighter._squash + bounce));
        spr.y = -Math.abs(Math.sin(t * 12)) * 4;
        spr.rotation = lean; // always lean forward (container flip handles direction)
        if (aura) aura.clear();
        break;
      }
      case 'jump': {
        const stretch = 1.08;
        spr.scale.set(bx * 0.9, by * stretch * fighter._squash);
        spr.y = -3;
        spr.rotation = 0.08;
        if (aura) aura.clear();
        break;
      }
      case 'attack': {
        // Windwup vs active frame split (attackTimer: ATTACK_DUR → 0)
        const progress = 1 - (fighter.attackTimer / ATTACK_DUR); // 0=start, 1=end
        const isActive = progress > 0.3 && progress < 0.75;
        if (progress < 0.3) {
          // Windup: lean back
          spr.scale.set(bx * 0.9, by * 1.05);
          spr.rotation = -0.12;
        } else if (isActive) {
          // Active: lunge forward + extend fist graphic
          spr.scale.set(bx * 1.12, by * 0.88);
          spr.rotation = 0.2;
          // Draw fist/punch effect
          const fistX = FIGHTER_H * 0.45;
          const fistY = -FIGHTER_H * 0.55;
          gfx.circle(fistX, fistY, FIGHTER_H * 0.13).fill({ color: 0xffffff, alpha: 0.9 });
          gfx.circle(fistX, fistY, FIGHTER_H * 0.2).fill({ color: fighter.chardef.accentColor, alpha: 0.5 });
          gfx.circle(fistX, fistY, FIGHTER_H * 0.28).fill({ color: fighter.chardef.color, alpha: 0.25 });
        } else {
          // Recovery
          spr.scale.set(bx * 0.95, by * 1.02);
          spr.rotation = 0.05;
        }
        break;
      }
      case 'special': {
        const pulse = (Math.sin(t * 15) + 1) / 2;
        const progress = 1 - (fighter.attackTimer / ATTACK_DUR);
        const isActive = progress > 0.25 && progress < 0.8;
        spr.scale.set(bx * (isActive ? 1.15 : 1.0), by * (isActive ? 0.88 : 1.0) * fighter._squash);
        spr.rotation = isActive ? 0.25 : 0;
        spr.y = Math.sin(t * 20) * 2;

        if (aura) {
          aura.clear();
          aura.ellipse(0, -FIGHTER_H * 0.5, FIGHTER_H * (0.38 + pulse * 0.08), FIGHTER_H * (0.5 + pulse * 0.1))
            .fill({ color: fighter.chardef.accentColor, alpha: 0.18 + pulse * 0.22 });
          aura.ellipse(0, -FIGHTER_H * 0.5, FIGHTER_H * (0.28 + pulse * 0.06), FIGHTER_H * (0.38 + pulse * 0.08))
            .fill({ color: fighter.chardef.color, alpha: 0.12 + pulse * 0.18 });
        }
        if (isActive) {
          // Big spinning kick/energy effect
          const fistX = FIGHTER_H * 0.5;
          const fistY = -FIGHTER_H * 0.5;
          gfx.circle(fistX, fistY, FIGHTER_H * 0.17).fill({ color: 0xffffff, alpha: 1 });
          gfx.circle(fistX, fistY, FIGHTER_H * 0.28).fill({ color: fighter.chardef.accentColor, alpha: 0.7 });
          gfx.circle(fistX, fistY, FIGHTER_H * 0.42).fill({ color: fighter.chardef.color, alpha: 0.4 });
          gfx.circle(fistX, fistY, FIGHTER_H * 0.58).fill({ color: fighter.chardef.accentColor, alpha: 0.15 });
        }
        break;
      }
      case 'hit': {
        // Squash on hit: compress horizontally, stretch vertically
        spr.scale.set(bx * 0.88, by * 1.1 * fighter._squash);
        spr.rotation = -0.18;
        spr.y = -4;
        break;
      }
      case 'block': {
        spr.scale.set(bx * 0.85, by * 0.92);
        spr.rotation = 0.05;
        spr.y = FIGHTER_H * 0.06;
        // Shield glow
        if (aura) {
          aura.clear();
          aura.ellipse(0, -FIGHTER_H * 0.5, FIGHTER_H * 0.35, FIGHTER_H * 0.5)
            .fill({ color: 0x4488ff, alpha: 0.18 });
        }
        break;
      }
      case 'ko': {
        spr.scale.set(bx * 0.88, by * 0.88);
        spr.rotation = 0; // container handles the fall rotation
        spr.y = 0;
        if (aura) aura.clear();
        break;
      }
      case 'win': {
        const pulse = (Math.sin(t * 3) + 1) / 2;
        spr.scale.set(bx * (1 + pulse * 0.05), by * (1 + pulse * 0.05));
        spr.y = -Math.abs(Math.sin(t * 2)) * 4;
        spr.rotation = 0;
        if (aura) {
          aura.clear();
          aura.ellipse(0, -FIGHTER_H * 0.5, FIGHTER_H * (0.35 + pulse * 0.1), FIGHTER_H * (0.5 + pulse * 0.1))
            .fill({ color: fighter.chardef.accentColor, alpha: 0.15 + pulse * 0.15 });
        }
        break;
      }
      default:
        spr.scale.set(bx, by);
        spr.y = 0;
        spr.rotation = 0;
    }
  }

  function darken(color, factor) {
    const r = ((color >> 16) & 0xff) * factor;
    const g2 = ((color >> 8) & 0xff) * factor;
    const b = (color & 0xff) * factor;
    return (Math.floor(r) << 16) | (Math.floor(g2) << 8) | Math.floor(b);
  }

  function lerpColor(a, b, t) {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    return ((Math.round(ar + (br - ar) * t) << 16) |
            (Math.round(ag + (bg - ag) * t) << 8) |
             Math.round(ab + (bb - ab) * t));
  }

  buildFighterSprite(p1);
  buildFighterSprite(p2);

  // ── Hit effects ───────────────────────────────────────────
  const effectLayer = new PIXI.Container();
  container.addChild(effectLayer);

  function spawnDust(x, y) {
    for (let i = 0; i < 6; i++) {
      const g = new PIXI.Graphics();
      const size = Math.random() * 6 + 3;
      g.circle(0, 0, size).fill({ color: 0xd4b896, alpha: 0.8 });
      g.x = x + (Math.random() - 0.5) * 30;
      g.y = y;
      effectLayer.addChild(g);
      hitEffects.push({
        t: 0, maxT: 0.5,
        vx: (Math.random() - 0.5) * 3,
        vy: -(Math.random() * 2 + 0.5),
        sprite: g
      });
    }
  }

  function spawnHitEffect(x, y, isSpecial) {
    const count = isSpecial ? 16 : 8;
    const colors = isSpecial ? [0xffdd00, 0xff6600, 0xffffff] : [0xffffff, 0xffe0a0, 0xffcc44];

    // Impact ring flash
    const ring = new PIXI.Graphics();
    const ringSize = isSpecial ? FIGHTER_H * 0.5 : FIGHTER_H * 0.3;
    ring.circle(0, 0, ringSize).fill({ color: isSpecial ? 0xffaa00 : 0xffffff, alpha: 0.6 });
    ring.x = x; ring.y = y;
    effectLayer.addChild(ring);
    hitEffects.push({ t: 0, maxT: 0.18, sprite: ring, ring: true });

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.3;
      const speed = (Math.random() * 4 + 3) * (isSpecial ? 2.2 : 1);
      const g = new PIXI.Graphics();
      const size = isSpecial ? Math.random() * 10 + 5 : Math.random() * 7 + 3;
      const color = colors[Math.floor(Math.random() * colors.length)];
      g.circle(0, 0, size).fill({ color, alpha: 1 });
      if (isSpecial) g.circle(0, 0, size * 2).fill({ color: 0xff4400, alpha: 0.35 });
      g.x = x; g.y = y;
      effectLayer.addChild(g);
      hitEffects.push({ t: 0, maxT: isSpecial ? 0.55 : 0.4, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, sprite: g });
    }

    // "HIT!" / "★ SPECIAL! ★" text
    const hitText = makeText(isSpecial ? '★ SPECIAL! ★' : 'HIT!', {
      size: isSpecial ? 26 : 18,
      color: isSpecial ? 0xffdd00 : 0xffffff,
      shadow: true, shadowColor: isSpecial ? 0xff4400 : 0x333300, shadowBlur: 8
    });
    hitText.anchor.set(0.5);
    hitText.x = x; hitText.y = y - 28;
    hitText.scale.set(isSpecial ? 1.3 : 1);
    effectLayer.addChild(hitText);
    hitEffects.push({ t: 0, maxT: 0.55, sprite: hitText, textEffect: true });
  }

  const hitEffects = [];

  function updateEffects(dt) {
    for (let i = hitEffects.length - 1; i >= 0; i--) {
      const e = hitEffects[i];
      e.t += dt * 0.05;
      const prog = e.t / e.maxT;
      if (e.textEffect) {
        e.sprite.y -= dt * 0.6;
        e.sprite.alpha = 1 - prog;
        e.sprite.scale.set(1 + prog * 0.3);
      } else if (e.ring) {
        e.sprite.alpha = (1 - prog) * 0.7;
        e.sprite.scale.set(1 + prog * 1.5);
      } else {
        e.sprite.x += e.vx;
        e.sprite.y += e.vy;
        e.vy += 0.18;
        e.sprite.alpha = 1 - prog;
        e.sprite.scale.set(1 - prog * 0.4);
      }
      if (prog >= 1) {
        effectLayer.removeChild(e.sprite);
        e.sprite.destroy();
        hitEffects.splice(i, 1);
      }
    }
  }

  // ── HUD ──────────────────────────────────────────────────
  const hudLayer = new PIXI.Container();
  container.addChild(hudLayer);

  // P1 HP bar (left)
  const hudBarH = 20;
  const hudBarW = W() * 0.36;
  const hudY = 12;
  const hudPad = 12;

  // Backgrounds
  const hpBgLeft = new PIXI.Graphics();
  hpBgLeft.roundRect(hudPad, hudY, hudBarW, hudBarH, 4).fill({ color: 0x330000, alpha: 0.85 }).stroke({ color: 0x660000, width: 1 });
  hudLayer.addChild(hpBgLeft);

  const hpBgRight = new PIXI.Graphics();
  hpBgRight.roundRect(W() - hudPad - hudBarW, hudY, hudBarW, hudBarH, 4).fill({ color: 0x330000, alpha: 0.85 }).stroke({ color: 0x660000, width: 1 });
  hudLayer.addChild(hpBgRight);

  const hpFillLeft = new PIXI.Graphics();
  hudLayer.addChild(hpFillLeft);
  const hpFillRight = new PIXI.Graphics();
  hudLayer.addChild(hpFillRight);

  // Player names
  const p1NameHUD = makeText(char1def.name, { size: 9, color: 0x4488ff });
  p1NameHUD.x = hudPad;
  p1NameHUD.y = hudY + hudBarH + 4;
  hudLayer.addChild(p1NameHUD);

  const p2NameHUD = makeText(char2def.name, { size: 9, color: 0xff4444 });
  p2NameHUD.anchor.set(1, 0);
  p2NameHUD.x = W() - hudPad;
  p2NameHUD.y = hudY + hudBarH + 4;
  hudLayer.addChild(p2NameHUD);

  // VS
  const vsHUD = makeText('VS', { size: 13, color: 0xffff00 });
  vsHUD.anchor.set(0.5);
  vsHUD.x = W() / 2;
  vsHUD.y = hudY + 2;
  hudLayer.addChild(vsHUD);

  // Timer
  const timerText = makeText('90', { size: 20, color: 0xffffff, shadow: true });
  timerText.anchor.set(0.5);
  timerText.x = W() / 2;
  timerText.y = hudY + hudBarH + 6;
  hudLayer.addChild(timerText);

  // Attack-ready indicator (small dot under each HP bar)
  const atkReadyLeft  = new PIXI.Graphics();
  const atkReadyRight = new PIXI.Graphics();
  hudLayer.addChild(atkReadyLeft);
  hudLayer.addChild(atkReadyRight);

  // ── Best-of-3 round system (first to 2 wins) ──────────────
  let p1Wins = 0;
  let p2Wins = 0;
  let currentRound = 1;
  const WINS_NEEDED = 2;

  // Round win indicators (2 circles per player, SF-style)
  const roundIndicatorsP1 = new PIXI.Graphics();
  const roundIndicatorsP2 = new PIXI.Graphics();
  hudLayer.addChild(roundIndicatorsP1);
  hudLayer.addChild(roundIndicatorsP2);

  function drawRoundIndicators() {
    roundIndicatorsP1.clear();
    roundIndicatorsP2.clear();
    const indicatorY = hudY + hudBarH + 24;
    const indicatorR = 6;
    const indicatorGap = 16;

    // P1 round wins (left side)
    for (let i = 0; i < WINS_NEEDED; i++) {
      const x = hudPad + 20 + i * indicatorGap;
      const won = i < p1Wins;
      roundIndicatorsP1.circle(x, indicatorY, indicatorR)
        .fill({ color: won ? 0xffcc00 : 0x333333, alpha: won ? 1 : 0.5 });
      if (won) {
        roundIndicatorsP1.circle(x, indicatorY, indicatorR)
          .stroke({ color: 0xffff88, width: 2 });
      }
    }

    // P2 round wins (right side)
    for (let i = 0; i < WINS_NEEDED; i++) {
      const x = W() - hudPad - 20 - i * indicatorGap;
      const won = i < p2Wins;
      roundIndicatorsP2.circle(x, indicatorY, indicatorR)
        .fill({ color: won ? 0xffcc00 : 0x333333, alpha: won ? 1 : 0.5 });
      if (won) {
        roundIndicatorsP2.circle(x, indicatorY, indicatorR)
          .stroke({ color: 0xffff88, width: 2 });
      }
    }
  }
  drawRoundIndicators();

  function updateHUD() {
    // HP bars
    const p1pct = Math.max(0, p1.hp / MAX_HP);
    const p2pct = Math.max(0, p2.hp / MAX_HP);

    const p1Color = p1pct > 0.5 ? 0x44ff44 : p1pct > 0.25 ? 0xffaa00 : 0xff2222;
    const p2Color = p2pct > 0.5 ? 0x44ff44 : p2pct > 0.25 ? 0xffaa00 : 0xff2222;

    hpFillLeft.clear();
    hpFillLeft.roundRect(hudPad, hudY, hudBarW * p1pct, hudBarH, 4).fill({ color: p1Color });

    hpFillRight.clear();
    const rw = hudBarW * p2pct;
    hpFillRight.roundRect(W() - hudPad - rw, hudY, rw, hudBarH, 4).fill({ color: p2Color });

    // Attack-ready pips
    atkReadyLeft.clear();
    atkReadyRight.clear();
    const pipColor = p1.attackCd <= 0 ? 0x44ff88 : 0x334433;
    atkReadyLeft.circle(hudPad + 6, hudY + hudBarH + 14, 5).fill({ color: pipColor });
    const pipColor2 = p2.attackCd <= 0 ? 0x44ff88 : 0x334433;
    atkReadyRight.circle(W() - hudPad - 6, hudY + hudBarH + 14, 5).fill({ color: pipColor2 });
  }

  // Round timer
  let roundTime = ROUND_TIME;
  let roundOver = false;
  let roundTimerAcc = 0;

  // Fight intro text
  let introPhase = 0;
  let introTimer = 0;
  const introLayer = new PIXI.Container();
  container.addChild(introLayer);

  function showIntroText(text, duration, color, callback) {
    introLayer.removeChildren();
    const flash = new PIXI.Graphics();
    flash.rect(0, 0, W(), H()).fill({ color: 0x000000, alpha: 0.5 });
    introLayer.addChild(flash);

    const t = makeGlowText(text, Math.min(Math.floor(W() / 10), 72), color);
    t.x = W() / 2;
    t.y = H() / 2;
    introLayer.addChild(t);

    let elapsed = 0;
    const ticker = (tk) => {
      elapsed += tk.deltaTime;
      const prog = elapsed / duration;
      t.scale.set(0.8 + prog * 0.4);
      t.alpha = prog < 0.1 ? prog * 10 : prog > 0.8 ? (1 - prog) * 5 : 1;
      flash.alpha = 0.5 * (1 - prog);
      if (prog >= 1) {
        app.ticker.remove(ticker);
        introLayer.removeChildren();
        if (callback) callback();
      }
    };
    app.ticker.add(ticker);
  }

  // Show ROUND X → FIGHT!
  setTimeout(() => {
    showIntroText('ROUND ' + currentRound, 100, 0xffff00, () => {
      setTimeout(() => {
        showIntroText('FIGHT!', 80, 0xff4422, () => {
          roundOver = false;
        });
      }, 200);
    });
  }, 100);

  // ── Input ────────────────────────────────────────────────
  const keys = {};
  const lastKeyTime = {};
  const doubleTap = {};

  const keydown = (e) => {
    if (keys[e.key]) return;
    keys[e.key] = true;

    const now = Date.now();
    // Double-tap detection for dash
    if (lastKeyTime[e.key] && now - lastKeyTime[e.key] < DOUBLE_TAP_MS) {
      doubleTap[e.key] = true;
    }
    lastKeyTime[e.key] = now;
  };
  const keyup = (e) => { keys[e.key] = false; doubleTap[e.key] = false; };
  document.addEventListener('keydown', keydown);
  document.addEventListener('keyup', keyup);

  // Mobile touch controls
  const touchBtns = buildTouchControls(container);

  // ── AI logic ─────────────────────────────────────────────
  function updateAI(dt) {
    if (!p2.isAI || p2.state === 'ko' || p2.state === 'win') return;
    p2.aiTimer -= dt;
    if (p2.aiTimer > 0) return;
    p2.aiTimer = 15 + Math.random() * 20;

    const dist = Math.abs(p1.x - p2.x);
    const rand = Math.random();

    if (dist > ATTACK_RANGE * 1.5) {
      // Move toward p1
      p2.vx = (p1.x < p2.x ? -1 : 1) * MOVE_SPEED * p2.speedMult;
    } else if (dist < ATTACK_RANGE * 0.7) {
      // Too close, back off
      p2.vx = (p1.x < p2.x ? 1 : -1) * MOVE_SPEED * p2.speedMult * 0.5;
    } else {
      // In range: attack — AI uses all 6 moves
      if (p2.attackCd <= 0) {
        if      (rand < 0.25) doAttack(p2, p1, 'LP');
        else if (rand < 0.45) doAttack(p2, p1, 'MK');
        else if (rand < 0.60) doAttack(p2, p1, 'MP');
        else if (rand < 0.72) doAttack(p2, p1, 'HP');
        else if (rand < 0.82) doAttack(p2, p1, 'LK');
        else if (rand < 0.90) doAttack(p2, p1, 'HK');
        else {
          p2.vx = 0;
          if (p2.vy === 0 && Math.random() < 0.4) p2.vy = -12;
        }
      } else {
        p2.vx = 0;
        if (rand < 0.85 && p2.vy === 0 && Math.random() < 0.3) {
          p2.vy = -12; // jump
        }
      }
    }
  }

  function doAttack(attacker, defender, attackType) {
    const atk = ATTACKS[attackType];
    if (!atk) return;
    if (attacker.attackCd > 0) return;
    if (attacker.state === 'hit' || attacker.state === 'ko') return;

    const isHeavy  = attackType === 'HP' || attackType === 'HK';
    const isMedium = attackType === 'MP' || attackType === 'MK';
    attacker._lastAtkIsKick = atk.isKick;
    attacker.state = isHeavy ? 'special' : 'attack';
    attacker.attackTimer = ATTACK_DUR * (isHeavy ? 1.4 : isMedium ? 1.0 : 0.7);
    attacker.attackCd = atk.cd;

    if (isHeavy) playSFX('special');
    else playSFX('punch');

    // Check hit
    const dist = Math.abs(attacker.x - defender.x);
    if (dist < atk.range && defender.state !== 'ko') {
      const blockMult = defender.blocking ? 0.25 : 1.0; // Block reduces damage 75%
      const dmg = atk.dmg * attacker.damageMult * defender.defenseMult * blockMult;
      defender.hp -= dmg;
      defender.hitStun = HIT_STUN * (isHeavy ? 1.5 : isMedium ? 1.0 : 0.7);
      defender.state = 'hit';
      if (defender.mainSprite) { defender._hitFlash = 1; }
      defender._squash = 0.75;
      defender._squashV = 0.08;
      defender.vx += (attacker.dir > 0 ? 1 : -1) * atk.kbx;
      defender.vy = atk.kby;

      const hitX = (attacker.x + defender.x) / 2;
      const hitY = defender.y - FIGHTER_H * 0.5;
      spawnHitEffect(hitX, hitY, isHeavy);
      triggerShake(isHeavy ? 10 : isMedium ? 6 : 4);

      if (defender.hp <= 0) {
        defender.hp = 0;
        defender.state = 'ko';
        triggerShake(15);
        playSFX('ko');
        endRound(attacker === p1 ? 1 : 2);
      }
    }
  }

  // ── Reset fighters for new round ───────────────────────────
  function resetFightersForNewRound() {
    // Reset positions
    p1.x = W() * 0.25;
    p1.y = GROUND;
    p1.vx = 0;
    p1.vy = 0;
    p1.hp = MAX_HP;
    p1.state = 'idle';
    p1.attackTimer = 0;
    p1.attackCd = 0;
    p1.hitStun = 0;
    p1.blocking = false;
    p1.dir = 1;
    if (p1.container) {
      p1.container.rotation = 0;
      p1.container.x = p1.x;
      p1.container.y = p1.y;
    }

    p2.x = W() * 0.75;
    p2.y = GROUND;
    p2.vx = 0;
    p2.vy = 0;
    p2.hp = MAX_HP;
    p2.state = 'idle';
    p2.attackTimer = 0;
    p2.attackCd = 0;
    p2.hitStun = 0;
    p2.blocking = false;
    p2.dir = -1;
    p2.aiTimer = 0;
    if (p2.container) {
      p2.container.rotation = 0;
      p2.container.x = p2.x;
      p2.container.y = p2.y;
    }

    // Reset timer
    roundTime = ROUND_TIME;
    roundTimerAcc = 0;
  }

  // ── Round end ────────────────────────────────────────────
  function endRound(winner) {
    if (roundOver) return;
    roundOver = true;
    stopMusic();

    // Set winner to win pose
    const winFighter = winner === 1 ? p1 : p2;
    winFighter.state = 'win';

    // Increment wins
    if (winner === 1) p1Wins++;
    else p2Wins++;

    // Update round indicators
    drawRoundIndicators();

    const roundWinText = winner === 1
      ? char1def.name + ' WINS ROUND ' + currentRound
      : char2def.name + ' WINS ROUND ' + currentRound;
    const winColor = winner === 1 ? 0x4488ff : 0xff4444;

    // Check if match is over (best of 3 = first to 2 wins)
    const matchOver = p1Wins >= WINS_NEEDED || p2Wins >= WINS_NEEDED;

    setTimeout(() => {
      showIntroText('K.O.!', 80, 0xff2222, () => {
        setTimeout(() => {
          if (matchOver) {
            // Match is over — show final winner and go to GAME_OVER
            const finalWinner = p1Wins >= WINS_NEEDED ? 1 : 2;
            const finalWinText = (finalWinner === 1 ? char1def.name : char2def.name) + ' WINS!';
            showIntroText(finalWinText, 120, winColor, () => {
              setTimeout(() => {
                document.removeEventListener('keydown', keydown);
                document.removeEventListener('keyup', keyup);
                gameResult = { winner: finalWinner, p1Name: char1def.name, p2Name: char2def.name, p1Wins, p2Wins };
                showScene(SCENES.GAME_OVER);
              }, 500);
            });
          } else {
            // Round won, but match continues — show round win and start next round
            showIntroText(roundWinText, 100, winColor, () => {
              setTimeout(() => {
                currentRound++;
                resetFightersForNewRound();
                drawRoundIndicators();
                playFightMusic();
                showIntroText('ROUND ' + currentRound, 100, 0xffff00, () => {
                  setTimeout(() => {
                    showIntroText('FIGHT!', 80, 0xff4422, () => {
                      roundOver = false;
                    });
                  }, 200);
                });
              }, 400);
            });
          }
        }, 300);
      });
    }, 500);
  }

  // ── Main game loop ────────────────────────────────────────
  const ticker = (tk) => {
    if (currentScene !== SCENES.FIGHT) {
      app.ticker.remove(ticker);
      document.removeEventListener('keydown', keydown);
      document.removeEventListener('keyup', keyup);
      return;
    }

    const dt = tk.deltaTime;

    if (!roundOver) {
      // Timer
      roundTimerAcc += dt;
      if (roundTimerAcc >= 60) {
        roundTimerAcc = 0;
        roundTime--;
        if (roundTime <= 0) {
          // Time over — whoever has more HP wins
          const w = p1.hp >= p2.hp ? 1 : 2;
          endRound(w);
        }
      }
      timerText.text = String(roundTime);
      timerText.style.fill = roundTime <= 10 ? 0xff4444 : 0xffffff;

      // Input handling for P1
      if (p1.state !== 'ko' && p1.state !== 'win' && p1.hitStun <= 0) {
        let moving = false;

        // Blocking (down/S — can't attack while blocking)
        p1.blocking = !!(keys['s'] || keys['S'] || touchBtns.down) && p1.y >= GROUND - 2;

        if (!p1.blocking) {
          if (keys['a'] || keys['A'] || touchBtns.left) {
            p1.vx = -MOVE_SPEED * p1.speedMult;
            p1.dir = -1;
            if (p1.state !== 'attack' && p1.state !== 'special') p1.state = 'run';
            moving = true;
          } else if (keys['d'] || keys['D'] || touchBtns.right) {
            p1.vx = MOVE_SPEED * p1.speedMult;
            p1.dir = 1;
            if (p1.state !== 'attack' && p1.state !== 'special') p1.state = 'run';
            moving = true;
          }
        }

        if ((keys['w'] || keys['W'] || keys['ArrowUp'] || touchBtns.jump) && p1.y >= GROUND - 2 && !p1.blocking) {
          p1.vy = -15;
          p1.state = 'jump';
        }

        // 6-button SF layout — P1: U/I/O = LP/MP/HP, J/K/L = LK/MK/HK
        if (!p1.blocking) {
          if ((keys['u'] || keys['U'] || touchBtns.lp) && p1.attackCd <= 0) doAttack(p1, p2, 'LP');
          if ((keys['i'] || keys['I'] || touchBtns.mp) && p1.attackCd <= 0) doAttack(p1, p2, 'MP');
          if ((keys['o'] || keys['O'] || touchBtns.hp) && p1.attackCd <= 0) doAttack(p1, p2, 'HP');
          if ((keys['j'] || keys['J'] || touchBtns.lk) && p1.attackCd <= 0) doAttack(p1, p2, 'LK');
          if ((keys['k'] || keys['K'] || touchBtns.mk) && p1.attackCd <= 0) doAttack(p1, p2, 'MK');
          if ((keys['l'] || keys['L'] || touchBtns.hk) && p1.attackCd <= 0) doAttack(p1, p2, 'HK');
        }

        if (!moving && p1.y >= GROUND - 2) {
          p1.vx *= 0.7;
          if (p1.state !== 'attack' && p1.state !== 'special') p1.state = 'idle';
        }
      }

      // Input for P2 (2P mode)
      if (!p2.isAI && p2.state !== 'ko' && p2.state !== 'win' && p2.hitStun <= 0) {
        let moving = false;
        if (keys['ArrowLeft']) {
          p2.vx = -MOVE_SPEED * p2.speedMult;
          p2.dir = -1;
          if (p2.state !== 'attack' && p2.state !== 'special') p2.state = 'run';
          moving = true;
        } else if (keys['ArrowRight']) {
          p2.vx = MOVE_SPEED * p2.speedMult;
          p2.dir = 1;
          if (p2.state !== 'attack' && p2.state !== 'special') p2.state = 'run';
          moving = true;
        }
        if (keys['ArrowUp'] && p2.y >= GROUND - 2) {
          p2.vy = -15;
          p2.state = 'jump';
        }
        // P2: numrow 7/8/9 = LP/MP/HP, 4/5/6 = LK/MK/HK
        if (keys['7'] && p2.attackCd <= 0) doAttack(p2, p1, 'LP');
        if (keys['8'] && p2.attackCd <= 0) doAttack(p2, p1, 'MP');
        if (keys['9'] && p2.attackCd <= 0) doAttack(p2, p1, 'HP');
        if (keys['4'] && p2.attackCd <= 0) doAttack(p2, p1, 'LK');
        if (keys['5'] && p2.attackCd <= 0) doAttack(p2, p1, 'MK');
        if (keys['6'] && p2.attackCd <= 0) doAttack(p2, p1, 'HK');

        if (!moving && p2.y >= GROUND - 2) {
          p2.vx *= 0.7;
          if (p2.state !== 'attack' && p2.state !== 'special') p2.state = 'idle';
        }
      }

      // AI
      if (p2.isAI) updateAI(dt);

      // Physics for both fighters
      [p1, p2].forEach(f => {
        // Gravity
        f.vy += GRAVITY;

        f.x += f.vx * dt;
        f.y += f.vy * dt;

        // Ground clamp
        if (f.y >= GROUND) {
          const wasJumping = f.state === 'jump' && f.vy > 2;
          f.y = GROUND;
          f.vy = 0;
          if (f.state === 'jump') f.state = 'idle';
          if (wasJumping) {
            // Landing squash + dust
            f._squash = 0.7;
            f._squashV = 0.12;
            spawnDust(f.x, GROUND);
          }
        }

        // Wall bounds
        const hw = FIGHTER_W / 2;
        f.x = Math.max(hw, Math.min(W() - hw, f.x));

        // Blocking state
        if (f.blocking && f.state !== 'ko' && f.state !== 'hit' && f.state !== 'win') f.state = 'block';
        else if (!f.blocking && f.state === 'block') f.state = 'idle';

        // Face opponent
        if (f === p1 && f.state !== 'attack' && f.state !== 'special' && f.state !== 'ko' && f.state !== 'win') {
          f.dir = p2.x > p1.x ? 1 : -1;
        }
        if (f === p2 && !f.isAI && f.state !== 'attack' && f.state !== 'special' && f.state !== 'ko' && f.state !== 'win') {
          f.dir = p1.x > p2.x ? 1 : -1;
        }
        if (f === p2 && f.isAI) {
          f.dir = p1.x > p2.x ? 1 : -1;
        }

        // Cooldown timers
        if (f.attackCd > 0) f.attackCd -= dt;
        if (f.attackTimer > 0) {
          f.attackTimer -= dt;
          if (f.attackTimer <= 0 && f.state !== 'ko' && f.state !== 'hit' && f.state !== 'win') f.state = 'idle';
        }
        if (f.hitStun > 0) {
          f.hitStun -= dt;
          if (f.hitStun <= 0 && f.state === 'hit') f.state = 'idle';
        }

        // Air drag
        if (f.y < GROUND) {
          f.vx *= 0.95;
        }

        // Update sprite
        if (f.container) {
          f.container.x = f.x;
          f.container.y = f.y;
          f.container.scale.x = f.dir;

          // Draw body each frame for animation
          drawFighterBody(f);

          // KO fall
          if (f.state === 'ko') {
            f.container.rotation = Math.min(Math.PI / 2, f.container.rotation + 0.05);
          } else {
            f.container.rotation = 0;
          }
        }
      });

      updateEffects(dt);
      updateHUD();
    }

    // Screen shake
    if (shakeAmt > 0.3) {
      shakeX = (Math.random() - 0.5) * shakeAmt * 2;
      shakeY = (Math.random() - 0.5) * shakeAmt * 2;
      shakeAmt *= 0.72;
    } else {
      shakeAmt = 0; shakeX = 0; shakeY = 0;
    }
    app.stage.position.set(shakeX, shakeY);
  };

  app.ticker.add(ticker);
}

// ── Touch controls — Street Fighter SNES layout ─────────────
// Left side: D-pad cross  |  Right side: 3×2 attack grid
// [LP][MP][HP]
// [LK][MK][HK]
function buildTouchControls(container) {
  const state = {
    left: false, right: false, jump: false, down: false,
    lp: false, mp: false, hp: false,
    lk: false, mk: false, hk: false,
  };

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth < 850;
  if (!isMobile) return state;

  const btnLayer = new PIXI.Container();
  btnLayer.interactiveChildren = true;
  container.addChild(btnLayer);

  const r     = Math.min(W() * 0.07, 46);  // button radius
  const pad   = 14;
  const baseY = H() - pad - r;

  // ── D-pad (left side) ───────────────────────────────────
  const dpadCX = pad + r * 2.8;
  const dpadCY = baseY - r * 0.6;
  const dpadR  = r * 1.0;

  function makeDpad(label, ox, oy, key) {
    const g = new PIXI.Graphics();
    const bw = r * 1.55;
    g.roundRect(-bw/2, -bw/2, bw, bw, 10)
      .fill({ color: 0x162040, alpha: 0.92 })
      .stroke({ color: 0x55aaee, width: 2.5 });
    g.x = dpadCX + ox * dpadR;
    g.y = dpadCY + oy * dpadR;
    g.interactive = true;
    g.cursor = 'pointer';
    const t = makeText(label, { size: Math.max(10, Math.floor(r * 0.44)), color: 0xddeeff });
    t.anchor.set(0.5);
    g.addChild(t);
    btnLayer.addChild(g);
    g.on('pointerdown',     () => { state[key] = true;  g.alpha = 0.45; });
    g.on('pointerup',       () => { state[key] = false; g.alpha = 1;    });
    g.on('pointerupoutside',() => { state[key] = false; g.alpha = 1;    });
    return g;
  }
  makeDpad('◄', -1,  0, 'left');
  makeDpad('►',  1,  0, 'right');
  makeDpad('▲',  0, -1, 'jump');
  makeDpad('▼',  0,  1, 'down');  // Down = block/guard

  // ── 6-button grid (right side) ──────────────────────────
  // Row 0 (top):    LP  MP  HP   (punches — blue tones)
  // Row 1 (bottom): LK  MK  HK   (kicks   — red/orange)
  const attackDefs = [
    // [key, label, col, row, color, border]
    ['lp', 'LP', 0, 0, 0x1a2a4a, 0x4488ff],
    ['mp', 'MP', 1, 0, 0x1a2a4a, 0x66aaff],
    ['hp', 'HP', 2, 0, 0x1a2a4a, 0x99ccff],
    ['lk', 'LK', 0, 1, 0x2a1a1a, 0xff5533],
    ['mk', 'MK', 1, 1, 0x2a1a1a, 0xff7744],
    ['hk', 'HK', 2, 1, 0x2a1a1a, 0xffaa55],
  ];

  const atkSpacing = r * 2.1;
  const atkStartX  = W() - pad - r - atkSpacing * 2;
  const atkRow0Y   = baseY - r * 1.25;
  const atkRow1Y   = baseY + r * 0.25;

  attackDefs.forEach(([key, label, col, row, bg, border]) => {
    const cx = atkStartX + col * atkSpacing;
    const cy = row === 0 ? atkRow0Y : atkRow1Y;

    const g = new PIXI.Graphics();
    g.circle(0, 0, r)
      .fill({ color: bg, alpha: 0.88 })
      .stroke({ color: border, width: 2.5 });
    g.x = cx; g.y = cy;
    g.interactive = true;
    g.cursor = 'pointer';

    const t = makeText(label, { size: Math.max(8, Math.floor(r * 0.34)), color: border });
    t.anchor.set(0.5);
    g.addChild(t);
    btnLayer.addChild(g);

    g.on('pointerdown',     () => { state[key] = true;  g.alpha = 0.45; });
    g.on('pointerup',       () => { state[key] = false; g.alpha = 1;    });
    g.on('pointerupoutside',() => { state[key] = false; g.alpha = 1;    });
  });

  return state;
}

// ═══════════════════════════════════════════════════════════
// SCENE: GAME OVER
// ═══════════════════════════════════════════════════════════
let gameResult = { winner: 1, p1Name: 'P1', p2Name: 'P2' };

function buildGameOverScene(container) {
  // BG with blur effect
  const bg = new PIXI.Graphics();
  bg.rect(0, 0, W(), H()).fill({ color: 0x000000, alpha: 1 });
  container.addChild(bg);

  if (textures['bg']) {
    const bgSprite = fillScreen(container, textures['bg']);
    const darken = new PIXI.Graphics();
    darken.rect(0, 0, W(), H()).fill({ color: 0x000000, alpha: 0.75 });
    container.addChild(darken);
  }

  // KO text
  const koTitle = makeGlowText('K.O.', Math.min(Math.floor(W() / 8), 90), 0xff2222);
  koTitle.x = W() / 2;
  koTitle.y = H() * 0.2;
  container.addChild(koTitle);

  // Winner name
  const winName = gameResult.winner === 1 ? gameResult.p1Name : gameResult.p2Name;
  const winColor = gameResult.winner === 1 ? 0x4488ff : 0xff4444;
  const winText = makeGlowText(winName + ' WINS!', Math.min(Math.floor(W() / 14), 48), winColor);
  winText.x = W() / 2;
  winText.y = H() * 0.42;
  container.addChild(winText);

  // Show winning character portrait
  const winIdx = gameResult.winner === 1 ? p1CharIdx : p2CharIdx;
  if (textures[`char_${winIdx}`]) {
    const portrait = new PIXI.Sprite(textures[`char_${winIdx}`]);
    const ps = Math.min(W() * 0.2, 180);
    portrait.width = ps; portrait.height = ps;
    portrait.anchor.set(0.5);
    portrait.x = W() / 2;
    portrait.y = H() * 0.65;
    container.addChild(portrait);

    // Glow ring
    const ring = new PIXI.Graphics();
    ring.circle(W() / 2, H() * 0.65, ps * 0.55).stroke({ color: winColor, width: 3 });
    container.addChild(ring);
  }

  // Buttons
  const btnRematch = makeButton('REMATCH', W() / 2, H() * 0.83, 200, 44, { color: 0x002200, border: 0x44ff44, textColor: 0x44ff44 });
  const btnMenu = makeButton('MAIN MENU', W() / 2, H() * 0.91, 200, 44, { color: 0x220022, border: 0xbb44ff, textColor: 0xbb44ff });
  container.addChild(btnRematch, btnMenu);

  // Play victory fanfare, then fade into menu music
  playVictoryMusic(() => {
    // After fanfare, start menu music (only if still on game over screen)
    if (currentScene === SCENES.GAME_OVER) playMenuMusic();
  });

  // Navigation lock: prevents double-click / rapid keypress from navigating twice
  let navigated = false;
  let gameOverKeydown = null;

  function cleanupAndGo(sceneFn) {
    if (navigated) return;          // lock: ignore subsequent calls
    navigated = true;
    if (gameOverKeydown) {
      document.removeEventListener('keydown', gameOverKeydown);
      gameOverKeydown = null;
    }
    stopMusic();                    // stop victory/menu music cleanly before navigating
    playSFX('select');
    flashTransition(sceneFn);
  }

  btnRematch.on('pointertap', () => cleanupAndGo(() => showScene(SCENES.FIGHT)));
  btnMenu.on('pointertap', () => cleanupAndGo(() => showScene(SCENES.MENU)));

  gameOverKeydown = (e) => {
    if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
      cleanupAndGo(() => showScene(SCENES.FIGHT));
    }
    if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') {
      cleanupAndGo(() => showScene(SCENES.MENU));
    }
  };
  document.addEventListener('keydown', gameOverKeydown);

  // Animate KO title
  const ticker = (tk) => {
    if (currentScene !== SCENES.GAME_OVER) {
      app.ticker.remove(ticker);
      // Clean up keydown if scene changed externally
      if (gameOverKeydown) { document.removeEventListener('keydown', gameOverKeydown); gameOverKeydown = null; }
      return;
    }
    koTitle.scale.set(1 + Math.sin(Date.now() / 600) * 0.05);
    winText.scale.set(1 + Math.sin(Date.now() / 800 + 1) * 0.03);
  };
  app.ticker.add(ticker);
}

// ═══════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════
// ── Dev helpers (global) ──────────────────────────────────
window._game = {
  get p1CharIdx() { return p1CharIdx; },
  set p1CharIdx(v) { p1CharIdx = v; },
  get p2CharIdx() { return p2CharIdx; },
  set p2CharIdx(v) { p2CharIdx = v; },
  get gameMode() { return gameMode; },
  set gameMode(v) { gameMode = v; },
  get chars() { return CHARACTERS.map((c,i) => `${i}: ${c.name}`); },
};
window.gotoFight = function(p1 = 0, p2 = 1, stage = null) {
  p1CharIdx = p1 % CHARACTERS.length;
  p2CharIdx = p2 % CHARACTERS.length;
  gameMode = '1P';
  currentStage = stage || STAGES[Math.floor(Math.random() * STAGES.length)];
  showScene(SCENES.FIGHT);
};
window.gotoMenu   = () => showScene(SCENES.MENU);
window.gotoSelect = () => { gameMode = '1P'; showScene(SCENES.CHARACTER_SELECT); };

window.addEventListener('load', () => {
  init().catch(err => {
    console.error('Fatal init error:', err);
    const lt = document.getElementById('loading-text');
    if (lt) lt.textContent = 'Error: ' + err.message;
  });
});

// Resume audio on any interaction
document.addEventListener('pointerdown', resumeAudio, { once: false });
