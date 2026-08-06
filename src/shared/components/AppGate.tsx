/**
 * AppGate
 * - maintenanceMode = true  → MaintenanceScreen (blocks app)
 * - forceUpdate = true      → ForceUpdateScreen ONLY if user hasn't
 *   already updated to the required version. Once they update and
 *   reopen the app with the new version, the gate won't show again
 *   until admin bumps minAppVersion again.
 */

import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { MaintenanceScreen } from './MaintenanceScreen';
import { ForceUpdateScreen } from './ForceUpdateScreen';
import { isAppPreviewSearch } from '../preview/appPreviewStore';

// Read the version embedded in the installed native build. This prevents the
// update gate drifting out of sync with app.json on future releases.
export const APP_VERSION = Constants.expoConfig?.version ?? '0.0.0';

type Props = { children: React.ReactNode };

export function AppGate({ children }: Props) {
  const { appSettings, refreshAll } = useAppData();
  const [showForceUpdate, setShowForceUpdate] = useState(false);
  const [showIosReviewMaintenance, setShowIosReviewMaintenance] = useState(false);
  const [checked, setChecked] = useState(false);
  const isPreviewMode =
    Platform.OS === 'web' &&
    typeof globalThis.location?.search === 'string' &&
    isAppPreviewSearch(globalThis.location.search);


  useEffect(() => {
    const check = () => {
      if (isPreviewMode) {
        setChecked(true);
        return;
      }

      if (!appSettings) {
        setChecked(true);
        return;
      }

      const requiredVersion = appSettings.minAppVersion ?? '0.0.0';

      // If current app version >= required version, no need to show update screen
      const comparison = compareVersions(APP_VERSION, requiredVersion);
      
      if (comparison >= 0) {
        setShowForceUpdate(false);
        setShowIosReviewMaintenance(false);
        setChecked(true);
        return;
      }

      if (Platform.OS === 'ios') {
        // iOS has its own release switch and never inherits the Android/Google
        // Play behavior. Flip it only after the new version is live in App Store.
        setShowForceUpdate(appSettings.iosUpdateAvailable === true);
        setShowIosReviewMaintenance(appSettings.iosUpdateAvailable !== true);
        setChecked(true);
        return;
      }

      if (!appSettings.forceUpdate) {
        setShowForceUpdate(false);
        setShowIosReviewMaintenance(false);
        setChecked(true);
        return;
      }

      // A required update cannot be dismissed. The gate disappears only after
      // the installed native version actually satisfies minAppVersion.
      setShowIosReviewMaintenance(false);
      setShowForceUpdate(true);
      setChecked(true);
    };

    check();
  }, [appSettings, isPreviewMode]);

  const handleRetry = useCallback(() => {
    void refreshAll();
  }, [refreshAll]);

  if (isPreviewMode) {
    return <>{children}</>;
  }

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
        message={Platform.OS === 'ios' ? appSettings.iosUpdateMessage : appSettings.androidUpdateMessage}
      />
    );
  }

  // While an iOS release is awaiting approval, never send users to Google Play
  // or to an App Store version that is not available yet.
  if (showIosReviewMaintenance && appSettings) {
    return (
      <MaintenanceScreen
        message={appSettings.iosReviewMaintenanceMessage}
        onRetry={handleRetry}
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
