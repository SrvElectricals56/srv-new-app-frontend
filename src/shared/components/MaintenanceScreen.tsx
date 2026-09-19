import { LocalizedText as Text } from '@/shared/preferences/LocalizedNative';
/**
 * MaintenanceScreen — Light mode, SRV branded
 * Shows when admin enables maintenanceMode in App Settings.
 */

import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { createShadow } from '@/shared/theme/shadows';

const srvLogo = require('../../../assets/srv-login-logo.png');

// ── Gear SVG ──────────────────────────────────────────────────────────────────
function Gear({ size = 64, color = '#E8453C', opacity = 1 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none" opacity={opacity}>
      {/* Outer gear teeth */}
      <Path
        d="M27 4h10l1.5 6a20 20 0 0 1 5.2 3l6-1.5 5 8.7-4.5 4a20.3 20.3 0 0 1 0 6.6l4.5 4-5 8.7-6-1.5a20 20 0 0 1-5.2 3L37 52H27l-1.5-6a20 20 0 0 1-5.2-3l-6 1.5-5-8.7 4.5-4a20.3 20.3 0 0 1 0-6.6l-4.5-4 5-8.7 6 1.5a20 20 0 0 1 5.2-3L27 4z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        fill={color}
        fillOpacity={0.08}
      />
      {/* Inner circle */}
      <Circle cx="32" cy="32" r="10" stroke={color} strokeWidth={2.5} fill={color} fillOpacity={0.15} />
      <Circle cx="32" cy="32" r="4" fill={color} />
    </Svg>
  );
}

// ── Wrench SVG ────────────────────────────────────────────────────────────────
function Wrench({ size = 28, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.77z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Animated dot ──────────────────────────────────────────────────────────────
function Dot({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 380, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.delay(760 - delay),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);
  const scale   = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  return <Animated.View style={[styles.dot, { transform: [{ scale }], opacity }]} />;
}

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  message?: string;
  onRetry?: () => void;
};

export function MaintenanceScreen({ message, onRetry }: Props) {
  const gear1Rot = useRef(new Animated.Value(0)).current;
  const gear2Rot = useRef(new Animated.Value(0)).current;
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const slideUp  = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 500, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
    ]).start();

    // Gear rotations
    const g1 = Animated.loop(
      Animated.timing(gear1Rot, { toValue: 1, duration: 7000, easing: Easing.linear, useNativeDriver: true })
    );
    const g2 = Animated.loop(
      Animated.timing(gear2Rot, { toValue: -1, duration: 4500, easing: Easing.linear, useNativeDriver: true })
    );
    g1.start();
    g2.start();
    return () => { g1.stop(); g2.stop(); };
  }, [fadeIn, gear1Rot, gear2Rot, slideUp]);

  const spin1 = gear1Rot.interpolate({ inputRange: [0, 1],  outputRange: ['0deg',   '360deg'] });
  const spin2 = gear2Rot.interpolate({ inputRange: [-1, 0], outputRange: ['-360deg', '0deg'] });

  return (
    <View style={styles.root}>
      {/* Soft background blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />

      <Animated.View style={[styles.card, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>

        {/* SRV Logo — same as GetStartedScreen */}
        <View style={styles.logoHeader}>
          <View style={styles.logoGlow}>
            <Image source={srvLogo} style={styles.logo} resizeMode="contain" />
          </View>
        </View>

        {/* Animated gears */}
        <View style={styles.gearsContainer}>
          {/* Big gear */}
          <Animated.View style={[styles.gear1, { transform: [{ rotate: spin1 }] }]}>
            <Gear size={88} color="#E8453C" />
          </Animated.View>
          {/* Small gear */}
          <Animated.View style={[styles.gear2, { transform: [{ rotate: spin2 }] }]}>
            <Gear size={52} color="#F59E0B" />
          </Animated.View>
          {/* Center wrench badge */}
          <View style={styles.wrenchBadge}>
            <Wrench size={26} color="#FFFFFF" />
          </View>
        </View>

        {/* Status badge */}
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>Under Maintenance</Text>
        </View>

        <Text style={styles.title}>We&apos;ll be back soon!</Text>
        <Text style={styles.sub}>
          {message || 'Our team is working hard to improve your experience. Please check back in a little while.'}
        </Text>

        {/* Animated dots */}
        <View style={styles.dotsRow}>
          <Dot delay={0} />
          <Dot delay={180} />
          <Dot delay={360} />
        </View>

        {/* Retry button */}
        {onRetry && (
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8}>
            <Text style={styles.retryText}>Check Again</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.footer}>SRV Electricals · Powering Your Rewards</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  blob1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(232,69,60,0.06)',
    top: -70,
    right: -90,
  },
  blob2: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(245,158,11,0.05)',
    bottom: -50,
    left: -70,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  logoHeader: {
    width: '100%',
    height: 100,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  logoGlow: {
    ...createShadow({ color: '#fff', offsetY: 0, blur: 20, opacity: 0.5, elevation: 10 }),
  },
  logo: {
    width: 150,
    height: 65,
  },

  // Gears
  gearsContainer: {
    width: 130,
    height: 110,
    marginBottom: 24,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gear1: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  gear2: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  wrenchBadge: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: '#E8453C',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: '#E8453C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },

  // Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#E8453C',
  },
  badgeText: {
    color: '#E8453C',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  // Text
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  sub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E8453C',
  },

  // Retry
  retryBtn: {
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 13,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#FECACA',
  },
  retryText: {
    color: '#E8453C',
    fontSize: 14,
    fontWeight: '800',
  },

  footer: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
    textAlign: 'center',
  },
});
