import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type AnimatedLaunchScreenProps = {
  onFinished: () => void;
};

export function AnimatedLaunchScreen({ onFinished }: AnimatedLaunchScreenProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.76)).current;
  const logoRotateY = useRef(new Animated.Value(-82)).current;
  const logoRotateX = useRef(new Animated.Value(12)).current;
  const logoY = useRef(new Animated.Value(22)).current;
  const haloScale = useRef(new Animated.Value(0.65)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const shadowScale = useRef(new Animated.Value(0.58)).current;
  const shadowOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotateY, {
          toValue: 0,
          duration: 760,
          easing: Easing.out(Easing.back(1.15)),
          useNativeDriver: true,
        }),
        Animated.timing(logoRotateX, {
          toValue: 0,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoY, {
          toValue: 0,
          duration: 680,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 12,
          stiffness: 118,
          mass: 0.78,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.timing(shadowOpacity, {
            toValue: 0.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(shadowScale, {
            toValue: 1,
            damping: 14,
            stiffness: 120,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(haloOpacity, {
            toValue: 0.18,
            duration: 240,
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(haloScale, {
              toValue: 1.35,
              duration: 760,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(haloOpacity, {
              toValue: 0,
              duration: 760,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(taglineY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1.035,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 10,
          stiffness: 155,
          mass: 0.6,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(420),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 260,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) onFinished();
    });

    return () => animation.stop();
  }, [haloOpacity, haloScale, logoOpacity, logoRotateX, logoRotateY, logoScale, logoY, onFinished, opacity, shadowOpacity, shadowScale, taglineOpacity, taglineY]);

  return (
    <Animated.View pointerEvents="auto" style={[styles.overlay, { opacity }]}>
      <LinearGradient colors={['#FFFFFF', '#FFF9F4', '#F5F7FB']} style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.halo,
            { opacity: haloOpacity, transform: [{ scale: haloScale }] },
          ]}
        />
        <Animated.View
          style={[
            styles.floorShadow,
            { opacity: shadowOpacity, transform: [{ scaleX: shadowScale }] },
          ]}
        />
        <Animated.View
          style={{
            opacity: logoOpacity,
            transform: [
              { perspective: 900 },
              { translateY: logoY },
              { rotateY: logoRotateY.interpolate({ inputRange: [-90, 0], outputRange: ['-90deg', '0deg'] }) },
              { rotateX: logoRotateX.interpolate({ inputRange: [0, 12], outputRange: ['0deg', '12deg'] }) },
              { scale: logoScale },
            ],
          }}
        >
          <Image
            source={require('../../../assets/srv-app-icon-final-v2.png')}
            resizeMode="contain"
            style={styles.logo}
          />
        </Animated.View>
        <Animated.View
          style={[styles.copy, { opacity: taglineOpacity, transform: [{ translateY: taglineY }] }]}
        >
          <Text style={styles.name}>SRV ELECTRICALS</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    top: 28,
    width: 174,
    height: 174,
    borderRadius: 87,
    backgroundColor: '#EF3239',
  },
  logo: {
    width: 238,
    height: 238,
  },
  floorShadow: {
    position: 'absolute',
    top: 224,
    width: 154,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#172033',
  },
  copy: {
    alignItems: 'center',
    marginTop: -20,
  },
  name: {
    color: '#202735',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 3,
  },
});
