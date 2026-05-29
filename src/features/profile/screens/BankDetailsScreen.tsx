import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppIcon, C, PageHeader, PrimaryBtn } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { authApi } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';

const bankOptions = [
  'State Bank of India',
  'Punjab National Bank',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Kotak Mahindra Bank',
  'IDFC FIRST Bank',
];

export function BankDetailsPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role, user, updateUser } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'bank_details');

  const [saving, setSaving] = useState(false);
  const [accountHolderName, setAccountHolderName] = useState(user?.accountHolderName ?? '');
  const [accountNumber, setAccountNumber] = useState(user?.bankAccount ?? '');
  const [ifsc, setIfsc] = useState(user?.ifsc ?? '');
  const [upi, setUpi] = useState(user?.upiId ?? '');
  const [selectedBank, setSelectedBank] = useState(user?.bankName ?? '');
  const [showBankOptions, setShowBankOptions] = useState(false);
  const [upiError, setUpiError] = useState('');

  // Pre-fill when the signed-in user changes. Avoid resetting while the user is typing.
  useEffect(() => {
    setAccountHolderName(user?.accountHolderName ?? '');
    setAccountNumber(user?.bankAccount ?? '');
    setIfsc(user?.ifsc ?? '');
    setUpi(user?.upiId ?? '');
    setSelectedBank(user?.bankName ?? '');
  }, [role, user?.id]);

  const isValidUpi = (value: string) =>
    /^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$/.test(value.trim());

  const handleSave = async () => {
    if (
      !accountHolderName.trim() ||
      !accountNumber.trim() ||
      !ifsc.trim() ||
      !selectedBank.trim() ||
      !upi.trim()
    ) {
      return Alert.alert(tx('Required fields'), tx('Please fill all required fields.'));
    }
    if (!/^[A-Za-z ]+$/.test(accountHolderName.trim())) {
      return Alert.alert(
        tx('Invalid account holder name'),
        tx('Account holder name should contain only letters and spaces.')
      );
    }
    if (!/^\d+$/.test(accountNumber.trim())) {
      return Alert.alert(
        tx('Invalid account number'),
        tx('Account number should contain only numbers.')
      );
    }
    if (!isValidUpi(upi.trim())) {
      setUpiError(tx('Please enter a valid UPI ID in the format name@bank.'));
      return Alert.alert(
        tx('Invalid UPI ID'),
        tx('Please enter a valid UPI ID in the format name@bank.')
      );
    }
    setUpiError('');
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        accountHolderName: accountHolderName.trim(),
        bankAccount: accountNumber.trim(),
        ifsc: ifsc.trim().toUpperCase(),
        bankName: selectedBank,
        upiId: upi.trim(),
        bankLinked: true,
      });
      updateUser(updated);
      Alert.alert(tx('Saved'), tx('Bank details saved successfully!'));
    } catch {
      Alert.alert(tx('Error'), tx('Failed to save bank details. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <PageHeader title={pageContent.pageTitle || t('bankDetails')} onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Bank linked status */}
          {user?.bankLinked && (
            <View style={styles.linkedBadge}>
              <AppIcon name="bank" size={16} color={C.success} />
              <Text style={styles.linkedText}>{tx('Bank account linked')}</Text>
            </View>
          )}

          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <AppIcon name="bank" size={24} color={C.gold} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{t('bankDetails')}</Text>
              <Text style={[styles.sub, { color: theme.textMuted }]}>
                {tx('Add your bank account and UPI ID for smooth payouts')}
              </Text>
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>
              {tx('Account Holder Name')} *
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: theme.soft, borderColor: theme.border }]}>
              <AppIcon name="bank" size={18} color={C.gold} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder={tx('Enter Account Holder Name')}
                placeholderTextColor={theme.textMuted}
                value={accountHolderName}
                onChangeText={(v) => setAccountHolderName(v.replace(/[^A-Za-z ]/g, ''))}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>{tx('Account Number')} *</Text>
            <View style={[styles.inputWrap, { backgroundColor: theme.soft, borderColor: theme.border }]}>
              <AppIcon name="bank" size={18} color={C.gold} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder={tx('Enter Account Number')}
                placeholderTextColor={theme.textMuted}
                value={accountNumber}
                onChangeText={(v) => setAccountNumber(v.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={18}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>{tx('IFSC Code')} *</Text>
            <View style={[styles.inputWrap, { backgroundColor: theme.soft, borderColor: theme.border }]}>
              <AppIcon name="bank" size={18} color={C.gold} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder={tx('Enter IFSC Code')}
                placeholderTextColor={theme.textMuted}
                value={ifsc}
                onChangeText={(v) => setIfsc(v.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                autoCapitalize="characters"
                maxLength={11}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>{tx('Select Bank')} *</Text>
            <TouchableOpacity
              style={[styles.inputWrap, { backgroundColor: theme.soft, borderColor: theme.border }]}
              activeOpacity={0.85}
              onPress={() => setShowBankOptions((c) => !c)}
            >
              <AppIcon name="bank" size={18} color={C.gold} />
              <Text style={[styles.input, { color: selectedBank ? theme.textPrimary : theme.textMuted }]}>
                {selectedBank || tx('Select Bank')}
              </Text>
            </TouchableOpacity>
            {showBankOptions && (
              <View style={[styles.bankOptionsWrap, { borderColor: theme.border }]}>
                {bankOptions.map((bank) => (
                  <TouchableOpacity
                    key={bank}
                    style={[styles.bankOption, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}
                    activeOpacity={0.85}
                    onPress={() => { setSelectedBank(bank); setShowBankOptions(false); }}
                  >
                    <Text style={[styles.bankOptionText, { color: theme.textPrimary }]}>{bank}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>{tx('UPI ID')} *</Text>
            <View style={[styles.inputWrap, { backgroundColor: theme.soft, borderColor: theme.border }, upiError ? styles.inputWrapError : null]}>
              <AppIcon name="link" size={18} color={C.gold} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder={tx('Enter UPI ID')}
                placeholderTextColor={theme.textMuted}
                value={upi}
                onChangeText={(v) => {
                  const next = v.replace(/\s/g, '');
                  setUpi(next);
                  if (upiError) setUpiError(next && !isValidUpi(next) ? tx('Please enter a valid UPI ID in the format name@bank.') : '');
                }}
                autoCapitalize="none"
              />
            </View>
            {upiError ? <Text style={styles.errorText}>{upiError}</Text> : null}
          </View>
        </View>

        <PrimaryBtn label={saving ? tx('Saving...') : t('save')} onPress={handleSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 16, paddingBottom: 32 },
  card: { borderRadius: 28, padding: 20, borderWidth: 1, gap: 14 },
  linkedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.successLight,
    borderRadius: 12,
    padding: 10,
  },
  linkedText: { fontSize: 13, fontWeight: '700', color: C.success },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 6 },
  headerCopy: { flex: 1, minWidth: 0 },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: C.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '900' },
  sub: { fontSize: 11, marginTop: 2, lineHeight: 16, flexShrink: 1 },
  label: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 8,
  },
  inputWrapError: { borderColor: '#B42318', backgroundColor: '#FFF4F2' },
  input: { flex: 1, fontSize: 15, fontWeight: '600' },
  errorText: { marginTop: 7, fontSize: 12, fontWeight: '700', color: '#B42318', lineHeight: 18 },
  bankOptionsWrap: { marginTop: 8, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  bankOption: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  bankOptionText: { fontSize: 14, fontWeight: '600' },
});
