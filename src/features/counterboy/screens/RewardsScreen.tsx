/**
 * Counter Boy — Gift Store / Rewards Screen
 * Counter boys earn points by scanning SRV products.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
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
import { Dialog } from '@/shared/components/Dialog';
import { AppIcon, shared } from '@/features/profile/components/ProfileShared';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { useAppData } from '@/shared/context/AppDataContext';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import { counterboyTheme as cb } from '@/features/counterboy/theme';
import type { GiftProduct } from '@/shared/api';

// ── Coin SVG Icon ─────────────────────────────────────────────────────────────
function CoinIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <RadialGradient id="cbCoinGrad" cx="40%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#FFE066" />
          <Stop offset="60%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#B45309" />
        </RadialGradient>
      </Defs>
      <Circle cx="12" cy="12" r="10" fill="url(#cbCoinGrad)" />
      <Circle cx="9" cy="8.5" r="2.5" fill="rgba(255,255,255,0.28)" />
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

        {/* Lock overlay */}
        {!canAfford && (
          <View style={styles.lockOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        )}

        {/* Image */}
        <View style={[styles.imgWrap, darkMode && styles.imgWrapDark]}>
          {gift.imageUrl ? (
            <Image source={{ uri: gift.imageUrl }} style={styles.img} resizeMode="contain" />
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
  const { darkMode, tx } = usePreferenceContext();
  const { giftProducts, wallet, walletSummary, redeemReward, refreshAll } = useAppData();
  const { width } = useWindowDimensions();
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message: string; confirmLabel?: string; onConfirm?: () => void; icon?: string }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));

  const currentPoints = wallet?.totalPoints ?? walletSummary?.totalPoints ?? 0;
  const cardW = Math.floor((width - 32 - 12) / 2);

  // Show gifts for counterboy or 'all' (counterboy shares gifts with electrician)
  const filtered = useMemo<GiftProduct[]>(() => {
    return giftProducts.filter((g) => {
      const t = (g.targetRole ?? 'all').toLowerCase();
      return t === 'all' || t === 'both' || t === 'counterboy' || t === 'electrician';
    });
  }, [giftProducts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await refreshAll(); } finally { setRefreshing(false); }
  }, [refreshAll]);

  const handleRedeem = (gift: GiftProduct) => {
    if (currentPoints < 100) {
      setDialog({
        visible: true, variant: 'info', title: tx('Minimum Points Required'),
        message: `${tx('You need at least 100 points to redeem. You have')} ${currentPoints} ${tx('points. Keep scanning to earn more!')}`,
      });
      return;
    }
    if (currentPoints < gift.pointsRequired) {
      setDialog({
        visible: true, variant: 'info', title: tx('Not Enough Points'),
        message: `${tx('You need')} ${gift.pointsRequired} ${tx('pts but have')} ${currentPoints} ${tx('pts. Keep scanning to unlock this gift!')}`,
      });
      return;
    }
    if (gift.stock <= 0) {
      setDialog({ visible: true, variant: 'info', title: tx('Out of Stock'), message: tx('This gift is currently out of stock. Check back soon!') });
      return;
    }

    setDialog({
      visible: true, variant: 'confirm', icon: '🎁', title: `${tx('Redeem')} ${gift.name}?`,
      message: `${tx('This will use')} ${gift.pointsRequired} ${tx('points from your wallet.')}`,
      confirmLabel: tx('Confirm'),
      onConfirm: async () => {
        try {
          setRedeemingId(gift.id);
          await redeemReward({ schemeId: gift.id, note: gift.name });
          setDialog({
            visible: true, variant: 'success', icon: '🎁', title: tx('Redemption Requested!'),
            message: `${tx('Your request for')} "${gift.name}" ${tx('has been submitted. SRV team will process it shortly.')}`,
          });
        } catch (err: any) {
          setDialog({ visible: true, variant: 'error', title: tx('Redemption Failed'), message: err?.message ?? tx('Please try again.') });
        } finally {
          setRedeemingId(null);
        }
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: darkMode ? cb.darkBg : cb.bg }}>
      {/* Header */}
      {onBack ? (
        <View style={[shared.header, { backgroundColor: darkMode ? cb.darkSurface : cb.surface, borderBottomColor: darkMode ? cb.darkBorder : cb.border, paddingTop: 12 }]}>
          <TouchableOpacity onPress={onBack} style={shared.backBtn} activeOpacity={0.75}>
            <AppIcon name="backArrow" size={22} color={darkMode ? cb.darkText : cb.text} />
          </TouchableOpacity>
          <Text style={[shared.title, { color: darkMode ? cb.darkText : cb.text }]}>{tx('Gift Store')}</Text>
          <View style={{ width: 36 }} />
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={cb.primary} />
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
            <Text style={styles.pointsHintText}>{tx('Scan & earn to redeem gifts')}</Text>
          </View>
        </View>

        {/* Grid */}
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎁</Text>
            <Text style={[styles.emptyTitle, darkMode && { color: cb.darkText }]}>{tx('No gifts available')}</Text>
            <Text style={[styles.emptySub, darkMode && { color: cb.darkMuted }]}>{tx('Check back soon!')}</Text>
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

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 120 },

  // Points banner
  pointsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: cb.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: cb.border,
    ...createShadow({ color: cb.primary, offsetY: 2, blur: 8, opacity: 0.06, elevation: 2 }),
  },
  pointsBannerDark: { backgroundColor: cb.darkSurface, borderColor: cb.darkBorder },
  pointsLabel: { fontSize: 12, fontWeight: '600', color: cb.muted, marginBottom: 4 },
  pointsLabelDark: { color: cb.darkMuted },
  pointsValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pointsValue: { fontSize: 22, fontWeight: '900', color: cb.text },
  pointsValueDark: { color: cb.darkText },
  pointsHint: {
    backgroundColor: cb.softBg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: cb.border,
  },
  pointsHintText: { fontSize: 11, fontWeight: '700', color: cb.primaryDeep },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  // Card
  card: {
    backgroundColor: cb.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cb.border,
    overflow: 'hidden',
    ...createShadow({ color: cb.primary, offsetY: 3, blur: 10, opacity: 0.07, elevation: 3 }),
  },
  cardDark: { backgroundColor: cb.darkSurface, borderColor: cb.darkBorder },
  cardLocked: { opacity: 0.72 },

  // Badge
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
    backgroundColor: cb.primary,
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
    backgroundColor: cb.softBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  imgWrapDark: { backgroundColor: cb.darkSurface },
  img: { width: '100%', height: '100%' },
  imgPlaceholder: { fontSize: 48 },

  // Card body
  cardBody: { padding: 10 },
  giftName: {
    fontSize: 13,
    fontWeight: '800',
    color: cb.text,
    lineHeight: 18,
    marginBottom: 4,
    minHeight: 36,
  },
  giftNameDark: { color: cb.darkText },
  mrp: { fontSize: 11, color: cb.muted, marginBottom: 6 },

  // Points row
  ptsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pts: { fontSize: 14, fontWeight: '900' },
  ptsAffordable: { color: cb.primary },
  ptsLocked: { color: cb.muted },

  // Empty
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: cb.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: cb.muted },
});
