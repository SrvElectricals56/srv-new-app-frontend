import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { walletApi } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAppPageContent } from '@/shared/hooks';

export function BankTransferRequestPage({
  onBack,
  onManageBankDetails,
}: {
  onBack: () => void;
  onManageBankDetails?: () => void;
}) {
  const { theme, tx } = usePreferenceContext();
  const { user, role, refreshProfile } = useAuth();
  const { wallet, dealerBonus, refreshAll } = useAppData();
  const currentRole = (role ?? 'electrician') as 'dealer' | 'electrician' | 'user' | 'counterboy';
  const pageContent = useAppPageContent(currentRole, 'bank_details');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isDealer = currentRole === 'dealer';
  const availableBalance = useMemo(() => {
    if (isDealer) {
      return Number(dealerBonus?.availableBonus ?? 0);
    }
    return Math.max(
      Number(wallet?.totalPoints ?? 0),
      Number(wallet?.balance ?? 0),
      Number(user?.totalPoints ?? 0),
      Number(user?.walletBalance ?? 0),
    );
  }, [
    dealerBonus?.availableBonus,
    isDealer,
    user?.totalPoints,
    user?.walletBalance,
    wallet?.balance,
    wallet?.totalPoints,
  ]);

  const bankReady = Boolean(
    user?.bankLinked && user?.accountHolderName && user?.bankAccount && user?.ifsc,
  );
  const bankSummary = bankReady
    ? `${user?.bankName ?? tx('Linked account')} **** ${String(user?.bankAccount ?? '').slice(-4)}`
    : tx('Add bank details before raising a withdrawal request');

  const handleSubmit = async () => {
    const numericAmount = Number(amount);
    if (!bankReady) {
      return Alert.alert(tx('Bank details required'), tx('Please add your bank details first.'));
    }
    if (!amount.trim() || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return Alert.alert(tx('Invalid amount'), tx('Please enter a valid withdrawal amount.'));
    }
    if (numericAmount > availableBalance) {
      return Alert.alert(
        tx('Insufficient balance'),
        isDealer
          ? tx('Requested amount cannot be more than your available dealer bonus.')
          : tx('Requested points cannot be more than your available balance.'),
      );
    }

    setSubmitting(true);
    try {
      await walletApi.requestBankTransfer({ amount: numericAmount });
      await Promise.allSettled([refreshProfile(), refreshAll()]);
      Alert.alert(
        tx('Request submitted'),
        isDealer
          ? `Rs. ${numericAmount} ${tx('withdrawal request has been sent for admin approval.')}`
          : `${numericAmount} ${tx('points withdrawal request has been sent for admin approval.')}`,
      );
      setAmount('');
    } catch (err: any) {
      Alert.alert(tx('Request failed'), err?.message ?? tx('Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const quickAmounts = isDealer ? ['500', '1000', '2500'] : ['100', '500', '1000'];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || tx('Bank Transfer')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.heroRow}>
            <View style={[styles.heroIconWrap, { backgroundColor: theme.accentSoft }]}>
              <AppIcon name="bank" size={24} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                {isDealer ? tx('Request dealer bonus payout') : tx('Request bank transfer')}
              </Text>
              <Text style={[styles.heroSub, { color: theme.textMuted }]}>
                {isDealer
                  ? tx('Enter the dealer bonus amount you want in your bank account. Admin will review and transfer it manually.')
                  : tx('Enter how many points you want in your bank account. Admin will review and transfer the payout manually.')}
              </Text>
            </View>
          </View>

          <View style={[styles.balancePill, { backgroundColor: theme.soft, borderColor: theme.border }]}>
            <Text style={[styles.balanceLabel, { color: theme.textMuted }]}>
              {isDealer ? tx('Available Dealer Bonus') : tx('Available Points')}
            </Text>
            <Text style={[styles.balanceValue, { color: theme.textPrimary }]}>
              {availableBalance.toLocaleString('en-IN')}
            </Text>
          </View>

          {!isDealer ? (
            <Text style={[styles.helperText, { color: theme.accentDeep }]}>
              {tx('1 point = 1 INR payout request')}
            </Text>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{tx('Linked bank account')}</Text>
          <View
            style={[
              styles.bankStatusRow,
              {
                backgroundColor: bankReady ? '#F0FDF4' : '#FFF7ED',
                borderColor: bankReady ? '#86EFAC' : '#FDBA74',
              },
            ]}
          >
            <AppIcon
              name={bankReady ? 'check' : 'warning'}
              size={18}
              color={bankReady ? C.success : C.gold}
            />
            <Text style={[styles.bankStatusText, { color: bankReady ? '#166534' : '#9A3412' }]}>
              {bankSummary}
            </Text>
          </View>
          <Text style={[styles.metaText, { color: theme.textMuted }]}>
            {user?.accountHolderName ? `${tx('Account Holder')}: ${user.accountHolderName}` : tx('No account holder saved yet.')}
          </Text>
          {onManageBankDetails ? (
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.border, backgroundColor: theme.soft }]}
              activeOpacity={0.85}
              onPress={onManageBankDetails}
            >
              <Text style={[styles.secondaryBtnText, { color: theme.textPrimary }]}>
                {bankReady ? tx('Edit Bank Details') : tx('Add Bank Details')}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
            {isDealer ? tx('Withdrawal amount') : tx('Points to withdraw')}
          </Text>
          <TextInput
            value={amount}
            onChangeText={(value) => setAmount(value.replace(/\D/g, ''))}
            placeholder={isDealer ? tx('Enter amount in rupees') : tx('Enter points amount')}
            placeholderTextColor={theme.textMuted}
            keyboardType="number-pad"
            style={[styles.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.textPrimary }]}
          />
          <View style={styles.quickRow}>
            {quickAmounts.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.quickChip, { backgroundColor: theme.soft, borderColor: theme.border }]}
                activeOpacity={0.85}
                onPress={() => setAmount(item)}
              >
                <Text style={[styles.quickChipText, { color: theme.textSecondary }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              { backgroundColor: bankReady ? theme.accent : theme.textMuted, opacity: submitting ? 0.7 : 1 },
            ]}
            activeOpacity={0.85}
            onPress={handleSubmit}
            disabled={submitting || !bankReady}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {pageContent.primaryCtaLabel || tx('Submit transfer request')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  heroCard: { borderRadius: 26, borderWidth: 1, padding: 18, gap: 14 },
  heroRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  heroIconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 20, fontWeight: '900' },
  heroSub: { fontSize: 13, lineHeight: 20, marginTop: 4 },
  balancePill: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  balanceLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  balanceValue: { fontSize: 22, fontWeight: '900' },
  helperText: { fontSize: 12, fontWeight: '700' },
  card: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 14 },
  cardTitle: { fontSize: 17, fontWeight: '900' },
  bankStatusRow: { borderRadius: 16, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  bankStatusText: { flex: 1, fontSize: 13, fontWeight: '700' },
  metaText: { fontSize: 12, fontWeight: '600' },
  secondaryBtn: { borderRadius: 16, borderWidth: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '800' },
  input: { height: 54, borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, fontSize: 15, fontWeight: '700' },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickChip: { flex: 1, borderRadius: 16, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  quickChipText: { fontSize: 13, fontWeight: '800' },
  primaryBtn: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
