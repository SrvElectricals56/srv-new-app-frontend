/**
 * ForceUpdateScreen — Light mode, SRV branded
 * Shows when admin enables forceUpdate and current app version < minAppVersion.
 */

import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { createShadow } from '@/shared/theme/shadows';

const srvLogo = require('../../../assets/srv-login-logo.png');

// ── Download Icon ─────────────────────────────────────────────────────────────
function DownloadIcon({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Defs>
        <SvgGradient id="dlGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#E8453C" />
          <Stop offset="100%" stopColor="#C0392B" />
        </SvgGradient>
      </Defs>
      <Circle cx="28" cy="28" r="28" fill="url(#dlGrad)" />
      <Path
        d="M28 16v16M20 26l8 8 8-8"
        stroke="#FFFFFF"
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 38h20"
        stroke="#FFFFFF"
        strokeWidth={2.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ── Animated check badge ──────────────────────────────────────────────────────
function VersionBadge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.versionPill, { backgroundColor: color + '18', borderColor: color + '40' }]}>
      <Text style={[styles.versionPillText, { color }]}>{label}</Text>
    </View>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  currentVersion?: string;
  minVersion?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  onGoToStore?: () => void;
};

export function ForceUpdateScreen({
  currentVersion = '2.0.0',
  minVersion,
  playStoreUrl,
  appStoreUrl,
  onGoToStore,
}: Props) {
  const iconBounce = useRef(new Animated.Value(0)).current;
  const fadeIn     = useRef(new Animated.Value(0)).current;
  const slideUp    = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 450, easing: Easing.out(Easing.back(1.1)), useNativeDriver: true }),
    ]).start();

    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(iconBounce, { toValue: -10, duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(iconBounce, { toValue: 0,   duration: 550, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    bounce.start();
    return () => bounce.stop();
  }, [fadeIn, iconBounce, slideUp]);

  const handleUpdate = () => {
    onGoToStore?.();
    const DEFAULT_PLAY = 'https://play.google.com/store/apps/details?id=com.srvelectricals.app';
    const androidUrl = playStoreUrl || DEFAULT_PLAY;
    const iosUrl     = appStoreUrl  || '';
    const url = Platform.OS === 'ios' && iosUrl ? iosUrl : androidUrl;
    Linking.openURL(url).catch(() => Linking.openURL(DEFAULT_PLAY));
  };

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

        {/* Bouncing download icon */}
        <Animated.View style={{ transform: [{ translateY: iconBounce }], marginBottom: 20 }}>
          <DownloadIcon size={64} />
        </Animated.View>

        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Update Available</Text>
        </View>

        <Text style={styles.title}>New Version Required</Text>
        <Text style={styles.sub}>
          A newer version of SRV Electricals is available with important improvements. Please update to continue.
        </Text>

        {/* Version pills */}
        <View style={styles.versionsRow}>
          <VersionBadge label={`Current  v${currentVersion}`} color="#94A3B8" />
          {minVersion && <VersionBadge label={`Required  v${minVersion}`} color="#E8453C" />}
        </View>

        {/* Update button */}
        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate} activeOpacity={0.85}>
          <Text style={styles.updateBtnText}>
            {Platform.OS === 'ios' ? 'Update on App Store' : 'Update on Play Store'}
          </Text>
        </TouchableOpacity>

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
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: 'rgba(232,69,60,0.06)',
    top: -80,
    right: -100,
  },
  blob2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(232,69,60,0.04)',
    bottom: -60,
    left: -80,
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
  badge: {
    backgroundColor: '#FEF2F2',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  badgeText: {
    color: '#E8453C',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
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
  versionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  versionPill: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  versionPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  updateBtn: {
    width: '100%',
    backgroundColor: '#E8453C',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#E8453C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 6,
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  footer: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '600',
    textAlign: 'center',
  },
});
