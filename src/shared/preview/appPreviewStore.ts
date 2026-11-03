import { useEffect, useSyncExternalStore } from 'react';
import type { AppContentPage, AppPageContentMap } from '@/shared/config/appPageContent';
import type { UserRole } from '@/shared/types/navigation';

export const APP_PREVIEW_MESSAGE_TYPE = 'srv-admin-live-preview';
export type PreviewAuthMode = 'guest' | 'authenticated';

type RolePageControls = Record<string, Record<string, boolean>>;

type PageSectionOrder = Record<string, Record<string, string[]>>;

export type AppPreviewState = {
  enabled: boolean;
  role: UserRole;
  page: AppContentPage;
  authMode: PreviewAuthMode;
  appPageContent: AppPageContentMap | null;
  rolePageControls: RolePageControls | null;
  pageSectionOrder: PageSectionOrder | null;
  revision: number;
};

const APP_CONTENT_PAGES: AppContentPage[] = [
  'home',
  'product',
  'play',
  'categories',
  'cart',
  'wallet',
  'profile',
  'notifications',
  'rewards',
  'scan',
  'electricians',
  'call_electrician',
  'member_tier',
  'bank_details',
  'dealer_bonus',
  'need_help',
  'contact_support',
  'offers',
  'transfer_points',
  'my_orders',
  'my_redemption',
  'refer_friend',
  'scan_history',
  'privacy_policy',
  'password',
  'app_settings',
  'support',
];

const SCREEN_TO_PAGE: Partial<Record<string, AppContentPage>> = {
  home: 'home',
  product: 'product',
  play: 'play',
  categories: 'categories',
  cart: 'cart',
  wallet: 'wallet',
  profile: 'profile',
  notification: 'notifications',
  rewards: 'rewards',
  scan: 'scan',
  electricians: 'electricians',
  call_electrician: 'call_electrician',
  dealer_tier: 'member_tier',
  electrician_tier: 'member_tier',
  bank_details: 'bank_details',
  transfer_points: 'transfer_points',
  dealer_bonus: 'dealer_bonus',
  support: 'support',
};

const APP_CONTENT_PAGE_SET = new Set<AppContentPage>(APP_CONTENT_PAGES);
const USER_ROLE_SET = new Set<UserRole>(['dealer', 'electrician', 'user', 'counterboy']);

function normalizeRole(value: unknown): UserRole {
  return typeof value === 'string' && USER_ROLE_SET.has(value as UserRole)
    ? (value as UserRole)
    : 'electrician';
}

function normalizePage(value: unknown): AppContentPage {
  if (typeof value === 'string') {
    if (APP_CONTENT_PAGE_SET.has(value as AppContentPage)) {
      return value as AppContentPage;
    }
    const fromScreen = SCREEN_TO_PAGE[value];
    if (fromScreen) {
      return fromScreen;
    }
  }
  return 'home';
}

function normalizeAuthMode(value: unknown): PreviewAuthMode {
  return value === 'authenticated' ? 'authenticated' : 'guest';
}

function parsePreviewFlag(value: string | null) {
  if (value == null) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'preview';
}

export function isAppPreviewSearch(search?: string | null) {
  if (!search) {
    return false;
  }

  const params = new URLSearchParams(search ?? '');
  return parsePreviewFlag(params.get('preview'));
}

function readPreviewSearch(search?: string | null) {
  if (!isAppPreviewSearch(search)) {
    return {
      enabled: false,
      role: 'electrician' as UserRole,
      page: 'home' as AppContentPage,
      authMode: 'guest' as PreviewAuthMode,
    };
  }

  const params = new URLSearchParams(search ?? '');
  return {
    enabled: true,
    role: normalizeRole(params.get('role')),
    page: normalizePage(params.get('page') ?? params.get('screen')),
    authMode: normalizeAuthMode(params.get('auth')),
  };
}

function createInitialState(): AppPreviewState {
  const search =
    typeof window !== 'undefined' &&
    typeof window.addEventListener === 'function' &&
    typeof window.location?.search === 'string'
      ? window.location.search
      : '';
  const initial = readPreviewSearch(search);
  return {
    enabled: initial.enabled,
    role: initial.role,
    page: initial.page,
    authMode: initial.authMode,
    appPageContent: null,
    rolePageControls: null,
    pageSectionOrder: null,
    revision: 0,
  };
}

let previewState = createInitialState();
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function updatePreviewState(next: Partial<AppPreviewState>) {
  previewState = {
    ...previewState,
    ...next,
    revision: previewState.revision + 1,
  };
  emitChange();
}

function handlePreviewMessage(rawData: unknown) {
  let data = rawData;

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return;
    }
  }

  if (!data || typeof data !== 'object') {
    return;
  }

  const payload = data as {
    type?: string;
    preview?: boolean;
    role?: unknown;
    page?: unknown;
    screen?: unknown;
    authMode?: unknown;
    appPageContent?: AppPageContentMap | null;
    rolePageControls?: RolePageControls | null;
    pageSectionOrder?: PageSectionOrder | null;
  };

  if (payload.type !== APP_PREVIEW_MESSAGE_TYPE) {
    return;
  }

  updatePreviewState({
    enabled: payload.preview !== false,
    role: normalizeRole(payload.role),
    page: normalizePage(payload.page ?? payload.screen),
    authMode: normalizeAuthMode(payload.authMode),
    appPageContent: payload.appPageContent ?? null,
    rolePageControls: payload.rolePageControls ?? null,
    pageSectionOrder: payload.pageSectionOrder ?? null,
  });
}

/** True only in a real browser environment (not React Native). */
function isBrowserEnv(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.addEventListener === 'function' &&
    typeof window.location?.search === 'string'
  );
}

export function useAppPreviewBridge() {
  useEffect(() => {
    if (!isBrowserEnv()) {
      return;
    }

    updatePreviewState(readPreviewSearch(window.location.search));

    const handleMessage = (event: MessageEvent) => {
      handlePreviewMessage(event.data);
    };

    const handleLocationChange = () => {
      updatePreviewState(readPreviewSearch(window.location.search));
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);
}

export function useAppPreviewState() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => previewState,
    () => previewState
  );
}
