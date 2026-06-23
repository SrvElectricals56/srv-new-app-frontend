import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { walletApi } from '@/shared/api';
import { formatISTDateTime } from '@/shared/utils/dateIST';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';

export function ScanHistoryPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'scan_history');
  const [loading, setLoading] = useState(true);
  const [totalScans, setTotalScans] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [scanHistory, setScanHistory] = useState<
    { product: string; points: string; time: string; code: string }[]
  >([]);

  useEffect(() => {
    walletApi.getScanHistory(1, 50).then((res) => {
      setTotalScans(res.total ?? res.data?.length ?? 0);
      const items = res.data ?? [];
      const earned = items.reduce((sum: number, s: any) => sum + (s.points ?? 0), 0);
      setTotalPoints(earned);
      setScanHistory(
        items.map((s: any) => ({
          product: s.productName ?? 'Product',
          points: `+${s.points ?? 0}`,
          time: formatISTDateTime(s.scannedAt),
          code: s.id?.slice(0, 8) ?? '',
        }))
      );
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('scanHistory')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.totalCard, { borderColor: theme.border }]}>
          <View>
            <Text style={styles.totalLabel}>{tx('Total Scans')}</Text>
            <Text style={styles.totalValue}>{loading ? '...' : totalScans}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View>
            <Text style={styles.totalLabel}>{tx('Points Earned')}</Text>
            <Text style={[styles.totalValue, { color: '#22C55E' }]}>
              {loading ? '...' : totalPoints.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 32 }} />
        ) : scanHistory.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {pageContent.emptyStateTitle || tx('No scans yet. Start scanning products to earn points!')}
            </Text>
          </View>
        ) : (
          scanHistory.map((item, i) => (
            <View
              key={i}
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={styles.iconWrap}>
                <AppIcon name="scan" size={22} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>{tx(item.product)}</Text>
                <Text style={[styles.sub, { color: theme.textMuted }]}>
                  {item.code ? `Code: ${item.code} | ` : ''}{item.time}
                </Text>
              </View>
              <Text style={styles.cta}>{item.points}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 10, paddingBottom: 32 },
  totalCard: {
    backgroundColor: C.navy,
    borderRadius: 28,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
  },
  totalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  totalValue: { fontSize: 28, fontWeight: '900', color: '#fff' },
  totalDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 3 },
  cta: { fontSize: 12, fontWeight: '800', color: '#16A34A' },
  emptyCard: {
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
