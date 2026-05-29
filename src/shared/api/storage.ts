import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe AsyncStorage wrapper — falls back to in-memory if AsyncStorage unavailable
const AsyncStorageModule = AsyncStorage;

// In-memory fallback for when AsyncStorage is unavailable
const memoryStore: Record<string, string> = {};

const safeGet = async (key: string): Promise<string | null> => {
  try {
    if (AsyncStorageModule) return await AsyncStorageModule.getItem(key);
  } catch {}
  return memoryStore[key] ?? null;
};

const safeSet = async (key: string, value: string): Promise<void> => {
  try {
    if (AsyncStorageModule) {
      await AsyncStorageModule.setItem(key, value);
      return;
    }
  } catch {}
  memoryStore[key] = value;
};

const safeRemove = async (key: string): Promise<void> => {
  try {
    if (AsyncStorageModule) {
      await AsyncStorageModule.removeItem(key);
      return;
    }
  } catch {}
  delete memoryStore[key];
};

const safeGetAllKeys = async (): Promise<string[]> => {
  try {
    if (AsyncStorageModule) return Array.from(await AsyncStorageModule.getAllKeys());
  } catch {}
  return Object.keys(memoryStore);
};

const KEYS = {
  ACCESS_TOKEN: 'srv_access_token',
  REFRESH_TOKEN: 'srv_refresh_token',
  USER_PROFILE: 'srv_user_profile',
  USER_ROLE: 'srv_user_role',
  PASSWORD_CONFIGURED_PREFIX: 'srv_password_configured',
  SEEN_NOTIFICATION_IDS_PREFIX: 'srv_seen_notification_ids',
  CLEARED_NOTIFICATION_IDS_PREFIX: 'srv_cleared_notification_ids',
};

export const storage = {
  buildNotificationSeenKey(scope = 'global') {
    return `${KEYS.SEEN_NOTIFICATION_IDS_PREFIX}:${scope}`;
  },

  buildNotificationClearedKey(scope = 'global') {
    return `${KEYS.CLEARED_NOTIFICATION_IDS_PREFIX}:${scope}`;
  },

  buildPasswordConfiguredKey(role: string) {
    return `${KEYS.PASSWORD_CONFIGURED_PREFIX}:${role}`;
  },

  async setTokens(accessToken: string, refreshToken: string) {
    await Promise.all([
      safeSet(KEYS.ACCESS_TOKEN, accessToken),
      safeSet(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },

  async getAccessToken(): Promise<string | null> {
    return safeGet(KEYS.ACCESS_TOKEN);
  },

  async getRefreshToken(): Promise<string | null> {
    return safeGet(KEYS.REFRESH_TOKEN);
  },

  async setUserProfile(profile: object) {
    await safeSet(KEYS.USER_PROFILE, JSON.stringify(profile));
  },

  async getUserProfile<T>(): Promise<T | null> {
    const raw = await safeGet(KEYS.USER_PROFILE);
    return raw ? (JSON.parse(raw) as T) : null;
  },

  async setUserRole(role: string) {
    await safeSet(KEYS.USER_ROLE, role);
  },

  async getUserRole(): Promise<string | null> {
    return safeGet(KEYS.USER_ROLE);
  },

  async setPasswordConfigured(role: string, configured: boolean) {
    await safeSet(this.buildPasswordConfiguredKey(role), configured ? 'true' : 'false');
  },

  async getPasswordConfigured(role: string): Promise<boolean> {
    return (await safeGet(this.buildPasswordConfiguredKey(role))) === 'true';
  },

  async clearAll() {
    const allKeys = await safeGetAllKeys();
    const scopedKeys = allKeys.filter(
      (key) =>
        key.startsWith(`${KEYS.PASSWORD_CONFIGURED_PREFIX}:`) ||
        key.startsWith(`${KEYS.SEEN_NOTIFICATION_IDS_PREFIX}:`) ||
        key.startsWith(`${KEYS.CLEARED_NOTIFICATION_IDS_PREFIX}:`),
    );
    const directKeys = [
      KEYS.ACCESS_TOKEN,
      KEYS.REFRESH_TOKEN,
      KEYS.USER_PROFILE,
      KEYS.USER_ROLE,
    ];
    await Promise.all([...directKeys, ...scopedKeys].map(safeRemove));
  },

  // ── Notification seen tracking ────────────────────────────────────
  async getSeenNotificationIds(scope = 'global'): Promise<Set<string>> {
    const raw = await safeGet(this.buildNotificationSeenKey(scope));
    if (!raw) return new Set();
    try { return new Set(JSON.parse(raw) as string[]); } catch { return new Set(); }
  },

  async markNotificationsAsSeen(ids: string[], scope = 'global'): Promise<void> {
    const existing = await this.getSeenNotificationIds(scope);
    ids.forEach(id => existing.add(id));
    await safeSet(this.buildNotificationSeenKey(scope), JSON.stringify([...existing]));
  },

  async getClearedNotificationIds(scope = 'global'): Promise<Set<string>> {
    const raw = await safeGet(this.buildNotificationClearedKey(scope));
    if (!raw) return new Set();
    try { return new Set(JSON.parse(raw) as string[]); } catch { return new Set(); }
  },

  async clearNotifications(ids: string[], scope = 'global'): Promise<void> {
    const existing = await this.getClearedNotificationIds(scope);
    ids.forEach((id) => existing.add(id));
    await safeSet(this.buildNotificationClearedKey(scope), JSON.stringify([...existing]));
  },
};
