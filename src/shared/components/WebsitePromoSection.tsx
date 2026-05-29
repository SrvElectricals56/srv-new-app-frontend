import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';

const WEBSITE_URL  = 'https://srvelectricals.com';
const WHATSAPP_URL = 'https://wa.me/918837684004';
const INSTAGRAM_URL = 'https://www.instagram.com/srv__electricals/';
const FACEBOOK_URL  = 'https://www.facebook.com/people/SRV-Electricals/61575756084140/';
const TWITTER_URL   = 'https://x.com/Srv_Electricals';

// ── Icons ──────────────────────────────────────────────────────────────────

function GlobeIcon({ color = '#FFFFFF', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={1.8} />
      <Path
        d="M3.8 12h16.4M12 3.5c2 2.1 3.2 5.2 3.2 8.5 0 3.3-1.2 6.4-3.2 8.5-2-2.1-3.2-5.2-3.2-8.5 0-3.3 1.2-6.4 3.2-8.5z"
        stroke={color}
        strokeWidth={1.8}
      />
    </Svg>
  );
}

function ArrowIcon({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M3.5 8h8.5M8.5 4.5L12 8l-3.5 3.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Real brand icons using official SVG paths

function WhatsAppBrandIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Green background circle */}
      <Circle cx="16" cy="16" r="16" fill="#25D366" />
      {/* Official WhatsApp phone+bubble path */}
      <Path
        d="M16 7.2A8.8 8.8 0 0 0 8.1 20.3L7 25l4.8-1.1A8.8 8.8 0 1 0 16 7.2zm0 16.1a7.3 7.3 0 0 1-3.7-1l-.3-.2-2.8.7.7-2.7-.2-.3A7.3 7.3 0 1 1 16 23.3zm4-5.5c-.2-.1-1.3-.6-1.5-.7-.2-.1-.3-.1-.5.1-.1.2-.5.7-.6.8-.1.1-.2.1-.4 0-.2-.1-.9-.3-1.7-1-.6-.6-1-1.2-1.2-1.4-.1-.2 0-.3.1-.4l.3-.4c.1-.1.1-.2.2-.3 0-.1 0-.2 0-.3-.1-.1-.5-1.2-.7-1.6-.2-.4-.4-.3-.5-.3h-.4c-.1 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.1 1.6 2.5 3.9 3.4.5.2 1 .4 1.3.5.6.2 1.1.1 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function InstagramBrandIcon({ size = 26 }: { size?: number }) {
  // Background is handled by the LinearGradient wrapper — icon is transparent
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Camera body — white stroke only, no fill, no black border */}
      <Rect x="8" y="8" width="16" height="16" rx="4.5" stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      {/* Lens */}
      <Circle cx="16" cy="16" r="4" stroke="#FFFFFF" strokeWidth={1.8} fill="none" />
      {/* Dot */}
      <Circle cx="21.5" cy="10.5" r="1.2" fill="#FFFFFF" />
    </Svg>
  );
}

function FacebookBrandIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Blue background */}
      <Circle cx="16" cy="16" r="16" fill="#1877F2" />
      {/* f letter */}
      <Path
        d="M20 10h-2.5A1.5 1.5 0 0 0 16 11.5V14h4l-.5 3H16v8h-3v-8h-2v-3h2v-2.5A4.5 4.5 0 0 1 17.5 7H20v3z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function TwitterBrandIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Black background */}
      <Circle cx="16" cy="16" r="16" fill="#000000" />
      {/* X logo */}
      <Path
        d="M18.5 14.2L24.3 7h-1.4l-5 5.8L13.8 7H9l6.1 8.9L9 23h1.4l5.3-6.2L20.2 23H25l-6.5-8.8zm-1.9 2.2l-.6-.9-5-7.1h2.1l4 5.7.6.9 5.2 7.4h-2.1l-4.2-6z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export function WebsitePromoSection({ darkMode }: { darkMode: boolean }) {
  const { tx, language } = usePreferenceContext();
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const btnScale  = useRef(new Animated.Value(1)).current;

  const websiteCopy =
    language === 'Hindi'
      ? {
          eyebrow:  'हमारी वेबसाइट देखें',
          title:    'SRV की पूरी प्रोडक्ट रेंज ऑनलाइन देखें',
          subtitle: 'कैटेगरी, प्रोडक्ट डिटेल्स और लेटेस्ट अपडेट सीधे SRV Electricals की आधिकारिक वेबसाइट पर देखें।',
          cta:      'वेबसाइट खोलें',
          followUs: 'हमें फॉलो करें',
        }
      : language === 'Punjabi'
        ? {
            eyebrow:  'ਸਾਡੀ ਵੈਬਸਾਈਟ ਵੇਖੋ',
            title:    'SRV ਦੀ ਪੂਰੀ ਪ੍ਰੋਡਕਟ ਰੇਂਜ ਆਨਲਾਈਨ ਵੇਖੋ',
            subtitle: 'ਕੈਟੇਗਰੀਆਂ, ਪ੍ਰੋਡਕਟ ਡੀਟੇਲ ਅਤੇ ਤਾਜ਼ਾ ਅਪਡੇਟ ਸਿੱਧੇ SRV Electricals ਦੀ ਅਧਿਕਾਰਿਕ ਵੈਬਸਾਈਟ ਉੱਤੇ ਵੇਖੋ।',
            cta:      'ਵੈਬਸਾਈਟ ਖੋਲ੍ਹੋ',
            followUs: 'ਸਾਨੂੰ ਫੋਲੋ ਕਰੋ',
          }
        : {
            eyebrow:  'Visit Our Website',
            title:    'Explore the full SRV product range online',
            subtitle: 'Discover categories, product details, and the latest updates directly on the official SRV Electricals website.',
            cta:      tx('Open Website'),
            followUs: 'Follow us',
          };

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, withWebSafeNativeDriver({ toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin) })),
        Animated.timing(floatAnim, withWebSafeNativeDriver({ toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin) })),
      ])
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, withWebSafeNativeDriver({ toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease) })),
        Animated.timing(pulseAnim, withWebSafeNativeDriver({ toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease) })),
      ])
    );
    floatLoop.start();
    pulseLoop.start();
    return () => { floatLoop.stop(); pulseLoop.stop(); };
  }, [floatAnim, pulseAnim]);

  const floatTranslateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] });
  const pulseScale      = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  const socialLinks = [
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      url: WHATSAPP_URL,
      Icon: WhatsAppBrandIcon,
      bg: '#25D366',
    },
    {
      key: 'instagram',
      label: 'Instagram',
      url: INSTAGRAM_URL,
      Icon: InstagramBrandIcon,
      bg: 'linear', // handled separately
      gradColors: ['#F58529', '#DD2A7B', '#8134AF', '#515BD4'] as const,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      url: FACEBOOK_URL,
      Icon: FacebookBrandIcon,
      bg: '#1877F2',
    },
    {
      key: 'twitter',
      label: 'Twitter',
      url: TWITTER_URL,
      Icon: TwitterBrandIcon,
      bg: '#000000',
    },
  ];

  return (
    <LinearGradient
      colors={darkMode ? ['#0F172A', '#16243D', '#1E3A5F'] : ['#FFF5EF', '#FFE1CF', '#DCEFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, darkMode ? styles.cardDark : null]}
    >
      <Animated.View style={[styles.glowOne, { transform: [{ scale: pulseScale }] }]} />
      <Animated.View style={[styles.glowTwo, { transform: [{ translateY: floatTranslateY }] }]} />

      {/* Header row */}
      <View style={styles.headerRow}>
        <Animated.View style={[styles.iconShell, { transform: [{ translateY: floatTranslateY }] }]}>
          <View style={styles.iconCore}>
            <GlobeIcon />
          </View>
        </Animated.View>
        <View style={styles.copyWrap}>
          <Text style={[styles.eyebrow, darkMode ? styles.eyebrowDark : null]}>
            {websiteCopy.eyebrow}
          </Text>
          <Text style={[styles.title, darkMode ? styles.titleDark : null]}>
            {websiteCopy.title}
          </Text>
        </View>
      </View>

      <Text style={[styles.subtitle, darkMode ? styles.subtitleDark : null]}>
        {websiteCopy.subtitle}
      </Text>

      {/* Open Website CTA */}
      <Pressable
        onPress={() => Linking.openURL(WEBSITE_URL)}
        onPressIn={() =>
          Animated.spring(btnScale, withWebSafeNativeDriver({ toValue: 0.97, tension: 120, friction: 8 })).start()
        }
        onPressOut={() =>
          Animated.spring(btnScale, withWebSafeNativeDriver({ toValue: 1, tension: 120, friction: 8 })).start()
        }
      >
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <LinearGradient
            colors={darkMode ? ['#E8453C', '#F97316'] : ['#173E80', '#2D6CDF']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.ctaBtn}
          >
            <Text style={styles.ctaText}>{websiteCopy.cta}</Text>
            <ArrowIcon />
          </LinearGradient>
        </Animated.View>
      </Pressable>

      <Text style={[styles.urlText, darkMode ? styles.urlTextDark : null]}>{WEBSITE_URL}</Text>

      {/* ── Social links row ── */}
      <View style={styles.divider} />
      <Text style={[styles.followLabel, darkMode ? styles.followLabelDark : null]}>
        {websiteCopy.followUs}
      </Text>
      <View style={styles.socialRow}>
        {socialLinks.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => Linking.openURL(s.url).catch(() => {})}
            style={({ pressed }) => [styles.socialBtn, { opacity: pressed ? 0.75 : 1 }]}
            accessibilityRole="link"
            accessibilityLabel={`Open ${s.label}`}
          >
            {s.key === 'instagram' ? (
              <LinearGradient
                colors={['#F58529', '#DD2A7B', '#8134AF']}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={styles.socialIconWrap}
              >
                <s.Icon size={28} />
              </LinearGradient>
            ) : (
              <View style={[styles.socialIconWrap, { backgroundColor: s.bg }]}>
                <s.Icon size={28} />
              </View>
            )}
            <Text style={[styles.socialLabel, darkMode ? styles.socialLabelDark : null]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </LinearGradient>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    marginBottom: 22,
    borderRadius: 28,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    ...createShadow({ color: '#0F172A', offsetY: 12, blur: 22, opacity: 0.1, elevation: 6 }),
  },
  cardDark: {
    ...createShadow({ color: '#020617', offsetY: 12, blur: 22, opacity: 0.24, elevation: 6 }),
  },
  glowOne: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(232,69,60,0.16)', top: -46, right: -22,
  },
  glowTwo: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(37,99,235,0.16)', bottom: -34, left: -16,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  iconShell: {
    width: 60, height: 60, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconCore: {
    width: 44, height: 44, borderRadius: 16,
    backgroundColor: '#173E80',
    alignItems: 'center', justifyContent: 'center',
  },
  copyWrap: { flex: 1 },
  eyebrow: {
    color: '#173E80', fontSize: 11, fontWeight: '800',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4,
  },
  eyebrowDark: { color: '#BFDBFE' },
  title: { color: '#14213D', fontSize: 20, lineHeight: 26, fontWeight: '900' },
  titleDark: { color: '#F8FAFC' },
  subtitle: { color: '#5C6F91', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  subtitleDark: { color: '#CBD5E1' },
  ctaBtn: {
    height: 50, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
  },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  urlText: { marginTop: 12, color: '#5C6F91', fontSize: 11.5, fontWeight: '700' },
  urlTextDark: { color: '#94A3B8' },

  // Social section
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.07)',
    marginTop: 18,
    marginBottom: 14,
  },
  followLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C6F91',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  followLabelDark: { color: '#94A3B8' },
  socialRow: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
  },
  socialBtn: {
    alignItems: 'center',
    gap: 6,
  },
  socialIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5C6F91',
  },
  socialLabelDark: { color: '#94A3B8' },
});
