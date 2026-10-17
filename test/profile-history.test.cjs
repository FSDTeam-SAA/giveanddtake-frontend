const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const fixtures = require('./fixtures/profile-history.json');

function load(file, imports = {}) {
  const { outputText } = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const context = { exports: {}, Date, require: name => imports[name] ?? require(name) };
  vm.runInNewContext(outputText, context);
  return context.exports;
}
const history = load('lib/profile-history.ts');

for (const [kind, { items, expected }] of Object.entries(fixtures)) {
  test(`${kind}: sorts actual dates and current entries without mutating source records`, () => {
    const before = JSON.stringify(items);
    const result = history.sortHistory(items, kind);
    assert.deepEqual(Array.from(result, row => row.id), expected);
    assert.equal(JSON.stringify(items), before);
    for (const row of result) assert.ok(items.includes(row));
  });
}
test('date parsing rejects impossible dates and accepts form and saved formats', () => {
  for (const value of ['', null, '13/2025', '2025-02-29', '2026-02-30', 'bad']) assert.equal(history.historyDate(value), null);
  assert.equal(history.historyDate('02/2024'), Date.UTC(2024, 1, 1));
  assert.equal(history.historyDate(2024), Date.UTC(2024, 0, 1));
  assert.equal(history.historyDate(new Date('2024-02-29')), Date.UTC(2024, 1, 29));
  assert.equal(history.historyDate('2026-10-01T01:00:00+01:00'), Date.UTC(2026, 9, 1));
  assert.equal(history.isCurrentExperience({ startDate: '2020', endDate: null }), true);
  assert.equal(history.isCurrentExperience({ startDate: '2020', endDate: null, currentlyWorking: false }), false);
  assert.equal(history.formatProfileDate('12/2025'), 'Dec 2025');
  assert.equal(history.formatProfileDate('Present'), 'Present');
  assert.equal(history.formatProfileDate('invalid'), 'Date not provided');
});

test('Terms renders the original HTML unchanged inside its spacing container', () => {
  const React = require('react');
  const html = '<h2>Original heading</h2><p>First paragraph.</p><p style="line-height:1">Second <strong>paragraph</strong>.</p>';
  const { default: Terms } = load('app/(website)/terms-condition/page.tsx', {
    '@tanstack/react-query': { useQuery: () => ({ data: { data: { description: html } } }) },
    '@/components/shared/PageHeaders': () => null,
  });
  const find = node => {
    if (!React.isValidElement(node)) return;
    if (node.props.dangerouslySetInnerHTML) return node;
    return React.Children.toArray(node.props.children).map(find).find(Boolean);
  };
  const content = find(Terms());
  assert.equal(content.props.dangerouslySetInnerHTML.__html, html);
  assert.match(content.props.className, /terms-content/);
});
