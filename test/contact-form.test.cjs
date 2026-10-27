const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, imports = {}) {
  const { outputText } = ts.transpileModule(
    fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
  );
  const context = { exports: {}, require: name => imports[name] ?? require(name) };
  vm.runInNewContext(outputText, context);
  return context.exports;
}

const policy = load('lib/contact-message-policy.ts');
const words = count => Array(count).fill('word').join(' ');

for (const [kind,max,min] of [['Subject',50,3],['Message',500,10]]) {
  test(`${kind} accepts its character boundary, rejects long single words and preserves minimum`, () => {
    const check=policy[`getContact${kind}Error`];
    assert.equal(check('A'.repeat(max)),null);
    for(const text of ['A'.repeat(max+1), 'word '.repeat(max)]) assert.match(check(text),new RegExp(`${max} characters`));
    assert.match(check('a'.repeat(min-1)),new RegExp(`at least ${min} characters`));
    assert.equal(check(' a b c d e f g h i j '),null);
  });
}

test('contact page blocks over-limit typing, paste and submit, allowing edits at 500 characters', () => {
  let state = { firstName: 'Alex', lastName: 'Smith', address: 'alex@example.com',
    subject: 'Question', message: 'A'.repeat(500) };
  const submitted = [];
  const errors = [];
  const component = () => null;
  const { default: ContactForm } = load('app/(website)/contact-us/page.tsx', {
    react: { useState: () => [state, update => { state = typeof update === 'function' ? update(state) : update; }] },
    '@tanstack/react-query': { useMutation: () => ({ mutate: data => submitted.push(data), isPending: false }) },
    '@/lib/contact-message-policy': policy,
    '@/components/ui/label': { Label: component },
    '@/components/ui/input': { Input: component },
    '@/components/ui/textarea': { Textarea: component },
    '@/components/ui/button': { Button: component },
    '@/components/shared/PageHeaders': { default: component },
    sonner: { toast: { error: (...args) => errors.push(args) } },
  });
  function find(element, predicate) {
    if (!element || typeof element !== 'object') return undefined;
    if (predicate(element)) return element;
    for (const child of [element.props?.children].flat(Infinity)) {
      const match = find(child, predicate);
      if (match) return match;
    }
  }
  const message = () => find(ContactForm(), element => element.props?.id === 'message');
  const change = value => message().props.onChange({ target: { id: 'message', value } });
  change('A'.repeat(501));
  assert.equal(state.message, 'A'.repeat(500));
  change('A'.repeat(1000));
  assert.equal(state.message, 'A'.repeat(500));
  change(`${'A'.repeat(498)} B`);
  assert.equal(state.message, `${'A'.repeat(498)} B`);
  change('A'.repeat(499));
  assert.equal(state.message, 'A'.repeat(499));
  change('A'.repeat(500));
  const submit = () => find(ContactForm(), element => element.type === 'form').props.onSubmit({ preventDefault() {} });
  submit();
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0].address, 'alex@example.com');
  state = { ...state, message: 'A'.repeat(501) };
  submit();
  assert.equal(submitted.length, 1);
  assert.equal(errors.length, 1);

  state = { ...state, subject: 'A'.repeat(50), message: 'A'.repeat(500) };
  const subject = () => find(ContactForm(), element => element.props?.id === 'subject');
  const changeSubject = value => subject().props.onChange({ target: { id: 'subject', value } });
  assert.equal(subject().props.placeholder, 'Subject');
  assert.equal(message().props.placeholder, 'Your Message');
  assert.equal(subject().props['aria-describedby'], 'subject-limit subject-character-count');
  for (const overflow of ['A'.repeat(51), 'A'.repeat(1000), 'A'.repeat(51).replaceAll(' ', '\t\u00a0')]) {
    changeSubject(overflow);
    assert.equal(state.subject, 'A'.repeat(50));
  }
  changeSubject(`${'A'.repeat(48)} B`);
  assert.equal(state.subject, `${'A'.repeat(48)} B`);
  changeSubject('A'.repeat(49));
  assert.equal(state.subject, 'A'.repeat(49));
  changeSubject('A'.repeat(50));
  submit();
  assert.equal(submitted.length, 2);
  assert.equal(submitted[1].subject, 'A'.repeat(50));
  state = { ...state, subject: 'A'.repeat(51) };
  submit();
  assert.equal(submitted.length, 2);
  assert.equal(errors.length, 2);
});
