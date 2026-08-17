import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import {
  hs,
  isShortDevice,
  isSmallDevice,
  isTablet,
  rf,
  screenHeight,
  screenWidth,
  ws,
} from '@/shared/hooks/useResponsive';
import { usePreferenceContext } from '@/shared/preferences';

export type UserRole = 'user' | 'dealer' | 'electrician';

interface MainSlideProps {
  onRoleSelect: (role: UserRole) => void;
}

type RoleCardConfig = {
  role: UserRole;
  label: string;
  subtitle: string;
  stat: string;
  statLabel: string;
  image: ImageSourcePropType;
  accent: string;
  deep: string;
  imageRight: number;
  imageWidth: string;
};

type FeatureBadgeConfig = {
  title: string;
  icon: 'shield' | 'award' | 'check' | 'target';
  accent: string;
};

const LOGO = require('../../../assets/srv-login-logo.png');
const DEALER = require('../../../assets/onboarding_card_dealer.png');
const ELECTRICIAN = require('../../../assets/onboarding_card_electrician.png');
const CUSTOMER = require('../../../assets/onboarding_card_customer.png');
const TOP_CORNER_LEFT = require('../../../assets/top_corner_left_ornament.png');
const TOP_CORNER_RIGHT = require('../../../assets/top_corner_right_ornament.png');

const PAGE_BG = '#F7F2EC';
const DARK_NAVY = '#071A38';
const GOLD = '#C9862C';
const SRV_RED = '#E9353F';
const isTinyDevice = screenHeight < 700;
const isComfortableDevice = screenHeight >= 820;

const CARD_DATA: RoleCardConfig[] = [
  {
    role: 'electrician',
    label: 'Electrician',
    subtitle: 'Scan QR. Earn rewards.',
    stat: '20,000+',
    statLabel: 'empowered',
    image: ELECTRICIAN,
    accent: '#F7B94B',
    deep: '#071A38',
    imageRight: -ws(20),
    imageWidth: '82%',
  },
  {
    role: 'dealer',
    label: 'Dealer',
    subtitle: 'Manage orders & benefits',
    stat: '1,000+',
    statLabel: 'trusted',
    image: DEALER,
    accent: '#6BBEFF',
    deep: '#0A2B65',
    imageRight: -ws(16),
    imageWidth: '80%',
  },
  {
    role: 'user',
    label: 'Customer',
    subtitle: 'Explore SRV products',
    stat: '5 Lakh+',
    statLabel: 'customers',
    image: CUSTOMER,
    accent: '#E69A5B',
    deep: '#4A210D',
    imageRight: -ws(18),
    imageWidth: '80%',
  },
];

const FEATURE_BADGES: FeatureBadgeConfig[] = [
  { title: 'TRUST', icon: 'shield', accent: '#173E80' },
  { title: 'QUALITY', icon: 'award', accent: '#C85A2C' },
  { title: 'DURABLE', icon: 'check', accent: '#188A2D' },
  { title: 'PRECISION', icon: 'target', accent: '#C7332F' },
];

function FeatureIcon({ icon, accent }: { icon: FeatureBadgeConfig['icon']; accent: string }) {
  const size = isTinyDevice ? ws(18) : ws(20);
  if (icon === 'shield') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M12 3L19 6V11.4C19 16 16.1 19.9 12 21C7.9 19.9 5 16 5 11.4V6L12 3Z" stroke={accent} strokeWidth="2" strokeLinejoin="round" />
        <Path d="M9.3 11.9L11.1 13.7L14.8 10" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (icon === 'award') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="9" r="5" stroke={accent} strokeWidth="2" />
        <Path d="M9 14.5L7 21L12 18.6L17 21L15 14.5" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <Circle cx="12" cy="9" r="1.6" fill={accent} />
      </Svg>
    );
  }

  if (icon === 'check') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="4" y="4" width="16" height="16" rx="8" stroke={accent} strokeWidth="2" />
        <Path d="M8.5 12.5L11 15L16 9.8" stroke={accent} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="7" stroke={accent} strokeWidth="2" />
      <Circle cx="12" cy="12" r="3" stroke={accent} strokeWidth="2" />
      <Circle cx="12" cy="12" r="1.5" fill={accent} />
      <Line x1="12" y1="2.5" x2="12" y2="5.2" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="12" y1="18.8" x2="12" y2="21.5" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="2.5" y1="12" x2="5.2" y2="12" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
      <Line x1="18.8" y1="12" x2="21.5" y2="12" stroke={accent} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function TopCornerOrnament({ side, top }: { side: 'left' | 'right'; top: number }) {
  const ornamentWidth = Math.min(ws(105), screenWidth * 0.25);
  const ornamentHeight = isTablet ? ornamentWidth * 0.44 : ornamentWidth * (230 / 300);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.cornerOrnamentWrap,
        side === 'right' ? styles.cornerOrnamentRight : styles.cornerOrnamentLeft,
        { top, width: ornamentWidth, height: ornamentHeight },
      ]}
    >
      <Image source={side === 'right' ? TOP_CORNER_RIGHT : TOP_CORNER_LEFT} resizeMode="stretch" style={styles.cornerOrnamentImage} />
    </View>
  );
}

function RoleCard({
  item,
  index,
  onPress,
  cardHeight,
  cardWidth,
}: {
  item: RoleCardConfig;
  index: number;
  onPress: () => void;
  cardHeight: number;
  cardWidth: number;
}) {
  const ctaSize = isTinyDevice ? Math.max(ws(36), 34) : ws(46);
  const ctaLeft = Math.round(cardWidth * 0.61 - ctaSize / 2);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continue as ${item.label}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.roleCardPressable,
        { height: cardHeight, opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
      ]}
    >
      <View style={[styles.roleCard, { borderColor: item.accent + '55' }]}>
        <Image
          source={item.image}
          resizeMode="cover"
          style={styles.roleVisual}
        />
        <View pointerEvents="none" style={[styles.roleSolidPanel, { backgroundColor: item.deep }]} />
        <LinearGradient
          colors={[item.deep, item.deep + 'FA', item.deep + 'B8', item.deep + '24', item.deep + '00']}
          locations={[0, 0.45, 0.58, 0.72, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View pointerEvents="none" style={styles.rolePhotoPolish} />
        <View style={styles.roleContent}>
          <View style={styles.roleHeaderRow}>
            <View style={[styles.orderBadge, { backgroundColor: item.accent }]}>
              <Text style={[styles.orderBadgeText, { color: item.deep }]}>{String(index + 1).padStart(2, '0')}</Text>
            </View>
            <Text style={styles.roleMiniLabel}>{index === 0 ? 'First choice' : index === 1 ? 'Business partner' : 'Product user'}</Text>
          </View>

          <View style={styles.roleBodyCopy}>
            <Text style={styles.roleLabel} numberOfLines={1}>{item.label}</Text>
            <Text style={styles.roleSubtitle} numberOfLines={1}>{item.subtitle}</Text>
          </View>

          <View style={styles.roleFooterRow}>
            <View style={[styles.statChip, { borderColor: item.accent + '99' }]}>
              <Text style={[styles.statValue, { color: item.accent }]} numberOfLines={1}>{item.stat}</Text>
              <Text style={styles.statLabel} numberOfLines={1}>{item.statLabel}</Text>
            </View>
          </View>
        </View>
        <LinearGradient
          colors={[item.accent, '#FFFFFF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.ctaCircle,
            {
              width: ctaSize,
              height: ctaSize,
              borderRadius: ctaSize / 2,
              left: ctaLeft,
              top: (cardHeight - ctaSize) / 2,
            },
          ]}
        >
          <Svg width={Math.round(ctaSize * 0.42)} height={Math.round(ctaSize * 0.42)} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12H19" stroke={item.deep} strokeWidth="2.7" strokeLinecap="round" />
            <Path d="M13 6L19 12L13 18" stroke={item.deep} strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

export default function MainSlide({ onRoleSelect }: MainSlideProps) {
  const insets = useSafeAreaInsets();
  const { darkMode } = usePreferenceContext();
  const safeTop = Math.max(insets.top, isTinyDevice ? hs(4) : hs(8));
  const safeBottom = Math.max(insets.bottom, hs(4));
  const cardHeight = isTinyDevice
    ? Math.max(hs(104), 92)
    : isShortDevice
      ? Math.max(hs(116), 104)
      : isComfortableDevice
        ? hs(126)
        : hs(118);
  const contentHorizontalPadding = isSmallDevice ? ws(14) : ws(18);
  const cardWidth = screenWidth - contentHorizontalPadding * 2;
  const logoHeight = isTinyDevice ? hs(48) : isShortDevice ? hs(54) : hs(60);
  const bg = darkMode ? '#07111F' : PAGE_BG;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.backgroundGlow, styles.backgroundGlowRed]} />
      <View style={[styles.backgroundGlow, styles.backgroundGlowBlue]} />
      <TopCornerOrnament side="left" top={safeTop} />
      <TopCornerOrnament side="right" top={safeTop} />

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          isSmallDevice ? styles.contentSmall : styles.contentRegular,
          { paddingTop: safeTop + hs(3), paddingBottom: safeBottom + hs(16) },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.logoCard, { height: logoHeight }]}>
          <Image source={LOGO} resizeMode="contain" style={[styles.logo, { height: logoHeight - hs(8) }]} />
        </View>

        <View style={styles.trustRow}>
          <View style={styles.trustLine} />
          <View style={styles.trustPill}>
            <Text style={styles.trustPillText} numberOfLines={1}>25 YEARS OF TRUST & IMPROVEMENT</Text>
          </View>
          <View style={styles.trustLine} />
        </View>

        <View style={styles.heroCopy}>
          <Text style={[styles.welcomeKicker, { color: darkMode ? '#F5C471' : GOLD }]} numberOfLines={1}>
            SRV Welcomes You
          </Text>
          <Text style={[styles.welcomeTitle, { color: darkMode ? '#F8FAFC' : DARK_NAVY }]} numberOfLines={1}>
            Select your SRV experience
          </Text>
          <Text style={[styles.welcomeSubtitle, { color: darkMode ? '#CBD5E1' : '#39445C' }]} numberOfLines={1}>
            North India&apos;s Largest Metal Box Manufacturer
          </Text>
        </View>

        <View style={styles.sectionTitleWrap}>
          <View style={styles.sectionRule} />
          <View style={[styles.sectionPill, { backgroundColor: darkMode ? '#111827' : '#FFF8EF' }]}>
            <View style={styles.sectionDot} />
            <Text style={[styles.sectionPillText, { color: darkMode ? '#F8FAFC' : DARK_NAVY }]} numberOfLines={1}>
              Choose Your Profile
            </Text>
            <View style={styles.sectionDot} />
          </View>
          <View style={styles.sectionRule} />
        </View>

        <View style={styles.profileStack}>
          {CARD_DATA.map((item, index) => (
            <RoleCard
              key={item.role}
              item={item}
              index={index}
              cardHeight={cardHeight}
              cardWidth={cardWidth}
              onPress={() => onRoleSelect(item.role)}
            />
          ))}
        </View>

        <View style={styles.featuresGrid}>
          {FEATURE_BADGES.map((badge) => (
            <View
              key={badge.title}
              style={[
                styles.featureCard,
                {
                  backgroundColor: darkMode ? 'rgba(15,23,42,0.88)' : '#FFFFFF',
                  borderColor: darkMode ? '#1E293B' : '#E8E1DB',
                },
              ]}
            >
              <FeatureIcon icon={badge.icon} accent={badge.accent} />
              <Text style={[styles.featureText, { color: darkMode ? '#E2E8F0' : '#1A2237' }]} numberOfLines={1}>
                {badge.title}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
    overflow: 'hidden',
  },
  backgroundGlow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.16,
  },
  backgroundGlowRed: {
    width: ws(190),
    height: ws(190),
    backgroundColor: SRV_RED,
    top: hs(110),
    left: -ws(105),
  },
  backgroundGlowBlue: {
    width: ws(225),
    height: ws(225),
    backgroundColor: '#173E80',
    bottom: -hs(95),
    right: -ws(118),
  },
  content: {
    flex: 1,
  },
  contentRegular: {
    paddingHorizontal: ws(18),
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: hs(8),
  },
  contentSmall: {
    paddingHorizontal: ws(14),
  },
  cornerOrnamentWrap: {
    position: 'absolute',
    overflow: 'hidden',
    zIndex: 1,
  },
  cornerOrnamentLeft: {
    left: 0,
  },
  cornerOrnamentRight: {
    right: 0,
  },
  cornerOrnamentImage: {
    width: '100%',
    height: '100%',
  },
  logoCard: {
    alignSelf: 'center',
    width: isSmallDevice ? ws(176) : ws(196),
    borderRadius: ws(22),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.11,
    shadowRadius: 16,
    elevation: 6,
    zIndex: 2,
  },
  logo: {
    width: isSmallDevice ? ws(150) : ws(168),
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(7),
  },
  trustLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D6B37A',
  },
  trustPill: {
    maxWidth: '74%',
    borderRadius: 999,
    paddingHorizontal: ws(10),
    paddingVertical: isTinyDevice ? hs(3) : hs(4),
    backgroundColor: '#FFF4DF',
    borderWidth: 1,
    borderColor: '#E7C17E',
  },
  trustPillText: {
    color: GOLD,
    fontSize: rf(8.4, 7.6, 9.6),
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  heroCopy: {
    alignItems: 'center',
  },
  welcomeKicker: {
    fontSize: rf(isTinyDevice ? 22 : 24, 20, 27),
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  welcomeTitle: {
    marginTop: hs(1),
    fontSize: rf(isTinyDevice ? 15 : 17, 14, 19),
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.25,
  },
  welcomeSubtitle: {
    marginTop: hs(2),
    fontSize: rf(isTinyDevice ? 10.2 : 11.4, 9.6, 12.6),
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(7),
  },
  sectionRule: {
    flex: 1,
    height: 1.3,
    backgroundColor: '#D8C6AF',
  },
  sectionPill: {
    borderRadius: 999,
    paddingHorizontal: ws(10),
    paddingVertical: isTinyDevice ? hs(4) : hs(5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(7),
    borderWidth: 1,
    borderColor: '#E9D7BF',
  },
  sectionDot: {
    width: ws(6),
    height: ws(6),
    borderRadius: ws(3),
    backgroundColor: GOLD,
  },
  sectionPillText: {
    fontSize: rf(10.4, 9.4, 11.4),
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.45,
  },
  profileStack: {
    gap: isTinyDevice ? hs(7) : hs(10),
  },
  roleCardPressable: {
    borderRadius: ws(20),
  },
  roleCard: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: ws(20),
    backgroundColor: '#071A38',
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.17,
    shadowRadius: 16,
    elevation: 8,
  },
  roleVisual: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
  },
  roleSolidPanel: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '53%',
  },
  rolePhotoPolish: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  roleContent: {
    flex: 1,
    width: '56%',
    paddingHorizontal: ws(13),
    paddingVertical: isTinyDevice ? hs(7) : hs(12),
    justifyContent: 'space-between',
    zIndex: 2,
  },
  roleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(7),
  },
  orderBadge: {
    minWidth: ws(32),
    height: isTinyDevice ? Math.max(hs(17), 17) : hs(21),
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ws(8),
  },
  orderBadgeText: {
    fontSize: rf(9, 8, 10.4),
    fontWeight: '900',
  },
  roleMiniLabel: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: rf(isTinyDevice ? 7.6 : 8.8, 7, 9.8),
    fontWeight: '900',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  roleBodyCopy: {
    gap: hs(1),
  },
  roleLabel: {
    color: '#FFFFFF',
    fontSize: rf(isTinyDevice ? 19 : 23, 18, 26),
    fontWeight: '900',
    lineHeight: rf(isTinyDevice ? 21 : 25, 20, 28),
    letterSpacing: -0.35,
  },
  roleSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: rf(isTinyDevice ? 8.4 : 10.2, 7.8, 11.4),
    fontWeight: '700',
    lineHeight: rf(isTinyDevice ? 10.4 : 12.8, 9.8, 14),
  },
  roleFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ws(8),
  },
  statChip: {
    maxWidth: '100%',
    borderLeftWidth: 2,
    paddingLeft: ws(7),
  },
  statValue: {
    fontSize: rf(isTinyDevice ? 15 : 19, 14, 22),
    fontWeight: '900',
    lineHeight: rf(isTinyDevice ? 17 : 21, 16, 24),
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: rf(isTinyDevice ? 6.8 : 7.6, 6.2, 8.6),
    fontWeight: '900',
    letterSpacing: 0.45,
    textTransform: 'uppercase',
  },
  ctaCircle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.76)',
    zIndex: 3,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: ws(7),
  },
  featureCard: {
    flex: 1,
    minHeight: isTinyDevice ? hs(44) : hs(50),
    borderRadius: ws(15),
    borderWidth: 1,
    paddingHorizontal: ws(5),
    paddingVertical: hs(6),
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(3),
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 11,
    elevation: 3,
  },
  featureText: {
    fontSize: rf(7.2, 6.4, 8.2),
    fontWeight: '900',
    textAlign: 'center',
  },
});
