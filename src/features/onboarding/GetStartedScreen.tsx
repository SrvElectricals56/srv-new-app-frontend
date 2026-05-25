import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MainSlide, { UserRole as OnboardingRole } from './Main_Slide';
import DealerSlide from './Dealer_Slide';
import ElectricianSlide from './Electrician_Slide';
import CustomerSlide from './Customer_Slide';
import CounterBoySlide from '../counterboy/screens/CounterBoySlide';
import type { UserRole } from '@/shared/types/navigation';
import { usePreferenceContext } from '@/shared/preferences';

interface GetStartedScreenProps {
  onComplete: (role: UserRole) => void;
}

export function GetStartedScreen({ onComplete }: GetStartedScreenProps) {
  const [selectedRole, setSelectedRole] = useState<OnboardingRole | null>(null);
  const { darkMode } = usePreferenceContext();
  const bg = darkMode ? '#0B1220' : '#FFFFFF';

  const handleBack = () => setSelectedRole(null);

  const handleContinue = (role: OnboardingRole) => {
    // counter-boy maps to counterboy app role
    const appRole: UserRole = role === 'counter-boy' ? 'counterboy' : role;
    onComplete(appRole);
  };

  if (selectedRole === 'dealer') {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <DealerSlide onBack={handleBack} onContinue={() => handleContinue('dealer')} />
      </View>
    );
  }
  if (selectedRole === 'electrician') {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <ElectricianSlide onBack={handleBack} onContinue={() => handleContinue('electrician')} />
      </View>
    );
  }
  if (selectedRole === 'user') {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <CustomerSlide onBack={handleBack} onContinue={() => handleContinue('user')} />
      </View>
    );
  }
  if (selectedRole === 'counter-boy') {
    return (
      <View style={[s.root, { backgroundColor: bg }]}>
        <CounterBoySlide onBack={handleBack} onContinue={() => handleContinue('counter-boy')} />
      </View>
    );
  }

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <MainSlide onRoleSelect={(role) => setSelectedRole(role)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
});
