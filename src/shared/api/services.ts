import { api } from './client';
import { API_BASE_URL as apiBaseUrl } from './config';
import { storage } from './storage';
import type { AppPageContentMap } from '@/shared/config/appPageContent';

function normalizePhone(phone?: string | null) {
  return String(phone ?? '').replace(/\D/g, '').slice(-10);
}

function sanitizeDealerSignupPayload(data: {
  name: string;
  phone: string;
  email?: string;
  town: string;
  district: string;
  state: string;
  address: string;
  pincode?: string;
  gstNumber?: string;
  password?: string;
}) {
  return {
    name: data.name,
    phone: normalizePhone(data.phone),
    email: data.email,
    town: data.town,
    district: data.district,
    state: data.state,
    address: data.address,
    pincode: data.pincode,
    gstNumber: data.gstNumber,
    password: data.password,
  };
}

function sanitizeCounterBoySignupPayload(data: {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  district?: string;
  address?: string;
  pincode?: string;
  password?: string;
}) {
  return {
    name: data.name.trim(),
    phone: normalizePhone(data.phone),
    email: data.email?.trim() || undefined,
    city: data.city?.trim() || undefined,
    state: data.state?.trim() || undefined,
    district: data.district?.trim() || undefined,
    address: data.address?.trim() || undefined,
    pincode: data.pincode?.trim() || undefined,
    password: data.password?.trim() || undefined,
  };
}

function sanitizeUserProfileUpdatePayload(data: Partial<UserProfile>) {
  const allowed = [
    'name', 'email', 'phone', 'city', 'town', 'district', 'state',
    'address', 'pincode', 'gstNumber', 'accountHolderName', 'bankAccount',
    'ifsc', 'bankName', 'upiId', 'bankLinked', 'language', 'darkMode',
    'pushEnabled', 'profileImage',
    'kycStatus', 'kycRejectionReason', 'aadharFrontImage', 'panDocument', 'gstDocument',
  ] as const;
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) out[key] = data[key];
  }
  return out;
}

function buildElectricianCodeFallback(data: {
  phone: string;
  state?: string;
  pincode?: string;
  district?: string;
  dealerPhone?: string;
}) {
  const stateCodeMap: Record<string, string> = {
    andhrapradesh: 'AP',
    arunachalpradesh: 'AR',
    assam: 'AS',
    bihar: 'BH',
    chhattisgarh: 'CG',
    delhi: 'DL',
    goa: 'GA',
    gujarat: 'GJ',
    haryana: 'HR',
    himachalpradesh: 'HP',
    jharkhand: 'JH',
    karnataka: 'KA',
    kerala: 'KL',
    madhyapradesh: 'MP',
    maharashtra: 'MH',
    odisha: 'OD',
    punjab: 'PB',
    rajasthan: 'RJ',
    tamilnadu: 'TN',
    telangana: 'TS',
    uttarpradesh: 'UP',
    uttarakhand: 'UK',
    westbengal: 'WB',
  };
  const normalizedState = (data.state ?? data.district ?? '').replace(/[^A-Za-z]/g, '').toLowerCase();
  const stateCode =
    stateCodeMap[normalizedState] ||
    (data.state ?? data.district ?? 'XX').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2).padEnd(2, 'X');
  const districtCode = '01';
  const areaCode = (data.pincode ?? data.phone.slice(-6) ?? '')
    .replace(/\D/g, '')
    .slice(-6)
    .padStart(6, '0');
  const rawDealerSequence = (data.dealerPhone ?? '').replace(/\D/g, '').slice(-3);
  const dealerSequence = rawDealerSequence ? rawDealerSequence.padStart(3, '0') : '001';
  const memberSequence = data.phone.replace(/\D/g, '').slice(-3).padStart(3, '0');
  return `${stateCode}-${districtCode}-${areaCode}-${dealerSequence}-${memberSequence}`;
}

function sanitizeElectricianPayload(data: {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  district?: string;
  state?: string;
  address?: string;
  pincode?: string;
  dealerPhone?: string;
  password?: string;
  subCategory?: string;
  electricianCode?: string;
  dealerCode?: string;
  tier?: 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  status?: 'active' | 'pending' | 'inactive' | 'suspended';
}) {
  const dealerCodePrefix = data.dealerCode?.trim();
  return {
    name: data.name,
    phone: normalizePhone(data.phone),
    email: data.email,
    city: data.city?.trim() || data.district?.trim() || '',
    district: data.district?.trim() || data.city?.trim() || '',
    state: data.state?.trim() || '',
    address: data.address?.trim() || undefined,
    pincode: data.pincode?.trim() || undefined,
    dealerPhone: normalizePhone(data.dealerPhone),
    password: data.password?.trim() || undefined,
    subCategory: data.subCategory?.trim() || undefined,
    tier: data.tier ?? 'Silver',
    status: data.status ?? 'pending',
    electricianCode:
      data.electricianCode?.trim() ||
      (dealerCodePrefix ? `${dealerCodePrefix}-001` : '') ||
      buildElectricianCodeFallback({
        phone: normalizePhone(data.phone),
        state: data.state,
        pincode: data.pincode,
        district: data.district ?? data.city,
        dealerPhone: normalizePhone(data.dealerPhone),
      }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (data: {
    phone: string;
    password: string;
    role: 'electrician' | 'dealer' | 'user' | 'counterboy';
  }) => authApi.loginWithPassword(data.phone, data.role, data.password),

  register: async (data: {
    name: string;
    phone: string;
    email?: string;
    password?: string;
    role: 'electrician' | 'dealer' | 'user' | 'counterboy';
    address?: string;
    state?: string;
    city?: string;
    pincode?: string;
  }) => {
    if (data.role === 'dealer') {
      return authApi.registerDealer({
        name: data.name,
        phone: data.phone,
        email: data.email,
        town: '',
        district: '',
        state: '',
        address: '',
        password: data.password,
      });
    }
    if (data.role === 'counterboy') {
      return authApi.registerCounterBoy({
        name: data.name,
        phone: data.phone,
        email: data.email,
        password: data.password,
        address: data.address,
        state: data.state,
        city: data.city,
        district: data.city,
        pincode: data.pincode,
      });
    }
    if (data.role === 'user') {
      return authApi.registerUser({
        name: data.name,
        phone: data.phone,
        email: data.email,
        password: data.password,
        address: data.address,
        state: data.state,
        city: data.city,
        district: data.city,
        pincode: data.pincode,
      });
    }
    return authApi.registerElectrician({
      name: data.name,
      phone: data.phone,
      email: data.email,
      city: '',
      district: '',
      state: '',
      dealerPhone: '',
      password: data.password,
    });
  },

  sendOtp: (phone: string, role: 'electrician' | 'dealer' | 'user' | 'counterboy') =>
    api.post<{ success: boolean; message: string; devOtp?: string }>(
      '/mobile/auth/send-otp', { phone: normalizePhone(phone), role }
    ),

  sendSignupOtp: (phone: string, role: 'electrician' | 'dealer' | 'user' | 'counterboy') =>
    api.post<{ success: boolean; message: string; devOtp?: string }>(
      '/mobile/auth/signup/send-otp', { phone: normalizePhone(phone), role }
    ),

  verifyOtp: async (phone: string, role: 'electrician' | 'dealer' | 'user' | 'counterboy', otp: string) => {
    const res = await api.post<{ accessToken: string; refreshToken: string; user: UserProfile }>(
      '/mobile/auth/verify-otp', { phone: normalizePhone(phone), role, otp }
    );
    await storage.setTokens(res.accessToken, res.refreshToken);
    await storage.setUserProfile(res.user);
    await storage.setUserRole(role);
    return res;
  },

  verifySignupOtp: (phone: string, role: 'electrician' | 'dealer' | 'user' | 'counterboy', otp: string) =>
    api.post<{ success: boolean; message: string }>(
      '/mobile/auth/signup/verify-otp',
      { phone: normalizePhone(phone), role, otp }
    ),

  loginWithPassword: async (
    phone: string,
    role: 'electrician' | 'dealer' | 'user' | 'counterboy',
    password: string
  ) => {
    const res = await api.post<{ accessToken: string; refreshToken: string; user: UserProfile }>(
      '/mobile/auth/password-login',
      { phone: normalizePhone(phone), role, password }
    );
    await storage.setTokens(res.accessToken, res.refreshToken);
    await storage.setUserProfile(res.user);
    await storage.setUserRole(role);
    return res;
  },

  registerDealer: async (data: {
    name: string;
    phone: string;
    email?: string;
    town: string;
    district: string;
    state: string;
    address: string;
    pincode?: string;
    gstNumber?: string;
    password?: string;
  }) => {
    const res = await api.post<{ accessToken: string; refreshToken: string; user: UserProfile }>(
      '/mobile/auth/signup/dealer',
      sanitizeDealerSignupPayload(data)
    );
    await storage.setTokens(res.accessToken, res.refreshToken);
    await storage.setUserProfile(res.user);
    await storage.setUserRole('dealer');
    return res;
  },

  registerElectrician: async (data: {
    name: string;
    phone: string;
    email?: string;
    city: string;
    district: string;
    state: string;
    address?: string;
    pincode?: string;
    dealerPhone: string;
    password?: string;
    subCategory?: string;
    electricianCode?: string;
    dealerCode?: string;
    tier?: 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
    status?: 'active' | 'pending' | 'inactive' | 'suspended';
  }) => {
    const res = await api.post<{ accessToken: string; refreshToken: string; user: UserProfile }>(
      '/mobile/auth/signup/electrician',
      sanitizeElectricianPayload(data)
    );
    await storage.setTokens(res.accessToken, res.refreshToken);
    await storage.setUserProfile(res.user);
    await storage.setUserRole('electrician');
    return res;
  },

  registerUser: async (data: {
    name: string;
    phone: string;
    email?: string;
    city?: string;
    state?: string;
    district?: string;
    address?: string;
    pincode?: string;
    password?: string;
  }) => {
    const res = await api.post<{ accessToken: string; refreshToken: string; user: UserProfile }>(
      '/mobile/auth/signup/user',
      { ...data, phone: normalizePhone(data.phone) }
    );
    await storage.setTokens(res.accessToken, res.refreshToken);
    await storage.setUserProfile(res.user);
    await storage.setUserRole('user');
    return res;
  },

  registerCounterBoy: async (data: {
    name: string;
    phone: string;
    email?: string;
    city?: string;
    state?: string;
    district?: string;
    address?: string;
    pincode?: string;
    password?: string;
  }) => {
    const res = await api.post<{ accessToken: string; refreshToken: string; user: UserProfile }>(
      '/mobile/auth/signup/counterboy',
      sanitizeCounterBoySignupPayload(data)
    );
    await storage.setTokens(res.accessToken, res.refreshToken);
    await storage.setUserProfile(res.user);
    await storage.setUserRole('counterboy');
    return res;
  },

  updateProfile: (data: Partial<UserProfile>) =>
    api.patch<UserProfile>('/mobile/auth/profile', sanitizeUserProfileUpdatePayload(data), true),

  getProfile: () =>
    api.get<UserProfile>('/mobile/auth/profile', undefined, true),

  logout: async (accessTokenOverride?: string | null) => {
    const accessToken = accessTokenOverride ?? await storage.getAccessToken();

    if (!accessToken) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    try {
      await fetch(`${apiBaseUrl}/mobile/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        signal: controller.signal,
      });
    } catch {
      // Local logout should still succeed even if backend is unavailable.
    } finally {
      clearTimeout(timer);
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS & CATALOG
// ─────────────────────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (category?: string) =>
    api.get<{ data: Product[] }>('/mobile/products', category ? { category } : undefined),
};

export const catalogApi = {
  getCategories: () =>
    api.get<{ data: ProductCategory[] }>('/mobile/products/categories'),

  getProducts: (params?: { category?: string; search?: string }) =>
    api.get<{ data: Product[] }>('/mobile/products', params),

  getProductById: (id: string) =>
    api.get<Product>(`/mobile/products/${id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// BANNERS
// ─────────────────────────────────────────────────────────────────────────────
export const bannersApi = {
  getAll: (role?: string) =>
    api.get<{ data: Banner[] }>('/mobile/banners', role ? { role } : undefined),
};

// ─────────────────────────────────────────────────────────────────────────────
// GIFT STORE
// ─────────────────────────────────────────────────────────────────────────────
export const giftStoreApi = {
  getProducts: (role?: string) =>
    api.get<{ data: GiftProduct[] }>('/mobile/gift-products', role ? { role } : undefined),
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (role?: string, userId?: string) => {
    const params: Record<string, string> = {};
    if (role) params.role = role;
    if (userId) params.userId = userId;
    return api.get<{ data: AppNotification[] }>(
      '/mobile/notifications',
      Object.keys(params).length ? params : undefined,
      true
    );
  },
  delete: (id: string) =>
    api.delete<{ message: string }>(`/mobile/notifications/${id}`, true),
};

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────
export const settingsApi = {
  getMaintenance: () =>
    api.get<{ maintenanceMode: boolean; message?: string }>('/mobile/settings/maintenance'),
  getAppSettings: () =>
    api.get<AppSettings>('/mobile/app-settings'),
};

// ─────────────────────────────────────────────────────────────────────────────
// OFFERS / REWARDS
// ─────────────────────────────────────────────────────────────────────────────
export const offersApi = {
  getAll: (role?: string) =>
    api.get<{ data: Offer[] }>('/mobile/offers', role ? { role } : undefined),
};

// ─────────────────────────────────────────────────────────────────────────────
// TESTIMONIALS
// ─────────────────────────────────────────────────────────────────────────────
export const testimonialsApi = {
  getAll: () =>
    api.get<{ data: Testimonial[] }>('/mobile/testimonials'),
};

// ─────────────────────────────────────────────────────────────────────────────
// DEALER LOOKUP
// ─────────────────────────────────────────────────────────────────────────────
export const dealerApi = {
  getByPhone: (phone: string) =>
    api.get<DealerInfo>('/mobile/dealer/by-phone', { phone: normalizePhone(phone) }),
};

// ─────────────────────────────────────────────────────────────────────────────
// SCAN
// ─────────────────────────────────────────────────────────────────────────────
export const scanApi = {
  submit: (qrCode: string, mode: 'single' | 'multi') =>
    api.post<ScanResult>('/mobile/scan', { qrCode, mode }, true),

  getHistory: (page = 1, limit = 50) =>
    api.get<PaginatedScans>('/mobile/scan-history', { page, limit }, true),
};

// ─────────────────────────────────────────────────────────────────────────────
// WALLET
// ─────────────────────────────────────────────────────────────────────────────
export const walletApi = {
  get: (page = 1, limit = 50) =>
    api.get<WalletData>('/mobile/wallet', { page, limit }, true),

  getScanHistory: (page = 1, limit = 50) =>
    api.get<PaginatedScans>('/mobile/scan-history', { page, limit }, true),

  saveBankAccount: (data: BankAccountPayload) =>
    api.post<{ message: string }>('/mobile/wallet/bank-account', data, true),

  redeemReward: (data: { schemeId: string; note?: string }) =>
    api.post<{ message: string }>('/mobile/wallet/redeem', data, true),

  requestBankTransfer: (data: { amount: number }) =>
    api.post<{ message: string; redemptionId?: string; walletBalance?: number }>(
      '/mobile/wallet/bank-transfer-request',
      data,
      true
    ),

  lookupTransferRecipient: (phone: string) =>
    api.get<TransferRecipient>('/mobile/wallet/transfer/recipient', { phone }, true),

  transferPoints: (data: { receiverPhone: string; points: number }) =>
    api.post<{ message: string }>('/mobile/wallet/transfer', data, true),

  getRedemptions: (page = 1, limit = 20) =>
    api.get<{ data: RedemptionRecord[]; total: number; page: number; totalPages: number }>(
      '/mobile/redemptions', { page, limit }, true
    ),

  getDealerBonus: () =>
    api.get<DealerBonus>('/mobile/wallet/dealer-bonus', undefined, true),

  requestDealerBonusWithdrawal: (data: { amount: number }) =>
    api.post<{ message: string }>('/mobile/wallet/dealer-bonus/withdrawals', data, true),
};

// ─────────────────────────────────────────────────────────────────────────────
// ELECTRICIANS (for dealer)
// ─────────────────────────────────────────────────────────────────────────────
export const electriciansApi = {
  getAll: (page = 1, limit = 50, search?: string) =>
    api.get<PaginatedElectricians>('/mobile/electricians', { page, limit, search }, true),

  add: (data: {
    name: string;
    phone: string;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
    dealerPhone?: string;
    electricianCode?: string;
    dealerCode?: string;
    tier?: 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
    status?: 'active' | 'pending' | 'inactive' | 'suspended';
  }) =>
    api.post<{ message: string; electrician: ElectricianProfile }>(
      '/mobile/electricians',
      sanitizeElectricianPayload(data),
      true
    ),

  getCallList: () =>
    api.get<{ data: CallListItem[] }>('/mobile/electricians/call-list', undefined, true),
};

// ─────────────────────────────────────────────────────────────────────────────
// REDEMPTIONS
// ─────────────────────────────────────────────────────────────────────────────
export const redemptionsApi = {
  getHistory: (page = 1, limit = 20) =>
    api.get<{ data: RedemptionRecord[]; total: number; page: number; totalPages: number }>(
      '/mobile/redemptions', { page, limit }, true
    ),
};

export const ordersApi = {
  getAll: () =>
    api.get<UserOrder[]>('/mobile/profile/orders', undefined, true),
};

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () =>
    api.get<UserProfile>('/mobile/auth/profile', undefined, true),

  update: (data: Partial<UserProfile>) =>
    api.patch<UserProfile>('/mobile/auth/profile', sanitizeUserProfileUpdatePayload(data), true),

  uploadPhoto: (base64DataUri: string, source = 'upload') =>
    api.patch<{ profileImage: string }>('/mobile/profile/photo', { profileImage: base64DataUri, source }, true),

  removePhoto: () =>
    api.delete<{ removed: boolean }>('/mobile/profile/photo', true),

  getQrCode: () =>
    api.get<UserQrCode>('/mobile/profile/qr-code', undefined, true),

  changePassword: (data: { currentPassword?: string; newPassword: string }) =>
    api.patch<{ message: string }>('/mobile/profile/password', data, true),

  updatePreferences: (data: { language?: string; darkMode?: boolean; pushEnabled?: boolean }) =>
    api.patch<UserProfile>('/mobile/auth/profile', data, true),

  uploadDocument: async (file: { uri: string; type: string; name: string }, documentType: 'aadhar-front' | 'aadhar-back' | 'pan' | 'gst') => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const accessToken = await storage.getAccessToken();
    const response = await fetch(`${apiBaseUrl}/upload/aadhar-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    const result = await response.json();
    return result.url as string;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SUPPORT
// ─────────────────────────────────────────────────────────────────────────────
export const supportApi = {
  createTicket: (data: { subject: string; comment: string; photoUrl?: string }) =>
    api.post<{ message: string; ticketId: string }>('/mobile/support', data, true),
  getMyTickets: () =>
    api.get<{ data: any[] }>('/mobile/support/tickets', undefined, true),
  replyToTicket: (ticketId: string, message: string) =>
    api.post<{ message: string }>(`/mobile/support/tickets/${ticketId}/reply`, { message }, true),
  closeTicket: (ticketId: string) =>
    api.patch<{ message: string }>(`/mobile/support/tickets/${ticketId}/close`, {}, true),
};

// ─────────────────────────────────────────────────────────────────────────────
// REFERRAL
// ─────────────────────────────────────────────────────────────────────────────
export const referralApi = {
  get: () =>
    api.get<{ code: string; link: string | null; channels: string[] }>('/mobile/referral', undefined, true),
};

// ─────────────────────────────────────────────────────────────────────────────
// APP RATING
// ─────────────────────────────────────────────────────────────────────────────
export const ratingApi = {
  submit: (rating: number, review?: string) =>
    api.post<{ id: string; rating: number }>('/mobile/rating', { rating, review }, true),

  get: () =>
    api.get<{ id: string; rating: number; review: string | null } | null>('/mobile/rating', undefined, true),
};

// ─────────────────────────────────────────────────────────────────────────────
// REWARD SCHEMES
// ─────────────────────────────────────────────────────────────────────────────
export const rewardSchemesApi = {
  getAll: (category?: string) =>
    api.get<{ data: RewardScheme[] }>('/mobile/reward-schemes', category ? { category } : undefined),
};

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type UserProfile = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: 'electrician' | 'dealer' | 'user' | 'counterboy';
  profileImage?: string | null;
  // Electrician fields
  electricianCode?: string;
  city?: string;
  state?: string;
  district?: string;
  pincode?: string;
  address?: string;
  language?: string;
  darkMode?: boolean;
  pushEnabled?: boolean;
  tier?: string;
  subCategory?: string;
  totalPoints?: number;
  totalScans?: number;
  walletBalance?: number;
  totalRedemptions?: number;
  dealerId?: string;
  dealerName?: string;
  dealerPhone?: string;
  dealerTown?: string;
  dealerCode?: string;
  counterboyCode?: string;
  userCode?: string;
  // Dealer fields
  town?: string;
  electricianCount?: number;
  gstNumber?: string;
  // Common
  status?: string;
  approvalRejectionReason?: string;
  kycStatus?: string;
  kycRejectionReason?: string;
  bankLinked?: boolean;
  upiId?: string;
  bankAccount?: string;
  ifsc?: string;
  bankName?: string;
  accountHolderName?: string;
  // KYC documents
  aadharFrontImage?: string | null;
  panDocument?: string | null;
  gstDocument?: string | null;
  // Legacy compat
  fullName?: string;
  pointsBalance?: number;
  scanCount?: number;
};

export type ProductCategory = {
  id: string;
  categoryId?: string;
  label: string;
  slug?: string;
  glyph?: string | null;
  imageUrl?: string | null;
  productCount?: number;
};

export type Product = {
  id: string;
  name: string;
  sub: string;
  description?: string;
  category: string;
  categoryId?: string;
  image?: string;
  imageUrl?: string;
  points: number;
  badge?: string;
  price: number;
  isActive: boolean;
  totalScanned?: number;
};

export type Banner = {
  id: string;
  title: string;
  imageUrl?: string;
  bgColor?: string;
  resizeMode?: string;
  isActive: boolean;
  displayOrder: number;
  targetRole?: string[];
};

export type GiftProduct = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  pointsRequired: number;
  mrp: number;
  stock: number;
  badge: string;
  targetRole: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  targetRole?: string;
  status: string;
  sentAt?: string;
  imageUrl?: string;
};

export type Offer = {
  id: string;
  title: string;
  description: string;
  discount?: string;
  validFrom: string;
  validTo: string;
  targetRole?: string;
  bonusPoints: number;
  imageUrl?: string;
};

export type Testimonial = {
  id: string;
  personName: string;
  initials?: string;
  location?: string;
  tier?: string;
  yearsConnected: number;
  quote: string;
  highlight?: string;
  gradientColors: string[];
  ringColor?: string;
  isActive: boolean;
};

export type DealerInfo = {
  id: string;
  name: string;
  businessName?: string;
  contactPerson?: string;
  phone: string;
  dealerCode: string;
  town: string;
  district: string;
  state: string;
  electricianCount?: number;
  nextElectricianSerial?: number | string;
};

export type TransferRecipient = {
  id: string;
  name: string;
  phone: string;
  role: 'electrician' | 'dealer' | 'user' | 'counterboy';
};

export type AppSettings = {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  supportPhone: string;
  supportEmail: string;
  whatsappNumber: string;
  appVersion: string;
  minAppVersion: string;
  forceUpdate: boolean;
  scanEnabled: boolean;
  giftsEnabled: boolean;
  referralEnabled: boolean;
  testimonialsEnabled: boolean;
  playEnabled: boolean;
  dealerCanAddElectrician: boolean;
  playStoreUrl?: string;
  appStoreUrl?: string;
  generalCatalogPdfUrl?: string | null;
  dealerCatalogPdfUrl?: string | null;
  catalogPdfUrl?: string | null;
  rolePageControls?: Record<string, Record<string, boolean>> | null;
  appPageContent?: AppPageContentMap | null;
  pageSectionOrder?: Record<string, Record<string, string[]>> | null;
  privacyPolicyContent?: string | null;
  privacyPolicyUpdated?: string | null;
};

export type ScanResult = {
  success: boolean;
  scan: {
    id: string;
    productName: string;
    points: number;
    mode: string;
    scannedAt: string;
  };
  pointsEarned: number;
};

export type WalletData = {
  balance: number;
  totalPoints: number;
  totalScans: number;
  transactions: {
    data: WalletTransaction[];
    total: number;
    page: number;
    totalPages: number;
  };
};

export type WalletTransaction = {
  id: string;
  type: 'credit' | 'debit';
  source: string;
  amount: number;
  description?: string;
  createdAt: string;
};

export type PaginatedScans = {
  data: ScanRecord[];
  total: number;
  page: number;
  totalPages: number;
};

export type ScanRecord = {
  id: string;
  productName: string;
  points: number;
  mode: string;
  scannedAt: string;
  qrCode?: string;
};

export type PaginatedElectricians = {
  data: ElectricianProfile[];
  total: number;
  page: number;
  totalPages: number;
};

export type ElectricianProfile = {
  id: string;
  name: string;
  phone: string;
  electricianCode: string;
  city: string;
  state: string;
  tier: string;
  totalPoints: number;
  totalScans: number;
  status: string;
};

export type RedemptionRecord = {
  id: string;
  type: string;
  points: number;
  amount: number;
  status: string;
  upiId?: string;
  bankAccount?: string;
  transactionId?: string;
  requestedAt: string;
  processedAt?: string;
};

export type UserOrder = {
  id: string;
  status: string;
  title: string;
  userId: string;
  userName: string;
  points: number;
  deliveredAt?: string | null;
  createdAt: string;
};

export type DealerBonus = {
  availableBonus: number;
  totalBonus: number;
  pendingWithdrawals: number;
};

export type BankAccountPayload = {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  upiId?: string;
};

export type CallListItem = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  city?: string;
  status: string;
};

export type UserQrCode = {
  id: string;
  userId: string;
  qrValue: string;
  qrApiUrl: string | null;
  storedQrImageUrl: string | null;
  generatedAt: string;
};

export type RewardScheme = {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  imageUrl?: string | null;
  mrp?: number | null;
  active: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// PLAYS
// ─────────────────────────────────────────────────────────────────────────────
export const playsApi = {
  getAll: () =>
    api.get<{ data: PlayVideo[] }>('/mobile/plays', undefined, true),

  recordView: (id: string) =>
    api.post<{ message: string }>(`/mobile/plays/${id}/view`, {}, true),

  getInteractions: (id: string) =>
    api.get<PlayInteractions>(`/mobile/plays/${id}/interactions`, undefined, true),

  toggleLike: (id: string) =>
    api.post<PlayInteractions>(`/mobile/plays/${id}/like`, {}, true),

  addComment: (id: string, message: string) =>
    api.post<PlayInteractions>(`/mobile/plays/${id}/comments`, { message }, true),
};

export type PlayVideo = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  category: string;   // reels | guides | tips
  displayOrder: number;
  isActive: boolean;
  targetRoles?: string[];
  viewCount: number;
  createdAt: string;
};

export type PlayCommentReply = {
  id: string;
  message: string;
  authorName?: string;
  authorRole?: string;
  createdAt: string;
};

export type PlayComment = {
  id: string;
  message: string;
  authorName?: string;
  authorRole?: string;
  createdAt: string;
  replies?: PlayCommentReply[];
};

export type PlayInteractions = {
  playId: string;
  likeCount: number;
  likedByMe: boolean;
  comments: PlayComment[];
};
