#!/usr/bin/env python3
"""
Generate fighting game stage backgrounds using GPT-4o image generation.

Each stage is a pixel art background in 16:9 aspect ratio, matching the style
of existing stages (Pocket Fighter / SNES era pixel art).

Usage:
    python generate_stages.py                # generate all stages
    python generate_stages.py ixtapa tokyo   # generate specific stages
"""

import json, base64, time, sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

# ── Credentials ────────────────────────────────────────────────────────────────
import openai
with open('./data/.config/openai.json') as f:
    api_key = json.load(f)['OPENAI_API_KEY']

client = openai.OpenAI(api_key=api_key)

# ── Stage definitions ─────────────────────────────────────────────────────────
# Each stage: name, description of the scene, time of day, mood
STAGES = {
    'ixtapa': {
        'title': 'Ixtapa Beach',
        'description': (
            "A tropical Mexican beach resort town. Pristine white sand beach in the foreground "
            "where fighters battle. Turquoise ocean waves crashing on the shore. Palm trees "
            "swaying on both sides. Colorful beachfront hotels and restaurants in the background. "
            "A wooden palapa bar to one side with tiki torches. Pelicans flying overhead. "
            "Warm golden sunset light bathing everything."
        ),
        'time': 'sunset',
        'mood': 'tropical, warm, vibrant',
    },
    'santiago': {
        'title': 'Santiago Downtown',
        'description': (
            "A bustling Chilean city street at the base of the Andes mountains. Modern glass "
            "skyscrapers mixed with older colonial buildings. The snow-capped Andes visible in "
            "the background. A wide avenue with cars and buses. Street vendors selling food. "
            "Chilean flags hanging from buildings. A metro station entrance visible. "
            "Plaza de Armas atmosphere."
        ),
        'time': 'afternoon',
        'mood': 'urban, energetic, modern',
    },
    'tokyo': {
        'title': 'Tokyo Arcade',
        'description': (
            "A neon-lit Japanese arcade district at night (Akihabara style). Glowing neon signs "
            "in Japanese and English everywhere. Arcade cabinets visible through shop windows. "
            "Vending machines lining the street. A giant screen on a building showing a fighting "
            "game tournament. Cherry blossom petals floating in the air despite the urban setting. "
            "Rain-slicked streets reflecting all the neon colors."
        ),
        'time': 'night',
        'mood': 'neon, electric, cyberpunk-lite',
    },
    'colchagua': {
        'title': 'Colchagua Valley',
        'description': (
            "A Chilean wine valley with rolling green vineyards stretching to the horizon. "
            "Rustic hacienda-style winery building on a hill in the background. Rows of "
            "grapevines on both sides creating natural corridors. Wine barrels stacked near "
            "a wooden fence in the foreground. Cypress trees dotting the landscape. "
            "Purple-pink mountains in the far distance. Golden warm light."
        ),
        'time': 'golden hour',
        'mood': 'rustic, warm, pastoral',
    },
    'zapallar': {
        'title': 'Zapallar Coast',
        'description': (
            "A picturesque Chilean coastal town on rocky cliffs. White and terracotta "
            "Mediterranean-style houses climbing the green hillside. Rocky shoreline with "
            "crashing waves in the foreground. Fishing boats and sailboats in a small bay. "
            "Pine and eucalyptus trees framing the scene. Stone stairways leading down to "
            "a sandy beach. Lampposts along a seaside promenade. Clear blue sky."
        ),
        'time': 'midday',
        'mood': 'coastal, serene, elegant',
    },
    'valle_bravo': {
        'title': 'Valle de Bravo',
        'description': (
            "A charming Mexican lakeside town. A beautiful blue lake surrounded by forested "
            "mountains. Colonial-style buildings with colorful facades along a cobblestone "
            "promenade. Sailboats and kayaks on the lake. A church dome and bell tower visible. "
            "Paragliders floating in the sky above the mountains. Street lanterns and benches "
            "along the waterfront. Lush green vegetation everywhere."
        ),
        'time': 'afternoon',
        'mood': 'lakeside, colorful, peaceful',
    },
    'oficina_radar': {
        'title': 'Radar HQ',
        'description': (
            "The interior of a modern tech startup office. Open plan workspace with standing "
            "desks, big monitors showing dashboards and code. A large screen on the wall showing "
            "the Radar logo (a simple radar/sonar circle). Bean bags and a ping pong table in a "
            "lounge area. Floor-to-ceiling windows showing a city skyline at night. Neon accent "
            "lighting in brand colors. Whiteboards covered in diagrams. Server racks visible "
            "through a glass wall. Coffee machine area with mugs."
        ),
        'time': 'night',
        'mood': 'tech, modern, startup energy',
    },
    'desierto_atacama': {
        'title': 'Atacama Desert',
        'description': (
            "The driest desert on Earth under a spectacular starry night sky. Vast salt flats "
            "stretching to the horizon, reflecting the Milky Way. Strange rock formations and "
            "sand dunes in the foreground. An astronomical observatory dome on a distant hill. "
            "The sky is the star — millions of visible stars, nebulae, and the galactic core. "
            "Faint purple and blue tones on the horizon. Otherworldly, alien landscape."
        ),
        'time': 'night',
        'mood': 'cosmic, vast, otherworldly',
    },
}

# ── Style prompt for all stages ───────────────────────────────────────────────
STAGE_STYLE = (
    "Pixel art background for a 1990s Super Nintendo fighting game "
    "(Street Fighter II / Pocket Fighter style). "
    "16:9 widescreen aspect ratio (1920x1080 composition). "
    "Rich detailed pixel art with clean outlines. Bright saturated colors. "
    "Multiple parallax layers visible: foreground details, fighting area (flat ground), "
    "mid-ground buildings/objects, background scenery, sky. "
    "The fighting area should be a flat horizontal surface in the lower third of the image "
    "where two characters would stand and fight. "
    "Animated details welcome: flickering lights, moving clouds, waving flags, etc. "
    "NO characters or people in the scene — this is a stage background only. "
    "NO text, NO UI elements, NO watermarks."
)


# ── Generation function ───────────────────────────────────────────────────────
def generate_stage(key: str, stage: dict, output_path: Path) -> bool:
    """Generate a stage background using GPT-4o image generation."""
    prompt_text = (
        f"Generate a fighting game stage background:\n\n"
        f"SCENE: {stage['title']}\n"
        f"{stage['description']}\n\n"
        f"TIME OF DAY: {stage['time']}\n"
        f"MOOD: {stage['mood']}\n\n"
        f"STYLE RULES:\n{STAGE_STYLE}"
    )

    max_attempts = 4
    for attempt in range(max_attempts):
        try:
            response = client.responses.create(
                model="gpt-4o",
                input=[{
                    "role": "user",
                    "content": [{"type": "input_text", "text": prompt_text}],
                }],
                tools=[{"type": "image_generation", "output_format": "png"}],
            )

            image_data = None
            for item in response.output:
                if item.type == "image_generation_call":
                    image_data = item.result
                    break

            if image_data:
                img_bytes = base64.b64decode(image_data)
                output_path.write_bytes(img_bytes)
                # Save prompt
                prompts_dir = Path('data/prompts')
                prompts_dir.mkdir(parents=True, exist_ok=True)
                (prompts_dir / output_path.with_suffix('.prompt.txt').name).write_text(
                    prompt_text, encoding='utf-8')
                print(f"  ✓ {output_path.name}", flush=True)
                return True
            else:
                print(f"  ✗ No image in response for {output_path.name}", flush=True)

        except openai.RateLimitError:
            wait = 20 * (attempt + 1)
            print(f"  ⏳ rate limit, waiting {wait}s...", flush=True)
            time.sleep(wait)
        except Exception as e:
            wait = 5 * (attempt + 1)
            print(f"  ✗ attempt {attempt+1}/{max_attempts}: {e}", flush=True)
            if attempt < max_attempts - 1:
                time.sleep(wait)
    return False


# ── CLI ───────────────────────────────────────────────────────────────────────
if len(sys.argv) > 1:
    requested = [a.lower() for a in sys.argv[1:]]
    unknown = [r for r in requested if r not in STAGES]
    if unknown:
        print(f"ERROR: Unknown stage(s): {unknown}")
        print(f"Available: {list(STAGES.keys())}")
        sys.exit(1)
    stages_to_generate = {k: STAGES[k] for k in requested}
else:
    stages_to_generate = STAGES

assets_dir = Path('assets')
assets_dir.mkdir(exist_ok=True)

# ── Build tasks and run in parallel ───────────────────────────────────────────
MAX_WORKERS = 3
tasks = []

for key, stage in stages_to_generate.items():
    out = assets_dir / f"bg_{key}.jpg"
    if out.exists():
        print(f"  skip (exists): {out.name}", flush=True)
        continue
    # Generate as PNG first (GPT-4o output), convert to JPG after
    out_png = assets_dir / f"bg_{key}.png"
    tasks.append((key, stage, out_png))

failed = []

if tasks:
    print(f"\nGenerating {len(tasks)} stage backgrounds with {MAX_WORKERS} parallel workers...\n")
    done = 0
    total = len(tasks)
    lock = threading.Lock()

    def run_stage(key, stage, out_png):
        return key, generate_stage(key, stage, out_png)

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(run_stage, k, s, o): k for k, s, o in tasks}
        for future in as_completed(futures):
            key = futures[future]
            try:
                _, ok = future.result()
            except Exception as e:
                print(f"  ✗ Exception for {key}: {e}", flush=True)
                ok = False
            with lock:
                done += 1
                if not ok:
                    failed.append(key)
                print(f"  Progress: {done}/{total}", flush=True)
else:
    print("\nAll stages already exist — nothing to generate.")

# ── Post-processing: convert PNG to optimized JPG ─────────────────────────────
print("\nOptimizing stage images...")
try:
    from PIL import Image

    for key in stages_to_generate:
        png_path = assets_dir / f"bg_{key}.png"
        jpg_path = assets_dir / f"bg_{key}.jpg"

        if png_path.exists():
            img = Image.open(png_path).convert("RGB")
            # Resize to 1920x1080 if needed
            if img.size != (1920, 1080):
                img = img.resize((1920, 1080), Image.LANCZOS)
            img.save(jpg_path, "JPEG", quality=85, optimize=True)
            png_size = png_path.stat().st_size / 1024
            jpg_size = jpg_path.stat().st_size / 1024
            print(f"  ✓ {jpg_path.name}: {png_size:.0f}KB PNG → {jpg_size:.0f}KB JPG")
            png_path.unlink()  # remove PNG, keep JPG

except ImportError:
    print("  PIL not available — skipping optimization.")

# ── Summary ───────────────────────────────────────────────────────────────────
print(f"\n{'='*50}")
if failed:
    print(f"⚠  Failed stages: {failed}")
else:
    print("✓ All stages generated successfully.")

# Show what game.js needs
print("\nStages available for game.js STAGES array:")
for key in STAGES:
    jpg = assets_dir / f"bg_{key}.jpg"
    status = "✓" if jpg.exists() else "✗"
    print(f"  {status} bg_{key}")
