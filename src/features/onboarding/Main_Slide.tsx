/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ws, hs, rf, safeTop } from '../../shared/hooks/useResponsive';
import { SRV_LOGO_URI } from '../../shared/data/logoBase64';
import { counterboyURI, customerURI, dealerURI, electricianURI } from '../../shared/data/roleImages';

const AView = Animated.View as any;
const AText = Animated.Text as any;

export type UserRole = 'user' | 'dealer' | 'electrician' | 'counter-boy';

interface MainSlideProps {
  onRoleSelect: (role: UserRole) => void;
}

const SPARKLES = [
  { id: 1, top: ws(10), left:  ws(10), size: ws(9), color: '#E8453C', delay: 0,   dur: 1400, shape: 'circle' },
  { id: 2, top: ws(40), left:  ws(28), size: ws(6), color: '#D97706', delay: 300, dur: 1100, shape: 'star'   },
  { id: 3, top: ws(70), left:  ws(8),  size: ws(8), color: '#2563EB', delay: 600, dur: 1300, shape: 'circle' },
  { id: 4, top: ws(20), left:  ws(55), size: ws(5), color: '#059669', delay: 200, dur: 900,  shape: 'star'   },
  { id: 5, top: ws(8),  right: ws(12), size: ws(8), color: '#7C3AED', delay: 100, dur: 1200, shape: 'circle' },
  { id: 6, top: ws(38), right: ws(30), size: ws(6), color: '#E8453C', delay: 450, dur: 1000, shape: 'star'   },
  { id: 7, top: ws(68), right: ws(10), size: ws(9), color: '#D97706', delay: 700, dur: 1500, shape: 'circle' },
  { id: 8, top: ws(18), right: ws(58), size: ws(5), color: '#0891B2', delay: 250, dur: 950,  shape: 'star'   },
];

function LogoSection() {
  const logoScale    = useRef(new Animated.Value(0.85)).current;
  const rotateAnim   = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef(SPARKLES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }).start();
    Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })).start();
    const loops = sparkleAnims.map((anim, i) => {
      const sp = SPARKLES[i];
      return Animated.loop(Animated.sequence([
        Animated.delay(sp.delay),
        Animated.timing(anim, { toValue: 1, duration: sp.dur * 0.45, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: sp.dur * 0.55, useNativeDriver: true }),
      ]));
    });
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, []);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={logo.wrapper}>
      {SPARKLES.map((sp, i) => {
        const anim = sparkleAnims[i];
        const pos: any = { top: sp.top };
        if ('left'  in sp) pos.left  = sp.left;
        if ('right' in sp) pos.right = sp.right;
        if (sp.shape === 'star') {
          return (
            <AText key={sp.id} style={[logo.star, pos, { color: sp.color, fontSize: sp.size + ws(4), opacity: anim, transform: [{ rotate }] }]}>✦</AText>
          );
        }
        return (
          <AView key={sp.id} style={[logo.dot, pos, { width: sp.size, height: sp.size, borderRadius: sp.size / 2, backgroundColor: sp.color, opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]} />
        );
      })}
      <AView style={{ transform: [{ scale: logoScale }] }}>
        <Image source={{ uri: SRV_LOGO_URI }} style={logo.img} resizeMode="contain" />
      </AView>
    </View>
  );
}

const logo = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center', height: hs(110), marginBottom: hs(20), position: 'relative' },
  img:  { width: ws(240), height: hs(88) },
  dot:  { position: 'absolute' },
  star: { position: 'absolute', fontWeight: '900' },
});

interface RoleCardProps {
  key?: UserRole;
  label: string;
  sub: string;
  color: string;
  bg: string;
  border: string;
  image: string;
  cover?: boolean;
  onPress: () => void;
}

function RoleCard({ label, sub, color, bg, border, image, cover, onPress }: RoleCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn  = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, tension: 120, friction: 8 }).start();
  const onOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 80,  friction: 6 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut} style={{ flex: 1 }}>
      <AView style={{ transform: [{ scale }] }}>
        <View style={[rc.imgCard, { backgroundColor: bg, borderColor: border, borderWidth: 1 }]}>
          <Image source={{ uri: image }} style={cover ? rc.roleImgCover : rc.roleImg} resizeMode={cover ? 'cover' : 'contain'} />
        </View>
        <View style={rc.labelWrap}>
          <View style={[rc.pill, { borderColor: border }]}>
            <Text style={[rc.pillTxt, { color }]}>{label}</Text>
          </View>
          <Text style={rc.sub}>{sub}</Text>
        </View>
      </AView>
    </Pressable>
  );
}

const rc = StyleSheet.create({
  imgCard:      { borderRadius: ws(80), width: ws(160), height: ws(160), alignItems: 'center', justifyContent: 'center', overflow: 'hidden', alignSelf: 'center' },
  roleImg:      { width: '100%', height: '100%' },
  roleImgCover: { width: '115%', height: '115%' },
  labelWrap:    { alignItems: 'center', paddingTop: hs(5), gap: hs(3) },
  pill:         { paddingHorizontal: ws(8), paddingVertical: hs(3), borderRadius: ws(14), borderWidth: 1.5 },
  pillTxt:      { fontSize: rf(9, 8, 11), fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase' },
  sub:          { fontSize: rf(9, 8, 10), fontWeight: '600', textAlign: 'center', color: '#94A3B8' },
});

const ROLES = [
  { key: 'dealer'      as UserRole, label: 'DEALER',      sub: 'Grow your Business', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', image: dealerURI      },
  { key: 'electrician' as UserRole, label: 'ELECTRICIAN', sub: 'Scan & Earn',        color: '#1565C0', bg: '#EBF4FF', border: '#BFDBFE', image: electricianURI },
  { key: 'user'        as UserRole, label: 'CUSTOMER',    sub: 'Explore Products',   color: '#6B7C2D', bg: '#F5F7EB', border: '#D4E09A', image: customerURI    },
  { key: 'counter-boy' as UserRole, label: 'COUNTER BOY', sub: 'Manage Customer',    color: '#E8453C', bg: '#FFF5F5', border: '#FECACA', image: counterboyURI  },
];

export default function MainSlide({ onRoleSelect }: MainSlideProps) {
  return (
    <View style={s.container}>
      <LogoSection />
      <View style={s.triRow}>
        <View style={[s.triBar, { backgroundColor: '#FF9933' }]} />
        <View style={[s.triBar, { backgroundColor: '#FFFFFF', borderTopWidth: 0.5, borderBottomWidth: 0.5, borderColor: '#ddd' }]} />
        <View style={[s.triBar, { backgroundColor: '#138808' }]} />
      </View>
      <Text style={s.welcome}>SRV Welcome's You</Text>
      <Text style={s.tagline}>{"North India's Largest Metal Box Manufacturer"}</Text>
      <View style={s.profileSection}>
        <View style={s.divRow}>
          <View style={s.divLine} />
          <Text style={s.divLabel}>CHOOSE YOUR PROFILE</Text>
          <View style={s.divLine} />
        </View>
        <View style={s.rolesGrid}>
          <View style={s.rolesRow}>
            {ROLES.slice(0, 2).map((r) => (
              <RoleCard key={r.key} label={r.label} sub={r.sub} color={r.color} bg={r.bg} border={r.border} image={r.image} cover={r.key === 'user' || r.key === 'counter-boy'} onPress={() => onRoleSelect(r.key)} />
            ))}
          </View>
          <View style={s.rolesRow}>
            {ROLES.slice(2, 4).map((r) => (
              <RoleCard key={r.key} label={r.label} sub={r.sub} color={r.color} bg={r.bg} border={r.border} image={r.image} cover={r.key === 'user' || r.key === 'counter-boy'} onPress={() => onRoleSelect(r.key)} />
            ))}
          </View>
        </View>
      </View>
      <View style={s.statsRow}>
        <View style={[s.statCard, { backgroundColor: '#FEE2E2' }]}>
          <Text style={[s.statNum, { color: '#E8453C' }]}>25+</Text>
          <Text style={[s.statLbl, { color: '#E8453C' }]}>YEARS</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: '#FEF3C7' }]}>
          <Text style={[s.statNum, { color: '#D97706' }]}>250+</Text>
          <Text style={[s.statLbl, { color: '#D97706' }]}>PRODUCTS</Text>
        </View>
        <View style={[s.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[s.statNum, { color: '#059669' }]}>100%</Text>
          <Text style={[s.statLbl, { color: '#059669' }]}>MADE IN INDIA</Text>
        </View>
      </View>
      <Text style={s.trust}>✦ 25 Years of Trust & Improvement ✦</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: ws(16), paddingTop: safeTop },
  triRow:         { flexDirection: 'row', height: hs(5), borderRadius: 3, overflow: 'hidden', marginBottom: hs(28) },
  triBar:         { flex: 1 },
  welcome:        { fontSize: rf(22, 18, 28), fontWeight: '900', color: '#E8453C', textAlign: 'center', marginBottom: hs(2) },
  tagline:        { fontSize: rf(13, 11, 16), fontWeight: '700', color: '#0F172A', textAlign: 'center', lineHeight: rf(18, 15, 22), marginBottom: hs(20) },
  profileSection: { marginBottom: hs(10) },
  divRow:         { flexDirection: 'row', alignItems: 'center', gap: ws(8), marginBottom: hs(10) },
  divLine:        { flex: 1, height: 1.5, backgroundColor: '#E8453C', opacity: 0.25, borderRadius: 1 },
  divLabel:       { fontSize: rf(10, 9, 12), fontWeight: '900', color: '#0F172A', letterSpacing: 1.5 },
  rolesGrid:      { gap: hs(8) },
  rolesRow:       { flexDirection: 'row', gap: ws(8) },
  statsRow:       { flexDirection: 'row', gap: ws(8), marginBottom: hs(8) },
  statCard:       { flex: 1, paddingVertical: hs(8), borderRadius: ws(12), alignItems: 'center' },
  statNum:        { fontSize: rf(15, 13, 20), fontWeight: '900', marginBottom: hs(1) },
  statLbl:        { fontSize: rf(8, 7, 10), fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase', textAlign: 'center' },
  trust:          { fontSize: rf(11, 9, 13), fontWeight: '700', color: '#D97706', textAlign: 'center', marginTop: hs(8), letterSpacing: 0.4 },
});
