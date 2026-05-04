// User Cart Screen — Purple theme
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';

const PRIMARY       = '#7C3AED';
const PRIMARY_LIGHT = '#EDE9FE';

export type CartItem = {
  id: string;
  name: string;
  desc: string;
  image: any;
  qty: number;
};

function TrashIcon({ size = 18, color = '#EF4444' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7l2.5 14.5A2 2 0 008.5 22h7a2 2 0 001.5-1.5L20 7M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 7h14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function MinusIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

function EmptyCartIcon() {
  return (
    <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#C4B5FD" strokeWidth={1.5} strokeLinejoin="round" />
      <Path d="M3 6h18" stroke="#C4B5FD" strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M16 10a4 4 0 01-8 0" stroke="#C4B5FD" strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

export function CartScreen({
  cartItems,
  onUpdateQty,
  onRemove,
  onNavigate,
}: {
  cartItems: CartItem[];
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onNavigate: (screen: any) => void;
}) {
  const { darkMode, tx } = usePreferenceContext();
  const insets = useSafeAreaInsets();

  const bg          = darkMode ? '#0F172A' : '#F5F3FF';
  const cardBg      = darkMode ? '#1E293B' : '#FFFFFF';
  const borderColor = darkMode ? '#2D3748' : '#E5E7EB';
  const textPrimary = darkMode ? '#F1F5F9' : '#1A1A1A';
  const textMuted   = darkMode ? '#94A3B8' : '#6B7280';

  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{tx('My Cart')}</Text>
        {totalItems > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{totalItems}</Text>
          </View>
        )}
      </View>

      {cartItems.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyWrap}>
          <EmptyCartIcon />
          <Text style={[styles.emptyTitle, { color: textPrimary }]}>{tx('Your cart is empty')}</Text>
          <Text style={[styles.emptySubtitle, { color: textMuted }]}>
            {tx('Browse products and add items to your cart')}
          </Text>
          <Pressable
            style={styles.shopBtn}
            onPress={() => onNavigate('categories')}
            android_ripple={{ color: `${PRIMARY}25` }}
          >
            <Text style={styles.shopBtnText}>{tx('Browse Products')}</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {cartItems.map((item) => (
              <View key={item.id} style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                {/* Image */}
                <View style={styles.imgWrap}>
                  <Image source={item.image} style={styles.img} resizeMode="contain" />
                </View>

                {/* Info */}
                <View style={styles.info}>
                  <Text style={[styles.itemName, { color: textPrimary }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={[styles.itemDesc, { color: textMuted }]} numberOfLines={1}>
                    {item.desc}
                  </Text>

                  {/* Qty controls */}
                  <View style={styles.qtyRow}>
                    <Pressable
                      style={[styles.qtyBtn, { backgroundColor: PRIMARY }]}
                      onPress={() => item.qty > 1 ? onUpdateQty(item.id, item.qty - 1) : onRemove(item.id)}
                      android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true }}
                    >
                      <MinusIcon size={14} />
                    </Pressable>
                    <Text style={[styles.qtyText, { color: textPrimary }]}>{item.qty}</Text>
                    <Pressable
                      style={[styles.qtyBtn, { backgroundColor: PRIMARY }]}
                      onPress={() => onUpdateQty(item.id, item.qty + 1)}
                      android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: true }}
                    >
                      <PlusIcon size={14} />
                    </Pressable>
                  </View>
                </View>

                {/* Remove */}
                <Pressable
                  style={styles.removeBtn}
                  onPress={() => onRemove(item.id)}
                  android_ripple={{ color: 'rgba(239,68,68,0.15)', borderless: true }}
                >
                  <TrashIcon size={18} />
                </Pressable>
              </View>
            ))}
            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Enquire All Button */}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
            <View style={[styles.footerCard, { backgroundColor: cardBg, borderColor }]}>
              <Text style={[styles.footerTotal, { color: textMuted }]}>
                {totalItems} {tx('item(s) in cart')}
              </Text>
              <Pressable
                style={styles.enquireBtn}
                android_ripple={{ color: `${PRIMARY}25` }}
              >
                <Text style={styles.enquireBtnText}>{tx('Enquire All Items')}</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: PRIMARY,
    ...createShadow({ color: PRIMARY, offsetY: 3, blur: 10, opacity: 0.3, elevation: 6 }),
  },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  badge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 12, fontWeight: '900', color: PRIMARY },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptySubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  shopBtn: {
    marginTop: 8,
    backgroundColor: PRIMARY,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    ...createShadow({ color: PRIMARY, offsetY: 3, blur: 8, opacity: 0.3, elevation: 4 }),
  },
  shopBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  // List
  listContent: { padding: 12, gap: 10 },
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    ...createShadow({ color: '#000', offsetY: 1, blur: 6, opacity: 0.07, elevation: 2 }),
  },
  imgWrap: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center', padding: 8 },
  img: { width: '100%', height: '100%' },
  info: { flex: 1, padding: 10 },
  itemName: { fontSize: 13, fontWeight: '700', lineHeight: 17, marginBottom: 3 },
  itemDesc: { fontSize: 11, marginBottom: 8 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 15, fontWeight: '800', minWidth: 20, textAlign: 'center' },
  removeBtn: { padding: 12 },

  // Footer
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  footerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    ...createShadow({ color: '#000', offsetY: -2, blur: 10, opacity: 0.08, elevation: 6 }),
  },
  footerTotal: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  enquireBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    ...createShadow({ color: PRIMARY, offsetY: 3, blur: 8, opacity: 0.3, elevation: 4 }),
  },
  enquireBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
