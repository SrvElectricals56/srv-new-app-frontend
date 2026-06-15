import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

type Props = {
  visible: boolean;
  label?: string;
};

const srvLogo = require('../../../assets/srv-logo.png');

export function SrvLogoLoader({ visible, label = 'Loading...' }: Props) {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <View style={styles.card}>
        <View style={styles.logoWrap}>
          <Image source={srvLogo} style={styles.logo} resizeMode="contain" />
          <ActivityIndicator color="#EF3340" size="large" style={styles.spinner} />
        </View>
        <Text style={styles.label}>{label}</Text>
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
  card: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: 'transparent',
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 52,
    height: 52,
  },
  spinner: {
    position: 'absolute',
  },
  label: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '800',
  },
});
