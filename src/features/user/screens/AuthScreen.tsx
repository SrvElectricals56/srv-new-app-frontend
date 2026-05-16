// Customer Auth Screen â€” Role-aware account design
import { useEffect, useRef, useState } from 'react';
import {
  Animated, Easing, Image, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferenceContext } from '@/shared/preferences';
import { SRV_LOGO_URI } from '@/shared/data/logoBase64';
import { createShadow } from '@/shared/theme/shadows';
import { authApi } from '@/shared/api';

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
const ChevronLeft = ({ c = '#fff', s = 20 }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M15 6l-6 6 6 6" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const SwitchRoleIcon = ({ c = '#fff', s = 16 }) => <Svg width={s} height={s} viewBox="0 0 24 24" fill="none"><Path d="M7 16H3m0 0l3-3m-3 3l3 3" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><Path d="M17 8h4m0 0l-3-3m3 3l-3 3" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><Path d="M3 8h10M11 16h10" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2"/></Svg>;
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
  onSubmit, returnKey = 'next', darkMode, accentColor = '#6A2F12',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; icon: React.ReactNode;
  keyboard?: any; secure?: boolean; toggleSecure?: () => void;
  autoCap?: any; ref?: React.RefObject<TextInput | null>;
  onSubmit?: () => void; returnKey?: any; darkMode: boolean; accentColor?: string;
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
  const lPwdRef = useRef<TextInput>(null);
  const lOtpRef = useRef<TextInput>(null);

  const [sName,  setSName]  = useState('');
  const [sPhone, setSPhone] = useState('');
  const [sEmail, setSEmail] = useState('');
  const [sOtp,   setSOtp]   = useState('');
  const [sPwd,   setSPwd]   = useState('');
  const [showSP, setShowSP] = useState(false);
  const [otpSentSignup, setOtpSentSignup] = useState(false);
  const sPhoneRef = useRef<TextInput>(null);
  const sEmailRef = useRef<TextInput>(null);
  const sOtpRef   = useRef<TextInput>(null);
  const sPwdRef   = useRef<TextInput>(null);

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

  const sendOtpLogin = async () => {
    if (!lPhone.trim()) { Alert.alert('', tx('Please enter your phone number')); return; }
    setLoading(true);
    try {
      // Real API call to send OTP
      const response = await fetch(`${authApi.baseUrl}/mobile/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: lPhone.trim(), role }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      setOtpSentLogin(true);
      Alert.alert(
        tx('OTP Sent'), 
        data.devOtp ? `${tx('OTP sent successfully')}. Dev OTP: ${data.devOtp}` : tx('Please check your phone for the OTP')
      );
    } catch (e: any) { 
      Alert.alert(tx('Error'), e?.message ?? tx('Failed to send OTP')); 
    }
    finally { setLoading(false); }
  };

  const sendOtpSignup = async () => {
    if (!sPhone.trim()) { Alert.alert('', tx('Please enter your phone number')); return; }
    setLoading(true);
    try {
      // Real API call to send signup OTP
      const response = await fetch(`${authApi.baseUrl}/mobile/auth/signup/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sPhone.trim(), role }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      
      setOtpSentSignup(true);
      Alert.alert(
        tx('OTP Sent'), 
        data.devOtp ? `${tx('OTP sent successfully')}. Dev OTP: ${data.devOtp}` : tx('Please check your phone for the OTP')
      );
    } catch (e: any) { 
      Alert.alert(tx('Error'), e?.message ?? tx('Failed to send OTP')); 
    }
    finally { setLoading(false); }
  };

  const login = async () => {
    if (!lPhone.trim()) { Alert.alert('', tx('Please enter your phone number')); return; }
    
    if (useOtpLogin) {
      // Login with OTP - Real API
      if (!lOtp.trim()) { Alert.alert('', tx('Please enter the OTP')); return; }
      
      setLoading(true);
      try {
        const response = await fetch(`${authApi.baseUrl}/mobile/auth/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: lPhone.trim(), role, otp: lOtp.trim() }),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Invalid OTP');
        }
        
        (globalThis as typeof globalThis & { __srvLoginUser?: unknown }).__srvLoginUser = data.user;
        onAuthenticated(role, { passwordConfigured: false, passwordValue: '' });
      } catch (e: any) { 
        Alert.alert(tx('Login Failed'), e?.message ?? tx('Invalid OTP')); 
      }
      finally { setLoading(false); }
    } else {
      // Login with password (password is optional)
      setLoading(true);
      try {
        const res = await authApi.login({ phone: lPhone.trim(), password: lPwd.trim(), role });
        (globalThis as typeof globalThis & { __srvLoginUser?: unknown }).__srvLoginUser = res.user;
        onAuthenticated(role, { passwordConfigured: !!lPwd, passwordValue: lPwd });
      } catch (e: any) { 
        Alert.alert(tx('Login Failed'), e?.message ?? tx('Check your credentials')); 
      }
      finally { setLoading(false); }
    }
  };

  const signup = async () => {
    if (!sName.trim())  { Alert.alert('', tx('Please enter your name')); return; }
    if (!sPhone.trim()) { Alert.alert('', tx('Please enter your phone number')); return; }
    if (!sOtp.trim())   { Alert.alert('', tx('Please enter the OTP')); return; }
    
    setLoading(true);
    try {
      // First verify OTP
      const verifyResponse = await fetch(`${authApi.baseUrl}/mobile/auth/signup/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: sPhone.trim(), role, otp: sOtp.trim() }),
      });
      
      const verifyData = await verifyResponse.json();
      
      if (!verifyResponse.ok) {
        throw new Error(verifyData.message || 'Invalid OTP');
      }
      
      // Then register user
      const registerResponse = await fetch(`${authApi.baseUrl}/mobile/auth/signup/${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: sName.trim(),
          phone: sPhone.trim(),
          email: sEmail.trim() || undefined,
          password: sPwd.trim() || undefined,
        }),
      });
      
      const registerData = await registerResponse.json();
      
      if (!registerResponse.ok) {
        throw new Error(registerData.message || 'Registration failed');
      }
      
      (globalThis as typeof globalThis & { __srvLoginUser?: unknown }).__srvLoginUser = registerData.user;
      onAuthenticated(role, { passwordConfigured: !!sPwd, passwordValue: sPwd });
    } catch (e: any) { 
      Alert.alert(tx('Signup Failed'), e?.message ?? tx('Invalid OTP or registration failed')); 
    }
    finally { setLoading(false); }
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
            {!isLogin && (
              <Input label={tx('Full Name')} value={sName} onChange={setSName}
                placeholder={tx('Your full name')} icon={<UserIcon c={P1} />}
                autoCap="words" onSubmit={() => sPhoneRef.current?.focus()} darkMode={darkMode} accentColor={P1} />
            )}
            
            <Input label={tx('Phone Number')} value={isLogin ? lPhone : sPhone}
              onChange={isLogin ? setLPhone : setSPhone}
              placeholder={tx('10-digit mobile number')} icon={<PhoneIcon c={P1} />}
              keyboard="phone-pad"
              ref={isLogin ? undefined : sPhoneRef}
              onSubmit={isLogin ? (useOtpLogin ? () => {} : () => lPwdRef.current?.focus()) : () => sEmailRef.current?.focus()}
              darkMode={darkMode} accentColor={P1} />
            
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
            {!isLogin && otpSentSignup && (
              <Input label={tx('Enter OTP')} value={sOtp} onChange={setSOtp}
                placeholder={tx('6-digit OTP')} icon={<LockIcon c={P1} />}
                keyboard="number-pad" ref={sOtpRef}
                onSubmit={() => sEmailRef.current?.focus()} darkMode={darkMode} accentColor={P1} />
            )}
            
            {!isLogin && otpSentSignup && (
              <Input label={`${tx('Email')} (${tx('optional')})`} value={sEmail} onChange={setSEmail}
                placeholder={tx('your@email.com')} icon={<MailIcon c={P1} />}
                keyboard="email-address" ref={sEmailRef}
                onSubmit={() => sPwdRef.current?.focus()} darkMode={darkMode} accentColor={P1} />
            )}
            
            {!isLogin && otpSentSignup && (
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
                label={`${tx('Password')} (${tx('optional')})`}
                value={lPwd}
                onChange={setLPwd}
                placeholder={tx('Enter password or leave empty')}
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
              <Input label={tx('Enter OTP')} value={lOtp} onChange={setLOtp}
                placeholder={tx('6-digit OTP')} icon={<LockIcon c={P1} />}
                keyboard="number-pad" ref={lOtpRef}
                onSubmit={login}
                returnKey="done" darkMode={darkMode} accentColor={P1} />
            )}
          </View>

          {/* Submit - Only show when ready */}
          {((isLogin && (!useOtpLogin || otpSentLogin)) || (!isLogin && otpSentSignup)) && (
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
});

