import { useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';

type Props = { onFinished: () => void };

const INK = '#080F27';
const CYAN = '#45DDF8';
const VIOLET = '#8D77FF';
const CORAL = '#FF6A70';

/** A short, self-contained launch sequence shown on every cold app start. */
export function AnimatedLaunchScreen({ onFinished }: Props) {
  const { width, height } = useWindowDimensions();
  const fade = useRef(new Animated.Value(1)).current;
  const atmosphere = useRef(new Animated.Value(0)).current;
  const rails = useRef(new Animated.Value(0)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const ringScale = useRef(new Animated.Value(0.78)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const tileScale = useRef(new Animated.Value(0.92)).current;
  const tileY = useRef(new Animated.Value(0)).current;
  const tileGlow = useRef(new Animated.Value(0)).current;
  const wordOpacity = useRef(new Animated.Value(0)).current;
  const wordY = useRef(new Animated.Value(18)).current;
  const detailOpacity = useRef(new Animated.Value(0)).current;
  const detailY = useRef(new Animated.Value(12)).current;
  const accentWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    let reducedMotionTimer: ReturnType<typeof setTimeout> | undefined;
    let animation: Animated.CompositeAnimation | undefined;
    const timing = (value: Animated.Value, toValue: number, duration: number, delay = 0) =>
      Animated.timing(value, withWebSafeNativeDriver({
        toValue,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
      }));

    const start = (reduceMotion: boolean) => {
      if (!active) return;
      if (reduceMotion) {
        atmosphere.setValue(1);
        rails.setValue(1);
        ringOpacity.setValue(0.55);
        ringScale.setValue(1);
        tileScale.setValue(1);
        tileY.setValue(-14);
        tileGlow.setValue(1);
        wordOpacity.setValue(1);
        wordY.setValue(0);
        detailOpacity.setValue(1);
        detailY.setValue(0);
        accentWidth.setValue(1);
        reducedMotionTimer = setTimeout(onFinished, 750);
        return;
      }

      animation = Animated.sequence([
        Animated.parallel([
          timing(atmosphere, 1, 900),
          timing(rails, 1, 730, 180),
          timing(ringOpacity, 0.62, 550, 170),
          timing(ringScale, 1.1, 1000, 180),
          timing(orbit, 1, 1450, 150),
          timing(tileScale, 1, 680),
          timing(tileY, -14, 680),
          timing(tileGlow, 1, 620, 260),
          timing(wordOpacity, 1, 420, 700),
          timing(wordY, 0, 500, 700),
          timing(detailOpacity, 1, 450, 990),
          timing(detailY, 0, 450, 990),
          timing(accentWidth, 1, 520, 910),
        ]),
        Animated.delay(420),
        timing(fade, 0, 350),
      ]);
      animation.start(({ finished }) => {
        if (active && finished) onFinished();
      });
    };

    void AccessibilityInfo.isReduceMotionEnabled()
      .then(start)
      .catch(() => start(false));

    return () => {
      active = false;
      animation?.stop();
      if (reducedMotionTimer) clearTimeout(reducedMotionTimer);
    };
  }, [accentWidth, atmosphere, detailOpacity, detailY, fade, onFinished, orbit, rails, ringOpacity, ringScale, tileGlow, tileScale, tileY, wordOpacity, wordY]);

  const rotation = orbit.interpolate({ inputRange: [0, 1], outputRange: ['-28deg', '112deg'] });
  const compact = height < 700 || width < 360;
  const tileSize = compact ? 158 : 184;

  return (
    <Animated.View style={[styles.overlay, { opacity: fade }]} accessibilityViewIsModal accessible accessibilityLabel="SRV Electricals opening">
      <StatusBar style="light" backgroundColor={INK} />
      <LinearGradient colors={['#060C21', '#101E49', '#060D25']} locations={[0, 0.52, 1]} style={StyleSheet.absoluteFill} />

      <Animated.View style={[styles.blueGlow, { opacity: atmosphere, transform: [{ scale: ringScale }] }]}>
        <LinearGradient colors={['rgba(42,112,255,0.36)', 'rgba(42,112,255,0)']} style={styles.glowFill} />
      </Animated.View>
      <Animated.View style={[styles.pinkGlow, { opacity: atmosphere, transform: [{ scale: ringScale }] }]}>
        <LinearGradient colors={['rgba(232,74,159,0.27)', 'rgba(232,74,159,0)']} style={styles.glowFill} />
      </Animated.View>

      <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
        <Path d={`M0 ${height * 0.24} H${width * 0.16} L${width * 0.25} ${height * 0.33} H${width * 0.37}`} stroke="rgba(69,221,248,0.18)" strokeWidth="1.2" fill="none" />
        <Path d={`M${width} ${height * 0.22} H${width * 0.84} L${width * 0.75} ${height * 0.31} H${width * 0.63}`} stroke="rgba(141,119,255,0.22)" strokeWidth="1.2" fill="none" />
        <Path d={`M0 ${height * 0.79} H${width * 0.16} L${width * 0.27} ${height * 0.7} H${width * 0.35}`} stroke="rgba(255,106,112,0.18)" strokeWidth="1.2" fill="none" />
        <Path d={`M${width} ${height * 0.76} H${width * 0.85} L${width * 0.74} ${height * 0.67} H${width * 0.65}`} stroke="rgba(69,221,248,0.17)" strokeWidth="1.2" fill="none" />
        <Circle cx={width * 0.37} cy={height * 0.33} r="3" fill={CYAN} opacity="0.7" />
        <Circle cx={width * 0.63} cy={height * 0.31} r="3" fill={VIOLET} opacity="0.7" />
        <Circle cx={width * 0.35} cy={height * 0.7} r="3" fill={CORAL} opacity="0.7" />
        <Circle cx={width * 0.65} cy={height * 0.67} r="3" fill={CYAN} opacity="0.7" />
      </Svg>

      <View style={[styles.topLabel, { top: compact ? 44 : 64 }]}>
        <View style={styles.topDot} />
        <Animated.Text style={[styles.topText, { opacity: detailOpacity }]}>SRV  /  EST. 2000</Animated.Text>
        <View style={styles.topDot} />
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.orbit, { opacity: ringOpacity, transform: [{ rotate: rotation }, { scale: ringScale }] }]}>
          <View style={[styles.orbitNode, styles.nodeCyan]} />
          <View style={[styles.orbitNode, styles.nodeViolet]} />
          <View style={[styles.orbitNode, styles.nodeCoral]} />
        </Animated.View>
        <Animated.View style={[styles.outerRing, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />
        <Animated.View style={[styles.rail, styles.leftRail, { transform: [{ scaleX: rails }] }]} />
        <Animated.View style={[styles.rail, styles.rightRail, { backgroundColor: VIOLET, transform: [{ scaleX: rails }] }]} />

        <Animated.View style={[styles.tileGlow, { opacity: tileGlow, transform: [{ scale: ringScale }] }]} />
        <Animated.View style={[styles.tile, { width: tileSize, height: tileSize, borderRadius: compact ? 36 : 42, transform: [{ translateY: tileY }, { scale: tileScale }] }]}>
          <LinearGradient colors={['#FFFFFF', '#F5FAFF', '#FFF7F3']} style={styles.tileFill}>
            <Image source={require('../../../assets/srv-app-icon-final-v2.png')} resizeMode="contain" style={styles.mark} />
          </LinearGradient>
          <View style={styles.tileShine} />
        </Animated.View>

        <Animated.View style={[styles.wordBlock, { opacity: wordOpacity, transform: [{ translateY: wordY }] }]}>
          <Animated.View style={[styles.accentRule, { transform: [{ scaleX: accentWidth }] }]}>
            <LinearGradient colors={[CYAN, VIOLET, CORAL]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.accentFill} />
          </Animated.View>
          <Animated.Text style={[styles.brandName, compact && styles.brandNameCompact]}>SRV ELECTRICALS</Animated.Text>
          <Animated.Text style={styles.brandLine}>POWERING EVERY CONNECTION</Animated.Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { bottom: compact ? 38 : 54, opacity: detailOpacity, transform: [{ translateY: detailY }] }]}>
        <View style={styles.footerLine} />
        <Animated.Text style={styles.footerText}>BUILT TO LAST. MADE TO INSPIRE.</Animated.Text>
        <View style={styles.footerLine} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 9999, alignItems: 'center', justifyContent: 'center', backgroundColor: INK, overflow: 'hidden' },
  glowFill: { flex: 1, borderRadius: 999 },
  blueGlow: { position: 'absolute', width: 480, height: 480, borderRadius: 240, top: '10%', left: '-35%' },
  pinkGlow: { position: 'absolute', width: 420, height: 420, borderRadius: 210, bottom: '4%', right: '-37%' },
  topLabel: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  topDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: CYAN },
  topText: { color: '#9DB3D8', fontSize: 10, fontWeight: '800', letterSpacing: 2.6 },
  center: { width: 320, height: 400, alignItems: 'center', justifyContent: 'center' },
  orbit: { position: 'absolute', top: 2, width: 286, height: 286, borderRadius: 143, borderWidth: 1.5, borderColor: 'rgba(123,178,255,0.52)', borderStyle: 'dashed' },
  outerRing: { position: 'absolute', top: -18, width: 326, height: 326, borderRadius: 163, borderWidth: 1, borderColor: 'rgba(69,221,248,0.19)' },
  orbitNode: { position: 'absolute', width: 9, height: 9, borderRadius: 5 },
  nodeCyan: { top: -5, left: 138, backgroundColor: CYAN },
  nodeViolet: { right: -5, top: 142, backgroundColor: VIOLET },
  nodeCoral: { left: 20, bottom: 34, backgroundColor: CORAL },
  rail: { position: 'absolute', top: 132, width: 94, height: 2, borderRadius: 2, backgroundColor: CYAN, opacity: 0.75 },
  leftRail: { left: -28 },
  rightRail: { right: -28 },
  tileGlow: { position: 'absolute', top: 36, width: 248, height: 248, borderRadius: 124, backgroundColor: '#5DA5FF', shadowColor: CYAN, shadowOpacity: 0.8, shadowRadius: 44, elevation: 10, opacity: 0.3 },
  tile: { zIndex: 2, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.95)', shadowColor: '#5BA8FF', shadowOpacity: 0.55, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 16, overflow: 'hidden' },
  tileFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mark: { width: '100%', height: '100%' },
  tileShine: { position: 'absolute', left: 16, right: 16, top: 8, height: 2, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.95)' },
  wordBlock: { position: 'absolute', top: 302, alignItems: 'center', width: '100%' },
  accentRule: { width: 58, height: 3, borderRadius: 3, overflow: 'hidden', marginBottom: 19 },
  accentFill: { flex: 1 },
  brandName: { color: '#FFFFFF', fontSize: 25, fontWeight: '900', letterSpacing: 3.8, textAlign: 'center' },
  brandNameCompact: { fontSize: 21, letterSpacing: 3 },
  brandLine: { color: '#9EBCDF', fontSize: 10, fontWeight: '800', letterSpacing: 2.1, textAlign: 'center', marginTop: 11 },
  footer: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  footerLine: { width: 22, height: 1, backgroundColor: 'rgba(138,176,227,0.5)' },
  footerText: { color: '#8CA2C8', fontSize: 9, fontWeight: '800', letterSpacing: 1.3, textAlign: 'center' },
});
