import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { ordersApi, type UserOrder } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';

function formatDate(value?: string | null) {
  if (!value) {
    return 'Recent';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recent';
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toStatusLabel(status?: string) {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (!normalized) return 'Pending';
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function isClosedStatus(status?: string) {
  const normalized = String(status ?? '').trim().toLowerCase();
  return ['approved', 'completed', 'delivered', 'rejected', 'cancelled'].includes(normalized);
}

export function MyOrdersPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'my_orders');
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi
      .getAll()
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  const activeOrders = useMemo(
    () => orders.filter((order) => !isClosedStatus(order.status)),
    [orders]
  );

  const lastDeliveredOrder = useMemo(() => {
    const delivered = orders
      .filter((order) => ['approved', 'completed', 'delivered'].includes(String(order.status).toLowerCase()))
      .sort((a, b) => {
        const aTime = new Date(a.deliveredAt ?? a.createdAt).getTime();
        const bTime = new Date(b.deliveredAt ?? b.createdAt).getTime();
        return bTime - aTime;
      });

    return delivered[0] ?? null;
  }, [orders]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('myOrders')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
              {tx('Active Orders')}
            </Text>
            <Text style={[styles.summaryValue, { color: theme.textPrimary }]}>
              {loading ? '...' : String(activeOrders.length).padStart(2, '0')}
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
              {tx('Last Delivery')}
            </Text>
            <Text style={[styles.summaryValue, { color: C.teal }]}>
              {loading ? '...' : formatDate(lastDeliveredOrder?.deliveredAt ?? lastDeliveredOrder?.createdAt).slice(0, 6)}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 32 }} />
        ) : orders.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {pageContent.emptyStateTitle || tx('No orders or redemptions found yet.')}
            </Text>
          </View>
        ) : (
          orders.map((order) => (
            <View
              key={order.id}
              style={[
                styles.orderCard,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <View style={styles.orderHead}>
                <View style={[styles.orderIcon, { backgroundColor: order.type === 'product' ? '#DBEAFE' : C.purpleLight }]}>
                  <AppIcon name={order.type === 'product' ? 'order' : 'redeem'} size={20} color={order.type === 'product' ? '#1D4ED8' : C.purple} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.orderTitle, { color: theme.textPrimary }]}>
                    {order.title || tx('Reward redemption')}
                  </Text>
                  <Text style={[styles.orderType, { color: order.type === 'product' ? '#1D4ED8' : C.purple }]}>
                    {order.type === 'product' ? `${tx('Product')} · ${tx('Qty')}: ${order.quantity}` : tx('Gift')}
                  </Text>
                  <Text style={[styles.orderMeta, { color: theme.textMuted }]}>{order.id}</Text>
                </View>
                <View style={styles.statusChip}>
                  <Text style={styles.statusText}>{toStatusLabel(order.status)}</Text>
                </View>
              </View>
              <View style={[styles.detailStrip, { backgroundColor: theme.soft }]}>
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  {formatDate(order.deliveredAt ?? order.createdAt)}
                </Text>
                <Text style={[styles.dot, { color: theme.textMuted }]}>•</Text>
                <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                  {order.type === 'product'
                    ? `₹${order.total.toLocaleString('en-IN')}`
                    : `${order.points.toLocaleString('en-IN')} pts`}</Text>
              </View>
            </View>
          ))
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
  summaryValue: { fontSize: 26, fontWeight: '900', marginTop: 6 },
  orderCard: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 14 },
  orderHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: C.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderTitle: { fontSize: 15, fontWeight: '800' },
  orderType: { fontSize: 11, fontWeight: '700', marginTop: 2 },
  orderMeta: { fontSize: 12, marginTop: 3 },
  statusChip: {
    borderRadius: 999,
    backgroundColor: C.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusText: { color: C.primary, fontSize: 11, fontWeight: '800' },
  detailStrip: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: { fontSize: 13, fontWeight: '700' },
  dot: { marginHorizontal: 8, fontSize: 14 },
  emptyCard: {
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
