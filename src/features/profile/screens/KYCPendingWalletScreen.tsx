import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/shared/context/AuthContext';
import { createShadow } from '@/shared/theme/shadows';

const DEALER_ACCENT = '#214D99';
const DEALER_DEEP = '#173E80';
const DEALER_SOFT = '#EAF3FF';
const DEALER_CHIP = '#DCEAFF';

function ShieldLockIcon({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <Path
        d="M28 5L9 14v14c0 11.6 8.2 22.4 19 25.4C39.8 50.4 47 39.6 47 28V14L28 5z"
        fill={DEALER_CHIP}
        stroke={DEALER_ACCENT}
        strokeWidth={2.2}
        strokeLinejoin="round"
      />
      {/* Lock body */}
      <Rect x="20" y="26" width="16" height="12" rx="2.5" fill={DEALER_ACCENT} />
      {/* Lock shackle */}
      <Path
        d="M23 26v-3a5 5 0 0110 0v3"
        stroke={DEALER_ACCENT}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
      {/* Keyhole */}
      <Circle cx="28" cy="31.5" r="1.8" fill="white" />
      <Rect x="27.1" y="32.5" width="1.8" height="3" rx="0.9" fill="white" />
    </Svg>
  );
}

function StepRow({
  icon,
  text,
  done,
  last,
}: {
  icon: string;
  text: string;
  done?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[stepStyles.row, last ? null : stepStyles.rowBorder]}>
      <View style={[stepStyles.iconWrap, done ? stepStyles.iconDone : null]}>
        <Text style={stepStyles.iconText}>{icon}</Text>
      </View>
      <Text style={[stepStyles.text, done ? stepStyles.textDone : null]} numberOfLines={1}>
        {text}
      </Text>
      {done ? (
        <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
          <Circle cx="9" cy="9" r="9" fill="#10B981" />
          <Path
            d="M5 9l3 3 5-5"
            stroke="white"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : (
        <View style={stepStyles.emptyCheck} />
      )}
    </View>
  );
}

const stepStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF3FF',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: DEALER_CHIP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDone: {
    backgroundColor: '#D1FAE5',
  },
  iconText: {
    fontSize: 14,
  },
  text: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  textDone: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  emptyCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
});

interface KYCPendingWalletScreenProps {
  onGoToKYC: () => void;
  onBack: () => void;
}

export function KYCPendingWalletScreen({ onGoToKYC, onBack }: KYCPendingWalletScreenProps) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const kycStatus = user?.kycStatus ?? 'not_submitted';
  const isRejected = kycStatus === 'rejected';
  const isPending = kycStatus === 'pending';

  const statusLabel = isRejected ? 'KYC Rejected' : isPending ? 'Under Review' : 'KYC Required';
  const statusColor = isRejected ? '#EF4444' : isPending ? '#D97706' : DEALER_ACCENT;
  const statusBg = isRejected ? '#FEE2E2' : isPending ? '#FEF3C7' : DEALER_CHIP;

  const headline = isRejected
    ? 'KYC was rejected'
    : isPending
    ? 'KYC is under review'
    : 'Complete KYC to\nunlock wallet';

  const subtext = isRejected
    ? user?.kycRejectionReason
      ? `Reason: ${user.kycRejectionReason}`
      : 'Re-upload correct documents to unlock wallet.'
    : isPending
    ? 'Documents submitted. Our team reviews within 24–48 hrs.'
    : 'Upload Aadhar + PAN/GST to verify your identity.';

  const ctaLabel = isRejected
    ? 'Re-upload Documents'
    : isPending
    ? 'View KYC Status'
    : 'Complete KYC Now';

  const hasAadhar = !!user?.aadharFrontImage;
  const hasPanOrGst = !!(user?.panDocument || user?.gstDocument);

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18l-6-6 6-6"
              stroke={DEALER_DEEP}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Body — fills remaining space ── */}
      <View style={styles.body}>

        {/* Hero card */}
        <LinearGradient
          colors={['#F0F6FF', '#DDE9FF', '#C8DAFF']}
          style={styles.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Glow */}
          <View style={styles.glow} />

          {/* Top row: status chip + role chip */}
          <View style={styles.chipRow}>
            <View style={[styles.chip, { backgroundColor: statusBg }]}>
              <View style={[styles.chipDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.chipText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            <View style={[styles.chip, { backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.chipText, { color: DEALER_DEEP }]}>🏢 Dealer</Text>
            </View>
          </View>

          {/* Icon + text row */}
          <View style={styles.heroBody}>
            <ShieldLockIcon size={64} />
            <View style={styles.heroText}>
              <Text style={styles.eyebrow}>WALLET ACCESS</Text>
              <Text style={styles.headline}>{headline}</Text>
              <Text style={styles.subtext} numberOfLines={3}>{subtext}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Steps / pending card */}
        {isPending ? (
          <View style={styles.pendingCard}>
            <Text style={styles.pendingIcon}>⏳</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingTitle}>Documents submitted</Text>
              <Text style={styles.pendingText}>
                Wallet unlocks automatically once SRV Team approves your KYC.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>Steps to unlock wallet</Text>
            <StepRow icon="📋" text="Register as a Dealer" done />
            <StepRow icon="🪪" text="Upload Aadhar Card" done={hasAadhar} />
            <StepRow icon="📄" text="Upload PAN Card or GST Number" done={hasPanOrGst} />
            <StepRow icon="✅" text="SRV Team verifies your KYC" done={false} last />
          </View>
        )}

        {/* Locked features */}
        <View style={styles.lockedCard}>
          <View style={styles.lockedHeader}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
              <Rect x="3" y="11" width="18" height="11" rx="2" stroke={DEALER_ACCENT} strokeWidth={2} />
              <Path d="M7 11V7a5 5 0 0110 0v4" stroke={DEALER_ACCENT} strokeWidth={2} strokeLinecap="round" />
            </Svg>
            <Text style={styles.lockedTitle}>Wallet features locked</Text>
          </View>
          <View style={styles.lockedChips}>
            {['💰 Balance', '🏦 Bank Details', '🎁 Dealer Bonus', '📤 Withdrawals'].map((f) => (
              <View key={f} style={styles.lockedChip}>
                <Text style={styles.lockedChipText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* ── CTA Footer ── */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={onGoToKYC} activeOpacity={0.85} style={styles.ctaBtn}>
          <LinearGradient
            colors={[DEALER_ACCENT, DEALER_DEEP]}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaText}>{ctaLabel}</Text>
            <Svg width={18} height={18} viewBox="0 0 20 20" fill="none">
              <Path
                d="M4 10h12M11 5l5 5-5 5"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F4F8FF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6ECF4',
    ...createShadow({ color: '#27456A', offsetY: 2, blur: 8, opacity: 0.06, elevation: 3 }),
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: DEALER_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: DEALER_DEEP,
  },

  // Body — flex:1 so it fills between header and footer
  body: {
    flex: 1,
    padding: 14,
    gap: 12,
    justifyContent: 'center',
  },

  // Hero card
  heroCard: {
    borderRadius: 24,
    padding: 16,
    overflow: 'hidden',
    ...createShadow({ color: '#173E80', offsetY: 8, blur: 20, opacity: 0.1, elevation: 5 }),
  },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(33,77,153,0.10)',
    top: -50,
    right: -30,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroText: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
    color: DEALER_ACCENT,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  headline: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F1120',
    lineHeight: 26,
    marginBottom: 6,
  },
  subtext: {
    fontSize: 12,
    lineHeight: 17,
    color: '#4A5568',
  },

  // Steps card
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...createShadow({ color: '#27456A', offsetY: 4, blur: 12, opacity: 0.06, elevation: 3 }),
  },
  stepsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: DEALER_DEEP,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  // Pending card
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingIcon: {
    fontSize: 28,
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 3,
  },
  pendingText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#78350F',
  },

  // Locked card
  lockedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E6ECF4',
    ...createShadow({ color: '#27456A', offsetY: 4, blur: 12, opacity: 0.06, elevation: 3 }),
  },
  lockedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  lockedTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: DEALER_DEEP,
  },
  lockedChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  lockedChip: {
    backgroundColor: DEALER_SOFT,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  lockedChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: DEALER_ACCENT,
  },

  // Footer CTA
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
  },
  ctaBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
