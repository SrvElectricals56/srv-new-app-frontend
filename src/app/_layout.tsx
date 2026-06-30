import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AuthProvider } from '../shared/context/AuthContext';
import { AppDataProvider } from '../shared/context/AppDataContext';
import { AppGate } from '../shared/components/AppGate';
import { useFonts } from 'expo-font';
import { configureNotificationHandler } from '@/shared/notifications/nativeNotifications';

export default function RootLayout() {
  useEffect(() => {
    void configureNotificationHandler();
  }, []);

  // Load custom fonts globally so all screens have them ready
  useFonts({
    LaconicBold: require('../../assets/fonts/Laconic_Bold.otf'),
  });

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <AuthProvider>
        <AppDataProvider>
          <AppGate>
            <Stack screenOptions={{ headerShown: false }} />
          </AppGate>
        </AppDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
