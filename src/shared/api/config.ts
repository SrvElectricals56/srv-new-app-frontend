import Constants from 'expo-constants';
import { Platform } from 'react-native';

const ENV_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

const DEFAULT_URL_BY_PLATFORM: Record<string, string> = {
  web: 'http://localhost:3001/api/v1',
  android: 'http://10.0.2.2:3001/api/v1',
  ios: 'http://127.0.0.1:3001/api/v1',
};

const fallbackUrl = DEFAULT_URL_BY_PLATFORM[Platform.OS] ?? 'http://127.0.0.1:3001/api/v1';
const isLanHost = (host: string) =>
  /^10\.|^192\.168\.|^172\.(?:1[6-9]|2\d|3[01])\./.test(host);

const getDevelopmentApiUrl = (): string | null => {
  if (!__DEV__ || Platform.OS === 'web') return null;
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  try {
    const host = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`).hostname;
    return isLanHost(host) ? `http://${host}:3001/api/v1` : null;
  } catch {
    return null;
  }
};

const developmentApiUrl = getDevelopmentApiUrl();
const envIsLocalLan = (() => {
  if (!ENV_URL) return false;
  try {
    const url = new URL(ENV_URL);
    return url.protocol === 'http:' && isLanHost(url.hostname);
  } catch {
    return false;
  }
})();

// In Expo Go, Metro and the local API run on the same computer. Its current
// address takes priority over a LAN IP saved before the Wi-Fi network changed.
export const API_BASE_URL: string =
  developmentApiUrl && (!ENV_URL || envIsLocalLan)
    ? developmentApiUrl
    : ENV_URL || fallbackUrl;
const developmentFallbackUrls = __DEV__
  ? [developmentApiUrl, ENV_URL, fallbackUrl]
  : [];
export const API_BASE_URLS: string[] = Array.from(new Set([
  API_BASE_URL,
  ...developmentFallbackUrls,
].filter(Boolean)));
export const API_FALLBACK_BASE_URL: string | null = API_BASE_URLS.find((url) => url !== API_BASE_URL) ?? null;

export function resolveImageUrl(value?: string | null): string | null {
  if (!value) return null;
  let s = value.trim();
  if (!s) return null;
  s = s.replace(/\\/g, '/');
  if (/^data:image\//i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) {
    // Serialise absolute legacy URLs so filenames with spaces are encoded for
    // native image loaders on both iOS and Android.
    try {
      return new URL(s).toString();
    } catch {
      return s;
    }
  }
  if (s.startsWith('//')) return `https:${s}`;
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  if (s.startsWith('/')) return `${origin}${s}`;
  if (/^www\./i.test(s)) return `http://${s}`;
  return `${origin}/${s.replace(/^\.?\//, '')}`;
}

if (__DEV__) {
  console.warn(
    `API Configuration: ${JSON.stringify({
      platform: Platform.OS,
      envUrl: ENV_URL,
      finalUrl: API_BASE_URL,
      urls: API_BASE_URLS,
      fallbackUrl,
      retryUrl: API_FALLBACK_BASE_URL,
    })}`
  );
}
