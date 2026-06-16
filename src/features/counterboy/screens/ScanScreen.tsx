import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Camera, CameraView, scanFromURLAsync } from 'expo-camera';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { withWebSafeNativeDriver } from '@/shared/animations/nativeDriver';
import { usePreferenceContext } from '@/shared/preferences';
import { scanApi } from '@/shared/api';
import { clearShadow, createShadow } from '@/shared/theme/shadows';
import type { RewardHistoryItem, ScanMode } from '@/shared/types/rewards';
import type { Screen } from '@/shared/types/navigation';
import { Dialog } from '@/shared/components/Dialog';
import { counterboyTheme as cb } from '@/features/counterboy/theme';

const Colors = {
  primary: cb.primary,
  primaryLight: '#A87A66',
  primaryDark: cb.primaryDeep,
  background: cb.bg,
  backgroundDark: cb.darkBg,
  surface: '#FFFFFF',
  surfaceDark: cb.darkSurface,
  border: cb.border,
  borderDark: cb.darkBorder,
  textDark: cb.text,
  textMuted: cb.muted,
  success: cb.success,
  successLight: cb.successSoft,
  warning: cb.warning,
  warningLight: cb.warningSoft,
  accent: cb.slate,
  accentLight: cb.slateSoft,
};

type PendingRewardItem = Omit<RewardHistoryItem, 'id' | 'time'>;

const resolveRewardFromCode = async (value?: string): Promise<PendingRewardItem | null> => {
  if (!value) return null;
  const scannedText = value.trim();
  try {
    const result = await scanApi.submit(scannedText, 'single');
    return {
      code: scannedText,
      label: result.scan.productName,
      points: result.pointsEarned,
      mode: 'single' as const,
    };
  } catch (err: any) {
    // If already scanned or not found, return null
    if (err.message?.includes('already been scanned') || err.message?.includes('not found')) {
      return null;
    }
    // Fallback for dev/testing
    return null;
  }
};

function FlashlightIcon({ size = 22, color = Colors.textDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 2h12v4l-2 2H8L6 6V2z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M8 8l-2 13h12L16 8H8z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Circle cx="12" cy="16" r="2" stroke={color} strokeWidth={1.6} />
      <Path d="M10 2V1M14 2V1" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function GalleryIcon({ size = 22, color = Colors.textDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth={1.8} />
      <Circle cx="8.5" cy="8.5" r="1.5" stroke={color} strokeWidth={1.5} />
      <Path
        d="M3 16l5-5 4 4 3-3 6 5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CameraIcon({ size = 22, color = Colors.textDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="6" width="18" height="14" rx="3" stroke={color} strokeWidth={1.8} />
      <Path d="M8 6l1.2-2h5.6L16 6" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Circle cx="12" cy="13" r="3.4" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function BackArrowIcon({ size = 20, color = Colors.textDark }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 6l-6 6 6 6M9 12h10"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SingleScanIcon({ size = 20, color = Colors.primary }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="3" stroke={color} strokeWidth={2} />
      <Rect x="6" y="6" width="4" height="4" rx="1" fill={color} />
      <Rect x="14" y="6" width="4" height="4" rx="1" fill={color} />
      <Rect x="6" y="14" width="4" height="4" rx="1" fill={color} />
      <Rect x="11" y="11" width="2" height="2" rx="0.5" fill={color} />
    </Svg>
  );
}

function MultiScanIcon({ size = 20, color = Colors.accent }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="2" width="9" height="9" rx="2" stroke={color} strokeWidth={1.8} />
      <Rect x="13" y="2" width="9" height="9" rx="2" stroke={color} strokeWidth={1.8} />
      <Rect x="2" y="13" width="9" height="9" rx="2" stroke={color} strokeWidth={1.8} />
      <Rect x="13" y="13" width="9" height="9" rx="2" stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

function CheckBadgeIcon({ size = 20, color = Colors.success }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
      <Path
        d="M8 12l3 3 5-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QrCorner({ position, color }: { position: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
  const size = 28;
  const thick = 4;
  const radius = 10;
  const offset = 8;

  const getStyle = () => {
    const base = {
      position: 'absolute' as const,
      width: size,
      height: size,
    };

    switch (position) {
      case 'tl':
        return {
          ...base,
          top: offset,
          left: offset,
          borderTopWidth: thick,
          borderLeftWidth: thick,
          borderColor: color,
          borderTopLeftRadius: radius,
        };
      case 'tr':
        return {
          ...base,
          top: offset,
          right: offset,
          borderTopWidth: thick,
          borderRightWidth: thick,
          borderColor: color,
          borderTopRightRadius: radius,
        };
      case 'bl':
        return {
          ...base,
          bottom: offset,
          left: offset,
          borderBottomWidth: thick,
          borderLeftWidth: thick,
          borderColor: color,
          borderBottomLeftRadius: radius,
        };
      case 'br':
        return {
          ...base,
          bottom: offset,
          right: offset,
          borderBottomWidth: thick,
          borderRightWidth: thick,
          borderColor: color,
          borderBottomRightRadius: radius,
        };
    }
  };

  return <View style={getStyle()} />;
}

export function ScanScreen({
  onNavigate,
  rewardHistory,
  onCommitRewards,
}: {
  onNavigate: (screen: Screen) => void;
  rewardHistory: RewardHistoryItem[];
  onCommitRewards: (items: PendingRewardItem[]) => { addedPoints: number; addedScans: number };
}) {
  const { darkMode, tx } = usePreferenceContext();
  const { width } = useWindowDimensions();
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [cameraGranted, setCameraGranted] = useState<boolean | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<ScanMode>('single');
  const [detectedLabel, setDetectedLabel] = useState('SRV MCB 32A detected');
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [batchItems, setBatchItems] = useState<PendingRewardItem[]>([]);
  const [showAllBatchItems, setShowAllBatchItems] = useState(false);
  const [dialog, setDialog] = useState<{ visible: boolean; variant: 'confirm' | 'destructive' | 'success' | 'error' | 'info'; title: string; message?: string; onOk?: () => void }>({ visible: false, variant: 'info', title: '', message: '' });
  const closeDialog = () => setDialog((d) => ({ ...d, visible: false }));
  const frameSize = Math.min(width - 80, 280);

  const laserY = useRef(new Animated.Value(0)).current;
  const laserOpacity = useRef(new Animated.Value(0.3)).current;
  const cornerOpacity = useRef(new Animated.Value(0.7)).current;
  const cornerScale = useRef(new Animated.Value(1)).current;
  const frameGlow = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const batchPulse = useRef(new Animated.Value(1)).current;
  const scanLockedRef = useRef(false);
  const animationTriggeredRef = useRef(false);

  const laserLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const cornerLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const glowLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const startLaser = useCallback(
    (fast: boolean) => {
      laserLoopRef.current?.stop();
      const dur = fast ? 1100 : 2000;
      laserLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(
            laserY,
            withWebSafeNativeDriver({
              toValue: 1,
              duration: dur,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          Animated.timing(
            laserY,
            withWebSafeNativeDriver({
              toValue: 0,
              duration: dur,
              easing: Easing.inOut(Easing.ease),
            })
          ),
        ])
      );
      laserLoopRef.current.start();
    },
    [laserY]
  );

  const startCornerIdle = useCallback(() => {
    cornerLoopRef.current?.stop();
    cornerLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(
            cornerOpacity,
            withWebSafeNativeDriver({
              toValue: 0.35,
              duration: 900,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          Animated.timing(
            cornerScale,
            withWebSafeNativeDriver({
              toValue: 0.97,
              duration: 900,
              easing: Easing.inOut(Easing.ease),
            })
          ),
        ]),
        Animated.parallel([
          Animated.timing(
            cornerOpacity,
            withWebSafeNativeDriver({
              toValue: 0.9,
              duration: 900,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          Animated.timing(
            cornerScale,
            withWebSafeNativeDriver({
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.ease),
            })
          ),
        ]),
      ])
    );
    cornerLoopRef.current.start();
  }, [cornerOpacity, cornerScale]);

  const startCornerFast = useCallback(() => {
    cornerLoopRef.current?.stop();
    cornerLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(
            cornerOpacity,
            withWebSafeNativeDriver({
              toValue: 0.25,
              duration: 280,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          Animated.timing(
            cornerScale,
            withWebSafeNativeDriver({
              toValue: 0.94,
              duration: 280,
              easing: Easing.inOut(Easing.ease),
            })
          ),
        ]),
        Animated.parallel([
          Animated.timing(
            cornerOpacity,
            withWebSafeNativeDriver({
              toValue: 1,
              duration: 280,
              easing: Easing.inOut(Easing.ease),
            })
          ),
          Animated.timing(
            cornerScale,
            withWebSafeNativeDriver({
              toValue: 1,
              duration: 280,
              easing: Easing.inOut(Easing.ease),
            })
          ),
        ]),
      ])
    );
    cornerLoopRef.current.start();
  }, [cornerOpacity, cornerScale]);

  const startBatchPulse = useCallback(() => {
    pulseLoopRef.current?.stop();
    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(
          batchPulse,
          withWebSafeNativeDriver({
            toValue: 1.03,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        Animated.timing(
          batchPulse,
          withWebSafeNativeDriver({
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
          })
        ),
      ])
    );
    pulseLoopRef.current.start();
  }, [batchPulse]);

  const requestCameraAccess = useCallback(async () => {
    const permission = await Camera.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setCameraGranted(false);
      setScanning(false);
      setDialog({ visible: true, variant: 'info', title: tx('Permission Required'), message: tx('Camera permission is required to scan QR codes.') });
      return false;
    }
    setCameraGranted(true);
    if (!scanLockedRef.current) {
      setScanning(true);
    }
    return true;
  }, [tx]);

  useEffect(() => {
    startLaser(false);
    startCornerIdle();
    void requestCameraAccess();
    return () => {
      laserLoopRef.current?.stop();
      cornerLoopRef.current?.stop();
      glowLoopRef.current?.stop();
      pulseLoopRef.current?.stop();
    };
  }, [requestCameraAccess, startCornerIdle, startLaser]);

  useEffect(() => {
    if (scanning) {
      startLaser(true);
      startCornerFast();
      Animated.timing(laserOpacity, withWebSafeNativeDriver({ toValue: 1, duration: 200 })).start();
      glowLoopRef.current?.stop();
      glowLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(frameGlow, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(frameGlow, {
            toValue: 0,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      glowLoopRef.current.start();
      if (scanMode === 'multi') startBatchPulse();
    } else if (!scanned) {
      startLaser(false);
      startCornerIdle();
      Animated.timing(
        laserOpacity,
        withWebSafeNativeDriver({ toValue: 0.3, duration: 400 })
      ).start();
      glowLoopRef.current?.stop();
      frameGlow.setValue(0);
      pulseLoopRef.current?.stop();
      batchPulse.setValue(1);
    }
  }, [
    batchPulse,
    frameGlow,
    laserOpacity,
    scanMode,
    scanned,
    scanning,
    startBatchPulse,
    startCornerFast,
    startCornerIdle,
    startLaser,
  ]);

  useEffect(() => {
    if (scanned && !animationTriggeredRef.current) {
      animationTriggeredRef.current = true;
      laserLoopRef.current?.stop();
      cornerLoopRef.current?.stop();
      glowLoopRef.current?.stop();
      pulseLoopRef.current?.stop();
      frameGlow.setValue(0);
      Animated.timing(laserOpacity, withWebSafeNativeDriver({ toValue: 0, duration: 300 })).start();
      successScale.setValue(0.3);
      successOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(
          successScale,
          withWebSafeNativeDriver({
            toValue: 1,
            tension: 60,
            friction: 7,
          })
        ),
        Animated.timing(successOpacity, withWebSafeNativeDriver({ toValue: 1, duration: 300 })),
      ]).start();
    } else if (!scanned) {
      animationTriggeredRef.current = false;
      successScale.setValue(0);
      successOpacity.setValue(0);
    }
  }, [scanned, frameGlow, laserOpacity, successOpacity, successScale]);

  const resetScanner = async () => {
    scanLockedRef.current = false;
    animationTriggeredRef.current = false;
    setScanned(false);
    setPreviewImage(null);
    setDetectedLabel('SRV MCB 32A detected');
    setEarnedPoints(0);
    if (scanMode === 'single') {
      setBatchItems([]);
    }
    if (cameraGranted === true || (await requestCameraAccess())) {
      setScanning(true);
    }
  };

  const commitSingleScan = (reward: PendingRewardItem) => {
    const committed = onCommitRewards([{ ...reward, mode: 'single' }]);
    setEarnedPoints(committed.addedPoints);
    setDetectedLabel(`${reward.label} detected`);
  };

  const completeScan = async (data?: string) => {
    if (scanLockedRef.current) return;
    scanLockedRef.current = true;

    const reward = await resolveRewardFromCode(data);

    if (!reward) {
      setScanned(true);
      setEarnedPoints(0);
      setDetectedLabel('Invalid QR Code');

      if (scanMode === 'multi') {
        setTimeout(() => {
          scanLockedRef.current = false;
          setScanned(false);
          setDetectedLabel('Scan next product');
        }, 1500);
      } else {
        setScanning(false);
      }
      return;
    }

    if (scanMode === 'single') {
      setScanning(false);
      setScanned(true);
      commitSingleScan(reward);
      return;
    }

    // Multi mode
    setBatchItems((current) => [...current, { ...reward, mode: 'multi' }]);
    onCommitRewards([{ ...reward, mode: 'multi' }]);
    setDetectedLabel(`${reward.label} added`);
    setScanned(true);
    setTimeout(() => {
      scanLockedRef.current = false;
      setScanned(false);
      setDetectedLabel('Scan next product');
    }, 1200);
  };

  const handleOpenCamera = async () => {
    setPreviewImage(null);
    scanLockedRef.current = false;
    if (cameraGranted === true) {
      setScanning(true);
    }
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setDialog({ visible: true, variant: 'info', title: tx('Permission Required'), message: tx('Gallery permission is required to select QR images.') });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const imageUri = result.assets[0].uri;
    setPreviewImage(imageUri);
    setScanning(false);
    setScanned(false);
    scanLockedRef.current = false;

    try {
      const matches = await scanFromURLAsync(imageUri, ['qr']);
      if (matches.length) {
        completeScan(matches[0]?.data);
        return;
      }
      setDialog({ visible: true, variant: 'info', title: tx('Scan QR Code'), message: tx('Align QR code within the frame') });
    } catch {
      setDialog({ visible: true, variant: 'error', title: tx('Scan QR Code'), message: tx('Align QR code within the frame') });
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (!scanning || scanLockedRef.current) return;
    void completeScan(data);
  };

  const handleContinueScanning = async () => {
    scanLockedRef.current = false;
    animationTriggeredRef.current = false;
    setScanned(false);
    setPreviewImage(null);
    if (cameraGranted === true || (await requestCameraAccess())) {
      setScanning(true);
    }
  };

  const handleDoneBatch = () => {
    if (!batchItems.length) {
      setDialog({ visible: true, variant: 'info', title: tx('No scans yet'), message: tx('Scan at least one SRV product before finishing.') });
      return;
    }

    const committed = onCommitRewards(batchItems.map((item) => ({ ...item, mode: 'multi' })));
    setEarnedPoints(committed.addedPoints);
    setDetectedLabel(`${batchItems.length} products batch credited`);
    setBatchItems([]);
    setScanned(true);
    setScanning(false);

    // Navigate to wallet after batch is done
    setTimeout(() => {
      onNavigate('wallet');
    }, 500);
  };

  const laserTranslate = laserY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, frameSize - 10],
  });
  const totalBatchPoints = useMemo(
    () => batchItems.reduce((sum, item) => sum + item.points, 0),
    [batchItems],
  );

  const isDark = darkMode;

  return (
    <View style={[styles.root, isDark ? styles.rootDark : null]}>
      <View style={[styles.header, isDark ? styles.headerDark : null]}>
        <Pressable
          onPress={() => onNavigate('home')}
          style={[styles.backBtn, isDark ? styles.backBtnDark : null]}
        >
          <BackArrowIcon color={isDark ? '#F8FAFC' : Colors.textDark} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, isDark ? styles.headerTitleDark : null]}>
            {tx('Scan QR Code')}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.scanModeSelector}>
          <View style={[styles.modeSelectorBg, isDark ? styles.modeSelectorBgDark : null]}>
            <View
              style={[
                styles.modeHighlight,
                scanMode === 'single' ? styles.modeHighlightSingle : styles.modeHighlightMulti,
                isDark ? styles.modeHighlightDark : null,
              ]}
            />
            <TouchableOpacity
              style={styles.modeTab}
              onPress={() => {
                if (scanMode !== 'single') {
                  setScanMode('single');
                  setBatchItems([]);
                  void resetScanner();
                }
              }}
              activeOpacity={0.8}
            >
              <SingleScanIcon
                size={22}
                color={scanMode === 'single' ? Colors.primary : isDark ? '#6B7280' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.modeTabText,
                  scanMode === 'single'
                    ? styles.modeTabTextActive
                    : isDark
                      ? styles.modeTabTextDark
                      : null,
                ]}
              >
                {tx('Single')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modeTab}
              onPress={() => {
                if (scanMode !== 'multi') {
                  setScanMode('multi');
                  setBatchItems([]);
                  void resetScanner();
                }
              }}
              activeOpacity={0.8}
            >
              <MultiScanIcon
                size={22}
                color={scanMode === 'multi' ? Colors.accent : isDark ? '#6B7280' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.modeTabText,
                  scanMode === 'multi'
                    ? styles.modeTabTextActiveMulti
                    : isDark
                      ? styles.modeTabTextDark
                      : null,
                ]}
              >
                {tx('Multi')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.modeDescription}>
          <Text style={[styles.modeDescText, isDark ? styles.modeDescTextDark : null]}>
            {scanMode === 'single'
              ? tx('Scan one product, get instant points credited to your account')
              : tx("Keep scanning multiple products and finish batch when you're done")}
          </Text>
        </View>

        <Animated.View
          style={[
            styles.scannerContainer,
            { transform: [{ scale: scanMode === 'multi' && scanning ? batchPulse : 1 }] },
          ]}
        >
          <View style={[styles.scannerFrameOuter, isDark ? styles.scannerFrameOuterDark : null]}>
            <Animated.View
              style={[
                styles.scannerFrame,
                isDark ? styles.scannerFrameDark : null,
                { width: frameSize, height: frameSize, borderColor: Colors.border },
              ]}
            >
              {cameraGranted && !previewImage && (scanMode === 'multi' || !scanned) ? (
                <CameraView
                  style={StyleSheet.absoluteFillObject}
                  facing="back"
                  enableTorch={flashlightOn}
                  barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                  onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
                />
              ) : cameraGranted && !previewImage && scanned && scanMode === 'single' ? (
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    styles.cameraFallback,
                    isDark ? styles.cameraFallbackDark : null,
                    scanned && styles.cameraFallbackScanned,
                  ]}
                >
                  <CameraIcon size={48} color={isDark ? '#F8FAFC' : Colors.primary} />
                </View>
              ) : !cameraGranted || previewImage ? (
                <View
                  style={[
                    StyleSheet.absoluteFillObject,
                    styles.cameraFallback,
                    isDark ? styles.cameraFallbackDark : null,
                  ]}
                >
                  {!scanned && (
                    <>
                      <CameraIcon size={48} color={isDark ? '#F8FAFC' : Colors.primary} />
                      <Text
                        style={[
                          styles.cameraFallbackText,
                          isDark ? styles.cameraFallbackTextDark : null,
                        ]}
                      >
                        {tx('Ready to Scan')}
                      </Text>
                    </>
                  )}
                </View>
              ) : null}

              {previewImage ? (
                <View style={styles.previewImageWrap}>
                  <Image
                    source={{ uri: previewImage }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                </View>
              ) : null}

              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  scanned ? styles.frameShadeScanned : styles.frameShade,
                  { pointerEvents: 'none' },
                ]}
              />

              <Animated.View
                style={[
                  styles.laser,
                  {
                    width: frameSize - 40,
                    opacity: laserOpacity,
                    transform: [{ translateY: laserTranslate }],
                    backgroundColor: scanMode === 'single' ? Colors.primary : Colors.accent,
                    ...createShadow({
                      color: scanMode === 'single' ? Colors.primary : Colors.accent,
                      offsetY: 0,
                      blur: 8,
                      opacity: 1,
                      elevation: 8,
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.laserGlow,
                  {
                    width: frameSize - 40,
                    opacity: laserOpacity,
                    transform: [{ translateY: laserTranslate }],
                    backgroundColor: scanMode === 'single' ? Colors.primary : Colors.accent,
                  },
                ]}
              />

              {scanned ? (
                <Animated.View
                  style={[
                    styles.successOverlay,
                    scanMode === 'multi' ? styles.successOverlayMulti : null,
                    { transform: [{ scale: successScale }], opacity: successOpacity },
                  ]}
                >
                  {scanMode === 'multi' ? (
                    <View style={styles.multiSuccessBadge}>
                      <CheckBadgeIcon size={20} color="#FFFFFF" />
                      <Text style={styles.multiSuccessText}>{detectedLabel}</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.successBadge}>
                        <CheckBadgeIcon size={48} color={Colors.success} />
                      </View>
                      <Text style={styles.verifiedText}>{tx('Verified')}</Text>
                    </>
                  )}
                </Animated.View>
              ) : null}

              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  { opacity: cornerOpacity, transform: [{ scale: cornerScale }] },
                  { pointerEvents: 'none' },
                ]}
              >
                <QrCorner
                  position="tl"
                  color={scanMode === 'single' ? Colors.primary : Colors.accent}
                />
                <QrCorner
                  position="tr"
                  color={scanMode === 'single' ? Colors.primary : Colors.accent}
                />
                <QrCorner
                  position="bl"
                  color={scanMode === 'single' ? Colors.primary : Colors.accent}
                />
                <QrCorner
                  position="br"
                  color={scanMode === 'single' ? Colors.primary : Colors.accent}
                />
              </Animated.View>
            </Animated.View>
          </View>

          <View style={styles.statusRow}>
            {scanning ? (
              <View style={styles.statusScanning}>
                <View style={[styles.statusDot, styles.statusDotActive]} />
                <Text style={styles.statusActive}>{tx('Scanning...')}</Text>
              </View>
            ) : null}
            {!scanning && !scanned ? (
              <Text style={[styles.statusIdle, isDark ? styles.statusIdleDark : null]}>
                {tx('Align QR code within the frame')}
              </Text>
            ) : null}
            {scanned ? (
              <View style={styles.statusSuccess}>
                {detectedLabel === 'Invalid QR Code' ? (
                  <Text style={[styles.statusSuccessText, { color: Colors.textMuted }]}>
                    {tx('Invalid QR Code')}
                  </Text>
                ) : (
                  <>
                    <CheckBadgeIcon size={18} color={Colors.success} />
                    <Text style={styles.statusSuccessText}>
                      {tx(scanMode === 'multi' ? 'QR Code added to batch' : 'QR Code detected')}
                    </Text>
                  </>
                )}
              </View>
            ) : null}
          </View>
        </Animated.View>

        {scanned && (
          <Animated.View
            style={[
              styles.successBox,
              isDark ? styles.successBoxDark : null,
              { transform: [{ scale: successScale }], opacity: successOpacity },
            ]}
          >
            <View style={styles.successBoxHeader}>
              <Text style={styles.successTitle}>{detectedLabel}</Text>
              {earnedPoints > 0 && (
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>+{earnedPoints}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.successSub, isDark ? styles.successSubDark : null]}>
              {detectedLabel === 'Invalid QR Code'
                ? tx('This QR is not registered with SRV products.')
                : earnedPoints > 0
                  ? tx('Points credited to your wallet!')
                  : tx('Points for this QR were already claimed.')}
            </Text>
          </Animated.View>
        )}

        {scanMode === 'multi' && (
          <Animated.View style={[styles.batchCard, isDark ? styles.batchCardDark : null]}>
            <View style={styles.batchHeader}>
              <View style={styles.batchHeaderLeft}>
                <MultiScanIcon size={22} color={Colors.accent} />
                <Text style={[styles.batchTitle, isDark ? styles.batchTitleDark : null]}>
                  {tx('Scan Summary')}
                </Text>
              </View>
              <View style={styles.batchStats}>
                <View style={styles.batchStat}>
                  <Text style={styles.batchStatValue}>{batchItems.length}</Text>
                  <Text style={styles.batchStatLabel}>{tx('Items')}</Text>
                </View>
                <View style={styles.batchStatDivider} />
                <View style={styles.batchStat}>
                  <Text style={[styles.batchStatValue, styles.batchStatValuePoints]}>
                    {totalBatchPoints}
                  </Text>
                  <Text style={styles.batchStatLabel}>{tx('Points')}</Text>
                </View>
              </View>
            </View>

            {batchItems.length > 0 && (
              <View style={styles.batchList}>
                {batchItems.slice(-4).map((item, index) => (
                  <View
                    key={`${item.code}-${index}`}
                    style={[styles.batchItem, isDark ? styles.batchItemDark : null]}
                  >
                    <View style={styles.batchItemLeft}>
                      <View
                        style={[
                          styles.batchItemDot,
                          { backgroundColor: index === 0 ? Colors.accent : Colors.border },
                        ]}
                      />
                      <Text
                        style={[styles.batchItemLabel, isDark ? styles.batchItemLabelDark : null]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </Text>
                    </View>
                    <View style={styles.batchItemRight}>
                      <Text style={styles.batchItemPoints}>+{item.points}</Text>
                    </View>
                  </View>
                ))}
                {batchItems.length > 4 && (
                  <TouchableOpacity onPress={() => setShowAllBatchItems(true)} activeOpacity={0.8}>
                    <Text
                      style={[styles.batchMoreItems, isDark ? styles.batchMoreItemsDark : null]}
                    >
                      +{batchItems.length - 4} more items
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {batchItems.length === 0 && (
              <View style={styles.batchEmpty}>
                <Text style={[styles.batchEmptyText, isDark ? styles.batchEmptyTextDark : null]}>
                  {tx('Start scanning products to build your batch')}
                </Text>
              </View>
            )}
          </Animated.View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={
              scanned
                ? scanMode === 'multi'
                  ? handleContinueScanning
                  : () => onNavigate('wallet')
                : handleOpenCamera
            }
            disabled={scanning && !scanned}
            style={[styles.primaryBtn, scanning && !scanned ? styles.primaryBtnDisabled : null]}
            activeOpacity={0.85}
          >
            {!scanned ? (
              <>
                <CameraIcon size={20} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>{tx('Start Scanning')}</Text>
              </>
            ) : scanMode === 'multi' ? (
              <>
                <MultiScanIcon size={20} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>{tx('Continue Scanning')}</Text>
              </>
            ) : (
              <>
                <CheckBadgeIcon size={20} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>{tx('Done')}</Text>
              </>
            )}
          </TouchableOpacity>

          {scanMode === 'multi' && (
            <TouchableOpacity
              onPress={handleDoneBatch}
              style={[styles.doneBtn, !batchItems.length ? styles.doneBtnDisabled : null]}
              activeOpacity={0.85}
              disabled={!batchItems.length}
            >
              <Text style={styles.doneBtnText}>
                {tx('Done')} {batchItems.length > 0 ? `(${batchItems.length})` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.secondaryActions}>
          <Pressable
            style={[
              styles.secondaryBtn,
              isDark ? styles.secondaryBtnDark : null,
              flashlightOn ? styles.secondaryBtnActive : null,
            ]}
            onPress={() => setFlashlightOn((current) => !current)}
          >
            <FlashlightIcon
              size={20}
              color={flashlightOn ? '#FFFFFF' : isDark ? '#F8FAFC' : Colors.textDark}
            />
            <Text
              style={[
                styles.secondaryBtnText,
                isDark ? styles.secondaryBtnTextDark : null,
                flashlightOn ? styles.secondaryBtnTextActive : null,
              ]}
            >
              {flashlightOn ? tx('On') : tx('Light')}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryBtn, isDark ? styles.secondaryBtnDark : null]}
            onPress={handlePickFromGallery}
          >
            <GalleryIcon size={20} color={isDark ? '#F8FAFC' : Colors.textDark} />
            <Text style={[styles.secondaryBtnText, isDark ? styles.secondaryBtnTextDark : null]}>
              {tx('Gallery')}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.helpCard, isDark ? styles.helpCardDark : null]}>
          <View style={styles.helpTitleRow}>
            <CameraIcon size={18} color={isDark ? '#F8FAFC' : Colors.primary} />
            <Text style={[styles.helpTitle, isDark ? styles.helpTitleDark : null]}>
              {tx('How to Scan')}
            </Text>
          </View>
          {[
            {
              step: '1',
              text:
                scanMode === 'multi'
                  ? 'Select Multi mode and scan products one by one'
                  : 'Select Single mode for instant point credit',
              color: Colors.primary,
            },
            {
              step: '2',
              text:
                scanMode === 'multi'
                  ? 'Keep scanning - camera stays open until you finish'
                  : 'Point camera at QR sticker on SRV product',
              color: Colors.accent,
            },
            {
              step: '3',
              text:
                scanMode === 'multi'
                  ? 'Tap Done button to add all points together'
                  : 'Points are credited instantly to your wallet',
              color: Colors.success,
            },
          ].map((item) => (
            <View key={item.step} style={styles.helpRow}>
              <View style={[styles.helpIndex, { backgroundColor: item.color }]}>
                <Text style={styles.helpIndexText}>{item.step}</Text>
              </View>
              <Text style={[styles.helpText, isDark ? styles.helpTextDark : null]}>
                {tx(item.text)}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal
        visible={showAllBatchItems}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAllBatchItems(false)}
      >
        <View style={styles.allItemsOverlay}>
          <Pressable style={styles.allItemsBackdrop} onPress={() => setShowAllBatchItems(false)} />
          <View style={[styles.allItemsContainer, isDark ? styles.allItemsContainerDark : null]}>
            <View style={styles.allItemsHandle} />
            <View style={styles.allItemsHeader}>
              <Text style={[styles.allItemsTitle, isDark ? styles.allItemsTitleDark : null]}>
                {tx('All Scanned Items')}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAllBatchItems(false)}
                style={styles.allItemsClose}
              >
                <Text style={styles.allItemsCloseText}>X</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.allItemsStats}>
              <View style={styles.allItemsStatBox}>
                <Text style={[styles.allItemsStatNum, isDark ? styles.allItemsStatNumDark : null]}>
                  {batchItems.length}
                </Text>
                <Text style={[styles.allItemsStatLbl, isDark ? styles.allItemsStatLblDark : null]}>
                  {tx('Items')}
                </Text>
              </View>
              <View style={styles.allItemsStatDivider} />
              <View style={styles.allItemsStatBox}>
                <Text style={[styles.allItemsStatNum, styles.allItemsStatNumGreen]}>
                  {totalBatchPoints}
                </Text>
                <Text style={[styles.allItemsStatLbl, isDark ? styles.allItemsStatLblDark : null]}>
                  {tx('Points')}
                </Text>
              </View>
            </View>

            <ScrollView
              style={styles.allItemsScroll}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.allItemsScrollContent}
            >
              {batchItems.map((item, index) => (
                <View
                  key={`${item.code}-${index}`}
                  style={[styles.allItemsRow, isDark ? styles.allItemsRowDark : null]}
                >
                  <View style={styles.allItemsRowLeft}>
                    <View style={[styles.allItemsDot, { backgroundColor: Colors.accent }]} />
                    <View style={styles.allItemsRowInfo}>
                      <Text
                        style={[styles.allItemsRowName, isDark ? styles.allItemsRowNameDark : null]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[styles.allItemsRowCode, isDark ? styles.allItemsRowCodeDark : null]}
                      >
                        {item.code}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.allItemsRowPoints}>+{item.points}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Dialog visible={dialog.visible} variant={dialog.variant} title={dialog.title} message={dialog.message} onClose={closeDialog} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  rootDark: { backgroundColor: Colors.backgroundDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerDark: { backgroundColor: Colors.surfaceDark, borderBottomColor: Colors.borderDark },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnDark: { backgroundColor: 'transparent' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  headerTitleDark: { color: '#F8FAFC' },
  scroll: { flex: 1 },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
    gap: 16,
  },

  scanModeSelector: { width: '100%' },
  modeSelectorBg: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 6,
    position: 'relative',
    ...createShadow({ color: '#000', offsetY: 2, blur: 8, opacity: 0.06, elevation: 3 }),
  },
  modeSelectorBgDark: { backgroundColor: Colors.surfaceDark },
  modeHighlight: {
    position: 'absolute',
    top: 6,
    bottom: 6,
    width: '50%',
    borderRadius: 16,
  },
  modeHighlightSingle: { left: 6, backgroundColor: cb.soft },
  modeHighlightMulti: { right: 6, backgroundColor: Colors.accentLight },
  modeHighlightDark: { backgroundColor: 'rgba(74,100,125,0.24)' },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    zIndex: 1,
  },
  modeTabText: { fontSize: 15, fontWeight: '700', color: Colors.textMuted },
  modeTabTextActive: { color: Colors.primary },
  modeTabTextActiveMulti: { color: Colors.accent },
  modeTabTextDark: { color: '#6B7280' },

  modeDescription: { width: '100%' },
  modeDescText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  modeDescTextDark: { color: '#94A3B8' },

  scannerContainer: { alignItems: 'center', gap: 16 },
  scannerFrameOuter: { alignItems: 'center', justifyContent: 'center', position: 'relative' },
  scannerFrameOuterDark: {},
  scannerFrame: {
    borderRadius: 28,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  scannerFrameDark: { backgroundColor: Colors.surfaceDark },
  frameShade: { backgroundColor: 'rgba(7,10,18,0.3)' },
  frameShadeScanned: { backgroundColor: 'rgba(0,0,0,0.6)' },
  cameraFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#FEF8F7',
  },
  cameraFallbackDark: { backgroundColor: cb.darkBg },
  cameraFallbackScanned: { backgroundColor: 'rgba(0,0,0,0.5)' },
  cameraFallbackText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  cameraFallbackTextDark: { color: '#F8FAFC' },
  previewImageWrap: {
    position: 'absolute',
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  previewImage: { width: '100%', height: '100%' },
  laser: {
    position: 'absolute',
    top: 20,
    left: 20,
    height: 3,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  laserGlow: {
    position: 'absolute',
    top: 13,
    left: 20,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    opacity: 0.2,
  },
  successOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  successOverlayMulti: {
    top: 16,
  },
  successBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...createShadow({ color: Colors.success, offsetY: 0, blur: 12, opacity: 0.4, elevation: 8 }),
  },
  multiSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    ...createShadow({ color: Colors.success, offsetY: 4, blur: 8, opacity: 0.4, elevation: 6 }),
  },
  multiSuccessText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  verifiedText: { fontSize: 16, fontWeight: '800', color: Colors.success, marginTop: 4 },
  multiScanIndicator: { position: 'absolute', top: 16, right: 16, zIndex: 5 },
  multiScanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    ...createShadow({ color: Colors.accent, offsetY: 2, blur: 4, opacity: 0.3, elevation: 4 }),
  },
  multiScanCount: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  statusRow: { alignItems: 'center', minHeight: 24 },
  statusScanning: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusDotActive: { backgroundColor: Colors.primary },
  statusActive: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  statusIdle: { fontSize: 13, color: Colors.textMuted },
  statusIdleDark: { color: '#94A3B8' },
  statusSuccess: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusSuccessText: { fontSize: 14, fontWeight: '700', color: Colors.success },

  successBox: {
    width: '100%',
    padding: 18,
    borderRadius: 20,
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successBoxDark: { backgroundColor: '#12372B', borderColor: '#1F5A45' },
  successBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  successTitle: { fontSize: 16, fontWeight: '800', color: Colors.success, flex: 1 },
  pointsBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pointsBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  successSub: { marginTop: 8, fontSize: 13, color: '#065F46', lineHeight: 18 },
  successSubDark: { color: '#A7F3D0' },

  batchCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    ...createShadow({ color: '#000', offsetY: 2, blur: 8, opacity: 0.04, elevation: 2 }),
  },
  batchCardDark: { backgroundColor: Colors.surfaceDark, borderColor: Colors.borderDark },
  batchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  batchHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  batchTitle: { fontSize: 17, fontWeight: '800', color: Colors.textDark },
  batchTitleDark: { color: '#F8FAFC' },
  batchStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  batchStat: { alignItems: 'center' },
  batchStatValue: { fontSize: 18, fontWeight: '800', color: Colors.textDark },
  batchStatValuePoints: { color: Colors.success },
  batchStatLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  batchStatDivider: { width: 1, height: 24, backgroundColor: Colors.border },
  batchList: { marginTop: 16, gap: 8 },
  batchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  batchItemDark: { backgroundColor: '#2A2321' },
  batchItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  batchItemDot: { width: 8, height: 8, borderRadius: 4 },
  batchItemLabel: { fontSize: 13, color: Colors.textDark, flex: 1 },
  batchItemLabelDark: { color: '#E2E8F0' },
  batchItemRight: {},
  batchItemPoints: { fontSize: 14, fontWeight: '800', color: Colors.success },
  batchMoreItems: { fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 8 },
  batchMoreItemsDark: { color: '#94A3B8' },
  batchEmpty: { marginTop: 16, paddingVertical: 20, alignItems: 'center' },
  batchEmptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
  batchEmptyTextDark: { color: '#94A3B8' },

  actionButtons: { width: '100%', gap: 12 },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    ...createShadow({ color: Colors.primary, offsetY: 6, blur: 12, opacity: 0.4, elevation: 8 }),
  },
  primaryBtnDisabled: { backgroundColor: '#CBB8B0', ...clearShadow() },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  doneBtn: {
    width: '100%',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.accent,
    ...createShadow({ color: Colors.accent, offsetY: 4, blur: 8, opacity: 0.3, elevation: 6 }),
  },
  doneBtnDisabled: { backgroundColor: '#6E7D8A', ...clearShadow() },
  doneBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  secondaryActions: { flexDirection: 'row', gap: 12, width: '100%' },
  secondaryBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    ...createShadow({ color: '#000', offsetY: 1, blur: 4, opacity: 0.04, elevation: 1 }),
  },
  secondaryBtnDark: { backgroundColor: Colors.surfaceDark, borderColor: Colors.borderDark },
  secondaryBtnText: { color: Colors.textDark, fontSize: 14, fontWeight: '700' },
  secondaryBtnTextDark: { color: '#F8FAFC' },
  secondaryBtnActive: { backgroundColor: Colors.warning, borderColor: Colors.warning },
  secondaryBtnTextActive: { color: '#FFFFFF' },

  helpCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  helpCardDark: { backgroundColor: Colors.surfaceDark, borderColor: Colors.borderDark },
  helpTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  helpTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark },
  helpTitleDark: { color: '#F8FAFC' },
  helpRow: { flexDirection: 'row', gap: 14, marginTop: 16, alignItems: 'flex-start' },
  helpIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpIndexText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  helpText: { flex: 1, fontSize: 13, lineHeight: 20, color: Colors.textMuted },
  helpTextDark: { color: '#94A3B8' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '90%',
  },
  modalContentDark: { backgroundColor: Colors.surfaceDark },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textDark },
  modalTitleDark: { color: '#F8FAFC' },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseBtnText: { fontSize: 16, fontWeight: '800', color: Colors.textMuted },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderRadius: 16,
  },
  modalStat: { alignItems: 'center' },
  modalStatValue: { fontSize: 24, fontWeight: '900', color: Colors.textDark },
  modalStatValuePoints: { color: Colors.success },
  modalStatLabel: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  modalStatDivider: { width: 1, backgroundColor: Colors.border },
  modalList: { flex: 1, minHeight: 100, maxHeight: 500 },
  modalListContent: { paddingBottom: 20 },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: Colors.background,
    borderRadius: 14,
    marginBottom: 8,
  },
  modalItemDark: { backgroundColor: Colors.surfaceDark },
  modalItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  modalItemDot: { width: 10, height: 10, borderRadius: 5 },
  modalItemInfo: { flex: 1 },
  modalItemLabel: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  modalItemLabelDark: { color: '#F8FAFC' },
  modalItemCode: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  modalItemCodeDark: { color: '#94A3B8' },
  modalItemPoints: { fontSize: 16, fontWeight: '800', color: Colors.success },
  allItemsOverlay: { flex: 1 },
  allItemsBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  allItemsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    paddingBottom: 30,
  },
  allItemsContainerDark: { backgroundColor: Colors.surfaceDark },
  allItemsHandle: {
    width: 50,
    height: 5,
    backgroundColor: '#D1D5DB',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
  },
  allItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  allItemsTitle: { fontSize: 20, fontWeight: '800', color: Colors.textDark },
  allItemsTitleDark: { color: '#F8FAFC' },
  allItemsClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allItemsCloseText: { fontSize: 16, fontWeight: '800', color: Colors.textMuted },
  allItemsStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingVertical: 16,
    marginHorizontal: 20,
    backgroundColor: Colors.background,
    borderRadius: 16,
    marginTop: 12,
  },
  allItemsStatBox: { alignItems: 'center' },
  allItemsStatNum: { fontSize: 28, fontWeight: '900', color: Colors.textDark },
  allItemsStatNumDark: { color: '#F8FAFC' },
  allItemsStatNumGreen: { color: Colors.success },
  allItemsStatLbl: { fontSize: 13, color: Colors.textMuted, marginTop: 4 },
  allItemsStatLblDark: { color: '#94A3B8' },
  allItemsStatDivider: { width: 1, backgroundColor: Colors.border },
  allItemsScroll: { flex: 1, marginTop: 16, paddingHorizontal: 16 },
  allItemsScrollContent: { paddingBottom: 20 },
  allItemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.background,
    borderRadius: 14,
    marginBottom: 10,
  },
  allItemsRowDark: { backgroundColor: '#2A2321' },
  allItemsRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  allItemsDot: { width: 10, height: 10, borderRadius: 5 },
  allItemsRowInfo: { flex: 1 },
  allItemsRowName: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  allItemsRowNameDark: { color: '#F8FAFC' },
  allItemsRowCode: { fontSize: 12, color: Colors.textMuted, marginTop: 3 },
  allItemsRowCodeDark: { color: '#94A3B8' },
  allItemsRowPoints: { fontSize: 18, fontWeight: '800', color: Colors.success },
});
