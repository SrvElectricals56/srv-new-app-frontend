import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from '@/shared/components/Dialog';
import {
  ActivityIndicator,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { useAuth } from '@/shared/context/AuthContext';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { Screen } from '@/shared/types/navigation';
import { electriciansApi, type DealerElectricianWalletActivity } from '@/shared/api';
import { formatISTDate } from '@/shared/utils/dateIST';
import { useAppPageContent } from '@/shared/hooks';

type ElectricianStatus = 'Active' | 'Inactive' | 'Pending';
type NetworkPeriodFilter = 'all' | 'thisMonth' | 'lastMonth';

type Electrician = {
  id: string;
  name: string;
  phone: string;
  electricianCode?: string;
  city: string;
  joinedAt: string;
  createdAt?: string;
  totalScans: number;
  points: number;
  status: ElectricianStatus;
};

function TeamIcon({ color = '#FFFFFF', size = 24 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="8" cy="9" r="2.7" stroke={color} strokeWidth={1.9} />
      <Circle cx="16.5" cy="8.2" r="2.2" stroke={color} strokeWidth={1.9} />
      <Path
        d="M4.6 18.3c1.02-2.37 3.02-3.75 5.53-3.75 2.49 0 4.46 1.28 5.54 3.75"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
      />
      <Path
        d="M15.4 16.15c.62-1.32 1.82-2.1 3.27-2.1 1.05 0 2 .36 2.86 1.08"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function SearchIcon({ color = '#789', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth={1.8} />
      <Path d="M16 16L20 20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function HomeIcon({ color = '#FFFFFF', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M9 21V12h6v9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function StatCard({
  label,
  value,
  accent,
  darkMode,
}: {
  label: string;
  value: string;
  accent: [string, string, string];
  darkMode: boolean;
}) {
  return (
    <LinearGradient
      colors={accent}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.statCard, darkMode ? styles.statCardDark : null]}
    >
      <Text style={[styles.statLabel, darkMode ? styles.statLabelDark : null]}>{label}</Text>
      <Text style={[styles.statValue, darkMode ? styles.statValueDark : null]}>{value}</Text>
    </LinearGradient>
  );
}

const NETWORK_PERIODS: { key: NetworkPeriodFilter; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
];

function getMonthRange(period: NetworkPeriodFilter) {
  const now = new Date();
  if (period === 'thisMonth') {
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }
  if (period === 'lastMonth') {
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 1),
    };
  }
  return null;
}

function isInNetworkPeriod(item: Electrician, period: NetworkPeriodFilter) {
  const range = getMonthRange(period);
  if (!range) return true;
  if (!item.createdAt) return false;
  const joinedDate = new Date(item.createdAt);
  return !Number.isNaN(joinedDate.getTime()) && joinedDate >= range.start && joinedDate < range.end;
}

export function ElectriciansScreen({ onNavigate }: { onNavigate?: (screen: Screen) => void }) {
  const { tx, darkMode, theme } = usePreferenceContext();
  const { user: authUser } = useAuth();
  const pageContent = useAppPageContent('dealer', 'electricians');
  const [electricians, setElectricians] = useState<Electrician[]>([]);
  const [apiLoaded, setApiLoaded] = useState(false);
  const [apiLoading, setApiLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<NetworkPeriodFilter>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activityTarget, setActivityTarget] = useState<Electrician | null>(null);
  const [walletActivity, setWalletActivity] = useState<DealerElectricianWalletActivity | null>(null);
  const [activityLoading, setActivityLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; confirmLabel?: string; onConfirm?: () => void; icon?: string }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));
  const heroFloat = useRef(new Animated.Value(0)).current;
  const homeBtnScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(heroFloat, withWebSafeNativeDriver({ toValue: -8, duration: 1800 })),
        Animated.timing(heroFloat, withWebSafeNativeDriver({ toValue: 0, duration: 1800 })),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [heroFloat]);

  // Load real electricians from API
  useEffect(() => {
    if (apiLoaded) return;
    electriciansApi.getAll(1, 100).then((res) => {
      if (res.data?.length) {
        const mapped: Electrician[] = res.data.map((e: any) => ({
          id: e.id,
          name: e.name,
          phone: e.phone,
          electricianCode: e.electricianCode,
          city: e.city ?? '',
          joinedAt: e.joinedDate ? `Connected ${formatISTDate(e.joinedDate)}` : 'Recently connected',
          createdAt: e.joinedDate,
          totalScans: e.totalScans ?? 0,
          points: e.totalPoints ?? 0,
          status: (e.status === 'active' ? 'Active' : e.status === 'inactive' || e.status === 'suspended' ? 'Inactive' : 'Pending') as ElectricianStatus,
        }));
        setElectricians(mapped);
      }
      setApiLoaded(true);
    }).catch(() => {
      // Keep empty list on error
      setApiLoaded(true);
    }).finally(() => setApiLoading(false));
  }, [apiLoaded]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return electricians.filter((item) => {
      const matchesPeriod = isInNetworkPeriod(item, periodFilter);
      if (!matchesPeriod) return false;
      if (!term) return true;
      return (
        item.name.toLowerCase().includes(term) ||
        item.phone.includes(term) ||
        item.city.toLowerCase().includes(term)
      );
    });
  }, [electricians, periodFilter, query]);

  const electricianStats = useMemo(() => {
    let activeCount = 0;
    let inactiveCount = 0;
    let maxSerial = 0;
    const periodItems = electricians.filter((item) => isInNetworkPeriod(item, periodFilter));

    for (const item of periodItems) {
      if (item.status === 'Active') activeCount += 1;
      if (item.status === 'Inactive') inactiveCount += 1;
    }

    for (const item of electricians) {
      if (authUser?.dealerCode && item.electricianCode && !item.electricianCode.startsWith(`${authUser.dealerCode}-`)) {
        continue;
      }

      const match = item.electricianCode?.match(/-(\d{3})$/);
      if (match) maxSerial = Math.max(maxSerial, Number(match[1]));
    }

    return {
      activeCount,
      inactiveCount,
      totalElectricians: periodItems.length,
      nextElectricianSerial: String(maxSerial + 1).padStart(3, '0'),
    };
  }, [authUser?.dealerCode, electricians, periodFilter]);

  const { activeCount, inactiveCount, totalElectricians, nextElectricianSerial } = electricianStats;
  const cleanPhone = newPhone.replace(/\D/g, '').slice(0, 10);
  const canAddElectrician =
    newName.trim().length >= 3 &&
    cleanPhone.length === 10 &&
    newCity.trim().length >= 2 &&
    !submitting;

  const resetForm = () => {
    setNewName('');
    setNewPhone('');
    setNewCity('');
    setSubmitting(false);
  };

  const handlePhoneChange = (value: string) => {
    const nextPhone = value.replace(/\D/g, '').slice(0, 10);
    setNewPhone(nextPhone);
  };

  const handleAddElectrician = async () => {
    if (!canAddElectrician) return;
    setSubmitting(true);

    try {
      const res = await electriciansApi.add({
        name: newName.trim(),
        phone: cleanPhone,
        city: newCity.trim(),
        district: authUser?.district ?? newCity.trim(),
        state: authUser?.state ?? '',
        pincode: authUser?.pincode ?? undefined,
        dealerPhone: authUser?.phone ?? undefined,
        dealerCode: authUser?.dealerCode ?? undefined,
        electricianCode: authUser?.dealerCode
          ? `${authUser.dealerCode}-${nextElectricianSerial}`
          : undefined,
        tier: 'Silver',
        status: 'active',
      });
      const e = res.electrician;
      setElectricians((current) => [
        {
          id: e.id,
          name: e.name,
          phone: e.phone,
          electricianCode: e.electricianCode,
          city: e.city ?? newCity.trim(),
          joinedAt: 'Added just now',
          createdAt: new Date().toISOString(),
          totalScans: 0,
          points: 0,
          status: 'Active',
        },
        ...current,
      ]);
      resetForm();
      setShowAddModal(false);
    } catch (error: any) {
      const message =
        error?.message ??
        tx('Unable to save electrician right now. Please check the details and try again.');
      setDialog({ visible: true, variant: 'error', title: tx('Add electrician failed'), message });
      setSubmitting(false);
    }
  };

  const openWalletActivity = async (electrician: Electrician) => {
    setActivityTarget(electrician);
    setWalletActivity(null);
    setActivityLoading(true);
    try {
      const result = await electriciansApi.getWalletActivity(electrician.id, 1, 50);
      setWalletActivity(result);
    } catch (error: any) {
      setActivityTarget(null);
      setDialog({
        visible: true,
        variant: 'error',
        title: tx('Unable to load wallet activity'),
        message: error?.message ?? tx('Please try again.'),
      });
    } finally {
      setActivityLoading(false);
    }
  };

  const closeWalletActivity = () => {
    setActivityTarget(null);
    setWalletActivity(null);
    setActivityLoading(false);
  };

  const handleHomePressIn = () => {
    Animated.timing(
      homeBtnScale,
      withWebSafeNativeDriver({
        toValue: 0.9,
        duration: 90,
      })
    ).start();
  };

  const handleHomePressOut = () => {
    Animated.spring(
      homeBtnScale,
      withWebSafeNativeDriver({
        toValue: 1,
        tension: 180,
        friction: 7,
      })
    ).start();
  };

  return (
    <>
      <ScrollView
        style={[styles.screen, { backgroundColor: theme.bg }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#173E80', '#355C95', '#88AEEA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />
          <Animated.View style={[styles.homeButtonFloat, { transform: [{ scale: homeBtnScale }] }]}>
            <TouchableOpacity
              style={styles.homeBackButton}
              onPress={() => onNavigate?.('home')}
              onPressIn={handleHomePressIn}
              onPressOut={handleHomePressOut}
              activeOpacity={0.9}
            >
              <View style={styles.homeBackIcon}>
                <HomeIcon size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.heroTopRow}>
            <View />
            <Animated.View
              style={[styles.heroIconWrap, { transform: [{ translateY: heroFloat }] }]}
            >
              <TeamIcon size={28} />
            </Animated.View>
          </View>
          <Text style={styles.heroEyebrow}>{pageContent.pageTitle || tx('Dealer Network')}</Text>
          <Text style={styles.heroTitle}>{pageContent.heroTitle || tx('Connected electricians')}</Text>
          <Text style={styles.heroSub}>
            {tx('Review connected electricians and monitor their network activity from one place.')}
          </Text>
        </LinearGradient>

        <View style={styles.statsRow}>
          <StatCard
            label={tx('Active Electricians')}
            value={`${activeCount}`}
            accent={darkMode ? ['#1E293B', '#243447', '#2A3C53'] : ['#E8F1FF', '#D4E4FF', '#C4DBFF']}
            darkMode={darkMode}
          />
          <StatCard
            label={tx('Inactive Electricians')}
            value={`${inactiveCount}`}
            accent={darkMode ? ['#3B1D1D', '#4B2424', '#5A2A2A'] : ['#FFF1F2', '#FFE4E6', '#FECDD3']}
            darkMode={darkMode}
          />
          <StatCard
            label={tx('Total Network')}
            value={`${totalElectricians}`}
            accent={darkMode ? ['#102A22', '#14362C', '#1A4537'] : ['#F4F8FF', '#E5EEFF', '#D7E7FF']}
            darkMode={darkMode}
          />
        </View>

        <View style={[styles.periodPanel, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View>
            <Text style={[styles.periodTitle, { color: theme.textPrimary }]}>{tx('Network filter')}</Text>
            <Text style={[styles.periodSub, { color: theme.textMuted }]}>
              {tx('Check active and inactive electricians by joining month')}
            </Text>
          </View>
          <View style={styles.periodChipRow}>
            {NETWORK_PERIODS.map((period) => {
              const selected = periodFilter === period.key;
              return (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.periodChip,
                    {
                      backgroundColor: selected ? '#173E80' : darkMode ? theme.soft : '#F5F8FC',
                      borderColor: selected ? '#173E80' : theme.border,
                    },
                  ]}
                  onPress={() => setPeriodFilter(period.key)}
                  activeOpacity={0.84}
                >
                  <Text style={[styles.periodChipText, { color: selected ? '#FFFFFF' : theme.textSecondary }]}>
                    {tx(period.label)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View
          style={[styles.searchBox, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <SearchIcon color={darkMode ? '#94A3B8' : '#7E90A5'} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={pageContent.searchPlaceholder || tx('Search by name, phone, or city')}
            placeholderTextColor={darkMode ? '#64748B' : '#97A4B3'}
            style={[styles.searchInput, { color: theme.textPrimary }]}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>{pageContent.sectionTitle || tx('Electrician directory')}</Text>
          <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
            {filtered.length} {tx('records')}
          </Text>
        </View>

        <View style={styles.listWrap}>
          {apiLoading ? (
            <ActivityIndicator color="#173E80" size="large" style={{ marginTop: 24 }} />
          ) : filtered.length === 0 ? (
            <View style={[styles.memberCard, { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'center', paddingVertical: 32 }]}>
              <Text style={{ color: theme.textMuted, fontSize: 14, textAlign: 'center' }}>
                {pageContent.emptyStateTitle || tx('No electricians connected yet. Add your first electrician!')}
              </Text>
            </View>
          ) : (
          filtered.map((item) => (
            <View
              key={item.id}
              style={[styles.memberCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={styles.memberTop}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>{item.name.slice(0, 1).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.memberName, { color: theme.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.memberPhone, { color: theme.textMuted }]}>+91 {item.phone}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    item.status === 'Active'
                      ? styles.statusActive
                      : item.status === 'Inactive'
                        ? styles.statusInactive
                        : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      item.status === 'Active'
                        ? styles.statusTextActive
                        : item.status === 'Inactive'
                          ? styles.statusTextInactive
                          : styles.statusTextPending,
                    ]}
                  >
                    {tx(item.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                {/*
                <View style={styles.metaPill}>
                  <BoltIcon />
                  <Text style={styles.metaText}>{item.totalScans} scans</Text>
                </View>
                */}
                {/*
                <View style={styles.metaPill}>
                  <Text style={styles.metaPoints}>{item.points} pts</Text>
                </View>
                */}
              </View>

              <Text style={[styles.memberCity, { color: theme.textSecondary }]}>{item.city}</Text>
              <Text style={[styles.memberJoined, { color: theme.textMuted }]}>{tx(item.joinedAt)}</Text>
              <TouchableOpacity
                style={[styles.activityButton, { backgroundColor: darkMode ? theme.soft : '#EEF5FF', borderColor: theme.border }]}
                activeOpacity={0.82}
                onPress={() => void openWalletActivity(item)}
              >
                <Text style={[styles.activityButtonText, { color: theme.accent }]}>
                  {tx('View wallet & withdrawals')}
                </Text>
              </TouchableOpacity>
            </View>
          ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(activityTarget)}
        animationType="slide"
        transparent
        onRequestClose={closeWalletActivity}
      >
        <View style={[styles.modalOverlay, darkMode ? styles.modalOverlayDark : null]}>
          <Pressable style={styles.modalBackdropTapArea} onPress={closeWalletActivity} />
          <View style={[styles.activitySheet, { backgroundColor: theme.surface }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.activityHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {activityTarget?.name ?? tx('Electrician activity')}
                </Text>
                <Text style={[styles.modalSub, { color: theme.textMuted }]}>
                  {tx('Wallet history, withdrawal requests and your 5% bonus')}
                </Text>
              </View>
              <TouchableOpacity onPress={closeWalletActivity} style={[styles.closeButton, { backgroundColor: theme.soft }]}>
                <Text style={[styles.closeButtonText, { color: theme.textPrimary }]}>×</Text>
              </TouchableOpacity>
            </View>

            {activityLoading ? (
              <ActivityIndicator color="#173E80" size="large" style={styles.activityLoader} />
            ) : walletActivity ? (
              <ScrollView contentContainerStyle={styles.activityContent} showsVerticalScrollIndicator={false}>
                <View style={styles.activityStats}>
                  <View style={[styles.activityStat, { backgroundColor: theme.soft }]}>
                    <Text style={[styles.activityStatLabel, { color: theme.textMuted }]}>{tx('Wallet balance')}</Text>
                    <Text style={[styles.activityStatValue, { color: theme.textPrimary }]}>Rs. {walletActivity.electrician.walletBalance.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={[styles.activityStat, { backgroundColor: theme.soft }]}>
                    <Text style={[styles.activityStatLabel, { color: theme.textMuted }]}>{tx('Withdrawals')}</Text>
                    <Text style={[styles.activityStatValue, { color: theme.textPrimary }]}>{walletActivity.withdrawals.length}</Text>
                  </View>
                </View>

                <Text style={[styles.activitySectionTitle, { color: theme.textPrimary }]}>{tx('Withdrawal requests & 5% bonus')}</Text>
                {walletActivity.withdrawals.length ? walletActivity.withdrawals.map((withdrawal) => {
                  const credited = withdrawal.dealerBonus.status === 'credited';
                  return (
                    <View key={withdrawal.id} style={[styles.activityItem, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                      <View style={styles.activityItemTop}>
                        <Text style={[styles.activityAmount, { color: theme.textPrimary }]}>Rs. {withdrawal.amount.toLocaleString('en-IN')}</Text>
                        <View style={[styles.activityStatus, { backgroundColor: credited ? '#DCFCE7' : '#FFF4E2' }]}>
                          <Text style={[styles.activityStatusText, { color: credited ? '#17834C' : '#B66A08' }]}>{tx(withdrawal.status)}</Text>
                        </View>
                      </View>
                      <Text style={[styles.activityDate, { color: theme.textMuted }]}>{formatISTDate(withdrawal.requestedAt)}</Text>
                      <Text style={[styles.bonusLine, { color: credited ? '#17834C' : theme.textSecondary }]}>
                        {credited
                          ? `${tx('5% bonus credited')}: Rs. ${withdrawal.dealerBonus.amount.toLocaleString('en-IN')}`
                          : `${tx('Expected 5% bonus after approval')}: Rs. ${withdrawal.dealerBonus.amount.toLocaleString('en-IN')}`}
                      </Text>
                    </View>
                  );
                }) : (
                  <Text style={[styles.activityEmpty, { color: theme.textMuted }]}>{tx('No withdrawal requests yet.')}</Text>
                )}

                <Text style={[styles.activitySectionTitle, { color: theme.textPrimary }]}>{tx('Wallet history')}</Text>
                {walletActivity.transactions.data.length ? walletActivity.transactions.data.map((transaction) => (
                  <View key={transaction.id} style={[styles.activityItem, { borderColor: theme.border, backgroundColor: theme.bg }]}>
                    <View style={styles.activityItemTop}>
                      <Text style={[styles.activityDescription, { color: theme.textPrimary }]} numberOfLines={2}>
                        {transaction.description || tx('Wallet transaction')}
                      </Text>
                      <Text style={[styles.transactionAmount, { color: transaction.type === 'credit' ? '#17834C' : '#BE123C' }]}>
                        {transaction.type === 'credit' ? '+' : '-'}{Number(transaction.amount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={[styles.activityDate, { color: theme.textMuted }]}>
                      {formatISTDate(transaction.createdAt)} · {tx('Balance')} {Number(transaction.balanceAfter).toLocaleString('en-IN')}
                    </Text>
                  </View>
                )) : (
                  <Text style={[styles.activityEmpty, { color: theme.textMuted }]}>{tx('No wallet activity yet.')}</Text>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowAddModal(false);
        }}
      >
        <View style={[styles.modalOverlay, darkMode ? styles.modalOverlayDark : null]}>
          <Pressable
            style={styles.modalBackdropTapArea}
            onPress={() => {
              Keyboard.dismiss();
              setShowAddModal(false);
            }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 18 : 0}
            style={styles.modalKeyboard}
          >
            <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
              <View style={styles.sheetHandle} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>{tx('Add electrician')}</Text>
                <Text style={[styles.modalSub, { color: theme.textMuted }]}>
                  {tx('This electrician will be saved directly to your dealer network in the live database.')}
                </Text>
              </View>
              <ScrollView
                style={styles.modalScroll}
                contentContainerStyle={styles.modalBody}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{tx('Electrician name')}</Text>
                  <TextInput
                    value={newName}
                    onChangeText={(v) => setNewName(v.replace(/[^A-Za-z ]/g, ''))}
                    placeholder={tx('Enter full name')}
                    placeholderTextColor={darkMode ? '#64748B' : '#9A9FB1'}
                    style={[styles.fieldInput, { backgroundColor: darkMode ? theme.soft : '#FBFDFF', borderColor: theme.border, color: theme.textPrimary }]}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{tx('Electrician number')}</Text>
                  <TextInput
                    value={newPhone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    placeholder={tx('10-digit mobile number')}
                    placeholderTextColor={darkMode ? '#64748B' : '#9A9FB1'}
                    style={[styles.fieldInput, { backgroundColor: darkMode ? theme.soft : '#FBFDFF', borderColor: theme.border, color: theme.textPrimary }]}
                    maxLength={10}
                  />
                </View>



                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{tx('City')}</Text>
                  <TextInput
                    value={newCity}
                    onChangeText={(v) => setNewCity(v.replace(/[^A-Za-z ]/g, ''))}
                    placeholder={tx('City or district')}
                    placeholderTextColor={darkMode ? '#64748B' : '#9A9FB1'}
                    style={[styles.fieldInput, { backgroundColor: darkMode ? theme.soft : '#FBFDFF', borderColor: theme.border, color: theme.textPrimary }]}
                  />
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => setShowAddModal(false)}
                    style={[styles.secondaryButton, darkMode ? styles.secondaryButtonDark : null]}
                  >
                    <Text
                      style={[styles.secondaryButtonText, darkMode ? styles.secondaryButtonTextDark : null]}
                    >{tx('Cancel')}</Text>
                  </Pressable>
                  <Pressable
                    onPress={handleAddElectrician}
                    disabled={!canAddElectrician}
                    style={[
                      styles.primaryButton,
                      !canAddElectrician && styles.primaryButtonDisabled,
                    ]}
                  >
                    <Text style={styles.primaryButtonText}>
                      {submitting ? tx('Saving...') : tx('Add Electrician')}
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F7FB' },
  content: { padding: 16, gap: 16, paddingBottom: 120 },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  homeButtonFloat: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 3,
  },
  homeBackButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  homeBackIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    borderRadius: 30,
    padding: 20,
    overflow: 'hidden',
    ...createShadow({ color: '#173E80', offsetY: 12, blur: 24, opacity: 0.2, elevation: 8 }),
  },
  heroGlowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.10)',
    top: -40,
    right: -20,
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(147,197,253,0.22)',
    bottom: -20,
    left: -10,
  },
  heroIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
  },
  heroTitle: { marginTop: 8, color: '#FFFFFF', fontSize: 28, fontWeight: '900' },
  heroSub: {
    marginTop: 8,
    color: 'rgba(255,255,255,0.84)',
    fontSize: 13,
    lineHeight: 20,
    maxWidth: '92%',
  },
  heroButton: {
    marginTop: 18,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  heroButtonText: { color: '#173E80', fontSize: 13, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  statCardDark: {
    borderColor: 'rgba(148,163,184,0.22)',
  },
  statLabel: {
    fontSize: 10,
    color: '#5D6C82',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    lineHeight: 13,
  },
  statLabelDark: { color: '#CBD5E1' },
  statValue: { marginTop: 8, fontSize: 20, color: '#1B2D45', fontWeight: '900' },
  statValueDark: { color: '#F8FAFC' },
  periodPanel: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 14,
    gap: 12,
    ...createShadow({ color: '#0F2747', offsetY: 5, blur: 12, opacity: 0.04, elevation: 2 }),
  },
  periodTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  periodSub: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  periodChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  periodChipText: {
    fontSize: 12,
    fontWeight: '900',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E3EAF3',
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#20324A' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 19, fontWeight: '900', color: '#1B2D45' },
  sectionSub: { fontSize: 12, fontWeight: '700', color: '#7990A8' },
  listWrap: { gap: 12 },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E3EAF3',
    ...createShadow({ color: '#0F2747', offsetY: 6, blur: 12, opacity: 0.05, elevation: 3 }),
  },
  memberTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberAvatarText: { color: '#173E80', fontSize: 20, fontWeight: '900' },
  memberName: { color: '#18283E', fontSize: 16, fontWeight: '800' },
  memberPhone: { marginTop: 2, color: '#7488A1', fontSize: 12.5 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusActive: { backgroundColor: '#E8FFF0' },
  statusInactive: { backgroundColor: '#FFE4E6' },
  statusPending: { backgroundColor: '#FFF4E2' },
  statusText: { fontSize: 11, fontWeight: '800' },
  statusTextActive: { color: '#17834C' },
  statusTextInactive: { color: '#BE123C' },
  statusTextPending: { color: '#C97910' },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F5F8FC',
  },
  metaText: { color: '#173E80', fontSize: 12, fontWeight: '700' },
  metaPoints: { color: '#173E80', fontSize: 12, fontWeight: '800' },
  memberCity: { marginTop: 12, color: '#263A56', fontSize: 13, fontWeight: '700' },
  memberJoined: { marginTop: 4, color: '#8597AC', fontSize: 12 },
  activityButton: { marginTop: 14, borderRadius: 15, borderWidth: 1, paddingVertical: 11, alignItems: 'center' },
  activityButtonText: { fontSize: 13, fontWeight: '900' },
  activitySheet: { width: '100%', maxHeight: '88%', minHeight: 360, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  activityHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 18, paddingBottom: 12 },
  closeButton: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { fontSize: 25, lineHeight: 27, fontWeight: '500' },
  activityLoader: { marginVertical: 80 },
  activityContent: { paddingHorizontal: 18, paddingBottom: 30, gap: 12 },
  activityStats: { flexDirection: 'row', gap: 10 },
  activityStat: { flex: 1, borderRadius: 18, padding: 14 },
  activityStatLabel: { fontSize: 11, fontWeight: '700' },
  activityStatValue: { marginTop: 6, fontSize: 18, fontWeight: '900' },
  activitySectionTitle: { marginTop: 8, fontSize: 16, fontWeight: '900' },
  activityItem: { borderWidth: 1, borderRadius: 18, padding: 13, gap: 5 },
  activityItemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  activityAmount: { fontSize: 16, fontWeight: '900' },
  activityStatus: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  activityStatusText: { fontSize: 10, fontWeight: '900', textTransform: 'capitalize' },
  activityDate: { fontSize: 11, fontWeight: '600' },
  bonusLine: { marginTop: 4, fontSize: 12, fontWeight: '800' },
  activityDescription: { flex: 1, fontSize: 13, fontWeight: '800' },
  transactionAmount: { fontSize: 14, fontWeight: '900' },
  activityEmpty: { borderRadius: 16, paddingVertical: 18, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,26,49,0.38)' },
  modalOverlayDark: { backgroundColor: 'rgba(2,6,23,0.72)' },
  modalBackdropTapArea: { ...StyleSheet.absoluteFillObject },
  modalKeyboard: { width: '100%', maxHeight: '92%', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  modalScroll: { maxHeight: '100%' },
  sheetHandle: {
    alignSelf: 'center',
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#D4DDE8',
    marginTop: 10,
    marginBottom: 8,
  },
  modalHeader: {
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  modalBody: {
    paddingHorizontal: 18,
    paddingTop: 4,
    gap: 12,
    paddingBottom: 18,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1C2E47' },
  modalSub: { color: '#6F859D', fontSize: 12, lineHeight: 17 },
  fieldGroup: { gap: 5 },
  fieldLabel: {
    fontSize: 11,
    color: '#7B8DA4',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldInput: {
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDE6F1',
    backgroundColor: '#FBFDFF',
    paddingHorizontal: 14,
    color: '#1D3049',
    fontSize: 14,
  },
  phoneRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  phoneInput: { flex: 1 },
  inlineButton: {
    minWidth: 94,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17438E',
    paddingHorizontal: 14,
  },
  blockButton: {
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#17438E',
  },
  confirmButton: {
    alignSelf: 'center',
    width: '58%',
    minWidth: 140,
  },
  inlineButtonDisabled: {
    backgroundColor: '#D7E1EE',
  },
  inlineButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  inlineButtonTextDisabled: {
    color: '#7F93A8',
  },
  otpCard: {
    borderRadius: 18,
    padding: 10,
    backgroundColor: '#EEF5FF',
    borderWidth: 1,
    borderColor: '#C7D9F5',
    gap: 6,
  },
  otpCardDark: {
    backgroundColor: '#0F1E33',
    borderColor: '#29466E',
  },
  otpInfo: {
    color: '#355C95',
    fontSize: 12,
    lineHeight: 16,
  },
  otpHint: {
    color: '#173E80',
    fontSize: 12,
    fontWeight: '800',
  },
  otpHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpTimer: {
    color: '#173E80',
    fontSize: 12,
    fontWeight: '800',
  },
  otpResend: {
    color: '#173E80',
    fontSize: 12,
    fontWeight: '800',
  },
  otpResendDisabled: {
    color: '#9CA3AF',
  },
  otpInputRow: {
    height: 46,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  otpInput: {
    flex: 1,
    height: '100%',
    color: '#1D3049',
    fontSize: 14,
  },
  otpActionRow: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 18,
  },
  otpTimerSmall: {
    color: '#173E80',
    fontSize: 11,
    fontWeight: '800',
  },
  otpResendSmall: {
    color: '#173E80',
    fontSize: 11,
    fontWeight: '800',
  },
  otpResendSmallDisabled: {
    color: '#9CA3AF',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#EAFBF2',
    borderWidth: 1,
    borderColor: '#C7F0D8',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  verifiedRowDark: {
    backgroundColor: '#10261B',
    borderColor: '#1F6A45',
  },
  verifiedText: {
    color: '#173E80',
    fontSize: 13,
    fontWeight: '700',
  },
  verifiedTextDark: { color: '#86EFAC' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  secondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF3F8',
  },
  secondaryButtonDark: { backgroundColor: '#1F2937' },
  secondaryButtonText: { color: '#6B5A3A', fontSize: 15, fontWeight: '800' },
  secondaryButtonTextDark: { color: '#E2E8F0' },
  primaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#173E80',
  },
  primaryButtonDisabled: {
    backgroundColor: '#C7D9F5',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
