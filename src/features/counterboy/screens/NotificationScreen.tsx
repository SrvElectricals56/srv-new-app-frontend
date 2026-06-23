import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useAppPageContent } from '@/shared/hooks';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { Screen, UserRole } from '@/shared/types/navigation';
import { notificationsApi } from '@/shared/api';
import { storage } from '@/shared/api/storage';
import { useAuth } from '@/shared/context/AuthContext';
import { Dialog } from '@/shared/components/Dialog';
import { formatISTDate } from '@/shared/utils/dateIST';
import { counterboyTheme as cb } from '@/features/counterboy/theme';

const CB_PRIMARY = cb.primary;
const CB_DARK = cb.primaryDeep;

function BellIcon({ color = '#0F172A', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 16.5V11a6 6 0 1112 0v5.5l1.2 1.2a.8.8 0 01-.57 1.36H5.37a.8.8 0 01-.57-1.36L6 16.5z"
        stroke={color} strokeWidth={1.8} strokeLinejoin="round"
      />
      <Path d="M10 20a2 2 0 004 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function OfferIcon({ color = '#0F172A', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.5 3.5l7 7-8.5 8.5a2 2 0 01-2.83 0L3 13.83a2 2 0 010-2.83L11.5 3.5a2 2 0 011 0z"
        stroke={color} strokeWidth={1.8} strokeLinejoin="round"
      />
      <Circle cx="15.5" cy="8.5" r="1.2" fill={color} />
    </Svg>
  );
}

function ScanIcon({ color = '#0F172A', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="4" y="4" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.8} />
      <Rect x="14" y="4" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.8} />
      <Rect x="4" y="14" width="6" height="6" rx="1.2" stroke={color} strokeWidth={1.8} />
      <Path d="M14 14h2v2h-2zM18 14h2v6h-6v-2h4v-4z" fill={color} />
    </Svg>
  );
}

function WalletIcon({ color = '#0F172A', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="13" rx="2" stroke={color} strokeWidth={1.8} />
      <Path d="M16 12h5v4h-5a2 2 0 010-4z" stroke={color} strokeWidth={1.8} />
      <Circle cx="16.8" cy="14" r="1" fill={color} />
      <Path d="M7 6V4.8A1.8 1.8 0 018.8 3h8.2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

const ICON_CYCLE = [OfferIcon, ScanIcon, WalletIcon, BellIcon];

// Counter Boy notification card color cycles — red theme
const CB_CYCLES: [string, string][] = cb.notificationCycles.map(
  (cycle) => [cycle[0], cycle[1]] as [string, string]
);

function formatNotifTime(dateStr?: string): string {
  if (!dateStr) return 'Recent';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs} hr ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatISTDate(d.toISOString());
}

type NotifItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  type: string;
  colors: [string, string];
  icon: typeof BellIcon;
};

export function NotificationScreen({
  onNavigate,
  role = 'electrician',
  onNotificationsSeen,
}: {
  onNavigate: (screen: Screen) => void;
  role?: UserRole;
  onNotificationsSeen?: () => void;
}) {
  const { darkMode, tx } = usePreferenceContext();
  const pageContent = useAppPageContent('counterboy', 'notifications');
  const { user } = useAuth();
  const [notifItems, setNotifItems] = useState<NotifItem[]>([]);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message: string; confirmLabel?: string; onConfirm?: () => void }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));
  const notifScope = `${role}:${user?.id ?? 'guest'}`;

  const loadAndMarkSeen = useCallback(async () => {
    setLoading(true);
    try {
      const [res, clearedIds] = await Promise.all([
        notificationsApi.getAll(role, user?.id),
        storage.getClearedNotificationIds(notifScope),
      ]);
      const visibleNotifications = (res.data ?? []).filter((n: any) => !clearedIds.has(n.id));
      if (visibleNotifications.length) {
        const mapped: NotifItem[] = visibleNotifications.map((n: any, i: number) => ({
          id: n.id,
          title: n.title,
          body: n.message,
          time: formatNotifTime(n.sentAt),
          type: n.targetRole ?? 'General',
          colors: CB_CYCLES[i % CB_CYCLES.length],
          icon: ICON_CYCLE[i % ICON_CYCLE.length],
        }));
        setNotifItems(mapped);
        const ids = mapped.map((n) => n.id);
        await storage.markNotificationsAsSeen(ids, notifScope);
        onNotificationsSeen?.();
      } else {
        setNotifItems([]);
      }
    } catch {
      setNotifItems([]);
    } finally {
      setLoading(false);
    }
  }, [notifScope, onNotificationsSeen, role, user?.id]);

  const handleClearNotification = useCallback(async (id: string) => {
    await storage.clearNotifications([id], notifScope);
    setNotifItems((current) => current.filter((item) => item.id !== id));
  }, [notifScope]);

  const handleClearAllNotifications = useCallback(() => {
    if (!notifItems.length) return;
    setDialog({
      visible: true, variant: 'destructive', title: tx('Clear all notifications'), message: tx('This will hide all current notifications only for your account.'),
      confirmLabel: tx('Clear All'),
      onConfirm: async () => {
        await storage.clearNotifications(notifItems.map((item) => item.id), notifScope);
        setNotifItems([]);
        onNotificationsSeen?.();
      },
    });
  }, [notifItems, notifScope, onNotificationsSeen, tx]);

  useEffect(() => {
    loadAndMarkSeen();
  }, [loadAndMarkSeen]);

  const displayedNotifications = showAllNotifications ? notifItems : notifItems.slice(0, 5);

  return (
    <ScrollView
      style={[styles.screen, darkMode ? styles.screenDark : null]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <LinearGradient
        colors={darkMode
          ? cb.heroDark
          : [cb.primaryDeep, cb.primary, '#8B5E4A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>{pageContent.pageTitle || tx('Notification Center')}</Text>
            <Text style={styles.heroTitle}>{pageContent.heroTitle || tx('Stay updated with SRV')}</Text>
            <Text style={styles.heroSub}>
              {pageContent.heroSubtitle || tx('Important price updates, reward alerts, and account notices in one place.')}
            </Text>
          </View>
          <View style={styles.heroIconWrap}>
            <BellIcon color="#FFFFFF" size={26} />
          </View>
        </View>
        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroActionBtn} activeOpacity={0.85} onPress={() => onNavigate('home')}>
            <Text style={styles.heroActionText}>{pageContent.primaryCtaLabel || tx('Back Home')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroGhostBtn} activeOpacity={0.85} onPress={() => setShowAllNotifications(true)}>
            <Text style={styles.heroGhostText}>{pageContent.secondaryCtaLabel || tx('More')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {notifItems.length > 0 && (
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, darkMode ? styles.sectionTitleDark : null]}>
            {pageContent.sectionTitle || tx('Latest updates')}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleClearAllNotifications}
              activeOpacity={0.85}
              style={[styles.clearAllBtn, darkMode ? styles.clearAllBtnDark : null]}
            >
              <Text style={[styles.clearAllBtnText, darkMode ? styles.clearAllBtnTextDark : null]}>
                {tx('Clear All')}
              </Text>
            </TouchableOpacity>
            <View style={styles.unreadPill}>
              <Text style={styles.unreadText}>{notifItems.length} {tx('updates')}</Text>
            </View>
          </View>
        </View>
      )}

      {!loading && notifItems.length === 0 && (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIconWrap, darkMode ? styles.emptyIconWrapDark : null]}>
            <BellIcon color={darkMode ? '#64748B' : '#94A3B8'} size={32} />
          </View>
          <Text style={[styles.emptyTitle, darkMode ? styles.emptyTitleDark : null]}>
            {pageContent.emptyStateTitle || tx('No notifications yet')}
          </Text>
          <Text style={[styles.emptySub, darkMode ? styles.emptySubDark : null]}>
            {pageContent.emptyStateSubtitle || tx("You're all caught up. New updates will appear here.")}
          </Text>
        </View>
      )}

      {displayedNotifications.map((item) => {
        const Icon = item.icon;
        return (
          <LinearGradient
            key={item.id}
            colors={darkMode ? cb.darkHeroCard : item.colors}
            style={[styles.card, darkMode ? styles.cardDark : null]}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconWrap, darkMode ? styles.iconWrapDark : null]}>
                <Icon />
              </View>
              <View style={styles.meta}>
                <Text style={[styles.cardType, darkMode ? styles.cardTypeDark : null]}>{item.type}</Text>
                <View style={styles.metaActions}>
                  <Text style={[styles.cardTime, darkMode ? styles.cardTimeDark : null]}>{item.time}</Text>
                  <TouchableOpacity
                    onPress={() => void handleClearNotification(item.id)}
                    activeOpacity={0.8}
                    style={[styles.clearBtn, darkMode ? styles.clearBtnDark : null]}
                  >
                    <Text style={[styles.clearBtnText, darkMode ? styles.clearBtnTextDark : null]}>
                      {tx('Clear')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Text style={[styles.cardTitle, darkMode ? styles.cardTitleDark : null]}>{item.title}</Text>
            <Text style={[styles.cardBody, darkMode ? styles.cardBodyDark : null]}>{item.body}</Text>
          </LinearGradient>
        );
      })}
      <Dialog
        visible={dialog.visible}
        variant={dialog.variant}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        onConfirm={dialog.onConfirm}
        onClose={closeDialog}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: cb.bg },
  screenDark: { backgroundColor: cb.darkBg },
  content: { padding: 14, gap: 14, paddingBottom: 120 },
  hero: {
    borderRadius: 28, padding: 18, overflow: 'hidden',
    ...createShadow({ color: CB_PRIMARY, offsetY: 10, blur: 18, opacity: 0.22, elevation: 7 }),
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' },
  heroCopy: { flex: 1, paddingRight: 4 },
  heroEyebrow: { color: 'rgba(255,255,255,0.66)', fontSize: 11, fontWeight: '800', letterSpacing: 1.1, textTransform: 'uppercase' },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.78)', fontSize: 12.5, lineHeight: 19, marginTop: 8, maxWidth: '86%' },
  heroIconWrap: { width: 48, height: 48, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  heroActionBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  heroActionText: { color: CB_DARK, fontWeight: '800', fontSize: 12.5 },
  heroGhostBtn: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  heroGhostText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12.5 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: cb.text, fontSize: 20, fontWeight: '900' },
  sectionTitleDark: { color: cb.darkText },
  clearAllBtn: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(111,78,55,0.14)',
  },
  clearAllBtnDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  clearAllBtnText: { color: cb.primaryDeep, fontSize: 11, fontWeight: '800' },
  clearAllBtnTextDark: { color: cb.darkText },
  unreadPill: { backgroundColor: CB_PRIMARY, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  card: {
    borderRadius: 24, padding: 16,
    ...createShadow({ color: CB_PRIMARY, offsetY: 8, blur: 16, opacity: 0.1, elevation: 4 }),
  },
  cardDark: { ...createShadow({ color: '#020617', offsetY: 8, blur: 16, opacity: 0.08, elevation: 4 }) },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: { width: 46, height: 46, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center' },
  iconWrapDark: { backgroundColor: 'rgba(255,255,255,0.08)' },
  meta: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  metaActions: { alignItems: 'flex-end', gap: 6 },
  cardType: { color: cb.text, fontSize: 12.5, fontWeight: '800' },
  cardTime: { color: cb.muted, fontSize: 11.5, fontWeight: '700' },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(111,78,55,0.14)',
  },
  clearBtnDark: { backgroundColor: 'rgba(255,255,255,0.12)' },
  clearBtnText: { color: cb.primaryDeep, fontSize: 10.5, fontWeight: '800' },
  clearBtnTextDark: { color: cb.darkText },
  cardTitle: { color: cb.text, fontSize: 17, fontWeight: '900' },
  cardBody: { color: cb.primaryInk, fontSize: 12.5, lineHeight: 19, marginTop: 8 },
  cardTypeDark: { color: cb.darkText },
  cardTimeDark: { color: cb.darkMuted },
  cardTitleDark: { color: cb.darkText },
  cardBodyDark: { color: '#D8CEC8' },
  emptyWrap: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: cb.soft, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyIconWrapDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: CB_DARK, marginBottom: 8 },
  emptyTitleDark: { color: cb.darkText },
  emptySub: { fontSize: 13, color: cb.muted, textAlign: 'center', lineHeight: 20 },
  emptySubDark: { color: cb.darkMuted },
});
