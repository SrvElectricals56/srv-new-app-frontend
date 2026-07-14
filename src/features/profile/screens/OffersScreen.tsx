import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { offersApi } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';
import { formatISTDate } from '@/shared/utils/dateIST';

const FIREWORK_COLORS = ['#FFF7CC', '#FDE68A', '#FACC15', '#F59E0B', '#FFFFFF', '#FB923C', '#EF4444', '#FFD700'];
const FIREWORK_PARTICLES = Array.from({ length: 72 }, (_, index) => {
  const side = index % 2 === 0 ? 'left' : 'right';
  const lane = Math.floor(index / 2);
  const distance = 38 + (lane % 18) * 13;
  const spread = -92 + (lane % 9) * 24 + Math.floor(lane / 9) * 10;
  const size = 4 + (lane % 4);
  const rotate = side === 'left' ? -46 + (lane % 8) * 13 : 46 - (lane % 8) * 13;
  return {
    side,
    x: side === 'left' ? distance : -distance,
    y: spread,
    color: FIREWORK_COLORS[index % FIREWORK_COLORS.length],
    size,
    rotate: `${rotate}deg`,
  };
});
const OFFER_CONFETTI = Array.from({ length: 18 }, (_, index) => {
  const side = index % 2 === 0 ? 'left' : 'right';
  const lane = Math.floor(index / 2);
  return {
    side,
    x: side === 'left' ? 64 + lane * 18 : -64 - lane * 18,
    y: -42 + (lane % 5) * 34,
    rotate: `${side === 'left' ? -26 + lane * 7 : 26 - lane * 7}deg`,
    color: index % 3 === 0 ? '#DC2626' : index % 3 === 1 ? '#F59E0B' : '#16A34A',
    label: index % 3 === 0 ? '%' : index % 3 === 1 ? 'OFF' : 'DEAL',
  };
});

export function OffersPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'offers');
  const fireworkAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState<
    {
      id: string;
      title: string;
      body: string;
      tag: string;
      validFrom?: string;
      validTo?: string;
      discount?: string | null;
      bonusPoints?: number;
      imageUrl?: string | null;
      termsAndConditions?: string | null;
      productCategory?: string | null;
    }[]
  >([]);
  const [selectedOffer, setSelectedOffer] = useState<(typeof offers)[number] | null>(null);

  const openOffer = (offer: (typeof offers)[number]) => {
    setSelectedOffer(offer);
  };

  const loadOffers = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await offersApi.getAll(role ?? undefined);
      const data = res.data ?? [];
      setOffers(
        data.map((o: any) => ({
          id: String(o.id),
          title: o.title ?? '',
          body: o.description ?? '',
          tag: o.status === 'active' ? 'Live' : o.status === 'scheduled' ? 'New' : 'Expired',
          validFrom: o.validFrom,
          validTo: o.validTo,
          discount: o.discount,
          bonusPoints: Number(o.bonusPoints ?? 0),
          imageUrl: o.imageUrl,
          termsAndConditions: o.termsAndConditions,
          productCategory: o.productCategory,
        }))
      );
    } catch {
      if (showLoading) setOffers([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [role]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadOffers(false);
    } finally {
      setRefreshing(false);
    }
  }, [loadOffers]);

  useEffect(() => {
    if (!selectedOffer) return;
    fireworkAnim.stopAnimation();
    fireworkAnim.setValue(0);
    Animated.sequence([
      Animated.delay(80),
      Animated.timing(fireworkAnim, {
        toValue: 1,
        duration: 2800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fireworkAnim, selectedOffer]);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  if (selectedOffer) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <PageHeader title={tx('Offer Details')} onBack={() => setSelectedOffer(null)} />
        <View pointerEvents="none" style={styles.fireworkLayer}>
          {(['left', 'right'] as const).map((side) => (
            <View key={side}>
              <Animated.View
                style={[
                  styles.fireworkGlow,
                  side === 'left' ? styles.fireworkOriginLeft : styles.fireworkOriginRight,
                  {
                    opacity: fireworkAnim.interpolate({
                      inputRange: [0, 0.12, 0.58, 1],
                      outputRange: [0, 0.95, 0.35, 0],
                    }),
                    transform: [
                      {
                        scale: fireworkAnim.interpolate({
                          inputRange: [0, 0.18, 1],
                          outputRange: [0.3, 1.45, 2.6],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.fireworkRing,
                  side === 'left' ? styles.fireworkOriginLeft : styles.fireworkOriginRight,
                  {
                    opacity: fireworkAnim.interpolate({
                      inputRange: [0, 0.18, 0.62, 1],
                      outputRange: [0, 0.9, 0.28, 0],
                    }),
                    transform: [
                      {
                        scale: fireworkAnim.interpolate({
                          inputRange: [0, 0.28, 1],
                          outputRange: [0.2, 1.35, 3.2],
                        }),
                      },
                    ],
                  },
                ]}
              />
            </View>
          ))}
          {FIREWORK_PARTICLES.map((particle, index) => (
            <Animated.View
              key={`${particle.side}-${index}`}
              style={[
                styles.fireworkParticle,
                particle.side === 'left' ? styles.fireworkParticleLeft : styles.fireworkParticleRight,
                {
                  width: particle.size,
                  height: particle.size * 3.8,
                  borderRadius: particle.size,
                  backgroundColor: particle.color,
                  opacity: fireworkAnim.interpolate({
                    inputRange: [0, 0.08, 0.72, 1],
                    outputRange: [0, 1, 0.9, 0],
                  }),
                  transform: [
                    {
                      translateX: fireworkAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, particle.x],
                      }),
                    },
                    {
                      translateY: fireworkAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, particle.y],
                      }),
                    },
                    {
                      scale: fireworkAnim.interpolate({
                        inputRange: [0, 0.16, 1],
                        outputRange: [0.3, 1.35, 0.74],
                      }),
                    },
                    { rotate: particle.rotate },
                  ],
                },
              ]}
            />
          ))}
          {OFFER_CONFETTI.map((piece, index) => (
            <Animated.View
              key={`offer-confetti-${index}`}
              style={[
                styles.offerConfetti,
                piece.side === 'left' ? styles.fireworkParticleLeft : styles.fireworkParticleRight,
                {
                  backgroundColor: piece.color,
                  opacity: fireworkAnim.interpolate({
                    inputRange: [0, 0.12, 0.78, 1],
                    outputRange: [0, 1, 0.92, 0],
                  }),
                  transform: [
                    {
                      translateX: fireworkAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, piece.x],
                      }),
                    },
                    {
                      translateY: fireworkAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, piece.y],
                      }),
                    },
                    {
                      scale: fireworkAnim.interpolate({
                        inputRange: [0, 0.2, 1],
                        outputRange: [0.55, 1.08, 0.82],
                      }),
                    },
                    { rotate: piece.rotate },
                  ],
                },
              ]}
            >
              <Text style={styles.offerConfettiText}>{piece.label}</Text>
            </Animated.View>
          ))}
          <Animated.View
            style={[
              styles.bumperBadge,
              {
                opacity: fireworkAnim.interpolate({
                  inputRange: [0, 0.18, 0.72, 1],
                  outputRange: [0, 1, 1, 0],
                }),
                transform: [
                  {
                    translateY: fireworkAnim.interpolate({
                      inputRange: [0, 0.3, 1],
                      outputRange: [-12, 0, -8],
                    }),
                  },
                  {
                    scale: fireworkAnim.interpolate({
                      inputRange: [0, 0.24, 1],
                      outputRange: [0.82, 1.06, 0.96],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.bumperBadgeText}>{tx('Bumper Offer')}</Text>
          </Animated.View>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.detailHero, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {selectedOffer.imageUrl ? (
              <Image source={{ uri: selectedOffer.imageUrl }} style={styles.detailImage} />
            ) : (
              <View style={styles.detailImageFallback}>
                <AppIcon name="offer" size={34} color={C.gold} />
              </View>
            )}
            <View style={styles.detailHeaderRow}>
              <View style={styles.detailIcon}>
                <AppIcon name="offer" size={22} color={C.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.detailTitle, { color: theme.textPrimary }]}>{tx(selectedOffer.title)}</Text>
                <Text style={[styles.detailSub, { color: theme.textMuted }]}>
                  {selectedOffer.validTo ? `${tx('Valid till')}: ${formatISTDate(selectedOffer.validTo)}` : tx('Limited period offer')}
                </Text>
              </View>
              <View style={styles.offerTag}>
                <Text style={styles.offerTagText}>{tx(selectedOffer.tag)}</Text>
              </View>
            </View>
            <Text style={[styles.detailBody, { color: theme.textSecondary }]}>{tx(selectedOffer.body)}</Text>
          </View>

          <View style={styles.detailGrid}>
            <View style={[styles.detailInfoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{tx('Discount')}</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {selectedOffer.discount || tx('Special offer')}
              </Text>
            </View>
            <View style={[styles.detailInfoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.infoLabel, { color: theme.textMuted }]}>{tx('Bonus Points')}</Text>
              <Text style={[styles.infoValue, { color: theme.textPrimary }]}>
                {Number(selectedOffer.bonusPoints || 0).toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={[styles.detailSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{tx('Offer Validity')}</Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              {selectedOffer.validFrom ? `${tx('Starts')}: ${formatISTDate(selectedOffer.validFrom)}` : tx('Available now')}
            </Text>
            <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
              {selectedOffer.validTo ? `${tx('Ends')}: ${formatISTDate(selectedOffer.validTo)}` : tx('End date will be updated soon')}
            </Text>
            {selectedOffer.productCategory ? (
              <Text style={[styles.sectionText, { color: theme.textSecondary }]}>
                {tx('Category')}: {selectedOffer.productCategory}
              </Text>
            ) : null}
          </View>

          {selectedOffer.termsAndConditions ? (
            <View style={[styles.detailSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{tx('Terms & Conditions')}</Text>
              <Text style={[styles.sectionText, { color: theme.textSecondary }]}>{selectedOffer.termsAndConditions}</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('offer')} onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={C.primary}
            colors={[C.primary]}
            progressBackgroundColor={theme.surface}
          />
        }
      >
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 32 }} />
        ) : offers.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.emptyIcon}>
              <AppIcon name="offer" size={34} color={C.gold} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
              {pageContent.emptyStateTitle || tx('Offers coming soon')}
            </Text>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {pageContent.emptyStateSubtitle || tx('New SRV offers and promotions will appear here as soon as they are available.')}
            </Text>
          </View>
        ) : (
          offers.map((offer, index) => (
            <TouchableOpacity
              key={offer.id}
              style={[
                styles.offerCard,
                {
                  backgroundColor: index === 0 ? '#FFF4E8' : theme.surface,
                  borderColor: index === 0 ? '#F7D9A8' : theme.border,
                },
              ]}
              activeOpacity={0.86}
              onPress={() => openOffer(offer)}
            >
              <View style={styles.offerHead}>
                <View
                  style={[
                    styles.offerIcon,
                    { backgroundColor: index === 0 ? '#FFE8C4' : C.goldLight },
                  ]}
                >
                  <AppIcon name="offer" size={20} color={C.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.offerTitle, { color: theme.textPrimary }]}>
                    {tx(offer.title)}
                  </Text>
                  {offer.validTo && (
                    <Text style={[styles.offerId, { color: theme.textMuted }]}>
                      Valid till: {formatISTDate(offer.validTo)}
                    </Text>
                  )}
                </View>
                <View style={styles.offerTag}>
                  <Text style={styles.offerTagText}>{tx(offer.tag)}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={[styles.viewDetailsText, { color: C.primary }]}>{tx('View details')}</Text>
                <AppIcon name="chevronRight" size={14} color={C.primary} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  fireworkLayer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    height: 190,
    zIndex: 20,
  },
  fireworkGlow: {
    position: 'absolute',
    top: 48,
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(250,204,21,0.44)',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.82,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  fireworkRing: {
    position: 'absolute',
    top: 48,
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2.4,
    borderColor: 'rgba(245,158,11,0.88)',
    backgroundColor: 'transparent',
  },
  fireworkOriginLeft: {
    left: 14,
  },
  fireworkOriginRight: {
    right: 14,
  },
  fireworkParticle: {
    position: 'absolute',
    top: 82,
    shadowColor: '#FACC15',
    shadowOpacity: 0.65,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 0 },
  },
  fireworkParticleLeft: {
    left: 56,
  },
  fireworkParticleRight: {
    right: 56,
  },
  offerConfetti: {
    position: 'absolute',
    top: 84,
    minWidth: 30,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  offerConfettiText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  bumperBadge: {
    position: 'absolute',
    top: 110,
    alignSelf: 'center',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#7C2D12',
    borderWidth: 1.5,
    borderColor: '#FACC15',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  bumperBadgeText: { color: '#FFF7CC', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  offerCard: { borderRadius: 24, borderWidth: 1, padding: 18, gap: 14 },
  offerHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  offerIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerTitle: { fontSize: 15, fontWeight: '800' },
  offerId: { fontSize: 12, marginTop: 3 },
  offerTag: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.primaryLight,
  },
  offerTagText: { color: C.primary, fontSize: 11, fontWeight: '800' },
  offerBody: { fontSize: 13, lineHeight: 21, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  viewDetailsText: { fontSize: 12, fontWeight: '900' },
  detailHero: { borderRadius: 28, borderWidth: 1, padding: 16, gap: 14 },
  detailImage: { width: '100%', height: 170, borderRadius: 20, resizeMode: 'cover' },
  detailImageFallback: {
    width: '100%',
    height: 150,
    borderRadius: 20,
    backgroundColor: '#FFF4E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: C.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitle: { fontSize: 20, fontWeight: '900', lineHeight: 26 },
  detailSub: { fontSize: 12, marginTop: 4, fontWeight: '700' },
  detailBody: { fontSize: 14, lineHeight: 22, fontWeight: '600' },
  detailGrid: { flexDirection: 'row', gap: 12 },
  detailInfoCard: { flex: 1, borderRadius: 20, borderWidth: 1, padding: 16 },
  infoLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  infoValue: { fontSize: 16, fontWeight: '900', marginTop: 6 },
  detailSection: { borderRadius: 22, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '900', marginBottom: 8 },
  sectionText: { fontSize: 13, lineHeight: 20, fontWeight: '600', marginTop: 4 },
  emptyCard: {
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#FFF4E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 19, fontWeight: '900', textAlign: 'center' },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
