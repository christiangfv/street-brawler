#!/usr/bin/env python3
"""
Generate sprite frames for Radar Fighters using ImageRouter API (FLUX / GPT-image).

Each character has a reference photo. The model sees the photo and generates
the same person as a pixel art chibi fighter in different poses.

Usage:
    python generate_animated_sprites.py              # genera TODOS
    python generate_animated_sprites.py alex         # genera solo alex
    python generate_animated_sprites.py alex herbert # genera alex y herbert
"""

import json, time, sys, requests
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from pathlib import Path

# ── Credentials ────────────────────────────────────────────────────────────────
IMAGEROUTER_API_KEY = "3cd4d61598164f23b40c57b1179dc2eb7d5e28aeaba3aed845dca03d91514fb7"
IMAGEROUTER_BASE = "https://api.imagerouter.io/v1/openai/images"

# Model to use for generation (edits endpoint with reference image)
MODEL = "black-forest-labs/FLUX-2-klein-4b"

# ── Characters ─────────────────────────────────────────────────────────────────
# 'ref' points to the reference pixel art portrait for each character.
# The visual description is still included as reinforcement, but the IMAGE
# is what truly anchors the design.

CHARACTERS = {
    'alex': {
        'title': 'SALES EXEC',
        'color': '#d4ac0d',
        'gender': 'male',
        'ref': 'assets/photos/alex.png',
        'visual': (
            "Male, light skin with light freckles, medium-length wavy dark brown hair "
            "swept back past the ears, large round tortoiseshell glasses (amber and dark "
            "brown pattern), brown eyes, full scruffy dark brown beard of medium length, "
            "warm wide smile showing teeth. Dark charcoal-gray crewneck sweatshirt. "
            "Gold chain necklace visible at the collar. Medium build. "
            "Dark navy slim-fit jeans. White leather sneakers."
        ),
        'personality': (
            "Smooth-talking finance bro turned fintech sales exec. Consultive seller with "
            "banking background. Charming, warm, always smiling. Fights with confidence "
            "and charisma — like closing a deal with his fists."
        ),
    },
    'herbert': {
        'title': 'CO-FOUNDER & CEO',
        'color': '#c0392b',
        'gender': 'male',
        'ref': 'assets/photos/herbert.png',
        'visual': (
            "Male. White/cream crew-neck t-shirt with dark '360' text/logo on the front. "
            "Khaki chino shorts. Dark brown leather sandals. "
            ""
        ),
        'personality': (
            "Serial entrepreneur, AI expert, fintech keyplayer in Latin America for 15+ years. "
            "Co-founder & CEO energy — decisive, strategic, bold. Loves the beach and padel. "
            "Fights like a boss: calculated power moves, always in control."
        ),
    },
    'gabo': {
        'title': 'CO-FOUNDER & CTO',
        'color': '#2980b9',
        'gender': 'male',
        'ref': 'assets/photos/gabo.png',
        'visual': (
            "Male. Blue eyes. Plain black crew-neck t-shirt. Dark gray jogger pants. "
            "Black and white running sneakers."
        ),
        'personality': (
            "Restless by nature — always trying something new: gadgets, ideas, bikes, travel. "
            "Co-founder & CTO. Brings energy, humor, and curiosity to everything. Foodie, "
            "loves good conversation. Fights with creative unpredictability and raw enthusiasm."
        ),
    },
    'amanda': {
        'title': 'CO-FOUNDER & CRO',
        'color': '#e8735a',
        'gender': 'female',
        'ref': 'assets/photos/amanda.png',
        'visual': (
            "Female. Dark brown or black v-neck top. Small gold hoop earrings. "
            "Black fitted leggings. Coral-orange running shoes. "
            ""
        ),
        'personality': (
            "Fintech powerhouse for 10+ years across LatAm — accelerators, VC funds, startups. "
            "Co-founder & CRO. Studied business & psychology at Emory. Loves rock climbing "
            "and salsa dancing. Fights with agility, rhythm, and strategic precision."
        ),
    },
    'arturo': {
        'title': 'TECH MANAGER',
        'color': '#2c3e50',
        'gender': 'male',
        'ref': 'assets/photos/arturo.png',
        'visual': (
            "Male. White and blue patterned short-sleeve button-up shirt (floral/abstract print) "
            "over a dark undershirt. Dark-framed rectangular glasses. "
            "Dark navy chino pants. Brown leather lace-up shoes. "
            ""
        ),
        'personality': (
            "Tech manager who builds reliable systems. Published board game designer (Nínive). "
            "Worked at Equifax US and in casino/videogame software. Cat dad of Alcachofa & "
            "Albahaquita. Dry humor, strategic mind. Fights like a board game tactician — "
            "every move is calculated, but with a smirk."
        ),
    },
    'jaime': {
        'title': 'TECH LEAD',
        'color': '#1abc9c',
        'gender': 'male',
        'ref': 'assets/photos/jaime.png',
        'visual': (
            "Male. Dark charcoal/black long-sleeve shirt with 'RADAR' printed in white on the front. "
            "Black slim jeans. Black high-top sneakers. "
            ""
        ),
        'personality': "Tech lead. Mysterious — work in progress. Fights with quiet intensity.",
    },
    'chris': {
        'title': 'BACKEND ENGINEER',
        'color': '#f39c12',
        'gender': 'male',
        'ref': 'assets/photos/chris.png',
        'visual': (
            "Male. Cream/off-white crew-neck sweater with subtle striped texture on the sleeves. "
            "Blue sunglasses pushed up on top of his head. "
            "Olive green chino pants. White minimalist sneakers. "
            ""
        ),
        'personality': (
            "Telecom engineer who builds autonomous AI agents at Radar. Heavy experimenter. "
            "Runner, painter, explorer of what lies beyond the obvious. "
            "Fights with engineering precision and creative flair — methodical but surprising."
        ),
    },
    'kevin': {
        'title': 'FULL STACK ENGINEER',
        'color': '#0984e3',
        'gender': 'male',
        'ref': 'assets/photos/kevin.png',
        'visual': (
            "Male. Black hoodie with hood visible behind the neck, over a white t-shirt peeking at the collar. "
            "Dark gray sweatpants. Black and blue gaming-style sneakers. "
            ""
        ),
        'personality': (
            "Dev obsessed with performance — hates slow solutions. Night gamer, weekend TCG "
            "player (One Piece and Pokemon cards). Fights FAST — speed is everything, "
            "no wasted frames, pure optimized combos."
        ),
    },
    'lorens': {
        'title': 'BACKEND ENGINEER',
        'color': '#e17055',
        'gender': 'male',
        'ref': 'assets/photos/lorens.png',
        'visual': (
            "Male. White sleeveless tank top. Black athletic shorts. "
            "Red and white running shoes."
        ),
        'personality': (
            "Telecom engineer, passionate athlete and sports enthusiast. Life surrounded by "
            "dogs and cats. Watches anime and sci-fi/psychological series. "
            "Fights with athletic power and endurance — strong, fast, relentless."
        ),
    },
    'nelson': {
        'title': 'BACKEND ENGINEER',
        'color': '#6c3483',
        'gender': 'male',
        'ref': 'assets/photos/nelson.png',
        'visual': (
            "Male. Black crewneck t-shirt. Dark indigo straight-fit jeans. "
            "Dark brown casual boots."
        ),
        'personality': (
            "Veteran software developer with vast experience. Devoted husband and father of "
            "two daughters. Passionate craft beer brewer and BBQ/cooking enthusiast. "
            "Fights like a seasoned veteran — solid, experienced, unshakeable."
        ),
    },
    'andres': {
        'title': 'DEVOPS ENGINEER',
        'color': '#117a65',
        'gender': 'male',
        'ref': 'assets/photos/andres.png',
        'visual': (
            "Male. Light blue button-up shirt with small white polka dot/micro-print pattern. "
            "Dark-framed rectangular glasses. Olive cargo pants. "
            "Black sturdy work boots."
        ),
        'personality': (
            "IT & Networking engineer. Father of Felipe and Magdalena, lives in the countryside "
            "outside Santiago (Chacabuco). Loves science, tech, cars, and cinema. "
            "Fights with infrastructure-grade resilience — tough, reliable, hard to take down."
        ),
    },
    'javier': {
        'title': 'FRONTEND DEVELOPER',
        'color': '#34495e',
        'gender': 'male',
        'ref': 'assets/photos/javier.png',
        'visual': (
            "Male. Black graphic t-shirt with colorful orange, blue and red 'Lucky Odds' retro/flame print. "
            "Black flat-brim cap. Round wire-framed glasses. "
            "Black skinny jeans. Red and black skate shoes. "
            ""
        ),
        'personality': "Frontend developer. Mysterious — work in progress. Fights with pixel-perfect precision.",
    },
    'gerardo': {
        'title': 'LOW CODE ENGINEER',
        'color': '#e74c3c',
        'gender': 'male',
        'ref': 'assets/photos/gerardo.png',
        'visual': (
            "Male. Red/orange crewneck t-shirt. Large round silver-framed glasses. "
            "Medium blue jeans. White casual sneakers. "
            ""
        ),
        'personality': (
            "Low-code engineer and AI whisperer — spends his time talking to AI and his 6 cats. "
            "7 years in startups, always connecting with amazing people and new ideas. "
            "Curious learner and builder. Fights with clever improvisation and cat-like reflexes."
        ),
    },
    'carlo': {
        'title': 'PRODUCT LEAD',
        'color': '#8e44ad',
        'gender': 'male',
        'ref': 'assets/photos/carlo.png',
        'visual': (
            "Male. Black and white horizontal-striped crewneck shirt under a dark black cardigan/jacket. "
            "Small gold hoop earring. Black slim-fit chino pants. "
            "White low-top canvas sneakers."
        ),
        'personality': (
            "Industrial engineer, musician at heart — guitar was his biggest addiction from 13 to 17 "
            "(true withdrawal if he couldn't play for 2 days). Anime fan, gamer, language nerd. "
            "Fights with rhythm and intensity — every combo has a musical tempo."
        ),
    },
    'esteban': {
        'title': 'BUSINESS DEVELOPMENT',
        'color': '#e67e22',
        'gender': 'male',
        'ref': 'assets/photos/esteban.png',
        'visual': (
            "Male. Dark charcoal/black crewneck t-shirt. Black rectangular-framed glasses. "
            "Dark wash straight jeans. Black and white Vans-style sneakers. "
            ""
        ),
        'personality': (
            "Biz dev by day, rock drummer by night. Gamer, padel player, manga reader, "
            "occasional wine connoisseur. Father of a 4-year-old with Angelica Pickles energy. "
            "Fights with rock-and-roll aggression — hits hard, hits loud, full of rhythm."
        ),
    },
    'francisco': {
        'title': 'BUSINESS ANALYST',
        'color': '#6c5ce7',
        'gender': 'male',
        'ref': 'assets/photos/francisco.png',
        'visual': (
            "Male. Light lavender/lilac collared button-up dress shirt. "
            "Dark rectangular-framed glasses. Navy blue dress pants. "
            "Clean white sneakers."
        ),
        'personality': (
            "Goes by Pancho. Commercial engineer who fell in love with Product at Radar. "
            "Hardcore fighting game competitor — has represented his country at international "
            "tournaments! The real deal. Fights like a FGC pro: frame-perfect inputs, "
            "reads opponents like a book, clutch comebacks."
        ),
    },
    'hector': {
        'title': 'SALES MANAGER',
        'color': '#922b21',
        'gender': 'male',
        'ref': 'assets/photos/hector.png',
        'visual': (
            "Male. Dark navy/black crew neck t-shirt. Round silver-framed glasses. "
            "Gray tailored chino pants. Brown leather loafers. "
            ""
        ),
        'personality': "Sales manager. Fights with persuasive force and closing power.",
    },
    'dani': {
        'title': 'OPERATIONS ANALYST',
        'color': '#27ae60',
        'gender': 'female',
        'ref': 'assets/photos/dani.png',
        'visual': (
            "Female. Dark navy crew neck sweatshirt with a light blue/periwinkle undershirt visible beneath. "
            "Black slim jeans. White and mint-green sneakers. "
            ""
        ),
        'personality': (
            "Started in admin at Radar and grew into Operations through pure effort and curiosity. "
            "Loves traveling and seeking new experiences. Seems serious at first, but warm and "
            "close once there's trust. Fights with quiet determination — underestimate her at your peril."
        ),
    },
    'yong': {
        'title': 'OPERATIONS MANAGER',
        'color': '#1a5276',
        'gender': 'male',
        'ref': 'assets/photos/yong.png',
        'visual': (
            "Male. Long black dreadlocks past the shoulders. "
            "Dark charcoal/black suit jacket over a white collared dress shirt, open at the neck with no tie. "
            "Matching dark charcoal dress pants. Black formal shoes. "
            ""
        ),
        'personality': (
            "Yongsan Chiong Rayo — just call him Yong. Chinese descendant, brings maximum energy. "
            "Industrial engineer by trade. Practices Kung Fu and loves dancing. Anime, Pokemon & "
            "Digimon fan. Known in college as 'the only Chinese guy with dreadlocks'. "
            "Fights with actual Kung Fu style — fast kicks, fluid movement, fearless."
        ),
    },
    'geri': {
        'title': 'ACCOUNTING MANAGER',
        'color': '#f1c40f',
        'gender': 'female',
        'ref': 'assets/photos/geri.png',
        'visual': (
            "Female. Black v-neck top. Delicate thin chain necklace. Small decorative earring (flower/star). "
            "Dark gray yoga pants. Pink and white running shoes. "
            ""
        ),
        'personality': (
            "Accounting manager who builds scalable financial structures. Training for her first "
            "Chicago marathon. Loves trekking, yoga, running, morning coffee, and jazz. "
            "Endlessly curious traveler. Fights with marathon endurance and yogic balance."
        ),
    },
    'max': {
        'title': 'PEOPLE & CULTURE',
        'color': '#00b894',
        'gender': 'male',
        'ref': 'assets/photos/max.png',
        'visual': (
            "Male. Colorful blue hoodie with vibrant yellow, green, and pink floral/paisley print. "
            "Beige khaki jogger pants. Green and white retro sneakers. "
            ""
        ),
        'personality': (
            "Clinical and organizational psychologist. Has had over 20 pet rabbits in his life. "
            "Loves giving psychology talks. Proud Shrek appreciator. "
            "Fights with psychological warfare — reads your mind, knows your next move, "
            "then hits you with ogre-level power."
        ),
    },
    'andy': {
        'title': 'MARKETING LEAD',
        'color': '#fd79a8',
        'gender': 'female',
        'ref': 'assets/photos/andy.png',
        'visual': (
            "Female. Light blue collared polo shirt. White tailored pants. "
            "Nude/beige heeled ankle boots."
        ),
        'personality': (
            "Senior marketing exec with 15+ years in multinational companies. Effie Bronze winner. "
            "Worked with Santander, BBVA, Scotiabank, Liberty Mutual. Believes knowledge has no limits. "
            "Fights with brand-building strategy — every hit is a campaign, every combo tells a story."
        ),
    },
    'karen': {
        'title': 'COMMUNICATIONS ANALYST',
        'color': '#fdcb6e',
        'gender': 'female',
        'ref': 'assets/photos/karen.png',
        'visual': (
            "Female. Dark gray/charcoal button-up cardigan or jacket. Silver pendant necklace on a chain. "
            "Black leggings. White and pink ballet-style sneakers. "
            ""
        ),
        'personality': (
            "Marketing exec who never stops learning. Classical ballet dancer, fitness enthusiast, "
            "foodie explorer. Mom of a playful orange cat. "
            "Fights with ballet grace — elegant, precise, deceptively powerful pirouette kicks."
        ),
    },
    'radarin': {
        'title': 'SECRET BOSS DOLPHIN',
        'color': '#0099e5',
        'gender': 'other',
        'ref': 'assets/photos/radarin.png',
        'visual': (
            "An anthropomorphic dolphin standing upright on two legs. Smooth light-blue skin, "
            "white belly, large round black eyes, dolphin snout with a grin. "
            "Dark navy knit beanie with white 'RA' lettering on the front. "
            "Tiny golden championship belt around waist and small red boxing gloves. "
            "Short stubby legs, flipper-like arms. Compact cute body."
        ),
        'personality': (
            "Radar's internal mascot — not yet ready for the public product. Embodies the T.O.D.O "
            "culture: Todos juntos, Obsesionate, Diversion, Osadia. Represents 'dolphin people' — "
            "smart AND cool. Secret final boss. Fights with dolphin agility, echolocation reads, "
            "and unstoppable good vibes."
        ),
    },
}

# ── Pose descriptions ──────────────────────────────────────────────────────────
POSES = {
    'idle': (
        "Standing upright facing RIGHT in a classic fighting game ready stance. "
        "Feet shoulder-width apart, knees slightly bent, both fists raised to chest height. "
        "Weight centered, alert confident expression."
    ),
    'atk': (
        "Lunging to the RIGHT in an attack. Right arm fully extended in a straight punch, "
        "left arm pulled back at the hip. Body leaning forward, back leg extended. "
        "Fierce expression, mouth open in a battle cry."
    ),
    'hit': (
        "Recoiling backward to the LEFT from being hit. "
        "Upper body leaning back, arms flung up near the face defensively. "
        "Eyes squeezed shut, mouth open in pain. One foot lifting off ground."
    ),
    'kick': (
        "Delivering a high side kick to the RIGHT. Standing on the left leg, "
        "right leg fully extended horizontally at chest height, toes pointed. "
        "Arms pulled back for balance. Determined fierce expression."
    ),
    'block': (
        "Defensive blocking stance facing RIGHT. Both arms crossed in front of "
        "the chest and face, forearms forming an X-guard. Knees bent, feet planted "
        "firmly. Eyes visible above the guard, focused and tense expression."
    ),
    'special': (
        "Charging a powerful special attack facing RIGHT. Both hands cupped at the side "
        "at waist level, a glowing energy ball forming between the palms. Legs in wide "
        "power stance, body slightly crouched. Intense glowing eyes, mouth open yelling. "
        "Visible aura/energy particles around the character."
    ),
    'win': (
        "Victory celebration pose facing the camera (front-facing). One fist raised "
        "triumphantly above the head, other hand on hip. Standing tall and proud, "
        "big confident grin showing teeth. Slight lean back, chest puffed out."
    ),
    'ko': (
        "Knocked out on the ground. Lying flat on their back, eyes replaced by X_X or "
        "spiral dizzy eyes, mouth open. Arms and legs sprawled out loosely. "
        "Small stars or birds circling above the head."
    ),
    'jump': (
        "Mid-air jumping pose facing RIGHT. Knees tucked up toward the chest, "
        "both fists raised above the head ready to strike downward. Body compact "
        "and airborne. Alert expression looking down at the opponent below."
    ),
    'crouch': (
        "Low crouching stance facing RIGHT. One knee almost touching the ground, "
        "other leg extended to the side. One fist on the ground for support, "
        "other arm raised defensively. Looking up at the opponent, ready to sweep or dodge."
    ),
    'throw': (
        "Grabbing pose facing RIGHT. Both arms fully extended forward at chest height, "
        "hands open wide ready to grab the opponent. Leaning forward aggressively, "
        "one foot stepping ahead. Intense determined expression."
    ),
    'taunt': (
        "Taunting the opponent facing RIGHT. One hand extended forward doing a "
        "'come at me' beckoning gesture with fingers. Other hand on hip or behind head. "
        "Cocky smirk, eyebrows raised. Relaxed confident stance, leaning back slightly."
    ),
    'walk': (
        "Mid-stride walking pose moving to the RIGHT. One foot forward, one foot back "
        "in a natural walking step. Arms in opposite motion to legs (right foot forward, "
        "left arm forward). Fists loosely clenched. Focused forward-looking expression."
    ),
}

# ── Animated frame variants ──────────────────────────────────────────────────
# DISABLED: breathing, bobbing, and walk cycles are now handled in code (JS)
# using scale/translate transforms on the base sprite. This saves ~120 API calls.
FRAME_VARIANTS = {}

# ── Style prompts ─────────────────────────────────────────────────────────────
SPRITE_STYLE = (
    "Pixel art character sprite from a 1990s Super Nintendo fighting game "
    "(Pocket Fighter / Super Gem Fighter Mini Mix style). "
    "Chibi/super-deformed proportions: very large head (~50% of body height), "
    "small compact torso, short stubby legs. "
    "Clean black pixel outlines. Flat bright saturated colors, NO gradients, NO anti-aliasing. "
    "Full body visible head to toe, centered in a square frame. "
    "The character must occupy the same bounding box in every pose — same head size, "
    "same body proportions, same overall height. "
    "Leave consistent padding around the character — do not scale the character to fill "
    "the frame differently per pose."
)

PORTRAIT_STYLE = (
    "Pixel art character portrait from a 1990s Super Nintendo fighting game "
    "(Pocket Fighter / Super Gem Fighter Mini Mix style). "
    "Chibi/super-deformed proportions: very large head, big expressive eyes. "
    "Clean black pixel outlines. Flat bright saturated colors, NO gradients, NO anti-aliasing. "
    "Upper body only (head and shoulders), centered in a square frame."
)


# ── ImageRouter API generation ────────────────────────────────────────────────
def imagerouter_edits(ref_path: str, prompt: str, output_path: Path) -> bool:
    """Generate an image using ImageRouter edits endpoint with a reference image."""
    max_attempts = 4
    for attempt in range(max_attempts):
        try:
            ext = Path(ref_path).suffix.lower()
            mime = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
                    '.webp': 'image/webp'}.get(ext, 'image/png')
            with open(ref_path, 'rb') as img_file:
                resp = requests.post(
                    f"{IMAGEROUTER_BASE}/edits",
                    headers={"Authorization": f"Bearer {IMAGEROUTER_API_KEY}"},
                    files={"image": (Path(ref_path).name, img_file, mime)},
                    data={
                        "model": MODEL,
                        "prompt": prompt,
                        "size": "1024x1024",
                        "response_format": "url",
                        "output_format": "webp",
                    },
                    timeout=60,
                )
            data = resp.json()

            if "data" in data and data["data"] and "url" in data["data"][0]:
                img_url = data["data"][0]["url"]
                cost = data.get("cost", "?")
                img_resp = requests.get(img_url, timeout=30)
                img_resp.raise_for_status()
                output_path.write_bytes(img_resp.content)
                # Save prompt for debugging
                prompts_dir = Path('data/prompts')
                prompts_dir.mkdir(parents=True, exist_ok=True)
                (prompts_dir / output_path.with_suffix('.prompt.txt').name).write_text(
                    prompt, encoding='utf-8')
                print(f"  ✓ {output_path.name} (${cost})", flush=True)
                return True
            else:
                error = data.get("error", data)
                print(f"  ✗ {output_path.name}: {error}", flush=True)

        except requests.exceptions.Timeout:
            wait = 10 * (attempt + 1)
            print(f"  ⏳ timeout on {output_path.name}, waiting {wait}s...", flush=True)
            time.sleep(wait)
        except Exception as e:
            wait = 5 * (attempt + 1)
            print(f"  ✗ attempt {attempt+1}/{max_attempts} for {output_path.name}: {e}", flush=True)
            if attempt < max_attempts - 1:
                time.sleep(wait)
    return False


def _face_rule_for(char: dict) -> str:
    """Return the gender-appropriate face matching rule for prompts."""
    gender = char.get('gender', 'male')
    if gender == 'female':
        return (
            "same face shape, same hair (color, style, length), same skin tone. "
            "This character is FEMALE — do NOT add any beard, stubble, or facial hair. "
            "Do NOT add glasses or sunglasses unless they are explicitly described in the outfit below."
        )
    elif gender == 'other':
        return (
            "Match the reference photo exactly. "
            "Do NOT add glasses or sunglasses unless they are explicitly described in the outfit below."
        )
    else:
        return (
            "same face shape, same hair (color, style, length), "
            "same beard/facial hair (only if visible in the reference photo — do NOT invent facial hair), same skin tone. "
            "Do NOT add glasses or sunglasses unless they are explicitly described in the outfit below."
        )


def generate_sprite(name: str, pose_key: str, char: dict, output_path: Path,
                    pose_desc: str = None) -> bool:
    """Generate a sprite using ImageRouter with reference image."""
    ref_path = char.get('ref', '')
    if not ref_path or not Path(ref_path).exists():
        print(f"  ✗ Reference image missing: {ref_path} — cannot generate {name}/{pose_key}")
        return False

    if pose_desc is None:
        pose_desc = POSES[pose_key]

    face_rule = _face_rule_for(char)

    prompt_text = (
        f"Look at the attached reference photo carefully. This is the real person's FACE that the character is based on.\n\n"
        f"Generate a FULL BODY pixel art sprite of THIS EXACT PERSON in the following pose:\n\n"
        f"{pose_desc}\n\n"
        f"STYLE:\n"
        f"{SPRITE_STYLE}\n\n"
        f"CHARACTER APPEARANCE (from the photo):\n"
        f"- FACE: Match the reference photo exactly — {face_rule}\n"
        f"- OUTFIT (not visible in photo, follow this description exactly): {char['visual']}\n\n"
        f"CRITICAL RULES:\n"
        f"- The face MUST match the reference photo.\n"
        f"- The outfit MUST match the text description above — do NOT invent or change any clothing.\n"
        f"- This is pose '{pose_key}' from a sprite sheet."
    )

    return imagerouter_edits(ref_path, prompt_text, output_path)


# ── CLI: filter characters ─────────────────────────────────────────────────────
if len(sys.argv) > 1:
    requested = [a.lower() for a in sys.argv[1:]]
    unknown = [r for r in requested if r not in CHARACTERS]
    if unknown:
        print(f"ERROR: Unknown character(s): {unknown}")
        print(f"Available: {list(CHARACTERS.keys())}")
        sys.exit(1)
    chars_to_generate = {k: CHARACTERS[k] for k in requested}
else:
    chars_to_generate = CHARACTERS

# ── Setup check ────────────────────────────────────────────────────────────────
refs_dir = Path('ref')
refs_dir.mkdir(exist_ok=True)
assets_dir = Path('assets')
assets_dir.mkdir(exist_ok=True)

print("Reference images status:")
for name, char in chars_to_generate.items():
    ref = char.get('ref', '')
    exists = "✓" if Path(ref).exists() else "✗ MISSING"
    method = "GPT-4o" if Path(ref).exists() else "DALL-E 3 fallback"
    print(f"  {name:12s} → {ref:25s} [{exists}] → {method}")
print()

# ── Portrait generation function ──────────────────────────────────────────────
PORTRAIT_PROMPT_TEMPLATE = (
    "Look at the attached reference photo carefully. This is the real person's FACE that the character is based on.\n\n"
    "Generate a CHARACTER SELECT SCREEN PORTRAIT of THIS EXACT PERSON:\n\n"
    "- Front-facing, upper body / bust shot (head and shoulders)\n"
    "- Fun, cheerful, comic expression — big goofy grin, playful energy, like a cartoon character "
    "ready to have a good time. NOT serious or aggressive — this is a lighthearted party game vibe.\n\n"
    "STYLE:\n"
    "{style}\n\n"
    "CHARACTER APPEARANCE (from the photo):\n"
    "- FACE: Match the reference photo exactly — {face_rule}\n"
    "- OUTFIT (not visible in photo, follow this description exactly): {visual}\n\n"
    "CRITICAL RULES:\n"
    "- The face MUST match the reference photo.\n"
    "- The outfit MUST match the text description above — do NOT invent or change any clothing."
)

def generate_portrait(name: str, char: dict, output_path: Path) -> bool:
    """Generate a character select portrait using ImageRouter with reference."""
    ref_path = char['ref']
    if not Path(ref_path).exists():
        print(f"  ⚠ Reference image not found: {ref_path} — skipping portrait for {name}")
        return False

    prompt_text = PORTRAIT_PROMPT_TEMPLATE.format(
        style=PORTRAIT_STYLE, visual=char['visual'], face_rule=_face_rule_for(char)
    )

    return imagerouter_edits(ref_path, prompt_text, output_path)


# ── Build task list and run in parallel ───────────────────────────────────────
MAX_WORKERS = 4  # concurrent API calls (tune based on OpenAI rate limits)

tasks = []  # list of (label, callable) tuples

# 1) Base sprite poses (individual generation)
for name, char in chars_to_generate.items():
    for pose_key in POSES:
        out = assets_dir / f"spr_{name}_{pose_key}.png"
        if out.exists():
            print(f"  skip (exists): {out.name}", flush=True)
            continue
        tasks.append((str(out), lambda n=name, pk=pose_key, c=char, o=out:
                       generate_sprite(n, pk, c, o)))

# 2) Animated frame variants (always individual — small tweaks per frame)
for name, char in chars_to_generate.items():
    for pose_key, frames in FRAME_VARIANTS.items():
        base_desc = POSES[pose_key]
        for suffix, tweak in frames:
            out = assets_dir / f"spr_{name}_{pose_key}{suffix}.png"
            if out.exists():
                print(f"  skip (exists): {out.name}", flush=True)
                continue
            desc = base_desc + tweak
            tasks.append((str(out), lambda n=name, pk=pose_key, c=char, o=out, d=desc:
                           generate_sprite(n, pk, c, o, pose_desc=d)))

# 3) Character select portraits
for name, char in chars_to_generate.items():
    out = assets_dir / f"char_{name}.png"
    if out.exists():
        print(f"  skip (exists): {out.name}", flush=True)
        continue
    tasks.append((str(out), lambda n=name, c=char, o=out:
                   generate_portrait(n, c, o)))

failed = []
portrait_failed = []
frame_failed = []

if tasks:
    print(f"\nGenerating {len(tasks)} tasks with {MAX_WORKERS} parallel workers...\n")
    done = 0
    total = len(tasks)
    lock = threading.Lock()

    def run_task(label, fn):
        return label, fn()

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(run_task, label, fn): label for label, fn in tasks}
        for future in as_completed(futures):
            label = futures[future]
            try:
                _, ok = future.result()
            except Exception as e:
                print(f"  ✗ Exception for {label}: {e}", flush=True)
                ok = False

            with lock:
                done += 1
                if not ok:
                    if 'char_' in label:
                        portrait_failed.append(label)
                    elif '_f0' in label or '_f1' in label or '_f2' in label:
                        frame_failed.append(label)
                    else:
                        failed.append(label)
                print(f"  Progress: {done}/{total}", flush=True)

    print(f"\n{'='*50}")
    print(f"Generation complete: {done - len(failed) - len(portrait_failed) - len(frame_failed)}/{total} succeeded")
    if failed:
        print(f"Failed: {failed}")
    if frame_failed:
        print(f"Failed frame variants: {frame_failed}")
    if portrait_failed:
        print(f"Failed portraits: {portrait_failed}")
else:
    print("\nAll images already exist — nothing to generate.")

# ── Background removal (rembg — AI contour-based, not color-based) ────────────
print("\nRemoving backgrounds with rembg (contour-based)...")
try:
    from rembg import remove as rembg_remove
    from PIL import Image
    import numpy as np

    def remove_bg(path: str):
        """Remove background using rembg (U2Net AI segmentation).
        Works by contour detection, not color — preserves internal whites.
        Also converts webp → png with alpha channel.
        """
        img = Image.open(path).convert("RGBA")
        # Skip if already mostly transparent (re-run safe)
        alpha = np.array(img)[:,:,3]
        if np.mean(alpha < 128) > 0.3:
            img.save(path)
            return
        result = rembg_remove(img)
        result.save(path)
        print(f"  ✓ bg removed: {Path(path).name}", flush=True)

    bg_errors = []
    for name in chars_to_generate:
        # Sprites
        for pose_key in POSES:
            f = f"assets/spr_{name}_{pose_key}.png"
            if Path(f).exists():
                try:
                    remove_bg(f)
                except Exception as e:
                    print(f"  ✗ {f}: {e}", flush=True)
                    bg_errors.append(f)
        # Portrait
        portrait_f = f"assets/char_{name}.png"
        if Path(portrait_f).exists():
            try:
                remove_bg(portrait_f)
            except Exception as e:
                print(f"  ✗ {portrait_f}: {e}", flush=True)
                bg_errors.append(portrait_f)

    print(f"\nBG removal done. Errors: {len(bg_errors)}")
    if bg_errors:
        print(f"  Failed: {bg_errors}")

except ImportError:
    print("  rembg not installed — skipping bg removal. Install with: pip install 'rembg[cpu]'")

print(f"\n{'='*50}")
print("All done.")
all_failures = failed + portrait_failed + frame_failed
if all_failures:
    print(f"⚠  Failed sprites: {failed}")
    if portrait_failed:
        print(f"⚠  Failed portraits: {portrait_failed}")
    if frame_failed:
        print(f"⚠  Failed frame variants: {frame_failed}")
else:
    print("✓ All sprites, portraits, and animations generated successfully.")