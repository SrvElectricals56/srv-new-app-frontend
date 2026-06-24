import type { Screen, UserRole } from '@/shared/types/navigation';

export type AppFeatureKey =
  | Screen
  | 'catalog_pdf'
  | 'whatsapp_support'
  | 'my_redemption'
  | 'my_orders'
  | 'refer_friend'
  | 'need_help'
  | 'offers_promotions'
  | 'password'
  | 'app_settings'
  | 'scan_history'
  | 'contact_support'
  | 'privacy_policy'
  | 'rate_us';

export type RolePageControls = Record<UserRole, Record<AppFeatureKey, boolean>>;

export const APP_FEATURE_LABELS: Record<AppFeatureKey, string> = {
  home: 'Home',
  product: 'Products',
  play: 'Play',
  categories: 'Categories',
  cart: 'Cart',
  checkout: 'Checkout',
  electricians: 'Associate Electricians',
  call_electrician: 'Call Electrician',
  support: 'Support',
  rewards: 'Gift Store',
  profile: 'Profile',
  wallet: 'Wallet',
  notification: 'Notifications',
  scan: 'Scan',
  dealer_tier: 'Dealer Tier',
  electrician_tier: 'Member Tier',
  bank_details: 'Bank Details',
  transfer_points: 'Transfer Points',
  dealer_bonus: 'Dealer Bonus',
  catalog_pdf: 'Product Catalog',
  whatsapp_support: 'WhatsApp Support',
  my_redemption: 'My Redemption',
  my_orders: 'My Orders',
  refer_friend: 'Refer To A Friend',
  need_help: 'Need Help',
  offers_promotions: 'Offers & Promotions',
  password: 'Password',
  app_settings: 'App Settings',
  scan_history: 'Scan History',
  contact_support: 'Contact Support',
  privacy_policy: 'Privacy Policy',
  rate_us: 'Rate Us',
};

const ALL_FEATURE_KEYS = Object.keys(APP_FEATURE_LABELS) as AppFeatureKey[];

const BASE_FEATURES: Record<AppFeatureKey, boolean> = {
  home: true,
  product: true,
  play: false,
  categories: false,
  cart: false,
  checkout: false,
  electricians: false,
  call_electrician: false,
  support: false,
  rewards: false,
  profile: true,
  wallet: true,
  notification: true,
  scan: false,
  dealer_tier: false,
  electrician_tier: false,
  bank_details: true,
  transfer_points: true,
  dealer_bonus: false,
  catalog_pdf: true,
  whatsapp_support: true,
  my_redemption: true,
  my_orders: true,
  refer_friend: true,
  need_help: true,
  offers_promotions: true,
  password: true,
  app_settings: true,
  scan_history: false,
  contact_support: true,
  privacy_policy: true,
  rate_us: true,
};

export const DEFAULT_ROLE_PAGE_CONTROLS: RolePageControls = {
  electrician: {
    ...BASE_FEATURES,
    cart: true,
    checkout: true,
    play: true,
    rewards: true,
    scan: true,
    electrician_tier: true,
    scan_history: true,
  },
  dealer: {
    ...BASE_FEATURES,
    cart: true,
    play: true,
    rewards: true,
    checkout: true,
    electricians: true,
    call_electrician: true,
    dealer_tier: true,
    dealer_bonus: true,
  },
  user: {
    ...BASE_FEATURES,
    play: true,
    categories: true,
    cart: true,
    checkout: true,
    rewards: true,
    transfer_points: false,
  },
  counterboy: {
    ...BASE_FEATURES,
    cart: true,
    play: true,
    rewards: true,
    checkout: true,
    scan: true,
    scan_history: true,
    transfer_points: false,
  },
};

export function resolveRolePageControls(input?: unknown): RolePageControls {
  const normalized: RolePageControls = JSON.parse(JSON.stringify(DEFAULT_ROLE_PAGE_CONTROLS));

  if (!input || typeof input !== 'object') {
    return normalized;
  }

  for (const role of Object.keys(DEFAULT_ROLE_PAGE_CONTROLS) as UserRole[]) {
    const roleConfig = (input as Record<string, unknown>)[role];
    if (!roleConfig || typeof roleConfig !== 'object') {
      continue;
    }
    for (const key of ALL_FEATURE_KEYS) {
      const nextValue = (roleConfig as Record<string, unknown>)[key];
      if (typeof nextValue === 'boolean') {
        normalized[role][key] = nextValue;
      }
    }
  }

  // Dealer Play Zone stays available even if older server-side settings omit or disable it.
  normalized.dealer.play = true;
  normalized.dealer.cart = true;
  normalized.dealer.checkout = true;
  normalized.electrician.play = true;
  normalized.electrician.cart = true;
  normalized.electrician.checkout = true;
  normalized.user.cart = true;
  normalized.user.checkout = true;
  normalized.counterboy.play = true;
  normalized.counterboy.cart = true;
  normalized.counterboy.checkout = true;
  // Counter boy Gift Store — always enabled; old server configs may not have this set
  normalized.counterboy.rewards = true;
  normalized.counterboy.scan = true;
  normalized.counterboy.scan_history = true;

  return normalized;
}

export function isRoleFeatureEnabled(
  controls: RolePageControls,
  role: UserRole,
  feature: AppFeatureKey
) {
  return controls[role]?.[feature] !== false;
}

export function getAllowedBottomNavScreens(
  controls: RolePageControls,
  role: UserRole,
  screens: Screen[]
) {
  return screens.filter((screen) => isRoleFeatureEnabled(controls, role, screen));
}
