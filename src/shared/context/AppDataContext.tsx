import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { API_BASE_URL } from '../api/config';
import {
  authApi,
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
  type ScanRecord,
  type ScanResult,
  type Testimonial,
  type UserProfile,
  type UserQrCode,
  type WalletData,
} from '../api/services';
import { storage } from '../api/storage';
import { useAuth } from './AuthContext';

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
  const { isAuthenticated, user, role, refreshProfile, logout } = useAuth();
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
  const loadPublicData = async () => {
    console.log('🔄 Loading public data...');
    try {
      const [prods, cats, roleBans, tests, setts, offs, schemes, gifts] = await Promise.all([
        productsApi.getAll().catch((err) => {
          console.error('❌ Products API failed:', err.message);
          return { data: [] as Product[] };
        }),
        catalogApi.getCategories().catch((err) => {
          console.error('❌ Categories API failed:', err.message);
          return { data: [] as ProductCategory[] };
        }),
        bannersApi.getAll(role ?? undefined).catch((err) => {
          console.error('❌ Banners API failed:', err.message);
          return { data: [] as Banner[] };
        }),
        testimonialsApi.getAll().catch((err) => {
          console.error('❌ Testimonials API failed:', err.message);
          return { data: [] as Testimonial[] };
        }),
        settingsApi.getAppSettings().catch((err) => {
          console.error('❌ Settings API failed:', err.message);
          return null;
        }),
        offersApi.getAll(role ?? undefined).catch((err) => {
          console.error('❌ Offers API failed:', err.message);
          return { data: [] as Offer[] };
        }),
        rewardSchemesApi.getAll().catch((err) => {
          console.error('❌ Reward Schemes API failed:', err.message);
          return { data: [] as RewardScheme[] };
        }),
        giftStoreApi.getProducts(role ?? undefined).catch((err) => {
          console.error('❌ Gift Store API failed:', err.message);
          return { data: [] as GiftProduct[] };
        }),
      ]);

      let bans = roleBans;

      console.log('✅ Public data loaded:', {
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
        console.log('No role-specific banners found, retrying without role filter');
        bans = await bannersApi.getAll().catch((err) => {
          console.error('Banner fallback API failed:', err.message);
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
      console.error('❌ Public data loading failed:', error);
      setCatalogLoading(false);
    }
  };

  // ── Private data (auth required) ─────────────────────────────────────────
  const handleSessionExpired = async () => {
    console.log('🔐 Session expired — logging out');
    await storage.clearAll();
    await logout();
  };

  const loadPrivateData = async () => {
    if (!isAuthenticated) {
      console.log('⚠️ User not authenticated, skipping private data');
      return;
    }

    console.log('🔄 Loading private data for user:', user?.id, 'role:', role);
    try {
      const shouldLoadScanHistory = role === 'electrician';
      const [prof, wal, scans, notifs, reds] = await Promise.all([
        profileApi.get().catch((err) => {
          console.error('❌ Profile API failed:', err.message);
          if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
          return null;
        }),
        walletApi.get().catch((err) => {
          console.error('❌ Wallet API failed:', err.message);
          if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
          return null;
        }),
        shouldLoadScanHistory
          ? scanApi.getHistory().catch((err) => {
              console.error('❌ Scan History API failed:', err.message);
              if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
              return null;
            })
          : Promise.resolve(null),
        notificationsApi.getAll(role ?? undefined, user?.id).catch((err) => {
          console.error('❌ Notifications API failed:', err.message);
          if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
          return { data: [] as AppNotification[] };
        }),
        redemptionsApi.getHistory().catch((err) => {
          console.error('❌ Redemptions API failed:', err.message);
          if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
          return { data: [] as RedemptionRecord[], total: 0, page: 1, totalPages: 1 };
        }),
      ]);

      console.log('✅ Private data loaded:', {
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
      setNotifications(notifs.data ?? []);
      setRedemptions(reds.data ?? []);

      // Dealer-specific
      if (role === 'dealer') {
        console.log('🔄 Loading dealer-specific data...');
        const [elecs, bonus] = await Promise.all([
          electriciansApi.getAll().catch((err) => {
            console.error('❌ Electricians API failed:', err.message);
            if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
            return null;
          }),
          walletApi.getDealerBonus().catch((err) => {
            console.error('❌ Dealer Bonus API failed:', err.message);
            if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
            return null;
          }),
        ]);
        console.log('✅ Dealer data loaded:', {
          electricians: !!elecs,
          dealerBonus: !!bonus,
        });
        if (elecs) setElectricians(elecs);
        if (bonus) setDealerBonus(bonus);
      }

      // QR code
      const qr = await profileApi.getQrCode().catch((err) => {
        console.error('❌ QR Code API failed:', err.message);
        if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
        return null;
      });
      if (qr) setUserQrCode(qr);

      // Referral
      const ref = await referralApi.get().catch((err) => {
        console.error('❌ Referral API failed:', err.message);
        if (err.message === 'SESSION_EXPIRED') void handleSessionExpired();
        return null;
      });
      if (ref) setReferral(ref);
    } catch (error) {
      console.error('❌ Private data loading failed:', error);
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    console.log('🔄 Starting data refresh...');
    console.log('🔧 Using API URL:', API_BASE_URL);

    // Test basic connectivity first
    try {
      const healthUrl = `${API_BASE_URL.replace('/api/v1', '')}/health`;
      console.log('🏥 Testing health endpoint:', healthUrl);
      const testResponse = await fetch(healthUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('✅ Health check response:', testResponse.status, testResponse.statusText);
      if (testResponse.ok) {
        const healthData = await testResponse.json();
        console.log('📊 Health data:', healthData);
      }
    } catch (healthError: any) {
      console.error('❌ Health check failed:', healthError.message);
      console.log('🔍 Backend might not be running at:', API_BASE_URL);
    }

    try {
      await Promise.all([loadPublicData(), loadPrivateData()]);
      console.log('✅ Data refresh completed successfully');
    } catch (error) {
      console.error('❌ Data refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load — include `role` so banners/offers refetch when session role is available or changes
  useEffect(() => { void refreshAll(); }, [isAuthenticated, user?.id, role]);

  // AppState polling — refresh when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (/inactive|background/.test(prev) && next === 'active') void refreshAll();
    });
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void refreshAll();
    }, 30000);
    return () => { sub.remove(); clearInterval(interval); };
  }, [isAuthenticated, user?.id]);

  // ── Actions ───────────────────────────────────────────────────────────────
  const submitScan = async (qrCode: string, mode: 'single' | 'multi'): Promise<ScanResult> => {
    const result = await scanApi.submit(qrCode, mode);
    void refreshAll();
    return result;
  };

  const addElectrician = async (data: { name: string; phone: string; city?: string; state?: string }) => {
    await electriciansApi.add(data);
    void refreshAll();
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const result = await profileApi.update(data);
    void refreshAll();
    return result;
  };

  const uploadProfilePhoto = async (base64DataUri: string, source = 'upload') => {
    await profileApi.uploadPhoto(base64DataUri, source);
    void refreshAll();
  };

  const removeProfilePhoto = async () => {
    await profileApi.removePhoto();
    void refreshAll();
  };

  const updatePreferences = async (data: { language?: string; darkMode?: boolean; pushEnabled?: boolean }) => {
    await profileApi.updatePreferences(data);
    void refreshAll();
  };

  const saveBankAccount = async (data: any) => {
    await walletApi.saveBankAccount(data);
    void refreshAll();
  };

  const redeemReward = async (data: { schemeId: string; note?: string }) => {
    await walletApi.redeemReward(data);
    void refreshAll();
  };

  const transferPoints = async (data: { receiverPhone: string; points: number }) => {
    await walletApi.transferPoints(data);
    void refreshAll();
  };

  const requestDealerBonusWithdrawal = async (data: { amount: number }) => {
    await walletApi.requestDealerBonusWithdrawal(data);
    void refreshAll();
  };

  const submitSupportTicket = async (data: { subject: string; comment: string; photoUrl?: string }) => {
    await supportApi.createTicket(data);
  };

  const deleteNotification = async (id: string) => {
    await notificationsApi.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const submitRating = async (rating: number, review?: string) => {
    await ratingApi.submit(rating, review);
  };

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
  ]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export const useAppData = () => useContext(AppDataContext);
