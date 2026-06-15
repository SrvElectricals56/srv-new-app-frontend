import { Alert, Linking } from 'react-native';
import { activityApi } from '@/shared/api';
import { API_BASE_URL } from '@/shared/api/config';

function getApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return API_BASE_URL.replace(/\/api\/v\d+\/?$/i, '').replace(/\/$/, '');
  }
}

function normalizeCatalogUrl(url: string) {
  const trimmed = url.trim();
  const apiOrigin = getApiOrigin();

  if (trimmed.startsWith('/uploads/')) {
    return `${apiOrigin}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const isLocalHost = ['localhost', '127.0.0.1', '10.0.2.2'].includes(parsed.hostname);
    if (isLocalHost && parsed.pathname.startsWith('/uploads/')) {
      return `${apiOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    const uploadPathIndex = trimmed.indexOf('/uploads/');
    if (uploadPathIndex >= 0) {
      return `${apiOrigin}${trimmed.slice(uploadPathIndex)}`;
    }
  }

  return trimmed;
}

export function useCatalogDownload() {
  const openCatalog = (url: string | null | undefined) => {
    const normalizedUrl = url ? normalizeCatalogUrl(url) : '';
    const trackedAt = new Date().toISOString();

    if (!normalizedUrl) {
      void activityApi.track({
        eventType: 'button_tap',
        eventLabel: 'Product catalog unavailable',
        screen: 'home',
        metadata: { reason: 'missing_catalog_url', action: 'catalog_download_attempt', trackedAt },
      }).catch(() => {});
      Alert.alert('Not Available', 'Product catalog has not been uploaded yet.');
      return;
    }
    void activityApi.track({
      eventType: 'button_tap',
      eventLabel: 'Downloaded product catalog',
      screen: 'home',
      metadata: { url: normalizedUrl, action: 'catalog_download', trackedAt },
    }).catch(() => {});
    Linking.openURL(normalizedUrl).catch(() => {
      Alert.alert('Error', 'Could not open catalog link.');
    });
  };

  return { openCatalog, downloading: false, progress: 0 };
}
