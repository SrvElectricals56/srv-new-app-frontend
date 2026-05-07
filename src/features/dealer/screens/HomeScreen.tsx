import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import ProfileFlipCard from '@/shared/components/ProfileFlipCard';
import { TestimonialShowcase, type TestimonialItem } from '@/shared/components/TestimonialShowcase';
import { WebsitePromoSection } from '@/shared/components/WebsitePromoSection';
import { BannerCarousel, type BannerSlide as CarouselSlide } from '@/shared/components/BannerCarousel';
import { createShadow } from '@/shared/theme/shadows';
import { formatCountText, usePreferenceContext } from '@/shared/preferences';
import type { Screen } from '@/shared/types/navigation';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppData } from '@/shared/context/AppDataContext';

const logoImage = require('../../../../assets/banners/srv-logo.jpeg');
const guestHeroSlides: CarouselSlide[] = [
  {
    image: require('../../../../assets/banners/light.jpg.jpeg'),
    resizeMode: 'cover',
    backgroundColor: '#0F172A',
  },
  {
    image: require('../../../../assets/banners/mcb-box.jpg.jpeg'),
    resizeMode: 'cover',
    backgroundColor: '#0F172A',
  },
  {
    image: require('../../../../assets/banners/appliances.jpg.jpeg'),
    resizeMode: 'cover',
    backgroundColor: '#0F172A',
  },
];

const HOME_PRODUCT_ACCENTS: Record<string, readonly [string, string, string]> = {
  fanbox:       ['#FAFBFD', '#E9EEF5', '#D5DEE9'],
  concealedbox: ['#F8FBFD', '#E4EFF6', '#CCDDE9'],
  modular:      ['#FDFCFF', '#EDE9F8', '#DDD6F0'],
  mcb:          ['#F8FBFF', '#E0EEFF', '#C7DDFF'],
  busbar:       ['#FFFEF8', '#FEF3C7', '#FDE68A'],
  exhaust:      ['#F8FFF9', '#DCFCE7', '#BBF7D0'],
  led:          ['#FFFEF5', '#FEF9C3', '#FEF08A'],
  changeover:   ['#FDFCFF', '#EDE9FE', '#DDD6FE'],
  mainswitch:   ['#FFF8F9', '#FFE4E6', '#FECDD3'],
  louver:       ['#F8FFFD', '#CCFBF1', '#99F6E4'],
};

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

function PhoneIcon({ color = '#A34A13', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.2 4.8h2.4l1.1 3.4-1.5 1.5a14.8 14.8 0 005.1 5.1l1.5-1.5 3.4 1.1v2.4a1.5 1.5 0 01-1.5 1.5A14.9 14.9 0 014.2 6.3 1.5 1.5 0 015.7 4.8h1.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WalletIcon({ color = '#7A4D14', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="13" rx="2.4" stroke={color} strokeWidth={2} />
      <Path d="M15.5 11.5H21V16h-5.5a2.25 2.25 0 010-4.5z" stroke={color} strokeWidth={2} />
      <Circle cx="16.8" cy="13.75" r="1.05" fill={color} />
    </Svg>
  );
}

function TierBadgeIcon({ tier, size = 24 }: { tier: string; size?: number }) {
  const colorMap: Record<string, { ring: string; fill: string; accent: string }> = {
    Silver: { ring: '#94A3B8', fill: '#E2E8F0', accent: '#64748B' },
    Gold: { ring: '#D97706', fill: '#FEF3C7', accent: '#B45309' },
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

function WhatsAppIcon({ color = '#1A8F58', size = 22 }: { color?: string; size?: number }) {
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

function FeaturedProductImage({ uri, size }: { uri: string; size: number }) {
  const floatY = useRef(new Animated.Value(0)).current;
  const imgScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(
          floatY,
          withWebSafeNativeDriver({
            toValue: -7,
            duration: 1500,
            easing: Easing.inOut(Easing.sin),
          })
        ),
        Animated.timing(
          floatY,
          withWebSafeNativeDriver({
            toValue: 0,
            duration: 1500,
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
            toValue: 1.04,
            duration: 2100,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        Animated.timing(
          imgScale,
          withWebSafeNativeDriver({
            toValue: 1,
            duration: 2100,
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

function FeaturedCard({
  title,
  subtitle,
  image,
  width,
  accent,
  badge,
  onPress,
}: {
  title: string;
  subtitle: string;
  image: string;
  width: number;
  accent: readonly [string, string, string];
  badge: string;
  onPress: () => void;
}) {
  const { darkMode } = usePreferenceContext();
  const pressScale = useRef(new Animated.Value(1)).current;
  const tilt = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(
        pressScale,
        withWebSafeNativeDriver({
          toValue: 0.97,
          tension: 115,
          friction: 8,
        })
      ),
      Animated.spring(tilt, withWebSafeNativeDriver({ toValue: 1, tension: 115, friction: 8 })),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(
        pressScale,
        withWebSafeNativeDriver({ toValue: 1, tension: 115, friction: 8 })
      ),
      Animated.spring(tilt, withWebSafeNativeDriver({ toValue: 0, tension: 115, friction: 8 })),
    ]).start();
  };

  const rotateY = tilt.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '4deg'] });

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.productCard,
          darkMode ? styles.productCardDark : null,
          {
            width,
            transform: [{ scale: pressScale }, { perspective: 900 }, { rotateY }],
          },
        ]}
      >
        <LinearGradient
          colors={accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.productImageWrap}
        >
          <View style={styles.productBadge}>
            <Text style={styles.productBadgeText}>{badge}</Text>
          </View>
          <View style={styles.productShine} />
          <FeaturedProductImage uri={image} size={width + 6} />
        </LinearGradient>
        <View style={styles.productInfo}>
          <Text
            style={[styles.productTitle, darkMode ? styles.productTitleDark : null]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[styles.productSub, darkMode ? styles.productSubDark : null]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        </View>
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
      gradient: ['#FFF4D8', '#FFE6A8', '#FFD375'] as [string, string, string],
      accent: '#B45309',
      chip: '#FFF8E6',
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
  const { products: ctxProducts, banners: ctxBanners, testimonials: ctxTestimonials, appSettings } = useAppData();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const statPulse = useRef(new Animated.Value(1)).current;
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectedCount = authUser?.electricianCount ?? 0;
  const tier = useMemo(() => getTier(connectedCount), [connectedCount]);
  const cardW = (width - 28 - 12) / 2;
  const heroImageHeight = Math.round((width - 28) * 0.56);
  const productFilters = ['All', 'Boxes', 'Fans'] as const;
  const [selectedFilter, setSelectedFilter] = useState<(typeof productFilters)[number]>('All');
  const [apiBannerSlides, setApiBannerSlides] = useState<CarouselSlide[]>([]);
  const [supportWhatsapp, setSupportWhatsapp] = useState('918837684004');

  // Map banners from context — prefetch all images first, then set slides
  useEffect(() => {
    const filtered = ctxBanners.filter(
      (b) => b.isActive !== false && (b as any).status !== 'inactive' && b.imageUrl,
    );
    const mapped = filtered.map((b) => ({
      image: { uri: b.imageUrl! },
      resizeMode: 'cover' as const,
      backgroundColor: b.bgColor ?? '#192F67',
    }));
    const uris = mapped.map((b) => b.image.uri);
    Promise.all(uris.map((uri) => Image.prefetch(uri).catch(() => null))).finally(() => {
      setApiBannerSlides(mapped);
    });
  }, [ctxBanners]);

  // App settings from context
  useEffect(() => {
    if (appSettings?.whatsappNumber) setSupportWhatsapp(appSettings.whatsappNumber);
  }, [appSettings]);

  const activeBannerSlides = apiBannerSlides;

  const filteredProducts = useMemo(() => {
    const items = ctxProducts.slice(0, 4);
    if (selectedFilter === 'Boxes') {
      return items.filter((product) => {
        const source = `${product.name} ${product.sub ?? ''}`.toLowerCase();
        return source.includes('box');
      });
    }
    if (selectedFilter === 'Fans') {
      return items.filter((product) => {
        const source = `${product.name} ${product.sub ?? ''}`.toLowerCase();
        return source.includes('fan');
      });
    }
    return items;
  }, [selectedFilter, ctxProducts]);
  const dealerTestimonials = useMemo<TestimonialItem[]>(() => {
    if (ctxTestimonials.length === 0) {
      return [];
    }
    if (ctxTestimonials.length > 0) {
      return ctxTestimonials.map((t) => ({
        initials: t.initials ?? t.personName.slice(0, 2).toUpperCase(),
        name: t.personName,
        location: t.location ?? '',
        tier: t.tier ?? '',
        yearsWithUs: `Connected for ${t.yearsConnected} year${t.yearsConnected !== 1 ? 's' : ''}`,
        quote: t.quote,
        highlight: t.highlight ?? '',
        colors: (t.gradientColors?.slice(0, 3) ?? ['#FFF7E6', '#FDE6B4', '#F6C96E']) as [string, string, string],
        ring: t.ringColor ?? '#D97706',
        glow: t.gradientColors?.[0] ?? '#FFE7BA',
      }));
    }
    return [];
  }, [language, ctxTestimonials]);

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

  const quickActions = [
    {
      testID: 'dealer-home-action-electricians',
      accessibilityLabel: 'Dealer home quick action associate electrician',
      title: tx('Associate Electrician'),
      sub: formatCountText(language, connectedCount, 'connected', 'जुड़े हुए', 'ਜੁੜੇ ਹੋਏ'),
      icon: UserPlusIcon,
      iconColors: ['#E8F1FF', '#CFE0FF'] as const,
      iconTint: '#0F4BA8',
      onPress: () => {
        const kyc = authUser?.kycStatus;
        if (kyc !== 'verified') {
          Alert.alert(
            tx('KYC Required'),
            tx('Please complete your KYC verification to access Associate Electrician. Contact your SRV admin to get verified.'),
            [{ text: tx('OK') }]
          );
          return;
        }
        onNavigate('electricians');
      },
    },
    {
      testID: 'dealer-home-action-wallet',
      accessibilityLabel: 'Dealer home quick action wallet',
      title: tx('Wallet'),
      sub: tx('Payout and history'),
      icon: WalletIcon,
      iconColors: ['#FFF3DB', '#FFE1B0'] as const,
      iconTint: '#9A5A0E',
      onPress: () => {
        const kyc = authUser?.kycStatus;
        if (kyc !== 'verified') {
          Alert.alert(
            tx('KYC Required'),
            tx('Please complete your KYC verification to access Wallet. Contact your SRV admin to get verified.'),
            [{ text: tx('OK') }]
          );
          return;
        }
        onNavigate('wallet');
      },
    },
    {
      testID: 'dealer-home-action-call-electrician',
      accessibilityLabel: 'Dealer home quick action call electrician',
      title: tx('Call Electrician'),
      sub: tx('Reach your network'),
      icon: PhoneIcon,
      iconColors: ['#FFF0EA', '#FFD2C4'] as const,
      iconTint: '#B14B16',
      onPress: () => onNavigate('call_electrician'),
    },
    {
      testID: 'dealer-home-action-whatsapp',
      accessibilityLabel: 'Dealer home quick action WhatsApp support',
      title: tx('WhatsApp'),
      sub: tx('Business support'),
      icon: WhatsAppIcon,
      iconColors: ['#E8FFF1', '#C6F3D8'] as const,
      iconTint: '#1A8F58',
      onPress: () =>
        Linking.openURL(
          `https://wa.me/${supportWhatsapp}?text=Hello%20SRV%20Team,%20I%20need%20dealer%20support`
        ),
    },
  ];

  return (
    <ScrollView
      style={[styles.screen, darkMode ? styles.screenDark : null]}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={darkMode ? ['#0B1220', '#101A2F', '#18263E'] : ['#FFF8EC', '#FDEFD2', '#FFF6E8']}
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
                  darkMode ? ['#0F172A', '#132238', '#1E293B'] : ['#E8F1FF', '#D7E7FF', '#CEE0FF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.statCard, darkMode ? styles.statCardDark : null]}
              >
                <Text style={[styles.statLabel, darkMode ? styles.statLabelDark : null]}>
                  {tx('Call Electrician')}
                </Text>
                <Text style={[styles.statValue, darkMode ? styles.statValueDark : null]}>
                  {formatCountText(language, connectedCount, 'contacts', 'कॉन्टैक्ट्स', 'ਸੰਪਰਕ')}
                </Text>
                <Text style={[styles.statHint, darkMode ? styles.statHintDark : null]}>
                  {tx('Open phone and WhatsApp actions')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

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
                          'अगले ग्रेड के लिए और इलेक्ट्रीशियन',
                          'ਅਗਲੇ ਗ੍ਰੇਡ ਲਈ ਹੋਰ ਇਲੈਕਟ੍ਰੀਸ਼ਨ'
                        )
                      : tx('Top dealer grade unlocked')}
                  </Text>
                </View>
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
            slides={activeBannerSlides}
            height={heroImageHeight}
            darkMode={darkMode}
          />
        ) : null}

        <View style={styles.quickGrid}>
          {quickActions.map((item) => {
            const Icon = item.icon;
            const isKycLocked = (item.testID === 'dealer-home-action-electricians' || item.testID === 'dealer-home-action-wallet') && authUser?.kycStatus !== 'verified';
            return (
              <TouchableOpacity
                key={item.title}
                style={[styles.quickCard, darkMode ? styles.quickCardDark : null, { width: cardW, opacity: isKycLocked ? 0.75 : 1 }]}
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
                  {isKycLocked ? tx('Complete KYC to unlock') : item.sub}
                </Text>
                {isKycLocked && (
                  <View style={styles.kycLockBadge}>
                    <Text style={styles.kycLockText}>🔒 {tx('KYC Required')}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, darkMode ? styles.sectionEyebrowDark : null]}>
              {tx('Catalog')}
            </Text>
            <Text style={[styles.sectionTitle, darkMode ? styles.sectionTitleDark : null]}>
              {tx('Featured products')}
            </Text>
          </View>
        </View>

        <View style={styles.productsTopBar}>
          <View style={styles.filterRow}>
            {productFilters.map((filter) => {
              const active = selectedFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setSelectedFilter(filter)}
                  style={[
                    styles.filterChip,
                    darkMode ? styles.filterChipDark : null,
                    active && styles.filterChipActive,
                  ]}
                  activeOpacity={0.86}
                >
                  {filter === 'All' ? (
                    <FilterIcon
                      color={active ? '#FFFFFF' : darkMode ? '#CBD5E1' : '#173E80'}
                      size={15}
                    />
                  ) : null}
                  <Text
                    style={[
                      styles.filterChipText,
                      darkMode ? styles.filterChipTextDark : null,
                      active && styles.filterChipTextActive,
                    ]}
                  >
                    {tx(filter)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={() => onNavigate('product')}
            style={styles.inlineAction}
            activeOpacity={0.85}
          >
            <Text style={styles.viewAllText}>{tx('View all')}</Text>
            <ChevronRight />
          </TouchableOpacity>
        </View>

        <View style={styles.productsGrid}>
          {filteredProducts.map((product, index) => {
            return (
              <FeaturedCard
                key={product.id}
                title={product.name}
                subtitle={product.sub ?? ''}
                image={product.image ?? ''}
                width={cardW}
                accent={
                  HOME_PRODUCT_ACCENTS[product.category] ??
                  (index % 2 === 0
                    ? HOME_PRODUCT_ACCENTS.fanbox
                    : HOME_PRODUCT_ACCENTS.concealedbox)
                }
                badge={tx(index % 2 === 0 ? 'Top Pick' : 'Hot Deal')}
                onPress={() => onOpenProductCategory(product.category)}
              />
            );
          })}
        </View>

        <TestimonialShowcase
          eyebrow={
            language === 'Hindi'
              ? 'डीलर की राय'
              : language === 'Punjabi'
                ? 'ਡੀਲਰ ਦੀ ਰਾਇ'
                : 'Dealer Testimonials'
          }
          title={
            language === 'Hindi'
              ? 'हमारे डीलर क्या कहते हैं'
              : language === 'Punjabi'
                ? 'ਸਾਡੇ ਡੀਲਰ ਕੀ ਕਹਿੰਦੇ ਹਨ'
                : 'What Dealers Say'
          }
          subtitle={
            language === 'Hindi'
              ? 'रियल नेटवर्क पार्टनर्स की राय, जिन्होंने एसआरवी के साथ बिजनेस को और मजबूत बनाया।'
              : language === 'Punjabi'
                ? 'ਅਸਲ ਨੈੱਟਵਰਕ ਪਾਰਟਨਰਾਂ ਦੀ ਰਾਇ, ਜਿਨ੍ਹਾਂ ਨੇ SRV ਨਾਲ ਆਪਣਾ ਕਾਰੋਬਾਰ ਹੋਰ ਮਜ਼ਬੂਤ ਕੀਤਾ।'
                : 'Real partner feedback from dealers who are growing faster with SRV.'
          }
          items={dealerTestimonials}
          darkMode={darkMode}
        />

        <WebsitePromoSection darkMode={darkMode} />

        <View style={[styles.activityCard, darkMode ? styles.activityCardDark : null]}>
          <Text style={[styles.activityTitle, darkMode ? styles.activityTitleDark : null]}>
            {tx('Dealer Growth')}
          </Text>
          <Text style={[styles.activityCopy, darkMode ? styles.activityCopyDark : null]}>
            {language === 'Hindi'
              ? `डीलर नेटवर्क लगातार बढ़ रहा है और ${connectedCount} जुड़े हुए इलेक्ट्रीशियन हैं। अपने नेटवर्क को मैनेज और बढ़ाने के लिए इलेक्ट्रीशियन पेज खोलें।`
              : language === 'Punjabi'
                ? `ਡੀਲਰ ਨੈੱਟਵਰਕ ਲਗਾਤਾਰ ਵੱਧ ਰਿਹਾ ਹੈ ਅਤੇ ${connectedCount} ਜੁੜੇ ਹੋਏ ਇਲੈਕਟ੍ਰੀਸ਼ਨ ਹਨ। ਆਪਣੇ ਨੈੱਟਵਰਕ ਨੂੰ ਸੰਭਾਲਣ ਅਤੇ ਵਧਾਉਣ ਲਈ ਇਲੈਕਟ੍ਰੀਸ਼ਨ ਪੇਜ ਖੋਲ੍ਹੋ।`
                : `Dealer network is growing steadily with ${connectedCount} associated electricians. Use the electricians page to manage and expand your dealer network.`}
          </Text>
        </View>

        <View style={{ height: Math.max(30, insets.bottom + 18) }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF8EC' },
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
    backgroundColor: 'rgba(217,119,6,0.14)',
    top: -60,
    right: -35,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(245,158,11,0.12)',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  logoWrapDark: {
    backgroundColor: 'rgba(15,23,42,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
  },
  logoImage: { width: 64, height: 64 },
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
    marginTop: 8,
    marginBottom: 4,
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
    backgroundColor: '#D97706',
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
    backgroundColor: '#F4E4C4',
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
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E7D3B0' },
  dotDark: { backgroundColor: '#334155' },
  dotActive: { width: 28, backgroundColor: '#8A5A12' },
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
  kycLockBadge: {
    marginTop: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  kycLockText: { fontSize: 10, fontWeight: '800', color: '#92400E' },
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
    backgroundColor: '#8A5A12',
    borderColor: '#8A5A12',
  },
  filterChipText: { color: '#8A5A12', fontSize: 11.5, fontWeight: '800' },
  filterChipTextDark: { color: '#CBD5E1' },
  filterChipTextActive: { color: '#FFFFFF' },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAllText: { color: '#8A5A12', fontSize: 13, fontWeight: '800' },
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
});
