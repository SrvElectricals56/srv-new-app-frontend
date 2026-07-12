import type { UserRole } from '@/shared/types/navigation';

export const dealerDirectory: Record<string, { dealerName: string; city: string }> = {
  '9876543210': { dealerName: 'Shree Ganesh Electrical Traders', city: 'Jaipur' },
  '9810012345': { dealerName: 'Mahalaxmi Power House', city: 'Delhi' },
  '9001122334': { dealerName: 'Shiv Shakti Distributors', city: 'Lucknow' },
};

export const roleContent: Record<
  UserRole,
  { title: string; description: string; tone: [string, string, string] }
> = {
  electrician: {
    title: 'Welcome to SRV',
    description: 'Electrician access for QR rewards, secure login, and fast registration.',
    tone: ['#EAF3FF', '#173E80', '#102A63'],
  },
  dealer: {
    title: 'Welcome to SRV',
    description: 'Dealer access for business onboarding, orders, and verified partner login.',
    tone: ['#DAB267', '#4F6DAF', '#253658'],
  },
  user: {
    title: 'Welcome to SRV',
    description: 'Browse certified electrical products and connect with dealers and electricians.',
    tone: ['#FBF1E7', '#8D4A1E', '#6A2F12'],
  },
  counterboy: {
    title: 'Welcome to SRV',
    description: 'Counter boy access for billing support, scanning, and day-to-day store operations.',
    tone: ['#F5EDE4', '#8B3C2A', '#6F4E37'],
  },
};

export const featuredProducts = [
  {
    id: 'fp1',
    category: 'fanbox',
    name: 'Fan Box 3" Range',
    description: 'F8 / FC / FDB 18-40 PC',
    price: 'Rs 89',
    points: 10,
    image: 'https://srvelectricals.com/cdn/shop/files/F8_3_18-40.png?v=1757426631&width=320',
    colors: ['#FFF8EF', '#F3D6AF'] as [string, string],
  },
  {
    id: 'fp2',
    category: 'fanbox',
    name: 'Fan Box 4" Range',
    description: 'FC 4 17-30 / 20-40 PC',
    price: 'Rs 104',
    points: 12,
    image: 'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=320',
    colors: ['#FFF7F0', '#F6D9B8'] as [string, string],
  },
  {
    id: 'fp3',
    category: 'concealedbox',
    name: 'Concealed Box 3"',
    description: 'CRD PL precision build',
    price: 'Rs 120',
    points: 15,
    image: 'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=320',
    colors: ['#F2F7FF', '#D8E5FF'] as [string, string],
  },
  {
    id: 'fp4',
    category: 'led',
    name: 'LED Flood Light Sleek',
    description: 'Outdoor high-throw lighting',
    price: 'Rs 699',
    points: 30,
    image: 'https://srvelectricals.com/cdn/shop/files/FloodLightSleek.png?v=1757426471&width=320',
    colors: ['#FFFCEE', '#F4E7B8'] as [string, string],
  },
];

export const productCategories = [
  { id: 'fanbox', label: 'Fan Box', glyph: 'FB' },
  { id: 'concealedbox', label: 'Concealed Box', glyph: 'CB' },
  { id: 'modularbox', label: 'Modular Box', glyph: 'MB' },
  { id: 'appliances', label: 'Appliances', glyph: 'AP' },
  { id: 'junctionbox', label: 'Junction Box', glyph: 'JB' },
  { id: 'accessories', label: 'Accessories', glyph: 'AC' },
];

export const products = [
  {
    id: '1',
    name: 'FAN BOX 3 RANGE',
    sub: 'F8/FC/FDB 18/40 PC',
    category: 'fanbox',
    image: 'https://srvelectricals.com/cdn/shop/files/F8_3_18-40.png?v=1757426631&width=240',
    points: 10,
    badge: 'Popular',
  },
  {
    id: '2',
    name: 'FAN BOX 4 RANGE',
    sub: 'FC 4 17/30, 20/40 PC',
    category: 'fanbox',
    image: 'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=240',
    points: 12,
    badge: '',
  },
  {
    id: '3',
    name: 'CONCEALED BOX 3',
    sub: 'CRD PL 3 precision engineered',
    category: 'concealedbox',
    image: 'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=240',
    points: 15,
    badge: 'Best Seller',
  },
  {
    id: '4',
    name: 'MODULE BOX PLATINUM',
    sub: 'Premium modular range',
    category: 'modularbox',
    image:
      'https://srvelectricals.com/cdn/shop/files/3x3_679e5d30-ecf2-446e-9452-354bbf4c4a26.png?v=1757426377&width=240',
    points: 25,
    badge: 'Premium',
  },
  {
    id: '5',
    name: 'HEAT BLOWER O2',
    sub: 'Home heater blower O2 series',
    category: 'appliances',
    image:
      'https://srvelectricals.com/cdn/shop/files/Home-Heater-O2-Blower.png?v=1741846484&width=240',
    points: 50,
    badge: 'Hot',
  },
  {
    id: '6',
    name: 'JUNCTION BOX CNG',
    sub: 'CNG type multi-purpose',
    category: 'junctionbox',
    image: 'https://srvelectricals.com/cdn/shop/files/Junction_Box_CNG.png?v=1757426491&width=240',
    points: 12,
    badge: '',
  },
  {
    id: '7',
    name: '2-PIN PLUG',
    sub: 'Girish series premium quality',
    category: 'accessories',
    image: 'https://srvelectricals.com/cdn/shop/files/2-Pin-Girish.png?v=1756461334&width=240',
    points: 5,
    badge: 'New',
  },
  {
    id: '8',
    name: 'SRV MCB 32A',
    sub: 'Miniature circuit breaker 32 amp',
    category: 'mcb',
    image: '',
    points: 20,
    badge: '',
  },
  {
    id: '9',
    name: 'SRV SWITCH 16A',
    sub: '16 amp switch modular',
    category: 'switch',
    image: '',
    points: 15,
    badge: '',
  },
  {
    id: '10',
    name: 'SRV SOCKET OUTLET',
    sub: 'Universal socket outlet',
    category: 'socket',
    image: '',
    points: 18,
    badge: '',
  },
];

export const rewards = [
  {
    id: 'r1',
    name: 'Rs 100 Cashback',
    description: 'Direct UPI or bank transfer',
    points: 500,
    progress: 85,
    accent: '#DE3B30',
  },
  {
    id: 'r2',
    name: 'Amazon Voucher',
    description: 'Rs 200 gift card code',
    points: 1000,
    progress: 42,
    accent: '#1F9C5D',
  },
  {
    id: 'r3',
    name: 'SRV Product Bundle',
    description: 'Free kit worth Rs 500',
    points: 2000,
    progress: 60,
    accent: '#35538E',
  },
  {
    id: 'r4',
    name: 'Paytm Voucher',
    description: 'Rs 150 wallet credit',
    points: 750,
    progress: 70,
    accent: '#D7860A',
  },
];

export const recentActivity = [
  {
    id: 'a1',
    label: 'SRV Switch 16A scanned',
    time: 'Today, 10:23 AM',
    amount: '+50',
    positive: true,
  },
  { id: 'a2', label: 'Cashback redeemed', time: 'Yesterday', amount: '-200', positive: false },
  { id: 'a3', label: 'Referral bonus earned', time: '2 days ago', amount: '+100', positive: true },
];

export const defaultProfile = {
  name: 'Harshvardhan',
  phone: '9162038214',
  email: '',
  city: 'Mansa',
  state: 'Punjab',
  pincode: '151505',
  address: 'Green Valley Colony, Mansa, Punjab 151505, India',
  gstHolderName: 'Harshvardhan',
  panHolderName: '',
  gstNumber: 'BIBPB7675A',
  panNumber: '',
  dealerCode: '215548',
};
