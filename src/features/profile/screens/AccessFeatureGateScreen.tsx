import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppIcon } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { UserRole } from '@/shared/types/navigation';

type AccessFeatureGateScreenProps = {
  role: UserRole;
  featureTitle: string;
  featureDescription: string;
  onOpenAuth: () => void;
  onBack?: () => void;
};

const ROLE_THEME: Record<
  UserRole,
  {
    accent: string;
    accentDeep: string;
    accentSoft: string;
    canvas: string;
    hero: [string, string, string];
    panel: [string, string];
    glowPrimary: string;
    glowSecondary: string;
    badgeBg: string;
    icon: 'building' | 'scan' | 'star';
  }
> = {
  dealer: {
    accent: '#214D99',
    accentDeep: '#173E80',
    accentSoft: '#EAF3FF',
    canvas: '#F4F8FF',
    hero: ['#F9FBFF', '#E7F0FF', '#D2E2FF'],
    panel: ['#214D99', '#173E80'],
    glowPrimary: 'rgba(33,77,153,0.18)',
    glowSecondary: 'rgba(23,62,128,0.12)',
    badgeBg: '#DCEAFF',
    icon: 'building',
  },
  electrician: {
    accent: '#102A63',
    accentDeep: '#1D458F',
    accentSoft: '#EAF3FF',
    canvas: '#EEF3F8',
    hero: ['#F8FBFF', '#E8F0FF', '#D6E2F9'],
    panel: ['#102A63', '#1D458F'],
    glowPrimary: 'rgba(16,42,99,0.18)',
    glowSecondary: 'rgba(29,69,143,0.12)',
    badgeBg: '#DBE8FF',
    icon: 'scan',
  },
  user: {
    accent: '#6A2F12',
    accentDeep: '#8D4A1E',
    accentSoft: '#FBF1E7',
    canvas: '#F8F0E8',
    hero: ['#FFF9F4', '#F8EBDD', '#F1DEC9'],
    panel: ['#6A2F12', '#8D4A1E'],
    glowPrimary: 'rgba(106,47,18,0.16)',
    glowSecondary: 'rgba(141,74,30,0.1)',
    badgeBg: '#F3E3D3',
    icon: 'star',
  },
  counterboy: {
    accent: '#8B3C2A',
    accentDeep: '#6F4E37',
    accentSoft: '#F5EDE4',
    canvas: '#F8F1EA',
    hero: ['#FFF9F5', '#F5E7DA', '#ECD8C8'],
    panel: ['#8B3C2A', '#6F4E37'],
    glowPrimary: 'rgba(139,60,42,0.16)',
    glowSecondary: 'rgba(111,78,55,0.1)',
    badgeBg: '#EEDDD2',
    icon: 'star',
  },
};

export function AccessFeatureGateScreen({
  role,
  featureTitle,
  featureDescription,
  onOpenAuth,
  onBack,
}: AccessFeatureGateScreenProps) {
  const { tx, theme } = usePreferenceContext();
  const roleTheme = ROLE_THEME[role];

  const roleLabel = useMemo(() => {
    switch (role) {
      case 'dealer':
        return 'Dealer';
      case 'counterboy':
        return 'Counter Boy';
      case 'user':
        return 'Customer';
      default:
        return 'Electrician';
    }
  }, [role]);

  const bullets = useMemo(() => {
    switch (role) {
      case 'dealer':
        return [
          'View dealer-only network tools',
          'Track bonus wallet and payouts',
          'Manage business profile securely',
        ];
      case 'counterboy':
        return [
          'Open counter and billing tools',
          'See wallet activity and alerts',
          'Access your personal profile settings',
        ];
      case 'user':
        return [
          'Unlock wallet and gift rewards',
          'See your latest offers and notifications',
          'Keep your profile and preferences synced',
        ];
      default:
        return [
          'Scan products and earn rewards',
          'View wallet, tier and notifications',
          'Manage your electrician account safely',
        ];
    }
  }, [role]);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: roleTheme.canvas }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroWrap}>
        <LinearGradient colors={roleTheme.hero} style={styles.heroCard}>
          <View style={[styles.heroGlowLarge, { backgroundColor: roleTheme.glowPrimary }]} />
          <View style={[styles.heroGlowSmall, { backgroundColor: roleTheme.glowSecondary }]} />

          <View style={styles.heroTopRow}>
            <View style={[styles.roleChip, { backgroundColor: roleTheme.badgeBg }]}>
              <AppIcon name={roleTheme.icon} size={15} color={roleTheme.accentDeep} />
              <Text style={[styles.roleChipText, { color: roleTheme.accentDeep }]}>{roleLabel}</Text>
            </View>
            <View style={[styles.lockChip, { backgroundColor: '#FFFFFF' }]}>
              <AppIcon name="lock" size={15} color={roleTheme.accent} />
              <Text style={[styles.lockChipText, { color: roleTheme.accentDeep }]}>Protected</Text>
            </View>
          </View>

          <Text style={[styles.eyebrow, { color: roleTheme.accentDeep }]}>Access Required</Text>
          <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>{featureTitle}</Text>
          <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
            {featureDescription}
          </Text>

          <View style={styles.stackStage}>
            <View style={[styles.stackBack, { backgroundColor: `${roleTheme.accent}10`, borderColor: `${roleTheme.accent}1F` }]} />
            <View style={[styles.stackMiddle, { backgroundColor: `${roleTheme.accent}14`, borderColor: `${roleTheme.accent}24` }]} />
            <LinearGradient colors={roleTheme.panel} style={styles.stackFront}>
              <View style={styles.stackHeader}>
                <View style={styles.stackIconWrap}>
                  <AppIcon name={roleTheme.icon} size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.stackTitle}>Login or signup to continue</Text>
              </View>
              <Text style={styles.stackCopy}>
                This feature becomes available as soon as your account is active.
              </Text>
              <View style={styles.stackDots}>
                <View style={styles.stackDot} />
                <View style={styles.stackDotMuted} />
                <View style={styles.stackDotMuted} />
              </View>
            </LinearGradient>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.bulletCard}>
          <Text style={[styles.bulletTitle, { color: theme.textPrimary }]}>
            {tx('What you unlock after login')}
          </Text>
          <View style={styles.bulletList}>
            {bullets.map((item) => (
              <View key={item} style={styles.bulletRow}>
                <View style={[styles.bulletIcon, { backgroundColor: roleTheme.accentSoft }]}>
                  <AppIcon name="check" size={12} color={roleTheme.accentDeep} />
                </View>
                <Text style={[styles.bulletText, { color: theme.textSecondary }]}>{item}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.inlineHint, { backgroundColor: roleTheme.accentSoft }]}>
            <AppIcon name="warning" size={14} color={roleTheme.accentDeep} />
            <Text style={[styles.inlineHintText, { color: roleTheme.accentDeep }]}>
              {tx('Login or signup to access this feature')}
            </Text>
          </View>
        </View>

        <Pressable onPress={onOpenAuth} style={styles.buttonShell}>
          <LinearGradient colors={[roleTheme.accent, roleTheme.accentDeep]} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>{tx('Login or Signup')}</Text>
            <AppIcon name="chevronRight" size={18} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        {onBack ? (
          <Pressable onPress={onBack} style={styles.secondaryShell}>
            <View style={[styles.secondaryButton, { borderColor: `${roleTheme.accent}30` }]}>
              <AppIcon name="chevronLeft" size={16} color={roleTheme.accent} />
              <Text style={[styles.secondaryText, { color: roleTheme.accentDeep }]}>
                {tx('Back to Home')}
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
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  heroWrap: {
    borderRadius: 30,
    overflow: 'hidden',
    ...createShadow({ color: '#0F172A', offsetY: 12, blur: 26, opacity: 0.1, elevation: 6 }),
  },
  heroCard: {
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  heroGlowLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -76,
    right: -54,
  },
  heroGlowSmall: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    bottom: 24,
    left: -34,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
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
    fontWeight: '900',
  },
  lockChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 999,
  },
  lockChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 25,
    lineHeight: 29,
    fontWeight: '900',
    marginBottom: 6,
    maxWidth: 260,
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    maxWidth: 280,
    marginBottom: 12,
  },
  stackStage: {
    marginTop: 2,
    height: 132,
    justifyContent: 'flex-end',
  },
  stackBack: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 14,
    bottom: 18,
    borderRadius: 20,
    borderWidth: 1,
  },
  stackMiddle: {
    position: 'absolute',
    left: 8,
    right: 8,
    top: 6,
    bottom: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  stackFront: {
    borderRadius: 22,
    padding: 14,
    minHeight: 112,
    justifyContent: 'space-between',
    ...createShadow({ color: '#0F172A', offsetY: 10, blur: 22, opacity: 0.16, elevation: 6 }),
  },
  stackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stackIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '900',
  },
  stackCopy: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
    maxWidth: 240,
  },
  stackDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  stackDot: {
    width: 24,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  stackDotMuted: {
    width: 8,
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.34)',
  },
  infoSection: { gap: 10 },
  bulletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    gap: 10,
    ...createShadow({ color: '#0F172A', offsetY: 6, blur: 16, opacity: 0.06, elevation: 3 }),
  },
  bulletTitle: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
  },
  bulletList: { gap: 9 },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  inlineHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inlineHintText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
  },
  buttonShell: {
    borderRadius: 18,
    overflow: 'hidden',
    ...createShadow({ color: '#0F172A', offsetY: 8, blur: 18, opacity: 0.12, elevation: 5 }),
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  secondaryShell: {
    alignItems: 'center',
  },
  secondaryButton: {
    minHeight: 44,
    minWidth: 170,
    borderRadius: 16,
    borderWidth: 1.2,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 18,
  },
  secondaryText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
