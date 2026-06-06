import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { offersApi } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';
import { formatISTDate } from '@/shared/utils/dateIST';

export function OffersPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'offers');
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<
    { id: string; title: string; body: string; tag: string; validTo?: string }[]
  >([]);

  useEffect(() => {
    offersApi.getAll().then((res) => {
      const data = res.data ?? [];
      setOffers(
        data.map((o: any) => ({
          id: String(o.id),
          title: o.title ?? '',
          body: o.description ?? '',
          tag: o.status === 'active' ? 'Live' : o.status === 'scheduled' ? 'New' : 'Expired',
          validTo: o.validTo,
        }))
      );
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('offer')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 32 }} />
        ) : offers.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {pageContent.emptyStateTitle || tx('No active offers right now. Check back soon!')}
            </Text>
          </View>
        ) : (
          offers.map((offer, index) => (
            <View
              key={offer.id}
              style={[
                styles.offerCard,
                {
                  backgroundColor: index === 0 ? '#FFF4E8' : theme.surface,
                  borderColor: index === 0 ? '#F7D9A8' : theme.border,
                },
              ]}
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
              <Text style={[styles.offerBody, { color: theme.textSecondary }]}>{tx(offer.body)}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14, paddingBottom: 32 },
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
  emptyCard: {
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
