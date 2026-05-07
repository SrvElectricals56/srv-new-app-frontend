import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import type { Screen, UserRole } from '@/shared/types/navigation';
import { notificationsApi } from '@/shared/api';
import { storage } from '@/shared/api/storage';
import { useAuth } from '@/shared/context/AuthContext';

function BellIcon({ color = '#0F172A', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 16.5V11a6 6 0 1112 0v5.5l1.2 1.2a.8.8 0 01-.57 1.36H5.37a.8.8 0 01-.57-1.36L6 16.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
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
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
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
      <Path
        d="M7 6V4.8A1.8 1.8 0 018.8 3h8.2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Icon cycle for API notifications
const ICON_CYCLE = [OfferIcon, ScanIcon, WalletIcon, BellIcon];
const ROLE_THEME = {
  electrician: {
    hero: ['#09111F', '#12284A', '#18396A'] as [string, string, string],
    screen: '#EEF3F8',
    cycle: [
      ['#EAF2FF', '#CFE0FF'],
      ['#E5F0FF', '#BDD7FF'],
      ['#EEF7F0', '#D2F0DA'],
      ['#EEF4FF', '#D5E4FF'],
    ] as [string, string][],
  },
  user: {
    hero: ['#18220D', '#40561F', '#6B7C2D'] as [string, string, string],
    screen: '#F4F8EE',
    cycle: [
      ['#F1F6E2', '#DFEABF'],
      ['#EEF5DE', '#D7E7AA'],
      ['#EEF7F0', '#D2F0DA'],
      ['#F5F4E8', '#E7E1BF'],
    ] as [string, string][],
  },
} as const;

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
  return d.toLocaleDateString();
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
  const roleTheme = ROLE_THEME[role === 'user' ? 'user' : 'electrician'];
  const { user } = useAuth();
  const [notifItems, setNotifItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAndMarkSeen = useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationsApi.getAll(role, user?.id);
      if (res.data?.length) {
        const mapped: NotifItem[] = res.data.map((n: any, i: number) => ({
          id: n.id,
          title: n.title,
          body: n.message,
          time: formatNotifTime(n.sentAt),
          type: n.targetRole ?? 'General',
          colors: roleTheme.cycle[i % roleTheme.cycle.length],
          icon: ICON_CYCLE[i % ICON_CYCLE.length],
        }));
        setNotifItems(mapped);
        // Mark all as seen in storage
        const ids = mapped.map(n => n.id);
        await storage.markNotificationsAsSeen(ids);
        // Tell HomeScreen to remove red dot
        onNotificationsSeen?.();
      } else {
        setNotifItems([]);
      }
    } catch {
      setNotifItems([]);
    } finally {
      setLoading(false);
    }
  }, [role, user?.id, onNotificationsSeen]);

  useEffect(() => {
    loadAndMarkSeen();
  }, [loadAndMarkSeen]);

  return (
    <ScrollView
      style={[styles.screen, darkMode ? styles.screenDark : null]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={roleTheme.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>{tx('Notification Center')}</Text>
            <Text style={styles.heroTitle}>{tx('Stay updated with SRV')}</Text>
            <Text style={styles.heroSub}>
              {tx('Important price updates, reward alerts, and account notices in one place.')}
            </Text>
          </View>
          <View style={styles.heroIconWrap}>
            <BellIcon color="#FFFFFF" size={26} />
          </View>
        </View>

        <View style={styles.heroActions}>
          <TouchableOpacity
            style={styles.heroActionBtn}
            activeOpacity={0.85}
            onPress={() => onNavigate('home')}
          >
            <Text style={styles.heroActionText}>{tx('Back Home')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroGhostBtn}
            activeOpacity={0.85}
            onPress={() => onNavigate('profile')}
          >
            <Text style={styles.heroGhostText}>{tx('More')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {notifItems.length > 0 && (
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, darkMode ? styles.sectionTitleDark : null]}>
            {tx('Latest updates')}
          </Text>
          <View style={styles.unreadPill}>
            <Text style={styles.unreadText}>
              {notifItems.length} {tx('new')}
            </Text>
          </View>
        </View>
      )}

      {!loading && notifItems.length === 0 && (
        <View style={styles.emptyWrap}>
          <View style={[styles.emptyIconWrap, darkMode ? styles.emptyIconWrapDark : null]}>
            <BellIcon color={darkMode ? '#64748B' : '#94A3B8'} size={32} />
          </View>
          <Text style={[styles.emptyTitle, darkMode ? styles.emptyTitleDark : null]}>
            {tx('No notifications yet')}
          </Text>
          <Text style={[styles.emptySub, darkMode ? styles.emptySubDark : null]}>
            {tx("You're all caught up. New updates will appear here.")}
          </Text>
        </View>
      )}

      {notifItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <LinearGradient
            key={item.id}
            colors={
              darkMode
                ? (['#182133', '#23324C'] as [string, string])
                : item.colors
            }
            style={[styles.card, darkMode ? styles.cardDark : null]}
          >
            <View style={styles.cardTop}>
              <View style={[styles.iconWrap, darkMode ? styles.iconWrapDark : null]}>
                <Icon />
              </View>
              <View style={styles.meta}>
                <Text style={[styles.cardType, darkMode ? styles.cardTypeDark : null]}>
                  {item.type}
                </Text>
                <Text style={[styles.cardTime, darkMode ? styles.cardTimeDark : null]}>
                  {item.time}
                </Text>
              </View>
            </View>
            <Text style={[styles.cardTitle, darkMode ? styles.cardTitleDark : null]}>
              {item.title}
            </Text>
            <Text style={[styles.cardBody, darkMode ? styles.cardBodyDark : null]}>
              {item.body}
            </Text>
          </LinearGradient>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EEF3F8' },
  screenDark: { backgroundColor: '#08111F' },
  content: { padding: 14, gap: 14, paddingBottom: 120 },
  hero: {
    borderRadius: 28,
    padding: 18,
    overflow: 'hidden',
    ...createShadow({ color: '#0F172A', offsetY: 10, blur: 18, opacity: 0.18, elevation: 7 }),
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'flex-start',
  },
  heroCopy: { flex: 1, paddingRight: 4 },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 6 },
  heroSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12.5,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: '86%',
  },
  heroIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  heroActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
  heroActionBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  heroActionText: { color: '#10254A', fontWeight: '800', fontSize: 12.5 },
  heroGhostBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  heroGhostText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12.5 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  sectionTitle: { color: '#14213D', fontSize: 20, fontWeight: '900' },
  sectionTitleDark: { color: '#F8FAFC' },
  unreadPill: {
    backgroundColor: '#E8453C',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  card: {
    borderRadius: 24,
    padding: 16,
    ...createShadow({ color: '#0F172A', offsetY: 8, blur: 16, opacity: 0.08, elevation: 4 }),
  },
  cardDark: {
    ...createShadow({ color: '#020617', offsetY: 8, blur: 16, opacity: 0.08, elevation: 4 }),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDark: { backgroundColor: 'rgba(255,255,255,0.08)' },
  meta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardType: { color: '#10254A', fontSize: 12.5, fontWeight: '800' },
  cardTime: { color: '#5F718E', fontSize: 11.5, fontWeight: '700' },
  cardTitle: { color: '#10254A', fontSize: 17, fontWeight: '900' },
  cardBody: { color: '#41536F', fontSize: 12.5, lineHeight: 19, marginTop: 8 },
  cardTypeDark: { color: '#E2E8F0' },
  cardTimeDark: { color: '#94A3B8' },
  cardTitleDark: { color: '#F8FAFC' },
  cardBodyDark: { color: '#CBD5E1' },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIconWrapDark: { backgroundColor: 'rgba(255,255,255,0.06)' },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptyTitleDark: { color: '#F1F5F9' },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  emptySubDark: { color: '#94A3B8' },
});
