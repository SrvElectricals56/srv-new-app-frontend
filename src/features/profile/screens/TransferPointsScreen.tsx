import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Dialog } from '@/shared/components/Dialog';
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
  const { refreshAll, appSettings } = useAppData();
  const pageContent = useAppPageContent(currentRole, 'transfer_points');
  const [mobile, setMobile] = useState('');
  const [points, setPoints] = useState('');
  const [searching, setSearching] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [foundUser, setFoundUser] = useState<TransferRecipient | null>(null);
  const [searchError, setSearchError] = useState('');
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; onOk?: () => void }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));

  const availablePoints = Math.max(
    Number(user?.totalPoints ?? 0),
    Number(user?.walletBalance ?? 0),
  );

  const handleSearch = async () => {
    if (mobile.trim().length !== 10) {
      setDialog({ visible: true, variant: 'info', title: tx('Invalid number'), message: tx('Please enter a valid 10-digit mobile number.') }); return;
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

  const handleInviteRecipient = async () => {
    const phone = mobile.trim();
    if (phone.length !== 10) {
      setDialog({ visible: true, variant: 'info', title: tx('Invalid number'), message: tx('Please enter a valid 10-digit mobile number.') });
      return;
    }

    const appLink = appSettings?.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.srvelectricals.app';
    const message = encodeURIComponent(
      `SRV Electricals app par account banaiye aur points receive kijiye. App download link: ${appLink}`
    );
    const whatsappUrl = `whatsapp://send?phone=91${phone}&text=${message}`;
    const fallbackUrl = `https://wa.me/91${phone}?text=${message}`;
    try {
      await Linking.openURL(whatsappUrl);
    } catch {
      Linking.openURL(fallbackUrl).catch(() => {
        setDialog({
          visible: true,
          variant: 'info',
          title: tx('Invite link'),
          message: `${tx('Share this app link with receiver')}: ${appLink}`,
        });
      });
    }
  };

  const handleTransfer = async () => {
    const pts = Number(points);
    if (!foundUser) { setDialog({ visible: true, variant: 'info', title: tx('Search first'), message: tx('Please search for a user first.') }); return; }
    if (!pts || pts <= 0) { setDialog({ visible: true, variant: 'info', title: tx('Invalid amount'), message: tx('Enter valid points to transfer.') }); return; }
    if (pts > availablePoints) { setDialog({ visible: true, variant: 'info', title: tx('Insufficient points'), message: tx('You do not have enough points.') }); return; }

    setTransferring(true);
    try {
      await walletApi.transferPoints({ receiverPhone: foundUser.phone, points: pts });
      await Promise.allSettled([refreshProfile(), refreshAll()]);
      setDialog({ visible: true, variant: 'success', title: tx('Success'), message: `${pts} ${tx('points transferred to')} ${foundUser.name}`, onOk: () => { closeDialog(); setMobile(''); setPoints(''); setFoundUser(null); } });
    } catch (err: any) {
      setDialog({ visible: true, variant: 'error', title: tx('Transfer failed'), message: err?.message ?? tx('Please try again.') });
    } finally {
      setTransferring(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <PageHeader title={pageContent.pageTitle || t('transferPoint')} onBack={onBack} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
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
            <View style={[styles.inviteBox, { backgroundColor: '#FFF7ED', borderColor: '#FDBA74' }]}>
              <View style={styles.resultBoxInner}>
                <AppIcon name="warning" size={18} color="#C2410C" />
                <Text style={[styles.resultText, { color: '#9A3412' }]}>{searchError}</Text>
              </View>
              <Text style={[styles.inviteHelpText, { color: theme.textSecondary }]}>
                {tx('This number is not registered. Send app link so they can create account, then transfer points to this number.')}
              </Text>
              <TouchableOpacity
                style={[styles.inviteBtn, { backgroundColor: theme.accent }]}
                activeOpacity={0.85}
                onPress={handleInviteRecipient}
              >
                <AppIcon name="whatsapp" size={18} color="#FFFFFF" />
                <Text style={styles.inviteBtnText}>{tx('Send App Link')}</Text>
              </TouchableOpacity>
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
      <Dialog visible={dialog.visible} variant={dialog.variant} title={dialog.title} message={dialog.message} onClose={closeDialog} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 16, paddingBottom: 140 },
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
  resultBoxInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultText: { fontSize: 14, fontWeight: '700', flex: 1 },
  inviteBox: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  inviteHelpText: { fontSize: 12, lineHeight: 18, fontWeight: '600' },
  inviteBtn: { minHeight: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  inviteBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
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
