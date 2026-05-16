import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { type AppLanguage, usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import { useAppData } from '@/shared/context/AppDataContext';
import type { Screen } from '@/shared/types/navigation';
import type { Product as ApiProduct, ProductCategory as ApiProductCategory } from '@/shared/api';

const Colors = {
  primary: '#E8453C',
  background: '#F2F3F7',
  surface: '#FFFFFF',
  border: '#EEEEF3',
  textDark: '#1C1E2E',
  textMuted: '#9898A8',
};

const REAL_PRODUCT_IMAGES: Record<string, string> = {
  fanbox:       'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=320',
  concealedbox: 'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=320',
  modular:      'https://srvelectricals.com/cdn/shop/files/3x3_679e5d30-ecf2-446e-9452-354bbf4c4a26.png?v=1757426377&width=320',
  mcb:          'https://srvelectricals.com/cdn/shop/files/MCB_Box_4_Way_GI.png?v=1757426418&width=320',
  busbar:       'https://srvelectricals.com/cdn/shop/files/Bus_Bar_100A_Super.png?v=1757426672&width=320',
  exhaust:      'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320',
  led:          'https://srvelectricals.com/cdn/shop/files/FloodLightSleek.png?v=1757426471&width=320',
  changeover:   'https://srvelectricals.com/cdn/shop/files/ACO_100A_FP.png?v=1757426480&width=320',
  mainswitch:   'https://srvelectricals.com/cdn/shop/files/CO_32A_DP_PRM.png?v=1757426515&width=320',
  louver:       'https://srvelectricals.com/cdn/shop/files/Louver_6_inch.png?v=1757426390&width=320',
  axialfan:     'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320',
  ledflood:     'https://srvelectricals.com/cdn/shop/files/FloodLightLense_533x.png?v=1757426472&width=320',
  multipin:     'https://srvelectricals.com/cdn/shop/files/5_Pin_Multi_Plug.png?v=1757426390&width=320',
  pintop:       'https://srvelectricals.com/cdn/shop/files/2_Pin_Top.png?v=1757426390&width=320',
};

type CatColorScheme = {
  gradient: [string, string, string];
  scanBg: string;
  scanText: string;
  cardGradient: [string, string, string];
  iconBg: string;
};

const CAT_COLORS: Record<string, CatColorScheme> = {
  fanbox:       { gradient: ['#4A637B','#6F879F','#93A8BE'], scanBg:'#F5F8FB', scanText:'#4A637B', cardGradient:['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg:'#E5ECF4' },
  concealedbox: { gradient: ['#3B6E8C','#5A8FAD','#8AB4CC'], scanBg:'#F0F7FB', scanText:'#3B6E8C', cardGradient:['#F8FBFD','#E4EFF6','#CCDDE9'], iconBg:'#DFF0F8' },
  modular:      { gradient: ['#5C4A8C','#7B6AAD','#A898CC'], scanBg:'#F5F3FB', scanText:'#5C4A8C', cardGradient:['#FDFCFF','#EDE9F8','#DDD6F0'], iconBg:'#EAE5F8' },
  mcb:          { gradient: ['#1D4ED8','#3B6EF0','#7BA4F8'], scanBg:'#EFF6FF', scanText:'#1D4ED8', cardGradient:['#F8FBFF','#E0EEFF','#C7DDFF'], iconBg:'#DBEAFE' },
  busbar:       { gradient: ['#B45309','#D97706','#F59E0B'], scanBg:'#FFFBEB', scanText:'#B45309', cardGradient:['#FFFEF8','#FEF3C7','#FDE68A'], iconBg:'#FEF3C7' },
  exhaust:      { gradient: ['#065F46','#059669','#34D399'], scanBg:'#F0FDF4', scanText:'#065F46', cardGradient:['#F8FFF9','#DCFCE7','#BBF7D0'], iconBg:'#D1FAE5' },
  led:          { gradient: ['#92400E','#D97706','#FCD34D'], scanBg:'#FFFBEB', scanText:'#92400E', cardGradient:['#FFFEF5','#FEF9C3','#FEF08A'], iconBg:'#FEF3C7' },
  changeover:   { gradient: ['#7C3AED','#8B5CF6','#A78BFA'], scanBg:'#F5F3FF', scanText:'#7C3AED', cardGradient:['#FDFCFF','#EDE9FE','#DDD6FE'], iconBg:'#EDE9FE' },
  mainswitch:   { gradient: ['#BE123C','#E11D48','#FB7185'], scanBg:'#FFF1F2', scanText:'#BE123C', cardGradient:['#FFF8F9','#FFE4E6','#FECDD3'], iconBg:'#FFE4E6' },
  louver:       { gradient: ['#0F766E','#0D9488','#2DD4BF'], scanBg:'#F0FDFA', scanText:'#0F766E', cardGradient:['#F8FFFD','#CCFBF1','#99F6E4'], iconBg:'#CCFBF1' },
  axialfan:     { gradient: ['#065F46','#059669','#34D399'], scanBg:'#F0FDF4', scanText:'#065F46', cardGradient:['#F8FFF9','#DCFCE7','#BBF7D0'], iconBg:'#D1FAE5' },
  ledflood:     { gradient: ['#92400E','#D97706','#FCD34D'], scanBg:'#FFFBEB', scanText:'#92400E', cardGradient:['#FFFEF5','#FEF9C3','#FEF08A'], iconBg:'#FEF3C7' },
  multipin:     { gradient: ['#BE123C','#E11D48','#FB7185'], scanBg:'#FFF1F2', scanText:'#BE123C', cardGradient:['#FFF8F9','#FFE4E6','#FECDD3'], iconBg:'#FFE4E6' },
  pintop:       { gradient: ['#5C4A8C','#7B6AAD','#A898CC'], scanBg:'#F5F3FB', scanText:'#5C4A8C', cardGradient:['#FDFCFF','#EDE9F8','#DDD6F0'], iconBg:'#EAE5F8' },
};

const DYNAMIC_PALETTES: CatColorScheme[] = [
  { gradient: ['#4A637B','#6F879F','#93A8BE'], scanBg:'#F5F8FB', scanText:'#4A637B', cardGradient:['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg:'#E5ECF4' },
  { gradient: ['#1D4ED8','#3B6EF0','#7BA4F8'], scanBg:'#EFF6FF', scanText:'#1D4ED8', cardGradient:['#F8FBFF','#E0EEFF','#C7DDFF'], iconBg:'#DBEAFE' },
  { gradient: ['#065F46','#059669','#34D399'], scanBg:'#F0FDF4', scanText:'#065F46', cardGradient:['#F8FFF9','#DCFCE7','#BBF7D0'], iconBg:'#D1FAE5' },
  { gradient: ['#7C3AED','#8B5CF6','#A78BFA'], scanBg:'#F5F3FF', scanText:'#7C3AED', cardGradient:['#FDFCFF','#EDE9FE','#DDD6FE'], iconBg:'#EDE9FE' },
  { gradient: ['#B45309','#D97706','#F59E0B'], scanBg:'#FFFBEB', scanText:'#B45309', cardGradient:['#FFFEF8','#FEF3C7','#FDE68A'], iconBg:'#FEF3C7' },
  { gradient: ['#BE123C','#E11D48','#FB7185'], scanBg:'#FFF1F2', scanText:'#BE123C', cardGradient:['#FFF8F9','#FFE4E6','#FECDD3'], iconBg:'#FFE4E6' },
  { gradient: ['#0F766E','#0D9488','#2DD4BF'], scanBg:'#F0FDFA', scanText:'#0F766E', cardGradient:['#F8FFFD','#CCFBF1','#99F6E4'], iconBg:'#CCFBF1' },
  { gradient: ['#5C4A8C','#7B6AAD','#A898CC'], scanBg:'#F5F3FB', scanText:'#5C4A8C', cardGradient:['#FDFCFF','#EDE9F8','#DDD6F0'], iconBg:'#EAE5F8' },
];

const catColorCache: Record<string, CatColorScheme> = {};
function getCatColor(id: string, index = 0): CatColorScheme {
  if (CAT_COLORS[id]) return CAT_COLORS[id];
  if (catColorCache[id]) return catColorCache[id];
  const palette = DYNAMIC_PALETTES[index % DYNAMIC_PALETTES.length];
  catColorCache[id] = palette;
  return palette;
}

// ── Real SVG Category Icons ───────────────────────────────────────────
function CatIcon({ id, size = 28, color = '#fff' }: { id: string; size?: number; color?: string }) {
  const s = size;
  switch (id) {
    case 'fanbox':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Rect x="4" y="8" width="24" height="18" rx="3" stroke={color} strokeWidth="2" />
          <Path d="M4 13h24" stroke={color} strokeWidth="2" />
          <Circle cx="16" cy="21" r="3" stroke={color} strokeWidth="1.8" />
          <Path d="M16 16v2M16 24v2M11 21h2M21 21h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <Path d="M12 8V6a4 4 0 018 0v2" stroke={color} strokeWidth="2" />
        </Svg>
      );
    case 'concealedbox':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Rect x="3" y="3" width="26" height="26" rx="4" stroke={color} strokeWidth="2" />
          <Rect x="8" y="8" width="16" height="16" rx="2" stroke={color} strokeWidth="1.8" strokeDasharray="3 2" />
          <Circle cx="16" cy="16" r="3" stroke={color} strokeWidth="1.8" />
          <Path d="M16 11v2M16 19v2M11 16h2M19 16h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      );
    case 'modular':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Rect x="3" y="3" width="12" height="12" rx="2.5" stroke={color} strokeWidth="2" />
          <Rect x="17" y="3" width="12" height="12" rx="2.5" stroke={color} strokeWidth="2" />
          <Rect x="3" y="17" width="12" height="12" rx="2.5" stroke={color} strokeWidth="2" />
          <Rect x="17" y="17" width="12" height="12" rx="2.5" stroke={color} strokeWidth="2" />
          <Circle cx="9" cy="9" r="2" stroke={color} strokeWidth="1.5" />
          <Circle cx="23" cy="9" r="2" stroke={color} strokeWidth="1.5" />
          <Circle cx="9" cy="23" r="2" stroke={color} strokeWidth="1.5" />
          <Circle cx="23" cy="23" r="2" stroke={color} strokeWidth="1.5" />
        </Svg>
      );
    case 'mcb':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Rect x="5" y="3" width="22" height="26" rx="3" stroke={color} strokeWidth="2" />
          <Rect x="9" y="7" width="6" height="8" rx="1.5" stroke={color} strokeWidth="1.6" />
          <Rect x="17" y="7" width="6" height="8" rx="1.5" stroke={color} strokeWidth="1.6" />
          <Path d="M9 20h14M9 23h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <Path d="M14 7V5M18 7V5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      );
    case 'busbar':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Rect x="3" y="5" width="26" height="22" rx="3" stroke={color} strokeWidth="2" />
          <Path d="M3 12h26M3 20h26" stroke={color} strokeWidth="1.8" />
          <Path d="M9 5v5M16 5v5M23 5v5M9 20v7M16 20v7M23 20v7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <Rect x="7" y="13.5" width="4" height="5" rx="1" stroke={color} strokeWidth="1.4" />
          <Rect x="14" y="13.5" width="4" height="5" rx="1" stroke={color} strokeWidth="1.4" />
          <Rect x="21" y="13.5" width="4" height="5" rx="1" stroke={color} strokeWidth="1.4" />
        </Svg>
      );
    case 'exhaust':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" />
          <Circle cx="16" cy="16" r="3" stroke={color} strokeWidth="1.8" />
          <Path d="M16 13c0-4 3-6 3-6s-1 4-3 6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
          <Path d="M19 16c4 0 6 3 6 3s-4-1-6-3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
          <Path d="M16 19c0 4-3 6-3 6s1-4 3-6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
          <Path d="M13 16c-4 0-6-3-6-3s4 1 6 3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        </Svg>
      );
    case 'led':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Path d="M16 4a8 8 0 018 8c0 3-1.5 5.5-4 7v3H12v-3c-2.5-1.5-4-4-4-7a8 8 0 018-8z" stroke={color} strokeWidth="2" />
          <Path d="M12 22h8M13 25h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <Path d="M16 28v1" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path d="M8 12H6M24 12h2M10 6.5L8.5 5M22 6.5l1.5-1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <Circle cx="16" cy="12" r="3" stroke={color} strokeWidth="1.5" />
        </Svg>
      );
    case 'changeover':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Rect x="3" y="4" width="26" height="24" rx="3" stroke={color} strokeWidth="2" />
          <Path d="M10 14l6-6 6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M22 18l-6 6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M16 8v16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
        </Svg>
      );
    case 'mainswitch':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Rect x="5" y="4" width="22" height="24" rx="3" stroke={color} strokeWidth="2" />
          <Circle cx="16" cy="13" r="5" stroke={color} strokeWidth="2" />
          <Path d="M16 10v3l2 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M9 22h14M11 25h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        </Svg>
      );
    case 'louver':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Rect x="3" y="3" width="26" height="26" rx="3" stroke={color} strokeWidth="2" />
          <Path d="M6 10h20" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path d="M6 16h20" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path d="M6 22h20" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <Path d="M6 10c4 2 10 2 20 0M6 16c4 2 10 2 20 0M6 22c4 2 10 2 20 0" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
        </Svg>
      );
    case 'axialfan':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" />
          <Circle cx="16" cy="16" r="3.5" stroke={color} strokeWidth="1.8" />
          <Path d="M16 12.5c0-3.5 2.5-5.5 2.5-5.5s-1 3.5-2.5 5.5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
          <Path d="M19.5 16c3.5 0 5.5 2.5 5.5 2.5s-3.5-1-5.5-2.5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
          <Path d="M16 19.5c0 3.5-2.5 5.5-2.5 5.5s1-3.5 2.5-5.5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
          <Path d="M12.5 16c-3.5 0-5.5-2.5-5.5-2.5s3.5 1 5.5 2.5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        </Svg>
      );
    case 'ledflood':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Path d="M16 6a7 7 0 017 7c0 2.5-1.2 4.8-3.2 6.2v2.8H12.2v-2.8A7 7 0 0116 6z" stroke={color} strokeWidth="2" />
          <Path d="M12 22h8M13 25h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
          <Path d="M8 13H6M24 13h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <Circle cx="16" cy="13" r="2.5" stroke={color} strokeWidth="1.5" />
        </Svg>
      );
    case 'multipin':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Rect x="4" y="8" width="24" height="16" rx="3" stroke={color} strokeWidth="2" />
          <Circle cx="10" cy="16" r="2" stroke={color} strokeWidth="1.6" />
          <Circle cx="16" cy="16" r="2" stroke={color} strokeWidth="1.6" />
          <Circle cx="22" cy="16" r="2" stroke={color} strokeWidth="1.6" />
          <Path d="M10 8V6M16 8V6M22 8V6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    case 'pintop':
      return (
        <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
          <Rect x="6" y="10" width="20" height="14" rx="3" stroke={color} strokeWidth="2" />
          <Circle cx="12" cy="17" r="2.2" stroke={color} strokeWidth="1.6" />
          <Circle cx="20" cy="17" r="2.2" stroke={color} strokeWidth="1.6" />
          <Path d="M12 10V7M20 10V7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        </Svg>
      );
    default:
      return <Text style={{ fontSize: s * 0.8 }}>📦</Text>;
  }
}

function ScanIcon({ size = 16, color = '#E87820' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="6" width="20" height="15" rx="3" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="13.5" r="4" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="13.5" r="1.8" fill={color} />
      <Path d="M8 6V5a2 2 0 012-2h4a2 2 0 012 2v1" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="18.5" cy="9.5" r="1" fill={color} />
    </Svg>
  );
}

function FilterIcon({ size = 18, color = '#1C1E2E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M7 12h10M10 17h4" stroke={color} strokeWidth="1.9" strokeLinecap="round" />
      <Circle cx="9" cy="7" r="1.8" fill="#fff" stroke={color} strokeWidth="1.6" />
      <Circle cx="15" cy="12" r="1.8" fill="#fff" stroke={color} strokeWidth="1.6" />
      <Circle cx="12" cy="17" r="1.8" fill="#fff" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
}

// ── UI Product type ───────────────────────────────────────────────────
type UiProduct = {
  id: string;
  category: string;
  name: string;
  sub: string;
  img: string;
  points: number;
  badge: string | null;
};

type UiCategory = {
  id: string;
  label: string;
  count: number;
  imageUrl?: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  fanbox: 'Fan Box',
  concealedbox: 'Concealed Box',
  modular: 'Modular Box',
  mcb: 'MCB Box',
  busbar: 'Bus Bar',
  exhaust: 'Exhaust Fan',
  led: 'LED Lights',
  changeover: 'Changeover',
  mainswitch: 'Main Switch',
  louver: 'Louvers',
  axialfan: 'Axial Fan',
  ledflood: 'LED Flood',
  multipin: 'Multi Pin',
  pintop: 'Pin Top',
};

const CATEGORY_ORDER = [
  'fanbox','concealedbox','modular','mcb','busbar','exhaust',
  'led','changeover','mainswitch','louver','axialfan','ledflood','multipin','pintop',
];

function mapApiToUi(p: ApiProduct): UiProduct {
  return {
    id: p.id,
    category: p.category,
    name: p.name,
    sub: p.sub ?? '',
    img: p.imageUrl || p.image || REAL_PRODUCT_IMAGES[p.category] || REAL_PRODUCT_IMAGES['fanbox'],
    points: p.points,
    badge: p.badge ?? null,
  };
}

function buildCategories(
  products: UiProduct[],
  apiCategories: ApiProductCategory[],
): UiCategory[] {
  const catMap = new Map<string, number>();
  for (const p of products) {
    catMap.set(p.category, (catMap.get(p.category) ?? 0) + 1);
  }

  const byKnownOrder = (a: string, b: string) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  };

  const merged = new Map<string, UiCategory>();

  apiCategories.forEach((category) => {
    const id = category.categoryId ?? category.slug ?? category.id;
    merged.set(id, {
      id,
      label: category.label || CATEGORY_LABELS[id] || id,
      count: category.productCount ?? catMap.get(id) ?? 0,
      imageUrl: category.imageUrl ?? null,
    });
  });

  Array.from(catMap.keys()).forEach((id) => {
    if (!merged.has(id)) {
      merged.set(id, {
        id,
        label: CATEGORY_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1),
        count: catMap.get(id) ?? 0,
        imageUrl: null,
      });
    }
  });

  return Array.from(merged.values()).sort((a, b) => byKnownOrder(a.id, b.id));
}

const normalizeCatalogText = (text: string) =>
  text.replace(/â€"/g, '-').replace(/Ã—/g, 'x').replace(/âœ•/g, 'x').replace(/\s+/g, ' ').trim();

const catalogPhraseMap: Record<Exclude<AppLanguage, 'English'>, [string, string][]> = {
  Hindi: [
    ['FAN BOX','फैन बॉक्स'],['Fan Box','फैन बॉक्स'],['FAN REGULATOR','फैन रेगुलेटर'],
    ['CONCEALED','कन्सील्ड'],['Concealed Box','कन्सील्ड बॉक्स'],['OCTAGONAL BOX','ऑक्टागोनल बॉक्स'],
    ['MODULE','मॉड्यूल'],['Modular Box','मॉड्यूलर बॉक्स'],['PLATINUM','प्लैटिनम'],
    ['GOLD','गोल्ड'],['SUPER','सुपर'],['ZINC','जिंक'],['PREMIUM','प्रीमियम'],
    ['MCB','MCB'],['MCB DB','एमसीबी डीबी'],['MCB BOX','एमसीबी बॉक्स'],
    ['BUS BAR','बस बार'],['Bus Bar','बस बार'],['KITCHEN FAN ROYAL','किचन फैन रॉयल'],
    ['VENTILATION','वेंटिलेशन'],['EXHAUST FAN','एग्जॉस्ट फैन'],['Exhaust Fan','एग्जॉस्ट फैन'],
    ['AXIAL FLOW FAN','एक्सियल फ्लो फैन'],['LED FLOOD','एलईडी फ्लड'],
    ['LED Lights','एलईडी लाइट्स'],['LED LIGHTS','एलईडी लाइट्स'],
    ['LED STREET LIGHT','एलईडी स्ट्रीट लाइट'],['LED PANEL LIGHT','एलईडी पैनल लाइट'],
    ['AUTO CHANGEOVER','ऑटो चेंजओवर'],['CHANGEOVER','चेंजओवर'],['Changeover','चेंजओवर'],
    ['DIGITAL PANEL','डिजिटल पैनल'],['MAIN SW','मेन स्विच'],['Main Switch','मेन स्विच'],
    ['FUSE UNIT','फ्यूज यूनिट'],['DP MAIN SWITCH','डीपी मेन स्विच'],
    ['VENTOGUARD','वेंटोगार्ड'],['LOUVER','लूवर'],['LOUVER SHUTTER','लूवर शटर'],
    ['Louvers','लूवर्स'],['Range','रेंज'],['Precision','प्रिसीजन'],['Standard','स्टैंडर्ड'],
    ['Heavy','हेवी'],['Deluxe','डीलक्स'],['Series','सीरीज़'],['Single Door','सिंगल डोर'],
    ['Double Door','डबल डोर'],['Draw Type','ड्रॉ टाइप'],['Pure Copper','प्योर कॉपर'],
    ['Industrial Grade','इंडस्ट्रियल ग्रेड'],['Outdoor Waterproof','आउटडोर वॉटरप्रूफ'],
    ['High Lumen Output','हाई लुमेन आउटपुट'],['Compact','कॉम्पैक्ट'],['Automatic','ऑटोमैटिक'],
    ['With Built-in','बिल्ट-इन के साथ'],['Light Weight','लाइट वेट'],['Ventilation','वेंटिलेशन'],
    ['Available','उपलब्ध'],
  ],
  Punjabi: [
    ['FAN BOX','ਫੈਨ ਬਾਕਸ'],['Fan Box','ਫੈਨ ਬਾਕਸ'],['FAN REGULATOR','ਫੈਨ ਰੈਗੂਲੇਟਰ'],
    ['CONCEALED','ਕੰਸੀਲਡ'],['Concealed Box','ਕੰਸੀਲਡ ਬਾਕਸ'],['OCTAGONAL BOX','ਆਕਟਾਗੋਨਲ ਬਾਕਸ'],
    ['MODULE','ਮੋਡੀਊਲ'],['Modular Box','ਮੋਡੀਊਲ ਬਾਕਸ'],['PLATINUM','ਪਲੈਟਿਨਮ'],
    ['GOLD','ਗੋਲਡ'],['SUPER','ਸੁਪਰ'],['ZINC','ਜ਼ਿੰਕ'],['PREMIUM','ਪ੍ਰੀਮੀਅਮ'],
    ['MCB','MCB'],['MCB DB','ਐਮਸੀਬੀ ਡੀਬੀ'],['MCB BOX','MCB ਬਾਕਸ'],
    ['BUS BAR','ਬਸ ਬਾਰ'],['Bus Bar','ਬਸ ਬਾਰ'],['KITCHEN FAN ROYAL','ਕਿਚਨ ਫੈਨ ਰੋਯਲ'],
    ['VENTILATION','ਵੈਂਟੀਲੇਸ਼ਨ'],['EXHAUST FAN','ਐਗਜ਼ੌਸਟ ਫੈਨ'],['Exhaust Fan','ਐਗਜ਼ੌਸਟ ਫੈਨ'],
    ['AXIAL FLOW FAN','ਐਕਸੀਅਲ ਫਲੋ ਫੈਨ'],['LED FLOOD','ਐਲਈਡੀ ਫਲੱਡ'],
    ['LED Lights','ਐਲਈਡੀ ਲਾਈਟਾਂ'],['LED LIGHTS','ਐਲਈਡੀ ਲਾਈਟਾਂ'],
    ['LED STREET LIGHT','ਐਲਈਡੀ ਸਟ੍ਰੀਟ ਲਾਈਟ'],['LED PANEL LIGHT','ਐਲਈਡੀ ਪੈਨਲ ਲਾਈਟ'],
    ['AUTO CHANGEOVER','ਆਟੋ ਚੇਂਜਓਵਰ'],['CHANGEOVER','ਚੇਂਜਓਵਰ'],['Changeover','ਚੇਂਜਓਵਰ'],
    ['DIGITAL PANEL','ਡਿਜ਼ਿਟਲ ਪੈਨਲ'],['MAIN SW','ਮੇਨ ਸਵਿੱਚ'],['Main Switch','ਮੇਨ ਸਵਿੱਚ'],
    ['FUSE UNIT','ਫਿਊਜ਼ ਯੂਨਿਟ'],['DP MAIN SWITCH','ਡੀਪੀ ਮੇਨ ਸਵਿੱਚ'],
    ['VENTOGUARD','ਵੈਂਟੋਗਾਰਡ'],['LOUVER','ਲੂਵਰ'],['LOUVER SHUTTER','ਲੂਵਰ ਸ਼ਟਰ'],
    ['Louvers','ਲੂਵਰ'],['Range','ਰੇਂਜ'],['Precision','ਪ੍ਰਿਸੀਜ਼ਨ'],['Standard','ਸਟੈਂਡਰਡ'],
    ['Heavy','ਹੈਵੀ'],['Deluxe','ਡਿਲਕਸ'],['Series','ਸੀਰੀਜ਼'],['Single Door','ਸਿੰਗਲ ਡੋਰ'],
    ['Double Door','ਡਬਲ ਡੋਰ'],['Draw Type','ਡਰਾਅ ਟਾਈਪ'],['Pure Copper','ਸ਼ੁੱਧ ਤਾਂਬਾ'],
    ['Industrial Grade','ਇੰਡਸਟਰੀਅਲ ਗ੍ਰੇਡ'],['Outdoor Waterproof','ਆਉਟਡੋਰ ਵਾਟਰਪ੍ਰੂਫ'],
    ['High Lumen Output','ਹਾਈ ਲੂਮਨ ਆਉਟਪੁੱਟ'],['Compact','ਕੌਂਪੈਕਟ'],['Automatic','ਆਟੋਮੈਟਿਕ'],
    ['With Built-in','ਬਿਲਟ-ਇਨ ਨਾਲ'],['Light Weight','ਹਲਕਾ ਵਜ਼ਨ'],['Ventilation','ਵੈਂਟੀਲੇਸ਼ਨ'],
    ['Available','ਉਪਲਬਧ'],
  ],
};

function localizeCatalogText(text: string, language: AppLanguage) {
  const normalized = normalizeCatalogText(text);
  if (language === 'English') return normalized;
  let localized = normalized;
  for (const [source, target] of catalogPhraseMap[language]) {
    localized = localized.replaceAll(source, target);
  }
  return localized;
}

// ── Animated Product Image ────────────────────────────────────────────
function AnimatedProductImage({ uri, size }: { uri: string; size: number }) {
  const floatY = useRef(new Animated.Value(0)).current;
  const imgScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, withWebSafeNativeDriver({ toValue: -8, duration: 1600, easing: Easing.inOut(Easing.sin) })),
        Animated.timing(floatY, withWebSafeNativeDriver({ toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin) })),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(imgScale, withWebSafeNativeDriver({ toValue: 1.06, duration: 2200, easing: Easing.inOut(Easing.ease) })),
        Animated.timing(imgScale, withWebSafeNativeDriver({ toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease) })),
      ])
    ).start();
  }, [floatY, imgScale]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ translateY: floatY }, { scale: imgScale }] }}>
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

// ── Product Card ──────────────────────────────────────────────────────
function ProductCard({
  product, cardW, catColor, onScan, onOpenDetails, showScanButton = true,
}: {
  product: UiProduct;
  cardW: number;
  catColor: CatColorScheme;
  onScan: () => void;
  onOpenDetails: () => void;
  showScanButton?: boolean;
}) {
  const { darkMode, tx, language } = usePreferenceContext();
  const pressScale = useRef(new Animated.Value(1)).current;
  const tiltX = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(pressScale, withWebSafeNativeDriver({ toValue: 0.96, tension: 100, friction: 6 })),
      Animated.spring(tiltX, withWebSafeNativeDriver({ toValue: 1, tension: 100, friction: 6 })),
    ]).start();
  };
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(pressScale, withWebSafeNativeDriver({ toValue: 1, tension: 100, friction: 6 })),
      Animated.spring(tiltX, withWebSafeNativeDriver({ toValue: 0, tension: 100, friction: 6 })),
    ]).start();
  };

  const rotate = tiltX.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '4deg'] });
  const imgSize = cardW + 4;

  return (
    <Pressable onPress={onOpenDetails} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.productCard,
          darkMode ? styles.productCardDark : null,
          {
            width: cardW,
            height: showScanButton ? cardW * 1.72 : cardW * 1.56,
            transform: [{ scale: pressScale }, { perspective: 900 }, { rotateY: rotate }],
          },
        ]}
      >
        <View
          style={[styles.imgZone, { height: cardW + 18, backgroundColor: '#FFFFFF' }]}
        >
          {product.badge != null && (
            <View style={[styles.badge, { backgroundColor: catColor.scanText }]}>
              <Text style={styles.badgeText}>{tx(product.badge)}</Text>
            </View>
          )}
          <View style={[styles.ptsBadge, { borderColor: catColor.scanText + '44' }]}>
            <Text style={[styles.ptsBadgeText, { color: catColor.scanText }]}>+{product.points} pts</Text>
          </View>
          <AnimatedProductImage uri={product.img} size={imgSize} />
        </View>

        <View style={[styles.infoZone, darkMode ? styles.infoZoneDark : null, !showScanButton ? styles.infoZoneCompact : null]}>
          <Text style={[styles.productName, darkMode ? styles.productNameDark : null]} numberOfLines={1}>
            {localizeCatalogText(product.name, language)}
          </Text>
          <Text style={[styles.productSub, darkMode ? styles.productSubDark : null]} numberOfLines={2}>
            {localizeCatalogText(product.sub, language)}
          </Text>
          <View style={showScanButton ? styles.infoSpacer : styles.infoCompactSpacer} />
          {showScanButton ? (
            <TouchableOpacity onPress={onScan} style={[styles.scanBtn, { backgroundColor: catColor.scanBg }]} activeOpacity={0.8}>
              <ScanIcon size={15} color={catColor.scanText} />
              <Text style={[styles.scanBtnText, { color: catColor.scanText }]}>{tx('Scan to Earn')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ── Main ProductScreen ────────────────────────────────────────────────
export function ProductScreen({
  onNavigate,
  initialCategory = 'fanbox',
  showBottomBanner = true,
  showScanButton = true,
}: {
  onNavigate: (screen: Screen) => void;
  initialCategory?: string;
  showBottomBanner?: boolean;
  showScanButton?: boolean;
}) {
  const { darkMode, tx, language } = usePreferenceContext();
  const { products: apiProducts, categories: apiCategories, catalogLoading } = useAppData();
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<UiProduct | null>(null);

  const catalogProducts = useMemo(() => apiProducts.map(mapApiToUi), [apiProducts]);
  const catalogCategories = useMemo(
    () => buildCategories(catalogProducts, apiCategories),
    [apiCategories, catalogProducts],
  );

  useEffect(() => {
    if (initialCategory) { setCategory(initialCategory); setSearch(''); }
  }, [initialCategory]);

  useEffect(() => {
    if (catalogCategories.length === 0) return;
    setCategory((prev) =>
      catalogCategories.some((c) => c.id === prev) ? prev : catalogCategories[0].id
    );
  }, [catalogCategories]);

  const PADDING = 14;
  const GAP = 12;
  const cardW = Math.floor((width - PADDING * 2 - GAP) / 2);

  const isSearching = search.trim().length > 0;

  const filtered = useMemo(() => {
    let result: typeof catalogProducts;
    if (isSearching) {
      result = catalogProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sub.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      result = catalogProducts.filter((p) => p.category === category);
    }
    // Sort alphabetically A-Z by name
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalogProducts, category, search, isSearching]);

  const currentCat = catalogCategories.find((c) => c.id === category) ?? catalogCategories[0] ?? { id: 'fanbox', label: 'Products', count: 0 };
  const currentCatIndex = catalogCategories.findIndex((c) => c.id === currentCat.id);
  const catColor = getCatColor(currentCat.id, currentCatIndex);

  const rows: UiProduct[][] = [];
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push(filtered.slice(i, i + 2));
  }

  if (catalogLoading && catalogProducts.length === 0) {
    return (
      <View style={[styles.screen, darkMode ? styles.screenDark : null, { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }]}>
        <Text style={{ fontSize: 32 }}>⚡</Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: darkMode ? '#94A3B8' : '#64748B' }}>
          Loading products...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.screen, darkMode ? styles.screenDark : null]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, darkMode ? styles.pageTitleDark : null]}>{tx('All Products')}</Text>

      {/* Search */}
      <View style={[styles.searchWrap, darkMode ? styles.searchWrapDark : null]}>
        <Text style={{ fontSize: 15, color: Colors.textMuted }}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={tx('Search all products...')}
          placeholderTextColor={Colors.textMuted}
          style={[styles.searchInput, darkMode ? styles.searchInputDark : null]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Text style={{ fontSize: 15, color: Colors.textMuted }}>✕</Text>
          </Pressable>
        )}
        <TouchableOpacity
          onPress={() => setShowFilters((prev) => !prev)}
          style={[styles.filterToggleBtn, showFilters && styles.filterToggleBtnActive]}
          activeOpacity={0.82}
        >
          <FilterIcon color={showFilters ? '#FFFFFF' : Colors.textDark} />
        </TouchableOpacity>
      </View>

      {showFilters ? (
        <View style={[styles.filterPanel, darkMode ? styles.filterPanelDark : null]}>
          <View style={styles.filterPanelHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.filterPanelTitle, darkMode ? styles.filterPanelTitleDark : null]}>{tx('Filter products')}</Text>
              <Text style={[styles.filterPanelSub, darkMode ? styles.filterPanelSubDark : null]}>
                {tx('Choose a category to see matching product names and items.')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowFilters(false)} activeOpacity={0.8}>
              <Text style={styles.filterPanelClose}>{tx('Close')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterGrid}>
            {catalogCategories.map((cat, catIndex) => {
              const active = !isSearching && cat.id === category;
              const cc = getCatColor(cat.id, catIndex);
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => { setCategory(cat.id); setSearch(''); setShowFilters(false); }}
                  style={[styles.filterCard, darkMode ? styles.filterCardDark : null, active && { backgroundColor: cc.scanText, borderColor: cc.scanText }]}
                  activeOpacity={0.86}
                >
                  <View style={[styles.filterCardIcon, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : cc.iconBg }]}>
                    <CatIcon id={cat.id} size={22} color={active ? '#fff' : cc.scanText} />
                  </View>
                  <Text style={[styles.filterCardTitle, darkMode && !active ? styles.filterCardTitleDark : null, active && styles.filterCardTitleActive]} numberOfLines={1}>
                    {localizeCatalogText(cat.label, language)}
                  </Text>
                  <Text style={[styles.filterCardMeta, darkMode && !active ? styles.filterCardMetaDark : null, active && styles.filterCardMetaActive]}>
                    {catalogProducts.filter((p) => p.category === cat.id).length} {tx('products')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabList}>
        {catalogCategories.map((cat, catIndex) => {
          const active = !isSearching && cat.id === category;
          const cc = getCatColor(cat.id, catIndex);
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => { setCategory(cat.id); setSearch(''); }}
              style={[styles.categoryTab, darkMode ? styles.categoryTabDark : null, active && { backgroundColor: cc.scanText, borderColor: cc.scanText }]}
              activeOpacity={0.8}
            >
              <View style={[styles.tabIconWrap, { backgroundColor: active ? 'rgba(255,255,255,0.2)' : cc.iconBg }]}>
                <CatIcon id={cat.id} size={18} color={active ? '#fff' : cc.scanText} />
              </View>
              <Text style={[styles.categoryText, darkMode && !active ? styles.categoryTextDark : null, active && { color: '#fff' }]}>
                {localizeCatalogText(cat.label, language)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Category Banner or Search Result */}
      {isSearching ? (
        <View style={[styles.searchResultBanner, darkMode ? styles.searchResultBannerDark : null]}>
          <Text style={[styles.searchResultText, darkMode ? styles.searchResultTextDark : null]}>
            {filtered.length > 0
              ? `${filtered.length} ${tx(filtered.length !== 1 ? 'results' : 'result')} "${search}"`
              : `${tx('No results for')} "${search}"`}
          </Text>
          {filtered.length === 0 && (
            <Text style={[styles.searchResultSub, darkMode ? styles.searchResultSubDark : null]}>
              {tx('Try searching by product name or size')}
            </Text>
          )}
        </View>
      ) : (
        <LinearGradient colors={catColor.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.catBanner}>
          <View style={styles.catBannerLeft}>
            <View style={styles.bannerIconWrap}>
              <CatIcon id={category} size={32} color="#fff" />
            </View>
            <View>
              <Text style={styles.catBannerTitle}>{localizeCatalogText(currentCat.label, language)}</Text>
              <Text style={styles.catBannerSub}>{filtered.length} {tx('products')} {tx('available')}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => onNavigate('scan')} style={styles.catScanBtn}>
            <ScanIcon size={20} color="#fff" />
            <Text style={styles.catScanText}>{tx('Scan & Earn').replace(' ', '\n')}</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}

      {/* Product Grid */}
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((product) => {
            const productCatColor = getCatColor(product.category, catalogCategories.findIndex((c) => c.id === product.category));
            return (
              <ProductCard
                key={product.id}
                product={product}
                cardW={cardW}
                catColor={productCatColor}
                onScan={() => onNavigate('scan')}
                onOpenDetails={() => setSelectedProduct(product)}
                showScanButton={showScanButton}
              />
            );
          })}
          {row.length === 1 && <View style={{ width: cardW }} />}
        </View>
      ))}

      {/* Bottom Banner */}
      {showBottomBanner ? (
        <TouchableOpacity
          style={[styles.bottomBanner, darkMode ? styles.bottomBannerDark : null]}
          activeOpacity={0.88}
          onPress={() => onNavigate('scan')}
        >
          <Text style={{ fontSize: 26 }}>🏭</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bottomBannerTitle}>{tx("North India's Largest Manufacturer")}</Text>
            <Text style={styles.bottomBannerSub}>{tx('SRV Electricals — since 2000. Scan any QR to earn points!')}</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      ) : null}

      <View style={{ height: 30 }} />

      {/* Product Detail Modal */}
      <Modal visible={Boolean(selectedProduct)} transparent animationType="slide" onRequestClose={() => setSelectedProduct(null)}>
        <View style={styles.detailOverlay}>
          <View style={[styles.detailCard, darkMode ? styles.detailCardDark : null]}>
            {selectedProduct ? (
              <>
                <View style={styles.detailHeader}>
                  <TouchableOpacity style={styles.detailBackBtn} onPress={() => setSelectedProduct(null)}>
                    <Text style={styles.detailBackIcon}>‹</Text>
                  </TouchableOpacity>
                  <Text style={[styles.detailHeaderTitle, darkMode ? styles.detailHeaderTitleDark : null]}>{tx('Product Details')}</Text>
                  <View style={styles.detailBackBtnPlaceholder} />
                </View>
                <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailScrollContent} showsVerticalScrollIndicator={false}>
                  <View style={styles.detailImageWrap}>
                    <Image source={{ uri: selectedProduct.img }} style={styles.detailImage} resizeMode="contain" />
                    <View style={styles.detailImageShadow} />
                  </View>
                  <Text style={[styles.detailTitle, darkMode ? styles.detailTitleDark : null]}>
                    {localizeCatalogText(selectedProduct.name, language)}
                  </Text>
                  <Text style={[styles.detailPoints, darkMode ? styles.detailPointsDark : null]}>
                    {tx('Earn')} {selectedProduct.points} {tx('Points')}
                  </Text>
                  <Text style={[styles.detailMeta, darkMode ? styles.detailMetaDark : null]}>
                    {localizeCatalogText(selectedProduct.sub, language)}
                  </Text>
                  <View style={styles.detailBody}>
                    <Text style={[styles.detailSectionEyebrow, darkMode ? styles.detailSectionEyebrowDark : null]}>
                      {tx('Professional Product Overview')}
                    </Text>
                    <Text style={[styles.detailSectionTitle, darkMode ? styles.detailSectionTitleDark : null]}>{tx('Description')}</Text>
                    <Text style={[styles.detailBodyText, darkMode ? styles.detailBodyTextDark : null]}>
                      {localizeCatalogText(selectedProduct.sub, language)}
                    </Text>
                  </View>
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  screenDark: { backgroundColor: '#08111F' },
  content: { padding: 14, gap: 14, paddingBottom: 120 },
  pageTitle: { fontSize: 22, fontWeight: '800', color: Colors.textDark, textAlign: 'center' },
  pageTitleDark: { color: '#F8FAFC' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, height: 50 },
  searchWrapDark: { backgroundColor: '#111827', borderColor: '#243043' },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textDark },
  searchInputDark: { color: '#F8FAFC' },
  filterToggleBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6FA' },
  filterToggleBtnActive: { backgroundColor: Colors.primary },
  filterPanel: { backgroundColor: Colors.surface, borderRadius: 22, padding: 14, borderWidth: 1, borderColor: Colors.border, ...createShadow({ color: '#000', offsetY: 5, blur: 12, opacity: 0.08, elevation: 4 }) },
  filterPanelDark: { backgroundColor: '#111827', borderColor: '#243043', ...createShadow({ color: '#020617', offsetY: 5, blur: 12, opacity: 0.08, elevation: 4 }) },
  filterPanelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  filterPanelTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  filterPanelSub: { fontSize: 12, color: Colors.textMuted, marginTop: 3, lineHeight: 17 },
  filterPanelTitleDark: { color: '#F8FAFC' },
  filterPanelSubDark: { color: '#94A3B8' },
  filterPanelClose: { fontSize: 12.5, fontWeight: '800', color: Colors.primary },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterCard: { width: '48%', backgroundColor: '#FAFBFD', borderWidth: 1, borderColor: Colors.border, borderRadius: 18, padding: 12 },
  filterCardDark: { backgroundColor: '#182133', borderColor: '#243043' },
  filterCardIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  filterCardTitle: { fontSize: 13, fontWeight: '800', color: Colors.textDark },
  filterCardTitleActive: { color: '#FFFFFF' },
  filterCardMeta: { fontSize: 11.5, color: Colors.textMuted, marginTop: 4 },
  filterCardMetaActive: { color: 'rgba(255,255,255,0.86)' },
  filterCardTitleDark: { color: '#F8FAFC' },
  filterCardMetaDark: { color: '#94A3B8' },
  tabList: { gap: 10, paddingVertical: 2 },
  categoryTab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  categoryTabDark: { backgroundColor: '#111827', borderColor: '#243043' },
  tabIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  categoryText: { fontSize: 13, fontWeight: '700', color: Colors.textDark },
  categoryTextDark: { color: '#F8FAFC' },
  catBanner: { borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  bannerIconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  catBannerTitle: { fontSize: 18, fontWeight: '900', color: '#fff' },
  catBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  catScanBtn: { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, alignItems: 'center', gap: 4 },
  catScanText: { color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  searchResultBanner: { backgroundColor: Colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  searchResultText: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  searchResultSub: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  searchResultBannerDark: { backgroundColor: '#111827', borderColor: '#243043' },
  searchResultTextDark: { color: '#F8FAFC' },
  searchResultSubDark: { color: '#94A3B8' },
  row: { flexDirection: 'row', gap: 12 },
  productCard: { backgroundColor: Colors.surface, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...createShadow({ color: '#000', offsetY: 4, blur: 10, opacity: 0.08, elevation: 4 }) },
  productCardDark: { backgroundColor: '#111827', borderColor: '#243043', ...createShadow({ color: '#020617', offsetY: 4, blur: 10, opacity: 0.08, elevation: 4 }) },
  imgZone: { alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  badge: { position: 'absolute', top: 10, left: 10, zIndex: 3, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  ptsBadge: { position: 'absolute', top: 10, right: 10, zIndex: 3, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 10, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3 },
  ptsBadgeText: { fontSize: 11, fontWeight: '800' },
  infoZone: { flex: 1, padding: 11, paddingTop: 10, backgroundColor: '#FFFFFF' },
  infoZoneDark: { backgroundColor: '#111827' },
  infoZoneCompact: { paddingBottom: 14, justifyContent: 'flex-start' },
  infoSpacer: { flex: 1 },
  infoCompactSpacer: { height: 6 },
  productName: { fontSize: 12, fontWeight: '800', color: Colors.textDark, textTransform: 'uppercase', letterSpacing: 0.2 },
  productNameDark: { color: '#F8FAFC' },
  productSub: { fontSize: 10.5, color: Colors.textMuted, marginTop: 3, lineHeight: 14 },
  productSubDark: { color: '#CBD5E1' },
  scanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 11, paddingVertical: 8 },
  scanBtnText: { fontSize: 11.5, fontWeight: '700' },
  bottomBanner: { backgroundColor: '#2D3561', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  bottomBannerDark: { backgroundColor: '#172554' },
  bottomBannerTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  bottomBannerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 3, lineHeight: 16 },
  detailOverlay: { flex: 1, backgroundColor: '#FFFFFF' },
  detailCard: { backgroundColor: '#FFFFFF', flex: 1, paddingTop: 14 },
  detailCardDark: { backgroundColor: '#111827' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10 },
  detailBackBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  detailBackBtnPlaceholder: { width: 36, height: 36 },
  detailBackIcon: { fontSize: 34, color: '#111827', lineHeight: 34 },
  detailHeaderTitle: { fontSize: 22, fontWeight: '800', color: '#1C1E2E' },
  detailHeaderTitleDark: { color: '#F8FAFC' },
  detailScroll: { flex: 1 },
  detailScrollContent: { paddingHorizontal: 16, paddingBottom: 28 },
  detailImageWrap: { alignItems: 'center', marginTop: 8, marginBottom: 8 },
  detailImage: { width: 220, height: 220 },
  detailImageShadow: { width: 96, height: 14, borderRadius: 999, backgroundColor: 'rgba(17,24,39,0.12)', marginTop: -8 },
  detailTitle: { fontSize: 20, fontWeight: '800', color: '#1C1E2E' },
  detailTitleDark: { color: '#F8FAFC' },
  detailMeta: { fontSize: 13, color: '#6B7280', marginTop: 10 },
  detailMetaDark: { color: '#CBD5E1' },
  detailPoints: { fontSize: 16, fontWeight: '800', color: '#E8453C', marginTop: 8 },
  detailPointsDark: { color: '#F87171' },
  detailBody: { width: '100%', minHeight: 220, paddingTop: 18, marginTop: 18, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  detailSectionEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase', color: '#E8453C', marginBottom: 8 },
  detailSectionEyebrowDark: { color: '#F87171' },
  detailSectionTitle: { fontSize: 24, fontWeight: '700', color: '#1F2937', marginBottom: 14, letterSpacing: 0.2 },
  detailSectionTitleDark: { color: '#F8FAFC' },
  detailBodyText: { fontSize: 15, lineHeight: 26, color: '#374151', letterSpacing: 0.15 },
  detailBodyTextDark: { color: '#CBD5E1' },
});
