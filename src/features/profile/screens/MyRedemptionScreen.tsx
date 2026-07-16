import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon, C, PageHeader, Screen } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import type { UserRole } from '@/shared/types/navigation';
import { redemptionsApi } from '@/shared/api';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAppPageContent } from '@/shared/hooks';
import { formatISTDate } from '@/shared/utils/dateIST';
import { resolveImageUrl } from '@/shared/api/config';

const noDataImage = require('../assets/nodata.png');
const buySchemeImage = require('../assets/giftstore.png');
const bankTransferImage = require('../assets/upi.png');
const transferPointImage = require('../assets/transferpoint.png');

type RedemptionTab = 'Buy Gift' | 'Bank Transfer' | 'Transfer Point' | 'Dealer Bonus';
export type GiftStoreOrderFilter = 'This Month' | 'All' | 'Order placed' | 'Delivered';
type FilterRange = GiftStoreOrderFilter;
type GiftStoreOrder = {
  id: string;
  type: RedemptionTab;
  title: string;
  imageUrl?: string | null;
  points: string;
  date: string;
  rawDate: string;
  status: string;
  processedAt?: string | null;
  deliveredAt?: string | null;
  dispatchedAt?: string | null;
  estimatedDeliveryAt?: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  deliveryNotes?: string | null;
  shippingAddress?: string | null;
};

function normalizeName(value?: string | null) {
  return String(value ?? '').trim().toLowerCase();
}

function formatDate(value?: string | null) {
  if (!value) return 'Recent';
  const result = formatISTDate(value);
  return result || 'Recent';
}

function addDays(value: string | null | undefined, days: number) {
  const base = value ? new Date(value) : new Date();
  if (Number.isNaN(base.getTime())) return null;
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next.toISOString();
}

function toStatusLabel(status?: string | null) {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (!normalized || normalized === 'pending' || normalized === 'approved') return 'Order Place';
  if (normalized === 'shipped') return 'Dispatched';
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function isOrderPlacedStatus(status?: string | null) {
  const normalized = String(status ?? '').trim().toLowerCase();
  return ['pending', 'approved'].includes(normalized);
}

function isDeliveredStatus(status?: string | null, deliveredAt?: string | null) {
  return String(status ?? '').trim().toLowerCase() === 'delivered' || Boolean(deliveredAt);
}

function getStatusColors(status?: string | null) {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (normalized === 'rejected' || normalized === 'cancelled') {
    return { background: '#FEE2E2', text: '#B91C1C' };
  }
  if (normalized === 'pending' || normalized === 'approved') {
    return { background: '#DBEAFE', text: '#1D4ED8' };
  }
  return { background: '#DCFCE7', text: '#166534' };
}

function getExpectedDeliveryDate(order: GiftStoreOrder) {
  return order.estimatedDeliveryAt ?? addDays(order.processedAt ?? order.rawDate, 5);
}

function getTabLabel(tab: RedemptionTab) {
  return tab === 'Buy Gift' ? 'Gift Order' : tab;
}

function getGiftTrackingSteps(order: GiftStoreOrder) {
  const status = String(order.status ?? '').toLowerCase();
  const rejected = status === 'rejected' || status === 'cancelled';
  return [
    { label: 'Order placed', value: formatDate(order.rawDate), done: true },
    { label: 'Points redeemed', value: order.points, done: true },
    {
      label: 'Processing',
      value: rejected ? 'Rejected by admin' : 'Gift order confirmed',
      done: !rejected && ['pending', 'approved', 'completed', 'shipped', 'delivered'].includes(status),
    },
    {
      label: 'Dispatched',
      value: order.dispatchedAt ? formatDate(order.dispatchedAt) : (order.trackingNumber || 'Waiting for dispatch'),
      done: ['shipped', 'delivered'].includes(status),
    },
    {
      label: rejected ? 'Refund' : 'Delivery',
      value: rejected
        ? 'Points will be restored after admin review.'
        : (order.deliveredAt ? formatDate(order.deliveredAt) : `Expected ${formatDate(getExpectedDeliveryDate(order))}`),
      done: rejected || status === 'delivered',
    },
  ];
}

export function RedemptionPage({
  onBack,
  onNavigate,
  onOpenBankTransfer,
  onOpenTransferPoints,
  currentRole,
  initialFilter = 'This Month',
}: {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  onOpenBankTransfer: () => void;
  onOpenTransferPoints: () => void;
  currentRole: UserRole;
  initialFilter?: GiftStoreOrderFilter;
}) {
  const { tx, theme } = usePreferenceContext();
  const { giftProducts } = useAppData();
  const pageContent = useAppPageContent(currentRole, 'my_redemption');
  const [activeTab, setActiveTab] = useState<RedemptionTab>('Buy Gift');
  const [activeFilter, setActiveFilter] = useState<FilterRange>(initialFilter);
  const [loading, setLoading] = useState(true);
  const [redemptions, setRedemptions] = useState<GiftStoreOrder[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  const tabs: RedemptionTab[] =
    currentRole === 'dealer'
      ? ['Buy Gift', 'Bank Transfer', 'Dealer Bonus']
      : ['Buy Gift', 'Bank Transfer', 'Transfer Point'];
  const filters: FilterRange[] = ['This Month', 'All', 'Order placed', 'Delivered'];

  useEffect(() => {
    setActiveFilter(initialFilter);
    setExpandedOrderId(null);
  }, [initialFilter]);

  const giftImageByName = useMemo(() => {
    const map = new Map<string, string | null>();
    giftProducts.forEach((gift) => {
      map.set(normalizeName(gift.name), resolveImageUrl(gift.imageUrl ?? (gift as any).image ?? null));
    });
    return map;
  }, [giftProducts]);

  useEffect(() => {
    redemptionsApi.getHistory(1, 50).then((res) => {
      const data = res.data ?? [];
      const mapped = data.map((r: any, index: number) => {
        let tabType: RedemptionTab = 'Buy Gift';
        const t = (r.type ?? '').toLowerCase();
        if (t.includes('bank') || t.includes('transfer')) tabType = 'Bank Transfer';
        else if (t.includes('dealer') || t.includes('bonus')) tabType = 'Dealer Bonus';
        else if (t.includes('point')) tabType = 'Transfer Point';

        const isCredit = r.status === 'approved' || r.status === 'completed';
        const title = r.giftName ?? r.title ?? r.type ?? 'Redemption';
        const directImage = resolveImageUrl(r.giftImage ?? r.imageUrl ?? r.productImage ?? null);
        return {
          id: r.id ?? `${title}-${r.requestedAt ?? index}`,
          type: tabType,
          title,
          imageUrl: directImage ?? (tabType === 'Buy Gift' ? giftImageByName.get(normalizeName(title)) ?? null : null),
          points: isCredit ? `+${r.points}` : `-${r.points}`,
          rawDate: r.requestedAt ?? '',
          date: formatISTDate(r.requestedAt),
          status: r.status ?? 'pending',
          processedAt: r.processedAt ?? null,
          deliveredAt: r.deliveredAt ?? null,
          dispatchedAt: r.dispatchedAt ?? null,
          estimatedDeliveryAt: r.estimatedDeliveryAt ?? null,
          trackingNumber: r.trackingNumber ?? null,
          courierName: r.courierName ?? null,
          deliveryNotes: r.deliveryNotes ?? r.rejectionReason ?? null,
          shippingAddress: r.shippingAddress ?? null,
        };
      });
      setRedemptions(mapped);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [giftImageByName]);

  const filteredItems = useMemo(() => {
    const now = new Date();
    const byTab = redemptions.filter((item) => item.type === activeTab);
    if (activeFilter === 'Delivered') return byTab.filter((item) => isDeliveredStatus(item.status, item.deliveredAt));
    if (activeFilter === 'Order placed') return byTab.filter((item) => isOrderPlacedStatus(item.status));
    if (activeFilter === 'All') return byTab;

    const cutoff = new Date(now);
    cutoff.setDate(1);
    cutoff.setHours(0, 0, 0, 0);

    return byTab.filter((item) => {
      if (!item.rawDate) return false;
      const d = new Date(item.rawDate);
      return !isNaN(d.getTime()) && d >= cutoff;
    });
  }, [activeFilter, activeTab, redemptions]);

  const openTabDestination = (tab: RedemptionTab) => {
    setActiveTab(tab);
    if (tab === 'Buy Gift') return;
    if (tab === 'Bank Transfer') return onOpenBankTransfer();
    onOpenTransferPoints();
  };

  const placedOrdersCount = useMemo(
    () => redemptions.filter((r) => r.type === 'Buy Gift' && isOrderPlacedStatus(r.status)).length,
    [redemptions],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || tx('Gift Store Order')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <TouchableOpacity
            style={[
              styles.summaryCard,
              {
                backgroundColor: activeFilter === 'All' ? theme.accent : theme.surface,
                borderColor: activeFilter === 'All' ? theme.accent : theme.border,
              },
            ]}
            activeOpacity={0.86}
            onPress={() => {
              setActiveFilter('All');
              setExpandedOrderId(null);
            }}
          >
            <Text style={[styles.summaryLabel, { color: activeFilter === 'All' ? '#FFFFFF' : theme.textMuted }]}>
              {tx('Total Requests')}
            </Text>
            <Text style={[styles.summaryValue, { color: activeFilter === 'All' ? '#FFFFFF' : theme.textPrimary }]}>
              {loading ? '...' : redemptions.length}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.summaryCard,
              {
                backgroundColor: activeFilter === 'Order placed' ? theme.accent : theme.surface,
                borderColor: activeFilter === 'Order placed' ? theme.accent : theme.border,
              },
            ]}
            activeOpacity={0.86}
            onPress={() => {
              setActiveFilter('Order placed');
              setExpandedOrderId(null);
            }}
          >
            <Text style={[styles.summaryLabel, { color: activeFilter === 'Order placed' ? '#FFFFFF' : theme.textMuted }]}>
              {tx('Order placed')}
            </Text>
            <Text style={[styles.summaryValue, { color: activeFilter === 'Order placed' ? '#FFFFFF' : theme.accent }]}>
              {loading ? '...' : placedOrdersCount}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[styles.pointsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={[styles.pointsSub, { color: theme.accent }]}>{pageContent.sectionTitle || tx('Gift Store Order')}</Text>
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
                      tab === 'Buy Gift'
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
                    {tx(getTabLabel(tab))}
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
          filteredItems.map((item) => {
            const expanded = expandedOrderId === item.id;
            const trackingSteps = getGiftTrackingSteps(item);
            const statusColors = getStatusColors(item.status);
            const showExpectedDelivery = item.type === 'Buy Gift' && !['delivered', 'rejected', 'cancelled'].includes(String(item.status).toLowerCase());
            return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => setExpandedOrderId(expanded ? null : item.id)}
              style={[
                styles.historyCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.historyHead}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.historyImage} resizeMode="cover" />
                ) : (
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
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyTitle, { color: theme.textPrimary }]}>
                    {tx(item.title)}
                  </Text>
                  <Text style={[styles.historyDate, { color: theme.textMuted }]}>{item.date}</Text>
                </View>
                  <View style={[styles.statusChip, { backgroundColor: statusColors.background }]}>
                    <Text style={[styles.statusChipText, { color: statusColors.text }]}>{tx(toStatusLabel(item.status))}</Text>
                  </View>
              </View>
              <View style={[styles.statusRow, { backgroundColor: theme.soft }]}>
                <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                  {tx(item.type)}
                </Text>
                <Text style={[styles.dot, { color: theme.textMuted }]}>|</Text>
                <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                  {item.points}
                </Text>
              </View>
              {showExpectedDelivery && (
                <View style={[styles.expectedBox, { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' }]}>
                  <Text style={styles.expectedLabel}>{tx('Expected Delivery')}</Text>
                  <Text style={styles.expectedValue}>{formatDate(getExpectedDeliveryDate(item))}</Text>
                </View>
              )}
              {expanded && (
                <View style={[styles.trackingBox, { backgroundColor: theme.soft, borderColor: theme.border }]}>
                  <Text style={[styles.trackingTitle, { color: theme.textPrimary }]}>{tx('Gift Order Details')}</Text>
                  {trackingSteps.map((step, stepIndex) => (
                    <View key={`${step.label}-${stepIndex}`} style={styles.trackingStep}>
                      <View style={[styles.trackingDot, { backgroundColor: step.done ? '#16A34A' : theme.border }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.trackingLabel, { color: theme.textPrimary }]}>{tx(step.label)}</Text>
                        <Text style={[styles.trackingValue, { color: theme.textMuted }]}>{step.value}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={[styles.shipInfo, { borderTopColor: theme.border }]}>
                    <Text style={[styles.shipInfoText, { color: theme.textSecondary }]}>
                      {tx('Delivery Address')}: {item.shippingAddress || tx('Address saved with order')}
                    </Text>
                    {!!item.trackingNumber && (
                      <Text style={[styles.shipInfoText, { color: theme.textSecondary }]}>
                        {tx('Tracking ID')}: {item.trackingNumber}
                      </Text>
                    )}
                    {!!item.courierName && (
                      <Text style={[styles.shipInfoText, { color: theme.textSecondary }]}>
                        {tx('Courier Partner')}: {item.courierName}
                      </Text>
                    )}
                    {!!item.deliveryNotes && (
                      <Text style={[styles.shipInfoText, { color: String(item.status).toLowerCase() === 'rejected' ? '#B91C1C' : '#166534' }]}>
                        {item.deliveryNotes}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );})
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
  historyImage: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.tealLight },
  historyTitle: { fontSize: 14, fontWeight: '800' },
  historyDate: { fontSize: 12, marginTop: 3 },
  pointsText: { fontSize: 14, fontWeight: '900', color: C.primary },
  statusChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    maxWidth: 104,
  },
  statusChipText: { fontSize: 10.5, fontWeight: '800', textAlign: 'center' },
  statusRow: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: { fontSize: 12, fontWeight: '700' },
  dot: { marginHorizontal: 8, fontSize: 14 },
  expectedBox: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  expectedLabel: { color: '#047857', fontSize: 12, fontWeight: '800' },
  expectedValue: { color: '#065F46', fontSize: 13, fontWeight: '900' },
  trackingBox: { borderRadius: 18, borderWidth: 1, padding: 14, gap: 10 },
  trackingTitle: { fontSize: 13, fontWeight: '900', marginBottom: 2 },
  trackingStep: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  trackingDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  trackingLabel: { fontSize: 12, fontWeight: '800' },
  trackingValue: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  shipInfo: { borderTopWidth: 1, paddingTop: 10, gap: 5 },
  shipInfoText: { fontSize: 12, fontWeight: '700', lineHeight: 17 },
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
