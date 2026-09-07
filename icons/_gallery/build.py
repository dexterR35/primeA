#!/usr/bin/env python3
"""Builds _gallery/data.js for the icon prompt library page."""
import json, os, hashlib
from PIL import Image

ROOT = '/home/dexter/Downloads/icons'
os.chdir(ROOT)

GOLD_TXT = 'gold⁄classic.txt'
REAL_TXT = 'realistic.txt'

# (file, title, kind, tags, note)
REALISTIC = [
    ('realistic icons.png', 'Classic Slot Core', 'sheet', ['classic slots', 'detail: standard'],
     'Baseline family: ruby 7, bell, cherries, diamond, watermelon, crown, sceptre.'),
    ('realistic simple.png', 'Simple Detail Mode', 'sheet', ['classic slots', 'detail: simple'],
     'Same subjects with ornament reduced 30-50%, materials and depth kept.'),
    ('realistic  ornate.png', 'Ornate Detail Mode', 'sheet', ['classic slots', 'detail: ornate'],
     'Engraving and hardware added without clutter; still no automatic gold.'),
    ('casino slots realistic.png', 'Full Symbol Set', 'sheet', ['classic slots', '4x5 grid'],
     'Twenty varied symbols on one contact sheet, consistent scale and lighting.'),
    ('hyperealistic.png', 'Hyper-Real Casino', 'sheet', ['casino games', 'VIP'],
     'Roulette, chips, whisky, cigar, treasure - maximum material realism.'),
    ('icons realistic.png', 'Mining / Bonanza', 'sheet', ['theme: mining', 'natural materials'],
     'Mine cart, nuggets, dynamite, lantern, gems - subject-native materials.'),
    ('realistic book BOD.png', 'Egypt / Book Theme', 'sheet', ['theme: Egypt', 'original artwork'],
     'Original ornate book, Anubis, scarab, ankh, pyramid, eye motif.'),
    ('realistic cards.png', 'Playing Card Faces', 'sheet', ['poker', 'intrinsic text'],
     'Ivory stock with correct markings - the allowed case for text on an icon.'),
    ('ChatGPT Image Sep 8, 2026, 01_22_44 AM.png', 'Emerald Cluster', 'single', ['natural materials', 'no gold'],
     'Pure gem render - the subject-native material rule with zero gold.'),
    ('realistic box.jpeg', 'Gift Box - Studio', 'single', ['luxury lifestyle', 'opaque bg'],
     'Close-up quality reference: fabric weave, ribbon sheen, tag hardware.'),
    ('realistics.jpeg', 'Gift Box - White Ground', 'single', ['luxury lifestyle', 'opaque bg'],
     'Same object on white - use for material and edge quality, not composition.'),
    ('classical realistic icons luxury casino.png', 'VIP / Private Reserve', 'sheet', ['VIP', 'shared reference'],
     'Decanter, black card, velvet rope, safe, jet, wax seal.'),
    ('classical realistic natural icons.png', 'VIP - Dark Preview', 'sheet', ['VIP', 'shared reference'],
     'Same sheet flattened on black - reads family contrast at a glance.'),
]

GOLD = [
    ('gold shine slots icons.png', 'Gold Shine - Slots', 'sheet', ['classic slots', '5x4 grid'],
     'The house benchmark: warm champagne gold, ruby glass, crisp bevels.'),
    ('gold soft shine slots icons.png', 'Soft Shine - Themed', 'sheet', ['classic slots', 'mixed themes'],
     'Softer highlight rolloff; slots core plus dragon, pharaoh, tiki, scarab.'),
    ('random gold shine slots icons.png', 'Mixed Theme Sheet', 'sheet', ['mixed themes', '5x4 grid'],
     'Crown, mine cart, book, buffalo, dragon - one family across themes.'),
    ('gold shine slots elements 2.png', 'Casino Game Elements', 'sheet', ['casino games', 'poker'],
     'Cards, dice, lottery cage, hourglass, trophy, service bell, chips.'),
    ('goldsih.png', 'VIP Lifestyle', 'sheet', ['VIP', 'luxury lifestyle'],
     'Tuxedo, crown, wallet, ring, watch, jet, decanter, velvet rope.'),
    ('goldish mafia.png', 'Mafia / Noir', 'sheet', ['theme: noir', 'custom subject'],
     'Custom theme proving categories are examples, not limits.'),
    ('gold animals.png', 'Golden Animals', 'sheet', ['animals', 'gold sculpture'],
     'A golden animal is a sculpted metal icon - not a real animal wearing gold.'),
    ('gold heard realistic.png', 'Ruby Spade - Hero', 'single', ['poker', 'ruby + gold'],
     'Close-up material benchmark: lacquer depth over thick warm-gold bevel.'),
    ('heart.png', 'Ruby Spade - Alt', 'single', ['poker', 'ruby + gold'],
     'Same hero on transparent - check edge cleanliness and highlight control.'),
    ('book of dead.png', 'Ornate Egyptian Book', 'single', ['theme: Egypt', 'ornate'],
     'Original book symbol - scarab, sun disk, gem cabochons, tooled leather.'),
    ('box2.png', 'Gift Box - Ruby & Gold', 'single', ['luxury lifestyle', 'enamel'],
     'Ruby lacquer body, gold satin ribbon, black tag with gold crown.'),
    ('wallet2.png', 'Leather Wallet', 'single', ['luxury lifestyle', 'leather'],
     'Navy leather with gold stitching - material separation reference.'),
    ('tokedo.png', 'Tuxedo / VIP', 'single', ['VIP', 'navy + ivory'],
     'Deep-navy lapel, ivory shirt, gold buttons, crown coin accent.'),
    ('stars.png', 'Gold Sparkle', 'single', ['accent', 'gold only'],
     'Pure metal study - how gold reads without any secondary material.'),
    ('ChatGPT Image Sep 7, 2026, 11_45_07 PM (2).png', 'Gold Sparkle - Alt', 'single', ['accent', 'gold only'],
     'Same sparkle on transparent ground.'),
    ('classical icons luxury casino.png', 'VIP / Private Reserve', 'sheet', ['VIP', 'shared reference'],
     'Decanter, black card, velvet rope, safe, jet, wax seal.'),
    ('classical icons luxury casino random.png', 'VIP - Dark Preview', 'sheet', ['VIP', 'shared reference'],
     'Same sheet flattened on black - reads family contrast at a glance.'),
]

# find duplicate filenames per content hash so cards can list aliases
hashes = {}
for f in os.listdir('.'):
    if f.lower().endswith(('.png', '.jpeg', '.jpg')):
        h = hashlib.md5(open(f, 'rb').read()).hexdigest()
        hashes.setdefault(h, []).append(f)


def enrich(entries):
    out = []
    for f, title, kind, tags, note in entries:
        im = Image.open(f)
        h = hashlib.md5(open(f, 'rb').read()).hexdigest()
        aliases = sorted(x for x in hashes[h] if x != f)
        thumb = '_gallery/thumbs/' + os.path.splitext(f)[0].replace(' ', '_').replace(',', '') + '.webp'
        out.append({
            'file': f, 'thumb': thumb, 'title': title, 'kind': kind,
            'tags': tags, 'note': note, 'w': im.size[0], 'h': im.size[1],
            'alpha': im.mode in ('RGBA', 'LA'), 'mb': round(os.path.getsize(f) / 1e6, 1),
            'aliases': aliases,
        })
    return out


data = {
    'gpts': [
        {
            'id': 'gold',
            'name': 'Gold / Classic',
            'tagline': 'Premium 3D icon generator',
            'blurb': 'Stylised luxury icons. Polished warm gold, ruby and enamel, crisp bevels, '
                     'strong silhouettes. Style comes from the reference sheets, not from realism.',
            'txt': GOLD_TXT,
            'accent': '#d4af37',
            'accent2': '#f6e6b4',
            'prompt': open(GOLD_TXT).read(),
            'images': enrich(GOLD),
        },
        {
            'id': 'realistic',
            'name': 'Hyper-Realistic',
            'tagline': 'Luxury casino & premium 3D icon generator',
            'blurb': 'Photoreal materials in an icon composition. Subject-native colours by default, '
                     'gold only when earned. Same isolation and silhouette rules.',
            'txt': REAL_TXT,
            'accent': '#c8a86b',
            'accent2': '#efe3cd',
            'prompt': open(REAL_TXT).read(),
            'images': enrich(REALISTIC),
        },
    ]
}

os.makedirs('_gallery', exist_ok=True)
with open('_gallery/data.js', 'w') as fh:
    fh.write('window.GALLERY = ')
    json.dump(data, fh, ensure_ascii=False, indent=1)
    fh.write(';\n')

print('wrote _gallery/data.js', os.path.getsize('_gallery/data.js'), 'bytes')
for g in data['gpts']:
    print(g['id'], len(g['images']), 'images,', len(g['prompt'].split()), 'words')
