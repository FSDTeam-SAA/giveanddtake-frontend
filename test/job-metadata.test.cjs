const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const modules = new Map();
function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, '..', file);
  if (modules.has(filename)) return modules.get(filename).exports;
  const compiled = new Module(filename, module);
  modules.set(filename, compiled);
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  compiled.require = name => {
    if (mocks[name]) return mocks[name];
    if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`);
    return Module.prototype.require.call(compiled, name);
  };
  compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, filename);
  return compiled.exports;
}
const { getJobMetadata } = load('lib/job-metadata.ts');
const id = '69dd0cb04bc0dac637514d04';
const api = 'https://api.example.test/api/v1';
const url = `https://evpitch.com/alljobs/${id}`;
const job = {
  title: 'Junior Social Media Content Creator (6 Months FTC)',
  companyId: { cname: 'Elevator Video Pitch' }, location: 'Nigeria',
  description: '<p>Create &amp; publish social media content.</p>',
  adminApprove: true, jobApprove: 'approved', status: 'active',
  deadline: '2099-10-31T23:59:59.999Z',
};
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
function serve(data = job) {
  global.fetch = async () => new Response(JSON.stringify({ success: true, data }));
}

test('a copied job URL has its own title, canonical, social metadata and public image', async () => {
  serve();
  const result = await getJobMetadata(id, api);
  assert.deepEqual(result.title, { absolute: `${job.title} | EVPitch` });
  assert.equal(result.alternates.canonical, url);
  assert.equal(result.openGraph.url, url);
  assert.equal(result.openGraph.title, job.title);
  assert.equal(result.twitter.title, job.title);
  assert.equal(result.description, 'Elevator Video Pitch - Nigeria Create & publish social media content.');
  assert.equal(result.openGraph.description, result.description);
  assert.equal(result.twitter.description, result.description);
  assert.equal(result.openGraph.images[0].url, 'https://evpitch.com/assets/evp-logo.jpg');
  assert.equal(result.twitter.images[0], result.openGraph.images[0].url);
});

test('an approved title update is read afresh without authentication', async () => {
  const requests = [];
  let title = job.title;
  global.fetch = async (requestUrl, options) => {
    requests.push({ requestUrl, options });
    return new Response(JSON.stringify({ success: true, data: { ...job, title } }));
  };
  assert.equal((await getJobMetadata(id, `${api}/`)).openGraph.title, title);
  title = 'Updated approved title';
  assert.equal((await getJobMetadata(id, api)).openGraph.title, title);
  assert.equal(requests.length, 2);
  for (const request of requests) {
    assert.equal(request.requestUrl, `${api}/jobs/${id}`);
    assert.equal(request.options.cache, 'no-store');
    assert.ok(request.options.signal instanceof AbortSignal);
    assert.equal(request.options.headers, undefined);
  }
});

test('an expired link retains the job title and describes the closure', async () => {
  serve({ ...job, deadline: '2020-01-01', status: 'active' });
  const result = await getJobMetadata(id, api);
  assert.equal(result.openGraph.title, job.title);
  assert.match(result.description, /^This job has expired and is no longer accepting applications\./);
});

test('rich HTML, entities, scripts and oversized descriptions produce bounded plain text', async () => {
  serve({ ...job, title: 'Engineer &amp; Supervisor &#35;1',
    description: '<script>private()</script><style>hidden</style><p>Build&nbsp; &quot;tools&quot; &#x26; systems. </p>'.repeat(30) });
  const result = await getJobMetadata(id, api);
  assert.equal(result.openGraph.title, 'Engineer & Supervisor #1');
  assert.ok(result.description.length <= 200);
  assert.match(result.description, /Build "tools" & systems/);
  assert.doesNotMatch(result.description, /private|hidden|<p>|&nbsp;/);
});

test('invalid IDs and missing API configuration do not perform requests', async () => {
  global.fetch = async () => assert.fail('Unexpected API request');
  for (const [jobId, base] of [['../private', api], [id, '']]) {
    const result = await getJobMetadata(jobId, base);
    assert.equal(result.openGraph.title, 'Job unavailable');
    assert.equal(result.robots.index, false);
    assert.equal(result.alternates.canonical, `https://evpitch.com/alljobs/${encodeURIComponent(jobId)}`);
  }
});

test('missing jobs, invalid API responses and timeouts fall back without breaking rendering', async () => {
  for (const response of [
    () => new Response('', { status: 404 }),
    () => new Response('invalid json'),
    () => new Response(JSON.stringify({ success: false, data: job })),
    () => new Response(JSON.stringify({ success: true, data: null })),
    () => new Response(JSON.stringify({ success: true, data: { title: 42 } })),
    () => { throw new DOMException('Timed out', 'TimeoutError'); },
  ]) {
    global.fetch = async () => response();
    const result = await getJobMetadata(id, api);
    assert.equal(result.openGraph.title, 'Job unavailable');
    assert.equal(result.alternates.canonical, url);
    assert.equal(result.robots.index, false);
  }
});

test('unapproved edits are not advertised by public previews', async () => {
  for (const patch of [{ adminApprove: false }, { jobApprove: 'pending' }, { jobApprove: 'denied' }]) {
    serve({ ...job, ...patch });
    const result = await getJobMetadata(id, api);
    assert.equal(result.openGraph.title, 'Job unavailable');
    assert.equal(result.robots.index, false);
    assert.doesNotMatch(result.description, /social media/);
  }
});

test('client navigation preserves server job titles and still names the jobs list', () => {
  let pathname;
  const originalDocument = global.document;
  global.document = { title: `${job.title} | EVPitch` };
  const { DynamicTitle } = load('components/DynamicTitle.tsx', {
    react: { useEffect: callback => callback() },
    'next/navigation': { usePathname: () => pathname },
  });
  try {
    pathname = `/alljobs/${id}`;
    DynamicTitle();
    assert.equal(document.title, `${job.title} | EVPitch`);
    pathname = '/alljobs';
    DynamicTitle();
    assert.equal(document.title, 'All Jobs | Elevator Video Pitch');
  } finally {
    global.document = originalDocument;
  }
});
