const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const output = ts.transpileModule(fs.readFileSync('lib/qualifications.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const context = { exports: {} };
vm.runInNewContext(output, context);
const { defaultQualifications, qualificationOptions, qualificationLabel } = context.exports;

test('defaults correct abbreviations and include ONC, OND, HNC and HND', () => {
  assert.equal(qualificationLabel('BSc'), 'B.Sc');
  assert.equal(qualificationLabel('B.Sc.'), 'B.Sc');
  assert.equal(qualificationLabel('MSc'), 'M.Sc');
  for (const value of ['ONC', 'OND', 'HNC', 'HND']) assert.ok(defaultQualifications.some(item => item.value === value));
});
test('admin edits and inactive options preserve existing profiles without offering inactive options to new profiles', () => {
  const catalog = [{ value: 'BSc', label: 'B.Sc', active: false }, { value: 'Diploma', label: 'Updated diploma' }];
  assert.equal(qualificationOptions(catalog).length, 1);
  assert.equal(qualificationOptions(catalog, 'BSc')[1].label, 'B.Sc');
  assert.equal(qualificationOptions(catalog, 'Old qualification')[1].value, 'Old qualification');
  assert.equal(qualificationLabel('Diploma', catalog), 'Updated diploma');
  assert.equal(catalog.length, 2);
  assert.equal(qualificationOptions([]).length, 0);
});
