const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(file) {
  const filename = path.resolve(__dirname, '..', file);
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  compiled.require = name => Module.prototype.require.call(compiled, name);
  compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText, filename);
  return compiled.exports;
}

const { detectCurrency, priceIn, formatPrice, normalizeCurrency } = load('lib/currency.ts');

const monthly = { price: 6.99, localPrices: { GBP: 6.99, EUR: 7.99, CAD: 9.99, AUD: 9.99 } };
const yearly = { price: 79.99, localPrices: { GBP: 79.99, EUR: 89.99, CAD: 99.99, AUD: 129.99 } };

const realIntl = global.Intl.DateTimeFormat;
const browser = ({ timeZone, languages = ['en-US'], saved = null }) => {
  global.window = { localStorage: { getItem: () => saved, setItem() {} } };
  Object.defineProperty(global, 'navigator', {
    value: { languages, language: languages[0] },
    configurable: true,
  });
  global.Intl.DateTimeFormat = () => ({ resolvedOptions: () => ({ timeZone }) });
};

afterEach(() => {
  delete global.window;
  global.Intl.DateTimeFormat = realIntl;
});

test('a UK visitor is shown pounds, matching the app stores', () => {
  browser({ timeZone: 'Europe/London' });
  const currency = detectCurrency();
  assert.equal(currency, 'GBP');
  assert.equal(formatPrice(priceIn(monthly, currency).amount, currency), '£6.99');
  assert.equal(formatPrice(priceIn(yearly, currency).amount, currency), '£79.99');
});

test('time zone picks EUR, CAD and AUD', () => {
  for (const [timeZone, expected] of [
    ['Europe/Berlin', 'EUR'], ['Europe/Dublin', 'EUR'], ['America/Toronto', 'CAD'],
    ['Australia/Sydney', 'AUD'], ['America/New_York', 'USD'], ['Africa/Lagos', 'USD'],
    ['Europe/Zurich', 'USD'],
  ]) {
    browser({ timeZone });
    assert.equal(detectCurrency(), expected, timeZone);
  }
});

test('browser locale is the fallback when the time zone is not mapped', () => {
  browser({ timeZone: 'UTC', languages: ['en-GB'] });
  assert.equal(detectCurrency(), 'GBP');
});

test('a currency the visitor picked is remembered over detection', () => {
  browser({ timeZone: 'Europe/London', saved: 'EUR' });
  assert.equal(detectCurrency(), 'EUR');
});

test('plans without a local price stay in USD', () => {
  assert.deepEqual(priceIn({ price: 195.99 }, 'GBP'), { currency: 'USD', amount: 195.99 });
  assert.deepEqual(priceIn(monthly, 'USD'), { currency: 'USD', amount: 6.99 });
  assert.equal(normalizeCurrency('jpy'), 'USD');
  assert.equal(formatPrice(9.99, 'AUD'), 'A$9.99');
  assert.equal(formatPrice(99.99, 'CAD'), 'CA$99.99');
});
