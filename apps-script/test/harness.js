/* Stubs the Apps Script globals so Code.gs can run under node. */
const fs = require('fs');
const crypto = require('crypto');
const vm = require('vm');

const store = new Map();
const cache = new Map();
const rows = [];
let lastRowValues = null;

const sandbox = {
  console,
  rows,
  PropertiesService: {
    getScriptProperties: () => ({
      getProperty: k => (store.has(k) ? store.get(k) : null),
      setProperty: (k, v) => store.set(k, v)
    })
  },
  CacheService: {
    getScriptCache: () => ({
      get: k => (cache.has(k) ? cache.get(k) : null),
      put: (k, v) => cache.set(k, v),
      remove: k => cache.delete(k)
    })
  },
  LockService: {
    getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} })
  },
  Session: { getScriptTimeZone: () => 'Europe/Bucharest' },
  Utilities: {
    getUuid: () => crypto.randomUUID(),
    base64Encode: s => Buffer.from(String(s)).toString('base64'),
    base64EncodeWebSafe: b =>
      Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
    computeHmacSha256Signature: (msg, key) =>
      Array.from(crypto.createHmac('sha256', String(key)).update(String(msg)).digest()),
    computeDigest: (_alg, msg) =>
      Array.from(crypto.createHash('sha256').update(String(msg)).digest()),
    DigestAlgorithm: { SHA_256: 'sha256' },
    Charset: { UTF_8: 'utf8' },
    formatDate: (d, _tz, fmt) =>
      fmt === 'yyyy-MM-dd' ? d.toISOString().slice(0, 10) : d.toISOString()
  },
  ContentService: {
    MimeType: { JSON: 'json' },
    createTextOutput: text => ({ text, setMimeType() { return this; }, getContent() { return this.text; } })
  },
  SpreadsheetApp: {
    getActive: () => spreadsheetStub,
    flush: () => {}
  }
};

/* Models named tabs, so getSheetByName / insertSheet are exercised rather
   than assumed. `inserted` records whether the script had to create it. */
const spreadsheetStub = {
  tabs: {},
  inserted: [],
  getSheetByName(name) { return this.tabs[name] || null; },
  insertSheet(name, index) {
    this.inserted.push({ name, index });
    this.tabs[name] = makeSheet(name);
    return this.tabs[name];
  },
  getSheets() { return Object.values(this.tabs); }
};

function makeSheet(name) { return Object.assign({}, sheetStub, { getName: () => name }); }

const sheetStub = {
  getName: () => 'unnamed',
  getLastRow: () => rows.length,
  setFrozenRows: () => {},
  setColumnWidth: () => {},
  getRange: (row, col, numRows, numCols) => ({
    setValues(values) {
      /* Mimics Sheets' own parsing: a leading apostrophe marks literal
         text and is stripped on read; anything else starting with = is a
         formula. */
      values[0].forEach(v => {
        if (typeof v === 'string' && /^[=+\-@]/.test(v)) {
          throw new Error('FORMULA WOULD BE EVALUATED: ' + v);
        }
      });
      rows[row - 1] = values[0].map(v =>
        typeof v === 'string' && v.startsWith("'") ? v.slice(1) : v
      );
      lastRowValues = rows[row - 1];
      return this;
    },
    setFontWeight() { return this; },
    setNumberFormat() { return this; }
  })
};

vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(__dirname + '/../Code.gs', 'utf8'),
  sandbox,
  { filename: 'Code.gs' }
);

module.exports = { sandbox, rows, cache, lastRow: () => lastRowValues };
