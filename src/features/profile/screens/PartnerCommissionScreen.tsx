import React, { useEffect, useRef, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Animated,
  Easing,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { walletApi } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAppPageContent } from '@/shared/hooks';
import { Dialog } from '@/shared/components/Dialog';

export function PartnerCommissionPage({ onBack }: { onBack: () => void }) {
  const { theme, tx } = usePreferenceContext();
  const { role, user } = useAuth();
  const { dealerBonus, electricians, refreshAll, appSettings } = useAppData();
  const pageContent = useAppPageContent((role ?? 'dealer') as any, 'dealer_bonus');
  const glow = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; onOk?: () => void }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));

  const availableBalance = dealerBonus?.availableBonus ?? 0;
  const totalElectricians = electricians?.total ?? user?.electricianCount ?? 0;
  const bonusRate = appSettings?.dealerBonusRate ?? 5;

  useEffect(() => {
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, withWebSafeNativeDriver({ toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease) })),
        Animated.timing(glow, withWebSafeNativeDriver({ toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease) })),
      ])
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, withWebSafeNativeDriver({ toValue: -8, duration: 1800, easing: Easing.inOut(Easing.ease) })),
        Animated.timing(floatY, withWebSafeNativeDriver({ toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease) })),
      ])
    );
    glowLoop.start();
    floatLoop.start();
    return () => { glowLoop.stop(); floatLoop.stop(); };
  }, [floatY, glow]);

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    if (!withdrawAmount.trim() || Number.isNaN(amount) || amount <= 0) {
      setDialog({ visible: true, variant: 'info', title: tx('Enter amount'), message: tx('Please enter a valid withdrawal amount.') }); return;
    }
    if (amount > availableBalance) {
      setDialog({ visible: true, variant: 'info', title: tx('Insufficient balance'), message: tx('Withdrawal amount cannot be more than your available dealer bonus.') }); return;
    }
    setSubmitting(true);
    try {
      await walletApi.requestDealerBonusWithdrawal({ amount });
      setDialog({ visible: true, variant: 'success', title: tx('Request submitted'), message: `Rs. ${amount} ${tx('will be transferred to your bank account after approval.')}` });
      setWithdrawAmount('');
      void refreshAll();
    } catch (err: any) {
      setDialog({ visible: true, variant: 'error', title: tx('Failed'), message: err?.message ?? tx('Please try again.') });
    } finally {
      setSubmitting(false);
    }
  };

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.9] });

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || tx('Dealer Bonus')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ transform: [{ translateY: floatY }] }}>
          <LinearGradient
            colors={theme.textPrimary === '#F8FAFC' ? theme.heroGradientDark : theme.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.heroCard, { borderColor: theme.border }]}
          >
          <Animated.View style={[styles.heroGlow, { opacity: glowOpacity }]} />
          <View style={styles.heroTop}>
            <View style={[styles.heroBadge, { backgroundColor: theme.textPrimary === '#F8FAFC' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.62)' }]}>
              <AppIcon name="transfer" size={18} color={theme.accent} />
              <Text style={[styles.heroBadgeText, { color: theme.textPrimary }]}>{pageContent.cardTitle || tx(`${bonusRate}% Auto Bonus`)}</Text>
            </View>
            <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>{pageContent.heroTitle || tx('GET YOUR BONUS')}</Text>
            <Text style={[styles.heroSub, { color: theme.textSecondary }]}>
              {pageContent.heroSubtitle || tx(`${bonusRate}% of the points redeemed by any electrician will be credited to your dealer wallet. 1 point = 1 INR, and you can withdraw it directly to your bank account.`)}
            </Text>
          </View>
          <View style={styles.heroFooter}>
            <View>
              <Text style={[styles.heroAmountLabel, { color: theme.accentDeep }]}>{tx('Available to withdraw')}</Text>
              <Text style={[styles.heroAmount, { color: theme.textPrimary }]}>Rs. {availableBalance.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.heroRateChip, { backgroundColor: theme.textPrimary === '#F8FAFC' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.52)' }]}>
              <Text style={[styles.heroRateText, { color: theme.textPrimary }]}>{tx('1 Point = 1 INR')}</Text>
              <View style={styles.flagBadge}>
                <View style={[styles.flagStripe, { backgroundColor: '#FF9933' }]} />
                <View style={[styles.flagStripe, styles.flagWhite]}><View style={styles.flagWheel} /></View>
                <View style={[styles.flagStripe, { backgroundColor: '#138808' }]} />
              </View>
            </View>
          </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.statIcon, { backgroundColor: C.blueLight }]}>
              <AppIcon name="refer" size={18} color={theme.accent} />
            </View>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{totalElectricians}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{tx('Active electricians')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.statIcon, { backgroundColor: C.goldLight }]}>
              <AppIcon name="gift" size={18} color={theme.accentDeep} />
            </View>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{(dealerBonus?.totalBonus ?? 0).toLocaleString('en-IN')}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{tx('Total bonus earned')}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.statIcon, { backgroundColor: '#DCFCE7' }]}>
              <AppIcon name="bank" size={18} color={C.success} />
            </View>
            <Text style={[styles.statValue, { color: theme.textPrimary }]}>{(dealerBonus?.pendingWithdrawals ?? 0).toLocaleString('en-IN')}</Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>{tx('Pending withdrawals')}</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{pageContent.sectionTitle || tx('How it works')}</Text>
          {[
            { num: '1', bg: theme.accentSoft, color: theme.accent, text: tx(`Electrician points redeem hote hi ${bonusRate}% dealer bonus auto-credit ho jata hai.`) },
            { num: '2', bg: theme.soft, color: theme.accentDeep, text: tx('Bonus balance update hota rahega and 1 point ki value 1 INR rahegi.') },
            { num: '3', bg: '#DCFCE7', color: C.success, text: tx('Aap bank transfer request karke amount withdraw kar sakte hain.') },
          ].map((step) => (
            <View key={step.num} style={styles.stepRow}>
              <View style={[styles.stepBadge, { backgroundColor: step.bg }]}>
                <Text style={[styles.stepBadgeText, { color: step.color }]}>{step.num}</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>{step.text}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.withdrawHeader}>
            <View>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{pageContent.pageSubtitle || tx('Withdraw to bank')}</Text>
              <Text style={[styles.withdrawSub, { color: theme.textMuted }]}>
                {user?.bankLinked ? `${user?.bankName ?? ''} ${user?.bankAccount ? `•••• ${user.bankAccount.slice(-4)}` : ''}`.trim() : tx('Link bank account first')}
              </Text>
            </View>
          </View>
          <TextInput
            value={withdrawAmount}
            onChangeText={(v) => setWithdrawAmount(v.replace(/\D/g, ''))}
            placeholder={pageContent.inputLabel || tx('Enter amount in rupees')}
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.textPrimary }]}
          />
          <View style={styles.quickAmounts}>
            {['250', '500', '1000'].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.quickChip, { backgroundColor: theme.soft, borderColor: theme.border }]}
                activeOpacity={0.8}
                onPress={() => setWithdrawAmount(amount)}
              >
                <Text style={[styles.quickChipText, { color: theme.textSecondary }]}>Rs. {amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[styles.withdrawButton, { backgroundColor: theme.accent, opacity: submitting ? 0.7 : 1 }]}
            activeOpacity={0.85}
            onPress={handleWithdraw}
            disabled={submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.withdrawButtonText}>{pageContent.primaryCtaLabel || tx('Request bank transfer')}</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Dialog visible={dialog.visible} variant={dialog.variant} title={dialog.title} message={dialog.message} onClose={closeDialog} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 34 },
  heroCard: { borderRadius: 30, padding: 22, overflow: 'hidden', borderWidth: 1 },
  heroGlow: { position: 'absolute', top: -40, right: -20, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.18)' },
  heroTop: { gap: 10 },
  heroBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(147,197,253,0.14)' },
  heroBadgeText: { fontSize: 12, fontWeight: '800' },
  heroTitle: { fontSize: 26, lineHeight: 33, fontWeight: '900', maxWidth: '86%' },
  heroSub: { fontSize: 14, lineHeight: 22, maxWidth: '94%' },
  heroFooter: { marginTop: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 14 },
  heroAmountLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  heroAmount: { fontSize: 18, fontWeight: '900', marginTop: 6 },
  heroRateChip: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  flagBadge: { width: 18, height: 12, borderRadius: 3, overflow: 'hidden', backgroundColor: '#fff' },
  flagStripe: { flex: 1 },
  flagWhite: { alignItems: 'center', justifyContent: 'center' },
  flagWheel: { width: 4, height: 4, borderRadius: 2, borderWidth: 0.8, borderColor: '#1A56DB' },
  heroRateText: { fontSize: 10, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 22, padding: 14 },
  statIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { marginTop: 4, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  card: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 14 },
  cardTitle: { fontSize: 18, fontWeight: '900' },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepBadgeText: { fontSize: 13, fontWeight: '900' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 22, fontWeight: '600' },
  withdrawHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  withdrawSub: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  input: { height: 54, borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, fontWeight: '700' },
  quickAmounts: { flexDirection: 'row', gap: 10 },
  quickChip: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  quickChipText: { fontSize: 13, fontWeight: '800' },
  withdrawButton: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  withdrawButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
