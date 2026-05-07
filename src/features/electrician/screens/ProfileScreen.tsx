import React from 'react';
import { ProfileScreen as SharedProfileScreen } from '@/features/profile/screens/ProfileScreen';
import type { AppLanguage } from '@/shared/preferences';
import type { Screen } from '@/shared/types/navigation';

export function ProfileScreen({
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
}: {
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
}) {
  return (
    <SharedProfileScreen
      currentRole="electrician"
      onNavigate={onNavigate}
      onSignOut={onSignOut}
      hasPasswordConfigured={hasPasswordConfigured}
      storedPassword={storedPassword}
      onPasswordConfiguredChange={onPasswordConfiguredChange}
      onPasswordChange={onPasswordChange}
      language={language}
      onLanguageChange={onLanguageChange}
      darkMode={darkMode}
      onDarkModeChange={onDarkModeChange}
      profilePhotoUri={profilePhotoUri}
      onProfilePhotoChange={onProfilePhotoChange}
      totalPoints={totalPoints}
      totalScans={totalScans}
    />
  );
}
