import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { usePreferenceContext } from '@/shared/preferences';
import { notificationsApi, storage } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';
import { Dialog } from '@/shared/components/Dialog';

export function NotificationsPage({ onBack }: { onBack: () => void }) {
  const { t, tx, theme } = usePreferenceContext();
  const { role, user } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'notifications');
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message: string; confirmLabel?: string; onConfirm?: () => void }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));
  const notifScope = `${role ?? 'guest'}:${user?.id ?? 'guest'}`;
  const [notifData, setNotifData] = useState<
    { id: string; title: string; body: string; time: string }[]
  >([]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const [res, seenIds, clearedIds] = await Promise.all([
        notificationsApi.getAll(role ?? undefined, user?.id),
        storage.getSeenNotificationIds(notifScope),
        storage.getClearedNotificationIds(notifScope),
      ]);
      const data = (res.data ?? []).filter((n: any) => !clearedIds.has(String(n.id)));
      setReadIds(Array.from(seenIds));
      setNotifData(
        data.map((n: any) => ({
          id: String(n.id),
          title: n.title ?? '',
          body: n.message ?? n.body ?? '',
          time: new Date(n.sentAt ?? n.createdAt ?? Date.now()).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }))
      );
    } catch {
      setNotifData([]);
    } finally {
      setLoading(false);
    }
  }, [notifScope, role, user?.id]);

  const handleClearNotification = useCallback(async (id: string) => {
    await storage.clearNotifications([id], notifScope);
    setNotifData((current) => current.filter((notification) => notification.id !== id));
    setReadIds((current) => current.filter((readId) => readId !== id));
  }, [notifScope]);

  const handleClearAllNotifications = useCallback(() => {
    if (!notifData.length) return;
    setDialog({
      visible: true, variant: 'destructive', title: tx('Clear all notifications'), message: tx('This will hide all current notifications only for your account.'),
      confirmLabel: tx('Clear All'),
      onConfirm: async () => {
        await storage.clearNotifications(notifData.map((notification) => notification.id), notifScope);
        setNotifData([]);
        setReadIds([]);
      },
    });
  }, [notifData, notifScope, tx]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <PageHeader title={pageContent.pageTitle || t('notification')} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {notifData.length > 0 ? (
          <View style={styles.topActionRow}>
            <TouchableOpacity
              onPress={handleClearAllNotifications}
              style={[styles.clearAllBtn, { backgroundColor: theme.soft, borderColor: theme.border }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.clearAllBtnText, { color: theme.textPrimary }]}>{tx('Clear All')}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {loading ? (
          <ActivityIndicator color={theme.accent} style={{ marginTop: 32 }} />
        ) : notifData.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              {pageContent.emptyStateTitle || tx('No notifications yet.')}
            </Text>
          </View>
        ) : (
          notifData.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[
                styles.card,
                { backgroundColor: theme.surface, borderColor: theme.border },
                readIds.includes(n.id) && { opacity: 0.65 },
              ]}
              onPress={async () => {
                if (readIds.includes(n.id)) return;
                const nextReadIds = [...readIds, n.id];
                setReadIds(nextReadIds);
                await storage.markNotificationsAsSeen([n.id], notifScope);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.iconWrap}>
                <AppIcon name="notification" size={20} color={C.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: theme.textPrimary }]}>{n.title}</Text>
                  {!readIds.includes(n.id) && <View style={styles.unreadDot} />}
                </View>
                <Text style={[styles.sub, { color: theme.textMuted }]}>{n.body}</Text>
              </View>
              <View style={styles.metaColumn}>
                <Text style={[styles.meta, { color: theme.textMuted }]}>{n.time}</Text>
                <TouchableOpacity
                  onPress={() => void handleClearNotification(n.id)}
                  style={[styles.clearBtn, { backgroundColor: theme.soft, borderColor: theme.border }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.clearBtnText, { color: theme.textPrimary }]}>{tx('Clear')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
      <Dialog
        visible={dialog.visible}
        variant={dialog.variant}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        onConfirm={dialog.onConfirm}
        onClose={closeDialog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: { padding: 16, gap: 12, paddingBottom: 32 },
  topActionRow: { alignItems: 'flex-end' },
  clearAllBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  clearAllBtnText: { fontSize: 11.5, fontWeight: '800' },
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
    backgroundColor: C.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 14, fontWeight: '800' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sub: { fontSize: 12, marginTop: 3 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary },
  meta: { fontSize: 11, fontWeight: '600' },
  metaColumn: { alignItems: 'flex-end', gap: 6 },
  clearBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  clearBtnText: { fontSize: 11, fontWeight: '800' },
  emptyCard: {
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
