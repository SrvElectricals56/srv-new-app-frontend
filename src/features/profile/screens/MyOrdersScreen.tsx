import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { ordersApi, type UserOrder } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAppPageContent } from '@/shared/hooks';
import { formatISTDate } from '@/shared/utils/dateIST';
import { resolveImageUrl } from '@/shared/api/config';

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

function getExpectedDeliveryDate(order: UserOrder) {
  return (
    order.estimatedDeliveryAt ??
    addDays(order.paidAt ?? order.orderedAt ?? order.createdAt, 5)
  );
}

function toStatusLabel(status?: string | null, type?: string | null) {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (type === 'product' && normalized === 'pending') return 'Order Confirmed';
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

function getOrderStatusColors(status?: string | null, paymentStatus?: string | null) {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (normalized === 'rejected' || normalized === 'cancelled') {
    return { background: '#FEE2E2', text: '#B91C1C' };
  }
  if (normalized === 'pending' || normalized === 'approved') {
    return { background: '#DBEAFE', text: '#1D4ED8' };
  }
  return { background: '#DCFCE7', text: '#166534' };
}

function normalizeName(value?: string | null) {
  return String(value ?? '').trim().toLowerCase();
}

function safeNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = 25000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Orders request timed out')), timeoutMs);
    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

function getOrderAmountLabel(order: UserOrder) {
  if (order.type === 'product') {
    return `Rs.${safeNumber(order.total).toLocaleString('en-IN')}`;
  }
  return `${safeNumber(order.points ?? order.total).toLocaleString('en-IN')} pts`;
}

function getOrderImage(order: UserOrder, giftImageByName: Map<string, string | null>) {
  const directImage = resolveImageUrl(
    order.productImage ??
    order.imageUrl ??
    (order as any).giftImage ??
    (order as any).image ??
    null,
  );
  if (directImage) return directImage;
  if (order.type !== 'gift') return null;

  return (
    giftImageByName.get(normalizeName(order.productName)) ??
    giftImageByName.get(normalizeName(order.title)) ??
    null
  );
}

function getTrackingSteps(order: UserOrder) {
  const status = String(order.status ?? '').toLowerCase();
  const orderedAt = order.orderedAt ?? order.createdAt;
  const shippedAt = order.dispatchedAt ?? addDays(orderedAt, 3);
  const deliveryAt = order.deliveredAt ?? getExpectedDeliveryDate(order);
  const shipped = Boolean(order.dispatchedAt) || ['shipped', 'delivered'].includes(status);
  const delivered = Boolean(order.deliveredAt) || status === 'delivered';

  return [
    {
      label: 'Order Confirmed',
      value: `Your Order has been placed.\n${formatDate(orderedAt)}\nSeller is processing your order.\nItem waiting to be picked up by delivery partner.\n${formatDate(addDays(orderedAt, 2))}`,
      done: true,
    },
    {
      label: `Shipped Expected By ${formatDate(shippedAt)}`,
      value: shipped ? `Item shipped.\n${formatDate(shippedAt)}` : `Item yet to be shipped.\nExpected by ${formatDate(shippedAt)}`,
      done: shipped,
    },
    {
      label: 'Out For Delivery',
      value: delivered ? 'Item is out for delivery.' : 'Item yet to be delivered.',
      done: delivered,
    },
    {
      label: `Delivery Expected By ${formatDate(deliveryAt)}`,
      value: delivered ? `Item delivered.\n${formatDate(deliveryAt)}` : `Item yet to be delivered.\nExpected by ${formatDate(deliveryAt)}`,
      done: delivered,
    },
  ];
}

function getOrderProgress(order: UserOrder) {
  const status = String(order.status ?? '').toLowerCase();
  const shipped = Boolean(order.dispatchedAt) || ['shipped', 'delivered'].includes(status);
  const delivered = Boolean(order.deliveredAt) || status === 'delivered';
  const expectedDeliveryAt = getExpectedDeliveryDate(order);
  return [
    {
      label: 'Order Confirmed',
      value: formatDate(order.orderedAt ?? order.createdAt),
      done: true,
    },
    {
      label: 'Shipped',
      value: shipped ? formatDate(order.dispatchedAt ?? order.createdAt) : formatDate(addDays(order.orderedAt ?? order.createdAt, 3)),
      done: shipped,
    },
    {
      label: 'Delivery',
      value: delivered ? formatDate(order.deliveredAt) : formatDate(expectedDeliveryAt),
      done: delivered,
    },
  ];
}

export function MyOrdersPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role } = useAuth();
  const { giftProducts } = useAppData();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'my_orders');
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [showAllUpdates, setShowAllUpdates] = useState(false);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setLoadError(null);
    withTimeout(ordersApi.getAll())
      .then((data) => {
        if (!active) return;
        setOrders(
          Array.isArray(data)
            ? data.map((order) => ({
                ...order,
                quantity: safeNumber(order.quantity) || 1,
                price: safeNumber(order.price),
                total: safeNumber(order.total),
                points: safeNumber(order.points ?? order.total),
              }))
            : [],
        );
      })
      .catch((error) => {
        if (!active) return;
        console.warn('Unable to load orders.', error);
        setOrders([]);
        setLoadError('Unable to load orders. Please try again later.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
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

  const giftImageByName = useMemo(() => {
    const map = new Map<string, string | null>();
    giftProducts.forEach((gift) => {
      map.set(normalizeName(gift.name), resolveImageUrl(gift.imageUrl ?? (gift as any).image ?? null));
    });
    return map;
  }, [giftProducts]);

  if (selectedOrder && showAllUpdates) {
    const trackingSteps = getTrackingSteps(selectedOrder);
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <PageHeader title={tx('Order Updates')} onBack={() => setShowAllUpdates(false)} />
        <ScrollView contentContainerStyle={styles.timelineContent} showsVerticalScrollIndicator={false}>
          {trackingSteps.map((step, index) => {
            const isLast = index === trackingSteps.length - 1;
            return (
              <View key={`${step.label}-${index}`} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineDot, { backgroundColor: step.done ? '#16A34A' : '#FFFFFF', borderColor: step.done ? '#16A34A' : '#D1D5DB' }]} />
                  {!isLast ? <View style={[styles.timelineLine, { backgroundColor: '#E5E7EB' }]} /> : null}
                </View>
                <View style={styles.timelineCopy}>
                  <Text style={[styles.timelineTitle, { color: step.done ? theme.textPrimary : theme.textMuted }]}>
                    {tx(step.label)} {index === 0 ? formatDate(selectedOrder.orderedAt ?? selectedOrder.createdAt) : ''}
                  </Text>
                  <Text style={[styles.timelineText, { color: step.done ? theme.textPrimary : theme.textMuted }]}>
                    {step.value}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  if (selectedOrder) {
    const progress = getOrderProgress(selectedOrder);
    const orderImage = getOrderImage(selectedOrder, giftImageByName);
    const isGift = selectedOrder.type === 'gift';
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <PageHeader title={tx('Order Details')} onBack={() => setSelectedOrder(null)} />
        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          <View style={styles.detailProductRow}>
            <View style={[styles.detailImageWrap, { backgroundColor: isGift ? C.purpleLight : '#DBEAFE' }]}>
              {orderImage ? (
                <Image source={{ uri: orderImage }} style={styles.detailImage} resizeMode="cover" />
              ) : (
                <AppIcon name={isGift ? 'redeem' : 'order'} size={24} color={isGift ? C.purple : '#1D4ED8'} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailProductTitle, { color: theme.textPrimary }]} numberOfLines={2}>
                {selectedOrder.title || selectedOrder.productName || tx('Order')}
              </Text>
              <Text style={[styles.detailProductMeta, { color: theme.textMuted }]}>
                {isGift ? tx('Gift') : `${tx('Product')} | ${tx('Qty')}: ${selectedOrder.quantity}`}
              </Text>
            </View>
          </View>

          <Text style={[styles.detailOrderId, { color: theme.textMuted }]}>Order #{selectedOrder.id}</Text>

          <View style={[styles.progressCard, { borderColor: '#1D4ED8', backgroundColor: theme.surface }]}>
            <Text style={[styles.progressTitle, { color: theme.textPrimary }]}>
              {tx(toStatusLabel(selectedOrder.status, selectedOrder.type))}
            </Text>
            <Text style={[styles.progressSubtitle, { color: theme.textSecondary }]}>
              {tx('Your Order has been placed.')}
            </Text>
            <View style={styles.progressTrack}>
              {progress.map((step, index) => (
                <React.Fragment key={step.label}>
                  <View style={styles.progressStep}>
                    <View style={[styles.progressDot, { backgroundColor: step.done ? '#16A34A' : '#FFFFFF', borderColor: step.done ? '#16A34A' : '#D1D5DB' }]}>
                      {step.done ? <Text style={styles.progressCheck}>✓</Text> : null}
                    </View>
                    <Text style={[styles.progressLabel, { color: theme.textSecondary }]}>{tx(step.label)}</Text>
                    <Text style={[styles.progressDate, { color: theme.textMuted }]}>{step.value}</Text>
                  </View>
                  {index < progress.length - 1 ? <View style={styles.progressConnector} /> : null}
                </React.Fragment>
              ))}
            </View>
            <View style={[styles.infoBox, { backgroundColor: theme.soft }]}>
              <Text style={[styles.infoText, { color: theme.textSecondary }]}>
                {selectedOrder.trackingNumber
                  ? `${tx('Tracking ID')}: ${selectedOrder.trackingNumber}`
                  : tx('Delivery Executive details will be available once the order is out for delivery')}
              </Text>
            </View>
            <TouchableOpacity style={styles.seeUpdatesButton} activeOpacity={0.8} onPress={() => setShowAllUpdates(true)}>
              <Text style={styles.seeUpdatesText}>{tx('See all updates')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.promiseTitle, { color: theme.textPrimary }]}>{tx("SRV's promise")}</Text>
          <View style={[styles.promiseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AppIcon name="redeem" size={22} color={C.teal} />
            <View>
              <Text style={[styles.promiseMain, { color: theme.textPrimary }]}>{tx('Easy Returns')}</Text>
              <Text style={[styles.promiseSub, { color: theme.textMuted }]}>{tx('Available after delivery')}</Text>
            </View>
          </View>

          <Text style={[styles.promiseTitle, { color: theme.textPrimary }]}>{tx('Rate your experience')}</Text>
          <View style={[styles.promiseCard, { backgroundColor: theme.soft, borderColor: theme.border }]}>
            <AppIcon name="help" size={22} color={theme.textMuted} />
            <Text style={[styles.promiseMain, { color: theme.textPrimary, flex: 1 }]}>{tx('Did you find this page helpful?')}</Text>
            <AppIcon name="chevronRight" size={16} color={theme.textMuted} />
          </View>
        </ScrollView>
      </View>
    );
  }

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
              {loadError ? tx(loadError) : pageContent.emptyStateTitle || tx('No product orders found yet.')}
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const statusColors = getOrderStatusColors(order.status, order.paymentStatus);
            const orderImage = getOrderImage(order, giftImageByName);
            const expectedDeliveryAt = getExpectedDeliveryDate(order);
            const showExpectedDelivery = !['delivered', 'rejected', 'cancelled'].includes(String(order.status).toLowerCase());

            return (
              <TouchableOpacity
                key={order.id}
                activeOpacity={0.9}
                onPress={() => {
                  setSelectedOrder(order);
                  setShowAllUpdates(false);
                }}
                style={[
                  styles.orderCard,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <View style={styles.orderHead}>
                  <View style={[styles.orderImageWrap, { backgroundColor: order.type === 'product' ? '#DBEAFE' : C.purpleLight }]}>
                    {orderImage ? (
                      <Image source={{ uri: orderImage }} style={styles.orderImage} resizeMode="contain" />
                    ) : (
                      <AppIcon name={order.type === 'product' ? 'order' : 'redeem'} size={20} color={order.type === 'product' ? '#1D4ED8' : C.purple} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.orderTitle, { color: theme.textPrimary }]}>
                      {order.title || tx('Reward redemption')}
                    </Text>
                    <Text style={[styles.orderType, { color: order.type === 'product' ? '#1D4ED8' : C.purple }]}>
                      {order.type === 'product' ? `${tx('Product')} | ${tx('Qty')}: ${order.quantity}` : tx('Gift')}
                    </Text>
                    <Text style={[styles.orderMeta, { color: theme.textMuted }]}>{order.id}</Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: statusColors.background }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>{toStatusLabel(order.status, order.type)}</Text>
                  </View>
                </View>

                <View style={[styles.detailStrip, { backgroundColor: theme.soft }]}>
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                    {formatDate(order.deliveredAt ?? order.createdAt)}
                  </Text>
                  <Text style={[styles.dot, { color: theme.textMuted }]}>|</Text>
                  <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                    {getOrderAmountLabel(order)}
                  </Text>
                </View>

                {showExpectedDelivery && (
                  <View style={[styles.expectedBox, { backgroundColor: '#ECFDF5', borderColor: '#BBF7D0' }]}>
                    <Text style={styles.expectedLabel}>{tx('Expected Delivery')}</Text>
                    <Text style={styles.expectedValue}>{formatDate(expectedDeliveryAt)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  detailContent: { padding: 18, gap: 18, paddingBottom: 36 },
  timelineContent: { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 48 },
  timelineRow: { flexDirection: 'row', minHeight: 118 },
  timelineRail: { width: 36, alignItems: 'center' },
  timelineDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  timelineLine: { width: 2, flex: 1, marginTop: 3 },
  timelineCopy: { flex: 1, paddingBottom: 24 },
  timelineTitle: { fontSize: 18, fontWeight: '800', lineHeight: 25 },
  timelineText: { fontSize: 15, lineHeight: 23, marginTop: 8 },
  detailProductRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  detailImageWrap: {
    width: 82,
    height: 82,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  detailImage: { width: '100%', height: '100%' },
  detailProductTitle: { fontSize: 17, fontWeight: '800', lineHeight: 23 },
  detailProductMeta: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  detailOrderId: { fontSize: 14, fontWeight: '700' },
  progressCard: { borderRadius: 22, borderWidth: 1, padding: 18, gap: 16 },
  progressTitle: { fontSize: 22, fontWeight: '900' },
  progressSubtitle: { fontSize: 15, fontWeight: '600', lineHeight: 21 },
  progressTrack: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 8 },
  progressStep: { width: 86, alignItems: 'center', gap: 8 },
  progressDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  progressCheck: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', lineHeight: 16 },
  progressLabel: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  progressDate: { fontSize: 11, fontWeight: '700', textAlign: 'center' },
  progressConnector: { height: 2, flex: 1, marginTop: 11 },
  infoBox: { borderRadius: 14, padding: 14 },
  infoText: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  seeUpdatesButton: { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 14, alignItems: 'center' },
  seeUpdatesText: { color: '#1D4ED8', fontSize: 16, fontWeight: '900' },
  promiseTitle: { fontSize: 21, fontWeight: '900', marginTop: 4 },
  promiseCard: { borderRadius: 18, borderWidth: 1, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  promiseMain: { fontSize: 16, fontWeight: '900' },
  promiseSub: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1, borderRadius: 22, borderWidth: 1, padding: 16 },
  summaryLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryValue: { fontSize: 26, fontWeight: '900', marginTop: 6 },
  orderCard: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 14 },
  orderHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  orderImageWrap: {
    width: 58,
    height: 58,
    borderRadius: 15,
    backgroundColor: C.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 5,
  },
  orderImage: { width: '100%', height: '100%' },
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
  emptyCard: {
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
