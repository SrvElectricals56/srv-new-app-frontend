import React, { useEffect, useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon, C, IconName, PageHeader } from '../components/ProfileShared';
import { Dialog } from '@/shared/components/Dialog';
import { usePreferenceContext } from '@/shared/preferences';
import { settingsApi } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';

export function ContactSupportPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'contact_support');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'contact' | 'faq'>('contact');
  const [supportPhone, setSupportPhone] = useState('8837668004');
  const [supportEmail, setSupportEmail] = useState('info@srvelectricals.com');
  const [headOffice] = useState(
    'Paul Electricals\nNangal kalan road, Village Jawaharke, Mansa, Punjab - 151505',
  );
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; onOk?: () => void }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));

  useEffect(() => {
    settingsApi.getAppSettings()
      .then((settings) => {
        if (settings.supportPhone) setSupportPhone(settings.supportPhone);
        if (settings.supportEmail) setSupportEmail(settings.supportEmail);
      })
      .catch(() => {});
  }, []);

  const contactItems = useMemo(() => [
    {
      icon: 'phone' as IconName,
      label: tx('Phone'),
      value: supportPhone,
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
      icon: 'mail' as IconName,
      label: tx('Email'),
      value: supportEmail,
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
      icon: 'building' as IconName,
      label: tx('Head Office'),
      value: headOffice,
      action: () => setDialog({ visible: true, variant: 'info', title: tx('Address'), message: headOffice.replace('\n', ', ') }),
    },
  ], [headOffice, supportEmail, supportPhone, tx]);
  const faqData = [
    {
      q: tx('Q1. What is SRV Electricals?'),
      a: tx('SRV Electricals is a leading manufacturer of electrical products.'),
    },
    {
      q: tx('Q2. What products do you manufacture?'),
      a: tx('We manufacture MCB boxes, junction boxes and more.'),
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
                <View style={styles.contactIcon}>
                  <AppIcon name={item.icon} size={22} color={C.primary} />
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
