const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function authConfig(fetch) {
  let config;
  const file = path.resolve(__dirname, '../app/api/auth/[...nextauth]/route.ts');
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  vm.runInNewContext(outputText, { exports: {}, Buffer, console, fetch,
    process: { env: { NEXT_PUBLIC_BASE_URL: 'https://test.invalid/api/v1' } },
    require: name => ({
      'next-auth/next': value => { config = value; return {}; },
      'next-auth/providers/credentials': value => value,
      'next-auth/jwt': { encode: async value => value, decode: async value => value },
    }[name]),
  });
  return config;
}
const accessToken = exp => `header.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.signature`;

test('Remember me and normalized email reach the backend; refresh token stays server-side', async () => {
  let loginBody;
  const deadline = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
  const config = authConfig(async (_, request) => {
    loginBody = JSON.parse(request.body);
    return { ok: true, json: async () => ({ success: true, data: {
      _id: 'user', role: 'candidate', email: 'test@mail.com',
      accessToken: accessToken(deadline), refreshToken: 'refresh-secret', sessionExpiresAt: deadline,
    } }) };
  });
  const user = await config.providers[0].authorize({ email: ' Test@Mail.com ', password: 'Password123!', rememberMe: 'true' });
  assert.equal(loginBody.email, 'test@mail.com');
  assert.equal(loginBody.rememberMe, true);
  const token = await config.callbacks.jwt({ token: {}, user });
  const session = await config.callbacks.session({ session: { user: {} }, token });
  assert.equal(session.sessionExpiresAt, deadline * 1000);
  assert.equal(session.refreshToken, undefined);
  assert.equal(token.refreshToken, 'refresh-secret');
});

test('parallel actions renew an expired access token once, without extending the session', async () => {
  let requests = 0;
  const deadline = Date.now() + 3600_000;
  const freshAccess = accessToken(Math.floor(Date.now() / 1000) + 900);
  const config = authConfig(async () => {
    requests++;
    await new Promise(resolve => setTimeout(resolve, 10));
    return { ok: true, json: async () => ({ success: true, data: { accessToken: freshAccess, refreshToken: 'new-refresh' } }) };
  });
  const token = { accessToken: 'old', refreshToken: 'refresh', sessionExpiresAt: deadline, accessExpiresAt: 0 };
  const results = await Promise.all(Array.from({ length: 3 }, () => config.callbacks.jwt({ token: { ...token } })));
  assert.equal(requests, 1);
  for (const result of results) {
    assert.equal(result.accessToken, freshAccess);
    assert.equal(result.sessionExpiresAt, deadline);
  }
});

test('an expired session cannot be revived by refreshing its access token', async () => {
  const config = authConfig(() => assert.fail('expired sessions must not refresh'));
  const token = await config.callbacks.jwt({ token: {
    sessionExpiresAt: Date.now() - 1, refreshToken: 'old-refresh', accessToken: 'old-access',
  } });
  assert.equal(token.error, 'SessionExpired');
  assert.equal(token.accessToken, undefined);
});

test('temporary backend failures keep the current work available for a retry', async () => {
  const config = authConfig(async () => ({ ok: false, status: 503, json: async () => ({}) }));
  const token = await config.callbacks.jwt({ token: {
    sessionExpiresAt: Date.now() + 3600_000, refreshToken: 'refresh', accessToken: 'old', accessExpiresAt: 0,
  } });
  assert.equal(token.error, 'RefreshUnavailable');
  assert.equal(token.refreshToken, 'refresh');
});

test('rejected refresh tokens require signing in again', async () => {
  const config = authConfig(async () => ({ ok: false, status: 401, json: async () => ({}) }));
  const token = await config.callbacks.jwt({ token: {
    sessionExpiresAt: Date.now() + 3600_000, refreshToken: 'refresh', accessToken: 'old', accessExpiresAt: 0,
  } });
  assert.equal(token.error, 'SessionExpired');
  assert.equal(token.accessToken, undefined);
});

test('the encrypted session JWT retains its absolute expiry when it is reissued', async () => {
  const config = authConfig(() => assert.fail('no network expected'));
  const sessionExpiresAt = Date.now() + 120_000;
  const encoded = await config.jwt.encode({ token: { sessionExpiresAt }, maxAge: 30 * 24 * 3600 });
  assert.ok(encoded.maxAge > 118 && encoded.maxAge <= 120);
});
