import { useMemo } from 'react';
import { Image, Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon, type IconName } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { UserRole } from '@/shared/types/navigation';

type AccountGatedRole = UserRole;

type ApprovalTheme = {
  shell: string;
  hero: [string, string, string];
  accent: string;
  accentDeep: string;
  soft: string;
  chip: string;
  glow: string;
  support: string;
};

type ApprovalPendingScreenProps = {
  role: AccountGatedRole;
  accountStatus?: string | null;
  rejectionReason?: string | null;
  supportPhone?: string | null;
  whatsappNumber?: string | null;
  onUseAnotherNumber?: () => void;
};

const ROLE_META: Record<
  AccountGatedRole,
  {
    label: string;
    icon: IconName;
    pending: ApprovalTheme;
    rejected: ApprovalTheme;
  }
> = {
  dealer: {
    label: 'Dealer',
    icon: 'building',
    pending: {
      shell: '#F4F8FF',
      hero: ['#F8FBFF', '#E2ECFF', '#D4E3FF'],
      accent: '#214D99',
      accentDeep: '#173E80',
      soft: '#EAF3FF',
      chip: '#DCEAFF',
      glow: 'rgba(33,77,153,0.18)',
      support: '#0F766E',
    },
    rejected: {
      shell: '#FFF5F5',
      hero: ['#FFF8F8', '#FFE8E8', '#FFD6D6'],
      accent: '#C0392B',
      accentDeep: '#922B21',
      soft: '#FFE8E8',
      chip: '#FFD6D6',
      glow: 'rgba(192,57,43,0.15)',
      support: '#0F766E',
    },
  },
  electrician: {
    label: 'Electrician',
    icon: 'star',
    pending: {
      shell: '#F4F8FF',
      hero: ['#F7FBFF', '#E8F1FF', '#D6E6FA'],
      accent: '#173E80',
      accentDeep: '#14213D',
      soft: '#EAF3FF',
      chip: '#D6E6FA',
      glow: 'rgba(23,62,128,0.16)',
      support: '#0F766E',
    },
    rejected: {
      shell: '#FFF5F5',
      hero: ['#FFF8F8', '#FFE8E8', '#FFD6D6'],
      accent: '#B91C1C',
      accentDeep: '#7F1D1D',
      soft: '#FFE8E8',
      chip: '#FFD6D6',
      glow: 'rgba(185,28,28,0.14)',
      support: '#0F766E',
    },
  },
  user: {
    label: 'Customer',
    icon: 'gift',
    pending: {
      shell: '#FFF8F3',
      hero: ['#FFFBF7', '#FFEEDD', '#FFDCC4'],
      accent: '#EA580C',
      accentDeep: '#C2410C',
      soft: '#FFEDD5',
      chip: '#FED7AA',
      glow: 'rgba(234,88,12,0.16)',
      support: '#0F766E',
    },
    rejected: {
      shell: '#FFF5F5',
      hero: ['#FFF8F8', '#FFE8E8', '#FFD6D6'],
      accent: '#DC2626',
      accentDeep: '#991B1B',
      soft: '#FFE8E8',
      chip: '#FFD6D6',
      glow: 'rgba(220,38,38,0.14)',
      support: '#0F766E',
    },
  },
  counterboy: {
    label: 'Counter Boy',
    icon: 'scan',
    pending: {
      shell: '#F9F4ED',
      hero: ['#F9F4ED', '#F5EDE4', '#F0DFD0'],
      accent: '#8B3C2A',
      accentDeep: '#6B2D1D',
      soft: '#EDE0D4',
      chip: '#E0D0C0',
      glow: 'rgba(139,60,42,0.16)',
      support: '#0F766E',
    },
    rejected: {
      shell: '#FFF5F5',
      hero: ['#FFF8F8', '#FFE8E8', '#FFD6D6'],
      accent: '#9A3412',
      accentDeep: '#7C2D12',
      soft: '#FFE8E8',
      chip: '#FFD6D6',
      glow: 'rgba(154,52,18,0.14)',
      support: '#0F766E',
    },
  },
};

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
  const safePhone = sanitizePhone(supportPhone);
  const safeWhatsapp = sanitizeWhatsapp(whatsappNumber || supportPhone);
  const normalizedStatus = String(accountStatus ?? '').trim().toLowerCase();
  const isSuspended = normalizedStatus === 'suspended';
  const isRejected = isSuspended || normalizedStatus === 'inactive' || normalizedStatus === 'rejected';

  const meta = ROLE_META[role];
  const T = isRejected ? meta.rejected : meta.pending;
  const roleLabel = meta.label;

  const statusRows = useMemo(
    () =>
      isSuspended
        ? [
            { icon: 'alert' as const, text: 'Your account access has been suspended by admin' },
            { icon: 'message' as const, text: 'Contact support to understand suspension and next steps' },
            { icon: 'phone' as const, text: 'App features stay locked until status is restored' },
          ]
        : isRejected
        ? [
            { icon: 'check' as const, text: `Your ${roleLabel.toLowerCase()} account was reviewed by admin` },
            { icon: 'alert' as const, text: 'Account has been marked inactive by admin' },
            { icon: 'message' as const, text: 'Contact support for help or clarification' },
          ]
        : [
            { icon: 'check' as const, text: 'Your account request has been received' },
            { icon: 'clock' as const, text: 'Admin approval is required before access' },
            { icon: 'message' as const, text: 'Contact support for urgent queries' },
          ],
    [isRejected, isSuspended, roleLabel]
  );

  const handleCall = () => {
    if (!safePhone) return;
    void Linking.openURL(`tel:${safePhone}`).catch(() => {});
  };

  const handleWhatsapp = () => {
    if (!safeWhatsapp) return;
    const message = encodeURIComponent(
      isSuspended
        ? `Hello SRV Team, my ${roleLabel.toLowerCase()} account is suspended. Please help me restore access.`
        : isRejected
        ? `Hello SRV Team, my ${roleLabel.toLowerCase()} account is inactive. Please help me with the next steps.`
        : `Hello SRV Team, my ${roleLabel.toLowerCase()} account is waiting for admin approval.`
    );
    void Linking.openURL(`https://wa.me/${safeWhatsapp}?text=${message}`).catch(() => {});
  };

  const headline = isSuspended
    ? `Your ${roleLabel.toLowerCase()} account\nis suspended`
    : isRejected
    ? `Your ${roleLabel.toLowerCase()} account\nis inactive`
    : 'Waiting for admin\napproval';

  const subtitle = isSuspended
    ? `Your ${roleLabel.toLowerCase()} account is suspended. Contact support to restore access once admin reactivates your account.`
    : isRejected
    ? `Your ${roleLabel.toLowerCase()} account was reviewed and marked inactive. See the reason below and contact support if you need help.`
    : `Your ${roleLabel.toLowerCase()} account is created. The app will unlock fully once admin sets your account to active.`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: T.shell }]}>
      <View style={styles.container}>

        <LinearGradient colors={T.hero} style={styles.heroCard}>
          <View style={[styles.heroGlow, { backgroundColor: T.glow }]} />

          <View style={styles.topRow}>
            <View style={[styles.statusChip, { backgroundColor: T.chip }]}>
              <AppIcon name={isRejected ? 'alert' : 'warning'} size={12} color={T.accentDeep} />
              <Text style={[styles.chipText, { color: T.accentDeep }]}>
                {isSuspended ? 'Suspended' : isRejected ? 'Inactive' : 'Approval Pending'}
              </Text>
            </View>
            <View style={[styles.roleChip, { backgroundColor: '#FFFFFF' }]}>
              <AppIcon name={meta.icon} size={12} color={T.accent} />
              <Text style={[styles.chipText, { color: T.accentDeep }]}>{roleLabel}</Text>
            </View>
          </View>

          <View style={styles.titleBlock}>
            <Text style={[styles.eyebrow, { color: T.accentDeep }]}>
              {isSuspended ? 'Access Suspended' : isRejected ? 'Account Inactive' : 'Admin Review'}
            </Text>
            <Text style={[styles.title, { color: theme.textPrimary }]}>{headline}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
          </View>

          {isRejected ? (
            <View style={[styles.reasonBox, { borderColor: T.chip }]}>
              <Text style={[styles.reasonLabel, { color: T.accentDeep }]}>
                {isSuspended ? 'Suspension Note' : 'Inactive Reason'}
              </Text>
              <Text style={[styles.reasonText, { color: theme.textPrimary }]}>
                {rejectionReason?.trim() ||
                  (isSuspended
                    ? 'Account suspended by admin. Contact support for details.'
                    : 'Marked inactive by admin. Contact support for details.')}
              </Text>
            </View>
          ) : null}

          <View style={[styles.stepsCard, isRejected && { backgroundColor: '#FFF4F4' }]}>
            <Text style={[styles.stepsHeading, { color: T.accentDeep }]}>
              {isSuspended ? 'What this means' : isRejected ? 'What happened' : 'What to expect'}
            </Text>
            <View style={styles.stepsList}>
              {statusRows.map((item, index) => (
                <View key={item.text} style={styles.stepRow}>
                  <View style={[styles.stepIcon, { backgroundColor: index === 1 && isRejected ? `${T.accent}20` : T.soft }]}>
                    <AppIcon name={item.icon} size={12} color={T.accentDeep} />
                  </View>
                  <Text style={[styles.stepText, { color: theme.textSecondary }]}>{item.text}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.noteRow, { backgroundColor: T.soft }]}>
              <AppIcon name="info" size={12} color={T.accentDeep} />
              <Text style={[styles.noteText, { color: T.accentDeep }]}>
                {isSuspended
                  ? 'Support can guide you on why the account was suspended and what is needed to restore access.'
                  : isRejected
                  ? 'You may contact our support team to understand why the account was deactivated and discuss next steps.'
                  : 'When admin changes your status to active, reopen the app and your account will unlock automatically.'}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.supportCard, { backgroundColor: theme.surface ?? '#FFFFFF' }]}>
          <Text style={[styles.supportTitle, { color: theme.textPrimary }]}>
            {isRejected ? 'Need help?' : 'Need help right now?'}
          </Text>

          <View style={styles.actionRow}>
            {safePhone ? (
              <Pressable onPress={handleCall} style={[styles.callBtn, { backgroundColor: T.soft }]}>
                <AppIcon name="phone" size={14} color={T.accentDeep} />
                <Text style={[styles.callBtnText, { color: T.accentDeep }]}>Call Us</Text>
              </Pressable>
            ) : null}

            {safeWhatsapp ? (
              <Pressable onPress={handleWhatsapp} style={styles.waShell}>
                <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.waBtn}>
                  <AppIcon name="whatsapp" size={14} color="#FFFFFF" />
                  <Text style={styles.waBtnText}>{tx('Chat on WhatsApp')}</Text>
                </LinearGradient>
              </Pressable>
            ) : null}
          </View>

          {onUseAnotherNumber ? (
            <Pressable onPress={onUseAnotherNumber} style={styles.anotherShell}>
              <View style={[styles.anotherBtn, { borderColor: `${T.accent}25` }]}>
                <AppIcon name="chevronLeft" size={12} color={T.accent} />
                <Text style={[styles.anotherBtnText, { color: T.accentDeep }]}>
                  {tx('Use another number')}
                </Text>
              </View>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => Linking.openURL('https://srvelectricals.com').catch(() => {})}
          style={[styles.websiteCard, { backgroundColor: theme.surface ?? '#FFFFFF' }]}
        >
          <View style={[styles.websiteIconBubble, { backgroundColor: T.soft }]}>
            <Image
              source={require('../../../../assets/srv-logo.png')}
              style={styles.websiteLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.websiteContent}>
            <Text style={[styles.websiteLabel, { color: theme.textSecondary }]}>
              Don't get bored — check out our website for exciting new products!
            </Text>
            <Text style={[styles.websiteUrl, { color: T.accent }]}>
              srvelectricals.com →
            </Text>
          </View>
        </Pressable>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
  },
  heroCard: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    overflow: 'hidden',
    gap: 10,
    ...createShadow({ color: '#0F172A', offsetY: 8, blur: 18, opacity: 0.06, elevation: 4 }),
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -60,
    right: -40,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  titleBlock: {
    gap: 4,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
  },
  reasonBox: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFFCC',
    gap: 3,
  },
  reasonLabel: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  reasonText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 8,
  },
  stepsHeading: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  stepsList: {
    gap: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  stepIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontWeight: '600',
  },
  supportCard: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 9,
    ...createShadow({ color: '#0F172A', offsetY: 6, blur: 14, opacity: 0.06, elevation: 3 }),
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 9,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  callBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  waShell: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  waBtn: {
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  waBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  anotherShell: {
    marginTop: 1,
  },
  anotherBtn: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
  },
  anotherBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  websiteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...createShadow({ color: '#0F172A', offsetY: 4, blur: 10, opacity: 0.04, elevation: 2 }),
  },
  websiteIconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  websiteLogo: {
    width: 24,
    height: 24,
  },
  websiteContent: {
    flex: 1,
    gap: 3,
  },
  websiteLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  websiteUrl: {
    fontSize: 14,
    fontWeight: '900',
  },
});
