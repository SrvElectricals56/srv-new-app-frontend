export type QrScanErrorKind = 'duplicate' | 'invalid' | 'failed';

export type ClassifiedQrScanError = {
  kind: QrScanErrorKind;
  message: string;
  payload: any;
};

/**
 * Keep business-rule failures separate from malformed/unknown QR values.
 * The backend uses HTTP 400 for settings and daily-limit rules as well as
 * input validation, so status alone cannot determine that a QR is invalid.
 */
export function classifyQrScanError(error: any): ClassifiedQrScanError {
  const payload = error?.data ?? error?.response?.data ?? {};
  const message = String(error?.message ?? payload?.message ?? '');
  const normalizedMessage = message.toLowerCase();
  const status = Number(error?.status ?? error?.response?.status ?? 0);
  const code = String(payload?.code ?? '').toUpperCase();

  if (
    code === 'QR_ALREADY_REDEEMED' ||
    status === 409 ||
    normalizedMessage.includes('already been scanned') ||
    normalizedMessage.includes('already redeemed') ||
    normalizedMessage.includes('already scanned')
  ) {
    return { kind: 'duplicate', message, payload };
  }

  const isInvalidQr =
    status === 404 ||
    status === 422 ||
    code === 'QR_INVALID' ||
    code === 'QR_NOT_FOUND' ||
    normalizedMessage.includes('does not belong to srv') ||
    normalizedMessage.includes('qr code is required') ||
    normalizedMessage.includes('provide a valid qr');

  return {
    kind: isInvalidQr ? 'invalid' : 'failed',
    message: message || 'Unable to verify this QR right now. Please try again.',
    payload,
  };
}
