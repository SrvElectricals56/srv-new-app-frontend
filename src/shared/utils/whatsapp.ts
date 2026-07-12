import { Linking } from 'react-native';

const DEFAULT_SUPPORT_PHONE = '918837684004';
const DEFAULT_SUPPORT_MESSAGE = 'Hello SRV Electricals, I need help with my SRV app. Please assist me.';

function sanitizeWhatsappPhone(phone?: string | null) {
  const digits = String(phone || DEFAULT_SUPPORT_PHONE).replace(/[^0-9]/g, '');
  return digits || DEFAULT_SUPPORT_PHONE;
}

export async function openWhatsAppSupport(phone?: string | null, message = DEFAULT_SUPPORT_MESSAGE) {
  const safePhone = sanitizeWhatsappPhone(phone);
  const encodedMessage = encodeURIComponent(message);
  const appUrl = `whatsapp://send?text=${encodedMessage}&phone=${safePhone}`;
  const apiUrl = `https://api.whatsapp.com/send?phone=${safePhone}&text=${encodedMessage}`;
  const webUrl = `https://wa.me/${safePhone}?text=${encodedMessage}`;

  try {
    await Linking.openURL(appUrl);
  } catch {
    await Linking.openURL(apiUrl).catch(() => Linking.openURL(webUrl).catch(() => undefined));
  }
}
