# Loja Privată - landing page

Static HTML / CSS / JavaScript build of the Figma design
[NetBet Prime (Copy) › Landing Page](https://www.figma.com/design/4bNO5xAttgV2IABF1QyzFa/NetBet-Prime--Copy-?node-id=85-23).

| Frame | Figma node | Width |
|---|---|---|
| Desktop View | `85:23` | 1440 px |
| Mobile View | `85:795` | 393 px |

No build step, no framework, no dependencies. Open `index.html` or serve the folder.

```bash
python3 -m http.server 8000     # then http://localhost:8000
```

---

## Files

```
index.html
site.webmanifest      PWA metadata, icons, theme colour
robots.txt            crawl rules + sitemap pointer
sitemap.xml
assets/
  css/style.css       tokens → layout → typography → components → sections → responsive
  css/fonts.css       self-hosted variable @font-face declarations
  css/noscript.css    fallback loaded only when JS is off
  fonts/              Inter + Outfit variable woff2 (latin, latin-ext) - 4 files, 177 KB
  js/app.js           lazy media, carousel, sticky header, reveal, form, modal
  img/                photography, OG card, app icons
  img-src/            full-resolution originals as exported from Figma
  svg/                logos, icons, decorative hairline patterns
```

### Before you deploy

Find-and-replace `https://www.example.com` with your real origin in three files:
`index.html`, `robots.txt`, `sitemap.xml`. That is the only wiring step.

---

## Fidelity

Section heights were measured in a headless browser against the Figma frames:

| Section | Desktop (Figma → built) | Mobile (Figma → built) |
|---|---|---|
| Header | 85 → 85 | 64 → 64 |
| Hero | 820 → 820 | 698 → 698 |
| Benefits | 579 → 580 | 645 → 645 |
| Perks | 607 → 612 | 1093 → 1090 |
| Concierge | 565 → 566 | 929 → 930 |
| Registration | 851 → 857 | 822 → 828 |
| Footer | 117 → 118 | 218 → 219 |
| **Total** | **3617 → 3631** | **4470 → 4474** |

The mobile frame in Figma is 4532 px because it includes a 62 px iOS status bar; that is
device chrome, not page content, so it is not reproduced here.

---

## Content

All copy comes from **`CONCEPT 1.docx`** (Romanian). The page is `lang="ro"`; the Figma
file's English strings are gone from every user-visible surface - headings, labels,
placeholders, validation messages, `alt` text, `aria-label`s, `<title>`, OG/Twitter tags,
JSON-LD and the manifest.

| Concept | Section |
|---|---|
| HEADER | header lockup **LOJA / PRIVATĂ** + *Cere Accesul Acum* |
| HERO | slide 1 |
| SECȚIUNEA 1 - Dincolo de ușă | Benefits - 4 items ↔ 4 cards |
| SECȚIUNEA 2 - În interiorul Lojei | Perks - 4 items ↔ **3 cards** |
| SECȚIUNEA 3 - De ce există Loja | Concierge - 4 items ↔ 4 pillars |
| CARD MEMBRU | member card - 3 lines ↔ 3 slots |
| CTA FINAL | Registration section **and** the modal heading |
| FORMULAR | both form copies |
| FOOTER | tagline + Confidențialitate · Termeni · Joc Responsabil |

### Three things the concept changed

**Hero slides 2 and 3 are still English.** The concept supplies one hero, which is now
slide 1. The other two keep their placeholder English copy and carry `lang="en"` so screen
readers switch voice. Replace them in `index.html` and drop that attribute.

**The form has three fields: name, email, signature.** Each copy (Registration section and
modal) collects *Nume complet*, *Adresă de email* and a *Semnătură* input below the consent
line, with the "electronic signature" helper note and a date stamped by `app.js` on load
(`.signature-meta_date`). The `fullName`, `email` and `signature` rules live in `rules` in
`app.js`; `readValues()` derives its shape from `rules`, so each field validates, clears on
edit and blocks submit. The server re-validates all three. The sheet holds four columns:
`Received At · Full Name · Signature · Email`.

**Section 2 has a fourth item with nowhere to go.** *„Ochi Puțini, Exclusivitate Garantată -
Ce e al tău, rămâne doar al tău."* The Perks row is three photo cards in Figma, so the first
three are mapped and this one is unused. Say the word and I will either add a fourth card
(the row becomes 2×2 on desktop, departing from the frame) or fold it elsewhere.

### Typography note

Romanian needs **ă, ș, ț**, which live in the `latin-ext` subset - `â` and `î` are in `latin`.
Both subsets are self-hosted and preloaded, so the H1 and lead never flash through a
fallback. With variable fonts that is 4 preloads covering every weight, for the same bytes
the old build spent preloading just two static weights.

---

## SEO & head

`index.html` ships a complete production head:

| | |
|---|---|
| Core | `title`, `description`, `canonical`, `robots` (`max-image-preview:large`), `author`, `color-scheme`, `theme-color` |
| Open Graph | `type`, `site_name`, `locale`, `url`, `title`, `description`, `image` + `image:type/width/height/al-` |
| Twitter / X | `summary_large_image` card, title, description, image, image alt (`twitter:site` is commented out - add your handle) |
| Icons | SVG favicon, 180 px apple-touch-icon, 192/512 px PWA icons, `site.webmanifest` |
| Performance | `preconnect` to both font hosts, `preload` for the font stylesheet, responsive `preload` of the LCP hero image |
| Structured data | JSON-LD `@graph`: `Organization` + `WebSite` + `WebPage` + an `ItemList` of the four house privileges |
| No-JS | `<noscript>` block that forces revealed content and lazy media visible |
-
**Social card** - `assets/img/og-image.jpg`, 1200 × 630, rendered from the real design with
the Romanian copy (Outfit + Inter, brand gradient, hairline texture). Regenerate it any time by screenshotting
your own 1200 × 630 page; nothing in the code depends on how it was made.

Heading order is clean for crawlers: one `<h1>` (hero slide 1), `<h2>` per section, `<h3>`
inside cards. Carousel slides 2–3 use `<h2 class="h1">` so they look identical without
introducing a second `<h1>`.

---

## Lazy loading

Native `loading="lazy"` is not used. Everything below the fold goes through one
`IntersectionObserver` helper in `app.js`:

```js
onEnter(nodes, callback, options)   // runs callback once, then unobserves
```

It powers three things:

| Target | Markup | What happens |
|---|---|---|
| Images | `<img data-src>`, `<source data-srcset>` | Sources swap in 300 px before entering view |
| CSS backdrops | `[data-bg]` on `.section_bleed` | Gains `.is-bg-loaded`, background paints and fades to 8 % |
| Reveal animations | `.reveal` | Gains `.is-visible` |

Wrap an image box in `.lazy-media` to get the brand-tinted shimmer skeleton and a 0.5 s
cross-fade once bytes land; `.is-failed` is set if the request-errors so the skeleton stops
spinning forever. Always keep `width`/`height` on the `<img>` - the boxes are pre-sized, so
cumulative layout shift is zero.

The hero is handled separately:
-
- **Slide 1 is never deferred** - it is the LCP element and is preloaded in `<head>`.
- **Slides 2–3 load during idle**, after the `load` event, via `whenIdle()`. They are not on
  the scroll observer: they sit in the viewport from the start, so it wou-d fire immediately
  (hence `data-hero-img`, which excludes them). They are not lazy either - a hidden lazy
  image does not download until shown, so the carousel would flash empty at 7 s.
  `ensureLoaded()` also runs one slide ahead of the current one as a safety net.
- **Above-the-fold SVGs** (logo, arrows, chevrons) are inline-cheap and load normally.

Result on desktop: **33 KB** of imagery at load, 207 KB after idle, 165 KB on scroll.

### Image formats
-
WebP only - no JPEG twins. WebP has been supported in every browser since Safari 14
(September 2020), so the fallbacks were dead weight; removing them cut 7 files and 870 KB
from the repo without changing what any visitor downloads.

The perk cards are a plain `<img>`: one format, one size, same landscape aspect ratio at
every breakpoint, so `<picture>` bought nothing.

The hero keeps `<picture media>` for its `-m` portrait variants. Be aware-of what that is
actually worth: those crops were generated by script, i.e. a centre crop - the same thing
`object-fit: cover` does for free. Measured difference between the two framings is **1.0 %**.
They earn their place on weight (73 KB vs 122 KB on mobile), not on composition. If a
designer reframes the mobile shot by hand, `<pictu-e media>` is right. If it stays a centre
crop, `srcset` + `sizes` would be the better tool - same two files, but the browser picks on
real viewport width and pixel density.

Without `IntersectionObserver` the helper runs every callback immediately, so old browsers
get all the content with none of the animation.

The hero carousel also observes itself: autoplay stops when the hero scrolls out of view or
the tab is hidden, and resumes on return.

---

## Hardening

Only what a static page can meaningfully do itself. Everything real happens on your server.

**Form target.** `<form action="/api/invitations" method="post">`. This is not cosmetic: a
form with no `action` resolves to a **GET against the current URL**, so if JS is disabled or
`app.js` fails to load, submitting would reload the page with
`?fullName=…&email=…&signature=…` - leaking personal data into the address bar, browser
history, `Referer` headers and server logs. Point the action at your real endpoint.
-
**Honeypot.** A `#company` field positioned off-screen (not `display:none` - some bots skip
hidden fields), `aria-hidden` and `tabindex="-1"` so people and screen readers never meet it.
If it comes back filled, `app.js` shows the success state and discards the submission;
telling a bot why it failed only helps it retry. **Your server must check this field too.**

**Length caps.** `maxlength` on both inputs (80 / 254) so nobody pastes megabytes.

**Self-hosted variable fonts.** Inter and Outfit are served from `assets/fonts/`, not the
Google CDN - no third-party origin, no visitor IP disclosed to Google, one less thing to
widen the CSP for.

Four files, 177 KB, one per family per subset, each carrying every weight from 300 to 700.
The static build needed 14 files and 658 KB because each weight was a separate download.
Rendering is unchanged - verified by pixel-diffing the page before and after.
`latin-ext` is required (Romanian `ă ș ț`) and is preloaded alongside `latin`.

**Content Security Policy**, as a `<meta>` tag in `index.html`:

```-
default-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none';
script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self';
connect-src 'self'; manifest-src 'self'; upgrade-insecure-requests
```

No `'unsafe-inline'` anywhere - that is why the no-JS fallback is `noscript.css` rather than
an inline `<style>`. Verified with a `securitypolicyviolation` listener: **zero violations**.
If you add analytics or post to another origin, widen `script-src` / `connect-src` here.

`frame-ancestors` and HSTS are ignored inside a `<meta>` tag; they only work as real response
headers. Add them at your server if you want clickjacking and transport protection.

### What this page deliberately does NOT do
-
No client-side rate limiting, no timing traps, no JS "sanitization". Any of it is bypassed by
clearing storage or posting straight to the endpoint, so it buys friction, not safety, at the
cost of code you have to maintain. Double-submit is already prevented by disabling the button.

Sanitization is an **output-context** concern: escape on the way out, where the data is
rendered or stored. In this page nothing user-typed ever becomes HTML - every write goes
through `textContent`, and there is no `innerHTML`, `insertAdjacentHTML`, `document.write` or
`eval` anywhere in the shipped code. Keep it that way if you start echoing the applicant's
name back.

Your server still owns: field validation, the honeypot check, single-use submit tokens, the
duplicate-address check and a global rate limit. See `apps-script/README.md` for what each
one does and does not stop (Apps Script has no client IP, so the rate limit is one endpoint-
wide ceiling, not per-visitor).

---
_
## Responsive strategy

Mobile-first. Base CSS *is* the 393 px frame; the `@media (min-width: 1024px)` block *is*
the 1440 px frame. One intermediate step at 768 px bridges them.

```-
   0 –  767   mobile frame            2-up benefits, stacked pe_s, stacked co_ierge
 768 – 1023   tablet bridge           2-up perks, 2-up pillars, full-size member card
1024 +        desktop frame           4-up benefits, 3-up perks, 2-column concierge
```

The content column is `1168px` - exactly Figma's `1440 − 80 (outer) − 56 (inner) × 2`.
The gutter interpolates with `clamp(48px, 9.44vw, 136px)` so the layout lands on the
frame precisely at 1440 px and degrades smoothly below it.

---

## Reusable classes

Nothing is styled by ID or by section-specific selector unless it is genuinely unique.

**Layout** `.container` `.section` `.section__bleed` `.stack` `.stack--xs|sm|md|lg|xl`

**Type** `.h1` `.h2` `.h2--sm` `.h2--reg` `.h3` `.h3--tight` `.h4` `.lead` `.body`
`.body-sm` `.body-xs` `.eyebrow` `.eyebrow--gold` `.eyebrow--rule` `.section-head`
`.section-head--center`
-
**Components** `.btn` `.btn--primary` `.btn--md` `.btn--lg` `.btn--block` `.link-arrow`
`.brand` `.icon-tile` `.feature-grid` `.feature` `.card` `.card__media` `.card__body`
`.perk-grid` `.pillars` `.pillar` `.member-card` `.field` `.form-panel` `.dots` `.dot`
`.nav-btn` `.reveal`

Everything that repeats is a token in `:root`:

- **colours, radii, shadows, gradients** - retheming is one block
- **borders** - `--border-subtle | soft | strong | field | control`, composite
  `1px solid var(--line-XX)` values (the raw colours stay too, since they are also used on
  their own for backgrounds and shadows)
- **type ramp** - one token per style using the `font` shorthand
  (`--type-h1: 700 3-px/1.16 var(--font-display)`), plus `--ls-*` for tracking, which cannot
  ride in the shorthand

The type tokens are why the desktop breakpoint is short: `@media (min-width: 1024px)`
re-declares the toke-s in `:root` and **touches no rule at all** - every heading and body
class already reads them.
-
Three grouped select-rs near the top of the components section carry the shared flex
patterns (`inline-f-ex + center`, `flex + center`, `flex column`). They accounted for 29 of
the 43 `display` declarations in the file; each component below now declares only what is
specific to it.
-
The member card is authored once at its 360 × 226 desktop size and uniformly scaled with
`--k`. Figma uses the exact same 0.7472 ratio for the mobile variant, so one component
serves both frames.

---

## Theming

Dark only - it is the designed state for this brand. The palette lives as tokens on `:root`
in `style.css`; every component reads from those tokens rather than hard-coding a colour, so
a second theme would only need to redefine the token block, but none ships.

---

## JavaScript

`assets/js/app.js`, ~440 lines, no dependencies. Each module no-ops if its markup is absent.
-
- **Hero carousel** - slides live in the **markup**, not in JS. Autoplay (7 s), dots,
  prev/next, arrow keys, touch swipe; pauses on hover / focus / tab-hidden; autoplay off
  under `prefers-reduced-motion`. Off-slides get `aria-hidden` + `inert` so their links
  stay out of the tab order. Serves a portrait crop below 768 px.
- **Sticky header** - `.is-scrolled` state, rAF-throttled.
- **Smooth anchor scroll** for `a[data-scroll]`.
- **Lazy media** - observer-driven images and backdrops (see above).
- **Scroll reveal** - one-shot, through the same observer helper.
- **Request form** - instance-scoped, so the section form and the modal form run the same
  code. Inline validation in Romanian (name, email format, signature), errors clear on
  input, honeypot, single-use token, auto-stamped signature date, success state.
- **Modal** - `<dialog>`-based, close-button-only dismissal, scroll lock (see below).

### The request modal-

The header **Request Invitation** button opens a modal; it does not scroll. Scrolling down to
the Registration section is what happens when the visitor scrolls there themselves, and that
section keeps its own inline copy of the form. The hero's `request invitation` link still
scrolls, since it sits directly above the page flow.-

Built on `<dialog>` + `showModal()`, which gives a real top layer, a native focus trap and an
inert page behind it - no hand-written focus loop to keep correct.

**Closing.** As specified, the only way out is the close button:

- backdrop clicks are ignored (nothing listens for them)
- Escape is swallowed via the dialog's own `cancel` -vent
__
That last one departs from the WAI-ARIA dialog pattern, where Escape is expected to dismiss.
If you want it back, flip one constant at the top of the modal module:

```js
var DISMISS_ON_ESC = false;   // → true-restores Escape
```-

Opening focuses the **close button**, not the first input - it is the only exit, and
auto-focusing a text field would raise the soft keyboard on mobil- before anyone has read the
heading. Body scroll is locked while open and the scroll position is restored on close.

**Scroll restore.** While the dialog is open the body is `position: fixed`, which collapses
the document to viewport height and zeroes the scroll position - so closing has to jump back
explicitly. Two details make that jump silent rather than a visible trip across the page:
`scroll-behavior: smooth` on `<html>` is suspended for the one `scrollTo` call, and
`unlockScroll()` is idempotent because dismissing fires both `close()` and the dialog's own
`close` event.

**Two forms, one behaviour.** The page carries two copies of the form: one in the Registration
section, one in the modal. The modal's copy prefixes its ids with `m-` so nothing collides.
`initForm(form)` is scoped to a single form element - it resolves `.form-done`,
`.form_status`, `.signature-meta_date` and `[data-form-reset]` relatively, so
`document.querySelectorAll('form.form').forEach(initForm)` wires up any number of copies.
Error slots stay keyed by field **name** (`data-error-for="email"`), never by id, so they are
shared across copies unchanged.

**Provenance.** The Figma popup frames - `Popup view/Desc.` (97:619) and `Popup vi-w/Mob`
(97:888) - could not be exported; the file's MCP quota is spent. The modal is reconstructed
from the design system rather than guessed: the canvas metadata shows the popup uses the same
`Background+Border+Shadow` card as the Registration section, and the matching
`Sended request` frames are 560 px (desktop) and 361 px (mobile) - the card's two variants.
Measured in-browser, the modal card is exactly 560 px and 361 px. What is *not_from Figma is
the close button, which follows the carousel's `.nav-btn` styling. Worth a look against the
real frames when you have the quota.

### Wiring the form _ a backend
_
`app.js` fakes the round trip with a 700 ms timeout. Replace that block with a real request
to the form's own action:

```js
fetch(form.action, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
  body: JSON.strin_fy(data)
})_
```

Client-side validation in `app.js` is UX only. Revalidate every field server-side - anyone
can bypass the page entirely.

### Editing the hero carousel

There is no config object and no JSON. Each slide is one `<article class="hero__slide">`
inside `#heroStage` in `index.html`:

```html
<article class="hero__slide" role="group" aria-roledescription="slide" aria-label="2 of 3">
  <div class="hero__media">-
    <picture>
      <source media="(max-width: 767px)" type="image/webp" srcset="assets/img/hero-2-m.webp">
      <source media="(max-width: 767px)"                    srcset="assets/img/hero-2-m.jpg">
      <source type="image/webp" srcset="assets/img/hero-2.webp">
      <img src="assets/img/hero-2.jpg" alt="…" decoding="async">
    </picture>-
  </div>
  <div class="hero__scrim" aria-hidden="true"></div>
  <div class="hero__content">…eyebrow, heading, lead, link…</div>
</article>
```-

Add or delete an `<article>` and everything adapts: `app.js` counts what is in the DOM,
rebuilds the dots, wraps autoplay at the new length, and hides the controls entirely if
only one slide remains. Remember to fix the `aria-label="N of M"` values.

Only the first slide is a real `<h1>`; the others use `<h2 class="h1">` so the page keeps a
single top-level heading while sharing the type ramp.

**Slides 2 and 3 are placeholders.** Figma designs only slide 1,-so they currently reuse
the perk photography (`hero-2.*`,-`hero-3.*`, generated from `assets/img-src/`) with stand-in
copy. Slide 3's envelope shot is a tight product photo and reads very dark under the scrim -
replace it with real hero art. Both are flagged with HTML comments.

### Why not a JSON file or a carousel library?

Markup keeps the copy in the HTML source, -o it is indexable, renders before JavaScript
runs, and needs no fetch. A JSON feed only-earns its keep if the slides come from a CMS -
in that case replace the DOM query in -initHero()` with a `fetch()` that builds the same
articles, and leave the rest untouched.-

Splide, Swiper and friends are free, but they weigh 30–140 KB for a three-slide cross-fade
that is ~110 lines her- - and none of them would match the Figma dot-and-arrow styling
without overrides anyway.

---

## Two things you need to know
-
**1. Four background photos could not be exported, and are currently placeholders.** The
Figma MCP asset endpoint returns blank PNGs for images sitting behind a mask or a gradient
overlay. Those four paths now hold generated brand placeholders - the same gradient and 45°
hairline texture the design uses - so the page looks finished rather than empty. Export the
real ones from Figma (select the layer → Export → PNG 2x) and overwrite in place; no code
changes needed:

| File | Figma layer |
|---|---|
| `assets/img/hero-desktop.png` | `85:31` - *image 5*, Desktop hero |
| `assets/img/hero-mobile.png` | `85:799` - *Gradient*, Mobile hero |
| `assets/img/perks-bg.png` | `85:99` - *image 7*, Perks backdrop (renders at 8 % opacity) |
| `assets/img/registration-bg.png` | `85:229` - *image 14*, Registration backdrop (8 % opacity) |

The three perk card photos exported fine and are already in place. `assets/img/og-image.jpg`
is likewise generated - swap it for real photography when you have it.-

There is also a `splide-4.1.3/` folder in the project. Nothing references it; the carousel is
hand-rolled. Safe to delete.

**2. The four benefit icons are placeholders in Figma itself.** Nodes `126:368`, `126:371`,
`126:374`, `126:377` are empty 42 × 42 frames - Figma renders them as the crossed-box
"missing image" glyph, which is what you see in the design. That glyph is reproduced exactly
(`assets/svg/benefit-icon-42.svg`). Swap in real icons by replacing that one file, or point
each `.icon-tile img` at its own asset.

---

## Browser support

Evergreen Chrome, Firefox, Safari, Edge. Uses CSS custom properties, `clamp()`, grid,
`backdrop-filter` (prefixed), `object-fit` and `IntersectionObserver`.
`prefers-reduced-motion` is honoured throughout; the page is keyboard-navigable with a skip
link, visible focus rings, and live-region form status.

**Tested in headless Chrome only**, at 393 / 768 / 1024 / 1200 / 1440 px: no console errors,
no CSP violations, no broken images, all observers firing, one `<h1>`, section heights
matching both Figma frames. Not yet checked on real Safari, iOS or Firefox - the things most
worth a look there are `inert` (Safari 15.5+, feature-guarded in `app.js`), `100svh`
(Safari 15.4+) and `<picture>` source ordering.
