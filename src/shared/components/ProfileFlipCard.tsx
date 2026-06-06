import { LinearGradient } from 'expo-linear-gradient';
import * as LegacyFileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
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
import Svg, { Path } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { counterboyTheme as cb } from '@/features/counterboy/theme';
import { useAppPageContent } from '@/shared/hooks/useAppPageContent';
import { usePreferenceContext } from '@/shared/preferences';
import { createShadow } from '@/shared/theme/shadows';
import { Dialog } from '@/shared/components/Dialog';

const logoImage = require('../../../assets/srv logo white.jpeg');

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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function getLogoDataUri() {
  try {
    const assetUri = Image.resolveAssetSource(logoImage).uri;
    const base64 = await LegacyFileSystem.readAsStringAsync(assetUri, {
      encoding: LegacyFileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
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

export default function ProfileFlipCard({ profile, role = 'electrician', photoUri, apiPhotoUri }: Props) {
  const { darkMode, tx, t } = usePreferenceContext();
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
  const counterboyLightCard = isCounterboy && !darkMode;
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
    const showBack = setTimeout(() => animateTo(true), 8000);
    const showFront = setTimeout(() => animateTo(false), 13000);
    return () => {
      clearTimeout(showBack);
      clearTimeout(showFront);
    };
  }, [animateTo]);

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
    if (next) {
      setTimeout(() => animateTo(false), 4500);
    }
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
  const frontEyebrowText =
    pageContent.eyebrowText ||
    (role === 'dealer'
      ? t('dealerPartner')
      : role === 'user'
      ? tx('Customer Account')
      : role === 'counterboy'
      ? tx('Counter Boy Account')
      : t('electricianPartner'));
  const flipHintText = pageContent.flipHintText || tx('Tap card to view QR & details');
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

  const buildPdfHtml = (logoDataUri: string | null) => {
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
            .logo img { width: 100%; height: 100%; object-fit: contain; background: white; }
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
              <div class="logo">${logoDataUri ? `<img src="${logoDataUri}" />` : 'SRV'}</div>
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
      const logoDataUri = await getLogoDataUri();
      const { uri } = await Print.printToFileAsync({
        html: buildPdfHtml(logoDataUri),
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

      const destination = `${LegacyFileSystem.documentDirectory ?? LegacyFileSystem.cacheDirectory}${fileName}`;
      await LegacyFileSystem.copyAsync({ from: uri, to: destination });
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
              colors={
                darkMode
                  ? isCounterboy
                    ? ([...cb.flipCardFrontDark] as const)
                    : (['#0F172A', '#16233B', '#1E3A5F'] as const)
                  : isDealer
                    ? ['#173E80', '#355C95', '#88AEEA']
                    : role === 'user'
                      ? ['#F0D2B6', '#E4BC98', '#CB8A57']
                      : isCounterboy
                        ? ([...cb.flipCardFrontLight] as const)
                        : ['#587AC7', '#4768B7', '#38549B']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientFill}
            >
              <View style={[styles.textureOne, darkMode ? styles.textureOneDark : null, isCounterboy ? (counterboyLightCard ? styles.textureOneCounterboyLight : styles.textureOneCounterboy) : null]} />
              <View
                style={[
                  styles.textureTwo,
                  isDealer ? styles.textureTwoDealer : null,
                  role === 'user' ? styles.textureTwoUser : null,
                  isCounterboy ? (counterboyLightCard ? styles.textureTwoCounterboyLight : styles.textureTwoCounterboy) : null,
                  darkMode ? styles.textureTwoDark : null,
                ]}
              />

              <View style={styles.frontTopRow}>
                <View style={styles.identityWrap}>
                  <View style={styles.avatarWrap}>
                    {effectivePhotoUri ? (
                      <Image source={{ uri: effectivePhotoUri }} style={styles.avatarImage} />
                    ) : (
                      <Text
                        style={[
                          styles.avatarText,
                          role === 'user' ? styles.avatarTextUser : null,
                          isCounterboy ? styles.avatarTextCounterboy : null,
                          counterboyLightCard ? styles.avatarTextCounterboyOnLight : null,
                        ]}
                      >
                        {initials}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.roleText,
                        role === 'user' ? styles.roleTextUser : null,
                        isCounterboy ? styles.roleTextCounterboy : null,
                        counterboyLightCard ? styles.roleTextCounterboyOnLight : null,
                        darkMode && !isCounterboy ? styles.roleTextDark : null,
                        darkMode && isCounterboy ? styles.roleTextCounterboyDark : null,
                      ]}
                    >
                      {frontEyebrowText}
                    </Text>
                    <Text style={[styles.nameText, role === 'user' ? styles.nameTextUser : null, isCounterboy ? styles.nameTextCounterboy : null, counterboyLightCard ? styles.nameTextCounterboyOnLight : null]}>
                      {profile?.name || fallbackText}
                    </Text>
                    <Text
                      style={[
                        styles.phoneText,
                        role === 'user' ? styles.phoneTextUser : null,
                        isCounterboy ? styles.phoneTextCounterboy : null,
                        counterboyLightCard ? styles.phoneTextCounterboyOnLight : null,
                        darkMode && !isCounterboy ? styles.phoneTextDark : null,
                        darkMode && isCounterboy ? styles.phoneTextCounterboyDark : null,
                      ]}
                    >
                      {profile?.phone ? '+91 ' + profile.phone : fallbackText}
                    </Text>
                    <Animated.Text
                      style={[
                        styles.inlineTapHint,
                        role === 'user' ? styles.inlineTapHintUser : null,
                        isCounterboy ? styles.inlineTapHintCounterboy : null,
                        counterboyLightCard ? styles.inlineTapHintCounterboyOnLight : null,
                        darkMode && !isCounterboy ? styles.inlineTapHintDark : null,
                        darkMode && isCounterboy ? styles.inlineTapHintCounterboyDark : null,
                        { transform: [{ scale: hintPulse }] },
                      ]}
                      numberOfLines={1}
                    >
                      {flipHintText}
                    </Animated.Text>
                  </View>
                </View>
              </View>

              <View style={styles.frontBottomRow}>
                <DetailPill
                  label={codeLabelText}
                  value={code || fallbackText}
                  isUser={role === 'user'}
                  isCounterboy={isCounterboy}
                  counterboyLight={counterboyLightCard}
                />
                <DetailPill
                  label={locationLabelText}
                  value={frontLocation}
                  isUser={role === 'user'}
                  isCounterboy={isCounterboy}
                  counterboyLight={counterboyLightCard}
                  icon={
                    <LocationIcon
                      color={
                        role === 'user' ? '#8D4A1E' : counterboyLightCard ? cb.primaryDeep : '#FFFFFF'
                      }
                    />
                  }
                />
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
              colors={
                darkMode
                  ? isCounterboy
                    ? ([...cb.flipCardBackDark] as const)
                    : (['#111827', '#172033', '#243B53'] as const)
                  : isDealer
                    ? ['#214D99', '#355C95', '#6F96D8']
                    : role === 'user'
                      ? ['#F5DFC9', '#EFCFAC', '#DDA373']
                      : isCounterboy
                        ? ([...cb.flipCardBackLight] as const)
                        : ['#6284C9', '#4B6DB4', '#35518C']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientFill}
            >
              <View
                style={[
                  styles.backGlowOne,
                  role === 'user' ? styles.backGlowOneUser : null,
                  isCounterboy ? styles.backGlowOneCounterboy : null,
                  darkMode ? styles.backGlowOneDark : null,
                ]}
              />
              <View
                style={[
                  styles.backGlowTwo,
                  role === 'user' ? styles.backGlowTwoUser : null,
                  isCounterboy ? styles.backGlowTwoCounterboy : null,
                  darkMode ? styles.backGlowTwoDark : null,
                ]}
              />
              <View style={styles.backContent}>
                <View style={styles.backLeft}>
                  <Text
                    style={[
                      styles.backHeading,
                      role === 'user' ? styles.backHeadingUser : null,
                      isCounterboy ? styles.backHeadingCounterboy : null,
                      darkMode && !isCounterboy ? styles.backHeadingDark : null,
                      darkMode && isCounterboy ? styles.backHeadingCounterboyDark : null,
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
      </View>
      <Dialog visible={dialog.visible} variant={dialog.variant} title={dialog.title} message={dialog.message} onClose={closeDialog} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 208,
    position: 'relative',
  },
  face: {
    position: 'absolute',
    width: '100%',
    height: 208,
    borderRadius: 28,
    overflow: 'hidden',
    ...createShadow({ color: '#020617', offsetY: 10, blur: 20, opacity: 0.22, elevation: 9 }),
  },
  pressArea: {
    width: '100%',
    height: '100%',
  },
  gradientFill: {
    flex: 1,
    padding: 15,
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
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
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
  inlineTapHint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 7.8,
    marginTop: 10,
    paddingRight: 2,
    flexShrink: 1,
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
  roleTextCounterboyOnLight: { color: '#7A4A38' },
  nameTextCounterboyOnLight: { color: '#2D1A10' },
  phoneTextCounterboyOnLight: { color: '#5C3D2E' },
  inlineTapHintCounterboyOnLight: { color: 'rgba(45,26,16,0.58)' },
  avatarTextCounterboyOnLight: { color: '#6B2D1D' },
  detailPillCounterboyLight: {
    backgroundColor: 'rgba(107,45,29,0.10)',
    borderColor: 'rgba(107,45,29,0.16)',
  },
  detailLabelCounterboyLight: { color: '#6B2D1D' },
  detailValueCounterboyLight: { color: '#2D1A10' },
  textureOneCounterboyLight: { backgroundColor: 'rgba(139,60,42,0.10)' },
  textureTwoCounterboyLight: { backgroundColor: 'rgba(111,78,55,0.08)' },
});
