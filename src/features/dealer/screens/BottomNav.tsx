import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
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

const DEALER_PRIMARY = '#D97706';
const DEALER_PRIMARY_DARK = '#92400E';

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

function ElectricianIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="9" r="2.5" stroke="white" strokeWidth={1.8} />
      <Circle cx="16.5" cy="8" r="2" stroke="white" strokeWidth={1.8} />
      <Path
        d="M4.6 18.2c.9-2.2 2.8-3.6 5.2-3.6 2.3 0 4.2 1.2 5.2 3.6"
        stroke="white"
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M15.5 16.2c.53-1.35 1.7-2.2 3.2-2.2 1.04 0 1.95.41 2.7 1.2"
        stroke="white"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CenterButton({
  active,
  onPress,
  compact = false,
}: {
  active: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  const { tx } = usePreferenceContext();
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.35)).current;
  const btnScale = useRef(new Animated.Value(1)).current;

  const btnSize = compact ? 52 : 66;
  const ringSize = compact ? 52 : 66;
  const ringTop = compact ? -18 : -26;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(
            ringScale,
            withWebSafeNativeDriver({
              toValue: 1.35,
              duration: 900,
              easing: Easing.out(Easing.ease),
            })
          ),
          Animated.timing(ringOpacity, withWebSafeNativeDriver({ toValue: 0, duration: 900 })),
        ]),
        Animated.parallel([
          Animated.timing(ringScale, withWebSafeNativeDriver({ toValue: 1, duration: 0 })),
          Animated.timing(ringOpacity, withWebSafeNativeDriver({ toValue: 0.35, duration: 0 })),
        ]),
        Animated.delay(200),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [ringOpacity, ringScale]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(btnScale, withWebSafeNativeDriver({ toValue: 0.88, duration: 70 })),
      Animated.spring(btnScale, withWebSafeNativeDriver({ toValue: 1, tension: 180, friction: 7 })),
    ]).start();
    onPress();
  };

  return (
    <View style={[centerStyles.wrapper, compact && centerStyles.wrapperCompact]}>
      <Animated.View
        style={[
          centerStyles.ring,
          compact && centerStyles.ringCompact,
          {
            transform: [{ scale: ringScale }],
            opacity: ringOpacity,
            top: ringTop,
            width: ringSize,
            height: ringSize,
          },
        ]}
      />
      <Pressable
        onPress={handlePress}
        testID="dealer-bottom-nav-electricians"
        accessible
        accessibilityRole="button"
        accessibilityLabel="Dealer bottom navigation electricians"
        accessibilityState={{ selected: active }}
        style={[centerStyles.pressArea, compact && centerStyles.pressAreaCompact]}
      >
        <Animated.View
          style={[
            centerStyles.button,
            compact && centerStyles.buttonCompact,
            active && centerStyles.buttonActive,
            { transform: [{ scale: btnScale }], width: btnSize, height: btnSize },
          ]}
        >
          <ElectricianIcon />
        </Animated.View>
      </Pressable>
      <Text
        style={[
          centerStyles.label,
          active && centerStyles.labelActive,
          compact && centerStyles.labelCompact,
        ]}
      >
        {tx('Electricians')}
      </Text>
    </View>
  );
}

const centerStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', width: 92 },
  wrapperCompact: { width: 76 },
  ring: {
    position: 'absolute',
    top: -26,
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: DEALER_PRIMARY_DARK,
  },
  ringCompact: {
    borderRadius: 17,
  },
  pressArea: { marginTop: -24, marginBottom: 6, zIndex: 1 },
  pressAreaCompact: { marginTop: -18, marginBottom: 4 },
  button: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: DEALER_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: DEALER_PRIMARY, offsetY: 6, blur: 14, opacity: 0.45, elevation: 12 }),
  },
  buttonCompact: {
    borderRadius: 17,
    ...createShadow({ color: DEALER_PRIMARY, offsetY: 6, blur: 10, opacity: 0.45, elevation: 12 }),
  },
  buttonActive: { backgroundColor: DEALER_PRIMARY },
  label: { fontSize: 10, fontWeight: '800', color: '#B89A77', marginTop: 1 },
  labelCompact: { fontSize: 8 },
  labelActive: { color: DEALER_PRIMARY_DARK },
});

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
  const iconColor = active ? DEALER_PRIMARY_DARK : '#97A5B6';
  const scale = useRef(new Animated.Value(1)).current;
  const iconSize = compact ? 20 : 24;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, withWebSafeNativeDriver({ toValue: 0.84, duration: 70 })),
      Animated.spring(scale, withWebSafeNativeDriver({ toValue: 1, tension: 180, friction: 7 })),
    ]).start();
    onPress();
  };

  const icon = (() => {
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
  })();

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
        style={[styles.iconWrap, compact && styles.iconWrapCompact, { transform: [{ scale }] }]}
      >
        {icon}
      </Animated.View>
      <Text style={[styles.label, active && styles.labelActive, compact && styles.labelCompact]}>
        {label}
      </Text>
    </Pressable>
  );
}

const LEFT: NavControlConfig[] = [
  {
    id: 'home',
    label: 'Home',
    testID: 'dealer-bottom-nav-home',
    accessibilityLabel: 'Dealer bottom navigation home',
  },
  {
    id: 'product',
    label: 'Product',
    testID: 'dealer-bottom-nav-product',
    accessibilityLabel: 'Dealer bottom navigation product',
  },
];

const RIGHT: NavControlConfig[] = [
  {
    id: 'wallet',
    label: 'Wallet',
    testID: 'dealer-bottom-nav-wallet',
    accessibilityLabel: 'Dealer bottom navigation wallet',
  },
  {
    id: 'profile',
    label: 'Account',
    testID: 'dealer-bottom-nav-profile',
    accessibilityLabel: 'Dealer bottom navigation profile',
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

      <CenterButton
        active={currentScreen === 'electricians'}
        onPress={() => onNavigate('electricians')}
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
    backgroundColor: '#FCFDFE',
    borderTopWidth: 1,
    borderTopColor: '#E6ECF4',
    ...createShadow({ color: '#27456A', offsetY: -4, blur: 14, opacity: 0.08, elevation: 12 }),
  },
  wrapDark: {
    backgroundColor: '#0F172A',
    borderTopColor: '#243043',
    ...createShadow({ color: '#020617', offsetY: -4, blur: 14, opacity: 0.08, elevation: 12 }),
  },
  side: { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  tabCompact: {
    minWidth: 44,
  },
  iconWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  iconWrapCompact: { width: 20, height: 20 },
  label: { fontSize: 9, fontWeight: '600', color: '#97A5B6', marginTop: 2 },
  labelCompact: { fontSize: 8, marginTop: 1 },
  labelActive: { color: DEALER_PRIMARY_DARK, fontWeight: '800' },
});

