import { Stack } from 'expo-router';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { AuthProvider } from '../shared/context/AuthContext';
import { AppDataProvider } from '../shared/context/AppDataContext';
import { AppGate } from '../shared/components/AppGate';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
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
