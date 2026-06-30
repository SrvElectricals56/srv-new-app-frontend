import Constants from 'expo-constants';
import { Platform } from 'react-native';

type ExpoNotifications = typeof import('expo-notifications');

let notificationsPromise: Promise<ExpoNotifications | null> | null = null;

export function canUseNativeNotifications() {
  return Platform.OS !== 'web' && (Constants as any).appOwnership !== 'expo';
}

export async function getNativeNotifications() {
  if (!canUseNativeNotifications()) return null;

  notificationsPromise ??= import('expo-notifications').catch((error) => {
    console.warn('Native notifications are unavailable in this runtime.', error?.message ?? error);
    return null;
  });

  return notificationsPromise;
}

export async function configureNotificationHandler() {
  const Notifications = await getNativeNotifications();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
