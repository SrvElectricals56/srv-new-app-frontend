import { CUSTOMER_THEME } from '@/features/user/theme';
import type { Screen, UserRole } from '@/shared/types/navigation';
import {
  C,
  defaultProfile,
  type IconName,
  type Profile,
  type SubPage,
} from '../components/ProfileShared';

export type ProfileMenuItem = {
  label: string;
  icon: IconName;
  color: string;
  bg: string;
  screen?: SubPage;
  route?: Screen;
};

export type ProfileDetailRow = {
  label: string;
  key: keyof Profile;
  emptyText?: string;
};

export type ProfileEditRow = {
  label: string;
  key: keyof Profile;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  maxLength?: number;
};

export type DealerMembership = {
  tier: 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  accent: string;
  soft: string;
};

export const electricianMenuItems: ProfileMenuItem[] = [
  {
    label: 'My Redemption',
    icon: 'redeem',
    color: C.primary,
    bg: C.primaryLight,
    screen: 'My Redemption',
  },
  { label: 'Gift Store', icon: 'gift', color: C.teal, bg: C.tealLight, route: 'rewards' },
  {
    label: 'Transfer Points',
    icon: 'transfer',
    color: C.blue,
    bg: C.blueLight,
    screen: 'Transfer Points',
  },
  { label: 'My Orders', icon: 'order', color: C.purple, bg: C.purpleLight, screen: 'My Orders' },
  { label: 'Bank Details', icon: 'bank', color: C.gold, bg: C.goldLight, screen: 'Bank Details' },
  {
    label: 'Refer To A Friend',
    icon: 'refer',
    color: C.blue,
    bg: '#EFF6FF',
    screen: 'Refer To A Friend',
  },
  { label: 'Need Help', icon: 'help', color: C.teal, bg: C.tealLight, screen: 'Need Help' },
  {
    label: 'Offers & Promotions',
    icon: 'offer',
    color: C.gold,
    bg: C.goldLight,
    screen: 'Offers & Promotions',
  },
];

export const dealerMenuItems: ProfileMenuItem[] = [
  {
    label: 'My Redemption',
    icon: 'redeem',
    color: C.primary,
    bg: C.primaryLight,
    screen: 'My Redemption',
  },
  { label: 'Gift Store', icon: 'gift', color: C.teal, bg: C.tealLight, route: 'rewards' },
  {
    label: 'Dealer Bonus',
    icon: 'transfer',
    color: C.blue,
    bg: C.blueLight,
    screen: 'Dealer Bonus',
  },
  { label: 'My Orders', icon: 'order', color: C.purple, bg: C.purpleLight, screen: 'My Orders' },
  { label: 'Bank Details', icon: 'bank', color: C.gold, bg: C.goldLight, screen: 'Bank Details' },
  {
    label: 'Refer To A Friend',
    icon: 'refer',
    color: C.blue,
    bg: '#EFF6FF',
    screen: 'Refer To A Friend',
  },
  { label: 'Need Help', icon: 'help', color: C.teal, bg: C.tealLight, screen: 'Need Help' },
  {
    label: 'Offers & Promotions',
    icon: 'offer',
    color: C.gold,
    bg: C.goldLight,
    screen: 'Offers & Promotions',
  },
];

export const settingsItems: (ProfileMenuItem & { screen: SubPage; badge?: boolean })[] = [
  {
    label: 'Notifications',
    icon: 'notification',
    color: C.gold,
    bg: C.goldLight,
    screen: 'Notifications',
    route: 'notification',
  },
  { label: 'Password', icon: 'lock', color: C.blue, bg: C.blueLight, screen: 'Password' },
  { label: 'Rate Us', icon: 'star', color: '#F59E0B', bg: '#FEF3C7', screen: 'Rate Us' },
  {
    label: 'App Settings',
    icon: 'settings',
    color: C.purple,
    bg: C.purpleLight,
    screen: 'App Settings',
  },
  {
    label: 'Scan History',
    icon: 'history',
    color: C.primary,
    bg: C.primaryLight,
    screen: 'Scan History',
  },
  {
    label: 'Contact Support',
    icon: 'support',
    color: C.teal,
    bg: C.tealLight,
    screen: 'Contact Support',
  },
  { label: 'Privacy Policy', icon: 'lock', color: C.muted, bg: C.bg, screen: 'Privacy Policy' },
];

export const detailRows: ProfileDetailRow[] = [
  { label: 'Mobile Number', key: 'phone' },
  { label: 'Email', key: 'email', emptyText: 'Not provided' },
  { label: 'Address', key: 'address' },
  { label: 'State', key: 'state' },
  { label: 'City', key: 'city' },
  { label: 'District', key: 'district' },
  { label: 'Pincode', key: 'pincode' },
  { label: 'GST Holder Name', key: 'gstHolderName' },
  { label: 'GST Number', key: 'gstNumber' },
  { label: 'PAN Holder Name', key: 'panHolderName', emptyText: 'Not provided' },
  { label: 'PAN Number', key: 'panNumber', emptyText: 'Not provided' },
  { label: 'Dealer Code', key: 'dealerCode' },
];

export const electricianDetailRows: ProfileDetailRow[] = [
  { label: 'Mobile Number', key: 'phone' },
  { label: 'Email', key: 'email', emptyText: 'Not provided' },
  { label: 'Address', key: 'address' },
  { label: 'State', key: 'state' },
  { label: 'City', key: 'city' },
  { label: 'District', key: 'district' },
  { label: 'Pincode', key: 'pincode' },
  { label: 'Electrician Code', key: 'electricianCode' },
];

/** Counter boy profile detail list — same as electrician but ID field */
export const counterboyDetailRows: ProfileDetailRow[] = [
  { label: 'Mobile Number', key: 'phone' },
  { label: 'Email', key: 'email', emptyText: 'Not provided' },
  { label: 'Address', key: 'address' },
  { label: 'State', key: 'state' },
  { label: 'City', key: 'city' },
  { label: 'District', key: 'district' },
  { label: 'Pincode', key: 'pincode' },
  { label: 'Counter Boy ID', key: 'counterboyCode' },
];

export const counterboyMenuItems: ProfileMenuItem[] = electricianMenuItems.filter(
  (item) => item.screen !== 'Transfer Points'
);

/** Customer app — same routes as counter boy; warm accent colors */
export const userMenuItems: ProfileMenuItem[] = [
  {
    label: 'My Redemption',
    icon: 'redeem',
    color: CUSTOMER_THEME.primaryDeep,
    bg: CUSTOMER_THEME.soft,
    screen: 'My Redemption',
  },
  {
    label: 'Gift Store',
    icon: 'gift',
    color: '#0D9488',
    bg: '#CCFBF1',
    route: 'rewards',
  },
  {
    label: 'Cart',
    icon: 'order',
    color: CUSTOMER_THEME.primary,
    bg: '#F0DEC9',
    route: 'cart',
  },
  { label: 'My Orders', icon: 'order', color: '#6A2F12', bg: '#F5E8DC', screen: 'My Orders' },
  { label: 'Bank Details', icon: 'bank', color: '#B45309', bg: '#FEF3C7', screen: 'Bank Details' },
  {
    label: 'Refer To A Friend',
    icon: 'refer',
    color: CUSTOMER_THEME.primary,
    bg: '#F0DEC9',
    screen: 'Refer To A Friend',
  },
  { label: 'Need Help', icon: 'help', color: '#0D9488', bg: '#CCFBF1', screen: 'Need Help' },
  {
    label: 'Offers & Promotions',
    icon: 'offer',
    color: '#B45309',
    bg: '#FEF3C7',
    screen: 'Offers & Promotions',
  },
];

export const userDetailRows: ProfileDetailRow[] = [
  { label: 'Mobile Number', key: 'phone' },
  { label: 'Email', key: 'email', emptyText: 'Not provided' },
  { label: 'Address', key: 'address' },
  { label: 'State', key: 'state' },
  { label: 'City', key: 'city' },
  { label: 'District', key: 'district' },
  { label: 'Pincode', key: 'pincode' },
  { label: 'Customer ID', key: 'userCode' },
];

export const editRows: ProfileEditRow[] = [
  { label: 'Full Name', key: 'name' },
  { label: 'Phone Number', key: 'phone', keyboardType: 'phone-pad', maxLength: 10 },
  { label: 'Email', key: 'email', keyboardType: 'email-address' },
  { label: 'City', key: 'city' },
  { label: 'District', key: 'district' },
  { label: 'State', key: 'state' },
  { label: 'Pincode', key: 'pincode', keyboardType: 'phone-pad', maxLength: 6 },
  { label: 'Address', key: 'address' },
];

export const getProfileByRole = (_currentRole: UserRole): Profile => ({
  ...defaultProfile,
});

export const getTaxIdentityValue = (profile: Profile) =>
  profile.gstNumber || profile.panNumber || '';

export const getTaxHolderValue = (profile: Profile) =>
  profile.gstHolderName || profile.panHolderName || '';

export const getDealerMembership = (electricianCount: number): DealerMembership => {
  if (electricianCount <= 100) {
    return {
      tier: 'Silver',
      accent: '#64748B',
      soft: '#E2E8F0',
    };
  }

  if (electricianCount <= 300) {
    return {
      tier: 'Gold',
      accent: '#D97706',
      soft: '#FEF3C7',
    };
  }

  if (electricianCount <= 500) {
    return {
      tier: 'Platinum',
      accent: '#2563EB',
      soft: '#DBEAFE',
    };
  }

  return {
    tier: 'Diamond',
    accent: '#0E7490',
    soft: '#CFFAFE',
  };
};
