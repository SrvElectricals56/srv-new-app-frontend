import { Platform } from 'react-native';

const ENV_URL = process.env.EXPO_PUBLIC_API_URL?.trim();

const DEFAULT_URL_BY_PLATFORM: Record<string, string> = {
  web: 'http://localhost:3001/api/v1',
  android: 'http://10.0.2.2:3001/api/v1',
  ios: 'http://127.0.0.1:3001/api/v1',
};

// Physical devices should set EXPO_PUBLIC_API_URL to your machine's LAN URL.
const fallbackUrl = DEFAULT_URL_BY_PLATFORM[Platform.OS] ?? 'http://127.0.0.1:3001/api/v1';

export const API_BASE_URL: string = ENV_URL && ENV_URL.length > 0 ? ENV_URL : fallbackUrl;

export function resolveImageUrl(value?: string | null): string | null {
  if (!value) return null;
  let s = value.trim();
  if (!s) return null;
  s = s.replace(/\\/g, '/');
  if (/^https?:\/\//i.test(s)) return s;
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
      fallbackUrl,
    })}`
  );
}
