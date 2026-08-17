import { useCallback, useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AuthProvider } from '../shared/context/AuthContext';
import { AppDataProvider } from '../shared/context/AppDataContext';
import { AppGate } from '../shared/components/AppGate';
import { useFonts } from 'expo-font';
import { configureNotificationHandler } from '@/shared/notifications/nativeNotifications';
import { AnimatedLaunchScreen } from '@/shared/components/AnimatedLaunchScreen';

// Keep large OEM display-font settings readable without letting action labels
// grow beyond their buttons on narrow Android screens.
const TextDefaults = Text as typeof Text & { defaultProps?: Record<string, unknown> };
const InputDefaults = TextInput as typeof TextInput & { defaultProps?: Record<string, unknown> };
TextDefaults.defaultProps = { ...TextDefaults.defaultProps, maxFontSizeMultiplier: 1.25 };
InputDefaults.defaultProps = { ...InputDefaults.defaultProps, maxFontSizeMultiplier: 1.25 };

export default function RootLayout() {
  const [showLaunchScreen, setShowLaunchScreen] = useState(true);

  useEffect(() => {
    void configureNotificationHandler();
  }, []);

  // Load custom fonts globally so all screens have them ready
  const [fontsLoaded] = useFonts({
    LaconicBold: require('../../assets/fonts/Laconic_Bold.otf'),
  });

  const finishLaunch = useCallback(() => setShowLaunchScreen(false), []);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <AppDataProvider>
          <AppGate>
            <Stack screenOptions={{ headerShown: false }} />
            {showLaunchScreen ? <AnimatedLaunchScreen onFinished={finishLaunch} /> : null}
          </AppGate>
        </AppDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
