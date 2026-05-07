import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingScreen } from '@/features/electrician/screens/OnboardingScreen';
import { UserAuthScreen } from '@/features/user/screens/AuthScreen';
import { AppIcon, C } from '../components/ProfileShared';
import { SRV_LOGO_URI } from '@/shared/data/logoBase64';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { UserRole } from '@/shared/types/navigation';


export function AuthLandingScreen({
  role,
  onAuthenticated,
  onBack,
}: {
  role: UserRole;
  onAuthenticated: (
    role: UserRole,
    options?: { passwordConfigured?: boolean; passwordValue?: string }
  ) => void;
  onBack?: () => void;
}) {
  const { tx, theme } = usePreferenceContext();
  const [mode, setMode] = useState<'login' | 'signup' | null>(null);

  if (mode) {
    return (
      <OnboardingScreen
        key={`${role}-${mode}`}
        fixedRole={role}
        initialMode={mode}
        initialPhase="auth"
        onCancel={() => setMode(null)}
        onGetStarted={onAuthenticated}
      />
    );
  }

  // Customer gets a dedicated auth screen
  if (role === 'user') {
    return (
      <UserAuthScreen
        onAuthenticated={onAuthenticated}
        onBack={onBack}
        role="user"
      />
    );
  }

  const isDealer = role === 'dealer';
  const accent = theme.accent;
  const roleTheme = isDealer
    ? {
        p1: '#D97706',
        p2: '#92400E',
        p3: '#5B3410',
        soft: '#FEF3C7',
        orb: '#FCD34D',
      }
    : {
        p1: '#2563EB',
        p2: '#1D4ED8',
        p3: '#1E3A8A',
        soft: '#DBEAFE',
        orb: '#93C5FD',
      };
  const title = isDealer
    ? tx('Dealer account access')
    : tx('Electrician account access');
  const subtitle = isDealer
    ? tx('Login or create your dealer account to unlock profile tools, network details and business controls.')
    : tx('Login or create your electrician account to unlock rewards, scan history and your complete profile.');
  const heroTitle = isDealer ? tx('Welcome Dealer') : tx('Welcome Electrician');
  const statThree = isDealer ? tx('Partners') : tx('Members');

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: isDealer ? '#FFF9F0' : '#F4F8FF' }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[roleTheme.p1, roleTheme.p2, roleTheme.p3]} style={styles.heroCard}>
        <View style={[styles.heroOrbLarge, { backgroundColor: roleTheme.orb }]} />
        <View style={[styles.heroOrbSmall, { backgroundColor: roleTheme.orb }]} />
        <View style={styles.logoWrap}>
          <Image source={{ uri: SRV_LOGO_URI }} style={styles.logoImg} resizeMode="contain" />
        </View>
        <Text style={styles.heroTag}>SRV ELECTRICALS</Text>
        <Text style={styles.heroTitle}>{heroTitle}</Text>
        <Text style={styles.heroSubtitle}>
          {isDealer
            ? tx('Manage business growth, connected electricians and dealer tools in one place.')
            : tx('Track rewards, scans and profile progress with your SRV account.')}
        </Text>
      </LinearGradient>

      <View style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.rolePill, { backgroundColor: roleTheme.soft }]}>
          <AppIcon name={isDealer ? 'building' : 'scan'} size={16} color={accent} />
          <Text style={[styles.rolePillText, { color: accent }]}>{title}</Text>
        </View>
        <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>{tx('Get Started')}</Text>
        <Text style={[styles.actionSub, { color: theme.textMuted }]}>{subtitle}</Text>

        <Pressable onPress={() => setMode('login')} style={styles.buttonShell}>
          <LinearGradient
            colors={[roleTheme.p1, roleTheme.p2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>{tx('Login to Account')}</Text>
            <AppIcon name="chevronRight" size={18} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => setMode('signup')}
          style={[styles.secondaryButton, { backgroundColor: roleTheme.soft, borderColor: accent }]}
        >
          <Text style={[styles.secondaryButtonText, { color: accent }]}>{tx('Create New Account')}</Text>
        </Pressable>

        <View style={[styles.statsRow, { borderTopColor: theme.border }]}>
          {[
            ['25+', tx('Years')],
            ['250+', tx('Products')],
            ['50K+', statThree],
          ].map(([value, label]) => (
            <View key={`${value}-${label}`} style={styles.statItem}>
              <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>{label}</Text>
            </View>
          ))}
        </View>

        {onBack && (
          <Pressable
            onPress={onBack}
            style={styles.backButtonShell}
          >
            <LinearGradient
              colors={[roleTheme.soft, isDealer ? '#FFF7E8' : '#EEF5FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.backButton, { borderColor: `${accent}40` }]}
            >
              <View style={[styles.backIconWrap, { backgroundColor: accent }]}>
                <AppIcon name="arrowLeft" size={16} color="#FFFFFF" />
              </View>
              <Text style={[styles.backButtonText, { color: accent }]}>{tx('Switch Your Role')}</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 16, paddingBottom: 120 },
  heroCard: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    overflow: 'hidden',
    alignItems: 'center',
    ...createShadow({ color: '#0F172A', offsetY: 10, blur: 22, opacity: 0.16, elevation: 6 }),
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -40,
    right: -50,
    opacity: 0.2,
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: 10,
    left: -24,
    opacity: 0.15,
  },
  logoWrap: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoImg: {
    width: 66,
    height: 66,
  },
  heroTag: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.62)',
    letterSpacing: 3,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  actionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    ...createShadow({ color: '#000', offsetY: 4, blur: 10, opacity: 0.06, elevation: 3 }),
  },
  rolePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rolePillText: { fontSize: 12, fontWeight: '800' },
  actionTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  actionSub: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: -2,
  },
  buttonShell: {
    borderRadius: 14,
    overflow: 'hidden',
    ...createShadow({ color: '#000', offsetY: 3, blur: 8, opacity: 0.15, elevation: 4 }),
  },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 14,
    borderTopWidth: 1,
    marginTop: 4,
  },
  statItem: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 17, fontWeight: '900' },
  statLabel: { fontSize: 11, fontWeight: '600' },
  backButtonShell: {
    alignSelf: 'center',
    marginTop: 4,
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow({ color: '#000', offsetY: 3, blur: 8, opacity: 0.08, elevation: 3 }),
  },
  backButton: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  backIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
});





