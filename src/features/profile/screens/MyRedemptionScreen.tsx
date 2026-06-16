import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon, C, PageHeader, Screen } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import type { UserRole } from '@/shared/types/navigation';
import { redemptionsApi } from '@/shared/api';
import { useAppPageContent } from '@/shared/hooks';
import { formatISTDate } from '@/shared/utils/dateIST';

const noDataImage = require('../assets/nodata.png');
const buySchemeImage = require('../assets/giftstore.png');
const bankTransferImage = require('../assets/upi.png');
const transferPointImage = require('../assets/transferpoint.png');

type RedemptionTab = 'Buy Schemes' | 'Bank Transfer' | 'Transfer Point' | 'Dealer Bonus';
type FilterRange = 'This Month' | 'Last 30 Days' | 'All';

export function RedemptionPage({
  onBack,
  onNavigate,
  onOpenBankTransfer,
  onOpenTransferPoints,
  currentRole,
}: {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onOpenBankTransfer: () => void;
  onOpenTransferPoints: () => void;
  currentRole: UserRole;
}) {
  const { t, tx, theme } = usePreferenceContext();
  const pageContent = useAppPageContent(currentRole, 'my_redemption');
  const [activeTab, setActiveTab] = useState<RedemptionTab>('Buy Schemes');
  const [activeFilter, setActiveFilter] = useState<FilterRange>('This Month');
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState<
    {
      type: RedemptionTab;
      title: string;
      points: string;
      date: string;
      rawDate: string;
      status: string;
    }[]
  >([]);

  const tabs: RedemptionTab[] =
    currentRole === 'dealer'
      ? ['Buy Schemes', 'Bank Transfer', 'Dealer Bonus']
      : ['Buy Schemes', 'Bank Transfer', 'Transfer Point'];
  const filters: FilterRange[] = ['This Month', 'Last 30 Days', 'All'];

  useEffect(() => {
    redemptionsApi.getHistory(1, 50).then((res) => {
      const data = res.data ?? [];
      const mapped = data.map((r: any) => {
        let tabType: RedemptionTab = 'Buy Schemes';
        const t = (r.type ?? '').toLowerCase();
        if (t.includes('bank') || t.includes('transfer')) tabType = 'Bank Transfer';
        else if (t.includes('dealer') || t.includes('bonus')) tabType = 'Dealer Bonus';
        else if (t.includes('point')) tabType = 'Transfer Point';

        const isCredit = r.status === 'approved' || r.status === 'completed';
        return {
          type: tabType,
          title: r.type ?? 'Redemption',
          points: isCredit ? `+${r.points}` : `-${r.points}`,
          rawDate: r.requestedAt ?? '',
          date: formatISTDate(r.requestedAt),
          status: r.status ?? 'pending',
        };
      });
      setRedemptions(mapped);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    const now = new Date();
    const byTab = redemptions.filter((item) => item.type === activeTab);
    if (activeFilter === 'All') return byTab;

    const cutoff = new Date(now);
    if (activeFilter === 'This Month') {
      // From the 1st of current month at 00:00:00
      cutoff.setDate(1);
      cutoff.setHours(0, 0, 0, 0);
    } else {
      // Last 30 days from now
      cutoff.setDate(cutoff.getDate() - 30);
      cutoff.setHours(0, 0, 0, 0);
    }

    return byTab.filter((item) => {
      if (!item.rawDate) return false;
      const d = new Date(item.rawDate);
      return !isNaN(d.getTime()) && d >= cutoff;
    });
  }, [activeFilter, activeTab, redemptions]);

  const openTabDestination = (tab: RedemptionTab) => {
    setActiveTab(tab);
    if (tab === 'Buy Schemes') return onNavigate('rewards');
    if (tab === 'Bank Transfer') return onOpenBankTransfer();
    onOpenTransferPoints();
  };

  const totalRedeemed = useMemo(
    () => redemptions.filter((r) => r.status === 'completed' || r.status === 'approved').length,
    [redemptions],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('redemptionHistory')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
              {tx('Total Requests')}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
              {loading ? '...' : redemptions.length}
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
              {tx('Completed')}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.accent }]}>
              {loading ? '...' : totalRedeemed}
            </Text>
          </View>
        </View>

        <View
          style={[styles.pointsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={[styles.pointsSub, { color: theme.accent }]}>{pageContent.sectionTitle || tx('Redemption History')}</Text>
          <View style={styles.tabRow}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab,
                    {
                      backgroundColor: isActive ? theme.accentSoft : theme.soft,
                      borderColor: isActive ? theme.accent : 'transparent',
                    },
                  ]}
                  onPress={() => openTabDestination(tab)}
                  activeOpacity={0.8}
                >
                  <Image
                    source={
                      tab === 'Buy Schemes'
                        ? buySchemeImage
                        : tab === 'Bank Transfer'
                          ? bankTransferImage
                          : transferPointImage
                    }
                    style={styles.tabAsset}
                    resizeMode="contain"
                  />
                  <Text
                    style={[styles.tabText, { color: isActive ? theme.accent : theme.textSecondary }]}
                  >
                    {tx(tab)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View
          style={[styles.filterWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={[styles.filterLabel, { color: theme.textMuted }]}>{tx('Filter')}</Text>
          <View style={styles.filterRow}>
            {filters.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    { backgroundColor: isActive ? theme.accent : theme.soft },
                  ]}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: isActive ? '#fff' : theme.textSecondary },
                    ]}
                  >
                    {tx(filter)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 32 }} />
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item, index) => (
            <View
              key={`${item.title}-${index}`}
              style={[
                styles.historyCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.historyHead}>
                <View
                  style={[
                    styles.historyIcon,
                    {
                      backgroundColor:
                        item.type === 'Bank Transfer'
                          ? C.goldLight
                          : item.type === 'Transfer Point' || item.type === 'Dealer Bonus'
                            ? C.blueLight
                            : C.tealLight,
                    },
                  ]}
                >
                  <AppIcon
                    name={
                      item.type === 'Bank Transfer'
                        ? 'bank'
                        : item.type === 'Transfer Point' || item.type === 'Dealer Bonus'
                          ? 'transfer'
                          : 'gift'
                    }
                    size={18}
                    color={
                      item.type === 'Bank Transfer'
                        ? C.gold
                        : item.type === 'Transfer Point' || item.type === 'Dealer Bonus'
                          ? C.blue
                          : C.teal
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyTitle, { color: theme.textPrimary }]}>
                    {tx(item.title)}
                  </Text>
                  <Text style={[styles.historyDate, { color: theme.textMuted }]}>{item.date}</Text>
                </View>
            <Text style={styles.pointsText}>{item.points}</Text>
              </View>
              <View style={[styles.statusRow, { backgroundColor: theme.soft }]}>
                <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                  {tx(item.type)}
                </Text>
                <Text style={[styles.dot, { color: theme.textMuted }]}>|</Text>
                <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                  {tx(item.status)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Image source={noDataImage} style={styles.emptyImage} resizeMode="contain" />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {pageContent.emptyStateTitle || tx('No redemption history yet')}
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
              {pageContent.emptyStateSubtitle || tx('Your future redemption activity will appear here.')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, borderRadius: 22, borderWidth: 1, padding: 16 },
  summaryLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 24, fontWeight: '900', marginTop: 6 },
  pointsCard: { borderRadius: 24, padding: 18, borderWidth: 1 },
  pointsSub: { fontSize: 14, fontWeight: '700', marginBottom: 16, marginTop: 2 },
  tabRow: { flexDirection: 'row', gap: 10 },
  tab: { flex: 1, borderRadius: 18, padding: 12, alignItems: 'center', gap: 6, borderWidth: 1.5 },
  tabAsset: { width: 40, height: 40 },
  tabText: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  filterWrap: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 12 },
  filterLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10 },
  filterChipText: { fontSize: 12, fontWeight: '800' },
  historyCard: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 14 },
  historyHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTitle: { fontSize: 14, fontWeight: '800' },
  historyDate: { fontSize: 12, marginTop: 3 },
  pointsText: { fontSize: 14, fontWeight: '900', color: C.primary },
  statusRow: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  dot: { marginHorizontal: 8, fontSize: 14 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderRadius: 22,
    borderWidth: 1,
  },
  emptyImage: { width: 240, height: 240 },
  emptyTitle: { fontSize: 16, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6, paddingHorizontal: 24 },
});
