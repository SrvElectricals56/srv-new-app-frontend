import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { OnboardingScreen } from '@/features/electrician/screens/OnboardingScreen';
import { UserAuthScreen } from '@/features/user/screens/AuthScreen';
import { AppIcon, C } from '../components/ProfileShared';
import { SRV_LOGO_URI } from '@/shared/data/logoBase64';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { UserRole } from '@/shared/types/navigation';

function SwitchRoleIcon({ c = '#fff', s = 16 }: { c?: string; s?: number }) {
  return (
    <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <Path d="M7 16H3m0 0l3-3m-3 3l3 3" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M17 8h4m0 0l-3-3m3 3l-3 3" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M3 8h10M11 16h10" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" />
    </Svg>
  );
}


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

  if (role === 'user' || role === 'counterboy') {
    return (
      <UserAuthScreen
        onAuthenticated={onAuthenticated}
        onBack={onBack}
        role={role}
      />
    );
  }

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

  const isDealer = role === 'dealer';
  const accent = '#173E80';
  const roleTheme = isDealer
    ? {
        p1: '#173E80',
        p2: '#355C95',
        p3: '#88AEEA',
        soft: '#EAF3FF',
        orb: '#CFE0FF',
        shell: '#F4F8FF',
        cardBorder: '#D7E7FF',
        secondaryBg: '#F7FBFF',
        secondaryBorder: '#C5DAFB',
        statsBorder: '#D7E7FF',
        statBg: '#EEF5FF',
        statCardBorder: '#D7E7FF',
        backFade: '#F7FBFF',
      }
    : {
        p1: '#173E80',
        p2: '#355C95',
        p3: '#6F879F',
        soft: '#EAF3FF',
        orb: '#BFDBFE',
        shell: '#EEF3F8',
        cardBorder: '#D7E7FF',
        secondaryBg: '#F7FBFF',
        secondaryBorder: '#BFD6F5',
        statsBorder: '#DCE8F8',
        statBg: '#EEF5FF',
        statCardBorder: '#D3E3FF',
        backFade: '#F7FBFF',
      };
  const title = isDealer
    ? tx('Dealer account access')
    : tx('Electrician account access');
  const subtitle = isDealer
    ? tx('Login or create your dealer account to unlock profile tools, network details and business controls.')
    : tx('Login or create your electrician account to unlock rewards, scan history and your complete profile.');
  const heroTitle = isDealer
    ? tx('Welcome Dealer')
    : tx('Welcome Electrician');
  const statThree = isDealer ? tx('Partners') : tx('Members');

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: roleTheme.shell }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={[roleTheme.p1, roleTheme.p2, roleTheme.p3]} style={styles.heroCard}>
        <View style={[styles.heroOrbLarge, { backgroundColor: roleTheme.orb }]} />
        <View style={[styles.heroOrbSmall, { backgroundColor: roleTheme.orb }]} />
        <View style={styles.logoWrap}>
          <Image source={{ uri: SRV_LOGO_URI }} style={styles.logoImg} resizeMode="contain" />
        </View>
        <View style={styles.heroTextBlock}>
          <Text style={styles.heroTag}>SRV ELECTRICALS</Text>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroSubtitle}>
            {isDealer
              ? tx('Manage business growth, connected electricians and dealer tools in one place.')
              : tx('Track rewards, scans and profile progress with your SRV account.')}
          </Text>
        </View>
      </LinearGradient>

      <View
        style={[
          styles.actionCard,
          {
            backgroundColor: '#FFFFFF',
            borderColor: roleTheme.cardBorder,
          },
        ]}
      >
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
          style={[
            styles.secondaryButton,
            {
              backgroundColor: roleTheme.secondaryBg,
              borderColor: roleTheme.secondaryBorder,
            },
          ]}
        >
          <Text style={[styles.secondaryButtonText, { color: accent }]}>{tx('Create New Account')}</Text>
        </Pressable>

        <View style={[styles.statsRow, { borderTopColor: roleTheme.statsBorder }]}>
          {[
            ['25+', tx('Years')],
            ['250+', tx('Products')],
            ['50K+', statThree],
          ].map(([value, label]) => (
            <View
              key={`${value}-${label}`}
              style={[
                styles.statItem,
                {
                  backgroundColor: roleTheme.statBg,
                  borderColor: roleTheme.statCardBorder,
                },
              ]}
            >
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
              colors={[roleTheme.soft, roleTheme.backFade]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.backButton, { borderColor: `${accent}40` }]}
            >
              <View style={[styles.backIconWrap, { backgroundColor: accent }]}>
                <SwitchRoleIcon s={14} c="#FFFFFF" />
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
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 12,
  },
  heroCard: {
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
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
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoImg: {
    width: 58,
    height: 58,
  },
  heroTag: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.62)',
    letterSpacing: 2.6,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroTextBlock: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
    width: '100%',
  },
  heroSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    width: '100%',
    maxWidth: 270,
  },
  actionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 10,
    ...createShadow({ color: '#000', offsetY: 4, blur: 10, opacity: 0.06, elevation: 3 }),
    backgroundColor: '#F7FBFF',
    borderColor: '#D7E7FF',
  },
  rolePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  rolePillText: { fontSize: 12, fontWeight: '800' },
  actionTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  actionSub: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: -2,
  },
  buttonShell: {
    borderRadius: 14,
    overflow: 'hidden',
    ...createShadow({ color: '#000', offsetY: 3, blur: 8, opacity: 0.15, elevation: 4 }),
  },
  primaryButton: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    minWidth: 78,
    borderWidth: 1,
  },
  statValue: { fontSize: 15, fontWeight: '900' },
  statLabel: { fontSize: 10, fontWeight: '600' },
  backButtonShell: {
    alignSelf: 'center',
    marginTop: 2,
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow({ color: '#000', offsetY: 3, blur: 8, opacity: 0.08, elevation: 3 }),
  },
  backButton: {
    height: 44,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  backIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '800',
  },
});


