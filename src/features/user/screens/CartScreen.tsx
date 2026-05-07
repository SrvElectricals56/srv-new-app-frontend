import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';

const PRIMARY = '#6B7C2D';
const PRIMARY_DARK = '#4D5F1F';
const PRIMARY_SOFT = '#EEF4D7';
const MINT_SOFT = '#E7F7EC';

export type CartItem = {
  id: string;
  name: string;
  desc: string;
  image: any;
  qty: number;
};

function TrashIcon({ size = 18, color = '#D95D39' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 7l2.5 14.5A2 2 0 008.5 22h7a2 2 0 001.5-1.5L20 7M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M5 7h14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function PlusIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

function MinusIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

function CartHeroIcon() {
  return (
    <Svg width={86} height={86} viewBox="0 0 86 86" fill="none">
      <Rect x="8" y="14" width="70" height="48" rx="18" fill={PRIMARY_SOFT} />
      <Path
        d="M24 28h8l4 20h25l5-14H34"
        stroke={PRIMARY_DARK}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="40" cy="58" r="4.5" fill={PRIMARY_DARK} />
      <Circle cx="60" cy="58" r="4.5" fill={PRIMARY_DARK} />
      <Circle cx="65" cy="24" r="9" fill="#F6E3A1" />
    </Svg>
  );
}

function EmptyCartIcon() {
  return (
    <Svg width={92} height={92} viewBox="0 0 92 92" fill="none">
      <Rect x="10" y="14" width="72" height="60" rx="24" fill={PRIMARY_SOFT} />
      <Path
        d="M27 31h8l4.8 24h29l5.2-15H37.8"
        stroke={PRIMARY_DARK}
        strokeWidth={3.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="44" cy="63" r="4.8" fill={PRIMARY_DARK} />
      <Circle cx="64" cy="63" r="4.8" fill={PRIMARY_DARK} />
      <Path
        d="M58 20l2.8 2.8L67 16.5"
        stroke="#D95D39"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

  const bg = darkMode ? '#0F172A' : '#F4F7EE';
  const heroSurface = darkMode ? '#1A2434' : '#EAF0DD';
  const cardBg = darkMode ? '#162132' : '#FFFFFF';
  const cardSoft = darkMode ? '#1D2A3D' : '#F8FAF4';
  const borderColor = darkMode ? '#2B3A52' : '#DEE7CF';
  const textPrimary = darkMode ? '#F8FAFC' : '#1F2937';
  const textMuted = darkMode ? '#9FB0C4' : '#6B7280';

  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const totalUnits = cartItems.length;

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: cartItems.length ? insets.bottom + 150 : insets.bottom + 40 }}
      >
        <LinearGradient
          colors={darkMode ? ['#1B2638', '#182131', '#111827'] : ['#F1F6E7', '#E8F0DB', '#EEF4E2']}
          style={[styles.heroCard, { borderColor }]}
        >
          <View style={[styles.heroGlow, { backgroundColor: darkMode ? 'rgba(107,124,45,0.16)' : 'rgba(107,124,45,0.12)' }]} />
          <View style={styles.heroTopRow}>
            <View>
              <Text style={[styles.heroEyebrow, { color: PRIMARY_DARK }]}>{tx('Customer Cart')}</Text>
              <Text style={[styles.heroTitle, { color: textPrimary }]}>{tx('My Cart')}</Text>
              <Text style={[styles.heroSubtitle, { color: textMuted }]}>
                {cartItems.length
                  ? tx('Review your selected products, adjust quantity and continue with enquiry.')
                  : tx('Save your favorite items here and enquire when you are ready.')}
              </Text>
            </View>
            <CartHeroIcon />
          </View>

          <View style={styles.heroStats}>
            <View style={[styles.statChip, { backgroundColor: darkMode ? '#223049' : '#FFFFFF' }]}>
              <Text style={[styles.statValue, { color: textPrimary }]}>{totalItems}</Text>
              <Text style={[styles.statLabel, { color: textMuted }]}>{tx('Total Qty')}</Text>
            </View>
            <View style={[styles.statChip, { backgroundColor: darkMode ? '#223049' : '#FFFFFF' }]}>
              <Text style={[styles.statValue, { color: textPrimary }]}>{totalUnits}</Text>
              <Text style={[styles.statLabel, { color: textMuted }]}>{tx('Products')}</Text>
            </View>
          </View>
        </LinearGradient>

        {cartItems.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: cardBg, borderColor }]}>
            <EmptyCartIcon />
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>{tx('Your cart is empty')}</Text>
            <Text style={[styles.emptySubtitle, { color: textMuted }]}>
              {tx('Browse categories, explore products and add items here for a cleaner enquiry flow.')}
            </Text>
            <Pressable
              style={styles.shopButtonShell}
              onPress={() => onNavigate('categories')}
              android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            >
              <LinearGradient colors={[PRIMARY, PRIMARY_DARK]} style={styles.shopButton}>
                <Text style={styles.shopButtonText}>{tx('Browse Products')}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {cartItems.map((item) => (
              <View key={item.id} style={[styles.itemCard, { backgroundColor: cardBg, borderColor }]}>
                <View style={[styles.itemImageWrap, { backgroundColor: cardSoft }]}>
                  <Image source={item.image} style={styles.itemImage} resizeMode="contain" />
                </View>

                <View style={styles.itemInfo}>
                  <View style={styles.itemTextWrap}>
                    <Text style={[styles.itemName, { color: textPrimary }]} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemDesc, { color: textMuted }]} numberOfLines={2}>
                      {item.desc}
                    </Text>
                  </View>

                  <View style={styles.itemBottomRow}>
                    <View style={[styles.qtyPill, { backgroundColor: darkMode ? '#223049' : PRIMARY_SOFT }]}>
                      <Pressable
                        style={[styles.qtyBtn, { backgroundColor: PRIMARY_DARK }]}
                        onPress={() => (item.qty > 1 ? onUpdateQty(item.id, item.qty - 1) : onRemove(item.id))}
                        android_ripple={{ color: 'rgba(255,255,255,0.22)', borderless: true }}
                      >
                        <MinusIcon size={13} />
                      </Pressable>
                      <Text style={[styles.qtyText, { color: textPrimary }]}>{item.qty}</Text>
                      <Pressable
                        style={[styles.qtyBtn, { backgroundColor: PRIMARY }]}
                        onPress={() => onUpdateQty(item.id, item.qty + 1)}
                        android_ripple={{ color: 'rgba(255,255,255,0.22)', borderless: true }}
                      >
                        <PlusIcon size={13} />
                      </Pressable>
                    </View>

                    <Pressable
                      style={[styles.removeBtn, { backgroundColor: darkMode ? '#2A2230' : '#FFF2EC' }]}
                      onPress={() => onRemove(item.id)}
                      android_ripple={{ color: 'rgba(217,93,57,0.14)' }}
                    >
                      <TrashIcon size={17} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {cartItems.length ? (
        <View style={[styles.footerWrap, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.footerCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.footerRow}>
              <View>
                <Text style={[styles.footerLabel, { color: textMuted }]}>{tx('Ready to enquire')}</Text>
                <Text style={[styles.footerValue, { color: textPrimary }]}>
                  {totalItems} {tx('item(s) selected')}
                </Text>
              </View>
              <View style={[styles.footerBadge, { backgroundColor: darkMode ? '#223049' : MINT_SOFT }]}>
                <Text style={[styles.footerBadgeText, { color: PRIMARY_DARK }]}>{tx('Fast Response')}</Text>
              </View>
            </View>

            <Pressable style={styles.enquireShell} android_ripple={{ color: 'rgba(255,255,255,0.18)' }}>
              <LinearGradient colors={[PRIMARY, PRIMARY_DARK]} style={styles.enquireBtn}>
                <Text style={styles.enquireBtnText}>{tx('Enquire All Items')}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  heroCard: {
    margin: 14,
    marginBottom: 10,
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    ...createShadow({ color: '#0F172A', offsetY: 10, blur: 22, opacity: 0.1, elevation: 6 }),
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -35,
    top: -25,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heroTitle: { fontSize: 28, fontWeight: '900', marginBottom: 6 },
  heroSubtitle: { fontSize: 13, lineHeight: 20, maxWidth: 210 },
  heroStats: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  statChip: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  statValue: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '700', marginTop: 2 },

  emptyCard: {
    marginHorizontal: 14,
    marginTop: 4,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    padding: 28,
    ...createShadow({ color: '#0F172A', offsetY: 8, blur: 18, opacity: 0.08, elevation: 4 }),
  },
  emptyTitle: { fontSize: 22, fontWeight: '900', marginTop: 14, marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, lineHeight: 21, textAlign: 'center', maxWidth: 260 },
  shopButtonShell: {
    marginTop: 18,
    borderRadius: 16,
    overflow: 'hidden',
    width: '100%',
    ...createShadow({ color: PRIMARY, offsetY: 6, blur: 14, opacity: 0.22, elevation: 5 }),
  },
  shopButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  shopButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },

  listWrap: {
    paddingHorizontal: 14,
    paddingTop: 4,
    gap: 12,
  },
  itemCard: {
    flexDirection: 'row',
    borderRadius: 24,
    borderWidth: 1,
    padding: 12,
    gap: 12,
    ...createShadow({ color: '#0F172A', offsetY: 8, blur: 16, opacity: 0.07, elevation: 4 }),
  },
  itemImageWrap: {
    width: 96,
    height: 96,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  itemImage: { width: '100%', height: '100%' },
  itemInfo: { flex: 1, justifyContent: 'space-between' },
  itemTextWrap: { paddingTop: 2 },
  itemName: { fontSize: 16, fontWeight: '800', lineHeight: 21, marginBottom: 4 },
  itemDesc: { fontSize: 12, lineHeight: 18 },
  itemBottomRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '900',
  },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
  },
  footerCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    ...createShadow({ color: '#0F172A', offsetY: -2, blur: 14, opacity: 0.1, elevation: 8 }),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  footerLabel: { fontSize: 12, fontWeight: '700', marginBottom: 3 },
  footerValue: { fontSize: 16, fontWeight: '900' },
  footerBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  footerBadgeText: { fontSize: 11, fontWeight: '900' },
  enquireShell: {
    borderRadius: 16,
    overflow: 'hidden',
    ...createShadow({ color: PRIMARY, offsetY: 6, blur: 14, opacity: 0.22, elevation: 5 }),
  },
  enquireBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enquireBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
