import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNav as DealerBottomNav } from '@/features/dealer/screens/BottomNav';
import { CallElectricianScreen as DealerCallElectricianScreen } from '@/features/dealer/screens/CallElectricianScreen';
import { ElectriciansScreen as DealerElectriciansScreen } from '@/features/dealer/screens/ElectriciansScreen';
import { HomeScreen as DealerHomeScreen } from '@/features/dealer/screens/HomeScreen';
import { MemberTierScreen as DealerMemberTierScreen } from '@/features/dealer/screens/MemberTierScreen';
import { ProfileScreen as DealerProfileScreen } from '@/features/dealer/screens/ProfileScreen';
import { ProductScreen as DealerProductScreen } from '@/features/dealer/screens/DealerProductScreen';
import { BottomNav as ElectricianBottomNav } from '@/features/electrician/screens/BottomNav';
import { ElectricianTierScreen } from '@/features/electrician/screens/ElectricianTierScreen';
import { HomeScreen as ElectricianHomeScreen } from '@/features/electrician/screens/HomeScreen';
import { NotificationScreen as ElectricianNotificationScreen } from '@/features/electrician/screens/NotificationScreen';
import { ProductScreen as ElectricianProductScreen } from '@/features/electrician/screens/ProductScreen';
import { ProfileScreen as ElectricianProfileScreen } from '@/features/electrician/screens/ProfileScreen';
import { RewardsScreen as ElectricianRewardsScreen } from '@/features/electrician/screens/RewardsScreen';
import { ScanScreen as ElectricianScanScreen } from '@/features/electrician/screens/ScanScreen';
import { WalletScreen as ElectricianWalletScreen } from '@/features/electrician/screens/WalletScreen';
import { BottomNav as UserBottomNav } from '@/features/user/screens/BottomNav';
import { HomeScreen as UserHomeScreen } from '@/features/user/screens/HomeScreen';
import { NotificationScreen as UserNotificationScreen } from '@/features/user/screens/NotificationScreen';
import { ProfileScreen as UserProfileScreen } from '@/features/user/screens/ProfileScreen';
import { RewardsScreen as UserRewardsScreen } from '@/features/user/screens/RewardsScreen';
import { CategoriesScreen as UserCategoriesScreen } from '@/features/user/screens/CategoriesScreen';
import { CartScreen as UserCartScreen, type CartItem } from '@/features/user/screens/CartScreen';
import { PlayScreen as UserPlayScreen } from '@/features/user/screens/PlayScreen';
import { WalletScreen as UserWalletScreen } from '@/features/user/screens/WalletScreen';
import { AuthLandingScreen } from '@/features/profile/screens/AuthLandingScreen';
import {
  WalletBankDetailsScreen,
  WalletDealerBonusScreen,
  WalletTransferPointsScreen,
} from '@/features/profile/screens/WalletLinkedPages';
import { PreferenceContext, type AppLanguage, usePreferenceValue } from '@/shared/preferences';
import { colors } from '@/shared/theme/colors';
import type { Screen, UserRole } from '@/shared/types/navigation';
import type { RewardHistoryItem } from '@/shared/types/rewards';
import { GetStartedScreen } from '@/features/onboarding/GetStartedScreen';
import { useAuth } from '@/shared/context/AuthContext';
import { storage } from '@/shared/api';

type OnboardingStartOptions = {
  passwordConfigured?: boolean;
  passwordValue?: string;
};

export default function Index() {
  return <AppContent />;
}

function AppContent() {
  const { isAuthenticated, isLoading: authLoading, user, role: authRole, login, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [screenResetKey, setScreenResetKey] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [currentRole, setCurrentRole] = useState<UserRole>('electrician');
  const [authResolved, setAuthResolved] = useState(false);
  const [selectedProductCategory, setSelectedProductCategory] = useState('fanbox');
  const [language, setLanguage] = useState<AppLanguage>('English');
  const [darkMode, setDarkMode] = useState(false);
  const [passwordConfiguredByRole, setPasswordConfiguredByRole] = useState<
    Record<UserRole, boolean>
  >({
    dealer: false,
    electrician: false,
    user: false,
  });
  const [profilePhotoByRole, setProfilePhotoByRole] = useState<Record<UserRole, string | null>>({
    dealer: null,
    electrician: null,
    user: null,
  });
  const [passwordValueByRole, setPasswordValueByRole] = useState<Record<UserRole, string>>({
    dealer: '',
    electrician: '',
    user: '',
  });
  const [electricianRewardPoints, setElectricianRewardPoints] = useState(
    user?.totalPoints ?? 0
  );
  const [electricianRewardScans, setElectricianRewardScans] = useState(
    user?.totalScans ?? 0
  );
  const [electricianRewardHistory, setElectricianRewardHistory] = useState<RewardHistoryItem[]>([]);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
  const [userCartItems, setUserCartItems] = useState<CartItem[]>([]);

  const isDealer = currentRole === 'dealer';
  const isUser = currentRole === 'user';

  // Once auth loading is done, set initial state
  useEffect(() => {
    if (!authLoading && !authResolved) {
      setAuthResolved(true);
      if (isAuthenticated && user && authRole) {
        setCurrentRole(authRole as UserRole);
        // Sync points/scans from real API profile
        setElectricianRewardPoints(user.totalPoints ?? 0);
        setElectricianRewardScans(user.totalScans ?? 0);
        setShowOnboarding(false);
      }
    }
  }, [authLoading, authResolved, isAuthenticated, user, authRole]);

  // Keep points/scans in sync when user profile updates (admin changes reflected)
  // Always use server value — admin can increase OR decrease points
  useEffect(() => {
    if (user) {
      if (user.totalPoints !== undefined) {
        setElectricianRewardPoints(user.totalPoints);
      }
      if (user.totalScans !== undefined) {
        setElectricianRewardScans(user.totalScans);
      }
      // Sync profile photo from API — always use server value as source of truth
      const role = authRole as UserRole;
      if (role) {
        setProfilePhotoByRole((current) => {
          const serverPhoto = user.profileImage ?? null;
          if (current[role] !== serverPhoto) {
            return { ...current, [role]: serverPhoto };
          }
          return current;
        });
      }
    }
  }, [user?.totalPoints, user?.totalScans, user?.profileImage, authRole]);

  // Fetch unread notification count — poll every 30s when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const checkUnread = async () => {
      try {
        const { notificationsApi: notifApi } = await import('@/shared/api');
        const res = await notifApi.getAll(authRole as string, user.id);
        if (!res.data?.length) { setHasUnreadNotif(false); return; }
        const seenIds = await storage.getSeenNotificationIds();
        const hasNew = res.data.some((n: any) => !seenIds.has(n.id));
        setHasUnreadNotif(hasNew);
      } catch { /* silent */ }
    };
    void checkUnread();
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id, authRole]);

  const preferenceValue = usePreferenceValue({
    language,
    setLanguage,
    darkMode,
    setDarkMode,
    currentRole,
  });
  const appTheme = preferenceValue.theme;
  const statusBarStyle = darkMode ? 'light' : 'dark';

  const handleNavigate = useCallback(
    (screen: Screen) => {
      if (screen === currentScreen) {
        // Don't reset key for electricians screen — it causes unnecessary re-mount
        if (screen !== 'electricians') {
          setScreenResetKey((current) => current + 1);
        }
      }

      if (screen === 'product') {
        setSelectedProductCategory((current) => current || 'fanbox');
      }

      setCurrentScreen(screen);
    },
    [currentScreen]
  );

  const handleOpenProductCategory = useCallback((category: string) => {
    setSelectedProductCategory(category);
    setCurrentScreen('product');
  }, []);

  const handleAddToCart = useCallback((item: CartItem) => {
    setUserCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const handleUpdateCartQty = useCallback((id: string, qty: number) => {
    setUserCartItems((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  }, []);

  const handleRemoveFromCart = useCallback((id: string) => {
    setUserCartItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleSignOut = useCallback(() => {
    void (async () => {
      await logout(); // clears storage + resets AuthContext state
      setShowOnboarding(true);
      setCurrentRole('electrician');
      setCurrentScreen('home');
      setSelectedProductCategory('fanbox');
      setElectricianRewardPoints(0);
      setElectricianRewardScans(0);
      setElectricianRewardHistory([]);
      setHasUnreadNotif(false);
    })();
  }, [logout]);

  const handleNotificationsSeen = useCallback(() => {
    setHasUnreadNotif(false);
  }, []);

  const handleAuthenticatedRoleStart = useCallback(
    (role: UserRole, options?: OnboardingStartOptions) => {
      if (typeof options?.passwordConfigured === 'boolean') {
        setPasswordConfiguredByRole((current) => ({
          ...current,
          [role]: options.passwordConfigured,
        }));
        if (!options.passwordConfigured) {
          setPasswordValueByRole((current) => ({ ...current, [role]: '' }));
        }
      }

      if (typeof options?.passwordValue === 'string') {
        setPasswordValueByRole((current) => ({
          ...current,
          [role]: options.passwordValue,
        }));
      }

      const realUser = (globalThis as any).__srvLoginUser;
      if (realUser) {
        login(realUser, role);
        if (role === 'electrician') {
          setElectricianRewardPoints(realUser.totalPoints ?? 0);
          setElectricianRewardScans(realUser.totalScans ?? 0);
        }
        delete (globalThis as any).__srvLoginUser;
      }

      setCurrentRole(role);
      setCurrentScreen('home');
      setShowOnboarding(false);
    },
    [login]
  );

  const handleElectricianRewardCommit = useCallback(
    (items: Omit<RewardHistoryItem, 'id' | 'time'>[]) => {
      if (!items.length) {
        return { addedPoints: 0, addedScans: 0 };
      }

      const committedItems = items.map((item, index) => ({
        ...item,
        id: `${item.code}-${Date.now()}-${index}`,
        time: new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
      const addedPoints = committedItems.reduce((sum, item) => sum + item.points, 0);

      setElectricianRewardPoints((current) => current + addedPoints);
      setElectricianRewardScans((current) => current + committedItems.length);
      setElectricianRewardHistory((current) => [...committedItems.reverse(), ...current]);

      return {
        addedPoints,
        addedScans: committedItems.length,
      };
    },
    []
  );

  const activeScreen = useMemo(() => {
    if (isDealer) {      switch (currentScreen) {
        case 'home':
          return (
            <DealerHomeScreen
              onNavigate={handleNavigate}
              onOpenProductCategory={handleOpenProductCategory}
              profilePhotoUri={profilePhotoByRole.dealer}
              hasUnreadNotif={hasUnreadNotif}
            />
          );
        case 'product':
          return <DealerProductScreen onNavigate={handleNavigate} />;
        case 'electricians':
          return <DealerElectriciansScreen onNavigate={handleNavigate} />;
        case 'call_electrician':
          return <DealerCallElectricianScreen />;
        case 'notification':
          return <ElectricianNotificationScreen onNavigate={handleNavigate} role="dealer" onNotificationsSeen={handleNotificationsSeen} />;
        case 'scan':
          return (
            <ElectricianScanScreen
              onNavigate={handleNavigate}
              rewardHistory={electricianRewardHistory}
              onCommitRewards={handleElectricianRewardCommit}
            />
          );
        case 'rewards':
          return <ElectricianRewardsScreen onBack={() => setCurrentScreen('home')} />;
        case 'wallet':
          return (
            <ElectricianWalletScreen
              role="dealer"
              onNavigate={handleNavigate}
              totalPoints={Math.round(electricianRewardPoints * 0.05)}
              totalScans={electricianRewardScans}
              historyItems={electricianRewardHistory}
            />
          );
        case 'profile':
          return isAuthenticated ? (
            <DealerProfileScreen
              onNavigate={handleNavigate}
              onSignOut={handleSignOut}
              hasPasswordConfigured={passwordConfiguredByRole.dealer}
              storedPassword={passwordValueByRole.dealer}
              onPasswordConfiguredChange={(configured) =>
                setPasswordConfiguredByRole((current) => ({ ...current, dealer: configured }))
              }
              onPasswordChange={(password) =>
                setPasswordValueByRole((current) => ({ ...current, dealer: password }))
              }
              language={language}
              onLanguageChange={setLanguage}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
              profilePhotoUri={profilePhotoByRole.dealer}
              onProfilePhotoChange={(photoUri) =>
                setProfilePhotoByRole((current) => ({ ...current, dealer: photoUri }))
              }
            />
          ) : (
            <AuthLandingScreen
              role="dealer"
              onAuthenticated={handleAuthenticatedRoleStart}
              onBack={() => {
                setShowOnboarding(true);
                setCurrentScreen('home');
              }}
            />
          );
        case 'dealer_tier':
          return <DealerMemberTierScreen onBack={() => setCurrentScreen('home')} />;
        case 'bank_details':
          return (
            <WalletBankDetailsScreen
              onBack={() => setCurrentScreen('wallet')}
              language={language}
              onLanguageChange={setLanguage}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
            />
          );
        case 'dealer_bonus':
          return (
            <WalletDealerBonusScreen
              onBack={() => setCurrentScreen('wallet')}
              language={language}
              onLanguageChange={setLanguage}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
            />
          );
        case 'transfer_points':
          return (
            <WalletTransferPointsScreen
              onBack={() => setCurrentScreen('wallet')}
              onNavigate={handleNavigate}
              language={language}
              onLanguageChange={setLanguage}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
            />
          );
        default:
          return (
            <DealerHomeScreen
              onNavigate={handleNavigate}
              onOpenProductCategory={handleOpenProductCategory}
              profilePhotoUri={profilePhotoByRole.dealer}
              hasUnreadNotif={hasUnreadNotif}
            />
          );
      }
    }

    if (isUser) {
      switch (currentScreen) {
        case 'home':
          return (
            <UserHomeScreen
              onNavigate={handleNavigate}
              onOpenProductCategory={handleOpenProductCategory}
              profilePhotoUri={profilePhotoByRole.user}
              totalPoints={electricianRewardPoints}
              totalScans={electricianRewardScans}
              hasUnreadNotif={hasUnreadNotif}
            />
          );
        case 'product':
          return <UserCategoriesScreen onNavigate={handleNavigate} onAddToCart={handleAddToCart} />;
        case 'play':
          return <UserPlayScreen onNavigate={handleNavigate} />;
        case 'notification':
          return <UserNotificationScreen onNavigate={handleNavigate} role="user" onNotificationsSeen={handleNotificationsSeen} />;
        case 'categories':
          return <UserCategoriesScreen onNavigate={handleNavigate} onAddToCart={handleAddToCart} />;
        case 'cart':
          return (
            <UserCartScreen
              cartItems={userCartItems}
              onUpdateQty={handleUpdateCartQty}
              onRemove={handleRemoveFromCart}
              onNavigate={handleNavigate}
            />
          );
        case 'rewards':
          return <UserRewardsScreen onBack={() => setCurrentScreen('home')} />;
        case 'profile':
          return isAuthenticated ? (
            <UserProfileScreen
              onNavigate={handleNavigate}
              onSignOut={handleSignOut}
              hasPasswordConfigured={passwordConfiguredByRole.user}
              storedPassword={passwordValueByRole.user}
              onPasswordConfiguredChange={(configured) =>
                setPasswordConfiguredByRole((current) => ({ ...current, user: configured }))
              }
              onPasswordChange={(password) =>
                setPasswordValueByRole((current) => ({ ...current, user: password }))
              }
              language={language}
              onLanguageChange={setLanguage}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
              profilePhotoUri={profilePhotoByRole.user}
              onProfilePhotoChange={(photoUri) =>
                setProfilePhotoByRole((current) => ({ ...current, user: photoUri }))
              }
              totalPoints={electricianRewardPoints}
              totalScans={electricianRewardScans}
            />
          ) : (
            <AuthLandingScreen
              role="user"
              onAuthenticated={handleAuthenticatedRoleStart}
              onBack={() => {
                setShowOnboarding(true);
                setCurrentScreen('home');
              }}
            />
          );
        case 'wallet':
          return (
            <UserWalletScreen
              role="user"
              onNavigate={handleNavigate}
              totalPoints={electricianRewardPoints}
              totalScans={electricianRewardScans}
              historyItems={electricianRewardHistory}
            />
          );
        default:
          return (
            <UserHomeScreen
              onNavigate={handleNavigate}
              onOpenProductCategory={handleOpenProductCategory}
              profilePhotoUri={profilePhotoByRole.user}
              totalPoints={electricianRewardPoints}
              totalScans={electricianRewardScans}
              hasUnreadNotif={hasUnreadNotif}
            />
          );
      }
    }

    switch (currentScreen) {
      case 'home':
        return (
          <ElectricianHomeScreen
            onNavigate={handleNavigate}
            onOpenProductCategory={handleOpenProductCategory}
            profilePhotoUri={profilePhotoByRole.electrician}
            totalPoints={electricianRewardPoints}
            totalScans={electricianRewardScans}
            hasUnreadNotif={hasUnreadNotif}
          />
        );
      case 'product':
        return <ElectricianProductScreen onNavigate={handleNavigate} />;
      case 'notification':
        return <ElectricianNotificationScreen onNavigate={handleNavigate} role="electrician" onNotificationsSeen={handleNotificationsSeen} />;
      case 'scan':
        return (
          <ElectricianScanScreen
            onNavigate={handleNavigate}
            rewardHistory={electricianRewardHistory}
            onCommitRewards={handleElectricianRewardCommit}
          />
        );
      case 'rewards':
        return <ElectricianRewardsScreen onBack={() => setCurrentScreen('home')} />;
      case 'profile':
        return isAuthenticated ? (
          <ElectricianProfileScreen
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            hasPasswordConfigured={passwordConfiguredByRole.electrician}
            storedPassword={passwordValueByRole.electrician}
            onPasswordConfiguredChange={(configured) =>
              setPasswordConfiguredByRole((current) => ({ ...current, electrician: configured }))
            }
            onPasswordChange={(password) =>
              setPasswordValueByRole((current) => ({ ...current, electrician: password }))
            }
            language={language}
            onLanguageChange={setLanguage}
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
            profilePhotoUri={profilePhotoByRole.electrician}
            onProfilePhotoChange={(photoUri) =>
              setProfilePhotoByRole((current) => ({ ...current, electrician: photoUri }))
            }
            totalPoints={electricianRewardPoints}
            totalScans={electricianRewardScans}
          />
        ) : (
          <AuthLandingScreen
            role="electrician"
            onAuthenticated={handleAuthenticatedRoleStart}
            onBack={() => {
              setShowOnboarding(true);
              setCurrentScreen('home');
            }}
          />
        );
      case 'wallet':
        return (
          <ElectricianWalletScreen
            role="electrician"
            onNavigate={handleNavigate}
            totalPoints={electricianRewardPoints}
            totalScans={electricianRewardScans}
            historyItems={electricianRewardHistory}
          />
        );
      case 'electrician_tier':
        return <ElectricianTierScreen onBack={() => setCurrentScreen('home')} />;
      case 'bank_details':
        return (
          <WalletBankDetailsScreen
            onBack={() => setCurrentScreen('wallet')}
            language={language}
            onLanguageChange={setLanguage}
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
          />
        );
      case 'transfer_points':
        return (
          <WalletTransferPointsScreen
            onBack={() => setCurrentScreen('wallet')}
            onNavigate={handleNavigate}
            language={language}
            onLanguageChange={setLanguage}
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
          />
        );
      default:
        return (
          <ElectricianHomeScreen
            onNavigate={handleNavigate}
            onOpenProductCategory={handleOpenProductCategory}
            profilePhotoUri={profilePhotoByRole.electrician}
            totalPoints={electricianRewardPoints}
            totalScans={electricianRewardScans}
            hasUnreadNotif={hasUnreadNotif}
          />
        );
    }
  }, [
    currentScreen,
    isDealer,
    isUser,
    isAuthenticated,
    passwordConfiguredByRole.dealer,
    passwordConfiguredByRole.electrician,
    passwordConfiguredByRole.user,
    profilePhotoByRole.dealer,
    profilePhotoByRole.electrician,
    profilePhotoByRole.user,
    passwordValueByRole.dealer,
    passwordValueByRole.electrician,
    passwordValueByRole.user,
    electricianRewardHistory,
    electricianRewardPoints,
    electricianRewardScans,
    language,
    darkMode,
    selectedProductCategory,
    handleElectricianRewardCommit,
    handleNavigate,
    handleOpenProductCategory,
    handleSignOut,
    handleNotificationsSeen,
    handleAuthenticatedRoleStart,
    hasUnreadNotif,
    userCartItems,
    handleAddToCart,
    handleUpdateCartQty,
    handleRemoveFromCart,
  ]);

  if (showOnboarding) {
    return (
      <View style={styles.root}>
        <ExpoStatusBar style={statusBarStyle} />
        <PreferenceContext.Provider value={preferenceValue}>
          <GetStartedScreen
            onComplete={(role: UserRole) => {
              setCurrentRole(role);
              setCurrentScreen('home');
              setShowOnboarding(false);
            }}
          />
        </PreferenceContext.Provider>
      </View>
    );
  }

  return (
    <PreferenceContext.Provider value={preferenceValue}>
      <View style={[styles.root, { backgroundColor: appTheme.bg }]}>
        <SafeAreaView style={[styles.safeArea, { backgroundColor: appTheme.bg }]} edges={['top']}>
          <ExpoStatusBar style={statusBarStyle} />
          <View style={styles.content} key={`${currentRole}-${currentScreen}-${screenResetKey}`}>
            {activeScreen}
          </View>
        </SafeAreaView>
        {isDealer ? (
          <DealerBottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
        ) : isUser ? (
          <UserBottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
        ) : (
          <ElectricianBottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
        )}
      </View>
    </PreferenceContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});


