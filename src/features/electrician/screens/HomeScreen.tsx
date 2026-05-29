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
import Svg, { Path, Rect } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAuth } from '@/shared/context/AuthContext';
import {
  isRoleFeatureEnabled,
  resolveRolePageControls,
} from '@/shared/config/rolePageControls';
import type { Screen } from '@/shared/types/navigation';
import { formatCountText, usePreferenceContext } from '@/shared/preferences';
import ProfileFlipCard from '@/shared/components/ProfileFlipCard';
import { createShadow } from '@/shared/theme/shadows';
import {
  TESTIMONIAL_FALLBACK_COPY,
  getTestimonialTheme,
  TestimonialShowcase,
  type TestimonialItem,
} from '@/shared/components/TestimonialShowcase';
import { WebsitePromoSection } from '@/shared/components/WebsitePromoSection';
import { BannerCarousel } from '@/shared/components/BannerCarousel';
import { ElectricianTierIcon, getElectricianTier } from './ElectricianTierScreen';
import { useAppPageContent, useAppPageSections, useCatalogDownload } from '@/shared/hooks';
import type { HomePageSectionKey } from '@/shared/config/appPageContent';
import { API_BASE_URL } from '@/shared/api';

// ── Category color system (same as ProductScreen) ─────────────────────
// ── Category Icon SVGs (same as ProductScreen) ────────────────────────
// ── Real CDN images for each category (same as ProductScreen) ────────
const CAT_IMAGES: Record<string, string> = {
  fanbox:        'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=320',
  concealedbox:  'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=320',
  modular:       'https://srvelectricals.com/cdn/shop/files/3x3_679e5d30-ecf2-446e-9452-354bbf4c4a26.png?v=1757426377&width=320',
  mcb:           'https://srvelectricals.com/cdn/shop/files/MCB_Box_4_Way_GI.png?v=1757426418&width=320',
  busbar:        'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/Bus_Bar_100A_Super.png',
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

const HOME_CATEGORY_LABELS: Record<string, string> = {
  fanbox: 'Fan Box',
  concealedbox: 'Concealed Box',
  modular: 'Modular Box',
  modularbox: 'Modular Box',
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
  accessories: 'Accessories',
  boxes: 'MCB & DB Boxes',
  fans: 'Fans & Ventilation',
};

const HOME_CATEGORY_ALIASES: Record<string, string> = {
  modularbox: 'modular',
  axialfan: 'exhaust',
  ledflood: 'led',
  boxes: 'mcb',
  fans: 'exhaust',
};

function sanitizeCategoryKey(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
}

function normalizeHomeCategory(id: string): string {
  const sanitized = sanitizeCategoryKey(id);
  return HOME_CATEGORY_ALIASES[sanitized] ?? sanitized;
}

function getCatImage(id: string, apiImageUrl?: string | null): string {
  const normalizedId = normalizeHomeCategory(id);
  
  // First try to get from CAT_IMAGES with normalized ID
  if (CAT_IMAGES[normalizedId]) return CAT_IMAGES[normalizedId];
  
  // Try with original ID
  if (CAT_IMAGES[id]) return CAT_IMAGES[id];
  
  // Try API image URL — skip if it looks like a logo or profile photo
  if (apiImageUrl) {
    const isLogoLike = /logo|profile|avatar|white\.jpe?g|white\.png/i.test(apiImageUrl);
    if (!isLogoLike) return apiImageUrl;
  }
  
  // Try to match by keywords for specific categories
  const idLower = id.toLowerCase();
  if (idLower.includes('mcb') || idLower.includes('eco') || idLower.includes('spn')) {
    return CAT_IMAGES.mcb;
  }
  if (idLower.includes('bus') || idLower.includes('bar')) {
    return CAT_IMAGES.busbar;
  }
  if (idLower.includes('fan') && !idLower.includes('exhaust')) {
    return CAT_IMAGES.fanbox;
  }
  if (idLower.includes('concealed')) {
    return CAT_IMAGES.concealedbox;
  }
  
  // Default fallback
  return CAT_IMAGES.fanbox;
}

function resolveRemoteImageUrl(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/\\/g, '/');
  if (!trimmed) return null;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  const apiRoot = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  if (/^(https?:|data:|file:)/i.test(trimmed)) {
    if (!/^https?:/i.test(trimmed)) return trimmed;
    try {
      const assetUrl = new URL(trimmed);
      const apiUrl = new URL(apiRoot);
      const isPrivateHost = /^(localhost|127\.0\.0\.1|10\.|172\.(1[6-9]|2\d|3[0-1])\.|192\.168\.)/i.test(assetUrl.hostname);
      if (isPrivateHost && assetUrl.hostname !== apiUrl.hostname) {
        return `${apiUrl.origin}${assetUrl.pathname}${assetUrl.search}`;
      }
    } catch {
      return trimmed;
    }
    return trimmed;
  }
  return trimmed.startsWith('/') ? `${apiRoot}${trimmed}` : `${apiRoot}/${trimmed}`;
}

// ── Animated Category Image (float + breathe + sway + shimmer — same as ProductScreen) ─
function AnimatedCatImage({ uri, fallbackUri, size }: { uri: string; fallbackUri?: string; size: number }) {
  const floatY   = useRef(new Animated.Value(0)).current;
  const imgScale = useRef(new Animated.Value(1)).current;
  const rotateZ  = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-1)).current;
  const [imgSrc, setImgSrc] = useState(uri);

  useEffect(() => { setImgSrc(uri); }, [uri]);

  useEffect(() => {
    const floatLoop = Animated.loop(Animated.sequence([
      Animated.timing(floatY, withWebSafeNativeDriver({ toValue: -8, duration: 1800, easing: Easing.inOut(Easing.sin) })),
      Animated.timing(floatY, withWebSafeNativeDriver({ toValue: 0,  duration: 1800, easing: Easing.inOut(Easing.sin) })),
    ]));
    const scaleLoop = Animated.loop(Animated.sequence([
      Animated.timing(imgScale, withWebSafeNativeDriver({ toValue: 1.07, duration: 2400, easing: Easing.inOut(Easing.ease) })),
      Animated.timing(imgScale, withWebSafeNativeDriver({ toValue: 1,    duration: 2400, easing: Easing.inOut(Easing.ease) })),
    ]));
    const swayLoop = Animated.loop(Animated.sequence([
      Animated.timing(rotateZ, withWebSafeNativeDriver({ toValue: 1,  duration: 2600, easing: Easing.inOut(Easing.sin) })),
      Animated.timing(rotateZ, withWebSafeNativeDriver({ toValue: -1, duration: 2600, easing: Easing.inOut(Easing.sin) })),
      Animated.timing(rotateZ, withWebSafeNativeDriver({ toValue: 0,  duration: 2600, easing: Easing.inOut(Easing.sin) })),
    ]));
    const runShimmer = () => {
      shimmerX.setValue(-1);
      Animated.timing(shimmerX, withWebSafeNativeDriver({ toValue: 2, duration: 900, easing: Easing.inOut(Easing.ease) }))
        .start(({ finished }) => { if (finished) setTimeout(runShimmer, 3500); });
    };
    floatLoop.start(); scaleLoop.start(); swayLoop.start();
    const t = setTimeout(runShimmer, 800);
    return () => { floatLoop.stop(); scaleLoop.stop(); swayLoop.stop(); clearTimeout(t); };
  }, [floatY, imgScale, rotateZ, shimmerX]);

  const swayDeg  = rotateZ.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-2deg', '0deg', '2deg'] });
  const shimmerTX = shimmerX.interpolate({ inputRange: [-1, 2], outputRange: [-size * 1.5, size * 3] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <Animated.View pointerEvents="none" style={{
        position: 'absolute', top: 0, bottom: 0,
        width: size * 0.35, backgroundColor: 'rgba(255,255,255,0.32)',
        transform: [{ translateX: shimmerTX }, { rotate: '20deg' }], zIndex: 2,
      }} />
      <Animated.View style={{ transform: [{ translateY: floatY }, { scale: imgScale }, { rotate: swayDeg }] }}>
        <Image source={{ uri: imgSrc }} style={{ width: size, height: size }} resizeMode="contain"
          onError={() => { if (fallbackUri && imgSrc !== fallbackUri) setImgSrc(fallbackUri); }}
        />
      </Animated.View>
    </View>
  );
}

// ── Home Category Card (same design as ProductScreen) ───────
function HomeCategoryCard({
  cat,
  index,
  cardW,
  darkMode,
  onPress,
  buttonLabel,
}: {
  cat: { id: string; label: string; imageUrl?: string | null; _fallbackImg?: string };
  index: number;
  cardW: number;
  darkMode: boolean;
  onPress: () => void;
  buttonLabel?: string;
}) {
  const pressScale = useRef(new Animated.Value(1)).current;
  const tiltX      = useRef(new Animated.Value(0)).current;
  const tiltY      = useRef(new Animated.Value(0)).current;
  const entryY     = useRef(new Animated.Value(50)).current;
  const entryOp    = useRef(new Animated.Value(0)).current;
  // Use explicit fallback when DB has no image — avoids wrong keyword-based guessing
  const imgUri = (cat._fallbackImg && !cat.imageUrl)
    ? cat._fallbackImg
    : getCatImage(cat.id, cat.imageUrl);
  // Always have a CDN fallback in case the primary URI fails to load
  const fallbackUri = cat._fallbackImg ?? getCatImage(cat.id, null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entryY,  withWebSafeNativeDriver({ toValue: 0, duration: 500, delay: index * 60, easing: Easing.out(Easing.back(1.3)) })),
      Animated.timing(entryOp, withWebSafeNativeDriver({ toValue: 1, duration: 400, delay: index * 60, easing: Easing.out(Easing.ease) })),
    ]).start();
  }, [entryY, entryOp, index]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(pressScale, withWebSafeNativeDriver({ toValue: 0.94, tension: 120, friction: 6 })),
      Animated.spring(tiltX,      withWebSafeNativeDriver({ toValue: 1,    tension: 120, friction: 6 })),
      Animated.spring(tiltY,      withWebSafeNativeDriver({ toValue: 1,    tension: 120, friction: 6 })),
    ]).start();
  };
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(pressScale, withWebSafeNativeDriver({ toValue: 1, tension: 90, friction: 6 })),
      Animated.spring(tiltX,      withWebSafeNativeDriver({ toValue: 0, tension: 90, friction: 6 })),
      Animated.spring(tiltY,      withWebSafeNativeDriver({ toValue: 0, tension: 90, friction: 6 })),
    ]).start();
  };
  const rotateY = tiltX.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '8deg'] });
  const rotateX = tiltY.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-5deg'] });

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{ opacity: entryOp, transform: [{ translateY: entryY }] }}>
        <Animated.View
          style={[
            homeCatStyles.card,
            darkMode ? homeCatStyles.cardDark : null,
            { width: cardW, transform: [{ scale: pressScale }, { perspective: 800 }, { rotateY }, { rotateX }] },
          ]}
        >
          {/* White image zone */}
          <View style={[homeCatStyles.imgZone, { backgroundColor: darkMode ? '#1E293B' : '#FFFFFF' }]}>
            <AnimatedCatImage uri={imgUri} fallbackUri={fallbackUri} size={homeCatStyles.imgZone.height - 8} />
          </View>
          {/* Accent line */}
          <View style={[homeCatStyles.accentLine, { backgroundColor: '#4A637B' }]} />
          {/* Label zone */}
          <View style={[homeCatStyles.infoZone, darkMode ? homeCatStyles.infoZoneDark : null]}>
            <Text style={[homeCatStyles.label, darkMode ? homeCatStyles.labelDark : null]} numberOfLines={2}>
              {cat.label}
            </Text>
            <View style={[homeCatStyles.pill, { backgroundColor: darkMode ? 'rgba(255,255,255,0.08)' : '#F5F8FB' }]}>
              <Text style={[homeCatStyles.pillText, { color: darkMode ? '#94A3B8' : '#4A637B' }]}>
                {buttonLabel ?? 'View Products'}
              </Text>
            </View>
          </View>
        </Animated.View>
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
    shadowColor: '#1A3C8F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 5,
  },
  cardDark: { backgroundColor: '#111827', borderColor: '#1E293B' },
  imgZone: { height: 150, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  accentLine: { height: 3, width: '100%' },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  infoZone: { padding: 10, backgroundColor: '#FFFFFF' },
  infoZoneDark: { backgroundColor: '#111827' },
  label: { fontSize: 12, fontWeight: '800', color: '#152238', lineHeight: 16, marginBottom: 6 },
  labelDark: { color: '#F1F5F9' },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: '700' },
});

const logoImage = require('../../../../assets/srv logo white.jpeg');

function DownloadIcon({ color = '#1D4ED8', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Book/catalog body */}
      <Path d="M4 4.5A1.5 1.5 0 015.5 3H19a1 1 0 011 1v14a1 1 0 01-1 1H5.5A1.5 1.5 0 014 17.5v-13z" stroke={color} strokeWidth={1.7} />
      {/* Spine line */}
      <Path d="M8 3v16" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Price tag lines */}
      <Path d="M11 8h6M11 11h6M11 14h4" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Bottom download arrow */}
      <Path d="M2 20h6M5 17.5v5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3.5 21.5L5 23l1.5-1.5" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
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

function PlayZoneIcon({ color = '#7C3AED', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5.5v13l10-6.5-10-6.5z" fill={color} />
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
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
  const { openCatalog } = useCatalogDownload();
  const pageContent = useAppPageContent('electrician', 'home');
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [apiBannerSlides, setApiBannerSlides] = useState<{ image: { uri: string }; resizeMode: 'cover' | 'contain'; backgroundColor: string }[]>([]);
  const statsPulse = useRef(new Animated.Value(1)).current;
  const cardW = (width - 28 - 12) / 2;
  const heroImageHeight = Math.round((width - 28) * 0.56);
  const tier = useMemo(() => getElectricianTier(totalPoints), [totalPoints]);
  const showTestimonials = appSettings?.testimonialsEnabled !== false;
  const rolePageControls = useMemo(
    () => resolveRolePageControls(appSettings?.rolePageControls),
    [appSettings?.rolePageControls]
  );
  const showNotifications = isRoleFeatureEnabled(rolePageControls, 'electrician', 'notification');
  const showScan = isRoleFeatureEnabled(rolePageControls, 'electrician', 'scan');
  const showCatalog = isRoleFeatureEnabled(rolePageControls, 'electrician', 'catalog_pdf');
  const showPlay = isRoleFeatureEnabled(rolePageControls, 'electrician', 'play');
  const showWhatsapp = isRoleFeatureEnabled(rolePageControls, 'electrician', 'whatsapp_support');
  const showWallet = isRoleFeatureEnabled(rolePageControls, 'electrician', 'wallet');
  const showElectricianTier = isRoleFeatureEnabled(rolePageControls, 'electrician', 'electrician_tier');
  const showProduct = isRoleFeatureEnabled(rolePageControls, 'electrician', 'product');
  const catalogPdfUrl =
    appSettings?.generalCatalogPdfUrl ??
    appSettings?.catalogPdfUrl;
  // Prefer admin-managed category metadata, then backfill from products.
  const categories = useMemo(() => {
    const catMap = new Map<string, number>();
    ctxProducts.forEach((p) => {
      const normalizedId = normalizeHomeCategory(p.category);
      if (!normalizedId) return;
      catMap.set(normalizedId, (catMap.get(normalizedId) ?? 0) + 1);
    });
    const ORDER = ['fanbox','concealedbox','modular','mcb','busbar','exhaust','led','changeover','mainswitch','louver','multipin','pintop'];
    const merged = new Map<string, { id: string; label: string; imageUrl?: string | null }>();

    ctxCategories.forEach((category) => {
      const rawId = category.categoryId ?? category.slug ?? category.label ?? category.id;
      const id = normalizeHomeCategory(rawId);
      if (!id) return;
      merged.set(id, {
        id,
        label: category.label || HOME_CATEGORY_LABELS[id] || id,
        imageUrl: category.imageUrl ?? null,
      });
    });

    Array.from(catMap.keys()).forEach((id) => {
      if (!merged.has(id)) {
        merged.set(id, {
          id,
          label: HOME_CATEGORY_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1),
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

  const testimonials = useMemo<TestimonialItem[]>(() => {
    if (ctxTestimonials.length > 0) {
      return ctxTestimonials.map((t, index) => {
        const themed = getTestimonialTheme(index);
        const fallback = TESTIMONIAL_FALLBACK_COPY[index % TESTIMONIAL_FALLBACK_COPY.length];
        return {
          initials: t.initials ?? t.personName.slice(0, 2).toUpperCase() ?? fallback.initials,
          name: t.personName || fallback.name,
          location: t.location || fallback.location,
          tier: t.tier || fallback.tier,
          yearsWithUs:
            t.yearsConnected != null
              ? `Connected for ${t.yearsConnected} year${t.yearsConnected !== 1 ? 's' : ''}`
              : fallback.yearsWithUs,
          quote: t.quote?.trim() || fallback.quote,
          highlight: t.highlight?.trim() || fallback.highlight,
          colors: themed.colors,
          ring: themed.ring,
          glow: themed.glow,
        };
      });
    }

    return TESTIMONIAL_FALLBACK_COPY.map((item, index) => {
      const themed = getTestimonialTheme(index);
      return { ...item, colors: themed.colors, ring: themed.ring, glow: themed.glow };
    });
  }, [ctxTestimonials]);

  // Map banners from context — set immediately, prefetch in background
  useEffect(() => {
    const filtered = ctxBanners
      .filter((b) => {
        const imageUrl = resolveRemoteImageUrl(
          b.imageUrl ||
          (b as any).imageUrl ||
          (b as any).image ||
          (b as any).imagePath ||
          (b as any).bannerImage,
        );
        return b.isActive !== false && (b as any).status !== 'inactive' && !!imageUrl;
      })
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    const mapped = filtered.map((b) => ({
      image: {
        uri: resolveRemoteImageUrl(
          b.imageUrl ||
          (b as any).imageUrl ||
          (b as any).image ||
          (b as any).imagePath ||
          (b as any).bannerImage,
        )!,
      },
      resizeMode: 'cover' as const,
      backgroundColor: b.bgColor ?? '#192F67',
    }));
    setApiBannerSlides(mapped as any);
    const uris = mapped.map((b) => b.image.uri);
    uris.forEach((uri) => Image.prefetch(uri).catch(() => null));
  }, [ctxBanners]);

  // Show only 4 specific hardcoded categories on home screen
  const displayedCategories = useMemo(() => {
    const hardcodedCategories = [
      { id: 'Fan Box',            label: 'Fan Box',       fallbackImg: CAT_IMAGES.fanbox,       searchTerms: ['fan', 'fanbox', 'fan-box'] },
      { id: 'Concealed Box',      label: 'Concealed Box', fallbackImg: CAT_IMAGES.concealedbox,  searchTerms: ['concealed', 'concealedbox', 'concealed-box'] },
      { id: 'BUS BAR SUPER',      label: 'Bus Bar Super', fallbackImg: CAT_IMAGES.busbar,        searchTerms: ['bus bar super', 'busbarsuper'] },
      { id: 'ECO SPN DD MCB BOX', label: 'MCB Box',       fallbackImg: CAT_IMAGES.mcb,           searchTerms: ['mcb', 'eco', 'spn', 'dd'] },
    ];

    return hardcodedCategories.map(hardcoded => {
      const found = categories.find((category) => {
        const cId = category.id.toLowerCase();
        const cLabel = (category.label || '').toLowerCase();
        return hardcoded.searchTerms.some(term =>
          cId.includes(term.toLowerCase()) || cLabel.includes(term.toLowerCase())
        );
      });
      return {
        id: hardcoded.id,
        targetCategoryId: found?.id ?? hardcoded.id,
        label: hardcoded.label,
        imageUrl: hardcoded.fallbackImg,
        _fallbackImg: hardcoded.fallbackImg,
      };
    });
  }, [categories]);

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

  const quickActions = useMemo(() => [
    {
      testID: 'electrician-home-action-scan',
      accessibilityLabel: 'Electrician home quick action scan',
      title: tx('Scan & Earn'),
      sub: tx('Instant points'),
      icon: ScanIcon,
      iconColors: ['#E0F2FE', '#BAE6FD'] as const,
      iconTint: '#0369A1',
      onPress: () => onNavigate('scan'),
      hidden: !showScan,
    },
    {
      testID: 'electrician-home-action-catalog',
      accessibilityLabel: 'Electrician home quick action download catalog',
      title: tx('Product Catalog'),
      sub: tx('Download PDF for latest updated prices'),
      icon: DownloadIcon,
      iconColors: ['#DBEAFE', '#BFDBFE'] as const,
      iconTint: '#1D4ED8',
      onPress: () => openCatalog(catalogPdfUrl),
      hidden: !showCatalog,
    },
    {
      testID: 'electrician-home-action-play-zone',
      accessibilityLabel: 'Electrician home quick action play zone',
      title: tx('Play Zone'),
      sub: tx('Watch videos and guides'),
      icon: PlayZoneIcon,
      iconColors: ['#F3E8FF', '#DDD6FE'] as const,
      iconTint: '#7C3AED',
      onPress: () => onNavigate('play'),
      hidden: !showPlay,
    },
    {
      testID: 'electrician-home-action-whatsapp',
      accessibilityLabel: 'Electrician home quick action WhatsApp support',
      title: tx('WhatsApp'),
      sub: tx('Chat with us'),
      icon: WhatsAppIcon,
      iconColors: ['#DCFCE7', '#BBF7D0'] as const,
      iconTint: '#16A34A',
      onPress: () =>
          Linking.openURL(`https://wa.me/${appSettings?.whatsappNumber ?? '918837684004'}?text=Hello%20SRV%20Electricals%2C%20I%20need%20support`),
      hidden: !showWhatsapp,
    },
  ].filter((item) => !item.hidden), [
    tx, showScan, showCatalog, showPlay, showWhatsapp,
    onNavigate, openCatalog, catalogPdfUrl, appSettings?.whatsappNumber,
  ]);

  const homeSections = useAppPageSections('electrician', 'home');

  const bodySections = useMemo((): React.ReactNode[] => {
    if (!homeSections.length) return [];

    const sectionMap: Record<HomePageSectionKey, React.ReactNode | null> = {
      hero_banner: null,
      home_banner: authUser && apiBannerSlides.length > 0 ? (
        <View key="home_banner">
          <BannerCarousel slides={apiBannerSlides} height={heroImageHeight} darkMode={darkMode} />
        </View>
      ) : null,
      quick_actions: (
        <View key="quick_actions" style={styles.quickGrid}>
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
      ),
      browse_categories: displayedCategories.length > 0 ? (
        <View key="browse_categories">
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionEyebrow, darkMode ? styles.sectionEyebrowDark : null]}>
                {pageContent.sectionTitle || tx('Shop by Category')}
              </Text>
              <Text style={[styles.sectionTitle, darkMode ? styles.sectionTitleDark : null]}>
                {pageContent.sectionSubtitle || tx('Browse Categories')}
              </Text>
            </View>
            {showProduct && categories.length > 4 && (
              <TouchableOpacity onPress={() => onNavigate('product')} style={styles.inlineAction} activeOpacity={0.85}>
                <Text style={styles.viewAllText}>{pageContent.primaryCtaLabel || tx('View all')}</Text>
                <ChevronRight color="#173E80" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.homeCatGrid}>
            {displayedCategories.map((cat, index) => (
              <HomeCategoryCard
                key={cat.id} cat={cat} index={index}
                cardW={catCardW} darkMode={darkMode}
                onPress={() => onOpenProductCategory(cat.targetCategoryId ?? cat.id)}
                buttonLabel={pageContent.cardButtonLabel || 'View Products'}
              />
            ))}
          </View>
        </View>
      ) : null,
      testimonials: showTestimonials ? (
        <TestimonialShowcase
          key="testimonials"
          eyebrow={pageContent.testimonialEyebrow || tx('Electrician Testimonials')}
          title={pageContent.testimonialTitle || tx('What Electricians Say')}
          subtitle={pageContent.testimonialSubtitle || tx('Testimonial subtitle')}
          items={testimonials}
          darkMode={darkMode}
        />
      ) : null,
      website_promo: <WebsitePromoSection key="website_promo" darkMode={darkMode} />,
    };

    return homeSections
      .filter((key) => key !== 'hero_banner')
      .map((key) => sectionMap[key])
      .filter(Boolean) as React.ReactNode[];
  }, [
    homeSections, authUser, apiBannerSlides, heroImageHeight, darkMode,
    quickActions, cardW, categories, pageContent, showProduct,
    displayedCategories, catCardW, showTestimonials, testimonials,
    onNavigate, onOpenProductCategory, tx,
  ]);

  return (
    <ScrollView
      style={[styles.container, darkMode ? styles.containerDark : null]}
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
    >
      <LinearGradient
        colors={darkMode ? ['#0B1220', '#101A2F', '#18263E'] : ['#EAF3FF', '#DDEEFF', '#F6EEFF']}
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
            {showNotifications ? (
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
            ) : null}
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
          role="electrician"
          photoUri={profilePhotoUri}
          apiPhotoUri={authUser?.profileImage ?? null}
        />

        <View style={styles.statRow}>
          {showWallet ? (
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
          ) : null}
          <Animated.View
            style={[
              styles.statCardWrap,
              darkMode ? styles.statCardWrapDark : null,
              { transform: [{ scale: statsPulse }] },
            ]}
          >
            {showElectricianTier ? (
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
            ) : null}
          </Animated.View>
        </View>
        </>
        ) : (
          apiBannerSlides.length > 0 ? (
            <View style={styles.heroGuestBannerWrap}>
              <BannerCarousel
                slides={apiBannerSlides}
                height={heroImageHeight}
                darkMode={darkMode}
              />
            </View>
          ) : null
        )}
      </LinearGradient>

      <View style={styles.body}>
        {bodySections}
        <View style={{ height: Math.max(30, insets.bottom + 18) }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF3F8' },
  containerDark: { backgroundColor: '#08111F' },
  heroShell: {
    paddingTop: 26,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(59,130,246,0.18)',
    top: -60,
    right: -35,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(236,72,153,0.14)',
    bottom: 18,
    left: -28,
  },
  heroGlowThree: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(34,197,94,0.1)',
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
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...createShadow({ color: '#0F172A', offsetY: 2, blur: 8, opacity: 0.12, elevation: 3 }),
  },
  logoWrapDark: {
    backgroundColor: 'rgba(15,23,42,0.78)',
    borderColor: 'rgba(148,163,184,0.2)',
  },
  logoImage: { width: 48, height: 48 },
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
  heroGuestBannerWrap: {
    marginTop: 8,
    marginBottom: 4,
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
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 22 },
  quickCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
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
  viewAllText: { color: '#173E80', fontSize: 13, fontWeight: '800' },
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
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: { color: '#2563EB', fontSize: 11.5, fontWeight: '800' },
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
    backgroundColor: '#F4F7FF',
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
    color: '#E8453C',
    textAlign: 'center',
    marginTop: 3,
    paddingHorizontal: 4,
  },
  categoryPriceDark: { color: '#F87171' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8453C', borderWidth: 1.5, borderColor: '#fff' },
});
