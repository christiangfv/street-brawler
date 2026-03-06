# ⚔ Street Brawler

A small Street Fighter-style browser game — no dependencies, pure HTML5 Canvas + vanilla JavaScript.

![Street Brawler](https://img.shields.io/badge/genre-fighting-red?style=flat-square) ![No deps](https://img.shields.io/badge/dependencies-none-brightgreen?style=flat-square) ![Browser](https://img.shields.io/badge/runs%20in-browser-blue?style=flat-square)

## 🕹 How to Play

Just open `index.html` in any modern browser. That's it — no build step, no npm install.

```bash
# Option A: double-click index.html
# Option B: serve locally
npx serve .         # or
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

---

## 🎮 Controls

| Action          | Player 1 (RYU 🔵) | Player 2 (KEN 🔴) |
|-----------------|-------------------|-------------------|
| Move Left       | `A`               | `←`               |
| Move Right      | `D`               | `→`               |
| Attack (punch)  | `F`               | `L`               |
| Restart         | `Enter`           | `Enter`           |

---

## ⚡ Mechanics

- **HP:** Each fighter starts with 100 HP. Land punches to reduce the opponent's health.
- **Attack range:** You need to be close enough — get in your opponent's face!
- **Attack cooldown:** After each punch there's a brief cooldown (the gold dot next to each health bar turns grey while recharging).
- **Hit stun:** Getting hit briefly stuns you, so timing matters.
- **Victory:** First fighter to reach 0 HP loses. Press `Enter` to rematch.

---

## 📁 Structure

```
street-brawler/
├── index.html   ← entry point
├── game.js      ← all game logic (Fighter class, loop, particles, HUD)
├── style.css    ← dark cyberpunk aesthetic
└── README.md    ← you are here
```

---

## 🎨 Features

- Animated fighter sprites (walk cycle, punch extension, hit shake)
- Particle hit effects
- Cyberpunk night-city background with parallax buildings
- Glowing HP bars with critical-state colour shift
- Attack-ready indicator dots on HUD
- Victory screen with glow effect

---

Made with ❤️ and zero dependencies by [@christiangfv](https://github.com/christiangfv)
