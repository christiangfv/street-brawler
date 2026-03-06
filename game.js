// ============================================================
//  STREET BRAWLER — vanilla JS + HTML5 Canvas
//  No dependencies. Open index.html in any modern browser.
// ============================================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// ── Constants ────────────────────────────────────────────────
const GROUND_Y      = H - 80;
const GRAVITY       = 0.6;
const JUMP_FORCE    = -14;
const MOVE_SPEED    = 4;
const ATTACK_DMG    = 12;
const ATTACK_RANGE  = 90;  // px, horizontal reach
const ATTACK_DUR    = 18;  // frames attack animation lasts
const ATTACK_CD     = 35;  // frames cooldown after attack
const HIT_STUN      = 20;  // frames enemy is stunned on hit
const MAX_HP        = 100;

// ── Colour palettes ─────────────────────────────────────────
const P1_PALETTE = {
  body:   '#4488ff',
  belt:   '#ffffff',
  hair:   '#1a1a2e',
  skin:   '#f4c79a',
  gi:     '#4488ff',
  shadow: '#223366',
};
const P2_PALETTE = {
  body:   '#ff4444',
  belt:   '#ffffff',
  hair:   '#8B0000',
  skin:   '#f4c79a',
  gi:     '#ff4444',
  shadow: '#661111',
};

// ── Input state ──────────────────────────────────────────────
const keys = {};
window.addEventListener('keydown', e => { keys[e.code] = true;  e.preventDefault(); });
window.addEventListener('keyup',   e => { keys[e.code] = false; });

// ── Player class ─────────────────────────────────────────────
class Fighter {
  constructor(x, facingRight, palette, name) {
    this.x           = x;
    this.y           = GROUND_Y;
    this.vy          = 0;
    this.onGround    = true;
    this.facingRight = facingRight;
    this.palette     = palette;
    this.name        = name;

    this.hp          = MAX_HP;
    this.alive       = true;

    // attack state
    this.attacking   = false;
    this.attackTimer = 0;
    this.cooldown    = 0;

    // hit stun
    this.stunTimer   = 0;

    // visual shake
    this.shakeX      = 0;

    // walk cycle
    this.walkFrame   = 0;

    // width / height for collision
    this.w = 44;
    this.h = 80;
  }

  get cx() { return this.x + this.w / 2; }

  update(leftKey, rightKey, attackKey, opponent) {
    if (!this.alive) return;

    // stun
    if (this.stunTimer > 0) { this.stunTimer--; }

    // cooldown
    if (this.cooldown > 0) this.cooldown--;

    // attack timer
    if (this.attacking) {
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        this.attacking = false;
        this.cooldown  = ATTACK_CD;
      }
    }

    const stunned = this.stunTimer > 0;

    // movement (blocked while stunned)
    if (!stunned) {
      if (keys[leftKey]) {
        this.x -= MOVE_SPEED;
        this.facingRight = false;
        this.walkFrame++;
      } else if (keys[rightKey]) {
        this.x += MOVE_SPEED;
        this.facingRight = true;
        this.walkFrame++;
      } else {
        this.walkFrame = 0;
      }

      // attack
      if (keys[attackKey] && !this.attacking && this.cooldown === 0) {
        this.attacking   = true;
        this.attackTimer = ATTACK_DUR;
        this.tryHit(opponent);
      }
    }

    // clamp to arena
    this.x = Math.max(0, Math.min(W - this.w, this.x));

    // gravity
    if (!this.onGround) {
      this.vy += GRAVITY;
      this.y  += this.vy;
      if (this.y >= GROUND_Y) {
        this.y        = GROUND_Y;
        this.vy       = 0;
        this.onGround = true;
      }
    }

    // shake decay
    this.shakeX *= 0.6;
  }

  tryHit(opponent) {
    if (!opponent.alive) return;
    const dx   = Math.abs(this.cx - opponent.cx);
    const inRange = dx <= ATTACK_RANGE;
    // must be facing opponent
    const facing = this.facingRight ? (opponent.cx > this.cx) : (opponent.cx < this.cx);
    if (inRange && facing) {
      opponent.takeHit(ATTACK_DMG);
    }
  }

  takeHit(dmg) {
    if (!this.alive) return;
    this.hp        = Math.max(0, this.hp - dmg);
    this.stunTimer = HIT_STUN;
    this.shakeX    = 8 * (Math.random() > 0.5 ? 1 : -1);
    if (this.hp === 0) this.alive = false;
  }

  // ── Drawing ───────────────────────────────────────────────
  draw() {
    const p   = this.palette;
    const sx  = Math.round(this.shakeX);
    const bx  = this.x + sx;        // base x with shake
    const by  = this.y;             // base y (feet level)
    const dir = this.facingRight ? 1 : -1;

    // walk bob
    const bob = this.onGround && this.walkFrame > 0
      ? Math.sin(this.walkFrame * 0.4) * 2
      : 0;

    // attack lean
    const lean = this.attacking
      ? (this.facingRight ? 8 : -8) * (1 - this.attackTimer / ATTACK_DUR)
      : 0;

    ctx.save();
    // mirror for left-facing
    ctx.translate(bx + this.w / 2, by);
    if (!this.facingRight) ctx.scale(-1, 1);

    const baseY = -this.h + bob;  // top of feet

    this._drawBody(baseY, lean);
    ctx.restore();

    // name tag
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font      = 'bold 11px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, bx + this.w / 2, by - this.h - 6);
  }

  _drawBody(baseY, lean) {
    const p = this.palette;

    // ── Legs ─────────────────────────────────────────────────
    const legSwing = this.onGround && this.walkFrame > 0
      ? Math.sin(this.walkFrame * 0.4) * 8
      : 0;

    // Back leg
    ctx.fillStyle = p.shadow;
    this._roundRect(-9, baseY + 45, 14, 32, 4);

    // Front leg
    ctx.fillStyle = p.gi;
    this._roundRect(-5 + legSwing, baseY + 45, 14, 32, 4);

    // ── Torso (gi) ───────────────────────────────────────────
    ctx.fillStyle = p.gi;
    ctx.save();
    ctx.translate(lean, 0);
    this._roundRect(-16, baseY + 16, 36, 32, 5);

    // Belt
    ctx.fillStyle = p.belt;
    this._roundRect(-16, baseY + 38, 36, 6, 2);

    // ── Arms ─────────────────────────────────────────────────
    const armSwing = this.onGround && this.walkFrame > 0
      ? -legSwing * 0.6
      : 0;

    // Back arm
    ctx.fillStyle = p.shadow;
    this._roundRect(-22, baseY + 18 + armSwing, 10, 22, 4);

    if (this.attacking) {
      // Punch arm extended forward
      const ext = (1 - this.attackTimer / ATTACK_DUR) * 28;
      ctx.fillStyle = p.skin;
      this._roundRect(14, baseY + 20, 10 + ext, 12, 4);
    } else {
      // Front arm
      ctx.fillStyle = p.gi;
      this._roundRect(16, baseY + 18 - armSwing, 10, 22, 4);
    }

    // ── Head ─────────────────────────────────────────────────
    // Neck
    ctx.fillStyle = p.skin;
    this._roundRect(-6, baseY + 8, 12, 10, 3);

    // Head
    ctx.fillStyle = p.skin;
    this._roundRect(-14, baseY - 10, 30, 28, 6);

    // Hair
    ctx.fillStyle = p.hair;
    this._roundRect(-14, baseY - 10, 30, 12, [6, 6, 0, 0]);

    // Eyes
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(4, baseY + 4, 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(5, baseY + 3, 1.5, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mouth / grimace
    ctx.strokeStyle = '#a0522d';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2, baseY + 10);
    ctx.lineTo(6, baseY + 12);
    ctx.stroke();

    ctx.restore();

    // ── Feet (shoes) ─────────────────────────────────────────
    ctx.fillStyle = '#222';
    this._roundRect(-10, baseY + 74, 16, 8, [0, 0, 4, 4]);
    this._roundRect(-3 + legSwing, baseY + 74, 16, 8, [0, 0, 4, 4]);
  }

  _roundRect(x, y, w, h, r) {
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
}

// ── Particle system ──────────────────────────────────────────
const particles = [];

function spawnHitParticles(x, y, color) {
  for (let i = 0; i < 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1,
      decay: 0.05 + Math.random() * 0.05,
      r: 3 + Math.random() * 4,
      color,
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x    += p.vx;
    p.y    += p.vy;
    p.vy   += 0.2;
    p.life -= p.decay;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Background ───────────────────────────────────────────────
function drawBackground() {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0,   '#0d0d1a');
  sky.addColorStop(0.6, '#1a0a2e');
  sky.addColorStop(1,   '#2d0a3d');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, GROUND_Y);

  // Moon
  ctx.fillStyle = '#fffbe8';
  ctx.beginPath();
  ctx.arc(W - 80, 60, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a0a2e';
  ctx.beginPath();
  ctx.arc(W - 70, 54, 24, 0, Math.PI * 2);
  ctx.fill();

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  const starPositions = [
    [40,30],[120,18],[200,45],[350,12],[500,38],[620,20],[750,55],[820,10],[160,60],
    [280,70],[460,25],[580,65],[700,30],[860,50],[30,80],[410,50],[670,10],
  ];
  for (const [sx, sy] of starPositions) {
    ctx.beginPath();
    ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Buildings silhouette
  ctx.fillStyle = '#110820';
  const buildings = [
    [0,160,80,GROUND_Y],[70,130,90,GROUND_Y],[150,180,60,GROUND_Y],
    [200,110,100,GROUND_Y],[290,145,70,GROUND_Y],[350,125,80,GROUND_Y],
    [420,165,55,GROUND_Y],[465,105,95,GROUND_Y],[550,150,65,GROUND_Y],
    [605,130,85,GROUND_Y],[680,170,60,GROUND_Y],[730,115,90,GROUND_Y],
    [810,145,70,GROUND_Y],[870,130,30,GROUND_Y],
  ];
  for (const [bx, by, bw] of buildings) {
    ctx.fillRect(bx, by, bw, GROUND_Y - by);
    // windows
    ctx.fillStyle = 'rgba(255,220,80,0.35)';
    for (let wy = by + 10; wy < GROUND_Y - 10; wy += 18) {
      for (let wx = bx + 8; wx < bx + bw - 8; wx += 16) {
        if (Math.random() > 0.3) ctx.fillRect(wx, wy, 6, 8);
      }
    }
    ctx.fillStyle = '#110820';
  }

  // Ground
  const ground = ctx.createLinearGradient(0, GROUND_Y, 0, H);
  ground.addColorStop(0, '#3a1a2e');
  ground.addColorStop(1, '#1a0a1a');
  ctx.fillStyle = ground;
  ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

  // Ground line glow
  ctx.strokeStyle = 'rgba(180,60,255,0.5)';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.lineTo(W, GROUND_Y);
  ctx.stroke();

  // Floor grid lines (perspective)
  ctx.strokeStyle = 'rgba(180,60,255,0.12)';
  ctx.lineWidth   = 1;
  for (let gx = 0; gx <= W; gx += 60) {
    ctx.beginPath();
    ctx.moveTo(gx, GROUND_Y);
    ctx.lineTo(W / 2, H + 40);
    ctx.stroke();
  }
  for (let gy = GROUND_Y; gy <= H; gy += 20) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }
}

// ── HUD ──────────────────────────────────────────────────────
function drawHUD(p1, p2) {
  const barW   = 300;
  const barH   = 22;
  const barY   = 18;
  const pad    = 20;

  // Timer bar separator
  ctx.fillStyle = '#111';
  ctx.fillRect(W / 2 - 40, barY - 4, 80, barH + 8);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.strokeRect(W / 2 - 40, barY - 4, 80, barH + 8);

  // Round label
  ctx.fillStyle = '#aaa';
  ctx.font      = 'bold 13px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText('FIGHT', W / 2, barY + 15);

  // ── P1 bar (left) ────────────────────────────────────────
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(pad, barY, barW, barH);

  const p1Pct = p1.hp / MAX_HP;
  const hpGrad1 = ctx.createLinearGradient(pad, 0, pad + barW * p1Pct, 0);
  hpGrad1.addColorStop(0, '#44aaff');
  hpGrad1.addColorStop(1, p1Pct > 0.3 ? '#4488ff' : '#ff2222');
  ctx.fillStyle = hpGrad1;
  ctx.fillRect(pad, barY, barW * p1Pct, barH);

  // P1 bar border
  ctx.strokeStyle = '#4488ff';
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(pad, barY, barW, barH);

  // P1 name
  ctx.fillStyle   = '#ccc';
  ctx.font        = 'bold 12px Courier New';
  ctx.textAlign   = 'left';
  ctx.fillText('RYU', pad + 4, barY + 15);

  // P1 HP text
  ctx.textAlign = 'right';
  ctx.fillText(p1.hp, pad + barW - 4, barY + 15);

  // ── P2 bar (right) ───────────────────────────────────────
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(W - pad - barW, barY, barW, barH);

  const p2Pct   = p2.hp / MAX_HP;
  const hpGrad2 = ctx.createLinearGradient(W - pad, 0, W - pad - barW * p2Pct, 0);
  hpGrad2.addColorStop(0, '#ff4444');
  hpGrad2.addColorStop(1, p2Pct > 0.3 ? '#cc2200' : '#ff2222');
  ctx.fillStyle = hpGrad2;
  ctx.fillRect(W - pad - barW * p2Pct, barY, barW * p2Pct, barH);

  // P2 bar border
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(W - pad - barW, barY, barW, barH);

  // P2 name
  ctx.fillStyle = '#ccc';
  ctx.font      = 'bold 12px Courier New';
  ctx.textAlign = 'right';
  ctx.fillText('KEN', W - pad - 4, barY + 15);

  // P2 HP text
  ctx.textAlign = 'left';
  ctx.fillText(p2.hp, W - pad - barW + 4, barY + 15);

  // attack indicator dots
  const drawCooldownDot = (x, y, ready) => {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = ready ? '#ffcc00' : '#333';
    ctx.fill();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
  drawCooldownDot(pad + barW + 10, barY + barH / 2, p1.cooldown === 0 && !p1.attacking);
  drawCooldownDot(W - pad - barW - 10, barY + barH / 2, p2.cooldown === 0 && !p2.attacking);
}

// ── Victory screen ───────────────────────────────────────────
function drawVictory(winner) {
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(0, 0, W, H);

  // Glow
  const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 250);
  grd.addColorStop(0, winner === 'RYU' ? 'rgba(68,136,255,0.4)' : 'rgba(255,68,68,0.4)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign  = 'center';
  ctx.font       = 'bold 72px Courier New';
  ctx.fillStyle  = winner === 'RYU' ? '#4488ff' : '#ff4444';
  ctx.shadowColor = ctx.fillStyle;
  ctx.shadowBlur  = 30;
  ctx.fillText(`${winner} WINS!`, W / 2, H / 2 - 20);
  ctx.shadowBlur  = 0;

  ctx.font      = 'bold 20px Courier New';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Press  ENTER  to play again', W / 2, H / 2 + 40);
}

// ── Game state ───────────────────────────────────────────────
let p1, p2, gameOver, winner;
let prevP1HP, prevP2HP;

function initGame() {
  p1 = new Fighter(100,  true,  P1_PALETTE, 'RYU');
  p2 = new Fighter(W - 144, false, P2_PALETTE, 'KEN');
  gameOver = false;
  winner   = null;
  prevP1HP = MAX_HP;
  prevP2HP = MAX_HP;
  particles.length = 0;
}

// ── Main loop ─────────────────────────────────────────────────
let lastTime = 0;

function loop(ts) {
  requestAnimationFrame(loop);

  // ── Input: restart
  if (gameOver) {
    if (keys['Enter']) initGame();
    // still render the final frame
    drawBackground();
    p2.draw();
    p1.draw();
    drawParticles();
    drawHUD(p1, p2);
    drawVictory(winner);
    return;
  }

  // ── Update
  p1.update('KeyA', 'KeyD', 'KeyF', p2);
  p2.update('ArrowLeft', 'ArrowRight', 'KeyL', p1);

  // Detect hits for particle FX
  if (p1.hp < prevP1HP) {
    spawnHitParticles(p1.x + p1.w / 2, p1.y - p1.h / 2, '#ff6644');
  }
  if (p2.hp < prevP2HP) {
    spawnHitParticles(p2.x + p2.w / 2, p2.y - p2.h / 2, '#4488ff');
  }
  prevP1HP = p1.hp;
  prevP2HP = p2.hp;

  updateParticles();

  // Check win
  if (!p1.alive || !p2.alive) {
    gameOver = true;
    winner   = !p1.alive ? 'KEN' : 'RYU';
  }

  // ── Draw
  drawBackground();
  // Draw back fighter first (whichever is further back — simple z-order)
  if (p1.x < p2.x) { p2.draw(); p1.draw(); }
  else              { p1.draw(); p2.draw(); }

  drawParticles();
  drawHUD(p1, p2);
}

// ── Boot ─────────────────────────────────────────────────────
initGame();
requestAnimationFrame(loop);
