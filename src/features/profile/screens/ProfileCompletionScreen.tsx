import { LocalizedText as Text } from '@/shared/preferences/LocalizedNative';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '@/shared/context/AuthContext';
import { usePreferenceContext } from '@/shared/preferences';
import { getProfileCompletion, getProfileCompletionColor, type ProfileCompletionAction } from '@/shared/profile/profileCompletion';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';

export function ProfileCompletionPage({
  onBack,
  onAction,
}: {
  onBack: () => void;
  onAction: (action: ProfileCompletionAction) => void;
}) {
  const { user, role, refreshProfile } = useAuth();
  const { theme, tx } = usePreferenceContext();
  const completion = getProfileCompletion(user, role);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const accent = getProfileCompletionColor(completion.percentage);
  const ringRadius = 42;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference * (1 - completion.percentage / 100);
  return (
    <View style={[styles.screen, { backgroundColor: theme.bg }]}>
      <PageHeader title="Profile Completion" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.percentCircle}>
            <Svg width={104} height={104} viewBox="0 0 104 104" style={styles.progressRing}>
              <Circle cx={52} cy={52} r={ringRadius} fill={theme.soft} stroke={theme.border} strokeWidth={8} />
              <Circle
                cx={52}
                cy={52}
                r={ringRadius}
                fill="none"
                stroke={accent}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={`${ringCircumference} ${ringCircumference}`}
                strokeDashoffset={ringOffset}
                transform="rotate(-90 52 52)"
              />
            </Svg>
            <View style={styles.percentValue}>
              <Text style={[styles.percent, { color: accent }]}>{completion.percentage}%</Text>
              {completion.complete ? <Text style={[styles.completedLabel, { color: accent }]}>{tx('Completed')}</Text> : null}
            </View>
          </View>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {completion.complete ? tx('Profile completed') : tx('Complete your profile')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {completion.complete
              ? tx('All required profile, KYC, and payment details are complete.')
              : `${completion.completedCount} / ${completion.totalCount} ${tx('required items completed')}`}
          </Text>
          <View style={styles.batteryRow}>
            <View style={[styles.battery, { backgroundColor: theme.soft }]}>
              <View style={[styles.batteryFill, { width: `${completion.percentage}%`, backgroundColor: accent }]} />
            </View>
            <View style={[styles.batteryTip, { backgroundColor: accent }]} />
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{tx('Profile checklist')}</Text>
        {completion.items.map((item) => (
          <Pressable
            key={item.key}
            disabled={item.complete}
            onPress={() => onAction(item.action)}
            style={[styles.item, { backgroundColor: theme.surface, borderColor: item.complete ? '#BBF7D0' : '#FECACA' }]}
          >
            <View style={[styles.itemIcon, { backgroundColor: item.complete ? C.successLight : C.errorLight }]}>
              <AppIcon name={item.complete ? 'check' : 'warning'} size={20} color={item.complete ? C.success : C.error} />
            </View>
            <View style={styles.itemCopy}>
              <Text style={[styles.itemTitle, { color: theme.textPrimary }]}>{tx(item.label)}</Text>
              <Text style={[styles.itemDescription, { color: theme.textMuted }]}>
                {item.complete ? tx('Completed') : tx(item.description)}
              </Text>
            </View>
            {!item.complete ? (
              <View style={[styles.addButton, { backgroundColor: accent }]}><Text style={styles.addButtonText}>{tx('Upload / Add')}</Text></View>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingBottom: 36, gap: 11 },
  summary: { borderRadius: 24, borderWidth: 1, padding: 20, alignItems: 'center' },
  percentCircle: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center' },
  progressRing: { position: 'absolute' },
  percentValue: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  percent: { fontSize: 23, fontWeight: '900' },
  completedLabel: { marginTop: -2, fontSize: 9, fontWeight: '900' },
  title: { marginTop: 14, fontSize: 20, fontWeight: '900' },
  subtitle: { marginTop: 5, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  batteryRow: { width: '100%', marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  battery: { width: '91%', height: 18, borderRadius: 7, overflow: 'hidden', justifyContent: 'center' },
  batteryFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 4 },
  batteryTip: { width: 5, height: 12, borderTopRightRadius: 3, borderBottomRightRadius: 3, marginLeft: 3 },
  sectionTitle: { marginTop: 8, marginBottom: 2, fontSize: 15, fontWeight: '900' },
  item: { minHeight: 76, borderRadius: 17, borderWidth: 1, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemCopy: { flex: 1, minWidth: 0 },
  itemTitle: { fontSize: 14, fontWeight: '800' },
  itemDescription: { marginTop: 3, fontSize: 11, lineHeight: 16 },
  addButton: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  addButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
});
