import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path, Defs, RadialGradient, Stop } from 'react-native-svg';
import { AppIcon, shared } from '@/features/profile/components/ProfileShared';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAuth } from '@/shared/context/AuthContext';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { GiftProduct } from '@/shared/api';

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  primary: '#6B7C2D',
  primaryLight: '#F1F6E2',
  gold: '#F59E0B',
  goldLight: '#FFF8E1',
  goldDark: '#92400E',
  bg: '#F4F8EE',
  surface: '#FFFFFF',
  border: '#DDE7CF',
  textDark: '#1C1E2E',
  textMuted: '#9898A8',
  success: '#22c55e',
  successLight: '#e6fdf0',
};

// ── Coin SVG Icon ─────────────────────────────────────────────────────────────
function CoinIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <RadialGradient id="coinGrad" cx="40%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#FFE066" />
          <Stop offset="60%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </RadialGradient>
      </Defs>
      {/* Coin body */}
      <Circle cx="12" cy="12" r="10" fill="url(#coinGrad)" />
      {/* Shine */}
      <Circle cx="9" cy="8.5" r="2.5" fill="rgba(255,255,255,0.28)" />
      {/* ₹ symbol */}
      <Path
        d="M9.5 8h5M9.5 10.5h5M12 10.5V16M9.5 13h3.5"
        stroke="#7C3A00"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ── Gift Card ─────────────────────────────────────────────────────────────────
function GiftCard({
  gift,
  cardW,
  currentPoints,
  onRedeem,
  redeeming,
  darkMode,
}: {
  gift: GiftProduct;
  cardW: number;
  currentPoints: number;
  onRedeem: (gift: GiftProduct) => void;
  redeeming: boolean;
  darkMode: boolean;
}) {
  const { tx } = usePreferenceContext();
  const canAfford = currentPoints >= gift.pointsRequired;
  const pressScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(pressScale, withWebSafeNativeDriver({ toValue: 0.96, tension: 120, friction: 8 })).start();
  const handlePressOut = () =>
    Animated.spring(pressScale, withWebSafeNativeDriver({ toValue: 1, tension: 120, friction: 8 })).start();

  return (
    <Animated.View style={{ transform: [{ scale: pressScale }], width: cardW }}>
      <TouchableOpacity
        onPress={() => onRedeem(gift)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={redeeming}
        style={[styles.card, darkMode && styles.cardDark, !canAfford && styles.cardLocked]}
      >
        {/* Badge */}
        {gift.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{gift.badge}</Text>
          </View>
        ) : null}

        {/* Lock overlay if can't afford */}
        {!canAfford && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}

        {/* Image */}
        <View style={[styles.imgWrap, darkMode && styles.imgWrapDark]}>
          {gift.imageUrl ? (
            <Image
              source={{ uri: gift.imageUrl }}
              style={styles.img}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.imgPlaceholder}>🎁</Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.cardBody}>
          <Text style={[styles.giftName, darkMode && styles.giftNameDark]} numberOfLines={2}>
            {gift.name}
          </Text>

          {gift.mrp > 0 && (
            <Text style={styles.mrp}>M.R.P. ₹{gift.mrp.toLocaleString('en-IN')}</Text>
          )}

          {/* Points row */}
          <View style={styles.ptsRow}>
            <CoinIcon size={18} />
            <Text style={[styles.pts, canAfford ? styles.ptsAffordable : styles.ptsLocked]}>
              {gift.pointsRequired.toLocaleString('en-IN')} {tx('Pts.')}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export function RewardsScreen({ onBack }: { onBack?: () => void }) {
  const { darkMode, tx, theme } = usePreferenceContext();
  const { giftProducts, wallet, walletSummary, redeemReward, refreshAll } = useAppData();
  const { role } = useAuth();
  const { width } = useWindowDimensions();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const currentPoints = wallet?.totalPoints ?? walletSummary?.totalPoints ?? 0;
  const cardW = Math.floor((width - 32 - 12) / 2);

  // Auto-filter by user role — no tabs needed
  // Show gifts targeted to this role OR targeted to 'all'
  const filtered = useMemo<GiftProduct[]>(() => {
    if (!role) return giftProducts;
    return giftProducts.filter((g) => {
      const t = (g.targetRole ?? 'all').toLowerCase();
      return t === 'all' || t === 'both' || t === role.toLowerCase();
    });
  }, [giftProducts, role]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refreshAll(); } finally { setRefreshing(false); }
  }, [refreshAll]);

  const handleRedeem = async (gift: GiftProduct) => {
    if (currentPoints < 100) {
      Alert.alert(
        tx('Minimum Points Required'),
        `${tx('You need at least 100 points to redeem. You have')} ${currentPoints} ${tx('points. Scan SRV products to earn more!')}`,
      );
      return;
    }
    if (currentPoints < gift.pointsRequired) {
      Alert.alert(
        tx('Not Enough Points'),
        `${tx('You need')} ${gift.pointsRequired} ${tx('pts but have')} ${currentPoints} ${tx('pts. Keep scanning to unlock this gift!')}`,
      );
      return;
    }
    if (gift.stock <= 0) {
      Alert.alert(tx('Out of Stock'), tx('This gift is currently out of stock. Check back soon!'));
      return;
    }

    Alert.alert(
      `${tx('Redeem')} ${gift.name}?`,
      `${tx('This will use')} ${gift.pointsRequired} ${tx('points from your wallet.')}`,
      [
        { text: tx('Cancel'), style: 'cancel' },
        {
          text: tx('Confirm'),
          style: 'default',
          onPress: async () => {
            try {
              setRedeemingId(gift.id);
              await redeemReward({ schemeId: gift.id, note: gift.name });
              Alert.alert(
                '🎁 ' + tx('Redemption Requested!'),
                `${tx('Your request for')} "${gift.name}" ${tx('has been submitted. SRV team will process it shortly.')}`,
              );
            } catch (err: any) {
              Alert.alert(tx('Redemption Failed'), err?.message ?? tx('Please try again.'));
            } finally {
              setRedeemingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? '#08111F' : C.bg }}>
      {/* Header */}
      {onBack ? (
        <View style={[shared.header, { backgroundColor: theme.surface, borderBottomColor: theme.border, paddingTop: 12 }]}>
          <TouchableOpacity onPress={onBack} style={shared.backBtn} activeOpacity={0.75}>
            <AppIcon name="backArrow" size={22} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={[shared.title, { color: theme.textPrimary }]}>{tx('Gift Store')}</Text>
          <View style={{ width: 36 }} />
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.primary} />
        }
      >
        {/* Points Banner */}
        <View style={[styles.pointsBanner, darkMode && styles.pointsBannerDark]}>
          <View>
            <Text style={[styles.pointsLabel, darkMode && styles.pointsLabelDark]}>{tx('Your Points')}</Text>
            <View style={styles.pointsValueRow}>
              <CoinIcon size={22} />
              <Text style={[styles.pointsValue, darkMode && styles.pointsValueDark]}>
                {' '}{currentPoints.toLocaleString('en-IN')} {tx('pts')}
              </Text>
            </View>
          </View>
          <View style={styles.pointsHint}>
            <Text style={styles.pointsHintText}>{tx('Scan products to earn more')}</Text>
          </View>
        </View>

        {/* Grid */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={[styles.emptyTitle, darkMode && { color: '#F8FAFC' }]}>{tx('No gifts available')}</Text>
            <Text style={[styles.emptySub, darkMode && { color: '#94A3B8' }]}>{tx('Check back soon!')}</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                cardW={cardW}
                currentPoints={currentPoints}
                onRedeem={handleRedeem}
                redeeming={redeemingId === gift.id}
                darkMode={darkMode}
              />
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 120 },

  // Points banner
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    ...createShadow({ color: '#000', offsetY: 2, blur: 8, opacity: 0.05, elevation: 2 }),
  },
  pointsBannerDark: { backgroundColor: '#111827', borderColor: '#243043' },
  pointsLabel: { fontSize: 12, fontWeight: '600', color: C.textMuted, marginBottom: 4 },
  pointsLabelDark: { color: '#94A3B8' },
  pointsValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pointsValue: { fontSize: 22, fontWeight: '900', color: C.textDark },
  pointsValueDark: { color: '#F8FAFC' },
  pointsHint: { backgroundColor: C.goldLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  pointsHintText: { fontSize: 11, fontWeight: '700', color: C.goldDark },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  // Card
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    ...createShadow({ color: '#000', offsetY: 3, blur: 10, opacity: 0.07, elevation: 3 }),
  },
  cardDark: { backgroundColor: '#111827', borderColor: '#243043' },
  cardLocked: { opacity: 0.75 },

  // Badge
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: C.primary,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  // Lock
  lockOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: { fontSize: 14 },

  // Image
  imgWrap: {
    height: 130,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  imgWrapDark: { backgroundColor: '#1E293B' },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: { fontSize: 48 },

  // Card body
  cardBody: { padding: 10 },
  giftName: {
    fontSize: 13,
    fontWeight: '800',
    color: C.textDark,
    lineHeight: 18,
    marginBottom: 4,
    minHeight: 36,
  },
  giftNameDark: { color: '#F1F5F9' },
  mrp: { fontSize: 11, color: C.textMuted, marginBottom: 6 },

  // Points row
  ptsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pts: { fontSize: 14, fontWeight: '900' },
  ptsAffordable: { color: C.primary },
  ptsLocked: { color: C.textMuted },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: C.textDark, marginBottom: 6 },
  emptySub: { fontSize: 13, color: C.textMuted },
});
