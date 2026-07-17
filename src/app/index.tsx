import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, BackHandler, Easing, Keyboard, PanResponder, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
import { RewardsScreen as CounterBoyRewardsScreen } from '@/features/counterboy/screens/RewardsScreen';
import { BottomNav as UserBottomNav } from '@/features/user/screens/BottomNav';
import { HomeScreen as UserHomeScreen } from '@/features/user/screens/HomeScreen';
import { NotificationScreen as UserNotificationScreen } from '@/features/user/screens/NotificationScreen';
import { ProfileScreen as UserProfileScreen } from '@/features/user/screens/ProfileScreen';
import { RewardsScreen as UserRewardsScreen } from '@/features/user/screens/RewardsScreen';
import { CategoriesScreen as UserCategoriesScreen } from '@/features/user/screens/CategoriesScreen';
import { CartScreen as UserCartScreen, type CartItem } from '@/features/user/screens/CartScreen';
import { CheckoutScreen, type CheckoutItem } from '@/features/user/screens/CheckoutScreen';
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
import { NavActionProvider } from '@/shared/context/NavActionContext';
import { getNativeNotifications } from '@/shared/notifications/nativeNotifications';
import { PreferenceContext, type AppLanguage, usePreferenceValue } from '@/shared/preferences';
import { colors } from '@/shared/theme/colors';
import type { Screen, UserRole } from '@/shared/types/navigation';
import type { RewardHistoryItem } from '@/shared/types/rewards';
import { formatISTDateTime } from '@/shared/utils/dateIST';
import { GetStartedScreen } from '@/features/onboarding/GetStartedScreen';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppData } from '@/shared/context/AppDataContext';
import { activityApi, storage } from '@/shared/api';
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

function roleNeedsAdminApproval(role: UserRole | null | undefined): role is UserRole {
  return role === 'dealer' || role === 'electrician' || role === 'user';
}

function resolveAvailableAppRole(role: UserRole | null | undefined): UserRole {
  return role === 'dealer' || role === 'electrician' || role === 'user' ? role : 'electrician';
}

function isApprovedAccountStatus(status?: string | null, role?: UserRole | null) {
  const normalized = String(status ?? '').trim().toLowerCase();
  if (role === 'dealer' && normalized === 'pending') return true;
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
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notificationBanner, setNotificationBanner] = useState<{ id: string; title: string; message?: string } | null>(null);
  const notificationBannerY = useRef(new Animated.Value(-96)).current;
  const notificationBannerX = useRef(new Animated.Value(0)).current;
  const notificationBannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastBannerNotificationIdRef = useRef<string | null>(null);
  const [userCartItems, setUserCartItems] = useState<CartItem[]>([]);
  const [dealerCartItems, setDealerCartItems] = useState<CartItem[]>([]);
  const [counterboyCartItems, setCounterboyCartItems] = useState<CartItem[]>([]);
  const [electricianCartItems, setElectricianCartItems] = useState<CartItem[]>([]);
  const userCartCount = useMemo(() => userCartItems.reduce((total, item) => total + item.qty, 0), [userCartItems]);
  const dealerCartCount = useMemo(() => dealerCartItems.reduce((total, item) => total + item.qty, 0), [dealerCartItems]);
  const counterboyCartCount = useMemo(() => counterboyCartItems.reduce((total, item) => total + item.qty, 0), [counterboyCartItems]);
  const electricianCartCount = useMemo(() => electricianCartItems.reduce((total, item) => total + item.qty, 0), [electricianCartItems]);
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [profileInitialSubPage, setProfileInitialSubPage] = useState<Exclude<SubPage, null> | null>(
    null
  );

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
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
  const pendingApprovalRole = !isPreviewMode && roleNeedsAdminApproval(authRole) && isAuthenticated && !isApprovedAccountStatus(user?.status, authRole)
    ? authRole
    : null;
  const resolvedCurrentScreen = isPreviewMode || isRoleFeatureEnabled(rolePageControls, currentRole, currentScreen)
    ? currentScreen
    : 'home';

  useEffect(() => {
    if (isPreviewMode) {
      return;
    }

    void (async () => {
      const roles: UserRole[] = ['electrician', 'user', 'dealer'];
      const entries = await Promise.all(
        roles.map(async (role) => [role, await storage.getPasswordConfigured(role)] as const)
      );

      setPasswordConfiguredByRole((current) => {
        const next = { ...current };
        let changed = false;

        for (const [role, configured] of entries) {
          if (next[role] !== configured) {
            next[role] = configured;
            changed = true;
          }
        }

        return changed ? next : current;
      });
    })();
  }, [isPreviewMode]);

  // Once auth loading is done, set initial state
  useEffect(() => {
    if (isPreviewMode) {
      setAuthResolved(true);
      setCurrentRole(resolveAvailableAppRole(previewState.role));
      setCurrentScreen(previewTarget.screen);
      setProfileInitialSubPage(previewTarget.subPage);
      setShowOnboarding(false);
      setGuestAuthRole(null);
      return;
    }

    if (!authLoading && !authResolved) {
      setAuthResolved(true);
      if (isAuthenticated && user && authRole) {
        const availableRole = resolveAvailableAppRole(authRole as UserRole);
        if (authRole === 'counterboy') {
          void logout();
          setCurrentRole('electrician');
          setShowOnboarding(true);
          return;
        }
        setCurrentRole(availableRole);
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
    logout,
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

  const hideNotificationBanner = useCallback(
    (direction: 'up' | 'side' = 'up') => {
      if (notificationBannerTimerRef.current) {
        clearTimeout(notificationBannerTimerRef.current);
        notificationBannerTimerRef.current = null;
      }
      Animated.parallel([
        Animated.timing(notificationBannerY, {
          toValue: direction === 'up' ? -96 : 0,
          duration: 120,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(notificationBannerX, {
          toValue: direction === 'side' ? 420 : 0,
          duration: 120,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        notificationBannerX.setValue(0);
        notificationBannerY.setValue(-96);
        setNotificationBanner(null);
      });
    },
    [notificationBannerX, notificationBannerY]
  );

  const notificationBannerPanResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 5 || gesture.dy < -5,
        onPanResponderMove: (_, gesture) => {
          notificationBannerX.setValue(gesture.dx);
          if (gesture.dy < 0) {
            notificationBannerY.setValue(gesture.dy);
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (Math.abs(gesture.dx) > 42 || Math.abs(gesture.vx) > 0.22) {
            hideNotificationBanner('side');
            return;
          }
          if (gesture.dy < -18 || gesture.vy < -0.22) {
            hideNotificationBanner('up');
            return;
          }
          Animated.parallel([
            Animated.spring(notificationBannerX, {
              toValue: 0,
              speed: 28,
              bounciness: 0,
              useNativeDriver: true,
            }),
            Animated.spring(notificationBannerY, {
              toValue: 0,
              speed: 28,
              bounciness: 0,
              useNativeDriver: true,
            }),
          ]).start();
        },
      }),
    [hideNotificationBanner, notificationBannerX, notificationBannerY]
  );

  // Fetch unread notification count — poll every 30s when authenticated
  const showNotificationBanner = useCallback((notification: any) => {
    const content = notification?.request?.content ?? notification;
    const id = String(content?.data?.notificationId ?? notification?.id ?? notification?.request?.identifier ?? 'notification');
    if (lastBannerNotificationIdRef.current === id) return;
    lastBannerNotificationIdRef.current = id;
    if (notificationBannerTimerRef.current) clearTimeout(notificationBannerTimerRef.current);
    setNotificationBanner({
      id,
      title: content?.title ?? notification?.title ?? 'New notification',
      message: content?.body ?? notification?.message ?? notification?.body ?? '',
    });
    notificationBannerX.setValue(0);
    Animated.timing(notificationBannerY, {
      toValue: 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [notificationBannerX, notificationBannerY]);

  // The timeout belongs to the rendered banner, not to the notification request.
  // This makes every visible banner dismiss itself after ten seconds, even when
  // a notification is delivered while other app state is updating.
  useEffect(() => {
    if (!notificationBanner) return;
    if (notificationBannerTimerRef.current) clearTimeout(notificationBannerTimerRef.current);
    notificationBannerTimerRef.current = setTimeout(() => hideNotificationBanner('up'), 5000);
    return () => {
      if (notificationBannerTimerRef.current) {
        clearTimeout(notificationBannerTimerRef.current);
        notificationBannerTimerRef.current = null;
      }
    };
  }, [hideNotificationBanner, notificationBanner]);

  useEffect(() => {
    if (!isAuthenticated || !user || isPreviewMode) return;
    let subscription: { remove: () => void } | null = null;
    void (async () => {
      const Notifications = await getNativeNotifications();
      if (!Notifications) return;
      subscription = Notifications.addNotificationReceivedListener((notification) => {
        if (currentScreen !== 'notification') showNotificationBanner(notification);
      });
    })();
    return () => subscription?.remove();
  }, [currentScreen, isAuthenticated, isPreviewMode, showNotificationBanner, user]);

  useEffect(() => {
    if (isPreviewMode) return;
    if (!isAuthenticated || !user) return;
    const checkUnread = async () => {
      try {
        const notificationsEnabled = await storage.getPushNotificationsEnabled();
        if (!notificationsEnabled) {
          setHasUnreadNotif(false);
          setUnreadNotifCount(0);
          setNotificationBanner(null);
          return;
        }
        const { notificationsApi: notifApi } = await import('@/shared/api');
        const res = await notifApi.getAll(authRole as string, user.id);
        if (!res.data?.length) { setHasUnreadNotif(false); setUnreadNotifCount(0); return; }
        const notifScope = `${authRole ?? 'guest'}:${user.id}`;
        const [seenIds, clearedIds] = await Promise.all([
          storage.getSeenNotificationIds(notifScope),
          storage.getClearedNotificationIds(notifScope),
        ]);
        const unreadItems = res.data.filter((n: any) => !seenIds.has(n.id) && !clearedIds.has(n.id));
        const unreadCount = unreadItems.length;
        setUnreadNotifCount(unreadCount);
        setHasUnreadNotif(unreadCount > 0);
        const newestUnread = unreadItems[0];
        if (newestUnread && currentScreen !== 'notification') showNotificationBanner(newestUnread);
      } catch { /* silent */ }
    };
    void checkUnread();
    const interval = setInterval(checkUnread, 30000);
    return () => {
      clearInterval(interval);
    };
  }, [authRole, currentScreen, isAuthenticated, isPreviewMode, showNotificationBanner, user]);

  const preferenceValue = usePreferenceValue({
    language,
    setLanguage,
    darkMode,
    setDarkMode,
    currentRole,
  });
  const appTheme = preferenceValue.theme;
  const statusBarStyle = darkMode ? 'light' : 'dark';

  const scrollToTopFns = useRef<Map<string, () => void>>(new Map());
  const registerScrollToTop = useCallback((screenId: string, fn: () => void) => {
    scrollToTopFns.current.set(screenId, fn);
    return () => { scrollToTopFns.current.delete(screenId); };
  }, []);
  const [profileResetKey, setProfileResetKey] = useState(0);
  const screenStartRef = useRef({ screen: currentScreen, startedAt: Date.now() });
  const screenHistoryRef = useRef<Screen[]>([]);
  const lastScreenRef = useRef(currentScreen);
  const isHardwareBackRef = useRef(false);

  const trackActivity = useCallback((data: Parameters<typeof activityApi.track>[0]) => {
    void activityApi.track(data).catch(() => {});
  }, []);

  useEffect(() => {
    const previous = screenStartRef.current;
    const now = Date.now();
    if (previous.screen && previous.screen !== currentScreen) {
      trackActivity({
        eventType: 'screen_time',
        eventLabel: `Spent time on ${previous.screen}`,
        screen: previous.screen,
        durationMs: Math.max(0, now - previous.startedAt),
      });
    }
    trackActivity({
      eventType: currentScreen === 'profile' ? 'profile_view' : 'screen_view',
      eventLabel: currentScreen === 'profile' ? 'Opened Profile' : `Opened ${currentScreen}`,
      screen: currentScreen,
      previousScreen: previous.screen !== currentScreen ? previous.screen : undefined,
    });
    screenStartRef.current = { screen: currentScreen, startedAt: now };
  }, [currentScreen, trackActivity]);

  useEffect(() => () => {
    const current = screenStartRef.current;
    trackActivity({
      eventType: 'screen_time',
      eventLabel: `Spent time on ${current.screen}`,
      screen: current.screen,
      durationMs: Math.max(0, Date.now() - current.startedAt),
    });
  }, [trackActivity]);

  useEffect(() => {
    if (lastScreenRef.current === currentScreen) return;
    if (!isHardwareBackRef.current) {
      screenHistoryRef.current.push(lastScreenRef.current);
    }
    isHardwareBackRef.current = false;
    lastScreenRef.current = currentScreen;
  }, [currentScreen]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const previous = screenHistoryRef.current.pop();
      if (previous) {
        isHardwareBackRef.current = true;
        if (currentScreen === 'checkout') setCheckoutItem(null);
        setCurrentScreen(previous);
        return true;
      }
      if (currentScreen !== 'home') {
        isHardwareBackRef.current = true;
        if (currentScreen === 'checkout') setCheckoutItem(null);
        setCurrentScreen('home');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [currentScreen]);

  const handleNavigate = useCallback(
    (screen: Screen) => {
      trackActivity({
        eventType: 'button_tap',
        eventLabel: `Tapped ${screen}`,
        screen: currentScreen,
        metadata: { targetScreen: screen, role: currentRole },
      });

      if (!isRoleFeatureEnabled(rolePageControls, currentRole, screen)) {
        setCurrentScreen('home');
        setGuestAuthRole(null);
        return;
      }

      if (screen === 'my_redemption') {
        setProfileInitialSubPage('My Redemption');
        setCurrentScreen('profile');
        return;
      }

      // If auth landing is open (guestAuthRole set) and user taps a non-blocked screen,
      // dismiss the auth flow and navigate normally
      if (guestAuthRole && screen !== 'wallet' && screen !== 'profile') {
        setGuestAuthRole(null);
        setCurrentScreen(screen);
        return;
      }

      if (screen === currentScreen) {
        if (screen === 'profile') {
          setProfileResetKey((k) => k + 1);
        } else {
          scrollToTopFns.current.get(screen)?.();
        }
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
    [currentRole, currentScreen, guestAuthRole, rolePageControls, trackActivity]
  );

  const handleOpenProductCategory = useCallback((category: string) => {
    trackActivity({
      eventType: 'button_tap',
      eventLabel: `Opened product category ${category}`,
      screen: currentScreen,
      productCategory: category,
    });
    setSelectedProductCategory(category);
    setCurrentScreen('product');
  }, [currentScreen, trackActivity]);

  const handleOpenScanHistory = useCallback(() => {
    setProfileInitialSubPage('Scan History');
    setCurrentScreen('profile');
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

  const handleDealerAddToCart = useCallback((item: CartItem) => {
    setDealerCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const handleCounterboyAddToCart = useCallback((item: CartItem) => {
    setCounterboyCartItems((prev) => {
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

  const handleBuyNow = useCallback((item: CheckoutItem) => {
    setCheckoutItem(item);
    setCurrentScreen('checkout');
  }, []);

  const handleCartCheckout = useCallback(() => {
    if (userCartItems.length === 0) return;
    const first = userCartItems[0];
    setCheckoutItem({
      id: first.id,
      name: first.name,
      desc: first.desc,
      image: first.image,
      price: first.price,
      qty: first.qty,
      items: userCartItems.map((cartItem) => ({
        id: cartItem.id,
        name: cartItem.name,
        desc: cartItem.desc,
        image: cartItem.image,
        price: cartItem.price,
        qty: cartItem.qty,
      })),
      source: 'cart',
    });
    setCurrentScreen('checkout');
  }, [userCartItems]);

  const handleDealerUpdateCartQty = useCallback((id: string, qty: number) => {
    setDealerCartItems((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  }, []);

  const handleDealerRemoveFromCart = useCallback((id: string) => {
    setDealerCartItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleElectricianAddToCart = useCallback((item: CartItem) => {
    setElectricianCartItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }, []);

  const handleElectricianUpdateCartQty = useCallback((id: string, qty: number) => {
    setElectricianCartItems((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  }, []);

  const handleElectricianRemoveFromCart = useCallback((id: string) => {
    setElectricianCartItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleElectricianCartCheckout = useCallback(() => {
    if (electricianCartItems.length === 0) return;
    const first = electricianCartItems[0];
    setCheckoutItem({
      id: first.id,
      name: first.name,
      desc: first.desc,
      image: first.image,
      price: first.price,
      qty: first.qty,
      items: electricianCartItems.map((cartItem) => ({
        id: cartItem.id,
        name: cartItem.name,
        desc: cartItem.desc,
        image: cartItem.image,
        price: cartItem.price,
        qty: cartItem.qty,
      })),
      source: 'cart',
    });
    setCurrentScreen('checkout');
  }, [electricianCartItems]);

  const handleDealerCartCheckout = useCallback(() => {
    if (dealerCartItems.length === 0) return;
    const first = dealerCartItems[0];
    setCheckoutItem({
      id: first.id,
      name: first.name,
      desc: first.desc,
      image: first.image,
      price: first.price,
      qty: first.qty,
      items: dealerCartItems.map((cartItem) => ({
        id: cartItem.id,
        name: cartItem.name,
        desc: cartItem.desc,
        image: cartItem.image,
        price: cartItem.price,
        qty: cartItem.qty,
      })),
      source: 'cart',
    });
    setCurrentScreen('checkout');
  }, [dealerCartItems]);

  const handleCounterboyUpdateCartQty = useCallback((id: string, qty: number) => {
    setCounterboyCartItems((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  }, []);

  const handleCounterboyRemoveFromCart = useCallback((id: string) => {
    setCounterboyCartItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleCounterboyCartCheckout = useCallback(() => {
    if (counterboyCartItems.length === 0) return;
    const first = counterboyCartItems[0];
    setCheckoutItem({
      id: first.id,
      name: first.name,
      desc: first.desc,
      image: first.image,
      price: first.price,
      qty: first.qty,
      items: counterboyCartItems.map((cartItem) => ({
        id: cartItem.id,
        name: cartItem.name,
        desc: cartItem.desc,
        image: cartItem.image,
        price: cartItem.price,
        qty: cartItem.qty,
      })),
      source: 'cart',
    });
    setCurrentScreen('checkout');
  }, [counterboyCartItems]);

  const handleCheckoutUpdateQty = useCallback((id: string, qty: number) => {
    setCheckoutItem((prev) => prev
      ? {
          ...prev,
          qty: prev.id === id ? qty : prev.qty,
          items: prev.items?.map((cartItem) => cartItem.id === id ? { ...cartItem, qty } : cartItem),
        }
      : prev);
  }, []);

  const handleOrderPlaced = useCallback(() => {
    if (checkoutItem?.source === 'cart') {
      if (currentRole === 'dealer') {
        setDealerCartItems([]);
      } else if (currentRole === 'counterboy') {
        setCounterboyCartItems([]);
      } else if (currentRole === 'electrician') {
        setElectricianCartItems([]);
      } else {
        setUserCartItems([]);
      }
    }
    setCheckoutItem(null);
    setCurrentScreen('home');
  }, [checkoutItem?.source, currentRole]);

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
    setUnreadNotifCount(0);
  }, []);

  const handlePasswordConfiguredChange = useCallback((role: UserRole, configured: boolean) => {
    setPasswordConfiguredByRole((current) => ({ ...current, [role]: configured }));
    if (!configured) {
      setPasswordValueByRole((current) => ({ ...current, [role]: '' }));
    }
    void storage.setPasswordConfigured(role, configured);
  }, []);

  const handleAuthenticatedRoleStart = useCallback(
    (role: UserRole, options?: OnboardingStartOptions) => {
      if (role === 'counterboy') {
        setCurrentRole('electrician');
        setCurrentScreen('home');
        setGuestAuthRole(null);
        setShowOnboarding(true);
        return;
      }

      if (typeof options?.passwordConfigured === 'boolean') {
        handlePasswordConfiguredChange(role, options.passwordConfigured);
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
        if (role === 'electrician' || role === 'user') {
          setElectricianRewardPoints(resolveRewardPoints(realUser));
          setElectricianRewardScans(realUser.totalScans ?? 0);
        }
        delete (globalThis as typeof globalThis & { __srvLoginUser?: typeof user }).__srvLoginUser;
      } else {
        void (async () => {
          const storedProfile = await storage.getUserProfile<typeof user extends infer T ? Exclude<T, null> : never>();
          if (!storedProfile) return;
          login(storedProfile, role);
          if (role === 'electrician' || role === 'user') {
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
    [handlePasswordConfiguredChange, login]
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

  const handleLoginRequired = useCallback(() => {
    if (isPreviewMode || isAuthenticated) return;
    setGuestAuthRole(currentRole);
    setShowOnboarding(false);
  }, [currentRole, isAuthenticated, isPreviewMode]);

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
        time: formatISTDateTime(new Date().toISOString()),
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
          rewards: { title: 'Gift Store', description: 'Login or signup to redeem gifts and explore rewards with your earned points.' },
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
          counterboy: ['rewards', ...commonProtected],
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
              unreadNotificationCount={unreadNotifCount}
            />
          );
        case 'product':
          return <DealerProductScreen onNavigate={handleNavigate} onAddToCart={handleDealerAddToCart} onBuyNow={handleBuyNow} onLoginRequired={handleLoginRequired} initialCategory={selectedProductCategory} cartCount={dealerCartCount} />;
        case 'cart':
          return (
            <UserCartScreen
              cartItems={dealerCartItems}
              onUpdateQty={handleDealerUpdateCartQty}
              onRemove={handleDealerRemoveFromCart}
              onNavigate={handleNavigate}
              onCheckout={handleDealerCartCheckout}
              onCheckoutItem={handleBuyNow}
              role="dealer"
            />
          );
        case 'checkout':
          return checkoutItem ? (
            <CheckoutScreen
              item={checkoutItem}
              role="dealer"
              onBack={() => { setCheckoutItem(null); setCurrentScreen('product'); }}
              onOrderPlaced={handleOrderPlaced}
              onUpdateQty={handleCheckoutUpdateQty}
            />
          ) : null;
        case 'play':
          return <RolePlayVideosScreen onBack={() => setCurrentScreen('home')} currentRole="dealer" />;
        case 'electricians':
          return <DealerElectriciansScreen onNavigate={handleNavigate} />;
        case 'call_electrician':
          return <DealerCallElectricianScreen />;
        case 'notification':
          return <ElectricianNotificationScreen onNavigate={handleNavigate} role="dealer" onNotificationsSeen={handleNotificationsSeen} />;
        case 'rewards':
          return <ElectricianRewardsScreen onBack={() => setCurrentScreen('profile')} onOpenScanner={() => setCurrentScreen('scan')} />;
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
              onOpenScanHistory={handleOpenScanHistory}
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
                handlePasswordConfiguredChange('dealer', configured)
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
              profileResetKey={profileResetKey}
              cartCount={dealerCartCount}
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
              unreadNotificationCount={unreadNotifCount}
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
              unreadNotificationCount={unreadNotifCount}
            />
          );
        case 'product':
          return <UserCategoriesScreen onNavigate={handleNavigate} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} onLoginRequired={handleLoginRequired} initialCategory={selectedProductCategory} cartCount={userCartCount} />;
        case 'play':
          return <RolePlayVideosScreen onBack={() => setCurrentScreen('home')} currentRole="user" />;
        case 'notification':
          return <UserNotificationScreen onNavigate={handleNavigate} role="user" onNotificationsSeen={handleNotificationsSeen} />;
        case 'categories':
          return <UserCategoriesScreen onNavigate={handleNavigate} onAddToCart={handleAddToCart} onBuyNow={handleBuyNow} onLoginRequired={handleLoginRequired} cartCount={userCartCount} />;
        case 'checkout':
          return checkoutItem ? (
            <CheckoutScreen
              item={checkoutItem}
              onBack={() => { setCheckoutItem(null); setCurrentScreen('product'); }}
              onOrderPlaced={handleOrderPlaced}
              onUpdateQty={handleCheckoutUpdateQty}
            />
          ) : null;
        case 'cart':
          return (
            <UserCartScreen
              cartItems={userCartItems}
              onUpdateQty={handleUpdateCartQty}
              onRemove={handleRemoveFromCart}
              onNavigate={handleNavigate}
              onCheckout={handleCartCheckout}
              onCheckoutItem={handleBuyNow}
            />
          );
        case 'rewards':
          return <UserRewardsScreen onBack={() => setCurrentScreen('profile')} onOpenScanner={() => setCurrentScreen('scan')} />;
        case 'profile':
          return (
            <UserProfileScreen
              onNavigate={handleNavigate}
              onSignOut={handleSignOut}
              hasPasswordConfigured={passwordConfiguredByRole.user}
              storedPassword={passwordValueByRole.user}
              onPasswordConfiguredChange={(configured) =>
                handlePasswordConfiguredChange('user', configured)
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
              profileResetKey={profileResetKey}
              cartCount={userCartCount}
            />
          );
        case 'wallet':
          return (
            <UserWalletScreen
              role="user"
              onNavigate={handleNavigate}
              onOpenScanHistory={handleOpenScanHistory}
              totalPoints={electricianRewardPoints}
              totalScans={electricianRewardScans}
              historyItems={electricianRewardHistory}
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
              currentRole="user"
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
              unreadNotificationCount={unreadNotifCount}
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
              unreadNotificationCount={unreadNotifCount}
            />
          );
        case 'product':
          return <CounterBoyProductScreen onNavigate={handleNavigate} onAddToCart={handleCounterboyAddToCart} onBuyNow={handleBuyNow} onLoginRequired={handleLoginRequired} initialCategory={selectedProductCategory} cartCount={counterboyCartCount} />;
        case 'cart':
          return (
            <UserCartScreen
              cartItems={counterboyCartItems}
              onUpdateQty={handleCounterboyUpdateCartQty}
              onRemove={handleCounterboyRemoveFromCart}
              onNavigate={handleNavigate}
              onCheckout={handleCounterboyCartCheckout}
              onCheckoutItem={handleBuyNow}
              role="counterboy"
            />
          );
        case 'checkout':
          return checkoutItem ? (
            <CheckoutScreen
              item={checkoutItem}
              role="counterboy"
              onBack={() => { setCheckoutItem(null); setCurrentScreen('product'); }}
              onOrderPlaced={handleOrderPlaced}
              onUpdateQty={handleCheckoutUpdateQty}
            />
          ) : null;
        case 'play':
          return <RolePlayVideosScreen onBack={() => setCurrentScreen('home')} currentRole="counterboy" />;
        case 'notification':
          return <CounterBoyNotificationScreen onNavigate={handleNavigate} role="counterboy" onNotificationsSeen={handleNotificationsSeen} />;
        case 'wallet':
          return (
            <ElectricianWalletScreen
              role="counterboy"
              onNavigate={handleNavigate}
              onOpenScanHistory={handleOpenScanHistory}
              totalPoints={electricianRewardPoints}
              totalScans={electricianRewardScans}
              historyItems={electricianRewardHistory}
            />
          );
        case 'support':
          return <CounterBoySupportScreen onNavigate={handleNavigate} />;
        case 'rewards':
          return <CounterBoyRewardsScreen onBack={() => setCurrentScreen('profile')} />;
        case 'profile':
          return (
            <CounterBoyProfileScreen
              onNavigate={handleNavigate}
              onSignOut={handleSignOut}
              hasPasswordConfigured={passwordConfiguredByRole.counterboy}
              storedPassword={passwordValueByRole.counterboy}
              onPasswordConfiguredChange={(configured) =>
                handlePasswordConfiguredChange('counterboy', configured)
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
              profileResetKey={profileResetKey}
              cartCount={counterboyCartCount}
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
              unreadNotificationCount={unreadNotifCount}
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
            unreadNotificationCount={unreadNotifCount}
          />
        );
      case 'product':
        return (
          <ElectricianProductScreen
            onNavigate={handleNavigate}
            onAddToCart={handleElectricianAddToCart}
            onBuyNow={handleBuyNow}
            onLoginRequired={handleLoginRequired}
            initialCategory={selectedProductCategory}
            cartCount={electricianCartCount}
          />
        );
      case 'play':
        return <RolePlayVideosScreen onBack={() => setCurrentScreen('home')} currentRole="electrician" />;
      case 'cart':
        return (
          <UserCartScreen
            cartItems={electricianCartItems}
            onUpdateQty={handleElectricianUpdateCartQty}
            onRemove={handleElectricianRemoveFromCart}
            onNavigate={handleNavigate}
            onCheckout={handleElectricianCartCheckout}
            onCheckoutItem={handleBuyNow}
            role="electrician"
          />
        );
      case 'checkout':
        return checkoutItem ? (
          <CheckoutScreen
            item={checkoutItem}
            role="electrician"
            onBack={() => { setCheckoutItem(null); setCurrentScreen('product'); }}
            onOrderPlaced={handleOrderPlaced}
            onUpdateQty={handleCheckoutUpdateQty}
          />
        ) : null;
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
        return <ElectricianRewardsScreen onBack={() => setCurrentScreen('profile')} onOpenScanner={() => setCurrentScreen('scan')} />;
      case 'profile':
        return (
          <ElectricianProfileScreen
            onNavigate={handleNavigate}
            onSignOut={handleSignOut}
            hasPasswordConfigured={passwordConfiguredByRole.electrician}
            storedPassword={passwordValueByRole.electrician}
            onPasswordConfiguredChange={(configured) =>
              handlePasswordConfiguredChange('electrician', configured)
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
            profileResetKey={profileResetKey}
            cartCount={electricianCartCount}
          />
        );
      case 'wallet':
        return (
          <ElectricianWalletScreen
            role="electrician"
            onNavigate={handleNavigate}
            onOpenScanHistory={handleOpenScanHistory}
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
            unreadNotificationCount={unreadNotifCount}
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
    handleOpenScanHistory,
    handleOpenProductCategory,
    handlePasswordConfiguredChange,
    handleSignOut,
    handleNotificationsSeen,
    handleBuyNow,
    handleCartCheckout,
    handleOrderPlaced,
    handleAuthenticatedRoleStart,
    handleLoginRequired,
    renderGuestFeatureGate,
    renderGuestAuthLanding,
    guestAuthRole,
    hasUnreadNotif,
    unreadNotifCount,
    userCartItems,
    dealerCartItems,
    electricianCartItems,
    counterboyCartItems,
    userCartCount,
    dealerCartCount,
    electricianCartCount,
    counterboyCartCount,
    checkoutItem,
    handleAddToCart,
    handleDealerAddToCart,
    handleElectricianAddToCart,
    handleCounterboyAddToCart,
    handleUpdateCartQty,
    handleDealerUpdateCartQty,
    handleElectricianUpdateCartQty,
    handleCounterboyUpdateCartQty,
    handleCheckoutUpdateQty,
    handleRemoveFromCart,
    handleDealerRemoveFromCart,
    handleElectricianRemoveFromCart,
    handleCounterboyRemoveFromCart,
    handleDealerCartCheckout,
    handleElectricianCartCheckout,
    handleCounterboyCartCheckout,
    appSettings?.supportPhone,
    appSettings?.whatsappNumber,
    pendingApprovalRole,
    handleUseAnotherApprovalNumber,
    profileInitialSubPage,
    profileResetKey,
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
            <NavActionProvider registerScrollToTop={registerScrollToTop}>
              {activeScreen}
            </NavActionProvider>
          </View>
        </SafeAreaView>
        {!pendingApprovalRole && !keyboardVisible ? (
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
        {notificationBanner ? (
          <Animated.View
            {...notificationBannerPanResponder.panHandlers}
            style={[
              styles.notificationBannerWrap,
              { transform: [{ translateX: notificationBannerX }, { translateY: notificationBannerY }] },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => {
                hideNotificationBanner('up');
                handleNavigate('notification');
              }}
            >
              <LinearGradient colors={['#FFFFFF', '#FFF7F7', '#FFFFFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.notificationBanner}>
                <View style={styles.notificationBrandMark}><Text style={styles.notificationBrandText}>SRV</Text></View>
                <View style={styles.notificationCopy}>
                  <View style={styles.notificationMetaRow}>
                    <Text style={styles.notificationAppName}>SRV ELECTRICALS</Text>
                    <View style={styles.notificationLiveDot} />
                    <Text style={styles.notificationNow}>NOW</Text>
                  </View>
                  <Text style={styles.notificationTitle} numberOfLines={1}>{notificationBanner.title}</Text>
                </View>
                <View style={styles.notificationChevron}><Text style={styles.notificationChevronText}>›</Text></View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
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
  notificationBannerWrap: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 42,
    left: 12,
    right: 12,
    zIndex: 2000,
    elevation: 20,
  },
  notificationBanner: {
    minHeight: 68,
    borderRadius: 22,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.30,
    shadowRadius: 20,
    elevation: 14,
  },
  notificationBrandMark: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#C62832',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 11,
  },
  notificationBrandText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.2 },
  notificationCopy: { flex: 1, minWidth: 0 },
  notificationMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  notificationAppName: { color: '#A11D25', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  notificationLiveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#D52D35' },
  notificationNow: { color: '#9A5A5E', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  notificationChevron: { width: 20, alignItems: 'flex-end', justifyContent: 'center' },
  notificationChevronText: { color: '#A11D25', fontSize: 27, fontWeight: '300', marginTop: -2 },
  notificationTitle: { color: '#172033', fontSize: 14, fontWeight: '900', lineHeight: 18 },
});
