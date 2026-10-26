const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

function fixture(query = { data: [{ _id: 'one', name: 'Catalog University', country: 'UK' }] }) {
  const states = []; let cursor = 0, selected = '', queryOptions;
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../components/profile/university-selector.tsx'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const scope = { exports: {}, process: { env: { NEXT_PUBLIC_BASE_URL: '/api/v1' } }, fetch: async () => ({ ok: true, json: async () => ({ status: 'success', data: query.data || [] }) }),
    require: name => {
      if (name === 'react') return { ...React, forwardRef: render => render, useId: () => 'list', useState: initial => {
        const index = cursor++; if (!(index in states)) states[index] = initial;
        return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
      } };
      if (name === '@tanstack/react-query') return { useQuery: options => { queryOptions = options; return query; } };
      if (name === '@/components/ui/input') return { Input: 'input' };
      return require(name);
    } };
  vm.runInNewContext(code, scope);
  const render = (value = selected) => { cursor = 0; return scope.exports.UniversitySelector({ value, onChange: value => selected = value }, null); };
  function elements(tree) {
    if (!React.isValidElement(tree)) return [];
    return [tree, ...React.Children.toArray(tree.props.children).flatMap(elements)];
  }
  const input = () => elements(render()).find(element => element.type === 'input');
  return { input, render, elements, selected: () => selected, query: () => queryOptions, scope };
}

test('manual institution text commits immediately, clears, and follows a reloaded form value', () => {
  const f = fixture();
  f.input().props.onChange({ target: { value: 'British Computer Institute' } });
  assert.equal(f.selected(), 'British Computer Institute');
  assert.equal(f.input().props.value, 'British Computer Institute');
  f.input().props.onBlur();
  assert.equal(f.input().props.value, 'British Computer Institute');
  f.input().props.onChange({ target: { value: '' } });
  assert.equal(f.selected(), '');
  const reloaded = f.elements(f.render('Saved independent school')).find(element => element.type === 'input');
  assert.equal(reloaded.props.value, 'Saved independent school');
  assert.equal(reloaded.props.maxLength, 150);
});

test('suggestions select by pointer or keyboard without submitting the form', () => {
  const f = fixture();
  f.input().props.onFocus();
  const option = f.elements(f.render()).find(element => element.type === 'button');
  assert.equal(option.props.type, 'button');
  option.props.onClick();
  assert.equal(f.selected(), 'Catalog University');
  assert.equal(f.input().props['aria-expanded'], false);
  f.input().props.onChange({ target: { value: 'Catalog' } });
  f.input().props.onKeyDown({ key: 'ArrowDown', preventDefault() {} });
  let prevented = false;
  f.input().props.onKeyDown({ key: 'Enter', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(f.selected(), 'Catalog University');
});

test('loading, empty catalog and failure never disable typing or discard saved values', () => {
  for (const query of [{ isLoading: true }, { data: [] }, { isError: true }]) {
    const f = fixture(query);
    assert.equal(f.input().props.disabled, false);
    f.input().props.onChange({ target: { value: 'Offline College' } });
    assert.equal(f.selected(), 'Offline College');
    assert.equal(f.input().props.value, 'Offline College');
  }
});

test('selector consumes the existing university API envelope and rejects unsuccessful responses', async () => {
  const f = fixture(); f.render();
  assert.equal((await f.query().queryFn())[0].name, 'Catalog University');
  f.scope.fetch = async () => ({ ok: false, json: async () => ({ message: 'Unavailable' }) });
  await assert.rejects(f.query().queryFn(), /Suggestions unavailable/);
});
