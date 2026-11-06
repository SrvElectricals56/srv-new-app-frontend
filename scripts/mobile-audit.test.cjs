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
  Platform: { OS: 'android' },
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
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { fileName: file, compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const localRequire = name => {
    if (file.endsWith('launcherIcon.ts') && name === 'expo-constants') return {
      __esModule: true,
      default: { appOwnership: null, executionEnvironment: 'standalone' },
    };
    if (file.endsWith('launcherIcon.ts') && name === 'expo-modules-core') return {
      requireOptionalNativeModule: () => null,
    };
    if (file.endsWith('launcherIcon.ts') && name === 'expo-awesome-app-icon') {
      throw new Error('The launcher icon package must not load without its native module');
    }
    if (file.endsWith('client.ts') && name === './config') return { API_BASE_URL: 'https://example.invalid/api/v1', API_BASE_URLS: ['https://example.invalid/api/v1'] };
    if (file.endsWith('client.ts') && name === './storage') return { storage: { getAccessToken: async () => 'test-token' } };
    if (file.endsWith('client.ts') && name === './sessionEvents') return { sessionEvents: { emitExpired() {} } };
    if (file.endsWith('services.ts') && name === './client') return { api: { patch: async (...args) => { requests.push(args); return {}; } } };
    if (file.endsWith('services.ts') && name === './config') return { API_BASE_URL: 'https://example.invalid/api/v1', API_BASE_URLS: ['https://example.invalid/api/v1', 'https://backup.example.invalid/api/v1'] };
    if (file.endsWith('services.ts') && name === './storage') return { storage: { getAccessToken: async () => 'test-token' } };
    if (file.endsWith('services.ts') && name === './sessionEvents') return { sessionEvents: {} };
    if (file.endsWith('services.ts') && name === 'expo-file-system') return {
      File: class ExpoFile extends Blob {
        constructor(uri) {
          super([]);
          Object.defineProperty(this, 'uri', { value: uri });
          Object.defineProperty(this, 'name', { value: String(uri).split('/').pop() || 'upload.bin' });
        }
        async upload(url, options = {}) {
          const response = await global.fetch(url, { method: options.httpMethod || 'POST', headers: options.headers, body: this });
          return { status: response.status, body: await response.text(), headers: {} };
        }
      },
      UploadType: { BINARY_CONTENT: 0, MULTIPART: 1 },
    };
    if (file.endsWith('config.ts') && name === 'expo-constants') return { expoConfig: {} };
    if (name === 'expo-image-manipulator') return {
      SaveFormat: { JPEG: 'jpeg' },
      ImageManipulator: { manipulate: () => ({ renderAsync: async () => ({ saveAsync: async () => ({ uri: 'file:///converted.jpg' }) }) }) },
    };
    if (name === 'react-native') return Native;
    if (name === '@/features/counterboy/theme') return { counterboyTheme: { heroLight: [], heroDark: [] } };
    if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name));
    return require(name);
  };
  new Function('require', 'module', 'exports', code)(localRequire, module, module.exports);
  return module.exports;
}
const { uniqueWalletTransactions } = load('src/shared/utils/walletTransactions.ts');
const { describeKycFile, prepareKycUpload, KYC_MAX_FILE_SIZE } = load('src/features/profile/lib/kycUpload.ts');
const { getSpeechProfile, prepareSpeechText, selectBestSpeechVoice } = load('src/shared/utils/nativeSpeech.ts');

test('SRV Chat prepares native Hindi and Punjabi speech and selects an enhanced matching voice', () => {
  const voices = [
    { identifier: 'pa-default', language: 'pa_IN', name: 'Punjabi', quality: 'Default' },
    { identifier: 'pa-enhanced', language: 'pa-IN', name: 'Punjabi Enhanced', quality: 'Enhanced' },
    { identifier: 'hi-enhanced', language: 'hi-IN', name: 'Hindi Enhanced', quality: 'Enhanced' },
  ];
  assert.equal(selectBestSpeechVoice(voices, 'Punjabi').identifier, 'pa-enhanced');
  assert.equal(selectBestSpeechVoice(voices, 'Hindi').identifier, 'hi-enhanced');
  assert.equal(selectBestSpeechVoice(voices, 'English'), undefined);
  assert.equal(getSpeechProfile('Punjabi').locale, 'pa-IN');
  assert.equal(prepareSpeechText('**SRV** QR ਲਈ ₹120 ਅਤੇ 10%', 'Punjabi'), 'ਐਸ ਆਰ ਵੀ ਕਿਊ ਆਰ ਲਈ 120 ਰੁਪਏ ਅਤੇ 10 ਫੀਸਦੀ');
  assert.equal(prepareSpeechText('SRV QR के लिए ₹120 और 10%', 'Hindi'), 'एस आर वी क्यू आर के लिए 120 रुपये और 10 प्रतिशत');
});

test('SRV Chat voice mode uses Expo 58 uploads and resumes listening after each spoken reply', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'shared', 'components', 'SrvChat.tsx'), 'utf8');
  assert.match(source, /import \{ File as ExpoFile, UploadType \} from 'expo-file-system'/);
  assert.match(source, /new ExpoFile\(uri\)\.upload\(endpoint/);
  assert.match(source, /uploadType: UploadType\.MULTIPART/);
  assert.doesNotMatch(source, /form\.append\('file', \{ uri,/);
  assert.match(source, /setVoiceModeVisible\(true\)/);
  assert.match(source, /async function startVoiceListening\(\)/);
  assert.match(source, /async function finishVoiceTurn\(\)/);
  assert.match(source, /function speakVoiceReply\(text: string\)/);
  assert.match(source, /onDone: finishSpeech/);
  assert.match(source, /setTimeout\(\(\) => \{ void startVoiceListening\(\); \}, 350\)/);
  assert.match(source, /testID="srv-chat-voice-orb"/);
  assert.match(source, /testID="srv-chat-voice-pause"/);
  assert.match(source, /testID="srv-chat-voice-end"/);
  assert.match(source, /voiceMode: true/);
  assert.match(source, /keyboardDismissMode=\{Platform\.OS === 'ios' \? 'interactive' : 'on-drag'\}/);
});

test('KYC lets every role submit either Aadhaar or PAN while preserving dealer GST', () => {
  const kyc = fs.readFileSync(path.join(root, 'src', 'features', 'profile', 'screens', 'KYCVerificationScreen.tsx'), 'utf8');
  assert.match(kyc, /hasAadhar \|\| hasPan \|\| \(isDealer && hasGst\)/);
  assert.match(kyc, /label="Aadhar Card \(Optional\)"/);
  assert.match(kyc, /label="PAN Card \(Optional\)"/);
  assert.match(kyc, /\{isDealer && \([\s\S]*?label="GST Number \(Optional\)"/);
  assert.doesNotMatch(kyc, /const kycComplete = hasAadhar &&/);
});

test('iOS and Android runtime code never requires the optional ExpoFetchModule', () => {
  for (const relative of ['src/shared/components/SrvChat.tsx', 'src/shared/api/services.ts', 'src/shared/api/realtime.ts']) {
    const source = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.doesNotMatch(source, /from ['"]expo\/fetch['"]/, relative);
  }
  const services = fs.readFileSync(path.join(root, 'src/shared/api/services.ts'), 'utf8');
  assert.match(services, /new ExpoFile\(file\.uri\)\.upload/);
});

test('every normal app launch starts on Home and does not replay a stale notification tap', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'app', 'index.tsx'), 'utf8');
  assert.match(source, /if \(!authLoading && !authResolved\)[\s\S]*?setCurrentScreen\('home'\)/);
  assert.match(source, /clearLastNotificationResponseAsync\(\)/);
  assert.doesNotMatch(source, /getLastNotificationResponseAsync\(\)/);
});

test('Expo Go and older native builds skip the launcher icon package when its native module is absent', async () => {
  const source = fs.readFileSync(path.join(root, 'src', 'shared', 'native', 'launcherIcon.ts'), 'utf8');
  assert.match(source, /executionEnvironment === 'storeClient'/);
  assert.match(source, /requireOptionalNativeModule\('AwesomeAppIcon'\)/);
  assert(source.indexOf("requireOptionalNativeModule('AwesomeAppIcon')") < source.indexOf("require('expo-awesome-app-icon')"));
  const { syncLauncherIcon } = load('src/shared/native/launcherIcon.ts');
  assert.equal(await syncLauncherIcon('diwali'), 'unsupported');
});

test('dealer and electrician signup no longer exposes or submits a referral code', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'features', 'electrician', 'screens', 'OnboardingScreen.tsx'), 'utf8');
  assert.doesNotMatch(source, /signupReferralCode|Referral Code \(Optional\)|referralCode:/);
});

test('dealer and electrician OTP inputs autofill and verify without a verify button', () => {
  const onboarding = fs.readFileSync(path.join(root, 'src', 'features', 'electrician', 'screens', 'OnboardingScreen.tsx'), 'utf8');
  const retriever = fs.readFileSync(path.join(root, 'src', 'shared', 'auth', 'useSmsOtpAutofill.ts'), 'utf8');
  assert.match(onboarding, /autoComplete=\{OTP_AUTO_COMPLETE\}/);
  assert.match(onboarding, /textContentType=\{autoComplete \? 'oneTimeCode' : undefined\}/);
  assert.match(onboarding, /importantForAutofill=\{autoComplete \? 'yes' : 'auto'\}/);
  assert.match(onboarding, /loginOtp\.length === 4\) verifyLoginOtp\(\)/);
  assert.match(onboarding, /signupOtp\.length === 4[\s\S]*?verifySignupOtp\(\)/);
  assert.match(retriever, /await retriever\.startSmsRetriever\(\)/);
  assert(retriever.indexOf('await retriever.startSmsRetriever()') < retriever.indexOf('retriever.addSmsListener'));
  assert.match(retriever, /extractOtp\(message, 4\)/);
});

test('dealer and electrician gift redemption keeps the delivery address box full width', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'features', 'electrician', 'screens', 'RewardsScreen.tsx'), 'utf8');
  assert.match(source, /addressInput:\s*\{[\s\S]*?width:\s*'100%'[\s\S]*?height:\s*96[\s\S]*?marginBottom:\s*16/);
});

test('KYC upload recognises images with missing MIME and prepares iPhone photos as JPEG', async () => {
  assert.equal(describeKycFile({ uri: 'file:///scan.png', name: 'scan.png', mimeType: null }, 'pan').type, 'image/png');
  assert.deepEqual(await prepareKycUpload({ uri: 'file:///scan.heic', name: 'scan.heic', mimeType: 'application/octet-stream' }, 'pan'), {
    uri: 'file:///converted.jpg', name: 'scan.jpg', type: 'image/jpeg',
  });
  assert.equal(describeKycFile({ uri: 'file:///scan.pdf', name: 'scan.pdf', mimeType: null }, 'pan').type, 'application/pdf');
  await assert.rejects(prepareKycUpload({ uri: 'file:///scan.pdf', name: 'scan.pdf', size: KYC_MAX_FILE_SIZE + 1 }, 'pan'), /25 MB/);
});

test('iOS KYC and bank QR pickers wait for modal dismissal and prepare iPhone images', () => {
  const dialog = fs.readFileSync(path.join(root, 'src', 'shared', 'components', 'Dialog.tsx'), 'utf8');
  const documentUpload = fs.readFileSync(path.join(root, 'src', 'features', 'profile', 'components', 'DocumentUpload.tsx'), 'utf8');
  const bankDetails = fs.readFileSync(path.join(root, 'src', 'features', 'profile', 'screens', 'BankDetailsScreen.tsx'), 'utf8');

  assert.match(dialog, /onClose\(\);[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?choice\.onPress\(\)[\s\S]*?Platform\.OS === 'ios' \? 350 : 0/);
  assert.match(documentUpload, /requestMediaLibraryPermissionsAsync\(\)/);
  assert.match(documentUpload, /copyToCacheDirectory: true/);
  assert.match(bankDetails, /requestMediaLibraryPermissionsAsync\(\)/);
  assert.match(bankDetails, /prepareKycUpload\([\s\S]*?'upi-qr-code'\)/);
  assert.match(bankDetails, /profileApi\.uploadDocument\(prepared, 'pan'\)/);
});

test('KYC upload retries a different API address when the first network address is unavailable', async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    if (calls.length === 1) throw new TypeError('Network request failed');
    return new Response(JSON.stringify({ url: '/uploads/aadhar/test-optimized.webp' }), { status: 201, headers: { 'Content-Type': 'application/json' } });
  };
  try {
    const { profileApi } = load('src/shared/api/services.ts');
    assert.equal(await profileApi.uploadDocument({ uri: 'file:///scan.png', name: 'scan.png', type: 'image/png' }, 'pan'), '/uploads/aadhar/test-optimized.webp');
    assert.equal(calls.length, 2);
    assert.notEqual(calls[0].url, calls[1].url);
    assert.equal(calls[0].options.method, 'POST');
  } finally {
    global.fetch = originalFetch;
  }
});
test('KYC document URLs follow the active API instead of an old local server', () => {
  const previousUrl = process.env.EXPO_PUBLIC_API_URL;
  const previousDev = global.__DEV__;
  process.env.EXPO_PUBLIC_API_URL = 'https://api.example.test/api/v1';
  global.__DEV__ = false;
  try {
    const { resolveImageUrl } = load('src/shared/api/config.ts');
    assert.equal(resolveImageUrl('/uploads/aadhar/test.webp'), 'https://api.example.test/uploads/aadhar/test.webp');
    assert.equal(resolveImageUrl('http://localhost:3001/uploads/aadhar/test.webp'), 'https://api.example.test/uploads/aadhar/test.webp');
    assert.equal(resolveImageUrl('http://192.168.29.8:3001/uploads/aadhar/test.webp'), 'https://api.example.test/uploads/aadhar/test.webp');
    assert.equal(resolveImageUrl('https://cdn.example.test/photo.webp'), 'https://cdn.example.test/photo.webp');
  } finally {
    if (previousUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousUrl;
    global.__DEV__ = previousDev;
  }
});
test('API treats an empty successful rating response as no rating', async () => {
  const originalFetch = global.fetch;
  const originalDev = global.__DEV__;
  global.__DEV__ = false;
  global.fetch = async () => new Response(null, { status: 200 });
  try {
    const { api } = load('src/shared/api/client.ts');
    assert.equal(await api.get('/mobile/rating', undefined, true), null);
  } finally {
    global.fetch = originalFetch;
    global.__DEV__ = originalDev;
  }
});
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
