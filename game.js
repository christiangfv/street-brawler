// ============================================================
//  STREET BRAWLER v3 — CHIBI MOBILE EDITION
//  100% responsive canvas · Big-head characters · DALL-E bg
//  Vanilla JS + HTML5 Canvas | No dependencies
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ── Base logical resolution (we scale everything from here) ──
const BASE_W = 900;
const BASE_H = 500;

// ── Dynamic dimensions (updated on resize) ───────────────────
let W, H, SCALE;
let GROUND_Y, FIGHTER_H, FIGHTER_W;

// ── Game constants (logical, will be multiplied by SCALE) ────
const GRAVITY      = 0.55;
const MOVE_SPEED   = 4.5;
const ATTACK_DMG   = 12;
const SPECIAL_DMG  = 32;
const ATTACK_RANGE = 95;
const ATTACK_DUR   = 18;
const ATTACK_CD    = 28;
const SPECIAL_CD   = 58;
const HIT_STUN     = 22;
const MAX_HP       = 100;
const DOUBLE_TAP_MS = 380;
const ROUND_TIME   = 90; // seconds per round

// ── Background image ─────────────────────────────────────────
const bgImage = new Image();
bgImage.src   = 'background.jpg';
let bgLoaded  = false;
bgImage.onload = () => { bgLoaded = true; };

// ── Face API (face-api.js loaded via CDN defer) ───────────────
let faceApiReady = false;

async function ensureFaceApi() {
  if (faceApiReady) return true;
  if (typeof faceapi === 'undefined') return false;
  try {
    await faceapi.nets.tinyFaceDetector.loadFromUri(
      'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights'
    );
    faceApiReady = true;
    return true;
  } catch (e) {
    console.warn('[face-api] model load failed:', e);
    return false;
  }
}

// Kick off model loading as soon as the page finishes loading
window.addEventListener('load', () => { ensureFaceApi().catch(() => {}); });

// ── Screen shake ─────────────────────────────────────────────
let shakeAmount = 0;
let shakeDx = 0, shakeDy = 0;

function triggerShake(amount) {
  shakeAmount = Math.max(shakeAmount, amount);
}

function updateShake() {
  if (shakeAmount > 0.3) {
    shakeDx = (Math.random() - 0.5) * shakeAmount * 2;
    shakeDy = (Math.random() - 0.5) * shakeAmount * 2;
    shakeAmount *= 0.72;
  } else {
    shakeAmount = 0;
    shakeDx = 0;
    shakeDy = 0;
  }
}

// ── Resize: fills viewport completely ────────────────────────
function resizeCanvas() {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width  = W;
  canvas.height = H;

  // Logical scale factor
  SCALE = Math.min(W / BASE_W, H / BASE_H);

  // Derived values
  GROUND_Y  = H - 90 * SCALE;
  FIGHTER_H = H * 0.28;   // 28% of canvas height
  FIGHTER_W = FIGHTER_H * 0.5;

  checkOrientation();
}

function checkOrientation() {
  const warn = document.getElementById('portrait-warning');
  if (warn) warn.style.display = (window.innerHeight > window.innerWidth) ? 'flex' : 'none';
}

window.addEventListener('resize', () => {
  resizeCanvas();
  // Reposition fighters after resize
  if (p1 && p2) {
    p1.x = W * 0.12;
    p2.x = W * 0.75;
    p1.y = GROUND_Y;
    p2.y = GROUND_Y;
  }
});
window.addEventListener('orientationchange', () => {
  setTimeout(() => { resizeCanvas(); }, 300);
});

// ── Fullscreen ───────────────────────────────────────────────
document.getElementById('btn-fullscreen').addEventListener('click', () => {
  const el = document.documentElement;
  if (!document.fullscreenElement) {
    (el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen).call(el);
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen).call(document);
  }
});

// ── Web Audio API ────────────────────────────────────────────
let _audioCtx = null;
function ac() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function playSound(type) {
  try {
    const a   = ac();
    const now = a.currentTime;

    if (type === 'punch') {
      const bufSize = Math.floor(a.sampleRate * 0.06);
      const buf = a.createBuffer(1, bufSize, a.sampleRate);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const src = a.createBufferSource(); src.buffer = buf;
      const g = a.createGain();
      g.gain.setValueAtTime(0.28, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      src.connect(g); g.connect(a.destination); src.start(now);

      const osc = a.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.1);
      const g2 = a.createGain();
      g2.gain.setValueAtTime(0.35, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(g2); g2.connect(a.destination); osc.start(now); osc.stop(now + 0.12);
    }

    if (type === 'special') {
      const osc = a.createOscillator(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.35);
      const g = a.createGain();
      g.gain.setValueAtTime(0.45, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(g); g.connect(a.destination); osc.start(now); osc.stop(now + 0.4);

      const bufSize = Math.floor(a.sampleRate * 0.12);
      const buf = a.createBuffer(1, bufSize, a.sampleRate);
      const d   = buf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
      const src = a.createBufferSource(); src.buffer = buf;
      const g2 = a.createGain();
      g2.gain.setValueAtTime(0.6, now);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      src.connect(g2); g2.connect(a.destination); src.start(now);
    }

    if (type === 'hit') {
      const osc = a.createOscillator(); osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(55, now + 0.15);
      const g = a.createGain();
      g.gain.setValueAtTime(0.45, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(g); g.connect(a.destination); osc.start(now); osc.stop(now + 0.2);
    }

    if (type === 'victory') {
      [261, 329, 392, 523, 659].forEach((freq, i) => {
        const t = now + i * 0.12;
        const osc = a.createOscillator(); osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);
        const g = a.createGain();
        g.gain.setValueAtTime(0.18, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(g); g.connect(a.destination); osc.start(t); osc.stop(t + 0.22);
      });
    }

    if (type === 'roundStart') {
      [330, 440].forEach((freq, i) => {
        const t = now + i * 0.15;
        const osc = a.createOscillator(); osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t);
        const g = a.createGain();
        g.gain.setValueAtTime(0.25, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(g); g.connect(a.destination); osc.start(t); osc.stop(t + 0.28);
      });
    }
  } catch (_) {}
}

function resumeAudio() {
  if (_audioCtx && _audioCtx.state === 'suspended') _audioCtx.resume();
}

// ── Input: keyboard ──────────────────────────────────────────
const keys  = {};
const vkeys = {};

window.addEventListener('keydown', e => {
  keys[e.code] = true;
  const gameKeys = ['KeyA','KeyD','KeyF','ArrowLeft','ArrowRight','KeyL','Enter','Space'];
  if (gameKeys.includes(e.code)) e.preventDefault();
  resumeAudio();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function isDown(code) { return !!(keys[code] || vkeys[code]); }

// ── Selfie System ────────────────────────────────────────────
const playerFaces = { p1: null, p2: null };

/**
 * captureAndPixelate(video) → Promise<HTMLCanvasElement>
 *
 * 1. Detect face via face-api.js (TinyFaceDetector) — or fallback to
 *    center-55% crop if detection fails / library unavailable.
 * 2. Crop to face bbox + 25% padding, drawn mirrored (selfie cam) into 200×200.
 * 3. Reduce to 48×48 with color quantisation (~32 colours, step=32).
 * 4. Scale back to 200×200 with imageSmoothingEnabled=false → pixel art look.
 */
async function captureAndPixelate(video) {
  const vw = video.videoWidth  || 320;
  const vh = video.videoHeight || 240;

  // ── 1. Face detection ──────────────────────────────────────
  let srcX, srcY, srcSize;
  let faceDetected = false;

  try {
    const ready = await ensureFaceApi();
    if (ready) {
      const det = await faceapi.detectSingleFace(
        video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 })
      );
      if (det) {
        faceDetected = true;
        const { x, y, width, height } = det.box;
        const pad = Math.max(width, height) * 0.25;
        srcX    = Math.max(0, x - pad);
        srcY    = Math.max(0, y - pad);
        const w2 = Math.min(vw - srcX, width  + pad * 2);
        const h2 = Math.min(vh - srcY, height + pad * 2);
        srcSize  = Math.min(w2, h2);
        console.log('[face-api] face detected ✓ box:', Math.round(x), Math.round(y), Math.round(width), Math.round(height));
      }
    }
  } catch (e) {
    console.warn('[face-api] detection error:', e);
  }

  // ── 2. Fallback: center 55% crop ──────────────────────────
  if (!faceDetected || !srcSize) {
    console.log('[face-api] fallback: center 55% crop');
    srcSize = Math.min(vw, vh) * 0.55;
    srcX    = (vw - srcSize) / 2;
    srcY    = (vh - srcSize) / 2;
  }

  // ── 3. Draw cropped + mirrored face into 200×200 ──────────
  const crop = document.createElement('canvas');
  crop.width = 200; crop.height = 200;
  const cc = crop.getContext('2d');
  cc.save();
  cc.translate(200, 0); cc.scale(-1, 1); // mirror (selfie cam)
  cc.imageSmoothingEnabled = true;
  cc.imageSmoothingQuality = 'high';
  cc.drawImage(video, srcX, srcY, srcSize, srcSize, 0, 0, 200, 200);
  cc.restore();

  // ── 4. Reduce to 48×48 (pixelation resolution) ───────────
  const small = document.createElement('canvas');
  small.width = 48; small.height = 48;
  const sc = small.getContext('2d');
  sc.imageSmoothingEnabled = true;
  sc.imageSmoothingQuality = 'low';
  sc.drawImage(crop, 0, 0, 48, 48);

  // ── 5. Color quantisation: ~32 colours (step = 32) ────────
  const id   = sc.getImageData(0, 0, 48, 48);
  const d    = id.data;
  const step = 32; // 256/32 = 8 levels/ch  →  moderate pixel palette
  for (let i = 0; i < d.length; i += 4) {
    d[i]   = Math.min(255, Math.round(d[i]   / step) * step);
    d[i+1] = Math.min(255, Math.round(d[i+1] / step) * step);
    d[i+2] = Math.min(255, Math.round(d[i+2] / step) * step);
  }
  sc.putImageData(id, 0, 0);

  // ── 6. Scale back to 200×200 WITHOUT smoothing (pixel art) ─
  const out = document.createElement('canvas');
  out.width = 200; out.height = 200;
  const oc = out.getContext('2d');
  oc.imageSmoothingEnabled = false;
  oc.drawImage(small, 0, 0, 200, 200);

  return out;
}

function showSelfieScreen(playerNum, palette, onDone) {
  const isP1  = playerNum === 1;
  const color = isP1 ? '#4488ff' : '#ff4444';
  const label = isP1 ? 'PLAYER 1' : 'PLAYER 2';
  const key   = isP1 ? 'p1' : 'p2';

  const overlay = document.createElement('div');
  overlay.id = 'selfie-overlay';
  overlay.innerHTML = `
    <div class="selfie-box" style="border-color:${color};box-shadow:0 0 40px ${color}44,0 0 80px ${color}22">
      <div class="selfie-badge" style="color:${color};text-shadow:0 0 12px ${color}">${label}</div>
      <div class="selfie-title">⚔ Take Your Selfie</div>
      <div class="selfie-preview-wrap" style="border-color:${color}55">
        <video id="selfie-video" autoplay playsinline muted></video>
        <div id="selfie-placeholder">📷<br><span>Camera Preview</span></div>
      </div>
      <div id="selfie-status" class="selfie-status"></div>
      <div class="selfie-buttons">
        <button id="btn-cam"  class="sbtn" style="border-color:${color};color:${color}">📷 Take Selfie</button>
        <button id="btn-cap"  class="sbtn sbtn-green" style="display:none">✓ Capture!</button>
        <button id="btn-skip" class="sbtn sbtn-gray">Skip →</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const video       = overlay.querySelector('#selfie-video');
  const placeholder = overlay.querySelector('#selfie-placeholder');
  const status      = overlay.querySelector('#selfie-status');
  const btnCam      = overlay.querySelector('#btn-cam');
  const btnCap      = overlay.querySelector('#btn-cap');
  const btnSkip     = overlay.querySelector('#btn-skip');
  let stream = null;

  function cleanup() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    overlay.remove();
  }

  btnCam.addEventListener('click', () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      status.textContent = '⚠ Camera not supported — use Skip.';
      return;
    }
    status.textContent = '⏳ Accessing camera…';
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then(s => {
        stream = s;
        video.srcObject = s;
        video.style.display = 'block';
        placeholder.style.display = 'none';
        btnCam.style.display = 'none';
        btnCap.style.display = 'inline-flex';
        status.textContent = '😄 Smile! Press Capture.';
      })
      .catch(() => { status.textContent = '⚠ Camera denied — use Skip.'; });
  });

  btnCap.addEventListener('click', async () => {
    if (!stream) return;
    status.textContent = '🔍 Detecting face…';
    btnCap.disabled = true;
    playerFaces[key] = await captureAndPixelate(video);
    cleanup();
    onDone();
  });

  btnSkip.addEventListener('click', () => { cleanup(); onDone(); });
}

// ── Colour palettes ──────────────────────────────────────────
const P1_PAL = {
  body: '#4488ff', belt: '#ffffff', hair: '#1a1a2e',
  skin: '#f4c79a', gi: '#2255cc', shadow: '#1a3366',
  accent: '#99ccff', special: '#00eeff', eyeColor: '#1a6eff',
};
const P2_PAL = {
  body: '#ff4444', belt: '#ffffff', hair: '#660000',
  skin: '#f4c79a', gi: '#cc2200', shadow: '#661111',
  accent: '#ff9966', special: '#ffdd00', eyeColor: '#ff2200',
};

// ── Particle system ──────────────────────────────────────────
const particles = [];

function spawnParticles(x, y, color, count = 14, speedMult = 1) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = (3 + Math.random() * 6) * speedMult * SCALE;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 3 * SCALE,
      life: 1,
      decay: 0.03 + Math.random() * 0.035,
      r: (5 + Math.random() * 8) * speedMult * SCALE,
      color,
    });
  }
}

function spawnSpecialBurst(x, y, color) {
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2;
    const spd   = (6 + Math.random() * 10) * SCALE;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 2 * SCALE,
      life: 1, decay: 0.022 + Math.random() * 0.018,
      r: (6 + Math.random() * 9) * SCALE, color,
    });
  }
  for (let i = 0; i < 16; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = (10 + Math.random() * 12) * SCALE;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 4 * SCALE,
      life: 1, decay: 0.045 + Math.random() * 0.035,
      r: (3 + Math.random() * 4) * SCALE, color: '#ffffff',
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x  += p.vx; p.y += p.vy;
    p.vy += 0.22; p.vx *= 0.96;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life * 0.9;
    ctx.fillStyle   = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * Math.max(0.1, p.life), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;
}

// ── Fighter class ─────────────────────────────────────────────
class Fighter {
  constructor(startXRatio, facingRight, palette, name) {
    this.startXRatio = startXRatio;
    this.x           = W * startXRatio;
    this.y           = GROUND_Y;
    this.vy          = 0;
    this.onGround    = true;
    this.facingRight = facingRight;
    this.palette     = palette;
    this.name        = name;

    this.hp          = MAX_HP;
    this.alive       = true;

    this.attacking       = false;
    this.attackTimer     = 0;
    this.isSpecial       = false;
    this.specialQueued   = false;
    this.cooldown        = 0;

    this.lastAttackPressTime = 0;
    this.prevAttackDown      = false;

    this.stunTimer  = 0;
    this.shakeX     = 0;
    this.flashTimer = 0;

    this.walkFrame  = 0;
    this.idleTimer  = 0;
    this.deathTimer = 0;
    this.bobOffset  = Math.random() * Math.PI * 2; // desync idle bobs

    this.faceCanvas = null; // 16×16 selfie
    this.hudFace    = null; // 32×32 HUD thumbnail
  }

  // Center X in world coords
  get cx() { return this.x + this.w / 2; }

  // Chibi dimensions (dynamic, computed from FIGHTER_H)
  get h() { return FIGHTER_H; }
  get w() { return FIGHTER_W; }

  // Head is 58% of total height
  get headH() { return this.h * 0.58; }
  get headW() { return this.headH * 0.95; }

  // Body + legs occupy the remaining 42%
  get bodyH() { return this.h * 0.24; }
  get legH()  { return this.h * 0.18; }

  update(leftKey, rightKey, attackKey, opponent) {
    if (!this.alive) { this.deathTimer++; return; }

    this.idleTimer++;

    if (this.stunTimer  > 0) this.stunTimer--;
    if (this.cooldown   > 0) this.cooldown--;
    if (this.flashTimer > 0) this.flashTimer--;
    this.shakeX *= 0.55;

    if (this.attacking) {
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        const wasSpecial = this.isSpecial;
        this.attacking  = false;
        this.isSpecial  = false;
        this.cooldown   = wasSpecial ? SPECIAL_CD : ATTACK_CD;
      }
    }

    if (!this.attacking && this.cooldown === 0 && this.specialQueued) {
      this.specialQueued = false;
      this._doAttack(opponent, true);
      return;
    }

    const stunned = this.stunTimer > 0;

    if (!stunned) {
      const spd = MOVE_SPEED * SCALE;
      if (isDown(leftKey)) {
        this.x -= spd;
        this.facingRight = false;
        this.walkFrame++;
      } else if (isDown(rightKey)) {
        this.x += spd;
        this.facingRight = true;
        this.walkFrame++;
      } else {
        this.walkFrame = 0;
      }

      const attackDown = isDown(attackKey);
      const justPressed = attackDown && !this.prevAttackDown;
      this.prevAttackDown = attackDown;

      if (justPressed) {
        resumeAudio();
        const now = performance.now();
        const isDoubleTap = (now - this.lastAttackPressTime) < DOUBLE_TAP_MS;
        this.lastAttackPressTime = now;

        if (!this.attacking && this.cooldown === 0) {
          this._doAttack(opponent, isDoubleTap);
        } else if (isDoubleTap) {
          this.specialQueued = true;
        }
      } else if (!attackDown) {
        this.prevAttackDown = false;
      }
    } else {
      this.prevAttackDown = isDown(attackKey);
    }

    // Clamp to canvas
    this.x = Math.max(this.w * 0.1, Math.min(W - this.w * 1.1, this.x));

    if (!this.onGround) {
      this.vy += GRAVITY * SCALE;
      this.y  += this.vy;
      if (this.y >= GROUND_Y) {
        this.y = GROUND_Y; this.vy = 0; this.onGround = true;
      }
    }
  }

  _doAttack(opponent, isSpecial) {
    this.attacking   = true;
    this.isSpecial   = isSpecial;
    this.attackTimer = isSpecial ? Math.floor(ATTACK_DUR * 1.6) : ATTACK_DUR;
    this._tryHit(opponent, isSpecial);
    playSound(isSpecial ? 'special' : 'punch');
  }

  _tryHit(opponent, isSpecial) {
    if (!opponent.alive) return;
    const dx      = Math.abs(this.cx - opponent.cx);
    const range   = (isSpecial ? ATTACK_RANGE * 1.4 : ATTACK_RANGE) * SCALE;
    const inRange = dx <= range;
    const facing  = this.facingRight ? (opponent.cx > this.cx) : (opponent.cx < this.cx);
    if (inRange && facing) opponent.takeHit(isSpecial ? SPECIAL_DMG : ATTACK_DMG, isSpecial);
  }

  takeHit(dmg, isSpecial) {
    if (!this.alive) return;
    this.hp        = Math.max(0, this.hp - dmg);
    this.stunTimer = HIT_STUN + (isSpecial ? 14 : 0);
    this.shakeX    = (isSpecial ? 18 : 10) * SCALE * (Math.random() > 0.5 ? 1 : -1);
    this.flashTimer = isSpecial ? 24 : 12;
    playSound('hit');
    if (isSpecial) triggerShake(14 * SCALE);
    else           triggerShake(5 * SCALE);
    if (this.hp === 0) { this.alive = false; this.deathTimer = 0; }
  }

  // ── Drawing ───────────────────────────────────────────────
  draw() {
    const sx = Math.round(this.shakeX);
    const bx = this.x + sx;
    const by = this.y;

    // Shadow circle below fighter
    const shadowW = this.w * 1.1;
    const shadowH = shadowW * 0.18;
    const grd = ctx.createRadialGradient(bx + this.w/2, by + 2, 0, bx + this.w/2, by + 2, shadowW * 0.5);
    grd.addColorStop(0, 'rgba(0,0,0,0.45)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(bx + this.w/2, by + 4, shadowW * 0.55, shadowH, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(bx + this.w / 2, by);
    if (!this.facingRight) ctx.scale(-1, 1);

    if (!this.alive) {
      const t = Math.min(this.deathTimer / 45, 1);
      ctx.rotate(t * Math.PI / 2);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, this.deathTimer - 35) / 20);
    }

    if (this.flashTimer > 0 && Math.floor(this.flashTimer / 2) % 2 === 0) {
      ctx.filter = 'brightness(4) saturate(0)';
    }

    const bob     = (this.alive && this.walkFrame === 0)
      ? Math.sin(this.idleTimer * 0.055 + this.bobOffset) * 2.2 * SCALE : 0;
    const leanMax  = this.isSpecial ? 14 * SCALE : 8 * SCALE;
    const leanProg = this.attacking
      ? (1 - this.attackTimer / (this.isSpecial ? ATTACK_DUR * 1.6 : ATTACK_DUR)) : 0;
    const lean = leanMax * leanProg;

    this._drawChibi(bob, lean);

    ctx.filter = 'none';
    ctx.restore();

    // Special aura
    if (this.attacking && this.isSpecial) {
      const p = this.palette;
      const t = this.attackTimer / (ATTACK_DUR * 1.6);
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.35;
      const gd = ctx.createRadialGradient(bx + this.w/2, by - this.h/2, 5, bx + this.w/2, by - this.h/2, 90 * SCALE);
      gd.addColorStop(0, p.special);
      gd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gd;
      ctx.beginPath();
      ctx.arc(bx + this.w/2, by - this.h/2, 90 * SCALE, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawChibi(bob, lean) {
    const p = this.palette;
    const h = this.h;

    // ── Y positions from bottom (y=0 is ground contact) ──
    // Legs start at y=0, go up legH
    // Body sits on top of legs
    // Head sits on top of body (and is biggest!)

    const legH   = this.legH;
    const bodyH  = this.bodyH;
    const headH  = this.headH;
    const headW  = this.headW;
    const bodyW  = this.w * 0.68;
    const legW   = this.w * 0.24;

    // Walk animation
    const legSwing = (this.onGround && this.walkFrame > 0)
      ? Math.sin(this.walkFrame * 0.4) * 8 * SCALE : 0;

    // ── LEGS ──
    // Left leg (back)
    ctx.fillStyle = p.shadow;
    this._rr(-legW * 1.1, -legH + bob, legW, legH, 4 * SCALE);
    // Right leg (front)
    ctx.fillStyle = p.gi;
    this._rr(legW * 0.1 + legSwing, -legH + bob, legW, legH, 4 * SCALE);

    // Shoes
    ctx.fillStyle = '#111';
    this._rr(-legW * 1.2, -4 * SCALE + bob, legW + 4 * SCALE, 6 * SCALE, [0, 0, 4 * SCALE, 4 * SCALE]);
    this._rr(legW * 0.0 + legSwing, -4 * SCALE + bob, legW + 4 * SCALE, 6 * SCALE, [0, 0, 4 * SCALE, 4 * SCALE]);

    // ── BODY ──
    ctx.save();
    ctx.translate(lean, 0);

    const bodyY = -legH - bodyH + bob;
    ctx.fillStyle = p.gi;
    this._rr(-bodyW / 2, bodyY, bodyW, bodyH, 5 * SCALE);

    // Belt
    ctx.fillStyle = p.belt;
    this._rr(-bodyW / 2, bodyY + bodyH * 0.65, bodyW, bodyH * 0.18, 2 * SCALE);

    // Back arm
    const armW = bodyW * 0.28;
    const armH = bodyH * 0.9;
    const armSwing = -legSwing * 0.6;
    ctx.fillStyle = p.shadow;
    this._rr(-bodyW / 2 - armW * 0.5, bodyY + bodyH * 0.1 + armSwing, armW, armH, 4 * SCALE);

    // Front arm / attacking arm
    if (this.attacking) {
      const frac = this.isSpecial
        ? (1 - this.attackTimer / (ATTACK_DUR * 1.6))
        : (1 - this.attackTimer / ATTACK_DUR);
      const ext = frac * (this.isSpecial ? 55 * SCALE : 38 * SCALE);

      if (this.isSpecial) {
        // Energy fist with glow
        ctx.fillStyle = p.special;
        ctx.shadowColor = p.special;
        ctx.shadowBlur  = 22;
        this._rr(bodyW * 0.35, bodyY + bodyH * 0.08, armW + ext, armH * 0.7, 6 * SCALE);
        // Fist orb
        ctx.beginPath();
        ctx.arc(bodyW * 0.35 + armW + ext, bodyY + bodyH * 0.35, 10 * SCALE, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = p.skin;
        this._rr(bodyW * 0.35, bodyY + bodyH * 0.15, armW * 0.85 + ext, armH * 0.65, 4 * SCALE);
        // Fist knuckle
        ctx.fillStyle = p.skin;
        ctx.beginPath();
        ctx.arc(bodyW * 0.35 + armW * 0.85 + ext, bodyY + bodyH * 0.42, 6 * SCALE, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Resting front arm
      ctx.fillStyle = p.gi;
      this._rr(bodyW * 0.22, bodyY + bodyH * 0.1 - armSwing, armW, armH, 4 * SCALE);
    }

    // Neck
    const neckW = headW * 0.22;
    ctx.fillStyle = p.skin;
    this._rr(-neckW / 2, bodyY - 6 * SCALE, neckW, 7 * SCALE, 2 * SCALE);

    // ── HEAD (chibi bobblehead — 58% of total height) ──
    const headY = bodyY - headH + 2 * SCALE;

    if (this.faceCanvas) {
      // ── Circular selfie head ──────────────────────────────
      const hcx = 0;                        // already translated to fighter center
      const hcy = headY + headH / 2;        // vertical center of head area
      const hR  = Math.min(headW, headH) * 0.5; // radius

      // Glow ring behind the circle (player color)
      ctx.save();
      ctx.shadowColor = p.body;
      ctx.shadowBlur  = 18 * SCALE;
      ctx.strokeStyle = p.body;
      ctx.lineWidth   = 5 * SCALE;
      ctx.beginPath();
      ctx.arc(hcx, hcy, hR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Clip to circle, draw face
      ctx.save();
      ctx.beginPath();
      ctx.arc(hcx, hcy, hR - 1.5 * SCALE, 0, Math.PI * 2);
      ctx.clip();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.faceCanvas, hcx - hR, hcy - hR, hR * 2, hR * 2);
      ctx.restore();

      // Crisp border ring on top
      ctx.strokeStyle = p.body;
      ctx.lineWidth   = 3.5 * SCALE;
      ctx.beginPath();
      ctx.arc(hcx, hcy, hR, 0, Math.PI * 2);
      ctx.stroke();

    } else {
      // Default chibi face
      ctx.fillStyle = p.skin;
      this._rr(-headW / 2, headY, headW, headH, headH * 0.15);

      // Hair (top ~25%)
      ctx.fillStyle = p.hair;
      this._rr(-headW / 2, headY, headW, headH * 0.28, [headH * 0.15, headH * 0.15, 0, 0]);

      // Side hair flaps
      ctx.fillStyle = p.hair;
      this._rr(-headW / 2 - 4 * SCALE, headY + headH * 0.12, 8 * SCALE, headH * 0.3, 3 * SCALE);
      this._rr(headW / 2 - 4 * SCALE, headY + headH * 0.12, 8 * SCALE, headH * 0.3, 3 * SCALE);

      // Eyes — BIG chibi eyes
      const eyeY   = headY + headH * 0.42;
      const eyeR   = headH * 0.13;
      const blink  = Math.floor(this.idleTimer / 90) % 11 === 0;

      if (this.stunTimer > 0) {
        // X eyes when stunned
        ctx.strokeStyle = '#cc4400';
        ctx.lineWidth   = 2.5 * SCALE;
        const ex1 = -headW * 0.22, ex2 = headW * 0.1;
        [ex1, ex2].forEach(ex => {
          ctx.beginPath();
          ctx.moveTo(ex - eyeR * 0.7, eyeY - eyeR * 0.7);
          ctx.lineTo(ex + eyeR * 0.7, eyeY + eyeR * 0.7);
          ctx.moveTo(ex + eyeR * 0.7, eyeY - eyeR * 0.7);
          ctx.lineTo(ex - eyeR * 0.7, eyeY + eyeR * 0.7);
          ctx.stroke();
        });
      } else if (blink) {
        ctx.fillStyle = '#111';
        ctx.fillRect(-headW * 0.3, eyeY - 1.5 * SCALE, headW * 0.24, 3 * SCALE);
        ctx.fillRect(headW * 0.06, eyeY - 1.5 * SCALE, headW * 0.24, 3 * SCALE);
      } else {
        // Big shiny eyes
        const eyePositions = [-headW * 0.18, headW * 0.18];
        eyePositions.forEach(ex => {
          // Outer eye
          ctx.fillStyle = '#111';
          ctx.beginPath(); ctx.ellipse(ex, eyeY, eyeR, eyeR, 0, 0, Math.PI * 2); ctx.fill();
          // Iris
          ctx.fillStyle = p.eyeColor;
          ctx.beginPath(); ctx.ellipse(ex, eyeY, eyeR * 0.72, eyeR * 0.72, 0, 0, Math.PI * 2); ctx.fill();
          // Shine 1
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.beginPath(); ctx.ellipse(ex - eyeR * 0.2, eyeY - eyeR * 0.2, eyeR * 0.28, eyeR * 0.28, 0, 0, Math.PI * 2); ctx.fill();
          // Shine 2 (small)
          ctx.beginPath(); ctx.ellipse(ex + eyeR * 0.2, eyeY + eyeR * 0.1, eyeR * 0.12, eyeR * 0.12, 0, 0, Math.PI * 2); ctx.fill();
        });

        // Reactive eyebrows
        const browY  = headY + headH * 0.3;
        const isAngry = this.attacking;
        ctx.strokeStyle = p.hair;
        ctx.lineWidth   = 2.5 * SCALE;
        ctx.lineCap     = 'round';
        ctx.beginPath();
        ctx.moveTo(-headW * 0.3, browY + (isAngry ? -4 * SCALE : 2 * SCALE));
        ctx.lineTo(-headW * 0.06, browY + (isAngry ? 2 * SCALE : -1 * SCALE));
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(headW * 0.06, browY + (isAngry ? 2 * SCALE : -1 * SCALE));
        ctx.lineTo(headW * 0.3, browY + (isAngry ? -4 * SCALE : 2 * SCALE));
        ctx.stroke();
      }

      // Mouth
      const mouthY = headY + headH * 0.7;
      ctx.strokeStyle = this.stunTimer > 0 ? '#cc4400' : '#c06030';
      ctx.lineWidth   = 2 * SCALE;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      if (this.stunTimer > 0) {
        // Pain face — upward frown
        ctx.moveTo(-headW * 0.18, mouthY + 3 * SCALE);
        ctx.quadraticCurveTo(0, mouthY - 5 * SCALE, headW * 0.18, mouthY + 3 * SCALE);
      } else if (this.attacking) {
        // Wide grin while attacking
        ctx.moveTo(-headW * 0.22, mouthY);
        ctx.quadraticCurveTo(0, mouthY + 8 * SCALE, headW * 0.22, mouthY);
      } else {
        // Slight smile
        ctx.moveTo(-headW * 0.16, mouthY);
        ctx.quadraticCurveTo(0, mouthY + 5 * SCALE, headW * 0.16, mouthY);
      }
      ctx.stroke();

      // Rosy cheeks
      ctx.fillStyle = 'rgba(255,140,140,0.28)';
      ctx.beginPath(); ctx.ellipse(-headW * 0.28, headY + headH * 0.58, headW * 0.13, headH * 0.07, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(headW * 0.28, headY + headH * 0.58, headW * 0.13, headH * 0.07, 0, 0, Math.PI * 2); ctx.fill();
    }

    ctx.restore(); // torso translate
  }

  // Rounded rect fill
  _rr(x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r];
    ctx.beginPath();
    ctx.moveTo(x + r[0], y);
    ctx.lineTo(x + w - r[1], y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r[1]);
    ctx.lineTo(x + w, y + h - r[2]);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
    ctx.lineTo(x + r[3], y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r[3]);
    ctx.lineTo(x, y + r[0]);
    ctx.quadraticCurveTo(x, y, x + r[0], y);
    ctx.closePath();
    ctx.fill();
  }

  _rrPath(x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r];
    ctx.beginPath();
    ctx.moveTo(x + r[0], y);
    ctx.lineTo(x + w - r[1], y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r[1]);
    ctx.lineTo(x + w, y + h - r[2]);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
    ctx.lineTo(x + r[3], y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r[3]);
    ctx.lineTo(x, y + r[0]);
    ctx.quadraticCurveTo(x, y, x + r[0], y);
    ctx.closePath();
  }
}

// ── Background drawing ────────────────────────────────────────
function drawBackground() {
  if (bgLoaded) {
    ctx.drawImage(bgImage, 0, 0, W, H);
    // Subtle dark overlay for contrast
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.fillRect(0, 0, W, H);
  } else {
    // Fallback gradient while loading
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   '#0d0d1a');
    sky.addColorStop(0.65,'#1a0a2e');
    sky.addColorStop(1,   '#2d0a3d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
  }

  // Neon ground line
  ctx.strokeStyle = 'rgba(200,80,255,0.6)';
  ctx.lineWidth   = 2.5 * SCALE;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();

  // Perspective grid on floor
  ctx.strokeStyle = 'rgba(180,60,255,0.12)';
  ctx.lineWidth   = 1;
  const gridStep = 70 * SCALE;
  for (let gx = 0; gx <= W; gx += gridStep) {
    ctx.beginPath(); ctx.moveTo(gx, GROUND_Y); ctx.lineTo(W / 2, H + 60); ctx.stroke();
  }
  for (let gy = GROUND_Y; gy <= H; gy += 22 * SCALE) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }
}

// ── HUD ──────────────────────────────────────────────────────
function drawHUD(p1, p2, roundNum, p1Wins, p2Wins, roundTimer) {
  const pad     = 12 * SCALE;
  const barH    = Math.max(18, 26 * SCALE);
  const barW    = (W / 2) - pad * 3.5;
  const hudY    = 10 * SCALE;
  const faceSize = barH * 1.8;

  // ── P1 Health bar (left side) ──
  const p1BarX = pad + faceSize + 6 * SCALE;
  const p1BarW = barW - faceSize - 6 * SCALE;
  const p1p    = p1.hp / MAX_HP;

  // Face avatar circle
  _drawFaceAvatar(pad, hudY + barH / 2 - faceSize / 2, faceSize, p1, '#4488ff');

  // Bar background
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.beginPath();
  ctx.roundRect(p1BarX, hudY, p1BarW, barH, barH / 3);
  ctx.fill();

  // Bar fill (right to left for p1 = left-aligned depleting)
  if (p1p > 0) {
    const g1 = ctx.createLinearGradient(p1BarX, 0, p1BarX + p1BarW * p1p, 0);
    if (p1p > 0.5) {
      g1.addColorStop(0, '#22aaff'); g1.addColorStop(1, '#4466ff');
    } else if (p1p > 0.25) {
      g1.addColorStop(0, '#ffaa22'); g1.addColorStop(1, '#ff6600');
    } else {
      g1.addColorStop(0, '#ff3333'); g1.addColorStop(1, '#cc0000');
    }
    ctx.fillStyle = g1;
    ctx.beginPath();
    ctx.roundRect(p1BarX, hudY, p1BarW * p1p, barH, barH / 3);
    ctx.fill();
  }

  // Bar border
  ctx.strokeStyle = '#4488ff';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(p1BarX, hudY, p1BarW, barH, barH / 3);
  ctx.stroke();

  // P1 name
  ctx.fillStyle = '#ddeeff';
  ctx.font      = `bold ${Math.max(10, 12 * SCALE)}px Courier New`;
  ctx.textAlign = 'left';
  ctx.fillText('RYU', p1BarX + 6 * SCALE, hudY + barH * 0.7);

  // HP number
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font      = `${Math.max(9, 10 * SCALE)}px Courier New`;
  ctx.textAlign = 'right';
  ctx.fillText(p1.hp, p1BarX + p1BarW - 4 * SCALE, hudY + barH * 0.7);

  // ── P2 Health bar (right side, mirror) ──
  const p2FaceX = W - pad - faceSize;
  const p2BarX  = W - pad - faceSize - 6 * SCALE - (barW - faceSize - 6 * SCALE);
  const p2BarW  = barW - faceSize - 6 * SCALE;
  const p2p     = p2.hp / MAX_HP;

  _drawFaceAvatar(p2FaceX, hudY + barH / 2 - faceSize / 2, faceSize, p2, '#ff4444');

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.beginPath();
  ctx.roundRect(p2BarX, hudY, p2BarW, barH, barH / 3);
  ctx.fill();

  if (p2p > 0) {
    const g2 = ctx.createLinearGradient(p2BarX + p2BarW, 0, p2BarX + p2BarW - p2BarW * p2p, 0);
    if (p2p > 0.5) {
      g2.addColorStop(0, '#ff4466'); g2.addColorStop(1, '#ff2222');
    } else if (p2p > 0.25) {
      g2.addColorStop(0, '#ffaa22'); g2.addColorStop(1, '#ff6600');
    } else {
      g2.addColorStop(0, '#ff0000'); g2.addColorStop(1, '#880000');
    }
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.roundRect(p2BarX + p2BarW * (1 - p2p), hudY, p2BarW * p2p, barH, barH / 3);
    ctx.fill();
  }

  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(p2BarX, hudY, p2BarW, barH, barH / 3);
  ctx.stroke();

  ctx.fillStyle = '#ffeedd';
  ctx.font      = `bold ${Math.max(10, 12 * SCALE)}px Courier New`;
  ctx.textAlign = 'right';
  ctx.fillText('KEN', p2BarX + p2BarW - 6 * SCALE, hudY + barH * 0.7);

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font      = `${Math.max(9, 10 * SCALE)}px Courier New`;
  ctx.textAlign = 'left';
  ctx.fillText(p2.hp, p2BarX + 4 * SCALE, hudY + barH * 0.7);

  // ── Center panel: Round + Timer + Win dots ──
  const cPanelW = 120 * SCALE;
  const cPanelH = barH * 2.6;
  const cPanelX = W / 2 - cPanelW / 2;
  const cPanelY = hudY - 4 * SCALE;

  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.beginPath();
  ctx.roundRect(cPanelX, cPanelY, cPanelW, cPanelH, 8 * SCALE);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,204,0,0.5)';
  ctx.lineWidth   = 1.5;
  ctx.beginPath();
  ctx.roundRect(cPanelX, cPanelY, cPanelW, cPanelH, 8 * SCALE);
  ctx.stroke();

  // Round label
  ctx.fillStyle = '#ffcc00';
  ctx.font      = `bold ${Math.max(9, 11 * SCALE)}px Courier New`;
  ctx.textAlign = 'center';
  ctx.fillText(`ROUND ${roundNum}`, W / 2, cPanelY + cPanelH * 0.32);

  // Timer
  const timeLeft = Math.max(0, Math.ceil(roundTimer));
  const timerColor = timeLeft <= 10 ? '#ff4444' : '#ffffff';
  ctx.fillStyle = timerColor;
  ctx.font      = `bold ${Math.max(14, 19 * SCALE)}px Courier New`;
  if (timeLeft <= 10 && Math.floor(timeLeft) !== Math.floor(timeLeft + 0.1)) {
    ctx.shadowColor = '#ff4444'; ctx.shadowBlur = 10;
  }
  ctx.fillText(timeLeft, W / 2, cPanelY + cPanelH * 0.63);
  ctx.shadowBlur = 0;

  // Win dots (●●○)
  const dotR  = 5 * SCALE;
  const dotY  = cPanelY + cPanelH * 0.87;
  const dotSpacing = dotR * 2.8;

  // P1 wins (left of center)
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.arc(W / 2 - dotSpacing * 2.5 + i * dotSpacing, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i < p1Wins ? '#4488ff' : 'rgba(68,136,255,0.2)';
    ctx.fill();
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  // P2 wins (right of center)
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.arc(W / 2 + dotSpacing * 1.5 + i * dotSpacing, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i < p2Wins ? '#ff4444' : 'rgba(255,68,68,0.2)';
    ctx.fill();
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  // VS text between dots
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font      = `bold ${Math.max(7, 8 * SCALE)}px Courier New`;
  ctx.textAlign = 'center';
  ctx.fillText('VS', W / 2, dotY + dotR * 0.4);
}

function _drawFaceAvatar(x, y, size, fighter, borderColor) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.clip();

  if (fighter.faceCanvas) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(fighter.faceCanvas, x, y, size, size);
  } else {
    // Default: gradient circle with initial
    const grd = ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, size/2);
    grd.addColorStop(0, borderColor + '88');
    grd.addColorStop(1, borderColor + '22');
    ctx.fillStyle = grd;
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#fff';
    ctx.font      = `bold ${size * 0.5}px Courier New`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fighter.name[0], x + size / 2, y + size / 2);
    ctx.textBaseline = 'alphabetic';
  }

  ctx.restore();

  // Border circle
  ctx.strokeStyle = borderColor;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.stroke();
}

// ── Round banner ─────────────────────────────────────────────
function drawBanner(text, sub, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, W, H);

  const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.45);
  grd.addColorStop(0, color + '55');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

  const fontSize = Math.max(36, 72 * SCALE);
  ctx.textAlign   = 'center';
  ctx.font        = `bold ${fontSize}px Courier New`;
  ctx.fillStyle   = color;
  ctx.shadowColor = color;
  ctx.shadowBlur  = 36;
  ctx.fillText(text, W / 2, H / 2 - 10 * SCALE);
  ctx.shadowBlur  = 0;

  if (sub) {
    ctx.font      = `bold ${Math.max(14, 20 * SCALE)}px Courier New`;
    ctx.fillStyle = '#aaa';
    ctx.shadowBlur = 0;
    ctx.fillText(sub, W / 2, H / 2 + 50 * SCALE);
  }
}

// ── Game state ────────────────────────────────────────────────
let p1, p2;
let roundOver, gameOver, winner, roundWinner;
let roundNum, p1Wins, p2Wins;
let prevP1HP, prevP2HP;
let roundOverTimer = 0;
let roundStartBanner = 0;
let flashScreen  = 0;
let roundTimer   = ROUND_TIME; // countdown in seconds
let lastTimestamp = 0;
let timeoutWin = null;

function initRound() {
  resizeCanvas(); // re-calc dimensions
  p1 = new Fighter(0.12,  true,  P1_PAL, 'RYU');
  p2 = new Fighter(0.75, false,  P2_PAL, 'KEN');
  if (playerFaces.p1) { p1.faceCanvas = playerFaces.p1; }
  if (playerFaces.p2) { p2.faceCanvas = playerFaces.p2; }
  roundOver       = false;
  roundWinner     = null;
  prevP1HP        = MAX_HP;
  prevP2HP        = MAX_HP;
  particles.length = 0;
  roundStartBanner = 110;
  flashScreen     = 0;
  roundTimer      = ROUND_TIME;
  timeoutWin      = null;
  shakeAmount     = 0;
  playSound('roundStart');
}

function initGame() {
  roundNum = 1; p1Wins = 0; p2Wins = 0;
  gameOver = false; winner = null;
  roundOverTimer = 0;
  initRound();
}

// ── Main loop ─────────────────────────────────────────────────
function loop(timestamp) {
  requestAnimationFrame(loop);

  // Delta time for timer
  const dt = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.1) : 0;
  lastTimestamp = timestamp;

  updateShake();

  if (flashScreen > 0) flashScreen--;
  if (roundStartBanner > 0) roundStartBanner--;

  // Apply shake offset to canvas context
  ctx.save();
  ctx.translate(shakeDx, shakeDy);

  // ── GAME OVER screen ──
  if (gameOver) {
    if (isDown('Enter')) initGame();
    drawBackground();
    if (p1.x < p2.x) { p2.draw(); p1.draw(); } else { p1.draw(); p2.draw(); }
    drawParticles();
    drawHUD(p1, p2, roundNum, p1Wins, p2Wins, 0);
    drawBanner(`${winner} WINS!`, 'Press ENTER / ↺ to play again',
      winner === 'RYU' ? '#4488ff' : '#ff4444');
    ctx.restore();
    return;
  }

  // ── ROUND OVER screen ──
  if (roundOver) {
    roundOverTimer++;
    drawBackground();
    if (p1.x < p2.x) { p2.draw(); p1.draw(); } else { p1.draw(); p2.draw(); }
    updateParticles(); drawParticles();
    drawHUD(p1, p2, roundNum, p1Wins, p2Wins, 0);
    drawBanner(`${roundWinner} wins round!`,
      roundOverTimer < 130 ? '' : 'Next round…',
      roundWinner === 'RYU' ? '#4488ff' : '#ff4444');
    if (roundOverTimer > 210) {
      roundNum++;
      initRound();
      roundOverTimer = 0;
    }
    ctx.restore();
    return;
  }

  // ── Timer countdown (only when fight is active) ──
  if (roundStartBanner === 0 && !roundOver && !gameOver) {
    roundTimer -= dt;
    if (roundTimer <= 0 && !timeoutWin) {
      // Time out — fighter with more HP wins
      timeoutWin = true;
      roundOver  = true;
      if (p1.hp > p2.hp)      roundWinner = 'RYU';
      else if (p2.hp > p1.hp) roundWinner = 'KEN';
      else                     roundWinner = 'RYU'; // tie → p1 wins
      if (roundWinner === 'RYU') p1Wins++; else p2Wins++;
      playSound('victory');
      if (p1Wins >= 2 || p2Wins >= 2) { gameOver = true; winner = roundWinner; }
    }
  }

  // ── UPDATE ──
  p1.update('KeyA', 'KeyD', 'KeyF', p2);
  p2.update('ArrowLeft', 'ArrowRight', 'KeyL', p1);

  // Damage particles
  if (p1.hp < prevP1HP) {
    const sp = (prevP1HP - p1.hp) > ATTACK_DMG;
    spawnParticles(p1.cx, p1.y - p1.h * 0.6, '#ff6644', sp ? 26 : 12, sp ? 1.6 : 1);
    if (sp) spawnSpecialBurst(p1.cx, p1.y - p1.h * 0.6, '#ff9900');
    if (sp) { flashScreen = 12; }
  }
  if (p2.hp < prevP2HP) {
    const sp = (prevP2HP - p2.hp) > ATTACK_DMG;
    spawnParticles(p2.cx, p2.y - p2.h * 0.6, '#44aaff', sp ? 26 : 12, sp ? 1.6 : 1);
    if (sp) spawnSpecialBurst(p2.cx, p2.y - p2.h * 0.6, '#00ccff');
    if (sp) { flashScreen = 12; }
  }
  prevP1HP = p1.hp; prevP2HP = p2.hp;

  updateParticles();

  // Check round end
  if (!roundOver && (!p1.alive || !p2.alive)) {
    roundOver   = true;
    roundWinner = !p1.alive ? 'KEN' : 'RYU';
    if (roundWinner === 'RYU') p1Wins++; else p2Wins++;
    playSound('victory');
    if (p1Wins >= 2 || p2Wins >= 2) { gameOver = true; winner = roundWinner; }
  }

  // ── DRAW ──
  drawBackground();

  // Screen flash for specials
  if (flashScreen > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flashScreen / 24})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (p1.x < p2.x) { p2.draw(); p1.draw(); }
  else              { p1.draw(); p2.draw(); }

  drawParticles();
  drawHUD(p1, p2, roundNum, p1Wins, p2Wins, roundTimer);

  // Round start banner animation
  if (roundStartBanner > 0) {
    const a = Math.min(1, roundStartBanner / 25) * Math.min(1, (roundStartBanner / 110) * 2.5);
    ctx.globalAlpha = Math.max(0, a);
    ctx.textAlign   = 'center';
    const bigFont = Math.max(40, 68 * SCALE);
    if (roundStartBanner > 42) {
      ctx.font        = `bold ${bigFont}px Courier New`;
      ctx.fillStyle   = '#ffcc00';
      ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 28;
      ctx.fillText(`ROUND ${roundNum}`, W / 2, H / 2);
    } else {
      ctx.font        = `bold ${Math.max(46, 80 * SCALE)}px Courier New`;
      ctx.fillStyle   = '#ff4444';
      ctx.shadowColor = '#ff4444'; ctx.shadowBlur = 36;
      ctx.fillText('FIGHT!', W / 2, H / 2);
    }
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;
  }

  ctx.restore(); // shake restore
}

// ── Desktop controls hint (on canvas) ────────────────────────
// (no longer needed — controls shown via mobile buttons)

// ── Mobile Controls ──────────────────────────────────────────
function setupMobileControls() {
  const btnMap = {
    'p1-left':   'KeyA',
    'p1-right':  'KeyD',
    'p1-attack': 'KeyF',
    'p2-left':   'ArrowLeft',
    'p2-right':  'ArrowRight',
    'p2-attack': 'KeyL',
  };

  for (const [id, code] of Object.entries(btnMap)) {
    const btn = document.getElementById(id);
    if (!btn) continue;

    const press = e => {
      e.preventDefault();
      vkeys[code] = true;
      btn.classList.add('active');
      resumeAudio();
    };
    const release = e => {
      e.preventDefault();
      vkeys[code] = false;
      btn.classList.remove('active');
    };

    btn.addEventListener('touchstart',  press,   { passive: false });
    btn.addEventListener('touchend',    release, { passive: false });
    btn.addEventListener('touchcancel', release, { passive: false });
    btn.addEventListener('mousedown',  press);
    btn.addEventListener('mouseup',    release);
    btn.addEventListener('mouseleave', release);
  }

  const rb = document.getElementById('btn-restart');
  if (rb) {
    rb.addEventListener('touchstart', e => {
      e.preventDefault();
      resumeAudio();
      if (gameOver || roundOver) initGame();
    }, { passive: false });
    rb.addEventListener('click', () => {
      resumeAudio();
      if (gameOver || roundOver) initGame();
    });
  }
}

// ── roundRect polyfill (for older mobile browsers) ───────────
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r];
    else if (r.length === 1) r = [r[0], r[0], r[0], r[0]];
    this.beginPath();
    this.moveTo(x + r[0], y);
    this.lineTo(x + w - r[1], y);
    this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
    this.lineTo(x + w, y + h - r[2]);
    this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
    this.lineTo(x + r[3], y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
    this.lineTo(x, y + r[0]);
    this.quadraticCurveTo(x, y, x + r[0], y);
    this.closePath();
  };
}

// ── Boot ─────────────────────────────────────────────────────
resizeCanvas();
setupMobileControls();

showSelfieScreen(1, P1_PAL, () => {
  showSelfieScreen(2, P2_PAL, () => {
    initGame();
    requestAnimationFrame(loop);
  });
});
