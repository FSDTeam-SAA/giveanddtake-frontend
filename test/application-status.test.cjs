const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, imports = {}, globals = {}) {
  const { outputText } = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  });
  const context = { exports: {}, ...globals, require: name => imports[name] ?? require(name) };
  vm.runInNewContext(outputText, context);
  return context.exports;
}
const labels = load('lib/application-status.ts');

test('all unsuccessful application aliases have the requested public label', () => {
  for (const value of ['rejected', 'REJECTED', ' rejected ', 'reject', 'unsuccessful', 'not shortlisted', 'not_shortlisted']) {
    assert.equal(labels.applicationStatusLabel(value), 'Unsuccessful');
  }
  assert.equal(labels.applicationStatusLabel('shortlisted'), 'Shortlisted');
  assert.equal(labels.applicationStatusLabel('pending', 'Reviewing'), 'Reviewing');
});

test('candidate history renders Unsuccessful for old and new status values', () => {
  const stub = ({ children }) => React.createElement('div', null, children);
  const ui = new Proxy({}, { get: () => stub });
  const { default: JobHistory } = load('app/(website)/account/_components/job-history.tsx', {
    'next-auth/react': { useSession: () => ({ status: 'authenticated', data: { user: { id: 'candidate' }, accessToken: 'offline-test' } }) },
    'next/navigation': { useRouter: () => ({}), useSearchParams: () => new URLSearchParams() },
    '@tanstack/react-query': { useQuery: () => ({ data: {
      meta: { currentPage: 1, totalPages: 1, totalItems: 2, itemsPerPage: 10 },
      data: { applications: ['rejected', 'unsuccessful'].map((status, index) => ({
        _id: String(index), jobId: { title: 'Engineer', companyId: { cname: 'Company' } },
        status, createdAt: '2026-10-18T00:00:00Z',
      })) },
    } }) },
    '@/lib/application-status': labels,
    '@/lib/utils': { cn: (...values) => values.filter(Boolean).join(' ') },
    '@/components/ui/table': ui, '@/components/ui/card': ui,
    '@/components/ui/skeleton': ui, '@/components/shared/pagination': ui,
  });
  const html = renderToStaticMarkup(React.createElement(JobHistory));
  assert.equal((html.match(/Unsuccessful/g) || []).length, 2);
  assert.doesNotMatch(html, /Rejected|Not Shortlisted/i);
});

test('applicant confirmation says Unsuccessful while preserving the API status value', async () => {
  const stub = ({ children }) => React.createElement('div', null, children);
  const ui = new Proxy({}, { get: () => stub });
  let request;
  const { default: Applicants } = load('app/(website)/candidate-list/[id]/page.tsx', {
    react: {
      useEffect() {},
      useState: initial => [
        initial && typeof initial === 'object' && 'open' in initial
          ? { open: true, applicationId: 'app-id', newStatus: 'rejected' }
          : initial === true ? false : initial,
        () => {},
      ],
    },
    'next/navigation': { useParams: () => ({ id: 'job-id' }), useSearchParams: () => new URLSearchParams(), useRouter: () => ({}) },
    'next-auth/react': { useSession: () => ({ data: { accessToken: 'offline-test' } }) },
    'next/link': stub,
    sonner: { toast: { success() {}, error() {} } },
    '@/components/ui/table': ui, '@/components/ui/card': ui, '@/components/ui/button': ui,
    '@/components/ui/avatar': ui, '@/components/ui/skeleton': ui, '@/components/ui/dialog': ui,
  }, {
    fetch: async (url, options) => {
      request = { url, body: JSON.parse(options.body) };
      return { ok: true, json: async () => ({ data: { status: 'rejected', __v: 1 } }) };
    },
    process: { env: { NEXT_PUBLIC_BASE_URL: 'https://api.example.test' } },
  });
  const tree = Applicants();
  const html = renderToStaticMarkup(tree);
  assert.match(html, /status to.*<strong>Unsuccessful<\/strong>/);
  assert.doesNotMatch(html, /Rejected|Not Shortlisted/i);
  function findConfirm(element) {
    if (!element || typeof element !== 'object') return;
    if (element.props?.children === 'Confirm') return element;
    for (const child of [element.props?.children].flat(Infinity)) {
      const result = findConfirm(child);
      if (result) return result;
    }
  }
  await findConfirm(tree).props.onClick();
  assert.equal(request.body.status, 'rejected');
  assert.equal(request.body.expectedVersion, 0);
});
