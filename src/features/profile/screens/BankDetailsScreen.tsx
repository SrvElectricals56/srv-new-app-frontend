import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppIcon, C, PageHeader, PrimaryBtn } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { authApi } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';
import { Dialog } from '@/shared/components/Dialog';

export function BankDetailsPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role, user, updateUser } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'bank_details');

  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{
    visible: boolean;
    variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info';
    title: string;
    message?: string;
  }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));

  const [accountHolderName, setAccountHolderName] = useState(user?.accountHolderName ?? '');
  const [googlePayNumber, setGooglePayNumber] = useState(user?.bankAccount ?? '');
  const [upi, setUpi] = useState(user?.upiId ?? '');
  const [upiQrCodeImage, setUpiQrCodeImage] = useState(user?.upiQrCodeImage ?? '');
  const [upiError, setUpiError] = useState('');

  useEffect(() => {
    setAccountHolderName(user?.accountHolderName ?? '');
    setGooglePayNumber(user?.bankAccount ?? '');
    setUpi(user?.upiId ?? '');
    setUpiQrCodeImage(user?.upiQrCodeImage ?? '');
  }, [role, user?.id, user?.accountHolderName, user?.bankAccount, user?.upiId, user?.upiQrCodeImage]);

  const pickUpiQrCode = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.72,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setDialog({ visible: true, variant: 'error', title: tx('Error'), message: tx('Could not read this image. Please choose another one.') });
      return;
    }
    setUpiQrCodeImage(`data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`);
  };

  const isValidUpi = (value: string) =>
    /^[A-Za-z0-9._-]{2,}@[A-Za-z0-9.-]{2,}$/.test(value.trim());

  const handleSave = async () => {
    const holder = accountHolderName.trim();
    const gpay = googlePayNumber.trim();
    const upiId = upi.trim();

    if (!holder || !gpay || !upiId || !upiQrCodeImage) {
      setDialog({
        visible: true,
        variant: 'info',
        title: tx('Required fields'),
        message: tx('Please fill all required fields.'),
      });
      return;
    }
    if (!/^[A-Za-z ]+$/.test(holder)) {
      setDialog({
        visible: true,
        variant: 'info',
        title: tx('Invalid account holder name'),
        message: tx('Account holder name should contain only letters and spaces.'),
      });
      return;
    }
    if (!/^[6-9]\d{9}$/.test(gpay)) {
      setDialog({
        visible: true,
        variant: 'info',
        title: tx('Invalid Google Pay number'),
        message: tx('Please enter a valid 10 digit Google Pay number.'),
      });
      return;
    }
    if (!isValidUpi(upiId)) {
      const message = tx('Please enter a valid UPI ID in the format name@bank.');
      setUpiError(message);
      setDialog({ visible: true, variant: 'info', title: tx('Invalid UPI ID'), message });
      return;
    }

    setUpiError('');
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        accountHolderName: holder,
        bankAccount: gpay,
        ifsc: null,
        bankName: null,
        upiId,
        upiQrCodeImage,
        bankLinked: true,
      });
      updateUser(updated);
      setDialog({
        visible: true,
        variant: 'success',
        title: tx('Saved'),
        message: tx('Bank details saved successfully!'),
      });
    } catch {
      setDialog({
        visible: true,
        variant: 'error',
        title: tx('Error'),
        message: tx('Failed to save bank details. Please try again.'),
      });
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
          {user?.bankLinked ? (
            <View style={styles.linkedBadge}>
              <AppIcon name="bank" size={16} color={C.success} />
              <Text style={styles.linkedText}>{tx('Payment details linked')}</Text>
            </View>
          ) : null}

          <View style={styles.headerRow}>
            <View style={styles.iconWrap}>
              <AppIcon name="bank" size={24} color={C.gold} />
            </View>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>{t('bankDetails')}</Text>
              <Text style={[styles.sub, { color: theme.textMuted }]}>
                {tx('Add Google Pay number and UPI ID for smooth payouts')}
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
            <Text style={[styles.label, { color: theme.textMuted }]}>{tx('Google Pay Number')} *</Text>
            <View style={[styles.inputWrap, { backgroundColor: theme.soft, borderColor: theme.border }]}>
              <AppIcon name="link" size={18} color={C.gold} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder={tx('Enter Google Pay Number')}
                placeholderTextColor={theme.textMuted}
                value={googlePayNumber}
                onChangeText={(v) => setGooglePayNumber(v.replace(/\D/g, '').slice(0, 10))}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>{tx('UPI ID')} *</Text>
            <View style={[
              styles.inputWrap,
              { backgroundColor: theme.soft, borderColor: theme.border },
              upiError ? styles.inputWrapError : null,
            ]}>
              <AppIcon name="link" size={18} color={C.gold} />
              <TextInput
                style={[styles.input, { color: theme.textPrimary }]}
                placeholder={tx('Enter UPI ID')}
                placeholderTextColor={theme.textMuted}
                value={upi}
                onChangeText={(v) => {
                  const next = v.replace(/\s/g, '');
                  setUpi(next);
                  if (upiError) {
                    setUpiError(next && !isValidUpi(next)
                      ? tx('Please enter a valid UPI ID in the format name@bank.')
                      : '');
                  }
                }}
                autoCapitalize="none"
              />
            </View>
            {upiError ? <Text style={styles.errorText}>{upiError}</Text> : null}
          </View>

          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>{tx('UPI QR Code')} *</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={tx('Upload UPI QR Code')}
              activeOpacity={0.8}
              onPress={() => void pickUpiQrCode()}
              style={[styles.qrPicker, { backgroundColor: theme.soft, borderColor: theme.border }]}
            >
              {upiQrCodeImage ? (
                <Image source={{ uri: upiQrCodeImage }} style={styles.qrPreview} resizeMode="contain" />
              ) : (
                <View style={styles.qrEmpty}>
                  <AppIcon name="gallery" size={28} color={C.gold} />
                  <Text style={[styles.qrTitle, { color: theme.textPrimary }]}>{tx('Upload UPI QR Code')}</Text>
                  <Text style={[styles.qrHint, { color: theme.textMuted }]}>{tx('Select a clear square QR image from your gallery')}</Text>
                </View>
              )}
            </TouchableOpacity>
            {upiQrCodeImage ? (
              <TouchableOpacity onPress={() => void pickUpiQrCode()} style={styles.replaceButton}>
                <Text style={styles.replaceText}>{tx('Replace QR image')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <PrimaryBtn label={saving ? tx('Saving...') : t('save')} onPress={handleSave} />
      </ScrollView>
      <Dialog
        visible={dialog.visible}
        variant={dialog.variant}
        title={dialog.title}
        message={dialog.message}
        onClose={closeDialog}
      />
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
  qrPicker: { minHeight: 180, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  qrPreview: { width: '100%', height: 220, backgroundColor: '#FFFFFF' },
  qrEmpty: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 7 },
  qrTitle: { fontSize: 14, fontWeight: '800' },
  qrHint: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
  replaceButton: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  replaceText: { color: C.gold, fontSize: 12, fontWeight: '800' },
});
