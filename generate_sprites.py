#!/usr/bin/env python3
import json, base64, requests, os, time

with open('/data/.config/openai.json') as f:
    api_key = json.load(f)['api_key']

ASSETS_DIR = '/data/.openclaw/workspace/street-brawler/assets'

CHARACTERS = [
    {
        'name': 'amanda',
        'role': 'Co-founder & CRO',
        'appearance': 'Woman with long wavy brown hair with lighter highlights, warm light-medium skin tone, oval face with high cheekbones, gold hoop earrings, bright smile, dark eyes, defined brows'
    },
    {
        'name': 'arturo',
        'role': 'Tech Manager',
        'appearance': 'Man with short curly dark brown hair, trimmed beard and mustache, medium skin tone, dark-framed rectangular glasses, serious focused expression, average build, patterned shirt'
    },
    {
        'name': 'gerardo',
        'role': 'Low Code Engineer',
        'appearance': 'Man with short swept dark brown hair, scruffy beard, medium-tan skin, round silver-framed glasses, wide cheerful grin, stockier build, red crew-neck shirt'
    },
    {
        'name': 'carlo',
        'role': 'Product Lead',
        'appearance': 'Man with neatly styled swept-back dark brown hair, trimmed short beard, medium-tan skin, slim angular face, dark eyes, friendly smile, small earring, striped shirt under dark jacket'
    },
    {
        'name': 'chris',
        'role': 'Backend Engineer LVL 3',
        'appearance': 'Man with medium-length tousled brown hair, goatee, medium-tan skin, round friendly face, dark eyes, sunglasses pushed up on head, cream sweater, stockier build'
    },
    {
        'name': 'dani',
        'role': 'Operations Analyst',
        'appearance': 'Woman with shoulder-length wavy blonde hair with darker roots, dark eyes, warm medium skin tone, subtle confident half-smile, navy sweatshirt, thoughtful pose'
    },
    {
        'name': 'esteban',
        'role': 'Business Development Associate',
        'appearance': 'Man with short dark wavy hair, medium-tan skin, black rectangular glasses, rounded friendly face, warm smile, slight stubble, dark striped shirt'
    },
    {
        'name': 'francisco',
        'role': 'Business Analyst',
        'appearance': 'Man with short dark wavy curly hair, medium-tan skin, black rectangular glasses, goatee and mustache, friendly smile, lavender collared button-up shirt, angular features'
    },
    {
        'name': 'gabo',
        'role': 'Co-founder & CTO',
        'appearance': 'Man with short sandy-blond light brown hair swept to one side, fair light skin, blue eyes, trimmed reddish-brown beard, subtle smile, black crew-neck shirt, angular jawline'
    },
    {
        'name': 'geri',
        'role': 'Accounting Manager',
        'appearance': 'Woman with long straight blonde-highlighted hair parted to one side, light-medium skin, broad bright smile, slender face, dark top, delicate necklace and star-shaped earring'
    },
    {
        'name': 'herbert',
        'role': 'Co-founder & CEO',
        'appearance': 'Man with short dark brown wavy hair, light-medium skin, light stubble, lean face with smile lines, dark eyes, white t-shirt, slim athletic build'
    },
    {
        'name': 'jaime',
        'role': 'Tech Lead',
        'appearance': 'Man with medium-length brown hair, light-medium skin, full brown beard, wide toothy grin, dark RADAR branded t-shirt, arms crossed, stocky broad-shouldered build'
    },
    {
        'name': 'javier',
        'role': 'Frontend Developer',
        'appearance': 'Man with dark hair under a black cap, medium-brown skin tone, full dark beard, round wire-framed glasses, friendly slightly-smiling expression, black graphic t-shirt'
    },
    {
        'name': 'andy',
        'role': 'Marketing & Communications Lead',
        'appearance': 'Man with wavy brown hair swept to one side, light-medium skin, light stubble, warm smile showing teeth, light blue polo shirt, slim build, prominent nose'
    },
    {
        'name': 'karen',
        'role': 'Communications Analyst',
        'appearance': 'Woman with long blonde hair with side-swept bangs, fair skin, rosy cheeks, large dark eyes with eyeliner, soft smile, dark gray top with pendant necklace, youthful appearance'
    },
    {
        'name': 'kevin',
        'role': 'Full Stack Engineer',
        'appearance': 'Man with very short-cropped dark hair, medium-brown skin tone, full patchy dark beard, broad round face, stocky build, confident smirk, black hoodie over white shirt'
    },
    {
        'name': 'lorens',
        'role': 'Backend Engineer',
        'appearance': 'Man with curly tousled dark brown hair, medium skin tone, wide open-mouthed grin, lean athletic build, white tank top, tattoos on arms, small earring, energetic cheerful expression'
    },
    {
        'name': 'max',
        'role': 'People & Culture Manager',
        'appearance': 'Man with tousled dark brown hair, medium-tan skin, short facial stubble, serious direct expression, defined cheekbones, angular features, colorful floral-patterned hoodie in blues purples yellows greens'
    },
    {
        'name': 'nelson',
        'role': 'Backend Engineer',
        'appearance': 'Man with strawberry-blond reddish-blond hair swept to side, short reddish beard and mustache, fair light skin, blue eyes, broad smile, medium build, black crew-neck shirt'
    },
    {
        'name': 'yong',
        'role': 'Operations Manager',
        'appearance': 'Man with short dark brown wavy hair, light-to-medium olive skin, friendly broad smile, slight facial stubble, dark blazer over light collared shirt, medium build, Latino features'
    },
    {
        'name': 'radarin',
        'role': 'Chief Culture Officer',
        'appearance': None  # Special: dolphin mascot
    },
    {
        'name': 'andres',
        'role': 'DevOps Engineer',
        'appearance': 'Man with medium-length wavy sandy brown hair, full trimmed beard with reddish-brown tones, fair skin, blue eyes, rectangular-framed glasses, light blue patterned button-up shirt, thoughtful expression'
    },
    {
        'name': 'hector',
        'role': 'Sales Manager',
        'appearance': 'Man with short neatly styled dark brown hair swept up and to side, well-groomed dark beard and goatee, warm medium olive skin, brown eyes, wide cheerful smile, round silver-framed glasses, dark crew-neck shirt'
    },
]

RADARIN_PROMPT = "Pixel art chibi fighting game character, 256x256, thick black outlines, retro 16-bit arcade style, white background. A cute cartoon dolphin mascot fighter wearing tiny boxing gloves, wearing a blue Radar company t-shirt with 'RA' logo. Chibi proportions, fighter stance. No text."

def make_prompt(char):
    if char['name'] == 'radarin':
        return RADARIN_PROMPT
    return (
        f"Pixel art chibi fighting game character portrait, 256x256, thick black outlines, vibrant colors, "
        f"retro 16-bit arcade style, white background. Character: {char['name'].upper()}, {char['role']} at tech startup. "
        f"Physical appearance: {char['appearance']}. "
        f"Fighter stance, full body visible, exaggerated big head chibi proportions. No text, no UI elements."
    )

def generate_sprite(char):
    out_path = f"{ASSETS_DIR}/char_{char['name']}.png"
    if os.path.exists(out_path):
        size = os.path.getsize(out_path)
        if size > 10000:
            print(f"  SKIP {char['name']} (already exists, {size} bytes)")
            return True
    
    prompt = make_prompt(char)
    print(f"  Generating {char['name']}...")
    
    try:
        response = requests.post(
            'https://api.openai.com/v1/images/generations',
            headers={'Authorization': f'Bearer {api_key}', 'Content-Type': 'application/json'},
            json={
                'model': 'dall-e-3',
                'prompt': prompt,
                'n': 1,
                'size': '1024x1024',
                'quality': 'standard',
                'response_format': 'b64_json'
            },
            timeout=90
        )
        data = response.json()
        if 'data' not in data:
            print(f"  ERROR {char['name']}: {data}")
            return False
        img_data = base64.b64decode(data['data'][0]['b64_json'])
        with open(out_path, 'wb') as f:
            f.write(img_data)
        print(f"  OK {char['name']} ({len(img_data)} bytes)")
        return True
    except Exception as e:
        print(f"  FAIL {char['name']}: {e}")
        return False

if __name__ == '__main__':
    import sys
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    end = int(sys.argv[2]) if len(sys.argv) > 2 else len(CHARACTERS)
    
    print(f"Generating sprites {start} to {end-1}...")
    for i, char in enumerate(CHARACTERS[start:end]):
        print(f"[{start+i+1}/{len(CHARACTERS)}] {char['name']}")
        ok = generate_sprite(char)
        if not ok:
            print(f"  Retrying {char['name']} in 5s...")
            time.sleep(5)
            generate_sprite(char)
        time.sleep(1)  # Rate limit
    print("Done!")
