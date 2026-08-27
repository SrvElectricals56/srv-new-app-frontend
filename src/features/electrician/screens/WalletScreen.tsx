import { LinearGradient } from 'expo-linear-gradient';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRegisterScrollToTop } from '@/shared/context/NavActionContext';
import { useAppPageContent } from '@/shared/hooks';
import { usePreferenceContext } from '@/shared/preferences';
import { colors } from '@/shared/theme/colors';
import { createShadow } from '@/shared/theme/shadows';
import { premium } from '@/shared/theme/premium';
import type { Screen, UserRole } from '@/shared/types/navigation';
import type { RewardHistoryItem } from '@/shared/types/rewards';
import { walletApi } from '@/shared/api';
import { useAppData } from '@/shared/context/AppDataContext';
import { formatISTDateTime } from '@/shared/utils/dateIST';

type WalletScreenProps = {
  role?: UserRole;
  onNavigate?: (screen: Screen) => void;
  onOpenScanHistory?: () => void;
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

function GiftOrderIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 6.5H17C18.1 6.5 19 7.4 19 8.5V18C19 19.1 18.1 20 17 20H7C5.9 20 5 19.1 5 18V8.5C5 7.4 5.9 6.5 7 6.5Z"
        stroke="#7A4A22"
        strokeWidth={1.8}
      />
      <Path d="M8.5 10H15.5M8.5 13H15.5M8.5 16H12.5" stroke="#7A4A22" strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M9 6.5C9 4.84 10.34 3.5 12 3.5C13.66 3.5 15 4.84 15 6.5" stroke="#7A4A22" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function CalendarGlyph({ color = '#7A4A22', size = 20 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5" width="16" height="15" rx="3" stroke={color} strokeWidth={2} />
      <Path d="M8 3v4M16 3v4M4 10h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
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
  referenceId?: string | null;
  title: string;
  time: string;
  points: string;
  accent: string;
  type: 'wallet' | 'scan' | 'redemption' | 'transfer';
  rawDate?: string;
};

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseSignedPoints = (value: string) => {
  const numeric = Number(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
};

function resolveDisplayedPoints(...values: (number | null | undefined)[]) {
  const firstAvailable = values.find((value) => value !== null && value !== undefined);
  return Number(firstAvailable ?? 0);
}

// ── Role-wise theme tokens ────────────────────────────────────────────
const ROLE_THEME: Record<string, {
  heroGradient: [string, string, string];
  heroShadow: string;
  eyebrowColor: string;
  screenBg: string;
  cardBorder: string;
  cardShadow: string;
  sectionEyebrow: string;
  sectionIconBg: string;
  actionTileBg: string;
  actionTileBorder: string;
  timelineCardBg: string;
  timelineCardBorder: string;
  emptyStateBg: string;
  emptyStateBorder: string;
  emptyIconBg: string;
  emptyTitleColor: string;
  paginationBtnBg: string;
  paginationBtnDisabledBg: string;
  paginationBtnDisabledText: string;
  paginationInfoBg: string;
  storeIconWrapBg: string;
}> = {
  dealer: {
    heroGradient: ['#173E80', '#355C95', '#EAF3FF'],
    heroShadow: premium.navy,
    eyebrowColor: premium.navySoft,
    screenBg: premium.bg,
    cardBorder: premium.line,
    cardShadow: premium.ink,
    sectionEyebrow: premium.navy,
    sectionIconBg: premium.navySoft,
    actionTileBg: premium.surfaceSoft,
    actionTileBorder: premium.line,
    timelineCardBg: premium.surface,
    timelineCardBorder: premium.line,
    emptyStateBg: premium.surface,
    emptyStateBorder: premium.line,
    emptyIconBg: premium.navySoft,
    emptyTitleColor: premium.navy,
    paginationBtnBg: premium.navy,
    paginationBtnDisabledBg: premium.navySoft,
    paginationBtnDisabledText: premium.navy,
    paginationInfoBg: premium.navySoft,
    storeIconWrapBg: premium.navySoft,
  },
  electrician: {
    heroGradient: ['#173E80', '#355C95', '#EAF3FF'],
    heroShadow: premium.navy,
    eyebrowColor: premium.navySoft,
    screenBg: premium.bg,
    cardBorder: premium.line,
    cardShadow: premium.ink,
    sectionEyebrow: premium.navy,
    sectionIconBg: premium.navySoft,
    actionTileBg: premium.surfaceSoft,
    actionTileBorder: premium.line,
    timelineCardBg: premium.surface,
    timelineCardBorder: premium.line,
    emptyStateBg: premium.surface,
    emptyStateBorder: premium.line,
    emptyIconBg: premium.navySoft,
    emptyTitleColor: premium.navy,
    paginationBtnBg: premium.navy,
    paginationBtnDisabledBg: premium.navySoft,
    paginationBtnDisabledText: premium.navy,
    paginationInfoBg: premium.navySoft,
    storeIconWrapBg: premium.navySoft,
  },
  user: {
    heroGradient: ['#6A2F12', '#8D4A1E', '#F0DEC9'],
    heroShadow: '#6A2F12',
    eyebrowColor: '#FBF1E7',
    screenBg: '#FFF9F2',
    cardBorder: '#E8D7C7',
    cardShadow: premium.ink,
    sectionEyebrow: '#8D4A1E',
    sectionIconBg: '#FBF1E7',
    actionTileBg: premium.surfaceSoft,
    actionTileBorder: premium.line,
    timelineCardBg: premium.surface,
    timelineCardBorder: premium.line,
    emptyStateBg: premium.surface,
    emptyStateBorder: premium.line,
    emptyIconBg: '#FBF1E7',
    emptyTitleColor: '#6A2F12',
    paginationBtnBg: '#8D4A1E',
    paginationBtnDisabledBg: '#FBF1E7',
    paginationBtnDisabledText: '#6A2F12',
    paginationInfoBg: '#FBF1E7',
    storeIconWrapBg: '#FBF1E7',
  },
  counterboy: {
    heroGradient: ['#8B3C2A', '#6F4E37', '#F0E4D4'],
    heroShadow: '#6F4E37',
    eyebrowColor: '#F5EDE4',
    screenBg: '#F9F4ED',
    cardBorder: '#E0D0C0',
    cardShadow: premium.ink,
    sectionEyebrow: '#8B3C2A',
    sectionIconBg: '#F5EDE4',
    actionTileBg: premium.surfaceSoft,
    actionTileBorder: premium.line,
    timelineCardBg: premium.surface,
    timelineCardBorder: premium.line,
    emptyStateBg: premium.surface,
    emptyStateBorder: premium.line,
    emptyIconBg: '#F5EDE4',
    emptyTitleColor: '#6F4E37',
    paginationBtnBg: '#8B3C2A',
    paginationBtnDisabledBg: '#F5EDE4',
    paginationBtnDisabledText: '#6F4E37',
    paginationInfoBg: '#F5EDE4',
    storeIconWrapBg: '#F5EDE4',
  },
};

export function WalletScreen({
  role = 'electrician',
  onNavigate,
  onOpenScanHistory,
  totalPoints: propTotalPoints = 0,
  totalScans: propTotalScans = 0,
  historyItems = [],
}: WalletScreenProps) {
  const { darkMode, tx } = usePreferenceContext();
  const { dealerBonus, appSettings, scanHistory, redemptions, refreshAll } = useAppData();
  const isDealer = role === 'dealer';
  const t = ROLE_THEME[role] ?? ROLE_THEME.electrician;
  const contentRole = role === 'user' ? 'user' : role;
  const pageContent = useAppPageContent(contentRole as any, 'wallet');

  const walletScrollRef = useRef<ScrollView>(null);
  useRegisterScrollToTop('wallet', walletScrollRef);
  const [currentPage, setCurrentPage] = useState(1);
  const [activityDate, setActivityDate] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [activityType, setActivityType] = useState<'all' | ApiTxItem['type']>('all');
  const itemsPerPage = 5;

  // Real API wallet data
  const [apiBalance, setApiBalance] = useState<number | null>(null);
  const [apiTotalScans, setApiTotalScans] = useState<number | null>(null);
  const [apiTxItems, setApiTxItems] = useState<ApiTxItem[] | null>(null);
  const [apiLoading, setApiLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    walletApi.get(1, 50).then((res) => {
      setApiBalance(
        resolveDisplayedPoints(
          res.totalPoints,
          res.balance,
          (res as { wallet_balance?: number | null }).wallet_balance,
        ),
      );
      setApiTotalScans(res.totalScans ?? null);
      if (res.transactions?.data?.length) {
        const mapped: ApiTxItem[] = res.transactions.data.map((tx: any) => ({
          id: tx.id,
          referenceId: tx.linkedRedemption?.id ?? tx.referenceId ?? null,
          title: tx.linkedRedemption
            ? `${tx.linkedRedemption.giftName ?? tx.linkedRedemption.type ?? 'Redemption'} - ${tx.linkedRedemption.status ?? 'pending'}`
            : tx.description ?? (tx.source === 'scan' ? 'Product scanned' : tx.source === 'redemption' ? 'Redemption processed' : tx.source === 'bonus' ? 'Bonus credited' : tx.source === 'transfer' ? 'Points transferred' : 'Transaction'),
          time: tx.createdAt ? formatISTDateTime(tx.createdAt) : '',
          points: tx.type === 'credit' ? `+${tx.amount}` : `-${tx.amount}`,
          accent: tx.type === 'credit' ? '#1F9C5D' : '#B44A3A',
          type: tx.source === 'scan' ? 'scan' : tx.source === 'redemption' ? 'redemption' : tx.source === 'transfer' ? 'transfer' : 'wallet',
          rawDate: tx.createdAt,
        }));
        setApiTxItems(mapped);
      }
    }).catch(() => {}).finally(() => setApiLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
      const res = await walletApi.get(1, 50);
      setApiBalance(
        resolveDisplayedPoints(
          res.totalPoints,
          res.balance,
          (res as { wallet_balance?: number | null }).wallet_balance,
        ),
      );
      setApiTotalScans(res.totalScans ?? null);
      const mapped: ApiTxItem[] = (res.transactions?.data ?? []).map((tx: any) => ({
        id: tx.id,
        referenceId: tx.linkedRedemption?.id ?? tx.referenceId ?? null,
        title: tx.linkedRedemption
          ? `${tx.linkedRedemption.giftName ?? tx.linkedRedemption.type ?? 'Redemption'} - ${tx.linkedRedemption.status ?? 'pending'}`
          : tx.description ?? (tx.source === 'scan' ? 'Product scanned' : tx.source === 'redemption' ? 'Redemption processed' : tx.source === 'bonus' ? 'Bonus credited' : tx.source === 'transfer' ? 'Points transferred' : 'Transaction'),
        time: tx.createdAt ? formatISTDateTime(tx.createdAt) : '',
        points: tx.type === 'credit' ? `+${tx.amount}` : `-${tx.amount}`,
        accent: tx.type === 'credit' ? '#1F9C5D' : '#B44A3A',
        type: tx.source === 'scan' ? 'scan' : tx.source === 'redemption' ? 'redemption' : tx.source === 'transfer' ? 'transfer' : 'wallet',
        rawDate: tx.createdAt,
      }));
      setApiTxItems(mapped);
    } finally {
      setRefreshing(false);
    }
  };

  const dealerBonusValue = isDealer ? Number(dealerBonus?.availableBonus ?? 0) : 0;
  const totalPoints = isDealer ? dealerBonusValue : (apiBalance !== null ? apiBalance : propTotalPoints);
  const totalScans = apiTotalScans ?? propTotalScans;

  const allMappedItems: ApiTxItem[] = useMemo(() => {
    const walletItems: ApiTxItem[] = apiTxItems ?? (isDealer
      ? []
      : historyItems.map((item) => ({
          id: item.id,
          title: item.mode === 'multi' ? `${item.label} batch credited` : `${item.label} scanned`,
          time: item.time,
          points: `+${item.points}`,
          accent: '#1F9C5D',
          type: 'scan' as const,
          rawDate: undefined,
        })));

    const existingIds = new Set(
      walletItems.flatMap((item) => [item.id, item.referenceId].filter((value): value is string => Boolean(value))),
    );
    const scanItems: ApiTxItem[] = (scanHistory?.data ?? [])
      .filter((scan: any) => !existingIds.has(scan.id))
      .map((scan: any) => ({
        id: scan.id,
        title: `${scan.productName ?? 'Product'} scanned${scan.qrCode ? ` (${scan.qrCode})` : ''}`,
        time: scan.scannedAt ? formatISTDateTime(scan.scannedAt) : '',
        points: `+${Number(scan.points ?? 0)}`,
        accent: '#1F9C5D',
        type: 'scan',
        rawDate: scan.scannedAt,
      }));

    const redemptionItems: ApiTxItem[] = (redemptions ?? [])
      .filter((redemption: any) => !existingIds.has(redemption.id))
      .map((redemption: any) => ({
        id: redemption.id,
        title: `${redemption.giftName ?? redemption.type ?? 'Redemption'} - ${redemption.status ?? 'pending'}`,
        time: redemption.requestedAt ? formatISTDateTime(redemption.requestedAt) : '',
        points: `-${Number(redemption.points ?? redemption.amount ?? 0)}`,
        accent: '#B44A3A',
        type: 'redemption',
        rawDate: redemption.requestedAt,
      }));

    return [...walletItems, ...scanItems, ...redemptionItems].sort((a, b) => {
      const aTime = a.rawDate ? new Date(a.rawDate).getTime() : 0;
      const bTime = b.rawDate ? new Date(b.rawDate).getTime() : 0;
      return bTime - aTime;
    });
  }, [apiTxItems, historyItems, isDealer, redemptions, scanHistory?.data]);

  const filteredItems = useMemo(() => {
    const date = activityDate.trim();
    return allMappedItems.filter((item) => {
      const itemDate = item.rawDate ? toLocalDateKey(new Date(item.rawDate)) : '';
      const matchesDate = !date || itemDate === date;
      const matchesType = activityType === 'all' || item.type === activityType;
      return matchesDate && matchesType;
    });
  }, [activityDate, activityType, allMappedItems]);

  const selectedDateBalance = useMemo(() => {
    const date = activityDate.trim();
    if (!date) return null;
    const balanceAfterSelectedDate = allMappedItems.reduce((sum, item) => {
      if (!item.rawDate) return sum;
      const itemDate = toLocalDateKey(new Date(item.rawDate));
      return itemDate > date ? sum + parseSignedPoints(item.points) : sum;
    }, 0);
    return Math.max(0, totalPoints - balanceAfterSelectedDate);
  }, [activityDate, allMappedItems, totalPoints]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activityDate, activityType]);

  const calendarDays = useMemo(() => {
    const today = new Date();
    const todayKey = toLocalDateKey(today);
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: { key: string; date?: Date; label: string; disabled?: boolean }[] = [];

    for (let i = 0; i < startOffset; i += 1) {
      cells.push({ key: `blank-${i}`, label: '' });
    }

    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = toLocalDateKey(date);
      const isFuture = dateKey > todayKey;
      cells.push({ key: dateKey, date, label: String(day), disabled: isFuture });
    }

    return cells;
  }, [calendarMonth]);

  const selectedDateLabel = activityDate
    ? new Date(`${activityDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : tx('All activity dates');

  const currentMonthKey = toLocalDateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const calendarMonthKey = toLocalDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1));
  const canGoNextMonth = calendarMonthKey < currentMonthKey;

  const changeCalendarMonth = (direction: number) => {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  const selectCalendarDate = (date: Date) => {
    setActivityDate(toLocalDateKey(date));
    setCalendarVisible(false);
  };

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

  const openTransactionHistory = () => {
    setCurrentPage(1);
    walletScrollRef.current?.scrollTo({ y: 520, animated: true });
  };
  const dealerActions = [
    {
      id: 'bank',
      label: 'Bank Transfer',
      detail: 'Request payout',
      icon: TransferIcon,
      tint: '#DDEAFE',
      target: 'bank_details' as Screen,
    },
    {
      id: 'bonus',
      label: 'Dealer Bonus',
      detail: `${appSettings?.dealerBonusRate ?? 5}% electrician bonus`,
      icon: SparkIcon,
      tint: '#EAF3FF',
      target: 'dealer_bonus' as Screen,
    },
    {
      id: 'gift-order',
      label: 'Gift Store Order',
      detail: 'Order history',
      icon: GiftOrderIcon,
      tint: '#F5EDE4',
      target: 'my_redemption' as Screen,
    },
  ];

  const electricianActions = [
    {
      id: 'buy',
      label: 'Gift Order',
      detail: 'Premium offers',
      icon: GiftIcon,
      tint: '#FBE4CC',
      target: 'rewards' as Screen,
    },
    {
      id: 'bank',
      label: 'Bank Transfer',
      detail: 'Request payout',
      icon: TransferIcon,
      tint: '#DDEAFE',
      target: 'bank_details' as Screen,
    },
    {
      id: 'point',
      label: 'Transfer Point',
      detail: 'Send to electrician',
      icon: SparkIcon,
      tint: '#FFE0DA',
      target: 'transfer_points' as Screen,
    },
    {
      id: 'gift-order',
      label: 'Gift Store Order',
      detail: 'Order history',
      icon: GiftOrderIcon,
      tint: '#F5EDE4',
      target: 'my_redemption' as Screen,
    },
  ];

  const counterBoyActions = [
    {
      id: 'bank',
      label: 'Bank Transfer',
      detail: 'Request payout',
      icon: TransferIcon,
      tint: '#DDEAFE',
      target: 'bank_details' as Screen,
    },
    {
      id: 'point',
      label: 'Transfer Point',
      detail: 'Send to counter boy',
      icon: SparkIcon,
      tint: '#FFE0DA',
      target: 'transfer_points' as Screen,
    },
    {
      id: 'gift-order',
      label: 'Gift Store Order',
      detail: 'Order history',
      icon: GiftOrderIcon,
      tint: '#F5EDE4',
      target: 'my_redemption' as Screen,
    },
  ];

  const userActions = [
    {
      id: 'buy',
      label: 'Gift Order',
      detail: 'Premium offers',
      icon: GiftIcon,
      tint: '#FBE4CC',
      target: 'rewards' as Screen,
    },
    {
      id: 'bank',
      label: 'Bank Transfer',
      detail: 'Request payout',
      icon: TransferIcon,
      tint: '#DDEAFE',
      target: 'bank_details' as Screen,
    },
    {
      id: 'gift-order',
      label: 'Gift Store Order',
      detail: 'Order history',
      icon: GiftOrderIcon,
      tint: '#F5EDE4',
      target: 'my_redemption' as Screen,
    },
  ];

  const actions = isDealer
    ? dealerActions
    : role === 'counterboy'
    ? counterBoyActions
    : role === 'user'
    ? userActions
    : electricianActions;
  const walletTitle = isDealer
    ? 'SRV Dealer Wallet'
    : role === 'user'
    ? 'SRV Customer Wallet'
    : role === 'counterboy'
    ? 'SRV Counter Boy Wallet'
    : 'SRV Premium Wallet';
  const walletSubtitle = isDealer
    ? 'Dealer wallet for schemes, bank payouts, and dealer bonus tracking.'
    : role === 'user'
    ? 'Your rewards dashboard for redemptions and loyalty growth.'
    : role === 'counterboy'
    ? 'Counter boy wallet for transfers, payouts, and complete reward activity.'
    : 'Premium rewards dashboard for redemptions, transfers, and loyalty growth.';
  const quickActionTitle = isDealer ? 'Manage dealer payouts' : role === 'counterboy' ? 'Manage counter rewards' : 'Move your wallet faster';
  const filterTypes = (role === 'user' || role === 'counterboy')
    ? (['all', 'redemption', 'transfer'] as const)
    : (['all', 'scan', 'redemption', 'transfer'] as const);

  return (
    <ScrollView
      ref={walletScrollRef}
      style={[styles.screen, { backgroundColor: darkMode ? '#08111F' : t.screenBg }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={t.paginationBtnBg} />}
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
          {pageContent.pageTitle || tx(walletTitle)}
        </Text>
        <Text style={styles.heroTitle}>
          {totalPoints} {tx(isDealer ? 'Dealer Bonus Points' : 'Total Points')}
        </Text>
        <Text style={styles.heroSub}>
          {pageContent.heroSubtitle || tx(walletSubtitle)}
        </Text>

        <View style={styles.heroStats}>
          {role === 'user' || role === 'counterboy' ? null : (
            <Pressable
              style={styles.heroStatCard}
              onPress={() => {
                if (isDealer) {
                  onNavigate?.('electricians');
                } else {
                  onOpenScanHistory?.();
                }
              }}
            >
              <Text style={styles.heroStatLabel}>
                {tx(isDealer ? 'Active Electricians' : 'Total Scans')}
              </Text>
              <Text style={styles.heroStatValue}>{apiLoading ? '...' : String(totalScans)}</Text>
            </Pressable>
          )}
          <Pressable style={styles.heroStatCard} onPress={openTransactionHistory}>
            <Text style={styles.heroStatLabel}>
              {tx(isDealer ? 'Bonus Withdrawals' : 'Transactions')}
            </Text>
            <Text style={styles.heroStatValue}>
              {apiLoading ? '...' : String(allMappedItems.length)}
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={[styles.card, { borderColor: darkMode ? '#243043' : t.cardBorder, backgroundColor: darkMode ? '#111827' : '#FFFFFF' }, createShadow({ color: darkMode ? '#020617' : t.cardShadow, offsetY: 8, blur: 18, opacity: 0.08, elevation: 4 })]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: darkMode ? t.eyebrowColor : t.sectionEyebrow }]}>
              {pageContent.pageSubtitle || tx('Quick Actions')}
            </Text>
            <Text style={[styles.sectionTitle, darkMode ? styles.sectionTitleDark : null]}>
              {pageContent.sectionTitle || tx(quickActionTitle)}
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

      <View style={[styles.card, { borderColor: darkMode ? '#243043' : t.cardBorder, backgroundColor: darkMode ? '#111827' : '#FFFFFF' }, createShadow({ color: darkMode ? '#020617' : t.cardShadow, offsetY: 8, blur: 18, opacity: 0.08, elevation: 4 })]}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionEyebrow, { color: darkMode ? t.eyebrowColor : t.sectionEyebrow }]}>
              {pageContent.sectionSubtitle || tx('Redeem Point History')}
            </Text>
            <Text style={[styles.sectionTitle, darkMode ? styles.sectionTitleDark : null]}>
              {pageContent.cardTitle || tx('Activity Timeline')}
            </Text>
          </View>
          <View style={[styles.sectionIconWrap, { backgroundColor: darkMode ? '#1E293B' : t.sectionIconBg }]}>
            <HistoryGlyph />
          </View>
        </View>

        <View style={[styles.filterPanel, { backgroundColor: darkMode ? '#182133' : t.timelineCardBg, borderColor: darkMode ? '#243043' : t.timelineCardBorder }]}>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.datePickerButton, { backgroundColor: darkMode ? '#111827' : '#FFFFFF', borderColor: darkMode ? '#243043' : t.cardBorder }]}
              activeOpacity={0.84}
              onPress={() => setCalendarVisible(true)}
            >
              <CalendarGlyph color={darkMode ? '#F8FAFC' : '#7A4A22'} size={22} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.datePickerLabel, { color: darkMode ? '#94A3B8' : '#887B74' }]}>{tx('Select activity date')}</Text>
                <Text style={[styles.datePickerValue, { color: darkMode ? '#F8FAFC' : '#221C1A' }]}>{selectedDateLabel}</Text>
              </View>
            </TouchableOpacity>
            {activityDate ? (
              <TouchableOpacity
                style={[styles.clearDateButton, { borderColor: darkMode ? '#243043' : t.cardBorder }]}
                activeOpacity={0.8}
                onPress={() => setActivityDate('')}
              >
                <Text style={[styles.clearDateText, { color: darkMode ? '#F8FAFC' : '#7A4A22' }]}>{tx('Clear')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <View style={[styles.balanceLookupCard, { backgroundColor: darkMode ? '#111827' : '#FFFFFF', borderColor: darkMode ? '#243043' : t.cardBorder }]}>
            <Text style={[styles.balanceLookupLabel, { color: darkMode ? '#94A3B8' : '#887B74' }]}>
              {tx(activityDate ? 'Wallet balance on selected date' : 'Check wallet history by date')}
            </Text>
            <Text style={[styles.balanceLookupValue, { color: darkMode ? '#F8FAFC' : '#221C1A' }]}>
              {activityDate && selectedDateBalance !== null
                ? `${selectedDateBalance.toLocaleString('en-IN')} ${tx(isDealer ? 'Dealer Bonus Points' : 'Total Points')}`
                : `${totalPoints.toLocaleString('en-IN')} ${tx(isDealer ? 'Dealer Bonus Points' : 'Total Points')}`}
            </Text>
            {activityDate ? (
              <Text style={[styles.balanceLookupDate, { color: darkMode ? '#CBD5E1' : colors.mutedText }]}>
                {selectedDateLabel}
              </Text>
            ) : null}
          </View>
          <View style={styles.filterChips}>
            {filterTypes.map((item) => {
              const active = activityType === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.filterChip, { backgroundColor: active ? t.paginationBtnBg : darkMode ? '#111827' : '#FFFFFF', borderColor: active ? t.paginationBtnBg : darkMode ? '#243043' : t.cardBorder }]}
                  activeOpacity={0.82}
                  onPress={() => setActivityType(item)}
                >
                  <Text style={[styles.filterChipText, { color: active ? '#FFFFFF' : darkMode ? '#F8FAFC' : '#221C1A' }]}>
                    {tx(item === 'all' ? 'All' : item === 'scan' ? 'Scans' : item === 'redemption' ? 'Redemptions' : item === 'transfer' ? 'Transfers' : 'Wallet')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <Modal visible={calendarVisible} transparent animationType="fade" onRequestClose={() => setCalendarVisible(false)}>
          <Pressable style={styles.calendarBackdrop} onPress={() => setCalendarVisible(false)} />
          <View style={[styles.calendarModal, { backgroundColor: darkMode ? '#111827' : '#FFFFFF', borderColor: darkMode ? '#243043' : t.cardBorder }]}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={() => changeCalendarMonth(-1)} style={styles.calendarNavBtn}>
                <Text style={[styles.calendarNavText, { color: darkMode ? '#F8FAFC' : '#221C1A' }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[styles.calendarTitle, { color: darkMode ? '#F8FAFC' : '#221C1A' }]}>
                {calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </Text>
              <TouchableOpacity disabled={!canGoNextMonth} onPress={() => changeCalendarMonth(1)} style={[styles.calendarNavBtn, !canGoNextMonth && { opacity: 0.35 }]}>
                <Text style={[styles.calendarNavText, { color: darkMode ? '#F8FAFC' : '#221C1A' }]}>›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.weekRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Text key={`${day}-${index}`} style={[styles.weekLabel, { color: darkMode ? '#94A3B8' : '#887B74' }]}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((cell) => {
                const value = cell.date ? toLocalDateKey(cell.date) : undefined;
                const selected = Boolean(value && value === activityDate);
                const disabled = Boolean(cell.disabled);
                return (
                  <TouchableOpacity
                    key={cell.key}
                    disabled={!cell.date || disabled}
                    onPress={() => cell.date && !disabled && selectCalendarDate(cell.date)}
                    style={[styles.calendarDay, disabled && styles.calendarDayDisabled, selected && { backgroundColor: t.paginationBtnBg }]}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.calendarDayText, { color: selected ? '#FFFFFF' : disabled ? (darkMode ? '#64748B' : '#A8B0BA') : darkMode ? '#F8FAFC' : '#221C1A' }]}>
                      {cell.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>

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

        {!filteredItems.length && !apiLoading ? (
          <View style={[styles.emptyState, { backgroundColor: darkMode ? '#182133' : t.emptyStateBg, borderColor: darkMode ? '#243043' : t.emptyStateBorder }]}>
            <View style={[styles.emptyIconWrap, { backgroundColor: darkMode ? '#1E293B' : t.emptyIconBg }]}>
              <HistoryGlyph />
            </View>
            <Text style={[styles.emptyTitle, { color: darkMode ? '#F8FAFC' : t.emptyTitleColor }]}>
              {pageContent.emptyStateTitle || tx('No detailed records yet')}
            </Text>
            <Text style={[styles.emptySub, darkMode ? styles.emptySubDark : null]}>
              {pageContent.emptyStateSubtitle || tx(
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
    borderRadius: 24,
    padding: 22,
    minHeight: 238,
  },
  heroGlow: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -40,
    right: -20,
    display: 'none',
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
    borderRadius: 18,
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
  heroTitle: { marginTop: 10, fontSize: 28, lineHeight: 34, fontWeight: '900', color: '#FFFFFF' },
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
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  heroStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.74)' },
  heroStatValue: { marginTop: 8, fontSize: 28, fontWeight: '900', color: '#FFFFFF' },
  card: {
    borderRadius: 20,
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
  actionGrid: { marginTop: 18, gap: 12 },
  actionTile: {
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 14,
    minHeight: 76,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTileText: {
    marginLeft: 12,
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '800',
  },
  actionTileSub: {
    marginLeft: 10,
    maxWidth: 116,
    textAlign: 'right',
    fontSize: 11,
    color: colors.mutedText,
    lineHeight: 14,
  },
  actionTileTextDark: { color: '#F8FAFC' },
  actionTileSubDark: { color: '#94A3B8' },
  timeline: { marginTop: 18, gap: 14 },
  filterPanel: {
    marginTop: 18,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  datePickerButton: { flex: 1, minHeight: 64, borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  datePickerLabel: { fontSize: 11.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  datePickerValue: { fontSize: 15, fontWeight: '900', marginTop: 3 },
  clearDateButton: { minHeight: 64, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  clearDateText: { fontSize: 13, fontWeight: '900' },
  balanceLookupCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  balanceLookupLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  balanceLookupValue: {
    marginTop: 6,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '900',
  },
  balanceLookupDate: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  filterChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChipText: { fontSize: 12, fontWeight: '800' },
  timelineItem: { flexDirection: 'row', gap: 12 },
  timelineTrack: { width: 18, alignItems: 'center' },
  timelineDot: { marginTop: 12, width: 10, height: 10, borderRadius: 999 },
  timelineCard: {
    flex: 1,
    borderRadius: 16,
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
    borderRadius: 18,
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
  calendarBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  calendarModal: { position: 'absolute', left: 18, right: 18, top: '24%', borderRadius: 20, borderWidth: 1, padding: 16 },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calendarTitle: { fontSize: 17, fontWeight: '900' },
  calendarNavBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  calendarNavText: { fontSize: 30, lineHeight: 32, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '900' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: `${100 / 7}%`, aspectRatio: 1.05, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  calendarDayDisabled: { backgroundColor: 'rgba(148, 163, 184, 0.14)' },
  calendarDayText: { fontSize: 13, fontWeight: '800' },
});
