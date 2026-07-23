import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  const [dialog, setDialog] = useState<{
    visible: boolean;
    variant: 'success' | 'error';
    message: string;
  }>({ visible: false, variant: 'success', message: '' });

  const requestDeletion = async () => {
    setSubmitting(true);
    try {
      await submitSupportTicket({
        subject: 'Account deletion request',
        comment: `Please delete my SRV Electricals app account and associated personal data. Account phone: ${user?.phone ?? 'not available'}.`,
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
    <View style={styles.screen}>
      <PageHeader title="Account & Data Deletion" onBack={onBack} />
      <View style={styles.content}>
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
            <View style={styles.actions}>
              <Pressable
                style={styles.cancel}
                onPress={() => setConfirming(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.delete, submitting && styles.disabled]}
                onPress={() => void requestDeletion()}
                disabled={submitting}
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
      </View>

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
    </View>
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
