import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Svg, { Path } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { SRV_LOGO_URI } from '@/shared/data/logoBase64';
import { usePreferenceContext } from '@/shared/preferences';
import { clearShadow, createShadow } from '@/shared/theme/shadows';
import { authApi, dealerApi } from '@/shared/api';
import {
  isValidOptionalEmail,
  isValidOptionalGstOrPanNumber,
  normalizeGstOrPanNumber,
  sanitizeEmailInput,
} from '@/shared/utils/validation';
import type { UserRole } from '@/shared/types/navigation';
type IntroStep = 'language' | 'role' | 'auth';
type AuthMode = 'login' | 'signup';
type LoginStep = 'phone' | 'otp' | 'password';
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
  | 'password';
type LoginMethod = 'otp' | 'password' | null;

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
    nativeTitle: 'à¤¹à¤¿à¤‚à¤¦à¥€',
    mark: 'à¤…',
    description: 'à¤‘à¤¨à¤¬à¥‹à¤°à¥à¤¡à¤¿à¤‚à¤— à¤”à¤° à¤°à¤¿à¤µà¥‰à¤°à¥à¤¡à¥à¤¸ à¤•à¥‡ à¤²à¤¿à¤à¥¤',
  },
  {
    value: 'Punjabi',
    title: 'Punjabi',
    nativeTitle: 'à¨ªà©°à¨œà¨¾à¨¬à©€',
    mark: 'à¨…',
    description: 'à¨†à¨¨à¨¬à©‹à¨°à¨¡à¨¿à©°à¨— à¨…à¨¤à©‡ à¨°à¨¿à¨µà¨¾à¨°à¨¡ à¨²à¨ˆà¥¤',
  },
] as const;

const dealerSignupMeta: Partial<
  Record<SignupStep, { stepLabel: string; title: string; description: string; buttonLabel: string }>
> = {
  name: {
    stepLabel: 'Step 1 of 5',
    title: 'Business Profile',
    description:
      'Enter the owner or business name, email address, and business address in a clean business format.',
    buttonLabel: 'Continue to Location',
  },
  location: {
    stepLabel: 'Step 2 of 5',
    title: 'Location Details',
    description:
      'Review the state, city, and pincode. Auto-filled details can still be edited if needed.',
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
    description: 'Verify the dealer mobile number before moving to the final security step.',
    buttonLabel: 'Continue to Security',
  },
  password: {
    stepLabel: 'Step 5 of 5',
    title: 'Password & Consent',
    description: 'Create a password if you want and finish the account setup securely.',
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

function EyeIcon({ open }: { open: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      {open ? (
        <>
          <Path
            d="M2 12C3.9 8.3 7.5 6 12 6C16.5 6 20.1 8.3 22 12C20.1 15.7 16.5 18 12 18C7.5 18 3.9 15.7 2 12Z"
            stroke="#5C6F91"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12 15.2C13.7673 15.2 15.2 13.7673 15.2 12C15.2 10.2327 13.7673 8.8 12 8.8C10.2327 8.8 8.8 10.2327 8.8 12C8.8 13.7673 10.2327 15.2 12 15.2Z"
            stroke="#5C6F91"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <Path
            d="M3 3L21 21"
            stroke="#5C6F91"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10.6 6.3C11.05 6.1 11.52 6 12 6C16.5 6 20.1 8.3 22 12C21.2 13.56 20.11 14.88 18.8 15.89"
            stroke="#5C6F91"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M6.17 8.22C4.54 9.16 3.18 10.44 2 12C3.9 15.7 7.5 18 12 18C13.76 18 15.37 17.65 16.79 17.03"
            stroke="#5C6F91"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9.9 9.92C9.32 10.5 8.96 11.3 8.96 12.18C8.96 13.94 10.38 15.36 12.14 15.36C13.02 15.36 13.82 15 14.4 14.42"
            stroke="#5C6F91"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </Svg>
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
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  secureTextEntry?: boolean;
  prefix?: string;
  error?: string;
  onFocus?: () => void;
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
}) {
  const { tx, darkMode } = usePreferenceContext();
  const hasAction = Boolean(actionLabel || actionContent);
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
        <View style={[s.inputWrap, hasAction ? s.inputWrapWithAction : null]}>
          <TextInput
            ref={inputRef}
            testID={inputTestID}
            style={[
              s.input,
              hasAction ? s.inputWithAction : null,
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
            onFocus={onFocus}
            onSubmitEditing={onSubmitEditing}
            returnKeyType={returnKeyType ?? 'done'}
            blurOnSubmit={blurOnSubmit ?? returnKeyType !== 'next'}
            editable={editable ?? true}
            onPressIn={onPressIn}
            maxLength={maxLength}
          />
        </View>
        {actionLabel || actionContent ? (
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
  onGetStarted: (
    role: UserRole,
    options?: { passwordConfigured?: boolean; passwordValue?: string }
  ) => void;
  fixedRole?: UserRole;
  initialMode?: AuthMode;
  initialPhase?: IntroStep;
  onCancel?: () => void;
}): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { language, setLanguage, tx, darkMode } = usePreferenceContext();
  const reveal = useReveal();
  const scrollRef = useRef<ScrollView | null>(null);
  const loginPhoneRef = useRef<TextInput | null>(null);
  const loginOtpRef = useRef<TextInput | null>(null);
  const loginPassRef = useRef<TextInput | null>(null);
  const signupDealerRef = useRef<TextInput | null>(null);
  const signupAddressRef = useRef<TextInput | null>(null);
  const signupPhoneRef = useRef<TextInput | null>(null);
  const signupOtpRef = useRef<TextInput | null>(null);
  const signupStateRef = useRef<TextInput | null>(null);
  const signupCityRef = useRef<TextInput | null>(null);
  const signupPincodeRef = useRef<TextInput | null>(null);
  const signupGstNumberRef = useRef<TextInput | null>(null);
  const signupPanNumberRef = useRef<TextInput | null>(null);
  const signupGstHolderRef = useRef<TextInput | null>(null);
  const signupPanHolderRef = useRef<TextInput | null>(null);
  const signupPassRef = useRef<TextInput | null>(null);
  const signupConfirmPassRef = useRef<TextInput | null>(null);
  const dealerAutoAddressRequestedRef = useRef(false);
  const electricianAddressAutoRequestedRef = useRef(false);
  const electricianPhoneAutoRequestedRef = useRef(false);
  const electricianDealerAutoAdvanceRef = useRef(false);

  const resolvedInitialPhase = initialPhase ?? (fixedRole ? 'auth' : 'language');
  const [phase, setPhase] = useState<IntroStep>(resolvedInitialPhase);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<UserRole>(fixedRole ?? 'electrician');
  const directAuthEntry = Boolean(fixedRole && resolvedInitialPhase === 'auth');
  const [authSelectionOpen, setAuthSelectionOpen] = useState(resolvedInitialPhase === 'auth');
  const [electricianLoginMethod, setElectricianLoginMethod] = useState<LoginMethod>(null);
  const [dealerLoginMethod, setDealerLoginMethod] = useState<LoginMethod>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [loginPass, setLoginPass] = useState('');
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
  const [signupOtpCountdown, setSignupOtpCountdown] = useState(0);
  const [signupPass, setSignupPass] = useState('');
  const [signupConfirmPass, setSignupConfirmPass] = useState('');
  const [signupTermsAgreed, setSignupTermsAgreed] = useState(false);
  const [signupStep, setSignupStep] = useState<SignupStep>('name');
  const [dealerVerified, setDealerVerified] = useState(false);
  const [verifiedDealerName, setVerifiedDealerName] = useState('');
  const [verifiedDealerCode, setVerifiedDealerCode] = useState('');
  const [verifiedDealerNextSerial, setVerifiedDealerNextSerial] = useState('001');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const keyboardHeightRef = useRef(0);
  const isCompactPhone = width <= 360 || height <= 760;
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

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      keyboardHeightRef.current = e.endCoordinates.height;
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      keyboardHeightRef.current = 0;
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
    if (locationLoading) return;
    setLocationLoading(true);
    setLocationMessage('');
    setError('signupAddress');
    setError('signupState');
    setError('signupCity');
    setError('signupPincode');
    try {
      let permission = await Location.getForegroundPermissionsAsync();

      if (!permission.granted) {
        permission = await Location.requestForegroundPermissionsAsync();
      }

      const hasLocationPermission =
        permission.granted ||
        permission.status === 'granted' ||
        (Platform.OS === 'android' && permission.android?.accuracy !== 'none');

      if (!hasLocationPermission) {
        if (permission.canAskAgain) {
          setError(
            'signupAddress',
            'Please allow location permission to fetch your current address automatically.'
          );
        } else {
          setError(
            'signupAddress',
            'Location permission is blocked. Opening app settings so you can allow it.'
          );
          await Linking.openSettings();
        }
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        if (Platform.OS === 'android') {
          try {
            await Location.enableNetworkProviderAsync();
          } catch {
            setError(
              'signupAddress',
              'Please turn on device location to fetch the current address automatically.'
            );
            return;
          }
        } else {
          setError(
            'signupAddress',
            'Please turn on device location to fetch the current address automatically.'
          );
          return;
        }
      }

      let currentPosition = await Location.getLastKnownPositionAsync({
        maxAge: 1000 * 60 * 10,
        requiredAccuracy: 500,
      });

      if (!currentPosition) {
        currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Platform.OS === 'android' ? Location.Accuracy.Balanced : Location.Accuracy.High,
          mayShowUserSettingsDialog: true,
        });
      }

      const reverseLookup = await Location.reverseGeocodeAsync({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      });

      if (!reverseLookup || reverseLookup.length === 0) {
        setError(
          'signupAddress',
          'Could not find address for your location. Please enter manually.'
        );
        setLocationLoading(false);
        return;
      }

      const currentAddress = reverseLookup[0];
      if (!currentAddress) {
        setError('signupAddress', 'Address details not found. Please enter manually.');
        setLocationLoading(false);
        return;
      }

      const addressParts: string[] = [];
      if (currentAddress.formattedAddress) addressParts.push(currentAddress.formattedAddress);
      if (currentAddress.name) addressParts.push(currentAddress.name);
      if (currentAddress.streetNumber) addressParts.push(currentAddress.streetNumber);
      if (currentAddress.street) addressParts.push(currentAddress.street);
      if (currentAddress.district) addressParts.push(currentAddress.district);
      if (currentAddress.city) addressParts.push(currentAddress.city);
      if (currentAddress.subregion) addressParts.push(currentAddress.subregion);
      if (currentAddress.region) addressParts.push(currentAddress.region);

      const resolvedAddress = addressParts
        .map((part) => part.trim())
        .filter(Boolean)
        .filter((part, index, parts) => parts.indexOf(part) === index)
        .join(', ');
      const resolvedState = currentAddress.region || '';
      const resolvedCity =
        currentAddress.city || currentAddress.district || currentAddress.subregion || '';
      const resolvedPincode = currentAddress.postalCode || '';

      if (!resolvedAddress && !resolvedState && !resolvedCity && !resolvedPincode) {
        setError('signupAddress', 'Could not fetch address details. Please enter manually.');
        setLocationLoading(false);
        return;
      }

      if (resolvedAddress) setSignupAddress(resolvedAddress);
      if (resolvedState) setSignupState(resolvedState);
      if (resolvedCity) setSignupCity(resolvedCity);
      if (resolvedPincode) setSignupPincode(resolvedPincode.replace(/\D/g, '').slice(0, 6));
      setLocationMessage('Address fetched successfully. Please review and update if needed.');
    } catch {
      setError('signupAddress', 'Could not fetch location. Please enter address manually.');
    } finally {
      setLocationLoading(false);
    }
  }, [locationLoading, setError]);

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
    if (loginOtpVerified || signupOtpVerified) {
      dismissKeyboard();
    }
  }, [loginOtpVerified, signupOtpVerified]);

  useEffect(() => {
    if (
      mode !== 'signup' ||
      role !== 'dealer' ||
      signupStep !== 'name' ||
      !signupEmail.trim() ||
      !isValidOptionalEmail(signupEmail) ||
      signupAddress.trim() ||
      locationLoading ||
      dealerAutoAddressRequestedRef.current
    ) {
      return;
    }

    dealerAutoAddressRequestedRef.current = true;
    void requestCurrentLocation();
  }, [locationLoading, mode, requestCurrentLocation, role, signupAddress, signupEmail, signupStep]);

  useEffect(() => {
    if (
      mode !== 'signup' ||
      role !== 'electrician' ||
      signupStep !== 'address' ||
      signupAddress.trim() ||
      locationLoading ||
      electricianAddressAutoRequestedRef.current
    ) {
      return;
    }

    electricianAddressAutoRequestedRef.current = true;
    void requestCurrentLocation();
  }, [locationLoading, mode, requestCurrentLocation, role, signupAddress, signupStep]);

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
    if (
      mode !== 'signup' ||
      role !== 'electrician' ||
      signupStep !== 'address' ||
      !locationMessage ||
      signupAddress.trim().length < 5 ||
      electricianDealerAutoAdvanceRef.current
    ) {
      return;
    }

    electricianDealerAutoAdvanceRef.current = true;
    const timer = setTimeout(() => setSignupStep('dealer'), 250);
    return () => clearTimeout(timer);
  }, [locationMessage, mode, role, signupAddress, signupStep]);

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

  const scrollToForm = () =>
    setTimeout(() => {
      // Scroll enough so the focused field clears the keyboard.
      // Use keyboard height if available, otherwise fall back to a safe offset.
      const kbHeight = keyboardHeightRef.current || 320;
      const safeY = Math.max(height - kbHeight - 120, 160);
      scrollRef.current?.scrollTo({ y: safeY, animated: true });
    }, 150);
  const handleName = (setter: (value: string) => void) => (value: string) =>
    setter(value.replace(/[^A-Za-z ]/g, ''));
  const dismissKeyboard = () => {
    Keyboard.dismiss();
    [
      loginPhoneRef,
      loginOtpRef,
      loginPassRef,
      signupDealerRef,
      signupAddressRef,
      signupPhoneRef,
      signupOtpRef,
      signupStateRef,
      signupCityRef,
      signupPincodeRef,
      signupGstNumberRef,
      signupPanNumberRef,
      signupGstHolderRef,
      signupPanHolderRef,
      signupPassRef,
      signupConfirmPassRef,
    ].forEach((ref) => ref.current?.blur());
  };

  const resetForm = () => {
    dealerAutoAddressRequestedRef.current = false;
    electricianAddressAutoRequestedRef.current = false;
    electricianPhoneAutoRequestedRef.current = false;
    electricianDealerAutoAdvanceRef.current = false;
    setErrors({});
    setLoading(false);
    setShowPassword(false);
    setAuthSelectionOpen(false);
    setElectricianLoginMethod(null);
    setDealerLoginMethod(null);
    setLoginPhone('');
    setLoginOtp('');
    setLoginPass('');
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
    setSignupPass('');
    setSignupConfirmPass('');
    setSignupStep('name');
    setDealerVerified(false);
    setVerifiedDealerName('');
    setVerifiedDealerCode('');
    setVerifiedDealerNextSerial('001');
    setLocationLoading(false);
    setLocationMessage('');
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
      case 'password':
        return 'holders';
      default:
        return null;
    }
  };
  const goToPreviousDealerSignupStep = () => {
    const previousStep = previousDealerSignupStep(signupStep);
    if (!previousStep) return;
    dismissKeyboard();
    setSignupStep(previousStep);
  };
  const previousElectricianSignupStep = (step: SignupStep): SignupStep | null => {
    switch (step) {
      case 'phone':
        return 'name';
      case 'otp':
        return 'phone';
      case 'address':
        return 'otp';
      case 'dealer':
        return 'address';
      case 'password':
        return 'dealer';
      default:
        return null;
    }
  };
  const goToPreviousElectricianSignupStep = () => {
    const previousStep = previousElectricianSignupStep(signupStep);
    if (!previousStep) return;
    dismissKeyboard();
    setSignupStep(previousStep);
  };
  const isValidPassword = (pass: string) => {
    if (pass.length === 0) return true;
    if (pass.length < 8) return false;
    if (!/[A-Z]/.test(pass)) return false;
    if (!/[0-9]/.test(pass)) return false;
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) return false;
    if (/\s/.test(pass)) return false;
    return true;
  };

  const getPasswordError = (pass: string) => {
    if (pass.length === 0) return '';
    if (pass.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(pass)) return 'Password must contain at least one capital letter.';
    if (!/[0-9]/.test(pass)) return 'Password must contain at least one number.';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass))
      return 'Password must contain at least one special character.';
    if (/\s/.test(pass)) return 'Password must not contain spaces.';
    return '';
  };

  const signupPasswordReady =
    (signupPass.length === 0 && signupConfirmPass.length === 0) ||
    (isValidPassword(signupPass) && signupConfirmPass === signupPass);

  const canContinue = useMemo(() => {
    if (mode === 'login') {
      if (role === 'electrician') {
        if (electricianLoginMethod === 'otp')
          return loginPhone.length === 10 && loginOtp.length === 4 && loginOtpVerified;
        if (electricianLoginMethod === 'password')
          return loginPhone.length === 10 && loginStep === 'password' && loginPass.length >= 8;
        return false;
      }
      if (role === 'dealer') {
        if (dealerLoginMethod === 'otp')
          return loginPhone.length === 10 && loginOtp.length === 4 && loginOtpVerified;
        if (dealerLoginMethod === 'password')
          return loginPhone.length === 10 && loginStep === 'password' && loginPass.length >= 8;
        return false;
      }
      if (role === 'counterboy') {
        if (dealerLoginMethod === 'otp')
          return loginPhone.length === 10 && loginOtp.length === 4 && loginOtpVerified;
        if (dealerLoginMethod === 'password')
          return loginPhone.length === 10 && loginStep === 'password' && loginPass.length >= 8;
        return false;
      }
      return loginPhone.length === 10 && loginOtp.length === 4 && loginPass.length >= 8;
    }
    if (role === 'dealer') {
      return (
        signupName.trim().length >= 3 &&
        signupAddress.trim().length >= 5 &&
        signupState.trim().length >= 2 &&
        signupCity.trim().length >= 2 &&
        signupPincode.trim().length >= 4 &&
        signupPhone.length === 10 &&
        signupOtpVerified &&
        signupPasswordReady &&
        signupTermsAgreed
      );
    }
    if (role === 'counterboy') {
      return (
        signupName.trim().length >= 3 &&
        signupAddress.trim().length >= 5 &&
        signupPhone.length === 10 &&
        signupOtpVerified &&
        signupPasswordReady &&
        signupTermsAgreed
      );
    }
    return (
      signupName.trim().length >= 3 &&
      dealerVerified &&
      signupAddress.trim().length >= 5 &&
      signupPhone.length === 10 &&
      signupOtpVerified &&
      signupPasswordReady &&
      signupTermsAgreed
    );
  }, [
    dealerLoginMethod,
    dealerVerified,
    electricianLoginMethod,
    loginOtp,
    loginOtpVerified,
    loginPass,
    loginPhone,
    loginStep,
    mode,
    role,
    signupAddress,
    signupCity,
    signupName,
    signupOtpVerified,
    signupPasswordReady,
    signupPincode,
    signupPhone,
    signupState,
    signupTermsAgreed,
  ]);
  const dealerSignupContent =
    role === 'dealer' ? (dealerSignupMeta[signupStep] ?? dealerSignupMeta.name) : null;

  const submitAuth = async () => {
    dismissKeyboard();
    if (mode === 'login') {
      if (role === 'electrician') {
        if (electricianLoginMethod === 'otp') {
          if (!loginOtpVerified)
            return setError('loginOtp', 'Please verify the OTP before logging in.');
          setError('loginOtp');
        }
        if (electricianLoginMethod === 'password') {
          if (loginPass.length < 8)
            return setError('loginPass', 'Password must be at least 8 characters long.');
          setError('loginPass');
        }
        if (!electricianLoginMethod) return setError('loginMode', 'Please choose a login option.');
      } else if (role === 'dealer') {
        if (dealerLoginMethod === 'otp') {
          if (!loginOtpVerified)
            return setError('loginOtp', 'Please verify the OTP before logging in.');
          setError('loginOtp');
        }
        if (dealerLoginMethod === 'password') {
          if (loginPass.length < 8)
            return setError('loginPass', 'Password must be at least 8 characters long.');
          setError('loginPass');
        }
        if (!dealerLoginMethod) return setError('loginMode', 'Please choose a login option.');
      } else if (role === 'counterboy') {
        if (dealerLoginMethod === 'otp') {
          if (!loginOtpVerified)
            return setError('loginOtp', 'Please verify the OTP before logging in.');
          setError('loginOtp');
        }
        if (dealerLoginMethod === 'password') {
          if (loginPass.length < 8)
            return setError('loginPass', 'Password must be at least 8 characters long.');
          setError('loginPass');
        }
        if (!dealerLoginMethod) return setError('loginMode', 'Please choose a login option.');
      }
    }
    if (mode === 'signup' && role === 'dealer') {
      if (signupPhone.length !== 10)
        return setError('signupPhone', 'Please enter a valid 10-digit mobile number.');
      if (!signupOtpVerified)
        return setError('signupOtp', 'Please verify the OTP before creating your account.');
      setError('signupPhone');
      setError('signupOtp');
    }
    if (mode === 'signup' && (signupPass.length > 0 || signupConfirmPass.length > 0)) {
      if (signupPass.length < 8)
        return setError('signupPass', 'Password must be at least 8 characters long.');
      if (signupConfirmPass !== signupPass)
        return setError(
          'signupConfirmPass',
          'Passwords do not match. Please re-enter the same password.'
        );
    }
    setError('loginPass');
    setError('loginMode');
    setError('signupPass');
    setError('signupConfirmPass');
    setLoading(true);

    const finishLogin = (resolvedUser?: unknown) => {
      if (resolvedUser) {
        (globalThis as any).__srvLoginUser = resolvedUser;
      }
      const passwordConfigured =
        mode === 'signup'
          ? signupPass.length >= 8
          : role === 'dealer' || role === 'counterboy'
            ? true
            : electricianLoginMethod === 'password'
              ? true
              : undefined;
      const passwordValue =
        mode === 'signup'
          ? signupPass.length >= 8 ? signupPass : ''
          : loginPass.length >= 8 ? loginPass : undefined;
      onGetStarted(
        role,
        typeof passwordConfigured === 'boolean'
          ? { passwordConfigured, passwordValue }
          : typeof passwordValue === 'string'
            ? { passwordValue }
            : undefined
      );
    };

    try {
      if (mode === 'login') {
        if (
          (role === 'electrician' && electricianLoginMethod === 'password') ||
          ((role === 'dealer' || role === 'counterboy') && dealerLoginMethod === 'password')
        ) {
          const res = await authApi.loginWithPassword(loginPhone, role, loginPass);
          finishLogin(res.user);
          return;
        }

        // OTP login: token/user already saved during OTP verification.
        finishLogin((globalThis as any).__srvLoginUser);
        return;
      }

      if (role === 'dealer') {
        const res = await authApi.registerDealer({
          name: signupName.trim(),
          phone: signupPhone,
          email: sanitizeEmailInput(signupEmail).trim() || undefined,
          town: signupCity.trim(),
          district: signupCity.trim(),
          state: signupState.trim(),
          address: signupAddress.trim(),
          pincode: signupPincode.trim() || undefined,
          gstNumber: normalizeGstOrPanNumber(signupGstNumber) || undefined,
          password: signupPass.trim() || undefined,
        });
        finishLogin(res.user);
        return;
      }

      if (role === 'counterboy') {
        const res = await authApi.registerCounterBoy({
          name: signupName.trim(),
          phone: signupPhone,
          email: sanitizeEmailInput(signupEmail).trim() || undefined,
          city: signupCity.trim() || undefined,
          district: signupCity.trim() || undefined,
          state: signupState.trim() || undefined,
          address: signupAddress.trim(),
          pincode: signupPincode.trim() || undefined,
          password: signupPass.trim() || undefined,
        });
        finishLogin(res.user);
        return;
      }

      const res = await authApi.registerElectrician({
        name: signupName.trim(),
        phone: signupPhone,
        email: sanitizeEmailInput(signupEmail).trim() || undefined,
        city: signupCity.trim(),
        district: signupCity.trim(),
        state: signupState.trim(),
        address: signupAddress.trim() || undefined,
        pincode: signupPincode.trim() || undefined,
        dealerPhone: signupDealerPhone,
        dealerCode: verifiedDealerCode || undefined,
        electricianCode: verifiedDealerCode
          ? `${verifiedDealerCode}-${verifiedDealerNextSerial}`
          : undefined,
        password: signupPass.trim() || undefined,
      });
      finishLogin(res.user);
    } catch (err: any) {
      const message = err?.message || tx('Something went wrong. Please try again.');
      if (mode === 'login') {
        if (
          (role === 'electrician' && electricianLoginMethod === 'password') ||
          ((role === 'dealer' || role === 'counterboy') && dealerLoginMethod === 'password')
        ) {
          setError('loginPass', message);
        } else {
          setError('loginOtp', message);
        }
      } else if (message.toLowerCase().includes('otp')) {
        setError('signupOtp', message);
      } else if (role === 'electrician' && message.toLowerCase().includes('dealer')) {
        setError('signupDealerPhone', message);
      } else {
        setError('signupPhone', message);
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

    const doSendOtp = (userRole: 'electrician' | 'dealer' | 'counterboy') => {
      setLoading(true);
      authApi.sendOtp(loginPhone, userRole)
        .then((res) => {
          setLoginOtpCountdown(50);
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

    if (role === 'electrician') {
      if (!electricianLoginMethod) return setError('loginMode', 'Please choose a login option.');
      setError('loginMode');
      setLoginOtp('');
      setLoginPass('');
      setLoginOtpVerified(false);
      if (electricianLoginMethod === 'otp') {
        doSendOtp('electrician');
      } else {
        setLoginStep('password');
      }
      return;
    }
    if (role === 'dealer') {
      if (!dealerLoginMethod) return setError('loginMode', 'Please choose a login option.');
      setError('loginMode');
      setLoginOtp('');
      setLoginPass('');
      setLoginOtpVerified(false);
      if (dealerLoginMethod === 'otp') {
        doSendOtp('dealer');
      } else {
        setLoginStep('password');
      }
      return;
    }
    if (role === 'counterboy') {
      if (!dealerLoginMethod) return setError('loginMode', 'Please choose a login option.');
      setError('loginMode');
      setLoginOtp('');
      setLoginPass('');
      setLoginOtpVerified(false);
      if (dealerLoginMethod === 'otp') {
        doSendOtp('counterboy');
      } else {
        setLoginStep('password');
      }
      return;
    }
    setLoginStep('otp');
  };

  const verifyLoginOtp = () => {
    dismissKeyboard();
    if (loginOtp.length !== 4) return setError('loginOtp', 'Enter the 4-digit OTP to continue.');
    setError('loginOtp');
    setLoading(true);
    authApi.verifyOtp(loginPhone, role, loginOtp)
      .then((res) => {
        setLoginOtpVerified(true);
        (globalThis as any).__srvLoginUser = res.user;
      })
      .catch((err: Error) => {
        setError('loginOtp', err.message || 'Invalid OTP. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  const verifyDealer = () => {
    dismissKeyboard();
    if (signupDealerPhone.length !== 10)
      return setError('signupDealerPhone', 'Enter a valid 10-digit dealer number.');
    if (role === 'electrician' && signupPhone === signupDealerPhone) {
      return setError(
        'signupDealerPhone',
        tx('Dealer number cannot be same as your phone number. Please enter a different dealer number.')
      );
    }
    setError('signupDealerPhone');
    setLoading(true);
    dealerApi.getByPhone(signupDealerPhone)
      .then((dealer) => {
        const resolvedDealerName =
          dealer.businessName?.trim() ||
          dealer.contactPerson?.trim() ||
          dealer.name?.trim() ||
          '';
        setDealerVerified(true);
        setVerifiedDealerName(resolvedDealerName);
        setVerifiedDealerCode(dealer.dealerCode ?? '');
        const nextSerial = Number(
          dealer.nextElectricianSerial ??
          ((dealer.electricianCount ?? 0) + 1)
        );
        setVerifiedDealerNextSerial(String(nextSerial).padStart(3, '0'));
      })
      .catch((err: Error) => {
        setError(
          'signupDealerPhone',
          err.message || 'Dealer not found. Please check the number and try again.'
        );
      })
      .finally(() => setLoading(false));
  };

  const sendSignupOtp = () => {
    dismissKeyboard();
    if (signupPhone.length !== 10)
      return setError('signupPhone', 'Please enter a valid 10-digit mobile number.');
    setError('signupPhone');
    setError('signupOtp');
    setSignupOtp('');
    setSignupOtpVerified(false);
    setLoading(true);
    authApi
      .sendSignupOtp(signupPhone, role)
      .then((res) => {
        setSignupOtpSent(true);
        setSignupOtpCountdown(50);
        if (res.devOtp) {
          setError('signupPhone', `Dev OTP: ${res.devOtp}`);
        }
        if (role === 'electrician' || role === 'counterboy') setSignupStep('otp');
      })
      .catch((err: Error) => {
        setError('signupPhone', err.message || 'Could not send OTP. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  const verifySignupOtp = () => {
    dismissKeyboard();
    if (!signupOtpSent) return setError('signupOtp', 'Please verify your mobile number first.');
    if (signupOtp.length !== 4)
      return setError('signupOtp', 'Enter the 4-digit OTP to verify your number.');
    setError('signupOtp');
    setLoading(true);
    authApi
      .verifySignupOtp(signupPhone, role, signupOtp)
      .then(() => {
        setSignupOtpVerified(true);
        setSignupStep(role === 'electrician' || role === 'counterboy' ? 'address' : 'password');
      })
      .catch((err: Error) => {
        setError('signupOtp', err.message || 'Invalid OTP. Please try again.');
      })
      .finally(() => setLoading(false));
  };

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
        if (signupAddress.trim().length < 5)
          return setError('signupAddress', 'Please fill the address field.');
        setError('signupName');
        setError('signupEmail');
        setError('signupAddress');
        setSignupStep('location');
        return;
      }

      if (signupStep === 'location') {
        if (signupState.trim().length < 2) return setError('signupState', 'Please enter state.');
        if (signupCity.trim().length < 2) return setError('signupCity', 'Please enter city.');
        if (signupPincode.trim().length < 4)
          return setError('signupPincode', 'Please enter a valid pincode.');
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
        if (!signupOtpVerified) {
          verifySignupOtp();
          return;
        }
        setSignupStep('password');
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
      if (signupAddress.trim().length < 5)
        return setError('signupAddress', 'Please fill the address field.');
      setError('signupAddress');
      setSignupStep(role === 'electrician' ? 'dealer' : 'password');
      return;
    }
    if (signupStep === 'dealer') {
      if (!dealerVerified)
        return setError('signupDealerPhone', 'Please verify the dealer number before continuing.');
      setError('signupDealerPhone');
      setSignupStep('password');
      return;
    }
    if (signupStep === 'otp') {
      verifySignupOtp();
    }
  };

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
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View style={s.dismissSurface}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={[
                s.content,
                {
                  paddingTop:
                    phase === 'auth'
                      ? keyboardVisible
                        ? insets.top + 8
                        : insets.top + 14
                      : insets.top + 18,
                  paddingBottom:
                    phase === 'auth'
                      ? keyboardVisible
                        ? insets.bottom + 320
                        : insets.bottom + 72
                      : insets.bottom + 40,
                },
                phase !== 'auth' ? s.contentRole : null,
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              scrollEnabled={true}
              bounces={false}
              overScrollMode="never"
              automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
              onScrollBeginDrag={dismissKeyboard}
            >
              <Animated.View style={[reveal, phase !== 'auth' ? s.revealRole : null]}>
                <View
                  style={[
                    s.topRow,
                    isCompactPhone || (phase === 'auth' && keyboardVisible) ? s.topRowCompact : null,
                    phase === 'auth' ? s.topRowAuth : null,
                    phase === 'auth' && keyboardVisible ? s.topRowAuthKeyboard : null,
                  ]}
                >
                  <View style={[s.brandRow, s.brandRowCentered]}>
                    <View style={[s.logoWrap, isCompactPhone ? s.logoWrapCompact : null]}>
                      <Image
                        source={{ uri: SRV_LOGO_URI }}
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
                    phase === 'auth' && keyboardVisible ? s.welcomeRowAuthHidden : null,
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
                    phase === 'auth' && keyboardVisible ? s.subtextAuthHidden : null,
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
                            ? tx('Choose a secure login method and continue with your account.')
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
                        {role === 'electrician' ? (
                          <>
                            <View style={s.loginChoiceRow}>
                              <Pressable
                                onPress={() => {
                                  setElectricianLoginMethod('otp');
                                  setLoginStep('phone');
                                  setLoginOtp('');
                                  setLoginPass('');
                                  setLoginOtpVerified(false);
                                  setError('loginMode');
                                  setError('loginOtp');
                                  setError('loginPass');
                                }}
                                style={[
                                  s.loginChoiceCard,
                                  electricianLoginMethod === 'otp' ? s.loginChoiceCardActive : null,
                                  darkMode && electricianLoginMethod !== 'otp' ? { backgroundColor: '#1E293B', borderColor: '#334155' } : null,
                                ]}
                                testID="onboarding-login-method-otp"
                              >
                                <Text
                                  style={[
                                    s.loginChoiceText,
                                    electricianLoginMethod === 'otp'
                                      ? s.loginChoiceTextActive
                                      : null,
                                  ]}
                                >
                                  {tx('Login with OTP')}
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => {
                                  setElectricianLoginMethod('password');
                                  setLoginStep('password');
                                  setLoginOtp('');
                                  setLoginPass('');
                                  setLoginOtpVerified(false);
                                  setError('loginMode');
                                  setError('loginPhone');
                                  setError('loginOtp');
                                  setError('loginPass');
                                }}
                                style={[
                                  s.loginChoiceCard,
                                  electricianLoginMethod === 'password'
                                    ? s.loginChoiceCardActive
                                    : null,
                                ]}
                              >
                                <Text
                                  style={[
                                    s.loginChoiceText,
                                    electricianLoginMethod === 'password'
                                      ? s.loginChoiceTextActive
                                      : null,
                                  ]}
                                >
                                  {tx('Login with Password')}
                                </Text>
                              </Pressable>
                            </View>
                            {errors.loginMode ? (
                              <Info text={errors.loginMode} kind="error" />
                            ) : null}
                            {electricianLoginMethod ? (
                              <>
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
                                  onSubmitEditing={
                                    electricianLoginMethod === 'otp'
                                      ? continueLoginPhone
                                      : undefined
                                  }
                                  actionLabel={
                                    electricianLoginMethod === 'otp' && loginStep === 'phone'
                                      ? tx('Verify')
                                      : undefined
                                  }
                                  onActionPress={
                                    electricianLoginMethod === 'otp'
                                      ? continueLoginPhone
                                      : undefined
                                  }
                                  inputTestID="onboarding-login-phone-input"
                                  actionTestID="onboarding-login-phone-verify"
                                  actionDisabled={
                                    electricianLoginMethod === 'otp'
                                      ? loginPhone.length !== 10
                                      : undefined
                                  }
                                  maxLength={10}
                                />
                                {electricianLoginMethod === 'otp' && loginStep !== 'phone' ? (
                                  <Field
                                    label={tx('OTP')}
                                    value={loginOtp}
                                    onChangeText={handleOtp(setLoginOtp)}
                                    placeholder={tx('Enter 4 digit OTP')}
                                    keyboardType="numeric"
                                    error={errors.loginOtp}
                                    onFocus={scrollToForm}
                                    inputRef={loginOtpRef}
                                    onSubmitEditing={verifyLoginOtp}
                                    actionLabel={
                                      loginOtpCountdown > 0
                                        ? `0:${loginOtpCountdown >= 10 ? loginOtpCountdown : `0${loginOtpCountdown}`}`
                                        : tx('Resend')
                                    }
                                    onActionPress={
                                      loginOtpCountdown === 0 ? continueLoginPhone : undefined
                                    }
                                    inputTestID="onboarding-login-otp-input"
                                    actionDisabled={loginOtpCountdown > 0}
                                  />
                                ) : null}
                                {electricianLoginMethod === 'otp' &&
                                loginStep !== 'phone' &&
                                !loginOtpVerified ? (
                                  <Button
                                    label={tx('Verify OTP')}
                                    onPress={verifyLoginOtp}
                                    disabled={loginOtp.length !== 4}
                                    testID="onboarding-login-verify-otp"
                                    colors={['#173E80', '#355C95']}
                                    shadowColor="#173E80"
                                  />
                                ) : null}
                                {electricianLoginMethod === 'otp' && loginOtpVerified ? (
                                  <Info text={tx('OTP verified successfully.')} kind="success" />
                                ) : null}
                                {electricianLoginMethod === 'otp' && loginOtpVerified ? (
                                  <Button
                                    label={loading ? tx('Logging In...') : tx('Login')}
                                    onPress={submitAuth}
                                    disabled={!canContinue || loading}
                                    testID="onboarding-login-submit"
                                    colors={['#173E80', '#355C95']}
                                    shadowColor="#173E80"
                                  />
                                ) : null}
                                {electricianLoginMethod === 'password' &&
                                loginStep === 'password' ? (
                                  <Field
                                    label={tx('Password')}
                                    value={loginPass}
                                    onChangeText={setLoginPass}
                                    placeholder={tx('Enter password')}
                                    secureTextEntry={!showPassword}
                                    error={errors.loginPass}
                                    onFocus={scrollToForm}
                                    inputRef={loginPassRef}
                                    actionContent={<EyeIcon open={showPassword} />}
                                    onActionPress={() => setShowPassword((current) => !current)}
                                  />
                                ) : null}
                                {electricianLoginMethod === 'password' &&
                                loginStep === 'password' ? (
                                  <Button
                                    label={loading ? tx('Logging In...') : tx('Login')}
                                    onPress={submitAuth}
                                    disabled={!canContinue || loading}
                                    colors={['#173E80', '#355C95']}
                                    shadowColor="#173E80"
                                  />
                                ) : null}
                              </>
                            ) : null}
                          </>
                        ) : (
                          <>
                            <View style={s.loginChoiceRow}>
                              <Pressable
                                onPress={() => {
                                  setDealerLoginMethod('otp');
                                  setLoginStep('phone');
                                  setLoginOtp('');
                                  setLoginPass('');
                                  setLoginOtpVerified(false);
                                  setError('loginMode');
                                  setError('loginOtp');
                                  setError('loginPass');
                                }}
                                style={[
                                  s.loginChoiceCard,
                                  dealerLoginMethod === 'otp' ? s.loginChoiceCardActive : null,
                                ]}
                                testID="onboarding-login-method-otp"
                              >
                                <Text
                                  style={[
                                    s.loginChoiceText,
                                    dealerLoginMethod === 'otp' ? s.loginChoiceTextActive : null,
                                  ]}
                                >
                                  {tx('Login with OTP')}
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => {
                                  setDealerLoginMethod('password');
                                  setLoginStep('password');
                                  setLoginOtp('');
                                  setLoginPass('');
                                  setLoginOtpVerified(false);
                                  setError('loginMode');
                                  setError('loginPhone');
                                  setError('loginOtp');
                                  setError('loginPass');
                                }}
                                style={[
                                  s.loginChoiceCard,
                                  dealerLoginMethod === 'password' ? s.loginChoiceCardActive : null,
                                ]}
                              >
                                <Text
                                  style={[
                                    s.loginChoiceText,
                                    dealerLoginMethod === 'password'
                                      ? s.loginChoiceTextActive
                                      : null,
                                  ]}
                                >
                                  {tx('Login with Password')}
                                </Text>
                              </Pressable>
                            </View>
                            {errors.loginMode ? (
                              <Info text={errors.loginMode} kind="error" />
                            ) : null}
                            {dealerLoginMethod ? (
                              <>
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
                                  onSubmitEditing={
                                    dealerLoginMethod === 'otp' ? continueLoginPhone : undefined
                                  }
                                  actionLabel={
                                    dealerLoginMethod === 'otp' && loginStep === 'phone'
                                      ? tx('Verify')
                                      : undefined
                                  }
                                  onActionPress={
                                    dealerLoginMethod === 'otp' ? continueLoginPhone : undefined
                                  }
                                  inputTestID="onboarding-login-phone-input"
                                  actionTestID="onboarding-login-phone-verify"
                                  actionDisabled={
                                    dealerLoginMethod === 'otp'
                                      ? loginPhone.length !== 10
                                      : undefined
                                  }
                                  maxLength={10}
                                />
                                {dealerLoginMethod === 'otp' && loginStep !== 'phone' ? (
                                  <Field
                                    label={tx('OTP')}
                                    value={loginOtp}
                                    onChangeText={handleOtp(setLoginOtp)}
                                    placeholder={tx('Enter 4 digit OTP')}
                                    keyboardType="numeric"
                                    error={errors.loginOtp}
                                    onFocus={scrollToForm}
                                    inputRef={loginOtpRef}
                                    onSubmitEditing={verifyLoginOtp}
                                    actionLabel={
                                      loginOtpCountdown > 0
                                        ? `0:${loginOtpCountdown >= 10 ? loginOtpCountdown : `0${loginOtpCountdown}`}`
                                        : tx('Resend')
                                    }
                                    onActionPress={
                                      loginOtpCountdown === 0 ? continueLoginPhone : undefined
                                    }
                                    inputTestID="onboarding-login-otp-input"
                                    actionDisabled={loginOtpCountdown > 0}
                                  />
                                ) : null}
                                {dealerLoginMethod === 'otp' &&
                                loginStep !== 'phone' &&
                                !loginOtpVerified ? (
                                  <Button
                                    label={tx('Verify OTP')}
                                    onPress={verifyLoginOtp}
                                    disabled={loginOtp.length !== 4}
                                    testID="onboarding-login-verify-otp"
                                    secondary
                                  />
                                ) : null}
                                {dealerLoginMethod === 'otp' && loginOtpVerified ? (
                                  <Info text={tx('OTP verified successfully.')} kind="success" />
                                ) : null}
                                {dealerLoginMethod === 'otp' && loginOtpVerified ? (
                                  <Button
                                    label={loading ? tx('Logging In...') : tx('Login')}
                                    onPress={submitAuth}
                                    disabled={!canContinue || loading}
                                    testID="onboarding-login-submit"
                                  />
                                ) : null}
                                {dealerLoginMethod === 'password' && loginStep === 'password' ? (
                                  <Field
                                    label={tx('Password')}
                                    value={loginPass}
                                    onChangeText={setLoginPass}
                                    placeholder={tx('Enter password')}
                                    secureTextEntry={!showPassword}
                                    error={errors.loginPass}
                                    onFocus={scrollToForm}
                                    inputRef={loginPassRef}
                                    actionContent={<EyeIcon open={showPassword} />}
                                    onActionPress={() => setShowPassword((current) => !current)}
                                  />
                                ) : null}
                                {dealerLoginMethod === 'password' && loginStep === 'password' ? (
                                  <Button
                                    label={loading ? tx('Logging In...') : tx('Login')}
                                    onPress={submitAuth}
                                    disabled={!canContinue || loading}
                                  />
                                ) : null}
                              </>
                            ) : null}
                          </>
                        )}
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
                                  onSubmitEditing={() => scrollToForm()}
                                />
                                <Field
                                  label={tx('Email Address (Optional)')}
                                  value={signupEmail}
                                  onChangeText={handleSignupEmail}
                                  placeholder="name@business.com"
                                  error={errors.signupEmail}
                                  onFocus={scrollToForm}
                                  returnKeyType="next"
                                  blurOnSubmit={false}
                                  onSubmitEditing={() => scrollToForm()}
                                />
                                <Field
                                  label={tx('Business Address')}
                                  value={signupAddress}
                                  onChangeText={(value) => {
                                    setSignupAddress(value);
                                    setLocationMessage('');
                                    setError('signupAddress');
                                  }}
                                  placeholder={
                                    locationLoading
                                      ? tx('Fetching current address...')
                                      : tx('Enter complete business address')
                                  }
                                  error={errors.signupAddress}
                                  onFocus={scrollToForm}
                                  inputRef={signupAddressRef}
                                  onSubmitEditing={continueSignup}
                                  actionLabel={
                                    locationLoading ? tx('Locating') : tx('Current Address')
                                  }
                                  onActionPress={() => {
                                    void requestCurrentLocation();
                                  }}
                                  actionDisabled={locationLoading}
                                />
                                {locationMessage ? (
                                  <Info text={locationMessage} kind="success" />
                                ) : null}
                                <Button
                                  label={dealerSignupContent?.buttonLabel ?? tx('Continue')}
                                  onPress={continueSignup}
                                  disabled={
                                    signupName.trim().length < 3 || signupAddress.trim().length < 5
                                  }
                                  secondary
                                />
                              </>
                            ) : null}

                            {signupStep === 'location' ? (
                              <>
                                <Field
                                  label={tx('State')}
                                  value={signupState}
                                  onChangeText={handleName(setSignupState)}
                                  placeholder={tx('State')}
                                  error={errors.signupState}
                                  onFocus={scrollToForm}
                                  inputRef={signupStateRef}
                                  returnKeyType="next"
                                  blurOnSubmit={false}
                                  onSubmitEditing={() => signupCityRef.current?.focus()}
                                />
                                <Field
                                  label={tx('City')}
                                  value={signupCity}
                                  onChangeText={handleName(setSignupCity)}
                                  placeholder={tx('City')}
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
                                  onChangeText={(value) =>
                                    setSignupPincode(value.replace(/\D/g, '').slice(0, 6))
                                  }
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
                                  disabled={
                                    signupState.trim().length < 2 ||
                                    signupCity.trim().length < 2 ||
                                    signupPincode.trim().length < 4
                                  }
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
                                    error={errors.signupOtp}
                                    onFocus={scrollToForm}
                                    inputRef={signupOtpRef}
                                    onSubmitEditing={verifySignupOtp}
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
                                {signupOtpSent && !signupOtpVerified ? (
                                  <Button
                                    label={tx('Verify OTP')}
                                    onPress={verifySignupOtp}
                                    disabled={signupOtp.length !== 4}
                                    secondary
                                  />
                                ) : null}
                              </>
                            ) : null}

                            {signupStep === 'password' ? (
                              <>
                                {signupOtpVerified ? (
                                  <Info
                                    text={tx('Phone verification successful.')}
                                    kind="success"
                                  />
                                ) : null}
                                <Text style={s.helperText}>
                                  {tx(
                                    'Password is optional. Leave both fields blank if you want to skip it.'
                                  )}
                                </Text>
                                <Field
                                  label={tx('Password (Optional)')}
                                  value={signupPass}
                                  onChangeText={(value) => {
                                    setSignupPass(value);
                                    setError('signupPass', getPasswordError(value));
                                  }}
                                  placeholder={tx('Create password if you want')}
                                  secureTextEntry={!showPassword}
                                  error={getPasswordError(signupPass)}
                                  onFocus={scrollToForm}
                                  inputRef={signupPassRef}
                                  returnKeyType="next"
                                  blurOnSubmit={false}
                                  onSubmitEditing={() => signupConfirmPassRef.current?.focus()}
                                  actionContent={<EyeIcon open={showPassword} />}
                                  onActionPress={() => setShowPassword((current) => !current)}
                                />
                                <Field
                                  label={tx('Confirm Password (Optional)')}
                                  value={signupConfirmPass}
                                  onChangeText={(value) => {
                                    setSignupConfirmPass(value);
                                    if (signupPass.length > 0 && value !== signupPass) {
                                      setError('signupConfirmPass', 'Passwords do not match.');
                                    } else {
                                      setError('signupConfirmPass');
                                    }
                                  }}
                                  placeholder={tx('Re-enter password')}
                                  secureTextEntry={!showPassword}
                                  error={errors.signupConfirmPass}
                                  onFocus={scrollToForm}
                                  inputRef={signupConfirmPassRef}
                                  actionContent={<EyeIcon open={showPassword} />}
                                  onActionPress={() => setShowPassword((current) => !current)}
                                />
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
                              <Field
                                label={tx('Address')}
                                value={signupAddress}
                                onChangeText={(value) => {
                                  setSignupAddress(value);
                                  setLocationMessage('');
                                  setError('signupAddress');
                                }}
                                placeholder={
                                  locationLoading
                                    ? tx('Fetching current address...')
                                    : tx('Enter your complete address')
                                }
                                error={errors.signupAddress}
                                onFocus={scrollToForm}
                                inputRef={signupAddressRef}
                                onSubmitEditing={continueSignup}
                                actionLabel={
                                  locationLoading ? tx('Locating') : tx('Current Address')
                                }
                                onActionPress={() => {
                                  void requestCurrentLocation();
                                }}
                                actionDisabled={locationLoading}
                              />
                            ) : null}
                            {signupStep === 'address' && locationMessage ? (
                              <Info text={locationMessage} kind="success" />
                            ) : null}
                            {['address', 'dealer', 'otp', 'password'].includes(signupStep) &&
                            (signupState || signupCity || signupPincode) ? (
                              <View style={s.locationSummaryCard}>
                                <Text style={s.locationSummaryTitle}>
                                  {tx('Detected Location Details')}
                                </Text>
                                {signupState ? (
                                  <View style={s.locationRow}>
                                    <Text style={s.locationKey}>{tx('State')}</Text>
                                    <Text style={s.locationValue}>{signupState}</Text>
                                  </View>
                                ) : null}
                                {signupCity ? (
                                  <View style={s.locationRow}>
                                    <Text style={s.locationKey}>{tx('City')}</Text>
                                    <Text style={s.locationValue}>{signupCity}</Text>
                                  </View>
                                ) : null}
                                {signupPincode ? (
                                  <View style={s.locationRow}>
                                    <Text style={s.locationKey}>{tx('Pincode')}</Text>
                                    <Text style={s.locationValue}>{signupPincode}</Text>
                                  </View>
                                ) : null}
                              </View>
                            ) : null}
                            {signupStep === 'address' ? (
                              <Button
                                label={tx('Continue')}
                                onPress={continueSignup}
                                disabled={signupAddress.trim().length < 5 || locationLoading}
                                secondary
                              />
                            ) : null}

                            {signupStep === 'dealer' ? (
                              <Field
                                label={tx('Dealer Verification Number')}
                                value={signupDealerPhone}
                                onChangeText={(value) => {
                                  handlePhone(setSignupDealerPhone)(value);
                                  setDealerVerified(false);
                                  setVerifiedDealerName('');
                                  setVerifiedDealerCode('');
                                  setVerifiedDealerNextSerial('001');
                                  setError('signupDealerPhone');
                                }}
                                placeholder={tx('Enter dealer mobile number')}
                                keyboardType="phone-pad"
                                error={errors.signupDealerPhone}
                                onFocus={scrollToForm}
                                inputRef={signupDealerRef}
                                onSubmitEditing={verifyDealer}
                                maxLength={10}
                              />
                            ) : null}
                            {signupStep === 'dealer' ? (
                              <Button
                                label={tx('Verify')}
                                onPress={verifyDealer}
                                disabled={signupDealerPhone.length !== 10}
                                secondary
                              />
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
                              <Button
                                label={tx('Continue')}
                                onPress={continueSignup}
                                disabled={!dealerVerified}
                                secondary
                              />
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
                                error={errors.signupOtp}
                                onFocus={scrollToForm}
                                inputRef={signupOtpRef}
                                onSubmitEditing={verifySignupOtp}
                                actionLabel={
                                  signupOtpCountdown > 0
                                    ? `0:${signupOtpCountdown >= 10 ? signupOtpCountdown : `0${signupOtpCountdown}`}`
                                    : tx('Resend')
                                }
                                onActionPress={signupOtpCountdown === 0 ? sendSignupOtp : undefined}
                                actionDisabled={signupOtpCountdown > 0}
                              />
                            ) : null}
                            {signupStep === 'otp' ? (
                              <Button
                                label={tx('Verify OTP')}
                                onPress={continueSignup}
                                disabled={signupOtp.length !== 4}
                                secondary
                              />
                            ) : null}
                            {signupStep === 'password' ? (
                              <>
                                <Text style={s.helperText}>
                                  {tx(
                                    'Password is optional. Leave both fields blank if you want to skip it.'
                                  )}
                                </Text>
                                <Field
                                  label={tx('Password (Optional)')}
                                  value={signupPass}
                                  onChangeText={(value) => {
                                    setSignupPass(value);
                                    setError('signupPass', getPasswordError(value));
                                  }}
                                  placeholder={tx('Create password if you want')}
                                  secureTextEntry={!showPassword}
                                  error={getPasswordError(signupPass)}
                                  onFocus={scrollToForm}
                                  inputRef={signupPassRef}
                                  returnKeyType="next"
                                  blurOnSubmit={false}
                                  onSubmitEditing={() => signupConfirmPassRef.current?.focus()}
                                  actionContent={<EyeIcon open={showPassword} />}
                                  onActionPress={() => setShowPassword((current) => !current)}
                                />
                                <Field
                                  label={tx('Confirm Password (Optional)')}
                                  value={signupConfirmPass}
                                  onChangeText={(value) => {
                                    setSignupConfirmPass(value);
                                    if (signupPass.length > 0 && value !== signupPass) {
                                      setError('signupConfirmPass', 'Passwords do not match.');
                                    } else {
                                      setError('signupConfirmPass');
                                    }
                                  }}
                                  placeholder={tx('Re-enter password')}
                                  secureTextEntry={!showPassword}
                                  error={errors.signupConfirmPass}
                                  onFocus={scrollToForm}
                                  inputRef={signupConfirmPassRef}
                                  actionContent={<EyeIcon open={showPassword} />}
                                  onActionPress={() => setShowPassword((current) => !current)}
                                />
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
                                <Button
                                  label={loading ? tx('Creating Account...') : tx('Create Account')}
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
                                  colors={['#173E80', '#355C95']}
                                  shadowColor="#173E80"
                                />
                              </>
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

      {showAddressModal ? (
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{tx('Enter Address Manually')}</Text>
              <Pressable onPress={() => setShowAddressModal(false)} style={s.modalClose}>
                <Text style={s.modalCloseText}>X</Text>
              </Pressable>
            </View>
            <View style={s.modalField}>
              <Text style={s.modalLabel}>{tx('City')}</Text>
              <TextInput
                style={s.modalInput}
                value={signupCity}
                onChangeText={(v) => {
                  const t = v.replace(/[^A-Za-z ]/g, '');
                  setSignupCity(t);
                  setSignupAddress(`${t}, ${signupState}, ${signupPincode}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ','));
                }}
                placeholder={tx('Enter city')}
                placeholderTextColor="#90A0BB"
              />
            </View>
            <View style={s.modalField}>
              <Text style={s.modalLabel}>{tx('State')}</Text>
              <TextInput
                style={s.modalInput}
                value={signupState}
                onChangeText={(v) => {
                  const t = v.replace(/[^A-Za-z ]/g, '');
                  setSignupState(t);
                  setSignupAddress(`${signupCity}, ${t}, ${signupPincode}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ','));
                }}
                placeholder={tx('Enter state')}
                placeholderTextColor="#90A0BB"
              />
            </View>
            <View style={s.modalField}>
              <Text style={s.modalLabel}>{tx('Pincode')}</Text>
              <TextInput
                style={s.modalInput}
                value={signupPincode}
                onChangeText={(v) => {
                  const t = v.replace(/\D/g, '').slice(0, 6);
                  setSignupPincode(t);
                  setSignupAddress(`${signupCity}, ${signupState}, ${t}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ','));
                }}
                placeholder={tx('Enter 6-digit pincode')}
                keyboardType="numeric"
                placeholderTextColor="#90A0BB"
              />
            </View>
            <Pressable style={s.modalBtn} onPress={() => setShowAddressModal(false)}>
              <Text style={s.modalBtnText}>{tx('Done')}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.heroA },
  bg: { ...StyleSheet.absoluteFillObject },
  kav: { flex: 1 },
  dismissSurface: { flex: 1 },
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
  topRowAuth: { minHeight: 88, marginBottom: 6, paddingTop: 10 },
  topRowAuthKeyboard: { minHeight: 74, marginBottom: 2, paddingTop: 4 },
  brandRow: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  brandRowCentered: { flexDirection: 'row' },
  logoWrap: { width: 156, height: 88, alignItems: 'center', justifyContent: 'center' },
  logoWrapCompact: { width: 134, height: 76 },
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
  welcomeRowAuth: { marginTop: 2, marginBottom: 10 },
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
  subtextAuth: { maxWidth: '88%', marginBottom: 14, color: '#6B7280' },
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
  locationSummaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7E4F4',
    backgroundColor: '#F7FAFF',
    padding: 12,
    gap: 8,
  },
  locationSummaryTitle: {
    color: C.title,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  locationKey: { flex: 1, color: C.muted2, fontSize: 12, fontWeight: '700' },
  locationValue: { flex: 1, color: C.text, fontSize: 12.5, fontWeight: '800', textAlign: 'right' },
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
  checkboxOn: { backgroundColor: C.primary, borderColor: C.primary },
  checkboxCardActive: { borderColor: C.primary },
  check: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  checkboxText: { flex: 1, color: C.text, fontSize: 12, lineHeight: 19, fontWeight: '500' },
  checkboxLink: { color: C.accentA, fontWeight: '700', textDecorationLine: 'underline' },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    width: '88%',
    maxWidth: 340,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: '900', color: C.title },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F6FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: { fontSize: 14, fontWeight: '800', color: C.muted },
  modalField: { marginBottom: 14 },
  modalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.muted2,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  modalInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8E7FB',
    paddingHorizontal: 14,
    fontSize: 15,
    fontWeight: '600',
    color: C.text,
    backgroundColor: '#F9FBFE',
  },
  modalBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: C.accentA,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  modalBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  otpResendRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4, marginBottom: 8 },
  otpTimer: { color: C.error, fontSize: 12, fontWeight: '800' },
  otpResend: { color: C.accentA, fontSize: 12, fontWeight: '800' },
});
