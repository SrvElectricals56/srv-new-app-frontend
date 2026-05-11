/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, TouchableOpacity, Image,
} from 'react-native';
import Svg, { Circle, Rect, Path, G, Line } from 'react-native-svg';
import { ws, hs, rf } from '../../shared/hooks/useResponsive';

const AView = Animated.View as any;
const CIRCLE_SIZE = ws(240);
const dealerImage = require('../../../assets/Dealer.png');

const THEME = {
  primary:   '#102A63',
  secondary: '#D79A37',
  light:     '#EEF3FB',
  circle:    '#EEF3FB',
  tag:       '#E7EDF8',
  tagText:   '#102A63',
};

const TAGS = ['Business Growth', 'First Point of Contact', 'Performance Driven'];

function BgIcons() {
  return (
    <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={StyleSheet.absoluteFill}>
      <G opacity={0.18} transform="translate(20, 40)">
        <Rect x="0" y="20" width="16" height="32" rx="4" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Rect x="44" y="20" width="16" height="32" rx="4" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Path d="M16 28 L20 24 L28 24 L32 28 L28 32 L20 32 Z" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Line x1="24" y1="24" x2="24" y2="32" stroke={THEME.primary} strokeWidth="2" strokeLinecap="round"/>
      </G>
      <G opacity={0.15} transform="translate(18, 140)">
        <Path d="M12 8 L8 12 L8 32 Q8 40 18 40 L28 40 Q38 40 38 32 L38 12 L34 8" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Circle cx="23" cy="26" r="6" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Line x1="23" y1="20" x2="23" y2="32" stroke={THEME.primary} strokeWidth="2" strokeLinecap="round"/>
      </G>
      <G opacity={0.15} transform={`translate(${CIRCLE_SIZE - 80}, 38)`}>
        <Rect x="0" y="0" width="42" height="42" rx="6" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Line x1="8" y1="28" x2="14" y2="22" stroke={THEME.primary} strokeWidth="2.5" strokeLinecap="round"/>
        <Line x1="14" y1="22" x2="20" y2="26" stroke={THEME.primary} strokeWidth="2.5" strokeLinecap="round"/>
        <Line x1="20" y1="26" x2="34" y2="12" stroke={THEME.primary} strokeWidth="2.5" strokeLinecap="round"/>
      </G>
      <G opacity={0.15} transform={`translate(${CIRCLE_SIZE - 72}, 138)`}>
        <Path d="M8 4 L8 12 Q8 20 16 20 L20 20 Q28 20 28 12 L28 4" stroke={THEME.primary} strokeWidth="2.5" fill="none"/>
        <Line x1="4" y1="4" x2="32" y2="4" stroke={THEME.primary} strokeWidth="2.5" strokeLinecap="round"/>
        <Line x1="18" y1="20" x2="18" y2="28" stroke={THEME.primary} strokeWidth="2.5" strokeLinecap="round"/>
        <Line x1="12" y1="28" x2="24" y2="28" stroke={THEME.primary} strokeWidth="2.5" strokeLinecap="round"/>
      </G>
    </Svg>
  );
}

function Character() {
  return (
    <Image
      source={dealerImage}
      style={{ width: ws(338), height: ws(338), marginTop: -hs(4) }}
      resizeMode="contain"
    />
  );
}

interface Props { onBack?: () => void; onContinue?: () => void; }

export default function DealerSlide({ onBack, onContinue }: Props) {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideUp   = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const glowAnim  = useRef(new Animated.Value(0.7)).current;
  const descScale = useRef(new Animated.Value(0.85)).current;
  const descFade  = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(20)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const chipAnims = useRef([0,1,2,3,4,5].map(() => new Animated.Value(0))).current;

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

    Animated.sequence([
      Animated.delay(600),
      Animated.stagger(100, chipAnims.map(anim =>
        Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 })
      )),
    ]).start();
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
          <Text style={s.titleButtonText}>FOR OUR SRV DEALERS</Text>
        </View>
        
        <AView style={[s.contentCard, { opacity: descFade, transform: [{ scale: descScale }] }]}>
          <View style={s.gradientAccent} />
          <View style={s.contentInner}>
            <View style={s.iconRow}>
              <View style={[s.iconCircle, { backgroundColor: THEME.primary }]}>
                <Svg width={ws(22)} height={ws(22)} viewBox="0 0 24 24" fill="none">
                  <Path d="M9 11L7.5 9.5C7 9 6.2 9 5.7 9.5L3.5 11.7C3 12.2 3 13 3.5 13.5L8.5 18.5C9 19 9.8 19 10.3 18.5L11 17.8" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M15 11L16.5 9.5C17 9 17.8 9 18.3 9.5L20.5 11.7C21 12.2 21 13 20.5 13.5L15.5 18.5C15 19 14.2 19 13.7 18.5L13 17.8" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M9 11L12 14L15 11" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M9 11L10.5 9.5C11 9 11.5 8.8 12 8.8C12.5 8.8 13 9 13.5 9.5L15 11" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  <Path d="M7 7L9 9M17 7L15 9" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round"/>
                </Svg>
              </View>
            </View>
            <Text style={[s.cardTitle, { color: THEME.primary }]}>PARTNERSHIP</Text>
            <Text style={s.cardSubtitle}>Thank You for Being the Channel Partner</Text>
            <Text style={s.cardDesc}>
              Let us build a strong relationship to ensure the distribution of SRV product range to the every corner of India.
            </Text>
          </View>
        </AView>

        <View style={s.statsRow}>
          <View style={[s.statBox, { backgroundColor: THEME.light }]}>
            <Svg width={ws(24)} height={ws(24)} viewBox="0 0 24 24" fill="none">
              <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={THEME.primary} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
              <Circle cx="9" cy="7" r="4" stroke={THEME.primary} strokeWidth="1.8" fill="none"/>
              <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke={THEME.primary} strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            </Svg>
            <Text style={[s.statNumber, { color: THEME.primary }]}>1000+</Text>
            <Text style={[s.statLabel, { color: THEME.primary }]}>DEALERS</Text>
          </View>
          <View style={[s.statBox, { backgroundColor: THEME.primary }]}>
            <Svg width={ws(24)} height={ws(24)} viewBox="0 0 24 24" fill="none">
              <Path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" stroke="#FFFFFF" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </Svg>
            <Text style={[s.statNumber, { color: '#FFFFFF' }]}>₹5L+</Text>
            <Text style={[s.statLabel, { color: '#FFFFFF' }]}>REWARDS</Text>
          </View>
          <View style={[s.statBox, { backgroundColor: THEME.light }]}>
            <Svg width={ws(24)} height={ws(24)} viewBox="0 0 24 24" fill="none">
              <Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={THEME.primary} strokeWidth="1.8" fill="none"/>
              <Circle cx="12" cy="9" r="2.5" stroke={THEME.primary} strokeWidth="1.8" fill="none"/>
            </Svg>
            <Text style={[s.statNumber, { color: THEME.primary }]}>8+</Text>
            <Text style={[s.statLabel, { color: THEME.primary }]}>STATES</Text>
          </View>
        </View>

        <View style={s.productsGrid}>
          {['Fan Box','Concealed Box','Modular Box','Junction Box','AC Stabilizer','PVC Pipes'].map((name, i) => (
            <AView key={name} style={[s.productChip, {
              opacity: chipAnims[i],
              transform: [{ scale: chipAnims[i].interpolate({ inputRange: [0,1], outputRange: [0.7, 1] }) }],
              borderColor: THEME.primary,
            }]}>
              <Text style={s.productChipText} numberOfLines={1} adjustsFontSizeToFit>{name}</Text>
            </AView>
          ))}
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
  circleWrap:        { marginBottom: hs(28), shadowColor: '#102A63', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 14, marginTop: hs(8) },
  circle:            { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glowRing:          { position: 'absolute', width: CIRCLE_SIZE + ws(12), height: CIRCLE_SIZE + ws(12), borderRadius: (CIRCLE_SIZE + ws(12)) / 2, borderWidth: 1.5, opacity: 0.3, top: -ws(6), left: -ws(6) },
  card:              { alignItems: 'center', paddingHorizontal: ws(16), width: '100%' },
  titleButton:       { paddingHorizontal: ws(32), paddingVertical: hs(8), borderRadius: ws(25), marginBottom: hs(12), shadowColor: '#102A63', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  titleButtonText:   { fontSize: rf(13, 11, 15), fontWeight: '900', color: '#FFFFFF', textAlign: 'center', letterSpacing: 1 },
  contentCard:       { width: '100%', backgroundColor: '#FFFFFF', paddingHorizontal: ws(16), paddingVertical: hs(12), borderRadius: ws(14), marginBottom: hs(12), borderWidth: 2, borderColor: THEME.light, shadowColor: THEME.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 8, position: 'relative', overflow: 'hidden' },
  gradientAccent:    { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: THEME.primary },
  contentInner:      { gap: hs(4) },
  iconRow:           { alignItems: 'center', marginBottom: hs(2) },
  iconCircle:        { width: ws(36), height: ws(36), borderRadius: ws(18), alignItems: 'center', justifyContent: 'center' },
  iconEmoji:         { fontSize: rf(18, 16, 20) },
  cardTitle:         { fontSize: rf(10, 9, 11), fontWeight: '800', textAlign: 'center', letterSpacing: 1, marginBottom: hs(3) },
  cardSubtitle:      { fontSize: rf(12, 11, 13), fontWeight: '700', color: '#4B5563', textAlign: 'center', marginBottom: hs(4) },
  cardDesc:          { fontSize: rf(10, 9, 11), color: '#6B7280', textAlign: 'center', lineHeight: rf(15, 14, 16), fontWeight: '500' },
  statsRow:          { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: hs(8), gap: ws(8) },
  statBox:           { flex: 1, paddingVertical: hs(10), paddingHorizontal: ws(6), borderRadius: ws(10), alignItems: 'center', gap: hs(2) },
  statNumber:        { fontSize: rf(16, 14, 18), fontWeight: '900', marginBottom: hs(2) },
  statLabel:         { fontSize: rf(9, 8, 10), fontWeight: '700', letterSpacing: 0.5 },
  featuresList:      { width: '100%', marginBottom: hs(20), gap: hs(8) },
  featureItem:       { flexDirection: 'row', alignItems: 'center', paddingVertical: hs(10), paddingHorizontal: ws(14), borderRadius: ws(10) },
  featureIcon:       { width: ws(32), height: ws(32), borderRadius: ws(16), alignItems: 'center', justifyContent: 'center', marginRight: ws(10) },
  featureIconText:   { fontSize: rf(16, 14, 18) },
  featureText:       { fontSize: rf(12, 11, 13), fontWeight: '600', color: '#374151', flex: 1 },
  trustBadges:       { width: '100%', gap: hs(8), alignItems: 'center', marginBottom: hs(24), marginTop: hs(4) },
  trustBadge:        { paddingVertical: hs(8), paddingHorizontal: ws(12), borderRadius: ws(18), borderWidth: 2, alignItems: 'center' },
  trustText:         { fontSize: rf(10, 9, 11), fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 },
  trustSimple:       { fontSize: rf(11, 9, 13), fontWeight: '700', textAlign: 'center', letterSpacing: 0.4 },
  productsGrid:      { flexDirection: 'row', flexWrap: 'wrap', width: '100%', gap: ws(6), marginBottom: hs(8), marginTop: hs(10) },
  productChip:       { paddingVertical: hs(6), paddingHorizontal: ws(10), borderRadius: ws(20), borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', width: '31%', backgroundColor: '#EEF3FB', minHeight: hs(32) },
  productChipText:   { fontSize: rf(9, 8, 10), fontWeight: '800', textAlign: 'center', letterSpacing: 0.4, color: '#102A63' },
  trustLine:         { fontSize: rf(11, 9, 13), fontWeight: '700', textAlign: 'center', letterSpacing: 0.4, marginBottom: hs(16), marginTop: hs(8) },
  actionButtons:     { flexDirection: 'row', width: '100%', gap: ws(12), paddingBottom: hs(24) },
  switchButton:      { flex: 1, paddingVertical: hs(12), borderRadius: ws(25), borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', flexDirection: 'row', gap: ws(8) },
  switchIcon:        { fontSize: rf(18, 16, 20), color: THEME.primary, fontWeight: '900', lineHeight: rf(18, 16, 20), includeFontPadding: false, textAlignVertical: 'center' },
  switchButtonText:  { fontSize: rf(13, 12, 14), fontWeight: '700', letterSpacing: 0.3, lineHeight: rf(18, 16, 20) },
  continueButton:    { flex: 1, paddingVertical: hs(12), borderRadius: ws(25), alignItems: 'center', justifyContent: 'center', shadowColor: '#102A63', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 6 },
  continueButtonText:{ fontSize: rf(13, 12, 14), fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.3 },
});
