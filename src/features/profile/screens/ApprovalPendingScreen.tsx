import { useMemo } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { UserRole } from '@/shared/types/navigation';

type ApprovalPendingScreenProps = {
  role: Extract<UserRole, 'dealer'>;
  accountStatus?: string | null;
  rejectionReason?: string | null;
  supportPhone?: string | null;
  whatsappNumber?: string | null;
  onUseAnotherNumber?: () => void;
};

const ROLE_THEME = {
  dealer: {
    shell: '#F4F8FF',
    hero: ['#F8FBFF', '#E2ECFF', '#D4E3FF'] as [string, string, string],
    accent: '#214D99',
    accentDeep: '#173E80',
    soft: '#EAF3FF',
    chip: '#DCEAFF',
    glow: 'rgba(33,77,153,0.18)',
    support: '#0F766E',
  },
} as const;

function sanitizePhone(value?: string | null) {
  return String(value ?? '').replace(/[^0-9+]/g, '');
}

function sanitizeWhatsapp(value?: string | null) {
  return String(value ?? '').replace(/[^0-9]/g, '');
}

export function ApprovalPendingScreen({
  role,
  accountStatus,
  rejectionReason,
  supportPhone,
  whatsappNumber,
  onUseAnotherNumber,
}: ApprovalPendingScreenProps) {
  const { tx, theme } = usePreferenceContext();
  const roleTheme = ROLE_THEME[role];
  const safePhone = sanitizePhone(supportPhone);
  const safeWhatsapp = sanitizeWhatsapp(whatsappNumber || supportPhone);
  const normalizedStatus = String(accountStatus ?? '').trim().toLowerCase();
  const isRejected = normalizedStatus === 'inactive' || normalizedStatus === 'rejected';

  const roleLabel = 'Dealer';
  const statusRows = useMemo(
      () => (isRejected
        ? [
        'Your account request was reviewed by admin',
        'This dealer registration is currently rejected',
        'Check the reason below or contact support for help',
      ]
        : [
        'Your account request has been received',
        'Admin approval is required before access',
        'You can contact support for urgent queries',
      ]),
    [isRejected]
  );

  const handleCall = () => {
    if (!safePhone) return;
    void Linking.openURL(`tel:${safePhone}`).catch(() => {});
  };

  const handleWhatsapp = () => {
    if (!safeWhatsapp) return;
    const message = encodeURIComponent(
      isRejected
        ? `Hello SRV Team, my ${roleLabel.toLowerCase()} account request was rejected. Please help me with the next steps.`
        : `Hello SRV Team, my ${roleLabel.toLowerCase()} account is waiting for admin approval.`
    );
    void Linking.openURL(`https://wa.me/${safeWhatsapp}?text=${message}`).catch(() => {});
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: roleTheme.shell }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={roleTheme.hero} style={styles.heroCard}>
        <View style={[styles.heroGlow, { backgroundColor: roleTheme.glow }]} />

        <View style={styles.topRow}>
          <View style={[styles.statusChip, { backgroundColor: roleTheme.chip }]}>
            <AppIcon name="warning" size={15} color={roleTheme.accentDeep} />
            <Text style={[styles.statusChipText, { color: roleTheme.accentDeep }]}>
              {isRejected ? 'Rejected' : 'Approval Pending'}
            </Text>
          </View>
          <View style={[styles.roleChip, { backgroundColor: '#FFFFFF' }]}>
            <AppIcon name="building" size={15} color={roleTheme.accent} />
            <Text style={[styles.roleChipText, { color: roleTheme.accentDeep }]}>{roleLabel}</Text>
          </View>
        </View>

        <Text style={[styles.eyebrow, { color: roleTheme.accentDeep }]}>Admin Review</Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>
          {isRejected
            ? 'Your dealer account request was rejected'
            : 'Wait for admin approval to access your account'}
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          {isRejected
            ? `Your ${roleLabel.toLowerCase()} account is not approved right now. Please review the reason and contact support if you need help.`
            : `Your ${roleLabel.toLowerCase()} account is created, but the next pages will unlock only after admin approval.`}
        </Text>

        {isRejected ? (
          <View style={styles.reasonCard}>
            <Text style={[styles.reasonLabel, { color: roleTheme.accentDeep }]}>Rejection Reason</Text>
            <Text style={[styles.reasonValue, { color: theme.textPrimary }]}>
              {rejectionReason?.trim() || 'Your dealer request was rejected by admin.'}
            </Text>
          </View>
        ) : null}

        <View style={styles.progressCard}>
          {statusRows.map((item, index) => (
            <View key={item} style={styles.progressRow}>
              <View
                style={[
                  styles.progressIcon,
                  { backgroundColor: index === statusRows.length - 1 ? `${roleTheme.accent}14` : roleTheme.soft },
                ]}
              >
                <AppIcon
                  name={index === statusRows.length - 1 ? 'message' : 'check'}
                  size={13}
                  color={roleTheme.accentDeep}
                />
              </View>
              <Text style={[styles.progressText, { color: theme.textSecondary }]}>{item}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <View style={styles.supportCard}>
        <Text style={[styles.supportTitle, { color: theme.textPrimary }]}>Need help right now?</Text>
        <Text style={[styles.supportCopy, { color: theme.textSecondary }]}>
          For any queries, contact our team and we will help you with the approval status.
        </Text>

        {safePhone ? (
          <Pressable onPress={handleCall} style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: roleTheme.soft }]}>
              <AppIcon name="phone" size={16} color={roleTheme.accentDeep} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>Support Number</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>{safePhone}</Text>
            </View>
            <AppIcon name="chevronRight" size={18} color={roleTheme.accent} />
          </Pressable>
        ) : null}

        {safeWhatsapp ? (
          <Pressable onPress={handleWhatsapp} style={styles.buttonShell}>
            <LinearGradient colors={['#16A34A', roleTheme.support]} style={styles.whatsappButton}>
              <AppIcon name="whatsapp" size={18} color="#FFFFFF" />
              <Text style={styles.whatsappButtonText}>{tx('Chat on WhatsApp')}</Text>
            </LinearGradient>
          </Pressable>
        ) : null}

        {onUseAnotherNumber ? (
          <Pressable onPress={onUseAnotherNumber} style={styles.secondaryShell}>
            <View style={[styles.secondaryButton, { borderColor: `${roleTheme.accent}30` }]}>
              <AppIcon name="chevronLeft" size={16} color={roleTheme.accent} />
              <Text style={[styles.secondaryText, { color: roleTheme.accentDeep }]}>
                {tx('Use another number')}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 14,
  },
  heroCard: {
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    overflow: 'hidden',
    ...createShadow({ color: '#0F172A', offsetY: 12, blur: 24, opacity: 0.09, elevation: 6 }),
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -72,
    right: -42,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '900',
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '800',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    maxWidth: 280,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 290,
  },
  progressCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  reasonCard: {
    marginTop: 14,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FFFFFFCC',
    borderWidth: 1,
    borderColor: '#DCEAFF',
    gap: 6,
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  reasonValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  supportCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    ...createShadow({ color: '#0F172A', offsetY: 10, blur: 22, opacity: 0.08, elevation: 5 }),
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  supportCopy: {
    fontSize: 13,
    lineHeight: 19,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAFBFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  buttonShell: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  whatsappButton: {
    minHeight: 52,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryShell: {
    marginTop: 2,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  secondaryText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
