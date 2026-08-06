/* global __dirname */
const fs = require('fs');
const path = require('path');

const profile = String(process.env.EAS_BUILD_PROFILE || '').toLowerCase();
const platform = String(process.env.EAS_BUILD_PLATFORM || '').toLowerCase();
if (!['production', 'android-production', 'production-apk'].includes(profile)) {
  process.exit(0);
}

// google-services.json and its SHA-1 OAuth client are Android-only. The iOS
// build uses EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and the configured iOS URL scheme.
if (platform && platform !== 'android') {
  console.log('Skipping Android Google Sign-In validation for the iOS build.');
  process.exit(0);
}

const configPath = path.resolve(__dirname, '..', 'android', 'app', 'google-services.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const productionClient = (config.client || []).find(
  (entry) => entry?.client_info?.android_client_info?.package_name === 'com.srvelectricals.app',
);
const androidOauthClients = (productionClient?.oauth_client || []).filter(
  (entry) =>
    Number(entry?.client_type) === 1 &&
    typeof entry?.client_id === 'string' &&
    entry?.android_info?.package_name === 'com.srvelectricals.app',
);
const requiredCertificateHashes = new Set([
  // Google Play app-signing certificate.
  'be76eccbc5d05b11b7a668ae568d3858bf189ed3',
  // Release/upload key used by EAS and direct production APKs.
  'ffb3eb2e5d1d7cf495f5e85f080078b90c101009',
]);
const configuredCertificateHashes = new Set(
  androidOauthClients.map((entry) =>
    String(entry?.android_info?.certificate_hash || '').replace(/:/g, '').toLowerCase(),
  ),
);
const missingCertificateHashes = [...requiredCertificateHashes].filter(
  (certificateHash) => !configuredCertificateHashes.has(certificateHash),
);

if (missingCertificateHashes.length > 0) {
  throw new Error(
    `Production build blocked: google-services.json is missing ${missingCertificateHashes.length} required Android OAuth certificate configuration(s) for com.srvelectricals.app.`,
  );
}

console.log('Google Sign-In release configuration verified.');
