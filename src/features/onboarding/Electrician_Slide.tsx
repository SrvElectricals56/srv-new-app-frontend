/* eslint-disable @typescript-eslint/no-explicit-any */
// Electrician Slide - Blue Theme (#2563EB)
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Image,
} from 'react-native';
import Svg, { Circle, Rect, Path, G, Line, Ellipse } from 'react-native-svg';
import { ws, hs, rf } from '../../shared/hooks/useResponsive';
import { electricianURI } from '../../shared/data/roleImages';

const AView = Animated.View as any;
const CIRCLE_SIZE = ws(240);

const THEME = {
  primary:   '#2563EB',
  secondary: '#3B82F6',
  light:     '#EFF6FF',
  circle:    '#DBEAFE',
  tag:       '#BFDBFE',
  tagText:   '#1E40AF',
};

const TAGS = ['Install & Demo', 'First Product User', 'Trusted Expert'];

function BgIcons() {
  return (
    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={StyleSheet.absoluteFill}>
      <G opacity={0.18} transform="translate(26, 46)">
        <Path d="M18 0 Q36 0 36 18 Q36 30 28 36 L28 44 L8 44 L8 36 Q0 30 0 18 Q0 0 18 0Z" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Line x1="8"  y1="48" x2="28" y2="48" stroke={THEME.primary} strokeWidth="2.5" strokeLinecap="round"/>
        <Line x1="10" y1="52" x2="26" y2="52" stroke={THEME.primary} strokeWidth="2.5" strokeLinecap="round"/>
        <Line x1="18" y1="10" x2="18" y2="26" stroke={THEME.primary} strokeWidth="2" strokeLinecap="round"/>
        <Line x1="12" y1="18" x2="24" y2="18" stroke={THEME.primary} strokeWidth="2" strokeLinecap="round"/>
      </G>
      <G opacity={0.15} transform="translate(20, 150)">
        <Rect x="0" y="10" width="46" height="32" rx="6" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Path d="M12 10 L12 4 Q12 0 18 0 L28 0 Q34 0 34 4 L34 10" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Line x1="0"  y1="24" x2="46" y2="24" stroke={THEME.primary} strokeWidth="2" strokeLinecap="round"/>
        <Line x1="19" y1="17" x2="27" y2="17" stroke={THEME.primary} strokeWidth="2.5" strokeLinecap="round"/>
      </G>
      <G opacity={0.15} transform={`translate(${CIRCLE_SIZE - 84}, 42)`}>
        <Rect x="0" y="0" width="42" height="42" rx="9" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Circle cx="14" cy="16" r="4.5" stroke={THEME.primary} strokeWidth="2.2" fill="none"/>
        <Circle cx="28" cy="16" r="4.5" stroke={THEME.primary} strokeWidth="2.2" fill="none"/>
        <Rect x="12" y="28" width="18" height="8" rx="4" stroke={THEME.primary} strokeWidth="2" fill="none"/>
      </G>
      <G opacity={0.15} transform={`translate(${CIRCLE_SIZE - 68}, 140)`}>
        <Line x1="10" y1="0"  x2="10" y2="38" stroke={THEME.primary} strokeWidth="3" strokeLinecap="round"/>
        <Rect x="4"  y="38" width="12" height="8" rx="2" stroke={THEME.primary} strokeWidth="2" fill="none"/>
        <Path d="M6 46 L4 54 L16 54 L14 46" stroke={THEME.primary} strokeWidth="2" fill="none" strokeLinejoin="round"/>
        <Line x1="8" y1="5"  x2="12" y2="5" stroke={THEME.primary} strokeWidth="2" strokeLinecap="round"/>
      </G>
    </Svg>
  );
}

function Character() {
  return (
    <Image
      source={{ uri: electricianURI }}
      style={{ width: ws(300), height: hs(320) }}
      resizeMode="contain"
    />
  );
}

interface Props { onBack?: () => void; onContinue?: () => void; }

export default function ElectricianSlide({ onBack, onContinue }: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideUp   = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const glowAnim  = useRef(new Animated.Value(0.7)).current;
  const descScale = useRef(new Animated.Value(0.85)).current;
  const descFade  = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(slideUp,   { toValue: 0, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    
    Animated.sequence([
      Animated.delay(350),
      Animated.parallel([
        Animated.spring(descScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }),
        Animated.timing(descFade, { toValue: 1, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(textSlide, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true, delay: 150 }),
      ]),
    ]).start();
    
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1,   duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.7, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);

  const floatY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -12] });

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
        <View style={[s.titleButton, { backgroundColor: THEME.primary }]}>
          <Text style={s.titleButtonText}>FOR OUR SRV ELECTRICIANS</Text>
        </View>
        
        <AView style={[s.contentCard, { opacity: descFade, transform: [{ scale: descScale }] }]}>
          <View style={s.gradientAccent} />
          <View style={s.contentInner}>
            <Text style={[s.mainTitle, { color: '#1F2937', textAlign: 'center' }]}>Scan Products</Text>
            <Text style={[s.mainSubtitle, { color: THEME.primary, textAlign: 'center' }]}>Earn Rewards</Text>
            <Text style={s.cardDesc}>
              Get paid instantly for every SRV product you install
            </Text>
          </View>
        </AView>

        <View style={s.stepsRow}>
          <View style={[s.stepBox, { backgroundColor: THEME.primary }]}>
            <Svg width={ws(22)} height={ws(22)} viewBox="0 0 24 24" fill="none">
              <Rect x="5" y="2" width="14" height="20" rx="3" stroke="#FFFFFF" strokeWidth="1.8" fill="none"/>
              <Rect x="8" y="6" width="8" height="6" rx="1" stroke="#FFFFFF" strokeWidth="1.5" fill="none"/>
              <Circle cx="12" cy="17" r="1.5" fill="#FFFFFF"/>
            </Svg>
            <Text style={s.stepText}>Scan QR</Text>
          </View>
          <Text style={s.arrow}>→</Text>
          <View style={[s.stepBox, { backgroundColor: '#3B82F6' }]}>
            <Svg width={ws(22)} height={ws(22)} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
            </Svg>
            <Text style={s.stepText}>Get Points</Text>
          </View>
          <Text style={s.arrow}>→</Text>
          <View style={[s.stepBox, { backgroundColor: '#60A5FA' }]}>
            <Svg width={ws(22)} height={ws(22)} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </Svg>
            <Text style={s.stepText}>Redeem</Text>
          </View>
        </View>

        <View style={s.statsRow}>
          <View style={[s.statBox, { backgroundColor: THEME.light }]}>
            <Svg width={ws(24)} height={ws(24)} viewBox="0 0 24 24" fill="none">
              <Rect x="2" y="6" width="20" height="14" rx="3" stroke={THEME.primary} strokeWidth="1.8" fill="none"/>
              <Path d="M2 10h20" stroke={THEME.primary} strokeWidth="1.8" strokeLinecap="round"/>
              <Circle cx="6" cy="15" r="1.5" fill={THEME.primary}/>
              <Path d="M16 4H8" stroke={THEME.primary} strokeWidth="1.8" strokeLinecap="round"/>
            </Svg>
            <Text style={[s.statNumber, { color: THEME.primary }]}>₹5L+</Text>
            <Text style={[s.statLabel, { color: THEME.primary }]}>REWARDS PAID</Text>
          </View>
          <View style={[s.statBox, { backgroundColor: THEME.light }]}>
            <Svg width={ws(24)} height={ws(24)} viewBox="0 0 24 24" fill="none">
              <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke={THEME.primary} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
            <Text style={[s.statNumber, { color: THEME.primary }]}>25K+</Text>
            <Text style={[s.statLabel, { color: THEME.primary }]}>ACTIVE MEMBERS</Text>
          </View>
        </View>

        <Text style={[s.trustLine, { color: THEME.primary }]}>✦ 25 Years of Trust & Improvement ✦</Text>

        <View style={s.actionButtons}>
          {onBack && (
            <TouchableOpacity style={[s.switchButton, { borderColor: THEME.primary }]} onPress={onBack}>
              <Text style={[s.switchIcon, { color: THEME.primary }]}>‹</Text>
              <Text style={[s.switchButtonText, { color: THEME.primary }]}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.continueButton, { backgroundColor: THEME.primary }]} onPress={onContinue}>
            <Text style={s.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </AView>

    </AView>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, alignItems: 'center', justifyContent: 'flex-start', backgroundColor: '#FFFFFF', paddingHorizontal: ws(20), paddingTop: hs(48) },
  circleWrap:        { marginBottom: hs(28), shadowColor: '#2563EB', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 24, elevation: 14, marginTop: hs(8) },
  circle:            { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glowRing:          { position: 'absolute', width: CIRCLE_SIZE + ws(12), height: CIRCLE_SIZE + ws(12), borderRadius: (CIRCLE_SIZE + ws(12)) / 2, borderWidth: 1.5, opacity: 0.3, top: -ws(6), left: -ws(6) },
  card:              { alignItems: 'center', paddingHorizontal: ws(16), width: '100%' },
  titleButton:       { paddingHorizontal: ws(32), paddingVertical: hs(8), borderRadius: ws(25), marginBottom: hs(12), shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  titleButtonText:   { fontSize: rf(13, 11, 15), fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: 1 },
  contentCard:       { width: '100%', backgroundColor: '#FFFFFF', paddingHorizontal: ws(18), paddingVertical: hs(16), borderRadius: ws(16), marginBottom: hs(12), borderWidth: 2, borderColor: THEME.light, shadowColor: THEME.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8, position: 'relative', overflow: 'hidden' },
  gradientAccent:    { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: THEME.primary },
  contentInner:      { gap: hs(4) },
  ampersand:         { fontSize: rf(11, 10, 12), fontWeight: '700', textAlign: 'center', opacity: 0.6 },
  titleRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: ws(8), flexWrap: 'wrap' },
  mainTitle:         { fontSize: rf(20, 18, 22), fontWeight: '900', textAlign: 'center' },
  dividerDot:        { fontSize: rf(24, 22, 26), fontWeight: '900', opacity: 0.4 },
  mainSubtitle:      { fontSize: rf(20, 18, 22), fontWeight: '900', textAlign: 'center' },
  cardDesc:          { fontSize: rf(12, 11, 13), color: '#6B7280', textAlign: 'center', lineHeight: rf(18, 16, 20), fontWeight: '500' },
  stepsRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: hs(12), gap: ws(8) },
  stepBox:           { paddingVertical: hs(10), paddingHorizontal: ws(12), borderRadius: ws(10), alignItems: 'center', minWidth: ws(85), gap: hs(4) },
  stepIcon:          { fontSize: rf(20, 18, 22), marginBottom: hs(4) },
  stepText:          { fontSize: rf(11, 10, 12), fontWeight: '700', color: '#FFFFFF' },
  arrow:             { fontSize: rf(16, 14, 18), color: '#9CA3AF', fontWeight: '700' },
  statsRow:          { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: hs(8), gap: ws(8) },
  statBox:           { flex: 1, paddingVertical: hs(10), paddingHorizontal: ws(6), borderRadius: ws(10), alignItems: 'center', gap: hs(2) },
  statNumber:        { fontSize: rf(16, 14, 18), fontWeight: '900', marginBottom: hs(2) },
  statLabel:         { fontSize: rf(9, 8, 10), fontWeight: '700', letterSpacing: 0.5 },
  featuresList:      { width: '100%', marginBottom: hs(20), gap: hs(8) },
  featureItem:       { flexDirection: 'row', alignItems: 'center', paddingVertical: hs(10), paddingHorizontal: ws(14), borderRadius: ws(10) },
  featureIcon:       { width: ws(32), height: ws(32), borderRadius: ws(16), alignItems: 'center', justifyContent: 'center', marginRight: ws(10) },
  featureIconText:   { fontSize: rf(16, 14, 18) },
  featureText:       { fontSize: rf(12, 11, 13), fontWeight: '600', color: '#374151', flex: 1 },
  trustLine:         { fontSize: rf(11, 9, 13), fontWeight: '700', textAlign: 'center', letterSpacing: 0.4, marginBottom: hs(16), marginTop: hs(8) },
  actionButtons:     { flexDirection: 'row', width: '100%', gap: ws(12), paddingBottom: hs(24) },
  switchButton:      { flex: 1, paddingVertical: hs(12), borderRadius: ws(25), borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', flexDirection: 'row', gap: ws(8) },
  switchIcon:        { fontSize: rf(18, 16, 20), color: THEME.primary, fontWeight: '900', lineHeight: rf(18, 16, 20), includeFontPadding: false, textAlignVertical: 'center' },
  switchButtonText:  { fontSize: rf(13, 12, 14), fontWeight: '700', letterSpacing: 0.3, lineHeight: rf(18, 16, 20) },
  continueButton:    { flex: 1, paddingVertical: hs(12), borderRadius: ws(25), alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  continueButtonText:{ fontSize: rf(13, 12, 14), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
});