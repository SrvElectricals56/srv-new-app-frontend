import React, { useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppIcon, C, IconName, PageHeader } from '../components/ProfileShared';
import { Dialog } from '@/shared/components/Dialog';
import { usePreferenceContext } from '@/shared/preferences';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';

const referImage = require('../assets/referfriend.png');

export function ReferFriendPage({ onBack }: { onBack: () => void }) {
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; onOk?: () => void }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));
  const { t, tx, theme } = usePreferenceContext();
  const { role } = useAuth();
  const { referral } = useAppData();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'refer_friend');

  const referCode = referral?.code ?? '';
  const referralLink = referral?.link ?? `https://srvelectricals.com/join?ref=${referCode}`;
  const shareMessage = `Join SRV Electricals with my referral link: ${referralLink}`;

  const copyCode = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(referralLink);
      setDialog({ visible: true, variant: 'success', title: 'Copied!', message: 'Referral link copied to clipboard.' }); return;
    }
    await Share.share({ message: shareMessage, url: referralLink });
  };

  const shareCode = async () => {
    await Share.share({ message: shareMessage, url: referralLink });
  };

  const openWhatsApp = () => {
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
    Linking.canOpenURL(whatsappUrl).then((supported) => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`);
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('referFriend')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View
          style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={styles.heroAccent} />
          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
            {tx('Invite Friends')}
          </Text>
          <View style={styles.heroImageWrap}>
            <Image source={referImage} style={styles.heroImage} resizeMode="contain" />
          </View>
          <Text style={[styles.heroSub, { color: theme.textMuted }]}>
            {tx('Copy Your Code, Share It With Your Friends.')}
          </Text>
        </View>

        <View
          style={[styles.codeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <View style={styles.codeTop}>
            <View style={styles.codeBadge}>
              <AppIcon name="refer" size={18} color={C.blue} />
            </View>
            <Text style={[styles.codeLabel, { color: theme.textMuted }]}>
              {tx('Referral Link')}
            </Text>
          </View>
          <View style={styles.codeRow}>
            <Text style={[styles.linkValue, { color: theme.textPrimary }]} numberOfLines={1}>
              {referralLink}
            </Text>
            <TouchableOpacity style={styles.copyBtn} onPress={copyCode}>
              <Text style={styles.copyText}>{tx('Copy')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <Text style={[styles.dividerText, { color: theme.textMuted }]}>{tx('OR')}</Text>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
        </View>

        <Text style={[styles.sendTitle, { color: theme.textPrimary }]}>
          {tx('Send Invite With')}
        </Text>
        <View style={styles.shareRow}>
          {[
            ['link', 'Share', shareCode],
            ['message', 'Message', shareCode],
            ['whatsapp', 'WhatsApp', openWhatsApp],
          ].map(([icon, label, fn]) => (
            <TouchableOpacity
              key={label as string}
              style={[styles.shareBtn, { backgroundColor: theme.soft, borderColor: theme.border }]}
              onPress={fn as () => void}
              activeOpacity={0.8}
            >
              <AppIcon
                name={icon as IconName}
                size={24}
                  color={label === 'WhatsApp' ? '#16A34A' : C.primary}
                />
            </TouchableOpacity>
          ))}
        </View>

        {/* <View style={[styles.stepsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.howTitle, { color: theme.textPrimary }]}>How It Works?</Text>
          <Text style={[styles.howText, { color: theme.textPrimary }]}>1. Invite Your Friends</Text>
          <Text style={[styles.howText, { color: theme.textPrimary }]}>2. They Hit The Road With 20% off</Text>
          <Text style={[styles.howText, { color: theme.textPrimary }]}>3. You Make Saving!</Text>
        </View> */}
      </ScrollView>
      <Dialog visible={dialog.visible} variant={dialog.variant} title={dialog.title} message={dialog.message} onClose={closeDialog} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 16, paddingBottom: 32 },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  heroAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: C.blue,
  },
  heroTitle: { fontSize: 18, fontWeight: '900' },
  heroImageWrap: { width: '100%', alignItems: 'center', justifyContent: 'center', minHeight: 190 },
  heroImage: { width: 260, height: 180 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  codeCard: { borderRadius: 26, borderWidth: 1, padding: 18, gap: 12 },
  codeTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: C.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: C.blue,
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    backgroundColor: '#F5F7FA',
  },
  linkValue: { flex: 1, fontSize: 12, fontWeight: '700', marginRight: 10 },
  copyBtn: {
    backgroundColor: C.blue,
    borderRadius: 18,
    paddingHorizontal: 24,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontWeight: '700' },
  sendTitle: { textAlign: 'center', fontSize: 18, fontWeight: '800' },
  shareRow: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  shareBtn: {
    width: 56,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsCard: { borderRadius: 24, borderWidth: 1, padding: 18 },
  howTitle: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
  howText: { fontSize: 14, fontWeight: '700', lineHeight: 24 },
});
