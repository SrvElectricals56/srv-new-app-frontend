import { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferenceContext } from '@/shared/preferences';
import { settingsApi } from '@/shared/api';
import { useAppPageContent } from '@/shared/hooks';
import { createShadow } from '@/shared/theme/shadows';
import type { Screen } from '@/shared/types/navigation';
import { counterboyTheme as cb } from '@/features/counterboy/theme';

function PhoneIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6.7 4.5h2.2c.5 0 1 .4 1.1.9l.6 3c.1.4-.1.9-.5 1.1l-1.8 1a14 14 0 006.3 6.3l1-1.8c.2-.4.7-.6 1.1-.5l3 .6c.5.1.9.6.9 1.1v2.2c0 .6-.5 1.2-1.2 1.2C10 21 3 14 5.5 5.7c0-.7.5-1.2 1.2-1.2z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WhatsAppIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 3.5a8.5 8.5 0 00-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1012 3.5z" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9.5 8.6c.2-.5.4-.6.7-.6h.6c.2 0 .4.1.5.4l.7 1.8c.1.2 0 .5-.1.6l-.5.7c.5 1 1.3 1.9 2.3 2.4l.8-.5c.2-.1.4-.1.6 0l1.7.8c.2.1.4.3.3.5v.6c0 .3-.1.5-.5.7-.4.2-1 .3-1.6.2-1.4-.3-2.8-1.2-4-2.5-1.2-1.2-2-2.6-2.3-4-.1-.5 0-1.1.2-1.5z" fill={color} />
    </Svg>
  );
}

function MailIcon({ color, size }: { color: string; size: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="14" rx="3" stroke={color} strokeWidth={1.8} />
      <Path d="M5 8l7 5 7-5" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SupportScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { tx } = usePreferenceContext();
  const insets = useSafeAreaInsets();
  const pageContent = useAppPageContent('counterboy', 'support');
  const [supportPhone, setSupportPhone] = useState('8837684004');
  const [supportEmail] = useState('info@srvelectricals.com');

  useEffect(() => {
    settingsApi.getAppSettings()
      .then((settings) => {
        if (settings.supportPhone) setSupportPhone(settings.supportPhone);
      })
      .catch(() => {});
  }, []);

  const items = useMemo(() => [
    {
      icon: 'phone',
      label: tx('Call Us'),
      value: supportPhone,
      desc: tx('Speak directly to our support team'),
      color: '#1F9C5D',
      action: () => {
        Linking.openURL(`tel:${supportPhone.replace(/[^0-9+]/g, '')}`);
      },
    },
    {
      icon: 'whatsapp',
      label: tx('WhatsApp'),
      value: supportPhone,
      desc: tx('Chat with us on WhatsApp'),
      color: cb.primary,
      action: () => {
        Linking.openURL(`https://wa.me/${supportPhone.replace(/[^0-9]/g, '')}?text=Hello%20SRV%20Team%2C%20I%20need%20help`);
      },
    },
    {
      icon: 'mail',
      label: tx('Email Us'),
      value: supportEmail,
      desc: tx('Send us an email anytime'),
      color: cb.primaryDeep,
      action: () => {
        Linking.openURL(`mailto:${supportEmail}?subject=Support%20Request`);
      },
    },
  ], [supportPhone, supportEmail, tx]);

  return (
    <View style={[s.screen, { paddingTop: insets.top + 16 }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroRing}>
            <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
              <Path d="M12 3a8.5 8.5 0 00-8.5 8.5c0 1.6.4 3 1.2 4.3L4 20l4.2-1a8.5 8.5 0 103.8-16z" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Path d="M12 13v.01" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
              <Path d="M9.5 10a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </View>
          <Text style={s.heroTitle}>{pageContent.pageTitle || pageContent.heroTitle || tx('Get in Touch')}</Text>
          <Text style={s.heroDesc}>{pageContent.pageSubtitle || pageContent.heroSubtitle || tx('Have a question or need assistance? We are just a tap away.')}</Text>
        </View>

        {/* Contact cards */}
        <View style={s.list}>
          {items.map((item, i) => (
            <TouchableOpacity key={item.label} onPress={item.action} activeOpacity={0.8}>
              <View style={s.card}>
                <View style={s.cardLeft}>
                  <View style={[s.iconBox, { backgroundColor: item.color + '18' }]}>
                    {item.icon === 'phone' ? <PhoneIcon color={item.color} size={24} /> : null}
                    {item.icon === 'whatsapp' ? <WhatsAppIcon color={item.color} size={24} /> : null}
                    {item.icon === 'mail' ? <MailIcon color={item.color} size={24} /> : null}
                  </View>
                  <View style={s.cardInfo}>
                    <Text style={[s.cardLabel, { color: item.color }]}>{item.label}</Text>
                    <Text style={s.cardDesc}>{item.desc}</Text>
                    <Text style={s.cardValue}>{item.value}</Text>
                  </View>
                </View>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <Path d="M9 18l6-6-6-6" stroke="#8A7A6E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>{pageContent.supportText || tx('Our team typically responds within 24 hours.')}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9F4ED' },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', paddingTop: 10, paddingBottom: 24, gap: 10 },
  heroRing: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: cb.primary, alignItems: 'center', justifyContent: 'center',
    ...createShadow({ color: cb.primary, offsetY: 6, blur: 18, opacity: 0.35, elevation: 10 }),
  },
  heroTitle: { fontSize: 22, fontWeight: '900', color: cb.primaryDeep, textAlign: 'center' },
  heroDesc: { fontSize: 13.5, color: '#8A7A6E', textAlign: 'center', lineHeight: 19, maxWidth: 280, fontWeight: '500' },
  list: { gap: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', padding: 16, borderRadius: 20,
    borderWidth: 1, borderColor: '#E0D0C0',
    ...createShadow({ color: '#6F4E37', offsetY: 4, blur: 12, opacity: 0.06, elevation: 4 }),
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  iconBox: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { gap: 2, flex: 1 },
  cardLabel: { fontSize: 13, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  cardDesc: { fontSize: 12, color: '#8A7A6E', fontWeight: '500' },
  cardValue: { fontSize: 15, fontWeight: '700', color: '#2D1A10', marginTop: 2 },
  footer: { alignItems: 'center', paddingTop: 20 },
  footerText: { fontSize: 12, color: '#8A7A6E', textAlign: 'center', fontWeight: '500', fontStyle: 'italic' },
});
