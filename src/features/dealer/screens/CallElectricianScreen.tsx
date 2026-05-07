import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { usePreferenceContext } from '@/shared/preferences';
import { electriciansApi } from '@/shared/api';

function PhoneIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.2 4.8h2.4l1.1 3.4-1.5 1.5a14.8 14.8 0 005.1 5.1l1.5-1.5 3.4 1.1v2.4a1.5 1.5 0 01-1.5 1.5A14.9 14.9 0 014.2 6.3 1.5 1.5 0 015.7 4.8h1.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function WhatsAppIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4.25A7.75 7.75 0 005.21 15.7L4 19.75l4.17-1.1A7.75 7.75 0 1012 4.25z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinejoin="round"
      />
      <Path
        d="M9.15 8.95c.18-.4.39-.42.57-.42h.49c.15 0 .36.06.54.46.18.4.6 1.45.66 1.56.06.11.1.24.02.38-.08.15-.13.25-.25.38-.11.13-.24.29-.34.39-.11.11-.22.22-.09.42.13.2.58.95 1.25 1.54.86.76 1.58 1 1.8 1.1.22.1.35.09.48-.07.13-.16.54-.64.68-.86.14-.22.29-.18.48-.11.2.07 1.24.59 1.45.7.21.1.35.16.4.25.05.09.05.54-.13 1.04-.18.51-1.02.98-1.42 1.03-.37.06-.85.09-1.36-.07-.31-.1-.71-.23-1.23-.46-2.15-.94-3.56-3.16-3.67-3.32-.11-.16-.89-1.18-.89-2.25 0-1.07.56-1.6.76-1.82z"
        fill={color}
      />
    </Svg>
  );
}

export function CallElectricianScreen() {
  const { tx, theme } = usePreferenceContext();
  const [electricians, setElectricians] = useState<{ id: string; name: string; phone: string; city?: string }[]>([]);

  useEffect(() => {
    electriciansApi.getCallList().then((res) => {
      if (res.data?.length) {
        setElectricians(res.data.map((e: any) => ({
          id: e.id,
          name: e.name,
          phone: e.phone,
          city: e.city ?? '',
          whatsapp: `91${e.phone}`,
        })));
      }
    }).catch(() => {
      // fallback: try getAll
      electriciansApi.getAll(1, 100).then((res2) => {
        if (res2.data?.length) {
          setElectricians(res2.data.map((e: any) => ({
            id: e.id,
            name: e.name,
            phone: e.phone,
            city: e.city ?? '',
          })));
        }
      }).catch(() => {});
    });
  }, []);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={['#5A3A07', '#8A5A12', '#C8891E']} style={styles.hero}>
        <Text style={styles.heroEyebrow}>{tx('Dealer Calling Desk')}</Text>
        <Text style={styles.heroTitle}>{tx('Reach your electricians instantly')}</Text>
        <Text style={styles.heroSub}>
          {tx(
            'Use normal phone call or WhatsApp call actions to connect with any associated electrician.'
          )}
        </Text>
      </LinearGradient>

      {electricians.slice(0, 20).map((item) => (
        <View
          key={item.id}
          style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View>
            <Text style={[styles.name, { color: theme.textPrimary }]}>{item.name}</Text>
            <Text style={[styles.phone, { color: theme.textMuted }]}>+91 {item.phone}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.whatsAppBtn]}
              activeOpacity={0.88}
              onPress={() => Linking.openURL(`https://wa.me/${item.phone}`)}
            >
              <WhatsAppIcon />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.callBtn]}
              activeOpacity={0.88}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
            >
              <PhoneIcon />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 120 },
  hero: { borderRadius: 28, padding: 20 },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  heroTitle: { color: '#FFFFFF', fontSize: 27, fontWeight: '900', marginTop: 8 },
  heroSub: { color: 'rgba(255,255,255,0.84)', fontSize: 13, lineHeight: 20, marginTop: 8 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E4EBF4',
  },
  name: { color: '#18283E', fontSize: 16, fontWeight: '800' },
  phone: { color: '#72839A', fontSize: 12.5, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsAppBtn: { backgroundColor: '#1FAF63' },
  callBtn: { backgroundColor: '#2953A5' },
});

