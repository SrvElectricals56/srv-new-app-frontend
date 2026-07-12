import React, { useMemo, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, C, IconName, PageHeader } from '../components/ProfileShared';
import { Dialog } from '@/shared/components/Dialog';
import { usePreferenceContext } from '@/shared/preferences';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';

const referImage = require('../assets/referfriend.png');
const DEFAULT_APP_LINK = 'https://play.google.com/store/apps/details?id=com.srvelectricals.app';

function withReferralCode(baseLink: string, code: string) {
  const cleanLink = baseLink?.trim() || DEFAULT_APP_LINK;
  if (!code) return cleanLink;
  if (cleanLink.includes('ref=')) return cleanLink;
  return `${cleanLink}${cleanLink.includes('?') ? '&' : '?'}ref=${encodeURIComponent(code)}`;
}

export function ReferFriendPage({ onBack }: { onBack: () => void }) {
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; onOk?: () => void }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));
  const { t, tx, theme } = usePreferenceContext();
  const { role } = useAuth();
  const { referral, appSettings } = useAppData();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'refer_friend');

  const referCode = referral?.code ?? '';
  const referralLink = useMemo(
    () => withReferralCode(referral?.link || appSettings?.playStoreUrl || DEFAULT_APP_LINK, referCode),
    [appSettings?.playStoreUrl, referral?.link, referCode],
  );
  const shareMessage = `Hello, join SRV Electricals app with my referral code ${referCode}. You get 20 points after successful account creation, and I also get 20 points. App link: ${referralLink}`;

  const copyCode = async () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(referralLink);
      setDialog({ visible: true, variant: 'success', title: tx('Copied'), message: tx('Referral app link copied successfully.') });
      return;
    }
    await Share.share({ message: shareMessage, url: referralLink });
  };

  const shareCode = async () => {
    await Share.share({ message: shareMessage, url: referralLink });
  };

  const openWhatsApp = () => {
    const text = encodeURIComponent(shareMessage);
    const whatsappUrl = `whatsapp://send?text=${text}`;
    Linking.canOpenURL(whatsappUrl).then((supported) => {
      if (supported) {
        Linking.openURL(whatsappUrl);
      } else {
        Linking.openURL(`https://wa.me/?text=${text}`);
      }
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('referFriend')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[theme.accent, '#234975', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTextCol}>
            <Text style={styles.heroEyebrow}>{tx('SRV Referral Rewards')}</Text>
            <Text style={styles.heroTitle}>{tx('Invite a friend. Both earn points.')}</Text>
            <Text style={styles.heroSub}>
              {tx('When your friend creates an account successfully from your referral, both of you receive 20 reward points.')}
            </Text>
          </View>
          <View style={styles.heroImageWrap}>
            <Image source={referImage} style={styles.heroImage} resizeMode="contain" />
          </View>
        </LinearGradient>

        <View style={styles.rewardRow}>
          {[
            { title: 'You get', value: '+20', caption: 'after friend joins', icon: 'star' as IconName, bg: '#FEF3C7', color: '#B45309' },
            { title: 'Friend gets', value: '+20', caption: 'after signup', icon: 'refer' as IconName, bg: '#DBEAFE', color: '#1D4ED8' },
          ].map((item) => (
            <View key={item.title} style={[styles.rewardCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.rewardIcon, { backgroundColor: item.bg }]}>
                <AppIcon name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={[styles.rewardValue, { color: item.color }]}>{item.value}</Text>
              <Text style={[styles.rewardTitle, { color: theme.textPrimary }]}>{tx(item.title)}</Text>
              <Text style={[styles.rewardCaption, { color: theme.textMuted }]}>{tx(item.caption)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.codeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.codeHeader}>
            <View style={[styles.codeBadge, { backgroundColor: theme.accentSoft }]}>
              <AppIcon name="refer" size={22} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.codeLabel, { color: theme.textMuted }]}>{tx('Your Referral Code')}</Text>
              <Text style={[styles.codeValue, { color: theme.textPrimary }]}>{referCode || tx('Loading')}</Text>
            </View>
          </View>

          <View style={[styles.linkBox, { borderColor: theme.border, backgroundColor: theme.soft }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.linkScroll}>
              <Text selectable style={[styles.linkValue, { color: theme.textPrimary }]}>
                {referralLink}
              </Text>
            </ScrollView>
          </View>

          <TouchableOpacity style={[styles.copyBtn, { backgroundColor: theme.accent }]} onPress={copyCode} activeOpacity={0.85}>
            <AppIcon name="link" size={18} color="#FFFFFF" />
            <Text style={styles.copyText}>{tx('Copy App Link')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.stepsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.stepsTitle, { color: theme.textPrimary }]}>{tx('How it works')}</Text>
          {[
            ['Share your app referral link with your friend.', 'link'],
            ['Friend installs SRV app and creates account successfully.', 'message'],
            ['After successful account creation, both wallets receive 20 points.', 'star'],
          ].map(([text, icon], index) => (
            <View key={text} style={styles.stepRow}>
              <View style={[styles.stepNo, { backgroundColor: theme.accentSoft }]}>
                <Text style={[styles.stepNoText, { color: theme.accent }]}>{index + 1}</Text>
              </View>
              <AppIcon name={icon as IconName} size={18} color={theme.accent} />
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>{tx(text)}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sendTitle, { color: theme.textPrimary }]}>{tx('Send Invite With')}</Text>
        <View style={styles.shareRow}>
          {[
            ['link', 'Share', shareCode, C.primary],
            ['message', 'Message', shareCode, '#2563EB'],
            ['whatsapp', 'WhatsApp', openWhatsApp, '#16A34A'],
          ].map(([icon, label, fn, color]) => (
            <TouchableOpacity
              key={label as string}
              style={[styles.shareBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={fn as () => void}
              activeOpacity={0.82}
            >
              <View style={[styles.shareIcon, { backgroundColor: `${color}18` }]}>
                <AppIcon name={icon as IconName} size={23} color={color as string} />
              </View>
              <Text style={[styles.shareLabel, { color: theme.textSecondary }]}>{tx(label as string)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <Dialog visible={dialog.visible} variant={dialog.variant} title={dialog.title} message={dialog.message} onClose={closeDialog} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 16, paddingBottom: 34 },
  heroCard: {
    borderRadius: 28,
    padding: 18,
    minHeight: 210,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  heroTextCol: { flex: 1.1, gap: 8 },
  heroEyebrow: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: 23, lineHeight: 29, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.86)', fontSize: 12.5, lineHeight: 19, fontWeight: '600' },
  heroImageWrap: { flex: 0.9, alignItems: 'center', justifyContent: 'center' },
  heroImage: { width: 150, height: 150 },
  rewardRow: { flexDirection: 'row', gap: 12 },
  rewardCard: { flex: 1, borderRadius: 22, borderWidth: 1, padding: 14, alignItems: 'center', gap: 5 },
  rewardIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rewardValue: { fontSize: 25, fontWeight: '900', marginTop: 2 },
  rewardTitle: { fontSize: 13, fontWeight: '900' },
  rewardCaption: { fontSize: 10.5, fontWeight: '700', textAlign: 'center' },
  codeCard: { borderRadius: 26, borderWidth: 1, padding: 16, gap: 14 },
  codeHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  codeBadge: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  codeLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
  codeValue: { fontSize: 20, fontWeight: '900', marginTop: 3 },
  linkBox: { borderRadius: 18, borderWidth: 1, minHeight: 52, justifyContent: 'center' },
  linkScroll: { alignItems: 'center', paddingHorizontal: 14 },
  linkValue: { fontSize: 13, fontWeight: '800' },
  copyBtn: { minHeight: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  copyText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  stepsCard: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  stepsTitle: { fontSize: 17, fontWeight: '900' },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNo: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepNoText: { fontSize: 12, fontWeight: '900' },
  stepText: { flex: 1, fontSize: 12.5, lineHeight: 18, fontWeight: '700' },
  sendTitle: { textAlign: 'center', fontSize: 17, fontWeight: '900' },
  shareRow: { flexDirection: 'row', gap: 12 },
  shareBtn: { flex: 1, minHeight: 82, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 7 },
  shareIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  shareLabel: { fontSize: 11.5, fontWeight: '800' },
});
