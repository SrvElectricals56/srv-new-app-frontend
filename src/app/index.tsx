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
import { BottomNav as CounterBoyBottomNav } from '@/features/counterboy/screens/BottomNav';
import { HomeScreen as CounterBoyHomeScreen } from '@/features/counterboy/screens/HomeScreen';
import { ProfileScreen as CounterBoyProfileScreen } from '@/features/counterboy/screens/ProfileScreen';
import { ProductScreen as CounterBoyProductScreen } from '@/features/counterboy/screens/ProductScreen';
import { NotificationScreen as CounterBoyNotificationScreen } from '@/features/counterboy/screens/NotificationScreen';
import { SupportScreen as CounterBoySupportScreen } from '@/features/counterboy/screens/SupportScreen';
import { BottomNav as UserBottomNav } from '@/features/user/screens/BottomNav';
import { HomeScreen as UserHomeScreen } from '@/features/user/screens/HomeScreen';
import { NotificationScreen as UserNotificationScreen } from '@/features/user/screens/NotificationScreen';
import { ProfileScreen as UserProfileScreen } from '@/features/user/screens/ProfileScreen';
import { RewardsScreen as UserRewardsScreen } from '@/features/user/screens/RewardsScreen';
import { CategoriesScreen as UserCategoriesScreen } from '@/features/user/screens/CategoriesScreen';
import { CartScreen as UserCartScreen, type CartItem } from '@/features/user/screens/CartScreen';
import { WalletScreen as UserWalletScreen } from '@/features/user/screens/WalletScreen';
import { AuthLandingScreen } from '@/features/profile/screens/AuthLandingScreen';
import { AccessFeatureGateScreen } from '@/features/profile/screens/AccessFeatureGateScreen';
import { ApprovalPendingScreen } from '@/features/profile/screens/ApprovalPendingScreen';
import { KYCPendingWalletScreen } from '@/features/profile/screens/KYCPendingWalletScreen';
import { RolePlayVideosScreen } from '@/features/profile/screens/RolePlayVideosScreen';
import type { SubPage } from '@/features/profile/components/ProfileShared';
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
import { useAppData } from '@/shared/context/AppDataContext';
import { storage } from '@/shared/api';
import type { AppContentPage } from '@/shared/config/appPageContent';
import {
  isRoleFeatureEnabled,
  resolveRolePageControls,
} from '@/shared/config/rolePageControls';
import {
  useAppPreviewBridge,
  useAppPreviewState,
} from '@/shared/preview/appPreviewStore';

type OnboardingStartOptions = {
  passwordConfigured?: boolean;
  passwordValue?: string;
};

function resolveRewardPoints(
  profile:
    | {
        totalPoints?: number | null;
        walletBalance?: number | null;
      }
    | null
    | undefined
) {
  return Math.max(
    Number(profile?.totalPoints ?? 0),
    Number(profile?.walletBalance ?? 0),
  );
}

function roleNeedsAdminApproval(role: UserRole | null | undefined): role is 'dealer' {
  return role === 'dealer';
}

function isApprovedAccountStatus(status?: string | null) {
  const normalized = String(status ?? '').trim().toLowerCase();
  return normalized === 'active' || normalized === 'approved';
}

function resolvePreviewTarget(
  role: UserRole,
  page: AppContentPage
): { screen: Screen; subPage: Exclude<SubPage, null> | null } {
  switch (page) {
    case 'home':
    case 'product':
    case 'play':
    case 'categories':
    case 'cart':
    case 'wallet':
    case 'profile':
    case 'rewards':
    case 'scan':
    case 'electricians':
    case 'call_electrician':
    case 'bank_details':
    case 'dealer_bonus':
    case 'transfer_points':
    case 'support':
      return { screen: page as Screen, subPage: null };
    case 'notifications':
      return { screen: 'notification', subPage: null };
    case 'member_tier':
      return {
        screen: role === 'dealer' ? 'dealer_tier' : 'electrician_tier',
        subPage: null,
      };
    case 'need_help':
      return { screen: 'profile', subPage: 'Need Help' };
    case 'contact_support':
      return { screen: 'profile', subPage: 'Contact Support' };
    case 'offers':
      return { screen: 'profile', subPage: 'Offers & Promotions' };
    case 'my_orders':
      return { screen: 'profile', subPage: 'My Orders' };
    case 'my_redemption':
      return { screen: 'profile', subPage: 'My Redemption' };
    case 'refer_friend':
      return { screen: 'profile', subPage: 'Refer To A Friend' };
    case 'scan_history':
      return { screen: 'profile', subPage: 'Scan History' };
    case 'privacy_policy':
      return { screen: 'profile', subPage: 'Privacy Policy' };
    case 'password':
      return { screen: 'profile', subPage: 'Password' };
    case 'app_settings':
      return { screen: 'profile', subPage: 'App Settings' };
    case 'rate_us':
      return { screen: 'profile', subPage: 'Rate Us' };
    default:
      return { screen: 'home', subPage: null };
  }
}

export default function Index() {
  return <AppContent />;
}

function AppContent() {
  const { isAuthenticated, isLoading: authLoading, user, role: authRole, login, logout } = useAuth();
  const { appSettings } = useAppData();
  useAppPreviewBridge();
  const previewState = useAppPreviewState();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [showOnboarding, setShowOnboarding] = useState(!previewState.enabled);
  const [currentRole, setCurrentRole] = useState<UserRole>('electrician');
  const [authResolved, setAuthResolved] = useState(false);
  const [selectedProductCategory, setSelectedProductCategory] = useState('all');
  const [language, setLanguage] = useState<AppLanguage>('English');
  const [darkMode, setDarkMode] = useState(false);
  const [guestAuthRole, setGuestAuthRole] = useState<UserRole | null>(null);
  const [passwordConfiguredByRole, setPasswordConfiguredByRole] = useState<
    Record<UserRole, boolean>
  >({
    dealer: false,
    electrician: false,
    user: false,
    counterboy: false,
  });
  const [profilePhotoByRole, setProfilePhotoByRole] = useState<Record<UserRole, string | null>>({
    dealer: null,
    electrician: null,
    user: null,
    counterboy: null,
  });
  const [passwordValueByRole, setPasswordValueByRole] = useState<Record<UserRole, string>>({
    dealer: '',
    electrician: '',
    user: '',
    counterboy: '',
  });
  const [electricianRewardPoints, setElectricianRewardPoints] = useState(
    resolveRewardPoints(user)
  );
  const [electricianRewardScans, setElectricianRewardScans] = useState(
    user?.totalScans ?? 0
  );
  const [electricianRewardHistory, setElectricianRewardHistory] = useState<RewardHistoryItem[]>([]);
  const [hasUnreadNotif, setHasUnreadNotif] = useState(false);
  const [userCartItems, setUserCartItems] = useState<CartItem[]>([]);
  const [profileInitialSubPage, setProfileInitialSubPage] = useState<Exclude<SubPage, null> | null>(
    null
  );
  const isPreviewMode = previewState.enabled;
  const previewTarget = useMemo(
    () => resolvePreviewTarget(previewState.role, previewState.page),
    [previewState.page, previewState.role]
  );

  const isDealer = currentRole === 'dealer';
  const isUser = currentRole === 'user';
  const isCounterBoy = currentRole === 'counterboy';
  const rolePageControls = useMemo(
    () =>
      resolveRolePageControls(
        isPreviewMode && previewState.rolePageControls
          ? previewState.rolePageControls
          : appSettings?.rolePageControls
      ),
    [appSettings?.rolePageControls, isPreviewMode, previewState.rolePageControls]
  );
  const pendingApprovalRole = !isPreviewMode && roleNeedsAdminApproval(authRole) && isAuthenticated && !isApprovedAccountStatus(user?.status)
    ? authRole
    : null;
  const resolvedCurrentScreen = isPreviewMode || isRoleFeatureEnabled(rolePageControls, currentRole, currentScreen)
    ? currentScreen
    : 'home';

  // Once auth loading is done, set initial state
  useEffect(() => {
    if (isPreviewMode) {
      setAuthResolved(true);
      setCurrentRole(previewState.role);
      setCurrentScreen(previewTarget.screen);
      setProfileInitialSubPage(previewTarget.subPage);
      setShowOnboarding(false);
      setGuestAuthRole(null);
      return;
    }

    if (!authLoading && !authResolved) {
      setAuthResolved(true);
      if (isAuthenticated && user && authRole) {
        setCurrentRole(authRole as UserRole);
        // Sync points/scans from real API profile
        setElectricianRewardPoints(resolveRewardPoints(user));
        setElectricianRewardScans(user.totalScans ?? 0);
        setShowOnboarding(false);
      }
    }
  }, [
    authLoading,
    authResolved,
    authRole,
    isAuthenticated,
    isPreviewMode,
    previewState.role,
    previewTarget.screen,
    previewTarget.subPage,
    user,
  ]);

  // Keep points/scans in sync when user profile updates (admin changes reflected)
  // Always use server value — admin can increase OR decrease points
  useEffect(() => {
    if (user) {
      if (user.totalPoints !== undefined || user.walletBalance !== undefined) {
        setElectricianRewardPoints(resolveRewardPoints(user));
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
  }, [user, authRole]);

  // Fetch unread notification count — poll every 30s when authenticated
  useEffect(() => {
    if (isPreviewMode) return;
    if (!isAuthenticated || !user) return;
    const checkUnread = async () => {
      try {
        const { notificationsApi: notifApi } = await import('@/shared/api');
        const res = await notifApi.getAll(authRole as string, user.id);
        if (!res.data?.length) { setHasUnreadNotif(false); return; }
        const notifScope = `${authRole ?? 'guest'}:${user.id}`;
        const [seenIds, clearedIds] = await Promise.all([
          storage.getSeenNotificationIds(notifScope),
          storage.getClearedNotificationIds(notifScope),
        ]);
        const hasNew = res.data.some((n: any) => !seenIds.has(n.id) && !clearedIds.has(n.id));
        setHasUnreadNotif(hasNew);
      } catch { /* silent */ }
    };
    void checkUnread();
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, [authRole, isAuthenticated, isPreviewMode, user]);

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
      if (!isRoleFeatureEnabled(rolePageControls, currentRole, screen)) {
        setCurrentScreen('home');
        return;
      }

      if (screen === currentScreen) {
        return;
      }

      if (screen === 'product') {
        setSelectedProductCategory((current) => current || 'all');
      }

      // Reset category when going back to home
      if (screen === 'home') {
        setSelectedProductCategory('all');
      }

      setCurrentScreen(screen);
    },
    [currentRole, currentScreen, rolePageControls]
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
    if (isPreviewMode) {
      return;
    }

    void (async () => {
      await logout(); // clears storage + resets AuthContext state
      setShowOnboarding(true);
      setCurrentRole('electrician');
      setCurrentScreen('home');
      setSelectedProductCategory('all');
      setElectricianRewardPoints(0);
      setElectricianRewardScans(0);
      setElectricianRewardHistory([]);
      setHasUnreadNotif(false);
    })();
  }, [isPreviewMode, logout]);

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

      const realUser = (globalThis as typeof globalThis & { __srvLoginUser?: typeof user }).__srvLoginUser;
      if (realUser) {
        login(realUser, role);
        if (role === 'electrician' || role === 'user' || role === 'counterboy') {
          setElectricianRewardPoints(resolveRewardPoints(realUser));
          setElectricianRewardScans(realUser.totalScans ?? 0);
        }
        delete (globalThis as typeof globalThis & { __srvLoginUser?: typeof user }).__srvLoginUser;
      } else {
        void (async () => {
          const storedProfile = await storage.getUserProfile<typeof user extends infer T ? Exclude<T, null> : never>();
          if (!storedProfile) return;
          login(storedProfile, role);
          if (role === 'electrician' || role === 'user' || role === 'counterboy') {
            setElectricianRewardPoints(resolveRewardPoints(storedProfile));
            setElectricianRewardScans(storedProfile.totalScans ?? 0);
          }
        })();
      }

      setCurrentRole(role);
      setCurrentScreen('home');
      setGuestAuthRole(null);
      setShowOnboarding(false);
    },
    [login]
  );

  const renderGuestFeatureGate = useCallback(
    (role: UserRole, featureTitle: string, featureDescription: string) => (
      <AccessFeatureGateScreen
        role={role}
        featureTitle={featureTitle}
        featureDescription={featureDescription}
        onOpenAuth={() => setGuestAuthRole(role)}
        onBack={() => setCurrentScreen('home')}
      />
    ),
    []
  );

  const renderGuestAuthLanding = useCallback(
    (role: UserRole) => (
      <AuthLandingScreen
        role={role}
        onAuthenticated={handleAuthenticatedRoleStart}
        onBack={() => {
          setShowOnboarding(true);
          setCurrentScreen('home');
        }}
      />
    ),
    [handleAuthenticatedRoleStart]
  );

  const handleUseAnotherApprovalNumber = useCallback(() => {
    void (async () => {
      const pendingRole = pendingApprovalRole;
      await logout();
      if (!pendingRole) {
        setShowOnboarding(true);
        return;
      }
      setCurrentRole(pendingRole);
      setCurrentScreen('profile');
      setGuestAuthRole(pendingRole);
      setShowOnboarding(false);
    })();
  }, [logout, pendingApprovalRole]);

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
    if (pendingApprovalRole) {
      return (
        <ApprovalPendingScreen
          role={pendingApprovalRole}
          accountStatus={user?.status}
          rejectionReason={user?.approvalRejectionReason}
          supportPhone={appSettings?.supportPhone}
          whatsappNumber={appSettings?.whatsappNumber}
          onUseAnotherNumber={handleUseAnotherApprovalNumber}
        />
      );
    }

    if (guestAuthRole) {
      return (
        <AuthLandingScreen
          role={guestAuthRole}
          onAuthenticated={handleAuthenticatedRoleStart}
          onBack={() => setGuestAuthRole(null)}
        />
      );
    }

    const getGuestFeatureCopy = (role: UserRole, screen: Screen) => {
      const labels: Record<UserRole, Partial<Record<Screen, { title: string; description: string }>>> = {
        dealer: {
          wallet: { title: 'Dealer Wallet', description: 'Login or signup to view your bonus wallet, payouts and linked account details.' },
          notification: { title: 'Dealer Notifications', description: 'Login or signup to see dealer alerts, updates and account messages.' },
          profile: { title: 'Dealer Profile', description: 'Login or signup to manage your dealer profile, password and app preferences.' },
          electricians: { title: 'Associated Electricians', description: 'Login or signup to manage your electrician network and dealer relationships.' },
          call_electrician: { title: 'Call Electrician', description: 'Login or signup to access your connected electricians and outreach tools.' },
          dealer_tier: { title: 'Dealer Tier', description: 'Login or signup to check your dealer growth level and next tier progress.' },
          bank_details: { title: 'Bank Transfer', description: 'Login or signup to request dealer bonus payouts and review linked bank details.' },
          transfer_points: { title: 'Transfers', description: 'Login or signup to access dealer transfer and linked wallet actions.' },
          dealer_bonus: { title: 'Dealer Bonus', description: 'Login or signup to view your bonus earnings and withdrawal requests.' },
        },
        user: {
          wallet: { title: 'Wallet', description: 'Login or signup to see your wallet balance, points and activity.' },
          notification: { title: 'Notifications', description: 'Login or signup to see your latest alerts, offers and updates.' },
          profile: { title: 'Profile', description: 'Login or signup to manage your profile, password and personal settings.' },
          rewards: { title: 'Gift Store', description: 'Login or signup to redeem rewards and explore member-only benefits.' },
          bank_details: { title: 'Bank Transfer', description: 'Login or signup to request bank payouts and review your linked account details.' },
          transfer_points: { title: 'Transfers', description: 'Login or signup to access point transfer and wallet actions.' },
        },
        counterboy: {
          wallet: { title: 'Wallet', description: 'Login or signup to view your points, rewards and account-linked wallet details.' },
          notification: { title: 'Notifications', description: 'Login or signup to read counter boy alerts, offers and updates.' },
          profile: { title: 'Profile', description: 'Login or signup to manage your profile, password and app preferences.' },
          bank_details: { title: 'Bank Transfer', description: 'Login or signup to request bank payouts and review your linked account details.' },
          transfer_points: { title: 'Transfers', description: 'Login or signup to access wallet-linked transfer actions.' },
        },
        electrician: {
          wallet: { title: 'Wallet', description: 'Login or signup to see your points, rewards history and linked account details.' },
          notification: { title: 'Notifications', description: 'Login or signup to read your latest alerts, offers and scan updates.' },
          profile: { title: 'Profile', description: 'Login or signup to manage your profile, password and electrician preferences.' },
          rewards: { title: 'Rewards', description: 'Login or signup to redeem gifts and access your earned member rewards.' },
          scan: { title: 'Scan & Earn', description: 'Login or signup to scan products, earn points and track scan history.' },
          electrician_tier: { title: 'Member Tier', description: 'Login or signup to view your tier progress and reward level benefits.' },
          bank_details: { title: 'Bank Transfer', description: 'Login or signup to request bank payouts and review your linked account details.' },
          transfer_points: { title: 'Transfer Points', description: 'Login or signup to transfer points and access wallet actions securely.' },
        },
      };

      return (
        labels[role][screen] ?? {
          title: 'Protected Feature',
          description: 'Login or signup to access this feature and continue with your account.',
        }
      );
    };

      const isGuestBlockedScreen = (role: UserRole, screen: Screen) => {
        const commonProtected: Screen[] = ['profile', 'wallet', 'notification', 'bank_details', 'transfer_points'];
        const roleSpecific: Record<UserRole, Screen[]> = {
          dealer: ['electricians', 'call_electrician', 'dealer_tier', 'dealer_bonus', ...commonProtected],
          user: ['rewards', ...commonProtected],
          counterboy: [...commonProtected],
          electrician: ['scan', 'rewards', 'electrician_tier', ...commonProtected],
        };
        return roleSpecific[role].includes(screen);
    };

    if (isDealer) {
      if (!isPreviewMode && !isAuthenticated && isGuestBlockedScreen('dealer', resolvedCurrentScreen)) {
        if (resolvedCurrentScreen === 'profile') {
          return renderGuestAuthLanding('dealer');
        }
        const feature = getGuestFeatureCopy('dealer', resolvedCurrentScreen);
        return renderGuestFeatureGate('dealer', feature.title, feature.description);
      }
      switch (resolvedCurrentScreen) {
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
          return <DealerProductScreen onNavigate={handleNavigate} initialCategory={selectedProductCategory} />;
        case 'play':
          return <RolePlayVideosScreen onBack={() => setCurrentScreen('home')} currentRole="dealer" />;
        case 'electricians':
          return <DealerElectriciansScreen onNavigate={handleNavigate} />;
        case 'call_electrician':
          return <DealerCallElectricianScreen />;
        case 'notification':
          return <ElectricianNotificationScreen onNavigate={handleNavigate} role="dealer" onNotificationsSeen={handleNotificationsSeen} />;
        case 'rewards':
          return <ElectricianRewardsScreen onBack={() => setCurrentScreen('profile')} />;
        case 'wallet': {
          const dealerKycStatus = user?.kycStatus ?? 'not_submitted';
          if (dealerKycStatus !== 'verified') {
            return (
              <KYCPendingWalletScreen
                onBack={() => setCurrentScreen('home')}
                onGoToKYC={() => {
                  setProfileInitialSubPage('KYC Verification');
                  setCurrentScreen('profile');
                }}
              />
            );
          }
          return (
            <ElectricianWalletScreen
              role="dealer"
              onNavigate={handleNavigate}
              totalPoints={Math.round(electricianRewardPoints * 0.05)}
              totalScans={electricianRewardScans}
              historyItems={electricianRewardHistory}
            />
          );
        }
        case 'profile':
          return (
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
              initialSubPage={profileInitialSubPage}
              onInitialSubPageConsumed={() => setProfileInitialSubPage(null)}
            />
          );
        case 'dealer_tier':
          return <DealerMemberTierScreen onBack={() => setCurrentScreen('home')} />;
        case 'bank_details':
          return (
            <WalletBankDetailsScreen
              onBack={() => setCurrentScreen('wallet')}
              onManageBankDetails={() => {
                setProfileInitialSubPage('Bank Details');
                setCurrentScreen('profile');
              }}
              language={language}
              onLanguageChange={setLanguage}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
              currentRole="dealer"
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
              currentRole="dealer"
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
              currentRole="dealer"
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
      if (!isPreviewMode && !isAuthenticated && isGuestBlockedScreen('user', resolvedCurrentScreen)) {
        if (resolvedCurrentScreen === 'profile') {
          return renderGuestAuthLanding('user');
        }
        const feature = getGuestFeatureCopy('user', resolvedCurrentScreen);
        return renderGuestFeatureGate('user', feature.title, feature.description);
      }
      switch (resolvedCurrentScreen) {
        case 'home':
          return (
            <UserHomeScreen
              onNavigate={handleNavigate}
              onOpenNeedHelp={() => {
                setProfileInitialSubPage('Need Help');
                setCurrentScreen('profile');
              }}
              onOpenProductCategory={handleOpenProductCategory}
              profilePhotoUri={profilePhotoByRole.user}
              totalPoints={electricianRewardPoints}
              totalScans={electricianRewardScans}
              hasUnreadNotif={hasUnreadNotif}
            />
          );
        case 'product':
          return <UserCategoriesScreen onNavigate={handleNavigate} onAddToCart={handleAddToCart} initialCategory={selectedProductCategory} />;
        case 'play':
          return <RolePlayVideosScreen onBack={() => setCurrentScreen('home')} currentRole="user" />;
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
          return <UserRewardsScreen onBack={() => setCurrentScreen('profile')} />;
        case 'profile':
          return (
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
              initialSubPage={profileInitialSubPage}
              onInitialSubPageConsumed={() => setProfileInitialSubPage(null)}
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
              onOpenNeedHelp={() => {
                setProfileInitialSubPage('Need Help');
                setCurrentScreen('profile');
              }}
              onOpenProductCategory={handleOpenProductCategory}
              profilePhotoUri={profilePhotoByRole.user}
              totalPoints={electricianRewardPoints}
              totalScans={electricianRewardScans}
              hasUnreadNotif={hasUnreadNotif}
            />
          );
      }
    }

    if (isCounterBoy) {
      if (!isPreviewMode && !isAuthenticated && isGuestBlockedScreen('counterboy', resolvedCurrentScreen)) {
        if (resolvedCurrentScreen === 'profile') {
          return renderGuestAuthLanding('counterboy');
        }
        const feature = getGuestFeatureCopy('counterboy', resolvedCurrentScreen);
        return renderGuestFeatureGate('counterboy', feature.title, feature.description);
      }
      switch (resolvedCurrentScreen) {
        case 'home':
          return (
            <CounterBoyHomeScreen
              onNavigate={handleNavigate}
              onOpenProductCategory={handleOpenProductCategory}
              profilePhotoUri={profilePhotoByRole.counterboy}
              hasUnreadNotif={hasUnreadNotif}
            />
          );
        case 'product':
          return <CounterBoyProductScreen onNavigate={handleNavigate} initialCategory={selectedProductCategory} />;
        case 'play':
          return <RolePlayVideosScreen onBack={() => setCurrentScreen('home')} currentRole="counterboy" />;
        case 'notification':
          return <CounterBoyNotificationScreen onNavigate={handleNavigate} role="counterboy" onNotificationsSeen={handleNotificationsSeen} />;
        case 'wallet':
          return (
            <ElectricianWalletScreen
              role="counterboy"
              onNavigate={handleNavigate}
              totalPoints={electricianRewardPoints}
              totalScans={electricianRewardScans}
              historyItems={electricianRewardHistory}
            />
          );
        case 'support':
          return <CounterBoySupportScreen onNavigate={handleNavigate} />;
        case 'profile':
          return (
            <CounterBoyProfileScreen
              onNavigate={handleNavigate}
              onSignOut={handleSignOut}
              hasPasswordConfigured={passwordConfiguredByRole.counterboy}
              storedPassword={passwordValueByRole.counterboy}
              onPasswordConfiguredChange={(configured) =>
                setPasswordConfiguredByRole((current) => ({ ...current, counterboy: configured }))
              }
              onPasswordChange={(password) =>
                setPasswordValueByRole((current) => ({ ...current, counterboy: password }))
              }
              language={language}
              onLanguageChange={setLanguage}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
              profilePhotoUri={profilePhotoByRole.counterboy}
              onProfilePhotoChange={(photoUri) =>
                setProfilePhotoByRole((current) => ({ ...current, counterboy: photoUri }))
              }
              totalPoints={electricianRewardPoints}
              totalScans={electricianRewardScans}
              initialSubPage={profileInitialSubPage}
              onInitialSubPageConsumed={() => setProfileInitialSubPage(null)}
            />
          );
        case 'bank_details':
          return (
            <WalletBankDetailsScreen
              onBack={() => setCurrentScreen('wallet')}
              onManageBankDetails={() => {
                setProfileInitialSubPage('Bank Details');
                setCurrentScreen('profile');
              }}
              language={language}
              onLanguageChange={setLanguage}
              darkMode={darkMode}
              onDarkModeChange={setDarkMode}
              currentRole="counterboy"
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
              currentRole="counterboy"
            />
          );
        default:
          return (
            <CounterBoyHomeScreen
              onNavigate={handleNavigate}
              onOpenProductCategory={handleOpenProductCategory}
              profilePhotoUri={profilePhotoByRole.counterboy}
              hasUnreadNotif={hasUnreadNotif}
            />
          );
      }
    }

    if (!isPreviewMode && !isAuthenticated && isGuestBlockedScreen('electrician', resolvedCurrentScreen)) {
      if (resolvedCurrentScreen === 'profile') {
        return renderGuestAuthLanding('electrician');
      }
      const feature = getGuestFeatureCopy('electrician', resolvedCurrentScreen);
      return renderGuestFeatureGate('electrician', feature.title, feature.description);
    }
    switch (resolvedCurrentScreen) {
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
        return (
          <ElectricianProductScreen
            onNavigate={handleNavigate}
            initialCategory={selectedProductCategory}
          />
        );
      case 'play':
        return <RolePlayVideosScreen onBack={() => setCurrentScreen('home')} currentRole="electrician" />;
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
        return <ElectricianRewardsScreen onBack={() => setCurrentScreen('profile')} />;
      case 'profile':
        return (
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
            initialSubPage={profileInitialSubPage}
            onInitialSubPageConsumed={() => setProfileInitialSubPage(null)}
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
        return (
          <ElectricianTierScreen
            onBack={() => setCurrentScreen('home')}
            totalPoints={electricianRewardPoints}
          />
        );
      case 'bank_details':
        return (
          <WalletBankDetailsScreen
            onBack={() => setCurrentScreen('wallet')}
            onManageBankDetails={() => {
              setProfileInitialSubPage('Bank Details');
              setCurrentScreen('profile');
            }}
            language={language}
            onLanguageChange={setLanguage}
            darkMode={darkMode}
            onDarkModeChange={setDarkMode}
            currentRole="electrician"
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
            currentRole="electrician"
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
    resolvedCurrentScreen,
    isDealer,
    isUser,
    isCounterBoy,
    isAuthenticated,
    passwordConfiguredByRole.dealer,
    passwordConfiguredByRole.electrician,
    passwordConfiguredByRole.user,
    passwordConfiguredByRole.counterboy,
    profilePhotoByRole.dealer,
    profilePhotoByRole.electrician,
    profilePhotoByRole.user,
    profilePhotoByRole.counterboy,
    passwordValueByRole.dealer,
    passwordValueByRole.electrician,
    passwordValueByRole.user,
    passwordValueByRole.counterboy,
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
    renderGuestFeatureGate,
    renderGuestAuthLanding,
    guestAuthRole,
    hasUnreadNotif,
    userCartItems,
    handleAddToCart,
    handleUpdateCartQty,
    handleRemoveFromCart,
    appSettings?.supportPhone,
    appSettings?.whatsappNumber,
    pendingApprovalRole,
    handleUseAnotherApprovalNumber,
    profileInitialSubPage,
    isPreviewMode,
    user?.status,
    user?.approvalRejectionReason,
    user?.kycStatus,
  ]);

  if (showOnboarding && !isPreviewMode) {
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
          <View style={styles.content}>
            {activeScreen}
          </View>
        </SafeAreaView>
        {!pendingApprovalRole ? (
          isDealer ? (
            <DealerBottomNav currentScreen={resolvedCurrentScreen} onNavigate={handleNavigate} />
          ) : isUser ? (
            <UserBottomNav currentScreen={resolvedCurrentScreen} onNavigate={handleNavigate} />
          ) : isCounterBoy ? (
            <CounterBoyBottomNav currentScreen={resolvedCurrentScreen} onNavigate={handleNavigate} />
          ) : (
            <ElectricianBottomNav currentScreen={resolvedCurrentScreen} onNavigate={handleNavigate} />
          )
        ) : null}
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
