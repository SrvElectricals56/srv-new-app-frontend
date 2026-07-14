import { LinearGradient } from 'expo-linear-gradient';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { counterboyTheme as cb } from '@/features/counterboy/theme';
import { useAppPageContent } from '@/shared/hooks/useAppPageContent';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import { Dialog } from '@/shared/components/Dialog';

interface Profile {
  name?: string;
  phone?: string;
  dealer_code?: string;
  electrician_code?: string;
  user_code?: string;
  counterboy_code?: string;
  dealer_name?: string;
  dealer_town?: string;
  dealer_phone?: string;
  town?: string;
  district?: string;
  state?: string;
  address?: string;
}

interface Props {
  profile?: Profile;
  role?: 'dealer' | 'electrician' | 'counterboy' | 'user';
  photoUri?: string | null;
  apiPhotoUri?: string | null;
  onOpenProfileEdit?: () => void;
}

function DownloadIcon({ color = '#FFFFFF', size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4.5v9m0 0l-3.5-3.5M12 13.5l3.5-3.5M5 16.5v1a2 2 0 002 2h10a2 2 0 002-2v-1"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LocationIcon({ color = '#FFFFFF', size = 12 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s6-5.33 6-11a6 6 0 10-12 0c0 5.67 6 11 6 11z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M12 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function TapClickIcon({ color = '#FFFFFF', size = 15 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.2 11.2V5.9a1.45 1.45 0 1 1 2.9 0v5.3"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Path
        d="M12.1 10.4l1.05-.58a1.55 1.55 0 0 1 2.15.62l.18.34.96-.52a1.54 1.54 0 0 1 2.13.66l.12.24.48-.22a1.42 1.42 0 0 1 1.94.78c.22.55.12 1.17-.26 1.62l-3.15 3.73a5.1 5.1 0 0 1-4.17 1.82h-.72a4.85 4.85 0 0 1-3.82-1.86l-2.1-2.66a1.5 1.5 0 0 1 .2-2.08 1.63 1.63 0 0 1 2.2.06l.92.9"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.1 5.1L3.8 3.8M18.9 5.1l1.3-1.3M5.1 18.9l-1.3 1.3"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function RoleBoltIcon({ color = '#F4DFC0', size = 22 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L5 13h6l-1 9 9-13h-6l1-7z" fill={color} />
    </Svg>
  );
}

function VerifiedSealIcon({ size = 34 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M24 3.5l4.2 3.2 5.2-.6 2.5 4.6 4.9 1.9.1 5.3 3.1 4.2-2.4 4.7.9 5.2-4.5 2.8-1.7 5-5.3.4-4 3.4-4.8-2.2-5.1 1.2-3-4.3-5.1-1.4-.7-5.2-3.6-3.8 1.9-4.9-1.6-5 3.9-3.5 1-5.2 5.1-1.1 3.3-4.1 5 1.6z"
        fill="#F2D9AE"
      />
      <Path d="M16.3 24.1l5.1 5.1 10.9-11.4" stroke="#123C42" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ProfileLineIcon({ color = '#F4DFC0', size = 26 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={2} />
      <Path d="M4.5 20c0-4 3.3-7 7.5-7s7.5 3 7.5 7" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function PathPhoneIcon({ color = '#F4DFC0', size = 18 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7.1 4.8h2.5l1.2 3.6-1.6 1.5a14 14 0 004.9 4.9l1.5-1.6 3.6 1.2v2.5a1.7 1.7 0 01-1.7 1.7A14.1 14.1 0 015.4 6.5a1.7 1.7 0 011.7-1.7z"
        fill={color}
      />
    </Svg>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function DetailPill({
  label,
  value,
  compact = false,
  lines,
  icon,
  isUser = false,
  isCounterboy = false,
  counterboyLight = false,
}: {
  label: string;
  value: string;
  compact?: boolean;
  lines?: number;
  icon?: React.ReactNode;
  isUser?: boolean;
  isCounterboy?: boolean;
  /** Light flip-card surface (higher contrast pills/text) */
  counterboyLight?: boolean;
}) {
  const { tx } = usePreferenceContext();
  return (
    <View
      style={[
        styles.detailPill,
        isUser ? styles.detailPillUser : null,
        isCounterboy ? (counterboyLight ? styles.detailPillCounterboyLight : styles.detailPillCounterboy) : null,
        compact && styles.detailPillCompact,
      ]}
    >
      <Text
        style={[
          styles.detailLabel,
          isUser ? styles.detailLabelUser : null,
          isCounterboy ? (counterboyLight ? styles.detailLabelCounterboyLight : styles.detailLabelCounterboy) : null,
        ]}
      >
        {tx(label)}
      </Text>
      <View style={styles.detailValueRow}>
        {icon ? <View style={styles.detailIconWrap}>{icon}</View> : null}
        <Text
          style={[
            styles.detailValue,
            isUser ? styles.detailValueUser : null,
            isCounterboy ? (counterboyLight ? styles.detailValueCounterboyLight : styles.detailValueCounterboy) : null,
            compact && styles.detailValueCompact,
          ]}
          numberOfLines={lines}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileFlipCard({ profile, role = 'electrician', photoUri, apiPhotoUri, onOpenProfileEdit }: Props) {
  const { darkMode, tx } = usePreferenceContext();
  const pageContent = useAppPageContent(role, 'profile');
  // Use local photo first, then API photo from backend (set by admin)
  const effectivePhotoUri = photoUri ?? apiPhotoUri ?? null;
  const [flipped, setFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; onOk?: () => void }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));
  const flipAnim = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(1)).current;

  const initials = (profile?.name || 'U')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isDealer = role === 'dealer';
  const isUser = role === 'user';
  const isCounterboy = role === 'counterboy';
  const usesOwnAccountDetails = isDealer || isUser || isCounterboy;
  const code = isDealer
    ? profile?.dealer_code
    : isUser
    ? profile?.user_code
    : isCounterboy
    ? profile?.counterboy_code
    : profile?.electrician_code;
  const qrValue = code || profile?.phone || 'SRV';
  const qrUrl =
    'https://quickchart.io/qr?text=' +
    encodeURIComponent(qrValue) +
    '&size=220&margin=1&dark=111827&light=FFFFFF';

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.51, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 0.51, 1],
    outputRange: [0, 0, 1, 1],
  });

  const animateTo = useCallback(
    (toBack: boolean) => {
      setFlipped(toBack);
      Animated.spring(
        flipAnim,
        withWebSafeNativeDriver({
          toValue: toBack ? 1 : 0,
          tension: 70,
          friction: 9,
        })
      ).start();
    },
    [flipAnim]
  );

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, withWebSafeNativeDriver({ toValue: 1.06, duration: 900 })),
        Animated.timing(hintPulse, withWebSafeNativeDriver({ toValue: 1, duration: 900 })),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [hintPulse]);

  const onToggle = () => {
    const next = !flipped;
    animateTo(next);
  };

  const fallbackText = tx('Not available');
  const detailName = usesOwnAccountDetails
    ? profile?.name || fallbackText
    : profile?.dealer_name || fallbackText;
  const formatTranslatedLocation = (parts: (string | undefined)[]) =>
    parts
      .filter(Boolean)
      .map((part) => tx(part as string))
      .join(', ');

  const detailLocation = usesOwnAccountDetails
    ? formatTranslatedLocation([profile?.town, profile?.state]) || fallbackText
    : formatTranslatedLocation([profile?.dealer_town, profile?.state]) || fallbackText;
  const detailPhoneValue = usesOwnAccountDetails ? profile?.phone : profile?.dealer_phone;
  const detailPhone = detailPhoneValue ? '+91 ' + detailPhoneValue : fallbackText;
  const detailAddress = profile?.address
    ? profile.address
        .replace(/\bPunjab\b/g, tx('Punjab'))
        .replace(/\bMansa\b/g, tx('Mansa'))
        .replace(/\bIndia\b/g, tx('India'))
    : fallbackText;
  const frontLocation =
    isDealer
      ? detailLocation
      : formatTranslatedLocation([profile?.town, profile?.state]) || fallbackText;
  const codeLabel = isDealer
    ? tx('Dealer Code')
    : isUser
    ? tx('Customer ID')
    : isCounterboy
    ? tx('Counter Boy ID')
    : tx('Electrician Code');
  const backThirdLabel = usesOwnAccountDetails ? tx('Address') : tx('Phone Number');
  const backThirdValue = usesOwnAccountDetails ? detailAddress : detailPhone;
  const premiumRoleTitle =
    pageContent.eyebrowText ||
    (role === 'dealer'
      ? tx('Dealer Partner')
      : role === 'user'
        ? tx('Customer Account')
        : role === 'counterboy'
          ? tx('Counter Boy Account')
          : tx('Electrician Partner'));
  const premiumTheme =
    role === 'user'
      ? {
          gradient: darkMode ? (['#27170F', '#5B321D', '#9A6134'] as const) : (['#FFF7EC', '#E9D1B7', '#C98A58'] as const),
          accent: '#9A5B2F',
          accent2: '#D78B3B',
          title: '#3B2115',
          text: '#4A2A18',
          softText: '#6A3E24',
          light: '#F8EADB',
          panel: 'rgba(255,255,255,0.56)',
          panelBorder: 'rgba(154,91,47,0.22)',
          strip: 'rgba(106,62,36,0.08)',
        }
      : role === 'dealer'
        ? {
            gradient: darkMode ? (['#071527', '#0E335A', '#174A7C'] as const) : (['#092345', '#0B3E73', '#155C96'] as const),
            accent: '#7CC9FF',
            accent2: '#2EA8FF',
            title: '#FFFFFF',
            text: '#EAF6FF',
            softText: '#CFEAFF',
            light: '#E8F5FF',
            panel: 'rgba(31,111,179,0.28)',
            panelBorder: 'rgba(124,201,255,0.34)',
            strip: 'rgba(124,201,255,0.12)',
          }
        : {
            gradient: darkMode ? (['#020B18', '#082A53', '#0B477F'] as const) : (['#03152F', '#052E63', '#084F91'] as const),
            accent: '#22D3EE',
            accent2: '#0EA5E9',
            title: '#FFFFFF',
            text: '#EAFBFF',
            softText: '#BDEFFF',
            light: '#E6FBFF',
            panel: 'rgba(14,165,233,0.24)',
            panelBorder: 'rgba(34,211,238,0.38)',
            strip: 'rgba(34,211,238,0.12)',
          };
  const premiumTapTextColor = role === 'user' ? premiumTheme.title : '#082A53';
  const flipHintText =
    (flipped
      ? tx('Tap to return to profile card')
      : tx('Tap to view your details'));
  const codeLabelText = pageContent.codeLabel || codeLabel;
  const locationLabelText = pageContent.locationLabel || tx('Location');
  const detailHeadingText =
    pageContent.cardTitle ||
    tx(isDealer ? 'Business Details' : usesOwnAccountDetails ? 'Account Details' : 'Connected Dealer');
  const nameLabelText = pageContent.nameLabel || tx('Name');
  const backThirdLabelText = pageContent.thirdDetailLabel || backThirdLabel;
  const exportName =
    (profile?.name || detailName || fallbackText)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'srv-profile-card';

  const buildPdfHtml = () => {
    const profileName = escapeHtml(profile?.name || fallbackText);
    const profilePhone = escapeHtml(profile?.phone ? '+91 ' + profile.phone : fallbackText);
    const location = escapeHtml(frontLocation);
    const safeCode = escapeHtml(code || fallbackText);
    const safeDetailName = escapeHtml(detailName);
    const safeDetailLocation = escapeHtml(detailLocation);
    const safeDetailPhone = escapeHtml(detailPhone);
    const safeDetailAddress = escapeHtml(detailAddress);
    const heading = escapeHtml(detailHeadingText);
    const partnerRole = escapeHtml(
      tx(
        isDealer
          ? 'Dealer Partner'
          : isUser
            ? 'Customer Account'
          : isCounterboy
            ? 'Counter Boy Account'
            : 'Electrician Partner',
      ),
    );
    const safeCodeLabel = escapeHtml(codeLabelText);
    const safeLocationLabel = escapeHtml(locationLabelText);
    const safeNameLabel = escapeHtml(nameLabelText);
    const safeBackThirdLabel = escapeHtml(backThirdLabelText);

    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: Arial, sans-serif; background: ${role === 'counterboy' ? '#F5EDE4' : '#eef4ff'}; margin: 0; padding: 28px; color: #0f172a; }
            .title { font-size: 22px; font-weight: 800; margin-bottom: 18px; color: ${role === 'counterboy' ? '#6B2D1D' : '#10254a'}; }
            .card { border-radius: 28px; padding: 22px; margin-bottom: 22px; color: white; overflow: hidden; }
            .front { background: linear-gradient(135deg, ${role === 'counterboy' ? '#EDD4CC, #E0C0B6, #D6B3A8' : '#587ac7, #4768b7, #38549b'}); }
            .back { background: linear-gradient(135deg, ${role === 'counterboy' ? '#D9B8AD, #CFAD9F, #C5A292' : '#6284c9, #4b6db4, #35518c'}); }
            .row { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
            .identity { display: flex; gap: 14px; align-items: center; flex: 1; }
            .avatar { width: 66px; height: 66px; border-radius: 22px; background: white; color: #10254a; font-size: 24px; font-weight: 900; display: flex; align-items: center; justify-content: center; }
            .eyebrow { color: ${role === 'counterboy' ? '#6B2D1D' : '#afc0e4'}; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
            .name { font-size: 22px; font-weight: 800; margin-bottom: 4px; color: ${role === 'counterboy' ? '#2D1A10' : 'inherit'}; }
            .phone { font-size: 13px; color: ${role === 'counterboy' ? '#5C3D2E' : '#d8e3f8'}; }
            .logo { width: 54px; height: 54px; border-radius: 18px; background: rgba(255,255,255,0.18); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; overflow: hidden; }
            .pill-row { display: flex; gap: 12px; margin-top: 20px; }
            .pill { flex: 1; background: ${role === 'counterboy' ? 'rgba(107,45,29,0.08)' : 'rgba(255,255,255,0.12)'}; border: 1px solid ${role === 'counterboy' ? 'rgba(107,45,29,0.12)' : 'rgba(255,255,255,0.08)'}; border-radius: 18px; padding: 12px; }
            .pill-label { color: ${role === 'counterboy' ? '#7A4A38' : '#96a7c5'}; font-size: 10px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.8px; }
            .pill-value { font-size: 13px; font-weight: 800; line-height: 18px; color: ${role === 'counterboy' ? '#2D1A10' : '#ffffff'}; }
            .back-layout { display: flex; gap: 14px; align-items: stretch; }
            .back-left { flex: 1; }
            .stack { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
            .qr-panel { width: 112px; text-align: center; }
            .qr-frame { background: white; border-radius: 18px; padding: 8px; }
            .qr-frame img { width: 100%; height: 96px; object-fit: contain; }
            .qr-text { color: ${role === 'counterboy' ? '#E8D4C8' : '#afc0e4'}; font-size: 10px; font-weight: 700; margin-top: 8px; word-break: break-word; }
          </style>
        </head>
        <body>
          <div class="title">${escapeHtml(tx('SRV Profile Card'))}</div>
          <div class="card front">
            <div class="row">
              <div class="identity">
                <div class="avatar">${escapeHtml(initials)}</div>
                <div>
                  <div class="eyebrow">${partnerRole}</div>
                  <div class="name">${profileName}</div>
                  <div class="phone">${profilePhone}</div>
                </div>
              </div>
              <div class="logo">${escapeHtml(initials)}</div>
            </div>
            <div class="pill-row">
              <div class="pill">
                <div class="pill-label">${safeCodeLabel}</div>
                <div class="pill-value">${safeCode}</div>
              </div>
              <div class="pill">
                <div class="pill-label">${safeLocationLabel}</div>
                <div class="pill-value">${location}</div>
              </div>
            </div>
          </div>
          <div class="card back">
            <div class="back-layout">
              <div class="back-left">
                <div class="eyebrow">${heading}</div>
                  <div class="stack">
                  <div class="pill"><div class="pill-label">${safeNameLabel}</div><div class="pill-value">${safeDetailName}</div></div>
                  <div class="pill"><div class="pill-label">${safeLocationLabel}</div><div class="pill-value">${safeDetailLocation}</div></div>
                  <div class="pill"><div class="pill-label">${safeBackThirdLabel}</div><div class="pill-value">${usesOwnAccountDetails ? safeDetailAddress : safeDetailPhone}</div></div>
                </div>
              </div>
              <div class="qr-panel">
                <div class="qr-frame"><img src="${qrUrl}" /></div>
                <div class="qr-text">${safeCode}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloading(true);
      const { uri } = await Print.printToFileAsync({
        html: buildPdfHtml(),
        base64: false,
      });
      const fileName = `${exportName}-srv-card.pdf`;

      if (Platform.OS === 'android') {
        const permission =
          await LegacyFileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permission.granted) {
          setDialog({ visible: true, variant: 'info', title: tx('Save cancelled'), message: tx('Folder not selected.') });
          return;
        }

        const base64 = await LegacyFileSystem.readAsStringAsync(uri, {
          encoding: LegacyFileSystem.EncodingType.Base64,
        });
        const targetUri = await LegacyFileSystem.StorageAccessFramework.createFileAsync(
          permission.directoryUri,
          fileName.replace(/\.pdf$/i, ''),
          'application/pdf'
        );
        await LegacyFileSystem.StorageAccessFramework.writeAsStringAsync(targetUri, base64, {
          encoding: LegacyFileSystem.EncodingType.Base64,
        });
        setDialog({ visible: true, variant: 'success', title: tx('PDF saved'), message: tx('Profile card PDF saved to your selected device folder.') });
        return;
      }

      const destination = `${LegacyFileSystem.cacheDirectory ?? LegacyFileSystem.documentDirectory}${fileName}`;
      await LegacyFileSystem.copyAsync({ from: uri, to: destination });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(destination, {
          UTI: 'com.adobe.pdf',
          mimeType: 'application/pdf',
          dialogTitle: tx('Save profile card PDF'),
        });
        setDialog({ visible: true, variant: 'success', title: tx('PDF saved'), message: tx('Profile card PDF saved to your selected device folder.') });
        return;
      }

      setDialog({ visible: true, variant: 'success', title: tx('PDF saved'), message: `${tx('Saved in local files:')}\n${destination}` });
    } catch {
      setDialog({ visible: true, variant: 'error', title: tx('Download failed'), message: tx('Unable to create the profile card PDF right now.') });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <View>
      <View style={styles.container}>
        <Pressable onPress={onToggle} style={styles.pressArea}>
          <Animated.View
            style={[
              styles.face,
              { pointerEvents: 'none' },
              { opacity: frontOpacity, transform: [{ rotateY: frontRotate }] },
            ]}
          >
            <LinearGradient
              colors={premiumTheme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientFill}
            >
              <View style={[styles.premiumGlowTop, { backgroundColor: premiumTheme.strip }]} />
              <View style={[styles.premiumGlowBottom, { backgroundColor: premiumTheme.strip }]} />
              <View style={[styles.premiumWaveTop, { backgroundColor: premiumTheme.panelBorder, shadowColor: premiumTheme.accent }]} />
              <View style={styles.premiumDotField}>
                {Array.from({ length: 20 }).map((_, index) => (
                  <View key={index} style={[styles.premiumDot, { backgroundColor: premiumTheme.accent }]} />
                ))}
              </View>

              <View style={styles.premiumTopRow}>
                <Pressable style={[styles.premiumLogoMedallion, { borderColor: premiumTheme.accent, backgroundColor: premiumTheme.strip }]} onPress={onOpenProfileEdit}>
                  <View style={styles.premiumLogoRing}>
                    <View style={styles.premiumLogoInner}>
                      {effectivePhotoUri ? (
                        <Image source={{ uri: effectivePhotoUri }} style={styles.premiumLogoImage} />
                      ) : (
                        <Text style={[styles.premiumInitialsText, { color: premiumTheme.title }]}>{initials}</Text>
                      )}
                    </View>
                  </View>
                </Pressable>

                <View style={styles.premiumIdentity}>
                  <View style={styles.premiumRoleRow}>
                    <View style={[styles.premiumRoleBadge, { borderColor: premiumTheme.accent, backgroundColor: premiumTheme.strip }]}>
                      <RoleBoltIcon size={15} color={premiumTheme.accent} />
                    </View>
                    <Text style={[styles.premiumRoleText, { color: premiumTheme.accent }]} numberOfLines={1}>{premiumRoleTitle}</Text>
                  </View>
                  <View style={styles.premiumNameRow}>
                    <Text style={[styles.premiumNameText, { color: premiumTheme.title }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68}>
                      {profile?.name || fallbackText}
                    </Text>
                    <VerifiedSealIcon size={24} />
                  </View>
                  <View style={styles.premiumPhoneRow}>
                    <View style={[styles.premiumPhoneBubble, { backgroundColor: premiumTheme.panel, borderColor: premiumTheme.panelBorder }]}>
                      <PathPhoneIcon color={premiumTheme.accent} />
                    </View>
                    <Text style={[styles.premiumPhoneText, { color: premiumTheme.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.72}>
                      {profile?.phone ? '+91 ' + profile.phone : fallbackText}
                    </Text>
                  </View>
                </View>
              </View>

              <Animated.View style={[styles.premiumTapPill, { transform: [{ scale: hintPulse }] }]}>
                <Text style={[styles.premiumTapText, { color: premiumTapTextColor }]} numberOfLines={1}>{flipHintText}</Text>
                <View style={[styles.premiumTapIcon, { backgroundColor: premiumTheme.title === '#FFFFFF' ? '#082A53' : '#6A3E24', borderColor: premiumTheme.panelBorder }]}>
                  <TapClickIcon color={premiumTheme.accent} size={24} />
                </View>
              </Animated.View>

              <View style={styles.premiumInfoRow}>
                <View style={[styles.premiumCodeCard, { backgroundColor: premiumTheme.light, borderColor: premiumTheme.panelBorder }]}>
                  <View style={[styles.premiumInfoIconBox, { backgroundColor: premiumTheme.title === '#FFFFFF' ? '#082A53' : '#6A3E24', borderColor: premiumTheme.panelBorder }]}>
                    <ProfileLineIcon color={premiumTheme.accent} size={22} />
                  </View>
                  <View style={styles.premiumInfoTextWrap}>
                    <Text style={[styles.premiumInfoLabel, { color: premiumTheme.accent2 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.55}>{codeLabelText}</Text>
                    <View style={[styles.premiumLabelRule, { backgroundColor: premiumTheme.panelBorder }]} />
                    <Text style={[styles.premiumInfoValue, { color: premiumTheme.title === '#FFFFFF' ? '#082A53' : premiumTheme.title }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68}>
                      {code || fallbackText}
                    </Text>
                  </View>
                  <View style={styles.premiumMicroDots} pointerEvents="none">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <View key={index} style={[styles.premiumMicroDot, { backgroundColor: premiumTheme.title === '#FFFFFF' ? '#082A53' : premiumTheme.title }]} />
                    ))}
                  </View>
                </View>

                <View style={[styles.premiumLocationCard, { backgroundColor: premiumTheme.panel, borderColor: premiumTheme.panelBorder }]}>
                  <View style={[styles.premiumInfoIconBox, { backgroundColor: premiumTheme.title === '#FFFFFF' ? '#082A53' : '#6A3E24', borderColor: premiumTheme.panelBorder }]}>
                    <LocationIcon color={premiumTheme.accent} size={22} />
                  </View>
                  <View style={styles.premiumInfoTextWrap}>
                    <Text style={[styles.premiumInfoLabel, { color: premiumTheme.accent }]} numberOfLines={1}>{locationLabelText}</Text>
                    <View style={[styles.premiumLabelRule, { backgroundColor: premiumTheme.panelBorder }]} />
                    <Text style={[styles.premiumLocationValue, { color: premiumTheme.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.68}>
                      {frontLocation}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View
            style={[
              styles.face,
              { pointerEvents: 'none' },
              { opacity: backOpacity, transform: [{ rotateY: backRotate }] },
            ]}
          >
            <LinearGradient
              colors={premiumTheme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientFill}
            >
              <View
                style={[
                  styles.backGlowOne,
                  { backgroundColor: premiumTheme.strip },
                ]}
              />
              <View
                style={[
                  styles.backGlowTwo,
                  { backgroundColor: premiumTheme.strip },
                ]}
              />
              <View style={styles.backContent}>
                <View style={styles.backLeft}>
                  <Text
                    style={[
                      styles.backHeading,
                      { color: premiumTheme.text },
                    ]}
                  >
                    {detailHeadingText}
                  </Text>
                  <View style={styles.metaStack}>
                    <DetailPill label={nameLabelText} value={detailName} compact isUser={isUser} isCounterboy={isCounterboy} />
                    <DetailPill label={locationLabelText} value={detailLocation} compact lines={2} isUser={isUser} isCounterboy={isCounterboy} />
                    <DetailPill
                      label={backThirdLabelText}
                      value={backThirdValue}
                      compact
                      isUser={isUser}
                      isCounterboy={isCounterboy}
                      lines={usesOwnAccountDetails ? 2 : undefined}
                    />
                  </View>
                </View>

                <View style={styles.qrPanel}>
                  <View style={styles.qrFrame}>
                    <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
                  </View>
                  <Text
                    style={[
                      styles.qrCodeText,
                      role === 'user' ? styles.qrCodeTextUser : null,
                      isCounterboy ? styles.qrCodeTextCounterboy : null,
                    ]}
                    numberOfLines={1}
                  >
                    {qrValue}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </Pressable>

        <TouchableOpacity
          style={[styles.downloadMiniBtn, darkMode ? styles.downloadMiniBtnDark : null]}
          activeOpacity={0.9}
          onPress={() => void handleDownloadPdf()}
          disabled={isDownloading}
        >
          <DownloadIcon size={15} />
        </TouchableOpacity>
        {onOpenProfileEdit ? (
          <TouchableOpacity
            style={styles.profileEditTapArea}
            activeOpacity={0.85}
            onPress={onOpenProfileEdit}
          />
        ) : null}
      </View>
      <Dialog visible={dialog.visible} variant={dialog.variant} title={dialog.title} message={dialog.message} onClose={closeDialog} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 498 / 332,
    position: 'relative',
  },
  face: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(244,223,192,0.72)',
    ...createShadow({ color: '#020617', offsetY: 14, blur: 28, opacity: 0.26, elevation: 11 }),
  },
  pressArea: {
    width: '100%',
    height: '100%',
  },
  gradientFill: {
    flex: 1,
    padding: 12,
  },
  premiumGlowTop: {
    position: 'absolute',
    top: -58,
    right: -24,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  premiumGlowBottom: {
    position: 'absolute',
    bottom: -70,
    left: -34,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(244,223,192,0.09)',
  },
  premiumWaveTop: {
    position: 'absolute',
    right: 14,
    top: 18,
    width: 118,
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(244,223,192,0.2)',
    shadowColor: '#F4DFC0',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  premiumDotField: {
    position: 'absolute',
    left: 13,
    bottom: 78,
    width: 84,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    opacity: 0.58,
  },
  premiumDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#F4DFC0',
  },
  premiumTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    minHeight: 88,
  },
  premiumLogoMedallion: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2.5,
    borderColor: 'rgba(244,223,192,0.9)',
    padding: 5,
    backgroundColor: 'rgba(244,223,192,0.08)',
    ...createShadow({ color: '#000000', offsetY: 8, blur: 14, opacity: 0.26, elevation: 8 }),
  },
  premiumLogoRing: {
    flex: 1,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    padding: 3,
  },
  premiumLogoInner: {
    flex: 1,
    borderRadius: 36,
    backgroundColor: '#F4E8D4',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumLogoImage: {
    width: '100%',
    height: '100%',
  },
  premiumInitialsText: {
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
  },
  premiumIdentity: {
    flex: 1,
    minWidth: 0,
    paddingTop: 2,
  },
  premiumRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  premiumRoleBadge: {
    width: 25,
    height: 25,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#F4DFC0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumRoleText: {
    color: '#F4DFC0',
    fontSize: 9.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    flexShrink: 1,
  },
  premiumNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  premiumNameText: {
    color: '#F8FAFC',
    fontSize: 22,
    lineHeight: 25,
    fontWeight: '900',
    flexShrink: 1,
    textShadowColor: 'rgba(0,0,0,0.22)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  premiumPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 7,
  },
  premiumPhoneBubble: {
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: 'rgba(244,223,192,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(244,223,192,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumPhoneText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
  },
  premiumSideLogo: {
    width: 58,
    height: 58,
    opacity: 0.95,
  },
  premiumTapPill: {
    alignSelf: 'center',
    marginTop: 4,
    height: 38,
    minWidth: 190,
    maxWidth: '88%',
    paddingLeft: 18,
    paddingRight: 42,
    borderRadius: 20,
    backgroundColor: '#F1E9DC',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: '#000000', offsetY: 5, blur: 10, opacity: 0.22, elevation: 6 }),
  },
  premiumTapText: {
    color: '#173F45',
    fontSize: 13,
    fontWeight: '900',
  },
  premiumTapIcon: {
    position: 'absolute',
    right: -2,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#123C42',
    borderWidth: 2,
    borderColor: 'rgba(244,223,192,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumInfoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  premiumCodeCard: {
    flex: 1.14,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: '#F1E9DC',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
    overflow: 'hidden',
  },
  premiumLocationCard: {
    flex: 0.96,
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244,223,192,0.38)',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    overflow: 'hidden',
  },
  premiumInfoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#173F45',
    borderWidth: 1,
    borderColor: 'rgba(244,223,192,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  premiumInfoTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  premiumInfoLabel: {
    color: '#F4DFC0',
    fontSize: 8.2,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
    flexShrink: 1,
    includeFontPadding: false,
  },
  premiumLabelRule: {
    width: 28,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: 'rgba(244,223,192,0.45)',
    marginTop: 3,
    marginBottom: 4,
  },
  premiumInfoValue: {
    color: '#173F45',
    fontSize: 13.5,
    fontWeight: '900',
    flexShrink: 1,
  },
  premiumLocationValue: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '900',
  },
  premiumMicroDots: {
    width: 17,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    opacity: 0.32,
  },
  premiumMicroDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#173F45',
  },
  textureOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(59,130,246,0.16)',
    top: -30,
    right: -40,
  },
  textureOneCounterboy: {
    backgroundColor: 'rgba(139,60,42,0.22)',
  },
  textureOneDark: {
    backgroundColor: 'rgba(59,130,246,0.12)',
  },
  textureTwo: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(232,69,60,0.14)',
    bottom: -24,
    left: -18,
  },
  textureTwoDark: {
    backgroundColor: 'rgba(14,165,233,0.1)',
  },
  textureTwoDealer: {
    backgroundColor: 'rgba(191,219,254,0.22)',
  },
  textureTwoUser: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  textureTwoCounterboy: {
    backgroundColor: 'rgba(111,78,55,0.18)',
  },
  downloadMiniBtn: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  downloadMiniBtnDark: {
    backgroundColor: 'rgba(15,23,42,0.78)',
    borderColor: 'rgba(148,163,184,0.28)',
  },
  profileEditTapArea: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 94,
    height: 94,
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 4,
    zIndex: 4,
  },
  backGlowOne: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(56,189,248,0.12)',
    top: -24,
    right: -20,
  },
  backGlowOneDark: {
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  backGlowOneUser: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  backGlowOneCounterboy: {
    backgroundColor: 'rgba(139,60,42,0.2)',
  },
  backGlowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(244,114,182,0.12)',
    bottom: -18,
    left: -14,
  },
  frontTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
    gap: 12,
    paddingRight: 28,
  },
  identityWrap: { flexDirection: 'row', gap: 12, flex: 1 },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  backGlowTwoDark: {
    backgroundColor: 'rgba(14,165,233,0.09)',
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { color: '#10254A', fontSize: 24, fontWeight: '900' },
  avatarTextUser: { color: '#8D4A1E' },
  avatarTextCounterboy: { color: '#F9F4ED' },
  backGlowTwoUser: {
    backgroundColor: 'rgba(255,243,230,0.24)',
  },
  backGlowTwoCounterboy: {
    backgroundColor: 'rgba(240,223,208,0.16)',
  },
  roleText: {
    color: '#AFC0E4',
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  roleTextDark: { color: '#BFDBFE' },
  roleTextUser: { color: '#8D4A1E' },
  roleTextCounterboy: { color: cb.slate },
  roleTextCounterboyDark: { color: '#C4A88C' },
  nameText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', flexShrink: 1 },
  nameTextUser: { color: '#4E2B14' },
  nameTextCounterboy: { color: '#FFFEF9' },
  phoneText: { color: '#D8E3F8', fontSize: 12.5, marginTop: 5 },
  phoneTextDark: { color: '#CBD5E1' },
  phoneTextUser: { color: '#7A5336' },
  phoneTextCounterboy: { color: '#E8D9CC' },
  phoneTextCounterboyDark: { color: '#D4C4B8' },
  inlineTapHintWrap: {
    marginTop: 12,
    marginLeft: 56,
    alignSelf: 'flex-start',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    maxWidth: 170,
  },
  inlineTapHint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 10.5,
    lineHeight: 13,
    fontWeight: '900',
    paddingRight: 2,
    flexShrink: 1,
    textAlign: 'center',
  },
  inlineTapIcon: {
    width: 38,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    overflow: 'hidden',
  },
  inlineTapIconLight: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderColor: 'rgba(106,47,18,0.12)',
  },
  inlineTapIconGlow: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    right: -6,
    top: -8,
  },
  inlineTapHintDark: { color: 'rgba(226,232,240,0.82)' },
  inlineTapHintUser: { color: 'rgba(92,50,22,0.78)' },
  inlineTapHintCounterboy: { color: 'rgba(245,237,228,0.88)' },
  inlineTapHintCounterboyDark: { color: 'rgba(212,196,184,0.9)' },

  frontBottomRow: {
    position: 'absolute',
    left: 15,
    right: 15,
    bottom: 15,
    flexDirection: 'row',
    gap: 10,
  },
  detailPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  detailPillUser: {
    backgroundColor: 'rgba(255,255,255,0.52)',
    borderColor: 'rgba(141,74,30,0.12)',
  },
  detailPillCounterboy: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(245,237,228,0.12)',
  },
  detailPillCompact: {
    flex: 0,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 14,
    minHeight: 0,
  },
  detailLabel: {
    color: '#D8E4FF',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailLabelUser: { color: '#9A6035' },
  detailLabelCounterboy: { color: '#E8D4C8' },
  detailValueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailIconWrap: { alignItems: 'center', justifyContent: 'center' },
  detailValue: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', flexShrink: 1, lineHeight: 13 },
  detailValueUser: { color: '#5C3216' },
  detailValueCounterboy: { color: '#FFFEF9' },
  detailValueCompact: { fontSize: 9.5, lineHeight: 12, flex: 1 },
  backContent: { flexDirection: 'row', flex: 1, gap: 10, alignItems: 'stretch' },
  backLeft: { flex: 1, justifyContent: 'flex-start', minWidth: 0 },
  backHeading: {
    color: '#E4EDFF',
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingRight: 34,
  },
  backHeadingDark: { color: '#DBEAFE' },
  backHeadingUser: { color: '#6A2F12' },
  backHeadingCounterboy: { color: '#F5EDE4' },
  backHeadingCounterboyDark: { color: '#E8D9CC' },
  metaStack: { gap: 4, marginTop: 8, paddingRight: 1 },
  qrPanel: { width: 92, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  qrFrame: {
    width: 62,
    height: 62,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 5,
  },
  qrImage: { width: '100%', height: '100%' },
  qrCodeText: {
    color: '#C7D5F3',
    fontSize: 7.4,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 5,
    width: '100%',
  },
  qrCodeTextUser: { color: '#8D4A1E' },
  qrCodeTextCounterboy: { color: '#E8D4C8' },
  roleTextCounterboyOnLight: { color: '#5C2F21' },
  nameTextCounterboyOnLight: { color: '#24120C' },
  phoneTextCounterboyOnLight: { color: '#4D2A1E' },
  inlineTapHintCounterboyOnLight: { color: 'rgba(45,26,16,0.72)', fontWeight: '700' },
  avatarTextCounterboyOnLight: { color: '#6B2D1D' },
  detailPillCounterboyLight: {
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderColor: 'rgba(107,45,29,0.20)',
  },
  detailLabelCounterboyLight: { color: '#6B2D1D' },
  detailValueCounterboyLight: { color: '#2D1A10' },
  textureOneCounterboyLight: { backgroundColor: 'rgba(139,60,42,0.16)' },
  textureTwoCounterboyLight: { backgroundColor: 'rgba(255,255,255,0.18)' },
});
