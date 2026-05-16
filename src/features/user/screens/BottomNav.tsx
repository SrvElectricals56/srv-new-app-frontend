import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { Screen } from '@/shared/types/navigation';
import { useResponsive } from '@/shared/hooks';

// Customer theme colors matching Customer_Slide
const BROWN_PRIMARY = '#6A2F12';
const BROWN_SECONDARY = '#8D4A1E';
const BROWN_LIGHT = '#FBF1E7';

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

function ProductIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
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
  const lidAngle  = useRef(new Animated.Value(0)).current;
  const floatY    = useRef(new Animated.Value(0)).current;
  const floatO    = useRef(new Animated.Value(0)).current;
  const starScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const sequence = Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(lidAngle, withWebSafeNativeDriver({ toValue: 1, duration: 400, easing: Easing.out(Easing.cubic) })),
        Animated.parallel([
          Animated.timing(floatY,    withWebSafeNativeDriver({ toValue: 0, duration: 0 })),
          Animated.timing(floatO,    withWebSafeNativeDriver({ toValue: 0, duration: 0 })),
          Animated.timing(starScale, withWebSafeNativeDriver({ toValue: 0, duration: 0 })),
        ]),
        Animated.parallel([
          Animated.spring(starScale, withWebSafeNativeDriver({ toValue: 1, tension: 180, friction: 6 })),
          Animated.timing(floatO,    withWebSafeNativeDriver({ toValue: 1, duration: 200 })),
          Animated.timing(floatY,    withWebSafeNativeDriver({ toValue: -8, duration: 700, easing: Easing.out(Easing.cubic) })),
        ]),
        Animated.timing(floatY, withWebSafeNativeDriver({ toValue: -10, duration: 350, easing: Easing.inOut(Easing.sin) })),
        Animated.timing(floatY, withWebSafeNativeDriver({ toValue: -8,  duration: 350, easing: Easing.inOut(Easing.sin) })),
        Animated.parallel([
          Animated.timing(floatO,    withWebSafeNativeDriver({ toValue: 0, duration: 300 })),
          Animated.timing(starScale, withWebSafeNativeDriver({ toValue: 0, duration: 250 })),
          Animated.timing(lidAngle,  withWebSafeNativeDriver({ toValue: 0, duration: 400, easing: Easing.in(Easing.cubic) })),
        ]),
        Animated.delay(400),
      ])
    );
    sequence.start();
    return () => sequence.stop();
  }, [lidAngle, floatY, floatO, starScale]);

  const lidLeftOpacity  = lidAngle.interpolate({ inputRange: [0, 1], outputRange: [0.7,  0.25] });
  const lidRightOpacity = lidAngle.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0.35] });
  const lidLeftY        = lidAngle.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const lidRightY       = lidAngle.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });

  const s = size;

  return (
    <View style={{ width: s, height: s + 6, alignItems: 'center', justifyContent: 'center' }}>

      {/* Star popping out */}
      <Animated.View style={{
        position: 'absolute', top: 2, alignItems: 'center',
        opacity: floatO,
        transform: [{ translateY: floatY }, { scale: starScale }],
      }}>
        <Svg width={s * 0.38} height={s * 0.38} viewBox="0 0 20 20" fill="none">
          <Path
            d="M10 1L12.5 7.5L19.5 7.5L14 12L16 19L10 15L4 19L6 12L0.5 7.5L7.5 7.5Z"
            fill="rgba(255,255,255,0.95)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={0.6}
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>

      {/* Main box body */}
      <Svg width={s * 1.05} height={s * 1.05} viewBox="0 0 30 30" fill="none"
        style={{ position: 'absolute', bottom: -4 }}>
        <Path d="M3 13V22L13 27.5V18.5L3 13Z"
          fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.9)" strokeWidth={1.2} strokeLinejoin="round" />
        <Path d="M27 13V22L17 27.5V18.5L27 13Z"
          fill="rgba(255,255,255,0.45)" stroke="rgba(255,255,255,0.9)" strokeWidth={1.2} strokeLinejoin="round" />
        <Path d="M13 27.5L17 27.5" stroke="rgba(255,255,255,0.9)" strokeWidth={1.2} strokeLinecap="round" />
        <Path d="M3 13L15 7L27 13" stroke="white" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M15 13V18.5" stroke="rgba(255,255,255,0.6)" strokeWidth={1} strokeLinecap="round" />
      </Svg>

      {/* Left lid */}
      <Animated.View style={{
        position: 'absolute', bottom: -4, width: s * 1.05, height: s * 1.05,
        opacity: lidLeftOpacity, transform: [{ translateY: lidLeftY }],
      }}>
        <Svg width={s * 1.05} height={s * 1.05} viewBox="0 0 30 30" fill="none">
          <Path d="M3 13L13 8.5L15 13L3 17.5Z"
            fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.9)" strokeWidth={1.2} strokeLinejoin="round" />
        </Svg>
      </Animated.View>

      {/* Right lid */}
      <Animated.View style={{
        position: 'absolute', bottom: -4, width: s * 1.05, height: s * 1.05,
        opacity: lidRightOpacity, transform: [{ translateY: lidRightY }],
      }}>
        <Svg width={s * 1.05} height={s * 1.05} viewBox="0 0 30 30" fill="none">
          <Path d="M27 13L17 8.5L15 13L27 17.5Z"
            fill="rgba(255,255,255,0.35)" stroke="rgba(255,255,255,0.9)" strokeWidth={1.2} strokeLinejoin="round" />
        </Svg>
      </Animated.View>

    </View>
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
  const insets = useSafeAreaInsets();
  const { wp, isSmallDevice, isShortDevice } = useResponsive();
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
        {LEFT.map((item) => (
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

      <CategoriesButton
        isActive={currentScreen === 'categories'}
        onPress={() => onNavigate('categories')}
        compact={isShortDevice}
      />

      <View style={styles.side}>
        {RIGHT.map((item) => (
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

