import React, { useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppIcon, C, PageHeader, Screen } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { walletApi, type TransferRecipient } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppData } from '@/shared/context/AppDataContext';
import { useAppPageContent } from '@/shared/hooks';

const transferImage = require('../assets/transfer.png');

export function TransferPointsPage({
  onBack,
  onNavigate,
  currentRole,
}: {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
  currentRole: 'dealer' | 'electrician' | 'user' | 'counterboy';
}) {
  const { t, tx, theme } = usePreferenceContext();
  const { user, refreshProfile } = useAuth();
  const { refreshAll } = useAppData();
  const pageContent = useAppPageContent(currentRole, 'transfer_points');
  const [mobile, setMobile] = useState('');
  const [points, setPoints] = useState('');
  const [searching, setSearching] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [foundUser, setFoundUser] = useState<TransferRecipient | null>(null);
  const [searchError, setSearchError] = useState('');

  const availablePoints = Math.max(
    Number(user?.totalPoints ?? 0),
    Number(user?.walletBalance ?? 0),
  );

  const handleSearch = async () => {
    if (mobile.trim().length !== 10) {
      return Alert.alert(tx('Invalid number'), tx('Please enter a valid 10-digit mobile number.'));
    }
    setSearching(true);
    setFoundUser(null);
    setSearchError('');
    try {
      const res = await walletApi.lookupTransferRecipient(mobile.trim());
      setFoundUser(res);
    } catch (err: any) {
      setSearchError(err?.message ?? tx('User not found with this number'));
    } finally {
      setSearching(false);
    }
  };

  const handleTransfer = async () => {
    const pts = Number(points);
    if (!foundUser) return Alert.alert(tx('Search first'), tx('Please search for a user first.'));
    if (!pts || pts <= 0) return Alert.alert(tx('Invalid amount'), tx('Enter valid points to transfer.'));
    if (pts > availablePoints) return Alert.alert(tx('Insufficient points'), tx('You do not have enough points.'));

    setTransferring(true);
    try {
      await walletApi.transferPoints({ receiverPhone: foundUser.phone, points: pts });
      await Promise.allSettled([refreshProfile(), refreshAll()]);
      Alert.alert(tx('Success'), `${pts} ${tx('points transferred to')} ${foundUser.name}`);
      setMobile('');
      setPoints('');
      setFoundUser(null);
    } catch (err: any) {
      Alert.alert(tx('Transfer failed'), err?.message ?? tx('Please try again.'));
    } finally {
      setTransferring(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('transferPoint')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.posterCard,
            {
              borderColor: theme.border,
              backgroundColor: theme.surface,
            },
          ]}
        >
          <Image source={transferImage} style={styles.heroImage} resizeMode="contain" />
        </View>

        {/* Balance pill */}
        <View style={[styles.balanceCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <AppIcon name="star" size={18} color={theme.accent} />
          <Text style={[styles.balanceLabel, { color: theme.textMuted }]}>{pageContent.cardTitle || tx('Available Points')}</Text>
          <Text style={[styles.balanceValue, { color: theme.textPrimary }]}>{availablePoints.toLocaleString('en-IN')}</Text>
        </View>

        {/* Search user */}
        <View style={[styles.searchCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{pageContent.inputLabel || tx('Receiver Mobile Number')}</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.textPrimary }]}
              placeholder={pageContent.searchPlaceholder || tx('Enter 10-digit mobile number')}
              placeholderTextColor={theme.textMuted}
              value={mobile}
              onChangeText={(v) => { setMobile(v.replace(/\D/g, '').slice(0, 10)); setFoundUser(null); setSearchError(''); }}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <TouchableOpacity style={[styles.searchBtn, { backgroundColor: theme.accent }]} onPress={handleSearch} activeOpacity={0.85} disabled={searching}>
              {searching ? <ActivityIndicator color="#fff" size="small" /> : <AppIcon name="search" size={20} color="#fff" />}
            </TouchableOpacity>
          </View>

          {foundUser && (
            <View style={[styles.resultBox, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
              <AppIcon name="refer" size={18} color={C.success} />
              <Text style={[styles.resultText, { color: '#166534' }]}>
                {foundUser.name} ({foundUser.role}) (+91 {foundUser.phone})
              </Text>
            </View>
          )}
          {searchError ? (
            <View style={[styles.resultBox, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
              <AppIcon name="warning" size={18} color="#BE123C" />
              <Text style={[styles.resultText, { color: '#BE123C' }]}>{searchError}</Text>
            </View>
          ) : null}
        </View>

        {/* Points input */}
        {foundUser && (
          <View style={[styles.searchCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>{tx('Points to Transfer')}</Text>
            <TextInput
              style={[styles.searchInput, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.textPrimary, width: '100%' }]}
              placeholder={tx('Enter points amount')}
              placeholderTextColor={theme.textMuted}
              value={points}
              onChangeText={(v) => setPoints(v.replace(/\D/g, ''))}
              keyboardType="number-pad"
            />
            <TouchableOpacity
              style={[styles.transferBtn, { backgroundColor: theme.accent, opacity: transferring ? 0.7 : 1 }]}
              onPress={handleTransfer}
              activeOpacity={0.85}
              disabled={transferring}
            >
              {transferring
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.transferBtnText}>{pageContent.primaryCtaLabel || tx('Transfer Points')}</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {currentRole === 'electrician' ? (
          <View
            style={[
              styles.scannerCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.scannerHeader}>
              <View style={styles.scannerIconWrap}>
                <AppIcon name="scan" size={28} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.scannerTitleWhite, { color: theme.textPrimary }]}>{tx('Scan & Transfer')}</Text>
                <Text style={[styles.scannerSubWhite, { color: theme.textSecondary }]}>{pageContent.supportText || tx('Scan any SRV product QR to transfer points to dealers instantly.')}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.scanQrBtnWhite, { backgroundColor: theme.accentSoft }]}
              onPress={() => onNavigate('scan')}
              activeOpacity={0.85}
            >
              <Text style={[styles.scanQrBtnText, { color: theme.accent }]}>{pageContent.secondaryCtaLabel || tx('Open Scanner')}</Text>
              <AppIcon name="chevronRight" size={20} color={theme.accent} />
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 16, paddingBottom: 32 },
  posterCard: { alignItems: 'center', justifyContent: 'center', borderRadius: 28, borderWidth: 1, paddingVertical: 18, overflow: 'hidden' },
  heroImage: { width: 310, height: 200, maxWidth: '100%' },
  balanceCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, borderWidth: 1, padding: 16 },
  balanceLabel: { flex: 1, fontSize: 13, fontWeight: '700' },
  balanceValue: { fontSize: 20, fontWeight: '900' },
  sectionLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  searchCard: { borderRadius: 24, borderWidth: 1, padding: 16, gap: 12 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchInput: { flex: 1, height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 14, fontWeight: '600' },
  searchBtn: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  resultBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  resultText: { fontSize: 14, fontWeight: '700', flex: 1 },
  transferBtn: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  transferBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  scannerCard: { borderRadius: 24, padding: 20, gap: 16, borderWidth: 1 },
  scannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scannerIconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#EAF3FF', alignItems: 'center', justifyContent: 'center' },
  scannerTitleWhite: { fontSize: 18, fontWeight: '900' },
  scannerSubWhite: { fontSize: 13, marginTop: 4, lineHeight: 18 },
  scanQrBtnWhite: { backgroundColor: '#fff', borderRadius: 18, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  scanQrBtnText: { fontSize: 15, fontWeight: '800' },
});
