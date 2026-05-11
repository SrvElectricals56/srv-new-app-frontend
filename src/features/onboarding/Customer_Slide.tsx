/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Image,
} from 'react-native';
import Svg, { Circle, Rect, Path, G, Line, Ellipse } from 'react-native-svg';
import { ws, hs, rf } from '../../shared/hooks/useResponsive';

const AView = Animated.View as any;
const CIRCLE_SIZE = ws(240);
const customerImage = require('../../../assets/Customer.png');

const THEME = {
  primary:   '#6A2F12',
  secondary: '#8D4A1E',
  light:     '#FBF1E7',
  circle:    '#FBF1E7',
  tag:       '#F0DEC9',
  tagText:   '#6A2F12',
};

const TAGS = ['Browse Products', 'Easy Ordering', 'Trusted Quality'];

function BgIcons() {
  return (
    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={StyleSheet.absoluteFill}>
      <G opacity={0.18} transform="translate(26, 52)">
        <Rect x="4" y="14" width="40" height="34" rx="6" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Path d="M14 14 Q14 2 24 2 Q34 2 34 14" stroke={THEME.primary} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        <Line x1="18" y1="28" x2="32" y2="28" stroke={THEME.primary} strokeWidth="2" strokeLinecap="round"/>
      </G>
      <G opacity={0.15} transform="translate(22, 150)">
        <Path d="M22 2 L27 16 L42 16 L30 25 L35 39 L22 30 L9 39 L14 25 L2 16 L17 16 Z" stroke={THEME.primary} strokeWidth="2.2" fill="none" strokeLinejoin="round"/>
      </G>
      <G opacity={0.15} transform={`translate(${CIRCLE_SIZE - 82}, 44)`}>
        <Path d="M22 38 Q4 26 4 14 Q4 4 14 4 Q18 4 22 10 Q26 4 32 4 Q40 4 40 14 Q40 26 22 38Z" stroke={THEME.primary} strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
      </G>
      <G opacity={0.15} transform={`translate(${CIRCLE_SIZE - 78}, 140)`}>
        <Rect x="0" y="14" width="44" height="30" rx="5" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Rect x="0" y="8"  width="44" height="10" rx="3" stroke={THEME.primary} strokeWidth="2.2" fill="none"/>
        <Line x1="22" y1="8" x2="22" y2="44" stroke={THEME.primary} strokeWidth="2.2" strokeLinecap="round"/>
        <Path d="M22 8 Q16 0 10 4 Q4 8 22 8" stroke={THEME.primary} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <Path d="M22 8 Q28 0 34 4 Q40 8 22 8" stroke={THEME.primary} strokeWidth="2" fill="none" strokeLinecap="round"/>
      </G>
    </Svg>
  );
}

function Character() {
  return (
    <Image
      source={customerImage}
      style={{ width: ws(336), height: ws(336), marginTop: -hs(4) }}
      resizeMode="contain"
    />
  );
}

interface Props { onBack?: () => void; onContinue?: () => void; }

export default function CustomerSlide({ onBack, onContinue }: Props) {
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
          <Text style={s.titleButtonText}>FOR OUR SRV CUSTOMERS</Text>
        </View>
        
        <AView style={[s.contentCard, { opacity: descFade, transform: [{ scale: descScale }] }]}>
          <View style={s.gradientAccent} />
          <View style={s.contentInner}>
            <View style={s.titleRow}>
              <Text style={[s.mainTitle, { color: '#1F2937' }]}>Your Home Deserves</Text>
            </View>
            <Text style={[s.mainSubtitle, { color: THEME.primary }]}>The Best Quality</Text>
            <Text style={s.cardDesc}>
              250+ certified products trusted by 50,000+ happy customers
            </Text>
          </View>
        </AView>

        <View style={s.featuresGrid}>
          <View style={[s.gridItem, { backgroundColor: THEME.light }]}>
            <View style={[s.gridIcon, { backgroundColor: THEME.primary }]}>
              <Svg width={ws(18)} height={ws(18)} viewBox="0 0 24 24" fill="none">
                <Path d="M3 18v-6a9 9 0 0 1 18 0v6M3 18a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3zM21 18a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              </Svg>
            </View>
            <Text style={s.gridText}>Instant Support</Text>
          </View>
          
          <View style={[s.gridItem, { backgroundColor: '#F3E4D4' }]}>
            <View style={[s.gridIcon, { backgroundColor: THEME.secondary }]}>
              <Svg width={ws(18)} height={ws(18)} viewBox="0 0 24 24" fill="none">
                <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
                <Path d="M9 12l2 2 4-4" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </Svg>
            </View>
            <Text style={s.gridText}>Verified Quality</Text>
          </View>
          
          <View style={[s.gridItem, { backgroundColor: '#F8EDE2' }]}>
            <View style={[s.gridIcon, { backgroundColor: THEME.primary }]}>
              <Svg width={ws(18)} height={ws(18)} viewBox="0 0 24 24" fill="none">
                <Path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinejoin="round"/>
                <Circle cx="7" cy="7" r="1.5" fill="#FFFFFF"/>
              </Svg>
            </View>
            <Text style={s.gridText}>Exclusive Deals</Text>
          </View>
          
          <View style={[s.gridItem, { backgroundColor: THEME.light }]}>
            <View style={[s.gridIcon, { backgroundColor: THEME.primary }]}>
              <Svg width={ws(18)} height={ws(18)} viewBox="0 0 24 24" fill="none">
                <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                <Circle cx="9" cy="7" r="4" stroke="#FFFFFF" strokeWidth="1.8" fill="none"/>
                <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              </Svg>
            </View>
            <Text style={s.gridText}>50,000+ Customers</Text>
          </View>
        </View>

        <View style={s.trustBadges}>
          <Text style={[s.trustSimple, { color: THEME.primary }]}>✦ 25 Years of Trust & Improvement ✦</Text>
        </View>

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
  circleWrap:        { marginBottom: hs(28), shadowColor: '#6A2F12', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 24, elevation: 14, marginTop: hs(8) },
  circle:            { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glowRing:          { position: 'absolute', width: CIRCLE_SIZE + ws(12), height: CIRCLE_SIZE + ws(12), borderRadius: (CIRCLE_SIZE + ws(12)) / 2, borderWidth: 1.5, opacity: 0.3, top: -ws(6), left: -ws(6) },
  card:              { alignItems: 'center', paddingHorizontal: ws(16), width: '100%' },
  titleButton:       { paddingHorizontal: ws(32), paddingVertical: hs(8), borderRadius: ws(25), marginBottom: hs(12), shadowColor: '#6A2F12', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  titleButtonText:   { fontSize: rf(13, 11, 15), fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: 1 },
  contentCard:       { width: '100%', backgroundColor: '#FFFFFF', paddingHorizontal: ws(18), paddingVertical: hs(16), borderRadius: ws(16), marginBottom: hs(12), borderWidth: 2, borderColor: THEME.light, shadowColor: THEME.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8, position: 'relative', overflow: 'hidden' },
  gradientAccent:    { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: THEME.primary },
  contentInner:      { gap: hs(6) },
  titleRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  mainTitle:         { fontSize: rf(20, 18, 22), fontWeight: '900', textAlign: 'center' },
  mainSubtitle:      { fontSize: rf(18, 16, 20), fontWeight: '900', textAlign: 'center', letterSpacing: 0.3 },
  cardDesc:          { fontSize: rf(12, 11, 13), color: '#6B7280', textAlign: 'center', lineHeight: rf(18, 16, 20), fontWeight: '500' },
  featuresGrid:      { flexDirection: 'row', flexWrap: 'wrap', width: '100%', marginBottom: hs(12), gap: ws(8) },
  gridItem:          { width: '48%', paddingVertical: hs(12), paddingHorizontal: ws(8), borderRadius: ws(10), alignItems: 'center' },
  gridIcon:          { width: ws(32), height: ws(32), borderRadius: ws(16), alignItems: 'center', justifyContent: 'center', marginBottom: hs(6) },
  gridIconText:      { fontSize: rf(16, 14, 18) },
  gridText:          { fontSize: rf(11, 10, 12), fontWeight: '600', color: '#374151', textAlign: 'center' },
  trustBadges:       { width: '100%', gap: hs(8), alignItems: 'center', marginBottom: hs(16), marginTop: hs(8) },
  trustBadge:        { paddingVertical: hs(8), paddingHorizontal: ws(12), borderRadius: ws(18), borderWidth: 2, alignItems: 'center' },
  trustText:         { fontSize: rf(10, 9, 11), fontWeight: '700', textAlign: 'center', letterSpacing: 0.3 },
  trustSimple:       { fontSize: rf(11, 9, 13), fontWeight: '700', textAlign: 'center', letterSpacing: 0.4, marginTop: hs(2) },
  trustLine:         { fontSize: rf(11, 9, 13), fontWeight: '700', textAlign: 'center', letterSpacing: 0.4, marginBottom: hs(16), marginTop: hs(8) },
  actionButtons:     { flexDirection: 'row', width: '100%', gap: ws(12), paddingBottom: hs(24) },
  switchButton:      { flex: 1, paddingVertical: hs(12), borderRadius: ws(25), borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', flexDirection: 'row', gap: ws(8) },
  switchIcon:        { fontSize: rf(18, 16, 20), color: THEME.primary, fontWeight: '900', lineHeight: rf(18, 16, 20), includeFontPadding: false, textAlignVertical: 'center' },
  switchButtonText:  { fontSize: rf(13, 12, 14), fontWeight: '700', letterSpacing: 0.3, lineHeight: rf(18, 16, 20) },
  continueButton:    { flex: 1, paddingVertical: hs(12), borderRadius: ws(25), alignItems: 'center', justifyContent: 'center', shadowColor: '#6A2F12', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  continueButtonText:{ fontSize: rf(13, 12, 14), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
});
