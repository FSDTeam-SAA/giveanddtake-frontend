const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { QueryClient, QueryClientProvider } = require('@tanstack/react-query');

let role;
const modules = new Map();
function load(file) {
  const filename = path.resolve(__dirname, '..', file);
  if (modules.has(filename)) return modules.get(filename).exports;
  const compiled = new Module(filename, module);
  modules.set(filename, compiled);
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  compiled.require = name => {
    if (name === 'next-auth/react') return { useSession: () => ({
      data: role ? { user: { id: 'candidate', role }, accessToken: 'token' } : null,
      status: role ? 'authenticated' : 'unauthenticated',
    }), signIn() {} };
    if (name === 'next/navigation') return { useRouter: () => ({ push() {} }) };
    if (name === 'next/image') return props => React.createElement('img', { alt: props.alt });
    if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
    if (name === 'dompurify') return { sanitize: text => text };
    if (name === '@/lib/api-service') return { getMyResume: async () => ({}), getMyAppliedJobIds: async () => ({}) };
    if (name.startsWith('@/')) {
      const base = name.slice(2);
      const target = ['.tsx', '.ts'].map(ext => base + ext).find(p => fs.existsSync(path.resolve(__dirname, '..', p)));
      if (target) return load(target);
    }
    return Module.prototype.require.call(compiled, name);
  };
  compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText, filename);
  return compiled.exports;
}
const { getJobAvailability } = load('lib/job-availability.ts');
const { jobShareUrl, jobShareLinks } = load('lib/job-sharing.ts');
const now = Date.parse('2026-10-10T12:00:00Z');
const live = { _id: 'job-1', title: 'OSP Supervisor', description: '<p>Role</p>', experience: 'mid',
  deadline: '2099-06-18T12:00:00Z', publishDate: '2026-05-19T12:00:00Z', createdAt: '2026-05-18T12:00:00Z',
  updatedAt: '2026-10-09T12:00:00Z', status: 'active', adminApprove: true, jobApprove: 'approved',
  applicationRequirement: [], customQuestion: [] };

test('actual deadline overrides raw Active and closes at the exact expiry time', () => {
  assert.equal(getJobAvailability(live, now).canApply, true);
  for (const expiry of ['2026-06-18', '2026-10-10T12:00:00Z']) {
    const result = getJobAvailability({ ...live, deadline: expiry }, now);
    assert.equal(result.status, 'expired');
    assert.equal(result.canApply, false);
  }
  assert.equal(getJobAvailability({ ...live, deadline: '2026-10-10T12:00:00Z' }, now - 1).canApply, true);
});

test('all unavailable states block Apply, including server closures and legacy expiry', () => {
  for (const patch of [{ adminApprove: false }, { jobApprove: 'pending' }, { jobApprove: 'denied' },
    { arcrivedJob: true }, { publishDate: '2099-01-01' }, { status: 'deactivate' }, { canApply: false },
    { deadline: 'invalid' }, { deadline: null, expiryDate: '2026-06-18' }]) {
    assert.equal(getJobAvailability({ ...live, ...patch }, now).canApply, false, JSON.stringify(patch));
  }
  assert.equal(getJobAvailability(undefined, now).canApply, false);
  assert.equal(getJobAvailability({ ...live, deadline: null }, now).canApply, true);
  assert.equal(getJobAvailability({ ...live, adminApprove: false, jobApprove: 'pending' }, now).label, 'Pending approval');
});

test('sharing uses the public job link with safely encoded social URLs', () => {
  const title = 'Engineer & Supervisor #1';
  const url = jobShareUrl(live._id);
  assert.equal(url, 'https://evpitch.com/alljobs/job-1');
  const links = Object.fromEntries(jobShareLinks(live._id, title).map(link => [link.name, new URL(link.url)]));
  assert.equal(links.LinkedIn.searchParams.get('url'), url);
  assert.equal(links.Facebook.searchParams.get('u'), url);
  assert.equal(links.WhatsApp.searchParams.get('text'), `${title}\n${url}`);
  assert.equal(links.X.searchParams.get('text'), title);
  assert.equal(links.X.searchParams.get('url'), url);
});

function renderJob(file, props, job, userRole) {
  role = userRole;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  client.setQueryData(['job', job._id], { success: true, data: job });
  const Component = load(file).default;
  try { return renderToStaticMarkup(React.createElement(QueryClientProvider, { client }, React.createElement(Component, props))); }
  finally { client.clear(); }
}

test('expired details stay readable for guests and candidates with Share, deadline and disabled Apply', () => {
  const expired = { ...live, deadline: '2026-06-18T12:00:00Z', displayStatus: 'expired', canApply: false };
  for (const userRole of [undefined, 'candidate']) {
    const html = renderJob('app/(website)/alljobs/_components/job-details.tsx', { jobId: live._id }, expired, userRole);
    assert.match(html, /Job expired/);
    assert.match(html, /OSP Supervisor/);
    assert.match(html, /Application Deadline/);
    assert.match(html, /June 18, 2026/);
    assert.match(html, /May 19, 2026/);
    assert.doesNotMatch(html, /October 9, 2026/);
    assert.match(html, /aria-label="Share job: OSP Supervisor"/);
    assert.match(html, /<button[^>]*disabled[^>]*>Expired<\/button>/);
    assert.doesNotMatch(html, />Active</);
  }
});

test('public job cards include sharing and block expired Apply without hiding details', () => {
  const job = { ...live, deadline: '2026-06-18', canApply: false };
  const html = renderJob('components/shared/card/job-card.tsx', { job, variant: 'list' }, job);
  assert.match(html, /aria-label="Share job: OSP Supervisor"/);
  assert.match(html, /View details/);
  assert.match(html, /<button[^>]*disabled[^>]*>Expired<\/button>/);
});

test('direct application pages block submission for expired jobs', () => {
  const expired = { ...live, deadline: '2026-06-18', canApply: false };
  const html = renderJob('app/(website)/job-application/components/job-application-page.tsx', { jobId: live._id }, expired, 'candidate');
  assert.match(html, /This job has expired/);
  assert.match(html, /<button[^>]*type="submit"[^>]*disabled[^>]*>Applications closed<\/button>/);
});
