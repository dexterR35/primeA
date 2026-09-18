# Loja Privată

Romanian landing page for a recommendation-only private club. Static HTML, CSS, and JavaScript.

Open `index.html` or serve the folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

The access form posts to a Google Apps Script web app, which appends a row to a spreadsheet. Setup, sheet columns, and server-side checks are in [`apps-script/README.md`](apps-script/README.md).

---

## What the page is

| Section | Role |
| --- | --- |
| Header | Brand lockup **LOJA / PRIVATĂ** and **Cere accesul acum** (opens the modal) |
| Hero | Three-slide carousel. Slide 1 is the LCP image |
| Dincolo de ușă | Four benefits |
| În interiorul Lojei | Three perk cards |
| De ce există Loja | Four pillars + member card |
| Cere accesul în Lojă | Inline request form (`#request`) |
| Footer | Tagline and legal links |
| Modal | Second copy of the same form (`#requestModal`) |

---

## Layout

```
index.html              Page markup, head, JSON-LD
site.webmanifest        PWA name, icons, theme colour
robots.txt              Crawl rules + sitemap pointer
sitemap.xml
assets/
  css/style.css         Tokens → layout → components → sections → breakpoints
  css/fonts.css         Self-hosted Inter + Outfit (latin + latin-ext)
  css/noscript.css      Fallback when JavaScript is off
  fonts/                Four variable woff2 files
  js/app.js             Carousel, lazy media, header, form, modal
  img/                  Hero, perks, OG card, PWA icons
  svg/                  Logos, benefit marks, decorative aces
apps-script/
  Code.gs               Form endpoint (bound to the spreadsheet)
  appsscript.json       Runtime, OAuth scope, web-app access
  test/                 Node harness — `node apps-script/test/test.js`
```

---

## Before you deploy

1. Replace `https://www.example.com` with the real origin in `index.html`, `robots.txt`, and `sitemap.xml`.
2. Confirm `ENDPOINT` in `assets/js/app.js` is the live Apps Script `/exec` URL.
3. Point footer / modal legal links (`href="#"`) at real Confidențialitate, Termeni, and Joc Responsabil pages before collecting live data.
4. Serve over HTTPS. The CSP meta tag includes `upgrade-insecure-requests`.

---

## Request form

Two copies of the same form: the registration section and the header modal. Each collects **Nume complet**, **Adresă de email**, and **Semnătură**, plus a hidden honeypot (`company`). `app.js` stamps the signature date in Romanian on load.

Client validation is UX only. The Apps Script repeats every check, burns a one-shot token, and writes:

`Data · Nume · Email · Signature`

on the `primeA` tab. POST uses `text/plain` so the browser does not preflight (Apps Script cannot answer `OPTIONS`). Tokens are fetched on first focus of a form, not on page load.

If JavaScript is off, a `<noscript>` note tells the visitor to enable it. The forms have no `action`, so they must not be submitted without `app.js`.

---

## JavaScript (`assets/js/app.js`)

Vanilla, no libraries. Each module no-ops if its markup is missing.

- **Hero carousel** — slides live in the HTML. Autoplay 4.5 s, dots, arrows, keyboard, swipe. Pauses when the hero is off-screen, the tab is hidden, or `prefers-reduced-motion` is set. Off-slides get `aria-hidden` and `inert`. Add or remove an `<article class="hero_slide">` and dots/autoplay follow. Only slide 1 uses `<h1>`; the others use `<h2 class="h1">`.
- **Lazy media** — `IntersectionObserver` swaps `data-src` / `data-srcset` and `[data-bg]` about 300 px before view. Hero slide 1 is preloaded in `<head>` and is never deferred; remaining hero images load after `load` via `whenIdle()`.
- **Reveal** — `.reveal` gains `.is-visible` once.
- **Sticky header** — `.is-scrolled`, rAF-throttled.
- **Smooth scroll** — `a[data-scroll]`.
- **Forms** — `initForm` is scoped per `<form class="form">`. Errors clear on input; honeypot pretends success; Romanian live-region status.
- **Modal** — `<dialog showModal()>`. Close button only (`DISMISS_ON_ESC = false`). Opening focuses the close button. Body scroll is locked and restored on close.

---

## CSS and breakpoints

Dark theme only. Colours, type, radii, and borders are tokens on `:root` in `style.css`. Components use BEM-style classes with `_` (`hero_slide`, `form-panel_inner`).

| Viewport | Layout |
| --- | --- |
| 0–767 | Mobile: stacked perks and concierge, 2-up benefits |
| 768–1023 | Tablet: 2-up perks and pillars |
| 1024+ | Desktop: 4-up benefits, 3-up perks, two-column concierge |

`prefers-reduced-motion` is honoured in CSS and JS.

---

## SEO and head

`index.html` includes title, description, canonical, robots, Open Graph, Twitter card, SVG favicon, apple-touch-icon, web manifest, font and LCP preloads, and JSON-LD (`Organization`, `WebSite`, `WebPage`, benefits `ItemList`). Social card: `assets/img/og-image.jpg` (1200 × 630).

Content Security Policy is a `<meta>` tag: `default-src 'self'`, no `'unsafe-inline'`. `connect-src` allows `https://script.google.com` and `https://script.googleusercontent.com` for the form. `frame-ancestors` and HSTS only work as real response headers — set those on the host if you need them.

---

## Browser support

Current Chrome, Firefox, Safari, and Edge. Relies on custom properties, `clamp()`, grid, `backdrop-filter`, `IntersectionObserver`, `<dialog>`, and `inert` (feature-guarded). Skip link, visible focus, and form `aria-live` are in place.

---

## Tests

```bash
node apps-script/test/test.js
```

No extra packages. The harness loads `Code.gs` under stubbed Google services.
