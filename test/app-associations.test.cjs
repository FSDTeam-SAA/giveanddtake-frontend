const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

function load(file) {
  const filename = path.resolve(__dirname, '..', file);
  const compiled = new Module(filename, module);
  compiled.filename = filename;
  compiled.paths = Module._nodeModulePaths(path.dirname(filename));
  compiled.require = name => name.startsWith('@/')
    ? load(`${name.slice(2)}.ts`)
    : Module.prototype.require.call(compiled, name);
  compiled._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
    },
  }).outputText, filename);
  return compiled.exports;
}
const { androidAssociationResponse, appleAssociationResponse } = load('lib/app-associations.ts');
const statements = [{
  relation: ['delegate_permission/common.handle_all_urls'],
  target: {
    namespace: 'android_app',
    package_name: 'com.evpitchrecruitment.careers',
    sha256_cert_fingerprints: [Array(32).fill('AB').join(':')],
  },
}];

test('Android verification serves the configured signing association as JSON without a redirect', async () => {
  const response = androidAssociationResponse(JSON.stringify(statements));
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^application\/json/);
  assert.equal(response.headers.get('location'), null);
  assert.deepEqual(await response.json(), statements);
});

test('the production default uses the owner-supplied Play certificate and published package', async () => {
  const response = androidAssociationResponse();
  assert.equal(response.status, 200);
  const [statement] = await response.json();
  assert.equal(statement.target.package_name, 'com.evpitchrecruitment.careers');
  assert.deepEqual(statement.target.sha256_cert_fingerprints, [
    'C1:6A:73:85:95:5C:FC:E8:BC:12:EE:4D:6B:62:BC:69:38:E7:62:B6:76:15:EE:B7:0F:58:8A:76:ED:B4:51:2C',
  ]);
});

test('missing or invalid signing configuration never returns a cacheable verification success', () => {
  for (const raw of ['', '{', '[]', '{}', JSON.stringify([{}]), JSON.stringify([{
    ...statements[0], target: { ...statements[0].target, sha256_cert_fingerprints: ['upload-key'] },
  }])]) {
    const response = androidAssociationResponse(raw);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  }
});

test('multiple Play signing fingerprints survive certificate rotation', async () => {
  const rotated = structuredClone(statements);
  rotated[0].target.sha256_cert_fingerprints.push(Array(32).fill('CD').join(':'));
  assert.deepEqual(await androidAssociationResponse(JSON.stringify(rotated)).json(), rotated);
});

test('iOS association is limited to the implemented content and job links', async () => {
  const response = appleAssociationResponse('3XK4GQ9A6R.com.pooelcentral.giveandtake');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /^application\/json/);
  assert.equal(response.headers.get('location'), null);
  assert.deepEqual(await response.json(), {
    applinks: { apps: [], details: [{
      appID: '3XK4GQ9A6R.com.pooelcentral.giveandtake', paths: ['/pages/*', '/alljobs/*'],
    }] },
  });
  assert.equal(appleAssociationResponse('').status, 503);
  assert.equal(appleAssociationResponse('wrong-prefix.com.app').status, 503);
});

test('all public association route handlers return JSON directly', async () => {
  const previous = process.env.ANDROID_APP_LINKS_JSON;
  process.env.ANDROID_APP_LINKS_JSON = JSON.stringify(statements);
  try {
    for (const route of [
      'app/.well-known/assetlinks.json/route.ts',
      'app/.well-known/apple-app-site-association/route.ts',
      'app/apple-app-site-association/route.ts',
    ]) {
      const response = load(route).GET();
      assert.equal(response.status, 200, route);
      assert.match(response.headers.get('content-type'), /^application\/json/, route);
      assert.equal(response.headers.get('location'), null, route);
      await response.json();
    }
  } finally {
    if (previous === undefined) delete process.env.ANDROID_APP_LINKS_JSON;
    else process.env.ANDROID_APP_LINKS_JSON = previous;
  }
});
