import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Dialog } from '@/shared/components/Dialog';
import { AppIcon, C, PageHeader } from '../components/ProfileShared';
import { authApi, profileApi, storage } from '@/shared/api';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import { useAuth } from '@/shared/context/AuthContext';
import { useAppPageContent } from '@/shared/hooks';

type PasswordMode = 'set' | 'change' | 'reset';

type PasswordSettingsPageProps = {
  hasPasswordConfigured: boolean;
  storedPassword: string;
  onBack: () => void;
  onPasswordConfiguredChange: (configured: boolean) => void;
  onPasswordChange: (password: string) => void;
};

type PasswordErrors = {
  setPassword?: string;
  confirmSetPassword?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
  resetOtp?: string;
  resetPassword?: string;
  confirmResetPassword?: string;
};

type PasswordFieldProps = {
  theme: ReturnType<typeof usePreferenceContext>['theme'];
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry: boolean;
  onToggle: () => void;
  error?: string;
  placeholder: string;
  inputRef?: React.RefObject<TextInput | null>;
  returnKeyType?: 'done' | 'next';
  onSubmitEditing?: () => void;
  onFieldLayout?: (y: number) => void;
  onFocusField?: () => void;
  showToggle?: boolean;
  maxLength?: number;
};

function PasswordField({
  theme,
  label,
  value,
  onChangeText,
  secureTextEntry,
  onToggle,
  error,
  placeholder,
  inputRef,
  returnKeyType,
  onSubmitEditing,
  onFieldLayout,
  onFocusField,
  showToggle = true,
  maxLength,
}: PasswordFieldProps) {
  return (
    <View
      style={styles.field}
      onLayout={({ nativeEvent }) => onFieldLayout?.(nativeEvent.layout.y)}
    >
      <Text style={[styles.fieldLabel, { color: theme.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.inputWrap,
          { borderColor: error ? C.primary : theme.border, backgroundColor: theme.soft },
        ]}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocusField}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
          keyboardType="default"
          returnKeyType={returnKeyType}
          maxLength={maxLength}
          blurOnSubmit={false}
          onSubmitEditing={onSubmitEditing}
          style={[styles.input, { color: theme.textPrimary }]}
        />
        {showToggle ? (
          <TouchableOpacity onPress={onToggle} style={styles.eyeBtn} activeOpacity={0.8}>
            <AppIcon
              name={secureTextEntry ? 'eye' : 'eyeOff'}
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

type StrengthRule = {
  label: string;
  test: (pwd: string) => boolean;
};

const strengthRules: StrengthRule[] = [
  { label: 'Exactly 8 characters', test: (p) => p.length === 8 },
  {
    label: 'Contains special character (!@#$%)',
    test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
  },
  { label: 'No spaces allowed', test: (p) => !/\s/.test(p) },
];

const PASSWORD_MAX_LENGTH = 8;
const PASSWORD_RULE_MESSAGE = 'Password must be exactly 8 characters long and include one special character.';
const isStrongPassword = (value: string) => /^(?=.*[^A-Za-z0-9])\S{8}$/.test(value);
const cleanPasswordInput = (value: string) => value.replace(/\s/g, '').slice(0, PASSWORD_MAX_LENGTH);

function getStrengthLevel(password: string): { level: number; color: string } {
  if (!password) return { level: 0, color: C.muted };
  const passed = strengthRules.filter((r) => r.test(password)).length;
  if (passed <= 1) return { level: passed, color: '#EF4444' };
  if (passed <= 2) return { level: passed, color: '#F59E0B' };
  return { level: passed, color: '#22C55E' };
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const { tx, theme } = usePreferenceContext();
  const { level, color } = getStrengthLevel(password);

  if (!password) return null;

  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBar}>
        {[1, 2, 3].map((i) => (
          <View
            key={i}
            style={[styles.strengthSegment, { backgroundColor: i <= level ? color : theme.border }]}
          />
        ))}
      </View>
      <View style={styles.rulesList}>
        {strengthRules.map((rule, index) => {
          const passed = rule.test(password);
          return (
            <View key={index} style={styles.ruleRow}>
              <View
                style={[styles.ruleDot, { backgroundColor: passed ? '#22C55E' : theme.border }]}
              >
                {passed ? <AppIcon name="check" size={8} color="#fff" /> : null}
              </View>
              <Text style={[styles.ruleText, { color: passed ? '#22C55E' : theme.textMuted }]}>
                {tx(rule.label)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function PasswordSettingsPage({
  hasPasswordConfigured,
  storedPassword,
  onBack,
  onPasswordConfiguredChange,
  onPasswordChange,
}: PasswordSettingsPageProps) {
  const { tx, theme, darkMode } = usePreferenceContext();
  const { role, user, login, refreshProfile } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'password');
  const glassSurface = darkMode ? 'rgba(15,23,42,0.72)' : 'rgba(255,255,255,0.72)';
  const glassBorder = darkMode ? 'rgba(148,163,184,0.22)' : 'rgba(255,255,255,0.72)';
  const [mode, setMode] = useState<PasswordMode>(hasPasswordConfigured ? 'change' : 'set');
  const [setPassword, setSetPassword] = useState('');
  const [confirmSetPassword, setConfirmSetPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetOtpSent, setResetOtpSent] = useState(false);
  const [resetOtpVerified, setResetOtpVerified] = useState(false);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showConfirmSetPassword, setShowConfirmSetPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [fieldOffsets, setFieldOffsets] = useState<Record<string, number>>({});
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; confirmLabel?: string; onConfirm?: () => void; icon?: string }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));
  const setPasswordRef = useRef<TextInput | null>(null);
  const confirmSetPasswordRef = useRef<TextInput | null>(null);
  const currentPasswordRef = useRef<TextInput | null>(null);
  const newPasswordRef = useRef<TextInput | null>(null);
  const confirmNewPasswordRef = useRef<TextInput | null>(null);
  const resetOtpRef = useRef<TextInput | null>(null);
  const resetPasswordRef = useRef<TextInput | null>(null);
  const confirmResetPasswordRef = useRef<TextInput | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSetDisabled = hasPasswordConfigured && mode === 'set';
  const isChangeDisabled = !hasPasswordConfigured && mode === 'change';

  const canSaveSet =
    mode === 'set' &&
    !hasPasswordConfigured &&
    isStrongPassword(setPassword) &&
    confirmSetPassword.length === PASSWORD_MAX_LENGTH &&
    setPassword === confirmSetPassword;
  const canSaveChange =
    mode === 'change' &&
    hasPasswordConfigured &&
    currentPassword.length > 0 &&
    isStrongPassword(newPassword) &&
    confirmNewPassword.length === PASSWORD_MAX_LENGTH &&
    newPassword === confirmNewPassword;
  const canSaveReset =
    mode === 'reset' &&
    resetOtp.length >= 4 &&
    resetOtpVerified &&
    isStrongPassword(resetPassword) &&
    confirmResetPassword === resetPassword;
  const isSaveDisabled = isSaving || (mode === 'set' ? !canSaveSet : mode === 'change' ? !canSaveChange : !canSaveReset);

  useEffect(() => {
    setMode(hasPasswordConfigured ? 'change' : 'set');
    setSetPassword('');
    setConfirmSetPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetOtp('');
    setResetPassword('');
    setConfirmResetPassword('');
    setResetOtpSent(false);
    setResetOtpVerified(false);
    setErrors({});
    setSuccessMessage('');
  }, [hasPasswordConfigured, storedPassword]);

  useEffect(() => {
    setErrors((current) => {
      const next = { ...current };

      if (mode === 'set') {
        if (setPassword && confirmSetPassword && setPassword !== confirmSetPassword) {
          next.confirmSetPassword = tx('Please enter both passwords same.');
        } else if (next.confirmSetPassword === tx('Please enter both passwords same.')) {
          next.confirmSetPassword = undefined;
        }
      }

      if (mode === 'change') {
        if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
          next.confirmNewPassword = tx('Please enter both passwords same.');
        } else if (next.confirmNewPassword === tx('Please enter both passwords same.')) {
          next.confirmNewPassword = undefined;
        }
      }

      if (mode === 'reset') {
        if (resetPassword && confirmResetPassword && resetPassword !== confirmResetPassword) {
          next.confirmResetPassword = tx('Please enter both passwords same.');
        } else if (next.confirmResetPassword === tx('Please enter both passwords same.')) {
          next.confirmResetPassword = undefined;
        }
      }

      return next;
    });
  }, [confirmNewPassword, confirmResetPassword, confirmSetPassword, mode, newPassword, resetPassword, setPassword, tx]);

  // Sync hasPasswordConfigured from backend profile to avoid stale storage state
  useEffect(() => {
    if (user && typeof (user as any).hasPassword === 'boolean') {
      const backendHasPassword = (user as any).hasPassword as boolean;
      if (backendHasPassword !== hasPasswordConfigured) {
        onPasswordConfiguredChange(backendHasPassword);
        if (backendHasPassword) {
          storage.setPasswordConfigured(role as any, true).catch(() => {});
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const clearFieldError = (field: keyof PasswordErrors) => {
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const saveFieldOffset = (field: string, y: number) => {
    setFieldOffsets((current) => ({ ...current, [field]: y }));
  };

  const scrollToField = (field: string) => {
    const y = fieldOffsets[field];
    if (typeof y === 'number') {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 140), animated: true });
    }
  };

  const focusField = (field: string) => {
    requestAnimationFrame(() => scrollToField(field));
    setTimeout(() => scrollToField(field), Platform.OS === 'ios' ? 120 : 260);
  };

  const selectMode = (nextMode: PasswordMode) => {
    Keyboard.dismiss();
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    setMode(nextMode);
    setErrors({});
    setSuccessMessage('');
    if (nextMode === 'reset') {
      setResetOtp('');
      setResetPassword('');
      setConfirmResetPassword('');
      setResetOtpSent(false);
      setResetOtpVerified(false);
    }
  };

  const sendResetOtp = async () => {
    if (!user?.phone || !role) {
      setDialog({ visible: true, variant: 'error', title: '', message: tx('Phone number is not available for this account.') });
      return;
    }

    Keyboard.dismiss();
    setIsSaving(true);
    setSuccessMessage('');
    setResetOtpVerified(false);
    setResetPassword('');
    setConfirmResetPassword('');
    setErrors((current) => ({
      ...current,
      resetOtp: undefined,
      resetPassword: undefined,
      confirmResetPassword: undefined,
    }));
    try {
      const res = await authApi.sendPasswordResetOtp(user.phone, role);
      setResetOtpSent(true);
      setResetOtp('');
      setDialog({
        visible: true,
        variant: 'success',
        title: tx('OTP Sent'),
        message: res.devOtp ? `${tx('OTP sent successfully')}. Dev OTP: ${res.devOtp}` : tx('Please check your phone for the OTP'),
      });
      setTimeout(() => resetOtpRef.current?.focus(), 250);
    } catch (error: any) {
      setDialog({ visible: true, variant: 'error', title: '', message: error?.message || tx('Could not send OTP. Please try again.') });
    } finally {
      setIsSaving(false);
    }
  };

  const verifyResetOtp = async () => {
    if (!user?.phone || !role) {
      setDialog({ visible: true, variant: 'error', title: '', message: tx('Phone number is not available for this account.') });
      return;
    }

    Keyboard.dismiss();
    if (!resetOtpSent) {
      setErrors((current) => ({ ...current, resetOtp: tx('Please request OTP first.') }));
      return;
    }
    if (resetOtp.trim().length < 4) {
      setErrors((current) => ({ ...current, resetOtp: tx('Enter the OTP to continue.') }));
      return;
    }

    setIsSaving(true);
    setSuccessMessage('');
    setErrors((current) => ({ ...current, resetOtp: undefined }));
    try {
      await authApi.verifyPasswordResetOtp(user.phone, role, resetOtp.trim());
      setResetOtpVerified(true);
      setSuccessMessage(tx('OTP verified successfully. Create your new password now.'));
      setTimeout(() => resetPasswordRef.current?.focus(), 250);
    } catch (error: any) {
      setResetOtpVerified(false);
      setErrors((current) => ({
        ...current,
        resetOtp: error?.message || tx('Invalid OTP. Please try again.'),
      }));
    } finally {
      setIsSaving(false);
    }
  };

  const scheduleBackNavigation = () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }

    redirectTimerRef.current = setTimeout(() => {
      redirectTimerRef.current = null;
      onBack();
    }, 900);
  };

  const isCurrentPasswordRequiredError = (message: string) => {
    const normalized = message.toLowerCase();
    return (
      normalized.includes('current password is required') ||
      normalized.includes('current password required')
    );
  };

  const isAlreadyHasPasswordError = (message: string) => {
    const normalized = message.toLowerCase();
    return (
      (normalized.includes('already') && normalized.includes('password')) ||
      isCurrentPasswordRequiredError(normalized)
    );
  };

  const persistAndVerifyPassword = async (password: string, currentPasswordValue?: string) => {
    if (!currentPasswordValue) {
      // Set password mode — no current password provided
      try {
        await profileApi.changePassword({ newPassword: password });
      } catch (err: any) {
        const message = String(err?.message ?? '').trim();
        if (isCurrentPasswordRequiredError(message)) {
          // Backend says a password already exists — re-throw so handleSave can switch to change mode
          throw err;
        }
        // For any other error, try the profile patch fallback
        await profileApi.setPasswordFallback(password);
      }
    } else {
      await profileApi.changePassword({ currentPassword: currentPasswordValue, newPassword: password });
    }

    if (!user?.phone || !role) {
      // Can't verify with login — just mark as configured and refresh profile
      await storage.setPasswordConfigured(role as any, true);
      await refreshProfile();
      return;
    }

    // Re-login with new password to get fresh tokens (tokenVersion was incremented)
    try {
      const result = await authApi.loginWithPassword(user.phone, role, password);
      login(result.user, role);
      await storage.setPasswordConfigured(role, true);
      await refreshProfile();
    } catch {
      // Login verify failed, but password was saved — still mark as configured
      await storage.setPasswordConfigured(role, true);
      await refreshProfile();
    }
  };

  const handleSave = async () => {
    if (isSaving) {
      return;
    }

    Keyboard.dismiss();
    const nextErrors: PasswordErrors = {};
    const trimmedSetPassword = setPassword.trim();
    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();

    if (mode === 'set') {
      if (hasPasswordConfigured) {
        setSuccessMessage('');
        return;
      }

      if (trimmedSetPassword.length !== PASSWORD_MAX_LENGTH) {
        nextErrors.setPassword = tx(PASSWORD_RULE_MESSAGE);
      } else if (!isStrongPassword(trimmedSetPassword)) {
        nextErrors.setPassword = tx(PASSWORD_RULE_MESSAGE);
      }

      if (confirmSetPassword.trim().length === 0) {
        nextErrors.confirmSetPassword = tx('Please confirm your password to continue.');
      } else if (confirmSetPassword !== trimmedSetPassword) {
        nextErrors.confirmSetPassword = tx('Please enter both passwords same.');
      }

      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        setSuccessMessage('');
        return;
      }

      setIsSaving(true);
      setSuccessMessage('');

      try {
        await persistAndVerifyPassword(trimmedSetPassword);
        onPasswordChange(trimmedSetPassword);
        onPasswordConfiguredChange(true);
        setErrors({});
        setSuccessMessage(tx('Password saved successfully.'));
        setSetPassword('');
        setConfirmSetPassword('');
        scheduleBackNavigation();
      } catch (error: any) {
        const message = String(error?.message ?? '').trim();
        const lowerMessage = message.toLowerCase();

        if (isAlreadyHasPasswordError(message) || (lowerMessage.includes('already') && lowerMessage.includes('password'))) {
          onPasswordConfiguredChange(true);
          setMode('change');
          setDialog({ visible: true, variant: 'info', title: '', message: tx('A password is already active for this account. Use Change Password to update it.') });
          return;
        }

        if (
          lowerMessage.includes('at least') ||
          lowerMessage.includes('minimum') ||
          lowerMessage.includes('too short')
        ) {
          setErrors({ setPassword: tx(PASSWORD_RULE_MESSAGE) });
          return;
        }

        setDialog({ visible: true, variant: 'error', title: '', message: message || tx('Please try again.') });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (mode === 'reset') {
      if (!user?.phone || !role) {
        setDialog({ visible: true, variant: 'error', title: '', message: tx('Phone number is not available for this account.') });
        return;
      }
      if (!resetOtpSent) {
        nextErrors.resetOtp = tx('Please request OTP first.');
      } else if (resetOtp.trim().length < 4) {
        nextErrors.resetOtp = tx('Enter the OTP to continue.');
      } else if (!resetOtpVerified) {
        nextErrors.resetOtp = tx('Please verify OTP before updating password.');
      }
      if (!isStrongPassword(resetPassword.trim())) {
        nextErrors.resetPassword = tx(PASSWORD_RULE_MESSAGE);
      }
      if (confirmResetPassword.trim().length === 0) {
        nextErrors.confirmResetPassword = tx('Please confirm your new password to continue.');
      } else if (confirmResetPassword !== resetPassword.trim()) {
        nextErrors.confirmResetPassword = tx('Please enter both passwords same.');
      }
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        setSuccessMessage('');
        if (nextErrors.resetPassword) {
          setDialog({ visible: true, variant: 'info', title: tx('Password Required'), message: tx(PASSWORD_RULE_MESSAGE) });
        }
        return;
      }

      setIsSaving(true);
      setSuccessMessage('');
      try {
        await authApi.resetPasswordWithOtp(user.phone, role, resetOtp.trim(), resetPassword.trim());
        const result = await authApi.loginWithPassword(user.phone, role, resetPassword.trim());
        login(result.user, role);
        await storage.setPasswordConfigured(role, true);
        await refreshProfile();
        onPasswordChange(resetPassword.trim());
        onPasswordConfiguredChange(true);
        setErrors({});
        setSuccessMessage(tx('Password updated successfully.'));
        setResetOtp('');
        setResetPassword('');
        setConfirmResetPassword('');
        setResetOtpSent(false);
        scheduleBackNavigation();
      } catch (error: any) {
        setDialog({ visible: true, variant: 'error', title: '', message: error?.message || tx('Please try again.') });
      } finally {
        setIsSaving(false);
      }
      return;
    }

    if (!hasPasswordConfigured) {
      nextErrors.currentPassword = tx('Set a password first before trying to change it.');
    } else if (trimmedCurrentPassword.length === 0) {
      nextErrors.currentPassword = tx('Please enter your current password.');
    }

    if (!isStrongPassword(trimmedNewPassword)) {
      nextErrors.newPassword = tx(PASSWORD_RULE_MESSAGE);
    } else if (trimmedNewPassword === trimmedCurrentPassword) {
      nextErrors.newPassword = tx(
        'Please choose a new password that is different from the current password.'
      );
    }

    if (confirmNewPassword.trim().length === 0) {
      nextErrors.confirmNewPassword = tx('Please confirm your new password to continue.');
    } else if (confirmNewPassword !== trimmedNewPassword) {
      nextErrors.confirmNewPassword = tx('Please enter both passwords same.');
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSuccessMessage('');
      return;
    }

    setIsSaving(true);
    setSuccessMessage('');

    try {
      await persistAndVerifyPassword(trimmedNewPassword, trimmedCurrentPassword);
      onPasswordChange(trimmedNewPassword);
      onPasswordConfiguredChange(true);
      setErrors({});
      setSuccessMessage(tx('Password updated successfully.'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      scheduleBackNavigation();
    } catch (error: any) {
      const message = String(error?.message ?? '').trim();
      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes('current password') ||
        lowerMessage.includes('incorrect') ||
        lowerMessage.includes('invalid password') ||
        lowerMessage.includes('wrong password')
      ) {
        setErrors({
          currentPassword: tx('The current password you entered is incorrect.'),
        });
        return;
      }

      if (
        lowerMessage.includes('different') ||
        lowerMessage.includes('same as current')
      ) {
        setErrors({
          newPassword: tx(
            'Please choose a new password that is different from the current password.'
          ),
        });
        return;
      }

      if (
        lowerMessage.includes('at least') ||
        lowerMessage.includes('minimum') ||
        lowerMessage.includes('too short')
      ) {
          setErrors({ newPassword: tx(PASSWORD_RULE_MESSAGE) });
          return;
        }

      setDialog({ visible: true, variant: 'error', title: '', message: message || tx('Please try again.') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <PageHeader title={pageContent.pageTitle || tx('Password')} onBack={onBack} />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}
          contentInset={{ bottom: keyboardHeight }}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: keyboardHeight + 32 }]}
        >
          <View
            style={[styles.heroCard, { backgroundColor: glassSurface, borderColor: glassBorder }]}
          >
            <View style={styles.heroIconWrap}>
              <AppIcon name="lock" size={22} color={C.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                {tx('Manage your password')}
              </Text>
              <Text style={[styles.heroSub, { color: theme.textMuted }]}>
                {tx('Set a password if you skipped it earlier, or change it anytime from here.')}
              </Text>
              <View style={[styles.passwordStatusPill, { backgroundColor: hasPasswordConfigured ? C.successLight : C.primaryLight }]}>
                <AppIcon name={hasPasswordConfigured ? 'check' : 'lock'} size={13} color={hasPasswordConfigured ? C.success : C.primary} />
                <Text style={[styles.passwordStatusText, { color: hasPasswordConfigured ? C.success : C.primary }]}>
                  {tx(hasPasswordConfigured ? 'Password active' : 'Password not set')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                {
                  backgroundColor: glassSurface,
                  borderColor: mode === 'set' ? C.blue : theme.border,
                },
                mode === 'set' ? styles.optionCardActive : null,
              ]}
              onPress={() => selectMode('set')}
              activeOpacity={0.85}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: C.blueLight }]}>
                <AppIcon name="lock" size={18} color={C.blue} />
              </View>
              <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                {tx('Set Password')}
              </Text>
              <Text style={[styles.optionSub, { color: theme.textMuted }]}>
                {tx('Create a password for future login access.')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                {
                  backgroundColor: glassSurface,
                  borderColor: mode === 'change' ? C.primary : theme.border,
                },
                mode === 'change' ? styles.optionCardActive : null,
              ]}
              onPress={() => selectMode('change')}
              activeOpacity={0.85}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: C.primaryLight }]}>
                <AppIcon name="edit" size={18} color={C.primary} />
              </View>
              <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                {tx('Change Password')}
              </Text>
              <Text style={[styles.optionSub, { color: theme.textMuted }]}>
                {tx('Update your current password whenever needed.')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.optionCard,
                {
                  backgroundColor: glassSurface,
                  borderColor: mode === 'reset' ? C.primary : theme.border,
                },
                mode === 'reset' ? styles.optionCardActive : null,
              ]}
              onPress={() => selectMode('reset')}
              activeOpacity={0.85}
            >
              <View style={[styles.optionIconWrap, { backgroundColor: C.primaryLight }]}>
                <AppIcon name="lock" size={18} color={C.primary} />
              </View>
              <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>
                {tx('Forgot Password')}
              </Text>
              <Text style={[styles.optionSub, { color: theme.textMuted }]}>
                {tx('Reset with OTP if you forgot the current password.')}
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[styles.card, { backgroundColor: glassSurface, borderColor: glassBorder }]}
          >
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {mode === 'set' ? tx('Set Password') : mode === 'reset' ? tx('Forgot Password') : tx('Change Password')}
            </Text>
            <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
              {mode === 'set'
                ? hasPasswordConfigured
                  ? tx(
                      'A password is already active for this account. Use Change Password to update it.'
                    )
                  : tx('Use exactly 8 characters with at least one special character.')
                : mode === 'reset'
                  ? tx('Verify OTP sent to your phone, then create a new password.')
                : hasPasswordConfigured
                  ? tx('Enter your current password and then create a new one.')
                  : tx(
                      'You can change a password after you create one from the Set Password option.'
                    )}
            </Text>

            {mode === 'set' ? (
              <>
                <PasswordField
                  theme={theme}
                  label={tx('Password')}
                  value={setPassword}
                  onChangeText={(value) => {
                    setSetPassword(cleanPasswordInput(value));
                    clearFieldError('setPassword');
                  }}
                  secureTextEntry={!showSetPassword}
                  maxLength={PASSWORD_MAX_LENGTH}
                  onToggle={() => setShowSetPassword((current) => !current)}
                  error={errors.setPassword}
                  placeholder={tx('Enter exactly 8 characters')}
                  inputRef={setPasswordRef}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmSetPasswordRef.current?.focus()}
                  onFieldLayout={(y) => saveFieldOffset('setPassword', y)}
                  onFocusField={() => focusField('setPassword')}
                />
                <PasswordStrengthIndicator password={setPassword} />
                <PasswordField
                  theme={theme}
                  label={tx('Confirm Password')}
                  value={confirmSetPassword}
                  onChangeText={(value) => {
                    setConfirmSetPassword(cleanPasswordInput(value));
                    clearFieldError('confirmSetPassword');
                  }}
                  secureTextEntry={!showConfirmSetPassword}
                  maxLength={PASSWORD_MAX_LENGTH}
                  onToggle={() => setShowConfirmSetPassword((current) => !current)}
                  error={errors.confirmSetPassword}
                  placeholder={tx('Re-enter exactly 8 characters')}
                  inputRef={confirmSetPasswordRef}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  onFieldLayout={(y) => saveFieldOffset('confirmSetPassword', y)}
                  onFocusField={() => focusField('confirmSetPassword')}
                />
              </>
            ) : mode === 'reset' ? (
              <>
                <PasswordField
                  theme={theme}
                  label={tx('OTP')}
                  value={resetOtp}
                  onChangeText={(value) => {
                    setResetOtp(value.replace(/\D/g, '').slice(0, 6));
                    setResetOtpVerified(false);
                    clearFieldError('resetOtp');
                  }}
                  secureTextEntry={false}
                  maxLength={6}
                  onToggle={() => {}}
                  showToggle={false}
                  error={errors.resetOtp}
                  placeholder={tx('Enter OTP')}
                  inputRef={resetOtpRef}
                  returnKeyType="next"
                  onSubmitEditing={verifyResetOtp}
                  onFieldLayout={(y) => saveFieldOffset('resetOtp', y)}
                  onFocusField={() => focusField('resetOtp')}
                />
                <View style={styles.otpActionRow}>
                  <TouchableOpacity
                    style={[styles.secondaryBtn, styles.otpActionBtn, { borderColor: theme.border }]}
                    onPress={sendResetOtp}
                    disabled={isSaving}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.secondaryBtnText, { color: theme.accent }]}>
                      {tx(resetOtpSent ? 'Resend OTP' : 'Send OTP')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.secondaryBtn,
                      styles.otpActionBtn,
                      resetOtpVerified ? styles.verifyBtnSuccess : null,
                      { borderColor: resetOtpVerified ? C.success : theme.border },
                    ]}
                    onPress={verifyResetOtp}
                    disabled={isSaving || resetOtpVerified || !resetOtpSent || resetOtp.length < 4}
                    activeOpacity={0.82}
                  >
                    <Text style={[styles.secondaryBtnText, { color: resetOtpVerified ? C.success : theme.accent }]}>
                      {tx(resetOtpVerified ? 'OTP Verified' : 'Verify OTP')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {resetOtpVerified ? (
                  <>
                    <PasswordField
                      theme={theme}
                      label={tx('New Password')}
                      value={resetPassword}
                      onChangeText={(value) => {
                        setResetPassword(cleanPasswordInput(value));
                        clearFieldError('resetPassword');
                      }}
                      secureTextEntry={!showNewPassword}
                      maxLength={PASSWORD_MAX_LENGTH}
                      onToggle={() => setShowNewPassword((current) => !current)}
                      error={errors.resetPassword}
                      placeholder={tx('Enter exactly 8 characters')}
                      inputRef={resetPasswordRef}
                      returnKeyType="next"
                      onSubmitEditing={() => confirmResetPasswordRef.current?.focus()}
                      onFieldLayout={(y) => saveFieldOffset('resetPassword', y)}
                      onFocusField={() => focusField('resetPassword')}
                    />
                    <PasswordStrengthIndicator password={resetPassword} />
                    <PasswordField
                      theme={theme}
                      label={tx('Confirm New Password')}
                      value={confirmResetPassword}
                      onChangeText={(value) => {
                        setConfirmResetPassword(cleanPasswordInput(value));
                        clearFieldError('confirmResetPassword');
                      }}
                      secureTextEntry={!showConfirmNewPassword}
                      maxLength={PASSWORD_MAX_LENGTH}
                      onToggle={() => setShowConfirmNewPassword((current) => !current)}
                      error={errors.confirmResetPassword}
                      placeholder={tx('Re-enter exactly 8 characters')}
                      inputRef={confirmResetPasswordRef}
                      returnKeyType="done"
                      onSubmitEditing={handleSave}
                      onFieldLayout={(y) => saveFieldOffset('confirmResetPassword', y)}
                      onFocusField={() => focusField('confirmResetPassword')}
                    />
                  </>
                ) : (
                  <View style={styles.lockedResetHint}>
                    <AppIcon name="lock" size={14} color={theme.textMuted} />
                    <Text style={[styles.lockedResetHintText, { color: theme.textMuted }]}>
                      {tx('Verify OTP to unlock new password fields.')}
                    </Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <PasswordField
                  theme={theme}
                  label={tx('Current Password')}
                  value={currentPassword}
                  onChangeText={(value) => {
                    setCurrentPassword(cleanPasswordInput(value));
                    clearFieldError('currentPassword');
                  }}
                  secureTextEntry={!showCurrentPassword}
                  maxLength={PASSWORD_MAX_LENGTH}
                  onToggle={() => setShowCurrentPassword((current) => !current)}
                  error={errors.currentPassword}
                  placeholder={tx('Enter current 8 character password')}
                  inputRef={currentPasswordRef}
                  returnKeyType="next"
                  onSubmitEditing={() => newPasswordRef.current?.focus()}
                  onFieldLayout={(y) => saveFieldOffset('currentPassword', y)}
                  onFocusField={() => focusField('currentPassword')}
                />

                <PasswordField
                  theme={theme}
                  label={tx('New Password')}
                  value={newPassword}
                  onChangeText={(value) => {
                    setNewPassword(cleanPasswordInput(value));
                    clearFieldError('newPassword');
                  }}
                  secureTextEntry={!showNewPassword}
                  maxLength={PASSWORD_MAX_LENGTH}
                  onToggle={() => setShowNewPassword((current) => !current)}
                  error={errors.newPassword}
                  placeholder={tx('Enter exactly 8 characters')}
                  inputRef={newPasswordRef}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmNewPasswordRef.current?.focus()}
                  onFieldLayout={(y) => saveFieldOffset('newPassword', y)}
                  onFocusField={() => focusField('newPassword')}
                />
                <PasswordStrengthIndicator password={newPassword} />
                <PasswordField
                  theme={theme}
                  label={tx('Confirm New Password')}
                  value={confirmNewPassword}
                  onChangeText={(value) => {
                    setConfirmNewPassword(cleanPasswordInput(value));
                    clearFieldError('confirmNewPassword');
                  }}
                  secureTextEntry={!showConfirmNewPassword}
                  maxLength={PASSWORD_MAX_LENGTH}
                  onToggle={() => setShowConfirmNewPassword((current) => !current)}
                  error={errors.confirmNewPassword}
                  placeholder={tx('Re-enter exactly 8 characters')}
                  inputRef={confirmNewPasswordRef}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  onFieldLayout={(y) => saveFieldOffset('confirmNewPassword', y)}
                  onFocusField={() => focusField('confirmNewPassword')}
                />
              </>
            )}

            {successMessage ? (
              <View style={styles.successCard}>
                <AppIcon name="check" size={16} color={C.success} />
                <Text style={styles.successText}>{successMessage}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                { backgroundColor: theme.accent },
                isSetDisabled || isChangeDisabled || isSaveDisabled
                  ? styles.primaryBtnDisabled
                  : null,
              ]}
              onPress={handleSave}
              activeOpacity={0.85}
              disabled={isSetDisabled || isChangeDisabled || isSaveDisabled}
            >
              <Text style={styles.primaryBtnText}>
                {isSaving
                  ? tx('Saving...')
                  : mode === 'set'
                    ? tx('Save Password')
                    : mode === 'reset'
                      ? tx('Reset Password')
                    : tx('Update Password')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Dialog
        visible={dialog.visible}
        variant={dialog.variant}
        title={dialog.title}
        message={dialog.message}
        confirmLabel={dialog.confirmLabel}
        icon={dialog.icon}
        onConfirm={dialog.onConfirm}
        onClose={closeDialog}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 32 },
  heroCard: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    overflow: 'hidden',
    ...createShadow({ color: '#0F172A', offsetY: 18, blur: 30, opacity: 0.12, elevation: 6 }),
  },
  heroIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: C.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 18, fontWeight: '900' },
  heroSub: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  passwordStatusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 10,
  },
  passwordStatusText: { fontSize: 11.5, fontWeight: '900' },
  optionsRow: { gap: 10 },
  optionCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 15,
    minHeight: 104,
    overflow: 'hidden',
  },
  optionCardActive: {
    transform: [{ translateY: -2 }],
    ...createShadow({ color: '#0F1120', offsetY: 16, blur: 26, opacity: 0.13, elevation: 5 }),
  },
  optionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionTitle: { fontSize: 14, fontWeight: '900' },
  optionSub: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  card: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    ...createShadow({ color: '#0F172A', offsetY: 18, blur: 32, opacity: 0.1, elevation: 6 }),
  },
  sectionTitle: { fontSize: 17, fontWeight: '900' },
  sectionSub: { fontSize: 12, lineHeight: 18, marginTop: 4, marginBottom: 18 },
  field: { marginBottom: 16 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputWrap: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 14, fontWeight: '500', paddingVertical: 14 },
  eyeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: C.primary, fontSize: 12, lineHeight: 17, marginTop: 6, fontWeight: '600' },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.successLight,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  successText: { color: C.success, fontSize: 13, fontWeight: '700', flex: 1 },
  primaryBtn: {
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.55 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '900' },
  otpActionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  otpActionBtn: { flex: 1, marginBottom: 0 },
  verifyBtnSuccess: { backgroundColor: 'rgba(34,197,94,0.12)' },
  lockedResetHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(148,163,184,0.12)',
    marginBottom: 16,
  },
  lockedResetHintText: { flex: 1, fontSize: 12.5, fontWeight: '700', lineHeight: 18 },
  strengthContainer: { marginBottom: 16, paddingHorizontal: 4 },
  strengthBar: { flexDirection: 'row', gap: 4, marginBottom: 12 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  rulesList: { gap: 6 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleText: { fontSize: 11.5, fontWeight: '600' },
});
