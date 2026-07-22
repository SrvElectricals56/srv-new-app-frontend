import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { ordersApi, type UserOrder } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAppPageContent } from '@/shared/hooks';
import { SrvLogoLoader } from '@/shared/components/SrvLogoLoader';
import { formatISTDate } from '@/shared/utils/dateIST';
import { resolveImageUrl } from '@/shared/api/config';

// Keep the screen responsive while giving the branded loader enough time to be seen.
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
  if (normalized === 'out_for_delivery') return 'Shipped';
  if (!normalized) return 'Pending';
  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function getDisplayStatusLabel(order: UserOrder) {
  const status = String(order.status ?? '').trim().toLowerCase();
  const refundStatus = String(order.refundStatus ?? '').trim().toLowerCase();
  if (status === 'refunded') return 'Refund Done';
  if (refundStatus === 'requested') {
    return 'Refund Requested';
  }
  return toStatusLabel(order.status, order.type);
}

function isClosedStatus(status?: string) {
  const normalized = String(status ?? '').trim().toLowerCase();
  return ['completed', 'delivered', 'rejected', 'cancelled', 'returned', 'refunded'].includes(normalized);
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

function getNormalizedPaymentStatus(order: UserOrder) {
  return String(order.paymentStatus ?? '').trim().toLowerCase();
}

function isOnlinePaymentOrder(order: UserOrder) {
  const method = String(order.paymentMethod ?? '').trim().toLowerCase();
  return method !== '' && method !== 'cod' && method !== 'cash_on_delivery';
}

function isPaymentDone(order: UserOrder) {
  return ['paid', 'completed', 'success', 'successful'].includes(getNormalizedPaymentStatus(order));
}

function isPaymentFailed(order: UserOrder) {
  return ['failed', 'failure', 'cancelled', 'canceled'].includes(getNormalizedPaymentStatus(order));
}

type OrderAction = 'cancel' | 'return' | 'refund';

function getOrderActionConfig(action: OrderAction) {
  if (action === 'cancel') {
    return {
      title: 'Cancel Order',
      label: 'Cancel',
      question: 'Do you really want to cancel your order?',
      reason: 'Cancelled from app within 24 hours',
      accent: '#DC2626',
      soft: '#FEE2E2',
      status: 'cancelled',
    };
  }
  if (action === 'return') {
    return {
      title: 'Return Order',
      label: 'Return',
      question: 'Do you really want to return your order?',
      reason: 'Return requested from app within 24 hours',
      accent: '#2563EB',
      soft: '#DBEAFE',
      status: 'returned',
    };
  }
  return {
    title: 'Initiate Refund',
    label: 'Refund',
    question: 'Do you want to initiate your refund? It will be processed within 4 to 5 working days.',
    reason: 'Refund initiated from app',
    accent: '#059669',
    soft: '#D1FAE5',
    status: 'refunded',
  };
}

function getOrderActionAvailability(order: UserOrder, action: OrderAction) {
  const flag = action === 'cancel' ? order.canCancel : action === 'return' ? order.canReturn : order.canRefund;
  // The API is the source of truth: it also checks the 24-hour window. Do not
  // re-enable an action locally when the API has explicitly marked it unavailable.
  if (typeof flag === 'boolean') return flag;
  const status = String(order.status ?? '').toLowerCase();
  if (action === 'cancel') return ['pending', 'approved'].includes(status);
  if (action === 'return') return status === 'delivered';
  return isPaymentDone(order) && ['cancelled', 'returned'].includes(status);
}

function getOrderActionUnavailableMessage(action: OrderAction) {
  if (action === 'cancel') return 'Cancellation is available only for active orders within the allowed time.';
  if (action === 'return') return 'Return is available only after the order is delivered.';
  return 'Refund can be initiated only for a paid cancelled or returned order.';
}

function getStatusActionDate(order: UserOrder) {
  return order.rejectedAt ?? order.updatedAt ?? order.deliveredAt ?? order.createdAt;
}

function getStoppedMessage(order: UserOrder) {
  const status = String(order.status ?? '').toLowerCase();
  const date = formatDate(getStatusActionDate(order));
  if (status === 'cancelled') return `Your order has been cancelled on ${date}.`;
  if (status === 'returned') return `Your return request was placed on ${date}.`;
  if (status === 'refunded') return 'Refund done. Your payment has been refunded successfully.';
  return `Your order has been rejected on ${date}.`;
}

function getCustomerActionMessage(order: UserOrder) {
  if (String(order.refundStatus ?? '').toLowerCase() === 'requested') {
    return 'Your refund is in process. Please wait 4 to 5 working days for the amount to be credited.';
  }
  if (String(order.status ?? '').trim().toLowerCase() === 'cancelled') {
    return 'Cancellation requested. Refund is pending.';
  }
  return order.refundMessage || order.deliveryNotes || '';
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
  const refundRequested = String(order.refundStatus ?? '').toLowerCase() === 'requested';
  const rejected = ['rejected', 'cancelled', 'returned', 'refunded'].includes(status);
  const orderedAt = order.orderedAt ?? order.createdAt;
  const shippedAt = order.dispatchedAt ?? addDays(orderedAt, 3);
  const deliveryAt = order.deliveredAt ?? getExpectedDeliveryDate(order);
  const shipped = ['shipped', 'out_for_delivery', 'delivered'].includes(status);
  const delivered = Boolean(order.deliveredAt) || status === 'delivered';

  if (refundRequested || rejected) {
    return [
      {
        label: refundRequested ? 'Refund Requested' : status === 'cancelled' ? 'Order Cancelled' : status === 'returned' ? 'Return Requested' : status === 'refunded' ? 'Refund Done' : 'Order Rejected',
        value: `${getStoppedMessage(order)}\n${order.rejectionReason ? `Reason: ${order.rejectionReason}` : ''}\n${getCustomerActionMessage(order)}`,
        done: true,
      },
    ];
  }

  const steps = [
    {
      label: 'Order Confirmed',
      value: `Your Order has been placed.\n${formatDate(orderedAt)}\nSeller is processing your order.\nItem waiting to be picked up by delivery partner.\n${formatDate(addDays(orderedAt, 2))}`,
      done: true,
    },
    ...(isOnlinePaymentOrder(order)
      ? [{
          label: isPaymentFailed(order) ? 'Payment Failed' : 'Payment Done',
          value: isPaymentFailed(order)
            ? `Payment failed.\n${formatDate(order.updatedAt ?? order.createdAt)}`
            : isPaymentDone(order)
              ? `Payment completed.\n${formatDate(order.paidAt ?? order.updatedAt ?? order.createdAt)}`
              : `Payment is pending.\n${formatDate(order.createdAt)}`,
          done: isPaymentDone(order),
          failed: isPaymentFailed(order),
        }]
      : []),
    {
      label: `Shipped Expected By ${formatDate(shippedAt)}`,
      value: shipped ? `Item shipped.\n${formatDate(shippedAt)}` : `Item yet to be shipped.\nExpected by ${formatDate(shippedAt)}`,
      done: shipped,
    },
    {
      label: `Delivery Expected By ${formatDate(deliveryAt)}`,
      value: delivered ? `Item delivered.\n${formatDate(deliveryAt)}` : `Item yet to be delivered.\nExpected by ${formatDate(deliveryAt)}`,
      done: delivered,
    },
  ];

  return steps;
}

function getOrderProgress(order: UserOrder) {
  const status = String(order.status ?? '').toLowerCase();
  const stopped = ['rejected', 'cancelled', 'returned', 'refunded'].includes(status);
  const shipped = ['shipped', 'out_for_delivery', 'delivered'].includes(status);
  const delivered = Boolean(order.deliveredAt) || status === 'delivered';
  const expectedDeliveryAt = getExpectedDeliveryDate(order);
  if (stopped) {
    return [
      {
        label: getDisplayStatusLabel(order),
        value: formatDate(getStatusActionDate(order)),
        done: true,
      },
    ];
  }
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
      label: 'Delivered',
      value: delivered ? formatDate(order.deliveredAt) : formatDate(expectedDeliveryAt),
      done: delivered,
    },
  ];
}

function getOrderProgressSubtitle(order: UserOrder) {
  const status = String(order.status ?? '').toLowerCase();
  if (String(order.refundStatus ?? '').toLowerCase() === 'requested') {
    return 'Your refund is in process. Please wait 4 to 5 working days for the amount to be credited.';
  }
  if (['rejected', 'cancelled', 'returned', 'refunded'].includes(status)) {
    return getStoppedMessage(order);
  }
  if (Boolean(order.deliveredAt) || status === 'delivered') return 'Your order has been delivered.';
  if (['shipped', 'out_for_delivery'].includes(status)) return 'Your order has been shipped.';
  return 'Your order has been placed.';
}

function normalizeOrder(order: UserOrder): UserOrder {
  return {
    ...order,
    quantity: safeNumber(order.quantity) || 1,
    price: safeNumber(order.price),
    total: safeNumber(order.total),
    points: safeNumber(order.points ?? order.total),
  };
}

// Keep the most recent response in memory for the current signed-in user. This
// makes returning to My Orders instantaneous while a fresh response is fetched
// in the background. It deliberately is not persisted, so logging out never
// exposes one account's order history to another account.
const ordersMemoryCache = new Map<string, UserOrder[]>();

export function MyOrdersPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role, user } = useAuth();
  const { giftProducts } = useAppData();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'my_orders');
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [hasLoadedOrders, setHasLoadedOrders] = useState(false);
  const [logoLoading, setLogoLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [showAllUpdates, setShowAllUpdates] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'closed'>('all');
  const [reloadKey, setReloadKey] = useState(0);
  const [actionSubmitting, setActionSubmitting] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<OrderAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [requestReason, setRequestReason] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [visibleOrderCount, setVisibleOrderCount] = useState(8);
  const ordersRequestInFlightRef = useRef(false);

  const cacheKey = `${role ?? 'guest'}:${user?.id ?? 'anonymous'}`;

  const loadOrders = useCallback(async (options: { keepCurrent?: boolean } = {}) => {
    if (ordersRequestInFlightRef.current) return;
    ordersRequestInFlightRef.current = true;
    setLoadError(null);
    try {
      const data = await withTimeout(ordersApi.getAll());
      const normalizedOrders = Array.isArray(data) ? data.map(normalizeOrder) : [];
      ordersMemoryCache.set(cacheKey, normalizedOrders);
      setOrders(normalizedOrders);
    } catch (error) {
      console.warn('Unable to load orders.', error);
      if (!options.keepCurrent) setOrders([]);
      setLoadError('Unable to load orders. Please try again later.');
    } finally {
      ordersRequestInFlightRef.current = false;
      setHasLoadedOrders(true);
    }
  }, [cacheKey]);

  useEffect(() => {
    const cachedOrders = ordersMemoryCache.get(cacheKey);
    if (cachedOrders) {
      setOrders(cachedOrders);
      setHasLoadedOrders(true);
      setLogoLoading(false);
      void loadOrders({ keepCurrent: true });
    } else {
      setLogoLoading(true);
      void loadOrders().finally(() => setLogoLoading(false));
    }

    // Keep the order screen in sync with admin actions without requiring the
    // customer to leave the screen or pull to refresh.
    const syncTimer = setInterval(() => void loadOrders({ keepCurrent: true }), 1000);
    return () => clearInterval(syncTimer);
  }, [cacheKey, loadOrders, reloadKey]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setLogoLoading(true);
    try {
      await loadOrders({ keepCurrent: true });
    } finally {
      setLogoLoading(false);
      setRefreshing(false);
    }
  }, [loadOrders]);

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

  const displayedOrders = useMemo(() => {
    if (orderFilter === 'active') return activeOrders;
    if (orderFilter === 'closed') return orders.filter((order) => isClosedStatus(order.status));
    return orders;
  }, [activeOrders, orderFilter, orders]);

  useEffect(() => {
    // Render the first cards immediately and defer older cards until requested.
    // This keeps navigation responsive even for customers with a large history.
    setVisibleOrderCount(8);
  }, [orderFilter, orders]);

  const giftImageByName = useMemo(() => {
    const map = new Map<string, string | null>();
    giftProducts.forEach((gift) => {
      map.set(normalizeName(gift.name), resolveImageUrl(gift.imageUrl ?? (gift as any).image ?? null));
    });
    return map;
  }, [giftProducts]);

  const executeOrderAction = async (action: OrderAction) => {
    if (!selectedOrder || selectedOrder.type !== 'product') return;
    const orderSnapshot = selectedOrder;
    const config = getOrderActionConfig(action);
    const reason = requestReason.trim();
    if (reason.length < 3) {
      setActionError('Please tell us the reason for this request.');
      return;
    }
    setActionSubmitting(action);
    setActionError(null);
    try {
      if (action === 'cancel') await ordersApi.cancel(orderSnapshot.id, reason);
      if (action === 'return') await ordersApi.returnOrder(orderSnapshot.id, reason);
      if (action === 'refund') await ordersApi.refund(orderSnapshot.id, reason);
      const actionDate = new Date().toISOString();
      const nextStatus = action === 'refund' ? orderSnapshot.status : config.status;
      const refundPending = action === 'cancel' && isOnlinePaymentOrder(orderSnapshot) && isPaymentDone(orderSnapshot);
      const actionMessage =
        action === 'cancel'
          ? 'Cancellation requested. Refund will be processed within 4 to 5 working days.'
          : action === 'return'
            ? `Your return request was placed on ${formatDate(actionDate)}.`
            : 'Your refund is in process. Please wait 4 to 5 working days for the amount to be credited.';
      setSelectedOrder((current) =>
        current && current.id === orderSnapshot.id
          ? {
              ...current,
              status: nextStatus,
              updatedAt: actionDate,
              refundStatus: action === 'refund' ? 'requested' : refundPending ? 'pending' : current.refundStatus,
              refundMessage: actionMessage,
              deliveryNotes: `${action === 'cancel' ? 'Cancelled' : action === 'return' ? 'Return requested' : 'Refund initiated'} by user: ${reason}`,
              canCancel: false,
              canReturn: false,
              canRefund: false,
            }
          : current,
      );
      setConfirmAction(null);
      setRequestReason('');
      setShowAllUpdates(true);
      setReloadKey((value) => value + 1);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : tx('Please try again later.'));
    } finally {
      setActionSubmitting(null);
    }
  };

  const handleOrderAction = (action: OrderAction) => {
    setActionError(null);
    setRequestReason('');
    setConfirmAction(action);
  };

  if (selectedOrder && showAllUpdates) {
    const trackingSteps = getTrackingSteps(selectedOrder);
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <PageHeader title={tx('Order Updates')} onBack={() => setShowAllUpdates(false)} />
        <ScrollView contentContainerStyle={styles.timelineContent} showsVerticalScrollIndicator={false}>
          {trackingSteps.map((step, index) => {
            const isLast = index === trackingSteps.length - 1;
            const isFailed = Boolean(step.failed);
            const dotColor = isFailed ? '#DC2626' : step.done ? '#16A34A' : '#FFFFFF';
            const dotBorderColor = isFailed ? '#DC2626' : step.done ? '#16A34A' : '#D1D5DB';
            const textColor = isFailed ? '#B91C1C' : step.done ? theme.textPrimary : theme.textMuted;
            return (
              <View key={`${step.label}-${index}`} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineDot, { backgroundColor: dotColor, borderColor: dotBorderColor }]} />
                  {!isLast ? <View style={[styles.timelineLine, { backgroundColor: '#E5E7EB' }]} /> : null}
                </View>
                <View style={styles.timelineCopy}>
                  <Text style={[styles.timelineTitle, { color: textColor }]}>
                    {tx(step.label)} {index === 0 ? formatDate(selectedOrder.orderedAt ?? selectedOrder.createdAt) : ''}
                  </Text>
                  <Text style={[styles.timelineText, { color: textColor }]}>
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
    const status = String(selectedOrder.status ?? '').toLowerCase();
    const isStopped = ['rejected', 'cancelled', 'returned', 'refunded'].includes(status);
    const isRefundInProgress = String(selectedOrder.refundStatus ?? '').toLowerCase() === 'requested';
    const activeActionConfig = confirmAction ? getOrderActionConfig(confirmAction) : null;
    const activeActionAvailable = Boolean(
      selectedOrder.type === 'product' &&
      confirmAction &&
      getOrderActionAvailability(selectedOrder, confirmAction),
    );
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

          <Text style={[styles.detailOrderId, { color: theme.textMuted }]}>Order {selectedOrder.orderCode ?? selectedOrder.id}</Text>

          <View style={[styles.progressCard, { borderColor: '#1D4ED8', backgroundColor: theme.surface }]}>
            <Text style={[styles.progressTitle, { color: theme.textPrimary }]}>
              {tx(getDisplayStatusLabel(selectedOrder))}
            </Text>
            <Text style={[styles.progressSubtitle, { color: theme.textSecondary }]}>
              {tx(getOrderProgressSubtitle(selectedOrder))}
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
                {isStopped || isRefundInProgress
                  ? `${selectedOrder.rejectionReason ? `${tx('Reason')}: ${selectedOrder.rejectionReason}\n` : ''}${getCustomerActionMessage(selectedOrder)}`
                  : selectedOrder.courierName || selectedOrder.trackingNumber
                  ? [
                      selectedOrder.courierName ? `${tx('Courier Partner')}: ${selectedOrder.courierName}` : '',
                      selectedOrder.trackingNumber ? `${tx('Tracking ID')}: ${selectedOrder.trackingNumber}` : '',
                    ].filter(Boolean).join('\n')
                  : tx('Delivery Executive details will be available once the order is out for delivery')}
              </Text>
            </View>
            <TouchableOpacity style={styles.seeUpdatesButton} activeOpacity={0.8} onPress={() => setShowAllUpdates(true)}>
              <Text style={styles.seeUpdatesText}>{tx('See all updates')}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.promiseTitle, { color: theme.textPrimary }]}>{tx("SRV's promises")}</Text>
          <View style={[styles.promiseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <AppIcon name="redeem" size={22} color={C.teal} />
            <View style={{ flex: 1, gap: 10 }}>
              <Text style={[styles.promiseMain, { color: theme.textPrimary }]}>{tx('Return, refund or cancel within 24 hours')}</Text>
              <View style={styles.actionRow}>
                {(['cancel', 'return', 'refund'] as OrderAction[]).map((action) => {
                  const config = getOrderActionConfig(action);
                  const available = selectedOrder.type === 'product' && getOrderActionAvailability(selectedOrder, action);
                  return (
                    <TouchableOpacity
                      key={action}
                      disabled={actionSubmitting !== null || !available}
                      activeOpacity={0.86}
                      onPress={() => handleOrderAction(action)}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: available ? config.soft : theme.soft,
                          borderColor: available ? config.accent : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.actionText, { color: available ? config.accent : theme.textSecondary }]}>
                        {actionSubmitting === action ? tx('Sending') : tx(config.label)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
        <Modal transparent visible={confirmAction !== null} animationType="fade" onRequestClose={() => setConfirmAction(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.confirmCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.confirmIcon, { backgroundColor: activeActionConfig?.soft ?? theme.soft }]}>
                <AppIcon name="order" size={24} color={activeActionConfig?.accent ?? C.primary} />
              </View>
              <Text style={[styles.confirmTitle, { color: theme.textPrimary }]}>{tx(activeActionConfig?.title ?? 'Confirm')}</Text>
              <Text style={[styles.confirmText, { color: theme.textSecondary }]}>
                {tx(activeActionConfig?.question ?? 'Do you want to continue?')}
              </Text>
              {activeActionAvailable ? (
                <View style={styles.reasonInputWrap}>
                  <Text style={[styles.reasonLabel, { color: theme.textPrimary }]}>{tx('Reason for request')}</Text>
                  <TextInput
                    value={requestReason}
                    onChangeText={setRequestReason}
                    placeholder={tx('Tell us why you want to cancel, return or refund')}
                    placeholderTextColor={theme.textMuted}
                    multiline
                    maxLength={300}
                    style={[styles.reasonInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.soft }]}
                  />
                  <Text style={[styles.reasonHint, { color: theme.textMuted }]}>{tx('This reason is shared with the order support team.')}</Text>
                </View>
              ) : null}
              {!activeActionAvailable ? (
                <View style={[styles.confirmNotice, { backgroundColor: theme.soft, borderColor: theme.border }]}>
                  <Text style={[styles.confirmNoticeText, { color: theme.textSecondary }]}>
                    {tx(confirmAction ? getOrderActionUnavailableMessage(confirmAction) : 'This action is not available.')}
                  </Text>
                </View>
              ) : null}
              {actionError ? (
                <View style={[styles.confirmNotice, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                  <Text style={[styles.confirmNoticeText, { color: '#B91C1C' }]}>{tx(actionError)}</Text>
                </View>
              ) : null}
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  activeOpacity={0.86}
                  onPress={() => {
                    if (actionSubmitting === null) {
                      setConfirmAction(null);
                      setActionError(null);
                      setRequestReason('');
                    }
                  }}
                  style={[styles.confirmButton, styles.confirmSecondary, { borderColor: theme.border }]}
                >
                  <Text style={[styles.confirmSecondaryText, { color: theme.textPrimary }]}>{tx(activeActionAvailable ? 'No' : 'Close')}</Text>
                </TouchableOpacity>
                {activeActionAvailable ? (
                  <TouchableOpacity
                    activeOpacity={0.86}
                    disabled={actionSubmitting !== null}
                    onPress={() => confirmAction && void executeOrderAction(confirmAction)}
                    style={[
                      styles.confirmButton,
                      { backgroundColor: activeActionConfig?.accent ?? C.primary, opacity: actionSubmitting !== null ? 0.72 : 1 },
                    ]}
                  >
                    <Text style={styles.confirmPrimaryText}>{tx(actionSubmitting ? 'Sending' : 'Yes')}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('myOrders')} onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
          />
        }
      >
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
              {String(activeOrders.length).padStart(2, '0')}
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
              {formatDate(lastDeliveredOrder?.deliveredAt ?? lastDeliveredOrder?.createdAt).slice(0, 6)}
            </Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {[
            ['all', 'All'],
            ['active', 'Active'],
            ['closed', 'Closed'],
          ].map(([id, label]) => (
            <TouchableOpacity
              key={id}
              activeOpacity={0.85}
              onPress={() => setOrderFilter(id as any)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: orderFilter === id ? C.primary : theme.surface,
                  borderColor: orderFilter === id ? C.primary : theme.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: orderFilter === id ? '#FFFFFF' : theme.textSecondary }]}>{tx(label)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {orders.length === 0 && hasLoadedOrders ? (
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
        ) : displayedOrders.length === 0 && hasLoadedOrders ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {tx('No orders found for this filter.')}
            </Text>
          </View>
        ) : (
          displayedOrders.slice(0, visibleOrderCount).map((order) => {
            const statusColors = getOrderStatusColors(order.status, order.paymentStatus);
            const orderImage = getOrderImage(order, giftImageByName);
            const expectedDeliveryAt = getExpectedDeliveryDate(order);
            const showExpectedDelivery = !['delivered', 'rejected', 'cancelled', 'returned', 'refunded'].includes(String(order.status).toLowerCase());

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
                    <Text style={[styles.orderMeta, { color: theme.textMuted }]}>{order.orderCode ?? order.id}</Text>
                  </View>
                  <View style={[styles.statusChip, { backgroundColor: statusColors.background }]}>
                    <Text style={[styles.statusText, { color: statusColors.text }]}>{getDisplayStatusLabel(order)}</Text>
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
        {displayedOrders.length > visibleOrderCount ? (
          <TouchableOpacity
            activeOpacity={0.86}
            onPress={() => setVisibleOrderCount((count) => count + 8)}
            style={[styles.loadMoreButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={styles.loadMoreText}>{tx('Load more orders')}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      <SrvLogoLoader visible={logoLoading} label={tx('Loading your orders...')} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  loadMoreButton: { minHeight: 46, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  loadMoreText: { color: C.primary, fontSize: 14, fontWeight: '900' },
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
  actionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionButton: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  actionText: { fontSize: 12, fontWeight: '900' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  confirmCard: { width: '100%', maxWidth: 360, borderRadius: 24, padding: 22, alignItems: 'center', gap: 12 },
  confirmIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  confirmTitle: { fontSize: 21, fontWeight: '900', textAlign: 'center' },
  confirmText: { fontSize: 15, fontWeight: '700', lineHeight: 22, textAlign: 'center' },
  reasonInputWrap: { width: '100%', gap: 6, marginTop: 2 },
  reasonLabel: { fontSize: 12, fontWeight: '900' },
  reasonInput: { minHeight: 76, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, fontWeight: '600', textAlignVertical: 'top' },
  reasonHint: { fontSize: 11, fontWeight: '600', lineHeight: 16 },
  confirmNotice: { width: '100%', borderRadius: 14, borderWidth: 1, padding: 12 },
  confirmNoticeText: { fontSize: 13, fontWeight: '700', lineHeight: 19, textAlign: 'center' },
  confirmActions: { width: '100%', flexDirection: 'row', gap: 10, marginTop: 4 },
  confirmButton: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  confirmSecondary: { borderWidth: 1, backgroundColor: 'transparent' },
  confirmSecondaryText: { fontSize: 14, fontWeight: '900' },
  confirmPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  filterRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  filterChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  filterText: { fontSize: 12, fontWeight: '900' },
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
