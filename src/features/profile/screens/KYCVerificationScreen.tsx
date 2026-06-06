import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { AppIcon } from '../components/ProfileShared';
import { DocumentUpload } from '../components/DocumentUpload';
import { usePreferenceContext } from '@/shared/preferences';
import { useAuth } from '@/shared/context/AuthContext';
import { authApi } from '@/shared/api';
import { Dialog } from '@/shared/components/Dialog';

interface KYCVerificationScreenProps {
  onBack: () => void;
  currentRole: 'dealer' | 'electrician' | 'user' | 'counterboy';
}

export function KYCVerificationScreen({ onBack, currentRole }: KYCVerificationScreenProps) {
  const { user: authUser, refreshProfile } = useAuth();
  const { theme, tx, darkMode } = usePreferenceContext();

  const [draftAadhar, setDraftAadhar] = useState<string | null>(null);
  const [draftPan, setDraftPan] = useState<string | null>(null);
  const [draftGst, setDraftGst] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; onOk?: () => void }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));

  const roleColor = theme.accent;
  const roleSoft = theme.accentSoft;

  const hasAadhar = authUser?.aadharFrontImage || draftAadhar;
  const hasPan = authUser?.panDocument || draftPan;
  const hasGst = authUser?.gstDocument || draftGst;
  const isDealer = currentRole === 'dealer';
  const hasDraftChanges = Boolean(draftAadhar || draftPan || draftGst);
  const kycComplete = hasAadhar && (isDealer ? (hasPan || hasGst) : true);
  const kycStatus = authUser?.kycStatus || 'not_submitted';
  const canShowSubmit = kycStatus !== 'verified' || hasDraftChanges;
  const submitLabel = (kycStatus === 'pending' || kycStatus === 'rejected') && (authUser?.aadharFrontImage || authUser?.panDocument || authUser?.gstDocument)
    ? 'Resubmit for Verification'
    : 'Submit for Verification';

  const handleSubmit = async () => {
    if (!hasAadhar) {
      setDialog({ visible: true, variant: 'info', title: tx('Error'), message: tx('Please upload Aadhar Card') }); return;
    }

    if (isDealer && !hasPan && !hasGst) {
      setDialog({ visible: true, variant: 'info', title: tx('Error'), message: tx('Please upload either PAN Card or GST Number') }); return;
    }

    // Capture before async — first submit if no docs existed before AND status is not_submitted
    const isFirstSubmit =
      !authUser?.aadharFrontImage &&
      !authUser?.panDocument &&
      !authUser?.gstDocument &&
      kycStatus === 'not_submitted';

    try {
      setIsSaving(true);

      const updateData: any = {
        kycStatus: 'pending',
        kycRejectionReason: null,
      };
      const finalAadhar = draftAadhar || authUser?.aadharFrontImage;
      if (finalAadhar) updateData.aadharFrontImage = finalAadhar;
      if (draftPan || authUser?.panDocument) updateData.panDocument = draftPan || authUser?.panDocument || null;
      if (draftGst || authUser?.gstDocument) updateData.gstDocument = draftGst || authUser?.gstDocument || null;

      await authApi.updateProfile(updateData);
      await refreshProfile();
      setDraftAadhar(null);
      setDraftPan(null);
      setDraftGst(null);

      setDialog({
        visible: true, variant: 'success', title: tx('Success'),
        message: tx(isFirstSubmit
          ? 'KYC documents submitted successfully. SRV Team will verify soon.'
          : 'KYC documents resubmitted successfully. SRV Team will verify soon.'),
        onOk: onBack,
      });
    } catch (error) {
      setDialog({ visible: true, variant: 'error', title: tx('Error'), message: tx('Failed to submit KYC documents. Please try again.') });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = () => {
    switch (kycStatus) {
      case 'verified': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'rejected': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (kycStatus) {
      case 'verified': return 'Verified';
      case 'pending': return 'Pending Review';
      case 'rejected': return 'Rejected';
      default: return 'Not Submitted';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <AppIcon name="chevronLeft" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
          {tx('KYC Verification')}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIcon, { backgroundColor: `${getStatusColor()}20` }]}>
              <AppIcon 
                name={kycStatus === 'verified' ? 'check' : kycStatus === 'pending' ? 'clock' : 'warning'} 
                size={24} 
                color={getStatusColor()} 
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.statusTitle, { color: theme.textPrimary }]}>
                {tx('KYC Status')}
              </Text>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </View>
          </View>

          {kycStatus === 'rejected' && authUser?.kycRejectionReason && (
            <View style={[styles.rejectionBox, { backgroundColor: darkMode ? '#7F1D1D' : '#FEE2E2', borderColor: darkMode ? '#991B1B' : '#FCA5A5' }]}>
              <Text style={[styles.rejectionTitle, { color: darkMode ? '#FCA5A5' : '#991B1B' }]}>
                {tx('Rejection Reason')}:
              </Text>
              <Text style={[styles.rejectionText, { color: darkMode ? '#FEE2E2' : '#DC2626' }]}>
                {authUser.kycRejectionReason}
              </Text>
            </View>
          )}

          {hasDraftChanges && (
            <View style={[styles.rejectionBox, { backgroundColor: darkMode ? '#0F3D2E' : '#ECFDF5', borderColor: darkMode ? '#14532D' : '#86EFAC' }]}>
              <Text style={[styles.rejectionTitle, { color: darkMode ? '#BBF7D0' : '#166534' }]}>
                {tx('Ready to Resubmit')}:
              </Text>
              <Text style={[styles.rejectionText, { color: darkMode ? '#DCFCE7' : '#15803D' }]}>
                {tx('Your updated documents are ready. Tap submit to send them for fresh SRV Team review.')}
              </Text>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: roleSoft, borderColor: roleColor }]}>
          <AppIcon name="info" size={20} color={roleColor} />
          <Text style={[styles.infoText, { color: roleColor }]}>
            {isDealer 
              ? tx('Upload Aadhar Card and either PAN Card or GST Number for verification')
              : tx('Upload Aadhar Card for KYC verification')}
          </Text>
        </View>

        {/* Documents Section */}
        <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            📄 {tx('Required Documents')}
          </Text>

          <DocumentUpload
            label="Aadhar Card"
            documentType="aadhar-front"
            currentUrl={authUser?.aadharFrontImage}
            onUploadSuccess={(url) => setDraftAadhar(url)}
            theme={theme}
            roleColor={roleColor}
            roleSoft={roleSoft}
          />

          {isDealer && (
            <>
              <Text style={[styles.helperText, { color: theme.textMuted }]}>
                ℹ️ {tx('Choose one from both PAN Card or GST Number')}
              </Text>

              <DocumentUpload
                label="PAN Card (Optional)"
                documentType="pan"
                currentUrl={authUser?.panDocument}
                onUploadSuccess={(url) => setDraftPan(url)}
                theme={theme}
                roleColor={roleColor}
                roleSoft={roleSoft}
              />

              <DocumentUpload
                label="GST Number (Optional)"
                documentType="gst"
                currentUrl={authUser?.gstDocument}
                onUploadSuccess={(url) => setDraftGst(url)}
                theme={theme}
                roleColor={roleColor}
                roleSoft={roleSoft}
              />
            </>
          )}
        </View>

        {/* Progress Indicator */}
        <View style={[styles.progressCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.progressTitle, { color: theme.textPrimary }]}>
            {tx('Completion Progress')}
          </Text>
          
          <View style={styles.progressItem}>
            <AppIcon 
              name={hasAadhar ? 'check' : 'circle'} 
              size={20} 
              color={hasAadhar ? '#10B981' : theme.textMuted} 
            />
            <Text style={[styles.progressText, { color: theme.textPrimary }]}>
              {tx('Aadhar Card')}
            </Text>
          </View>

          {isDealer && (
            <View style={styles.progressItem}>
              <AppIcon 
                name={(hasPan || hasGst) ? 'check' : 'circle'} 
                size={20} 
                color={(hasPan || hasGst) ? '#10B981' : theme.textMuted} 
              />
              <Text style={[styles.progressText, { color: theme.textPrimary }]}>
                {tx('PAN Card or GST Number')}
              </Text>
            </View>
          )}

          <View style={[styles.progressBar, { backgroundColor: theme.soft }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  backgroundColor: roleColor,
                  width: kycComplete ? '100%' : hasAadhar ? '50%' : '0%'
                }
              ]} 
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Submit Button */}
      {canShowSubmit && (
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSaving || !kycComplete || (kycStatus === 'verified' && !hasDraftChanges)}
            style={[
              styles.submitBtn,
              { backgroundColor: roleColor },
              (!kycComplete || isSaving || (kycStatus === 'verified' && !hasDraftChanges)) && { opacity: 0.5 }
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.submitText}>
              {isSaving ? tx('Submitting...') : tx(submitLabel)}
            </Text>
          </TouchableOpacity>
      </View>
    )}
      <Dialog
        visible={dialog.visible}
        variant={dialog.variant}
        title={dialog.title}
        message={dialog.message}
        onClose={closeDialog}
        onConfirm={dialog.onOk}
        confirmLabel="OK"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '800',
  },
  rejectionBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  rejectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  helperText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 12,
  },
  progressCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  progressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
