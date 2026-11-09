import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/shared/preferences/LocalizedNative';
import React, { type ComponentRef, useEffect, useRef, useState } from 'react';
import { Image, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AppIcon, C, PageHeader, PrimaryBtn } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { authApi, profileApi } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';
import { Dialog, type Choice } from '@/shared/components/Dialog';
import { resolveImageUrl } from '@/shared/api/config';
import { prepareKycUpload } from '../lib/kycUpload';
import { scanQrFromGalleryImage } from '@/shared/utils/qrImageScanner';
import { isValidUpiQrPayload } from '@/shared/utils/upiQrValidation';
import { IOSKeyboardDoneAccessory, IOS_KEYBOARD_DONE_ACCESSORY_ID } from '@/shared/components/IOSKeyboardDoneAccessory';

export function BankDetailsPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role, user, updateUser } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'bank_details');
  const scrollRef = useRef<ComponentRef<typeof ScrollView> | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const [dialog, setDialog] = useState<{
    visible: boolean;
    variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info';
    title: string;
    message?: string;
    choices?: Choice[];
    cancelButton?: boolean;
  }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));

  const [accountHolderName, setAccountHolderName] = useState(user?.accountHolderName ?? '');
  const [googlePayNumber, setGooglePayNumber] = useState(user?.bankAccount ?? '');
  const [upiQrCodeImage, setUpiQrCodeImage] = useState(user?.upiQrCodeImage ?? '');
  const qrPreviewUrl = resolveImageUrl(upiQrCodeImage);

  useEffect(() => {
    setAccountHolderName(user?.accountHolderName ?? '');
    setGooglePayNumber(user?.bankAccount ?? '');
    setUpiQrCodeImage(user?.upiQrCodeImage ?? '');
  }, [role, user?.id, user?.accountHolderName, user?.bankAccount, user?.upiQrCodeImage]);

  const uploadQrAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploadingQr(true);
    try {
      const decoded = await scanQrFromGalleryImage({ uri: asset.uri, width: asset.width, height: asset.height });
      if (!isValidUpiQrPayload(decoded)) {
        throw new Error('Please upload a valid UPI QR code image. Other photos are not accepted.');
      }
      const prepared = await prepareKycUpload({
        uri: asset.uri,
        mimeType: asset.mimeType,
        name: asset.fileName || 'upi-qr-code',
        size: asset.fileSize,
      }, 'upi-qr-code');
      const uploadedUrl = await profileApi.uploadDocument(prepared, 'upi-qr');
      setUpiQrCodeImage(uploadedUrl);
      Keyboard.dismiss();
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), Platform.OS === 'ios' ? 350 : 100);
    } finally {
      setUploadingQr(false);
    }
  };

  const pickQrFromGallery = async () => {
    try {
      if (Platform.OS === 'ios') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          setDialog({ visible: true, variant: 'info', title: tx('Permission needed'), message: tx('Allow photo access to choose your UPI QR image.') });
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.9,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (result.canceled || !result.assets?.length) return;

      await uploadQrAsset(result.assets[0]);
    } catch (error: any) {
      setDialog({ visible: true, variant: 'error', title: tx('Upload failed'), message: error?.message || tx('Could not read this image. Please choose another one.') });
    }
  };

  const takeQrPhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setDialog({ visible: true, variant: 'info', title: tx('Permission needed'), message: tx('Allow camera access to take a UPI QR photo.') });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (result.canceled || !result.assets?.length) return;
      await uploadQrAsset(result.assets[0]);
    } catch (error: any) {
      setDialog({ visible: true, variant: 'error', title: tx('Camera unavailable'), message: error?.message || tx('Could not take the QR photo. Please try again.') });
    }
  };

  const pickUpiQrCode = () => {
    Keyboard.dismiss();
    setDialog({
      visible: true,
      variant: 'info',
      title: tx('Add UPI QR Code'),
      message: tx('Take a new photo or choose an existing QR image.'),
      choices: [
        { label: tx('Camera'), icon: 'camera', onPress: () => void takeQrPhoto() },
        { label: tx('Gallery'), icon: 'image', onPress: () => void pickQrFromGallery() },
      ],
      cancelButton: true,
    });
  };

  const handleSave = async () => {
    const holder = accountHolderName.trim();
    const gpay = googlePayNumber.trim();

    if (!holder || !gpay || !upiQrCodeImage) {
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
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({
        accountHolderName: holder,
        bankAccount: gpay,
        ifsc: null,
        bankName: null,
        upiQrCodeImage,
        bankLinked: true,
      });
      updateUser(updated);
      onBack();
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
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
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
                {tx('Google Pay Number')} · {tx('UPI QR Code')}
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
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={Platform.OS === 'ios' ? IOS_KEYBOARD_DONE_ACCESSORY_ID : undefined}
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
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                inputAccessoryViewID={Platform.OS === 'ios' ? IOS_KEYBOARD_DONE_ACCESSORY_ID : undefined}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: theme.textMuted }]}>{tx('UPI QR Code')} *</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={tx('Upload UPI QR Code')}
              activeOpacity={0.8}
              onPress={() => void pickUpiQrCode()}
              disabled={saving || uploadingQr}
              style={[styles.qrPicker, { backgroundColor: theme.soft, borderColor: theme.border }]}
            >
              {qrPreviewUrl ? (
                <Image source={{ uri: qrPreviewUrl }} style={styles.qrPreview} resizeMode="contain" />
              ) : (
                <View style={styles.qrEmpty}>
                  <AppIcon name="gallery" size={28} color={C.gold} />
                  <Text style={[styles.qrTitle, { color: theme.textPrimary }]}>{uploadingQr ? tx('Uploading...') : tx('Upload UPI QR Code')}</Text>
                  <Text style={[styles.qrHint, { color: theme.textMuted }]}>{tx('Take a photo or select a clear square QR image')}</Text>
                </View>
              )}
            </TouchableOpacity>
            {!upiQrCodeImage ? (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => void pickUpiQrCode()}
                disabled={saving || uploadingQr}
                style={[styles.uploadQrButton, (saving || uploadingQr) && styles.disabledButton]}
              >
                <AppIcon name="gallery" size={16} color="#FFFFFF" />
                <Text style={styles.uploadQrButtonText}>{uploadingQr ? tx('Uploading...') : tx('Upload QR Code')}</Text>
              </TouchableOpacity>
            ) : null}
            {upiQrCodeImage ? (
              <TouchableOpacity disabled={saving || uploadingQr} onPress={() => void pickUpiQrCode()} style={styles.replaceButton}>
                <Text style={styles.replaceText}>{uploadingQr ? tx('Uploading...') : tx('Replace QR image')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <PrimaryBtn label={saving ? tx('Saving...') : t('save')} onPress={handleSave} />
      </ScrollView>
      <IOSKeyboardDoneAccessory />
      <Dialog
        visible={dialog.visible}
        variant={dialog.variant}
        title={dialog.title}
        message={dialog.message}
        choices={dialog.choices}
        cancelButton={dialog.cancelButton}
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
  input: { flex: 1, fontSize: 15, fontWeight: '600' },
  qrPicker: { minHeight: 180, borderRadius: 18, borderWidth: 1.5, borderStyle: 'dashed', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  qrPreview: { width: '100%', height: 220, backgroundColor: '#FFFFFF' },
  qrEmpty: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 7 },
  qrTitle: { fontSize: 14, fontWeight: '800' },
  qrHint: { fontSize: 11, lineHeight: 16, textAlign: 'center' },
  replaceButton: { alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  replaceText: { color: C.gold, fontSize: 12, fontWeight: '800' },
  uploadQrButton: { alignSelf: 'center', minHeight: 42, marginTop: 10, paddingHorizontal: 18, borderRadius: 12, backgroundColor: C.gold, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadQrButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  disabledButton: { opacity: 0.6 },
});
