import { LocalizedText as Text } from '@/shared/preferences/LocalizedNative';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '@/shared/context/AuthContext';
import { getProfileCompletion, getProfileCompletionColor } from '@/shared/profile/profileCompletion';

export function ProfileCompletionBadge({ onPress }: { onPress: () => void }) {
  const { user, role } = useAuth();
  if (!user || !role) return null;
  const completion = getProfileCompletion(user, role);
  const color = getProfileCompletionColor(completion.percentage);
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - completion.percentage / 100);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Profile ${completion.percentage}% complete`}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={styles.core}>
        <Svg width={39} height={39} viewBox="0 0 40 40" style={styles.ring}>
          <Circle cx={20} cy={20} r={radius} stroke="#E5E7EB" strokeWidth={4} fill="#FFFFFF" />
          <Circle
            cx={20}
            cy={20}
            r={radius}
            stroke={color}
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(-90 20 20)"
          />
        </Svg>
        <View style={styles.coreValue}>
          <Text style={[styles.percentage, { color }]}>{completion.percentage}%</Text>
          {completion.complete ? <Text style={[styles.completed, { color }]}>Completed</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: { width: 39, height: 39, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute' },
  coreValue: { minWidth: 25, height: 25, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  percentage: { fontSize: 8, fontWeight: '900' },
  completed: { marginTop: -1, fontSize: 4.5, lineHeight: 5, fontWeight: '900' },
  pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
});
