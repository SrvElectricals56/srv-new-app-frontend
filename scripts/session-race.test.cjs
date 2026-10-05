const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const source = fs.readFileSync(path.resolve(__dirname, '../src/shared/api/client.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const response = (status, body = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

function clientFor(fetchImpl) {
  const session = { access: 'old-access', refresh: 'old-refresh', clears: 0, events: 0 };
  const storage = {
    getAccessToken: async () => session.access,
    getRefreshToken: async () => session.refresh,
    setTokens: async (access, refresh) => { session.access = access; session.refresh = refresh; },
    clearAll: async () => { session.access = null; session.refresh = null; session.clears += 1; },
  };
  const module = { exports: {} };
  const requireMock = name => {
    if (name === './config') return { API_BASE_URL: 'https://qa.invalid', API_BASE_URLS: ['https://qa.invalid'] };
    if (name === './storage') return { storage };
    if (name === './sessionEvents') return { sessionEvents: { emitExpired: () => { session.events += 1; } } };
    throw new Error(`Unexpected import: ${name}`);
  };
  new Function('require', 'module', 'exports', 'fetch', '__DEV__', compiled)(requireMock, module, module.exports, fetchImpl, false);
  return { api: module.exports.api, session };
}

test('temporary refresh server failure keeps the signed-in session', async () => {
  const { api, session } = clientFor(async (url) => url.endsWith('/mobile/auth/refresh')
    ? response(500, { message: 'Temporary server error' })
    : response(401));
  await assert.rejects(() => api.get('/private', undefined, true), error => error.status === 500);
  assert.equal(session.access, 'old-access');
  assert.equal(session.refresh, 'old-refresh');
  assert.equal(session.clears, 0);
  assert.equal(session.events, 0);
});

test('an old refresh rejection cannot clear a newer signup session', async () => {
  let session;
  const state = clientFor(async (url) => {
    if (url.endsWith('/mobile/auth/refresh')) {
      session.access = 'new-access';
      session.refresh = 'new-refresh';
      return response(401);
    }
    return response(401);
  });
  session = state.session;
  await assert.rejects(() => state.api.get('/private', undefined, true), /SESSION_EXPIRED/);
  assert.equal(session.access, 'new-access');
  assert.equal(session.refresh, 'new-refresh');
  assert.equal(session.clears, 0);
  assert.equal(session.events, 0);
});
