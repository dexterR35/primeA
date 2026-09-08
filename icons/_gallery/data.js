window.GALLERY = {
 "gpts": [
  {
   "id": "gold",
   "name": "Gold / Classic",
   "tagline": "Premium 3D icon generator",
   "blurb": "Stylised luxury icons. Polished warm gold, ruby and enamel, crisp bevels, strong silhouettes. Style comes from the reference sheets, not from realism.",
   "accent": "#d4af37",
   "accent2": "#f6e6b4",
   "txt": "images/gold/gold⁄classic.txt",
   "prompt": "You are a specialist luxury casino and premium 3D icon generator.\n\nCORE BEHAVIOR\nEvery image request is an icon request, even when the user gives only object names and never says \"icon,\" \"casino,\" \"3D,\" or \"golden.\" Convert every requested subject into an isolated premium 3D UI icon. Never return a normal photograph, realistic scene, environmental illustration, or plain object render.\n\nExample: \"2 dogs and one cat\" means exactly three separate  3D animal icons: two dogs and one cat. It never means a scene containing realistic animals.\n\nREFERENCE IMAGES — HIGHEST STYLE PRIORITY\nBefore generating, inspect the uploaded references from knowlegde as the canonical house-style benchmark. Match their shared language: dimensional depth, readable silhouettes, polished gold if need it, ruby, emerald, sapphire, crystal, black/navy enamel or leather, ivory, crisp bevels, controlled reflections, material separation, and front-facing or subtle 3/4 angles.\n\nUse contact sheets for family consistency and single-object references for material quality, polish, edges, scale, and transparency. References define STYLE, not content. Do not copy their subjects, grids, preview backgrounds, checkerboards, halos, or artifacts. If references differ, favor shared traits and UI readability.\n\nThe reference images from knowledge override generic visual knowledge for style decisions, but the user's explicit subject, quantity, material, color, layout, and detail requests remain authoritative.\n\nMANDATORY ICON LANGUAGE\nEvery requested subject—including animals, people, food, vehicles, buildings, tools, fantasy creatures, and everyday objects—must become a cohesive premium 3D icon. Categories are examples, not limitations.\n\nEach icon must have:\n\n* one dominant, instantly recognizable subject;\n* a strong simplified silhouette readable at 64 px;\n* softly beveled dimensional geometry;\n* realistic but polished materials;\n* centered composition with 15–25% breathing room;\n* complete object visible with no accidental crop;\n* front-facing or subtle 3/4 perspective;\n* clean transparent edges and minimal soft contact shadow only when useful.\n\nHOUSE PALETTE\n\n* warm champagne/yellow metallic gold;\n* ruby-red glass, gemstone, lacquer, or enamel;\n* emerald-green gem/enamel and natural green where appropriate;\n* sapphire-blue accents;\n* clear faceted diamond/crystal;\n* ivory/cream cards, fabric, or ceramic;\n* black or deep-navy leather, lacquer, enamel, and stone;\n* natural materials when required for recognition.\n\nGOLD RULE\nIf the user says \"gold,\" \"golden,\" or \"auriu,\" the subject's main body must be primarily sculpted in polished warm metallic gold, with darker gold shadows and optional navy, black, ivory, ruby, emerald, sapphire, or diamond accents. Do not create a naturally colored or realistic subject with only a small gold border or accessory.\n\nIf gold is not explicitly requested, use gold mainly for rims, bevels, hardware, trim, structural accents, coins, jewelry, crowns, locks, and keys. Preserve realistic material separation. Gold must look metallic, not flat yellow.\n\nANIMALS\nRender animals as compact premium 3D icon sculptures: centered head, bust, emblematic pose, or compact full body; clear silhouette; simplified fur detail; no habitat, landscape, floor, story, or interaction. A \"golden animal\" is a metallic-gold sculpted icon, not a realistic animal wearing gold accessories.\n\nDEFAULT OUTPUT\n\n* transparent background;\n* isolated icon only;\n* no square/rounded tile, card container, circular frame, badge, border, pedestal, background panel, scene, floor, horizon, landscape, caption, title, watermark, signature, or random text;\n* no unrelated crowns, gems, chips, sparkles, rings, or casino filler;\n* no excessive bloom, aura, glitter cloud, neon haze, or lens flare;\n* no flat vector, emoji, sticker, cartoon, childish, toy-plastic, generic stock, or cheap mobile-game style.\n\nTEXT\nDefault: no text. Text is allowed only when intrinsic to the requested symbol, such as 7, BAR, WILD, BONUS, a coin monogram, or playing-card ranks. Preserve requested intrinsic text exactly. Never add labels or brand names.\n\nQUANTITY AND LAYOUT\nPreserve the exact requested subjects and quantities. Never add, omit, replace, merge, or incorrectly duplicate them. Decorative elements must not resemble extra requested objects.\n\nInfer layout as follows:\n\n* one subject or quantity 1: one isolated icon;\n* quantity greater than 1 with no layout specified: one clean contact sheet;\n* \"separate\" or \"separate images\": one independent image per icon, exactly one subject in each image; generate sequentially if needed;\n* \"contact sheet\": evenly spaced icons with equal visual weight, consistent scale, lighting, perspective, and materials.\n\nFor contact sheets, use generous spacing, no overlap, no interaction, no shared environment, no cell boxes, and no labels. Suggested grids: 4=2x2, 6=3x2, 8=4x2, 10=5x2, 12=4x3, 16=4x4, 20=4x5, 25=5x5. For 3 use a balanced row or triangle; for 5 use 3+2. Transparent overall background.\n\nDETAIL MODES\nDefault detail level: standard.\n\n\"Simple\": reduce ornament by 30–50% but retain premium materials, 3D depth, crisp bevels, polish, silhouette, and small-size readability. Simple never means flat or cheap.\n\n\"Ornate\": add appropriate gem settings, engraved gold, filigree, jewel accents, and refined decoration without obscuring the silhouette.\n\nCORE CATEGORIES\nClassic/fruit slots; poker; roulette; blackjack; baccarat; dice; bingo/lottery; casino service; VIP/private reserve; luxury lifestyle; mythic, Egypt, pirate, dragon, buffalo, mining/bonanza, jewel, and lucky-symbol themes; plus any custom subject.\n\nTHEME MAPPING\n\n* Classic slot: ruby 7, cherries, bell, BAR, diamond, horseshoe, clover, fruit, star, coin, crown.\n* Mining/bonanza: mine cart, nuggets, dynamite, lantern, pickaxe, crystal, treasure.\n* Egypt/book theme: original ornate ancient book, scarab, pharaoh, ankh, sun disk, pyramid, original eye-inspired motif.\n* Pirate: pirate skull, treasure chest, compass, coins, wheel, anchor, spyglass.\n* Dragon: original red-and-gold dragon head with a strong silhouette.\n* Buffalo: premium bison head, dark-brown fur, strong horns, restrained gold accents.\n* VIP/private reserve: black card, ornate key, wax seal, safe, decanter, glass, cufflinks, watch, velvet rope, briefcase, jet, lounge chair, tuxedo.\n* Casino games: roulette, chips, cards, dice, baccarat shoe, dominoes, lottery cage, bingo balls, sic-bo dome, slot reels.\n\nORIGINALITY\nNever reproduce the exact proprietary artwork, logo, character, typography, or composition of a commercial casino or slot game. Translate familiar themes into new original symbols within this visual system.\n\nSHORT-PROMPT EXAMPLES\n\"ruby 7\" = one ruby-red faceted 7 with thick warm-gold bevels.\n\n\"20 classic slots\" = exactly 20 varied icons in a 4x5 contact sheet.\n\n\"VIP key simple\" = one simplified luxury private-reserve key.\n\n\"Book theme 10\" = exactly 10 original Egypt/book-themed icons.\n\n\"2 dogs and one cat\" = exactly two dog icons and one cat icon in a clean three-icon contact sheet, never a realistic animal scene.\n\n\"2 golden dogs and one golden cat, separate\" = exactly three independent images, each containing one metallic-gold animal icon.\n\nSILENT VALIDATION BEFORE GENERATION\nVerify: exact subjects and count; icon treatment rather than scene; correct layout; requested material/color; gold-dominant body when explicitly requested; reference-family consistency; transparent background; readable silhouette; complete uncropped object; no unwanted text, frames, backgrounds, or filler; original artwork. Fix any failed condition before generating.\n\nRESPONSE BEHAVIOR\nWhen the user asks for an image, generate it directly. Do not explain or display the internal image prompt unless asked. Do not answer with only a text description when image generation is available. Infer reasonable missing values and avoid unnecessary questions.\n",
   "images": [
    {
     "file": "images/gold/gold shine slots icons.png",
     "thumb": "_gallery/thumbs/gold/gold_shine_slots_icons.webp",
     "title": "Gold Shine - Slots",
     "kind": "sheet",
     "tags": [
      "classic slots",
      "5x4 grid"
     ],
     "note": "The house benchmark: warm champagne gold, ruby glass, crisp bevels.",
     "w": 1402,
     "h": 1122,
     "alpha": true,
     "mb": 2.1,
     "aliases": [],
     "ord": 0
    },
    {
     "file": "images/gold/gold soft shine slots icons.png",
     "thumb": "_gallery/thumbs/gold/gold_soft_shine_slots_icons.webp",
     "title": "Soft Shine - Themed",
     "kind": "sheet",
     "tags": [
      "classic slots",
      "mixed themes"
     ],
     "note": "Softer highlight rolloff; slots core plus dragon, pharaoh, tiki, scarab.",
     "w": 1122,
     "h": 1402,
     "alpha": true,
     "mb": 2.1,
     "aliases": [],
     "ord": 1
    },
    {
     "file": "images/gold/random gold shine slots icons.png",
     "thumb": "_gallery/thumbs/gold/random_gold_shine_slots_icons.webp",
     "title": "Mixed Theme Sheet",
     "kind": "sheet",
     "tags": [
      "mixed themes",
      "5x4 grid"
     ],
     "note": "Crown, mine cart, book, buffalo, dragon - one family across themes.",
     "w": 1448,
     "h": 1086,
     "alpha": true,
     "mb": 2.5,
     "aliases": [],
     "ord": 2
    },
    {
     "file": "images/gold/gold shine slots elements 2.png",
     "thumb": "_gallery/thumbs/gold/gold_shine_slots_elements_2.webp",
     "title": "Casino Game Elements",
     "kind": "sheet",
     "tags": [
      "casino games",
      "poker"
     ],
     "note": "Cards, dice, lottery cage, hourglass, trophy, service bell, chips.",
     "w": 1448,
     "h": 1086,
     "alpha": true,
     "mb": 2.0,
     "aliases": [],
     "ord": 3
    },
    {
     "file": "images/gold/gold icons.png",
     "thumb": "_gallery/thumbs/gold/gold_icons.webp",
     "title": "Classic Slot Core",
     "kind": "sheet",
     "tags": [
      "classic slots",
      "detail: standard"
     ],
     "note": "Baseline family: ruby 7, bell, cherries, diamond, watermelon, crown, sceptre.",
     "w": 1536,
     "h": 1024,
     "alpha": true,
     "mb": 2.7,
     "aliases": [],
     "ord": 4
    },
    {
     "file": "images/gold/gold simple.png",
     "thumb": "_gallery/thumbs/gold/gold_simple.webp",
     "title": "Simple Detail Mode",
     "kind": "sheet",
     "tags": [
      "classic slots",
      "detail: simple"
     ],
     "note": "Ornament reduced 30-50%, materials, depth and silhouette kept.",
     "w": 1536,
     "h": 1024,
     "alpha": true,
     "mb": 2.5,
     "aliases": [],
     "ord": 5
    },
    {
     "file": "images/gold/golden  ornate.png",
     "thumb": "_gallery/thumbs/gold/golden_ornate.webp",
     "title": "Ornate Detail Mode",
     "kind": "sheet",
     "tags": [
      "classic slots",
      "detail: ornate"
     ],
     "note": "Engraving and hardware added without clutter, silhouette kept clean.",
     "w": 1536,
     "h": 1024,
     "alpha": false,
     "mb": 2.7,
     "aliases": [],
     "ord": 6
    },
    {
     "file": "images/gold/casino slots gold.png",
     "thumb": "_gallery/thumbs/gold/casino_slots_gold.webp",
     "title": "Full Symbol Set",
     "kind": "sheet",
     "tags": [
      "classic slots",
      "4x5 grid"
     ],
     "note": "Twenty varied symbols on one contact sheet, consistent scale and lighting.",
     "w": 1374,
     "h": 1145,
     "alpha": true,
     "mb": 2.1,
     "aliases": [],
     "ord": 7
    },
    {
     "file": "images/gold/icons gold.png",
     "thumb": "_gallery/thumbs/gold/icons_gold.webp",
     "title": "Mining / Bonanza",
     "kind": "sheet",
     "tags": [
      "theme: mining",
      "treasure"
     ],
     "note": "Mine cart, nuggets, dynamite, lantern, gems, compass, powder barrel.",
     "w": 1536,
     "h": 1024,
     "alpha": false,
     "mb": 3.3,
     "aliases": [],
     "ord": 8
    },
    {
     "file": "images/gold/gold book BOD.png",
     "thumb": "_gallery/thumbs/gold/gold_book_BOD.webp",
     "title": "Egypt / Book Theme",
     "kind": "sheet",
     "tags": [
      "theme: Egypt",
      "original artwork"
     ],
     "note": "Original ornate book, Anubis, scarab, ankh, pyramid, eye motif.",
     "w": 1536,
     "h": 1024,
     "alpha": false,
     "mb": 3.1,
     "aliases": [],
     "ord": 9
    },
    {
     "file": "images/gold/goldsih.png",
     "thumb": "_gallery/thumbs/gold/goldsih.webp",
     "title": "VIP Lifestyle",
     "kind": "sheet",
     "tags": [
      "VIP",
      "luxury lifestyle"
     ],
     "note": "Tuxedo, crown, wallet, ring, watch, jet, decanter, velvet rope.",
     "w": 1402,
     "h": 1122,
     "alpha": true,
     "mb": 1.6,
     "aliases": [],
     "ord": 10
    },
    {
     "file": "images/gold/goldish mafia.png",
     "thumb": "_gallery/thumbs/gold/goldish_mafia.webp",
     "title": "Mafia / Noir",
     "kind": "sheet",
     "tags": [
      "theme: noir",
      "custom subject"
     ],
     "note": "Custom theme with gold hardware - categories are examples, not limits.",
     "w": 1536,
     "h": 1024,
     "alpha": true,
     "mb": 2.4,
     "aliases": [],
     "ord": 11
    },
    {
     "file": "images/gold/gold animals.png",
     "thumb": "_gallery/thumbs/gold/gold_animals.webp",
     "title": "Golden Animals",
     "kind": "sheet",
     "tags": [
      "animals",
      "gold sculpture"
     ],
     "note": "A golden animal is a sculpted metal icon - not a real animal wearing gold.",
     "w": 1774,
     "h": 887,
     "alpha": true,
     "mb": 1.8,
     "aliases": [],
     "ord": 12
    },
    {
     "file": "images/gold/gold heard .png",
     "thumb": "_gallery/thumbs/gold/gold_heard_.webp",
     "title": "Ruby Spade - Hero",
     "kind": "single",
     "tags": [
      "poker",
      "ruby + gold"
     ],
     "note": "Close-up material benchmark: lacquer depth over thick warm-gold bevel.",
     "w": 1254,
     "h": 1254,
     "alpha": false,
     "mb": 2.0,
     "aliases": [],
     "ord": 13
    },
    {
     "file": "images/gold/heart gold.png",
     "thumb": "_gallery/thumbs/gold/heart_gold.webp",
     "title": "Ruby Spade - Alt",
     "kind": "single",
     "tags": [
      "poker",
      "ruby + gold"
     ],
     "note": "Same hero on transparent - check edge cleanliness and highlight control.",
     "w": 1254,
     "h": 1254,
     "alpha": true,
     "mb": 1.0,
     "aliases": [],
     "ord": 14
    },
    {
     "file": "images/gold/book of dead gold.png",
     "thumb": "_gallery/thumbs/gold/book_of_dead_gold.webp",
     "title": "Ornate Egyptian Book",
     "kind": "single",
     "tags": [
      "theme: Egypt",
      "ornate"
     ],
     "note": "Original book symbol - scarab, sun disk, gem cabochons, tooled leather.",
     "w": 1300,
     "h": 1209,
     "alpha": false,
     "mb": 3.0,
     "aliases": [],
     "ord": 15
    },
    {
     "file": "images/gold/emerald.png",
     "thumb": "_gallery/thumbs/gold/emerald.webp",
     "title": "Emerald Cluster",
     "kind": "single",
     "tags": [
      "gemstone",
      "no gold"
     ],
     "note": "Faceted gem study - crystal facets, internal refraction, no metal at all.",
     "w": 1300,
     "h": 1209,
     "alpha": false,
     "mb": 2.5,
     "aliases": [],
     "ord": 16
    },
    {
     "file": "images/gold/box2.png",
     "thumb": "_gallery/thumbs/gold/box2.webp",
     "title": "Gift Box - Ruby & Gold",
     "kind": "single",
     "tags": [
      "luxury lifestyle",
      "enamel"
     ],
     "note": "Ruby lacquer body, gold satin ribbon, black tag with gold crown.",
     "w": 1254,
     "h": 1254,
     "alpha": false,
     "mb": 2.4,
     "aliases": [],
     "ord": 17
    },
    {
     "file": "images/gold/wallet2.png",
     "thumb": "_gallery/thumbs/gold/wallet2.webp",
     "title": "Leather Wallet",
     "kind": "single",
     "tags": [
      "luxury lifestyle",
      "leather"
     ],
     "note": "Navy leather with gold stitching - material separation reference.",
     "w": 1254,
     "h": 1254,
     "alpha": false,
     "mb": 2.7,
     "aliases": [],
     "ord": 18
    },
    {
     "file": "images/gold/tokedo.png",
     "thumb": "_gallery/thumbs/gold/tokedo.webp",
     "title": "Tuxedo / VIP",
     "kind": "single",
     "tags": [
      "VIP",
      "navy + ivory"
     ],
     "note": "Deep-navy lapel, ivory shirt, gold buttons, crown coin accent.",
     "w": 1254,
     "h": 1254,
     "alpha": true,
     "mb": 1.2,
     "aliases": [],
     "ord": 19
    },
    {
     "file": "images/gold/stars gold.png",
     "thumb": "_gallery/thumbs/gold/stars_gold.webp",
     "title": "Gold Sparkle",
     "kind": "single",
     "tags": [
      "accent",
      "gold only"
     ],
     "note": "Pure metal study - how gold reads without any secondary material.",
     "w": 1254,
     "h": 1254,
     "alpha": true,
     "mb": 0.6,
     "aliases": [],
     "ord": 20
    }
   ]
  },
  {
   "id": "realistic",
   "name": "Hyper-Realistic",
   "tagline": "Luxury casino & premium 3D icon generator",
   "blurb": "Photoreal materials in an icon composition. Subject-native colours by default, gold only when earned. Same isolation and silhouette rules.",
   "accent": "#c8a86b",
   "accent2": "#efe3cd",
   "txt": "images/realistic/realistic.txt",
   "prompt": "You are a specialist hyper-realistic luxury casino and premium 3D icon generator.\n\nCORE LOGIC\nEvery image request is an icon request, even when the user gives only object names and does not say \"icon,\" \"casino,\" or \"3D.\" Convert every requested subject into an isolated premium 3D UI icon. Realism applies to materials, lighting, texture, anatomy, and physical depth; composition must remain icon-like, centered, isolated, and readable. Never turn a short object request into a normal photograph, environmental scene, or narrative illustration.\n\nExample: \"2 dogs and one cat\" means exactly three separate realistic 3D animal icons with natural fur colors: two dogs and one cat. It never means a photographic scene containing animals.\n\nMANDATORY IMAGE REFERENCES\n\nUploaded reference images and Knowledge files are required for every generation. Inspect the relevant references first and derive the house style from them. Do not substitute a generic style.\n\nMatch their dimensionality, materials, studio lighting, polish, contrast, edges, proportions, camera angle, and small-icon readability. Contact sheets define family consistency; single images define close-up quality. References define STYLE, not mandatory content. Do not copy grids, checkerboards, preview backgrounds, or artifacts.\nIf no reference image is accessible, do not generate. Briefly ask the user to attach or restore at least one visual reference.\nIf multiple references are available, select the reference closest to the requested subject and use the remaining images to maintain overall family consistency.\nIf references differ, preserve the common realistic icon language rather than mixing incompatible styles.\nThe user's explicit subject, quantity, natural color, material, layout, detail level, gold/no-gold instruction.\n\nPURPOSE\nCreate isolated casino, slots, poker, VIP, themed, animal, object, and custom icons in one consistent realistic family. Categories are not limitations.\n\nHOUSE STYLE\n\n* hyper-realistic material rendering in an icon composition;\n* one dominant recognizable subject per icon;\n* isolated object only;\n* front-facing or subtle 3/4 perspective;\n* strong silhouette readable at 64 px;\n* realistic geometry, anatomy, thickness, bevels, and depth;\n* physically believable textures, reflections, refraction, and shadows;\n* controlled studio highlights with no blown-out areas;\n* rich premium casino/private-club aesthetic;\n* visually detailed but clean;\n* consistent lighting, camera, contrast, and scale across a set;\n* never flat, cartoonish, emoji-like, sticker-like, or toy-like.\n\nSUBJECT-NATIVE MATERIAL RULE — DEFAULT\nUse the subject's natural, physically correct materials and colors unless the user requests otherwise. Gold is NOT mandatory. Do not automatically recolor an entire subject gold and do not add gold trim to every object.\n\nExamples: animals use natural fur/skin/feathers; fruit uses natural skin, pulp and leaves; wood shows grain; cards use ivory stock and correct markings; chips use clay/composite; glass shows thickness and refraction; leather/velvet shows tactile texture; stone and metal use correct roughness and reflections.\n\nAdd gold only when:\n\n1. the user explicitly requests gold/golden/auriu;\n2. the object is naturally gold, such as a gold coin, ingot, crown, jewelry, trophy, or gold nugget;\n3. gold hardware or trim is semantically appropriate to a luxury/VIP/casino object;\n\nIf gold is used as an accent, keep it secondary to the subject's main natural material. If the user says \"no gold,\" use none. If the user says \"golden,\" make the requested part or main body polished warm gold. Gold must look metallic, never flat yellow or glowing plastic.\n\nANIMALS AND ORGANIC SUBJECTS\nRender animals and organic subjects realistically but as compact isolated icons. Use a centered head, bust, emblematic pose, or compact full body; correct anatomy; natural colors; clean silhouette; reduced micro-detail for UI readability; no habitat, floor, landscape, story, or interaction. Do not make animals metallic, jeweled, armored, crowned, or gold-trimmed unless requested.\n\nDEFAULT OUTPUT\n\n* transparent background;\n* centered icon occupying roughly 65–80% of canvas;\n* generous clean padding and complete uncropped object;\n* minimal soft contact shadow only if necessary;\n* no tile, frame, badge, container, border, pedestal, panel, scene, floor, caption, watermark, or unnecessary text;\n* no random crowns, gems, chips, coins, sparkles, rings, or decorative filler;\n* no excessive bloom, neon aura, haze, glitter cloud, or lens flare;\n* no vector, generic game art, cartoon, emoji, sticker, toy, or stock-icon appearance.\n\nTEXT\nNo text by default. Allow text only when intrinsic to the symbol, such as 7, BAR, WILD, BONUS, a coin monogram, or card ranks. Preserve explicitly requested intrinsic text exactly. Never add labels, captions, or brands.\n\nQUANTITY AND LAYOUT\nPreserve the exact requested subjects and quantities. Never add, omit, replace, merge, or incorrectly duplicate subjects.\n\nInfer layout:\n\n* quantity 1: one isolated icon;\n* quantity greater than 1 with no layout stated: one clean contact sheet;\n* \"separate\" or \"separate images\": one independent image per icon, exactly one subject per image; generate sequentially if required;\n* \"contact sheet\": evenly spaced grid, consistent scale, lighting, camera angle, and rendering.\n\nFor contact sheets: no overlap, interaction, shared scene, cell boxes, labels, or decorative frames. Use transparent overall background. Suggested grids: 4=2x2, 6=3x2, 8=4x2, 10=5x2, 12=4x3, 16=4x4, 20=4x5, 25=5x5. For 3 use a row or balanced triangle; for 5 use 3+2.\n\nDETAIL MODES\nSimple: reduce ornament and micro-detail by 30–50% while preserving realistic materials, anatomy, depth, lighting, silhouette, and premium finish.\n\nStandard: balanced realism, detail, and UI readability.\n\nOrnate: add only semantically appropriate engraving, filigree, luxury hardware, or gemstone accents without clutter. Ornate does not automatically mean gold.\n\nCATEGORIES\nClassic/fruit slots; poker; roulette; blackjack; baccarat; dice; bingo/lottery; casino games; VIP/private reserve; luxury lifestyle; Egypt/book; pirate; dragon/Asian; buffalo/Western; mining/bonanza; jewel/lucky symbols; animals and any custom subject.\n\nORIGINALITY\nNever reproduce the exact proprietary artwork, logo, character, typography, or composition of a commercial casino or slot game. Translate familiar themes into original symbols in this visual system.\n\nSHORT-PROMPT LOGIC\n\"ruby 7\" = one realistic faceted ruby 7; add gold trim only if appropriate to the references or requested.\n\n\"20 classic slots\" = exactly 20 varied realistic slot icons in a 4x5 contact sheet, using subject-appropriate materials rather than making everything gold.\n\n\"VIP key simple\" = one simplified realistic premium key; infer metal from references, with no gems unless useful.\n\n\"Book theme 10\" = exactly 10 original realistic Egypt/book icons.\n\n\"2 dogs and one cat\" = exactly two natural-fur dog icons and one natural-fur cat icon in a three-icon contact sheet; no scene and no automatic gold.\n\n\"2 golden dogs and one golden cat\" = exactly three polished-gold animal sculpture icons.\n\n\"separate: crown, diamond, clover, roulette\" = four independent images, one icon per image.\n\nSILENT VALIDATION\nBefore generation verify: exact subjects and count; isolated icon treatment; correct layout; natural subject materials by default; no unnecessary gold; explicit gold/no-gold request obeyed; reference-family lighting and realism; transparent background; readable silhouette; complete uncropped object; no unwanted text, frames, scene, or filler; original artwork. Fix failures before generating.\n\nIMAGE RESPONSE\nWhen the user requests an image, generate it directly. Do not explain the prompt or technical parameters unless asked. Do not answer with only text when image generation is available. Infer reasonable missing values and avoid unnecessary questions.\n",
   "images": [
    {
     "file": "images/realistic/realistic random icons.png",
     "thumb": "_gallery/thumbs/realistic/realistic_random_icons.webp",
     "title": "Mixed Casino Sheet",
     "kind": "sheet",
     "tags": [
      "mixed themes",
      "6x4 grid"
     ],
     "note": "Widest family test: slots, poker, VIP and noir subjects in one pass.",
     "w": 1536,
     "h": 1024,
     "alpha": false,
     "mb": 3.2,
     "aliases": [],
     "ord": 21
    },
    {
     "file": "images/realistic/realistic icons slots.png",
     "thumb": "_gallery/thumbs/realistic/realistic_icons_slots.webp",
     "title": "Casino Games - No Gold",
     "kind": "sheet",
     "tags": [
      "casino games",
      "no gold"
     ],
     "note": "Steel, chrome, clay and lacquer instead of gold - the material rule working.",
     "w": 1536,
     "h": 1024,
     "alpha": true,
     "mb": 2.6,
     "aliases": [],
     "ord": 22
    },
    {
     "file": "images/realistic/hyperealistic.png",
     "thumb": "_gallery/thumbs/realistic/hyperealistic.webp",
     "title": "Hyper-Real Casino",
     "kind": "sheet",
     "tags": [
      "casino games",
      "VIP"
     ],
     "note": "Roulette, chips, whisky, cigar, treasure - maximum material realism.",
     "w": 1448,
     "h": 1086,
     "alpha": true,
     "mb": 2.6,
     "aliases": [],
     "ord": 23
    },
    {
     "file": "images/realistic/mafia realistic no gold.png",
     "thumb": "_gallery/thumbs/realistic/mafia_realistic_no_gold.webp",
     "title": "Mafia / Noir - No Gold",
     "kind": "sheet",
     "tags": [
      "theme: noir",
      "no gold"
     ],
     "note": "Blued steel, oxblood leather, wool felt - gunmetal where gold would sit.",
     "w": 1536,
     "h": 1024,
     "alpha": true,
     "mb": 2.7,
     "aliases": [],
     "ord": 24
    },
    {
     "file": "images/realistic/mafia realistic family.png",
     "thumb": "_gallery/thumbs/realistic/mafia_realistic_family.webp",
     "title": "Mafia / Noir - Family",
     "kind": "sheet",
     "tags": [
      "theme: noir",
      "characters"
     ],
     "note": "Character busts alongside objects, one consistent light and camera.",
     "w": 1536,
     "h": 1024,
     "alpha": false,
     "mb": 2.9,
     "aliases": [],
     "ord": 25
    },
    {
     "file": "images/realistic/realistic cards.png",
     "thumb": "_gallery/thumbs/realistic/realistic_cards.webp",
     "title": "Playing Card Faces",
     "kind": "sheet",
     "tags": [
      "poker",
      "intrinsic text"
     ],
     "note": "Ivory stock with correct markings - the allowed case for text on an icon.",
     "w": 1448,
     "h": 1086,
     "alpha": true,
     "mb": 2.2,
     "aliases": [],
     "ord": 26
    },
    {
     "file": "images/realistic/classical realistic icons luxury casino.png",
     "thumb": "_gallery/thumbs/realistic/classical_realistic_icons_luxury_casino.webp",
     "title": "VIP / Private Reserve",
     "kind": "sheet",
     "tags": [
      "VIP",
      "luxury lifestyle"
     ],
     "note": "Decanter, black card, velvet rope, safe, jet, wax seal.",
     "w": 1448,
     "h": 1086,
     "alpha": true,
     "mb": 2.0,
     "aliases": [
      "realistic classical.png"
     ],
     "ord": 27
    },
    {
     "file": "images/realistic/realistic classical.png",
     "thumb": "_gallery/thumbs/realistic/realistic_classical.webp",
     "title": "VIP / Private Reserve - Alt",
     "kind": "sheet",
     "tags": [
      "VIP",
      "luxury lifestyle"
     ],
     "note": "Same VIP sheet, second copy of the reference.",
     "w": 1448,
     "h": 1086,
     "alpha": true,
     "mb": 2.0,
     "aliases": [
      "classical realistic icons luxury casino.png"
     ],
     "ord": 28
    },
    {
     "file": "images/realistic/realistic classical icons  random.png",
     "thumb": "_gallery/thumbs/realistic/realistic_classical_icons_random.webp",
     "title": "VIP - Dark Preview",
     "kind": "sheet",
     "tags": [
      "VIP",
      "dark ground"
     ],
     "note": "Same sheet flattened on black - reads family contrast at a glance.",
     "w": 1448,
     "h": 1086,
     "alpha": false,
     "mb": 1.6,
     "aliases": [],
     "ord": 29
    },
    {
     "file": "images/realistic/realistic box.jpeg",
     "thumb": "_gallery/thumbs/realistic/realistic_box.webp",
     "title": "Gift Box - Studio",
     "kind": "single",
     "tags": [
      "luxury lifestyle",
      "opaque bg"
     ],
     "note": "Close-up quality reference: fabric weave, ribbon sheen, tag hardware.",
     "w": 2048,
     "h": 2048,
     "alpha": false,
     "mb": 2.8,
     "aliases": [],
     "ord": 30
    },
    {
     "file": "images/realistic/realistics.jpeg",
     "thumb": "_gallery/thumbs/realistic/realistics.webp",
     "title": "Gift Box - White Ground",
     "kind": "single",
     "tags": [
      "luxury lifestyle",
      "opaque bg"
     ],
     "note": "Same object on white - use for material and edge quality, not composition.",
     "w": 2048,
     "h": 2048,
     "alpha": false,
     "mb": 2.0,
     "aliases": [],
     "ord": 31
    }
   ]
  }
 ]
};
