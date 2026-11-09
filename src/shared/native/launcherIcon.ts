import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type BundledLauncherIconKey = 'default' | 'diwali' | 'republic-day';

const BUNDLED_KEYS = new Set<BundledLauncherIconKey>([
  'default',
  'diwali',
  'republic-day',
]);

export type LauncherIconSyncResult =
  | 'changed'
  | 'unchanged'
  | 'unsupported'
  | 'invalid';

export async function syncLauncherIcon(
  nativeKey?: string | null,
): Promise<LauncherIconSyncResult> {
  if (!nativeKey || !BUNDLED_KEYS.has(nativeKey as BundledLauncherIconKey)) {
    return 'invalid';
  }
  const isExpoGo = Constants.appOwnership === 'expo'
    || Constants.executionEnvironment === 'storeClient';
  if (Platform.OS === 'web' || isExpoGo) {
    return 'unsupported';
  }

  try {
    // Check the native registry before loading the package. Expo Go does not
    // bundle AwesomeAppIcon, and importing its JS wrapper first would throw.
    const { requireOptionalNativeModule } = require('expo-modules-core') as typeof import('expo-modules-core');
    if (!requireOptionalNativeModule('AwesomeAppIcon')) return 'unsupported';

    // Delayed require keeps older installed builds usable; the native module
    // exists only in builds made after this feature ships.
    const iconModule = require('expo-awesome-app-icon') as typeof import('expo-awesome-app-icon');
    if (!iconModule.supportsAlternateIcons()) return 'unsupported';

    const requested = nativeKey === 'default' ? null : nativeKey;
    const available = iconModule.getAvailableIcons();
    if (requested && !available.includes(requested)) return 'invalid';

    const current = iconModule.getAppIconState().selected;
    if (current === requested) return 'unchanged';

    await iconModule.setAppIcon(requested, {
      // Android launchers can terminate the activity whose alias is disabled.
      // Applying after backgrounding avoids interrupting the current session.
      deferUntilBackground: Platform.OS === 'android',
    });
    return 'changed';
  } catch {
    return 'unsupported';
  }
}
