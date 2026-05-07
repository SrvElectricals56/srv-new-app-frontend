import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useEffect, useState } from 'react';
import { usePreferenceContext } from '@/shared/preferences';
import { colors } from '@/shared/theme/colors';
import { createShadow } from '@/shared/theme/shadows';
import type { Screen, UserRole } from '@/shared/types/navigation';
import type { RewardHistoryItem } from '@/shared/types/rewards';
import { walletApi } from '@/shared/api';

type WalletScreenProps = {
  role?: UserRole;
  onNavigate?: (screen: Screen) => void;
  totalPoints?: number;
  totalScans?: number;
  historyItems?: RewardHistoryItem[];
};

function BackIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5L8 12L15 19"
        stroke="#FFFFFF"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HistoryGlyph() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 7V12L15.5 14"
        stroke="#7A4A22"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 12A8 8 0 1 1 17.66 6.34"
        stroke="#7A4A22"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 4V9H15"
        stroke="#7A4A22"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GiftIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="10" width="16" height="9" rx="2.5" stroke="#6B3E16" strokeWidth={1.8} />
      <Path
        d="M12 10V19M4 13H20M12 10H9.8C8.81 10 8 9.19 8 8.2C8 7.21 8.81 6.4 9.8 6.4C11.78 6.4 12 10 12 10ZM12 10H14.2C15.19 10 16 9.19 16 8.2C16 7.21 15.19 6.4 14.2 6.4C12.22 6.4 12 10 12 10Z"
        stroke="#6B3E16"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TransferIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 7H19M19 7L15.5 3.5M19 7L15.5 10.5"
        stroke="#234975"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 17H5M5 17L8.5 13.5M5 17L8.5 20.5"
        stroke="#234975"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SparkIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12.5 3L6.5 12H11L10.5 21L17.5 10.5H13L12.5 3Z" fill="#B53324" />
    </Svg>
  );
}

type ApiTxItem = {
  id: string;
  title: string;
  time: string;
  points: string;
  accent: string;
};

// ── Role-wise theme tokens ────────────────────────────────────────────
const ROLE_THEME = {
  dealer: {
    heroGradient: ['#7C3A00', '#B45309', '#D97706'] as [string, string, string],
    heroShadow: '#7C3A00',
    eyebrowColor: '#FDE3B8',
    screenBg: '#FBF5EC',
    cardBorder: '#EDD9B8',
    cardShadow: '#B45309',
    sectionEyebrow: '#B45309',
    sectionIconBg: '#FFF1D6',
    actionTileBg: '#FFF8EE',
    actionTileBorder: '#F0DDB8',
    timelineCardBg: '#FBF5EC',
    timelineCardBorder: '#EDD9B8',
    emptyStateBg: '#FFF8EE',
    emptyStateBorder: '#F0DDB8',
    emptyIconBg: '#FDE8C0',
    emptyTitleColor: '#92400E',
    paginationBtnBg: '#B45309',
    paginationBtnDisabledBg: '#EDD9B8',
    paginationBtnDisabledText: '#B45309',
    paginationInfoBg: '#FBF5EC',
    storeIconWrapBg: '#FFF0DA',
  },
  electrician: {
    heroGradient: ['#1E3A8A', '#2563EB', '#60A5FA'] as [string, string, string],
    heroShadow: '#1E3A8A',
    eyebrowColor: '#BFDBFE',
    screenBg: '#EFF4FB',
    cardBorder: '#DBEAFE',
    cardShadow: '#2563EB',
    sectionEyebrow: '#2563EB',
    sectionIconBg: '#EFF6FF',
    actionTileBg: '#F0F7FF',
    actionTileBorder: '#DBEAFE',
    timelineCardBg: '#F0F7FF',
    timelineCardBorder: '#DBEAFE',
    emptyStateBg: '#EFF6FF',
    emptyStateBorder: '#DBEAFE',
    emptyIconBg: '#DBEAFE',
    emptyTitleColor: '#1D4ED8',
    paginationBtnBg: '#2563EB',
    paginationBtnDisabledBg: '#DBEAFE',
    paginationBtnDisabledText: '#2563EB',
    paginationInfoBg: '#EFF6FF',
    storeIconWrapBg: '#DBEAFE',
  },
  user: {
    heroGradient: ['#3D4A1A', '#6B7C2D', '#8FA83C'] as [string, string, string],
    heroShadow: '#3D4A1A',
    eyebrowColor: '#E4EDB8',
    screenBg: '#F5F7EC',
    cardBorder: '#D8E4A8',
    cardShadow: '#6B7C2D',
    sectionEyebrow: '#6B7C2D',
    sectionIconBg: '#EEF3D0',
    actionTileBg: '#F5F8E8',
    actionTileBorder: '#D8E4A8',
    timelineCardBg: '#F5F8E8',
    timelineCardBorder: '#D8E4A8',
    emptyStateBg: '#EEF3D0',
    emptyStateBorder: '#D8E4A8',
    emptyIconBg: '#D8E4A8',
    emptyTitleColor: '#4A5A1A',
    paginationBtnBg: '#6B7C2D',
    paginationBtnDisabledBg: '#D8E4A8',
    paginationBtnDisabledText: '#6B7C2D',
    paginationInfoBg: '#EEF3D0',
    storeIconWrapBg: '#EEF3D0',
  },
};

export function WalletScreen({
  role = 'electrician',
  onNavigate,
  totalPoints: propTotalPoints = 0,
  totalScans: propTotalScans = 0,
  historyItems = [],
}: WalletScreenProps) {
  const { darkMode, tx } = usePreferenceContext();
  const isDealer = role === 'dealer';
  const t = ROLE_THEME[role] ?? ROLE_THEME.electrician;

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Real API wallet data
  const [apiBalance, setApiBalance] = useState<number | null>(null);
  const [apiTotalScans, setApiTotalScans] = useState<number | null>(null);
  const [apiTxItems, setApiTxItems] = useState<ApiTxItem[] | null>(null);
  const [apiLoading, setApiLoading] = useState(true);

  useEffect(() => {
    walletApi.get(1, 50).then((res) => {
      setApiBalance(res.totalPoints ?? res.balance ?? null);
      setApiTotalScans(res.totalScans ?? null);
      if (res.transactions?.data?.length) {
        const mapped: ApiTxItem[] = res.transactions.data.map((tx: any) => ({
          id: tx.id,
          title: tx.description ?? (tx.source === 'scan' ? 'Product scanned' : tx.source === 'redemption' ? 'Redemption processed' : tx.source === 'bonus' ? 'Bonus credited' : tx.source === 'transfer' ? 'Points transferred' : 'Transaction'),
          time: tx.createdAt ? new Date(tx.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '',
          points: tx.type === 'credit' ? `+${tx.amount}` : `-${tx.amount}`,
          accent: tx.type === 'credit' ? '#1F9C5D' : '#B44A3A',
        }));
        setApiTxItems(mapped);
      }
    }).catch(() => {}).finally(() => setApiLoading(false));
  }, []);

  const totalPoints = apiBalance ?? propTotalPoints;
  const totalScans = apiTotalScans ?? propTotalScans;

  const allMappedItems: ApiTxItem[] = apiTxItems ?? (isDealer
    ? []
    : historyItems.map((item) => ({
        id: item.id,
        title: item.mode === 'multi' ? `${item.label} batch credited` : `${item.label} scanned`,
        time: item.time,
        points: `+${item.points}`,
        accent: '#1F9C5D',
      })));

  const totalPages = Math.ceil(allMappedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = allMappedItems.slice(startIndex, startIndex + itemsPerPage);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const dealerActions = [
    {
      id: 'bank',
      label: 'Bank Transfer',
      detail: 'Fast withdrawal',
      icon: TransferIcon,
      tint: '#DDEAFE',
      target: 'bank_details' as Screen,
    },
    {
      id: 'bonus',
      label: 'Dealer Bonus',
      detail: '5% electrician bonus',
      icon: SparkIcon,
      tint: '#FFE0DA',
      target: 'dealer_bonus' as Screen,
    },
  ];

  const electricianActions = [
    {
      id: 'buy',
      label: 'Buy Schemes',
      detail: 'Premium offers',
      icon: GiftIcon,
      tint: '#FBE4CC',
      target: 'rewards' as Screen,
    },
    {
      id: 'bank',
      label: 'Bank Transfer',
      detail: 'Fast withdrawal',
      icon: TransferIcon,
      tint: '#DDEAFE',
      target: 'bank_details' as Screen,
    },
    {
      id: 'point',
      label: 'Transfer Point',
      detail: 'Send to dealer',
      icon: SparkIcon,
      tint: '#FFE0DA',
      target: 'transfer_points' as Screen,
    },
  ];

  const actions = isDealer ? dealerActions : electricianActions;

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: darkMode ? '#08111F' : t.screenBg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={t.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroCard, createShadow({ color: t.heroShadow, offsetY: 14, blur: 24, opacity: 0.22, elevation: 8 })]}
      >
        <View style={styles.heroGlow} />
        <View style={styles.heroHeader}>
          <Pressable onPress={() => onNavigate?.('home')} style={styles.backButton}>
            <BackIcon />
            <Text style={styles.backLabel}>{tx('Home')}</Text>
          </Pressable>
          <Pressable onPress={() => onNavigate?.('rewards')} style={styles.storeButton}>
            <View style={[styles.storeIconWrap, { backgroundColor: t.storeIconWrapBg }]}>
              <GiftIcon />
            </View>
          </Pressable>
        </View>

        <Text style={[styles.eyebrow, { color: t.eyebrowColor }]}>
          {tx(isDealer ? 'SRV Dealer Wallet' : role === 'user' ? 'SRV User Wallet' : 'SRV Premium Wallet')}
        </Text>
        <Text style={styles.heroTitle}>
          {totalPoints} {tx(isDealer ? 'Dealer Bonus Points' : 'Total Points')}
        </Text>
        <Text style={styles.heroSub}>
          {tx(
            isDealer
              ? 'Dealer wallet for schemes, bank payouts, and dealer bonus tracking.'
              : role === 'user'
              ? 'Your rewards dashboard for redemptions and loyalty growth.'
              : 'Premium rewards dashboard for redemptions, transfers, and loyalty growth.'
          )}
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatLabel}>
              {tx(isDealer ? 'Active Electricians' : 'Total Scans')}
            </Text>
            <Text style={styles.heroStatValue}>{apiLoading ? '...' : String(totalScans)}</Text>
          </View>
          <View style={styles.heroStatCard}>
            <Text style={styles.heroStatLabel}>
              {tx(isDealer ? 'Bonus Withdrawals' : 'Transactions')}
            </Text>
            <Text style={styles.heroStatValue}>
              {apiLoading ? '...' : String(allMappedItems.length)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={[styles.card, { borderColor: darkMode ? '#243043' : t.cardBorder, backgroundColor: darkMode ? '#111827' : '#FFFDFC' }, createShadow({ color: darkMode ? '#020617' : t.cardShadow, offsetY: 8, blur: 18, opacity: 0.08, elevation: 4 })]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: darkMode ? t.eyebrowColor : t.sectionEyebrow }]}>
              {tx('Quick Actions')}
            </Text>
            <Text style={[styles.sectionTitle, darkMode ? styles.sectionTitleDark : null]}>
              {tx(isDealer ? 'Manage dealer payouts' : 'Move your wallet faster')}
            </Text>
          </View>
          <View style={[styles.sectionIconWrap, { backgroundColor: darkMode ? '#1E293B' : t.sectionIconBg }]}>
            <SparkIcon />
          </View>
        </View>
        <View style={styles.actionGrid}>
          {actions.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.actionTile, { backgroundColor: darkMode ? '#182133' : t.actionTileBg, borderColor: darkMode ? '#243043' : t.actionTileBorder }]}
                activeOpacity={0.86}
                onPress={() => onNavigate?.(item.target)}
              >
                <View style={[styles.actionIconWrap, { backgroundColor: item.tint }]}>
                  <Icon />
                </View>
                <Text style={[styles.actionTileText, darkMode ? styles.actionTileTextDark : null]}>
                  {tx(item.label)}
                </Text>
                <Text style={[styles.actionTileSub, darkMode ? styles.actionTileSubDark : null]}>
                  {tx(item.detail)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { borderColor: darkMode ? '#243043' : t.cardBorder, backgroundColor: darkMode ? '#111827' : '#FFFDFC' }, createShadow({ color: darkMode ? '#020617' : t.cardShadow, offsetY: 8, blur: 18, opacity: 0.08, elevation: 4 })]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: darkMode ? t.eyebrowColor : t.sectionEyebrow }]}>
              {tx('Redeem Point History')}
            </Text>
            <Text style={[styles.sectionTitle, darkMode ? styles.sectionTitleDark : null]}>
              {tx('Activity Timeline')}
            </Text>
          </View>
          <View style={[styles.sectionIconWrap, { backgroundColor: darkMode ? '#1E293B' : t.sectionIconBg }]}>
            <HistoryGlyph />
          </View>
        </View>

        <View style={styles.timeline}>
          {paginatedItems.map((item) => (
            <View key={item.id} style={styles.timelineItem}>
              <View style={styles.timelineTrack}>
                <View style={[styles.timelineDot, { backgroundColor: item.accent }]} />
              </View>
              <View style={[styles.timelineCard, { backgroundColor: darkMode ? '#182133' : t.timelineCardBg, borderColor: darkMode ? '#243043' : t.timelineCardBorder }]}>
                <View style={styles.timelineTop}>
                  <Text style={[styles.timelineTitle, darkMode ? styles.timelineTitleDark : null]}>
                    {tx(item.title)}
                  </Text>
                  <Text style={[styles.timelinePoints, { color: item.accent }]}>{item.points}</Text>
                </View>
                <Text style={[styles.timelineTime, darkMode ? styles.timelineTimeDark : null]}>
                  {tx(item.time)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {totalPages > 1 && (
          <View style={[styles.paginationContainer, { borderTopColor: darkMode ? '#243043' : t.cardBorder }]}>
            <TouchableOpacity
              style={[styles.paginationBtn, { backgroundColor: t.paginationBtnBg }, currentPage === 1 && { backgroundColor: t.paginationBtnDisabledBg }]}
              onPress={goToPrevPage}
              disabled={currentPage === 1}
              activeOpacity={0.8}
            >
              <Text style={[styles.paginationBtnText, currentPage === 1 && { color: t.paginationBtnDisabledText }]}>
                {tx('Previous')}
              </Text>
            </TouchableOpacity>

            <View style={[styles.paginationInfo, { backgroundColor: darkMode ? '#182133' : t.paginationInfoBg }]}>
              <Text style={[styles.paginationText, darkMode ? styles.paginationTextDark : null]}>
                {currentPage} / {totalPages}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.paginationBtn, { backgroundColor: t.paginationBtnBg }, currentPage === totalPages && { backgroundColor: t.paginationBtnDisabledBg }]}
              onPress={goToNextPage}
              disabled={currentPage === totalPages}
              activeOpacity={0.8}
            >
              <Text style={[styles.paginationBtnText, currentPage === totalPages && { color: t.paginationBtnDisabledText }]}>
                {tx('Next')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!allMappedItems.length && !apiLoading ? (
          <View style={[styles.emptyState, { backgroundColor: darkMode ? '#182133' : t.emptyStateBg, borderColor: darkMode ? '#243043' : t.emptyStateBorder }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: darkMode ? '#1E293B' : t.emptyIconBg }]}>
              <HistoryGlyph />
            </View>
            <Text style={[styles.emptyTitle, { color: darkMode ? '#F8FAFC' : t.emptyTitleColor }]}>
              {tx('No detailed records yet')}
            </Text>
            <Text style={[styles.emptySub, darkMode ? styles.emptySubDark : null]}>
              {tx(
                isDealer
                  ? 'Your complete wallet history will appear here once bank payouts or dealer bonus activity starts.'
                  : 'Start scanning products and your reward credits will appear here automatically.'
              )}
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, gap: 18, paddingBottom: 120 },
  heroCard: {
    overflow: 'hidden',
    borderRadius: 34,
    padding: 22,
    minHeight: 245,
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -40,
    right: -20,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backLabel: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  storeButton: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  storeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    marginTop: 24,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: { marginTop: 10, fontSize: 38, fontWeight: '900', color: '#FFFFFF' },
  heroSub: {
    marginTop: 8,
    maxWidth: '88%',
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.84)',
  },
  heroStats: { marginTop: 22, flexDirection: 'row', gap: 12 },
  heroStatCard: {
    flex: 1,
    borderRadius: 22,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.74)' },
  heroStatValue: { marginTop: 8, fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  card: {
    borderRadius: 30,
    backgroundColor: '#FFFDFC',
    padding: 18,
    borderWidth: 1,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  sectionTitle: { marginTop: 4, fontSize: 18, fontWeight: '900', color: '#221C1A' },
  sectionTitleDark: { color: '#F8FAFC' },
  sectionIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGrid: { marginTop: 18, flexDirection: 'row', gap: 12 },
  actionTile: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 10,
    minHeight: 150,
  },
  actionIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTileText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 13,
    color: colors.text,
    fontWeight: '800',
  },
  actionTileSub: {
    marginTop: 4,
    textAlign: 'center',
    fontSize: 11,
    color: colors.mutedText,
    lineHeight: 16,
  },
  actionTileTextDark: { color: '#F8FAFC' },
  actionTileSubDark: { color: '#94A3B8' },
  timeline: { marginTop: 18, gap: 14 },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineTrack: { width: 18, alignItems: 'center' },
  timelineDot: { marginTop: 12, width: 10, height: 10, borderRadius: 999 },
  timelineCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    padding: 15,
  },
  timelineTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  timelineTitle: { flex: 1, fontSize: 14, fontWeight: '800', color: '#241B16' },
  timelinePoints: { fontSize: 14, fontWeight: '900' },
  timelineTime: { marginTop: 6, fontSize: 12, color: '#887B74' },
  timelineTitleDark: { color: '#F8FAFC' },
  timelineTimeDark: { color: '#94A3B8' },
  emptyState: {
    marginTop: 18,
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { marginTop: 14, fontSize: 20, fontWeight: '900' },
  emptySub: {
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
    color: colors.mutedText,
    lineHeight: 19,
  },
  emptySubDark: { color: '#94A3B8' },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  paginationBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
  },
  paginationBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  paginationInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#221C1A',
  },
  paginationTextDark: {
    color: '#F8FAFC',
  },
});
