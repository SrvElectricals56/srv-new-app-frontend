import type { UserProfile } from '@/shared/api/services';
import type { UserRole } from '@/shared/types/navigation';

export type ProfileCompletionAction = 'profile' | 'photo' | 'kyc' | 'bank';

export type ProfileCompletionItem = {
  key: string;
  label: string;
  description: string;
  complete: boolean;
  action: ProfileCompletionAction;
};

const hasText = (value: unknown) => String(value ?? '').trim().length > 0;

export function getProfileCompletionColor(percentage: number) {
  if (percentage >= 100) return '#16A34A';
  if (percentage >= 50) return '#F59E0B';
  return '#DC2626';
}

export function getProfileCompletion(
  user: UserProfile | null | undefined,
  role: UserRole | null | undefined,
) {
  if (!user) return { percentage: 0, complete: false, completedCount: 0, totalCount: 9, items: [] as ProfileCompletionItem[] };

  const city = user.city ?? user.town;
  const kycVerified = String(user.kycStatus ?? '').trim().toLowerCase() === 'verified';

  const items: ProfileCompletionItem[] = [
    { key: 'name', label: 'Full name', description: 'Add your full name to your profile.', complete: hasText(user.name), action: 'profile' },
    { key: 'phone', label: 'Mobile number', description: 'Add and verify your mobile number.', complete: /^\d{10}$/.test(String(user.phone ?? '').replace(/\D/g, '')), action: 'profile' },
    { key: 'location', label: 'State and district', description: 'Add your state and district or city.', complete: hasText(user.state) && hasText(user.district ?? city), action: 'profile' },
    { key: 'address', label: 'Address and pincode', description: 'Add your complete address and six-digit pincode.', complete: hasText(user.address) && /^\d{6}$/.test(String(user.pincode ?? '')), action: 'profile' },
    { key: 'photo', label: 'Profile photo', description: 'Upload a clear profile photo.', complete: hasText(user.profileImage), action: 'photo' },
    { key: 'account-holder', label: 'Account holder name', description: 'Add the payment account holder name.', complete: hasText(user.accountHolderName), action: 'bank' },
    { key: 'payment-number', label: 'Google Pay number', description: 'Add your valid Google Pay number.', complete: /^\d{10}$/.test(String(user.bankAccount ?? '').replace(/\D/g, '')), action: 'bank' },
    { key: 'upi-qr', label: 'UPI QR code', description: 'Upload a clear UPI QR code image.', complete: hasText(user.upiQrCodeImage) && Boolean(user.bankLinked), action: 'bank' },
    { key: 'kyc-verification', label: 'KYC verification', description: 'Submit your KYC and call SRV Help for faster verification.', complete: kycVerified, action: 'kyc' },
  ];

  const completedCount = items.filter((item) => item.complete).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  return {
    percentage,
    complete: percentage === 100,
    completedCount,
    totalCount: items.length,
    items,
  };
}
