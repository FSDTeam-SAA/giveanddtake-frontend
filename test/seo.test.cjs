const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const modules = new Map();
function load(file) {
  const filename = path.resolve(__dirname, '..', file);
  if (modules.has(filename)) return modules.get(filename).exports;
  const compiled = new Module(filename, module);
  modules.set(filename, compiled);
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  compiled.require = name => name.startsWith('@/')
    ? load(`${name.slice(2)}.ts`)
    : Module.prototype.require.call(compiled, name);
  compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText, filename);
  return compiled.exports;
}
const seo = load('lib/seo.ts');
const { getBlogMetadata } = load('lib/blog-metadata.ts');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const api = 'https://api.example.test/api/v1';
const blog = {
  slug: 'creating-your-video-pitch',
  title: 'Create &amp; Share Your Pitch',
  description: '<p>Show recruiters your skills &amp; experience.</p>',
  image: 'https://images.example.test/cover.png',
};

test('each public page advertises its own URL and matching page-specific sharing metadata', () => {
  const titles = new Set();
  for (const route of Object.keys(seo.PUBLIC_PAGE_SEO)) {
    const result = seo.getPublicPageMetadata(route);
    assert.equal(result.alternates.canonical, `${seo.SITE_URL}${route}`);
    assert.equal(result.openGraph.url, result.alternates.canonical);
    assert.equal(result.openGraph.title, result.title.absolute);
    assert.equal(result.twitter.description, result.description);
    assert.ok(result.description.length > 20);
    assert.ok(!result.robots, 'public pages retain the inherited indexable policy');
    titles.add(result.title.absolute);
  }
  assert.equal(titles.size, Object.keys(seo.PUBLIC_PAGE_SEO).length);
});

test('internal routes explicitly exclude indexing for Google and other crawlers', () => {
  for (const title of Object.values(seo.INTERNAL_PAGE_TITLES)) {
    const result = seo.getInternalPageMetadata(title);
    assert.equal(result.robots.index, false);
    assert.equal(result.robots.googleBot.index, false);
    assert.equal(result.robots.follow, true);
    assert.equal(result.alternates, undefined, 'internal pages do not claim the homepage canonical');
  }
});

test('browser title fallback respects server metadata during route navigation', () => {
  for (const route of Object.keys(seo.PUBLIC_PAGE_SEO)) assert.equal(seo.hasServerPageTitle(route), true);
  for (const route of ['/blogs/a-post', '/blog-details/id', '/pages/a-page', '/alljobs/id']) {
    assert.equal(seo.hasServerPageTitle(route), true);
  }
  assert.equal(seo.hasServerPageTitle('/cp/public-profile'), false);
  assert.equal(seo.hasServerPageTitle('/blogs-other'), false);
});

test('article ID links identify the current slug and generate plain-text preview metadata', async () => {
  const requests = [];
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify({ success: true, data: blog }));
  };
  const result = await getBlogMetadata('6924ad61a27c2437593aaab1', `${api}/`);
  assert.equal(result.alternates.canonical, `${seo.SITE_URL}/blogs/${blog.slug}`);
  assert.equal(result.openGraph.url, result.alternates.canonical);
  assert.equal(result.title.absolute, `Create & Share Your Pitch | ${seo.SITE_NAME}`);
  assert.equal(result.description, 'Show recruiters your skills & experience.');
  assert.equal(result.openGraph.type, 'article');
  assert.equal(result.openGraph.images[0].url, blog.image);
  assert.equal(requests[0].url, `${api}/blogs/6924ad61a27c2437593aaab1`);
  assert.equal(requests[0].options.method, undefined, 'uses the existing GET endpoint');
  assert.equal(requests[0].options.headers, undefined, 'requires no session or API contract change');
  assert.ok(requests[0].options.signal instanceof AbortSignal);
});

test('only confirmed missing articles receive noindex; server errors keep the page available', async () => {
  global.fetch = async () => new Response('', { status: 404 });
  const missing = await getBlogMetadata('missing', api);
  assert.equal(missing.robots.index, false);
  assert.equal(missing.robots.googleBot.index, false);
  global.fetch = async () => new Response('', { status: 503 });
  const temporary = await getBlogMetadata('real-post', api);
  assert.equal(temporary.robots, undefined);
  assert.equal(temporary.alternates.canonical, `${seo.SITE_URL}/blogs/real-post`);
});

test('timeouts, malformed responses and missing API configuration do not prevent article rendering', async () => {
  global.fetch = async () => { throw new Error('Timed out'); };
  assert.equal((await getBlogMetadata('real-post', api)).robots, undefined);
  global.fetch = async () => new Response('{ invalid json');
  assert.equal((await getBlogMetadata('real-post', api)).robots, undefined);
  global.fetch = async () => { throw new Error('Must not fetch'); };
  assert.equal((await getBlogMetadata('real-post', '')).alternates.canonical, `${seo.SITE_URL}/blogs/real-post`);
});

test('article text is bounded and invalid sharing image protocols are omitted', async () => {
  global.fetch = async () => new Response(JSON.stringify({ success: true, data: {
    ...blog, title: '<b>Pitch</b>', description: '<script>ignore()</script>' + 'word '.repeat(100), image: 'javascript:alert(1)',
  } }));
  const result = await getBlogMetadata('post with spaces', api);
  assert.equal(result.title.absolute, `Pitch | ${seo.SITE_NAME}`);
  assert.ok(result.description.length <= 160);
  assert.ok(!result.description.includes('ignore'));
  assert.equal(result.openGraph.images, undefined);
  assert.equal(result.twitter.card, 'summary');
  assert.equal(seo.metadataText('&#x1f600; &nbsp; &#169;'), '😀 ©');
});

test('sitemap omits invented modification dates while preserving real article/job timestamps', async () => {
  const saved = process.env.NEXT_PUBLIC_BASE_URL;
  process.env.NEXT_PUBLIC_BASE_URL = api;
  try {
    global.fetch = async url => new Response(JSON.stringify({ data:
      url.includes('/jobs?') ? { jobs: [{ _id: 'job-id', updatedAt: '2026-10-01T00:00:00Z' }] } :
      url.includes('/blogs/get-all?') ? { blogs: [{ slug: 'article', createdAt: '2026-09-01T00:00:00Z' }] } :
      [{ type: 'custom-page', isSystem: false }],
    }));
    const { default: sitemap } = load('app/sitemap.ts');
    const result = await sitemap();
    assert.equal(result.find(item => item.url.endsWith('/about-us')).lastModified, undefined);
    assert.equal(result.find(item => item.url.endsWith('/alljobs/job-id')).lastModified, '2026-10-01T00:00:00Z');
    assert.equal(result.find(item => item.url.endsWith('/blogs/article')).lastModified, '2026-09-01T00:00:00Z');
    assert.equal(result.find(item => item.url.endsWith('/pages/custom-page')).lastModified, undefined);
  } finally {
    if (saved === undefined) delete process.env.NEXT_PUBLIC_BASE_URL;
    else process.env.NEXT_PUBLIC_BASE_URL = saved;
  }
});
