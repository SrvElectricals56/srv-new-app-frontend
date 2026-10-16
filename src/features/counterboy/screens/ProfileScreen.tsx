import React from 'react';
import { ProfileScreen as SharedProfileScreen } from '@/features/profile/screens/ProfileScreen';
import type { SubPage } from '@/features/profile/components/ProfileShared';
import type { AppLanguage } from '@/shared/preferences';
import type { Screen } from '@/shared/types/navigation';

export function ProfileScreen({
  onNavigate,
  onSignOut,
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
  profileResetKey,
  cartCount,
}: {
  onNavigate: (screen: Screen) => void;
  onSignOut: () => void;
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
  profileResetKey?: number;
  cartCount?: number;
}) {
  return (
    <SharedProfileScreen
      currentRole="counterboy"
      onNavigate={onNavigate}
      onSignOut={onSignOut}
      language={language}
      onLanguageChange={onLanguageChange}
      darkMode={darkMode}
      onDarkModeChange={onDarkModeChange}
      profilePhotoUri={profilePhotoUri}
      onProfilePhotoChange={onProfilePhotoChange}
      totalPoints={totalPoints}
      totalScans={totalScans}
      initialSubPage={initialSubPage}
      onInitialSubPageConsumed={onInitialSubPageConsumed}
      profileResetKey={profileResetKey}
      cartCount={cartCount}
    />
  );
}
