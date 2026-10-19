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

test('subject validation accepts six words and rejects overflow across whitespace', () => {
  assert.equal(policy.getContactSubjectError(words(6)), null);
  assert.equal(policy.getContactSubjectError(' one\ttwo\nthree\u00a0four  five six '), null);
  assert.equal(policy.getContactSubjectError(words(7)), 'Subject cannot exceed 6 words.');
  assert.equal(policy.getContactSubjectError(words(7).replaceAll(' ', '\n\t\u00a0')), 'Subject cannot exceed 6 words.');
  for (const subject of ['', ' \t ', 'ab']) {
    assert.equal(policy.getContactSubjectError(subject), 'Subject must be at least 3 characters.');
  }
});

test('message validation accepts 50 words and rejects 51 across whitespace', () => {
  assert.equal(policy.getContactMessageError(words(50)), null);
  assert.equal(policy.getContactMessageError(words(51)), 'Message cannot exceed 50 words.');
  assert.equal(policy.getContactMessageError(words(51).replaceAll(' ', '\n\t\u00a0')), 'Message cannot exceed 50 words.');
  assert.equal(policy.countContactMessageWords(' \n one\t two   three\u00a0four '), 4);
  assert.equal(policy.countContactMessageWords(' \n\t '), 0);
  assert.match(policy.getContactMessageError('short'), /at least 10 characters/);
});

test('contact page blocks over-limit typing, paste and submit, allowing edits at 50 words', () => {
  let state = { firstName: 'Alex', lastName: 'Smith', address: 'alex@example.com',
    phoneNumber: '', subject: 'Question', message: words(50) };
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
  change(words(51));
  assert.equal(state.message, words(50));
  change(words(100));
  assert.equal(state.message, words(50));
  change(`${words(49)} replacement`);
  assert.equal(state.message, `${words(49)} replacement`);
  change(words(49));
  assert.equal(state.message, words(49));
  change(words(50));
  const submit = () => find(ContactForm(), element => element.type === 'form').props.onSubmit({ preventDefault() {} });
  submit();
  assert.equal(submitted.length, 1);
  assert.equal(submitted[0].address, 'alex@example.com');
  state = { ...state, message: words(51) };
  submit();
  assert.equal(submitted.length, 1);
  assert.equal(errors.length, 1);

  state = { ...state, subject: words(6), message: words(50) };
  const subject = () => find(ContactForm(), element => element.props?.id === 'subject');
  const changeSubject = value => subject().props.onChange({ target: { id: 'subject', value } });
  assert.equal(subject().props.placeholder, 'Subject');
  assert.equal(message().props.placeholder, 'Your Message');
  assert.equal(subject().props['aria-describedby'], 'subject-limit subject-word-count');
  for (const overflow of [words(7), words(100), words(7).replaceAll(' ', '\t\u00a0')]) {
    changeSubject(overflow);
    assert.equal(state.subject, words(6));
  }
  changeSubject(`${words(5)} replacement`);
  assert.equal(state.subject, `${words(5)} replacement`);
  changeSubject(words(5));
  assert.equal(state.subject, words(5));
  changeSubject(words(6));
  submit();
  assert.equal(submitted.length, 2);
  assert.equal(submitted[1].subject, words(6));
  state = { ...state, subject: words(7) };
  submit();
  assert.equal(submitted.length, 2);
  assert.equal(errors.length, 2);
});
