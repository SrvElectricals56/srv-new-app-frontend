const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.resolve(__dirname, '..');
const cache = new Map();
const alerts = [];
const requests = [];
const Native = {
  Text: React.forwardRef(({ children, accessibilityLabel }, ref) => React.createElement('span', { ref, 'aria-label': accessibilityLabel }, children)),
  TextInput: React.forwardRef(({ placeholder, value }, ref) => React.createElement('input', { ref, placeholder, value, readOnly: true })),
  Alert: { alert: (...args) => alerts.push(args) },
  Animated: { createAnimatedComponent: component => component },
};
function load(relative) {
  let file = path.resolve(root, relative);
  if (!path.extname(file)) file = fs.existsSync(file+'.ts') ? file+'.ts' : fs.existsSync(file+'.tsx') ? file+'.tsx' : path.join(file, 'index.tsx');
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const localRequire = name => {
    if (file.endsWith('services.ts') && name === './client') return { api: { patch: async (...args) => { requests.push(args); return {}; } } };
    if (file.endsWith('services.ts') && name === './config') return { API_BASE_URL: 'https://example.invalid/api/v1' };
    if (file.endsWith('services.ts') && name === './storage') return { storage: {} };
    if (file.endsWith('services.ts') && name === './sessionEvents') return { sessionEvents: {} };
    if (name === 'react-native') return Native;
    if (name === '@/features/counterboy/theme') return { counterboyTheme: { heroLight: [], heroDark: [] } };
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name));
    return require(name);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}
const { uniqueWalletTransactions } = load('src/shared/utils/walletTransactions.ts');
test('profile API preserves the verified phone proof while dropping unrelated privileged fields', async () => {
  const { authApi } = load('src/shared/api/services.ts');
  await authApi.updateProfile({ phone: '9812345678', phoneVerificationToken: 'signed-proof', totalPoints: 999, status: 'active' });
  assert.deepEqual(requests.at(-1), ['/mobile/auth/profile', { phone: '9812345678', phoneVerificationToken: 'signed-proof' }, true]);
});
test('wallet ledger removes repeated IDs, preserves equal-valued distinct payments, and sorts newest first', () => {
  const a = { id: 'a', points: 20, rawDate: '2026-09-01T12:00:00Z' };
  const b = { id: 'b', points: 20, rawDate: '2026-09-02T12:00:00Z' };
  const c = { id: 'c', points: -20, rawDate: '2026-09-03T12:00:00Z' };
  assert.deepEqual(uniqueWalletTransactions([a, b, a, c, b, c]).map(row => row.id), ['c', 'b', 'a']);
  assert.deepEqual(uniqueWalletTransactions([]), []);
});
const { decodePngQr } = load('src/shared/utils/decodePngQr.ts');
for (const fixture of ['normal', 'small', 'transparent', 'rotated', 'label']) test(`gallery QR fallback decodes ${fixture} PNG`, () => {
  assert.equal(decodePngQr(fs.readFileSync(path.join(__dirname, 'fixtures', `qr-${fixture}.png`))), 'SRV-QA-20260908-CLEAR-QR');
});
const prefs = load('src/shared/preferences/index.tsx');
const native = load('src/shared/preferences/LocalizedNative.tsx');
test('English resolves existing symbolic UI keys instead of displaying the key name', () => {
  assert.equal(prefs.translateUiText('English', 'tapToChangePhoto'), 'Tap to Change Photo');
  assert.equal(prefs.translateUiText('English', 'myProfile'), 'My Profile');
  assert.equal(prefs.translateUiText('English', 'Manjeet Singh'), 'Manjeet Singh');
});
for (const language of ['Hindi', 'Punjabi']) {
  test(`${language}: shared text, inputs, nested labels, and named translations update without changing entered data`, () => {
    const tx = text => prefs.translateUiText(language, text);
    const markup = renderToStaticMarkup(React.createElement(prefs.PreferenceContext.Provider, { value: { language, tx } },
      React.createElement(React.Fragment, null,
        React.createElement(native.LocalizedText, null, 'Verify Phone Number'),
        React.createElement(native.LocalizedText, null, ['My Profile', React.createElement(native.LocalizedText, { key: 'nested' }, 'Gift Store')]),
        React.createElement(native.LocalizedTextInput, { placeholder: 'Enter OTP', value: 'Manjeet Singh' }))));
    assert(!markup.includes('Verify Phone Number')); assert(!markup.includes('My Profile')); assert(!markup.includes('Enter OTP'));
    assert(markup.includes('Manjeet Singh'));
    assert.equal(tx('  My   Profile  ').trim(), tx('My Profile'));
    assert.equal(tx('9001234567'), '9001234567');
    assert.equal(tx('SRV-ITEM-ABC'), 'SRV-ITEM-ABC');
  });
  test(`${language}: every reviewed audit string has a catalog entry`, () => {
    const catalog = load('src/shared/preferences/auditUiText.ts').auditUiText[language];
    for (const [key, value] of Object.entries(catalog)) assert.equal(prefs.translateUiText(language, key).trim(), value, key);
  });
}
