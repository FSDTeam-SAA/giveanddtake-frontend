const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');

function load(file, imports = {}) {
  const source = fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } });
  const scope = { exports: {}, URL, require: name => imports[name] ?? require(name) };
  vm.runInNewContext(outputText, scope);
  return scope.exports;
}
const policy = load('lib/field-policy.ts');
const common = { '@/lib/field-policy': policy, '@/lib/utils': { cn: (...v) => v.filter(Boolean).join(' ') } };

test('shared controls cap identity, company and job fields in create and nested edit forms', () => {
  const { Input } = load('components/ui/input.tsx', common);
  for (const [name, limit] of [['firstName', 20], ['lastName', 40], ['sureName', 40], ['cname', 160], ['title', 100], ['experiences.0.company', 160], ['experiences.0.position', 100], ['awardsHonors.0.title', 150]]) {
    assert.equal(Input.render({ name }, null).props.maxLength, limit, name);
  }
  assert.equal(Input.render({ placeholder: 'Job Title' }, null).props.maxLength, 100);
  assert.equal(Input.render({ name: 'title', maxLength: 150 }, null).props.maxLength, 150);
  assert.equal(Input.render({ name: 'title', type: 'file' }, null).props.maxLength, undefined);
  assert.equal(Input.render({ name: 'search' }, null).props.maxLength, undefined);
  let fileChanged = false;
  const file = Input.render({ type: 'file', onChange: () => fileChanged = true }, null);
  file.props.onChange({ target: { get value() { return 'C:\\fakepath\\photo.png'; }, set value(_) { throw new Error('File values cannot be assigned'); } } });
  assert.equal(fileChanged, true);
});

test('labels show the same limits without changing hints or unrelated labels', () => {
  for (const [label, expected] of [['First Name*', 'First Name (20 characters max) *'], ['Surname', 'Surname (40 characters max)'], ['Company Name', 'Company Name (160 characters max)'], ['Job Title *', 'Job Title (100 characters max) *'], ['Email', 'Email']]) {
    assert.equal(policy.fieldLabel(label), expected);
  }
});

test('paste, autofill and IME changes cannot bypass a control limit; saved text can be shortened', () => {
  const { Input } = load('components/ui/input.tsx', common);
  for (const [name, max] of [['firstName', 20], ['lastName', 40], ['cname', 160], ['jobTitle', 100]]) {
    let captured;
    const input = Input.render({ name, value: '', onChange: event => captured = event.target.value }, null);
    input.props.onChange({ target: { value: 'A'.repeat(max + 1000) } });
    assert.equal(captured.length, max);
    const legacy = Input.render({ name, value: 'A'.repeat(max + 10), onChange: event => captured = event.target.value }, null);
    legacy.props.onChange({ target: { value: 'A'.repeat(max + 9) } });
    assert.equal(captured.length, max + 9);
  }
  assert.equal(policy.limitFieldEdit('A😀', 2), 'A');
});

test('nested skills and field-array errors render meaningful text instead of undefined', () => {
  for (const [error, expected] of [[{ message: 'Select a skill' }, 'Select a skill'], [[{ message: 'Each skill can be at most 50 characters' }], 'Each skill can be at most 50 characters'], [{ root: { message: 'Select fewer skills' } }, 'Select fewer skills'], [{ type: 'validate', ref: { message: 'DOM reference' } }, undefined], [undefined, undefined]]) {
    const { FormMessage } = load('components/ui/form.tsx', {
      ...common,
      react: { ...React, useContext: () => ({ name: 'skills', id: 'skills' }) },
      'react-hook-form': { useFormContext: () => ({ formState: {}, getFieldState: () => ({ error }) }) },
      '@/components/ui/label': { Label: () => null },
    });
    const rendered = FormMessage.render({}, null);
    assert.equal(rendered?.props.children, expected);
    assert.notEqual(rendered?.props.children, 'undefined');
  }
});

test('create and edit schemas agree on the requested name, title and company limits', () => {
  for (const [file, schemaName] of [['create-resume-form.tsx', 'resumeSchema'], ['update-resume-form.tsx', 'resumeFormSchema']]) {
    const source = fs.readFileSync(path.resolve(__dirname, '../app/(website)/elevator-video-pitch/_components', file), 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let expression;
    function visit(node) { if (ts.isVariableDeclaration(node) && node.name.getText(ast) === schemaName) expression = node.initializer.getText(ast); ts.forEachChild(node, visit); }
    visit(ast);
    const schema = vm.runInNewContext(`(${expression})`, { z: require('zod').z, MAX_URL_LEN: 160, ...load('lib/candidate-profile-policy.ts') });
    for (const [field, limit] of [['firstName', 20], ['lastName', 40], ['title', 100]]) {
      assert.equal(schema.shape[field].safeParse('A'.repeat(limit)).success, true);
      assert.equal(schema.shape[field].safeParse('A'.repeat(limit + 1)).success, false);
    }
    // The live catalogue contains names up to 78 characters long.
    assert.equal(schema.shape.skills.safeParse(['A'.repeat(78)]).success, true);
    assert.equal(schema.shape.skills.safeParse(['A'.repeat(101)]).success, false);
  }
});

test('skills search prevents implicit submit, rejects unlisted input and selects catalogue names', () => {
  const catalogue = [{ _id: 'one', name: 'React' }, { _id: 'two', name: 'A'.repeat(78) }];
  for (const query of ['unknown skill', 'react', 'A'.repeat(78)]) {
    const state = [query, [], catalogue, false, false, ''];
    let cursor = 0;
    let selected = ['Saved legacy skill'];
    let prevented = false;
    const { SkillsSelector } = load('app/(website)/elevator-video-pitch/_components/skills-selector.tsx', {
      react: { useState: () => { const index = cursor++; return [state[index], value => state[index] = value]; }, useEffect: () => {} },
      '@/components/ui/input': { Input: 'input' },
      '@/components/ui/badge': { Badge: 'span' },
      '@/components/ui/form': { FormLabel: 'label' },
    });
    function find(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'input') return node;
      for (const child of [node.props?.children].flat(Infinity)) { const result = find(child); if (result) return result; }
    }
    const input = find(SkillsSelector({ selectedSkills: selected, onSkillsChange: value => selected = value }));
    input.props.onKeyDown({ key: 'Enter', preventDefault: () => prevented = true });
    assert.equal(prevented, true);
    if (query === 'unknown skill') {
      assert.equal(selected.length, 1);
      assert.equal(state[5], 'Please select a skill from the list.');
    } else assert.equal(selected[1], query === 'react' ? 'React' : query);
  }
});
