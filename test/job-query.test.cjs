const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { QueryClient, QueryObserver, focusManager } = require('@tanstack/query-core');

const filename = path.resolve(__dirname, '../lib/job-query.ts');
const compiled = new Module(filename, module);
compiled.paths = Module._nodeModulePaths(path.dirname(filename));
compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText, filename);
const { jobQueryOptions } = compiled.exports;

const originalFetch = global.fetch;
const clients = [];
afterEach(() => {
  global.fetch = originalFetch;
  for (const client of clients.splice(0)) { client.unmount(); client.clear(); }
  focusManager.setFocused(undefined);
});

function createClient() {
  const client = new QueryClient({ defaultOptions: { queries: {
    staleTime: 300_000, gcTime: 86_400_000, refetchOnMount: false,
    refetchOnWindowFocus: false, refetchOnReconnect: false, retry: false,
  } } });
  client.mount();
  clients.push(client);
  return client;
}
function response(job) {
  return { success: true, message: 'Job fetched successfully', data: job };
}
function serveJob(job, requests) {
  global.fetch = async (url, options) => {
    requests.push({ url, options });
    return new Response(JSON.stringify(response(job)), { status: 200 });
  };
}
async function until(condition) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (condition()) return;
    await new Promise(resolve => setTimeout(resolve, 5));
  }
  assert.fail('Query did not reach the expected state');
}

test('edit selection leaves the shared response intact for details and application pages', async () => {
  const client = createClient();
  const requests = [];
  const job = { _id: 'job-1', title: 'Renewed job', applicationRequirement: [] };
  serveJob(job, requests);
  const options = jobQueryOptions('job-1', 'https://api.example.test');
  const editor = new QueryObserver(client, { ...options, select: result => result.data });
  const stopEditor = editor.subscribe(() => {});
  await until(() => editor.getCurrentResult().isSuccess);
  assert.deepEqual(editor.getCurrentResult().data, job);
  assert.deepEqual(client.getQueryData(options.queryKey), response(job));
  stopEditor();

  // Editing updates the shared cache with the complete API response.
  client.setQueryData(options.queryKey, response({ ...job, title: 'Updated title' }));
  const details = new QueryObserver(client, options);
  const stopDetails = details.subscribe(() => {});
  assert.equal(details.getCurrentResult().data.data.title, 'Updated title');
  await until(() => !details.getCurrentResult().isFetching);
  assert.deepEqual(details.getCurrentResult().data.data.applicationRequirement, []);
  stopDetails();

  const application = new QueryObserver(client, options);
  const stopApplication = application.subscribe(() => {});
  await until(() => !application.getCurrentResult().isFetching);
  assert.equal(application.getCurrentResult().data.data._id, 'job-1');
  stopApplication();
});

test('opening details fetches approval changes even when the previous cache is fresh', async () => {
  const client = createClient();
  const requests = [];
  const options = jobQueryOptions('job-2', 'https://api.example.test');
  client.setQueryData(options.queryKey, response({ _id: 'job-2', displayStatus: 'expired' }));
  serveJob({ _id: 'job-2', displayStatus: 'published' }, requests);
  const observer = new QueryObserver(client, options);
  const stop = observer.subscribe(() => {});
  await until(() => observer.getCurrentResult().data.data.displayStatus === 'published');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].options.cache, 'no-store');
  assert.ok(requests[0].options.signal instanceof AbortSignal);
  stop();
});

test('invalidated inactive details refetch on navigation despite global refetchOnMount false', async () => {
  const client = createClient();
  const options = jobQueryOptions('job-3', 'https://api.example.test');
  client.setQueryData(options.queryKey, response({ _id: 'job-3', title: 'Old details' }));
  await client.invalidateQueries({ queryKey: ['job'] });
  serveJob({ _id: 'job-3', title: 'Latest details' }, []);
  const observer = new QueryObserver(client, options);
  const stop = observer.subscribe(() => {});
  await until(() => observer.getCurrentResult().data.data.title === 'Latest details');
  stop();
});

test('returning from admin refreshes an already open details page', async () => {
  const client = createClient();
  const options = jobQueryOptions('job-4', 'https://api.example.test');
  serveJob({ _id: 'job-4', displayStatus: 'pending' }, []);
  const observer = new QueryObserver(client, options);
  const stop = observer.subscribe(() => {});
  await until(() => observer.getCurrentResult().isSuccess);
  focusManager.setFocused(false);
  serveJob({ _id: 'job-4', displayStatus: 'published' }, []);
  focusManager.setFocused(true);
  await until(() => observer.getCurrentResult().data.data.displayStatus === 'published');
  stop();
});

test('failed and empty responses are rejected instead of caching missing job data', async () => {
  const client = createClient();
  global.fetch = async () => new Response(JSON.stringify({ success: false, message: 'Job unavailable' }));
  await assert.rejects(client.fetchQuery(jobQueryOptions('missing', 'https://api.example.test')), /Job unavailable/);
  global.fetch = async () => new Response(JSON.stringify({ success: true, data: null }));
  await assert.rejects(client.fetchQuery(jobQueryOptions('empty', 'https://api.example.test')), /Failed to fetch job details/);
  global.fetch = async () => new Response('', { status: 404 });
  await assert.rejects(client.fetchQuery(jobQueryOptions('not-found', 'https://api.example.test')), /HTTP 404/);
});
