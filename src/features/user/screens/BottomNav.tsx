import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { Screen } from '@/shared/types/navigation';
import { useResponsive } from '@/shared/hooks';
import { useAppData } from '@/shared/context/AppDataContext';
import {
  getAllowedBottomNavScreens,
  resolveRolePageControls,
} from '@/shared/config/rolePageControls';

// Customer theme colors matching Customer_Slide
const BROWN_PRIMARY = '#6A2F12';
const BROWN_SECONDARY = '#8D4A1E';
type NavControlConfig = {
  id: Screen;
  label: string;
  testID: string;
  accessibilityLabel: string;
};

function HomeIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M9 21V12h6v9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="16" rx="4" stroke={color} strokeWidth={2} />
      <Path d="M10 9v6l5-3-5-3z" fill={color} />
    </Svg>
  );
}

function CartIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path d="M3 6h18" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M16 10a4 4 0 01-8 0"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function WalletIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="6"
        width="18"
        height="12"
        rx="3"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M16 10h5v4h-5a2 2 0 010-4z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx="17.5" cy="12" r="0.8" fill={color} />
    </Svg>
  );
}

function ProfileIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.2" r="3.5" stroke={color} strokeWidth={2} />
      <Path
        d="M5 19.2c1.52-3.02 4.12-4.53 7-4.53 2.88 0 5.48 1.5 7 4.53"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CategoriesIcon({ size = 32, compact = false }: { size?: number; compact?: boolean }) {
  const s = compact ? size * 0.80 : size * 0.84;
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      {/* Top-left cell — filled accent */}
      <Rect x="3" y="3" width="8" height="8" rx="2.2"
        fill="rgba(255,255,255,0.92)" />
      {/* Top-right cell — outlined */}
      <Rect x="13" y="3" width="8" height="8" rx="2.2"
        fill="rgba(255,255,255,0.35)"
        stroke="rgba(255,255,255,0.8)" strokeWidth={1.4} />
      {/* Bottom-left cell — outlined */}
      <Rect x="3" y="13" width="8" height="8" rx="2.2"
        fill="rgba(255,255,255,0.35)"
        stroke="rgba(255,255,255,0.8)" strokeWidth={1.4} />
      {/* Bottom-right cell — filled accent */}
      <Rect x="13" y="13" width="8" height="8" rx="2.2"
        fill="rgba(255,255,255,0.92)" />
    </Svg>
  );
}

function CategoriesButton({
  isActive,
  onPress,
  compact = false,
}: {
  isActive: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const { tx } = usePreferenceContext();
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.5)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0.3)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const btnSize = compact ? 48 : 60;
  const ringSize = compact ? 48 : 60;
  const ringTop = compact ? -16 : -22;

  useEffect(() => {
    const makeRingAnim = (scale: Animated.Value, opacity: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, withWebSafeNativeDriver({ toValue: 1.4, duration: 900, easing: Easing.out(Easing.ease) })),
            Animated.timing(opacity, withWebSafeNativeDriver({ toValue: 0, duration: 900 })),
          ]),
          Animated.parallel([
            Animated.timing(scale, withWebSafeNativeDriver({ toValue: 1, duration: 0 })),
            Animated.timing(opacity, withWebSafeNativeDriver({ toValue: 0.5, duration: 0 })),
          ]),
          Animated.delay(200),
        ])
      );

    makeRingAnim(ring1Scale, ring1Opacity, 0).start();
    makeRingAnim(ring2Scale, ring2Opacity, 450).start();
  }, [ring1Opacity, ring1Scale, ring2Opacity, ring2Scale]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(btnScale, withWebSafeNativeDriver({ toValue: 0.87, duration: 80 })),
      Animated.spring(btnScale, withWebSafeNativeDriver({ toValue: 1, tension: 200, friction: 7 })),
    ]).start();
    onPress();
  };

  return (
    <View style={[catStyles.wrapper, compact && catStyles.wrapperCompact]}>
      <Animated.View style={[catStyles.ring, compact && catStyles.ringCompact, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity, top: ringTop, width: ringSize, height: ringSize }]} />
      <Animated.View style={[catStyles.ring, compact && catStyles.ringCompact, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity, top: ringTop, width: ringSize, height: ringSize }]} />

      <Pressable
        onPress={handlePress}
        testID="user-bottom-nav-categories"
        accessible
        accessibilityRole="button"
        accessibilityLabel="User bottom navigation categories"
        accessibilityState={{ selected: isActive }}
        style={[catStyles.pressArea, compact && catStyles.pressAreaCompact, { marginTop: compact ? -14 : -20 }]}
      >
        <Animated.View
          style={[
            catStyles.btnWrap,
            compact && catStyles.btnWrapCompact,
            { transform: [{ scale: btnScale }], width: btnSize, height: btnSize },
          ]}
        >
          <LinearGradient
            colors={[BROWN_PRIMARY, BROWN_SECONDARY, '#A65D2E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[catStyles.btn, compact && catStyles.btnCompact, { width: btnSize, height: btnSize }]}
          >
            <CategoriesIcon size={compact ? 26 : 30} compact={compact} />
          </LinearGradient>
        </Animated.View>
      </Pressable>

      <Text style={[catStyles.label, isActive && catStyles.labelActive, compact && catStyles.labelCompact]}>
        {tx('Products')}
      </Text>
    </View>
  );
}

const catStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', width: 72 },
  wrapperCompact: { width: 60 },
  ring: {
    position: 'absolute',
    top: -22,
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: BROWN_SECONDARY,
    zIndex: 0,
  },
  ringCompact: { borderRadius: 14 },
  pressArea: { marginTop: -20, marginBottom: 5, zIndex: 1 },
  pressAreaCompact: { marginBottom: 3 },
  btn: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: BROWN_PRIMARY, offsetY: 5, blur: 12, opacity: 0.5, elevation: 12 }),
  },
  btnWrap: { borderRadius: 18 },
  btnWrapCompact: { borderRadius: 14 },
  btnCompact: {
    borderRadius: 14,
    ...createShadow({ color: BROWN_PRIMARY, offsetY: 5, blur: 8, opacity: 0.5, elevation: 12 }),
  },
  label: { fontSize: 10, fontWeight: '800', color: '#9E9189', letterSpacing: 0.5, marginTop: 1 },
  labelActive: { color: BROWN_PRIMARY },
  labelCompact: { fontSize: 8 },
});

function NavTab({
  id, label, active, onPress, testID, accessibilityLabel, compact = false,
}: {
  id: Screen; label: string; active: boolean; onPress: () => void;
  testID: string; accessibilityLabel: string; compact?: boolean;
}) {
  const iconColor = active ? BROWN_PRIMARY : '#8F8A79';
  const tabScale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(tabScale, withWebSafeNativeDriver({ toValue: 0.82, duration: 70 })),
      Animated.spring(tabScale, withWebSafeNativeDriver({ toValue: 1, tension: 200, friction: 7 })),
    ]).start();
    onPress();
  };

  const renderIcon = () => {
    const iconSize = compact ? 20 : 24;
    switch (id) {
      case 'home': return <HomeIcon color={iconColor} size={iconSize} />;
      case 'play': return <PlayIcon color={iconColor} size={iconSize} />;
      case 'cart': return <CartIcon color={iconColor} size={iconSize} />;
      case 'wallet': return <WalletIcon color={iconColor} size={iconSize} />;
      case 'profile': return <ProfileIcon color={iconColor} size={iconSize} />;
      default: return null;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      testID={testID}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      style={[styles.tab, compact && styles.tabCompact]}
    >
      <Animated.View
        style={[
          styles.iconWrap,
          active && styles.iconWrapActive,
          compact && styles.iconWrapCompact,
          { transform: [{ scale: tabScale }] },
        ]}
      >
        {renderIcon()}
      </Animated.View>
      <Text style={[styles.label, active && styles.labelActive, compact && styles.labelCompact]}>
        {label}
      </Text>
    </Pressable>
  );
}

const LEFT: NavControlConfig[] = [
  { id: 'home', label: 'Home', testID: 'user-bottom-nav-home', accessibilityLabel: 'User bottom navigation home' },
  { id: 'play', label: 'Play', testID: 'user-bottom-nav-play', accessibilityLabel: 'User bottom navigation play' },
];

const RIGHT: NavControlConfig[] = [
  { id: 'wallet', label: 'Wallet', testID: 'user-bottom-nav-wallet', accessibilityLabel: 'User bottom navigation wallet' },
  { id: 'profile', label: 'Account', testID: 'user-bottom-nav-profile', accessibilityLabel: 'User bottom navigation profile' },
];

export function BottomNav({
  currentScreen,
  onNavigate,
}: {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  const { darkMode, tx } = usePreferenceContext();
  const { appSettings } = useAppData();
  const insets = useSafeAreaInsets();
  const { wp, isSmallDevice, isShortDevice } = useResponsive();
  const rolePageControls = useMemo(
    () => resolveRolePageControls(appSettings?.rolePageControls),
    [appSettings?.rolePageControls]
  );
  const allowedScreens = useMemo(
    () => new Set(getAllowedBottomNavScreens(rolePageControls, 'user', ['home', 'play', 'categories', 'wallet', 'profile'])),
    [rolePageControls]
  );
  const leftItems = useMemo(() => LEFT.filter((item) => allowedScreens.has(item.id)), [allowedScreens]);
  const rightItems = useMemo(() => RIGHT.filter((item) => allowedScreens.has(item.id)), [allowedScreens]);
  const bottomPad = isShortDevice ? Math.max(insets.bottom, 4) : isSmallDevice ? Math.max(insets.bottom, 6) : Math.max(insets.bottom, 8);
  const topPad = isShortDevice ? 6 : 10;

  return (
    <LinearGradient
      colors={darkMode ? ['#0F172A', '#111827', '#0F172A'] : ['#FBF1E7', '#F5E8DC', '#F0DEC9']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.wrap,
        darkMode ? styles.wrapDark : null,
        { paddingBottom: bottomPad, paddingTop: topPad, paddingHorizontal: wp(8), minHeight: isShortDevice ? 52 : 54 },
      ]}
    >
      <View style={styles.side}>
        {leftItems.map((item) => (
          <NavTab
            key={item.id}
            id={item.id}
            label={tx(item.label)}
            active={currentScreen === item.id}
            onPress={() => onNavigate(item.id)}
            testID={item.testID}
            accessibilityLabel={item.accessibilityLabel}
            compact={isShortDevice}
          />
        ))}
      </View>

      {allowedScreens.has('categories') ? (
        <CategoriesButton
          isActive={currentScreen === 'categories'}
          onPress={() => onNavigate('categories')}
          compact={isShortDevice}
        />
      ) : null}

      <View style={styles.side}>
        {rightItems.map((item) => (
          <NavTab
            key={item.id}
            id={item.id}
            label={tx(item.label)}
            active={currentScreen === item.id}
            onPress={() => onNavigate(item.id)}
            testID={item.testID}
            accessibilityLabel={item.accessibilityLabel}
            compact={isShortDevice}
          />
        ))}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5D4C1',
    ...createShadow({ color: BROWN_PRIMARY, offsetY: -4, blur: 14, opacity: 0.15, elevation: 12 }),
  },
  wrapDark: {
    backgroundColor: '#0F172A',
    borderTopColor: '#243043',
    ...createShadow({ color: '#020617', offsetY: -4, blur: 14, opacity: 0.08, elevation: 12 }),
  },
  side: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 50 },
  tabCompact: { minWidth: 44 },
  iconWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  iconWrapActive: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(240,222,201,0.85)',
  },
  iconWrapCompact: { width: 20, height: 20 },
  label: { fontSize: 9, fontWeight: '600', color: '#8F8A79', marginTop: 2 },
  labelCompact: { fontSize: 8, marginTop: 1 },
  labelActive: { color: BROWN_PRIMARY, fontWeight: '800' },
});

