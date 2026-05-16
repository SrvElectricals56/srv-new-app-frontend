import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
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
  const { tx, theme, darkMode } = usePreferenceContext();
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
      style={[styles.screen, darkMode ? styles.screenDark : null]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero — dealer blue gradient */}
      <LinearGradient
        colors={darkMode ? ['#0B1220', '#101A2F', '#18263E'] : ['#1A3A6E', '#173E80', '#2563EB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        {/* decorative glow circles */}
        <View style={styles.heroGlowOne} />
        <View style={styles.heroGlowTwo} />

        <Text style={styles.heroEyebrow}>{tx('Dealer Calling Desk')}</Text>
        <Text style={styles.heroTitle}>{tx('Reach your electricians instantly')}</Text>
        <Text style={styles.heroSub}>
          {tx(
            'Use normal phone call or WhatsApp call actions to connect with any associated electrician.'
          )}
        </Text>

        {/* stats pill */}
        <View style={styles.heroPill}>
          <View style={styles.heroPillDot} />
          <Text style={styles.heroPillText}>
            {electricians.length} {tx('electricians in your network')}
          </Text>
        </View>
      </LinearGradient>

      {electricians.length === 0 && (
        <View style={[styles.emptyCard, darkMode ? styles.emptyCardDark : null]}>
          <View style={styles.emptyIconWrap}>
            <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
              <Circle cx="10" cy="8" r="3.2" stroke="#173E80" strokeWidth={1.8} />
              <Path
                d="M4.6 18.5c1.1-2.3 3-3.6 5.4-3.6 2.3 0 4.2 1.2 5.4 3.6"
                stroke="#173E80"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
              <Path d="M16.8 7.2v5.6M14 10h5.6" stroke="#173E80" strokeWidth={2.2} strokeLinecap="round" />
            </Svg>
          </View>
          <Text style={[styles.emptyTitle, darkMode ? styles.emptyTitleDark : null]}>
            {tx('No electricians yet')}
          </Text>
          <Text style={[styles.emptySub, darkMode ? styles.emptySubDark : null]}>
            {tx('Associate electricians from the home screen to see them here.')}
          </Text>
        </View>
      )}

      {electricians.slice(0, 20).map((item) => (
        <View
          key={item.id}
          style={[styles.card, darkMode ? styles.cardDark : null]}
        >
          {/* avatar */}
          <View style={[styles.avatar, darkMode ? styles.avatarDark : null]}>
            <Text style={[styles.avatarText, darkMode ? styles.avatarTextDark : null]}>
              {item.name.slice(0, 2).toUpperCase()}
            </Text>
          </View>

          <View style={styles.cardInfo}>
            <Text style={[styles.name, darkMode ? styles.nameDark : null]}>{item.name}</Text>
            <Text style={[styles.phone, darkMode ? styles.phoneDark : null]}>+91 {item.phone}</Text>
            {item.city ? (
              <Text style={[styles.city, darkMode ? styles.cityDark : null]}>{item.city}</Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.whatsAppBtn}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(`https://wa.me/91${item.phone}`)}
              accessibilityLabel={`WhatsApp ${item.name}`}
            >
              <WhatsAppIcon color="#FFFFFF" size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.callBtn}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(`tel:${item.phone}`)}
              accessibilityLabel={`Call ${item.name}`}
            >
              <PhoneIcon color="#FFFFFF" size={20} />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F8FF' },
  screenDark: { backgroundColor: '#08111F' },
  content: { padding: 16, gap: 14, paddingBottom: 120 },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    borderRadius: 28,
    padding: 22,
    paddingBottom: 26,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlowOne: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(96,165,250,0.18)',
    top: -60,
    right: -40,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(191,219,254,0.14)',
    bottom: -30,
    left: -20,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 8,
    lineHeight: 32,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 16,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroPillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#86EFAC',
  },
  heroPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4EBF4',
  },
  emptyCardDark: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
  },
  emptyIconWrap: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#152238',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyTitleDark: { color: '#F8FAFC' },
  emptySub: {
    color: '#74829D',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptySubDark: { color: '#94A3B8' },

  // ── Electrician card ──────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E4EBF4',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardDark: {
    backgroundColor: '#111827',
    borderColor: '#1E293B',
  },

  // avatar
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarDark: { backgroundColor: '#1E3A5F' },
  avatarText: {
    color: '#173E80',
    fontSize: 15,
    fontWeight: '900',
  },
  avatarTextDark: { color: '#93C5FD' },

  // card text
  cardInfo: { flex: 1 },
  name: { color: '#18283E', fontSize: 15, fontWeight: '800' },
  nameDark: { color: '#F8FAFC' },
  phone: { color: '#72839A', fontSize: 12, marginTop: 2 },
  phoneDark: { color: '#94A3B8' },
  city: { color: '#A0AABF', fontSize: 11, marginTop: 2 },
  cityDark: { color: '#64748B' },

  // action buttons
  actions: { flexDirection: 'row', gap: 10 },
  whatsAppBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
  },
  callBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#173E80',
  },
});

