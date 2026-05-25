import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Image,
} from 'react-native';
import Svg, { Circle, Rect, Path, G, Line } from 'react-native-svg';
import { ws, hs, rf } from '@/shared/hooks/useResponsive';

const AView = Animated.View as any;
const CIRCLE_SIZE = ws(240);
const counterBoyImage = require('../../../../assets/Counter_boy.png');

const BROWNISH_RED = '#8B3C2A';
const COFFEE = '#6F4E37';

const THEME = {
  primary:   BROWNISH_RED,
  secondary: COFFEE,
  circle:    '#FFFFFF',
};

function BgIcons() {
  return (
    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={StyleSheet.absoluteFill}>
      <G opacity={0.18} transform="translate(28, 60)">
        <Path d="M0 0 L6 0 L14 36" stroke={THEME.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Rect x="6" y="10" width="38" height="26" rx="5" stroke={THEME.primary} strokeWidth="2.5" fill="none" />
        <Circle cx="14" cy="42" r="4" stroke={THEME.primary} strokeWidth="2" fill="none" />
        <Circle cx="34" cy="42" r="4" stroke={THEME.primary} strokeWidth="2" fill="none" />
        <Line x1="14" y1="20" x2="14" y2="30" stroke={THEME.primary} strokeWidth="2" strokeLinecap="round" />
        <Line x1="22" y1="20" x2="22" y2="30" stroke={THEME.primary} strokeWidth="2" strokeLinecap="round" />
        <Line x1="30" y1="20" x2="30" y2="30" stroke={THEME.primary} strokeWidth="2" strokeLinecap="round" />
      </G>
      <G opacity={0.15} transform="translate(22, 148)">
        <Rect x="0" y="0" width="36" height="36" rx="6" stroke={THEME.primary} strokeWidth="2.5" fill="none" />
        <Rect x="6" y="6" width="10" height="10" rx="2" stroke={THEME.primary} strokeWidth="2" fill="none" />
        <Rect x="20" y="6" width="10" height="10" rx="2" stroke={THEME.primary} strokeWidth="2" fill="none" />
        <Rect x="6" y="20" width="24" height="10" rx="2" stroke={THEME.primary} strokeWidth="2" fill="none" />
      </G>
      <G opacity={0.15} transform={`translate(${CIRCLE_SIZE - 88}, 52)`}>
        <Rect x="0" y="0" width="48" height="34" rx="10" stroke={THEME.primary} strokeWidth="2.5" fill="none" />
        <Path d="M10 38 L20 34" stroke={THEME.primary} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <Line x1="10" y1="12" x2="38" y2="12" stroke={THEME.primary} strokeWidth="2" strokeLinecap="round" />
        <Line x1="10" y1="22" x2="30" y2="22" stroke={THEME.primary} strokeWidth="2" strokeLinecap="round" />
      </G>
      <G opacity={0.15} transform={`translate(${CIRCLE_SIZE - 78}, 130)`}>
        <Circle cx="14" cy="8" r="7" stroke={THEME.primary} strokeWidth="2.2" fill="none" />
        <Path d="M0 32 Q14 22 28 32" stroke={THEME.primary} strokeWidth="2.2" fill="none" />
        <Circle cx="30" cy="10" r="6" stroke={THEME.primary} strokeWidth="2" fill="none" />
        <Path d="M22 32 Q30 24 38 32" stroke={THEME.primary} strokeWidth="2" fill="none" />
      </G>
    </Svg>
  );
}

const Character = React.memo(function Character() {
  return (
    <Image
      source={counterBoyImage}
      style={{ width: ws(345), height: ws(345), marginTop: hs(2) }}
      resizeMode="contain"
      fadeDuration={0}
    />
  );
});

function StatIcon({ type, color }: { type: 'billing' | 'stock' | 'report' | 'returns'; color: string }) {
  if (type === 'billing') {
    return (
      <Svg width={ws(20)} height={ws(20)} viewBox="0 0 24 24" fill="none">
        <Path d="M7 3h10v18l-2-1.5L12 21l-3-1.5L7 21V3z" stroke={color} strokeWidth="1.8" fill="none" strokeLinejoin="round" />
        <Line x1="9" y1="8" x2="15" y2="8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <Line x1="9" y1="12" x2="15" y2="12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </Svg>
    );
  }

  if (type === 'stock') {
    return (
      <Svg width={ws(20)} height={ws(20)} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="7" width="8" height="6" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
        <Rect x="13" y="7" width="8" height="6" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
        <Rect x="8" y="15" width="8" height="6" rx="1.5" stroke={color} strokeWidth="1.8" fill="none" />
      </Svg>
    );
  }

  if (type === 'report') {
    return (
      <Svg width={ws(20)} height={ws(20)} viewBox="0 0 24 24" fill="none">
        <Line x1="4" y1="20" x2="20" y2="20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <Rect x="6" y="11" width="3" height="7" rx="1" fill={color} />
        <Rect x="11" y="8" width="3" height="10" rx="1" fill={color} />
        <Rect x="16" y="5" width="3" height="13" rx="1" fill={color} />
      </Svg>
    );
  }

  return (
    <Svg width={ws(20)} height={ws(20)} viewBox="0 0 24 24" fill="none">
      <Path d="M8 7H4v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 17h4v-4" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M20 13a8 8 0 0 0-13.66-5.66L4 9" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Path d="M4 11a8 8 0 0 0 13.66 5.66L20 15" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

interface Props { onBack?: () => void; onContinue?: () => void; }

export default function CounterBoySlide({ onBack, onContinue }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const glowAnim = useRef(new Animated.Value(0.7)).current;
  const descScale = useRef(new Animated.Value(0.85)).current;
  const descFade = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(slideUp, { toValue: 0, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(350),
      Animated.parallel([
        Animated.spring(descScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
        Animated.timing(descFade, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.7, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, [descFade, descScale, fadeAnim, floatAnim, glowAnim, scaleAnim, slideUp]);

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  return (
    <AView style={[s.root, { opacity: fadeAnim }]}>
      <AView style={[s.circleWrap, { transform: [{ scale: scaleAnim }, { translateY: floatY }] }]}>
        <View style={[s.circle, { backgroundColor: THEME.circle }]}>
          <BgIcons />
          <Character />
        </View>
        <View style={[s.glowRing, { borderColor: THEME.primary }]} />
      </AView>

      <AView style={[s.card, { transform: [{ translateY: slideUp }] }]}>
        <View style={[s.titleButton]}>
          <LinearGradient colors={[BROWNISH_RED, COFFEE]} style={s.titleGradient}>
            <Text style={s.titleButtonText}>FOR OUR SRV COUNTER BOYS</Text>
          </LinearGradient>
        </View>

        <AView style={[s.contentCard, { opacity: descFade, transform: [{ scale: descScale }] }]}>
          <View style={s.gradientAccent} />
          <View style={s.contentInner}>
            <View style={s.titleRow}>
              <Text style={s.mainTitle}>Face of Every Sale</Text>
            </View>
            <Text style={[s.mainSubtitle, { color: COFFEE }]}>Building Customer Trust</Text>
            <Text style={s.cardDesc}>
              Your product knowledge and warm attitude turns every visitor into a loyal customer
            </Text>
          </View>
        </AView>

        <View style={s.statsRow}>
          <View style={s.statBox}>
            <View style={s.statIconWrap}>
              <StatIcon type="billing" color={THEME.primary} />
            </View>
            <Text style={[s.statLabel, { color: THEME.primary }]}>SMART BILLING</Text>
          </View>
          <View style={s.statBox}>
            <View style={s.statIconWrap}>
              <StatIcon type="stock" color={THEME.secondary} />
            </View>
            <Text style={[s.statLabel, { color: THEME.secondary }]}>LIVE STOCK</Text>
          </View>
          <View style={s.statBox}>
            <View style={s.statIconWrap}>
              <StatIcon type="report" color={THEME.primary} />
            </View>
            <Text style={[s.statLabel, { color: THEME.primary }]}>SALES REPORT</Text>
          </View>
          <View style={s.statBox}>
            <View style={s.statIconWrap}>
              <StatIcon type="returns" color={THEME.secondary} />
            </View>
            <Text style={[s.statLabel, { color: THEME.secondary }]}>QUICK RETURNS</Text>
          </View>
        </View>

        <Text style={[s.trustLine, { color: COFFEE }]}>✦ 25 Years of Trust & Improvement ✦</Text>

        <View style={s.actionButtons}>
          {onBack ? (
            <TouchableOpacity style={[s.switchButton, { borderColor: THEME.primary }]} onPress={onBack}>
              <Text style={[s.switchIcon, { color: THEME.primary }]}>‹</Text>
              <Text style={[s.switchButtonText, { color: THEME.primary }]}>Back</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={[s.continueButton, { backgroundColor: THEME.primary }]} onPress={onContinue}>
            <Text style={s.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </AView>
    </AView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#FFFFFF', paddingHorizontal: ws(20), paddingTop: hs(48), paddingBottom: hs(20) },
  circleWrap: { marginBottom: hs(20), shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 24, elevation: 14, marginTop: hs(4), alignSelf: 'center' },
  circle: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glowRing: { position: 'absolute', width: CIRCLE_SIZE + ws(12), height: CIRCLE_SIZE + ws(12), borderRadius: (CIRCLE_SIZE + ws(12)) / 2, borderWidth: 1.5, opacity: 0.3, top: -ws(6), left: -ws(6) },
  card: { alignItems: 'center', paddingHorizontal: ws(16), width: '100%' },
  titleButton: { borderRadius: ws(25), marginBottom: hs(8), overflow: 'hidden', shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  titleGradient: { paddingHorizontal: ws(32), paddingVertical: hs(8), alignItems: 'center' },
  titleButtonText: { fontSize: rf(13, 11, 15), fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: 1 },
  contentCard: { width: '100%', backgroundColor: '#FFFFFF', paddingHorizontal: ws(18), paddingVertical: hs(12), borderRadius: ws(16), marginBottom: hs(8), borderWidth: 2, borderColor: '#D9C0AE', shadowColor: THEME.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8, position: 'relative', overflow: 'hidden' },
  gradientAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: BROWNISH_RED },
  contentInner: { gap: hs(6) },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  mainTitle: { fontSize: rf(20, 18, 22), fontWeight: '900', textAlign: 'center', color: BROWNISH_RED },
  mainSubtitle: { fontSize: rf(18, 16, 20), fontWeight: '900', textAlign: 'center', letterSpacing: 0.3 },
  cardDesc: { fontSize: rf(12, 11, 13), color: '#5C3D2E', textAlign: 'center', lineHeight: rf(18, 16, 20), fontWeight: '500' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', width: '100%', marginBottom: hs(4), gap: ws(8) },
  statBox: { width: '47%', paddingVertical: hs(10), paddingHorizontal: ws(8), borderRadius: ws(12), alignItems: 'center', gap: hs(4), backgroundColor: '#F8F2EA', borderWidth: 1.5, borderColor: '#D9C0AE', shadowColor: COFFEE, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  statIconWrap: { width: ws(34), height: ws(34), borderRadius: ws(17), alignItems: 'center', justifyContent: 'center', marginBottom: hs(2), backgroundColor: '#F0E4D4' },
  statLabel: { fontSize: rf(9, 8, 10), fontWeight: '700', letterSpacing: 0.5 },
  trustLine: { fontSize: rf(11, 9, 13), fontWeight: '700', textAlign: 'center', letterSpacing: 0.4, marginBottom: hs(8), marginTop: hs(4) },
  actionButtons: { flexDirection: 'row', width: '100%', gap: ws(12), paddingBottom: 0, marginTop: hs(12) },
  switchButton: { flex: 1, paddingVertical: hs(12), borderRadius: ws(25), borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', flexDirection: 'row', gap: ws(8) },
  switchIcon: { fontSize: rf(18, 16, 20), fontWeight: '900', lineHeight: rf(18, 16, 20), includeFontPadding: false, textAlignVertical: 'center' },
  switchButtonText: { fontSize: rf(13, 12, 14), fontWeight: '700', letterSpacing: 0.3, lineHeight: rf(18, 16, 20) },
  continueButton: { flex: 1, paddingVertical: hs(12), borderRadius: ws(25), alignItems: 'center', justifyContent: 'center', shadowColor: '#6F4E37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  continueButtonText: { fontSize: rf(13, 12, 14), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
});
