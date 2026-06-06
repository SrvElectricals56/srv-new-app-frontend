import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { memo } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferenceContext } from '@/shared/preferences';
import { useAppPageContent } from '@/shared/hooks';
import { createShadow } from '@/shared/theme/shadows';

type CartRole = 'electrician' | 'dealer' | 'customer' | 'counterboy';

const ROLE_THEMES: Record<CartRole, {
  primary: string; primaryDark: string; primarySoft: string;
  bg: string; bgDark: string;
  card: string; cardDark: string;
  border: string; borderDark: string;
  text: string; textDark: string;
  muted: string; mutedDark: string;
  mintSoft: string;
  gradient: [string, string];
  gradientDark: [string, string];
}> = {
  electrician: {
    primary: '#E8453C', primaryDark: '#C0392B', primarySoft: '#FFF0EF',
    bg: '#F2F3F7', bgDark: '#0F172A',
    card: '#FFFFFF', cardDark: '#172033',
    border: '#E5E7EB', borderDark: '#25344E',
    text: '#1C1E2E', textDark: '#F8FAFC',
    muted: '#6B7280', mutedDark: '#A8B3C7',
    mintSoft: '#FDE8E8',
    gradient: ['#E8453C', '#C0392B'],
    gradientDark: ['#C0392B', '#A93226'],
  },
  dealer: {
    primary: '#173E80', primaryDark: '#355C95', primarySoft: '#EAF3FF',
    bg: '#F4F8FF', bgDark: '#0F172A',
    card: '#FFFFFF', cardDark: '#172033',
    border: '#E5E7EB', borderDark: '#2B3A52',
    text: '#1F2937', textDark: '#F8FAFC',
    muted: '#6B7280', mutedDark: '#9FB0C4',
    mintSoft: '#DCE8FF',
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
    mintSoft: '#F0DEC9',
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
    mintSoft: '#E8DCD0',
    gradient: ['#8B3C2A', '#6B2D1D'],
    gradientDark: ['#6B2D1D', '#5C3D2E'],
  },
};

export type CartItem = {
  id: string;
  name: string;
  desc: string;
  image: any;
  price: number;
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

function CartHeroIcon({ primarySoft, primaryDark }: { primarySoft: string; primaryDark: string }) {
  return (
    <Svg width={86} height={86} viewBox="0 0 86 86" fill="none">
      <Rect x="8" y="14" width="70" height="48" rx="18" fill={primarySoft} />
      <Path
        d="M24 28h8l4 20h25l5-14H34"
        stroke={primaryDark}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="40" cy="58" r="4.5" fill={primaryDark} />
      <Circle cx="60" cy="58" r="4.5" fill={primaryDark} />
      <Circle cx="65" cy="24" r="9" fill="#F6E3A1" />
    </Svg>
  );
}

function EmptyCartIcon({ primarySoft, primaryDark }: { primarySoft: string; primaryDark: string }) {
  return (
    <Svg width={92} height={92} viewBox="0 0 92 92" fill="none">
      <Rect x="10" y="14" width="72" height="60" rx="24" fill={primarySoft} />
      <Path
        d="M27 31h8l4.8 24h29l5.2-15H37.8"
        stroke={primaryDark}
        strokeWidth={3.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="44" cy="63" r="4.8" fill={primaryDark} />
      <Circle cx="64" cy="63" r="4.8" fill={primaryDark} />
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

const CartItemRow = memo(function CartItemRow({
  item, theme, darkMode, cardBg, cardSoft, border, textPrimary, textMuted, onUpdateQty, onRemove,
}: {
  item: CartItem;
  theme: (typeof ROLE_THEMES)[CartRole];
  darkMode: boolean;
  cardBg: string; cardSoft: string; border: string;
  textPrimary: string; textMuted: string;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <View style={[styles.itemCard, { backgroundColor: cardBg, borderColor: border }]}>
      <View style={[styles.itemImageWrap, { backgroundColor: cardSoft }]}>
        <Image source={item.image} style={styles.itemImage} resizeMode="contain" />
      </View>
      <View style={styles.itemInfo}>
        <View style={styles.itemTextWrap}>
          <Text style={[styles.itemName, { color: textPrimary }]} numberOfLines={2}>{item.name}</Text>
          <Text style={[styles.itemDesc, { color: textMuted }]} numberOfLines={2}>{item.desc}</Text>
        </View>
        <View style={styles.itemBottomRow}>
          <View style={[styles.qtyPill, { backgroundColor: darkMode ? '#223049' : theme.primarySoft }]}>
            <Pressable
              style={[styles.qtyBtn, { backgroundColor: theme.primaryDark }]}
              onPress={() => (item.qty > 1 ? onUpdateQty(item.id, item.qty - 1) : onRemove(item.id))}
              android_ripple={{ color: 'rgba(255,255,255,0.22)', borderless: true }}
            >
              <MinusIcon size={13} />
            </Pressable>
            <Text style={[styles.qtyText, { color: textPrimary }]}>{item.qty}</Text>
            <Pressable
              style={[styles.qtyBtn, { backgroundColor: theme.primary }]}
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
      <View style={styles.itemPriceCol}>
        <Text style={[styles.itemPriceLabel, { color: textMuted }]}>₹{item.price.toLocaleString('en-IN')}</Text>
        <Text style={[styles.itemTotal, { color: theme.primary }]}>₹{(item.price * item.qty).toLocaleString('en-IN')}</Text>
      </View>
    </View>
  );
});

export function CartScreen({
  cartItems,
  onUpdateQty,
  onRemove,
  onNavigate,
  onCheckout,
  role = 'customer',
}: {
  cartItems: CartItem[];
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onNavigate: (screen: any) => void;
  onCheckout?: () => void;
  role?: CartRole;
}) {
  const { darkMode, tx } = usePreferenceContext();
  const insets = useSafeAreaInsets();
  const pageContent = useAppPageContent(role === 'customer' ? 'user' : role, 'cart');

  const theme = ROLE_THEMES[role] ?? ROLE_THEMES.customer;

  const bg = darkMode ? theme.bgDark : theme.bg;
  const cardBg = darkMode ? theme.cardDark : theme.card;
  const cardSoft = darkMode ? theme.borderDark : theme.primarySoft;
  const borderColor = darkMode ? theme.borderDark : theme.border;
  const textPrimary = darkMode ? theme.textDark : theme.text;
  const textMuted = darkMode ? theme.mutedDark : theme.muted;

  const totalItems = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const totalUnits = cartItems.length;

  return (
    <View style={[styles.screen, { backgroundColor: bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: cartItems.length ? insets.bottom + 150 : insets.bottom + 40 }}
      >
        <LinearGradient
          colors={darkMode ? ['#1B2638', '#182131', '#111827'] : [theme.primarySoft, theme.mintSoft, '#F0DEC9']}
          style={[styles.heroCard, { borderColor }]}
        >
          <View style={[styles.heroGlow, { backgroundColor: darkMode ? 'rgba(141,74,30,0.16)' : 'rgba(106,47,18,0.12)' }]} />
          <View style={styles.heroTopRow}>
            <View>
              <Text style={[styles.heroEyebrow, { color: theme.primaryDark }]}>{pageContent.pageTitle || ({ dealer: tx('Dealer Cart'), counterboy: tx('Counterboy Cart'), electrician: tx('Cart'), customer: tx('Customer Cart') } as Record<string, string>)[role] || tx('Cart')}</Text>
              <Text style={[styles.heroTitle, { color: textPrimary }]}>{pageContent.heroTitle || tx('My Cart')}</Text>
              <Text style={[styles.heroSubtitle, { color: textMuted }]}>
                {pageContent.heroSubtitle || (cartItems.length
                  ? tx('Review your selected products, adjust quantity and continue with enquiry.')
                  : tx('Save your favorite items here and enquire when you are ready.'))}
              </Text>
            </View>
            <CartHeroIcon primarySoft={theme.primarySoft} primaryDark={theme.primaryDark} />
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
            <EmptyCartIcon primarySoft={theme.primarySoft} primaryDark={theme.primaryDark} />
            <Text style={[styles.emptyTitle, { color: textPrimary }]}>{pageContent.emptyStateTitle || tx('Your cart is empty')}</Text>
            <Text style={[styles.emptySubtitle, { color: textMuted }]}>
              {pageContent.emptyStateSubtitle || tx('Browse categories, explore products and add items here for a cleaner enquiry flow.')}
            </Text>
            <Pressable
              style={styles.shopButtonShell}
              onPress={() => onNavigate(role === 'customer' ? 'categories' : 'product')}
              android_ripple={{ color: 'rgba(255,255,255,0.18)' }}
            >
              <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.shopButton}>
                <Text style={styles.shopButtonText}>{pageContent.primaryCtaLabel || tx('Browse Products')}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <View style={styles.listWrap}>
            {cartItems.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                theme={theme as any}
                darkMode={darkMode}
                cardBg={cardBg}
                cardSoft={cardSoft}
                border={borderColor}
                textPrimary={textPrimary}
                textMuted={textMuted}
                onUpdateQty={onUpdateQty}
                onRemove={onRemove}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {cartItems.length ? (
        <View style={[styles.footerWrap, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[styles.footerCard, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.footerRow}>
              <View>
                <Text style={[styles.footerLabel, { color: textMuted }]}>{tx('Order Summary')}</Text>
                <Text style={[styles.footerValue, { color: textPrimary }]}>
                  {totalItems} {tx('item(s)')}
                </Text>
              </View>
              <Text style={[styles.footerTotalPrice, { color: theme.primary }]}>
                ₹{cartItems.reduce((sum, i) => sum + i.price * i.qty, 0).toLocaleString('en-IN')}
              </Text>
            </View>

            <Pressable style={styles.enquireShell} android_ripple={{ color: 'rgba(255,255,255,0.18)' }} onPress={onCheckout}>
              <LinearGradient colors={[theme.primary, theme.primaryDark]} style={styles.enquireBtn}>
                <Text style={styles.enquireBtnText}>{tx('Proceed to Checkout')}</Text>
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
  itemPriceCol: { alignItems: 'flex-end', justifyContent: 'center', paddingRight: 4 },
  itemPriceLabel: { fontSize: 12, fontWeight: '600', textDecorationLine: 'line-through', marginBottom: 2 },
  itemTotal: { fontSize: 15, fontWeight: '900' },
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
  footerTotalPrice: { fontSize: 20, fontWeight: '900' },
  enquireShell: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  enquireBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enquireBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});
