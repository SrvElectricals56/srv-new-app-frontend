import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { Dialog } from '@/shared/components/Dialog';
import { usePreferenceContext } from '@/shared/preferences';
import { settingsApi } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';
import { openWhatsAppSupport } from '@/shared/utils/whatsapp';

const SUPPORT_PHONE = '8837684004';
const SUPPORT_WHATSAPP = '918837684004';
type ContactIconName = 'phone' | 'whatsapp' | 'mail' | 'building';

function ContactActionIcon({ name, color = C.primary, size = 24 }: { name: ContactIconName; color?: string; size?: number }) {
  if (name === 'whatsapp') {
    return (
      <Svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <Path
          d="M16 3.4C9.06 3.4 3.44 8.83 3.44 15.52c0 2.28.66 4.42 1.8 6.24L3.6 28.6l7.08-1.56A12.9 12.9 0 0 0 16 28c6.94 0 12.56-5.43 12.56-12.48S22.94 3.4 16 3.4Z"
          fill="#25D366"
        />
        <Path
          d="M22.94 19.46c-.31.86-1.55 1.58-2.2 1.69-.58.1-1.34.14-2.16-.14-.5-.17-1.14-.37-1.96-.72-3.45-1.48-5.7-4.87-5.87-5.1-.17-.22-1.4-1.86-1.4-3.56 0-1.7.89-2.53 1.2-2.88.31-.34.69-.43.92-.43h.66c.21.01.5-.08.78.6.31.74 1.05 2.55 1.14 2.74.09.19.14.41.03.65-.11.24-.17.39-.34.6-.17.21-.36.47-.52.63-.17.17-.35.36-.15.7.2.34.9 1.48 1.94 2.4 1.33 1.18 2.45 1.55 2.8 1.72.35.17.55.14.75-.09.2-.22.86-1 1.09-1.34.23-.34.46-.29.78-.17.31.12 2 .94 2.34 1.11.34.17.57.26.66.41.08.15.08.88-.23 1.74Z"
          fill="#FFFFFF"
        />
      </Svg>
    );
  }

  if (name === 'mail') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3.5" y="5.5" width="17" height="13" rx="3" stroke={color} strokeWidth={1.9} />
        <Path d="M5 8l6.1 4.72a1.5 1.5 0 0 0 1.8 0L19 8" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    );
  }

  if (name === 'building') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M5.5 20V5.8c0-1 .8-1.8 1.8-1.8h7.4c1 0 1.8.8 1.8 1.8V20" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
        <Path d="M3.8 20h16.4M9 8h4M9 11.5h4M9 15h4" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.1 4.8 9 4.36c.64-.15 1.3.18 1.55.79l.84 2.02c.22.53.08 1.15-.35 1.53l-1.06.94c.67 1.38 1.72 2.43 3.1 3.1l.94-1.06c.38-.43 1-.57 1.53-.35l2.02.84c.61.25.94.91.79 1.55l-.44 1.9c-.18.78-.87 1.34-1.67 1.34C10.07 17 5 11.93 5 5.75c0-.8.56-1.49 1.34-1.67l.76.72Z"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ContactSupportPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'contact_support');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'contact' | 'faq'>('contact');
  const [supportPhone] = useState(SUPPORT_PHONE);
  const [supportEmail, setSupportEmail] = useState('info@srvelectricals.com');
  const [headOffice] = useState(
    'Paul Electricals\nNangal kalan road, Village Jawaharke, Mansa, Punjab - 151505',
  );
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; onOk?: () => void }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));

  useEffect(() => {
    settingsApi.getAppSettings()
      .then((settings) => {
        if (settings.supportEmail) setSupportEmail(settings.supportEmail);
      })
      .catch(() => {});
  }, []);

  const contactItems = useMemo(() => [
    {
      icon: 'phone' as ContactIconName,
      label: tx('Phone'),
      value: supportPhone,
      color: '#0F766E',
      tint: '#CCFBF1',
      action: async () => {
        const telUrl = `tel:${supportPhone.replace(/[^0-9+]/g, '')}`;
        const canOpen = await Linking.canOpenURL(telUrl);
        if (canOpen) {
          await Linking.openURL(telUrl);
          return;
        }
        setDialog({ visible: true, variant: 'info', title: tx('Call'), message: `${tx('Call support at')} ${supportPhone}.` });
      },
    },
    {
      icon: 'whatsapp' as ContactIconName,
      label: tx('WhatsApp'),
      value: `+91 ${supportPhone}`,
      color: '#16A34A',
      tint: '#DCFCE7',
      action: async () => {
        await openWhatsAppSupport(SUPPORT_WHATSAPP);
      },
    },
    {
      icon: 'mail' as ContactIconName,
      label: tx('Email'),
      value: supportEmail,
      color: '#2563EB',
      tint: '#DBEAFE',
      action: async () => {
        const mailUrl = `mailto:${supportEmail}`;
        const canOpen = await Linking.canOpenURL(mailUrl);
        if (canOpen) {
          await Linking.openURL(mailUrl);
          return;
        }
        setDialog({ visible: true, variant: 'info', title: tx('Email'), message: `${tx('Email support at')} ${supportEmail}.` });
      },
    },
    {
      icon: 'building' as ContactIconName,
      label: tx('Head Office'),
      value: headOffice,
      color: '#7C3AED',
      tint: '#EDE9FE',
      action: () => setDialog({ visible: true, variant: 'info', title: tx('Address'), message: headOffice.replace('\n', ', ') }),
    },
  ], [headOffice, supportEmail, supportPhone, tx]);
  const faqData = [
    {
      q: tx('What is SRV Electricals?'),
      a: tx('SRV Electricals is an Indian electrical-products manufacturer established in 2000. The company supplies reliable products for residential, commercial and industrial installations.'),
    },
    {
      q: tx('Which products are available in the app?'),
      a: tx('You can browse fan boxes, concealed and modular boxes, MCB distribution boxes, bus bars, ventilation and industrial fans, stabilizers, switchgear, lighting products and other electrical accessories.'),
    },
    {
      q: tx('How do QR rewards work?'),
      a: tx('Sign in with the correct role, open the scanner and scan the genuine QR code printed on an eligible SRV product. Valid points are credited to your wallet after successful verification. Each QR code can be redeemed only once.'),
    },
    {
      q: tx('Where can I see my points and wallet history?'),
      a: tx('Open Wallet from the bottom navigation to view your available balance and transaction history. Pull down to refresh if you have just scanned a QR code or received transferred points.'),
    },
    {
      q: tx('How can I redeem a gift?'),
      a: tx('Open Gift Store, select a gift available for your role, confirm that you have enough points and submit the redemption. Gift redemptions and their delivery updates are shown separately under Gift Store Order.'),
    },
    {
      q: tx('Which payment methods are supported?'),
      a: tx('Online product purchases are processed securely through Razorpay using supported UPI, card, netbanking or wallet options. An order is confirmed only after the payment is successfully verified.'),
    },
    {
      q: tx('What happens if I cancel or close Razorpay?'),
      a: tx('Closing the payment window does not confirm an order and no successful purchase will appear in My Orders. You can return to checkout and try again whenever you are ready.'),
    },
    {
      q: tx('How can I cancel, return or request a refund?'),
      a: tx('Open My Orders, select the relevant product order and choose an available action. Cancellation is available for eligible active orders, while returns and refunds depend on delivery and payment status. Add a clear reason before submitting.'),
    },
    {
      q: tx('Where can I download the latest catalogue?'),
      a: tx('Tap Product Catalog on the home page to open the latest SRV catalogue. The catalogue contains the current product range and is updated by SRV administrators.'),
    },
    {
      q: tx('What should I do if an OTP is delayed?'),
      a: tx('Confirm that the mobile number is correct, wait for the SMS and use only the latest OTP within its validity period. If it expires, request a fresh OTP and avoid pressing Verify more than once.'),
    },
    {
      q: tx('How do I contact support?'),
      a: tx('Use the phone, WhatsApp or email options in Contact Us, or open Need Help to create a support ticket. Include your registered mobile number and order or QR details so the team can assist quickly.'),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('contactSupport')} onBack={onBack} />
      <View
        style={[styles.tabSwitcher, { backgroundColor: theme.soft, borderColor: theme.border }]}
      >
        {(['contact', 'faq'] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isActive && { backgroundColor: theme.surface }]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.tabBtnText,
                  { color: isActive ? theme.textPrimary : theme.textMuted },
                ]}
              >
                {tab === 'contact' ? t('contactUs') : t('faqs')}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'contact'
          ? contactItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.contactCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
                onPress={item.action}
                activeOpacity={0.8}
              >
                <View style={[styles.contactIcon, { backgroundColor: item.tint }]}>
                  <ContactActionIcon name={item.icon} size={24} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.contactLabel, { color: theme.textMuted }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.contactValue, { color: theme.textPrimary }]}>
                    {item.value}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          : faqData.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.faqCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: expandedIdx === i ? C.primary : theme.border,
                  },
                ]}
                onPress={() => setExpandedIdx(expandedIdx === i ? null : i)}
                activeOpacity={0.8}
              >
                <View style={styles.faqRow}>
                  <View style={styles.faqNumWrap}>
                    <Text style={styles.faqNum}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.faqQ, { flex: 1, color: theme.textPrimary }]}>{item.q}</Text>
                  <AppIcon
                    name={expandedIdx === i ? 'chevronUp' : 'chevronDown'}
                    size={18}
                    color={theme.textMuted}
                  />
                </View>
                {expandedIdx === i ? (
                  <View style={[styles.faqAnswer, { borderTopColor: theme.border }]}>
                    <Text style={[styles.faqA, { color: theme.textSecondary }]}>{item.a}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
      </ScrollView>
      <Dialog visible={dialog.visible} variant={dialog.variant} title={dialog.title} message={dialog.message} onClose={closeDialog} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 18,
    padding: 4,
    borderWidth: 1,
  },
  tabBtn: { flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tabBtnText: { fontSize: 14, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 32 },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  contactValue: { fontSize: 14, fontWeight: '700', lineHeight: 21 },
  faqCard: { borderRadius: 22, padding: 16, borderWidth: 1 },
  faqRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  faqNumWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqNum: { fontSize: 12, fontWeight: '900', color: C.primary },
  faqQ: { fontSize: 14, fontWeight: '700' },
  faqAnswer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  faqA: { fontSize: 14, lineHeight: 21 },
});
