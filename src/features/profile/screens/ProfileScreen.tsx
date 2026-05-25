import * as ImagePicker from 'expo-image-picker';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Screen, UserRole } from '@/shared/types/navigation';
import {
  AppIcon,
  C,
  type IconName,
  type Profile,
  type SubPage,
} from '../components/ProfileShared';
import {
  PreferenceContext,
  type AppLanguage,
  usePreferenceValue,
} from '@/shared/preferences';
import { AppSettingsPage } from './AppSettingsScreen';
import { BankDetailsPage } from './BankDetailsScreen';
import { ContactSupportPage } from './ContactSupportScreen';
import { MyOrdersPage } from './MyOrdersScreen';
import { RedemptionPage } from './MyRedemptionScreen';
import { NeedHelpPage } from './NeedHelpScreen';
import { NotificationsPage } from './NotificationsScreen';
import { OffersPage } from './OffersScreen';
import { PasswordSettingsPage } from './PasswordSettingsScreen';
import { PartnerCommissionPage } from './PartnerCommissionScreen';
import { PrivacyPolicyPage } from './PrivacyPolicyScreen';
import { RolePlayVideosScreen } from './RolePlayVideosScreen';
import { RateUsPage } from './RateUsScreen';
import { ReferFriendPage } from './ReferFriendScreen';
import { ScanHistoryPage } from './ScanHistoryScreen';
import { TransferPointsPage } from './TransferPointsScreen';
import { createShadow } from '@/shared/theme/shadows';
import { KYCVerificationScreen } from './KYCVerificationScreen';
import { TierIcon } from '@/features/dealer/screens/MemberTierScreen';
import { counterboyTheme as cbPalette } from '@/features/counterboy/theme';
import { CUSTOMER_THEME as cuTheme } from '@/features/user/theme';
import {
  ElectricianTierIcon,
  getElectricianTier,
} from '@/features/electrician/screens/ElectricianTierScreen';
import { authApi, storage } from '@/shared/api';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppData } from '@/shared/context/AppDataContext';
import {
  isRoleFeatureEnabled,
  resolveRolePageControls,
  type AppFeatureKey,
} from '@/shared/config/rolePageControls';
import {
  counterboyDetailRows,
  counterboyMenuItems,
  userDetailRows,
  userMenuItems,
  dealerMenuItems,
  detailRows,
  editRows,
  electricianDetailRows,
  electricianMenuItems,
  getDealerMembership,
  getTaxHolderValue,
  getTaxIdentityValue,
  settingsItems,
} from '../lib/profileData';

const PROFILE_MENU_FEATURE_MAP: Record<string, AppFeatureKey> = {
  'My Redemption': 'my_redemption',
  'Gift Store': 'rewards',
  'Dealer Bonus': 'dealer_bonus',
  'Transfer Points': 'transfer_points',
  'My Orders': 'my_orders',
  'Bank Details': 'bank_details',
  'Refer To A Friend': 'refer_friend',
  'Need Help': 'need_help',
  'Offers & Promotions': 'offers_promotions',
  Cart: 'cart',
};

const SETTINGS_FEATURE_MAP: Record<string, AppFeatureKey> = {
  Notifications: 'notification',
  Password: 'password',
  'Rate Us': 'rate_us',
  'App Settings': 'app_settings',
  'Scan History': 'scan_history',
  'Contact Support': 'contact_support',
  'Privacy Policy': 'privacy_policy',
};

export function ProfileScreen({
  currentRole,
  onNavigate,
  onSignOut,
  hasPasswordConfigured,
  storedPassword,
  onPasswordConfiguredChange,
  onPasswordChange,
  language,
  onLanguageChange,
  darkMode,
  onDarkModeChange,
  profilePhotoUri,
  onProfilePhotoChange,
  totalPoints,
  totalScans,
  initialSubPage,
  onInitialSubPageConsumed,
}: {
  currentRole: UserRole;
  onNavigate: (screen: Screen) => void;
  onSignOut: () => void;
  hasPasswordConfigured: boolean;
  storedPassword: string;
  onPasswordConfiguredChange: (configured: boolean) => void;
  onPasswordChange: (password: string) => void;
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
  darkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;
  profilePhotoUri: string | null;
  onProfilePhotoChange: (photoUri: string | null) => void;
  totalPoints?: number;
  totalScans?: number;
  initialSubPage?: Exclude<SubPage, null> | null;
  onInitialSubPageConsumed?: () => void;
}) {
  // Real user from auth context
  const { user: authUser, updateUser, refreshProfile } = useAuth();
  const {
    uploadProfilePhoto,
    removeProfilePhoto: removeRemoteProfilePhoto,
    appSettings,
  } = useAppData();

  // Refresh from backend when profile screen opens
  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  // Build profile from live auth data only so admin-side updates stay authoritative.
  const buildProfileFromAuth = useMemo((): Profile => {
    if (!authUser) {
      return {
        name: '',
        phone: '',
        email: '',
        state: '',
        city: '',
        district: '',
        pincode: '',
        address: '',
        gstHolderName: '',
        gstNumber: '',
        panHolderName: '',
        panNumber: '',
        dealerCode: '',
        electricianCode: '',
        counterboyCode: '',
        userCode: '',
      };
    }
    return {
      name: authUser.name ?? '',
      phone: authUser.phone ?? '',
      email: authUser.email ?? '',
      state: authUser.state ?? '',
      city: authUser.city ?? authUser.town ?? '',
      district: authUser.district ?? '',
      pincode: authUser.pincode ?? '',
      address: authUser.address ?? '',
      gstHolderName: '',
      gstNumber: authUser.gstNumber ?? '',
      panHolderName: '',
      panNumber: '',
      dealerCode: authUser.dealerCode ?? '',
      electricianCode: authUser.electricianCode ?? '',
      counterboyCode: authUser.counterboyCode ?? '',
      userCode: authUser.userCode ?? '',
    };
  }, [authUser]);

  const [profile, setProfile] = useState<Profile>(buildProfileFromAuth);
  const [draft, setDraft] = useState<Profile>(buildProfileFromAuth);
  const [subPage, setSubPage] = useState<SubPage>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [showImgPicker, setShowImgPicker] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [draftPhotoUri, setDraftPhotoUri] = useState<string | null>(null);
  const [pendingDraftImage, setPendingDraftImage] = useState<string | null>(null);
  const [draftTaxIdentity, setDraftTaxIdentity] = useState(getTaxIdentityValue(buildProfileFromAuth));
  const [draftTaxHolder, setDraftTaxHolder] = useState(getTaxHolderValue(buildProfileFromAuth));
  const [isSaving, setIsSaving] = useState(false);

  // Sync profile when auth user changes (e.g. after login or background refresh)
  // IMPORTANT: Only sync draft when edit modal is closed — never overwrite user's in-progress edits
  useEffect(() => {
    const p = buildProfileFromAuth;
    setProfile(p);
    // Only reset draft if user is NOT currently editing
    if (!showEdit) {
      setDraft(p);
      setDraftTaxIdentity(getTaxIdentityValue(p));
      setDraftTaxHolder(getTaxHolderValue(p));
    }
  }, [buildProfileFromAuth, showEdit]);

  useEffect(() => {
    if (initialSubPage) {
      setSubPage(initialSubPage);
      onInitialSubPageConsumed?.();
    }
  }, [initialSubPage, onInitialSubPageConsumed]);

  const preferenceValue = usePreferenceValue({
    language,
    setLanguage: onLanguageChange,
    darkMode,
    setDarkMode: onDarkModeChange,
    currentRole,
  });
  const profileTheme = useMemo(() => {
    const base = {
      ...preferenceValue.theme,
      bg: darkMode ? '#0B1220' : preferenceValue.theme.bg,
      surface: darkMode ? '#111827' : '#FFFFFF',
      soft: darkMode ? '#1F2937' : preferenceValue.theme.soft,
      border: darkMode ? '#243043' : '#EAEAF2',
      textPrimary: darkMode ? '#F8FAFC' : '#0F1120',
      textSecondary: darkMode ? '#D0D9E8' : '#4A4B5C',
      textMuted: darkMode ? '#94A3B8' : '#9898A8',
      heroSurface: darkMode ? '#111827' : preferenceValue.theme.heroSurface,
      heroStrip: darkMode ? '#0F172A' : preferenceValue.theme.heroStrip,
    };
    if (currentRole === 'counterboy') {
      if (darkMode) {
        return {
          ...base,
          bg: cbPalette.darkBg,
          surface: cbPalette.darkSurface,
          soft: '#2D1C14',
          border: cbPalette.darkBorder,
          textPrimary: cbPalette.darkText,
          textSecondary: cbPalette.slate,
          textMuted: cbPalette.darkMuted,
          heroSurface: cbPalette.darkSurface,
          heroStrip: cbPalette.darkBg,
        };
      }
      return {
        ...base,
        bg: cbPalette.softBg,
        surface: cbPalette.surface,
        soft: cbPalette.soft,
        border: cbPalette.border,
        textPrimary: cbPalette.text,
        textSecondary: cbPalette.primaryInk,
        textMuted: cbPalette.muted,
        heroSurface: cbPalette.bg,
        heroStrip: cbPalette.soft,
      };
    }
    if (currentRole === 'user') {
      if (darkMode) {
        return {
          ...base,
          bg: '#120A07',
          surface: cuTheme.surfaceDark,
          soft: cuTheme.softDark,
          border: cuTheme.borderDark,
          textPrimary: '#FBF1E7',
          textSecondary: '#E8D4C8',
          textMuted: '#A09088',
          heroSurface: cuTheme.surfaceDark,
          heroStrip: '#120A07',
        };
      }
      return {
        ...base,
        bg: cuTheme.heroLight[0],
        surface: cuTheme.surface,
        soft: cuTheme.soft,
        border: cuTheme.border,
        textPrimary: cuTheme.ink,
        textSecondary: cuTheme.primaryDeep,
        textMuted: cuTheme.muted,
        heroSurface: cuTheme.soft,
        heroStrip: cuTheme.heroLight[1],
      };
    }
    return base;
  }, [darkMode, preferenceValue.theme, currentRole]);
  const scopedPreferenceValue = useMemo(
    () => ({ ...preferenceValue, theme: profileTheme }),
    [preferenceValue, profileTheme]
  );
  const { t, tx, theme } = scopedPreferenceValue;
  const rolePageControls = useMemo(
    () => resolveRolePageControls(appSettings?.rolePageControls),
    [appSettings?.rolePageControls]
  );
  const menuItems = useMemo(() => {
    const baseItems =
      currentRole === 'dealer'
        ? dealerMenuItems
        : currentRole === 'counterboy'
          ? counterboyMenuItems
          : currentRole === 'user'
            ? userMenuItems
            : electricianMenuItems;

    return baseItems.filter((item) => {
      const featureKey = PROFILE_MENU_FEATURE_MAP[item.label];
      return featureKey ? isRoleFeatureEnabled(rolePageControls, currentRole, featureKey) : true;
    });
  }, [currentRole, rolePageControls]);
  const settingsMenuItems = useMemo(
    () => {
      const baseItems =
        currentRole === 'electrician'
          ? settingsItems
          : settingsItems.filter((item) => item.screen !== 'Scan History');

      return baseItems.filter((item) => {
        const featureKey = SETTINGS_FEATURE_MAP[item.label];
        return featureKey ? isRoleFeatureEnabled(rolePageControls, currentRole, featureKey) : true;
      });
    },
    [currentRole, rolePageControls]
  );
  const electricianCount = authUser?.electricianCount ?? 0;
  const electricianPoints = totalPoints ?? authUser?.totalPoints ?? 0;
  const electricianScans = totalScans ?? authUser?.totalScans ?? 0;
  const electricianRedemptions = authUser?.totalRedemptions ?? 0;
  const dealerMembership = useMemo(() => getDealerMembership(electricianCount), [electricianCount]);
  const electricianMembership = useMemo(
    () => getElectricianTier(electricianPoints),
    [electricianPoints]
  );
  const initials = useMemo(
    () =>
      profile.name
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [profile.name]
  );
  const activeProfilePhoto = profilePhotoUri ?? authUser?.profileImage ?? null;

  const toDataUri = async (assetUri: string) => {
    if (assetUri.startsWith('data:image/')) {
      return assetUri;
    }

    const base64 = await LegacyFileSystem.readAsStringAsync(assetUri, {
      encoding: LegacyFileSystem.EncodingType.Base64,
    });

    return `data:image/jpeg;base64,${base64}`;
  };

  const syncRemoteProfilePhoto = async (nextPhotoUri: string | null) => {
    if (!nextPhotoUri) {
      await removeRemoteProfilePhoto();
      onProfilePhotoChange(null); // clear local state — backend is now source of truth
      await refreshProfile();
      return;
    }

    const dataUri = await toDataUri(nextPhotoUri);
    await uploadProfilePhoto(dataUri, 'profile-screen');
    onProfilePhotoChange(null); // clear local URI — backend URL will come via refreshProfile
    await refreshProfile();
  };

  const openEdit = () => {
    setDraft(profile);
    setDraftPhotoUri(activeProfilePhoto);
    setPendingDraftImage(null);
    setDraftTaxIdentity(getTaxIdentityValue(profile));
    setDraftTaxHolder(getTaxHolderValue(profile));
    setShowImgPicker(false);
    setShowEdit(true);
  };

  const openPhotoPicker = () => {
    setDraft(profile);
    setDraftPhotoUri(activeProfilePhoto);
    setPendingDraftImage(null);
    setShowImgPicker(true);
  };

  const closeEdit = () => {
    setDraft(profile);
    setDraftPhotoUri(activeProfilePhoto);
    setPendingDraftImage(null);
    setDraftTaxIdentity(getTaxIdentityValue(profile));
    setDraftTaxHolder(getTaxHolderValue(profile));
    setShowImgPicker(false);
    setShowEdit(false);
  };

  const updateDraftField = (key: keyof Profile, value: string) => {
    let nextValue = value;
    if (
      key === 'name' ||
      key === 'city' ||
      key === 'state' ||
      key === 'district' ||
      key === 'gstHolderName' ||
      key === 'panHolderName'
    ) {
      nextValue = value.replace(/[^A-Za-z ]/g, '');
    } else if (key === 'phone' || key === 'pincode') {
      nextValue = value.replace(/\D/g, '');
    } else if (key === 'email') {
      nextValue = value.replace(/\s/g, '');
    }

    setDraft((current) => ({ ...current, [key]: nextValue }));
  };

  const saveProfile = () => {
    if (draft.name.trim() && !/^[A-Za-z ]+$/.test(draft.name.trim())) {
      return Alert.alert(tx('Invalid name'), tx('Name should contain only alphabets and spaces.'));
    }
    if (draft.phone.trim() && !/^\d+$/.test(draft.phone.trim())) {
      return Alert.alert(
        tx('Invalid phone number'),
        tx('Phone number should contain only integers.')
      );
    }
    if (draft.email.trim() && !/^[^\s@]+@[a-zA-Z0-9]+\.[a-zA-Z]{2,}$/.test(draft.email.trim())) {
      return Alert.alert(tx('Invalid email'), tx('Please enter a valid email address.'));
    }
    if (draft.city.trim() && !/^[A-Za-z ]+$/.test(draft.city.trim())) {
      return Alert.alert(tx('Invalid city'), tx('City should contain only alphabets and spaces.'));
    }
    if (draft.state.trim() && !/^[A-Za-z ]+$/.test(draft.state.trim())) {
      return Alert.alert(
        tx('Invalid state'),
        tx('State should contain only alphabets and spaces.')
      );
    }
    if (draft.district.trim() && !/^[A-Za-z ]+$/.test(draft.district.trim())) {
      return Alert.alert(
        tx('Invalid district'),
        tx('District should contain only alphabets and spaces.')
      );
    }
    if (draft.pincode.trim() && !/^\d+$/.test(draft.pincode.trim())) {
      return Alert.alert(tx('Invalid pincode'), tx('Pincode should contain only integers.'));
    }
    if (draftTaxHolder.trim() && !/^[A-Za-z ]+$/.test(draftTaxHolder.trim())) {
      return Alert.alert(
        tx('Invalid holder name'),
        tx('GST / PAN holder name should contain only alphabets and spaces.')
      );
    }

    const nextProfile: Profile =
      currentRole === 'dealer'
        ? {
            ...draft,
            gstNumber: draftTaxIdentity.trim().toUpperCase(),
            panNumber: '',
            gstHolderName: draftTaxHolder.trim(),
            panHolderName: '',
          }
        : {
            ...draft,
            gstNumber: '',
            panNumber: '',
            gstHolderName: '',
            panHolderName: '',
          };

    // Save locally first (instant UI update)
    setProfile(nextProfile);
    onProfilePhotoChange(draftPhotoUri);
    setPendingDraftImage(null);
    setShowEdit(false);

    // Save to backend
    setIsSaving(true);
    const photoChanged = draftPhotoUri !== activeProfilePhoto;
    const apiData = currentRole === 'dealer'
      ? {
          name: nextProfile.name,
          email: nextProfile.email,
          town: nextProfile.city,
          district: nextProfile.district,
          state: nextProfile.state,
          address: nextProfile.address,
          pincode: nextProfile.pincode,
          gstNumber: nextProfile.gstNumber,
        }
      : {
          name: nextProfile.name,
          email: nextProfile.email,
          city: nextProfile.city,
          state: nextProfile.state,
          district: nextProfile.district,
          address: nextProfile.address,
          pincode: nextProfile.pincode,
        };

    void authApi.updateProfile(apiData)
      .then(async (updatedUser) => {
        // Update auth context immediately so UI reflects changes
        updateUser(updatedUser);
        await storage.setUserProfile(updatedUser);
        if (photoChanged) {
          await syncRemoteProfilePhoto(draftPhotoUri);
        } else {
          await refreshProfile();
        }
      })
      .catch(async () => {
        Alert.alert(tx('Unable to save changes'), tx('Please try again.'));
        // Revert local state back to what's in auth context
        await refreshProfile();
      })
      .finally(() => setIsSaving(false));
  };

  const pickDraftPhoto = async (source: 'camera' | 'gallery') => {
    try {
      setShowImgPicker(false);
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            tx('Permission needed'),
            tx('Allow camera access to update your profile photo.')
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });

        if (!result.canceled && result.assets?.length) {
          setPendingDraftImage(result.assets[0].uri);
        }
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          tx('Permission needed'),
          tx('Allow gallery access to update your profile photo.')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        setPendingDraftImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert(tx('Unable to update photo'), tx('Please try again.'));
    }
  };

  const cancelDraftPhoto = () => setPendingDraftImage(null);

  const confirmDraftPhoto = () => {
    if (!pendingDraftImage) {
      return;
    }
    if (showEdit) {
      setDraftPhotoUri(pendingDraftImage);
    } else {
      setIsSaving(true);
      void syncRemoteProfilePhoto(pendingDraftImage)
        .catch(() => {
          Alert.alert(tx('Unable to update photo'), tx('Please try again.'));
        })
        .finally(() => setIsSaving(false));
    }
    setPendingDraftImage(null);
  };

  const removeProfilePhoto = () => {
    setShowImgPicker(false);
    setPendingDraftImage(null);
    setDraftPhotoUri(null);
    if (!showEdit) {
      setIsSaving(true);
      void syncRemoteProfilePhoto(null)
        .catch(() => {
          Alert.alert(tx('Unable to update photo'), tx('Please try again.'));
        })
        .finally(() => setIsSaving(false));
    }
  };

  const subpages: Record<Exclude<SubPage, null>, React.ReactElement> = {
    'Play Zone': (
      <RolePlayVideosScreen onBack={() => setSubPage(null)} currentRole={currentRole} />
    ),
    'My Redemption': (
      <RedemptionPage
        onBack={() => setSubPage(null)}
        onNavigate={onNavigate}
        onOpenBankDetails={() => setSubPage('Bank Details')}
        onOpenTransferPoints={() =>
          setSubPage(currentRole === 'dealer' ? 'Dealer Bonus' : 'Transfer Points')
        }
        currentRole={currentRole}
      />
    ),
    'Dealer Bonus': <PartnerCommissionPage onBack={() => setSubPage(null)} />,
    'Transfer Points': (
      <TransferPointsPage onBack={() => setSubPage(null)} onNavigate={onNavigate} currentRole={currentRole} />
    ),
    'My Orders': <MyOrdersPage onBack={() => setSubPage(null)} />,
    'Bank Details': <BankDetailsPage onBack={() => setSubPage(null)} />,
    'Refer To A Friend': <ReferFriendPage onBack={() => setSubPage(null)} />,
    'Need Help': <NeedHelpPage onBack={() => setSubPage(null)} />,
    'Offers & Promotions': <OffersPage onBack={() => setSubPage(null)} />,
    Notifications: <NotificationsPage onBack={() => setSubPage(null)} />,
    Password: (
      <PasswordSettingsPage
        onBack={() => setSubPage(null)}
        hasPasswordConfigured={hasPasswordConfigured}
        storedPassword={storedPassword}
        onPasswordConfiguredChange={onPasswordConfiguredChange}
        onPasswordChange={onPasswordChange}
      />
    ),
    'App Settings': <AppSettingsPage onBack={() => setSubPage(null)} />,
    'Scan History': <ScanHistoryPage onBack={() => setSubPage(null)} />,
    'Contact Support': <ContactSupportPage onBack={() => setSubPage(null)} />,
    'Privacy Policy': <PrivacyPolicyPage onBack={() => setSubPage(null)} />,
    'Rate Us': <RateUsPage onBack={() => setSubPage(null)} />,
    'KYC Verification': <KYCVerificationScreen onBack={() => setSubPage(null)} currentRole={currentRole} />,
  };

  if (subPage) {
    return (
      <PreferenceContext.Provider value={scopedPreferenceValue}>
        {subpages[subPage]}
      </PreferenceContext.Provider>
    );
  }

  const roleColor = theme.accent;
  const roleSoft = theme.accentSoft;
  const kycStatus = authUser?.kycStatus ?? 'not_submitted';
  const showKycBanner = kycStatus !== 'verified';
  const visibleDetailRows =
    currentRole === 'dealer'
      ? detailRows
      : currentRole === 'counterboy'
        ? counterboyDetailRows
        : currentRole === 'user'
          ? userDetailRows
          : electricianDetailRows;
  const isCounterboyProfile = currentRole === 'counterboy';
  const isUserProfile = currentRole === 'user';
  const usesWarmProfileAccents = isCounterboyProfile || isUserProfile;
  const isElectricianProfile = currentRole === 'electrician';
  const accentAction = theme.accent;
  const accentActionSoft = theme.accentSoft;
  const accentAlt = theme.accentDeep;
  const counterboySurface = theme.surface;
  const counterboyGlowPrimary = theme.heroGlowPrimary;
  const counterboyGlowSecondary = theme.heroGlowSecondary;
  const electricianHeroBg = darkMode ? theme.heroSurface : '#F7FBFF';
  const electricianHeroBorder = darkMode ? theme.border : '#D6E6FA';
  const heroAvatarBorderColor = darkMode
    ? 'rgba(248,250,252,0.18)'
    : isElectricianProfile
      ? '#D6E6FA'
      : isCounterboyProfile
        ? cbPalette.border
        : isUserProfile
          ? cuTheme.border
          : 'rgba(255,255,255,0.78)';

  const heroContent = (
    <>
      <View
        style={[
          styles.blobTL,
          { backgroundColor: isElectricianProfile ? 'rgba(16,42,99,0.08)' : counterboyGlowPrimary },
        ]}
      />
      <View
        style={[
          styles.blobBR,
          { backgroundColor: isElectricianProfile ? 'rgba(59,130,246,0.10)' : counterboyGlowSecondary },
        ]}
      />
      <View style={styles.heroTop}>
        <TouchableOpacity
          onPress={openPhotoPicker}
          activeOpacity={0.85}
          style={styles.avatarWrap}
        >
          <View
            style={[
              styles.avatarRing,
              {
                borderColor: heroAvatarBorderColor,
              },
            ]}
          >
            {(profilePhotoUri ?? authUser?.profileImage) ? (
              <Image source={{ uri: (profilePhotoUri ?? authUser?.profileImage)! }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarFallback, { backgroundColor: roleColor }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.levelBadge,
              {
                backgroundColor: isCounterboyProfile || isUserProfile
                  ? theme.accentSoft
                  : currentRole === 'dealer'
                    ? dealerMembership.soft
                    : electricianMembership.soft,
              },
            ]}
          >
            {isCounterboyProfile ? (
              <Text style={{ fontSize: 9, fontWeight: '900', color: theme.accent, letterSpacing: 0.6 }}>
                SRV
              </Text>
            ) : isUserProfile ? (
              <AppIcon name="star" size={14} color={theme.accent} />
            ) : currentRole === 'dealer' ? (
              <TierIcon tier={dealerMembership.tier} size={15} />
            ) : (
              <ElectricianTierIcon tier={electricianMembership.tier} size={15} />
            )}
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroName, { color: theme.textPrimary }]}>{profile.name}</Text>
          <Text style={[styles.heroPhone, { color: theme.textMuted }]}>
            +91 {profile.phone}
          </Text>
          <View style={styles.tagRow}>
            <View style={[styles.tag, { backgroundColor: isElectricianProfile ? '#EAF3FF' : theme.soft }]}>
              <AppIcon name="location" size={12} color={theme.textSecondary} />
              <Text style={[styles.tagTxt, { color: theme.textSecondary }]}>
                {tx(profile.city)}
              </Text>
            </View>
            <View style={[styles.tag, { backgroundColor: roleSoft }]}>
              <Text style={[styles.tagTxt, { color: roleColor }]}>
                {currentRole === 'electrician'
                  ? profile.electricianCode
                  : currentRole === 'counterboy'
                    ? authUser?.counterboyCode ?? 'Counter Boy'
                    : currentRole === 'user'
                      ? authUser?.userCode ?? profile.userCode ?? '—'
                      : profile.dealerCode}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <PreferenceContext.Provider value={scopedPreferenceValue}>
      <>
        <ScrollView
          style={[styles.screen, { backgroundColor: theme.bg }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>{t('myProfile')}</Text>
            <TouchableOpacity
              onPress={openEdit}
              style={[
                styles.editHeaderBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              activeOpacity={0.75}
            >
              <AppIcon name="edit" size={16} color={accentAction} />
              <Text style={[styles.editHeaderText, { color: theme.textPrimary }]}>{t('edit')}</Text>
            </TouchableOpacity>
          </View>

          {isElectricianProfile ? (
            <View
              style={[
                styles.heroCard,
                styles.heroCardPlain,
                {
                  backgroundColor: electricianHeroBg,
                  borderColor: electricianHeroBorder,
                },
              ]}
            >
              {heroContent}
            </View>
          ) : (
            <LinearGradient
              style={[
                styles.heroCard,
                { borderColor: theme.border },
              ]}
              colors={darkMode ? theme.heroGradientDark : theme.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {heroContent}
            </LinearGradient>
          )}

          {currentRole === 'electrician' ? (
            <View style={styles.statsRow}>
              {[
                {
                  val: electricianScans.toLocaleString(),
                  label: t('scans'),
                  icon: 'scan' as IconName,
                  bg: C.primaryLight,
                  color: C.primary,
                  onPress: () => setSubPage('Scan History'),
                },
                {
                  val: electricianPoints.toLocaleString(),
                  label: t('points'),
                  icon: 'star' as IconName,
                  bg: electricianMembership.soft,
                  color: electricianMembership.accent,
                  onPress: () => onNavigate('wallet'),
                },
                {
                  val: electricianRedemptions.toLocaleString(),
                  label: t('rewards'),
                  icon: 'gift' as IconName,
                  bg: C.tealLight,
                  color: C.teal,
                  onPress: () => onNavigate('rewards'),
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.statBox,
                    {
                      backgroundColor: counterboySurface,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={item.onPress}
                  activeOpacity={0.8}
                >
                  <View style={[styles.statIcon, { backgroundColor: item.bg }]}>
                    <AppIcon name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={[styles.statVal, { color: item.color }]}>{item.val}</Text>
                  <Text style={[styles.statLbl, { color: theme.textMuted }]}>{tx(item.label)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <View style={styles.cardHead}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                {t('profileDetails')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowFullProfile((current) => !current)}
                style={[
                  styles.visibilityBtn,
                  usesWarmProfileAccents ? { backgroundColor: accentActionSoft } : null,
                ]}
                activeOpacity={0.75}
              >
                <AppIcon
                  name={showFullProfile ? 'eyeOff' : 'eye'}
                  size={16}
                  color={usesWarmProfileAccents ? accentAction : C.blue}
                />
                <Text
                  style={[
                    styles.visibilityText,
                    usesWarmProfileAccents ? { color: accentAction } : null,
                  ]}
                >
                  {showFullProfile ? t('hide') : t('show')}
                </Text>
              </TouchableOpacity>
            </View>
            {showKycBanner ? (
              <TouchableOpacity 
                style={[
                  styles.kycBanner,
                  kycStatus === 'rejected'
                    ? { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }
                    : { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
                ]}
                onPress={() => setSubPage('KYC Verification')}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.kycIcon,
                  kycStatus === 'rejected'
                    ? { backgroundColor: '#FEE2E2' }
                    : { backgroundColor: '#FEF3C7' },
                ]}>
                  <AppIcon
                    name={kycStatus === 'rejected' ? 'warning' : kycStatus === 'pending' ? 'clock' : 'warning'}
                    size={18}
                    color={kycStatus === 'rejected' ? '#DC2626' : '#B45309'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[
                    styles.kycTitle,
                    kycStatus === 'rejected' ? { color: '#991B1B' } : { color: '#92400E' },
                  ]}>
                    {kycStatus === 'rejected'
                      ? 'KYC Rejected — Tap to resubmit'
                      : kycStatus === 'pending'
                        ? 'KYC under review'
                        : 'Complete KYC to unlock all features'}
                  </Text>
                  <Text style={[
                    styles.kycSub,
                    kycStatus === 'rejected' ? { color: '#DC2626' } : { color: '#B45309' },
                  ]}>
                    {kycStatus === 'rejected'
                      ? (authUser?.kycRejectionReason ?? 'Documents were rejected')
                      : kycStatus === 'pending'
                        ? 'Admin will verify your documents soon'
                        : 'Tap to upload documents'}
                  </Text>
                </View>
                <View style={[
                  styles.kycBadge,
                  kycStatus === 'rejected'
                    ? { backgroundColor: '#EF4444' }
                    : kycStatus === 'pending'
                      ? { backgroundColor: '#F59E0B' }
                      : { backgroundColor: '#F59E0B' },
                ]}>
                  <Text style={styles.kycBadgeTxt}>
                    {kycStatus === 'rejected' ? 'Rejected' : kycStatus === 'pending' ? 'Pending' : 'Pending'}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}
            {visibleDetailRows
              .slice(0, showFullProfile ? visibleDetailRows.length : 4)
              .map((item, index, rows) => {
                const rawValue = profile[item.key];
                const value =
                  item.key === 'phone'
                    ? `+91 ${rawValue}`
                    : rawValue || item.emptyText || 'Not provided';
                const isEmpty = !rawValue || value === 'Not provided';
                return (
                  <View
                    key={item.label}
                    style={[
                      styles.detailRow,
                      index < rows.length - 1
                        ? [styles.detailBorder, { borderBottomColor: theme.border }]
                        : null,
                    ]}
                  >
                    <Text style={[styles.detailLbl, { color: theme.textMuted }]}>
                      {tx(item.label)}
                    </Text>
                    <Text
                      style={[
                        styles.detailVal,
                        { color: theme.textPrimary },
                        isEmpty ? styles.detailEmpty : null,
                      ]}
                      numberOfLines={1}
                    >
                      {value}
                    </Text>
                  </View>
                );
              })}
          </View>

          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
              {t('quickActions')}
            </Text>
            <View style={{ height: 12 }} />
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.menuRow,
                  index < menuItems.length - 1
                    ? [styles.menuBorder, { borderBottomColor: theme.border }]
                    : null,
                ]}
                onPress={() =>
                  item.route
                    ? onNavigate(item.route)
                    : item.screen
                      ? setSubPage(item.screen)
                      : undefined
                }
                activeOpacity={0.75}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                  <AppIcon name={item.icon} size={20} color={item.color} />
                </View>
                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>
                  {tx(item.label)}
                </Text>
                <View
                  style={[
                    styles.arrowWrap,
                    { backgroundColor: item.bg, borderColor: `${item.color}22` },
                  ]}
                >
                  <View style={styles.arrowCore}>
                    <AppIcon name="chevronRight" size={15} color={item.color} strokeWidth={2.4} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{t('settings')}</Text>
            <View style={{ height: 12 }} />
            {settingsMenuItems.map((item, index) => {
              return (
                <TouchableOpacity
                  key={item.screen}
                  style={[
                    styles.menuRow,
                    index < settingsMenuItems.length - 1
                      ? [styles.menuBorder, { borderBottomColor: theme.border }]
                      : null,
                  ]}
                  onPress={() => (item.route ? onNavigate(item.route) : setSubPage(item.screen))}
                  activeOpacity={0.75}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.bg }]}>
                    {item.badge ? (
                      <View
                        style={[
                          styles.notifDot,
                          usesWarmProfileAccents ? { backgroundColor: accentAction } : null,
                        ]}
                      />
                    ) : null}
                    <AppIcon name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>
                    {tx(item.label)}
                  </Text>
                  <View
                    style={[
                      styles.arrowWrap,
                      { backgroundColor: item.bg, borderColor: `${item.color}22` },
                    ]}
                  >
                    <View style={styles.arrowCore}>
                      <AppIcon name="chevronRight" size={15} color={item.color} strokeWidth={2.4} />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.signOutBtn,
              {
                backgroundColor: counterboySurface,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setShowSignOut(true)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.signOutIconWrap,
                usesWarmProfileAccents ? { backgroundColor: accentActionSoft } : null,
              ]}
            >
              <AppIcon name="signOut" size={18} color={accentAction} />
            </View>
            <Text
              style={[
                styles.signOutTxt,
                usesWarmProfileAccents ? { color: accentAction } : null,
              ]}
            >
              {t('signOut')}
            </Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>

        <Modal
          visible={showImgPicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowImgPicker(false)}
        >
          <Pressable style={styles.pickerOverlay} onPress={() => setShowImgPicker(false)}>
            <Pressable style={styles.pickerSheet}>
              <View style={styles.handle} />
              <Text style={styles.pickerTitle}>{tx('updateProfilePhoto')}</Text>
              <Text style={styles.pickerHelper}>
                {tx(
                  'Choose a photo source or remove the current photo. Your initials will appear again if no photo is selected.'
                )}
              </Text>
              <View style={{ marginTop: 8 }}>
                {[
                  {
                    icon: 'camera' as IconName,
                    label: 'takePhoto',
                    sub: 'Capture a photo, then tap Done on the confirmation screen',
                    fn: () => pickDraftPhoto('camera'),
                  },
                  {
                    icon: 'gallery' as IconName,
                    label: 'chooseGallery',
                    sub: 'Select a photo, then tap Done on the confirmation screen',
                    fn: () => pickDraftPhoto('gallery'),
                  },
                  {
                    icon: 'eyeOff' as IconName,
                    label: 'Remove Photo',
                    sub: 'Remove the profile photo and show initials again',
                    fn: removeProfilePhoto,
                  },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={styles.pickerOption}
                    onPress={option.fn}
                    activeOpacity={0.8}
                  >
                    <View style={styles.pickerOptionIcon}>
                      <AppIcon
                        name={option.icon}
                        size={22}
                        color={option.label === 'Remove Photo' ? accentAction : accentAlt}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 4 }}>
                      <Text style={styles.pickerOptionLabel}>{tx(option.label)}</Text>
                      <Text style={styles.pickerOptionSub}>{tx(option.sub)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowImgPicker(false)}>
                <Text style={styles.pickerCancelTxt}>{tx('Cancel')}</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal
          visible={!!pendingDraftImage}
          animationType="fade"
          transparent
          onRequestClose={cancelDraftPhoto}
        >
          <View style={styles.overlay}>
            <View style={[styles.confirmPhotoCard, { backgroundColor: theme.surface }]}>
              {pendingDraftImage ? (
                <Image source={{ uri: pendingDraftImage }} style={styles.confirmPhotoPreview} />
              ) : null}
              <Text style={[styles.confirmPhotoTitle, { color: theme.textPrimary }]}>
                {tx('Review photo')}
              </Text>
              <Text style={[styles.confirmPhotoHelp, { color: theme.textMuted }]}>
                {tx('If the photo looks right, tap Done to update your profile photo.')}
              </Text>
              <View style={styles.confirmPhotoActions}>
                <Pressable
                  onPress={cancelDraftPhoto}
                  style={[
                    styles.cancelBtn,
                    { backgroundColor: theme.soft, borderColor: theme.border },
                  ]}
                >
                  <Text style={[styles.cancelTxt, { color: theme.textPrimary }]}>
                    {tx('Cancel')}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={confirmDraftPhoto}
                  style={[
                    styles.signOutActionBtn,
                    usesWarmProfileAccents ? { backgroundColor: accentAction } : null,
                  ]}
                >
                  <Text style={styles.signOutActionTxt}>{tx('Done')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showEdit} animationType="slide" transparent onRequestClose={closeEdit}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.editOverlay}
          >
            <TouchableOpacity
              style={styles.editBackdrop}
              activeOpacity={1}
              onPress={Keyboard.dismiss}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={[styles.editSheet, { backgroundColor: theme.surface }]}
              >
                <View style={styles.handle} />
                <View style={styles.editHeader}>
                  <Text style={[styles.editTitle, { color: theme.textPrimary }]}>
                    {tx('Edit Profile')}
                  </Text>
                  <TouchableOpacity
                    onPress={closeEdit}
                    style={[styles.closeBtn, { backgroundColor: theme.soft }]}
                  >
                    <Text style={[styles.closeTxt, { color: theme.textSecondary }]}>x</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="interactive"
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  <View style={styles.avatarSection}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                      Profile Photo
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowImgPicker(true)}
                      activeOpacity={0.8}
                      style={[
                        styles.uploadBox,
                        draftPhotoUri ? styles.uploadBoxFilled : null,
                        { backgroundColor: theme.soft, borderColor: theme.border },
                      ]}
                    >
                      {draftPhotoUri ? (
                        <Image source={{ uri: draftPhotoUri }} style={styles.previewImage} />
                      ) : (
                        <View style={styles.uploadInner}>
                          <View style={[styles.uploadIconWrap, { backgroundColor: roleSoft }]}>
                            <AppIcon name="gallery" size={20} color={roleColor} />
                          </View>
                          <View style={styles.uploadCopy}>
                            <Text style={[styles.uploadTitle, { color: theme.textPrimary }]}>
                              {tx('tapToChangePhoto')}
                            </Text>
                            <Text style={[styles.uploadText, { color: theme.textMuted }]}>
                              {tx(
                                'Choose from camera or gallery, then finish with Done on the confirmation screen.'
                              )}
                            </Text>
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                    <Text style={[styles.photoHint, { color: theme.textMuted }]}>
                      {draftPhotoUri
                        ? tx('tapToChangePhoto')
                        : tx('After selecting a photo, review it and tap Done to continue.')}
                    </Text>
                  </View>
                  {editRows.map((field) => (
                    <View key={field.key} style={styles.field}>
                      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                        {tx(field.label)}
                      </Text>
                      <TextInput
                        value={draft[field.key]}
                        onChangeText={(value) => updateDraftField(field.key, value)}
                        placeholder={`${tx('Enter')} ${tx(field.label)}`}
                        placeholderTextColor={theme.textMuted}
                        keyboardType={field.keyboardType ?? 'default'}
                        autoCapitalize={field.key === 'email' ? 'none' : 'words'}
                        autoCorrect={false}
                        maxLength={field.maxLength}
                        style={[
                          styles.input,
                          {
                            borderColor: theme.border,
                            backgroundColor: theme.soft,
                            color: theme.textPrimary,
                          },
                        ]}
                      />
                    </View>
                  ))}
                  {currentRole === 'dealer' ? (
                    <>
                      <View style={styles.field}>
                        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                          GST Number / PAN Number
                        </Text>
                        <TextInput
                          value={draftTaxIdentity}
                          onChangeText={(value) =>
                            setDraftTaxIdentity(
                              value
                                .toUpperCase()
                                .replace(/[^A-Z0-9]/g, '')
                                .slice(0, 13)
                            )
                          }
                          placeholder="Enter GST or PAN number"
                          placeholderTextColor={theme.textMuted}
                          autoCapitalize="characters"
                          maxLength={13}
                          style={[
                            styles.input,
                            {
                              borderColor: theme.border,
                              backgroundColor: theme.soft,
                              color: theme.textPrimary,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.field}>
                        <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                          SHOP / BUSINESS NAME
                        </Text>
                        <TextInput
                          value={draftTaxHolder}
                          onChangeText={(value) =>
                            setDraftTaxHolder(value.replace(/[^A-Za-z ]/g, ''))
                          }
                          placeholder="Enter shop or business name"
                          placeholderTextColor={theme.textMuted}
                          autoCapitalize="words"
                          style={[
                            styles.input,
                            {
                              borderColor: theme.border,
                              backgroundColor: theme.soft,
                              color: theme.textPrimary,
                            },
                          ]}
                        />
                      </View>
                    </>
                  ) : null}
                  <View style={styles.field}>
                    <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>
                      {currentRole === 'electrician'
                        ? tx('Electrician Code')
                        : currentRole === 'counterboy'
                          ? tx('Counter Boy ID')
                          : currentRole === 'user'
                            ? tx('Customer ID')
                            : tx('Dealer Code')}
                    </Text>
                  <View
                    style={[
                      styles.readOnlyField,
                      { borderColor: theme.border, backgroundColor: theme.soft },
                    ]}
                  >
                    <Text style={[styles.readOnlyText, { color: theme.textMuted }]}>
                      {currentRole === 'electrician'
                        ? profile.electricianCode
                        : currentRole === 'counterboy'
                          ? profile.counterboyCode || authUser?.counterboyCode || '—'
                          : currentRole === 'user'
                            ? profile.userCode || authUser?.userCode || '—'
                            : profile.dealerCode}
                    </Text>
                  </View>
                  </View>
                </ScrollView>
                <View style={styles.editActions}>
                  <Pressable
                    onPress={closeEdit}
                    style={[
                      styles.discardBtn,
                      { backgroundColor: theme.soft, borderColor: theme.border },
                    ]}
                  >
                    <Text style={[styles.discardTxt, { color: theme.textSecondary }]}>
                      {t('discard')}
                    </Text>
                  </Pressable>
                  <Pressable onPress={saveProfile} style={[styles.saveBtn, { backgroundColor: accentAction }, isSaving ? { opacity: 0.7 } : null]} disabled={isSaving}>
                    <Text style={styles.saveTxt}>{isSaving ? tx('Saving...') : t('saveChanges')}</Text>
                  </Pressable>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          visible={showSignOut}
          animationType="fade"
          transparent
          onRequestClose={() => setShowSignOut(false)}
        >
          <View style={styles.overlay}>
            <View style={[styles.confirmCard, { backgroundColor: theme.surface }]}>
              <View style={[styles.confirmIconBg, { backgroundColor: theme.accentSoft }]}>
                <AppIcon name="signOut" size={28} color={accentAction} />
              </View>
              <Text
                style={[styles.confirmTitle, { color: theme.textPrimary }]}
              >{`${t('signOut')}?`}</Text>
              <Text style={[styles.confirmSub, { color: theme.textMuted }]}>
                {tx('Are you sure you want to log out?\nYour data will be saved.')}
              </Text>
              <View style={styles.rowActions}>
                <Pressable
                  style={[
                    styles.cancelBtn,
                    { backgroundColor: theme.soft, borderColor: theme.border },
                  ]}
                  onPress={() => setShowSignOut(false)}
                >
                  <Text style={[styles.cancelTxt, { color: theme.textPrimary }]}>
                    {t('Cancel')}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.signOutActionBtn,
                    usesWarmProfileAccents ? { backgroundColor: accentAction } : null,
                  ]}
                  onPress={() => {
                    setShowSignOut(false);
                    onSignOut();
                  }}
                >
                  <Text style={styles.signOutActionTxt}>{t('signOut')}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </>
    </PreferenceContext.Provider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 14, paddingBottom: 120 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 26, fontWeight: '900' },
  editHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
  },
  editHeaderText: { fontSize: 14, fontWeight: '700' },
  heroCard: { borderRadius: 28, overflow: 'hidden', borderWidth: 1 },
  heroCardPlain: {
    ...createShadow({ color: '#102A63', offsetY: 10, blur: 22, opacity: 0.08, elevation: 5 }),
  },
  blobTL: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  blobBR: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 22, paddingBottom: 16 },
  avatarWrap: { position: 'relative', paddingBottom: 4, paddingRight: 4 },
  avatarRing: {
    width: 80,
    height: 80,
    borderRadius: 26,
    borderWidth: 2.5,
    borderColor: 'rgba(15,17,32,0.08)',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontSize: 28, fontWeight: '900' },
  levelBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroName: { fontSize: 20, fontWeight: '900', marginBottom: 3 },
  heroPhone: { fontSize: 13, marginBottom: 10 },
  tagRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagTxt: { fontSize: 11, fontWeight: '700' },
  memberStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 12,
  },
  memberLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  memberTextBlock: { flex: 1, minWidth: 0 },
  memberRight: { alignItems: 'flex-end', gap: 6 },
  memberStarWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberTierBadge: {
    minWidth: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  memberTierBadgeText: { fontSize: 13, fontWeight: '900', letterSpacing: 0.4 },
  memberTitle: { fontSize: 14, fontWeight: '800', flexShrink: 1 },
  memberSub: { fontSize: 11, marginTop: 2, flexShrink: 1 },
  memberHint: { fontSize: 11, fontWeight: '600', lineHeight: 16, flexShrink: 1 },
  memberNetworkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 2,
  },
  memberNetworkText: { fontSize: 11, fontWeight: '800' },
  progressTrack: { width: 80, height: 6, borderRadius: 3, backgroundColor: '#E8EAF1' },
  dealerProgressTrack: { alignItems: 'center', gap: 6 },
  progressFill: { height: '100%', borderRadius: 3 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderRadius: 20, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1 },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statVal: { fontSize: 18, fontWeight: '900' },
  statLbl: { fontSize: 11, fontWeight: '600' },
  sectionCard: { borderRadius: 24, padding: 20, borderWidth: 1 },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  visibilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.blueLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  visibilityText: { fontSize: 13, fontWeight: '700', color: C.blue },
  kycBanner: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  kycIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycTitle: { fontSize: 13, fontWeight: '800', color: '#92400E' },
  kycSub: { fontSize: 12, color: '#B45309', marginTop: 2 },
  kycBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  kycBadgeTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F2FA' },
  detailLbl: { fontSize: 13, fontWeight: '500', width: 100 },
  detailVal: { flex: 1, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  detailEmpty: { color: C.muted, fontStyle: 'italic', fontWeight: '400' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F2FA' },
  menuIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  arrowWrap: {
    width: 28,
    height: 30,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...createShadow({ color: '#0F172A', offsetY: 6, blur: 12, opacity: 0.08, elevation: 3 }),
  },
  arrowCore: {
    width: 18,
    height: 22,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: C.primary,
    borderWidth: 1.5,
    borderColor: C.surface,
  },
  signOutBtn: {
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
  },
  signOutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutTxt: { fontSize: 16, fontWeight: '700', color: C.primary },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15,17,32,0.55)',
  },
  confirmCard: {
    borderRadius: 32,
    padding: 30,
    marginHorizontal: 28,
    width: '86%',
    alignItems: 'center',
  },
  confirmIconBg: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  confirmTitle: { fontSize: 21, fontWeight: '900', marginBottom: 8 },
  confirmSub: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 26 },
  rowActions: { flexDirection: 'row', gap: 12, width: '100%' },
  confirmPhotoCard: {
    borderRadius: 28,
    padding: 20,
    marginHorizontal: 24,
    width: '88%',
    alignItems: 'center',
  },
  confirmPhotoPreview: { width: 220, height: 220, borderRadius: 24, marginBottom: 16 },
  confirmPhotoTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  confirmPhotoHelp: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginBottom: 18 },
  confirmPhotoActions: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelTxt: { fontSize: 15, fontWeight: '800' },
  signOutActionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 17,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutActionTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,17,32,0.45)' },
  pickerSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  pickerTitle: { fontSize: 18, fontWeight: '800', color: C.dark, marginBottom: 20 },
  pickerHelper: { fontSize: 12, lineHeight: 18, color: C.muted, marginTop: -10, marginBottom: 14 },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  pickerOptionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerOptionLabel: { fontSize: 16, fontWeight: '700', color: C.dark },
  pickerOptionSub: {
    fontSize: 10,
    color: C.muted,
    marginTop: 2,
    lineHeight: 14,
    flexShrink: 1,
    maxWidth: 220,
  },
  pickerCancel: {
    marginTop: 16,
    height: 52,
    borderRadius: 18,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCancelTxt: { fontSize: 15, fontWeight: '700', color: C.mid },
  editOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15,17,32,0.45)' },
  editBackdrop: { flex: 1, justifyContent: 'flex-end' },
  editSheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  editTitle: { fontSize: 20, fontWeight: '900' },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: { fontSize: 15, fontWeight: '700' },
  avatarSection: { marginBottom: 24 },
  uploadBox: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginTop: 7,
  },
  uploadBoxFilled: { minHeight: 0, alignSelf: 'center', width: 120, borderStyle: 'solid' },
  uploadInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 12,
  },
  uploadIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCopy: { flex: 1 },
  uploadTitle: { fontSize: 14, fontWeight: '800' },
  uploadText: { fontSize: 12, fontWeight: '600', lineHeight: 18, marginTop: 4 },
  previewImage: { width: 120, height: 120, borderRadius: 18, alignSelf: 'center' },
  photoHint: { fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' },
  editAvatarRing: {
    width: 96,
    height: 96,
    borderRadius: 30,
    borderWidth: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  editAvatarImg: { width: '100%', height: '100%' },
  editAvatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  editAvatarInitials: { color: '#fff', fontSize: 32, fontWeight: '900' },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 7,
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  readOnlyField: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  readOnlyText: { fontSize: 14, fontWeight: '500' },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
  discardBtn: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  discardTxt: { fontSize: 15, fontWeight: '800' },
  saveBtn: {
    flex: 2,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveTxt: { color: '#fff', fontSize: 15, fontWeight: '900' },
});
