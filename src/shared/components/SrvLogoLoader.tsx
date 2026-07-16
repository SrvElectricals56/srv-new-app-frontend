import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet, View } from 'react-native';

type Props = { visible: boolean; label?: string };

const srvLogo = require('../../../assets/srv-logo.png');

export function SrvLogoLoader({ visible }: Props) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      spin.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animation.start();
    return () => animation.stop();
  }, [spin, visible]);

  if (!visible) return null;

  const spinStyle = {
    transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
  };

  return (
    <View style={styles.overlay} pointerEvents="none">
      <View style={styles.loader}>
        <Animated.View style={[styles.spinner, spinStyle]} />
        <View style={styles.logoCircle}>
          <Image source={srvLogo} style={styles.logo} resizeMode="contain" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  loader: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: 'rgba(27, 83, 164, 0.18)',
    borderTopColor: '#1B53A4',
    borderRightColor: '#57B7F1',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});
