import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { useAuth } from '@/shared/context/AuthContext';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';

export type ElectricianTierName = 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

type TierInfo = {
  tier: ElectricianTierName;
  range: string;
  accent: string;
  soft: string;
  gradient: [string, string, string];
  detail: string;
};

function BackIcon({ color = '#173E80', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5L8 12L15 19"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ElectricianTierIcon({
  tier,
  size = 26,
}: {
  tier: ElectricianTierName;
  size?: number;
}) {
  if (tier === 'Silver') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" fill="#E2E8F0" stroke="#94A3B8" strokeWidth={1.8} />
        <Path
          d="M8.2 12.5l2.4 2.4 5.1-5.4"
          stroke="#64748B"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  if (tier === 'Gold') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="12" cy="12" r="9" fill="#FEF3C7" stroke="#D97706" strokeWidth={1.8} />
        <Path
          d="M12 5.8l1.9 3.85 4.25.62-3.07 3 .72 4.23L12 15.6l-3.8 1.9.73-4.23-3.08-3 4.25-.62L12 5.8z"
          fill="#B45309"
        />
      </Svg>
    );
  }

  if (tier === 'Platinum') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2L14.5 8.5L21.5 9.5L16 14.5L17.5 21.5L12 18L6.5 21.5L8 14.5L2.5 9.5L9.5 8.5L12 2Z"
          fill="#DBEAFE"
          stroke="#2563EB"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <Path
          d="M12 6L13.2 10L17 10.5L14.2 13L15 17L12 15.2L9 17L9.8 13L7 10.5L10.8 10L12 6Z"
          fill="#1D4ED8"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3.8l5.3 4.1-2 6.6H8.7l-2-6.6L12 3.8z"
        fill="#CFFAFE"
        stroke="#0891B2"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path d="M9.5 16.3h5l1.4 2.8H8.1l1.4-2.8z" fill="#0E7490" />
    </Svg>
  );
}

const tierLevels: TierInfo[] = [
  {
    tier: 'Silver',
    range: '0 - 1000 points',
    accent: '#64748B',
    soft: '#E2E8F0',
    gradient: ['#F8FAFC', '#EEF2F7', '#E2E8F0'],
    detail: 'Starting level for electricians building up their first reward points.',
  },
  {
    tier: 'Gold',
    range: '1001 - 5000 points',
    accent: '#B45309',
    soft: '#FEF3C7',
    gradient: ['#FFF8E6', '#FEF0C7', '#FDE68A'],
    detail: 'Strong reward status with steady scanning and reward collection.',
  },
  {
    tier: 'Platinum',
    range: '5001 - 10000 points',
    accent: '#1D4ED8',
    soft: '#DBEAFE',
    gradient: ['#EFF6FF', '#DBEAFE', '#BFDBFE'],
    detail: 'Premium level for electricians with high reward point activity.',
  },
  {
    tier: 'Diamond',
    range: '10000+ points',
    accent: '#0E7490',
    soft: '#CFFAFE',
    gradient: ['#ECFEFF', '#CFFAFE', '#A5F3FC'],
    detail: 'Top elite reward level for electricians with the strongest point balance.',
  },
];

export function getElectricianTier(points: number): TierInfo {
  if (points <= 1000) return tierLevels[0];
  if (points <= 5000) return tierLevels[1];
  if (points <= 10000) return tierLevels[2];
  return tierLevels[3];
}

export function ElectricianTierScreen({
  onBack,
  totalPoints,
}: {
  onBack: () => void;
  totalPoints?: number;
}) {
  const { user } = useAuth();
  const { darkMode, tx } = usePreferenceContext();
  const points = Math.max(
    Number(totalPoints ?? 0),
    Number(user?.totalPoints ?? 0),
    Number(user?.walletBalance ?? 0),
  );
  const currentTier = useMemo(() => getElectricianTier(points), [points]);
  const pulse = useRef(new Animated.Value(0)).current;
  const floatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(
          pulse,
          withWebSafeNativeDriver({
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        Animated.timing(
          pulse,
          withWebSafeNativeDriver({
            toValue: 0,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
          })
        ),
      ])
    );
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(
          floatY,
          withWebSafeNativeDriver({
            toValue: -8,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        Animated.timing(
          floatY,
          withWebSafeNativeDriver({
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
          })
        ),
      ])
    );
    pulseLoop.start();
    floatLoop.start();
    return () => {
      pulseLoop.stop();
      floatLoop.stop();
    };
  }, [floatY, pulse]);

  const glowOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.78],
  });

  return (
    <View style={[styles.screen, darkMode ? styles.screenDark : null]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, darkMode ? styles.backBtnDark : null]}
          onPress={onBack}
          activeOpacity={0.85}
        >
          <BackIcon color={darkMode ? '#F8FAFC' : '#173E80'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, darkMode ? styles.headerTitleDark : null]}>
          {tx('Member Tier')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ transform: [{ translateY: floatY }] }}>
          <LinearGradient
            colors={currentTier.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <Animated.View
              style={[styles.heroGlow, { opacity: glowOpacity, backgroundColor: currentTier.soft }]}
            />
            <View style={styles.heroIconWrap}>
              <ElectricianTierIcon tier={currentTier.tier} size={36} />
            </View>
            <Text style={[styles.heroEyebrow, { color: currentTier.accent }]}>
              {tx('Current Reward Level')}
            </Text>
            <Text style={styles.heroTitle}>{tx(currentTier.tier)}</Text>
            <Text style={styles.heroSub}>
              {tx('You have')} {points.toLocaleString()} {tx('points')}.{' '}
              {tx(
                'Your current grading is based on total reward points earned through scans and redemptions.'
              )}
            </Text>
            <View style={styles.heroStatsRow}>
              <View style={styles.heroStatBox}>
                <Text style={styles.heroStatValue}>{points}</Text>
                <Text style={styles.heroStatLabel}>{tx('Current points')}</Text>
              </View>
              <View style={styles.heroStatBox}>
                <Text style={styles.heroStatValue}>{tx(currentTier.range)}</Text>
                <Text style={styles.heroStatLabel}>{tx('Tier range')}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={[styles.sectionCard, darkMode ? styles.sectionCardDark : null]}>
          <Text style={[styles.sectionTitle, darkMode ? styles.sectionTitleDark : null]}>
            {tx('Points grading system')}
          </Text>
          {tierLevels.map((level) => {
            const active = level.tier === currentTier.tier;
            return (
              <LinearGradient
                key={level.tier}
                colors={active ? level.gradient : ['#FFFFFF', '#FFFFFF', '#F8FAFC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.tierRow,
                  active
                    ? [styles.tierRowActive, { borderColor: level.accent }]
                    : styles.tierRowIdle,
                ]}
              >
                <View style={[styles.tierIconHolder, { backgroundColor: level.soft }]}>
                  <ElectricianTierIcon tier={level.tier} />
                </View>
                <View style={styles.tierCopy}>
                  <View style={styles.tierTitleRow}>
                    <Text style={[styles.tierName, { color: active ? level.accent : '#17324D' }]}>
                      {tx(level.tier)}
                    </Text>
                    {active ? (
                      <Text
                        style={[
                          styles.currentChip,
                          { color: level.accent, backgroundColor: level.soft },
                        ]}
                      >
                        {tx('Current')}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={[styles.tierRange, darkMode ? styles.tierRangeDark : null]}>
                    {tx(level.range)}
                  </Text>
                  <Text style={[styles.tierDetail, darkMode ? styles.tierDetailDark : null]}>
                    {tx(level.detail)}
                  </Text>
                </View>
              </LinearGradient>
            );
          })}
        </View>

        <View style={[styles.sectionCard, darkMode ? styles.sectionCardDark : null]}>
          <Text style={[styles.sectionTitle, darkMode ? styles.sectionTitleDark : null]}>
            {tx('How reward tier works')}
          </Text>
          <View style={styles.pointRow}>
            <View style={[styles.pointDot, { backgroundColor: '#CBD5E1' }]} />
            <Text style={[styles.pointText, darkMode ? styles.pointTextDark : null]}>
              {tx('Reward level is calculated from total points earned.')}
            </Text>
          </View>
          <View style={styles.pointRow}>
            <View style={[styles.pointDot, { backgroundColor: '#FBBF24' }]} />
            <Text style={[styles.pointText, darkMode ? styles.pointTextDark : null]}>
              {tx('Each grade uses a different icon and color so status is easy to identify.')}
            </Text>
          </View>
          <View style={styles.pointRow}>
            <View style={[styles.pointDot, { backgroundColor: '#60A5FA' }]} />
            <Text style={[styles.pointText, darkMode ? styles.pointTextDark : null]}>
              {tx('As you earn more points, your level updates automatically to the next tier.')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EEF3F8' },
  screenDark: { backgroundColor: '#08111F' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#17324D' },
  backBtnDark: { backgroundColor: 'transparent' },
  headerTitleDark: { color: '#F8FAFC' },
  headerSpacer: { width: 44 },
  content: { padding: 16, paddingTop: 6, gap: 16, paddingBottom: 34 },
  heroCard: { borderRadius: 30, overflow: 'hidden', padding: 22 },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -26,
    right: -26,
  },
  heroIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFFCC',
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  heroTitle: { fontSize: 30, fontWeight: '900', color: '#17324D' },
  heroSub: { marginTop: 8, fontSize: 14, lineHeight: 22, color: '#4F6482' },
  heroStatsRow: { flexDirection: 'row', gap: 12, marginTop: 18 },
  heroStatBox: { flex: 1, borderRadius: 20, backgroundColor: '#FFFFFFC7', padding: 14 },
  heroStatValue: { fontSize: 18, fontWeight: '900', color: '#17324D' },
  heroStatLabel: {
    fontSize: 11.5,
    lineHeight: 17,
    color: '#5D7391',
    marginTop: 4,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 18,
    ...createShadow({ color: '#0F172A', offsetY: 10, blur: 18, opacity: 0.06, elevation: 4 }),
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#17324D', marginBottom: 14 },
  sectionCardDark: {
    backgroundColor: '#111827',
    ...createShadow({ color: '#020617', offsetY: 10, blur: 18, opacity: 0.06, elevation: 4 }),
  },
  sectionTitleDark: { color: '#F8FAFC' },
  tierRow: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1.4,
    marginBottom: 12,
  },
  tierRowActive: {
    ...createShadow({ color: '#94A3B8', offsetY: 8, blur: 16, opacity: 0.08, elevation: 3 }),
  },
  tierRowIdle: { borderColor: '#E2E8F0' },
  tierIconHolder: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierCopy: { flex: 1 },
  tierTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  tierName: { fontSize: 16, fontWeight: '900' },
  currentChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    fontSize: 11,
    fontWeight: '800',
  },
  tierRange: { marginTop: 4, fontSize: 12, fontWeight: '800', color: '#52667F' },
  tierDetail: { marginTop: 6, fontSize: 12.5, lineHeight: 19, color: '#6A7E98' },
  tierRangeDark: { color: '#CBD5E1' },
  tierDetailDark: { color: '#94A3B8' },
  pointRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  pointDot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  pointText: { flex: 1, fontSize: 13.5, lineHeight: 21, color: '#52667F', fontWeight: '600' },
  pointTextDark: { color: '#94A3B8' },
});
