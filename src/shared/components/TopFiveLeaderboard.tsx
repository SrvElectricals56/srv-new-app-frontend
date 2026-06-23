import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { leaderboardApi, type TopFiveMember } from '@/shared/api/services';
import type { UserRole } from '@/shared/types/navigation';

export function TopFiveLeaderboard({ role, darkMode = false }: { role: UserRole; darkMode?: boolean }) {
  const [rows, setRows] = useState<TopFiveMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    leaderboardApi.getTopFive(role)
      .then(data => { if (active) setRows(Array.isArray(data) ? data : []); })
      .catch(() => { if (active) setRows([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [role]);

  if (!loading && rows.length === 0) return null;
  const title = role === 'dealer' ? 'Top 5 Dealers' : role === 'user' ? 'Top 5 Customers' : role === 'counterboy' ? 'Top 5 Counter Boys' : 'Top 5 Electricians';

  return <View style={[styles.card, darkMode && styles.cardDark]}>
    <Text style={[styles.title, darkMode && styles.textLight]}>{title}</Text>
    {loading ? <ActivityIndicator color="#2563EB" style={{ marginVertical: 18 }} /> : rows.map(row => (
      <View key={row.id} style={[styles.row, darkMode && styles.rowDark]}>
        <View style={styles.rank}><Text style={styles.rankText}>{row.rank}</Text></View>
        <View style={styles.info}>
          <Text style={[styles.name, darkMode && styles.textLight]} numberOfLines={1}>{row.name}</Text>
          <Text style={[styles.address, darkMode && styles.textMuted]} numberOfLines={1}>{row.address}</Text>
        </View>
        <View style={styles.valueWrap}>
          <Text style={styles.value}>{Number(row.value || 0).toLocaleString('en-IN')}</Text>
          <Text style={[styles.valueLabel, darkMode && styles.textMuted]}>{row.valueLabel}</Text>
        </View>
      </View>
    ))}
  </View>;
}

const styles = StyleSheet.create({
  card: { marginTop: 14, marginBottom: 14, marginHorizontal: 0, padding: 14, borderRadius: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DBEAFE' },
  cardDark: { backgroundColor: '#111827', borderColor: '#263449' },
  title: { fontSize: 16, fontWeight: '900', color: '#172554', marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#E2E8F0' },
  rowDark: { borderTopColor: '#334155' },
  rank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  rankText: { color: '#1D4ED8', fontWeight: '900', fontSize: 12 },
  info: { flex: 1, minWidth: 0 },
  name: { color: '#0F172A', fontSize: 13, fontWeight: '800' },
  address: { color: '#64748B', fontSize: 10, marginTop: 2 },
  valueWrap: { alignItems: 'flex-end', maxWidth: 100 },
  value: { color: '#16A34A', fontSize: 14, fontWeight: '900' },
  valueLabel: { color: '#64748B', fontSize: 9, textAlign: 'right' },
  textLight: { color: '#F8FAFC' },
  textMuted: { color: '#94A3B8' },
});
