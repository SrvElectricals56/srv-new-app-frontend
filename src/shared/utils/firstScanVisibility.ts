import type { AppSettings } from '@/shared/api/services';

export const DEFAULT_FIRST_SCAN_VISIBILITY = {
  scannerName: true,
  scannerPhone: true,
  dealerName: true,
  dealerPhone: true,
  productName: true,
  scannedAt: true,
};

export type FirstScanVisibility = typeof DEFAULT_FIRST_SCAN_VISIBILITY;

export const resolveFirstScanVisibility = (appSettings?: AppSettings | null): FirstScanVisibility => ({
  ...DEFAULT_FIRST_SCAN_VISIBILITY,
  ...(appSettings?.qrFirstScannerVisibility ?? {}),
});
