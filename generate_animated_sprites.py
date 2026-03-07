#!/usr/bin/env python3
"""Generate animated sprite frames for all Radar Fighters characters using DALL-E 3."""

import json, base64, time, glob, sys
from pathlib import Path

# ── Credentials ──────────────────────────────────────────────────────────────
with open('/data/.config/openai.json') as f:
    api_key = json.load(f)['api_key']

import openai
client = openai.OpenAI(api_key=api_key)

# ── Characters ────────────────────────────────────────────────────────────────
CHARACTERS = [
    ('herbert',   'CO-FOUNDER & CEO',        '#c0392b'),
    ('gabo',      'CO-FOUNDER & CTO',        '#2980b9'),
    ('amanda',    'CO-FOUNDER & CRO',        '#e8735a'),
    ('arturo',    'TECH MANAGER',            '#2c3e50'),
    ('jaime',     'TECH LEAD',               '#1abc9c'),
    ('chris',     'BACKEND ENGINEER',        '#f39c12'),
    ('kevin',     'FULL STACK ENG',          '#0984e3'),
    ('lorens',    'BACKEND ENG',             '#e17055'),
    ('nelson',    'BACKEND ENG',             '#6c3483'),
    ('andres',    'DEVOPS ENG',              '#117a65'),
    ('javier',    'FRONTEND DEV',            '#34495e'),
    ('gerardo',   'LOW CODE ENG',            '#e74c3c'),
    ('carlo',     'PRODUCT LEAD',            '#8e44ad'),
    ('esteban',   'BIZ DEV',                 '#e67e22'),
    ('francisco', 'BUSINESS ANALYST',        '#6c5ce7'),
    ('hector',    'SALES MANAGER',           '#922b21'),
    ('alex',      'SALES EXEC',              '#d4ac0d'),
    ('dani',      'OPERATIONS ANALYST',      '#27ae60'),
    ('yong',      'OPERATIONS MANAGER',      '#1a5276'),
    ('geri',      'ACCOUNTING MANAGER',      '#f1c40f'),
    ('max',       'PEOPLE & CULTURE',        '#00b894'),
    ('andy',      'MARKETING LEAD',          '#fd79a8'),
    ('karen',     'COMMS ANALYST',           '#fdcb6e'),
    ('radarin',   'SECRET BOSS DOLPHIN',     '#0099e5'),
]

POSES = {
    'idle': "Standing in a heroic ready stance facing RIGHT. Feet shoulder-width apart, knees slightly bent, fists raised at chest height. Confident determined expression. Classic video game idle pose.",
    'atk':  "Performing a heroic power move to the RIGHT. Right arm fully extended forward in a classic video game attack animation, left arm pulled back, body leaning forward. Dynamic motion lines. Classic arcade game action pose.",
    'hit':  "Classic video game knockback animation pose. Body leaning backward to the LEFT. Arms raised in a defensive position in front of face. Surprised comic expression. Classic arcade game reaction pose.",
}

def make_prompt(name, title, color, pose_desc):
    if name == 'radarin':
        special = "An anthropomorphic dolphin character in a fighting suit"
    else:
        special = f"A tech worker character named {name.upper()}, {title}"
    return (
        f"Pixel art sprite for a 1990s Super Nintendo fighting game, Pocket Fighter / Super Gem Fighter style.\n"
        f"Character: {special}. Main color theme: {color}.\n"
        f"Full body visible head to toe. Chibi/super-deformed proportions: very large head (~50% of total height), compact torso, small legs.\n"
        f"Clean black pixel outlines. Flat bright colors, no gradients, no anti-aliasing.\n"
        f"Pure white solid background. Character perfectly centered in square frame.\n"
        f"No text, no labels, no UI elements, no shadow, no floor.\n"
        f"POSE: {pose_desc}"
    )

# ── Generation ────────────────────────────────────────────────────────────────
assets_dir = Path('assets')
assets_dir.mkdir(exist_ok=True)

def generate_sprite(name, prompt, output_path):
    for attempt in range(3):
        try:
            resp = client.images.generate(
                model="dall-e-3",
                prompt=prompt,
                size="1024x1024",
                quality="standard",
                response_format="b64_json",
                n=1,
            )
            img_data = base64.b64decode(resp.data[0].b64_json)
            Path(output_path).write_bytes(img_data)
            print(f"✓ {output_path}", flush=True)
            return True
        except Exception as e:
            print(f"  ✗ attempt {attempt+1} failed: {e}", flush=True)
            if attempt < 2:
                time.sleep(5)
    return False

failed = []
total = len(CHARACTERS) * len(POSES)
done = 0

print(f"Generating {total} sprites for {len(CHARACTERS)} characters × {len(POSES)} poses...\n")

for name, title, color in CHARACTERS:
    for pose_key, pose_desc in POSES.items():
        out = assets_dir / f"spr_{name}_{pose_key}.png"
        if out.exists():
            print(f"  skip (exists): {out}", flush=True)
            done += 1
            continue
        prompt = make_prompt(name, title, color, pose_desc)
        ok = generate_sprite(name, prompt, str(out))
        if not ok:
            failed.append(str(out))
        done += 1
        print(f"  Progress: {done}/{total}", flush=True)
        time.sleep(1.2)

print(f"\n=== Generation complete ===")
print(f"Generated: {done - len(failed)} / {total}")
print(f"Failed: {failed}")

# ── Remove white backgrounds ──────────────────────────────────────────────────
print("\nRemoving white backgrounds...")

try:
    from PIL import Image
    import numpy as np

    def remove_white_bg(path, threshold=240):
        img = Image.open(path).convert("RGBA")
        data = np.array(img)
        r, g, b = data[:,:,0], data[:,:,1], data[:,:,2]
        white_mask = (r > threshold) & (g > threshold) & (b > threshold)
        data[:,:,3] = np.where(white_mask, 0, 255)
        near_white = (r > 200) & (g > 200) & (b > 200) & ~white_mask
        data[:,:,3] = np.where(near_white, 128, data[:,:,3])
        Image.fromarray(data).save(path)
        print(f"  ✓ bg removed: {path}", flush=True)

    bg_errors = []
    for f in sorted(glob.glob("assets/spr_*.png")):
        try:
            remove_white_bg(f)
        except Exception as e:
            print(f"  ✗ {f}: {e}", flush=True)
            bg_errors.append(f)

    print(f"\nBG removal done. Errors: {bg_errors}")
except ImportError as e:
    print(f"PIL not available: {e} — skipping BG removal")

print("\n=== All done ===")
print(f"Failed sprites: {failed}")
