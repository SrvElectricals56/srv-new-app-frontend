import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRegisterScrollToTop } from '@/shared/context/NavActionContext';
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
import {
  isRoleFeatureEnabled,
  resolveRolePageControls,
} from '@/shared/config/rolePageControls';
import type { Screen } from '@/shared/types/navigation';
import { usePreferenceContext } from '@/shared/preferences';
import ProfileFlipCard from '@/shared/components/ProfileFlipCard';
import { createShadow } from '@/shared/theme/shadows';
import {
  TESTIMONIAL_FALLBACK_COPY,
  getTestimonialTheme,
  TestimonialShowcase,
  type TestimonialItem,
} from '@/shared/components/TestimonialShowcase';
import { WebsitePromoSection } from '@/shared/components/WebsitePromoSection';
import { BannerCarousel, type BannerSlide as CarouselSlide } from '@/shared/components/BannerCarousel';
import { getElectricianTier, type ElectricianTierName } from './ElectricianTierScreen';
import { useAppPageContent, useAppPageSections, useCatalogDownload } from '@/shared/hooks';
import type { HomePageSectionKey } from '@/shared/config/appPageContent';
import { API_BASE_URL } from '@/shared/api/config';
import { bannersApi } from '@/shared/api';
import { CUSTOMER_THEME } from '@/features/user/theme';

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

function getCatImage(id: string, apiImageUrl?: string | null): string {
  const idLower = id.toLowerCase();
  if (idLower.includes('bus') || idLower.includes('bar')) return CAT_IMAGES.busbar;
  if (idLower.includes('mcb') || idLower.includes('eco') || idLower.includes('spn')) return CAT_IMAGES.mcb;
  if (idLower.includes('concealed')) return CAT_IMAGES.concealedbox;
  if (idLower.includes('fan') && !idLower.includes('exhaust')) return CAT_IMAGES.fanbox;
  // Skip API image if it looks like a logo or profile photo
  if (apiImageUrl) {
    const isLogoLike = /logo|profile|avatar|white\.jpe?g|white\.png/i.test(apiImageUrl);
    if (!isLogoLike) return apiImageUrl;
  }
  return CAT_IMAGES[id] || CAT_IMAGES.fanbox;
}

// ── Animated Category Image (float + breathe — same as ProductScreen) ─
function AnimatedCatImage({ uri, fallbackUri, size }: { uri: string; fallbackUri?: string; size: number }) {
  const floatY = useRef(new Animated.Value(0)).current;
  const imgScale = useRef(new Animated.Value(1)).current;
  const [imgSrc, setImgSrc] = useState(uri);

  useEffect(() => { setImgSrc(uri); }, [uri]);

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
        <Image
          source={{ uri: imgSrc }}
          style={{ width: size, height: size }}
          resizeMode="contain"
          onError={() => { if (fallbackUri && imgSrc !== fallbackUri) setImgSrc(fallbackUri); }}
        />
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
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;
  const entryY = useRef(new Animated.Value(50)).current;
  const entryOp = useRef(new Animated.Value(0)).current;
  const imgUri = cat._fallbackImg && !cat.imageUrl
    ? cat._fallbackImg
    : getCatImage(cat.id, cat.imageUrl);
  const fallbackUri = cat._fallbackImg ?? getCatImage(cat.id, null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(
        entryY,
        withWebSafeNativeDriver({
          toValue: 0,
          duration: 500,
          delay: index * 60,
          easing: Easing.out(Easing.back(1.3)),
        })
      ),
      Animated.timing(
        entryOp,
        withWebSafeNativeDriver({
          toValue: 1,
          duration: 400,
          delay: index * 60,
          easing: Easing.out(Easing.ease),
        })
      ),
    ]).start();
  }, [entryOp, entryY, index]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(pressScale, withWebSafeNativeDriver({ toValue: 0.94, tension: 120, friction: 6 })),
      Animated.spring(tiltX, withWebSafeNativeDriver({ toValue: 1, tension: 120, friction: 6 })),
      Animated.spring(tiltY, withWebSafeNativeDriver({ toValue: 1, tension: 120, friction: 6 })),
    ]).start();
  };
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(pressScale, withWebSafeNativeDriver({ toValue: 1, tension: 90, friction: 6 })),
      Animated.spring(tiltX, withWebSafeNativeDriver({ toValue: 0, tension: 90, friction: 6 })),
      Animated.spring(tiltY, withWebSafeNativeDriver({ toValue: 0, tension: 90, friction: 6 })),
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
          <View
            style={[
              homeCatStyles.imgZone,
              { backgroundColor: darkMode ? CUSTOMER_THEME.surfaceDark : '#FFFFFF' },
            ]}
          >
            <AnimatedCatImage uri={imgUri} fallbackUri={fallbackUri} size={142} />
          </View>
          <View style={[homeCatStyles.accentLine, { backgroundColor: CUSTOMER_THEME.primaryDeep }]} />
          <View style={[homeCatStyles.infoZone, darkMode ? homeCatStyles.infoZoneDark : null]}>
            <Text style={[homeCatStyles.label, darkMode ? homeCatStyles.labelDark : null]} numberOfLines={2}>
              {cat.label}
            </Text>
            <View
              style={[
                homeCatStyles.pill,
                {
                  backgroundColor: darkMode ? 'rgba(251,241,231,0.1)' : CUSTOMER_THEME.soft,
                },
              ]}
            >
              <Text
                style={[
                  homeCatStyles.pillText,
                  { color: darkMode ? '#E8D4C8' : CUSTOMER_THEME.primaryDeep },
                ]}
              >
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
    borderColor: CUSTOMER_THEME.border,
    ...createShadow({ color: '#6A2F12', offsetY: 6, blur: 16, opacity: 0.1, elevation: 4 }),
  },
  cardDark: { backgroundColor: CUSTOMER_THEME.surfaceDark, borderColor: CUSTOMER_THEME.borderDark },
  imgZone: { height: 150, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  accentLine: { height: 4, width: '100%' },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  infoZone: { padding: 10, backgroundColor: '#FFFFFF' },
  infoZoneDark: { backgroundColor: CUSTOMER_THEME.surfaceDark },
  label: { fontSize: 12, fontWeight: '800', color: CUSTOMER_THEME.ink, lineHeight: 16, marginBottom: 6 },
  labelDark: { color: '#FBF1E7' },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: '700' },
});

const logoImage = require('../../../../assets/srv logo white.jpeg');

const API_BASE_HOST = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

function resolveRemoteImageUrl(value?: string | null): string | null {
  if (!value) return null;
  let normalized = value.trim();
  if (!normalized) return null;
  normalized = normalized.replace(/\\/g, '/');
  if (normalized.startsWith('//')) return `http:${normalized}`;
  if (normalized.startsWith('/')) return `${API_BASE_HOST}${normalized}`;
  if (/^www\./i.test(normalized)) return `http://${normalized}`;
  if (/^https?:\/\//i.test(normalized)) {
    try {
      const current = new URL(API_BASE_HOST);
      const remote = new URL(normalized);
      const localLike = /^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/;
      if (localLike.test(remote.hostname) && remote.hostname !== current.hostname) {
        return `${current.protocol}//${current.host}${remote.pathname}${remote.search}`;
      }
      return normalized;
    } catch {
      return normalized;
    }
  }
  return `${API_BASE_HOST}/${normalized.replace(/^\.?\//, '')}`;
}

function mapBannerSlides(items: any[]): CarouselSlide[] {
  const filtered = items
    .filter((b) => {
      const imageUrl = resolveRemoteImageUrl(
        b.imageUrl ||
          b.image ||
          b.imagePath ||
          b.bannerImage,
      );
      return b.isActive !== false && b.status !== 'inactive' && !!imageUrl;
    })
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return filtered.map((b) => ({
    image: {
      uri: resolveRemoteImageUrl(
        b.imageUrl ||
          b.image ||
          b.imagePath ||
          b.bannerImage,
      )!,
    },
    resizeMode: 'cover' as const,
    backgroundColor: b.bgColor ?? '#5C3A28',
  }));
}

function DownloadIcon({ color = '#6A2F12', size = 22 }: { color?: string; size?: number }) {
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

function BellIcon({ color = CUSTOMER_THEME.ink, size = 22 }: { color?: string; size?: number }) {
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

function ScanIcon({ color = CUSTOMER_THEME.ink, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.8} />
      <Rect x="14" y="4" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.8} />
      <Rect x="4" y="14" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.8} />
      <Path d="M14 14h2v2h-2zM18 14h2v6h-6v-2h4v-4z" fill={color} />
    </Svg>
  );
}

function GiftIcon({ color = CUSTOMER_THEME.ink, size = 22 }: { color?: string; size?: number }) {
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

function WhatsAppIcon({ color = CUSTOMER_THEME.ink, size = 22 }: { color?: string; size?: number }) {
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

function HelpIcon({ color = CUSTOMER_THEME.ink, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
      <Path d="M9.8 9.3a2.2 2.2 0 114.2 1c0 1.4-1.5 2-2 2.9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="12" cy="16.8" r="1" fill={color} />
    </Svg>
  );
}

function CartIcon({ color = CUSTOMER_THEME.ink, size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 7h12l-1.2 6.2a2 2 0 01-2 1.6H9.2a2 2 0 01-2-1.6L6 7z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M8 7a4 4 0 018 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="9.5" cy="18.5" r="1" fill={color} />
      <Circle cx="14.5" cy="18.5" r="1" fill={color} />
    </Svg>
  );
}

function ChevronRight({ color = CUSTOMER_THEME.ink, size = 16 }: { color?: string; size?: number }) {
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

/** Member tier card on customer home — warm creams, no electrician blue/slate */
function customerHomeTierLightGradient(tierName: ElectricianTierName): [string, string, string] {
  switch (tierName) {
    case 'Silver':
      return ['#FFFBF7', '#FBF1E7', '#F5E8DC'];
    case 'Gold':
      return ['#FFF8E6', '#FEF0C7', '#FDE68A'];
    case 'Platinum':
      return ['#FDF6F0', '#F5E8DC', '#EFD8C1'];
    case 'Diamond':
      return ['#FFF9F3', '#FBF1E7', '#F0DEC9'];
    default:
      return ['#FBF1E7', '#F5E8DC', '#F0DEC9'];
  }
}

export function HomeScreen({
  onNavigate,
  onOpenNeedHelp,
  onOpenProductCategory,
  profilePhotoUri,
  totalPoints,
  totalScans,
  hasUnreadNotif = false,
  unreadNotificationCount = 0,
}: {
  onNavigate: (screen: Screen) => void;
  onOpenNeedHelp?: () => void;
  onOpenProductCategory: (category: string) => void;
  profilePhotoUri?: string | null;
  totalPoints: number;
  totalScans: number;
  hasUnreadNotif?: boolean;
  unreadNotificationCount?: number;
}) {
  const { darkMode, tx } = usePreferenceContext();
  const {
    products: ctxProducts,
    categories: ctxCategories,
    banners: ctxBanners,
    testimonials: ctxTestimonials,
    appSettings,
  } = useAppData();
  const { user: authUser } = useAuth();
  const { openCatalog } = useCatalogDownload();
  const pageContent = useAppPageContent('user', 'home');
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const homeScrollRef = useRef<ScrollView>(null);
  useRegisterScrollToTop('home', homeScrollRef);
  const [apiBannerSlides, setApiBannerSlides] = useState<CarouselSlide[]>([]);
  const statsPulse = useRef(new Animated.Value(1)).current;
  const cardW = (width - 28 - 12) / 2;
  const heroImageHeight = Math.round((width - 28) * 0.56);
  const tier = useMemo(() => getElectricianTier(totalPoints), [totalPoints]);
  const showTestimonials = appSettings?.testimonialsEnabled !== false;
  const rolePageControls = useMemo(
    () => resolveRolePageControls(appSettings?.rolePageControls),
    [appSettings?.rolePageControls]
  );
  const showNotifications = isRoleFeatureEnabled(rolePageControls, 'user', 'notification');
  const showCategories = isRoleFeatureEnabled(rolePageControls, 'user', 'categories');
  const showCatalog = isRoleFeatureEnabled(rolePageControls, 'user', 'catalog_pdf');
  const showRewards = isRoleFeatureEnabled(rolePageControls, 'user', 'rewards');
  const showWhatsapp = isRoleFeatureEnabled(rolePageControls, 'user', 'whatsapp_support');
  const showNeedHelp = isRoleFeatureEnabled(rolePageControls, 'user', 'need_help');
  const showCart = isRoleFeatureEnabled(rolePageControls, 'user', 'cart');
  const showProduct = isRoleFeatureEnabled(rolePageControls, 'user', 'product');
  const catalogPdfUrl =
    appSettings?.generalCatalogPdfUrl ??
    appSettings?.catalogPdfUrl;
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
    const mapped = mapBannerSlides(ctxBanners as any[]);
    // Set slides immediately so banner shows right away
    setApiBannerSlides(mapped as any);
    // Prefetch in background for smoother experience
    const uris = mapped
      .map((b) => (typeof b.image === 'object' && 'uri' in b.image ? b.image.uri : null))
      .filter((uri): uri is string => !!uri);
    uris.forEach((uri) => Image.prefetch(uri).catch(() => null));
  }, [ctxBanners]);

  // Customer screen direct DB fallback for banners in case shared public context misses them.
  useEffect(() => {
    if (apiBannerSlides.length > 0) return;
    let cancelled = false;

    const loadBanners = async () => {
      try {
        const roleRes = await bannersApi.getAll('user');
        const roleSlides = mapBannerSlides((roleRes as any).data ?? []);
        const finalSlides =
          roleSlides.length > 0
            ? roleSlides
            : mapBannerSlides(((await bannersApi.getAll()) as any).data ?? []);

        if (!cancelled && finalSlides.length > 0) {
          setApiBannerSlides(finalSlides);
        }
      } catch {
        // Keep existing UI if DB banners still fail here.
      }
    };

    void loadBanners();
    return () => {
      cancelled = true;
    };
  }, [apiBannerSlides.length]);

  const activeBannerSlides = apiBannerSlides;

  // Show only 4 specific hardcoded categories on home screen
  const displayedCategories = useMemo(() => {
    const hardcodedCategories = [
      { id: 'Fan Box', label: 'Fan Box', fallbackImg: CAT_IMAGES.fanbox, searchTerms: ['fan', 'fanbox', 'fan-box'] },
      { id: 'Concealed Box', label: 'Concealed Box', fallbackImg: CAT_IMAGES.concealedbox, searchTerms: ['concealed', 'concealedbox', 'concealed-box'] },
      { id: 'BUS BAR SUPER', label: 'Bus Bar Super', fallbackImg: CAT_IMAGES.busbar, searchTerms: ['bus bar super', 'busbarsuper'] },
      { id: 'ECO SPN DD MCB BOX', label: 'MCB Box', fallbackImg: CAT_IMAGES.mcb, searchTerms: ['mcb', 'eco', 'spn', 'dd'] },
    ];
    return hardcodedCategories.map(hardcoded => {
      const found = categories.find(c => {
        const cId = c.id.toLowerCase();
        const cLabel = (c.label || '').toLowerCase();
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
      testID: 'user-home-action-categories',
      accessibilityLabel: 'User home quick action categories',
      title: pageContent.actionLabel || tx('Categories'),
      sub: pageContent.actionSubtitle || tx('Browse products'),
      icon: ScanIcon,
      iconColors: CUSTOMER_THEME.quickBrowse,
      iconTint: CUSTOMER_THEME.quickBrowseTint,
      onPress: () => onNavigate('categories'),
      hidden: !showCategories,
    },
    {
      testID: 'user-home-action-catalog',
      accessibilityLabel: 'User home quick action download catalog',
      title: tx('Product Catalog'),
      sub: tx('Download PDF for latest updated prices'),
      icon: DownloadIcon,
      iconColors: ['#FEF3C7', '#FDE68A'] as const,
      iconTint: '#B45309',
      onPress: () => openCatalog(catalogPdfUrl),
      hidden: !showCatalog,
    },
    {
      testID: 'electrician-home-action-rewards',
      accessibilityLabel: 'Electrician home quick action gift store',
      title: tx('Gift Store'),
      sub: tx('Redeem rewards'),
      icon: GiftIcon,
      iconColors: CUSTOMER_THEME.quickRewards,
      iconTint: CUSTOMER_THEME.quickRewardsTint,
      onPress: () => onNavigate('rewards'),
      hidden: !showRewards,
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
    tx, pageContent, showCategories, showCatalog, showRewards, showWhatsapp,
    onNavigate, openCatalog, catalogPdfUrl, appSettings?.whatsappNumber,
  ]);

  const homeSections = useAppPageSections('user', 'home');

  const bodySections = useMemo((): React.ReactNode[] => {
    if (!homeSections.length) return [];

    const sectionMap: Record<HomePageSectionKey, React.ReactNode | null> = {
      hero_banner: null,
      home_banner: authUser && activeBannerSlides.length > 0 ? (
        <View key="home_banner" style={[styles.homeBannerSection, darkMode ? styles.homeBannerSectionDark : null]}>
          <BannerCarousel slides={activeBannerSlides} height={heroImageHeight} darkMode={darkMode} />
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
                <Text style={[styles.viewAllText, { color: darkMode ? '#E8D4C8' : CUSTOMER_THEME.primaryDeep }]}>
                  {pageContent.primaryCtaLabel || tx('View all')}
                </Text>
                <ChevronRight color={darkMode ? '#E8D4C8' : CUSTOMER_THEME.primaryDeep} />
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
    homeSections, authUser, activeBannerSlides, heroImageHeight, darkMode,
    quickActions, cardW, categories, pageContent, showProduct,
    displayedCategories, catCardW, showTestimonials, testimonials,
    onNavigate, onOpenProductCategory, tx,
  ]);

  return (
    <ScrollView
      ref={homeScrollRef}
      style={[styles.container, darkMode ? styles.containerDark : null]}
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
    >
      <LinearGradient
        colors={darkMode ? CUSTOMER_THEME.heroDark : CUSTOMER_THEME.heroLight}
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
                  {hasUnreadNotif && unreadNotificationCount > 0 ? (
                    <View style={styles.notificationBadge}><Text style={styles.notificationBadgeText}>{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</Text></View>
                  ) : null}
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
            user_code: authUser?.userCode ?? '',
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
          {showNeedHelp ? (
          <Animated.View
            style={[
              styles.statCardWrap,
              darkMode ? styles.statCardWrapDark : null,
              { transform: [{ scale: statsPulse }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onOpenNeedHelp?.()}
              testID="user-home-stat-need-help"
              accessible
              accessibilityRole="button"
              accessibilityLabel="User home need help"
            >
              <LinearGradient
                colors={
                  darkMode ? CUSTOMER_THEME.heroDark : CUSTOMER_THEME.statLight
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.statCard, darkMode ? styles.statCardDark : null]}
              >
                <Animated.View
                  style={[styles.statGlow, styles.statGlowPoints, { opacity: statsPulse }]}
                />
                <View
                  style={[
                    styles.tierIconChip,
                    { backgroundColor: darkMode ? 'rgba(255,255,255,0.12)' : '#FFFFFFB8' },
                  ]}
                >
                  <HelpIcon color={darkMode ? '#FDE68A' : '#8D4A1E'} size={20} />
                </View>
                <Text style={[styles.statLabel, darkMode ? styles.statLabelDark : null]}>
                  {pageContent.statLabel || tx('Need Help')}
                </Text>
                <Text style={[styles.statValue, darkMode ? styles.statValueDark : null]}>
                  {pageContent.statValue || tx('Support')}
                </Text>
                <Text style={[styles.statHint, darkMode ? styles.statHintDark : null]}>
                  {pageContent.statHint || tx('Open help center')}
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
            {showCart ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onNavigate('cart')}
              testID="user-home-stat-cart"
              accessible
              accessibilityRole="button"
              accessibilityLabel="User home my cart"
            >
              <LinearGradient
                colors={darkMode ? [...CUSTOMER_THEME.heroDark] : customerHomeTierLightGradient(tier.tier)}
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
                  <CartIcon color={darkMode ? '#FDE68A' : '#8D4A1E'} size={20} />
                </View>
                <Text style={[styles.statLabel, darkMode ? styles.statLabelDark : null]}>
                  {pageContent.statLabel || tx('My Cart')}
                </Text>
                <Text style={[styles.statValue, darkMode ? styles.statValueDark : null]}>
                  {pageContent.statValue || tx('Products')}
                </Text>
                <Text style={[styles.statHint, darkMode ? styles.statHintDark : null]}>
                  {pageContent.statHint || tx('View saved cart items')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            ) : null}
          </Animated.View>
        </View>
        </>
        ) : (
          activeBannerSlides.length > 0 ? (
            <View style={styles.heroGuestBannerWrap}>
              <BannerCarousel
                slides={activeBannerSlides}
                height={heroImageHeight}
                darkMode={darkMode}
              />
            </View>
          ) : null
        )}
      </LinearGradient>

      <View style={[styles.body, darkMode ? styles.bodyDark : null]}>
        {bodySections}
        <View style={{ height: Math.max(30, insets.bottom + 18) }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CUSTOMER_THEME.canvasLight },
  containerDark: { backgroundColor: CUSTOMER_THEME.canvasDark },
  heroShell: {
    paddingTop: 26,
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  heroGuestBannerWrap: {
    marginTop: 12,
    marginBottom: 8,
  },
  homeBannerSection: {
    marginBottom: 14,
  },
  homeBannerSectionDark: {},
  bannerFallbackCard: {
    borderRadius: 18,
    backgroundColor: '#FFF7EF',
    borderWidth: 1,
    borderColor: '#EFD8C1',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  bannerFallbackCardDark: {
    backgroundColor: CUSTOMER_THEME.surfaceDark,
    borderColor: CUSTOMER_THEME.borderDark,
  },
  bannerFallbackTitle: {
    color: '#6A2F12',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  bannerFallbackTitleDark: { color: '#F8FAFC' },
  bannerFallbackText: {
    color: '#8B6A52',
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: '92%',
  },
  bannerFallbackTextDark: { color: '#C4B4A8' },
  heroGlowOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: CUSTOMER_THEME.heroGlowOne,
    top: -60,
    right: -35,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: CUSTOMER_THEME.heroGlowTwo,
    bottom: 18,
    left: -28,
  },
  heroGlowThree: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: CUSTOMER_THEME.heroGlowThree,
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
    ...createShadow({ color: '#6A2F12', offsetY: 2, blur: 8, opacity: 0.1, elevation: 3 }),
  },
  logoWrapDark: {
    backgroundColor: 'rgba(61,36,24,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(239,216,193,0.25)',
  },
  logoImage: { width: 48, height: 48 },
  topActions: { flexDirection: 'row', gap: 8 },
  topActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(141,74,30,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#6A2F12', offsetY: 8, blur: 14, opacity: 0.1, elevation: 4 }),
  },
  topActionBtnDark: {
    backgroundColor: CUSTOMER_THEME.surfaceDark,
    borderColor: 'rgba(239,216,193,0.18)',
    ...createShadow({ color: '#1A0503', offsetY: 8, blur: 14, opacity: 0.35, elevation: 4 }),
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
  notificationBadge: { position: 'absolute', top: -7, right: -9, minWidth: 19, height: 19, borderRadius: 10, paddingHorizontal: 4, backgroundColor: '#DC2626', borderWidth: 1.5, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  notificationBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  statCardWrap: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow({ color: '#8D4A1E', offsetY: 8, blur: 16, opacity: 0.14, elevation: 4 }),
  },
  statCardWrapDark: {
    ...createShadow({ color: '#1A0503', offsetY: 8, blur: 16, opacity: 0.35, elevation: 4 }),
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
    borderColor: 'rgba(239,216,193,0.14)',
  },
  statGlow: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    top: -18,
    right: -12,
  },
  statGlowPoints: {
    backgroundColor: 'rgba(141,74,30,0.22)',
  },
  statGlowWarm: {
    backgroundColor: 'rgba(166,93,46,0.22)',
  },
  statLabel: { color: '#8A7A6E', fontSize: 9.5, fontWeight: '700', marginBottom: 4 },
  statLabelDark: { color: '#E8D4C8' },
  statValue: { color: '#3D2418', fontSize: 16, fontWeight: '900' },
  statValueDark: { color: '#FBF1E7' },
  statHint: { color: '#A08F82', fontSize: 9.5, marginTop: 2 },
  statHintDark: { color: '#C4B4A8' },
  tapHintBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(141,74,30,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tapHintText: { color: '#8D4A1E', fontSize: 9, fontWeight: '700' },
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
  body: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: CUSTOMER_THEME.canvasLight,
  },
  bodyDark: { backgroundColor: CUSTOMER_THEME.canvasDark },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  sectionEyebrow: {
    color: '#8A7A6E',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 5,
  },
  sectionEyebrowDark: { color: '#C4B4A8' },
  sectionTitle: { color: '#3D2418', fontSize: 21, fontWeight: '900' },
  sectionTitleDark: { color: '#FBF1E7' },
  bannerCard: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#F0DEC9',
    ...createShadow({ color: '#6A2F12', offsetY: 10, blur: 22, opacity: 0.12, elevation: 9 }),
  },
  bannerImage: { width: '100%', height: '100%' },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 22,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E8D4C8' },
  dotDark: { backgroundColor: '#5C4033' },
  dotActive: { width: 28, backgroundColor: '#6A2F12' },
  dotActiveDark: { width: 28, backgroundColor: '#E8D4C8' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 22 },
  quickCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    marginBottom: 12,
    ...createShadow({ color: '#6A2F12', offsetY: 8, blur: 18, opacity: 0.08, elevation: 4 }),
  },
  quickCardDark: {
    backgroundColor: CUSTOMER_THEME.surfaceDark,
    ...createShadow({ color: '#1A0503', offsetY: 8, blur: 18, opacity: 0.28, elevation: 4 }),
  },
  quickIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  quickTitle: { color: '#3D2418', fontSize: 14, fontWeight: '800' },
  quickTitleDark: { color: '#FBF1E7' },
  quickSub: { color: '#8A7A6E', fontSize: 11.5, marginTop: 3 },
  quickSubDark: { color: '#C4B4A8' },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { fontSize: 13, fontWeight: '800' },
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
    borderColor: CUSTOMER_THEME.border,
  },
  filterChipDark: {
    backgroundColor: CUSTOMER_THEME.surfaceDark,
    borderColor: CUSTOMER_THEME.borderDark,
  },
  filterChipActive: {
    backgroundColor: '#6A2F12',
    borderColor: '#6A2F12',
  },
  filterChipText: { color: '#6A2F12', fontSize: 11.5, fontWeight: '800' },
  filterChipTextDark: { color: '#E8D4C8' },
  filterChipTextActive: { color: '#FFFFFF' },
  productsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: CUSTOMER_THEME.border,
    ...createShadow({ color: '#6A2F12', offsetY: 10, blur: 18, opacity: 0.08, elevation: 5 }),
  },
  productCardDark: {
    backgroundColor: CUSTOMER_THEME.surfaceDark,
    borderColor: CUSTOMER_THEME.borderDark,
    ...createShadow({ color: '#1A0503', offsetY: 10, blur: 18, opacity: 0.22, elevation: 5 }),
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
  productName: { color: '#3D2418', fontSize: 13, fontWeight: '800', textTransform: 'uppercase' },
  productNameDark: { color: '#FBF1E7' },
  productDesc: { color: '#8A7A6E', fontSize: 11, lineHeight: 16, marginTop: 4, minHeight: 32 },
  productDescDark: { color: '#C4B4A8' },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  productPrice: { color: '#152238', fontSize: 15, fontWeight: '900' },
  productPriceDark: { color: '#FBF1E7' },
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
    borderColor: CUSTOMER_THEME.border,
    paddingBottom: 10,
    ...createShadow({ color: '#6A2F12', offsetY: 4, blur: 12, opacity: 0.07, elevation: 3 }),
  },
  categoryCardDark: {
    backgroundColor: CUSTOMER_THEME.surfaceDark,
    borderColor: CUSTOMER_THEME.borderDark,
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
    backgroundColor: '#3D2418',
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
  categoryLabelDark: { color: '#E8D4C8' },
  categoryPrice: {
    fontSize: 9,
    fontWeight: '700',
    color: '#6A2F12',
    textAlign: 'center',
    marginTop: 3,
    paddingHorizontal: 4,
  },
  categoryPriceDark: { color: '#F87171' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: '#6A2F12', borderWidth: 1.5, borderColor: '#fff' },
});
