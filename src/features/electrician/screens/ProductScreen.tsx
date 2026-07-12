import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Dialog } from '@/shared/components/Dialog';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAuth } from '@/shared/context/AuthContext';
import { useRegisterScrollToTop } from '@/shared/context/NavActionContext';
import { useAppPageContent } from '@/shared/hooks';
import { usePreferenceContext } from '@/shared/preferences';
import { premium, premiumShadow } from '@/shared/theme/premium';
import type { Screen } from '@/shared/types/navigation';
import { activityApi, catalogApi, resolveImageUrl, type Product as ApiProduct, type ProductCategory as ApiProductCategory } from '@/shared/api';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  primary: premium.navy,
  bg: premium.bg,
  surface: premium.surface,
  border: premium.line,
  textDark: premium.ink,
  textMuted: premium.muted,
};

type ProductRole = 'electrician' | 'dealer' | 'customer' | 'counterboy';
type ProductRoleTheme = {
  primary: string;
  soft: string;
  pageBg: string;
  iconSoft: string;
  onPrimary: string;
  activeMeta: string;
};

const PRODUCT_ROLE_THEMES: Record<ProductRole, ProductRoleTheme> = {
  electrician: {
    primary: premium.navy,
    soft: premium.navySoft,
    iconSoft: premium.navySoft,
    pageBg: '#F3F7FC',
    onPrimary: '#FFFFFF',
    activeMeta: 'rgba(255,255,255,0.86)',
  },
  dealer: {
    primary: premium.navy,
    soft: premium.navySoft,
    iconSoft: premium.navySoft,
    pageBg: '#F3F7FC',
    onPrimary: '#FFFFFF',
    activeMeta: 'rgba(255,255,255,0.86)',
  },
  customer: {
    primary: '#8D4A1E',
    soft: '#FBF1E7',
    iconSoft: '#F5E8DC',
    pageBg: '#FFF9F2',
    onPrimary: '#FFFFFF',
    activeMeta: 'rgba(255,255,255,0.86)',
  },
  counterboy: {
    primary: '#8B3C2A',
    soft: '#F5EDE4',
    iconSoft: '#F0E4D4',
    pageBg: '#F9F4ED',
    onPrimary: '#FFFFFF',
    activeMeta: 'rgba(255,255,255,0.86)',
  },
};

// ── Category colour map (keyed by normalised category id) ────────────────────
const CAT_COLORS: Record<string, { gradient: [string, string, string]; scanBg: string; scanText: string; cardGradient: [string, string, string]; iconBg: string }> = {
  fanbox:       { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  fanrods:      { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  concealedbox: { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  modular:      { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  mcb:          { gradient: ['#4A6FA5','#6B8FC7','#B8CCE8'], scanBg: '#EEF4FF', scanText: '#2D5FA0', cardGradient: ['#F8FAFF','#EBF2FF','#D8E8FF'], iconBg: '#DDE9F8' },
  busbar:       { gradient: ['#8B6914','#C49A2A','#E8CC7A'], scanBg: '#FDF8EC', scanText: '#7A5A10', cardGradient: ['#FFFDF5','#FDF5DC','#F8EAB8'], iconBg: '#F5E8C0' },
  exhaust:      { gradient: ['#2E7D5E','#4CAF85','#90D4B8'], scanBg: '#EDF8F3', scanText: '#1E6B4A', cardGradient: ['#F5FDF9','#E2F5EC','#C8EDD9'], iconBg: '#C8EDD9' },
  axialfan:     { gradient: ['#2E7D5E','#4CAF85','#90D4B8'], scanBg: '#EDF8F3', scanText: '#1E6B4A', cardGradient: ['#F5FDF9','#E2F5EC','#C8EDD9'], iconBg: '#C8EDD9' },
  led:          { gradient: ['#8B6914','#C49A2A','#E8CC7A'], scanBg: '#FDF8EC', scanText: '#7A5A10', cardGradient: ['#FFFDF5','#FDF5DC','#F8EAB8'], iconBg: '#F5E8C0' },
  changeover:   { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  knifetypechangeoverswitches: { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  mainswitch:   { gradient: ['#C0392B','#E74C3C','#F1948A'], scanBg: '#FFF0EF', scanText: '#A93226', cardGradient: ['#FFF8F8','#FFE8E6','#FFD5D2'], iconBg: '#FFD5D2' },
  mainswitchfuseunits: { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  louver:       { gradient: ['#2E7D5E','#4CAF85','#90D4B8'], scanBg: '#EDF8F3', scanText: '#1E6B4A', cardGradient: ['#F5FDF9','#E2F5EC','#C8EDD9'], iconBg: '#C8EDD9' },
  conduit:      { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  pvcpipe:      { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  stabilizer:   { gradient: ['#4A6FA5','#6B8FC7','#B8CCE8'], scanBg: '#EEF4FF', scanText: '#2D5FA0', cardGradient: ['#F8FAFF','#EBF2FF','#D8E8FF'], iconBg: '#DDE9F8' },
  junction:     { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  junctionbox:  { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  pvcjunctionbox: { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  ventoguard:   { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
};
const DEFAULT_CAT_COLOR = { gradient: ['#6F879F','#93A8BE','#D9E1EA'] as [string,string,string], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'] as [string,string,string], iconBg: '#E5ECF4' };

const DEFAULT_IMAGES: Record<string, string> = {
  fanbox:       'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=320',
  fanrods:      'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/FanRod_Super.png',
  concealedbox: 'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=320',
  modular:      'https://srvelectricals.com/cdn/shop/files/3x3_679e5d30-ecf2-446e-9452-354bbf4c4a26.png?v=1757426377&width=320',
  mcb:          'https://srvelectricals.com/cdn/shop/files/MCB_Box_4_Way_GI.png?v=1757426418&width=320',
  busbar:       'https://srvelectricals.com/cdn/shop/files/Bus_Bar_100A_Super.png?v=1757426672&width=320',
  exhaust:      'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320',
  axialfan:     'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320',
  led:          'https://srvelectricals.com/cdn/shop/files/FloodLightSleek.png?v=1757426471&width=320',
  changeover:   'https://srvelectricals.com/cdn/shop/files/ACO_100A_FP.png?v=1757426480&width=320',
  knifetypechangeoverswitches: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/CO400AKNIFETYPE.png',
  mainswitch:   'https://srvelectricals.com/cdn/shop/files/CO_32A_DP_PRM.png?v=1757426515&width=320',
  mainswitchfuseunits: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/MainSwitch63A.png',
  louver:       'https://srvelectricals.com/cdn/shop/files/Louver_6_inch.png?v=1757426390&width=320',
  conduit:      'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCPipe_d645973b-bd5e-41de-8eb0-53331cce1c19.png?v=1772786167',
  stabilizer:   'https://srvelectricals.com/cdn/shop/files/VoltageStabilizer.png?v=1757426471&width=320',
  junction:     'https://srvelectricals.com/cdn/shop/files/Junction_Box.png?v=1757426390&width=320',
  junctionbox:  'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/JunctionBox_CNG.png',
  pvcjunctionbox: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCJunctionBox.png',
  ventoguard:   'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/VentoGuard.png',
};

const CATEGORY_LABELS: Record<string, string> = {
  fanbox: 'Fan Box', fanrods: 'Fan Rods', concealedbox: 'Concealed Box', modular: 'Modular Box', modularbox: 'Modular Box',
  mcb: 'MCB DB', busbar: 'Bus Bar', exhaust: 'Exhaust Fan', axialfan: 'Axial Fan',
  led: 'LED Lights', changeover: 'Changeover', knifetypechangeoverswitches: 'Knife Type Changeover',
  mainswitch: 'Main Switch', mainswitchfuseunits: 'Main Switch Fuse Units',
  louver: 'Louvers', conduit: 'Conduit Pipe', pvcpipe: 'Conduit Pipe',
  stabilizer: 'Voltage Stabilizer', junction: 'Junction Box', junctionbox: 'Junction Box',
  pvcjunctionbox: 'PVC Junction Box', ventoguard: 'VentoGuard',
};

const CATEGORY_ALIASES: Record<string, string> = {
  allproducts: 'all', modularbox: 'modular', pvcpipe: 'conduit', ledflood: 'led', boxes: 'mcb', fans: 'exhaust',
};

function normCat(id: string): string {
  const s = id.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
  return CATEGORY_ALIASES[s] ?? s;
}

function catColor(id: string) { return CAT_COLORS[normCat(id)] ?? DEFAULT_CAT_COLOR; }
function catImg(id: string, fallback?: string): string {
  return fallback || DEFAULT_IMAGES[normCat(id)] || DEFAULT_IMAGES.fanbox;
}
function catLabel(id: string): string {
  const n = normCat(id);
  return CATEGORY_LABELS[n] || id.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/[_-]+/g,' ').trim().replace(/\b\w/g,c=>c.toUpperCase());
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
function CatIcon({ id, size = 28, color = '#fff' }: { id: string; size?: number; color?: string }) {
  const s = size;
  switch (normCat(id)) {
    case 'fanbox': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Rect x="4" y="8" width="24" height="18" rx="3" stroke={color} strokeWidth="2" />
        <Path d="M4 13h24" stroke={color} strokeWidth="2" />
        <Circle cx="16" cy="21" r="3" stroke={color} strokeWidth="1.8" />
        <Path d="M16 16v2M16 24v2M11 21h2M21 21h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M12 8V6a4 4 0 018 0v2" stroke={color} strokeWidth="2" />
      </Svg>
    );
    case 'concealedbox': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Rect x="3" y="3" width="26" height="26" rx="4" stroke={color} strokeWidth="2" />
        <Rect x="8" y="8" width="16" height="16" rx="2" stroke={color} strokeWidth="1.8" strokeDasharray="3 2" />
        <Circle cx="16" cy="16" r="3" stroke={color} strokeWidth="1.8" />
        <Path d="M16 11v2M16 19v2M11 16h2M19 16h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    );
    case 'modular': return (
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
    case 'mcb': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Rect x="5" y="3" width="22" height="26" rx="3" stroke={color} strokeWidth="2" />
        <Rect x="9" y="7" width="6" height="8" rx="1.5" stroke={color} strokeWidth="1.6" />
        <Rect x="17" y="7" width="6" height="8" rx="1.5" stroke={color} strokeWidth="1.6" />
        <Path d="M9 20h14M9 23h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M14 7V5M18 7V5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    );
    case 'busbar': return (
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
    case 'axialfan': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" />
        <Circle cx="16" cy="16" r="3" stroke={color} strokeWidth="1.8" />
        <Path d="M16 13c0-4 3-6 3-6s-1 4-3 6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <Path d="M19 16c4 0 6 3 6 3s-4-1-6-3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <Path d="M16 19c0 4-3 6-3 6s1-4 3-6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <Path d="M13 16c-4 0-6-3-6-3s4 1 6 3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      </Svg>
    );
    case 'led': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Path d="M16 4a8 8 0 018 8c0 3-1.5 5.5-4 7v3H12v-3c-2.5-1.5-4-4-4-7a8 8 0 018-8z" stroke={color} strokeWidth="2" />
        <Path d="M12 22h8M13 25h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M16 28v1" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Path d="M8 12H6M24 12h2M10 6.5L8.5 5M22 6.5l1.5-1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Circle cx="16" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      </Svg>
    );
    case 'changeover': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Rect x="3" y="4" width="26" height="24" rx="3" stroke={color} strokeWidth="2" />
        <Path d="M10 14l6-6 6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M22 18l-6 6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M16 8v16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
      </Svg>
    );
    case 'mainswitch': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Rect x="5" y="4" width="22" height="24" rx="3" stroke={color} strokeWidth="2" />
        <Circle cx="16" cy="13" r="5" stroke={color} strokeWidth="2" />
        <Path d="M16 10v3l2 2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M9 22h14M11 25h10" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
    );
    case 'louver': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Rect x="3" y="3" width="26" height="26" rx="3" stroke={color} strokeWidth="2" />
        <Path d="M6 10h20M6 16h20M6 22h20" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Path d="M6 10c4 2 10 2 20 0M6 16c4 2 10 2 20 0M6 22c4 2 10 2 20 0" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
      </Svg>
    );
    default: return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Rect x="4" y="4" width="24" height="24" rx="4" stroke={color} strokeWidth="2" />
        <Path d="M10 16h12M16 10v12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </Svg>
    );
  }
}

function ScanIcon({ size = 16, color = '#4A637B' }: { size?: number; color?: string }) {
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

function CartIcon({ size = 18, color = '#1C1E2E' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6.5 7H20L18.7 14.2C18.5 15.2 17.7 16 16.7 16H9.2C8.2 16 7.3 15.3 7.1 14.3L5.8 4.8H3.8" stroke={color} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx="9.5" cy="19.2" r="1.4" fill={color} />
      <Circle cx="17" cy="19.2" r="1.4" fill={color} />
      <Path d="M12 10.5H16M14 8.5V12.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </Svg>
  );
}

// ── Animated floating product image ──────────────────────────────────────────
const AnimatedProductImage = memo(function AnimatedProductImage({ uri, size }: { uri: string; size: number }) {
  const floatY   = useRef(new Animated.Value(0)).current;
  const imgScale = useRef(new Animated.Value(1)).current;
  const rotateZ  = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    // Float up-down
    Animated.loop(Animated.sequence([
      Animated.timing(floatY, withWebSafeNativeDriver({ toValue: -10, duration: 1800, easing: Easing.inOut(Easing.sin) })),
      Animated.timing(floatY, withWebSafeNativeDriver({ toValue: 0,   duration: 1800, easing: Easing.inOut(Easing.sin) })),
    ])).start();

    // Breathing scale
    Animated.loop(Animated.sequence([
      Animated.timing(imgScale, withWebSafeNativeDriver({ toValue: 1.08, duration: 2400, easing: Easing.inOut(Easing.ease) })),
      Animated.timing(imgScale, withWebSafeNativeDriver({ toValue: 1,    duration: 2400, easing: Easing.inOut(Easing.ease) })),
    ])).start();

    // Gentle sway
    Animated.loop(Animated.sequence([
      Animated.timing(rotateZ, withWebSafeNativeDriver({ toValue: 1,  duration: 2600, easing: Easing.inOut(Easing.sin) })),
      Animated.timing(rotateZ, withWebSafeNativeDriver({ toValue: -1, duration: 2600, easing: Easing.inOut(Easing.sin) })),
      Animated.timing(rotateZ, withWebSafeNativeDriver({ toValue: 0,  duration: 2600, easing: Easing.inOut(Easing.sin) })),
    ])).start();

    // Shimmer sweep every 3.5s
    const runShimmer = () => {
      shimmerX.setValue(-1);
      Animated.timing(shimmerX, withWebSafeNativeDriver({ toValue: 2, duration: 900, easing: Easing.inOut(Easing.ease) }))
        .start(({ finished }) => { if (finished) setTimeout(runShimmer, 3500); });
    };
    const t = setTimeout(runShimmer, 800);
    return () => clearTimeout(t);
  }, [floatY, imgScale, rotateZ, shimmerX]);

  const swayDeg = rotateZ.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-2deg', '0deg', '2deg'] });
  const shimmerTX = shimmerX.interpolate({ inputRange: [-1, 2], outputRange: [-size * 1.5, size * 3] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {/* Shimmer sweep over image */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0, bottom: 0,
          width: size * 0.35,
          backgroundColor: 'rgba(255,255,255,0.32)',
          transform: [{ translateX: shimmerTX }, { rotate: '20deg' }],
          zIndex: 2,
        }}
      />
      <Animated.View style={{ transform: [{ translateY: floatY }, { scale: imgScale }, { rotate: swayDeg }] }}>
        <Image 
          source={{ uri }} 
          style={{ width: size, height: size }} 
          contentFit="contain"
          transition={200}
          cachePolicy="memory-disk"
          priority="high"
          recyclingKey={uri}
        />
      </Animated.View>
    </View>
  );
});

// ── UiProduct type ────────────────────────────────────────────────────────────
type UiProduct = {
  id: string;
  name: string;
  sub: string;
  description: string;
  category: string;
  imageUrl: string;
  points: number;
  badge: string | null;
  price: number;
  mrp: number | null;
  stock: number;
  sku: string | null;
  weight: string | null;
};

function mapProduct(p: ApiProduct): UiProduct {
  const cat = normCat(p.category);
  const description = p.description?.trim() || p.sub?.trim() || '';
  return {
    id: p.id,
    name: p.name,
    sub: p.sub || description,
    description,
    category: cat,
    imageUrl: resolveImageUrl(p.imageUrl) || resolveImageUrl(p.image) || catImg(cat),
    points: p.points ?? 0,
    badge: p.badge?.trim() || null,
    price: Number(p.price ?? 0),
    mrp: p.mrp == null ? null : Number(p.mrp),
    stock: Number(p.stock ?? 0),
    sku: p.sku ?? null,
    weight: p.weight ?? null,
  };
}

// ── UiCategory type ───────────────────────────────────────────────────────────
type UiCategory = { id: string; label: string; count: number; imageUrl: string };

function buildUiCategories(products: UiProduct[], apiCats: ApiProductCategory[]): UiCategory[] {
  const countMap = new Map<string, number>();
  products.forEach(p => { countMap.set(p.category, (countMap.get(p.category) ?? 0) + 1); });

  const merged = new Map<string, UiCategory>();
  apiCats.forEach(c => {
    const id = normCat(c.categoryId ?? c.slug ?? c.label ?? c.id ?? '');
    if (!id) return;
    const count = countMap.get(id) ?? (typeof c.productCount === 'number' ? c.productCount : 0);
    if (count <= 0) return;
    if (!merged.has(id)) merged.set(id, { id, label: c.label?.trim() || catLabel(id), count, imageUrl: resolveImageUrl(c.imageUrl) || catImg(id) });
  });
  countMap.forEach((count, id) => {
    if (!merged.has(id)) merged.set(id, { id, label: catLabel(id), count, imageUrl: catImg(id) });
  });
  return Array.from(merged.values()).filter(c => c.count > 0).sort((a, b) => b.count - a.count);
}

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = memo(function ProductCard({
  product, cardW, onOpen, onAction, onCart, darkMode, actionLabel, cartBusy, roleTheme,
}: { product: UiProduct; cardW: number; onOpen: () => void; onAction?: () => void; onCart?: () => void; darkMode: boolean; actionLabel: string; cartBusy?: boolean; roleTheme: ProductRoleTheme }) {
  const cc = catColor(product.category);
  const mrp = product.mrp && product.mrp > product.price ? product.mrp : null;
  const discount = mrp ? Math.round(((mrp - product.price) / mrp) * 100) : 0;

  // Entry animation
  const entryY  = useRef(new Animated.Value(60)).current;
  const entryOp = useRef(new Animated.Value(0)).current;

  // Press 3D
  const pressScale = useRef(new Animated.Value(1)).current;
  const tiltX      = useRef(new Animated.Value(0)).current;  // rotateY on press
  const tiltY      = useRef(new Animated.Value(0)).current;  // rotateX on press
  const glowOp     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entryY,  withWebSafeNativeDriver({ toValue: 0, duration: 520, easing: Easing.out(Easing.back(1.4)) })),
      Animated.timing(entryOp, withWebSafeNativeDriver({ toValue: 1, duration: 400, easing: Easing.out(Easing.ease) })),
    ]).start();
  }, [entryY, entryOp]);

  const onIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(pressScale, withWebSafeNativeDriver({ toValue: 0.94, tension: 120, friction: 6 })),
      Animated.spring(tiltX,      withWebSafeNativeDriver({ toValue: 1,    tension: 120, friction: 6 })),
      Animated.spring(tiltY,      withWebSafeNativeDriver({ toValue: 1,    tension: 120, friction: 6 })),
      Animated.timing(glowOp,     withWebSafeNativeDriver({ toValue: 1, duration: 150, easing: Easing.out(Easing.ease) })),
    ]).start();
  }, [pressScale, tiltX, tiltY, glowOp]);

  const onOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(pressScale, withWebSafeNativeDriver({ toValue: 1, tension: 90, friction: 6 })),
      Animated.spring(tiltX,      withWebSafeNativeDriver({ toValue: 0, tension: 90, friction: 6 })),
      Animated.spring(tiltY,      withWebSafeNativeDriver({ toValue: 0, tension: 90, friction: 6 })),
      Animated.timing(glowOp,     withWebSafeNativeDriver({ toValue: 0, duration: 200, easing: Easing.in(Easing.ease) })),
    ]).start();
  }, [pressScale, tiltX, tiltY, glowOp]);

  const rotateY = tiltX.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '8deg'] });
  const rotateX = tiltY.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-5deg'] });

  // Bigger image — fills almost full card width
  const imgSize   = Math.round(cardW * 0.9);
  const imgHeight = Math.round(cardW * 0.98);

  return (
    <Pressable onPress={onOpen} onPressIn={onIn} onPressOut={onOut}>
      <Animated.View style={{ opacity: entryOp, transform: [{ translateY: entryY }] }}>

        {/* Coloured glow shadow on press */}
        <Animated.View style={[
          styles.cardGlow,
          { width: cardW, backgroundColor: cc.scanText + '18', opacity: glowOp },
        ]} />

        <Animated.View style={[
          styles.card,
          darkMode ? styles.cardDark : null,
          {
            width: cardW,
            minHeight: cardW * 1.78,
            transform: [
              { scale: pressScale },
              { perspective: 800 },
              { rotateY },
              { rotateX },
            ],
          },
        ]}>
          {/* Image zone — taller, bigger image */}
          <LinearGradient
            colors={darkMode ? ['#111827', '#182233', '#111827'] : ['#FFFFFF', '#FFFFFF', '#F8FAFD']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.imgZone, { height: imgHeight }]}
          >
            {product.badge != null && (
              <View style={[styles.badge, { backgroundColor: roleTheme.primary }]}>
                <Text style={[styles.badgeText, { color: roleTheme.onPrimary }]}>{product.badge}</Text>
              </View>
            )}
            <View style={[styles.ptsBadge, { borderColor: premium.line }]}>
              <Text style={[styles.ptsBadgeText, { color: roleTheme.primary }]}>+{product.points} pts</Text>
            </View>
            {discount > 0 ? (
              <View style={styles.cardDiscountBadge}>
                <Text style={styles.cardDiscountText}>{discount}% off</Text>
              </View>
            ) : null}
            <AnimatedProductImage uri={product.imageUrl} size={imgSize} />
          </LinearGradient>

          {/* Thin accent line */}
          <View style={styles.productDivider} />

          {/* Info zone */}
          <View style={[styles.infoZone, darkMode ? styles.infoZoneDark : null]}>
            <View>
              <Text style={[styles.productName, darkMode ? styles.productNameDark : null]} numberOfLines={2}>{product.name}</Text>
              <View style={styles.productPriceRow}>
                <Text style={[styles.productCardPrice, darkMode ? styles.productCardPriceDark : null]}>₹{product.price.toLocaleString('en-IN')}</Text>
                {mrp ? (
                  <>
                    <Text style={styles.productMrp}>₹{mrp.toLocaleString('en-IN')}</Text>
                    <Text style={styles.productOfferText}>{discount}% off</Text>
                  </>
                ) : null}
              </View>
              {mrp ? (
                <Text style={styles.productTaxText}>Inclusive of all taxes</Text>
              ) : null}
              <Text style={[styles.productSub,  darkMode ? styles.productSubDark  : null]} numberOfLines={2}>{product.sub}</Text>
            </View>
            <View style={styles.cardActionRow}>
              <TouchableOpacity onPress={onAction ?? onOpen} style={[styles.scanBtn, { backgroundColor: roleTheme.soft }]} activeOpacity={0.8}>
                <ScanIcon size={15} color={roleTheme.primary} />
                <Text style={[styles.scanBtnText, { color: roleTheme.primary }]}>{actionLabel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onCart}
                style={[styles.quickCartBtn, { backgroundColor: roleTheme.primary, opacity: cartBusy ? 0.72 : 1 }]}
                activeOpacity={0.82}
                disabled={cartBusy}
              >
                {cartBusy ? <ActivityIndicator size="small" color={roleTheme.onPrimary} /> : <CartIcon size={18} color={roleTheme.onPrimary} />}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

type ProductRow = { key: string; left: UiProduct; right: UiProduct | null };

function ProductDetailView({
  product,
  relatedProducts,
  role,
  darkMode,
  isCustomer,
  roleTheme,
  onBack,
  onAddToCart,
  onBuyNow,
  onOpenRelated,
  onAddRelated,
  actionBusy,
  qty,
  onQtyChange,
}: {
  product: UiProduct;
  relatedProducts: UiProduct[];
  role: 'electrician' | 'dealer' | 'customer' | 'counterboy';
  darkMode: boolean;
  isCustomer: boolean;
  roleTheme: ProductRoleTheme;
  onBack: () => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onOpenRelated: (product: UiProduct) => void;
  onAddRelated: (product: UiProduct) => void;
  actionBusy: 'cart' | 'buy' | null;
  qty: number;
  onQtyChange: (qty: number) => void;
}) {
  const { tx } = usePreferenceContext();
  const bg = darkMode ? '#0B1220' : '#FFFFFF';
  const card = darkMode ? '#111827' : '#FFFFFF';
  const text = darkMode ? '#F8FAFC' : premium.ink;
  const muted = darkMode ? '#A8B3C7' : premium.muted;
  const border = darkMode ? '#25344E' : premium.line;
  const mrp = product.mrp && product.mrp > product.price ? product.mrp : null;
  const discount = mrp ? Math.round(((mrp - product.price) / mrp) * 100) : 0;

  return (
    <View style={[styles.detailScreen, { backgroundColor: bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailContent}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={onBack} style={[styles.detailBackBtn, { backgroundColor: card, borderColor: border }]} activeOpacity={0.82}>
            <Text style={[styles.detailBackText, { color: text }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.detailHeaderTitle, { color: text }]} numberOfLines={1}>{tx('Product Details')}</Text>
            <Text style={[styles.detailHeaderSub, { color: muted }]} numberOfLines={1}>{catLabel(product.category)}</Text>
          </View>
        </View>

        <LinearGradient colors={darkMode ? ['#111827', '#1F2937', '#111827'] : ['#FFFFFF', '#F8FAFD', '#F5F7FB']} style={[styles.detailImagePanel, { borderColor: border }]}>
          {product.badge ? <Text style={[styles.detailBadge, { backgroundColor: roleTheme.primary, color: roleTheme.onPrimary }]}>{product.badge}</Text> : null}
          {discount > 0 ? <Text style={styles.detailDiscount}>{discount}% OFF</Text> : null}
          <Image source={{ uri: product.imageUrl }} style={styles.detailImage} contentFit="contain" transition={200} />
        </LinearGradient>

        <View style={[styles.detailInfoCard, { backgroundColor: card, borderColor: border }]}>
          <View style={styles.detailTitleRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.detailNamePriceRow}>
                <Text style={[styles.detailProductName, { color: text }]}>{product.name}</Text>
                <Text style={[styles.detailInlinePrice, { color: text }]}>₹{product.price.toLocaleString('en-IN')}</Text>
              </View>
              <Text style={[styles.detailCategory, { color: roleTheme.primary }]}>{catLabel(product.category)}</Text>
            </View>
            <View style={[styles.detailPointsPill, { backgroundColor: roleTheme.soft }]}>
              <Text style={[styles.detailPointsText, { color: roleTheme.primary }]}>+{product.points} pts</Text>
            </View>
          </View>

          <View style={styles.detailPriceRow}>
            <Text style={[styles.detailPrice, { color: text }]}>₹{product.price.toLocaleString('en-IN')}</Text>
            {mrp ? <Text style={[styles.detailMrp, { color: muted }]}>₹{mrp.toLocaleString('en-IN')}</Text> : null}
            <Text style={[styles.detailStock, { color: product.stock > 0 ? '#059669' : '#DC2626' }]}>
              {product.stock > 0 ? `${product.stock} in stock` : tx('Out of stock')}
            </Text>
          </View>

          <View style={styles.detailTrustRow}>
            <View style={[styles.detailTrustChip, { backgroundColor: darkMode ? '#102032' : roleTheme.soft, borderColor: border }]}>
              <Text style={styles.detailTrustIcon}>✓</Text>
              <Text style={[styles.detailTrustText, { color: text }]}>{tx('SRV Assured')}</Text>
            </View>
            <View style={[styles.detailTrustChip, { backgroundColor: darkMode ? '#10281B' : '#ECFDF5', borderColor: border }]}>
              <Text style={styles.detailTrustIcon}>₹</Text>
              <Text style={[styles.detailTrustText, { color: text }]}>{tx('Free delivery')}</Text>
            </View>
          </View>

          <View style={[styles.detailOfferPanel, { borderColor: roleTheme.primary + '33', backgroundColor: darkMode ? '#111827' : roleTheme.soft }]}>
            <Text style={[styles.detailOfferTitle, { color: text }]}>{tx('Available Offers')}</Text>
            <Text style={[styles.detailOfferLine, { color: muted }]}>• {tx('Earn')} {product.points} {tx('reward points on this product.')}</Text>
            {discount > 0 ? (
              <Text style={[styles.detailOfferLine, { color: muted }]}>• {discount}% {tx('instant discount compared with MRP.')}</Text>
            ) : null}
            <Text style={[styles.detailOfferLine, { color: muted }]}>• {tx('Use COD, Razorpay, or wallet points at checkout.')}</Text>
          </View>

          <View style={styles.detailMetaGrid}>
            <View style={[styles.detailMetaBox, { backgroundColor: darkMode ? '#111827' : '#F8FAFC', borderColor: border }]}>
              <Text style={[styles.detailMetaLabel, { color: muted }]}>{tx('SKU')}</Text>
              <Text style={[styles.detailMetaValue, { color: text }]} numberOfLines={1}>{product.sku || 'SRV'}</Text>
            </View>
            <View style={[styles.detailMetaBox, { backgroundColor: darkMode ? '#111827' : '#F8FAFC', borderColor: border }]}>
              <Text style={[styles.detailMetaLabel, { color: muted }]}>{tx('Weight')}</Text>
              <Text style={[styles.detailMetaValue, { color: text }]} numberOfLines={1}>{product.weight || tx('Standard')}</Text>
            </View>
          </View>

          <Text style={[styles.detailSectionTitle, { color: text }]}>{tx('Description')}</Text>
          <Text style={[styles.detailDescription, { color: muted }]}>
            {product.description || product.sub || tx('SRV product details will appear here once updated from SRV Team.')}
          </Text>
        </View>
        {relatedProducts.length > 0 ? (
          <View style={[styles.relatedPanel, { backgroundColor: card, borderColor: border }]}>
            <Text style={[styles.relatedTitle, { color: text }]}>{tx('Related Products')}</Text>
            <Text style={[styles.relatedSub, { color: muted }]}>{tx('You may also like')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedList}>
              {relatedProducts.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.relatedCard, { borderColor: border, backgroundColor: darkMode ? '#111827' : '#F8FAFC' }]}
                  activeOpacity={0.86}
                  onPress={() => onOpenRelated(item)}
                >
                  <Image source={{ uri: item.imageUrl }} style={styles.relatedImage} contentFit="contain" transition={150} />
                  <Text style={[styles.relatedName, { color: text }]} numberOfLines={2}>{item.name}</Text>
                  <Text style={[styles.relatedPrice, { color: text }]}>₹{item.price.toLocaleString('en-IN')}</Text>
              <Text style={[styles.relatedPoints, { color: roleTheme.primary }]}>+{item.points} pts</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.detailFooter, { backgroundColor: card, borderColor: border }]}>
        <View style={[styles.detailQtyRow, { borderColor: border }]}>
          <Text style={[styles.detailQtyLabel, { color: muted }]}>{tx('Qty')}</Text>
          <View style={[styles.detailQtyPicker, { backgroundColor: darkMode ? '#111827' : '#F8FAFC', borderColor: border }]}>
            <Pressable
              style={[styles.detailQtyBtn, { backgroundColor: roleTheme.primary }]}
              onPress={() => qty > 1 && onQtyChange(qty - 1)}
            >
              <Text style={styles.detailQtyBtnText}>−</Text>
            </Pressable>
            <Text style={[styles.detailQtyValue, { color: text }]}>{qty}</Text>
            <Pressable
              style={[styles.detailQtyBtn, { backgroundColor: roleTheme.primary }]}
              onPress={() => onQtyChange(qty + 1)}
            >
              <Text style={styles.detailQtyBtnText}>+</Text>
            </Pressable>
          </View>
          <Text style={[styles.detailQtyTotal, { color: text }]}>₹{(product.price * qty).toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.detailFooterButtons}>
          <TouchableOpacity
            onPress={onAddToCart}
            disabled={actionBusy !== null}
            style={[styles.detailSecondaryBtn, { borderColor: roleTheme.primary, opacity: actionBusy ? 0.75 : 1 }]}
            activeOpacity={0.84}
          >
            {actionBusy === 'cart' ? <ActivityIndicator color={roleTheme.primary} /> : <Text style={[styles.detailSecondaryText, { color: roleTheme.primary }]}>{tx('Add to Cart')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onBuyNow}
            disabled={actionBusy !== null}
            style={[styles.detailPrimaryBtn, { backgroundColor: roleTheme.primary, opacity: actionBusy ? 0.75 : 1 }]}
            activeOpacity={0.84}
          >
            {actionBusy === 'buy' ? <ActivityIndicator color={roleTheme.onPrimary} /> : <Text style={[styles.detailPrimaryText, { color: roleTheme.onPrimary }]}>{tx('Buy Now')}</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main ProductScreen ────────────────────────────────────────────────────────
export function ProductScreen({
  onNavigate,
  onAddToCart,
  onBuyNow,
  initialCategory = 'all',
  showBottomBanner = true,
  role = 'electrician',
  onLoginRequired,
  cartCount = 0,
}: {
  onNavigate: (screen: Screen) => void;
  onAddToCart?: (item: any) => void;
  onBuyNow?: (item: any) => void;
  initialCategory?: string;
  showBottomBanner?: boolean;
  role?: 'electrician' | 'dealer' | 'customer' | 'counterboy';
  onLoginRequired?: () => void;
  cartCount?: number;
}) {
  const { darkMode, tx } = usePreferenceContext();
  const { products: apiProducts, categories: apiCategories, catalogLoading, refreshAll } = useAppData();
  const { isAuthenticated } = useAuth();
  const { width } = useWindowDimensions();
  const productListRef = useRef<FlatList>(null);
  useRegisterScrollToTop('product', productListRef);
  const contentRole = role === 'customer' ? 'user' : role;
  const pageContent = useAppPageContent(contentRole as any, 'product');

  const [category, setCategory] = useState(normCat(initialCategory) || 'all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<UiProduct | null>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [actionBusy, setActionBusy] = useState<'cart' | 'buy' | null>(null);
  const [cardCartBusyId, setCardCartBusyId] = useState<string | null>(null);
  const productViewStartRef = useRef<{ id: string; startedAt: number } | null>(null);
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; confirmLabel?: string; onConfirm?: () => void; icon?: string }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));

  const PADDING = 14;
  const GAP = 12;
  const cardW = Math.floor((width - PADDING * 2 - GAP) / 2);

  // Map API products to UI products
  const products = useMemo(() => apiProducts.map(mapProduct), [apiProducts]);

  // Build categories from real data
  const uiCategories = useMemo(() => buildUiCategories(products, apiCategories), [products, apiCategories]);

  // All categories list including "All"
  const allCategoryItem = useMemo<UiCategory>(
    () => ({ id: 'all', label: pageContent.pageTitle || tx('All Products'), count: products.length, imageUrl: DEFAULT_IMAGES.fanbox }),
    [pageContent.pageTitle, products.length, tx]
  );
  const categoryItems = useMemo(() => {
    if (category === 'all') return [allCategoryItem, ...uiCategories];
    const activeCategory = uiCategories.find((item) => item.id === category);
    if (!activeCategory) return [allCategoryItem, ...uiCategories];
    return [
      activeCategory,
      allCategoryItem,
      ...uiCategories.filter((item) => item.id !== category),
    ];
  }, [allCategoryItem, category, uiCategories]);

  // Sync initialCategory changes
  useEffect(() => {
    const next = normCat(initialCategory) || 'all';
    setCategory(next);
    setSearch('');
  }, [initialCategory]);

  const isSearching = search.trim().length > 0;

  const filtered = useMemo(() => {
    let result: typeof products;
    if (isSearching) {
      const q = search.toLowerCase();
      result = products.filter(p => p.name.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q));
    } else if (category === 'all') {
      result = products;
    } else {
      result = products.filter(p => p.category === category);
    }
    // Sort alphabetically A-Z by name
    return [...result].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, category, search, isSearching]);

  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    const sameCategory = products.filter(
      (product) => product.id !== selectedProduct.id && product.category === selectedProduct.category,
    );
    const fallback = products.filter((product) => product.id !== selectedProduct.id);
    return (sameCategory.length ? sameCategory : fallback).slice(0, 10);
  }, [products, selectedProduct]);

  const searchSuggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((product) =>
        product.name.toLowerCase().includes(q) ||
        product.sub.toLowerCase().includes(q) ||
        catLabel(product.category).toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [products, search]);

  // ✨ PREFETCH NEXT IMAGES FOR FASTER LOADING ✨
  useEffect(() => {
    if (filtered.length > 6) {
      // Prefetch next 10 images in background
      const nextImages = filtered.slice(6, 16);
      nextImages.forEach(product => {
        Image.prefetch(product.imageUrl);
      });
    }
  }, [filtered]);

  const rows = useMemo<ProductRow[]>(() => {
    const r: ProductRow[] = [];
    for (let i = 0; i < filtered.length; i += 2) {
      r.push({ key: filtered[i].id, left: filtered[i], right: filtered[i + 1] ?? null });
    }
    return r;
  }, [filtered]);

  const currentCat = categoryItems.find(c => c.id === category) ?? allCategoryItem;
  const isDealer = role === 'dealer';
  const isCustomer = role === 'customer';
  const isCounterboy = role === 'counterboy';
  const productTheme = PRODUCT_ROLE_THEMES[role] ?? PRODUCT_ROLE_THEMES.electrician;
  const productActionLabel = tx('Buy Now');
  const requireAuth = useCallback(() => {
    if (isAuthenticated) return true;
    setDialog({
      visible: true,
      variant: 'confirm',
      title: tx('Login required'),
      message: tx('Please login or signup to continue with this product.'),
      confirmLabel: tx('Login / Signup'),
      onConfirm: onLoginRequired,
    });
    return false;
  }, [isAuthenticated, onLoginRequired, tx]);

  const trackProductActivity = useCallback((data: Parameters<typeof activityApi.track>[0]) => {
    void activityApi.track(data).catch(() => {});
  }, []);

  const handleOpenProduct = useCallback((product: UiProduct) => {
    setSelectedProduct(product);
    setDetailQty(1);
    productViewStartRef.current = { id: product.id, startedAt: Date.now() };
    trackProductActivity({
      eventType: 'product_view',
      eventLabel: `Viewed ${product.name}`,
      screen: 'product',
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      metadata: { role, price: product.price },
    });
  }, [role, trackProductActivity]);

  const handleCardAction = useCallback((product: UiProduct) => {
    if (!requireAuth()) return;

    if (!onBuyNow) {
      handleOpenProduct(product);
      return;
    }

    trackProductActivity({
      eventType: 'product_buy_now',
      eventLabel: `Tapped Buy Now for ${product.name}`,
      screen: 'product',
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      quantity: 1,
    });
    onBuyNow({
      id: product.id,
      name: product.name,
      desc: product.sub || product.description,
      image: { uri: product.imageUrl },
      price: product.price,
      qty: 1,
    });
  }, [handleOpenProduct, onBuyNow, requireAuth, trackProductActivity]);

  const handleCardAdd = useCallback(async (product: UiProduct) => {
    if (!requireAuth()) return;
    try {
      await catalogApi.addToCart({ productId: product.id, quantity: 1 });
      onAddToCart?.({
        id: product.id,
        name: product.name,
        desc: product.sub || product.description,
        image: { uri: product.imageUrl },
        price: product.price,
        qty: 1,
      });
      trackProductActivity({
        eventType: 'product_add_to_cart', eventLabel: `Added ${product.name} to cart`, screen: 'product',
        productId: product.id, productName: product.name, productCategory: product.category, quantity: 1,
      });
      setDialog({ visible: true, variant: 'success', title: tx('Added to cart'), message: tx('Product added to your cart.') });
    } catch (error: any) {
      setDialog({ visible: true, variant: 'error', title: tx('Cart update failed'), message: error?.message || tx('Please try again.') });
    }
  }, [onAddToCart, requireAuth, trackProductActivity, tx]);

  useEffect(() => {
    if (!selectedProduct) return;
    return () => {
      const started = productViewStartRef.current;
      if (started?.id !== selectedProduct.id) return;
      trackProductActivity({
        eventType: 'product_view',
        eventLabel: `Viewed ${selectedProduct.name} detail`,
        screen: 'product',
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productCategory: selectedProduct.category,
        durationMs: Math.max(0, Date.now() - started.startedAt),
        metadata: { role, closed: true },
      });
    };
  }, [role, selectedProduct, trackProductActivity]);

  const handleAddSelectedToCart = useCallback(async () => {
    if (!selectedProduct || !requireAuth()) return;
    setActionBusy('cart');
    try {
      await catalogApi.addToCart({ productId: selectedProduct.id, quantity: detailQty });
      trackProductActivity({
        eventType: 'product_add_to_cart',
        eventLabel: `Added ${selectedProduct.name} to cart`,
        screen: 'product',
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productCategory: selectedProduct.category,
        quantity: detailQty,
      });
      onAddToCart?.({
        id: selectedProduct.id,
        name: selectedProduct.name,
        desc: selectedProduct.sub || selectedProduct.description,
        image: { uri: selectedProduct.imageUrl },
        price: selectedProduct.price,
        qty: detailQty,
      });
      setDialog({ visible: true, variant: 'success', title: tx('Added to cart'), message: tx('Product added to your cart.') });
    } catch (error: any) {
      setDialog({ visible: true, variant: 'error', title: tx('Cart update failed'), message: error?.message || tx('Please try again.') });
    } finally {
      setActionBusy(null);
    }
  }, [onAddToCart, requireAuth, selectedProduct, detailQty, tx, trackProductActivity]);

  const handleQuickAddToCart = useCallback(async (product: UiProduct) => {
    if (!requireAuth()) return;
    setCardCartBusyId(product.id);
    try {
      await catalogApi.addToCart({ productId: product.id, quantity: 1 });
      trackProductActivity({
        eventType: 'product_add_to_cart',
        eventLabel: `Quick added ${product.name} to cart`,
        screen: 'product',
        productId: product.id,
        productName: product.name,
        productCategory: product.category,
        quantity: 1,
      });
      onAddToCart?.({
        id: product.id,
        name: product.name,
        desc: product.sub || product.description,
        image: { uri: product.imageUrl },
        price: product.price,
        qty: 1,
      });
      setDialog({ visible: true, variant: 'success', title: tx('Added to cart'), message: tx('Product added to your cart.') });
    } catch (error: any) {
      setDialog({ visible: true, variant: 'error', title: tx('Cart update failed'), message: error?.message || tx('Please try again.') });
    } finally {
      setCardCartBusyId(null);
    }
  }, [onAddToCart, requireAuth, tx, trackProductActivity]);

  const handleBuySelectedNow = useCallback(async () => {
    if (!selectedProduct || !requireAuth()) return;
    if (onBuyNow) {
      trackProductActivity({
        eventType: 'product_buy_now',
        eventLabel: `Tapped Buy Now for ${selectedProduct.name}`,
        screen: 'product',
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productCategory: selectedProduct.category,
        quantity: detailQty,
      });
      onBuyNow({
        id: selectedProduct.id,
        name: selectedProduct.name,
        desc: selectedProduct.sub || selectedProduct.description,
        image: { uri: selectedProduct.imageUrl },
        price: selectedProduct.price,
        qty: detailQty,
      });
      setSelectedProduct(null);
    } else {
      setActionBusy('buy');
      try {
        await catalogApi.buyNow({ productId: selectedProduct.id, quantity: detailQty });
        trackProductActivity({
          eventType: 'product_buy_now',
          eventLabel: `Ordered ${selectedProduct.name}`,
          screen: 'product',
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          productCategory: selectedProduct.category,
          quantity: detailQty,
        });
        setDialog({ visible: true, variant: 'success', title: tx('Order placed'), message: tx('Your product order has been sent to SRV Team.') });
        setSelectedProduct(null);
      } catch (error: any) {
        setDialog({ visible: true, variant: 'error', title: tx('Order failed'), message: error?.message || tx('Please try again.') });
      } finally {
        setActionBusy(null);
      }
    }
  }, [requireAuth, selectedProduct, detailQty, tx, onBuyNow, trackProductActivity]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  // ── Render row ──────────────────────────────────────────────────────────────
  const renderRow = useCallback(({ item }: { item: ProductRow }) => (
    <View style={styles.row}>
      <ProductCard
        product={item.left}
        cardW={cardW}
        onOpen={() => handleOpenProduct(item.left)}
        onAction={() => handleCardAction(item.left)}
        onCart={() => handleQuickAddToCart(item.left)}
        darkMode={darkMode}
        actionLabel={productActionLabel}
        cartBusy={cardCartBusyId === item.left.id}
        roleTheme={productTheme}
      />
      {item.right
        ? (
          <ProductCard
            product={item.right}
            cardW={cardW}
            onOpen={() => handleOpenProduct(item.right!)}
            onAction={() => handleCardAction(item.right!)}
            onCart={() => handleQuickAddToCart(item.right!)}
            darkMode={darkMode}
            actionLabel={productActionLabel}
            cartBusy={cardCartBusyId === item.right!.id}
            roleTheme={productTheme}
          />
        )
        : <View style={{ width: cardW }} />}
    </View>
  ), [cardCartBusyId, cardW, darkMode, handleCardAction, handleOpenProduct, handleQuickAddToCart, productActionLabel, productTheme]);

  const keyExtractor = useCallback((item: ProductRow) => item.key, []);

  // ── List header (search + filter + tabs + banner) ───────────────────────────
  const ListHeader = useMemo(() => (
    <View style={{ gap: 14, paddingBottom: 4 }}>
      {/* Title */}
      <View style={styles.pageTitleRow}>
        <Text style={[styles.pageTitle, darkMode ? styles.pageTitleDark : null]}>{pageContent.pageTitle || tx('All Products')}</Text>
        <TouchableOpacity
          onPress={() => onNavigate('cart')}
          style={[
            styles.headerCartBtn,
            darkMode ? styles.headerCartBtnDark : null,
          ]}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel={tx('Open cart')}
        >
          <CartIcon size={21} color="#D92D27" />
          {cartCount > 0 ? (
            <View style={[styles.headerCartBadge, { backgroundColor: '#D92D27' }]}>
              <Text style={styles.headerCartBadgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={[styles.searchWrap, darkMode ? styles.searchWrapDark : null]}>
        <Text style={{ fontSize: 15, color: C.textMuted }}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={pageContent.searchPlaceholder || tx('Search all products...')}
          placeholderTextColor={C.textMuted}
          style={[styles.searchInput, darkMode ? styles.searchInputDark : null]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')}>
            <Text style={{ fontSize: 15, color: C.textMuted }}>✕</Text>
          </Pressable>
        )}
        <TouchableOpacity
          onPress={() => setShowFilters(v => !v)}
          style={[
            styles.filterBtn,
            showFilters && { backgroundColor: productTheme.primary }
          ]}
          activeOpacity={0.82}
        >
          <FilterIcon color={showFilters ? productTheme.onPrimary : C.textDark} />
        </TouchableOpacity>
      </View>

      {searchSuggestions.length > 0 ? (
        <View style={[styles.suggestionPanel, { backgroundColor: darkMode ? '#111827' : '#FFFFFF', borderColor: darkMode ? '#243043' : '#EEEEF3' }]}>
          <Text style={[styles.suggestionTitle, { color: darkMode ? '#F8FAFC' : '#1C1E2E' }]}>{tx('Top matches')}</Text>
          {searchSuggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionRow}
              activeOpacity={0.82}
              onPress={() => {
                setSearch('');
                setShowFilters(false);
                handleOpenProduct(item);
              }}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.suggestionImage} contentFit="contain" />
              <View style={styles.suggestionCopy}>
                <Text style={[styles.suggestionName, { color: darkMode ? '#F8FAFC' : '#1C1E2E' }]} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.suggestionMeta} numberOfLines={1}>{catLabel(item.category)}</Text>
              </View>
              <Text style={[styles.suggestionPrice, { color: darkMode ? '#F8FAFC' : premium.ink }]}>₹{item.price.toLocaleString('en-IN')}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Filter panel */}
      {showFilters && (
        <View style={[styles.filterPanel, darkMode ? styles.filterPanelDark : null]}>
          <View style={styles.filterPanelHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.filterPanelTitle, darkMode ? styles.filterPanelTitleDark : null]}>{tx('Filter products')}</Text>
              <Text style={[styles.filterPanelSub, darkMode ? styles.filterPanelSubDark : null]}>{tx('Choose a category to see matching products.')}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowFilters(false)} activeOpacity={0.8}>
              <Text style={[styles.filterClose, { color: productTheme.primary }]}>{tx('Close')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterGrid}>
            {uiCategories.map(cat => {
              const active = !isSearching && cat.id === category;
              const activeCardStyle = active ? { backgroundColor: productTheme.primary, borderColor: productTheme.primary } : null;
              const iconBg = active ? 'rgba(255,255,255,0.22)' : productTheme.iconSoft;
              const iconColor = active ? productTheme.onPrimary : productTheme.primary;
              const titleColor = active ? productTheme.onPrimary : premium.ink;
              const metaColor = active ? productTheme.activeMeta : premium.muted;
              
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => { setCategory(cat.id); setSearch(''); setShowFilters(false); }}
                  style={[
                    styles.filterCard, 
                    darkMode ? styles.filterCardDark : null, 
                    activeCardStyle
                  ]}
                  activeOpacity={0.86}
                >
                  <View style={[
                    styles.filterCardIcon, 
                    { backgroundColor: iconBg }
                  ]}>
                    <CatIcon 
                      id={cat.id} 
                      size={22} 
                      color={iconColor}
                    />
                  </View>
                  <Text style={[
                    styles.filterCardTitle, 
                    darkMode && !active ? styles.filterCardTitleDark : null, 
                    { color: titleColor }
                  ]} numberOfLines={1}>{cat.label}</Text>
                  <Text style={[
                    styles.filterCardMeta, 
                    darkMode && !active ? styles.filterCardMetaDark : null, 
                    { color: metaColor }
                  ]}>{cat.count} {tx('products')}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Category tabs */}
      <FlatList
        data={categoryItems}
        keyExtractor={c => c.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabList}
          renderItem={({ item: cat }) => {
            const active = !isSearching && cat.id === category;
            const tabStyle = active
              ? { backgroundColor: productTheme.primary, borderColor: productTheme.primary }
              : { backgroundColor: darkMode ? '#111827' : '#FFFFFF', borderColor: darkMode ? '#243043' : premium.line };
            const tabIconBg = active ? 'rgba(255,255,255,0.22)' : productTheme.iconSoft;
            const tabIconColor = active ? productTheme.onPrimary : productTheme.primary;
            const tabTextColor = active ? productTheme.onPrimary : (darkMode ? '#F8FAFC' : '#1C1E2E');
            
            return (
              <TouchableOpacity
                onPress={() => { setCategory(cat.id); setSearch(''); }}
                style={[
                  styles.categoryTab, 
                  darkMode ? styles.categoryTabDark : null, 
                  tabStyle
                ]}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.tabIconWrap, 
                  { backgroundColor: tabIconBg }
                ]}>
                  <CatIcon 
                    id={cat.id} 
                    size={18} 
                    color={tabIconColor}
                  />
                </View>
                <Text style={[
                  styles.categoryText, 
                  darkMode && !active ? styles.categoryTextDark : null, 
                  { color: tabTextColor }
                ]}>{cat.label}</Text>
              </TouchableOpacity>
          );
        }}
      />

      {/* Banner or search result info */}
      {isSearching ? (
        <View style={[styles.searchResultBanner, darkMode ? styles.searchResultBannerDark : null]}>
          <Text style={[styles.searchResultText, darkMode ? styles.searchResultTextDark : null]}>
            {filtered.length > 0
              ? `${filtered.length} ${tx('results for')} "${search}"`
              : `${tx('No results for')} "${search}"`}
          </Text>
          {filtered.length === 0 && (
            <Text style={[styles.searchResultSub, darkMode ? styles.searchResultSubDark : null]}>{tx('Try searching by product name or size')}</Text>
          )}
        </View>
      ) : (
        <View 
          style={[styles.catBanner, { backgroundColor: darkMode ? '#111827' : '#FFFFFF', borderWidth: 1, borderColor: darkMode ? '#243043' : productTheme.primary + '24' }]}
        >
          <View style={styles.catBannerLeft}>
            <View style={[styles.bannerIconWrap, { backgroundColor: productTheme.iconSoft }]}>
              <CatIcon id={category} size={32} color={productTheme.primary} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.catBannerTitle, { color: darkMode ? '#F8FAFC' : premium.ink }]} numberOfLines={1} adjustsFontSizeToFit>{currentCat.label}</Text>
              <Text style={[styles.catBannerSub, { color: premium.muted }]} numberOfLines={1}>
                {catalogLoading && products.length === 0 ? tx('Loading...') : `${filtered.length} ${tx('products available')}`}
              </Text>
            </View>
          </View>
          {!isDealer && !isCustomer && !isCounterboy ? (
            <View style={styles.catActionPlaceholder} />
          ) : null}
        </View>
      )}
    </View>
  ), [darkMode, tx, search, showFilters, uiCategories, categoryItems, category, isSearching, filtered.length, currentCat, catalogLoading, products.length, isCustomer, isDealer, isCounterboy, onNavigate, pageContent.pageTitle, pageContent.searchPlaceholder, searchSuggestions, handleOpenProduct, cartCount, productTheme]);

  const ListFooter = useMemo(() => (
    <View>
      {showBottomBanner && (
        <TouchableOpacity
          style={[styles.bottomBanner, darkMode ? styles.bottomBannerDark : null]}
          activeOpacity={0.88}
          onPress={() => onNavigate((isDealer || isCustomer) ? 'rewards' : 'scan')}
        >
          <Text style={{ fontSize: 26 }}>🏭</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bottomBannerTitle}>{tx("North India's Largest Manufacturer")}</Text>
            <Text style={styles.bottomBannerSub}>
              {(isDealer || isCustomer)
                ? tx('SRV Electricals — since 2000. Explore the latest SRV product range and offers.')
                : tx('SRV Electricals — since 2000. Scan any QR to earn points!')}
            </Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      )}
      <View style={{ height: 110 }} />
    </View>
  ), [darkMode, tx, showBottomBanner, onNavigate, isDealer, isCustomer]);

  const ListEmpty = useMemo(() => (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>{catalogLoading ? '⏳' : '🔍'}</Text>
      <Text style={[styles.emptyText, darkMode ? styles.emptyTextDark : null]}>
        {catalogLoading ? tx('Loading products...') : pageContent.emptyStateTitle || tx('No products found')}
      </Text>
    </View>
  ), [catalogLoading, darkMode, tx, pageContent.emptyStateTitle]);

  const dialogEl = (
    <Dialog
      visible={dialog.visible}
      variant={dialog.variant}
      title={dialog.title}
      message={dialog.message}
      confirmLabel={dialog.confirmLabel}
      icon={dialog.icon}
      onConfirm={dialog.onConfirm}
      onClose={closeDialog}
    />
  );

  if (selectedProduct) {
    return (
      <>
        <ProductDetailView
          product={selectedProduct}
          relatedProducts={relatedProducts}
          role={role}
          darkMode={darkMode}
          isCustomer={isCustomer}
          roleTheme={productTheme}
          onBack={() => { setSelectedProduct(null); setDetailQty(1); }}
          onAddToCart={handleAddSelectedToCart}
          onBuyNow={handleBuySelectedNow}
          onOpenRelated={handleOpenProduct}
          onAddRelated={handleCardAdd}
          actionBusy={actionBusy}
          qty={detailQty}
          onQtyChange={setDetailQty}
        />
        {dialogEl}
      </>
    );
  }

  return (
    <>
      <FlatList
        ref={productListRef}
        style={[styles.screen, { backgroundColor: productTheme.pageBg }, darkMode ? styles.screenDark : null]}
        contentContainerStyle={styles.content}
        data={rows}
        keyExtractor={keyExtractor}
        renderItem={renderRow}
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[productTheme.primary]}
            tintColor={productTheme.primary}
          />
        }
      />
      {dialogEl}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: premium.bg },
  screenDark: { backgroundColor: '#08111F' },
  content: { padding: 14, gap: 16, paddingBottom: 120 },

  pageTitleRow: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 52,
    position: 'relative',
  },
  pageTitle: { fontSize: 22, fontWeight: '900', color: premium.ink, textAlign: 'center' },
  pageTitleDark: { color: '#F8FAFC' },
  headerCartBtn: {
    position: 'absolute',
    right: 0,
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: premium.surface,
    borderWidth: 1,
    borderColor: premium.line,
    ...premiumShadow('sm'),
  },
  headerCartBtnDark: { backgroundColor: '#111827', borderColor: '#243043' },
  headerCartBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: premium.navy,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerCartBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', lineHeight: 12 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: premium.surface, borderRadius: 18, borderWidth: 1,
    borderColor: premium.line, paddingHorizontal: 14, height: 54,
    ...premiumShadow('sm'),
  },
  searchWrapDark: { backgroundColor: '#111827', borderColor: '#243043' },
  searchInput: { flex: 1, fontSize: 15, color: premium.ink, fontWeight: '600' },
  searchInputDark: { color: '#F8FAFC' },
  filterBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: premium.surfaceSoft,
  },
  filterBtnActive: { backgroundColor: premium.navy },

  filterPanel: {
    backgroundColor: premium.surface, borderRadius: 22, padding: 14,
    borderWidth: 1, borderColor: premium.line,
    ...premiumShadow('sm'),
  },
  filterPanelDark: { backgroundColor: '#111827', borderColor: '#243043' },
  filterPanelHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 10, marginBottom: 12,
  },
  filterPanelTitle: { fontSize: 16, fontWeight: '900', color: premium.ink },
  filterPanelTitleDark: { color: '#F8FAFC' },
  filterPanelSub: { fontSize: 12, color: premium.muted, marginTop: 3, lineHeight: 17 },
  filterPanelSubDark: { color: '#94A3B8' },
  filterClose: { fontSize: 12.5, fontWeight: '900', color: premium.navy },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterCard: {
    width: '48%', backgroundColor: premium.surfaceSoft, borderWidth: 1,
    borderColor: premium.line, borderRadius: 18, padding: 12,
  },
  filterCardDark: { backgroundColor: '#182133', borderColor: '#243043' },
  filterCardIcon: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  filterCardTitle: { fontSize: 13, fontWeight: '900', color: premium.ink },
  filterCardTitleDark: { color: '#F8FAFC' },
  filterCardMeta: { fontSize: 11.5, color: premium.muted, marginTop: 4 },
  filterCardMetaDark: { color: '#94A3B8' },

  tabList: { gap: 10, paddingVertical: 2 },
  categoryTab: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 22,
    backgroundColor: premium.surface, borderWidth: 1, borderColor: premium.line,
    ...premiumShadow('sm'),
  },
  categoryTabDark: { backgroundColor: '#111827', borderColor: '#243043' },
  tabIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryText: { fontSize: 13, fontWeight: '800', color: premium.ink },
  categoryTextDark: { color: '#F8FAFC' },

  catBanner: {
    borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  catBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, minWidth: 0, marginRight: 10 },
  bannerIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  catBannerTitle: { fontSize: 16, fontWeight: '900', color: '#fff' },
  catBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  catScanBtn: {
    backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, alignItems: 'center', gap: 4,
    flexShrink: 0,
  },
  catScanText: { color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center' },
  catActionPlaceholder: { width: 64, flexShrink: 0 },

  searchResultBanner: {
    backgroundColor: premium.surface, borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: premium.line, alignItems: 'center',
    ...premiumShadow('sm'),
  },
  searchResultBannerDark: { backgroundColor: '#111827', borderColor: '#243043' },
  searchResultText: { fontSize: 15, fontWeight: '900', color: premium.ink },
  searchResultTextDark: { color: '#F8FAFC' },
  searchResultSub: { fontSize: 12, color: premium.muted, marginTop: 4 },
  searchResultSubDark: { color: '#94A3B8' },

  row: { flexDirection: 'row', gap: 12 },

  cardGlow: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    height: 10,
    borderRadius: 10,
    zIndex: 0,
  },

  card: {
    backgroundColor: premium.surface, borderRadius: 8, overflow: 'hidden',
    borderWidth: 1, borderColor: premium.line,
    ...premiumShadow('sm'),
  },
  cardDark: { backgroundColor: '#111827', borderColor: '#243043' },

  productDivider: { height: 1, width: '100%', backgroundColor: premium.line },

  imgZone: {
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: premium.line,
  },
  badge: {
    position: 'absolute', top: 10, left: 10, zIndex: 3,
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  ptsBadge: {
    position: 'absolute', top: 10, right: 10, zIndex: 3,
    backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 999,
    borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3,
  },
  ptsBadgeText: { fontSize: 10.5, fontWeight: '800' },
  cardDiscountBadge: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    zIndex: 3,
    backgroundColor: premium.success,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cardDiscountText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '900' },

  infoZone: {
    flex: 1,
    padding: 10,
    paddingTop: 10,
    paddingBottom: 12,
    justifyContent: 'space-between',
    backgroundColor: premium.surface,
  },
  infoZoneDark: { backgroundColor: '#111827' },
  infoSpacer: { height: 8 },

  productCategoryTag: {
    color: premium.navy,
    fontSize: 9.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  productCategoryTagDark: { color: '#FCA5A5' },
  productName: {
    flex: 1, fontSize: 12.5, fontWeight: '800', color: premium.ink, lineHeight: 16,
  },
  productNameDark: { color: '#F8FAFC' },
  productPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  productCardPrice: { color: premium.ink, fontSize: 14, fontWeight: '900', flexShrink: 0 },
  productCardPriceDark: { color: '#F8FAFC' },
  productMrp: { color: '#98A2B3', fontSize: 10.5, fontWeight: '700', textDecorationLine: 'line-through' },
  productOfferText: { color: premium.success, fontSize: 10.5, fontWeight: '900' },
  productTaxText: { color: premium.muted, fontSize: 9.5, fontWeight: '600', marginTop: 3 },
  productSub: { fontSize: 10.5, color: premium.muted, marginTop: 6, lineHeight: 14 },
  productSubDark: { color: '#CBD5E1' },

  cardActionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  scanBtn: {
    flex: 1,
    minHeight: 34,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 6,
  },
  scanBtnText: { fontSize: 11.5, fontWeight: '900', flexShrink: 1, textAlign: 'center' },
  quickCartBtn: {
    width: 34,
    height: 34,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...premiumShadow('sm'),
  },

  suggestionPanel: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    gap: 8,
  },
  suggestionTitle: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  suggestionImage: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#F8FAFC' },
  suggestionCopy: { flex: 1, minWidth: 0 },
  suggestionName: { fontSize: 13, fontWeight: '800' },
  suggestionMeta: { fontSize: 11, color: '#9898A8', marginTop: 2 },
  suggestionPrice: { fontSize: 12.5, fontWeight: '900' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, fontWeight: '700', color: premium.muted },
  emptyTextDark: { color: '#94A3B8' },

  detailScreen: { flex: 1 },
  detailContent: { padding: 14, paddingBottom: 136 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  detailBackBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBackText: { fontSize: 34, lineHeight: 36, fontWeight: '500' },
  detailHeaderTitle: { fontSize: 18, fontWeight: '900' },
  detailHeaderSub: { fontSize: 12.5, marginTop: 2, fontWeight: '600' },
  detailImagePanel: {
    height: 350,
    borderRadius: 0,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginHorizontal: -14,
    marginBottom: 0,
  },
  detailImage: { width: '88%', height: '88%' },
  detailBadge: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 2,
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  detailDiscount: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 2,
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  detailInfoCard: { borderRadius: 0, borderWidth: 0, paddingHorizontal: 4, paddingTop: 18, paddingBottom: 18 },
  detailTitleRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  detailNamePriceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  detailProductName: { flex: 1, fontSize: 21, fontWeight: '900', lineHeight: 28 },
  detailInlinePrice: { fontSize: 20, fontWeight: '900', marginTop: 2, flexShrink: 0 },
  detailCategory: { fontSize: 12.5, fontWeight: '800', marginTop: 6, textTransform: 'uppercase' },
  detailPointsPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  detailPointsText: { fontSize: 12, fontWeight: '900' },
  detailPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  detailPrice: { fontSize: 26, fontWeight: '900' },
  detailMrp: { fontSize: 14, fontWeight: '700', textDecorationLine: 'line-through' },
  detailStock: { fontSize: 12.5, fontWeight: '900' },
  detailTrustRow: { flexDirection: 'row', gap: 10, marginTop: 14, flexWrap: 'wrap' },
  detailTrustChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  detailTrustIcon: { color: '#16A34A', fontSize: 12, fontWeight: '900' },
  detailTrustText: { fontSize: 12, fontWeight: '900' },
  detailOfferPanel: { borderWidth: 1, borderRadius: 10, padding: 13, marginTop: 14, gap: 6 },
  detailOfferTitle: { fontSize: 14, fontWeight: '900', marginBottom: 2 },
  detailOfferLine: { fontSize: 12.5, lineHeight: 18, fontWeight: '600' },
  detailMetaGrid: { flexDirection: 'row', gap: 10, marginTop: 16 },
  detailMetaBox: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 12 },
  detailMetaLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', marginBottom: 5 },
  detailMetaValue: { fontSize: 13, fontWeight: '800' },
  detailSectionTitle: { fontSize: 15, fontWeight: '900', marginTop: 18, marginBottom: 8 },
  detailDescription: { fontSize: 14, lineHeight: 21, fontWeight: '500' },
  relatedPanel: { borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 14, ...premiumShadow('sm') },
  relatedTitle: { fontSize: 17, fontWeight: '900' },
  relatedSub: { fontSize: 12, fontWeight: '700', marginTop: 3, marginBottom: 12 },
  relatedList: { gap: 12, paddingRight: 12 },
  relatedCard: { width: 132, borderWidth: 1, borderRadius: 10, padding: 10 },
  relatedImage: { width: '100%', height: 94, marginBottom: 8 },
  relatedName: { fontSize: 12, lineHeight: 16, fontWeight: '900', minHeight: 32 },
  relatedPrice: { marginTop: 4, fontSize: 12, fontWeight: '900' },
  relatedPoints: { marginTop: 6, fontSize: 11, fontWeight: '900' },
  detailFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    paddingBottom: 20,
    borderTopWidth: 1,
    ...premiumShadow('lg'),
  },
  detailQtyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1,
  },
  detailQtyLabel: { fontSize: 14, fontWeight: '700' },
  detailQtyPicker: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 8, overflow: 'hidden',
  },
  detailQtyBtn: {
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  detailQtyBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', lineHeight: 20 },
  detailQtyValue: {
    fontSize: 16, fontWeight: '800', minWidth: 40, textAlign: 'center',
  },
  detailQtyTotal: { fontSize: 16, fontWeight: '900' },
  detailFooterButtons: { flexDirection: 'row', gap: 10 },
  detailSecondaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailSecondaryText: { fontSize: 14, fontWeight: '900' },
  detailPrimaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },

  bottomBanner: {
    backgroundColor: '#2D3561', borderRadius: 20, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8,
  },
  bottomBannerDark: { backgroundColor: '#172554' },
  bottomBannerTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  bottomBannerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 3, lineHeight: 16 },
});
