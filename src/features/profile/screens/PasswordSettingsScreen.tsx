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

type PasswordMode = 'set' | 'change';

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
          blurOnSubmit={false}
          onSubmitEditing={onSubmitEditing}
          style={[styles.input, { color: theme.textPrimary }]}
        />
        <TouchableOpacity onPress={onToggle} style={styles.eyeBtn} activeOpacity={0.8}>
          <AppIcon
            name={secureTextEntry ? 'eye' : 'eyeOff'}
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
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
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Contains uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains a number (0-9)', test: (p) => /\d/.test(p) },
  {
    label: 'Contains special character (!@#$%)',
    test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p),
  },
  { label: 'No spaces allowed', test: (p) => !/\s/.test(p) },
];

function getStrengthLevel(password: string): { level: number; color: string } {
  if (!password) return { level: 0, color: C.muted };
  const passed = strengthRules.filter((r) => r.test(password)).length;
  if (passed <= 2) return { level: passed, color: '#EF4444' };
  if (passed <= 4) return { level: passed, color: '#F59E0B' };
  return { level: passed, color: '#22C55E' };
}

function PasswordStrengthIndicator({ password }: { password: string }) {
  const { tx, theme } = usePreferenceContext();
  const { level, color } = getStrengthLevel(password);

  if (!password) return null;

  return (
    <View style={styles.strengthContainer}>
      <View style={styles.strengthBar}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
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
  const { tx, theme } = usePreferenceContext();
  const { role, user, login, refreshProfile } = useAuth();
  const pageContent = useAppPageContent((role ?? 'electrician') as any, 'password');
  const [mode, setMode] = useState<PasswordMode>(hasPasswordConfigured ? 'change' : 'set');
  const [setPassword, setSetPassword] = useState('');
  const [confirmSetPassword, setConfirmSetPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
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
  const scrollRef = useRef<ScrollView | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSetDisabled = hasPasswordConfigured && mode === 'set';
  const isChangeDisabled = !hasPasswordConfigured && mode === 'change';

  const canSaveSet =
    mode === 'set' &&
    !hasPasswordConfigured &&
    setPassword.length >= 8 &&
    confirmSetPassword.length >= 8 &&
    setPassword === confirmSetPassword;
  const canSaveChange =
    mode === 'change' &&
    hasPasswordConfigured &&
    currentPassword.length > 0 &&
    newPassword.length >= 8 &&
    confirmNewPassword.length >= 8 &&
    newPassword === confirmNewPassword;
  const isSaveDisabled = isSaving || (mode === 'set' ? !canSaveSet : !canSaveChange);

  useEffect(() => {
    setMode(hasPasswordConfigured ? 'change' : 'set');
    setSetPassword('');
    setConfirmSetPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setErrors({});
    setSuccessMessage('');
  }, [hasPasswordConfigured, storedPassword]);

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

      if (trimmedSetPassword.length < 8) {
        nextErrors.setPassword = tx('Please enter a password with at least 8 characters.');
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
          setErrors({
            setPassword: tx('Please enter a password with at least 8 characters.'),
          });
          return;
        }

        setDialog({ visible: true, variant: 'error', title: '', message: message || tx('Please try again.') });
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

    if (trimmedNewPassword.length < 8) {
      nextErrors.newPassword = tx('Please enter a password with at least 8 characters.');
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
        setErrors({
          newPassword: tx('Please enter a password with at least 8 characters.'),
        });
        return;
      }

      setDialog({ visible: true, variant: 'error', title: '', message: message || tx('Please try again.') });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
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
            style={[styles.heroCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
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
            </View>
          </View>

          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionCard,
                {
                  backgroundColor: theme.surface,
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
                  backgroundColor: theme.surface,
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
          </View>

          <View
            style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              {mode === 'set' ? tx('Set Password') : tx('Change Password')}
            </Text>
            <Text style={[styles.sectionSub, { color: theme.textMuted }]}>
              {mode === 'set'
                ? hasPasswordConfigured
                  ? tx(
                      'A password is already active for this account. Use Change Password to update it.'
                    )
                  : tx('Use at least 8 characters so your account stays secure.')
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
                    setSetPassword(value.replace(/\s/g, ''));
                    clearFieldError('setPassword');
                  }}
                  secureTextEntry={!showSetPassword}
                  onToggle={() => setShowSetPassword((current) => !current)}
                  error={errors.setPassword}
                  placeholder={tx('Enter at least 8 characters')}
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
                    setConfirmSetPassword(value.replace(/\s/g, ''));
                    clearFieldError('confirmSetPassword');
                  }}
                  secureTextEntry={!showConfirmSetPassword}
                  onToggle={() => setShowConfirmSetPassword((current) => !current)}
                  error={errors.confirmSetPassword}
                  placeholder={tx('Re-enter the same password')}
                  inputRef={confirmSetPasswordRef}
                  returnKeyType="done"
                  onSubmitEditing={handleSave}
                  onFieldLayout={(y) => saveFieldOffset('confirmSetPassword', y)}
                  onFocusField={() => focusField('confirmSetPassword')}
                />
              </>
            ) : (
              <>
                <PasswordField
                  theme={theme}
                  label={tx('Current Password')}
                  value={currentPassword}
                  onChangeText={(value) => {
                    setCurrentPassword(value.replace(/\s/g, ''));
                    clearFieldError('currentPassword');
                  }}
                  secureTextEntry={!showCurrentPassword}
                  onToggle={() => setShowCurrentPassword((current) => !current)}
                  error={errors.currentPassword}
                  placeholder={tx('Enter current password')}
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
                    setNewPassword(value.replace(/\s/g, ''));
                    clearFieldError('newPassword');
                  }}
                  secureTextEntry={!showNewPassword}
                  onToggle={() => setShowNewPassword((current) => !current)}
                  error={errors.newPassword}
                  placeholder={tx('Enter a new password')}
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
                    setConfirmNewPassword(value.replace(/\s/g, ''));
                    clearFieldError('confirmNewPassword');
                  }}
                  secureTextEntry={!showConfirmNewPassword}
                  onToggle={() => setShowConfirmNewPassword((current) => !current)}
                  error={errors.confirmNewPassword}
                  placeholder={tx('Re-enter the same password')}
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
  scrollContent: { padding: 16, gap: 14, paddingBottom: 32 },
  heroCard: {
    flexDirection: 'row',
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 17, fontWeight: '800' },
  heroSub: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  optionsRow: { flexDirection: 'row', gap: 12 },
  optionCard: { flex: 1, borderRadius: 22, borderWidth: 1.5, padding: 16 },
  optionCardActive: {
    ...createShadow({ color: '#0F1120', offsetY: 8, blur: 18, opacity: 0.05, elevation: 2 }),
  },
  optionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  optionTitle: { fontSize: 14, fontWeight: '800' },
  optionSub: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  card: { borderRadius: 24, borderWidth: 1, padding: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
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
