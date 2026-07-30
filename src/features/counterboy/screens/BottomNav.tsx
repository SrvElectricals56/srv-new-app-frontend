import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
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
import { counterboyTheme as cb } from '@/features/counterboy/theme';

const CB_PRIMARY = cb.primary;

type NavControlConfig = {
  id: Screen;
  label: string;
  testID: string;
  accessibilityLabel: string;
};

function HomeIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M9 21V12h6v9" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProductIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function WalletIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="13" rx="2.4" stroke={color} strokeWidth={2} />
      <Path d="M15.5 11.5H21V16h-5.5a2.25 2.25 0 010-4.5z" stroke={color} strokeWidth={2} />
      <Circle cx="16.8" cy="13.75" r="1.05" fill={color} />
      <Path d="M7 6V4.8A1.8 1.8 0 018.8 3h7.7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function ProfileIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8.2" r="3.5" stroke={color} strokeWidth={2} />
      <Path d="M5 19.2c1.52-3.02 4.12-4.53 7-4.53 2.88 0 5.48 1.5 7 4.53" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function SupportIcon({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2a7.5 7.5 0 00-7.5 7.5v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Rect x="3" y="13" width="4" height="5" rx="1.5" stroke={color} strokeWidth={2} />
      <Rect x="17" y="13" width="4" height="5" rx="1.5" stroke={color} strokeWidth={2} />
      <Path d="M21 15v-1a9 9 0 00-18 0v1" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M17 18v1a3 3 0 01-3 3h-2" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function NavTab({ id, label, active, onPress, testID, accessibilityLabel, compact = false }: {
  id: Screen; label: string; active: boolean; onPress: () => void;
  testID: string; accessibilityLabel: string; compact?: boolean;
}) {
  const iconColor = active ? CB_PRIMARY : cb.muted;
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
      case 'home':    return <HomeIcon color={iconColor} size={iconSize} />;
      case 'product': return <ProductIcon color={iconColor} size={iconSize} />;
      case 'wallet':  return <WalletIcon color={iconColor} size={iconSize} />;
      case 'profile': return <ProfileIcon color={iconColor} size={iconSize} />;
      default:        return null;
    }
  };

  return (
    <Pressable onPress={handlePress} testID={testID} accessible accessibilityRole="button"
      accessibilityLabel={accessibilityLabel} accessibilityState={{ selected: active }}
      style={[styles.tab, compact && styles.tabCompact]}
    >
      <Animated.View style={[styles.iconWrap, compact && styles.iconWrapCompact, { transform: [{ scale: tabScale }] }]}>
        {renderIcon()}
      </Animated.View>
      <Text style={[styles.label, active && styles.labelActive, compact && styles.labelCompact]}>{label}</Text>
    </Pressable>
  );
}

// ── Support Button (FAB-style center) ───────────────────────────────────

function SupportButton({
  onPress,
  compact = false,
}: {
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
    <View style={[styles.btnWrap, compact && styles.btnWrapCompact]}>
      <Animated.View
        style={[
          styles.btnRing,
          compact && styles.btnRingCompact,
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
          styles.btnRing,
          compact && styles.btnRingCompact,
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
        accessible
        accessibilityRole="button"
        accessibilityLabel="Counter boy bottom navigation support"
        accessibilityState={{ selected: false }}
        style={[styles.btnPress, compact && styles.btnPressCompact, { marginTop: compact ? -14 : -20 }]}
      >
        <Animated.View
          style={[
            styles.btnBody,
            compact && styles.btnBodyCompact,
            { transform: [{ scale: btnScale }], width: btnSize, height: btnSize },
          ]}
        >
          <SupportIcon color="#FFFFFF" size={compact ? 22 : 28} />
        </Animated.View>
      </Pressable>

      <Text style={[styles.btnLabel, compact && styles.btnLabelCompact]}>{tx('SUPPORT')}</Text>
    </View>
  );
}

const LEFT: NavControlConfig[] = [
  { id: 'home',    label: 'Home',    testID: 'cb-bottom-nav-home',    accessibilityLabel: 'Counter boy bottom navigation home' },
  { id: 'product', label: 'Product', testID: 'cb-bottom-nav-product', accessibilityLabel: 'Counter boy bottom navigation product' },
];
const RIGHT: NavControlConfig[] = [
  { id: 'wallet',  label: 'Wallet',  testID: 'cb-bottom-nav-wallet',  accessibilityLabel: 'Counter boy bottom navigation wallet' },
  { id: 'profile', label: 'Account', testID: 'cb-bottom-nav-profile', accessibilityLabel: 'Counter boy bottom navigation profile' },
];

export function BottomNav({ currentScreen, onNavigate }: { currentScreen: Screen; onNavigate: (screen: Screen) => void }) {
  const { darkMode, tx } = usePreferenceContext();
  const { appSettings } = useAppData();
  const insets = useSafeAreaInsets();
  const { wp, isSmallDevice, isShortDevice } = useResponsive();
  const rolePageControls = useMemo(
    () => resolveRolePageControls(appSettings?.rolePageControls),
    [appSettings?.rolePageControls]
  );
  const allowedScreens = useMemo(
    () => new Set(getAllowedBottomNavScreens(rolePageControls, 'counterboy', ['home', 'product', 'wallet', 'profile', 'support'])),
    [rolePageControls]
  );
  const leftItems = useMemo(() => LEFT.filter((item) => allowedScreens.has(item.id)), [allowedScreens]);
  const rightItems = useMemo(() => RIGHT.filter((item) => allowedScreens.has(item.id)), [allowedScreens]);
  const bottomPad = isShortDevice ? Math.max(insets.bottom, 4) : isSmallDevice ? Math.max(insets.bottom, 6) : Math.max(insets.bottom, 8);
  const topPad = isShortDevice ? 6 : 10;

  return (
    <View style={[styles.wrap, darkMode ? styles.wrapDark : null, { paddingBottom: bottomPad, paddingTop: topPad, paddingHorizontal: wp(8), minHeight: isShortDevice ? 52 : 54 }]}>
      <View style={styles.side}>
        {leftItems.map((item) => (
          <NavTab key={item.id} id={item.id} label={tx(item.label)} active={currentScreen === item.id}
            onPress={() => onNavigate(item.id)} testID={item.testID} accessibilityLabel={item.accessibilityLabel} compact={isShortDevice || isSmallDevice} />
        ))}
      </View>

      {allowedScreens.has('support') ? (
        <SupportButton onPress={() => onNavigate('support')} compact={isShortDevice || isSmallDevice} />
      ) : null}

      <View style={styles.side}>
        {rightItems.map((item) => (
          <NavTab key={item.id} id={item.id} label={tx(item.label)} active={currentScreen === item.id}
            onPress={() => onNavigate(item.id)} testID={item.testID} accessibilityLabel={item.accessibilityLabel} compact={isShortDevice || isSmallDevice} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#FFFDFC', borderTopWidth: 1, borderTopColor: '#E0D0C0',
    ...createShadow({ color: '#6F4E37', offsetY: -4, blur: 14, opacity: 0.08, elevation: 12 }),
  },
  wrapDark: { backgroundColor: cb.darkBg, borderTopColor: cb.darkBorder, ...createShadow({ color: '#020617', offsetY: -4, blur: 14, opacity: 0.08, elevation: 12 }) },
  side: { flexDirection: 'row', flex: 1 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minWidth: 50 },
  tabCompact: { minWidth: 44 },
  iconWrap: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  iconWrapCompact: { width: 20, height: 20 },
  label: { fontSize: 9, fontWeight: '600', color: cb.muted, marginTop: 2 },
  labelCompact: { fontSize: 8, marginTop: 1 },
  labelActive: { color: CB_PRIMARY, fontWeight: '800' },

  btnWrap: { alignItems: 'center', width: 72 },
  btnWrapCompact: { width: 60 },
  btnRing: {
    position: 'absolute',
    top: -22,
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: CB_PRIMARY,
    zIndex: 0,
  },
  btnRingCompact: { borderRadius: 14 },
  btnPress: { marginTop: -20, marginBottom: 5, zIndex: 1 },
  btnPressCompact: { marginBottom: 3 },
  btnBody: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: CB_PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: CB_PRIMARY, offsetY: 5, blur: 12, opacity: 0.5, elevation: 12 }),
  },
  btnBodyCompact: {
    borderRadius: 14,
    ...createShadow({ color: CB_PRIMARY, offsetY: 5, blur: 8, opacity: 0.5, elevation: 12 }),
  },
  btnLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9E9189',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  btnLabelCompact: { fontSize: 8 },
});
