import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const BASE_W = 390;
const BASE_H = 844;

export const SCREEN = {
  width: SCREEN_W,
  height: SCREEN_H,
};

export const ws = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel((SCREEN_W / BASE_W) * size));

export const hs = (size: number): number =>
  Math.round(PixelRatio.roundToNearestPixel((SCREEN_H / BASE_H) * size));

export const wp = (size: number): number => ws(size);

export const hp = (size: number): number => hs(size);

export const ms = (size: number, factor = 0.5): number =>
  Math.round(size + (ws(size) - size) * factor);

export const isSmallDevice = SCREEN_W < 360;
export const isMediumDevice = SCREEN_W >= 360 && SCREEN_W < 414;
export const isLargeDevice = SCREEN_W >= 414;
export const isTablet = SCREEN_W >= 768;
export const isShortDevice = SCREEN_H < 760;

export const safeTop: number =
  Platform.OS === 'android'
    ? (StatusBar.currentHeight ?? 24) + ws(16)
    : ws(56);

export const screenWidth = SCREEN_W;
export const screenHeight = SCREEN_H;

export const rf = (size: number, min?: number, max?: number): number => {
  const scaled = ms(size);
  if (min !== undefined && scaled < min) return min;
  if (max !== undefined && scaled > max) return max;
  return scaled;
};

export const getResponsiveValues = () => ({
  wp,
  hp,
  ws,
  hs,
  ms,
  rf,
  safeTop,
  screenWidth,
  screenHeight,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  isShortDevice,
  SCREEN,
});

export const useResponsive = () => getResponsiveValues();
