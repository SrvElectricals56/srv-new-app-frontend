import { useState, useCallback, useMemo } from 'react';
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
import { useAppData } from '@/shared/context/AppDataContext';
import { premium, premiumGradients, premiumShadow } from '@/shared/theme/premium';

type CheckoutRole = 'electrician' | 'dealer' | 'customer' | 'counterboy';
type PaymentMethod = 'online' | 'cod' | 'points';

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
    primary: '#173E80', primaryDark: '#102A63', primarySoft: '#E8F0FE',
    bg: premium.bg, bgDark: '#0F172A',
    card: '#FFFFFF', cardDark: '#172033',
    border: premium.line, borderDark: '#25344E',
    text: premium.ink, textDark: '#F8FAFC',
    muted: premium.muted, mutedDark: '#A8B3C7',
    gradient: ['#173E80', '#355C95'],
    gradientDark: ['#102A63', '#1D4ED8'],
  },
  dealer: {
    primary: premium.navy, primaryDark: premium.primaryDark, primarySoft: premium.navySoft,
    bg: '#F3F7FC', bgDark: '#0F172A',
    card: '#FFFFFF', cardDark: '#172033',
    border: premium.line, borderDark: '#2B3A52',
    text: premium.ink, textDark: '#F8FAFC',
    muted: premium.muted, mutedDark: '#9FB0C4',
    gradient: premiumGradients.navy,
    gradientDark: ['#173E80', '#1D4ED8'],
  },
  customer: {
    primary: '#C88913', primaryDark: '#8A5A0A', primarySoft: '#FFF4D6',
    bg: '#FFF9EA', bgDark: '#0F172A',
    card: '#FFFFFF', cardDark: '#162132',
    border: premium.line, borderDark: '#2B3A52',
    text: premium.ink, textDark: '#F8FAFC',
    muted: premium.muted, mutedDark: '#9FB0C4',
    gradient: ['#E7B52C', '#C88913'],
    gradientDark: ['#8A5A0A', '#C88913'],
  },
  counterboy: {
    primary: '#8B3C2A', primaryDark: '#5C2418', primarySoft: '#F5E2DA',
    bg: '#FBF4EF', bgDark: '#0F172A',
    card: '#FFFFFF', cardDark: '#1A0F0A',
    border: premium.line, borderDark: '#2B3A52',
    text: premium.ink, textDark: '#F8FAFC',
    muted: premium.muted, mutedDark: '#9FB0C4',
    gradient: ['#8B3C2A', '#B65A3F'],
    gradientDark: ['#5C2418', '#8B3C2A'],
  },
};

type CheckoutLineItem = {
  id: string;
  name: string;
  desc: string;
  image: { uri: string } | null;
  price: number;
  qty: number;
};

export type CheckoutItem = CheckoutLineItem & {
  items?: CheckoutLineItem[];
  source?: 'buy-now' | 'cart';
};

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EditIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M13.8 5.2l5 5M4.5 19.5l4.9-1 9.2-9.2a2.1 2.1 0 0 0 0-3l-.9-.9a2.1 2.1 0 0 0-3 0L5.5 14.6l-1 4.9z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.3} strokeLinecap="round" />
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
  const { user, updateUser } = useAuth();
  const { appSettings } = useAppData();
  const insets = useSafeAreaInsets();

  const theme = ROLE_THEMES[role] ?? ROLE_THEMES.customer;

  const [address, setAddress] = useState((user as any)?.address ?? '');
  const [addressEditing, setAddressEditing] = useState(false);
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
  const inputBg = darkMode ? theme.borderDark : premium.surfaceSoft;
  const gradient = darkMode ? theme.gradientDark : theme.gradient;

  const checkoutItems = useMemo(
    () => (item.items?.length ? item.items : [item]),
    [item]
  );
  const isCartCheckout = checkoutItems.length > 1 || item.source === 'cart';
  const totalPrice = checkoutItems.reduce((sum, line) => sum + (line.price * line.qty), 0);
  const totalQty = checkoutItems.reduce((sum, line) => sum + line.qty, 0);
  const displayItem = isCartCheckout
    ? {
        ...item,
        name: `${checkoutItems.length} ${checkoutItems.length === 1 ? tx('product') : tx('products')} ${tx('in cart')}`,
        desc: checkoutItems.map((line) => `${line.name} x ${line.qty}`).join('  |  '),
        price: totalPrice,
        qty: totalQty,
      }
    : item;
  const minimumRole = role === 'customer' ? 'user' : role;
  const minimumOrderAmount = Number(appSettings?.minimumOrderAmounts?.[minimumRole] ?? 0);
  const availablePoints = Math.max(
    0,
    Number((user as any)?.walletBalance ?? (user as any)?.totalPoints ?? 0)
  );
  const canPayWithPoints = availablePoints >= totalPrice;

  const handleSaveAddress = useCallback(() => {
    const nextAddress = address.trim();
    if (!nextAddress) {
      setDialog({ visible: true, variant: 'info', title: tx('Address required'), message: tx('Please enter your shipping address.') });
      return;
    }
    updateUser({ address: nextAddress } as any);
    setAddress(nextAddress);
    setAddressEditing(false);
    setDialog({
      visible: true,
      variant: 'success',
      title: tx('Address updated'),
      message: tx('Your shipping address has been updated successfully.'),
    });
  }, [address, tx, updateUser]);

  const handleAddAnotherAddress = useCallback(() => {
    setAddress('');
    setAddressEditing(true);
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (totalPrice < minimumOrderAmount) {
      setDialog({
        visible: true,
        variant: 'info',
        title: tx('Minimum order amount'),
        message: tx(`Please increase quantity. The minimum order amount is ₹${minimumOrderAmount.toLocaleString('en-IN')}.`),
      });
      return;
    }
    if (!address.trim()) {
      setDialog({ visible: true, variant: 'info', title: tx('Address required'), message: tx('Please enter your shipping address.') });
      return;
    }
    setPlacing(true);
    try {
      if (paymentMethod === 'points') {
        if (!canPayWithPoints) {
          setDialog({
            visible: true,
            variant: 'info',
            title: tx('Insufficient points'),
            message: `${tx('You have')} ${availablePoints.toLocaleString('en-IN')} ${tx('points')}, ${tx('but this order needs')} ${totalPrice.toLocaleString('en-IN')} ${tx('points')}.`,
          });
          return;
        }

        let latestWalletBalance = availablePoints;
        let pointsUsed = 0;
        for (const line of checkoutItems) {
          const result = await catalogApi.buyNowWithPoints({
            productId: line.id,
            quantity: line.qty,
            shippingAddress: address.trim(),
          });
          latestWalletBalance = result.walletBalance;
          pointsUsed += Number(result.pointsUsed ?? line.price * line.qty);
        }
        if (isCartCheckout) {
          await catalogApi.clearCart().catch(() => undefined);
        }
        updateUser({
          walletBalance: latestWalletBalance,
          ...(role === 'dealer' ? {} : { totalPoints: latestWalletBalance }),
        } as any);
        setDialog({
          visible: true,
          variant: 'success',
          title: tx('Order Confirmed'),
          message: `${tx('Your order has been placed using points.')} ${pointsUsed.toLocaleString('en-IN')} ${tx('points deducted.')}`,
          completeOnClose: true,
        });
        return;
      }

      if (paymentMethod === 'cod') {
        await Promise.all(
          checkoutItems.map((line) =>
            catalogApi.buyNow({
              productId: line.id,
              quantity: line.qty,
              shippingAddress: address.trim(),
              cartTotal: isCartCheckout ? totalPrice : undefined,
            })
          )
        );
        if (isCartCheckout) {
          await catalogApi.clearCart().catch(() => undefined);
        }
        setDialog({
          visible: true,
          variant: 'success',
          title: tx('Order Confirmed'),
          message: isCartCheckout
            ? tx('All cart products have been placed successfully with Cash on Delivery. You can track them from My Orders.')
            : tx('Your order has been placed successfully with Cash on Delivery. You can track it from My Orders.'),
          completeOnClose: true,
        });
        return;
      }

      if (Platform.OS === 'web') {
        throw new Error(tx('Online payment is available in the Android app.'));
      }

      const { default: RazorpayCheckout } = await import('react-native-razorpay');
      for (const line of checkoutItems) {
        const paymentOrder = await catalogApi.createRazorpayOrder({
          productId: line.id,
          quantity: line.qty,
          shippingAddress: address.trim(),
          cartTotal: isCartCheckout ? totalPrice : undefined,
        });

        let paymentResponse;
        try {
        const checkoutOptions = {
          key: paymentOrder.keyId,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          name: paymentOrder.businessName,
          description: isCartCheckout
            ? `${tx('Cart item')}: ${line.name} x ${line.qty}`
            : paymentOrder.description,
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
      }
      if (isCartCheckout) {
        await catalogApi.clearCart().catch(() => undefined);
      }
      setDialog({
        visible: true,
        variant: 'success',
        title: tx('Order Confirmed'),
        message: isCartCheckout
          ? tx('Payment received for all cart products. Your orders are confirmed and ready for processing.')
          : tx('Payment received. Your order has been confirmed and is ready for processing.'),
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
  }, [checkoutItems, isCartCheckout, address, paymentMethod, theme.primary, tx, canPayWithPoints, availablePoints, totalPrice, minimumOrderAmount, role, updateUser]);

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
            {displayItem.image ? (
              <Image source={displayItem.image} style={styles.productImage} resizeMode="contain" />
            ) : (
              <View style={[styles.productImagePlaceholder, { backgroundColor: theme.primarySoft }]}>
                <Text style={{ color: theme.primaryDark, fontSize: 12 }}>{truncate(displayItem.name, 2)}</Text>
              </View>
            )}
          </View>
          <View style={styles.productInfo}>
            <Text style={[styles.productName, { color: textPrimary }]} numberOfLines={2}>{displayItem.name}</Text>
            <Text style={[styles.productDesc, { color: textMuted }]} numberOfLines={isCartCheckout ? 3 : 1}>{displayItem.desc}</Text>
            <View style={styles.productPriceRow}>
              <Text style={[styles.productPrice, { color: textPrimary }]}>₹{displayItem.price.toLocaleString('en-IN')}</Text>
              {onUpdateQty && !isCartCheckout ? (
                <View style={[styles.checkoutQtyPill, { backgroundColor: inputBg, borderColor: border }]}>
                  <Pressable
                    style={[styles.checkoutQtyBtn, { backgroundColor: theme.primaryDark }]}
                    onPress={() => displayItem.qty > 1 && onUpdateQty(displayItem.id, displayItem.qty - 1)}
                  >
                    <Text style={styles.checkoutQtyBtnText}>−</Text>
                  </Pressable>
                  <Text style={[styles.checkoutQtyText, { color: textPrimary }]}>{displayItem.qty}</Text>
                  <Pressable
                    style={[styles.checkoutQtyBtn, { backgroundColor: theme.primary }]}
                    onPress={() => onUpdateQty(displayItem.id, displayItem.qty + 1)}
                  >
                    <Text style={styles.checkoutQtyBtnText}>+</Text>
                  </Pressable>
                </View>
              ) : (
                <Text style={[styles.productQty, { color: textMuted }]}>Qty: {displayItem.qty}</Text>
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
          <View style={styles.addressHeaderRow}>
            <Text style={[styles.sectionTitle, styles.addressTitle, { color: textPrimary }]}>{tx('Shipping Address')}</Text>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setAddressEditing(true)}
              style={[styles.addressEditBtn, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}
              accessibilityRole="button"
              accessibilityLabel={tx('Edit shipping address')}
            >
              <EditIcon color={theme.primary} />
              <Text style={[styles.addressEditText, { color: theme.primary }]}>{tx('Edit')}</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={[
              styles.addressInput,
              {
                backgroundColor: addressEditing ? inputBg : (darkMode ? '#111827' : '#F8FAFC'),
                color: textPrimary,
                borderColor: addressEditing ? theme.primary : border,
              },
              !addressEditing ? styles.addressInputLocked : null,
            ]}
            placeholder={tx('Enter your address')}
            placeholderTextColor={textMuted}
            value={address}
            onChangeText={setAddress}
            editable={addressEditing}
            selectTextOnFocus={addressEditing}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          {addressEditing ? (
            <TouchableOpacity
              activeOpacity={0.84}
              onPress={handleSaveAddress}
              style={[styles.saveAddressBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.saveAddressText}>{tx('Save Address')}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.addressHint, { color: textMuted }]}>{tx('Tap edit to update your delivery address.')}</Text>
          )}
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={handleAddAnotherAddress}
            style={[styles.addAddressBtn, { borderColor: theme.primary, backgroundColor: darkMode ? '#111827' : theme.primarySoft }]}
          >
            <PlusIcon color={theme.primary} />
            <Text style={[styles.addAddressText, { color: theme.primary }]}>{tx('Add another address')}</Text>
          </TouchableOpacity>
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
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => canPayWithPoints && setPaymentMethod('points')}
              disabled={!canPayWithPoints}
            >
              <LinearGradient
                colors={[paymentMethod === 'points' ? theme.primarySoft : inputBg, paymentMethod === 'points' ? theme.primarySoft : inputBg]}
                style={[
                  styles.paymentOption,
                  {
                    borderColor: paymentMethod === 'points' ? theme.primary : border,
                    opacity: canPayWithPoints ? 1 : 0.58,
                  },
                ]}
              >
                <PaymentChoiceIcon color={theme.primary} selected={paymentMethod === 'points'} />
                <View style={styles.paymentCopy}>
                  <Text style={[styles.paymentText, { color: textPrimary }]}>{tx('Pay with Points')}</Text>
                  <Text style={[styles.paymentHint, { color: textMuted }]}>
                    {tx('Available')}: {availablePoints.toLocaleString('en-IN')} {tx('points')}
                    {' · '}
                    {canPayWithPoints ? tx('Enough for this order') : tx('Not enough points')}
                  </Text>
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
              <Text style={styles.placeOrderText}>
                {paymentMethod === 'cod'
                  ? tx('Place COD Order')
                  : paymentMethod === 'points'
                    ? tx('Pay with Points')
                    : tx('Pay Securely')}
              </Text>
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    ...premiumShadow('md'),
  },
  productImageWrap: {
    width: 90,
    height: 90,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: premium.surfaceSoft,
    borderWidth: 1,
    borderColor: premium.line,
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
  productName: { fontSize: 15, fontWeight: '900', marginBottom: 2, lineHeight: 20 },
  productDesc: { fontSize: 12, marginBottom: 8, fontWeight: '600' },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productPrice: { fontSize: 14, fontWeight: '800' },
  productQty: { fontSize: 12 },
  productTotal: { fontSize: 18, fontWeight: '900' },
  checkoutQtyPill: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 999, overflow: 'hidden',
  },
  checkoutQtyBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  checkoutQtyBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', lineHeight: 18 },
  checkoutQtyText: { fontSize: 14, fontWeight: '800', minWidth: 32, textAlign: 'center' },

  sectionCard: {
    margin: 14,
    marginBottom: 10,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    ...premiumShadow('sm'),
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 10,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  addressTitle: {
    marginBottom: 0,
    flex: 1,
  },
  addressEditBtn: {
    minHeight: 36,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addressEditText: {
    fontSize: 12,
    fontWeight: '900',
  },

  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: premium.line,
  },
  contactLabel: { fontSize: 13, fontWeight: '600' },
  contactValue: { fontSize: 13, fontWeight: '800', flexShrink: 1, textAlign: 'right' },

  addressInput: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    fontWeight: '600',
  },
  addressInputLocked: {
    opacity: 0.9,
  },
  addressHint: {
    fontSize: 11.5,
    fontWeight: '700',
    marginTop: 8,
    lineHeight: 16,
  },
  saveAddressBtn: {
    minHeight: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...premiumShadow('sm'),
  },
  saveAddressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  addAddressBtn: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  addAddressText: {
    fontSize: 13,
    fontWeight: '900',
  },

  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 10,
  },
  paymentList: { gap: 10 },
  paymentCopy: { flex: 1 },
  paymentText: { fontSize: 14, fontWeight: '800' },
  paymentHint: { fontSize: 11, marginTop: 3, lineHeight: 15 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    ...premiumShadow('lg'),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryLabelBold: { fontSize: 15, fontWeight: '900' },
  summaryValue: { fontSize: 13, fontWeight: '800' },
  summaryDivider: { height: 1, marginVertical: 6 },
  summaryTotal: { fontSize: 18, fontWeight: '900' },
  placeOrderShell: { marginTop: 12, borderRadius: 16, overflow: 'hidden', ...premiumShadow('sm') },
  placeOrderBtn: {
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 16,
  },
  placeOrderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
