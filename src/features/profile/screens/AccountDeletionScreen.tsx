import { LocalizedText as Text, LocalizedTextInput as TextInput } from '@/shared/preferences/LocalizedNative';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Dialog } from '@/shared/components/Dialog';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAuth } from '@/shared/context/AuthContext';
import { createShadow } from '@/shared/theme/shadows';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';

export function AccountDeletionPage({ onBack }: { onBack: () => void }) {
  const { user } = useAuth();
  const { submitSupportTicket } = useAppData();
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [dialog, setDialog] = useState<{
    visible: boolean;
    variant: 'success' | 'error';
    message: string;
  }>({ visible: false, variant: 'success', message: '' });

  const requestDeletion = async () => {
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 10) return;
    setSubmitting(true);
    try {
      await submitSupportTicket({
        subject: 'Account deletion request',
        comment: `Please delete my SRV Electricals app account and associated personal data. Account phone: ${user?.phone ?? 'not available'}. Reason: ${trimmedReason}`,
      });
      setDialog({
        visible: true,
        variant: 'success',
        message:
          'Your deletion request has been submitted. SRV Support will verify the request and contact you about any records that must be retained by law.',
      });
      setConfirming(false);
    } catch {
      setDialog({
        visible: true,
        variant: 'error',
        message: 'We could not submit your request. Please try again or contact support.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PageHeader title="Account & Data Deletion" onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.card}>
          <View style={styles.icon}>
            <AppIcon name="warning" size={24} color={C.error} />
          </View>
          <Text style={styles.title}>Request account deletion</Text>
          <Text style={styles.copy}>
            This closes your SRV Electricals app account after identity verification. Wallet,
            reward and transaction records are retained only where required for legal,
            accounting or fraud-prevention obligations.
          </Text>
        </View>

        {confirming ? (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmTitle}>Submit this request?</Text>
            <Text style={styles.confirmCopy}>
              SRV Support will receive a verified deletion request for your signed-in account.
            </Text>
            <Text style={styles.reasonLabel}>Reason for deleting your account</Text>
            <TextInput
              value={reason}
              onChangeText={(value) => setReason(value.slice(0, 500))}
              placeholder="Tell us why you want to delete your account"
              placeholderTextColor="#98A1B2"
              multiline
              maxLength={500}
              editable={!submitting}
              textAlignVertical="top"
              style={styles.reasonInput}
              accessibilityLabel="Reason for deleting your account"
            />
            <Text style={[styles.reasonHelp, reason.trim().length > 0 && reason.trim().length < 10 ? styles.reasonError : null]}>
              {reason.trim().length > 0 && reason.trim().length < 10
                ? 'Please enter at least 10 characters.'
                : `${reason.length}/500`}
            </Text>
            <View style={styles.actions}>
              <Pressable
                style={styles.cancel}
                onPress={() => setConfirming(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.delete, (submitting || reason.trim().length < 10) && styles.disabled]}
                onPress={() => void requestDeletion()}
                disabled={submitting || reason.trim().length < 10}
              >
                <Text style={styles.deleteText}>
                  {submitting ? 'Submitting…' : 'Submit request'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable style={styles.delete} onPress={() => setConfirming(true)}>
            <Text style={styles.deleteText}>Request deletion</Text>
          </Pressable>
        )}
      </ScrollView>

      <Dialog
        visible={dialog.visible}
        variant={dialog.variant}
        title={dialog.variant === 'success' ? 'Request submitted' : 'Unable to submit'}
        message={dialog.message}
        confirmLabel="Done"
        onClose={() => {
          setDialog((current) => ({ ...current, visible: false }));
          if (dialog.variant === 'success') onBack();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F5F7FB' },
  content: { padding: 20, gap: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1D5D5',
    ...createShadow({ color: '#1E2340', offsetY: 4, blur: 12, opacity: 0.07, elevation: 3 }),
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '800', color: '#1E2340', marginBottom: 8 },
  copy: { fontSize: 14, lineHeight: 21, color: '#5F6778' },
  confirmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E9F0',
  },
  confirmTitle: { fontSize: 16, fontWeight: '800', color: '#1E2340' },
  confirmCopy: { marginTop: 6, color: '#5F6778', lineHeight: 20 },
  reasonLabel: { marginTop: 16, marginBottom: 8, color: '#1E2340', fontSize: 13, fontWeight: '800' },
  reasonInput: {
    minHeight: 108,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8DEE9',
    backgroundColor: '#FAFBFD',
    color: '#1E2340',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    lineHeight: 20,
  },
  reasonHelp: { marginTop: 6, color: '#7A8497', fontSize: 11 },
  reasonError: { color: C.error },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  delete: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: C.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    flex: 1,
  },
  deleteText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  cancel: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: '#EEF1F6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    flex: 1,
  },
  cancelText: { color: '#38455F', fontWeight: '800', fontSize: 15 },
  disabled: { opacity: 0.65 },
});
