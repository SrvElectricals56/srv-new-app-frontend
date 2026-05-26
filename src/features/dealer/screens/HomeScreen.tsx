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
import Svg, { Circle, Path } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import ProfileFlipCard from '@/shared/components/ProfileFlipCard';
import {
  TESTIMONIAL_FALLBACK_COPY,
  getTestimonialTheme,
  TestimonialShowcase,
  type TestimonialItem,
} from '@/shared/components/TestimonialShowcase';
import { WebsitePromoSection } from '@/shared/components/WebsitePromoSection';
import { BannerCarousel, type BannerSlide as CarouselSlide } from '@/shared/components/BannerCarousel';
import { createShadow } from '@/shared/theme/shadows';
import { formatCountText, usePreferenceContext } from '@/shared/preferences';
import type { Screen } from '@/shared/types/navigation';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppData } from '@/shared/context/AppDataContext';
import {
  isRoleFeatureEnabled,
  resolveRolePageControls,
} from '@/shared/config/rolePageControls';
import { useAppPageContent, useAppPageSections, useCatalogDownload } from '@/shared/hooks';
import type { HomePageSectionKey } from '@/shared/config/appPageContent';
import { API_BASE_URL } from '@/shared/api/config';

const logoImage = require('../../../../assets/srv logo white.jpeg');

const API_BASE_HOST = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const CAT_IMAGES: Record<string, string> = {
  fanbox: 'https://srvelectricals.com/cdn/shop/files/FC_4_17-30.png?v=1757426626&width=320',
  concealedbox: 'https://srvelectricals.com/cdn/shop/files/CRD_PL_3.png?v=1757426566&width=320',
  modular: 'https://srvelectricals.com/cdn/shop/files/3x3_679e5d30-ecf2-446e-9452-354bbf4c4a26.png?v=1757426377&width=320',
  mcb: 'https://srvelectricals.com/cdn/shop/files/MCB_Box_4_Way_GI.png?v=1757426418&width=320',
  busbar: 'https://cdn.shopify.com/s/files/1/0651/4583/1466/files/Bus_Bar_100A_Super.png',
  exhaust: 'https://srvelectricals.com/cdn/shop/files/AP-Turtle-Fan.webp?v=1747938680&width=320',
  led: 'https://srvelectricals.com/cdn/shop/files/FloodLightSleek.png?v=1757426471&width=320',
  changeover: 'https://srvelectricals.com/cdn/shop/files/ACO_100A_FP.png?v=1757426480&width=320',
  mainswitch: 'https://srvelectricals.com/cdn/shop/files/CO_32A_DP_PRM.png?v=1757426515&width=320',
  louver: 'https://srvelectricals.com/cdn/shop/files/Louver_6_inch.png?v=1757426390&width=320',
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

function sanitizeCategoryKey(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '');
}

function normalizeHomeCategory(id: string) {
  const sanitized = sanitizeCategoryKey(id);
  return HOME_CATEGORY_ALIASES[sanitized] ?? sanitized;
}

function getCatImage(id: string, apiImageUrl?: string | null) {
  const remoteUrl = resolveRemoteImageUrl(apiImageUrl);
  // Skip API image if it looks like a logo, profile photo, or non-product asset
  const isLogoLike = remoteUrl && /logo|profile|avatar|white\.jpe?g|white\.png/i.test(remoteUrl);
  if (remoteUrl && !isLogoLike) return remoteUrl;

  const idLower = id.toLowerCase();
  if (idLower.includes('bus') || idLower.includes('bar')) return CAT_IMAGES.busbar;
  if (idLower.includes('mcb') || idLower.includes('eco') || idLower.includes('spn')) return CAT_IMAGES.mcb;
  if (idLower.includes('concealed')) return CAT_IMAGES.concealedbox;
  if (idLower.includes('fan') && !idLower.includes('exhaust')) return CAT_IMAGES.fanbox;

  const normalizedId = normalizeHomeCategory(id);
  return CAT_IMAGES[normalizedId] ?? CAT_IMAGES[id] ?? CAT_IMAGES.fanbox;
}

function resolveRemoteImageUrl(uri?: string | null) {
  if (!uri) return null;
  let normalized = uri.trim();
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

function UserPlusIcon({ color = '#0F4BA8', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="10" cy="8" r="3.2" stroke={color} strokeWidth={1.8} />
      <Path
        d="M4.6 18.5c1.1-2.3 3-3.6 5.4-3.6 2.3 0 4.2 1.2 5.4 3.6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path d="M16.8 7.2v5.6M14 10h5.6" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

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

function TierBadgeIcon({ tier, size = 24 }: { tier: string; size?: number }) {
  const colorMap: Record<string, { ring: string; fill: string; accent: string }> = {
    Silver: { ring: '#94A3B8', fill: '#E2E8F0', accent: '#64748B' },
    Gold: { ring: '#355C95', fill: '#EAF3FF', accent: '#173E80' },
    Platinum: { ring: '#2563EB', fill: '#DBEAFE', accent: '#1D4ED8' },
    Diamond: { ring: '#0891B2', fill: '#CFFAFE', accent: '#0E7490' },
  };
  const palette = colorMap[tier] ?? colorMap.Gold;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" fill={palette.fill} stroke={palette.ring} strokeWidth={1.8} />
      <Path
        d="M12 5.8l1.9 3.85 4.25.62-3.07 3 0.72 4.23L12 15.6l-3.8 1.9.73-4.23-3.08-3 4.25-.62L12 5.8z"
        fill={palette.accent}
      />
    </Svg>
  );
}

function WhatsAppIcon({ color = '#173E80', size = 22 }: { color?: string; size?: number }) {
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

function ChevronRight({ color = '#173E80', size = 16 }: { color?: string; size?: number }) {
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

function PlayZoneIcon({ color = '#FFFFFF', size = 28 }: { color?: string; size?: number }) {
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

function AnimatedCatImage({ uri, fallbackUri, size }: { uri: string; fallbackUri?: string; size: number }) {
  const floatY = useRef(new Animated.Value(0)).current;
  const imgScale = useRef(new Animated.Value(1)).current;
  const rotateZ = useRef(new Animated.Value(0)).current;
  const [imgSrc, setImgSrc] = useState(uri);

  useEffect(() => { setImgSrc(uri); }, [uri]);

  useEffect(() => {
    const floatLoop = Animated.loop(Animated.sequence([
      Animated.timing(floatY, withWebSafeNativeDriver({ toValue: -8, duration: 1800, easing: Easing.inOut(Easing.sin) })),
      Animated.timing(floatY, withWebSafeNativeDriver({ toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin) })),
    ]));
    const scaleLoop = Animated.loop(Animated.sequence([
      Animated.timing(imgScale, withWebSafeNativeDriver({ toValue: 1.06, duration: 2200, easing: Easing.inOut(Easing.ease) })),
      Animated.timing(imgScale, withWebSafeNativeDriver({ toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease) })),
    ]));
    const swayLoop = Animated.loop(Animated.sequence([
      Animated.timing(rotateZ, withWebSafeNativeDriver({ toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin) })),
      Animated.timing(rotateZ, withWebSafeNativeDriver({ toValue: -1, duration: 2600, easing: Easing.inOut(Easing.sin) })),
      Animated.timing(rotateZ, withWebSafeNativeDriver({ toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin) })),
    ]));
    floatLoop.start();
    scaleLoop.start();
    swayLoop.start();
    return () => {
      floatLoop.stop();
      scaleLoop.stop();
      swayLoop.stop();
    };
  }, [floatY, imgScale, rotateZ]);

  const swayDeg = rotateZ.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-2deg', '0deg', '2deg'] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <Animated.View style={{ transform: [{ translateY: floatY }, { scale: imgScale }, { rotate: swayDeg }] }}>
        <Image
          source={{ uri: imgSrc }}
          style={{ width: size, height: size }}
          resizeMode="contain"
          onError={() => {
            if (fallbackUri && imgSrc !== fallbackUri) setImgSrc(fallbackUri);
          }}
        />
      </Animated.View>
    </View>
  );
}

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
  // Use _fallbackImg if provided (for hardcoded categories with no DB image), else getCatImage
  const imgUri = cat._fallbackImg && !cat.imageUrl
    ? cat._fallbackImg
    : getCatImage(cat.id, cat.imageUrl);
  // Always have a CDN fallback in case the primary URI fails to load
  const fallbackUri = cat._fallbackImg ?? getCatImage(cat.id, null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entryY, withWebSafeNativeDriver({ toValue: 0, duration: 500, delay: index * 60, easing: Easing.out(Easing.back(1.3)) })),
      Animated.timing(entryOp, withWebSafeNativeDriver({ toValue: 1, duration: 400, delay: index * 60, easing: Easing.out(Easing.ease) })),
    ]).start();
  }, [entryY, entryOp, index]);

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
          <View style={[homeCatStyles.imgZone, { backgroundColor: darkMode ? '#1E293B' : '#FFFFFF' }]}>
            <AnimatedCatImage uri={imgUri} fallbackUri={fallbackUri} size={142} />
          </View>
          <View style={[homeCatStyles.accentLine, { backgroundColor: '#4A637B' }]} />
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

function getTier(count: number) {
  if (count <= 100) {
    return {
      tier: 'Silver',
      nextAt: 101,
      gradient: ['#EEF2F7', '#DDE4ED', '#CFD6E0'] as [string, string, string],
      accent: '#64748B',
      chip: '#F8FAFC',
    };
  }
  if (count <= 300) {
    return {
      tier: 'Gold',
      nextAt: 301,
      gradient: ['#EEF5FF', '#DCE8FF', '#C7DAFF'] as [string, string, string],
      accent: '#173E80',
      chip: '#F7FBFF',
    };
  }
  if (count <= 500) {
    return {
      tier: 'Platinum',
      nextAt: 501,
      gradient: ['#E9F0F8', '#D3E0EF', '#B7CADF'] as [string, string, string],
      accent: '#1D4ED8',
      chip: '#EFF6FF',
    };
  }
  return {
    tier: 'Diamond',
    nextAt: null,
    gradient: ['#EAF4FF', '#CEE7FF', '#9FCEFF'] as [string, string, string],
    accent: '#0E7490',
    chip: '#ECFEFF',
  };
}

export function HomeScreen({
  onNavigate,
  onOpenProductCategory,
  profilePhotoUri,
  hasUnreadNotif = false,
}: {
  onNavigate: (screen: Screen) => void;
  onOpenProductCategory: (category: string) => void;
  profilePhotoUri?: string | null;
  hasUnreadNotif?: boolean;
}) {
  const { darkMode, tx, language } = usePreferenceContext();
  const { user: authUser } = useAuth();
  const {
    products: ctxProducts,
    categories: ctxCategories,
    banners: ctxBanners,
    testimonials: ctxTestimonials,
    appSettings,
  } = useAppData();
  const { openCatalog } = useCatalogDownload();
  const pageContent = useAppPageContent('dealer', 'home');
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const statPulse = useRef(new Animated.Value(1)).current;
  const connectedCount = authUser?.electricianCount ?? 0;
  const tier = useMemo(() => getTier(connectedCount), [connectedCount]);
  const cardW = (width - 28 - 12) / 2;
  const heroImageHeight = Math.round((width - 28) * 0.56);
  const showTestimonials = appSettings?.testimonialsEnabled !== false;
  const rolePageControls = useMemo(
    () => resolveRolePageControls(appSettings?.rolePageControls),
    [appSettings?.rolePageControls]
  );
  const showNotifications = isRoleFeatureEnabled(rolePageControls, 'dealer', 'notification');
  const showElectricians = isRoleFeatureEnabled(rolePageControls, 'dealer', 'electricians');
  const showCatalog = isRoleFeatureEnabled(rolePageControls, 'dealer', 'catalog_pdf');
  const showCallElectrician = isRoleFeatureEnabled(rolePageControls, 'dealer', 'call_electrician');
  const showWhatsapp = isRoleFeatureEnabled(rolePageControls, 'dealer', 'whatsapp_support');
  const showDealerTier = isRoleFeatureEnabled(rolePageControls, 'dealer', 'dealer_tier');
  const showProduct = isRoleFeatureEnabled(rolePageControls, 'dealer', 'product');
  const catalogPdfUrl =
    appSettings?.dealerCatalogPdfUrl ??
    appSettings?.generalCatalogPdfUrl ??
    appSettings?.catalogPdfUrl;
  const [apiBannerSlides, setApiBannerSlides] = useState<CarouselSlide[]>([]);
  const [supportWhatsapp, setSupportWhatsapp] = useState('918837684004');

  // Map banners from context â€” prefetch all images first, then set slides
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

  // App settings from context
  useEffect(() => {
    if (appSettings?.whatsappNumber) setSupportWhatsapp(appSettings.whatsappNumber);
  }, [appSettings]);

  const activeBannerSlides = apiBannerSlides;
  const catCardW = Math.floor((width - 28 - 12) / 2);
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

    return Array.from(merged.values()).sort((a, b) => {
      const ai = ORDER.indexOf(a.id);
      const bi = ORDER.indexOf(b.id);
      if (ai === -1 && bi === -1) return a.id.localeCompare(b.id);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [ctxCategories, ctxProducts]);
  const displayedCategories = useMemo(() => {
    const hardcodedCategories = [
      { id: 'Fan Box',          label: 'Fan Box',       fallbackImg: CAT_IMAGES.fanbox,      searchTerms: ['fan', 'fanbox', 'fan-box'] },
      { id: 'Concealed Box',    label: 'Concealed Box', fallbackImg: CAT_IMAGES.concealedbox, searchTerms: ['concealed', 'concealedbox', 'concealed-box'] },
      { id: 'BUS BAR SUPER',    label: 'Bus Bar Super', fallbackImg: CAT_IMAGES.busbar,       searchTerms: ['bus bar super', 'busbarsuper'] },
      { id: 'ECO SPN DD MCB BOX', label: 'MCB Box',    fallbackImg: CAT_IMAGES.mcb,          searchTerms: ['mcb', 'eco', 'spn', 'dd'] },
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
        // Keep homepage hero categories on canonical product visuals so admin/category
        // logo uploads cannot replace the product image card.
        imageUrl: hardcoded.fallbackImg,
        _fallbackImg: hardcoded.fallbackImg,
      };
    });
  }, [categories]);
  const dealerTestimonials = useMemo<TestimonialItem[]>(() => {
    if (ctxTestimonials.length === 0) {
      return TESTIMONIAL_FALLBACK_COPY.map((item, index) => {
        const themed = getTestimonialTheme(index);
        return { ...item, colors: themed.colors, ring: themed.ring, glow: themed.glow };
      });
    }
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
    return [];
  }, [ctxTestimonials]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(statPulse, withWebSafeNativeDriver({ toValue: 1.03, duration: 1300 })),
        Animated.timing(statPulse, withWebSafeNativeDriver({ toValue: 1, duration: 1300 })),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [statPulse]);

  const quickActions = useMemo(() => [
    {
      testID: 'dealer-home-action-electricians',
      accessibilityLabel: 'Dealer home quick action associate electrician',
      title: tx('Associate Electrician'),
      sub: formatCountText(language, connectedCount, 'connected', 'à¤œà¥à¤¡à¤¼à¥‡ à¤¹à¥à¤', 'à¨œà©à©œà©‡ à¨¹à©‹à¨'),
      icon: UserPlusIcon,
      iconColors: ['#EEF5FF', '#DCE8FF'] as const,
      iconTint: '#1D4ED8',
      onPress: () => {
        onNavigate('electricians');
      },
      hidden: !showElectricians,
    },
    {
      testID: 'dealer-home-action-catalog',
      accessibilityLabel: 'Dealer home quick action download catalog',
      title: tx('Product Catalog'),
      sub: tx('Download PDF for latest updated prices'),
      icon: DownloadIcon,
      iconColors: ['#FFF7ED', '#FFEDD5'] as const,
      iconTint: '#EA580C',
      onPress: () => openCatalog(catalogPdfUrl),
      hidden: !showCatalog,
    },
    {
      testID: 'dealer-home-action-whatsapp',
      accessibilityLabel: 'Dealer home quick action WhatsApp support',
      title: tx('WhatsApp'),
      sub: tx('Chat with us'),
      icon: WhatsAppIcon,
      iconColors: ['#DCFCE7', '#BBF7D0'] as const,
      iconTint: '#25D366',
      onPress: () =>
        Linking.openURL(
          `https://wa.me/${supportWhatsapp}?text=Hello%20SRV%20Team,%20I%20need%20dealer%20support`
        ),
      hidden: !showWhatsapp,
    },
    {
      testID: 'dealer-home-action-play-zone',
      accessibilityLabel: 'Dealer home quick action play zone',
      title: 'Play Zone',
      sub: 'Watch videos and quick guides',
      icon: PlayZoneIcon,
      iconColors: ['#FFF7ED', '#FED7AA'] as const,
      iconTint: '#B45309',
      onPress: () => {
        onNavigate('play');
      },
      hidden: false,
    },
  ].filter((item) => !item.hidden), [
    tx, language, connectedCount, showElectricians, showCatalog, showWhatsapp,
    onNavigate, openCatalog, catalogPdfUrl, supportWhatsapp,
  ]);

  const homeSections = useAppPageSections('dealer', 'home');

  const bodySections = useMemo((): React.ReactNode[] => {
    if (!homeSections.length) return [];

    const sectionMap: Record<HomePageSectionKey, React.ReactNode | null> = {
      home_banner: authUser && activeBannerSlides.length > 0 ? (
        <View key="home_banner">
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
                <Text style={styles.viewAllText}>{pageContent.primaryCtaLabel || tx('View all')}</Text>
                <ChevronRight />
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
          eyebrow={pageContent.testimonialEyebrow || (
            language === 'Hindi'
              ? 'à¤¡à¥€à¤²à¤° à¤•à¥€ à¤°à¤¾à¤¯'
              : language === 'Punjabi'
                ? 'à¨¡à©€à¨²à¨° à¨¦à©€ à¨°à¨¾à¨‡'
                : 'Dealer Testimonials'
          )}
          title={pageContent.testimonialTitle || (
            language === 'Hindi'
              ? 'à¤¹à¤®à¤¾à¤°à¥‡ à¤¡à¥€à¤²à¤° à¤•à¥à¤¯à¤¾ à¤•à¤¹à¤¤à¥‡ à¤¹à¥ˆà¤‚'
              : language === 'Punjabi'
                ? 'à¨¸à¨¾à¨¡à©‡ à¨¡à©€à¨²à¨° à¨•à©€ à¨•à¨¹à¨¿à©°à¨¦à©‡ à¨¹à¨¨'
                : 'What Dealers Say'
          )}
          subtitle={pageContent.testimonialSubtitle || (
            language === 'Hindi'
              ? 'à¤°à¤¿à¤¯à¤² à¤¨à¥‡à¤Ÿà¤µà¤°à¥à¤• à¤ªà¤¾à¤°à¥à¤Ÿà¤¨à¤°à¥à¤¸ à¤•à¥€ à¤°à¤¾à¤¯, à¤œà¤¿à¤¨à¥à¤¹à¥‹à¤‚à¤¨à¥‡ à¤à¤¸à¤†à¤°à¤µà¥€ à¤•à¥‡ à¤¸à¤¾à¤¥ à¤¬à¤¿à¤œà¤¨à¥‡à¤¸ à¤•à¥‹ à¤”à¤° à¤®à¤œà¤¬à¥‚à¤¤ à¤¬à¤¨à¤¾à¤¯à¤¾à¥¤'
              : language === 'Punjabi'
                ? 'à¨…à¨¸à¨² à¨¨à©ˆà©±à¨Ÿà¨µà¨°à¨• à¨ªà¨¾à¨°à¨Ÿà¨¨à¨°à¨¾à¨‚ à¨¦à©€ à¨°à¨¾à¨‡, à¨œà¨¿à¨¨à©à¨¹à¨¾à¨‚ à¨¨à©‡ SRV à¨¨à¨¾à¨² à¨†à¨ªà¨£à¨¾ à¨•à¨¾à¨°à©‹à¨¬à¨¾à¨° à¨¹à©‹à¨° à¨®à¨œà¨¼à¨¬à©‚à¨¤ à¨•à©€à¨¤à¨¾à¥¤'
                : 'Real partner feedback from dealers who are growing faster with SRV.'
          )}
          items={dealerTestimonials}
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
    displayedCategories, catCardW, showTestimonials, dealerTestimonials,
    onNavigate, onOpenProductCategory, tx, language,
  ]);

  return (
    <ScrollView
      style={[styles.screen, darkMode ? styles.screenDark : null]}
      showsVerticalScrollIndicator={false}
      bounces={false}
      overScrollMode="never"
    >
      <LinearGradient
        colors={darkMode ? ['#0B1220', '#101A2F', '#18263E'] : ['#EAF3FF', '#DCE8FF', '#C7DAFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroShell, { marginTop: -insets.top, paddingTop: 26 + insets.top }]}
      >
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        <View style={styles.topRow}>
          <View style={[styles.logoWrap, darkMode ? styles.logoWrapDark : null]}>
            <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
          </View>
          {showNotifications ? (
            <TouchableOpacity
              onPress={() => onNavigate('notification')}
              style={[styles.topActionBtn, darkMode ? styles.topActionBtnDark : null]}
              activeOpacity={0.85}
            >
              <View style={styles.bellIconWrap}>
                <BellIcon color={darkMode ? '#FDBA74' : '#C2410C'} />
                {hasUnreadNotif && (
                  <View style={styles.redDot} />
                )}
              </View>
            </TouchableOpacity>
          ) : null}
        </View>

        {authUser ? (
        <>
        <ProfileFlipCard profile={{
          name: authUser?.name ?? '',
          phone: authUser?.phone ?? '',
          dealer_code: authUser?.dealerCode ?? '',
          town: authUser?.town ?? '',
          district: authUser?.district ?? '',
          state: authUser?.state ?? '',
          address: authUser?.address ?? '',
          electrician_code: '',
          dealer_name: authUser?.name ?? '',
          dealer_town: authUser?.town ?? '',
          dealer_phone: authUser?.phone ?? '',
        }} role="dealer" photoUri={profilePhotoUri} apiPhotoUri={authUser?.profileImage ?? null} />

        <View style={styles.statRow}>
          {showCallElectrician ? (
          <Animated.View
            style={[
              styles.statCardWrap,
              darkMode ? styles.statCardWrapDark : null,
              { transform: [{ scale: statPulse }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onNavigate('call_electrician')}
              testID="dealer-home-stat-call-electrician"
              accessible
              accessibilityRole="button"
              accessibilityLabel="Dealer home call electrician"
            >
              <LinearGradient
                colors={
                  darkMode ? ['#0F172A', '#132238', '#1E293B'] : ['#EEF5FF', '#DCE8FF', '#C7DAFF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.statCard, darkMode ? styles.statCardDark : null]}
              >
                <Text style={[styles.statLabel, darkMode ? styles.statLabelDark : null]}>
                  {tx('Call Electrician')}
                </Text>
                <Text style={[styles.statValue, darkMode ? styles.statValueDark : null]}>
                  {formatCountText(language, connectedCount, 'contacts', 'à¤•à¥‰à¤¨à¥à¤Ÿà¥ˆà¤•à¥à¤Ÿà¥à¤¸', 'à¨¸à©°à¨ªà¨°à¨•')}
                </Text>
                <Text style={[styles.statHint, darkMode ? styles.statHintDark : null]}>
                  {tx('Open phone and WhatsApp actions')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          ) : null}

          {showDealerTier ? (
          <Animated.View
            style={[
              styles.statCardWrap,
              darkMode ? styles.statCardWrapDark : null,
              { transform: [{ scale: statPulse }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onNavigate('dealer_tier')}
              testID="dealer-home-stat-member-tier"
              accessible
              accessibilityRole="button"
              accessibilityLabel="Dealer home member tier"
            >
              <LinearGradient
                colors={darkMode ? ['#111827', '#18263A', '#243B53'] : tier.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.statCard, darkMode ? styles.statCardDark : null]}
              >
                <View
                  style={[
                    styles.tierIconChip,
                    { backgroundColor: darkMode ? 'rgba(255,255,255,0.12)' : tier.chip },
                  ]}
                >
                  <TierBadgeIcon tier={tier.tier} size={20} />
                </View>
                <Text style={[styles.statLabel, darkMode ? styles.statLabelDark : null]}>
                  {tx('Member Tier')}
                </Text>
                <View style={styles.tierTextStack}>
                  <Text style={[styles.statValue, darkMode ? styles.statValueDark : null]}>
                    {tier.tier}
                  </Text>
                  <Text style={[styles.statHint, darkMode ? styles.statHintDark : null]}>
                    {tier.nextAt
                      ? formatCountText(
                          language,
                          tier.nextAt - connectedCount,
                          'more electricians for next grade',
                          'à¤…à¤—à¤²à¥‡ à¤—à¥à¤°à¥‡à¤¡ à¤•à¥‡ à¤²à¤¿à¤ à¤”à¤° à¤‡à¤²à¥‡à¤•à¥à¤Ÿà¥à¤°à¥€à¤¶à¤¿à¤¯à¤¨',
                          'à¨…à¨—à¨²à©‡ à¨—à©à¨°à©‡à¨¡ à¨²à¨ˆ à¨¹à©‹à¨° à¨‡à¨²à©ˆà¨•à¨Ÿà©à¨°à©€à¨¸à¨¼à¨¨'
                        )
                      : tx('Top dealer grade unlocked')}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          ) : null}
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
  screen: { flex: 1, backgroundColor: '#F4F8FF' },
  screenDark: { backgroundColor: '#08111F' },
  heroShell: {
    paddingTop: 26,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(37,99,235,0.16)',
    top: -60,
    right: -35,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(191,219,254,0.28)',
    bottom: 20,
    left: -24,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
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
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  logoImage: { width: 48, height: 48 },
  topActionBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
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
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 96,
    justifyContent: 'center',
  },
  statCardDark: {
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.16)',
  },
  topActionBtnDark: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.24)',
  },
  heroGuestBannerWrap: {
    marginTop: 12,
    marginBottom: 8,
  },
  bellIconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#173E80',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  statLabel: { color: '#5C6F91', fontSize: 10, fontWeight: '700', marginBottom: 5 },
  statLabelDark: { color: '#BFDBFE' },
  statValue: { color: '#13294B', fontSize: 16, fontWeight: '900' },
  statValueDark: { color: '#F8FAFC' },
  statHint: { color: '#6F819D', fontSize: 10.5, marginTop: 1, lineHeight: 14 },
  statHintDark: { color: '#CBD5E1' },
  tierIconChip: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTextStack: { marginTop: -1, paddingRight: 28 },
  body: { paddingHorizontal: 14, paddingTop: 18, paddingBottom: 18 },
  bannerCard: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#F7FBFF',
    ...createShadow({ color: '#0F172A', offsetY: 10, blur: 22, opacity: 0.16, elevation: 9 }),
  },
  bannerCardDark: {
    ...createShadow({ color: '#020617', offsetY: 10, blur: 22, opacity: 0.24, elevation: 9 }),
  },
  bannerImage: { width: '100%', height: '100%' },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 22,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D7E7FF' },
  dotDark: { backgroundColor: '#334155' },
  dotActive: { width: 28, backgroundColor: '#173E80' },
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
  kycLockBadge: {
    marginTop: 8,
    backgroundColor: '#EAF3FF',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  kycLockText: { fontSize: 10, fontWeight: '800', color: '#173E80' },
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
  filterChipDark: { backgroundColor: '#111827', borderColor: '#243043' },
  filterChipActive: {
    backgroundColor: '#173E80',
    borderColor: '#173E80',
  },
  filterChipText: { color: '#173E80', fontSize: 11.5, fontWeight: '800' },
  filterChipTextDark: { color: '#CBD5E1' },
  filterChipTextActive: { color: '#FFFFFF' },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { color: '#173E80', fontSize: 13, fontWeight: '800' },
  homeCatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
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
  productImageWrap: {
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(19,41,75,0.84)',
  },
  productBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  productShine: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.26)',
    top: -34,
    right: -22,
  },
  productInfo: { padding: 13 },
  productTitle: { color: '#152238', fontSize: 13, fontWeight: '800' },
  productTitleDark: { color: '#F8FAFC' },
  productSub: { color: '#70819C', fontSize: 11, marginTop: 4, lineHeight: 16, minHeight: 32 },
  productSubDark: { color: '#CBD5E1' },
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
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    display: 'none',
  },
  activityCardDark: {
    backgroundColor: '#111827',
  },
  activityTitle: { color: '#173E80', fontSize: 16, fontWeight: '900' },
  activityTitleDark: { color: '#F8FAFC' },
  activityCopy: { color: '#70819C', fontSize: 12.5, lineHeight: 19, marginTop: 8 },
  activityCopyDark: { color: '#CBD5E1' },
  // â”€â”€ Play Zone promo banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  playZoneCard: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#6A2F12',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 7,
  },
  playZoneCardDark: {
    shadowColor: '#1A0503',
    shadowOpacity: 0.45,
  },
  playZoneGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  playZoneBlob1: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -40,
    right: 60,
  },
  playZoneBlob2: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    right: -10,
  },
  playZoneLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  playZoneIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  playZoneTextBlock: {
    flex: 1,
    gap: 3,
  },
  playZoneBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  playZoneBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  playZoneBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  playZoneEyebrow: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  playZoneTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
  },
  playZoneSub: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  playZoneArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  playZoneArrowText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

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
  infoZone: { padding: 10, backgroundColor: '#FFFFFF' },
  infoZoneDark: { backgroundColor: '#111827' },
  label: { fontSize: 12, fontWeight: '800', color: '#152238', lineHeight: 16, marginBottom: 6 },
  labelDark: { color: '#F1F5F9' },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pillText: { fontSize: 10, fontWeight: '700' },
});



