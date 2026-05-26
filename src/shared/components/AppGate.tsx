/**
 * AppGate
 * - maintenanceMode = true  → MaintenanceScreen (blocks app)
 * - forceUpdate = true      → ForceUpdateScreen ONLY if user hasn't
 *   already updated to the required version. Once they update and
 *   reopen the app with the new version, the gate won't show again
 *   until admin bumps minAppVersion again.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { MaintenanceScreen } from './MaintenanceScreen';
import { ForceUpdateScreen } from './ForceUpdateScreen';
import { isAppPreviewSearch } from '../preview/appPreviewStore';

// ── Current app version — keep in sync with app.json ─────────────────────────
export const APP_VERSION = '1.0.0';

// Storage key: stores the minAppVersion the user last acknowledged/updated to
const STORAGE_KEY = 'srv_force_update_dismissed_version';

type Props = { children: React.ReactNode };

export function AppGate({ children }: Props) {
  const { appSettings, refreshAll } = useAppData();
  const [showForceUpdate, setShowForceUpdate] = useState(false);
  const [checked, setChecked] = useState(false);
  const isPreviewMode =
    Platform.OS === 'web' &&
    typeof globalThis.location?.search === 'string' &&
    isAppPreviewSearch(globalThis.location.search);

  if (isPreviewMode) {
    return <>{children}</>;
  }

  // Check if this force-update has already been dismissed for this version
  useEffect(() => {
    const check = async () => {
      if (!appSettings) {
        setChecked(true);
        return;
      }

      if (!appSettings.forceUpdate) {
        setShowForceUpdate(false);
        setChecked(true);
        return;
      }

      const requiredVersion = appSettings.minAppVersion ?? '0.0.0';

      // If current app version >= required version, no need to show update screen
      const comparison = compareVersions(APP_VERSION, requiredVersion);
      
      if (comparison >= 0) {
        setShowForceUpdate(false);
        setChecked(true);
        return;
      }

      // Check if user already dismissed this specific required version
      try {
        const dismissed = await AsyncStorage.getItem(STORAGE_KEY);
        if (dismissed === requiredVersion) {
          setShowForceUpdate(false);
        } else {
          setShowForceUpdate(true);
        }
      } catch {
        setShowForceUpdate(true);
      }
      setChecked(true);
    };

    check();
  }, [appSettings]);

  // Called when user taps "Update" — record that they acknowledged this version
  const handleGoToStore = useCallback(async () => {
    const requiredVersion = appSettings?.minAppVersion ?? '0.0.0';
    try {
      await AsyncStorage.setItem(STORAGE_KEY, requiredVersion);
    } catch { /* ignore */ }
    // Don't hide the screen — they need to actually update
    // Next time they open the app with new version, APP_VERSION >= required → gate won't show
  }, [appSettings?.minAppVersion]);

  const handleRetry = useCallback(() => {
    void refreshAll();
  }, [refreshAll]);

  // Wait until we've checked storage before rendering — show children immediately
  // to avoid a blank flash; gate screens will replace them once check resolves
  if (!checked) return <>{children}</>;

  // Force update — show only if current version is below required
  if (showForceUpdate && appSettings) {
    return (
      <ForceUpdateScreen
        currentVersion={APP_VERSION}
        minVersion={appSettings.minAppVersion}
        playStoreUrl={appSettings.playStoreUrl}
        appStoreUrl={appSettings.appStoreUrl}
        onGoToStore={handleGoToStore}
      />
    );
  }

  // Maintenance mode
  if (appSettings?.maintenanceMode) {
    return (
      <MaintenanceScreen
        message={appSettings.maintenanceMessage}
        onRetry={handleRetry}
      />
    );
  }

  return <>{children}</>;
}

// ── Semver comparison ─────────────────────────────────────────────────────────
// Returns: positive if a > b, 0 if equal, negative if a < b
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
