import { Platform } from 'react-native';
import Constants from 'expo-constants';

type ExpoNotifications = typeof import('expo-notifications');

let notificationsPromise: Promise<ExpoNotifications | null> | null = null;

export function canUseNativeNotifications() {
  // Expo Go no longer includes Android remote-notification support. Avoid loading
  // the native module there; development and production builds remain supported.
  return Platform.OS !== 'web' && Constants.executionEnvironment !== 'storeClient';
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
      // The app renders its own smooth floating banner while foregrounded.
      // Android still displays the system notification while backgrounded.
      shouldShowBanner: false,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}
