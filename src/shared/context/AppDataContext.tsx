import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  bannersApi,
  catalogApi,
  electriciansApi,
  giftStoreApi,
  notificationsApi,
  offersApi,
  productsApi,
  profileApi,
  redemptionsApi,
  referralApi,
  ratingApi,
  rewardSchemesApi,
  scanApi,
  settingsApi,
  supportApi,
  testimonialsApi,
  walletApi,
  type AppNotification,
  type AppSettings,
  type Banner,
  type DealerBonus,
  type GiftProduct,
  type Offer,
  type PaginatedElectricians,
  type PaginatedScans,
  type Product,
  type ProductCategory,
  type RedemptionRecord,
  type RewardScheme,
  type ScanResult,
  type Testimonial,
  type UserProfile,
  type UserQrCode,
  type WalletData,
} from '../api/services';
import { storage } from '../api/storage';
import { clearCache } from '../api/client';
import { useAuth } from './AuthContext';
import { useAppPreviewState } from '../preview/appPreviewStore';

const debugLog = (...args: unknown[]) => {
  if (__DEV__) {
    console.warn(...args);
  }
};

function formatLogValue(value: unknown): string {
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

function logDataWarning(message: string, details?: unknown) {
  const suffix = details === undefined ? '' : ` ${formatLogValue(details)}`;
  console.warn(`${message}${suffix}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────────────────────────────────────
type AppDataContextType = {
  loading: boolean;
  // Profile
  profile: UserProfile | null;
  // Wallet
  wallet: WalletData | null;
  walletSummary: WalletData | null;
  // Scans
  scanHistory: PaginatedScans | null;
  // Notifications
  notifications: AppNotification[];
  // Offers
  offers: Offer[];
  // Products / Catalog
  products: Product[];
  catalogProducts: Product[];
  categories: ProductCategory[];
  catalogLoading: boolean;
  // Banners
  banners: Banner[];
  // Gift Store
  giftProducts: GiftProduct[];
  // Testimonials
  testimonials: Testimonial[];
  // Electricians (dealer)
  electricians: PaginatedElectricians | null;
  // Redemptions
  redemptions: RedemptionRecord[];
  // App settings
  appSettings: AppSettings | null;
  // Dealer bonus
  dealerBonus: DealerBonus | null;
  // User QR code
  userQrCode: UserQrCode | null;
  // Referral
  referral: { code: string; link: string | null; channels: string[] } | null;
  // Reward schemes
  rewardSchemes: RewardScheme[];

  // Actions
  refreshAll: () => Promise<void>;
  submitScan: (qrCode: string, mode: 'single' | 'multi') => Promise<ScanResult>;
  addElectrician: (data: { name: string; phone: string; city?: string; state?: string }) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<UserProfile>;
  uploadProfilePhoto: (base64DataUri: string, source?: string) => Promise<void>;
  removeProfilePhoto: () => Promise<void>;
  updatePreferences: (data: { language?: string; darkMode?: boolean; pushEnabled?: boolean }) => Promise<void>;
  saveBankAccount: (data: any) => Promise<void>;
  redeemReward: (data: { schemeId: string; note?: string }) => Promise<void>;
  transferPoints: (data: { receiverPhone: string; points: number }) => Promise<void>;
  requestDealerBonusWithdrawal: (data: { amount: number }) => Promise<void>;
  submitSupportTicket: (data: { subject: string; comment: string; photoUrl?: string }) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  submitRating: (rating: number, review?: string) => Promise<void>;
};

const defaultCtx: AppDataContextType = {
  loading: false,
  profile: null,
  wallet: null,
  walletSummary: null,
  scanHistory: null,
  notifications: [],
  offers: [],
  products: [],
  catalogProducts: [],
  categories: [],
  catalogLoading: true,
  banners: [],
  giftProducts: [],
  testimonials: [],
  electricians: null,
  redemptions: [],
  appSettings: null,
  dealerBonus: null,
  userQrCode: null,
  referral: null,
  rewardSchemes: [],
  refreshAll: async () => {},
  submitScan: async () => { throw new Error('not ready'); },
  addElectrician: async () => {},
  updateProfile: async () => { throw new Error('not ready'); },
  uploadProfilePhoto: async () => {},
  removeProfilePhoto: async () => {},
  updatePreferences: async () => {},
  saveBankAccount: async () => {},
  redeemReward: async () => {},
  transferPoints: async () => {},
  requestDealerBonusWithdrawal: async () => {},
  submitSupportTicket: async () => {},
  deleteNotification: async () => {},
  submitRating: async () => {},
};

const AppDataContext = createContext<AppDataContextType>(defaultCtx);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user, role, logout } = useAuth();
  const previewState = useAppPreviewState();
  const appStateRef = useRef(AppState.currentState);

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [scanHistory, setScanHistory] = useState<PaginatedScans | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [giftProducts, setGiftProducts] = useState<GiftProduct[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [electricians, setElectricians] = useState<PaginatedElectricians | null>(null);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>([]);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [dealerBonus, setDealerBonus] = useState<DealerBonus | null>(null);
  const [userQrCode, setUserQrCode] = useState<UserQrCode | null>(null);
  const [referral, setReferral] = useState<{ code: string; link: string | null; channels: string[] } | null>(null);
  const [rewardSchemes, setRewardSchemes] = useState<RewardScheme[]>([]);

  // ── Public data (no auth needed) ─────────────────────────────────────────
  const loadPublicData = useCallback(async () => {
    debugLog('🔄 Loading public data...');
    try {
      const [prods, cats, roleBans, tests, setts, offs, schemes, gifts] = await Promise.all([
        productsApi.getAll().catch((err) => {
          logDataWarning('Products API failed.', err?.message ?? err);
          return { data: [] as Product[] };
        }),
        catalogApi.getCategories().catch((err) => {
          logDataWarning('Categories API failed.', err?.message ?? err);
          return { data: [] as ProductCategory[] };
        }),
        bannersApi.getAll(role ?? undefined).catch((err) => {
          logDataWarning('Banners API failed.', err?.message ?? err);
          return { data: [] as Banner[] };
        }),
        testimonialsApi.getAll().catch((err) => {
          logDataWarning('Testimonials API failed.', err?.message ?? err);
          return { data: [] as Testimonial[] };
        }),
        settingsApi.getAppSettings().catch((err) => {
          logDataWarning('Settings API failed.', err?.message ?? err);
          return null;
        }),
        offersApi.getAll(role ?? undefined).catch((err) => {
          logDataWarning('Offers API failed.', err?.message ?? err);
          return { data: [] as Offer[] };
        }),
        rewardSchemesApi.getAll().catch((err) => {
          logDataWarning('Reward schemes API failed.', err?.message ?? err);
          return { data: [] as RewardScheme[] };
        }),
        giftStoreApi.getProducts(role ?? undefined).catch((err) => {
          logDataWarning('Gift store API failed.', err?.message ?? err);
          return { data: [] as GiftProduct[] };
        }),
      ]);

      let bans = roleBans;

      debugLog('✅ Public data loaded:', {
        products: prods.data?.length || 0,
        categories: cats.data?.length || 0,
        banners: bans.data?.length || 0,
        testimonials: tests.data?.length || 0,
        offers: offs.data?.length || 0,
        rewardSchemes: schemes.data?.length || 0,
        giftProducts: gifts.data?.length || 0,
        appSettings: !!setts,
      });

      if ((bans.data?.length ?? 0) === 0 && role) {
        debugLog('No role-specific banners found, retrying without role filter');
        bans = await bannersApi.getAll().catch((err) => {
          logDataWarning('Banner fallback API failed.', err?.message ?? err);
          return { data: [] as Banner[] };
        });
      }

      setProducts(prods.data ?? []);
      setCategories(cats.data ?? []);
      setBanners(bans.data ?? []);
      setTestimonials(tests.data ?? []);
      if (setts) setAppSettings(setts);
      setOffers(offs.data ?? []);
      setRewardSchemes(schemes.data ?? []);
      setGiftProducts(gifts.data ?? []);
      setCatalogLoading(false);
    } catch (error) {
      logDataWarning('Public data loading failed.', error);
      setCatalogLoading(false);
    }
  }, [role]);

  // ?? Private data (auth required) ─────────────────────────────────────────
  const handleSessionExpired = useCallback(async () => {
    debugLog('🔐 Session expired — logging out');
    await storage.clearAll();
    await logout();
  }, [logout]);

  const loadPrivateData = useCallback(async () => {
    if (previewState.enabled) {
      debugLog('Preview mode active, skipping private data');
      return;
    }

    if (!isAuthenticated) {
      debugLog('⚠️ User not authenticated, skipping private data');
      return;
    }

    debugLog('🔄 Loading private data for user:', user?.id, 'role:', role);
    try {
      const notificationScope = `${role ?? 'guest'}:${user?.id ?? 'guest'}`;
      const shouldLoadScanHistory = role === 'electrician';
      const [prof, wal, scans, notifs, reds, qr, ref] = await Promise.all([
        profileApi.get().catch((err) => {
          logDataWarning('Profile API failed.', err?.message ?? err);
          if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
          return null;
        }),
        walletApi.get().catch((err) => {
          logDataWarning('Wallet API failed.', err?.message ?? err);
          if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
          return null;
        }),
        shouldLoadScanHistory
          ? scanApi.getHistory().catch((err) => {
              logDataWarning('Scan history API failed.', err?.message ?? err);
              if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
              return null;
            })
          : Promise.resolve(null),
        notificationsApi.getAll(role ?? undefined, user?.id).catch((err) => {
          logDataWarning('Notifications API failed.', err?.message ?? err);
          if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
          return { data: [] as AppNotification[] };
        }),
        redemptionsApi.getHistory().catch((err) => {
          logDataWarning('Redemptions API failed.', err?.message ?? err);
          if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
          return { data: [] as RedemptionRecord[], total: 0, page: 1, totalPages: 1 };
        }),
        // QR code — parallelized
        profileApi.getQrCode().catch((err) => {
          logDataWarning('QR code API failed.', err?.message ?? err);
          if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
          return null;
        }),
        // Referral — parallelized
        referralApi.get().catch((err) => {
          logDataWarning('Referral API failed.', err?.message ?? err);
          if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
          return null;
        }),
      ]);

      debugLog('✅ Private data loaded:', {
        profile: !!prof,
        wallet: !!wal,
        scanHistory: !!scans,
        notifications: notifs.data?.length || 0,
        redemptions: reds.data?.length || 0,
      });

      if (prof) {
        setProfile(prof);
        await storage.setUserProfile(prof);
      }
      if (wal) setWallet(wal);
      if (scans) {
        setScanHistory(scans);
      } else if (!shouldLoadScanHistory) {
        setScanHistory(null);
      }
      const clearedIds = await storage.getClearedNotificationIds(notificationScope);
      setNotifications((notifs.data ?? []).filter((notification) => !clearedIds.has(notification.id)));
      setRedemptions(reds.data ?? []);
      if (qr) setUserQrCode(qr);
      if (ref) setReferral(ref);

      // Dealer-specific
      if (role === 'dealer') {
        const [elecs, bonus] = await Promise.all([
          electriciansApi.getAll().catch((err) => {
            logDataWarning('Electricians API failed.', err?.message ?? err);
            if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
            return null;
          }),
          walletApi.getDealerBonus().catch((err) => {
            logDataWarning('Dealer bonus API failed.', err?.message ?? err);
            if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
            return null;
          }),
        ]);
        if (elecs) setElectricians(elecs);
        if (bonus) setDealerBonus(bonus);
      }
    } catch (error) {
      logDataWarning('Private data loading failed.', error);
    }
  }, [handleSessionExpired, isAuthenticated, previewState.enabled, role, user?.id]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    clearCache();
    try {
      await Promise.all([loadPublicData(), loadPrivateData()]);
    } catch (error) {
      logDataWarning('Data refresh failed.', error);
    } finally {
      setLoading(false);
    }
  }, [loadPrivateData, loadPublicData]);

  // Initial load — include `role` so banners/offers refetch when session role is available or changes
  useEffect(() => { void refreshAll(); }, [refreshAll]);

  // AppState — clear cache and refresh when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (/inactive|background/.test(prev) && next === 'active') {
        clearCache();
        void refreshAll();
      }
    });
    return () => sub.remove();
  }, [refreshAll]);

  // Poll app settings every 30 seconds so maintenance mode / force update
  // reflects quickly without requiring the user to restart the app.
  useEffect(() => {
    const POLL_INTERVAL = 30_000; // 30 seconds

    const pollSettings = async () => {
      // Only poll when app is in the foreground
      if (appStateRef.current !== 'active') return;
      try {
        clearCache('/mobile/app-settings');
        const setts = await settingsApi.getAppSettings();
        if (setts) setAppSettings(setts);
      } catch {
        // silently ignore poll errors
      }
    };

    const id = setInterval(() => { void pollSettings(); }, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────
  const submitScan = useCallback(async (qrCode: string, mode: 'single' | 'multi'): Promise<ScanResult> => {
    const result = await scanApi.submit(qrCode, mode);
    void refreshAll();
    return result;
  }, [refreshAll]);

  const addElectrician = useCallback(async (data: { name: string; phone: string; city?: string; state?: string }) => {
    await electriciansApi.add(data);
    void refreshAll();
  }, [refreshAll]);

  const updateProfile = useCallback(async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const result = await profileApi.update(data);
    void refreshAll();
    return result;
  }, [refreshAll]);

  const uploadProfilePhoto = useCallback(async (base64DataUri: string, source = 'upload') => {
    await profileApi.uploadPhoto(base64DataUri, source);
    void refreshAll();
  }, [refreshAll]);

  const removeProfilePhoto = useCallback(async () => {
    await profileApi.removePhoto();
    void refreshAll();
  }, [refreshAll]);

  const updatePreferences = useCallback(async (data: { language?: string; darkMode?: boolean; pushEnabled?: boolean }) => {
    await profileApi.updatePreferences(data);
    void refreshAll();
  }, [refreshAll]);

  const saveBankAccount = useCallback(async (data: any) => {
    await walletApi.saveBankAccount(data);
    void refreshAll();
  }, [refreshAll]);

  const redeemReward = useCallback(async (data: { schemeId: string; note?: string }) => {
    await walletApi.redeemReward(data);
    void refreshAll();
  }, [refreshAll]);

  const transferPoints = useCallback(async (data: { receiverPhone: string; points: number }) => {
    await walletApi.transferPoints(data);
    void refreshAll();
  }, [refreshAll]);

  const requestDealerBonusWithdrawal = useCallback(async (data: { amount: number }) => {
    await walletApi.requestDealerBonusWithdrawal(data);
    void refreshAll();
  }, [refreshAll]);

  const submitSupportTicket = useCallback(async (data: { subject: string; comment: string; photoUrl?: string }) => {
    await supportApi.createTicket(data);
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const notificationScope = `${role ?? 'guest'}:${user?.id ?? 'guest'}`;
    await storage.clearNotifications([id], notificationScope);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, [role, user?.id]);

  const submitRating = useCallback(async (rating: number, review?: string) => {
    await ratingApi.submit(rating, review);
  }, []);

  const value = useMemo<AppDataContextType>(() => ({
    loading, profile, wallet, walletSummary: wallet, scanHistory, notifications, offers,
    products, catalogProducts: products, categories, catalogLoading, banners, giftProducts,
    testimonials, electricians, redemptions, appSettings, dealerBonus, userQrCode, referral,
    rewardSchemes,
    refreshAll, submitScan, addElectrician, updateProfile, uploadProfilePhoto,
    removeProfilePhoto, updatePreferences, saveBankAccount, redeemReward,
    transferPoints, requestDealerBonusWithdrawal, submitSupportTicket,
    deleteNotification, submitRating,
  }), [
    loading, profile, wallet, scanHistory, notifications, offers, products, categories,
    catalogLoading, banners, giftProducts, testimonials, electricians, redemptions, appSettings,
    dealerBonus, userQrCode, referral, rewardSchemes,
    refreshAll, submitScan, addElectrician, updateProfile, uploadProfilePhoto,
    removeProfilePhoto, updatePreferences, saveBankAccount, redeemReward,
    transferPoints, requestDealerBonusWithdrawal, submitSupportTicket,
    deleteNotification, submitRating,
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export const useAppData = () => useContext(AppDataContext);
