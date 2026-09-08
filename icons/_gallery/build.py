#!/usr/bin/env python3
"""Builds thumbnails + _gallery/data.js for index.html.

Run after adding, renaming, moving or deleting images:

    python3 _gallery/build.py

THE FOLDER DECIDES THE SET.  Everything in images/gold/ is the Gold / Classic
set, everything in images/realistic/ is the Hyper-Realistic set.  Move a file
between those two folders and it moves between the two galleries - nothing in
this script needs editing for that.

The .txt system prompt for each set is picked up automatically: whichever .txt
file sits in that set's folder.

CURATED is only for the nice title / tags / note on a card, and is keyed by
filename.  A file with no entry still shows up - it just gets a title made from
its filename and a "new" tag, and is listed at the end of the build output.
"""
import json, os, hashlib, re
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

EXT = ('.png', '.jpeg', '.jpg', '.webp')

SETS = [
    {'id': 'gold', 'dir': 'images/gold',
     'name': 'Gold / Classic', 'tagline': 'Premium 3D icon generator',
     'accent': '#d4af37', 'accent2': '#f6e6b4',
     'blurb': 'Stylised luxury icons. Polished warm gold, ruby and enamel, crisp bevels, strong '
              'silhouettes. Style comes from the reference sheets, not from realism.'},
    {'id': 'realistic', 'dir': 'images/realistic',
     'name': 'Hyper-Realistic', 'tagline': 'Luxury casino & premium 3D icon generator',
     'accent': '#c8a86b', 'accent2': '#efe3cd',
     'blurb': 'Photoreal materials in an icon composition. Subject-native colours by default, gold '
              'only when earned. Same isolation and silhouette rules.'},
]

# filename -> (title, kind, tags, note)      kind is 'sheet' or 'single'
CURATED = {
    # ---------- images/gold ----------
    'gold shine slots icons.png': ('Gold Shine - Slots', 'sheet', ['classic slots', '5x4 grid'],
        'The house benchmark: warm champagne gold, ruby glass, crisp bevels.'),
    'gold soft shine slots icons.png': ('Soft Shine - Themed', 'sheet', ['classic slots', 'mixed themes'],
        'Softer highlight rolloff; slots core plus dragon, pharaoh, tiki, scarab.'),
    'random gold shine slots icons.png': ('Mixed Theme Sheet', 'sheet', ['mixed themes', '5x4 grid'],
        'Crown, mine cart, book, buffalo, dragon - one family across themes.'),
    'gold shine slots elements 2.png': ('Casino Game Elements', 'sheet', ['casino games', 'poker'],
        'Cards, dice, lottery cage, hourglass, trophy, service bell, chips.'),
    'gold icons.png': ('Classic Slot Core', 'sheet', ['classic slots', 'detail: standard'],
        'Baseline family: ruby 7, bell, cherries, diamond, watermelon, crown, sceptre.'),
    'gold simple.png': ('Simple Detail Mode', 'sheet', ['classic slots', 'detail: simple'],
        'Ornament reduced 30-50%, materials, depth and silhouette kept.'),
    'golden  ornate.png': ('Ornate Detail Mode', 'sheet', ['classic slots', 'detail: ornate'],
        'Engraving and hardware added without clutter, silhouette kept clean.'),
    'casino slots gold.png': ('Full Symbol Set', 'sheet', ['classic slots', '4x5 grid'],
        'Twenty varied symbols on one contact sheet, consistent scale and lighting.'),
    'icons gold.png': ('Mining / Bonanza', 'sheet', ['theme: mining', 'treasure'],
        'Mine cart, nuggets, dynamite, lantern, gems, compass, powder barrel.'),
    'gold book BOD.png': ('Egypt / Book Theme', 'sheet', ['theme: Egypt', 'original artwork'],
        'Original ornate book, Anubis, scarab, ankh, pyramid, eye motif.'),
    'goldsih.png': ('VIP Lifestyle', 'sheet', ['VIP', 'luxury lifestyle'],
        'Tuxedo, crown, wallet, ring, watch, jet, decanter, velvet rope.'),
    'goldish mafia.png': ('Mafia / Noir', 'sheet', ['theme: noir', 'custom subject'],
        'Custom theme with gold hardware - categories are examples, not limits.'),
    'gold animals.png': ('Golden Animals', 'sheet', ['animals', 'gold sculpture'],
        'A golden animal is a sculpted metal icon - not a real animal wearing gold.'),
    'gold heard .png': ('Ruby Spade - Hero', 'single', ['poker', 'ruby + gold'],
        'Close-up material benchmark: lacquer depth over thick warm-gold bevel.'),
    'heart gold.png': ('Ruby Spade - Alt', 'single', ['poker', 'ruby + gold'],
        'Same hero on transparent - check edge cleanliness and highlight control.'),
    'book of dead gold.png': ('Ornate Egyptian Book', 'single', ['theme: Egypt', 'ornate'],
        'Original book symbol - scarab, sun disk, gem cabochons, tooled leather.'),
    'emerald.png': ('Emerald Cluster', 'single', ['gemstone', 'no gold'],
        'Faceted gem study - crystal facets, internal refraction, no metal at all.'),
    'box2.png': ('Gift Box - Ruby & Gold', 'single', ['luxury lifestyle', 'enamel'],
        'Ruby lacquer body, gold satin ribbon, black tag with gold crown.'),
    'wallet2.png': ('Leather Wallet', 'single', ['luxury lifestyle', 'leather'],
        'Navy leather with gold stitching - material separation reference.'),
    'tokedo.png': ('Tuxedo / VIP', 'single', ['VIP', 'navy + ivory'],
        'Deep-navy lapel, ivory shirt, gold buttons, crown coin accent.'),
    'stars gold.png': ('Gold Sparkle', 'single', ['accent', 'gold only'],
        'Pure metal study - how gold reads without any secondary material.'),

    # ---------- images/realistic ----------
    'realistic random icons.png': ('Mixed Casino Sheet', 'sheet', ['mixed themes', '6x4 grid'],
        'Widest family test: slots, poker, VIP and noir subjects in one pass.'),
    'realistic icons slots.png': ('Casino Games - No Gold', 'sheet', ['casino games', 'no gold'],
        'Steel, chrome, clay and lacquer instead of gold - the material rule working.'),
    'hyperealistic.png': ('Hyper-Real Casino', 'sheet', ['casino games', 'VIP'],
        'Roulette, chips, whisky, cigar, treasure - maximum material realism.'),
    'mafia realistic no gold.png': ('Mafia / Noir - No Gold', 'sheet', ['theme: noir', 'no gold'],
        'Blued steel, oxblood leather, wool felt - gunmetal where gold would sit.'),
    'mafia realistic family.png': ('Mafia / Noir - Family', 'sheet', ['theme: noir', 'characters'],
        'Character busts alongside objects, one consistent light and camera.'),
    'realistic cards.png': ('Playing Card Faces', 'sheet', ['poker', 'intrinsic text'],
        'Ivory stock with correct markings - the allowed case for text on an icon.'),
    'classical realistic icons luxury casino.png': ('VIP / Private Reserve', 'sheet', ['VIP', 'luxury lifestyle'],
        'Decanter, black card, velvet rope, safe, jet, wax seal.'),
    'realistic classical.png': ('VIP / Private Reserve - Alt', 'sheet', ['VIP', 'luxury lifestyle'],
        'Same VIP sheet, second copy of the reference.'),
    'realistic classical icons  random.png': ('VIP - Dark Preview', 'sheet', ['VIP', 'dark ground'],
        'Same sheet flattened on black - reads family contrast at a glance.'),
    'realistic box.jpeg': ('Gift Box - Studio', 'single', ['luxury lifestyle', 'opaque bg'],
        'Close-up quality reference: fabric weave, ribbon sheen, tag hardware.'),
    'realistics.jpeg': ('Gift Box - White Ground', 'single', ['luxury lifestyle', 'opaque bg'],
        'Same object on white - use for material and edge quality, not composition.'),
}

ORDER = {f: i for i, f in enumerate(CURATED)}       # card order follows CURATED


def title_from(name):
    t = re.sub(r'\.[^.]+$', '', name)
    if t.startswith('ChatGPT Image'):
        return 'Untitled render'
    t = re.sub(r'[_\-]+', ' ', t)
    t = re.sub(r'\s+', ' ', t).strip()
    return t[:1].upper() + t[1:] if t else name


def thumb_for(set_id, name):
    stem = re.sub(r'\.[^.]+$', '', name)
    stem = re.sub(r'[^A-Za-z0-9()._-]+', '_', stem)
    return f'_gallery/thumbs/{set_id}/{stem}.webp'


gpts, auto, keep = [], [], set()

for s in SETS:
    d = s['dir']
    if not os.path.isdir(d):
        raise SystemExit(f'missing folder: {d}')

    txts = sorted(f for f in os.listdir(d) if f.lower().endswith('.txt'))
    if not txts:
        raise SystemExit(f'no .txt system prompt found in {d}')
    txt = os.path.join(d, txts[0])

    names = sorted(f for f in os.listdir(d) if f.lower().endswith(EXT) and not f.startswith('.'))
    hashes = {}
    for f in names:
        hashes.setdefault(hashlib.md5(open(os.path.join(d, f), 'rb').read()).hexdigest(), []).append(f)

    os.makedirs(f'_gallery/thumbs/{s["id"]}', exist_ok=True)
    images = []
    for f in names:
        src = os.path.join(d, f)
        im = Image.open(src)
        w, h = im.size
        tp = thumb_for(s['id'], f)
        keep.add(tp)
        if not os.path.exists(tp) or os.path.getmtime(tp) < os.path.getmtime(src):
            t = im.convert('RGBA')
            t.thumbnail((900, 900), Image.LANCZOS)
            t.save(tp, 'WEBP', quality=82, method=5)
            print('thumb:', src)

        if f in CURATED:
            title, kind, tags, note = CURATED[f]
        else:
            kind = 'sheet' if (min(w, h) > 900 and max(w, h) / min(w, h) < 1.9) else 'single'
            title, tags, note = title_from(f), ['new'], ''
            auto.append(f'{s["id"]}/{f}')

        digest = hashlib.md5(open(src, 'rb').read()).hexdigest()
        images.append({
            'file': src, 'thumb': tp, 'title': title, 'kind': kind, 'tags': tags, 'note': note,
            'w': w, 'h': h, 'alpha': im.mode in ('RGBA', 'LA'),
            'mb': round(os.path.getsize(src) / 1e6, 1),
            'aliases': sorted(x for x in hashes[digest] if x != f),
            'ord': ORDER.get(f, 10_000),
        })

    images.sort(key=lambda i: (i['ord'], i['title']))
    gpts.append({**{k: s[k] for k in ('id', 'name', 'tagline', 'blurb', 'accent', 'accent2')},
                 'txt': txt, 'prompt': open(txt).read(), 'images': images})

# drop thumbnails whose source image is gone
for root, _, fs in os.walk('_gallery/thumbs'):
    for f in fs:
        p = os.path.join(root, f)
        if p not in keep:
            os.remove(p)
            print('removed stale thumb:', p)

with open('_gallery/data.js', 'w') as fh:
    fh.write('window.GALLERY = ')
    json.dump({'gpts': gpts}, fh, ensure_ascii=False, indent=1)
    fh.write(';\n')

print()
for g in gpts:
    print(f"{g['id']:10s} {len(g['images']):3d} images   prompt: {g['txt']}")
if auto:
    print('\nno CURATED entry yet (add one for a title, tags and note):')
    for a in auto:
        print('  ' + a)
