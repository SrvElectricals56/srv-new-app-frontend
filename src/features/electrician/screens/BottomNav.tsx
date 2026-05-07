import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { Screen } from '@/shared/types/navigation';
import { useResponsive } from '@/shared/hooks';

type NavControlConfig = {
  id: Screen;
  label: string;
  testID: string;
  accessibilityLabel: string;
};

const ELECTRICIAN_PRIMARY = '#2563EB';
const ELECTRICIAN_PRIMARY_DARK = '#1E40AF';

// ── Icons ─────────────────────────────────────────────────────────────

function HomeIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        fill={color === ELECTRICIAN_PRIMARY ? ELECTRICIAN_PRIMARY + '22' : 'none'}
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

function WalletIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="13" rx="2.4" stroke={color} strokeWidth={2} />
      <Path d="M15.5 11.5H21V16h-5.5a2.25 2.25 0 010-4.5z" stroke={color} strokeWidth={2} />
      <Circle cx="16.8" cy="13.75" r="1.05" fill={color} />
      <Path
        d="M7 6V4.8A1.8 1.8 0 018.8 3h7.7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
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

function ScanQRIcon() {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      {/* Top-left finder */}
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth={2} />
      <Rect x="5.5" y="5.5" width="2" height="2" fill="white" />
      {/* Top-right finder */}
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke="white" strokeWidth={2} />
      <Rect x="16.5" y="5.5" width="2" height="2" fill="white" />
      {/* Bottom-left finder */}
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke="white" strokeWidth={2} />
      <Rect x="5.5" y="16.5" width="2" height="2" fill="white" />
      {/* Bottom-right data cells */}
      <Rect x="14" y="14" width="3" height="3" rx={0.6} fill="white" />
      <Rect x="18" y="14" width="3" height="3" rx={0.6} fill="white" />
      <Rect x="14" y="18" width="3" height="3" rx={0.6} fill="white" />
      <Rect x="18" y="18" width="3" height="3" rx={0.6} fill="white" />
    </Svg>
  );
}

// ── Scan Button ───────────────────────────────────────────────────────

function ScanButton({
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
            Animated.timing(
              scale,
              withWebSafeNativeDriver({
                toValue: 1.4,
                duration: 900,
                easing: Easing.out(Easing.ease),
              })
            ),
            Animated.timing(
              opacity,
              withWebSafeNativeDriver({
                toValue: 0,
                duration: 900,
              })
            ),
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
    <View style={[scanStyles.wrapper, compact && scanStyles.wrapperCompact]}>
      <Animated.View
        style={[
          scanStyles.ring,
          compact && scanStyles.ringCompact,
          {
            transform: [{ scale: ring1Scale }],
            opacity: ring1Opacity,
            top: ringTop,
            width: ringSize,
            height: ringSize,
          },
        ]}
      />
      <Animated.View
        style={[
          scanStyles.ring,
          compact && scanStyles.ringCompact,
          {
            transform: [{ scale: ring2Scale }],
            opacity: ring2Opacity,
            top: ringTop,
            width: ringSize,
            height: ringSize,
          },
        ]}
      />

      <Pressable
        onPress={handlePress}
        testID="electrician-bottom-nav-scan"
        accessible
        accessibilityRole="button"
        accessibilityLabel="Electrician bottom navigation scan"
        accessibilityState={{ selected: isActive }}
        style={[
          scanStyles.pressArea,
          compact && scanStyles.pressAreaCompact,
          { marginTop: compact ? -14 : -20 },
        ]}
      >
        <Animated.View
          style={[
            scanStyles.btn,
            compact && scanStyles.btnCompact,
            { transform: [{ scale: btnScale }], width: btnSize, height: btnSize },
          ]}
        >
          <ScanQRIcon />
        </Animated.View>
      </Pressable>

      <Text
        style={[
          scanStyles.label,
          isActive && scanStyles.labelActive,
          compact && scanStyles.labelCompact,
        ]}
      >
        {tx('SCAN')}
      </Text>
    </View>
  );
}

const scanStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: 72,
  },
  wrapperCompact: {
    width: 60,
  },
  ring: {
    position: 'absolute',
    top: -22,
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: ELECTRICIAN_PRIMARY,
    zIndex: 0,
  },
  ringCompact: {
    borderRadius: 14,
  },
  pressArea: {
    marginTop: -20,
    marginBottom: 5,
    zIndex: 1,
  },
  pressAreaCompact: {
    marginBottom: 3,
  },
  btn: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: ELECTRICIAN_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: ELECTRICIAN_PRIMARY, offsetY: 5, blur: 12, opacity: 0.5, elevation: 12 }),
  },
  btnCompact: {
    borderRadius: 14,
    ...createShadow({ color: ELECTRICIAN_PRIMARY, offsetY: 5, blur: 8, opacity: 0.5, elevation: 12 }),
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9E9189',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  labelActive: {
    color: ELECTRICIAN_PRIMARY,
  },
  labelCompact: {
    fontSize: 8,
  },
});

// ── Nav Tab ───────────────────────────────────────────────────────────

function NavTab({
  id,
  label,
  active,
  onPress,
  testID,
  accessibilityLabel,
  compact = false,
}: {
  id: Screen;
  label: string;
  active: boolean;
  onPress: () => void;
  testID: string;
  accessibilityLabel: string;
  compact?: boolean;
}) {
  const iconColor = active ? ELECTRICIAN_PRIMARY : '#A89A91';
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
      case 'home':
        return <HomeIcon color={iconColor} size={iconSize} />;
      case 'product':
        return <ProductIcon color={iconColor} size={iconSize} />;
      case 'wallet':
        return <WalletIcon color={iconColor} size={iconSize} />;
      case 'profile':
        return <ProfileIcon color={iconColor} size={iconSize} />;
      default:
        return null;
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

// ── BottomNav ─────────────────────────────────────────────────────────

const LEFT: NavControlConfig[] = [
  {
    id: 'home',
    label: 'Home',
    testID: 'electrician-bottom-nav-home',
    accessibilityLabel: 'Electrician bottom navigation home',
  },
  {
    id: 'product',
    label: 'Product',
    testID: 'electrician-bottom-nav-product',
    accessibilityLabel: 'Electrician bottom navigation product',
  },
];

const RIGHT: NavControlConfig[] = [
  {
    id: 'wallet',
    label: 'Wallet',
    testID: 'electrician-bottom-nav-wallet',
    accessibilityLabel: 'Electrician bottom navigation wallet',
  },
  {
    id: 'profile',
    label: 'Account',
    testID: 'electrician-bottom-nav-profile',
    accessibilityLabel: 'Electrician bottom navigation profile',
  },
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
  const bottomPad = isShortDevice
    ? Math.max(insets.bottom, 4)
    : isSmallDevice
      ? Math.max(insets.bottom, 6)
      : Math.max(insets.bottom, 8);
  const topPad = isShortDevice ? 6 : 10;
  return (
    <View
      style={[
        styles.wrap,
        darkMode ? styles.wrapDark : null,
        {
          paddingBottom: bottomPad,
          paddingTop: topPad,
          paddingHorizontal: wp(8),
          minHeight: isShortDevice ? 52 : 54,
        },
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

      <ScanButton
        isActive={currentScreen === 'scan'}
        onPress={() => onNavigate('scan')}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFDFC',
    borderTopWidth: 1,
    borderTopColor: '#EEEEF3',
    ...createShadow({ color: '#6F4C3A', offsetY: -4, blur: 14, opacity: 0.08, elevation: 12 }),
  },
  wrapDark: {
    backgroundColor: '#0F172A',
    borderTopColor: '#243043',
    ...createShadow({ color: '#020617', offsetY: -4, blur: 14, opacity: 0.08, elevation: 12 }),
  },
  side: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  iconWrap: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 20,
    height: 20,
  },
  tabCompact: {
    minWidth: 44,
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: '#A89A91',
    marginTop: 2,
  },
  labelCompact: {
    fontSize: 8,
    marginTop: 1,
  },
  labelActive: {
    color: ELECTRICIAN_PRIMARY,
    fontWeight: '800',
  },
});


