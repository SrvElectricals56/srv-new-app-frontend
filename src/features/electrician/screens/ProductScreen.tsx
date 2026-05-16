import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Image,
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
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { Screen } from '@/shared/types/navigation';
import type { Product as ApiProduct, ProductCategory as ApiProductCategory } from '@/shared/api';

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  primary: '#E8453C',
  bg: '#F2F3F7',
  surface: '#FFFFFF',
  border: '#EEEEF3',
  textDark: '#1C1E2E',
  textMuted: '#9898A8',
};

// ── Category colour map (keyed by normalised category id) ────────────────────
const CAT_COLORS: Record<string, { gradient: [string, string, string]; scanBg: string; scanText: string; cardGradient: [string, string, string]; iconBg: string }> = {
  fanbox:       { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  concealedbox: { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  modular:      { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  mcb:          { gradient: ['#4A6FA5','#6B8FC7','#B8CCE8'], scanBg: '#EEF4FF', scanText: '#2D5FA0', cardGradient: ['#F8FAFF','#EBF2FF','#D8E8FF'], iconBg: '#DDE9F8' },
  busbar:       { gradient: ['#8B6914','#C49A2A','#E8CC7A'], scanBg: '#FDF8EC', scanText: '#7A5A10', cardGradient: ['#FFFDF5','#FDF5DC','#F8EAB8'], iconBg: '#F5E8C0' },
  exhaust:      { gradient: ['#2E7D5E','#4CAF85','#90D4B8'], scanBg: '#EDF8F3', scanText: '#1E6B4A', cardGradient: ['#F5FDF9','#E2F5EC','#C8EDD9'], iconBg: '#C8EDD9' },
  axialfan:     { gradient: ['#2E7D5E','#4CAF85','#90D4B8'], scanBg: '#EDF8F3', scanText: '#1E6B4A', cardGradient: ['#F5FDF9','#E2F5EC','#C8EDD9'], iconBg: '#C8EDD9' },
  led:          { gradient: ['#8B6914','#C49A2A','#E8CC7A'], scanBg: '#FDF8EC', scanText: '#7A5A10', cardGradient: ['#FFFDF5','#FDF5DC','#F8EAB8'], iconBg: '#F5E8C0' },
  changeover:   { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  mainswitch:   { gradient: ['#C0392B','#E74C3C','#F1948A'], scanBg: '#FFF0EF', scanText: '#A93226', cardGradient: ['#FFF8F8','#FFE8E6','#FFD5D2'], iconBg: '#FFD5D2' },
  louver:       { gradient: ['#2E7D5E','#4CAF85','#90D4B8'], scanBg: '#EDF8F3', scanText: '#1E6B4A', cardGradient: ['#F5FDF9','#E2F5EC','#C8EDD9'], iconBg: '#C8EDD9' },
  conduit:      { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  pvcpipe:      { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
  stabilizer:   { gradient: ['#4A6FA5','#6B8FC7','#B8CCE8'], scanBg: '#EEF4FF', scanText: '#2D5FA0', cardGradient: ['#F8FAFF','#EBF2FF','#D8E8FF'], iconBg: '#DDE9F8' },
  junction:     { gradient: ['#6F879F','#93A8BE','#D9E1EA'], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'], iconBg: '#E5ECF4' },
};
const DEFAULT_CAT_COLOR = { gradient: ['#6F879F','#93A8BE','#D9E1EA'] as [string,string,string], scanBg: '#F5F8FB', scanText: '#4A637B', cardGradient: ['#FAFBFD','#E9EEF5','#D5DEE9'] as [string,string,string], iconBg: '#E5ECF4' };

const DEFAULT_IMAGES: Record<string, string> = {
  fanbox:       'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=320',
  concealedbox: 'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=320',
  modular:      'https://srvelectricals.com/cdn/shop/files/3x3_679e5d30-ecf2-446e-9452-354bbf4c4a26.png?v=1757426377&width=320',
  mcb:          'https://srvelectricals.com/cdn/shop/files/MCB_Box_4_Way_GI.png?v=1757426418&width=320',
  busbar:       'https://srvelectricals.com/cdn/shop/files/Bus_Bar_100A_Super.png?v=1757426672&width=320',
  exhaust:      'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320',
  axialfan:     'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320',
  led:          'https://srvelectricals.com/cdn/shop/files/FloodLightSleek.png?v=1757426471&width=320',
  changeover:   'https://srvelectricals.com/cdn/shop/files/ACO_100A_FP.png?v=1757426480&width=320',
  mainswitch:   'https://srvelectricals.com/cdn/shop/files/CO_32A_DP_PRM.png?v=1757426515&width=320',
  louver:       'https://srvelectricals.com/cdn/shop/files/Louver_6_inch.png?v=1757426390&width=320',
  conduit:      'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCPipe_d645973b-bd5e-41de-8eb0-53331cce1c19.png?v=1772786167',
  stabilizer:   'https://srvelectricals.com/cdn/shop/files/VoltageStabilizer.png?v=1757426471&width=320',
  junction:     'https://srvelectricals.com/cdn/shop/files/Junction_Box.png?v=1757426390&width=320',
};

const CATEGORY_LABELS: Record<string, string> = {
  fanbox: 'Fan Box', concealedbox: 'Concealed Box', modular: 'Modular Box', modularbox: 'Modular Box',
  mcb: 'MCB DB', busbar: 'Bus Bar', exhaust: 'Exhaust Fan', axialfan: 'Axial Fan',
  led: 'LED Lights', changeover: 'Changeover', mainswitch: 'Main Switch',
  louver: 'Louvers', conduit: 'Conduit Pipe', pvcpipe: 'Conduit Pipe',
  stabilizer: 'Voltage Stabilizer', junction: 'Junction Box',
};

const CATEGORY_ALIASES: Record<string, string> = {
  modularbox: 'modular', pvcpipe: 'conduit', ledflood: 'led', boxes: 'mcb', fans: 'exhaust',
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
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    </View>
  );
});

// ── UiProduct type ────────────────────────────────────────────────────────────
type UiProduct = {
  id: string;
  name: string;
  sub: string;
  category: string;
  imageUrl: string;
  points: number;
  badge: string | null;
};

function mapProduct(p: ApiProduct): UiProduct {
  const cat = normCat(p.category);
  return {
    id: p.id,
    name: p.name,
    sub: p.sub || p.description || '',
    category: cat,
    imageUrl: p.imageUrl || p.image || catImg(cat),
    points: p.points ?? 0,
    badge: p.badge?.trim() || null,
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
    if (!merged.has(id)) merged.set(id, { id, label: c.label?.trim() || catLabel(id), count, imageUrl: c.imageUrl || catImg(id) });
  });
  countMap.forEach((count, id) => {
    if (!merged.has(id)) merged.set(id, { id, label: catLabel(id), count, imageUrl: catImg(id) });
  });
  return Array.from(merged.values()).filter(c => c.count > 0).sort((a, b) => b.count - a.count);
}

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = memo(function ProductCard({
  product, cardW, onScan, darkMode, actionLabel,
}: { product: UiProduct; cardW: number; onScan: () => void; darkMode: boolean; actionLabel: string }) {
  const cc = catColor(product.category);

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
  const imgSize   = cardW + 35;
  const imgHeight = cardW + 60;

  return (
    <Pressable onPressIn={onIn} onPressOut={onOut}>
      <Animated.View style={{ opacity: entryOp, transform: [{ translateY: entryY }] }}>

        {/* Coloured glow shadow on press */}
        <Animated.View style={[
          styles.cardGlow,
          { width: cardW, backgroundColor: cc.scanText + '33', opacity: glowOp },
        ]} />

        <Animated.View style={[
          styles.card,
          darkMode ? styles.cardDark : null,
          {
            width: cardW,
            height: cardW * 2.1,
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
            colors={['#FFFFFF', '#FFFFFF', '#FFFFFF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.imgZone, { height: imgHeight }]}
          >
            {product.badge != null && (
              <View style={[styles.badge, { backgroundColor: cc.scanText }]}>
                <Text style={styles.badgeText}>{product.badge}</Text>
              </View>
            )}
            <View style={[styles.ptsBadge, { borderColor: cc.scanText + '44' }]}>
              <Text style={[styles.ptsBadgeText, { color: cc.scanText }]}>+{product.points} pts</Text>
            </View>
            <AnimatedProductImage uri={product.imageUrl} size={imgSize} />
          </LinearGradient>

          {/* Thin accent line */}
          <View style={[styles.accentLine, { backgroundColor: cc.scanText }]} />

          {/* Info zone */}
          <View style={[styles.infoZone, darkMode ? styles.infoZoneDark : null]}>
            <View>
              <Text style={[styles.productName, darkMode ? styles.productNameDark : null]} numberOfLines={2}>{product.name}</Text>
              <Text style={[styles.productSub,  darkMode ? styles.productSubDark  : null]} numberOfLines={2}>{product.sub}</Text>
            </View>
            <TouchableOpacity onPress={onScan} style={[styles.scanBtn, { backgroundColor: cc.scanBg }]} activeOpacity={0.8}>
              <ScanIcon size={15} color={cc.scanText} />
              <Text style={[styles.scanBtnText, { color: cc.scanText }]}>{actionLabel}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
});

type ProductRow = { key: string; left: UiProduct; right: UiProduct | null };

// ── Main ProductScreen ────────────────────────────────────────────────────────
export function ProductScreen({
  onNavigate,
  initialCategory = 'all',
  showBottomBanner = true,
  role = 'electrician',
}: {
  onNavigate: (screen: Screen) => void;
  initialCategory?: string;
  showBottomBanner?: boolean;
  role?: 'electrician' | 'dealer' | 'customer' | 'counterboy';
}) {
  const { darkMode, tx } = usePreferenceContext();
  const { products: apiProducts, categories: apiCategories, catalogLoading, refreshAll } = useAppData();
  const { width } = useWindowDimensions();

  const [category, setCategory] = useState(normCat(initialCategory) || 'all');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const PADDING = 14;
  const GAP = 12;
  const cardW = Math.floor((width - PADDING * 2 - GAP) / 2);

  // Map API products to UI products
  const products = useMemo(() => apiProducts.map(mapProduct), [apiProducts]);

  // Build categories from real data
  const uiCategories = useMemo(() => buildUiCategories(products, apiCategories), [products, apiCategories]);

  // All categories list including "All"
  const allCategoryItem: UiCategory = { id: 'all', label: tx('All Products'), count: products.length, imageUrl: DEFAULT_IMAGES.fanbox };
  const categoryItems = useMemo(() => [allCategoryItem, ...uiCategories], [uiCategories, products.length, tx]);

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

  const rows = useMemo<ProductRow[]>(() => {
    const r: ProductRow[] = [];
    for (let i = 0; i < filtered.length; i += 2) {
      r.push({ key: filtered[i].id, left: filtered[i], right: filtered[i + 1] ?? null });
    }
    return r;
  }, [filtered]);

  const currentCat = categoryItems.find(c => c.id === category) ?? allCategoryItem;
  const cc = category === 'all' ? DEFAULT_CAT_COLOR : catColor(category);

  const isDealer = role === 'dealer';
  const isCustomer = role === 'customer';
  const isCounterboy = role === 'counterboy';
  const productActionLabel = (isDealer || isCustomer || isCounterboy) ? tx('Buy Now') : tx('Scan to Earn');
  const bannerActionLabel = (isDealer || isCustomer || isCounterboy) ? tx('Buy Now') : tx('Scan & Earn').replace(' ', '\n');
  const handleScan = useCallback(() => onNavigate((isDealer || isCustomer || isCounterboy) ? 'rewards' : 'scan'), [onNavigate, isDealer, isCustomer, isCounterboy]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  }, [refreshAll]);

  // ── Render row ──────────────────────────────────────────────────────────────
  const renderRow = useCallback(({ item }: { item: ProductRow }) => (
    <View style={styles.row}>
      <ProductCard product={item.left} cardW={cardW} onScan={handleScan} darkMode={darkMode} actionLabel={productActionLabel} />
      {item.right
        ? <ProductCard product={item.right} cardW={cardW} onScan={handleScan} darkMode={darkMode} actionLabel={productActionLabel} />
        : <View style={{ width: cardW }} />}
    </View>
  ), [cardW, handleScan, darkMode, productActionLabel]);

  const keyExtractor = useCallback((item: ProductRow) => item.key, []);

  // ── List header (search + filter + tabs + banner) ───────────────────────────
  const ListHeader = useMemo(() => (
    <View style={{ gap: 14, paddingBottom: 4 }}>
      {/* Title */}
      <Text style={[styles.pageTitle, darkMode ? styles.pageTitleDark : null, isCounterboy && { color: '#5C3D2E' }, isCounterboy && darkMode && { color: '#F5EDE4' }]}>{tx('All Products')}</Text>

      {/* Search bar */}
      <View style={[styles.searchWrap, darkMode ? styles.searchWrapDark : null, isCounterboy && { backgroundColor: '#F9F4ED', borderColor: '#E0D0C0' }, isCounterboy && darkMode && { backgroundColor: '#1A0F0A', borderColor: '#2D1C14' }]}>
        <Text style={{ fontSize: 15, color: C.textMuted }}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={tx('Search all products...')}
          placeholderTextColor={C.textMuted}
          style={[styles.searchInput, darkMode ? styles.searchInputDark : null, isCounterboy && { color: '#2D1A10' }, isCounterboy && darkMode && { color: '#F5EDE4' }]}
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
            showFilters && { backgroundColor: 
              isCustomer ? '#6A2F12' :
              isDealer   ? '#173E80' :
              isCounterboy ? '#8B3C2A' :
              '#173E80'
            }
          ]}
          activeOpacity={0.82}
        >
          <FilterIcon color={showFilters ? '#FFFFFF' : C.textDark} />
        </TouchableOpacity>
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View style={[styles.filterPanel, darkMode ? styles.filterPanelDark : null, isCounterboy && { backgroundColor: '#F9F4ED', borderColor: '#E0D0C0' }, isCounterboy && darkMode && { backgroundColor: '#1A0F0A', borderColor: '#2D1C14' }]}>
          <View style={styles.filterPanelHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.filterPanelTitle, darkMode ? styles.filterPanelTitleDark : null, isCounterboy && { color: '#5C3D2E' }, isCounterboy && darkMode && { color: '#F5EDE4' }]}>{tx('Filter products')}</Text>
              <Text style={[styles.filterPanelSub, darkMode ? styles.filterPanelSubDark : null]}>{tx('Choose a category to see matching products.')}</Text>
            </View>
            <TouchableOpacity onPress={() => setShowFilters(false)} activeOpacity={0.8}>
              <Text style={[styles.filterClose, isCounterboy && { color: '#8B3C2A' }]}>{tx('Close')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.filterGrid}>
            {uiCategories.map(cat => {
              const active = !isSearching && cat.id === category;
              const cc2 = catColor(cat.id);
              
              // Customer theme colors
              const customerBg = active ? '#6A2F12' : '#FBF1E7';
              const customerBorder = active ? '#6A2F12' : '#E5D4C1';
              const customerIconBg = active ? 'rgba(255,255,255,0.2)' : '#F5E8DC';
              const customerIconColor = active ? '#fff' : '#6A2F12';
              const customerTextColor = active ? '#fff' : '#6A2F12';
              const customerMetaColor = active ? 'rgba(255,255,255,0.86)' : '#8D4A1E';
              
              // Counterboy theme colors
              const counterboyBg = active ? '#8B3C2A' : '#F9F4ED';
              const counterboyBorder = active ? '#8B3C2A' : '#E0D0C0';
              const counterboyIconBg = active ? 'rgba(255,255,255,0.2)' : '#EDE0D4';
              const counterboyIconColor = active ? '#fff' : '#8B3C2A';
              const counterboyTextColor = active ? '#fff' : '#5C3D2E';
              const counterboyMetaColor = active ? 'rgba(255,255,255,0.86)' : '#8A7A6E';
              
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => { setCategory(cat.id); setSearch(''); setShowFilters(false); }}
                  style={[
                    styles.filterCard, 
                    darkMode ? styles.filterCardDark : null, 
                    isCustomer
                      ? { backgroundColor: customerBg, borderColor: customerBorder }
                      : isCounterboy
                        ? { backgroundColor: counterboyBg, borderColor: counterboyBorder }
                        : active && { backgroundColor: cc2.scanText, borderColor: cc2.scanText }
                  ]}
                  activeOpacity={0.86}
                >
                  <View style={[
                    styles.filterCardIcon, 
                    { backgroundColor: isCustomer ? customerIconBg : isCounterboy ? counterboyIconBg : (active ? 'rgba(255,255,255,0.2)' : cc2.iconBg) }
                  ]}>
                    <CatIcon 
                      id={cat.id} 
                      size={22} 
                      color={isCustomer ? customerIconColor : isCounterboy ? counterboyIconColor : (active ? '#fff' : cc2.scanText)} 
                    />
                  </View>
                  <Text style={[
                    styles.filterCardTitle, 
                    darkMode && !active ? styles.filterCardTitleDark : null, 
                    isCustomer 
                      ? { color: customerTextColor }
                      : isCounterboy
                        ? { color: counterboyTextColor }
                        : active && { color: '#fff' }
                  ]} numberOfLines={1}>{cat.label}</Text>
                  <Text style={[
                    styles.filterCardMeta, 
                    darkMode && !active ? styles.filterCardMetaDark : null, 
                    isCustomer
                      ? { color: customerMetaColor }
                      : isCounterboy
                        ? { color: counterboyMetaColor }
                        : active && { color: 'rgba(255,255,255,0.86)' }
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
            const cc2 = cat.id === 'all' ? DEFAULT_CAT_COLOR : catColor(cat.id);
            
            // Customer theme colors
            const customerBg = active ? '#6A2F12' : '#FFFFFF';
            const customerBorder = active ? '#6A2F12' : '#EEEEF3';
            const customerIconBg = active ? 'rgba(255,255,255,0.2)' : '#F5E8DC';
            const customerIconColor = active ? '#fff' : '#6A2F12';
            const customerTextColor = active ? '#fff' : '#1C1E2E';
            
            // Counterboy theme colors
            const counterboyBg = active ? '#8B3C2A' : '#FFFFFF';
            const counterboyBorder = active ? '#8B3C2A' : '#EEEEF3';
            const counterboyIconBg = active ? 'rgba(255,255,255,0.2)' : '#EDE0D4';
            const counterboyIconColor = active ? '#fff' : '#8B3C2A';
            const counterboyTextColor = active ? '#fff' : '#1C1E2E';
            
            return (
              <TouchableOpacity
                onPress={() => { setCategory(cat.id); setSearch(''); }}
                style={[
                  styles.categoryTab, 
                  darkMode ? styles.categoryTabDark : null, 
                  isCustomer 
                    ? { backgroundColor: customerBg, borderColor: customerBorder }
                    : isCounterboy
                      ? { backgroundColor: counterboyBg, borderColor: counterboyBorder }
                      : active && { backgroundColor: cc2.scanText, borderColor: cc2.scanText }
                ]}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.tabIconWrap, 
                  { backgroundColor: isCustomer ? customerIconBg : isCounterboy ? counterboyIconBg : (active ? 'rgba(255,255,255,0.2)' : cc2.iconBg) }
                ]}>
                  <CatIcon 
                    id={cat.id} 
                    size={18} 
                    color={isCustomer ? customerIconColor : isCounterboy ? counterboyIconColor : (active ? '#fff' : cc2.scanText)} 
                  />
                </View>
                <Text style={[
                  styles.categoryText, 
                  darkMode && !active ? styles.categoryTextDark : null, 
                  isCustomer 
                    ? { color: customerTextColor }
                    : isCounterboy
                      ? { color: counterboyTextColor }
                      : active && { color: '#fff' }
                ]}>{cat.label}</Text>
              </TouchableOpacity>
          );
        }}
      />

      {/* Banner or search result info */}
      {isSearching ? (
        <View style={[styles.searchResultBanner, darkMode ? styles.searchResultBannerDark : null, isCounterboy && { backgroundColor: '#F9F4ED', borderColor: '#E0D0C0' }, isCounterboy && darkMode && { backgroundColor: '#1A0F0A', borderColor: '#2D1C14' }]}>
          <Text style={[styles.searchResultText, darkMode ? styles.searchResultTextDark : null, isCounterboy && { color: '#5C3D2E' }, isCounterboy && darkMode && { color: '#F5EDE4' }]}>
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
          style={[styles.catBanner, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEEF3' }]}
        >
          <View style={styles.catBannerLeft}>
            <View style={[styles.bannerIconWrap, { backgroundColor: isCustomer ? '#F5E8DC' : isCounterboy ? '#F0DFD0' : cc.iconBg }]}>
              <CatIcon id={category} size={32} color={isCustomer ? '#6A2F12' : isCounterboy ? '#8B3C2A' : cc.scanText} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.catBannerTitle, { color: isCustomer ? '#6A2F12' : isCounterboy ? '#5C3D2E' : '#1C1E2E' }]} numberOfLines={1} adjustsFontSizeToFit>{currentCat.label}</Text>
              <Text style={[styles.catBannerSub, { color: isCustomer ? '#8D4A1E' : isCounterboy ? '#8A7A6E' : '#9898A8' }]} numberOfLines={1}>
                {catalogLoading && products.length === 0 ? tx('Loading...') : `${filtered.length} ${tx('products available')}`}
              </Text>
            </View>
          </View>
          {!isDealer && !isCustomer && !isCounterboy ? (
            <TouchableOpacity onPress={() => onNavigate('scan')} style={[styles.catScanBtn, { backgroundColor: cc.scanBg }]}>
              <ScanIcon size={20} color={cc.scanText} />
              <Text style={[styles.catScanText, { color: cc.scanText }]}>{bannerActionLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  ), [darkMode, tx, search, showFilters, uiCategories, categoryItems, category, isSearching, filtered.length, cc, currentCat, catalogLoading, products.length, isDealer, isCounterboy, onNavigate, bannerActionLabel]);

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
        {catalogLoading ? tx('Loading products...') : tx('No products found')}
      </Text>
    </View>
  ), [catalogLoading, darkMode, tx]);

  return (
    <FlatList
      style={[styles.screen, darkMode ? styles.screenDark : null, isCounterboy && { backgroundColor: '#F9F4ED' }, isCounterboy && darkMode && { backgroundColor: '#120A07' }]}
      contentContainerStyle={styles.content}
      data={rows}
      keyExtractor={keyExtractor}
      renderItem={renderRow}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={ListFooter}
      ListEmptyComponent={ListEmpty}
      showsVerticalScrollIndicator={false}
      initialNumToRender={4}
      maxToRenderPerBatch={6}
      windowSize={7}
      removeClippedSubviews
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={isCounterboy ? ['#8B3C2A'] : ['#1A3C8F']}
          tintColor={isCounterboy ? '#8B3C2A' : '#1A3C8F'}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F2F3F7' },
  screenDark: { backgroundColor: '#08111F' },
  content: { padding: 14, gap: 14, paddingBottom: 120 },

  pageTitle: { fontSize: 22, fontWeight: '800', color: '#1C1E2E', textAlign: 'center' },
  pageTitleDark: { color: '#F8FAFC' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 18, borderWidth: 1,
    borderColor: '#EEEEF3', paddingHorizontal: 14, height: 50,
  },
  searchWrapDark: { backgroundColor: '#111827', borderColor: '#243043' },
  searchInput: { flex: 1, fontSize: 15, color: '#1C1E2E' },
  searchInputDark: { color: '#F8FAFC' },
  filterBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#F4F6FA',
  },
  filterBtnActive: { backgroundColor: '#E8453C' },

  filterPanel: {
    backgroundColor: '#FFFFFF', borderRadius: 22, padding: 14,
    borderWidth: 1, borderColor: '#EEEEF3',
  },
  filterPanelDark: { backgroundColor: '#111827', borderColor: '#243043' },
  filterPanelHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 10, marginBottom: 12,
  },
  filterPanelTitle: { fontSize: 16, fontWeight: '800', color: '#1C1E2E' },
  filterPanelTitleDark: { color: '#F8FAFC' },
  filterPanelSub: { fontSize: 12, color: '#9898A8', marginTop: 3, lineHeight: 17 },
  filterPanelSubDark: { color: '#94A3B8' },
  filterClose: { fontSize: 12.5, fontWeight: '800', color: '#E8453C' },
  filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterCard: {
    width: '48%', backgroundColor: '#FAFBFD', borderWidth: 1,
    borderColor: '#EEEEF3', borderRadius: 18, padding: 12,
  },
  filterCardDark: { backgroundColor: '#182133', borderColor: '#243043' },
  filterCardIcon: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  filterCardTitle: { fontSize: 13, fontWeight: '800', color: '#1C1E2E' },
  filterCardTitleDark: { color: '#F8FAFC' },
  filterCardMeta: { fontSize: 11.5, color: '#9898A8', marginTop: 4 },
  filterCardMetaDark: { color: '#94A3B8' },

  tabList: { gap: 10, paddingVertical: 2 },
  categoryTab: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 9, borderRadius: 22,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EEEEF3',
  },
  categoryTabDark: { backgroundColor: '#111827', borderColor: '#243043' },
  tabIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  categoryText: { fontSize: 13, fontWeight: '700', color: '#1C1E2E' },
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

  searchResultBanner: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#EEEEF3', alignItems: 'center',
  },
  searchResultBannerDark: { backgroundColor: '#111827', borderColor: '#243043' },
  searchResultText: { fontSize: 15, fontWeight: '700', color: '#1C1E2E' },
  searchResultTextDark: { color: '#F8FAFC' },
  searchResultSub: { fontSize: 12, color: '#9898A8', marginTop: 4 },
  searchResultSubDark: { color: '#94A3B8' },

  row: { flexDirection: 'row', gap: 12 },

  cardGlow: {
    position: 'absolute',
    bottom: -8,
    alignSelf: 'center',
    height: 20,
    borderRadius: 20,
    zIndex: 0,
  },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#EEEEF3',
    shadowColor: '#1A3C8F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  cardDark: { backgroundColor: '#111827', borderColor: '#243043' },

  accentLine: { height: 3, width: '100%' },

  imgZone: {
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', overflow: 'hidden',
  },
  badge: {
    position: 'absolute', top: 10, left: 10, zIndex: 3,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  ptsBadge: {
    position: 'absolute', top: 10, right: 10, zIndex: 3,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 10,
    borderWidth: 1, paddingHorizontal: 7, paddingVertical: 3,
  },
  ptsBadgeText: { fontSize: 11, fontWeight: '800' },

  infoZone: {
    flex: 1,
    padding: 11,
    paddingTop: 10,
    paddingBottom: 12,
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
  },
  infoZoneDark: { backgroundColor: '#111827' },
  infoSpacer: { height: 8 },

  productName: {
    fontSize: 12, fontWeight: '800', color: '#1C1E2E',
    textTransform: 'uppercase', letterSpacing: 0.2,
  },
  productNameDark: { color: '#F8FAFC' },
  productSub: { fontSize: 10.5, color: '#9898A8', marginTop: 3, lineHeight: 14 },
  productSubDark: { color: '#CBD5E1' },

  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, borderRadius: 11, paddingVertical: 8,
  },
  scanBtnText: { fontSize: 11.5, fontWeight: '700' },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#9898A8' },
  emptyTextDark: { color: '#94A3B8' },

  bottomBanner: {
    backgroundColor: '#2D3561', borderRadius: 20, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8,
  },
  bottomBannerDark: { backgroundColor: '#172554' },
  bottomBannerTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  bottomBannerSub: { fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 3, lineHeight: 16 },
});
