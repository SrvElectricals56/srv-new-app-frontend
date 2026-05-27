import React from 'react';
import { BankTransferRequestPage } from './BankTransferRequestScreen';
import { PartnerCommissionPage } from './PartnerCommissionScreen';
import { PreferenceContext, type AppLanguage, usePreferenceValue } from '@/shared/preferences';
import { TransferPointsPage } from './TransferPointsScreen';
import type { Screen, UserRole } from '@/shared/types/navigation';

type WalletPreferenceProps = {
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
  darkMode: boolean;
  onDarkModeChange: (enabled: boolean) => void;
  currentRole: UserRole;
};

export function WalletBankDetailsScreen({
  onBack,
  onManageBankDetails,
  language,
  onLanguageChange,
  darkMode,
  onDarkModeChange,
  currentRole,
}: { onBack: () => void; onManageBankDetails?: () => void } & WalletPreferenceProps) {
  const preferenceValue = usePreferenceValue({
    language,
    setLanguage: onLanguageChange,
    darkMode,
    setDarkMode: onDarkModeChange,
    currentRole,
  });

  return (
    <PreferenceContext.Provider value={preferenceValue}>
      <BankTransferRequestPage onBack={onBack} onManageBankDetails={onManageBankDetails} />
    </PreferenceContext.Provider>
  );
}

export function WalletDealerBonusScreen({
  onBack,
  language,
  onLanguageChange,
  darkMode,
  onDarkModeChange,
  currentRole,
}: { onBack: () => void } & WalletPreferenceProps) {
  const preferenceValue = usePreferenceValue({
    language,
    setLanguage: onLanguageChange,
    darkMode,
    setDarkMode: onDarkModeChange,
    currentRole,
  });

  return (
    <PreferenceContext.Provider value={preferenceValue}>
      <PartnerCommissionPage onBack={onBack} />
    </PreferenceContext.Provider>
  );
}

export function WalletTransferPointsScreen({
  onBack,
  onNavigate,
  language,
  onLanguageChange,
  darkMode,
  onDarkModeChange,
  currentRole,
}: {
  onBack: () => void;
  onNavigate: (screen: Screen) => void;
} & WalletPreferenceProps) {
  const preferenceValue = usePreferenceValue({
    language,
    setLanguage: onLanguageChange,
    darkMode,
    setDarkMode: onDarkModeChange,
    currentRole,
  });

  return (
    <PreferenceContext.Provider value={preferenceValue}>
      <TransferPointsPage onBack={onBack} onNavigate={onNavigate} currentRole={currentRole} />
    </PreferenceContext.Provider>
  );
}
