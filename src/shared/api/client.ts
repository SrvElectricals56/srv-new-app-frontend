import { API_BASE_URL } from './config';
import { storage } from './storage';
import { sessionEvents } from './sessionEvents';

// ── In-memory Cache ──────────────────────────────────────────────────────────
interface CacheEntry {
  data: unknown;
  expiry: number;
}

const cache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 15_000; // 15 seconds

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttl = DEFAULT_TTL) {
  cache.set(key, { data, expiry: Date.now() + ttl });
}

export function clearCache(pattern?: string) {
  if (!pattern) { cache.clear(); return; }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) cache.delete(key);
  }
}

// ── Request Deduplication ────────────────────────────────────────────────────
const inflightRequests = new Map<string, Promise<unknown>>();

function dedupKey(path: string, options: RequestOptions): string {
  return `${options.method ?? 'GET'}:${path}:${JSON.stringify(options.params ?? {})}`;
}

const debugLog = (...args: unknown[]) => {
  if (__DEV__) {
    console.warn(...args);
  }
};

function stringifyForLog(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  if (typeof value === 'number' || typeof value === 'boolean' || value == null) {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function logApiWarning(message: string, details?: unknown) {
  const suffix = details === undefined ? '' : ` ${stringifyForLog(details)}`;
  console.warn(`${message}${suffix}`);
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: object;
  auth?: boolean;
  params?: Record<string, string | number | undefined>;
};

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  let url = `${API_BASE_URL}${path}`;
  if (params) {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (query) url += `?${query}`;
  }
  return url;
}

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('SESSION_EXPIRED');
    }

    const refreshRes = await fetchWithTimeout(`${API_BASE_URL}/mobile/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      throw new Error('SESSION_EXPIRED');
    }

    const refreshData = await refreshRes.json().catch(() => ({}));
    const nextAccessToken = refreshData?.accessToken;
    const nextRefreshToken = refreshData?.refreshToken || refreshToken;

    if (!nextAccessToken) {
      throw new Error('SESSION_EXPIRED');
    }

    await storage.setTokens(nextAccessToken, nextRefreshToken);
    return nextAccessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Check your network connection.');
    }
    throw new Error('Network error. Make sure backend is running and IP is correct.');
  } finally {
    clearTimeout(timer);
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = false, params } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = await storage.getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const url = buildUrl(path, params);
  debugLog(`API ${method} ${url}`);

  try {
    const response = await fetchWithTimeout(url, {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    debugLog(`API ${method} ${path} - Status: ${response.status}`);

    if (response.status === 401 && auth) {
      debugLog('Token expired, attempting refresh...');
      try {
        const accessToken = await refreshAccessToken();
        headers.Authorization = `Bearer ${accessToken}`;
        debugLog('Token refreshed successfully');
        const retryRes = await fetchWithTimeout(url, {
          method,
          headers,
          ...(body ? { body: JSON.stringify(body) } : {}),
        });
        if (!retryRes.ok) {
          const err = await retryRes.json().catch(() => ({}));
          logApiWarning(`Retry failed (${retryRes.status}).`, err);
          if (retryRes.status === 401) {
            await storage.clearAll();
            sessionEvents.emitExpired();
            throw new Error('SESSION_EXPIRED');
          }
          throw new Error((err as any).message || `Request failed: ${retryRes.status}`);
        }
        return retryRes.json() as Promise<T>;
      } catch (refreshError) {
        logApiWarning('Token refresh failed.', refreshError);
        await storage.clearAll();
        sessionEvents.emitExpired();
        throw new Error('SESSION_EXPIRED');
      }
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      logApiWarning(`API ${method} ${path} failed (${response.status}).`, err);
      throw new Error((err as any).message || `Request failed: ${response.status}`);
    }

    const data = await response.json();
    debugLog(
      `API ${method} ${path} response:`,
      typeof data === 'object' && data !== null ? Object.keys(data) : 'primitive'
    );
    return data as T;
  } catch (error: any) {
    logApiWarning(`API ${method} ${path} error.`, error?.message ?? error);
    throw error;
  }
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>, auth = false) => {
    const key = dedupKey(path, { method: 'GET', params, auth });
    const cached = getCached<T>(key);
    if (cached !== null) return Promise.resolve(cached);

    const inflight = inflightRequests.get(key) as Promise<T> | undefined;
    if (inflight) return inflight;

    const promise = request<T>(path, { method: 'GET', params, auth }).then((data) => {
      setCache(key, data);
      inflightRequests.delete(key);
      return data;
    }).catch((err) => {
      inflightRequests.delete(key);
      throw err;
    });

    inflightRequests.set(key, promise);
    return promise;
  },

  post: <T>(path: string, body: object, auth = false) => {
    clearCache(path);
    return request<T>(path, { method: 'POST', body, auth });
  },

  patch: <T>(path: string, body: object, auth = false) => {
    clearCache(path);
    return request<T>(path, { method: 'PATCH', body, auth });
  },

  delete: <T>(path: string, auth = false) => {
    clearCache(path);
    return request<T>(path, { method: 'DELETE', auth });
  },
};
