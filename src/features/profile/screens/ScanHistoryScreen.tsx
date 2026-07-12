import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { walletApi } from '@/shared/api';
import { formatISTDateTime } from '@/shared/utils/dateIST';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';
import Svg, { Path, Rect } from 'react-native-svg';

const toLocalDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function CalendarGlyph({ color = C.primary, size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="5.5" width="16" height="14.5" rx="3" stroke={color} strokeWidth={2} />
      <Path d="M8 3.5v4M16 3.5v4M4 10h16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ScanHistoryPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'scan_history');
  const [loading, setLoading] = useState(true);
  const [totalScans, setTotalScans] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [scanHistory, setScanHistory] = useState<
    { product: string; points: string; time: string; code: string; rawDate?: string | null }[]
  >([]);
  const [activityDate, setActivityDate] = useState('');
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    walletApi.getScanHistory(1, 50).then((res) => {
      setTotalScans(res.total ?? res.data?.length ?? 0);
      const items = res.data ?? [];
      const earned = items.reduce((sum: number, s: any) => sum + (s.points ?? 0), 0);
      setTotalPoints(earned);
      setScanHistory(
        items.map((s: any) => ({
          product: s.productName ?? 'Product',
          points: `+${s.points ?? 0}`,
          time: formatISTDateTime(s.scannedAt),
          code: s.id?.slice(0, 8) ?? '',
          rawDate: s.scannedAt,
        }))
      );
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filteredScanHistory = useMemo(() => {
    const date = activityDate.trim();
    if (!date) return scanHistory;
    return scanHistory.filter((item) => {
      const itemDate = item.rawDate ? toLocalDateKey(new Date(item.rawDate)) : '';
      return itemDate === date;
    });
  }, [activityDate, scanHistory]);

  const filteredPoints = useMemo(
    () => filteredScanHistory.reduce((sum, item) => sum + Number(item.points.replace(/[^0-9.-]/g, '') || 0), 0),
    [filteredScanHistory],
  );

  const calendarDays = useMemo(() => {
    const today = new Date();
    const todayKey = toLocalDateKey(today);
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const cells: { key: string; date?: Date; label: string; disabled?: boolean }[] = [];

    for (let i = 0; i < startOffset; i += 1) cells.push({ key: `blank-${i}`, label: '' });
    for (let day = 1; day <= totalDays; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = toLocalDateKey(date);
      cells.push({ key: dateKey, date, label: String(day), disabled: dateKey > todayKey });
    }
    return cells;
  }, [calendarMonth]);

  const selectedDateLabel = activityDate
    ? new Date(`${activityDate}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : tx('All scan dates');

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('scanHistory')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.totalCard, { borderColor: theme.border }]}>
          <View>
            <Text style={styles.totalLabel}>{tx('Total Scans')}</Text>
            <Text style={styles.totalValue}>{loading ? '...' : activityDate ? filteredScanHistory.length : totalScans}</Text>
          </View>
          <View style={styles.totalDivider} />
          <View>
            <Text style={styles.totalLabel}>{tx('Points Earned')}</Text>
            <Text style={[styles.totalValue, { color: '#22C55E' }]}>
              {loading ? '...' : (activityDate ? filteredPoints : totalPoints).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        <View style={[styles.filterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.filterTitle, { color: theme.textPrimary }]}>{tx('Filter scan history')}</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={() => setCalendarVisible(true)}
              style={[styles.datePickerBtn, { borderColor: theme.border, backgroundColor: theme.bg }]}
            >
              <CalendarGlyph color={C.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.datePickerLabel, { color: theme.textMuted }]}>{tx('Select scan date')}</Text>
                <Text style={[styles.datePickerValue, { color: theme.textPrimary }]}>{selectedDateLabel}</Text>
              </View>
            </TouchableOpacity>
            {activityDate ? (
              <TouchableOpacity activeOpacity={0.82} onPress={() => setActivityDate('')} style={styles.clearDateBtn}>
                <Text style={styles.clearDateText}>{tx('Clear')}</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 32 }} />
        ) : filteredScanHistory.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {activityDate ? tx('No scan history found for this date.') : pageContent.emptyStateTitle || tx('No scans yet. Start scanning products to earn points!')}
            </Text>
          </View>
        ) : (
          filteredScanHistory.map((item, i) => (
            <View
              key={i}
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <View style={styles.iconWrap}>
                <AppIcon name="scan" size={22} color={C.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>{tx(item.product)}</Text>
                <Text style={[styles.sub, { color: theme.textMuted }]}>
                  {item.code ? `Code: ${item.code} | ` : ''}{item.time}
                </Text>
              </View>
              <Text style={styles.cta}>{item.points}</Text>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={calendarVisible} transparent animationType="fade" onRequestClose={() => setCalendarVisible(false)}>
        <Pressable style={styles.calendarBackdrop} onPress={() => setCalendarVisible(false)} />
        <View style={[styles.calendarModal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity onPress={() => changeCalendarMonth(-1)} style={styles.calendarNavBtn}>
              <Text style={[styles.calendarNavText, { color: theme.textPrimary }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[styles.calendarTitle, { color: theme.textPrimary }]}>
              {calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity disabled={!canGoNextMonth} onPress={() => changeCalendarMonth(1)} style={[styles.calendarNavBtn, !canGoNextMonth && { opacity: 0.35 }]}>
              <Text style={[styles.calendarNavText, { color: theme.textPrimary }]}>›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.weekRow}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <Text key={`${day}-${index}`} style={[styles.weekLabel, { color: theme.textMuted }]}>{day}</Text>
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
                  style={[styles.calendarDay, disabled && styles.calendarDayDisabled, selected && { backgroundColor: C.primary }]}
                  activeOpacity={0.82}
                >
                  <Text style={[styles.calendarDayText, { color: selected ? '#FFFFFF' : disabled ? '#A8B0BA' : theme.textPrimary }]}>
                    {cell.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 10, paddingBottom: 32 },
  totalCard: {
    backgroundColor: C.navy,
    borderRadius: 28,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
  },
  totalLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  totalValue: { fontSize: 28, fontWeight: '900', color: '#fff' },
  totalDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)' },
  filterCard: {
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  filterTitle: { fontSize: 14, fontWeight: '900' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  datePickerBtn: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  datePickerLabel: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  datePickerValue: { fontSize: 13, fontWeight: '900' },
  clearDateBtn: {
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primaryLight,
  },
  clearDateText: { color: C.primary, fontSize: 12, fontWeight: '900' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 3 },
  cta: { fontSize: 12, fontWeight: '800', color: '#16A34A' },
  emptyCard: {
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  calendarBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  calendarModal: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: '24%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  calendarTitle: { fontSize: 17, fontWeight: '900' },
  calendarNavBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  calendarNavText: { fontSize: 30, lineHeight: 32, fontWeight: '700' },
  weekRow: { flexDirection: 'row', marginBottom: 8 },
  weekLabel: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 11, fontWeight: '900' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calendarDay: { width: `${100 / 7}%`, aspectRatio: 1.05, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  calendarDayDisabled: { backgroundColor: 'rgba(148, 163, 184, 0.14)' },
  calendarDayText: { fontSize: 13, fontWeight: '800' },
});
