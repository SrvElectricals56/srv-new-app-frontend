import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingScreen, type UserRole } from '@/features/electrician/screens/OnboardingScreen';
import { UserAuthScreen } from '@/features/user/screens/AuthScreen';
import { AppIcon, C } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';

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
      />
    );
  }

  const isDealer = role === 'dealer';
  const isUser = role === 'user';
  const accent = isDealer ? '#2563EB' : isUser ? '#7C3AED' : '#DE3B30';
  const accentSoft = isDealer ? '#DBEAFE' : isUser ? '#EDE9FE' : '#FEE2E2';
  const title = isDealer
    ? tx('Dealer account access')
    : isUser
      ? tx('Customer account access')
      : tx('Electrician account access');
  const subtitle = isDealer
    ? tx('Login or create your dealer account to unlock profile tools, network details and business controls.')
    : isUser
      ? tx('Login or create your customer account to browse products and get exclusive deals.')
      : tx('Login or create your electrician account to unlock rewards, scan history and your complete profile.');
  const bulletOne = isDealer
    ? tx('Business profile and KYC setup')
    : isUser
      ? tx('Browse 250+ certified products')
      : tx('Rewards, scans and redemption history');
  const bulletTwo = isDealer
    ? tx('Dealer network, bonus and orders')
    : isUser
      ? tx('Exclusive deals and offers')
      : tx('Electrician profile, wallet and level progress');

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.bg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[theme.heroSurface, theme.surface]} style={styles.heroCard}>
        <View style={[styles.heroGlow, { backgroundColor: accentSoft }]} />
        <View style={[styles.iconWrap, { backgroundColor: accentSoft }]}>
          <AppIcon name={isDealer ? 'building' : isUser ? 'star' : 'scan'} size={28} color={accent} />
        </View>
        <Text style={[styles.eyebrow, { color: accent }]}>
          {isDealer ? tx('Profile Locked For Dealer') : isUser ? tx('Profile Locked For Customer') : tx('Profile Locked For Electrician')}
        </Text>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>

        <View style={styles.highlights}>
          <View style={[styles.highlightCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AppIcon name="lock" size={16} color={accent} />
            <Text style={[styles.highlightText, { color: theme.textPrimary }]}>{bulletOne}</Text>
          </View>
          <View style={[styles.highlightCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AppIcon name={isDealer ? 'bank' : 'redeem'} size={16} color={accent} />
            <Text style={[styles.highlightText, { color: theme.textPrimary }]}>{bulletTwo}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.actionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.actionTitle, { color: theme.textPrimary }]}>{tx('Continue with your account')}</Text>
        <Text style={[styles.actionSub, { color: theme.textMuted }]}>
          {tx('Choose login if you already have an account, or create one in a few steps.')}
        </Text>

        <Pressable onPress={() => setMode('login')} style={styles.buttonShell}>
          <LinearGradient
            colors={isDealer ? ['#2563EB', '#60A5FA'] : isUser ? ['#7C3AED', '#A78BFA'] : ['#DE3B30', '#F87171']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.primaryButton}
          >
            <AppIcon name="chevronRight" size={18} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>{tx('Login')}</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => setMode('signup')}
          style={[styles.secondaryButton, { backgroundColor: accentSoft, borderColor: accent }]}
        >
          <AppIcon name="star" size={18} color={accent} />
          <Text style={[styles.secondaryButtonText, { color: accent }]}>{tx('Create Account')}</Text>
        </Pressable>

        {onBack && (
          <Pressable
            onPress={onBack}
            style={[styles.backButton, { borderColor: theme.border }]}
          >
            <AppIcon name="arrowLeft" size={18} color={theme.textMuted} />
            <Text style={[styles.backButtonText, { color: theme.textMuted }]}>{tx('Back')}</Text>
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
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    ...createShadow({ color: '#0F172A', offsetY: 8, blur: 20, opacity: 0.1, elevation: 5 }),
  },
  heroGlow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -70,
    right: -40,
    opacity: 0.7,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 16,
  },
  highlights: {
    gap: 8,
  },
  highlightCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  highlightText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  actionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 12,
    ...createShadow({ color: '#000', offsetY: 2, blur: 8, opacity: 0.06, elevation: 3 }),
  },
  actionTitle: {
    fontSize: 18,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '900',
  },
  backButton: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
