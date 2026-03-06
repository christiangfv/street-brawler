// ============================================================
//  STREET BRAWLER v2 — Mobile-Ready Arcade Edition
//  Vanilla JS + HTML5 Canvas | No dependencies
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
canvas.width  = 900;
canvas.height = 500;

const W = canvas.width;
const H = canvas.height;

// ── Constants ────────────────────────────────────────────────
const GROUND_Y     = H - 80;
const GRAVITY      = 0.6;
const MOVE_SPEED   = 4;
const ATTACK_DMG   = 12;
const SPECIAL_DMG  = 32;
const ATTACK_RANGE = 90;
const ATTACK_DUR   = 18;
const ATTACK_CD    = 28;
const SPECIAL_CD   = 55;
const HIT_STUN     = 20;
const MAX_HP       = 100;
const DOUBLE_TAP_MS = 380; // window for double-tap special

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
      // White noise burst + low thud
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
      // Rising sawtooth sweep
      const osc = a.createOscillator(); osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.35);
      const g = a.createGain();
      g.gain.setValueAtTime(0.45, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(g); g.connect(a.destination); osc.start(now); osc.stop(now + 0.4);

      // Heavy noise burst
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
  } catch (_) { /* silence audio errors */ }
}

function resumeAudio() {
  if (_audioCtx && _audioCtx.state === 'suspended') _audioCtx.resume();
}

// ── Input: keyboard ──────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  const gameKeys = ['KeyA','KeyD','KeyF','ArrowLeft','ArrowRight','KeyL','Enter','Space'];
  if (gameKeys.includes(e.code)) e.preventDefault();
  resumeAudio();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ── Input: virtual (touch buttons) ──────────────────────────
const vkeys = {};

function isDown(code) { return !!(keys[code] || vkeys[code]); }

// ── Selfie System ────────────────────────────────────────────
const playerFaces = { p1: null, p2: null };

function captureAndPixelate(video) {
  const vw   = video.videoWidth  || 320;
  const vh   = video.videoHeight || 240;
  const size = Math.min(vw, vh);
  const srcX = (vw - size) / 2;
  const srcY = (vh - size) / 2;

  // Render to 16×16 (pixel-art resolution), mirrored so selfie feels natural
  const small = document.createElement('canvas');
  small.width = 16; small.height = 16;
  const sc = small.getContext('2d');
  sc.save();
  sc.translate(16, 0); sc.scale(-1, 1); // un-mirror selfie
  sc.drawImage(video, srcX, srcY, size, size, 0, 0, 16, 16);
  sc.restore();

  // Colour quantisation → limited retro palette (~64 colours max)
  const id   = sc.getImageData(0, 0, 16, 16);
  const d    = id.data;
  const step = 64;
  for (let i = 0; i < d.length; i += 4) {
    d[i]   = Math.min(255, Math.round(d[i]   / step) * step);
    d[i+1] = Math.min(255, Math.round(d[i+1] / step) * step);
    d[i+2] = Math.min(255, Math.round(d[i+2] / step) * step);
  }
  sc.putImageData(id, 0, 0);
  return small; // 16×16 pixelated face canvas
}

function showSelfieScreen(playerNum, palette, onDone) {
  const isP1  = playerNum === 1;
  const color = isP1 ? '#4488ff' : '#ff4444';
  const label = isP1 ? 'PLAYER 1' : 'PLAYER 2';
  const key   = isP1 ? 'p1' : 'p2';

  const overlay = document.createElement('div');
  overlay.id = 'selfie-overlay';
  overlay.innerHTML = `
    <div class="selfie-box" style="border-color:${color};box-shadow:0 0 40px ${color}55,0 0 80px ${color}22">
      <div class="selfie-badge" style="color:${color};text-shadow:0 0 12px ${color}">${label}</div>
      <div class="selfie-title">⚔ Take Your Selfie</div>
      <div class="selfie-preview-wrap">
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
      status.textContent = '⚠ Camera not supported — use Skip to continue.';
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
        status.textContent = '😄 Smile! Press Capture when ready.';
      })
      .catch(() => {
        status.textContent = '⚠ Camera denied — use Skip to continue.';
      });
  });

  btnCap.addEventListener('click', () => {
    if (!stream) return;
    playerFaces[key] = captureAndPixelate(video);
    cleanup();
    onDone();
  });

  btnSkip.addEventListener('click', () => {
    cleanup();
    onDone();
  });
}

// ── Colour palettes ──────────────────────────────────────────
const P1_PAL = {
  body: '#4488ff', belt: '#ffffff', hair: '#1a1a2e',
  skin: '#f4c79a', gi: '#4488ff', shadow: '#223366',
  accent: '#99ccff', special: '#00eeff',
};
const P2_PAL = {
  body: '#ff4444', belt: '#ffffff', hair: '#8B0000',
  skin: '#f4c79a', gi: '#ff4444', shadow: '#661111',
  accent: '#ff9966', special: '#ffdd00',
};

// ── Particle system ──────────────────────────────────────────
const particles = [];

function spawnParticles(x, y, color, count = 12, speedMult = 1) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = (2 + Math.random() * 5) * speedMult;
    particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 2.5,
      life: 1,
      decay: 0.035 + Math.random() * 0.04,
      r: (3 + Math.random() * 5) * speedMult,
      color,
    });
  }
}

function spawnSpecialBurst(x, y, color) {
  // Ring burst
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const spd   = 5 + Math.random() * 8;
    particles.push({ x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd - 2,
      life: 1, decay: 0.025 + Math.random()*0.02, r: 5 + Math.random()*7, color });
  }
  // White sparks
  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd   = 8 + Math.random() * 10;
    particles.push({ x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd - 4,
      life: 1, decay: 0.05 + Math.random()*0.04, r: 2 + Math.random()*3, color: '#ffffff' });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x  += p.vx; p.y += p.vy;
    p.vy += 0.18; p.vx *= 0.97;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * Math.max(0.1, p.life), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Fighter class ─────────────────────────────────────────────
class Fighter {
  constructor(x, facingRight, palette, name) {
    this.x          = x;
    this.y          = GROUND_Y;
    this.vy         = 0;
    this.onGround   = true;
    this.facingRight = facingRight;
    this.palette    = palette;
    this.name       = name;

    this.hp         = MAX_HP;
    this.alive      = true;

    // attack
    this.attacking      = false;
    this.attackTimer    = 0;
    this.isSpecial      = false;
    this.specialQueued  = false;
    this.cooldown       = 0;

    // double-tap tracking
    this.lastAttackPressTime = 0;
    this.prevAttackDown      = false;

    // hit
    this.stunTimer  = 0;
    this.shakeX     = 0;
    this.flashTimer = 0;

    // animation
    this.walkFrame  = 0;
    this.idleTimer  = 0;
    this.deathTimer = 0;

    this.w = 44;
    this.h = 80;

    // Selfie face (16×16 canvas, set after capture)
    this.faceCanvas = null;
  }

  get cx() { return this.x + this.w / 2; }

  update(leftKey, rightKey, attackKey, opponent) {
    if (!this.alive) { this.deathTimer++; return; }

    this.idleTimer++;

    if (this.stunTimer  > 0) this.stunTimer--;
    if (this.cooldown   > 0) this.cooldown--;
    if (this.flashTimer > 0) this.flashTimer--;
    this.shakeX *= 0.6;

    // attack timer
    if (this.attacking) {
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        const wasSpecial = this.isSpecial;
        this.attacking  = false;
        this.isSpecial  = false;
        this.cooldown   = wasSpecial ? SPECIAL_CD : ATTACK_CD;
      }
    }

    // fire queued special when we become free
    if (!this.attacking && this.cooldown === 0 && this.specialQueued) {
      this.specialQueued = false;
      this._doAttack(opponent, true);
      return;
    }

    const stunned = this.stunTimer > 0;

    if (!stunned) {
      // Movement
      if (isDown(leftKey)) {
        this.x -= MOVE_SPEED;
        this.facingRight = false;
        this.walkFrame++;
      } else if (isDown(rightKey)) {
        this.x += MOVE_SPEED;
        this.facingRight = true;
        this.walkFrame++;
      } else {
        this.walkFrame = 0;
      }

      // Edge-detect attack key press
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
          // Queue special to fire after current attack/cooldown
          this.specialQueued = true;
        }
      } else if (!attackDown) {
        this.prevAttackDown = false;
      }
    } else {
      // While stunned, still track key edge
      this.prevAttackDown = isDown(attackKey);
    }

    this.x = Math.max(0, Math.min(W - this.w, this.x));

    if (!this.onGround) {
      this.vy += GRAVITY;
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
    const range   = isSpecial ? ATTACK_RANGE * 1.4 : ATTACK_RANGE;
    const inRange = dx <= range;
    const facing  = this.facingRight ? (opponent.cx > this.cx) : (opponent.cx < this.cx);
    if (inRange && facing) opponent.takeHit(isSpecial ? SPECIAL_DMG : ATTACK_DMG, isSpecial);
  }

  takeHit(dmg, isSpecial) {
    if (!this.alive) return;
    this.hp        = Math.max(0, this.hp - dmg);
    this.stunTimer = HIT_STUN + (isSpecial ? 12 : 0);
    this.shakeX    = (isSpecial ? 15 : 9) * (Math.random() > 0.5 ? 1 : -1);
    this.flashTimer = isSpecial ? 22 : 10;
    playSound('hit');
    if (this.hp === 0) { this.alive = false; this.deathTimer = 0; }
  }

  // ── Drawing ───────────────────────────────────────────────
  draw() {
    const p  = this.palette;
    const sx = Math.round(this.shakeX);
    const bx = this.x + sx;
    const by = this.y;

    ctx.save();
    ctx.translate(bx + this.w / 2, by);
    if (!this.facingRight) ctx.scale(-1, 1);

    // Death animation: fall to side
    if (!this.alive) {
      const t = Math.min(this.deathTimer / 45, 1);
      ctx.rotate(t * Math.PI / 2);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, this.deathTimer - 35) / 20);
    }

    // Flash white on hit
    if (this.flashTimer > 0 && Math.floor(this.flashTimer / 2) % 2 === 0) {
      ctx.filter = 'brightness(3) saturate(0)';
    }

    // Idle breath bob
    const bob  = (this.alive && this.walkFrame === 0)
      ? Math.sin(this.idleTimer * 0.055) * 1.8 : 0;
    // Attack lean
    const leanMax  = this.isSpecial ? 14 : 9;
    const leanProg = this.attacking
      ? (1 - this.attackTimer / (this.isSpecial ? ATTACK_DUR * 1.6 : ATTACK_DUR)) : 0;
    const lean = leanMax * leanProg;

    this._drawBody(-this.h + bob, lean);
    ctx.filter = 'none';
    ctx.restore();

    // Name tag
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font      = 'bold 11px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, bx + this.w / 2, by - this.h - 8);

    // Special aura
    if (this.attacking && this.isSpecial) {
      const t = this.attackTimer / (ATTACK_DUR * 1.6);
      ctx.save();
      ctx.globalAlpha = (1 - t) * 0.4;
      const grd = ctx.createRadialGradient(bx + this.w/2, by - this.h/2, 5, bx + this.w/2, by - this.h/2, 70);
      grd.addColorStop(0, p.special);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(bx + this.w/2, by - this.h/2, 70, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawBody(baseY, lean) {
    const p        = this.palette;
    const legSwing = (this.onGround && this.walkFrame > 0)
      ? Math.sin(this.walkFrame * 0.4) * 9 : 0;
    const armSwing = -legSwing * 0.6;

    // Back leg
    ctx.fillStyle = p.shadow;
    this._rr(-9, baseY + 45, 14, 32, 4);
    // Front leg
    ctx.fillStyle = p.gi;
    this._rr(-5 + legSwing, baseY + 45, 14, 32, 4);

    // Torso
    ctx.save();
    ctx.translate(lean, 0);

    ctx.fillStyle = p.gi;
    this._rr(-16, baseY + 16, 36, 32, 5);

    // Belt
    ctx.fillStyle = p.belt;
    this._rr(-16, baseY + 38, 36, 6, 2);

    // Back arm
    ctx.fillStyle = p.shadow;
    this._rr(-22, baseY + 18 + armSwing, 10, 22, 4);

    if (this.attacking) {
      const frac = this.isSpecial
        ? (1 - this.attackTimer / (ATTACK_DUR * 1.6))
        : (1 - this.attackTimer / ATTACK_DUR);
      const ext = frac * (this.isSpecial ? 42 : 30);
      if (this.isSpecial) {
        // Glowing energy fist
        ctx.fillStyle = p.special;
        ctx.shadowColor = p.special;
        ctx.shadowBlur  = 18;
        this._rr(12, baseY + 15, 14 + ext, 16, 6);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = p.skin;
        this._rr(14, baseY + 20, 10 + ext, 12, 4);
      }
    } else {
      ctx.fillStyle = p.gi;
      this._rr(16, baseY + 18 - armSwing, 10, 22, 4);
    }

    // Neck
    ctx.fillStyle = p.skin;
    this._rr(-6, baseY + 8, 12, 10, 3);

    // Head — selfie pixel art OR default procedural face
    if (this.faceCanvas) {
      // Clip to rounded head shape, then draw pixelated selfie
      ctx.save();
      this._rrPath(-14, baseY - 10, 30, 28, 6);
      ctx.clip();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.faceCanvas, -14, baseY - 10, 30, 28);
      ctx.restore();
      // Hair strip on top so the character keeps their fighter look
      ctx.fillStyle = p.hair;
      this._rr(-14, baseY - 10, 30, 10, [6, 6, 0, 0]);
      // Subtle outline
      ctx.strokeStyle = p.hair;
      ctx.lineWidth = 1;
      this._rrPath(-14, baseY - 10, 30, 28, 6);
      ctx.stroke();
    } else {
      ctx.fillStyle = p.skin;
      this._rr(-14, baseY - 10, 30, 28, 6);

      // Hair
      ctx.fillStyle = p.hair;
      this._rr(-14, baseY - 10, 30, 12, [6, 6, 0, 0]);

      // Eyes — blink periodically
      const blink = Math.floor(this.idleTimer / 95) % 12 === 0;
      if (blink) {
        ctx.fillStyle = '#222';
        ctx.fillRect(-2, baseY + 4, 12, 2);
      } else {
        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.ellipse(4, baseY + 4, 4, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(5, baseY + 3, 1.5, 1.5, 0, 0, Math.PI * 2); ctx.fill();
      }

      // Mouth: pain grimace when stunned
      ctx.strokeStyle = this.stunTimer > 0 ? '#ff5500' : '#a0522d';
      ctx.lineWidth   = 1.5;
      ctx.beginPath();
      if (this.stunTimer > 0) {
        ctx.moveTo(-2, baseY + 12);
        ctx.quadraticCurveTo(2, baseY + 9, 6, baseY + 12);
      } else {
        ctx.moveTo(-2, baseY + 10); ctx.lineTo(6, baseY + 12);
      }
      ctx.stroke();
    }

    ctx.restore();

    // Shoes
    ctx.fillStyle = '#222';
    this._rr(-10, baseY + 74, 16, 8, [0, 0, 4, 4]);
    this._rr(-3 + legSwing, baseY + 74, 16, 8, [0, 0, 4, 4]);
  }

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

  // Like _rr but only builds the path (for clip/stroke, no fill)
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

// ── Background ───────────────────────────────────────────────
const STARS = Array.from({ length: 28 }, () => [
  Math.random() * W, Math.random() * (GROUND_Y * 0.72),
  0.6 + Math.random() * 0.8,
]);
const BUILDINGS = [
  [0,160,80],[70,130,90],[150,180,60],[200,110,100],[290,145,70],
  [350,125,80],[420,165,55],[465,105,95],[550,150,65],[605,130,85],
  [680,170,60],[730,115,90],[810,145,70],[870,130,30],
];

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0,   '#0d0d1a');
  sky.addColorStop(0.6, '#1a0a2e');
  sky.addColorStop(1,   '#2d0a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GROUND_Y);

  // Moon
  ctx.fillStyle = '#fffbe8';
  ctx.beginPath(); ctx.arc(W - 80, 60, 28, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a0a2e';
  ctx.beginPath(); ctx.arc(W - 70, 54, 24, 0, Math.PI * 2); ctx.fill();

  // Stars
  for (const [sx, sy, sr] of STARS) {
    ctx.fillStyle = `rgba(255,255,255,0.8)`;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  }

  // City silhouette
  for (const [bx, by, bw] of BUILDINGS) {
    ctx.fillStyle = '#110820';
    ctx.fillRect(bx, by, bw, GROUND_Y - by);
    for (let wy = by + 10; wy < GROUND_Y - 10; wy += 18) {
      for (let wx = bx + 8; wx < bx + bw - 8; wx += 16) {
        if ((bx * 3 + wy + wx) % 7 > 2) {
          ctx.fillStyle = 'rgba(255,220,80,0.32)';
          ctx.fillRect(wx, wy, 6, 8);
        }
      }
    }
  }

  // Ground
  const gnd = ctx.createLinearGradient(0, GROUND_Y, 0, H);
  gnd.addColorStop(0, '#3a1a2e');
  gnd.addColorStop(1, '#1a0a1a');
  ctx.fillStyle = gnd;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  // Neon ground line
  ctx.strokeStyle = 'rgba(180,60,255,0.55)';
  ctx.lineWidth   = 2;
  ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(W, GROUND_Y); ctx.stroke();

  // Perspective grid
  ctx.strokeStyle = 'rgba(180,60,255,0.10)';
  ctx.lineWidth   = 1;
  for (let gx = 0; gx <= W; gx += 60) {
    ctx.beginPath(); ctx.moveTo(gx, GROUND_Y); ctx.lineTo(W / 2, H + 40); ctx.stroke();
  }
  for (let gy = GROUND_Y; gy <= H; gy += 20) {
    ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
  }
}

// ── HUD ──────────────────────────────────────────────────────
function drawHUD(p1, p2, roundNum, p1Wins, p2Wins) {
  const barW = 300, barH = 22, barY = 18, pad = 20;

  // Center panel
  ctx.fillStyle = '#111';
  ctx.fillRect(W / 2 - 58, barY - 4, 116, barH + 14);
  ctx.strokeStyle = '#444'; ctx.lineWidth = 1;
  ctx.strokeRect(W / 2 - 58, barY - 4, 116, barH + 14);

  ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 13px Courier New'; ctx.textAlign = 'center';
  ctx.fillText(`ROUND ${roundNum}`, W / 2, barY + 12);

  // Win dots
  const dotR = 5;
  for (let i = 0; i < 2; i++) {
    ctx.beginPath();
    ctx.arc(W / 2 - 26 + i * 18, barY + 26, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i < p1Wins ? '#4488ff' : '#333'; ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1; ctx.stroke();

    ctx.beginPath();
    ctx.arc(W / 2 + 8 + i * 18, barY + 26, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i < p2Wins ? '#ff4444' : '#333'; ctx.fill();
    ctx.strokeStyle = '#555'; ctx.stroke();
  }

  // P1 HP bar
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(pad, barY, barW, barH);
  const p1p = p1.hp / MAX_HP;
  const g1  = ctx.createLinearGradient(pad, 0, pad + barW * p1p, 0);
  g1.addColorStop(0, '#44aaff'); g1.addColorStop(1, p1p > 0.3 ? '#4488ff' : '#ff2222');
  ctx.fillStyle = g1; ctx.fillRect(pad, barY, barW * p1p, barH);
  ctx.strokeStyle = '#4488ff'; ctx.lineWidth = 1.5; ctx.strokeRect(pad, barY, barW, barH);
  ctx.fillStyle = '#ccc'; ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'left';
  ctx.fillText('RYU', pad + 4, barY + 15);
  ctx.textAlign = 'right'; ctx.fillText(p1.hp, pad + barW - 4, barY + 15);

  // P2 HP bar
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(W - pad - barW, barY, barW, barH);
  const p2p = p2.hp / MAX_HP;
  const g2  = ctx.createLinearGradient(W - pad, 0, W - pad - barW * p2p, 0);
  g2.addColorStop(0, '#ff4444'); g2.addColorStop(1, p2p > 0.3 ? '#cc2200' : '#ff2222');
  ctx.fillStyle = g2; ctx.fillRect(W - pad - barW * p2p, barY, barW * p2p, barH);
  ctx.strokeStyle = '#ff4444'; ctx.lineWidth = 1.5; ctx.strokeRect(W - pad - barW, barY, barW, barH);
  ctx.fillStyle = '#ccc'; ctx.font = 'bold 12px Courier New'; ctx.textAlign = 'right';
  ctx.fillText('KEN', W - pad - 4, barY + 15);
  ctx.textAlign = 'left'; ctx.fillText(p2.hp, W - pad - barW + 4, barY + 15);

  // Readiness dots
  const dotFn = (x, y, ready) => {
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = ready ? '#ffcc00' : '#333'; ctx.fill();
    ctx.strokeStyle = '#666'; ctx.lineWidth = 1; ctx.stroke();
  };
  dotFn(pad + barW + 10, barY + barH / 2, p1.cooldown === 0 && !p1.attacking);
  dotFn(W - pad - barW - 10, barY + barH / 2, p2.cooldown === 0 && !p2.attacking);
}

// ── Round banner ─────────────────────────────────────────────
function drawBanner(text, sub, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.68)';
  ctx.fillRect(0, 0, W, H);

  const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 300);
  grd.addColorStop(0, color + '55');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);

  ctx.textAlign = 'center';
  ctx.font = 'bold 72px Courier New';
  ctx.fillStyle = color;
  ctx.shadowColor = color; ctx.shadowBlur = 32;
  ctx.fillText(text, W / 2, H / 2 - 20);
  ctx.shadowBlur = 0;

  if (sub) {
    ctx.font = 'bold 20px Courier New';
    ctx.fillStyle = '#aaa';
    ctx.fillText(sub, W / 2, H / 2 + 42);
  }
}

// ── Game state ────────────────────────────────────────────────
let p1, p2;
let roundOver, gameOver, winner, roundWinner;
let roundNum, p1Wins, p2Wins;
let prevP1HP, prevP2HP;
let roundOverTimer = 0;
let roundStartBanner = 0;
let flashScreen = 0;

function initRound() {
  p1 = new Fighter(100,       true,  P1_PAL, 'RYU');
  p2 = new Fighter(W - 144,  false, P2_PAL, 'KEN');
  // Apply selfie faces if captured
  if (playerFaces.p1) p1.faceCanvas = playerFaces.p1;
  if (playerFaces.p2) p2.faceCanvas = playerFaces.p2;
  roundOver    = false;
  roundWinner  = null;
  prevP1HP     = MAX_HP;
  prevP2HP     = MAX_HP;
  particles.length = 0;
  roundStartBanner = 100;
  flashScreen  = 0;
  playSound('roundStart');
}

function initGame() {
  roundNum = 1; p1Wins = 0; p2Wins = 0;
  gameOver = false; winner = null;
  roundOverTimer = 0;
  initRound();
}

// ── Main loop ─────────────────────────────────────────────────
function loop() {
  requestAnimationFrame(loop);

  if (flashScreen > 0) flashScreen--;
  if (roundStartBanner > 0) roundStartBanner--;

  // ── GAME OVER screen
  if (gameOver) {
    if (isDown('Enter')) initGame();
    drawBackground();
    p2.draw(); p1.draw();
    drawParticles();
    drawHUD(p1, p2, roundNum, p1Wins, p2Wins);
    drawBanner(`${winner} WINS!`, 'Press ENTER / ↺ to play again',
      winner === 'RYU' ? '#4488ff' : '#ff4444');
    return;
  }

  // ── ROUND OVER screen
  if (roundOver) {
    roundOverTimer++;
    drawBackground();
    p2.draw(); p1.draw();
    updateParticles(); drawParticles();
    drawHUD(p1, p2, roundNum, p1Wins, p2Wins);
    drawBanner(`${roundWinner} wins round!`,
      roundOverTimer < 130 ? '' : 'Next round soon...',
      roundWinner === 'RYU' ? '#4488ff' : '#ff4444');
    if (roundOverTimer > 200) {
      roundNum++;
      initRound();
      roundOverTimer = 0;
    }
    return;
  }

  // ── UPDATE
  p1.update('KeyA', 'KeyD', 'KeyF', p2);
  p2.update('ArrowLeft', 'ArrowRight', 'KeyL', p1);

  // Particle FX on damage
  if (p1.hp < prevP1HP) {
    const sp = (prevP1HP - p1.hp) > ATTACK_DMG;
    spawnParticles(p1.cx, p1.y - p1.h / 2, '#ff6644', sp ? 22 : 10, sp ? 1.5 : 1);
    if (sp) { spawnSpecialBurst(p1.cx, p1.y - p1.h / 2, '#ff9900'); flashScreen = 10; }
  }
  if (p2.hp < prevP2HP) {
    const sp = (prevP2HP - p2.hp) > ATTACK_DMG;
    spawnParticles(p2.cx, p2.y - p2.h / 2, '#4488ff', sp ? 22 : 10, sp ? 1.5 : 1);
    if (sp) { spawnSpecialBurst(p2.cx, p2.y - p2.h / 2, '#00ccff'); flashScreen = 10; }
  }
  prevP1HP = p1.hp; prevP2HP = p2.hp;

  updateParticles();

  // Check round end
  if (!p1.alive || !p2.alive) {
    roundOver   = true;
    roundWinner = !p1.alive ? 'KEN' : 'RYU';
    if (roundWinner === 'RYU') p1Wins++; else p2Wins++;
    playSound('victory');
    if (p1Wins >= 2 || p2Wins >= 2) { gameOver = true; winner = roundWinner; }
  }

  // ── DRAW
  drawBackground();

  // Screen flash for specials
  if (flashScreen > 0) {
    ctx.fillStyle = `rgba(255,255,255,${flashScreen / 22})`;
    ctx.fillRect(0, 0, W, H);
  }

  if (p1.x < p2.x) { p2.draw(); p1.draw(); }
  else              { p1.draw(); p2.draw(); }

  drawParticles();
  drawHUD(p1, p2, roundNum, p1Wins, p2Wins);

  // Round start animation
  if (roundStartBanner > 0) {
    const a = Math.min(1, roundStartBanner / 25) * Math.min(1, (roundStartBanner / 100) * 2);
    ctx.globalAlpha = a;
    ctx.textAlign   = 'center';
    if (roundStartBanner > 35) {
      ctx.font = 'bold 58px Courier New';
      ctx.fillStyle   = '#ffcc00';
      ctx.shadowColor = '#ffcc00'; ctx.shadowBlur = 22;
      ctx.fillText(`ROUND ${roundNum}`, W / 2, H / 2);
    } else {
      ctx.font = 'bold 72px Courier New';
      ctx.fillStyle   = '#ff4444';
      ctx.shadowColor = '#ff4444'; ctx.shadowBlur = 30;
      ctx.fillText('FIGHT!', W / 2, H / 2);
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }
}

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
    // Mouse fallback for desktop testing
    btn.addEventListener('mousedown',  press);
    btn.addEventListener('mouseup',    release);
    btn.addEventListener('mouseleave', release);
  }

  // Restart button
  const rb = document.getElementById('btn-restart');
  if (rb) {
    rb.addEventListener('touchstart', e => { e.preventDefault(); resumeAudio(); if (gameOver) initGame(); else if (roundOver) {} }, { passive: false });
    rb.addEventListener('click', () => { resumeAudio(); if (gameOver) initGame(); });
  }
}

// ── Canvas responsive scaling ────────────────────────────────
function resizeCanvas() {
  const maxW = Math.min(window.innerWidth, 900);
  const scale = maxW / W;
  canvas.style.width  = `${W * scale}px`;
  canvas.style.height = `${H * scale}px`;
}

function checkOrientation() {
  const warn = document.getElementById('portrait-warning');
  if (warn) warn.style.display = window.innerHeight > window.innerWidth ? 'flex' : 'none';
}

window.addEventListener('resize', () => { resizeCanvas(); checkOrientation(); });
window.addEventListener('orientationchange', () => { setTimeout(() => { resizeCanvas(); checkOrientation(); }, 300); });

// ── Boot ─────────────────────────────────────────────────────
resizeCanvas();
checkOrientation();
setupMobileControls();

// Selfie selection → then launch game
showSelfieScreen(1, P1_PAL, () => {
  showSelfieScreen(2, P2_PAL, () => {
    initGame();
    requestAnimationFrame(loop);
  });
});
