import { useEffect, useRef } from 'react';
import { Animated, Linking, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LocalizedText as Text } from '@/shared/preferences/LocalizedNative';
import { usePreferenceContext } from '@/shared/preferences';
import { openWhatsAppSupport } from '@/shared/utils/whatsapp';

const PHONE_NUMBER = '8837684004';

export function HomeHeaderContact({ accent }: { accent: string }) {
  const { tx } = usePreferenceContext();
  const colorWave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(colorWave, { toValue: 1, duration: 450, useNativeDriver: false }),
      Animated.timing(colorWave, { toValue: 0, duration: 450, useNativeDriver: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [colorWave]);

  const hintBackground = colorWave.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FFF18A', '#FFB5C8', '#88E3FF'],
  });
  const hintScale = colorWave.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.07, 1],
  });

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`WhatsApp ${PHONE_NUMBER}`}
          onPress={() => void openWhatsAppSupport(`91${PHONE_NUMBER}`)}
          hitSlop={{ left: 12, right: 0, top: 12, bottom: 12 }}
          style={styles.whatsappButton}
        >
          <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
            <Path d="M12 4.25A7.75 7.75 0 005.21 15.7L4 19.75l4.17-1.1A7.75 7.75 0 1012 4.25z" stroke="#FFFFFF" strokeWidth={1.9} strokeLinejoin="round" />
            <Path d="M9.15 8.95c.18-.4.39-.42.57-.42h.49c.15 0 .36.06.54.46.18.4.6 1.45.66 1.56.06.11.1.24.02.38-.08.15-.13.25-.25.38-.11.13-.24.29-.34.39-.11.11-.22.22-.09.42.13.2.58.95 1.25 1.54.86.76 1.58 1 1.8 1.1.22.1.35.09.48-.07.13-.16.54-.64.68-.86.14-.22.29-.18.48-.11.2.07 1.24.59 1.45.7.21.1.35.16.4.25.05.09.05.54-.13 1.04-.18.51-1.02.98-1.42 1.03-.37.06-.85.09-1.36-.07-.31-.1-.71-.23-1.23-.46-2.15-.94-3.56-3.16-3.67-3.32-.11-.16-.89-1.18-.89-2.25 0-1.07.56-1.6.76-1.82z" fill="#FFFFFF" />
          </Svg>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${tx('Call Us')} ${PHONE_NUMBER}`}
          onPress={() => void Linking.openURL(`tel:+91${PHONE_NUMBER}`).catch(() => undefined)}
          style={styles.callButton}
        >
          <View style={styles.numberRow}>
            <Text numberOfLines={1} style={[styles.number, { color: accent }]}>{PHONE_NUMBER}</Text>
          </View>
          <Animated.View style={[styles.hint, { backgroundColor: hintBackground, transform: [{ scale: hintScale }] }]} pointerEvents="none">
            <Text numberOfLines={1} style={styles.hintText}>☝ {tx('Call Us')}</Text>
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center',
  },
  actions: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 4 },
  callButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 0 },
  numberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  number: { flexShrink: 1, fontSize: 14, fontWeight: '900', letterSpacing: 0.1 },
  whatsappButton: { width: 20, height: 20, borderRadius: 10, marginTop: 5, alignSelf: 'flex-start', backgroundColor: '#25D366', alignItems: 'center', justifyContent: 'center' },
  hint: { alignSelf: 'center', minWidth: 75, maxWidth: '100%', height: 17, borderRadius: 9, justifyContent: 'center', paddingHorizontal: 5 },
  hintText: { color: '#172B4D', fontSize: 10, fontWeight: '900', lineHeight: 13, textAlign: 'center' },
});
