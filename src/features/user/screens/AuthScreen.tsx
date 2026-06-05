// Customer Auth Screen â€” Role-aware account design
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, Image, KeyboardAvoidingView, Linking, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferenceContext } from '@/shared/preferences';
import { SRV_LOGO_URI } from '@/shared/data/logoBase64';
import { authApi } from '@/shared/api';
import { isValidOptionalEmail, sanitizeEmailInput } from '@/shared/utils/validation';

// Role-based color themes - Customer theme updated
const THEMES = {
  user:        { p1: '#6A2F12', p2: '#8D4A1E', soft: '#FBF1E7', orb: '#F0DEC9' },
  dealer:      { p1: '#D97706', p2: '#F59E0B', soft: '#FEF3C7', orb: '#FDE68A' },
  electrician: { p1: '#173E80', p2: '#355C95', soft: '#EAF3FF', orb: '#BFDBFE' },
  counterboy:  { p1: '#8B3C2A', p2: '#6F4E37', soft: '#F5EDE4', orb: '#EDE0D4' },
};


// â”€â”€ Icons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const UserIcon  = ({ c = '#6A2F12', s = 20 }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="8" r="4" stroke={c} strokeWidth={1.8}/><Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth={1.8} strokeLinecap="round"/></Svg>;
const PhoneIcon = ({ c = '#6A2F12', s = 20 }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M7.2 4.8h2.4l1.1 3.4-1.5 1.5a14.8 14.8 0 005.1 5.1l1.5-1.5 3.4 1.1v2.4a1.5 1.5 0 01-1.5 1.5A14.9 14.9 0 014.2 6.3 1.5 1.5 0 015.7 4.8h1.5z" stroke={c} strokeWidth={1.8} strokeLinejoin="round"/></Svg>;
const MailIcon  = ({ c = '#6A2F12', s = 20 }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Rect x="3" y="5" width="18" height="14" rx="3" stroke={c} strokeWidth={1.8}/><Path d="M5 8l7 5 7-5" stroke={c} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const LockIcon  = ({ c = '#6A2F12', s = 20 }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Rect x="5" y="11" width="14" height="10" rx="2.5" stroke={c} strokeWidth={1.8}/><Path d="M8 11V8.5A4 4 0 0112 4.5a4 4 0 014 4V11" stroke={c} strokeWidth={1.8} strokeLinecap="round"/><Circle cx="12" cy="16" r="1.3" fill={c}/></Svg>;
const EyeIcon   = ({ c = '#9CA3AF', s = 18 }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M2.5 12s3.3-5 9.5-5 9.5 5 9.5 5-3.3 5-9.5 5-9.5-5-9.5-5z" stroke={c} strokeWidth={1.8}/><Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={1.8}/></Svg>;
const EyeOffIcon= ({ c = '#9CA3AF', s = 18 }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M3 3l18 18" stroke={c} strokeWidth={1.8} strokeLinecap="round"/><Path d="M10.6 5.2c.5-.1.9-.2 1.4-.2 6.2 0 9.5 5 9.5 5a15.5 15.5 0 01-3.4 3.6M6.3 6.3A15.7 15.7 0 002.5 12s3.3 5 9.5 5c1 0 1.9-.1 2.7-.4" stroke={c} strokeWidth={1.8} strokeLinecap="round"/></Svg>;
const SwitchRoleIcon = ({ c = '#fff', s = 16 }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M7 16H3m0 0l3-3m-3 3l3 3" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><Path d="M17 8h4m0 0l-3-3m3 3l-3 3" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><Path d="M3 8h10M11 16h10" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2"/></Svg>;
const LocationIcon = ({ c = '#6A2F12', s = 20 }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke={c} strokeWidth={1.8}/><Circle cx="12" cy="9" r="2.5" stroke={c} strokeWidth={1.8}/></Svg>;
const ArrowLeft = ({ c = '#6A2F12', s = 18 }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M19 12H5M11 18l-6-6 6-6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const ArrowRight  = ({ c = '#fff', s = 18 }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M5 12h14M13 6l6 6-6 6" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;

// â”€â”€ Floating orbs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Orbs({ color }: { color: string }) {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = (v: Animated.Value, dur: number, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]));
    loop(a, 3200, 0).start();
    loop(b, 2800, 800).start();
  }, [a, b]);
  const ta = a.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const tb = b.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
  return (
    <>
      <Animated.View style={[S.orb, { width: 180, height: 180, top: -50, right: -50, backgroundColor: color, transform: [{ translateY: ta }] }]} />
      <Animated.View style={[S.orb, { width: 120, height: 120, bottom: 10, left: -30, backgroundColor: color, opacity: 0.15, transform: [{ translateY: tb }] }]} />
    </>
  );
}

// â”€â”€ Input â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Input({
  label, value, onChange, placeholder, icon, keyboard = 'default',
  secure = false, toggleSecure, autoCap = 'none', ref: inputRef,
  onSubmit, returnKey = 'next', darkMode, accentColor = '#6A2F12', maxLength,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ReactNode;
  keyboard?: any; secure?: boolean; toggleSecure?: () => void;
  autoCap?: any; ref?: React.RefObject<TextInput | null>;
  onSubmit?: () => void; returnKey?: any; darkMode: boolean; accentColor?: string; maxLength?: number;
}) {
  const [focused, setFocused] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const focus = () => { setFocused(true);  Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: false }).start(); };
  const blur  = () => { setFocused(false); Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: false }).start(); };
  const borderColor = anim.interpolate({ inputRange: [0, 1], outputRange: [darkMode ? '#334155' : '#E5E7EB', accentColor] });
  const bg = darkMode ? '#1E293B' : '#FAFAFA';
  return (
    <View style={S.inputWrap}>
      <Text style={[S.inputLabel, { color: focused ? accentColor : darkMode ? '#94A3B8' : '#6B7280' }]}>{label}</Text>
      <Animated.View style={[S.inputRow, { backgroundColor: bg, borderColor }]}>
        <View style={S.inputIcon}>{icon}</View>
        <TextInput
          ref={inputRef as any}
          style={[S.inputText, { color: darkMode ? '#F1F5F9' : '#111827' }]}
          value={value} onChangeText={onChange} placeholder={placeholder}
          placeholderTextColor={darkMode ? '#475569' : '#9CA3AF'}
          keyboardType={keyboard} secureTextEntry={secure}
          autoCapitalize={autoCap} onFocus={focus} onBlur={blur}
          onSubmitEditing={onSubmit} returnKeyType={returnKey}
          maxLength={maxLength}
        />
        {toggleSecure && (
          <Pressable onPress={toggleSecure} style={{ padding: 6 }}>
            {secure ? <EyeOffIcon /> : <EyeIcon />}
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

// â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function UserAuthScreen({
  onAuthenticated,
  onBack,
  role = 'user',
}: {
  onAuthenticated: (role: any, options?: { passwordConfigured?: boolean; passwordValue?: string }) => void;
  onBack?: () => void;
  role?: 'user' | 'dealer' | 'electrician' | 'counterboy';
}) {
  const { tx, darkMode } = usePreferenceContext();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<'landing' | 'login' | 'signup'>('landing');
  const [loading, setLoading] = useState(false);

  const theme = THEMES[role];
  const P1   = theme.p1;
  const P2   = theme.p2;
  const SOFT = theme.soft;

  const slideY = useRef(new Animated.Value(30)).current;
  const fadeO  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    slideY.setValue(30); fadeO.setValue(0);
    Animated.parallel([
      Animated.spring(slideY, { toValue: 0, tension: 65, friction: 10, useNativeDriver: true }),
      Animated.timing(fadeO, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [mode, slideY, fadeO]);

  const [lPhone, setLPhone] = useState('');
  const [lPwd,   setLPwd]   = useState('');
  const [lOtp,   setLOtp]   = useState('');
  const [showLP, setShowLP] = useState(false);
  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [otpSentLogin, setOtpSentLogin] = useState(false);
  const [otpLoginPhone, setOtpLoginPhone] = useState('');
  const lPwdRef = useRef<TextInput>(null);
  const lOtpRef = useRef<TextInput>(null);

  const [sName,  setSName]  = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sOtp,   setSOtp]   = useState('');
  const [sPwd,   setSPwd]   = useState('');
  const [showSP, setShowSP] = useState(false);
  const [otpSentSignup, setOtpSentSignup] = useState(false);
  const [otpSignupPhone, setOtpSignupPhone] = useState('');
  const [signupStep, setSignupStep] = useState<'identity' | 'otp' | 'details'>('identity');
  const sPhoneRef = useRef<TextInput>(null);
  const sEmailRef = useRef<TextInput>(null);
  const sOtpRef   = useRef<TextInput>(null);
  const sPwdRef   = useRef<TextInput>(null);
  const sAddressRef = useRef<TextInput>(null);
  const sStateRef   = useRef<TextInput>(null);
  const sCityRef    = useRef<TextInput>(null);
  const sPincodeRef = useRef<TextInput>(null);

  const [sAddress, setSAddress] = useState('');
  const [sState, setSState]     = useState('');
  const [sCity, setSCity]       = useState('');
  const [sPincode, setSPincode] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  const normalizePhone = (value: string) => {
    const digits = value.trim().replace(/\D/g, '');
    if (digits.length > 10 && digits.startsWith('91')) {
      return digits.slice(2).slice(-10);
    }
    return digits.slice(-10);
  };
  const handleSignupEmail = (value: string) => {
    setSEmail(value);
  };

  const requestCurrentLocation = useCallback(async () => {
    if (locationLoading) return;
    setLocationLoading(true);
    setLocationMessage('');
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      const hasPermission =
        permission.granted ||
        permission.status === 'granted' ||
        (Platform.OS === 'android' && permission.android?.accuracy !== 'none');
      if (!hasPermission) {
        if (permission.canAskAgain) {
          Alert.alert('', tx('Please allow location permission to fetch your current address automatically.'));
        } else {
          Alert.alert('', tx('Location permission is blocked. Opening app settings so you can allow it.'));
          await Linking.openSettings();
        }
        return;
      }
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        if (Platform.OS === 'android') {
          try { await Location.enableNetworkProviderAsync(); } catch {
            Alert.alert('', tx('Please turn on device location to fetch the current address automatically.'));
            return;
          }
        } else {
          Alert.alert('', tx('Please turn on device location to fetch the current address automatically.'));
          return;
        }
      }
      let pos = await Location.getLastKnownPositionAsync({ maxAge: 1000 * 60 * 10, requiredAccuracy: 500 });
      if (!pos) {
        pos = await Location.getCurrentPositionAsync({
          accuracy: Platform.OS === 'android' ? Location.Accuracy.Balanced : Location.Accuracy.High,
          mayShowUserSettingsDialog: true,
        });
      }
      const lookup = await Location.reverseGeocodeAsync({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (!lookup || lookup.length === 0) {
        Alert.alert('', tx('Could not find address for your location. Please enter manually.'));
        return;
      }
      const addr = lookup[0];
      if (!addr) { Alert.alert('', tx('Address details not found. Please enter manually.')); return; }
      const parts: string[] = [];
      if (addr.formattedAddress) parts.push(addr.formattedAddress);
      if (addr.name) parts.push(addr.name);
      if (addr.streetNumber) parts.push(addr.streetNumber);
      if (addr.street) parts.push(addr.street);
      if (addr.district) parts.push(addr.district);
      if (addr.city) parts.push(addr.city);
      if (addr.subregion) parts.push(addr.subregion);
      if (addr.region) parts.push(addr.region);
      const resolvedAddress = parts.map(p => p.trim()).filter(Boolean).filter((p, i, a) => a.indexOf(p) === i).join(', ');
      const resolvedState   = addr.region || '';
      const resolvedCity    = addr.city || addr.district || addr.subregion || '';
      const resolvedPincode = addr.postalCode || '';
      if (resolvedAddress) setSAddress(resolvedAddress);
      if (resolvedState)   setSState(resolvedState);
      if (resolvedCity)    setSCity(resolvedCity);
      if (resolvedPincode) setSPincode(resolvedPincode.replace(/\D/g, '').slice(0, 6));
      setLocationMessage(tx('Address fetched successfully. Please review and update if needed.'));
    } catch {
      Alert.alert('', tx('Could not fetch location. Please enter address manually.'));
    } finally {
      setLocationLoading(false);
    }
  }, [locationLoading, tx]);

  const bg   = darkMode ? '#0F172A' : '#EEF3F8';
  const card = darkMode ? '#1E293B' : '#FFFFFF';
  const bdr  = darkMode ? '#334155' : '#D7E7FF';
  const tp   = darkMode ? '#F1F5F9' : '#111827';
  const tm   = darkMode ? '#94A3B8' : '#6B7280';
  const statCardStyle =
    role === 'electrician'
      ? {
          backgroundColor: '#EEF5FF',
          borderColor: '#D3E3FF',
        }
      : role === 'user'
        ? {
            backgroundColor: '#FBF1E7',
            borderColor: '#E5D4C1',
          }
      : {
          backgroundColor: '#FFF7EF',
          borderColor: '#F2DEC5',
        };

  useEffect(() => {
    if (mode !== 'login') {
      setUseOtpLogin(false);
      setOtpSentLogin(false);
      setOtpLoginPhone('');
      setLOtp('');
      setLPwd('');
      setShowLP(false);
    }

    if (mode !== 'signup') {
      setOtpSentSignup(false);
      setOtpSignupPhone('');
      setSOtp('');
      setShowSP(false);
      setSignupStep('identity');
    }
  }, [mode]);

  useEffect(() => {
    if (!useOtpLogin) {
      setOtpSentLogin(false);
      setOtpLoginPhone('');
      setLOtp('');
    }
  }, [useOtpLogin]);

  useEffect(() => {
    if (otpSentLogin && normalizePhone(lPhone) !== otpLoginPhone) {
      setOtpSentLogin(false);
      setOtpLoginPhone('');
      setLOtp('');
    }
  }, [lPhone, otpLoginPhone, otpSentLogin]);

  useEffect(() => {
    if (otpSentSignup && normalizePhone(sPhone) !== otpSignupPhone) {
      setOtpSentSignup(false);
      setOtpSignupPhone('');
      setSOtp('');
      setSignupStep('identity');
    }
  }, [sPhone, otpSentSignup, otpSignupPhone]);

  const sendOtpLogin = async () => {
    if (!lPhone.trim()) { Alert.alert('', tx('Please enter your phone number')); return; }
    const cleanPhone = normalizePhone(lPhone);
    if (cleanPhone.length !== 10) { Alert.alert('', tx('Please enter a valid 10-digit phone number')); return; }
    setLoading(true);
    try {
      const data = await authApi.sendOtp(cleanPhone, role);
      setLPhone(cleanPhone);
      setOtpSentLogin(true);
      setOtpLoginPhone(cleanPhone);
      Alert.alert(
        tx('OTP Sent'), 
        data.devOtp ? `${tx('OTP sent successfully')}. Dev OTP: ${data.devOtp}` : tx('Please check your phone for the OTP')
      );
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.toLowerCase().includes('not registered') || msg.toLowerCase().includes('not found')) {
        Alert.alert(tx('Not Registered'), tx('This phone number is not registered. Please create an account first.'));
        setMode('signup');
      } else {
        Alert.alert(tx('Error'), msg || tx('Failed to send OTP'));
      }
    }
    finally { setLoading(false); }
  };

  const sendOtpSignup = async () => {
    if (!sName.trim()) { Alert.alert('', tx('Please enter your name')); return; }
    if (!sPhone.trim()) { Alert.alert('', tx('Please enter your phone number')); return; }
    const cleanPhone = normalizePhone(sPhone);
    if (cleanPhone.length !== 10) { Alert.alert('', tx('Please enter a valid 10-digit phone number')); return; }
    setLoading(true);
    try {
      const data = await authApi.sendSignupOtp(cleanPhone, role);
      setSPhone(cleanPhone);
      setOtpSentSignup(true);
      setOtpSignupPhone(cleanPhone);
      setSignupStep('otp');
      Alert.alert(
        tx('OTP Sent'),
        data.devOtp ? `${tx('OTP sent successfully')}. Dev OTP: ${data.devOtp}` : tx('Please check your phone for the OTP')
      );
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('conflict')) {
        Alert.alert(tx('Already Registered'), msg || tx('This phone number is already registered. Please login instead.'));
        setMode('login');
      } else {
        Alert.alert(tx('Error'), msg || tx('Failed to send OTP'));
      }
    }
    finally { setLoading(false); }
  };

  const login = async () => {
    if (!lPhone.trim()) { Alert.alert('', tx('Please enter your phone number')); return; }
    const cleanPhone = normalizePhone(lPhone);
    if (cleanPhone.length !== 10) { Alert.alert('', tx('Please enter a valid 10-digit phone number')); return; }
    
    if (useOtpLogin) {
      if (!lOtp.trim()) { Alert.alert('', tx('Please enter the OTP')); return; }
      setLoading(true);
      try {
        const data = await authApi.verifyOtp(cleanPhone, role, lOtp.trim());
        (globalThis as typeof globalThis & { __srvLoginUser?: unknown }).__srvLoginUser = data.user;
        onAuthenticated(role, { passwordValue: '' });
      } catch (e: any) {
        const msg = e?.message ?? '';
        if (msg.toLowerCase().includes('expired')) {
          Alert.alert(tx('OTP Expired'), tx('Your OTP has expired. Please request a new one.'));
          setOtpSentLogin(false);
          setLOtp('');
        } else if (msg.toLowerCase().includes('invalid')) {
          Alert.alert(tx('Invalid OTP'), tx('The OTP you entered is incorrect. Please try again.'));
          setLOtp('');
        } else {
          Alert.alert(tx('Login Failed'), msg || tx('Something went wrong. Please try again.'));
        }
      }
      finally { setLoading(false); }
    } else {
      if (!lPwd.trim()) { Alert.alert('', tx('Please enter your password')); return; }
      setLoading(true);
      try {
        const res = await authApi.login({ phone: cleanPhone, password: lPwd.trim(), role });
        (globalThis as typeof globalThis & { __srvLoginUser?: unknown }).__srvLoginUser = res.user;
        onAuthenticated(role, { passwordConfigured: true, passwordValue: lPwd.trim() });
      } catch (e: any) {
        const msg = e?.message ?? '';
        if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('not registered')) {
          Alert.alert(tx('Not Registered'), tx('This phone number is not registered. Please create an account first.'));
          setMode('signup');
        } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('password')) {
          Alert.alert(tx('Wrong Password'), tx('Incorrect password. Try again or use OTP login.'));
        } else {
          Alert.alert(tx('Login Failed'), msg || tx('Check your credentials and try again.'));
        }
      }
      finally { setLoading(false); }
    }
  };

  const verifySignup = async () => {
    if (!sName.trim())  { Alert.alert('', tx('Please enter your name')); return; }
    if (!sPhone.trim()) { Alert.alert('', tx('Please enter your phone number')); return; }
    if (!sOtp.trim())   { Alert.alert('', tx('Please enter the OTP')); return; }
    const cleanPhone = normalizePhone(sPhone);
    if (cleanPhone.length !== 10) { Alert.alert('', tx('Please enter a valid 10-digit phone number')); return; }

    setLoading(true);
    try {
      await authApi.verifySignupOtp(cleanPhone, role, sOtp.trim());
      setSignupStep('details');
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.toLowerCase().includes('expired')) {
        Alert.alert(tx('OTP Expired'), tx('Your OTP has expired. Please request a new one.'));
        setOtpSentSignup(false);
        setSOtp('');
        setSignupStep('identity');
      } else if (msg.toLowerCase().includes('invalid')) {
        Alert.alert(tx('Invalid OTP'), tx('The OTP you entered is incorrect. Please try again.'));
        setSOtp('');
      } else {
        Alert.alert(tx('OTP Error'), msg || tx('OTP verification failed. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async () => {
    if (!sName.trim())  { Alert.alert('', tx('Please enter your name')); return; }
    if (!sPhone.trim()) { Alert.alert('', tx('Please enter your phone number')); return; }
    if (!otpSentSignup || signupStep !== 'details') {
      Alert.alert('', tx('Please verify your OTP first'));
      return;
    }
    const cleanPhone = normalizePhone(sPhone);
    if (cleanPhone.length !== 10) { Alert.alert('', tx('Please enter a valid 10-digit phone number')); return; }
    if ((role === 'user' || role === 'counterboy') && sAddress.trim().length < 5) {
      Alert.alert('', tx('Please enter your address'));
      return;
    }
    if (!isValidOptionalEmail(sEmail)) {
      Alert.alert('', tx('Please enter a valid email address without spaces'));
      return;
    }

    setLoading(true);
    try {
      const registerData = await authApi.register({
        name: sName.trim(),
        phone: cleanPhone,
        email: sanitizeEmailInput(sEmail).trim() || undefined,
        password: sPwd.trim() || undefined,
        role,
        address: sAddress.trim() || undefined,
        state: sState.trim() || undefined,
        city: sCity.trim() || undefined,
        pincode: sPincode.trim() || undefined,
      });
      (globalThis as typeof globalThis & { __srvLoginUser?: unknown }).__srvLoginUser = registerData.user;
      onAuthenticated(role, { passwordConfigured: !!sPwd.trim(), passwordValue: sPwd.trim() });
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('conflict')) {
        Alert.alert(tx('Already Registered'), msg || tx('This phone number is already registered. Please login instead.'));
        setMode('login');
      } else {
        Alert.alert(tx('Registration Failed'), msg || tx('Could not create account. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };

  // â”€â”€ LANDING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (mode === 'landing') {
    return (
      <View style={[S.screen, { backgroundColor: bg }]}>
          <LinearGradient colors={[P1, P2, theme.orb]} style={[S.hero, { paddingTop: insets.top + 12 }]}>
          <Orbs color={theme.orb} />
          <Animated.View style={[S.heroContent, { transform: [{ translateY: slideY }], opacity: fadeO }]}>
            <View style={S.logoWrap}>
              <Image source={{ uri: SRV_LOGO_URI }} style={S.logoImg} resizeMode="contain" />
            </View>
            <Text style={S.heroTag}>SRV ELECTRICALS</Text>
            <Text style={S.heroTitle}>{tx('Welcome Back')}</Text>
            <Text style={S.heroSub}>{tx('Trusted electrical products since 2000')}</Text>
          </Animated.View>
        </LinearGradient>

        <Animated.View style={[S.landCard, { backgroundColor: card, borderColor: bdr, transform: [{ translateY: slideY }], opacity: fadeO }]}>
          <Text style={[S.landTitle, { color: tp }]}>{tx('Get Started')}</Text>
          <Text style={[S.landSub, { color: tm }]}>{tx('Login or create a new account')}</Text>

          <Pressable onPress={() => setMode('login')} android_ripple={{ color: 'rgba(255,255,255,0.2)' }} style={S.btnShell}>
            <LinearGradient colors={[P1, P2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.btnPrimary}>
              <Text style={S.btnPrimaryText}>{tx('Login to Account')}</Text>
              <ArrowRight s={18} />
            </LinearGradient>
          </Pressable>

          <Pressable
            onPress={() => setMode('signup')}
            style={[S.btnOutline, { borderColor: `${P1}28`, backgroundColor: SOFT }]}
            android_ripple={{ color: `${P1}15` }}
          >
            <Text style={[S.btnOutlineText, { color: P1 }]}>{tx('Create New Account')}</Text>
          </Pressable>

          <View style={[S.statsRow, { borderTopColor: `${P1}22` }]}>
            {[['25+', tx('Years')], ['250+', tx('Products')], ['50K+', tx('Customers')]].map(([n, l], i) => (
              <View key={i} style={[S.statItem, statCardStyle]}>
                <Text style={[S.statN, { color: P1 }]}>{n}</Text>
                <Text style={[S.statL, { color: tm }]}>{l}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Switch Your Role â€” bottom */}
        {onBack && (
          <Pressable onPress={onBack} style={S.backToOnboarding} android_ripple={{ color: `${P1}15` }}>
            <LinearGradient
              colors={[SOFT, theme.orb]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[S.backToOnboardingInner, { borderColor: `${P1}40` }]}
            >
              <View style={[S.backToOnboardingIcon, { backgroundColor: P1 }]}>
                <SwitchRoleIcon s={14} c={'#FFFFFF'} />
              </View>
              <Text style={[S.backToOnboardingText, { color: P1 }]}>{tx('Switch Your Role')}</Text>
            </LinearGradient>
          </Pressable>
        )}
      </View>
    );
  }

  const isLogin = mode === 'login';
  const isSignupOtpStep = !isLogin && signupStep === 'otp';
  const isSignupDetailsStep = !isLogin && signupStep === 'details';

  // â”€â”€ LOGIN / SIGNUP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <KeyboardAvoidingView style={[S.screen, { backgroundColor: bg }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
      {/* Compact header */}
      <LinearGradient colors={[P1, P2]} style={[S.formHeader, { paddingTop: insets.top }]}>
        <View style={S.formHeaderLogoWrap}>
          <Image source={{ uri: SRV_LOGO_URI }} style={S.formHeaderLogo} resizeMode="contain" />
        </View>
        <Text style={S.formHeaderTitle}>{isLogin ? tx('Login') : tx('Create Account')}</Text>
        <Text style={S.formHeaderSub}>{isLogin ? tx('Welcome back to SRV Electricals') : tx('Join SRV Electricals today')}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={[S.formBody, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ transform: [{ translateY: slideY }], opacity: fadeO }}>

          {/* Card */}
          <View style={[S.formCard, { backgroundColor: card, borderColor: bdr }]}>
            {!isLogin && !isSignupDetailsStep && (
              <Input label={tx('Full Name')} value={sName} onChange={setSName}
                placeholder={tx('Your full name')} icon={<UserIcon c={P1} />}
                autoCap="words" onSubmit={() => sPhoneRef.current?.focus()} darkMode={darkMode} accentColor={P1} />
            )}
            
            {(isLogin || !isSignupDetailsStep) && (
            <Input label={tx('Phone Number')} value={isLogin ? lPhone : sPhone}
              onChange={isLogin ? (v) => setLPhone(normalizePhone(v)) : (v) => setSPhone(normalizePhone(v))}
              placeholder={tx('10-digit mobile number')} icon={<PhoneIcon c={P1} />}
              keyboard="phone-pad"
              maxLength={10}
              ref={isLogin ? undefined : sPhoneRef}
              onSubmit={isLogin ? (useOtpLogin ? () => {} : () => lPwdRef.current?.focus()) : sendOtpSignup}
              darkMode={darkMode} accentColor={P1} />
            )}
            
            {/* Signup: Send OTP Button */}
            {!isLogin && !otpSentSignup && (
              <Pressable onPress={sendOtpSignup} disabled={loading || !sPhone.trim()}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }} 
                style={[S.btnShell, { marginTop: 8 }, (loading || !sPhone.trim()) && { opacity: 0.5 }]}>
                <LinearGradient colors={[P1, P2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[S.btnPrimary, { height: 44 }]}>
                  <Text style={[S.btnPrimaryText, { fontSize: 13 }]}>{loading ? tx('Sending...') : tx('Send OTP')}</Text>
                </LinearGradient>
              </Pressable>
            )}
            
            {/* Signup: OTP Input */}
            {isSignupOtpStep && (
              <View style={S.stepBlock}>
                <View style={[S.stepBadge, { backgroundColor: SOFT, borderColor: `${P1}25` }]}>
                  <Text style={[S.stepBadgeText, { color: P1 }]}>{tx('Step 1 of 2')}</Text>
                </View>
                <Text style={[S.stepTitle, { color: tp }]}>{tx('Verify your phone number')}</Text>
                <Text style={[S.stepSub, { color: tm }]}>{tx('Enter the OTP and verify before continuing to the remaining details.')}</Text>
                <Input label={tx('Enter OTP')} value={sOtp} onChange={setSOtp}
                  placeholder={tx('6-digit OTP')} icon={<LockIcon c={P1} />}
                  keyboard="number-pad" ref={sOtpRef}
                  onSubmit={verifySignup} darkMode={darkMode} accentColor={P1} />
                <Pressable onPress={verifySignup} disabled={loading || !sOtp.trim()}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  style={[S.btnShell, { marginTop: 4 }, (loading || !sOtp.trim()) && { opacity: 0.5 }]}>
                  <LinearGradient colors={[P1, P2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[S.btnPrimary, { height: 44 }]}>
                    <Text style={[S.btnPrimaryText, { fontSize: 13 }]}>{loading ? tx('Verifying...') : tx('Verify OTP')}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {!isLogin && otpSentSignup && signupStep !== 'details' && (
              <Pressable onPress={sendOtpSignup} style={{ alignSelf: 'flex-end', marginTop: -4 }}>
                <Text style={{ color: P1, fontSize: 12, fontWeight: '700' }}>{loading ? tx('Sending...') : tx('Resend OTP')}</Text>
              </Pressable>
            )}
            
            {isSignupDetailsStep && (
              <View style={S.stepBlock}>
                <View style={[S.stepBadge, { backgroundColor: SOFT, borderColor: `${P1}25` }]}>
                  <Text style={[S.stepBadgeText, { color: P1 }]}>{tx('Step 2 of 2')}</Text>
                </View>
                <Text style={[S.stepTitle, { color: tp }]}>{tx('Complete your profile')}</Text>
                <Text style={[S.stepSub, { color: tm }]}>{tx('Add the remaining details below to finish creating your account.')}</Text>
                <Pressable onPress={() => setSignupStep('otp')} style={[S.stepBackRow, { borderColor: `${P1}20`, backgroundColor: SOFT }]}>
                  <ArrowLeft c={P1} s={16} />
                  <Text style={[S.switchText, { color: P1, fontSize: 12, fontWeight: '700' }]}>{tx('Previous')}</Text>
                </Pressable>
                <Input label={`${tx('Email')} (${tx('optional')})`} value={sEmail} onChange={handleSignupEmail}
                  placeholder={tx('your@email.com')} icon={<MailIcon c={P1} />}
                  keyboard="email-address" ref={sEmailRef}
                  onSubmit={() => sAddressRef.current?.focus()} darkMode={darkMode} accentColor={P1} />
              </View>
            )}
            
            {/* Signup: Address with location fetch */}
            {isSignupDetailsStep && (
              <View style={{ gap: 8 }}>
                <View style={S.inputWrap}>
                  <Text style={[S.inputLabel, { color: darkMode ? '#94A3B8' : '#6B7280' }]}>
                    {tx('Address')}
                    {role === 'user' || role === 'counterboy' ? '' : ` (${tx('optional')})`}
                  </Text>
                  <View style={[S.inputRow, { backgroundColor: darkMode ? '#1E293B' : '#FAFAFA', borderColor: darkMode ? '#334155' : '#E5E7EB' }]}>
                    <View style={S.inputIcon}><LocationIcon c={P1} /></View>
                    <TextInput
                      ref={sAddressRef}
                      style={[S.inputText, { color: darkMode ? '#F1F5F9' : '#111827' }]}
                      value={sAddress}
                      onChangeText={setSAddress}
                      placeholder={
                        locationLoading
                          ? tx('Fetching current address...')
                          : role === 'user' || role === 'counterboy'
                            ? tx('Enter your complete address')
                            : tx('Enter your complete address')
                      }
                      placeholderTextColor={darkMode ? '#475569' : '#9CA3AF'}
                      autoCapitalize="none"
                      autoCorrect={false}
                      onSubmitEditing={() => sStateRef.current?.focus()}
                      returnKeyType="next"
                    />
                    <Pressable
                      onPress={() => { void requestCurrentLocation(); }}
                      disabled={locationLoading}
                      style={[S.locationBtn, locationLoading ? { opacity: 0.5 } : null]}
                    >
                      <Text style={[S.locationBtnText, { color: P1 }]}>
                        {locationLoading ? tx('Locating') : tx('Current Address')}
                      </Text>
                    </Pressable>
                  </View>
                </View>
                {locationMessage ? (
                  <View style={[S.infoBox, { backgroundColor: '#EAF8EF', borderColor: '#A7F3D0' }]}>
                    <Text style={{ color: '#1F9C5D', fontSize: 12, fontWeight: '600' }}>{locationMessage}</Text>
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[S.inputWrap, { flex: 1 }]}>
                    <Text style={[S.inputLabel, { color: darkMode ? '#94A3B8' : '#6B7280' }]}>{tx('State')}</Text>
                    <View style={[S.inputRow, { backgroundColor: darkMode ? '#1E293B' : '#FAFAFA', borderColor: darkMode ? '#334155' : '#E5E7EB' }]}>
                      <TextInput
                        ref={sStateRef}
                        style={[S.inputText, { color: darkMode ? '#F1F5F9' : '#111827' }]}
                      value={sState}
                      onChangeText={(v) => setSState(v.replace(/[^A-Za-z ]/g, ''))}
                        placeholder={tx('State')}
                        placeholderTextColor={darkMode ? '#475569' : '#9CA3AF'}
                        autoCapitalize="words"
                        onSubmitEditing={() => sCityRef.current?.focus()}
                        returnKeyType="next"
                      />
                    </View>
                  </View>
                  <View style={[S.inputWrap, { flex: 1 }]}>
                    <Text style={[S.inputLabel, { color: darkMode ? '#94A3B8' : '#6B7280' }]}>{tx('City')}</Text>
                    <View style={[S.inputRow, { backgroundColor: darkMode ? '#1E293B' : '#FAFAFA', borderColor: darkMode ? '#334155' : '#E5E7EB' }]}>
                      <TextInput
                        ref={sCityRef}
                        style={[S.inputText, { color: darkMode ? '#F1F5F9' : '#111827' }]}
                      value={sCity}
                      onChangeText={(v) => setSCity(v.replace(/[^A-Za-z ]/g, ''))}
                        placeholder={tx('City')}
                        placeholderTextColor={darkMode ? '#475569' : '#9CA3AF'}
                        autoCapitalize="words"
                        onSubmitEditing={() => sPincodeRef.current?.focus()}
                        returnKeyType="next"
                      />
                    </View>
                  </View>
                </View>
                <View style={[S.inputWrap, { width: '50%' }]}>
                  <Text style={[S.inputLabel, { color: darkMode ? '#94A3B8' : '#6B7280' }]}>{tx('Pincode')}</Text>
                  <View style={[S.inputRow, { backgroundColor: darkMode ? '#1E293B' : '#FAFAFA', borderColor: darkMode ? '#334155' : '#E5E7EB' }]}>
                    <TextInput
                      ref={sPincodeRef}
                      style={[S.inputText, { color: darkMode ? '#F1F5F9' : '#111827' }]}
                      value={sPincode}
                      onChangeText={(v) => setSPincode(v.replace(/\D/g, '').slice(0, 6))}
                      placeholder={tx('6-digit pincode')}
                      placeholderTextColor={darkMode ? '#475569' : '#9CA3AF'}
                      keyboardType="numeric"
                      maxLength={6}
                      onSubmitEditing={() => sPwdRef.current?.focus()}
                      returnKeyType="next"
                    />
                  </View>
                </View>
              </View>
            )}

            {isSignupDetailsStep && (
              <Input
                label={`${tx('Password')} (${tx('optional')})`}
                value={sPwd}
                onChange={setSPwd}
                placeholder={tx('Create a password')}
                icon={<LockIcon c={P1} />}
                secure={!showSP}
                toggleSecure={() => setShowSP(v => !v)}
                ref={sPwdRef}
                onSubmit={signup}
                returnKey="done" darkMode={darkMode} accentColor={P1} />
            )}
            
            {/* Login: Toggle between Password and OTP */}
            {isLogin && (
              <Pressable onPress={() => setUseOtpLogin(v => !v)} style={{ marginTop: 8, marginBottom: 8 }}>
                <Text style={[S.switchText, { color: P1, textAlign: 'center', fontSize: 12, fontWeight: '700' }]}>
                  {useOtpLogin ? tx('Login with Password instead') : tx('Login with OTP instead')}
                </Text>
              </Pressable>
            )}
            
            {/* Login: Password Input */}
            {isLogin && !useOtpLogin && (
              <Input
                label={tx('Password')}
                value={lPwd}
                onChange={setLPwd}
                placeholder={tx('Enter password')}
                icon={<LockIcon c={P1} />}
                secure={!showLP}
                toggleSecure={() => setShowLP(v => !v)}
                ref={lPwdRef}
                onSubmit={login}
                returnKey="done" darkMode={darkMode} accentColor={P1} />
            )}
            
            {/* Login: OTP Section */}
            {isLogin && useOtpLogin && !otpSentLogin && (
              <Pressable onPress={sendOtpLogin} disabled={loading || !lPhone.trim()}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }} 
                style={[S.btnShell, { marginTop: 8 }, (loading || !lPhone.trim()) && { opacity: 0.5 }]}>
                <LinearGradient colors={[P1, P2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[S.btnPrimary, { height: 44 }]}>
                  <Text style={[S.btnPrimaryText, { fontSize: 13 }]}>{loading ? tx('Sending...') : tx('Send OTP')}</Text>
                </LinearGradient>
              </Pressable>
            )}
            
            {isLogin && useOtpLogin && otpSentLogin && (
              <>
                <Input label={tx('Enter OTP')} value={lOtp} onChange={setLOtp}
                  placeholder={tx('6-digit OTP')} icon={<LockIcon c={P1} />}
                  keyboard="number-pad" ref={lOtpRef}
                  onSubmit={login}
                  returnKey="done" darkMode={darkMode} accentColor={P1} />
                <Pressable onPress={() => { setOtpSentLogin(false); setLOtp(''); }} style={{ alignSelf: 'flex-end', marginTop: -4 }}>
                  <Text style={{ color: P1, fontSize: 12, fontWeight: '700' }}>{tx('Resend OTP')}</Text>
                </Pressable>
              </>
            )}
          </View>

          {/* Submit - Only show when ready */}
          {((isLogin && (!useOtpLogin || otpSentLogin)) || isSignupDetailsStep) && (
            <Pressable onPress={isLogin ? login : signup} disabled={loading}
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }} style={[S.btnShell, loading && { opacity: 0.7 }]}>
              <LinearGradient colors={[P1, P2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={S.btnPrimary}>
                <Text style={S.btnPrimaryText}>
                  {loading ? (isLogin ? tx('Logging in...') : tx('Creating...')) : (isLogin ? tx('Login') : tx('Create Account'))}
                </Text>
                {!loading && <ArrowRight s={18} />}
              </LinearGradient>
            </Pressable>
          )}

          {/* Switch */}
          <Pressable onPress={() => setMode(isLogin ? 'signup' : 'login')} style={S.switchRow}>
            <Text style={[S.switchText, { color: tm }]}>
              {isLogin ? tx("Don't have an account? ") : tx('Already have an account? ')}
              <Text style={{ color: P1, fontWeight: '800' }}>{isLogin ? tx('Sign up') : tx('Login')}</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const S = StyleSheet.create({
  screen: { flex: 1 },

  // Orb
  orb: { position: 'absolute', borderRadius: 999, opacity: 0.2 },

  // Hero (landing)
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    overflow: 'hidden',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginBottom: 16,
  },
  backText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  heroContent: { alignItems: 'center' },
  logoWrap: {
    width: 80, height: 80, borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    elevation: 5,
  },
  logoImg: { width: 64, height: 64 },
  heroTag: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.6)', letterSpacing: 3, marginBottom: 6 },
  heroTitle: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', marginBottom: 6 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  // Landing card
  landCard: {
    margin: 14,
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    gap: 10,
    elevation: 5,
    shadowColor: '#734E2A',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  landTitle: { fontSize: 20, fontWeight: '900' },
  landSub: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 14, borderTopWidth: 1, marginTop: 6 },
  statItem: {
    alignItems: 'center',
    gap: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 84,
    borderWidth: 1,
  },
  statN: { fontSize: 17, fontWeight: '900' },
  statL: { fontSize: 11, fontWeight: '600' },

  // Form header
  formHeader: {
    paddingHorizontal: 16,
    paddingBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  formHeaderLogoWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8, marginBottom: 8,
    elevation: 4,
  },
  formHeaderLogo: { width: 44, height: 44 },
  formHeaderTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', textAlign: 'center' },
  formHeaderSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: 2 },

  // Form body
  formBody: { padding: 16, paddingTop: 22, gap: 14 },
  formWelcome: { gap: 4, alignItems: 'center' },
  formWelcomeTitle: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
  formWelcomeSub: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
  formCard: {
    borderRadius: 20, borderWidth: 1, padding: 18, gap: 14,
    elevation: 3,
    shadowColor: '#734E2A',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  stepBlock: { gap: 10 },
  stepBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  stepBadgeText: { fontSize: 11, fontWeight: '800' },
  stepTitle: { fontSize: 16, fontWeight: '800' },
  stepSub: { fontSize: 12, lineHeight: 18 },
  stepBackRow: {
    alignSelf: 'flex-start',
    marginTop: -2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  // Input
  inputWrap: { gap: 5 },
  inputLabel: { fontSize: 12, fontWeight: '700', marginLeft: 2 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1.5,
    paddingHorizontal: 12, height: 50, gap: 10,
  },
  inputIcon: { width: 22, alignItems: 'center' },
  inputText: { flex: 1, fontSize: 14, padding: 0 },

  // Buttons
  btnShell: {
    borderRadius: 14, overflow: 'hidden',
    elevation: 5,
  },
  btnPrimary: {
    height: 52, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, borderRadius: 14,
  },
  btnPrimaryText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  btnOutline: {
    height: 52, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  btnOutlineText: { fontSize: 15, fontWeight: '900' },
  switchRow: { alignItems: 'center', paddingVertical: 8 },
  switchText: { fontSize: 13, color: '#7D6B5D' },

  // Back to onboarding â€” landing bottom
  backToOnboarding: {
    alignSelf: 'center',
    marginTop: 6,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  backToOnboardingInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  backToOnboardingIcon: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  backToOnboardingText: { fontSize: 14, fontWeight: '800' },
  locationBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#EAF3FF',
    marginLeft: 4,
  },
  locationBtnText: { fontSize: 11, fontWeight: '800' },
  infoBox: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
});

