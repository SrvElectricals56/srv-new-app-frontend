/** Accept only a decoded UPI payment QR containing a valid payee VPA. */
export function isValidUpiQrPayload(value: string | null | undefined) {
  const payload = String(value ?? '').trim();
  if (!/^upi:\/\/pay(?:\?|$)/i.test(payload)) return false;

  const query = payload.split('?')[1] ?? '';
  const payee = query
    .split('&')
    .map((part) => part.split('='))
    .find(([key]) => key?.toLowerCase() === 'pa')?.[1];

  if (!payee) return false;
  try {
    return /^[^\s@]+@[^\s@]+$/.test(decodeURIComponent(payee));
  } catch {
    return false;
  }
}
