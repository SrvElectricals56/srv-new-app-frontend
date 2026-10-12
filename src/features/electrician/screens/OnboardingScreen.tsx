import { LocalizedAlert as Alert, LocalizedText as Text, LocalizedTextInput as TextInput } from '@/shared/preferences/LocalizedNative';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Easing, Image, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StatusBar, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Svg, { Path } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { SRV_LOGO } from '@/shared/assets';
import { usePreferenceContext } from '@/shared/preferences';
import { clearShadow, createShadow } from '@/shared/theme/shadows';
import { authApi, dealerApi } from '@/shared/api';
import { useSmsOtpAutofill } from '@/shared/auth/useSmsOtpAutofill';
import { useKeyboardReveal } from '@/shared/hooks/useKeyboardReveal';
import {
  isValidOptionalEmail,
  isValidOptionalGstOrPanNumber,
  normalizeGstOrPanNumber,
  sanitizeEmailInput,
} from '@/shared/utils/validation';
import type { UserRole } from '@/shared/types/navigation';
type IntroStep = 'language' | 'role' | 'auth';
type AuthMode = 'login' | 'signup';
type LoginStep = 'phone' | 'otp';
type SignupStep =
  | 'name'
  | 'email'
  | 'dealer'
  | 'address'
  | 'location'
  | 'identity'
  | 'holders'
  | 'terms'
  | 'phone'
  | 'otp'
  | 'consent';

const OTP_AUTO_COMPLETE = Platform.OS === 'android' ? 'sms-otp' : 'one-time-code';

const C = {
  bg: '#EEF3F8',
  heroA: '#EEF3F8',
  heroB: '#EAF3FF',
  heroC: '#F6EEFF',
  white: '#FFFFFF',
  line: '#E6ECF5',
  text: '#152238',
  title: '#14213D',
  muted: '#74829D',
  muted2: '#5C6F91',
  field: '#FBFDFF',
  fieldLine: '#D8E2F0',
  primary: '#E8453C',
  success: '#1F9C5D',
  successSoft: '#EAF8EF',
  error: '#D64B4B',
  errorSoft: '#FFF3F3',
  warning: '#173E80',
  warningSoft: '#EAF3FF',
  warmA: '#F97316',
  warmB: '#EF4444',
  accentA: '#173E80',
  accentB: '#355C95',
};

const roleMeta = {
  electrician: { title: 'Electrician', subtitle: 'Field rewards and quick verification' },
  dealer: { title: 'Dealer', subtitle: 'Business onboarding and account access' },
  user: { title: 'User', subtitle: 'Customer account access and rewards overview' },
  counterboy: { title: 'Counter Boy', subtitle: 'Counter operations and account access' },
} as const;

const languageOptions = [
  {
    value: 'English',
    title: 'English',
    nativeTitle: 'English',
    mark: 'A',
    description: 'For onboarding and rewards.',
  },
  {
    value: 'Hindi',
    title: 'Hindi',
    nativeTitle: '\u0939\u093f\u0902\u0926\u0940',
    mark: '\u0905',
    description: 'Hindi onboarding and rewards.',
  },
  {
    value: 'Punjabi',
    title: 'Punjabi',
    nativeTitle: '\u0a2a\u0a70\u0a1c\u0a3e\u0a2c\u0a40',
    mark: '\u0a05',
    description: 'Punjabi onboarding and rewards.',
  },
] as const;

const dealerSignupMeta: Partial<
  Record<SignupStep, { stepLabel: string; title: string; description: string; buttonLabel: string }>
> = {
  name: {
    stepLabel: 'Step 1 of 5',
    title: 'Business Profile',
    description:
      'Enter the owner or business name and optional email address.',
    buttonLabel: 'Continue to Location',
  },
  location: {
    stepLabel: 'Step 2 of 5',
    title: 'Location Details',
    description:
      'Enter your state, district and 6-digit pincode manually.',
    buttonLabel: 'Continue to Identity',
  },
  identity: {
    stepLabel: 'Step 3 of 5',
    title: 'Business Identity',
    description:
      'Add GST or PAN details now, or skip this step and update them later from Edit Profile.',
    buttonLabel: 'Continue to Mobile Verification',
  },
  holders: {
    stepLabel: 'Step 4 of 5',
    title: 'Mobile Verification',
    description: 'Verify the dealer mobile number before the final step.',
    buttonLabel: 'Continue',
  },
  consent: {
    stepLabel: 'Step 5 of 5',
    title: 'Consent',
    description: 'Accept the terms to finish creating your account.',
    buttonLabel: 'Create Account',
  },
};

function useReveal() {
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(
      fade,
      withWebSafeNativeDriver({
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
      })
    ).start();
  }, [fade]);
  return {
    opacity: fade,
    transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };
}

function Info({ text, kind }: { text: string; kind: 'error' | 'success' | 'warning' | 'hint' }) {
  const { tx } = usePreferenceContext();
  return (
    <View
      style={[
        s.info,
        kind === 'error'
          ? s.infoError
          : kind === 'warning'
            ? s.infoWarning
            : kind === 'hint'
              ? s.infoHint
              : s.infoSuccess,
      ]}
    >
      <Text
        style={[
          s.infoText,
          kind === 'error'
            ? s.infoErrorText
            : kind === 'warning'
              ? s.infoWarningText
              : kind === 'hint'
                ? s.infoHintText
                : s.infoSuccessText,
        ]}
      >
        {tx(text)}
      </Text>
    </View>
  );
}

function BackArrowIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 5L8 12L15 19"
        stroke="#152238"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12L10 17L20 7"
        stroke="#FFFFFF"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TranslateIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M4 7H12" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
      <Path
        d="M8 7C8 11.1 6.44 14.39 4 16"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.5 11C6.7 12.91 8.38 14.53 10.35 15.72"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.5 17L17.5 9L20.5 17"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M15.55 14.25H19.45" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
    </Svg>
  );
}

function LanguageChooser() {
  const { language, setLanguage, tx } = usePreferenceContext();
  const [open, setOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(
      dropdownAnim,
      withWebSafeNativeDriver({
        toValue: open ? 1 : 0,
        duration: 180,
        easing: Easing.out(Easing.cubic),
      })
    ).start();
  }, [dropdownAnim, open]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(
          pulseAnim,
          withWebSafeNativeDriver({
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        Animated.timing(
          pulseAnim,
          withWebSafeNativeDriver({
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
          })
        ),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const options: { value: 'English' | 'Hindi' | 'Punjabi'; title: string; mark: string }[] =
    languageOptions.map((option) => ({
      value: option.value,
      title:
        option.value === 'English'
          ? tx('English')
          : option.value === 'Hindi'
            ? tx('Hindi')
            : tx('Punjabi'),
      mark: option.mark,
    }));
  const currentOption = options.find((option) => option.value === language) ?? options[0];
  const dropdownStyle = {
    opacity: dropdownAnim,
    transform: [
      {
        translateY: dropdownAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 0],
        }),
      },
      {
        scale: dropdownAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };
  const triggerAnimStyle = {
    transform: [
      {
        translateY: pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -2],
        }),
      },
      {
        scale: pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.04],
        }),
      },
    ],
  };

  return (
    <View style={s.languageWrap}>
      {open && <Pressable style={s.languageBackdropFull} onPress={() => setOpen(false)} />}
      <Animated.View style={triggerAnimStyle}>
        <Pressable
          onPress={() => setOpen((current) => !current)}
          style={[s.languageTrigger, open ? s.languageTriggerActive : null]}
        >
          <LinearGradient
            colors={open ? ['#2C6BE7', '#5DAAF8'] : ['#F8FBFF', '#E8F1FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.languageTriggerFill}
          >
            <View style={[s.languageMiniIcon, open ? s.languageMiniIconActive : null]}>
              <TranslateIcon color={open ? '#FFFFFF' : '#2C6BE7'} />
            </View>
            <Text style={[s.languageMiniText, open ? s.languageMiniTextActive : null]}>
              {currentOption.mark}
            </Text>
          </LinearGradient>
        </Pressable>
      </Animated.View>
      {open ? (
        <Animated.View style={[s.languageMenu, dropdownStyle, { pointerEvents: 'box-none' }]}>
          {options.map((option) => {
            const active = language === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  setLanguage(option.value);
                  setOpen(false);
                }}
                style={[s.languageMenuItem, active ? s.languageMenuItemActive : null]}
              >
                <Text style={[s.languageMenuMark, active ? s.languageMenuMarkActive : null]}>
                  {option.mark}
                </Text>
                <Text style={[s.languageMenuText, active ? s.languageMenuTextActive : null]}>
                  {option.title}
                </Text>
              </Pressable>
            );
          })}
        </Animated.View>
      ) : null}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
  prefix,
  error,
  onFocus,
  onSubmitEditing,
  actionLabel,
  onActionPress,
  actionDisabled,
  actionContent,
  inputRef,
  returnKeyType,
  blurOnSubmit,
  editable,
  onPressIn,
  maxLength,
  inputTestID,
  actionTestID,
  autoComplete,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  secureTextEntry?: boolean;
  prefix?: string;
  error?: string;
  onFocus?: (input: TextInput | null) => void;
  onSubmitEditing?: () => void;
  actionLabel?: string;
  onActionPress?: () => void;
  actionDisabled?: boolean;
  actionContent?: React.ReactNode;
  inputRef?: React.RefObject<TextInput | null>;
  returnKeyType?: 'done' | 'next';
  blurOnSubmit?: boolean;
  editable?: boolean;
  onPressIn?: () => void;
  maxLength?: number;
  inputTestID?: string;
  actionTestID?: string;
  autoComplete?: 'sms-otp' | 'one-time-code';
}) {
  const { tx, darkMode } = usePreferenceContext();
  const fieldInputRef = useRef<TextInput | null>(null);
  const hasAction = Boolean(actionLabel || actionContent);
  const isVerifyAction = Boolean(actionLabel) && !actionContent && (actionLabel === 'Verify' || actionLabel === tx('Verify') || actionTestID?.includes('phone-verify'));
  const hasInlineAction = hasAction && !isVerifyAction;
  const isWideAction = actionLabel === 'Current Address';
  const isHintMessage = Boolean(error?.startsWith('Dev OTP:'));
  return (
    <View style={s.group}>
      <Text style={[s.label, darkMode ? { color: '#94A3B8' } : null]}>{tx(label)}</Text>
      <View style={[s.shell, error ? (isHintMessage ? s.shellHint : s.shellError) : null, darkMode ? { backgroundColor: '#1E293B', borderColor: '#334155' } : null]}>
        {prefix ? (
          <View style={s.prefixWrap}>
            <Text style={[s.prefix, darkMode ? { color: '#94A3B8' } : null]}>{prefix}</Text>
          </View>
        ) : null}
        <View style={[s.inputWrap, hasInlineAction ? s.inputWrapWithAction : null]}>
          <TextInput
            ref={(node) => {
              fieldInputRef.current = node;
              if (inputRef) inputRef.current = node;
            }}
            testID={inputTestID}
            style={[
              s.input,
              hasInlineAction ? s.inputWithAction : null,
              isWideAction ? s.inputWithWideAction : null,
              darkMode ? { color: '#F1F5F9' } : null,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={tx(placeholder)}
            placeholderTextColor={darkMode ? '#475569' : '#90A0BB'}
            keyboardType={keyboardType ?? 'default'}
            secureTextEntry={secureTextEntry}
            autoCapitalize="none"
            autoCorrect={false}
            onFocus={() => onFocus?.(fieldInputRef.current)}
            onSubmitEditing={onSubmitEditing}
            returnKeyType={returnKeyType ?? 'done'}
            blurOnSubmit={blurOnSubmit ?? returnKeyType !== 'next'}
            editable={editable ?? true}
            onPressIn={onPressIn}
            maxLength={maxLength}
            autoComplete={autoComplete}
          />
        </View>
        {hasInlineAction ? (
          <Pressable
            onPress={onActionPress}
            disabled={actionDisabled}
            testID={actionTestID}
            style={[
              s.fieldAction,
              actionLabel === 'Current Address' ? s.fieldActionWide : null,
              actionContent ? s.fieldActionIcon : null,
              actionDisabled ? s.fieldActionDisabled : null,
            ]}
          >
            {actionContent ?? (
              <Text style={[s.fieldActionText, actionDisabled ? s.fieldActionTextDisabled : null]}>
                {actionLabel ? tx(actionLabel) : ''}
              </Text>
            )}
          </Pressable>
        ) : null}
      </View>
      {isVerifyAction ? (
        <Pressable
          onPress={onActionPress}
          disabled={actionDisabled}
          testID={actionTestID}
          style={[s.verifyActionBelow, actionDisabled ? s.verifyActionBelowDisabled : null]}
        >
          <Text style={[s.verifyActionBelowText, actionDisabled ? s.fieldActionTextDisabled : null]}>
            {actionLabel ? tx(actionLabel) : ''}
          </Text>
        </Pressable>
      ) : null}
      {error ? <Info text={error} kind={isHintMessage ? 'hint' : 'error'} /> : null}
    </View>
  );
}

function Button({
  label,
  onPress,
  disabled,
  secondary,
  colors,
  shadowColor,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  secondary?: boolean;
  colors?: [string, string];
  shadowColor?: string;
  testID?: string;
}) {
  const { tx, theme } = usePreferenceContext();
  const rolePrimaryColors: [string, string] =
    theme.role === 'dealer'
      ? ['#173E80', '#355C95']
      : theme.role === 'counterboy'
        ? ['#8B3C2A', '#6F4E37']
        : [C.warmB, C.warmA];
  const rolePrimaryShadow =
    theme.role === 'dealer' ? '#173E80' : theme.role === 'counterboy' ? '#8B3C2A' : '#F97316';
  const shadowStyle = disabled
    ? clearShadow()
    : createShadow({
        color: shadowColor ?? (secondary ? '#0EA5E9' : rolePrimaryShadow),
        offsetY: 8,
        blur: 16,
        opacity: secondary ? 0.14 : 0.18,
        elevation: 4,
      });

  return (
    <Pressable onPress={onPress} disabled={disabled} style={s.btnOuter} testID={testID}>
      <LinearGradient
        colors={
          disabled
            ? ['#D0D8E4', '#D0D8E4']
            : colors
              ? colors
              : secondary
                ? [C.accentA, C.accentB]
                : rolePrimaryColors
        }
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[s.btn, secondary ? s.btnSecondary : null, shadowStyle]}
      >
        <Text style={[s.btnText, secondary ? s.btnTextSecondary : null]}>{tx(label)}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function Tabs({
  mode,
  role,
  onChange,
}: {
  mode: AuthMode;
  role: UserRole;
  onChange: (mode: AuthMode) => void;
}) {
  const { tx } = usePreferenceContext();
  return (
    <View style={s.tabs}>
      {(['login', 'signup'] as AuthMode[]).map((item) => (
        <Pressable
          key={item}
          style={[
            s.tab,
            mode === item
              ? role === 'electrician'
                ? s.tabElectricianActive
                : role === 'counterboy'
                  ? s.tabCounterboyActive
                  : s.tabDealerActive
              : null,
          ]}
          onPress={() => onChange(item)}
        >
          <Text style={[s.tabText, mode === item ? s.tabTextActive : null]}>
            {item === 'login' ? tx('Login') : tx('Create Account')}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function RoleCard({
  role,
  selected,
  onPress,
  compact,
  testID,
}: {
  role: UserRole;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
  testID?: string;
}) {
  const { tx } = usePreferenceContext();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={[
        s.roleCard,
        compact ? s.roleCardCompact : null,
        role === 'electrician' ? s.roleCardElectrician : s.roleCardDealer,
        selected
          ? role === 'electrician'
            ? s.roleCardElectricianActive
            : s.roleCardDealerActive
          : null,
      ]}
    >
      <Text
        style={[
          s.roleTitle,
          compact ? s.roleTitleCompact : null,
          selected ? s.roleTitleActive : s.roleTitleDefault,
        ]}
      >
        {tx(roleMeta[role].title)}
      </Text>
      <Text
        style={[
          s.roleSubtitle,
          compact ? s.roleSubtitleCompact : null,
          selected ? s.roleSubtitleActive : s.roleSubtitleDefault,
        ]}
      >
        {tx(roleMeta[role].subtitle)}
      </Text>
    </Pressable>
  );
}

export function OnboardingScreen({
  onGetStarted,
  fixedRole,
  initialMode = 'login',
  initialPhase,
  onCancel,
}: {
  onGetStarted: (role: UserRole) => void;
  fixedRole?: UserRole;
  initialMode?: AuthMode;
  initialPhase?: IntroStep;
  onCancel?: () => void;
}): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const initialHeightRef = useRef(height);
  const { language, setLanguage, tx, darkMode } = usePreferenceContext();
  const reveal = useReveal();
  const { scrollRef, onInputFocus: scrollToForm, onScroll: trackScroll, onViewportLayout, onContentSizeChange, keyboardInset } = useKeyboardReveal();
  const loginPhoneRef = useRef<TextInput | null>(null);
  const loginOtpRef = useRef<TextInput | null>(null);
  const signupDealerRef = useRef<TextInput | null>(null);
  const signupEmailRef = useRef<TextInput | null>(null);
  const signupPhoneRef = useRef<TextInput | null>(null);
  const signupOtpRef = useRef<TextInput | null>(null);
  const signupAddressRef = useRef<TextInput | null>(null);
  const signupStateRef = useRef<TextInput | null>(null);
  const signupCityRef = useRef<TextInput | null>(null);
  const signupPincodeRef = useRef<TextInput | null>(null);
  const signupGstNumberRef = useRef<TextInput | null>(null);
  const signupPanNumberRef = useRef<TextInput | null>(null);
  const signupGstHolderRef = useRef<TextInput | null>(null);
  const signupPanHolderRef = useRef<TextInput | null>(null);
  const electricianPhoneAutoRequestedRef = useRef(false);
  const electricianAddressAutoRequestedRef = useRef(false);
  const locationRequestInFlightRef = useRef(false);
  const retryLocationOnResumeRef = useRef(false);
  const addressDirtyRef = useRef(false);
  const stateDirtyRef = useRef(false);
  const cityDirtyRef = useRef(false);
  const pincodeDirtyRef = useRef(false);
  const resolvedInitialPhase = initialPhase ?? (fixedRole ? 'auth' : 'language');
  const [phase, setPhase] = useState<IntroStep>(resolvedInitialPhase);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<UserRole>(fixedRole ?? 'electrician');
  const directAuthEntry = Boolean(fixedRole && resolvedInitialPhase === 'auth');
  const [authSelectionOpen, setAuthSelectionOpen] = useState(resolvedInitialPhase === 'auth');
  const [loading, setLoading] = useState(false);
  const otpVerificationInFlightRef = useRef(false);
  const dealerVerificationRequestRef = useRef(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginStep, setLoginStep] = useState<LoginStep>('phone');
  const [loginOtpVerified, setLoginOtpVerified] = useState(false);
  const [loginOtpCountdown, setLoginOtpCountdown] = useState(0);

  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupDealerPhone, setSignupDealerPhone] = useState('');
  const [signupAddress, setSignupAddress] = useState('');
  const [signupState, setSignupState] = useState('');
  const [signupCity, setSignupCity] = useState('');
  const [signupPincode, setSignupPincode] = useState('');
  const [signupGstNumber, setSignupGstNumber] = useState('');
  const [signupGstHolderName, setSignupGstHolderName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupOtp, setSignupOtp] = useState('');
  const [signupOtpSent, setSignupOtpSent] = useState(false);
  const [signupOtpVerified, setSignupOtpVerified] = useState(false);
  const [signupVerificationToken, setSignupVerificationToken] = useState('');
  const [signupOtpCountdown, setSignupOtpCountdown] = useState(0);
  const [signupReferralCode, setSignupReferralCode] = useState('');
  const [signupTermsAgreed, setSignupTermsAgreed] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>('name');
  const [dealerVerified, setDealerVerified] = useState(false);
  const [dealerChecking, setDealerChecking] = useState(false);
  const [verifiedDealerName, setVerifiedDealerName] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const smsOtpTargetRef = useRef<'login' | 'signup' | null>(null);
  const startSmsOtpAutofill = useSmsOtpAutofill((code) => {
    if (smsOtpTargetRef.current === 'login') setLoginOtp(code);
    if (smsOtpTargetRef.current === 'signup') setSignupOtp(code);
  });

  useEffect(() => {
    const captureReferral = (url?: string | null) => {
      const match = String(url ?? '').match(/[?&]ref=([^&#]+)/i);
      if (!match?.[1]) return;
      try { setSignupReferralCode(decodeURIComponent(match[1]).trim().toUpperCase()); } catch { /* ignore malformed link */ }
    };
    void Linking.getInitialURL().then(captureReferral);
    const subscription = Linking.addEventListener('url', event => captureReferral(event.url));
    return () => subscription.remove();
  }, []);
  const isCompactPhone = width <= 360 || initialHeightRef.current <= 760;
  const authBackgroundColors: [string, string, string] = darkMode
    ? role === 'dealer'
      ? ['#0B1220', '#111827', '#0F172A']
      : role === 'counterboy'
        ? ['#120A07', '#1A0F0A', '#0F0806']
        : ['#0B1220', '#0F172A', '#111827']
    : role === 'dealer'
      ? ['#E8F1FF', '#F4F8FF', '#EAF3FF']
      : role === 'counterboy'
        ? ['#F9F4ED', '#F5EDE4', '#F0DFD0']
        : ['#E5EEFF', '#F4F8FF', '#EAF2FF'];

  const screenTitle =
    phase === 'language'
      ? tx('Choose your language')
      : phase === 'role'
        ? tx('Choose your role')
        : tx(roleMeta[role].title);
  const screenSubtitle =
    phase === 'language'
      ? tx('Pick your preferred language first, then continue to the onboarding screen.')
      : phase === 'role'
        ? tx('Choose your role to start the onboarding journey.')
        : '';

  useEffect(() => {
    if (!fixedRole) {
      return;
    }
    setRole(fixedRole);
  }, [fixedRole]);

  const setError = useCallback(
    (key: string, value?: string) =>
      setErrors((current) => {
        if (!value) {
          const next = { ...current };
          delete next[key];
          return next;
        }
        return { ...current, [key]: value };
      }),
    []
  );

  const requestCurrentLocation = useCallback(async () => {
    if (locationRequestInFlightRef.current) return;
    locationRequestInFlightRef.current = true;
    setLocationLoading(true);
    setLocationMessage('');
    setError('signupAddress');
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError('signupAddress', 'Allow location access to fill your address, or enter it manually.');
        if (!permission.canAskAgain) {
          Alert.alert(
            tx('Location permission needed'),
            tx('Allow location access in app settings to fill your address automatically.'),
            [
              { text: tx('Cancel'), style: 'cancel' },
              {
                text: tx('Open Settings'),
                onPress: () => {
                  retryLocationOnResumeRef.current = true;
                  void Linking.openSettings().catch(() => {
                    retryLocationOnResumeRef.current = false;
                  });
                },
              },
            ]
          );
        }
        return;
      }

      if (!(await Location.hasServicesEnabledAsync())) {
        if (Platform.OS === 'android') {
          try {
            await Location.enableNetworkProviderAsync();
          } catch {
            // The device prompt can be dismissed; offer its settings page below.
          }
        }
        if (!(await Location.hasServicesEnabledAsync())) {
          setError('signupAddress', 'Turn on device location to fill your address, or enter it manually.');
          Alert.alert(
            tx('Turn on location'),
            tx('Open device location settings to fill your address automatically.'),
            [
              { text: tx('Cancel'), style: 'cancel' },
              {
                text: tx('Open Settings'),
                onPress: () => {
                  retryLocationOnResumeRef.current = true;
                  if (Platform.OS === 'android') {
                    void Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS').catch(() => {
                      retryLocationOnResumeRef.current = false;
                    });
                  } else {
                    void Linking.openSettings().catch(() => {
                      retryLocationOnResumeRef.current = false;
                    });
                  }
                },
              },
            ]
          );
          return;
        }
      }

      const position = (await Location.getLastKnownPositionAsync({
        maxAge: 10 * 60 * 1000,
        requiredAccuracy: 500,
      })) ?? (await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true,
      }));
      const [place] = await Location.reverseGeocodeAsync(position.coords);
      if (!place) {
        setError('signupAddress', 'Could not find your address. Please enter it manually.');
        return;
      }

      const address = place.formattedAddress || [
        place.name,
        place.streetNumber,
        place.street,
        place.district,
        place.city,
        place.region,
        place.postalCode,
      ].filter(Boolean).join(', ');
      const state = place.region || '';
      const district = place.district || place.subregion || place.city || '';
      const pincode = (place.postalCode || '').replace(/\D/g, '').slice(0, 6);
      if (!address && !state && !district && !pincode) {
        setError('signupAddress', 'Could not find your address. Please enter it manually.');
        return;
      }

      if (address && !addressDirtyRef.current) setSignupAddress(address);
      if (state && !stateDirtyRef.current) setSignupState(state);
      if (district && !cityDirtyRef.current) setSignupCity(district);
      if (pincode && !pincodeDirtyRef.current) setSignupPincode(pincode);
      setLocationMessage('Address fetched. Please check the details before continuing.');
    } catch {
      setError('signupAddress', 'Could not fetch your location. Please enter the details manually.');
    } finally {
      locationRequestInFlightRef.current = false;
      setLocationLoading(false);
    }
  }, [setError, tx]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active' || !retryLocationOnResumeRef.current) return;
      retryLocationOnResumeRef.current = false;
      void requestCurrentLocation();
    });
    return () => subscription.remove();
  }, [requestCurrentLocation]);

  useEffect(() => {
    if (
      mode !== 'signup' ||
      role !== 'electrician' ||
      signupStep !== 'address' ||
      electricianAddressAutoRequestedRef.current
    ) return;
    electricianAddressAutoRequestedRef.current = true;
    void requestCurrentLocation();
  }, [mode, requestCurrentLocation, role, signupStep]);

  useEffect(() => {
    if (loginStep === 'otp') {
      const timer = setTimeout(() => loginOtpRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [loginStep]);

  useEffect(() => {
    if (!signupOtpSent || signupOtpVerified) return;
    const shouldFocusOtp =
      (role === 'dealer' && signupStep === 'holders') ||
      (role === 'electrician' && signupStep === 'otp');
    if (!shouldFocusOtp) return;
    const timer = setTimeout(() => signupOtpRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, [role, signupOtpSent, signupOtpVerified, signupStep]);

  useEffect(() => {
    if (
      mode !== 'signup' ||
      role !== 'electrician' ||
      signupStep !== 'phone' ||
      electricianPhoneAutoRequestedRef.current
    ) {
      return;
    }
    if (signupPhone.length !== 10) {
      electricianPhoneAutoRequestedRef.current = false;
      return;
    }

    electricianPhoneAutoRequestedRef.current = true;
  }, [mode, role, signupPhone, signupStep]);



  useEffect(() => {
    if (loginOtpCountdown <= 0) return;
    const timer = setInterval(() => {
      setLoginOtpCountdown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loginOtpCountdown]);

  useEffect(() => {
    if (signupOtpCountdown <= 0) return;
    const timer = setInterval(() => {
      setSignupOtpCountdown((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [signupOtpCountdown]);

  const handleName = (setter: (value: string) => void) => (value: string) =>
    setter(value.replace(/[^A-Za-z ]/g, ''));
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    [
      loginPhoneRef,
      loginOtpRef,
      signupDealerRef,
      signupEmailRef,
      signupPhoneRef,
      signupOtpRef,
      signupAddressRef,
      signupStateRef,
      signupCityRef,
      signupPincodeRef,
      signupGstNumberRef,
      signupPanNumberRef,
      signupGstHolderRef,
      signupPanHolderRef,
    ].forEach((ref) => ref.current?.blur());
  }, []);

  useEffect(() => {
    if (loginOtpVerified || signupOtpVerified) dismissKeyboard();
  }, [loginOtpVerified, signupOtpVerified, dismissKeyboard]);

  const resetForm = () => {
    dealerVerificationRequestRef.current += 1;
    electricianPhoneAutoRequestedRef.current = false;
    electricianAddressAutoRequestedRef.current = false;
    retryLocationOnResumeRef.current = false;
    addressDirtyRef.current = false;
    stateDirtyRef.current = false;
    cityDirtyRef.current = false;
    pincodeDirtyRef.current = false;
    setErrors({});
    setLocationMessage('');
    setLoading(false);
    setAuthSelectionOpen(false);
    setLoginPhone('');
    setLoginOtp('');
    setLoginStep('phone');
    setLoginOtpVerified(false);
    setSignupName('');
    setSignupEmail('');
    setSignupDealerPhone('');
    setSignupAddress('');
    setSignupState('');
    setSignupCity('');
    setSignupPincode('');
    setSignupGstNumber('');
    setSignupGstHolderName('');
    setSignupPhone('');
    setSignupOtp('');
    setSignupOtpSent(false);
    setSignupOtpVerified(false);
    setSignupVerificationToken('');
    setSignupStep('name');
    setDealerVerified(false);
    setDealerChecking(false);
    setVerifiedDealerName('');
  };

  const handlePhone = (setter: (value: string) => void) => (value: string) =>
    setter(value.replace(/\D/g, '').slice(0, 10));
  const handleOtp = (setter: (value: string) => void) => (value: string) =>
    setter(value.replace(/\D/g, '').slice(0, 4));
  const handleSignupEmail = (value: string) => {
    setSignupEmail(value);
    setError(
      'signupEmail',
      value && !isValidOptionalEmail(value)
        ? 'Please enter a valid email address without spaces, like name@example.com.'
        : undefined
    );
  };
  const handleSignupPhone = (value: string) => {
    const nextPhone = value.replace(/\D/g, '').slice(0, 10);
    setSignupPhone(nextPhone);
    setSignupOtp('');
    setSignupOtpSent(false);
    setSignupOtpVerified(false);
    setSignupVerificationToken('');
    setError('signupPhone');
    setError('signupOtp');
  };
  const previousDealerSignupStep = (step: SignupStep): SignupStep | null => {
    switch (step) {
      case 'location':
        return 'name';
      case 'identity':
        return 'location';
      case 'holders':
        return 'identity';
      case 'consent':
        return 'holders';
      default:
        return null;
    }
  };
  const goToPreviousDealerSignupStep = () => {
    const previousStep = previousDealerSignupStep(signupStep);
    if (!previousStep) return;
    dismissKeyboard();
    if (signupStep === 'consent') {
      setSignupOtp('');
      setSignupOtpSent(false);
      setSignupOtpVerified(false);
      setSignupVerificationToken('');
    }
    setSignupStep(previousStep);
  };
  const previousElectricianSignupStep = (step: SignupStep): SignupStep | null => {
    switch (step) {
      case 'phone':
        return 'name';
      case 'otp':
        return 'phone';
      case 'address':
        return 'phone';
      case 'dealer':
        return 'address';
      default:
        return null;
    }
  };
  const goToPreviousElectricianSignupStep = () => {
    const previousStep = previousElectricianSignupStep(signupStep);
    if (!previousStep) return;
    dismissKeyboard();
    if (signupStep === 'address') {
      setSignupOtp('');
      setSignupOtpSent(false);
      setSignupOtpVerified(false);
      setSignupVerificationToken('');
    }
    setSignupStep(previousStep);
  };
  const canContinue = useMemo(() => {
    if (mode === 'login') return loginPhone.length === 10 && loginOtpVerified;
    const detailsReady = signupName.trim().length >= 3 && signupState.trim().length >= 2 &&
      signupCity.trim().length >= 2 && signupPincode.trim().length === 6 &&
      signupPhone.length === 10 && signupOtpVerified && signupTermsAgreed;
    return role === 'electrician' ? detailsReady && dealerVerified : detailsReady;
  }, [mode, role, loginPhone, loginOtpVerified, signupName, signupState, signupCity,
    signupPincode, signupPhone, signupOtpVerified, signupTermsAgreed, dealerVerified]);
  const dealerSignupContent =
    role === 'dealer' ? (dealerSignupMeta[signupStep] ?? dealerSignupMeta.name) : null;

  const submitAuth = async () => {
    dismissKeyboard();
    if (mode === 'login' && !loginOtpVerified)
      return setError('loginOtp', 'Please enter the OTP to log in.');
    if (mode === 'signup' && role === 'dealer') {
      if (signupPhone.length !== 10)
        return setError('signupPhone', 'Please enter a valid 10-digit mobile number.');
      if (!signupOtpVerified)
        return setError('signupOtp', 'Please verify the OTP before creating your account.');
      setError('signupPhone');
      setError('signupOtp');
    }
    setLoading(true);

    const finishLogin = (resolvedUser?: unknown) => {
      if (resolvedUser) (globalThis as any).__srvLoginUser = resolvedUser;
      onGetStarted(role);
    };

    try {
      if (mode === 'login') {
        finishLogin((globalThis as any).__srvLoginUser);
        return;
      }

      if (role === 'dealer') {
        const res = await authApi.registerDealer({
          name: signupName.trim(), phone: signupPhone,
          email: sanitizeEmailInput(signupEmail).trim() || undefined,
          town: signupCity.trim(), district: signupCity.trim(), state: signupState.trim(),
          address: `${signupCity.trim()}, ${signupState.trim()}`,
          pincode: signupPincode.trim() || undefined,
          gstNumber: normalizeGstOrPanNumber(signupGstNumber) || undefined,
          signupVerificationToken, referralCode: signupReferralCode.trim() || undefined,
        });
        finishLogin(res.user);
        return;
      }

      if (role === 'counterboy' || role === 'user') {
        const payload = {
          name: signupName.trim(), phone: signupPhone,
          email: sanitizeEmailInput(signupEmail).trim() || undefined,
          city: signupCity.trim() || undefined, district: signupCity.trim() || undefined,
          state: signupState.trim() || undefined, address: undefined,
          pincode: signupPincode.trim() || undefined,
          signupVerificationToken, referralCode: signupReferralCode.trim() || undefined,
        };
        const res = role === 'counterboy'
          ? await authApi.registerCounterBoy(payload)
          : await authApi.registerUser(payload);
        finishLogin(res.user);
        return;
      }

      const res = await authApi.registerElectrician({
        name: signupName.trim(), phone: signupPhone,
        email: sanitizeEmailInput(signupEmail).trim() || undefined,
        city: signupCity.trim(), district: signupCity.trim(), state: signupState.trim(),
        address: signupAddress.trim() || undefined,
        pincode: signupPincode.trim() || undefined,
        dealerPhone: signupDealerPhone,
        signupVerificationToken, referralCode: signupReferralCode.trim() || undefined,
      });
      finishLogin(res.user);
    } catch (err: any) {
      const message = err?.message || tx('Something went wrong. Please try again.');
      if (mode === 'login') {
        setError('loginOtp', message);
      } else if (message.toLowerCase().includes('otp')) {
        setError('signupOtp', message);
      } else if (role === 'electrician' && message.toLowerCase().includes('dealer')) {
        setError('signupDealerPhone', message);
      } else {
        setError('signupPhone', message);
      }
      if (mode === 'signup') {
        Alert.alert(tx('Could not create account'), message);
      }
    } finally {
      setLoading(false);
    }
  };

  const continueLoginPhone = () => {
    dismissKeyboard();
    if (loginPhone.length !== 10)
      return setError('loginPhone', 'Please enter a valid 10-digit mobile number.');
    setError('loginPhone');

    const doSendOtp = (userRole: UserRole) => {
      setLoading(true);
      smsOtpTargetRef.current = 'login';
      void startSmsOtpAutofill().then(() => authApi.sendOtp(loginPhone, userRole))
        .then((res) => {
          setLoginOtpCountdown(50);
          if (res.devOtp) setLoginOtp(res.devOtp.replace(/\D/g, '').slice(0, 4));
          setLoginStep('otp');
          // Show dev OTP hint if returned
          if (res.devOtp) {
            setError('loginPhone', `Dev OTP: ${res.devOtp}`);
          }
        })
        .catch((err: Error) => {
          const msg = err.message || '';
          setError('loginPhone', msg || 'Could not send OTP. Please try again.');
        })
        .finally(() => setLoading(false));
    };

    setLoginOtp('');
    setLoginOtpVerified(false);
    doSendOtp(role);
  };

  const verifyLoginOtp = useCallback(() => {
    dismissKeyboard();
    if (otpVerificationInFlightRef.current) return;
    if (loginOtp.length !== 4) return setError('loginOtp', 'Enter the 4-digit OTP to continue.');
    setError('loginOtp');
    otpVerificationInFlightRef.current = true;
    setLoading(true);
    authApi.verifyOtp(loginPhone, role, loginOtp)
      .then((res) => {
        setLoginOtpVerified(true);
        (globalThis as any).__srvLoginUser = res.user;
        onGetStarted(role);
      })
      .catch((err: Error) => {
        setError('loginOtp', err.message || 'Invalid OTP. Please try again.');
        setLoginOtp('');
      })
      .finally(() => {
        otpVerificationInFlightRef.current = false;
        setLoading(false);
      });
  }, [dismissKeyboard, loginOtp, loginPhone, role, setError, onGetStarted]);

  const verifyDealer = (phone = signupDealerPhone) => {
    dismissKeyboard();
    if (phone.length !== 10)
      return setError('signupDealerPhone', 'Enter a valid 10-digit dealer number.');
    if (role === 'electrician' && signupPhone === phone) {
      return setError(
        'signupDealerPhone',
        tx('Dealer number cannot be same as your phone number. Please enter a different dealer number.')
      );
    }
    const requestId = ++dealerVerificationRequestRef.current;
    setError('signupDealerPhone');
    setDealerChecking(true);
    dealerApi.getByPhone(phone)
      .then((dealer) => {
        if (requestId !== dealerVerificationRequestRef.current) return;
        const resolvedDealerName =
          dealer.businessName?.trim() ||
          dealer.contactPerson?.trim() ||
          dealer.name?.trim() ||
          '';
        setDealerVerified(true);
        setVerifiedDealerName(resolvedDealerName);
        if (role === 'electrician') setSignupTermsAgreed(true);
      })
      .catch((err: Error) => {
        if (requestId !== dealerVerificationRequestRef.current) return;
        const message = (err.message || '').toLowerCase();
        if (message.includes('not found') || message.includes('not registered')) {
          setDealerVerified(true);
          setVerifiedDealerName('SRV Dealer');
          if (role === 'electrician') setSignupTermsAgreed(true);
          setError('signupDealerPhone');
          return;
        }
        setError('signupDealerPhone', err.message || 'Unable to verify dealer. Please try again.');
      })
      .finally(() => {
        if (requestId === dealerVerificationRequestRef.current) setDealerChecking(false);
      });
  };

  const sendSignupOtp = () => {
    dismissKeyboard();
    if (signupPhone.length !== 10)
      return setError('signupPhone', 'Please enter a valid 10-digit mobile number.');
    setError('signupPhone');
    setError('signupOtp');
    setSignupOtp('');
    setSignupOtpVerified(false);
    setSignupVerificationToken('');
    setLoading(true);
    smsOtpTargetRef.current = 'signup';
    void startSmsOtpAutofill().then(() => authApi.sendSignupOtp(signupPhone, role))
      .then((res) => {
        setSignupOtpSent(true);
        setSignupOtpCountdown(50);
        if (res.devOtp) setSignupOtp(res.devOtp.replace(/\D/g, '').slice(0, 4));
        if (res.devOtp) {
          setError('signupPhone', `Dev OTP: ${res.devOtp}`);
        }
        if (role !== 'dealer') setSignupStep('otp');
      })
      .catch((err: Error) => {
        setError('signupPhone', err.message || 'Could not send OTP. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  const verifySignupOtp = useCallback(() => {
    dismissKeyboard();
    if (otpVerificationInFlightRef.current) return;
    if (!signupOtpSent) return setError('signupOtp', 'Please verify your mobile number first.');
    if (signupOtp.length !== 4)
      return setError('signupOtp', 'Enter the 4-digit OTP to verify your number.');
    setError('signupOtp');
    otpVerificationInFlightRef.current = true;
    setLoading(true);
    authApi
      .verifySignupOtp(signupPhone, role, signupOtp)
      .then((result) => {
        setSignupVerificationToken(result.signupVerificationToken);
        setSignupOtpVerified(true);
        setSignupStep(role === 'dealer' ? 'consent' : 'address');
      })
      .catch((err: Error) => {
        setError('signupOtp', err.message || 'Invalid OTP. Please try again.');
        setSignupOtp('');
      })
      .finally(() => {
        otpVerificationInFlightRef.current = false;
        setLoading(false);
      });
  }, [dismissKeyboard, signupOtpSent, signupOtp, signupPhone, role, setError]);

  const continueSignup = () => {
    dismissKeyboard();
    if (role === 'dealer') {
      if (signupStep === 'name') {
        if (signupName.trim().length < 3)
          return setError('signupName', 'Please fill the full name field.');
        if (signupEmail.trim() && !isValidOptionalEmail(signupEmail))
          return setError(
            'signupEmail',
            'Please enter a valid email address without spaces, like name@example.com.'
          );
        setError('signupName');
        setError('signupEmail');
        setSignupStep('location');
        return;
      }

      if (signupStep === 'location') {
        if (signupState.trim().length < 2) return setError('signupState', 'Please enter state.');
        if (signupCity.trim().length < 2) return setError('signupCity', 'Please enter district.');
        if (signupPincode.trim().length !== 6)
          return setError('signupPincode', 'Please enter a valid 6-digit pincode.');
        setError('signupState');
        setError('signupCity');
        setError('signupPincode');
        setSignupStep('identity');
        return;
      }

      if (signupStep === 'identity') {
        if (!signupGstNumber.trim())
          return setError('signupGstNumber', 'Please enter GST/PAN number or tap Skip for Now.');
        if (!signupGstHolderName.trim())
          return setError('signupGstHolderName', 'Please enter shop/business name or tap Skip for Now.');
        if (!isValidOptionalGstOrPanNumber(signupGstNumber))
          return setError('signupGstNumber', 'Please enter a valid GSTIN or PAN number in the proper format.');
        setError('signupGstNumber');
        setError('signupGstHolderName');
        setSignupStep('holders');
        return;
      }

      if (signupStep === 'holders') {
        if (!signupOtpSent) {
          sendSignupOtp();
          return;
        }
        if (!signupOtpVerified) return;
        setSignupStep('consent');
      }
      return;
    }

    if (signupStep === 'name') {
      if (signupName.trim().length < 3)
        return setError('signupName', 'Please fill the name field.');
      setError('signupName');
      setSignupStep('phone');
      return;
    }
    if (signupStep === 'phone') {
      if (signupPhone.length !== 10)
        return setError('signupPhone', 'Please enter a valid 10-digit mobile number.');
      setError('signupPhone');
      sendSignupOtp();
      return;
    }
    if (signupStep === 'address') {
      if (signupState.trim().length < 2) return setError('signupState', 'Please enter state.');
      if (signupCity.trim().length < 2) return setError('signupCity', 'Please enter district.');
      if (signupPincode.trim().length !== 6)
        return setError('signupPincode', 'Please enter a valid 6-digit pincode.');
      setError('signupState');
      setError('signupCity');
      setError('signupPincode');
      setSignupStep(role === 'electrician' ? 'dealer' : 'consent');
      return;
    }
    if (signupStep === 'dealer') {
      if (!dealerVerified)
        return setError('signupDealerPhone', 'Please verify the dealer number before continuing.');
      setError('signupDealerPhone');
      if (role === 'electrician') {
        if (!signupTermsAgreed)
          return setError('terms', 'Please agree to the Terms & Conditions and Privacy Policy.');
        setError('terms');
        void submitAuth();
      } else {
        setSignupStep('consent');
      }
      return;
    }
  };

  useEffect(() => {
    if (mode === 'login' && loginStep === 'otp' && !loginOtpVerified && loginOtp.length === 4) verifyLoginOtp();
  }, [mode, loginStep, loginOtp, loginOtpVerified, verifyLoginOtp]);

  useEffect(() => {
    if (mode === 'signup' && signupOtpSent && !signupOtpVerified && signupOtp.length === 4 &&
        (signupStep === 'otp' || (role === 'dealer' && signupStep === 'holders'))) verifySignupOtp();
  }, [mode, role, signupStep, signupOtpSent, signupOtpVerified, signupOtp, verifySignupOtp]);

  const skipIdentityStep = () => {
    setError('signupGstNumber');
    setError('signupGstHolderName');
    setSignupStep('holders');
  };

  return (
    <View style={[s.root, darkMode ? { backgroundColor: '#0B1220' } : null]}>
      <StatusBar hidden />
      <LinearGradient
        colors={phase === 'auth' ? authBackgroundColors : darkMode ? ['#0B1220', '#0F172A', '#111827'] : [C.heroA, C.heroB, C.heroC]}
        style={s.bg}
      >
        {phase === 'auth' ? (
          <>
            <View
              style={[
                s.authGlow,
                role === 'electrician'
                  ? s.authGlowElectricianTop
                  : role === 'counterboy'
                    ? s.authGlowCounterboyTop
                    : s.authGlowDealerTop,
              ]}
            />
            <View
              style={[
                s.authGlow,
                role === 'electrician'
                  ? s.authGlowElectricianBottom
                  : role === 'counterboy'
                    ? s.authGlowCounterboyBottom
                    : s.authGlowDealerBottom,
              ]}
            />
          </>
        ) : (
          <>
            <View style={s.glow1} />
            <View style={s.glow2} />
            <View style={s.glow3} />
          </>
        )}
        <KeyboardAvoidingView
          style={s.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.dismissSurface}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={[
                s.content,
                {
                  paddingTop: insets.top + (phase === 'auth' ? 6 : 18),
                  paddingBottom: insets.bottom + (phase === 'auth' ? 72 + keyboardInset : 40),
                },
                phase !== 'auth' ? s.contentRole : null,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              scrollEnabled={true}
              bounces={false}
              overScrollMode="never"
              onScroll={trackScroll}
              onLayout={onViewportLayout}
              onContentSizeChange={onContentSizeChange}
              scrollEventThrottle={16}
            >
              <Animated.View style={[reveal, phase !== 'auth' ? s.revealRole : null]}>
                <View
                  style={[
                    s.topRow,
                    isCompactPhone ? s.topRowCompact : null,
                    phase === 'auth' ? s.topRowAuth : null,
                  ]}
                >
                  <View style={[s.brandRow, s.brandRowCentered]}>
                    <View style={[s.logoWrap, isCompactPhone ? s.logoWrapCompact : null, phase === 'auth' ? s.logoWrapAuth : null]}>
                      <Image
                        source={SRV_LOGO}
                        style={s.logo}
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                  {phase !== 'language' ? (
                    <Pressable
                      onPress={() => {
                        dismissKeyboard();
                        if (phase === 'auth') {
                          if (fixedRole && onCancel) {
                            resetForm();
                            setMode(initialMode);
                            setPhase('auth');
                            setAuthSelectionOpen(true);
                            onCancel();
                            return;
                          }
                          resetForm();
                          setPhase('role');
                          return;
                        }
                        setPhase('language');
                      }}
                      style={s.backRight}
                    >
                      <BackArrowIcon />
                    </Pressable>
                  ) : null}
                </View>
                <View
                  style={[
                    s.welcomeRow,
                    s.welcomeRowCentered,
                    phase === 'auth' ? s.welcomeRowAuth : null,
                  ]}
                >
                  <View style={s.welcomeBadge}>
                    <LinearGradient
                      colors={
                        phase === 'auth'
                          ? role === 'dealer'
                            ? ['#EAF3FF', '#F7FBFF']
                            : ['#E9EFFA', '#F7FAFF']
                          : ['rgba(14,165,233,0.12)', 'rgba(139,92,246,0.12)']
                      }
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={[
                        s.welcomeBadgeFill,
                        phase === 'auth'
                          ? role === 'dealer'
                            ? s.welcomeBadgeFillDealer
                            : s.welcomeBadgeFillElectrician
                          : null,
                      ]}
                    >
                      <Text style={s.eyebrow}>{tx('Welcome to SRV')}</Text>
                    </LinearGradient>
                  </View>
                  {phase !== 'language' && !fixedRole ? (
                    <View style={s.welcomeLanguageWrapFloating}>
                      <LanguageChooser />
                    </View>
                  ) : null}
                </View>
                <Text
                  style={[
                    s.bigTitle,
                    isCompactPhone ? s.bigTitleCompact : null,
                    phase === 'auth' ? s.bigTitleAuth : null,
                    phase === 'language' ? s.bigTitleLanguage : null,
                    phase === 'auth'
                      ? role === 'electrician'
                        ? s.bigTitleElectrician
                        : s.bigTitleDealer
                      : s.bigTitleNeutral,
                  ]}
                  numberOfLines={1}
                >
                  {screenTitle}
                </Text>
                <Text
                  style={[
                    s.subtext,
                    isCompactPhone ? s.subtextCompact : null,
                    phase === 'auth' ? s.subtextAuth : null,
                  ]}
                >
                  {screenSubtitle}
                </Text>
                {phase === 'language' ? (
                  <View
                    style={[s.card, s.languageCard, isCompactPhone ? s.introCardCompact : null, darkMode ? { backgroundColor: '#111827', borderColor: '#243043' } : null]}
                  >
                    <Text style={[s.sectionEyebrow, darkMode ? { color: '#94A3B8' } : null]}>{tx('App Preferences')}</Text>
                    <Text style={[s.sectionTitle, darkMode ? { color: '#F1F5F9' } : null]}>{tx('CHOOSE YOUR LANGUAGE')}</Text>
                    <Text style={[s.sectionText, darkMode ? { color: '#94A3B8' } : null]}>
                      {tx('Use the same language across the complete SRV app experience.')}
                    </Text>
                    <View style={s.languageOptionList}>
                      {languageOptions.map((option) => {
                        const active = language === option.value;
                        return (
                          <Pressable
                            key={option.value}
                            onPress={() => setLanguage(option.value)}
                            style={[
                              s.languageOptionCard,
                              active ? s.languageOptionCardActive : null,
                            ]}
                          >
                            <View
                              style={[
                                s.languageOptionBadge,
                                active ? s.languageOptionBadgeActive : null,
                              ]}
                            >
                              <Text
                                style={[
                                  s.languageOptionBadgeText,
                                  active ? s.languageOptionBadgeTextActive : null,
                                ]}
                              >
                                {option.mark}
                              </Text>
                            </View>
                            <View style={s.languageOptionCopy}>
                              <Text
                                style={[
                                  s.languageOptionTitle,
                                  active ? s.languageOptionTitleActive : null,
                                ]}
                                numberOfLines={1}
                              >
                                {option.value === 'English'
                                  ? tx('English')
                                  : option.value === 'Hindi'
                                    ? tx('Hindi')
                                    : tx('Punjabi')}
                              </Text>
                              <Text
                                style={[
                                  s.languageOptionNative,
                                  active ? s.languageOptionNativeActive : null,
                                ]}
                                numberOfLines={1}
                              >
                                {option.nativeTitle}
                              </Text>
                              <Text style={s.languageOptionDescription} numberOfLines={1}>
                                {tx(option.description)}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>
                    <Button
                      label={tx('Continue')}
                      onPress={() => setPhase('role')}
                      disabled={false}
                      testID="onboarding-language-continue"
                      colors={['#2C6BE7', '#5DAAF8']}
                      shadowColor="#2C6BE7"
                    />
                  </View>
                ) : phase === 'role' && !fixedRole ? (
                  <View
                    style={[
                      s.card,
                      s.roleSetupCard,
                      isCompactPhone ? s.roleSetupCardCompact : null,
                    ]}
                  >
                    <Text style={[s.sectionEyebrow, darkMode ? { color: '#94A3B8' } : null]}>{tx('Account Setup')}</Text>
                    <Text style={[s.sectionTitle, darkMode ? { color: '#F1F5F9' } : null]}>{tx('CHOOSE YOUR ROLE')}</Text>
                    <Text style={[s.sectionText, darkMode ? { color: '#94A3B8' } : null]}>
                      {tx('This keeps rewards, verification and account setup perfectly aligned.')}
                    </Text>
                    <View style={[s.roleGrid, isCompactPhone ? s.roleGridCompact : null]}>
                      <RoleCard
                        role="electrician"
                        selected={role === 'electrician'}
                        onPress={() => setRole('electrician')}
                        testID="onboarding-role-electrician"
                        compact={isCompactPhone}
                      />
                      <RoleCard
                        role="dealer"
                        selected={role === 'dealer'}
                        onPress={() => setRole('dealer')}
                        testID="onboarding-role-dealer"
                        compact={isCompactPhone}
                      />
                    </View>
                    <Button
                      label={tx('Continue')}
                      onPress={() => {
                        resetForm();
                        setMode('login');
                        setPhase('auth');
                        setAuthSelectionOpen(true);
                      }}
                      disabled={!role}
                      testID="onboarding-role-continue"
                      colors={
                        role === 'electrician' ? ['#159A6F', '#47C98B'] : ['#2C6BE7', '#5DAAF8']
                      }
                      shadowColor={role === 'electrician' ? '#159A6F' : '#2C6BE7'}
                    />
                  </View>
                ) : (
                  <View style={[s.card, s.authCard, role === 'electrician' ? s.authCardElectrician : role === 'counterboy' ? s.authCardCounterboy : s.authCardDealer, darkMode ? { backgroundColor: '#111827', borderColor: '#243043' } : null]}>
                    {role === 'electrician' ? (
                      <LinearGradient
                        colors={['#173E80', '#285AB3', '#78AFFF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[s.authHeaderPanel, s.authHeaderPanelElectrician]}
                      >
                        <Text style={[s.sectionEyebrow, s.sectionEyebrowElectrician]}>
                          {mode === 'login' ? tx('Authentication') : tx('Create Account')}
                        </Text>
                        <Text style={[s.sectionTitleAuth, s.sectionTitleAuthElectrician]}>
                          {mode === 'login'
                            ? tx('Electrician Login')
                            : tx('Create Electrician Account')}
                        </Text>
                        <Text style={[s.sectionTextAuth, s.sectionTextAuthElectrician]}>
                          {mode === 'login'
                            ? tx('Enter your mobile number to log in with OTP.')
                            : tx('Complete the account setup flow and create your electrician profile.')}
                        </Text>
                      </LinearGradient>
                    ) : role === 'dealer' ? (
                      <LinearGradient
                        colors={['#173E80', '#355C95', '#88AEEA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[s.authHeaderPanel, s.authHeaderPanelDealer]}
                      >
                        <Text style={[s.sectionEyebrow, s.sectionEyebrowElectrician]}>
                          {mode === 'login' ? tx('Authentication') : tx('Create Account')}
                        </Text>
                        <Text style={[s.sectionTitleAuth, s.sectionTitleAuthElectrician]}>
                          {mode === 'login' ? tx('Dealer Login') : tx('Create Dealer Account')}
                        </Text>
                        <Text style={[s.sectionTextAuth, s.sectionTextAuthElectrician]}>
                          {mode === 'login'
                            ? tx('Choose a secure login method and continue with your dealer account.')
                            : tx('Complete the account setup flow and create your dealer profile.')}
                        </Text>
                      </LinearGradient>
                    ) : role === 'counterboy' ? (
                      <LinearGradient
                        colors={['#8B3C2A', '#6F4E37', '#A87A66']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[s.authHeaderPanel, s.authHeaderPanelDealer]}
                      >
                        <Text style={[s.sectionEyebrow, s.sectionEyebrowElectrician]}>
                          {mode === 'login' ? tx('Authentication') : tx('Create Account')}
                        </Text>
                        <Text style={[s.sectionTitleAuth, s.sectionTitleAuthElectrician]}>
                          {mode === 'login' ? tx('Counter Boy Login') : tx('Create Counter Boy Account')}
                        </Text>
                        <Text style={[s.sectionTextAuth, s.sectionTextAuthElectrician]}>
                          {mode === 'login'
                            ? tx('Choose a secure login method and continue with your counter boy account.')
                            : tx('Complete the account setup flow and create your counter boy profile.')}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View style={s.authHeaderPanel}>
                        <Text style={s.sectionEyebrow}>{mode === 'login' ? tx('Authentication') : tx('Create Account')}</Text>
                        <Text style={s.sectionTitleAuth}>
                          {mode === 'login' ? tx('Welcome back') : tx('Create your account')}
                        </Text>
                        <Text style={s.sectionTextAuth}>
                          {mode === 'login'
                            ? tx('Choose a secure login method and continue with your account.')
                            : tx('Complete the account setup flow and create your profile.')}
                        </Text>
                      </View>
                    )}
                    {directAuthEntry ? null : (
                      <Tabs
                        mode={mode}
                        role={role}
                        onChange={(next) => {
                          dismissKeyboard();
                          resetForm();
                          setMode(next);
                          setPhase('auth');
                          setAuthSelectionOpen(true);
                        }}
                      />
                    )}

                    {!authSelectionOpen ? null : mode === 'login' ? (
                      <View style={s.form}>
                        <Field
                          label={tx('Mobile Number')}
                          value={loginPhone}
                          onChangeText={handlePhone(setLoginPhone)}
                          placeholder={tx('Enter mobile number')}
                          keyboardType="phone-pad"
                          prefix="+91"
                          error={errors.loginPhone}
                          onFocus={scrollToForm}
                          inputRef={loginPhoneRef}
                          onSubmitEditing={continueLoginPhone}
                          actionLabel={loginStep === 'phone' ? tx('Send OTP') : undefined}
                          onActionPress={continueLoginPhone}
                          inputTestID="onboarding-login-phone-input"
                          actionTestID="onboarding-login-phone-verify"
                          actionDisabled={loginPhone.length !== 10 || loading}
                          maxLength={10}
                        />
                        {loginStep === 'otp' ? (
                          <Field
                            label={tx('OTP')}
                            value={loginOtp}
                            onChangeText={handleOtp(setLoginOtp)}
                            placeholder={tx('Enter 4 digit OTP')}
                            keyboardType="numeric"
                            autoComplete={OTP_AUTO_COMPLETE}
                            maxLength={4}
                            error={errors.loginOtp}
                            onFocus={scrollToForm}
                            inputRef={loginOtpRef}
                            actionLabel={loginOtpCountdown > 0 ? String(loginOtpCountdown) : tx('Resend')}
                            onActionPress={loginOtpCountdown === 0 ? continueLoginPhone : undefined}
                            inputTestID="onboarding-login-otp-input"
                            actionDisabled={loginOtpCountdown > 0}
                          />
                        ) : null}
                      </View>
                    ) : (
                      <View style={s.form}>
                        {role === 'dealer' ? (
                          <>
                            {dealerSignupContent ? (
                              <View style={s.formIntroCard}>
                                <View style={s.formIntroHeader}>
                                  <View style={s.formStepChip}>
                                    <Text style={s.formStepChipText}>
                                      {dealerSignupContent.stepLabel}
                                    </Text>
                                  </View>
                                  {previousDealerSignupStep(signupStep) ? (
                                    <Pressable
                                      onPress={goToPreviousDealerSignupStep}
                                      style={s.stepBackBtn}
                                    >
                                      <BackArrowIcon />
                                    </Pressable>
                                  ) : null}
                                </View>
                                <Text style={s.formStepTitle}>{dealerSignupContent.title}</Text>
                                <Text style={s.formStepText}>
                                  {dealerSignupContent.description}
                                </Text>
                              </View>
                            ) : null}

                            {signupStep === 'name' ? (
                              <>
                                <Field
                                  label={tx('Full Name')}
                                  value={signupName}
                                  onChangeText={handleName(setSignupName)}
                                  placeholder={tx('Enter owner or business name')}
                                  error={errors.signupName}
                                  onFocus={scrollToForm}
                                  returnKeyType="next"
                                  blurOnSubmit={false}
                                  onSubmitEditing={() => signupEmailRef.current?.focus()}
                                />
                                <Field
                                  label={tx('Email Address (Optional)')}
                                  value={signupEmail}
                                  onChangeText={handleSignupEmail}
                                  placeholder="name@business.com"
                                  error={errors.signupEmail}
                                  onFocus={scrollToForm}
                                  inputRef={signupEmailRef}
                                  onSubmitEditing={continueSignup}
                                />
                                <Button
                                  label={dealerSignupContent?.buttonLabel ?? tx('Continue')}
                                  onPress={continueSignup}
                                  disabled={false}
                                  secondary
                                />
                              </>
                            ) : null}

                            {signupStep === 'location' ? (
                              <>
                                <Field
                                  label={tx('State')}
                                  value={signupState}
                                  onChangeText={handleName((v) => { setSignupState(v); setError('signupState'); })}
                                  placeholder={tx('State')}
                                  error={errors.signupState}
                                  onFocus={scrollToForm}
                                  inputRef={signupStateRef}
                                  returnKeyType="next"
                                  blurOnSubmit={false}
                                  onSubmitEditing={() => signupCityRef.current?.focus()}
                                />
                                <Field
                                  label={tx('District')}
                                  value={signupCity}
                                  onChangeText={handleName((v) => { setSignupCity(v); setError('signupCity'); })}
                                  placeholder={tx('District')}
                                  error={errors.signupCity}
                                  onFocus={scrollToForm}
                                  inputRef={signupCityRef}
                                  returnKeyType="next"
                                  blurOnSubmit={false}
                                  onSubmitEditing={() => signupPincodeRef.current?.focus()}
                                />
                                <Field
                                  label={tx('Pincode')}
                                  value={signupPincode}
                                  onChangeText={(value) => {
                                    setSignupPincode(value.replace(/\D/g, '').slice(0, 6));
                                    setError('signupPincode');
                                  }}
                                  placeholder={tx('Pincode')}
                                  keyboardType="numeric"
                                  error={errors.signupPincode}
                                  onFocus={scrollToForm}
                                  inputRef={signupPincodeRef}
                                  onSubmitEditing={continueSignup}
                                />
                                <Button
                                  label={dealerSignupContent?.buttonLabel ?? tx('Continue')}
                                  onPress={continueSignup}
                                  disabled={false}
                                  secondary
                                />
                              </>
                            ) : null}

                            {signupStep === 'identity' ? (
                              <>
                                <Field
                                  label={tx('GST / PAN Number')}
                                  value={signupGstNumber}
                                  onChangeText={(value) => {
                                    const nextValue = normalizeGstOrPanNumber(value);
                                    setSignupGstNumber(nextValue);
                                    setError(
                                      'signupGstNumber',
                                      isValidOptionalGstOrPanNumber(nextValue)
                                        ? undefined
                                        : 'Please enter a valid GSTIN or PAN number in the proper format.'
                                    );
                                  }}
                                  placeholder={tx('Enter GST or PAN number')}
                                  error={errors.signupGstNumber}
                                  onFocus={scrollToForm}
                                  inputRef={signupGstNumberRef}
                                  maxLength={15}
                                  returnKeyType="next"
                                  blurOnSubmit={false}
                                  onSubmitEditing={() => signupGstHolderRef.current?.focus()}
                                />
                                <Field
                                  label={tx('SHOP / BUSINESS NAME')}
                                  value={signupGstHolderName}
                                  onChangeText={(value) => {
                                    setSignupGstHolderName(value.replace(/[^A-Za-z ]/g, ''));
                                    setError('signupGstHolderName');
                                  }}
                                  placeholder={tx('Enter shop or business name')}
                                  error={errors.signupGstHolderName}
                                  onFocus={scrollToForm}
                                  inputRef={signupGstHolderRef}
                                  onSubmitEditing={continueSignup}
                                />
                                <Button
                                  label={dealerSignupContent?.buttonLabel ?? tx('Continue')}
                                  onPress={continueSignup}
                                  disabled={false}
                                  secondary
                                />
                                <Pressable style={s.skipBtn} onPress={skipIdentityStep}>
                                  <Text style={s.skipBtnText}>{tx('Skip for Now')}</Text>
                                </Pressable>
                              </>
                            ) : null}

                            {signupStep === 'holders' ? (
                              <>
                                <Field
                                  label={tx('Mobile Number')}
                                  value={signupPhone}
                                  onChangeText={handleSignupPhone}
                                  placeholder={tx('Enter mobile number')}
                                  keyboardType="phone-pad"
                                  prefix="+91"
                                  error={errors.signupPhone}
                                  onFocus={scrollToForm}
                                  inputRef={signupPhoneRef}
                                  onSubmitEditing={sendSignupOtp}
                                  maxLength={10}
                                />
                                {!signupOtpSent ? (
                                  <Button
                                    label={tx('Send OTP')}
                                    onPress={sendSignupOtp}
                                    disabled={signupPhone.length !== 10}
                                    secondary
                                  />
                                ) : null}
                                {signupOtpSent && !signupOtpVerified ? (
                                  <Info
                                    text={`${tx('OTP sent to')} +91 ${signupPhone}.`}
                                    kind="success"
                                  />
                                ) : null}
                                {signupOtpSent && !signupOtpVerified ? (
                                  <Field
                                    label={tx('OTP')}
                                    value={signupOtp}
                                    onChangeText={handleOtp(setSignupOtp)}
                                    placeholder={tx('Enter 4 digit OTP')}
                                    keyboardType="numeric"
                                    autoComplete={OTP_AUTO_COMPLETE}
                                    maxLength={4}
                                    error={errors.signupOtp}
                                    onFocus={scrollToForm}
                                    inputRef={signupOtpRef}
                                                                        actionLabel={
                                      signupOtpCountdown > 0
                                        ? `0:${signupOtpCountdown >= 10 ? signupOtpCountdown : `0${signupOtpCountdown}`}`
                                        : tx('Resend')
                                    }
                                    onActionPress={
                                      signupOtpCountdown === 0 ? sendSignupOtp : undefined
                                    }
                                    actionDisabled={signupOtpCountdown > 0}
                                  />
                                ) : null}
                              </>
                            ) : null}
                            {signupStep === 'consent' ? (
                              <>
                                {signupOtpVerified ? (
                                  <Info
                                    text={tx('Phone verification successful.')}
                                    kind="success"
                                  />
                                ) : null}
                                <Field
                                  label={tx('Referral Code (Optional)')}
                                  value={signupReferralCode}
                                  onChangeText={value => setSignupReferralCode(value.replace(/\s/g, '').toUpperCase().slice(0, 80))}
                                  placeholder={tx('Enter your friend’s referral code')}
                                  onFocus={scrollToForm}
                                />
                                <Info text={tx('After signup, you and your friend will each receive 20 points.')} kind="hint" />
                                <Pressable
                                  style={[
                                    s.checkboxCard,
                                    signupTermsAgreed && s.checkboxCardActive,
                                  ]}
                                  onPress={() => setSignupTermsAgreed(!signupTermsAgreed)}
                                >
                                  <View style={[s.checkbox, signupTermsAgreed && s.checkboxOn]}>
                                    {signupTermsAgreed ? <CheckIcon /> : null}
                                  </View>
                                  <View style={s.checkboxCardTextWrap}>
                                    <Text style={s.checkboxText}>
                                      {tx('I agree to the')}{' '}
                                      <Text style={s.checkboxLink}>{tx('Terms & Conditions')}</Text>{' '}
                                      {tx('and')}{' '}
                                      <Text style={s.checkboxLink}>{tx('Privacy Policy')}</Text>
                                    </Text>
                                  </View>
                                </Pressable>
                                {errors.terms ? <Info text={errors.terms} kind="error" /> : null}
                                {signupTermsAgreed ? (
                                <Button
                                  label={
                                    loading
                                      ? tx('Creating Account...')
                                      : (dealerSignupContent?.buttonLabel ?? tx('Create Account'))
                                  }
                                  onPress={() => {
                                    if (!signupTermsAgreed)
                                      return setError(
                                        'terms',
                                        tx(
                                          'Please agree to the Terms & Conditions and Privacy Policy.'
                                        )
                                      );
                                    setError('terms');
                                    submitAuth();
                                  }}
                                  disabled={!canContinue || loading}
                                />
                                ) : null}
                              </>
                            ) : null}
                          </>
                        ) : (
                          <>
                            {previousElectricianSignupStep(signupStep) ? (
                              <View style={s.formStepBackRow}>
                                <Pressable
                                  onPress={goToPreviousElectricianSignupStep}
                                  style={s.stepBackBtn}
                                >
                                  <BackArrowIcon />
                                </Pressable>
                              </View>
                            ) : null}
                            {signupStep === 'name' ? (
                              <Field
                                label={tx('Full Name')}
                                value={signupName}
                                onChangeText={handleName(setSignupName)}
                                placeholder={tx('Enter your full name')}
                                error={errors.signupName}
                                onFocus={scrollToForm}
                                onSubmitEditing={continueSignup}
                              />
                            ) : null}
                            {signupStep === 'name' ? (
                              <Button
                                label={tx('Continue')}
                                onPress={continueSignup}
                                disabled={signupName.trim().length < 3}
                                secondary
                              />
                            ) : null}

                            {signupStep === 'phone' ? (
                              <Field
                                label={tx('Your Phone Number')}
                                value={signupPhone}
                                onChangeText={handleSignupPhone}
                                placeholder={tx('Enter your phone number')}
                                keyboardType="phone-pad"
                                prefix="+91"
                                error={errors.signupPhone}
                                onFocus={scrollToForm}
                                inputRef={signupPhoneRef}
                                onSubmitEditing={continueSignup}
                                maxLength={10}
                              />
                            ) : null}
                            {signupStep === 'phone' ? (
                              <Button
                                label={tx('Continue')}
                                onPress={continueSignup}
                                disabled={signupPhone.length !== 10}
                                secondary
                              />
                            ) : null}

                            {signupStep === 'address' ? (
                              <>
                                <Field
                                  label={tx('Address')}
                                  value={signupAddress}
                                  onChangeText={(value) => {
                                    addressDirtyRef.current = true;
                                    setSignupAddress(value);
                                    setLocationMessage('');
                                    setError('signupAddress');
                                  }}
                                  placeholder={locationLoading ? tx('Fetching current address...') : tx('Enter your complete address')}
                                  error={errors.signupAddress}
                                  onFocus={scrollToForm}
                                  inputRef={signupAddressRef}
                                  actionLabel={locationLoading ? tx('Locating') : tx('Current Address')}
                                  onActionPress={() => {
                                    addressDirtyRef.current = false;
                                    stateDirtyRef.current = false;
                                    cityDirtyRef.current = false;
                                    pincodeDirtyRef.current = false;
                                    void requestCurrentLocation();
                                  }}
                                  actionDisabled={locationLoading}
                                />
                                {locationMessage ? <Info text={locationMessage} kind="success" /> : null}
                                <Field
                                  label={tx('State')}
                                  value={signupState}
                                  onChangeText={handleName((v) => { stateDirtyRef.current = true; setSignupState(v); setError('signupState'); })}
                                  placeholder={tx('State')}
                                  error={errors.signupState}
                                  onFocus={scrollToForm}
                                  inputRef={signupStateRef}
                                  returnKeyType="next"
                                  blurOnSubmit={false}
                                  onSubmitEditing={() => signupCityRef.current?.focus()}
                                />
                                <Field
                                  label={tx('District')}
                                  value={signupCity}
                                  onChangeText={handleName((v) => { cityDirtyRef.current = true; setSignupCity(v); setError('signupCity'); })}
                                  placeholder={tx('District')}
                                  error={errors.signupCity}
                                  onFocus={scrollToForm}
                                  inputRef={signupCityRef}
                                  returnKeyType="next"
                                  blurOnSubmit={false}
                                  onSubmitEditing={() => signupPincodeRef.current?.focus()}
                                />
                                <Field
                                  label={tx('Pincode')}
                                  value={signupPincode}
                                  onChangeText={(value) => {
                                    pincodeDirtyRef.current = true;
                                    setSignupPincode(value.replace(/\D/g, '').slice(0, 6));
                                    setError('signupPincode');
                                  }}
                                  placeholder={tx('Pincode')}
                                  keyboardType="numeric"
                                  error={errors.signupPincode}
                                  onFocus={scrollToForm}
                                  inputRef={signupPincodeRef}
                                  onSubmitEditing={continueSignup}
                                />
                              </>
                            ) : null}
                            {signupStep === 'address' ? (
                              <Button
                                label={tx('Continue')}
                                onPress={continueSignup}
                                disabled={locationLoading}
                                secondary
                              />
                            ) : null}

                            {signupStep === 'dealer' ? (
                              <Field
                                label={tx('Dealer Verification Number')}
                                value={signupDealerPhone}
                                onChangeText={(value) => {
                                  const nextPhone = value.replace(/\D/g, '').slice(0, 10);
                                  dealerVerificationRequestRef.current += 1;
                                  setSignupDealerPhone(nextPhone);
                                  setDealerVerified(false);
                                  setVerifiedDealerName('');
                                  setSignupTermsAgreed(false);
                                  setDealerChecking(false);
                                  setError('signupDealerPhone');
                                  if (nextPhone.length === 10) verifyDealer(nextPhone);
                                }}
                                placeholder={tx('Enter dealer mobile number')}
                                keyboardType="phone-pad"
                                error={errors.signupDealerPhone}
                                onFocus={scrollToForm}
                                inputRef={signupDealerRef}
                                onSubmitEditing={dismissKeyboard}
                                maxLength={10}
                              />
                            ) : null}
                            {signupStep === 'dealer' && dealerChecking && !dealerVerified ? (
                              <Info text="Checking dealer number..." kind="hint" />
                            ) : null}
                            {signupStep === 'dealer' && dealerVerified ? (
                              <View style={s.verifiedDealerCard}>
                                <View style={s.verifiedDealerCardMain}>
                                  <Text style={s.verifiedDealerCardLabel}>{tx('Connected Dealer')}</Text>
                                  <Text style={s.verifiedDealerFieldLabel}>{tx('Business Name *')}</Text>
                                  <Text style={s.verifiedDealerCardValue}>{verifiedDealerName}</Text>
                                </View>
                              </View>
                            ) : null}
                            {dealerVerified && signupStep === 'dealer' ? (
                              <>
                                <Field
                                  label={tx('Referral Code (Optional)')}
                                  value={signupReferralCode}
                                  onChangeText={value => setSignupReferralCode(value.replace(/\s/g, '').toUpperCase().slice(0, 80))}
                                  placeholder={tx('Enter your friend’s referral code')}
                                  onFocus={scrollToForm}
                                />
                                <Info text={tx('After signup, you and your friend will each receive 20 points.')} kind="hint" />
                                <Pressable
                                  style={[s.checkboxCard, signupTermsAgreed && s.checkboxCardActive]}
                                  onPress={() => {
                                    setSignupTermsAgreed(!signupTermsAgreed);
                                    setError('terms');
                                  }}
                                >
                                  <View style={[s.checkbox, signupTermsAgreed && s.checkboxOn]}>
                                    {signupTermsAgreed ? <CheckIcon /> : null}
                                  </View>
                                  <View style={s.checkboxCardTextWrap}>
                                    <Text style={s.checkboxText}>
                                      {tx('I agree to the')}{' '}
                                      <Text style={s.checkboxLink}>{tx('Terms & Conditions')}</Text>{' '}
                                      {tx('and')}{' '}
                                      <Text style={s.checkboxLink}>{tx('Privacy Policy')}</Text>
                                    </Text>
                                  </View>
                                </Pressable>
                                {errors.terms ? <Info text={errors.terms} kind="error" /> : null}
                                <Button
                                  label={loading ? tx('Creating Account...') : tx('Create Account')}
                                  onPress={continueSignup}
                                  disabled={!canContinue || loading}
                                  colors={['#173E80', '#355C95']}
                                  shadowColor="#173E80"
                                />
                              </>
                            ) : null}
                            {signupStep === 'otp' && signupOtpSent && !signupOtpVerified ? (
                              <Info
                                text={`${tx('OTP sent to')} +91 ${signupPhone}.`}
                                kind="success"
                              />
                            ) : null}
                            {signupStep === 'otp' && signupOtpSent && !signupOtpVerified ? (
                              <Field
                                label={tx('OTP')}
                                value={signupOtp}
                                onChangeText={handleOtp(setSignupOtp)}
                                placeholder={tx('Enter 4 digit OTP')}
                                keyboardType="numeric"
                                autoComplete={OTP_AUTO_COMPLETE}
                                maxLength={4}
                                error={errors.signupOtp}
                                onFocus={scrollToForm}
                                inputRef={signupOtpRef}
                                                                actionLabel={
                                  signupOtpCountdown > 0
                                    ? `0:${signupOtpCountdown >= 10 ? signupOtpCountdown : `0${signupOtpCountdown}`}`
                                    : tx('Resend')
                                }
                                onActionPress={signupOtpCountdown === 0 ? sendSignupOtp : undefined}
                                actionDisabled={signupOtpCountdown > 0}
                              />
                            ) : null}
                          </>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </Animated.View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.heroA },
  bg: { ...StyleSheet.absoluteFillObject },
  kav: { flex: 1 },
  dismissSurface: { flex: 1 },
  forgotOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15,23,42,0.48)',
  },
  forgotKav: { width: '100%', maxHeight: '92%' },
  forgotScroll: { width: '100%' },
  forgotCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 12,
    ...createShadow({ color: '#0F172A', offsetY: -8, blur: 28, opacity: 0.18, elevation: 12 }),
  },
  forgotHandle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 999, backgroundColor: '#D8E2F0', marginBottom: 4 },
  forgotTitle: { color: C.title, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  forgotSubtitle: { color: C.muted2, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  forgotResendBtn: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 8 },
  forgotResendText: { color: '#173E80', fontSize: 13, fontWeight: '900' },
  content: { flexGrow: 1, paddingHorizontal: 14, paddingTop: 34, paddingBottom: 24 },
  glow1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(59,130,246,0.18)',
    top: -60,
    right: -35,
  },
  glow2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(236,72,153,0.14)',
    bottom: 120,
    left: -28,
  },
  glow3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(34,197,94,0.1)',
    top: 90,
    left: '34%',
  },
  contentRole: { flexGrow: 0 },
  revealRole: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginBottom: 12,
    position: 'relative',
    minHeight: 112,
    paddingTop: 18,
  },
  topRowCompact: { marginBottom: 8, minHeight: 96, paddingTop: 18 },
  topRowAuth: { minHeight: 64, marginBottom: 2, paddingTop: 0 },
  brandRow: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  brandRowCentered: { flexDirection: 'row' },
  logoWrap: { width: 156, height: 88, alignItems: 'center', justifyContent: 'center' },
  logoWrapCompact: { width: 134, height: 76 },
  logoWrapAuth: { width: 116, height: 64 },
  logo: { width: '100%', height: '100%' },
  back: {
    position: 'absolute',
    left: 0,
    top: 30,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backRight: {
    position: 'absolute',
    right: 0,
    top: 30,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 10,
    marginBottom: 14,
    minHeight: 22,
  },
  welcomeRowCentered: { justifyContent: 'center' },
  welcomeRowAuth: { marginTop: 0, marginBottom: 5 },
  welcomeRowAuthHidden: { minHeight: 0, marginTop: 0, marginBottom: 2, opacity: 0.15 },
  welcomeLanguageWrap: { marginLeft: 'auto', alignItems: 'flex-end' },
  welcomeLanguageWrapFloating: { position: 'absolute', right: 0, top: 0, alignItems: 'flex-end' },
  languageWrap: { position: 'relative', zIndex: 20 },
  languageBackdropFull: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 10,
  },
  languageTrigger: {
    minWidth: 52,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(125,145,179,0.22)',
    overflow: 'hidden',
    ...createShadow({ color: '#163B72', offsetY: 8, blur: 14, opacity: 0.1, elevation: 4 }),
  },
  languageTriggerActive: { borderColor: '#1D4ED8' },
  languageTriggerFill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 10,
  },
  languageMiniIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
  },
  languageMiniIconActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 9,
  },
  languageMiniText: { color: '#1D4ED8', fontSize: 11, fontWeight: '900', letterSpacing: 0.2 },
  languageMiniTextActive: { color: '#FFFFFF' },
  languageMenu: {
    position: 'absolute',
    top: 42,
    right: -6,
    zIndex: 100,
    minWidth: 156,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderWidth: 1,
    borderColor: '#D8E2F0',
    padding: 8,
    ...createShadow({ color: '#0F172A', offsetY: 10, blur: 22, opacity: 0.12, elevation: 6 }),
  },
  languageMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  languageMenuItemActive: { backgroundColor: '#EEF4FF' },
  languageMenuMark: {
    width: 24,
    color: '#2C6BE7',
    fontSize: 15,
    fontWeight: '900',
    textAlign: 'center',
  },
  languageMenuMarkActive: { color: '#1D4ED8' },
  languageMenuText: { color: C.title, fontSize: 13, fontWeight: '800' },
  languageMenuTextActive: { color: '#1D4ED8' },
  welcomeBadge: { marginTop: 0 },
  welcomeBadgeFill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(14,165,233,0.12)',
  },
  welcomeBadgeFillElectrician: {
    borderColor: '#BFDBFE',
  },
  welcomeBadgeFillDealer: {
    borderColor: '#BFDBFE',
  },
  eyebrow: {
    color: C.muted2,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  bigTitle: { fontSize: 32, fontWeight: '900', marginTop: 8, marginBottom: 8, letterSpacing: -0.4 },
  bigTitleCompact: { fontSize: 26, marginTop: 6, marginBottom: 6 },
  bigTitleAuth: { fontSize: 27, marginTop: 4, marginBottom: 4 },
  bigTitleLanguage: { fontSize: 27, letterSpacing: -0.3 },
  bigTitleNeutral: { color: C.title },
  bigTitleElectrician: { color: '#274C77' },
  bigTitleDealer: { color: '#173E80' },
  subtext: {
    color: C.muted,
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 4,
    marginBottom: 12,
    maxWidth: '96%',
  },
  subtextCompact: { fontSize: 12.5, lineHeight: 18, marginTop: 4, marginBottom: 10 },
  subtextAuth: { maxWidth: '88%', marginTop: 0, marginBottom: 8, color: '#6B7280' },
  subtextAuthHidden: { maxHeight: 0, opacity: 0, marginTop: 0, marginBottom: 0 },
  card: {
    backgroundColor: C.white,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: C.line,
    ...createShadow({ color: '#0F172A', offsetY: 12, blur: 20, opacity: 0.08, elevation: 6 }),
  },
  introCardCompact: { borderRadius: 24, paddingTop: 12, paddingBottom: 10, paddingHorizontal: 12 },
  languageCard: { marginTop: 10, paddingTop: 16, paddingBottom: 4, paddingHorizontal: 14 },
  roleSetupCard: {
    marginTop: 16,
    flexGrow: 0,
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 14,
  },
  roleSetupCardCompact: { marginTop: 12, flexGrow: 0, paddingTop: 12, paddingBottom: 12 },
  sectionEyebrow: {
    color: '#7D8AA5',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  sectionEyebrowElectrician: {
    color: 'rgba(236,244,255,0.84)',
  },
  sectionTitle: { color: C.title, fontSize: 13, fontWeight: '900', marginBottom: 6 },
  sectionText: { color: C.muted, fontSize: 12, lineHeight: 18 },
  sectionTitleAuth: { color: C.title, fontSize: 20, fontWeight: '900', marginBottom: 6, letterSpacing: -0.3 },
  sectionTitleAuthElectrician: { color: '#FFFFFF' },
  sectionTextAuth: { color: C.muted2, fontSize: 12.5, lineHeight: 18, marginBottom: 0 },
  sectionTextAuthElectrician: { color: 'rgba(239,246,255,0.88)' },
  languageOptionList: { marginTop: 12, marginBottom: 10 },
  languageOptionCard: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#D8E2F0',
    backgroundColor: '#F8FBFF',
    paddingHorizontal: 12,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  languageOptionCardActive: { borderColor: '#69B8FF', backgroundColor: '#EAF3FF' },
  languageOptionBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageOptionBadgeActive: { backgroundColor: '#2C6BE7' },
  languageOptionBadgeText: { color: '#2C6BE7', fontSize: 17, fontWeight: '900' },
  languageOptionBadgeTextActive: { color: '#FFFFFF' },
  languageOptionCopy: { flex: 1, marginLeft: 10 },
  languageOptionTitle: { color: C.title, fontSize: 13, fontWeight: '900' },
  languageOptionTitleActive: { color: '#1D4ED8' },
  languageOptionNative: { color: C.text, fontSize: 12, fontWeight: '700' },
  languageOptionNativeActive: { color: '#1D4ED8' },
  languageOptionDescription: { color: C.muted, fontSize: 10 },
  roleGrid: { flexDirection: 'row', gap: 12, marginTop: 14, marginBottom: 14 },
  roleGridCompact: { gap: 10, marginTop: 12, marginBottom: 12 },
  roleCard: { flex: 1, borderRadius: 22, padding: 12, borderWidth: 1.5, borderColor: '#243554' },
  roleCardCompact: { borderRadius: 18, padding: 10 },
  roleCardElectrician: { backgroundColor: '#F1FBF7', borderColor: '#B9E7D4' },
  roleCardDealer: { backgroundColor: '#F2F7FF', borderColor: '#BED4F7' },
  roleCardElectricianActive: {
    borderColor: '#63D79C',
    backgroundColor: '#CFF3DE',
    ...createShadow({ color: '#63D79C', offsetY: 8, blur: 14, opacity: 0.18, elevation: 4 }),
  },
  roleCardDealerActive: {
    borderColor: '#69B8FF',
    backgroundColor: '#D8EBFF',
    ...createShadow({ color: '#4D9FFF', offsetY: 8, blur: 14, opacity: 0.18, elevation: 4 }),
  },
  roleFrame: {
    height: 112,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    padding: 6,
  },
  roleFrameCompact: { height: 90, borderRadius: 15, marginBottom: 8, padding: 4 },
  roleImage: { width: '100%', height: '100%' },
  roleFrameText: { color: '#D3DFF5', fontSize: 12, fontWeight: '700' },
  roleTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  roleTitleCompact: { fontSize: 14, marginBottom: 2 },
  roleTitleDefault: { color: C.text },
  roleTitleActive: { color: C.text },
  roleSubtitle: { fontSize: 12, lineHeight: 18 },
  roleSubtitleCompact: { fontSize: 11, lineHeight: 16 },
  roleSubtitleDefault: { color: C.muted2 },
  roleSubtitleActive: { color: C.muted2 },
  authGlow: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.9,
  },
  authGlowElectricianTop: {
    top: 108,
    right: -36,
    width: 190,
    height: 190,
    backgroundColor: 'rgba(87,142,255,0.18)',
  },
  authGlowElectricianBottom: {
    bottom: 108,
    left: -48,
    width: 220,
    height: 220,
    backgroundColor: 'rgba(23,62,128,0.1)',
  },
  authGlowDealerTop: {
    top: 100,
    right: -42,
    width: 190,
    height: 190,
    backgroundColor: 'rgba(83,139,233,0.18)',
  },
  authGlowDealerBottom: {
    bottom: 108,
    left: -44,
    width: 220,
    height: 220,
    backgroundColor: 'rgba(23,62,128,0.12)',
  },
  authGlowCounterboyTop: {
    top: 108,
    right: -36,
    width: 190,
    height: 190,
    backgroundColor: 'rgba(139,60,42,0.15)',
  },
  authGlowCounterboyBottom: {
    bottom: 108,
    left: -48,
    width: 220,
    height: 220,
    backgroundColor: 'rgba(111,78,55,0.1)',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E4EEFF',
    borderRadius: 20,
    padding: 5,
    marginTop: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D1E3FF',
    ...createShadow({ color: '#7CA9F1', offsetY: 8, blur: 16, opacity: 0.12, elevation: 3 }),
  },
  tab: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  tabElectricianActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#9DBDF0',
    ...createShadow({ color: '#2757AA', offsetY: 6, blur: 14, opacity: 0.16, elevation: 3 }),
  },
  tabDealerActive: {
    backgroundColor: '#EDF4FF',
    borderWidth: 1,
    borderColor: '#BFD7FB',
    ...createShadow({ color: '#355C95', offsetY: 8, blur: 14, opacity: 0.14, elevation: 3 }),
  },
  tabCounterboyActive: {
    backgroundColor: '#F9F4ED',
    borderWidth: 1,
    borderColor: '#E0D0C0',
    ...createShadow({ color: '#8B3C2A', offsetY: 8, blur: 14, opacity: 0.14, elevation: 3 }),
  },
  tabText: { color: C.muted, fontSize: 14, fontWeight: '700' },
  tabTextActive: { color: C.text },
  authHeaderPanel: {
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    marginBottom: 14,
    backgroundColor: '#F8FBFF',
    borderWidth: 1,
    borderColor: '#DCE8F8',
  },
  authHeaderPanelElectrician: {
    borderColor: 'rgba(207,227,255,0.34)',
    ...createShadow({ color: '#173E80', offsetY: 12, blur: 20, opacity: 0.18, elevation: 4 }),
  },
  authHeaderPanelDealer: {
    borderColor: 'rgba(207,227,255,0.34)',
    ...createShadow({ color: '#173E80', offsetY: 12, blur: 20, opacity: 0.18, elevation: 4 }),
  },
  entryPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 2,
    marginBottom: 14,
    backgroundColor: '#EEF3FA',
  },
  entryPillElectrician: {
    backgroundColor: '#E7F0FF',
    borderWidth: 1,
    borderColor: '#CEE0FF',
  },
  entryPillDealer: {
    backgroundColor: '#EDF4FF',
    borderWidth: 1,
    borderColor: '#CEE0FF',
  },
  entryPillCounterboy: {
    backgroundColor: '#F5EDE4',
    borderWidth: 1,
    borderColor: '#E0D0C0',
  },
  entryPillText: { color: '#5C6F91', fontSize: 11, fontWeight: '800' },
  entryPillTextElectrician: { color: '#173E80' },
  entryPillTextDealer: { color: '#173E80' },
  entryPillTextCounterboy: { color: '#8B3C2A' },
  loginChoiceRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 6 },
  loginChoiceCard: {
    flex: 1,
    minHeight: 58,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: '#D7E8FF',
    backgroundColor: '#F9FBFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    ...createShadow({ color: '#84AAF0', offsetY: 6, blur: 14, opacity: 0.08, elevation: 2 }),
  },
  loginChoiceCardActive: {
    borderColor: '#2A5CB4',
    backgroundColor: '#EDF4FF',
    ...createShadow({ color: '#2A5CB4', offsetY: 10, blur: 18, opacity: 0.16, elevation: 4 }),
  },
  loginChoiceText: { color: C.text, fontSize: 12, fontWeight: '800', textAlign: 'center' },
  loginChoiceTextActive: { color: '#173E80' },
  forgotLinkWrap: { alignSelf: 'flex-end', paddingVertical: 4, paddingHorizontal: 2, marginTop: -6 },
  forgotLinkText: { color: '#173E80', fontSize: 12, fontWeight: '900' },
  form: { gap: 12 },
  authCard: {
    borderRadius: 30,
    paddingTop: 18,
    paddingBottom: 22,
    borderWidth: 1.4,
  },
  authCardElectrician: {
    backgroundColor: 'rgba(255,255,255,0.985)',
    borderColor: '#D2E3FF',
    ...createShadow({ color: '#173E80', offsetY: 18, blur: 30, opacity: 0.14, elevation: 7 }),
  },
  authCardDealer: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderColor: '#D2E3FF',
    ...createShadow({ color: '#173E80', offsetY: 16, blur: 28, opacity: 0.13, elevation: 6 }),
  },
  authCardCounterboy: {
    backgroundColor: 'rgba(255,255,255,0.985)',
    borderColor: '#E0D0C0',
    ...createShadow({ color: '#8B3C2A', offsetY: 18, blur: 30, opacity: 0.14, elevation: 7 }),
  },
  formIntroCard: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: '#F7FBFF',
    borderWidth: 1.2,
    borderColor: '#D8E7FB',
    gap: 6,
  },
  formStepBackRow: { alignItems: 'flex-end' },
  formIntroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  formStepChip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EEF3FA',
  },
  formStepChipText: {
    color: '#355C95',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  stepBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8E7FB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formStepTitle: { color: C.title, fontSize: 16, fontWeight: '900' },
  formStepText: { color: C.muted, fontSize: 12.5, lineHeight: 18 },
  group: { gap: 6 },
  helperText: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: -2, marginBottom: 2 },
  label: {
    color: C.muted2,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  skipBtn: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: '#D8E2F0',
    backgroundColor: '#F8FBFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: { color: C.accentA, fontSize: 13, fontWeight: '800' },
  shell: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: C.fieldLine,
    backgroundColor: C.field,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  shellError: { borderColor: C.error, backgroundColor: C.errorSoft },
  shellHint: { borderColor: '#9FC0F4', backgroundColor: '#EEF5FF' },
  prefixWrap: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#DFE7F1',
  },
  prefix: { color: C.text, fontSize: 14, fontWeight: '700' },
  inputWrap: { flex: 1, minWidth: 0 },
  inputWrapWithAction: { paddingRight: 2 },
  input: { height: '100%', paddingHorizontal: 14, color: C.text, fontSize: 15, fontWeight: '600' },
  inputWithAction: { flexShrink: 1, fontSize: 14 },
  inputWithWideAction: { fontSize: 13, paddingHorizontal: 10 },
  fieldAction: {
    alignSelf: 'center',
    marginRight: 6,
    paddingHorizontal: 8,
    minWidth: 62,
    height: 32,
    borderRadius: 11,
    backgroundColor: '#EEF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldActionWide: { minWidth: 102 },
  fieldActionIcon: { minWidth: 42, width: 42, paddingHorizontal: 0 },
  fieldActionDisabled: { backgroundColor: '#E3E9F2' },
  fieldActionText: { color: C.accentA, fontSize: 11, fontWeight: '800' },
  fieldActionTextDisabled: { color: '#97A6BE' },
  verifyActionBelow: {
    marginTop: 9,
    minHeight: 46,
    borderRadius: 14,
    paddingHorizontal: 22,
    alignSelf: 'stretch',
    backgroundColor: '#EEF4FF',
    borderWidth: 1,
    borderColor: '#D8E6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyActionBelowDisabled: {
    backgroundColor: '#E3E9F2',
    borderColor: '#D4DEEB',
  },
  verifyActionBelowText: { color: C.accentA, fontSize: 14, fontWeight: '900' },
  btnOuter: { marginTop: 4 },
  btn: {
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: '#FFFFFF',
  },
  btnText: { color: C.white, fontSize: 15, fontWeight: '900', letterSpacing: 0.2 },
  btnTextSecondary: { color: C.white },
  info: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10 },
  infoError: { backgroundColor: C.errorSoft },
  infoSuccess: { backgroundColor: C.successSoft },
  infoWarning: { backgroundColor: C.warningSoft },
  infoHint: { backgroundColor: '#EEF5FF' },
  infoText: { fontSize: 12, lineHeight: 18, fontWeight: '700' },
  infoErrorText: { color: C.error },
  infoSuccessText: { color: C.success },
  infoWarningText: { color: C.warning },
  infoHintText: { color: C.accentA },
  verifiedDealerCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D8E7FB',
    backgroundColor: '#F8FBFF',
    padding: 14,
    gap: 10,
  },
  verifiedDealerCardMain: { gap: 4 },
  verifiedDealerCardLabel: {
    color: C.muted2,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  verifiedDealerFieldLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  verifiedDealerCardValue: { color: C.text, fontSize: 14, fontWeight: '900' },
  verifiedDealerCodeChip: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E7F0FF',
    borderWidth: 1,
    borderColor: '#C9DBFB',
  },
  verifiedDealerCodeLabel: {
    color: C.accentA,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 2,
  },
  verifiedDealerCodeValue: { color: C.accentA, fontSize: 13, fontWeight: '900' },
  checkboxCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE6F3',
    backgroundColor: '#F9FBFE',
    padding: 14,
  },
  checkboxCardTextWrap: { flex: 1, gap: 4 },
  checkboxCardTitle: { color: C.text, fontSize: 13, fontWeight: '800' },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.4,
    borderColor: C.fieldLine,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: C.accentB, borderColor: C.accentB },
  checkboxCardActive: { borderColor: C.accentB },
  check: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  checkboxText: { flex: 1, color: C.text, fontSize: 12, lineHeight: 19, fontWeight: '500' },
  checkboxLink: { color: C.accentA, fontWeight: '700', textDecorationLine: 'underline' },
  otpResendRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, marginBottom: 8 },
  otpTimer: { color: C.error, fontSize: 12, fontWeight: '800' },
  otpResend: { color: C.accentA, fontSize: 12, fontWeight: '800' },
});
