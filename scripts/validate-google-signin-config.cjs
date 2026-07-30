const fs = require('fs');
const path = require('path');

const profile = String(process.env.EAS_BUILD_PROFILE || '').toLowerCase();
if (!['production', 'android-production'].includes(profile)) {
  process.exit(0);
}

const configPath = path.resolve(__dirname, '..', 'android', 'app', 'google-services.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const productionClient = (config.client || []).find(
  (entry) => entry?.client_info?.android_client_info?.package_name === 'com.srvelectricals.app',
);
const hasAndroidOauthClient = (productionClient?.oauth_client || []).some(
  (entry) => Number(entry?.client_type) === 1 && typeof entry?.client_id === 'string',
);

if (!hasAndroidOauthClient) {
  throw new Error(
    'Production build blocked: google-services.json has no Android OAuth client for com.srvelectricals.app. Register the Play/EAS SHA-1 fingerprints in Firebase or Google Cloud, then download the updated file.',
  );
}

console.log('Google Sign-In release configuration verified.');
