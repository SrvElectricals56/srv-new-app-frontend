import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { Dialog } from '@/shared/components/Dialog';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferenceContext } from '@/shared/preferences';
import { useAuth } from '@/shared/context/AuthContext';
import { catalogApi } from '@/shared/api';

type CheckoutRole = 'electrician' | 'dealer' | 'customer' | 'counterboy';
type PaymentMethod = 'online' | 'cod';

const ROLE_THEMES: Record<CheckoutRole, {
  primary: string; primaryDark: string; primarySoft: string;
  bg: string; bgDark: string;
  card: string; cardDark: string;
  border: string; borderDark: string;
  text: string; textDark: string;
  muted: string; mutedDark: string;
  gradient: [string, string];
  gradientDark: [string, string];
}> = {
  electrician: {
    primary: '#173E80', primaryDark: '#355C95', primarySoft: '#EAF3FF',
    bg: '#F2F3F7', bgDark: '#0F172A',
    card: '#FFFFFF', cardDark: '#172033',
    border: '#E5E7EB', borderDark: '#25344E',
    text: '#1C1E2E', textDark: '#F8FAFC',
    muted: '#6B7280', mutedDark: '#A8B3C7',
    gradient: ['#173E80', '#355C95'],
    gradientDark: ['#173E80', '#1D4ED8'],
  },
  dealer: {
    primary: '#173E80', primaryDark: '#355C95', primarySoft: '#EAF3FF',
    bg: '#F4F8FF', bgDark: '#0F172A',
    card: '#FFFFFF', cardDark: '#172033',
    border: '#E5E7EB', borderDark: '#2B3A52',
    text: '#1F2937', textDark: '#F8FAFC',
    muted: '#6B7280', mutedDark: '#9FB0C4',
    gradient: ['#173E80', '#355C95'],
    gradientDark: ['#173E80', '#1D4ED8'],
  },
  customer: {
    primary: '#6A2F12', primaryDark: '#8D4A1E', primarySoft: '#FBF1E7',
    bg: '#F2F3F7', bgDark: '#0F172A',
    card: '#FFFFFF', cardDark: '#162132',
    border: '#E5D4C1', borderDark: '#2B3A52',
    text: '#1F2937', textDark: '#F8FAFC',
    muted: '#6B7280', mutedDark: '#9FB0C4',
    gradient: ['#6A2F12', '#8D4A1E'],
    gradientDark: ['#8D4A1E', '#6A2F12'],
  },
  counterboy: {
    primary: '#8B3C2A', primaryDark: '#6B2D1D', primarySoft: '#F5EDE4',
    bg: '#F9F4ED', bgDark: '#0F172A',
    card: '#FFFFFF', cardDark: '#1A0F0A',
    border: '#E0D0C0', borderDark: '#2B3A52',
    text: '#2D1A10', textDark: '#F8FAFC',
    muted: '#8A7A6E', mutedDark: '#9FB0C4',
    gradient: ['#8B3C2A', '#6B2D1D'],
    gradientDark: ['#6B2D1D', '#5C3D2E'],
  },
};

export type CheckoutItem = {
  id: string;
  name: string;
  desc: string;
  image: { uri: string } | null;
  price: number;
  qty: number;
};

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PaymentChoiceIcon({ color, selected }: { color: string; selected: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" fill={selected ? color : 'transparent'} stroke={color} strokeWidth={1.8} />
      {selected && <Path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
    </Svg>
  );
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export function CheckoutScreen({
  item,
  role = 'customer',
  onBack,
  onOrderPlaced,
  onUpdateQty,
}: {
  item: CheckoutItem;
  role?: CheckoutRole;
  onBack: () => void;
  onOrderPlaced: () => void;
  onUpdateQty?: (id: string, qty: number) => void;
}) {
  const { darkMode, tx } = usePreferenceContext();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const theme = ROLE_THEMES[role] ?? ROLE_THEMES.customer;

  const [address, setAddress] = useState((user as any)?.address ?? '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [placing, setPlacing] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; confirmLabel?: string; onConfirm?: () => void; icon?: string; completeOnClose?: boolean }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => {
    const shouldCompleteOrder = dialog.completeOnClose;
    setDialog((d) => ({ ...d, visible: false, completeOnClose: false }));
    if (shouldCompleteOrder) {
      onOrderPlaced();
    }
  };

  const bg = darkMode ? theme.bgDark : theme.bg;
  const card = darkMode ? theme.cardDark : theme.card;
  const border = darkMode ? theme.borderDark : theme.border;
  const textPrimary = darkMode ? theme.textDark : theme.text;
  const textMuted = darkMode ? theme.mutedDark : theme.muted;
  const inputBg = darkMode ? theme.borderDark : '#F8F9FA';
  const gradient = darkMode ? theme.gradientDark : theme.gradient;

  const totalPrice = item.price * item.qty;

  const handlePlaceOrder = useCallback(async () => {
    if (!address.trim()) {
      setDialog({ visible: true, variant: 'info', title: tx('Address required'), message: tx('Please enter your shipping address.') });
      return;
    }
    setPlacing(true);
    try {
      if (paymentMethod === 'cod') {
        await catalogApi.buyNow({
          productId: item.id,
          quantity: item.qty,
          shippingAddress: address.trim(),
        });
        setDialog({
          visible: true,
          variant: 'success',
          title: tx('Order Confirmed'),
          message: tx('Your order has been placed successfully with Cash on Delivery. You can track it from My Orders.'),
          completeOnClose: true,
        });
        return;
      }

      if (Platform.OS === 'web') {
        throw new Error(tx('Online payment is available in the Android app.'));
      }

      const paymentOrder = await catalogApi.createRazorpayOrder({
        productId: item.id,
        quantity: item.qty,
        shippingAddress: address.trim(),
      });

      let paymentResponse;
      try {
        const { default: RazorpayCheckout } = await import('react-native-razorpay');
        const checkoutOptions = {
          key: paymentOrder.keyId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: paymentOrder.businessName,
          description: paymentOrder.description,
          order_id: paymentOrder.razorpayOrderId,
          prefill: paymentOrder.prefill,
          method: 'upi',
          retry: { enabled: true, max_count: 3 },
          theme: { color: theme.primary },
        };
        // Razorpay supports `method`, but v3's bundled TypeScript definition omits it.
        paymentResponse = await RazorpayCheckout.open(checkoutOptions as any);
      } catch (paymentError: any) {
        await catalogApi.recordRazorpayFailure({
          productOrderId: paymentOrder.productOrderId,
          reason: paymentError?.description || paymentError?.message || 'Payment cancelled',
        }).catch(() => undefined);
        throw paymentError;
      }

      await catalogApi.verifyRazorpayPayment({
        productOrderId: paymentOrder.productOrderId,
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });
      setDialog({
        visible: true,
        variant: 'success',
        title: tx('Order Confirmed'),
        message: tx('Payment received. Your order has been confirmed and is ready for processing.'),
        completeOnClose: true,
      });
    } catch (error: any) {
      setDialog({
        visible: true,
        variant: 'error',
        title: tx('Payment failed'),
        message: error?.description || error?.message || tx('Please try again.'),
      });
    } finally {
      setPlacing(false);
    }
  }, [item, address, paymentMethod, theme.primary, tx]);

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <View style={[styles.header, { backgroundColor: card, borderBottomColor: border }]}>
        <TouchableOpacity onPress={onBack} style={styles.headerBack} activeOpacity={0.74}>
          <BackIcon color={theme.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textPrimary }]}>{tx('Checkout')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 180 }}
      >
        <View style={[styles.productCard, { backgroundColor: card, borderColor: border }]}>
          <View style={styles.productImageWrap}>
            {item.image ? (
              <Image source={item.image} style={styles.productImage} resizeMode="contain" />
            ) : (
              <View style={[styles.productImagePlaceholder, { backgroundColor: theme.primarySoft }]}>
                <Text style={{ color: theme.primaryDark, fontSize: 12 }}>{truncate(item.name, 2)}</Text>
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: textPrimary }]} numberOfLines={2}>{item.name}</Text>
            <Text style={[styles.productDesc, { color: textMuted }]} numberOfLines={1}>{item.desc}</Text>
            <View style={styles.productPriceRow}>
              <Text style={[styles.productPrice, { color: textPrimary }]}>₹{item.price.toLocaleString('en-IN')}</Text>
              {onUpdateQty ? (
                <View style={[styles.checkoutQtyPill, { backgroundColor: inputBg, borderColor: border }]}>
                  <Pressable
                    style={[styles.checkoutQtyBtn, { backgroundColor: theme.primaryDark }]}
                    onPress={() => item.qty > 1 && onUpdateQty(item.id, item.qty - 1)}
                  >
                    <Text style={styles.checkoutQtyBtnText}>−</Text>
                  </Pressable>
                  <Text style={[styles.checkoutQtyText, { color: textPrimary }]}>{item.qty}</Text>
                  <Pressable
                    style={[styles.checkoutQtyBtn, { backgroundColor: theme.primary }]}
                    onPress={() => onUpdateQty(item.id, item.qty + 1)}
                  >
                    <Text style={styles.checkoutQtyBtnText}>+</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={[styles.productQty, { color: textMuted }]}>Qty: {item.qty}</Text>
              )}
            </View>
            <Text style={[styles.productTotal, { color: theme.primary }]}>₹{totalPrice.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>{tx('Contact Info')}</Text>
          <View style={[styles.contactRow, { borderBottomColor: border }]}>
            <Text style={[styles.contactLabel, { color: textMuted }]}>{tx('Name')}</Text>
            <Text style={[styles.contactValue, { color: textPrimary }]}>{(user as any)?.name ?? '-'}</Text>
          </View>
          <View style={styles.contactRow}>
            <Text style={[styles.contactLabel, { color: textMuted }]}>{tx('Phone')}</Text>
            <Text style={[styles.contactValue, { color: textPrimary }]}>{(user as any)?.phone ?? '-'}</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>{tx('Shipping Address')}</Text>
          <TextInput
            style={[styles.addressInput, { backgroundColor: inputBg, color: textPrimary, borderColor: border }]}
            placeholder={tx('Enter your address')}
            placeholderTextColor={textMuted}
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.sectionCard, { backgroundColor: card, borderColor: border }]}>
          <Text style={[styles.sectionTitle, { color: textPrimary }]}>{tx('Payment Method')}</Text>
          <View style={styles.paymentList}>
            <TouchableOpacity activeOpacity={0.82} onPress={() => setPaymentMethod('online')}>
              <LinearGradient
                colors={[paymentMethod === 'online' ? theme.primarySoft : inputBg, paymentMethod === 'online' ? theme.primarySoft : inputBg]}
                style={[styles.paymentOption, { borderColor: paymentMethod === 'online' ? theme.primary : border }]}
              >
                <PaymentChoiceIcon color={theme.primary} selected={paymentMethod === 'online'} />
                <View style={styles.paymentCopy}>
                  <Text style={[styles.paymentText, { color: textPrimary }]}>{tx('Pay Online with Razorpay')}</Text>
                  <Text style={[styles.paymentHint, { color: textMuted }]}>{tx('UPI, cards, netbanking and wallets')}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.82} onPress={() => setPaymentMethod('cod')}>
              <LinearGradient
                colors={[paymentMethod === 'cod' ? theme.primarySoft : inputBg, paymentMethod === 'cod' ? theme.primarySoft : inputBg]}
                style={[styles.paymentOption, { borderColor: paymentMethod === 'cod' ? theme.primary : border }]}
              >
                <PaymentChoiceIcon color={theme.primary} selected={paymentMethod === 'cod'} />
                <View style={styles.paymentCopy}>
                  <Text style={[styles.paymentText, { color: textPrimary }]}>{tx('Cash on Delivery')}</Text>
                  <Text style={[styles.paymentHint, { color: textMuted }]}>{tx('Pay cash when your order is delivered')}</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: card, borderTopColor: border, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: textMuted }]}>{tx('Item Total')}</Text>
          <Text style={[styles.summaryValue, { color: textPrimary }]}>₹{totalPrice.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: textMuted }]}>{tx('Shipping')}</Text>
          <Text style={[styles.summaryValue, { color: '#059669' }]}>{tx('Free')}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: border }]} />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabelBold, { color: textPrimary }]}>{tx('Total')}</Text>
          <Text style={[styles.summaryTotal, { color: theme.primary }]}>₹{totalPrice.toLocaleString('en-IN')}</Text>
        </View>

        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={placing}
          activeOpacity={0.86}
          style={styles.placeOrderShell}
        >
          <LinearGradient colors={gradient} style={styles.placeOrderBtn}>
            {placing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.placeOrderText}>{paymentMethod === 'cod' ? tx('Place COD Order') : tx('Pay Securely')}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <Dialog
        visible={dialog.visible}
        variant={dialog.variant}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        icon={dialog.icon}
        onConfirm={dialog.onConfirm}
        onClose={closeDialog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBack: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },

  productCard: {
    flexDirection: 'row',
    margin: 14,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  productImageWrap: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  productDesc: { fontSize: 12, marginBottom: 6 },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productPrice: { fontSize: 14, fontWeight: '700' },
  productQty: { fontSize: 12 },
  productTotal: { fontSize: 16, fontWeight: '800' },
  checkoutQtyPill: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 10, overflow: 'hidden',
  },
  checkoutQtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  checkoutQtyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', lineHeight: 18 },
  checkoutQtyText: { fontSize: 14, fontWeight: '800', minWidth: 32, textAlign: 'center' },

  sectionCard: {
    margin: 14,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },

  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5D4C1',
  },
  contactLabel: { fontSize: 13 },
  contactValue: { fontSize: 13, fontWeight: '600' },

  addressInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },

  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 10,
  },
  paymentList: { gap: 10 },
  paymentCopy: { flex: 1 },
  paymentText: { fontSize: 14, fontWeight: '600' },
  paymentHint: { fontSize: 11, marginTop: 3 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 13 },
  summaryLabelBold: { fontSize: 15, fontWeight: '700' },
  summaryValue: { fontSize: 13 },
  summaryDivider: { height: 1, marginVertical: 6 },
  summaryTotal: { fontSize: 17, fontWeight: '800' },
  placeOrderShell: { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  placeOrderBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 14,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
