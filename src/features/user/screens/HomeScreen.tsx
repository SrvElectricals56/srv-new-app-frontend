import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAuth } from '@/shared/context/AuthContext';
import type { Screen } from '@/shared/types/navigation';
import { formatCountText, usePreferenceContext } from '@/shared/preferences';
import ProfileFlipCard from '@/shared/components/ProfileFlipCard';
import { createShadow } from '@/shared/theme/shadows';
import { TestimonialShowcase, type TestimonialItem } from '@/shared/components/TestimonialShowcase';
import { WebsitePromoSection } from '@/shared/components/WebsitePromoSection';
import { BannerCarousel } from '@/shared/components/BannerCarousel';
import { ElectricianTierIcon, getElectricianTier } from './ElectricianTierScreen';

// ── Category color system (same as ProductScreen) ─────────────────────
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

// ── Category Icon SVGs (same as ProductScreen) ────────────────────────
function CatIcon({ id, size = 24, color = '#173E80' }: { id: string; size?: number; color?: string }) {
  const s = size;
  switch (id) {
    case 'fanbox': return (
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
    case 'changeover': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Rect x="3" y="4" width="26" height="24" rx="3" stroke={color} strokeWidth="2" />
        <Path d="M10 14l6-6 6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M22 18l-6 6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M16 8v16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
      </Svg>
    );
    case 'led': case 'ledflood': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Path d="M16 4a8 8 0 018 8c0 3-1.5 5.5-4 7v3H12v-3c-2.5-1.5-4-4-4-7a8 8 0 018-8z" stroke={color} strokeWidth="2" />
        <Path d="M12 22h8M13 25h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M16 28v1" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <Path d="M8 12H6M24 12h2M10 6.5L8.5 5M22 6.5l1.5-1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <Circle cx="16" cy="12" r="3" stroke={color} strokeWidth="1.5" />
      </Svg>
    );
    case 'exhaust': case 'axialfan': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Circle cx="16" cy="16" r="12" stroke={color} strokeWidth="2" />
        <Circle cx="16" cy="16" r="3" stroke={color} strokeWidth="1.8" />
        <Path d="M16 13c0-4 3-6 3-6s-1 4-3 6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <Path d="M19 16c4 0 6 3 6 3s-4-1-6-3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <Path d="M16 19c0 4-3 6-3 6s1-4 3-6z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <Path d="M13 16c-4 0-6-3-6-3s4 1 6 3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
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
      </Svg>
    );
    case 'concealedbox': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Rect x="4" y="4" width="24" height="24" rx="3" stroke={color} strokeWidth="2" />
        <Rect x="9" y="9" width="14" height="14" rx="2" stroke={color} strokeWidth="1.8" />
        <Circle cx="16" cy="16" r="2.5" stroke={color} strokeWidth="1.5" />
      </Svg>
    );
    case 'modular': return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Rect x="3" y="3" width="26" height="26" rx="3" stroke={color} strokeWidth="2" />
        <Rect x="7" y="7" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.6" />
        <Rect x="17" y="7" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.6" />
        <Rect x="7" y="17" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.6" />
        <Rect x="17" y="17" width="8" height="8" rx="1.5" stroke={color} strokeWidth="1.6" />
      </Svg>
    );
    default: return (
      <Svg width={s} height={s} viewBox="0 0 32 32" fill="none">
        <Rect x="3" y="3" width="12" height="12" rx="2.5" stroke={color} strokeWidth="2" />
        <Rect x="17" y="3" width="12" height="12" rx="2.5" stroke={color} strokeWidth="2" />
        <Rect x="3" y="17" width="12" height="12" rx="2.5" stroke={color} strokeWidth="2" />
        <Rect x="17" y="17" width="12" height="12" rx="2.5" stroke={color} strokeWidth="2" />
      </Svg>
    );
  }
}

// ── Real CDN images for each category (same as ProductScreen) ────────
const CAT_IMAGES: Record<string, string> = {
  fanbox:        'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=320',
  concealedbox:  'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=320',
  modular:       'https://srvelectricals.com/cdn/shop/files/3x3_679e5d30-ecf2-446e-9452-354bbf4c4a26.png?v=1757426377&width=320',
  mcb:           'https://srvelectricals.com/cdn/shop/files/MCB_Box_4_Way_GI.png?v=1757426418&width=320',
  busbar:        'https://srvelectricals.com/cdn/shop/files/Bus_Bar_100A_Super.png?v=1757426672&width=320',
  exhaust:       'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320',
  led:           'https://srvelectricals.com/cdn/shop/files/FloodLightSleek.png?v=1757426471&width=320',
  changeover:    'https://srvelectricals.com/cdn/shop/files/ACO_100A_FP.png?v=1757426480&width=320',
  mainswitch:    'https://srvelectricals.com/cdn/shop/files/CO_32A_DP_PRM.png?v=1757426515&width=320',
  louver:        'https://srvelectricals.com/cdn/shop/files/Louver_6_inch.png?v=1757426390&width=320',
  axialfan:      'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320',
  ledflood:      'https://srvelectricals.com/cdn/shop/files/FloodLightLense_533x.png?v=1757426472&width=320',
  kitkat:        'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/KK_RGL_b6278cc2-47de-4af4-ab1b-3f39a31a3469.png?v=1757426689',
  connector:     'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/Connector.png?v=1774344618',
  pvcpipe:       'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCPipe_d645973b-bd5e-41de-8eb0-53331cce1c19.png?v=1772786167',
  pvcbend:       'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVCBend_d61ba143-800b-4706-b068-0f30bd6fac45.png?v=1772533125',
  pvcbatten:     'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/PVC_Batten.png?v=1773475766',
  ventilation:   'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/VentilationFan_3594eae1-055d-4a86-b75c-b8cbbfcb22d6.png?v=1763708515',
  doorbell:      'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/Door_Bell_Tring_Trong.png?v=1757426728',
  solarled:      'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/SolarLEDPoleLight50w.png?v=1757426727',
  streetled:     'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/LEDFront.jpg?v=1765629593',
  warmer:        'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/RoomWarmerH3_ae88b047-f837-4807-a7c7-52e2e3107d4f.png?v=1772694850',
  heater:        'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/HeatBlowerM2_04f122c9-0cc4-4df8-a422-cd731205da85.png?v=1772694634',
  autochangeover:'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/ACO_100A_Phase_Selector.png?v=1757426707',
  coversheet:    'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/FanBoxCoverSheet.png?v=1757426708',
};

function getCatImage(id: string, apiImageUrl?: string | null): string {
  return apiImageUrl || CAT_IMAGES[id] || CAT_IMAGES.fanbox;
}

// ── Animated Category Image (float + breathe — same as ProductScreen) ─
function AnimatedCatImage({ uri, size }: { uri: string; size: number }) {
  const floatY = useRef(new Animated.Value(0)).current;
  const imgScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, withWebSafeNativeDriver({ toValue: -7, duration: 1600, easing: Easing.inOut(Easing.sin) })),
        Animated.timing(floatY, withWebSafeNativeDriver({ toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin) })),
      ])
    );
    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(imgScale, withWebSafeNativeDriver({ toValue: 1.06, duration: 2200, easing: Easing.inOut(Easing.ease) })),
        Animated.timing(imgScale, withWebSafeNativeDriver({ toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease) })),
      ])
    );
    floatLoop.start();
    scaleLoop.start();
    return () => { floatLoop.stop(); scaleLoop.stop(); };
  }, [floatY, imgScale]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ translateY: floatY }, { scale: imgScale }] }}>
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}

// ── Home Category Card (same design as ProductScreen filterCard) ───────
function HomeCategoryCard({
  cat,
  index,
  cardW,
  darkMode,
  onPress,
}: {
  cat: { id: string; label: string; imageUrl?: string | null };
  index: number;
  cardW: number;
  darkMode: boolean;
  onPress: () => void;
}) {
  const cc = getCatColor(cat.id, index);
  const pressScale = useRef(new Animated.Value(1)).current;
  const tiltX = useRef(new Animated.Value(0)).current;
  const imgUri = getCatImage(cat.id, cat.imageUrl);

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

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          homeCatStyles.card,
          darkMode ? homeCatStyles.cardDark : null,
          { width: cardW, transform: [{ scale: pressScale }, { perspective: 900 }, { rotateY: rotate }] },
        ]}
      >
        {/* Gradient image zone with floating animated product image */}
        <LinearGradient
          colors={darkMode ? ['#1E293B', '#243B55', '#1E293B'] : cc.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={homeCatStyles.imgZone}
        >
          <AnimatedCatImage uri={imgUri} size={homeCatStyles.imgZone.height - 10} />
        </LinearGradient>
        {/* Label zone */}
        <View style={[homeCatStyles.infoZone, darkMode ? homeCatStyles.infoZoneDark : null]}>
          <Text style={[homeCatStyles.label, darkMode ? homeCatStyles.labelDark : null]} numberOfLines={2}>
            {cat.label}
          </Text>
          <View style={[homeCatStyles.pill, { backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : cc.scanBg }]}>
            <Text style={[homeCatStyles.pillText, { color: darkMode ? '#94A3B8' : cc.scanText }]}>
              View Products
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const homeCatStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6ECF5',
    ...createShadow({ color: '#0F172A', offsetY: 6, blur: 16, opacity: 0.08, elevation: 4 }),
  },
  cardDark: { backgroundColor: '#111827', borderColor: '#1E293B' },
  imgZone: { height: 150, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  infoZone: { padding: 10, backgroundColor: '#FFFFFF' },
  infoZoneDark: { backgroundColor: '#111827' },
  label: { fontSize: 12, fontWeight: '800', color: '#152238', lineHeight: 16, marginBottom: 6 },
  labelDark: { color: '#F1F5F9' },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: '700' },
});

const logoImage = require('../../../../assets/banners/srv-logo.jpeg');

const guestHeroSlides = [
  { image: require('../../../../assets/banners/light.jpg.jpeg'),    resizeMode: 'cover' as const, backgroundColor: '#0F172A' },
  { image: require('../../../../assets/banners/mcb-box.jpg.jpeg'),  resizeMode: 'cover' as const, backgroundColor: '#0F172A' },
  { image: require('../../../../assets/banners/appliances.jpg.jpeg'),resizeMode: 'cover' as const, backgroundColor: '#0F172A' },
];

type BannerSlide = {
  image: { uri: string };
  resizeMode: 'cover' | 'contain';
  backgroundColor: string;
};

type HomeProduct = {
  id: string;
  name: string;
  description: string;
  img: string;
  category: string;
  price: string;
  points: number;
};
function FeaturedProductImage({ uri, size }: { uri: string; size: number }) {
  const floatY = useRef(new Animated.Value(0)).current;
  const imgScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(
          floatY,
          withWebSafeNativeDriver({
            toValue: -8,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        Animated.timing(
          floatY,
          withWebSafeNativeDriver({
            toValue: 0,
            duration: 1600,
            easing: Easing.inOut(Easing.sin),
          })
        ),
      ])
    );
    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(
          imgScale,
          withWebSafeNativeDriver({
            toValue: 1.05,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        Animated.timing(
          imgScale,
          withWebSafeNativeDriver({
            toValue: 1,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
          })
        ),
      ])
    );
    floatLoop.start();
    scaleLoop.start();
    return () => {
      floatLoop.stop();
      scaleLoop.stop();
    };
  }, [floatY, imgScale]);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ transform: [{ translateY: floatY }, { scale: imgScale }] }}>
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
    </View>
  );
}
function FeaturedProductCard({
  product,
  width,
  onOpenCategory,
  onScan,
}: {
  product: HomeProduct;
  width: number;
  onOpenCategory: (category: string) => void;
  onScan: () => void;
}) {
  const { darkMode, tx } = usePreferenceContext();
  const palette = getCatColor(product.category);
  const pressScale = useRef(new Animated.Value(1)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(pressScale, withWebSafeNativeDriver({ toValue: 0.965, tension: 110, friction: 7 })),
      Animated.spring(tilt, withWebSafeNativeDriver({ toValue: 1, tension: 110, friction: 7 })),
    ]).start();
  };
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(pressScale, withWebSafeNativeDriver({ toValue: 1, tension: 110, friction: 7 })),
      Animated.spring(tilt, withWebSafeNativeDriver({ toValue: 0, tension: 110, friction: 7 })),
    ]).start();
  };
  const rotateY = tilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '4deg'] });
  const badgeText = tx(product.points >= 25 ? 'Top Pick' : 'Popular');
  return (
    <Pressable onPress={() => onOpenCategory(product.category)} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.productCard,
          darkMode ? styles.productCardDark : null,
          { width, transform: [{ scale: pressScale }, { perspective: 900 }, { rotateY }] },
        ]}
      >
        <LinearGradient
          colors={darkMode ? ['#1E293B', '#243B55', '#1E293B'] : palette.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.productImageZone}
        >
          <LinearGradient
            colors={palette.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.productBadge}
          >
            <Text style={styles.productBadgeText}>{badgeText}</Text>
          </LinearGradient>
          <View style={[styles.pointsPill, styles.pointsPillFloating, { borderColor: palette.scanText + '33' }]}>
            <Text style={[styles.pointsPillText, { color: palette.scanText }]}>+{product.points} pts</Text>
          </View>
          <FeaturedProductImage uri={product.img} size={width + 6} />
        </LinearGradient>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, darkMode ? styles.productNameDark : null]} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={[styles.productDesc, darkMode ? styles.productDescDark : null]} numberOfLines={2}>
            {product.description}
          </Text>
          <View style={styles.productFooter}>
            <Text style={[styles.productPrice, darkMode ? styles.productPriceDark : null]}>{product.price}</Text>
          </View>
          <TouchableOpacity
            onPress={() => onScan()}
            style={[styles.productScanBtn, { backgroundColor: palette.scanBg }]}
            activeOpacity={0.85}
          >
            <ScanIcon color={palette.scanText} size={15} />
            <Text style={[styles.productScanBtnText, { color: palette.scanText }]}>{tx('Scan to Earn')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Pressable>
  );
}
function WalletIcon({ color = '#10254A', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="13" rx="2.4" stroke={color} strokeWidth={1.8} />
      <Path d="M15.5 11.5H21V16h-5.5a2.25 2.25 0 010-4.5z" stroke={color} strokeWidth={1.8} />
      <Circle cx="16.8" cy="13.75" r="1.05" fill={color} />
      <Path
        d="M7 6V4.8A1.8 1.8 0 018.8 3h7.7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function BellIcon({ color = '#10254A', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 16.5V11a6 6 0 1112 0v5.5l1.2 1.2a.8.8 0 01-.57 1.36H5.37a.8.8 0 01-.57-1.36L6 16.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M10 20a2 2 0 004 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function ScanIcon({ color = '#10254A', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.8} />
      <Rect x="14" y="4" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.8} />
      <Rect x="4" y="14" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.8} />
      <Path d="M14 14h2v2h-2zM18 14h2v6h-6v-2h4v-4z" fill={color} />
    </Svg>
  );
}

function GiftIcon({ color = '#10254A', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="8" width="18" height="4" rx="1.2" stroke={color} strokeWidth={1.8} />
      <Path d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 8v13M12 8C12 8 9 6 9 4.5a3 3 0 016 0C15 6 12 8 12 8z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WhatsAppIcon({ color = '#10254A', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4.25A7.75 7.75 0 005.21 15.7L4 19.75l4.17-1.1A7.75 7.75 0 1012 4.25z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <Path
        d="M9.15 8.95c.18-.4.39-.42.57-.42h.49c.15 0 .36.06.54.46.18.4.6 1.45.66 1.56.06.11.1.24.02.38-.08.15-.13.25-.25.38-.11.13-.24.29-.34.39-.11.11-.22.22-.09.42.13.2.58.95 1.25 1.54.86.76 1.58 1 1.8 1.1.22.1.35.09.48-.07.13-.16.54-.64.68-.86.14-.22.29-.18.48-.11.2.07 1.24.59 1.45.7.21.1.35.16.4.25.05.09.05.54-.13 1.04-.18.51-1.02.98-1.42 1.03-.37.06-.85.09-1.36-.07-.31-.1-.71-.23-1.23-.46-2.15-.94-3.56-3.16-3.67-3.32-.11-.16-.89-1.18-.89-2.25 0-1.07.56-1.6.76-1.82z"
        fill={color}
      />
    </Svg>
  );
}

function ChevronRight({ color = '#10254A', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6 3.5L10.5 8 6 12.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function FilterIcon({ color = '#173E80', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7h16M7 12h10M10 17h4" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Circle cx="9" cy="7" r="2" fill="#FFFFFF" stroke={color} strokeWidth={1.7} />
      <Circle cx="15" cy="12" r="2" fill="#FFFFFF" stroke={color} strokeWidth={1.7} />
      <Circle cx="12" cy="17" r="2" fill="#FFFFFF" stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function HomeScreen({
  onNavigate,
  onOpenProductCategory,
  profilePhotoUri,
  totalPoints,
  totalScans,
  hasUnreadNotif = false,
}: {
  onNavigate: (screen: Screen) => void;
  onOpenProductCategory: (category: string) => void;
  profilePhotoUri?: string | null;
  totalPoints: number;
  totalScans: number;
  hasUnreadNotif?: boolean;
}) {
  const { darkMode, tx, language } = usePreferenceContext();
  const {
    products: ctxProducts,
    categories: ctxCategories,
    banners: ctxBanners,
    testimonials: ctxTestimonials,
    appSettings,
  } = useAppData();
  const { user: authUser } = useAuth();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [slide, setSlide] = useState(0);
  const productFilters = ['All', 'Boxes', 'Fans'] as const;
  const [selectedFilter, setSelectedFilter] = useState<(typeof productFilters)[number]>('All');
  const [apiBannerSlides, setApiBannerSlides] = useState<{ image: { uri: string }; resizeMode: 'cover' | 'contain'; backgroundColor: string }[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const statsPulse = useRef(new Animated.Value(1)).current;
  const cardW = (width - 28 - 12) / 2;
  const heroImageHeight = Math.round((width - 28) * 0.56);
  const tier = useMemo(() => getElectricianTier(totalPoints), [totalPoints]);
  const catalogProducts = useMemo(
    () =>
      ctxProducts.slice(0, 4).map((item) => ({
        id: item.id,
        name: item.name,
        description: item.sub ?? '',
        img: item.image || CAT_IMAGES[item.category] || CAT_IMAGES.fanbox,
        category: item.category,
        price: item.price ? `Rs ${item.price}` : '',
        points: item.points,
      })),
    [ctxProducts],
  );

  // Prefer admin-managed category metadata, then backfill from products.
  const categories = useMemo(() => {
    const catMap = new Map<string, number>();
    ctxProducts.forEach((p) => catMap.set(p.category, (catMap.get(p.category) ?? 0) + 1));
    const CATEGORY_LABELS: Record<string, string> = {
      fanbox:'Fan Box', concealedbox:'Concealed Box', modular:'Modular Box',
      modularbox:'Modular Box', mcb:'MCB Box', busbar:'Bus Bar',
      exhaust:'Exhaust Fan', led:'LED Lights', changeover:'Changeover',
      mainswitch:'Main Switch', louver:'Louvers', axialfan:'Axial Fan',
      ledflood:'LED Flood', multipin:'Multi Pin', pintop:'Pin Top', accessories:'Accessories',
    };
    const ORDER = ['fanbox','concealedbox','modular','mcb','busbar','exhaust','led','changeover','mainswitch','louver','axialfan','ledflood','multipin','pintop'];
    const merged = new Map<string, { id: string; label: string; imageUrl?: string | null }>();

    ctxCategories.forEach((category) => {
      const id = category.categoryId ?? category.slug ?? category.id;
      merged.set(id, {
        id,
        label: category.label || CATEGORY_LABELS[id] || id,
        imageUrl: category.imageUrl ?? null,
      });
    });

    Array.from(catMap.keys()).forEach((id) => {
      if (!merged.has(id)) {
        merged.set(id, {
          id,
          label: CATEGORY_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1),
          imageUrl: null,
        });
      }
    });

    return Array.from(merged.values())
      .sort((a, b) => {
        const ai = ORDER.indexOf(a.id); const bi = ORDER.indexOf(b.id);
        if (ai === -1 && bi === -1) return a.id.localeCompare(b.id);
        if (ai === -1) return 1; if (bi === -1) return -1;
        return ai - bi;
      });
  }, [ctxCategories, ctxProducts]);

  // Map testimonials from context
  useEffect(() => {
    if (ctxTestimonials.length > 0) {
      setTestimonials(ctxTestimonials.map((t) => ({
        initials: t.initials ?? t.personName.slice(0, 2).toUpperCase(),
        name: t.personName,
        location: t.location ?? '',
        tier: t.tier ?? '',
        yearsWithUs: `Connected for ${t.yearsConnected} year${t.yearsConnected !== 1 ? 's' : ''}`,
        quote: t.quote,
        highlight: t.highlight ?? '',
        colors: (t.gradientColors?.slice(0, 3) ?? ['#EEF2FF','#D9D6FE','#C4B5FD']) as [string,string,string],
        ring: t.ringColor ?? '#7C3AED',
        glow: t.gradientColors?.[0] ?? '#DDD6FE',
      })));
    }
  }, [ctxTestimonials]);

  // Map banners from context — ONLY use API data, no local fallback
  useEffect(() => {
    const filtered = ctxBanners.filter(
      (b) => b.isActive !== false && (b as any).status !== 'inactive' && b.imageUrl,
    );
    const mapped = filtered.map((b) => ({
      image: { uri: b.imageUrl! },
      resizeMode: 'cover' as const,
      backgroundColor: b.bgColor ?? '#192F67',
    }));
    // Prefetch all banner images so they're in cache before carousel renders
    const uris = mapped.map((b) => b.image.uri);
    Promise.all(uris.map((uri) => Image.prefetch(uri).catch(() => null))).finally(() => {
      setApiBannerSlides(mapped as any);
    });
  }, [ctxBanners]);

  const activeBannerSlides = apiBannerSlides;

  const filteredProducts = useMemo(() => {
    if (selectedFilter === 'Boxes') {
      return catalogProducts.filter((product) => {
        const source = `${product.name} ${product.description}`.toLowerCase();
        return source.includes('box');
      });
    }
    if (selectedFilter === 'Fans') {
      return catalogProducts.filter((product) => {
        const source = `${product.name} ${product.description}`.toLowerCase();
        return source.includes('fan');
      });
    }
    return catalogProducts;
  }, [catalogProducts, selectedFilter]);

  // Show only first 6 categories on home screen
  const displayedCategories = useMemo(() => categories.slice(0, 6), [categories]);

  // 2-column card width (same as ProductScreen)
  const catCardW = Math.floor((width - 28 - 12) / 2);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(statsPulse, withWebSafeNativeDriver({ toValue: 1.03, duration: 1300 })),
        Animated.timing(statsPulse, withWebSafeNativeDriver({ toValue: 1, duration: 1300 })),
      ])
    );

    pulse.start();
    return () => pulse.stop();
  }, [statsPulse]);

  const quickActions = [
    {
      testID: 'user-home-action-categories',
      accessibilityLabel: 'User home quick action categories',
      title: tx('Categories'),
      sub: tx('Browse products'),
      icon: ScanIcon,
      iconColors: ['#EDE9FE', '#DDD6FE'] as const,
      iconTint: '#7C3AED',
      onPress: () => onNavigate('categories'),
    },
    {
      testID: 'electrician-home-action-wallet',
      accessibilityLabel: 'Electrician home quick action wallet',
      title: tx('Wallet'),
      sub: tx('Balance & history'),
      icon: WalletIcon,
      iconColors: ['#FEF3C7', '#FDE68A'] as const,
      iconTint: '#B45309',
      onPress: () => onNavigate('wallet'),
    },
    {
      testID: 'electrician-home-action-rewards',
      accessibilityLabel: 'Electrician home quick action gift store',
      title: tx('Gift Store'),
      sub: tx('Redeem rewards'),
      icon: GiftIcon,
      iconColors: ['#F3E8FF', '#DDD6FE'] as const,
      iconTint: '#7C3AED',
      onPress: () => onNavigate('rewards'),
    },
    {
      testID: 'electrician-home-action-whatsapp',
      accessibilityLabel: 'Electrician home quick action WhatsApp support',
      title: tx('WhatsApp'),
      sub: tx('Premium support'),
      icon: WhatsAppIcon,
      iconColors: ['#DCFCE7', '#BBF7D0'] as const,
      iconTint: '#16A34A',
      onPress: () =>
          Linking.openURL(`https://wa.me/${appSettings?.whatsappNumber ?? '918837684004'}?text=Hello%20SRV%20Electricals%2C%20I%20need%20support`),
      },
  ];

  return (
    <ScrollView
      style={[styles.container, darkMode ? styles.containerDark : null]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={darkMode ? ['#0B1220', '#101A2F', '#18263E'] : ['#F4F8EE', '#E7F0D4', '#F8FBF1']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroShell, { marginTop: -insets.top, paddingTop: 26 + insets.top }]}
      >
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />
        <View style={styles.heroGlowThree} />

        <View style={styles.topRow}>
          <View style={styles.brandLockup}>
            <View style={[styles.logoWrap, darkMode ? styles.logoWrapDark : null]}>
              <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
            </View>
          </View>

          <View style={styles.topActions}>
            <TouchableOpacity
              onPress={() => onNavigate('notification')}
              style={[styles.topActionBtn, darkMode ? styles.topActionBtnDark : null]}
              activeOpacity={0.85}
            >
              <View
                style={[
                  styles.topIconCore,
                  styles.notificationCore,
                  darkMode ? styles.notificationCoreDark : null,
                ]}
              >
                <BellIcon color={darkMode ? '#FDBA74' : '#C2410C'} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {authUser ? (
        <>
        <ProfileFlipCard
          profile={{
            name: authUser?.name ?? '',
            phone: authUser?.phone ?? '',
            electrician_code: authUser?.electricianCode ?? '',
            dealer_code: authUser?.dealerCode ?? '',
            dealer_name: authUser?.dealerName ?? '',
            dealer_town: authUser?.dealerTown ?? '',
            dealer_phone: authUser?.dealerPhone ?? '',
            town: authUser?.city ?? '',
            state: authUser?.state ?? '',
            address: authUser?.address ?? '',
          }}
          role="user"
          photoUri={profilePhotoUri}
          apiPhotoUri={authUser?.profileImage ?? null}
        />

        <View style={styles.statRow}>
          <Animated.View
            style={[
              styles.statCardWrap,
              darkMode ? styles.statCardWrapDark : null,
              { transform: [{ scale: statsPulse }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onNavigate('wallet')}
              testID="electrician-home-stat-wallet"
              accessible
              accessibilityRole="button"
              accessibilityLabel="Electrician home total points wallet"
            >
              <LinearGradient
                colors={
                  darkMode ? ['#0F172A', '#132238', '#1E293B'] : ['#E0F2FE', '#DBEAFE', '#EDE9FE']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.statCard, darkMode ? styles.statCardDark : null]}
              >
                <Animated.View
                  style={[styles.statGlow, styles.statGlowBlue, { opacity: statsPulse }]}
                />
                <Text style={[styles.statLabel, darkMode ? styles.statLabelDark : null]}>
                  {tx('Total Points')}
                </Text>
                <Text style={[styles.statValue, darkMode ? styles.statValueDark : null]}>
                  {totalPoints.toLocaleString()}
                </Text>
                <Text style={[styles.statHint, darkMode ? styles.statHintDark : null]}>
                  {`${totalScans} ${tx('scans')}`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          <Animated.View
            style={[
              styles.statCardWrap,
              darkMode ? styles.statCardWrapDark : null,
              { transform: [{ scale: statsPulse }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onNavigate('electrician_tier')}
              testID="electrician-home-stat-member-tier"
              accessible
              accessibilityRole="button"
              accessibilityLabel="Electrician home member tier"
            >
              <LinearGradient
                colors={darkMode ? ['#111827', '#18263A', '#243B53'] : tier.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.statCard, darkMode ? styles.statCardDark : null]}
              >
                <Animated.View
                  style={[styles.statGlow, styles.statGlowWarm, { opacity: statsPulse }]}
                />
                <View
                  style={[
                    styles.tierIconChip,
                    { backgroundColor: darkMode ? 'rgba(255,255,255,0.12)' : '#FFFFFFB8' },
                  ]}
                >
                  <ElectricianTierIcon tier={tier.tier} size={20} />
                </View>
                <Text style={[styles.statLabel, darkMode ? styles.statLabelDark : null]}>
                  {tx('Member Tier')}
                </Text>
                <Text style={[styles.statValue, darkMode ? styles.statValueDark : null]}>
                  {tier.tier}
                </Text>
                <Text style={[styles.statHint, darkMode ? styles.statHintDark : null]}>
                  {tier.tier === 'Diamond'
                    ? tx('Top reward level unlocked')
                    : formatCountText(
                        language,
                        tier.tier === 'Silver'
                          ? 1001 - totalPoints
                          : tier.tier === 'Gold'
                            ? 5001 - totalPoints
                            : 10001 - totalPoints,
                        'to next tier',
                        'अगले टियर तक',
                        'ਅਗਲੇ ਟੀਅਰ ਤੱਕ'
                      )}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
        </>
        ) : (
          <View style={styles.heroGuestBannerWrap}>
            <BannerCarousel
              slides={guestHeroSlides}
              height={heroImageHeight}
              darkMode={darkMode}
            />
          </View>
        )}
      </LinearGradient>

      <View style={styles.body}>
        {authUser ? (
          <BannerCarousel
            slides={apiBannerSlides}
            height={heroImageHeight}
            darkMode={darkMode}
          />
        ) : null}

        <View style={styles.quickGrid}>
          {quickActions.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.title}
                style={[styles.quickCard, darkMode ? styles.quickCardDark : null, { width: cardW }]}
                onPress={item.onPress}
                activeOpacity={0.9}
                testID={item.testID}
                accessible
                accessibilityRole="button"
                accessibilityLabel={item.accessibilityLabel}
              >
                <LinearGradient colors={item.iconColors} style={styles.quickIconBox}>
                  <Icon color={item.iconTint} size={24} />
                </LinearGradient>
                <Text style={[styles.quickTitle, darkMode ? styles.quickTitleDark : null]}>
                  {item.title}
                </Text>
                <Text style={[styles.quickSub, darkMode ? styles.quickSubDark : null]}>
                  {item.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Browse by Category */}
        {categories.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionEyebrow, darkMode ? styles.sectionEyebrowDark : null]}>
                  {tx('Shop by Category')}
                </Text>
                <Text style={[styles.sectionTitle, darkMode ? styles.sectionTitleDark : null]}>
                  {tx('Browse Categories')}
                </Text>
              </View>
              {categories.length > 6 && (
                <TouchableOpacity onPress={() => onNavigate('product')} style={styles.inlineAction} activeOpacity={0.85}>
                  <Text style={styles.viewAllText}>{tx('View all')}</Text>
                  <ChevronRight color="#E8453C" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.homeCatGrid}>
              {displayedCategories.map((cat, index) => (
                <HomeCategoryCard
                  key={cat.id}
                  cat={cat}
                  index={index}
                  cardW={catCardW}
                  darkMode={darkMode}
                  onPress={() => onOpenProductCategory(cat.id)}
                />
              ))}
            </View>
          </>
        )}

        <TestimonialShowcase
          eyebrow={tx('Electrician Testimonials')}
          title={tx('What Electricians Say')}
          subtitle={tx('Testimonial subtitle')}
          items={testimonials}
          darkMode={darkMode}
        />

        <WebsitePromoSection darkMode={darkMode} />

        <View style={{ height: Math.max(30, insets.bottom + 18) }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F8EE' },
  containerDark: { backgroundColor: '#08111F' },
  heroShell: {
    paddingTop: 26,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  heroGuestBannerWrap: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(107,124,45,0.18)',
    top: -60,
    right: -35,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(166,180,86,0.16)',
    bottom: 18,
    left: -28,
  },
  heroGlowThree: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(107,124,45,0.12)',
    top: 72,
    left: '34%',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  brandLockup: { flexDirection: 'row', flex: 1, alignItems: 'center' },
  logoWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  logoWrapDark: {
    backgroundColor: 'rgba(15,23,42,0.78)',
    borderColor: 'rgba(148,163,184,0.2)',
  },
  logoImage: { width: 64, height: 64 },
  topActions: { flexDirection: 'row', gap: 8 },
  topActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#0F172A', offsetY: 8, blur: 14, opacity: 0.12, elevation: 4 }),
  },
  topActionBtnDark: {
    backgroundColor: '#0F172A',
    borderColor: 'rgba(148,163,184,0.24)',
    ...createShadow({ color: '#020617', offsetY: 8, blur: 14, opacity: 0.12, elevation: 4 }),
  },

  topIconCore: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletCore: {
    backgroundColor: '#FEF3C7',
  },
  notificationCore: {
    backgroundColor: '#FFEDD5',
  },
  notificationCoreDark: {
    backgroundColor: 'rgba(194,65,12,0.18)',
  },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  statCardWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow({ color: '#94A3B8', offsetY: 8, blur: 16, opacity: 0.12, elevation: 4 }),
  },
  statCardWrapDark: {
    ...createShadow({ color: '#020617', offsetY: 8, blur: 16, opacity: 0.26, elevation: 4 }),
  },
  statCard: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  statCardDark: {
    borderColor: 'rgba(148,163,184,0.16)',
  },
  statGlow: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    top: -18,
    right: -12,
  },
  statGlowBlue: {
    backgroundColor: 'rgba(59,130,246,0.22)',
  },
  statGlowWarm: {
    backgroundColor: 'rgba(244,114,182,0.2)',
  },
  statLabel: { color: '#5C6F91', fontSize: 9.5, fontWeight: '700', marginBottom: 4 },
  statLabelDark: { color: '#BFDBFE' },
  statValue: { color: '#13294B', fontSize: 16, fontWeight: '900' },
  statValueDark: { color: '#F8FAFC' },
  statHint: { color: '#7A8CAA', fontSize: 9.5, marginTop: 2 },
  statHintDark: { color: '#CBD5E1' },
  tapHintBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(59,130,246,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tapHintText: { color: '#3B82F6', fontSize: 9, fontWeight: '700' },
  tierIconChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingHorizontal: 14, paddingTop: 18, paddingBottom: 18 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionEyebrow: {
    color: '#7D8AA5',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  sectionEyebrowDark: { color: '#94A3B8' },
  sectionTitle: { color: '#14213D', fontSize: 21, fontWeight: '900' },
  sectionTitleDark: { color: '#F8FAFC' },
  bannerCard: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#D9E3F2',
    ...createShadow({ color: '#0F172A', offsetY: 10, blur: 22, opacity: 0.16, elevation: 9 }),
  },
  bannerImage: { width: '100%', height: '100%' },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 22,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C7D2E3' },
  dotDark: { backgroundColor: '#334155' },
  dotActive: { width: 28, backgroundColor: '#0F172A' },
  dotActiveDark: { width: 28, backgroundColor: '#E2E8F0' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
  quickCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    ...createShadow({ color: '#0F172A', offsetY: 8, blur: 18, opacity: 0.07, elevation: 4 }),
  },
  quickCardDark: {
    backgroundColor: '#111827',
    ...createShadow({ color: '#020617', offsetY: 8, blur: 18, opacity: 0.07, elevation: 4 }),
  },
  quickIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  quickTitle: { color: '#152238', fontSize: 14, fontWeight: '800' },
  quickTitleDark: { color: '#F8FAFC' },
  quickSub: { color: '#74829D', fontSize: 11.5, marginTop: 3 },
  quickSubDark: { color: '#CBD5E1' },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { color: '#6B7C2D', fontSize: 13, fontWeight: '800' },
  productsTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, flex: 1 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E3F0',
  },
  filterChipDark: {
    backgroundColor: '#111827',
    borderColor: '#243043',
  },
  filterChipActive: {
    backgroundColor: '#6B7C2D',
    borderColor: '#6B7C2D',
  },
  filterChipText: { color: '#6B7C2D', fontSize: 11.5, fontWeight: '800' },
  filterChipTextDark: { color: '#CBD5E1' },
  filterChipTextActive: { color: '#FFFFFF' },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E6ECF5',
    ...createShadow({ color: '#0F172A', offsetY: 10, blur: 18, opacity: 0.08, elevation: 5 }),
  },
  productCardDark: {
    backgroundColor: '#111827',
    borderColor: '#243043',
    ...createShadow({ color: '#020617', offsetY: 10, blur: 18, opacity: 0.08, elevation: 5 }),
  },
  productImageZone: {
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  productBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 2,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  productBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  productImage: { width: 112, height: 112 },
  productInfo: { padding: 13, paddingTop: 11 },
  productName: { color: '#152238', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  productNameDark: { color: '#F8FAFC' },
  productDesc: { color: '#70819C', fontSize: 11, lineHeight: 16, marginTop: 4, minHeight: 32 },
  productDescDark: { color: '#CBD5E1' },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  productPrice: { color: '#152238', fontSize: 15, fontWeight: '900' },
  productPriceDark: { color: '#F8FAFC' },
  pointsPill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  pointsPillFloating: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 2,
  },
  pointsPillText: { fontSize: 10.5, fontWeight: '800' },
  productScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 12,
    paddingVertical: 9,
  },
  productScanBtnText: { fontSize: 11.5, fontWeight: '800' },
  // Category grid — 2-column, same as ProductScreen
  homeCatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  // Legacy category grid (kept for reference)
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    overflow: 'hidden',
    alignItems: 'center',
    width: '22%',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E6ECF5',
    paddingBottom: 10,
    ...createShadow({ color: '#0F172A', offsetY: 4, blur: 12, opacity: 0.07, elevation: 3 }),
  },
  categoryCardDark: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
  },
  categoryImgWrap: {
    width: '100%',
    height: 76,
    backgroundColor: '#F1F6E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryImgWrapDark: {
    backgroundColor: '#1E293B',
  },
  categoryImg: {
    width: '86%',
    height: 62,
  },
  categoryLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#152238',
    textAlign: 'center',
    lineHeight: 13,
    paddingHorizontal: 4,
  },
  categoryLabelDark: { color: '#E2E8F0' },
  categoryPrice: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6B7C2D',
    textAlign: 'center',
    marginTop: 3,
    paddingHorizontal: 4,
  },
  categoryPriceDark: { color: '#F87171' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#6B7C2D', borderWidth: 1.5, borderColor: '#fff' },
});
