import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { usePreferenceContext } from '@/shared/preferences';
import type { Screen } from '@/shared/types/navigation';

export type { Screen };

export const C = {
  primary: '#E8453C',
  primaryDark: '#C0312A',
  primaryLight: '#FFF0F0',
  bg: '#F0F1F6',
  surface: '#FFFFFF',
  border: '#EAEAF2',
  dark: '#0F1120',
  mid: '#4A4B5C',
  muted: '#9898A8',
  success: '#16A34A',
  successLight: '#DCFCE7',
  gold: '#D97706',
  goldLight: '#FEF3C7',
  blue: '#2563EB',
  blueLight: '#DBEAFE',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  teal: '#0D9488',
  tealLight: '#CCFBF1',
  navy: '#1E2340',
  error: '#EF4444',
  errorLight: '#FEE2E2',
} as const;

export const defaultProfile = {
  name: '',
  phone: '',
  email: '',
  state: '',
  city: '',
  district: '',
  pincode: '',
  address: '',
  gstHolderName: '',
  gstNumber: '',
  panHolderName: '',
  panNumber: '',
  dealerCode: '',
  electricianCode: '',
  counterboyCode: '',
  userCode: '',
};

export type Profile = typeof defaultProfile;
export type SubPage =
  | null
  | 'Play Zone'
  | 'My Redemption'
  | 'Dealer Bonus'
  | 'Transfer Points'
  | 'My Orders'
  | 'Bank Details'
  | 'Refer To A Friend'
  | 'Need Help'
  | 'Offers & Promotions'
  | 'Notifications'
  | 'Password'
  | 'App Settings'
  | 'Scan History'
  | 'Contact Support'
  | 'Privacy Policy'
  | 'Rate Us'
  | 'KYC Verification';

export type IconName =
  | 'play'
  | 'edit'
  | 'eye'
  | 'eyeOff'
  | 'star'
  | 'scan'
  | 'gift'
  | 'redeem'
  | 'signOut'
  | 'transfer'
  | 'order'
  | 'refer'
  | 'help'
  | 'offer'
  | 'notification'
  | 'settings'
  | 'history'
  | 'support'
  | 'camera'
  | 'gallery'
  | 'phone'
  | 'mail'
  | 'building'
  | 'bank'
  | 'link'
  | 'message'
  | 'whatsapp'
  | 'moon'
  | 'warning'
  | 'clock'
  | 'info'
  | 'circle'
  | 'arrowLeft'
  | 'backArrow'
  | 'check'
  | 'lock'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronDown'
  | 'chevronUp'
  | 'location'
  | 'search'
  | 'trash'
  | 'alert';

export function AppIcon({
  name,
  size = 18,
  color = '#0F1120',
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  switch (name) {
    case 'play':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 5.8c0-1 1.1-1.7 2-1.1l9.2 6.2c.8.6.8 1.8 0 2.4L9 19.5c-.9.6-2-.1-2-1.1V5.8z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Path d="M10 8.7l4.6 3.3L10 15.3V8.7z" fill={color} />
        </Svg>
      );
    case 'edit':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 20l4.2-1 9.1-9.1a2.2 2.2 0 10-3.1-3.1L5.1 15.9 4 20z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Path d="M13 8l3 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'eye':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M2.5 12s3.3-5 9.5-5 9.5 5 9.5 5-3.3 5-9.5 5-9.5-5-9.5-5z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'eyeOff':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path d="M3 3l18 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Path
            d="M10.6 5.2c.5-.1.9-.2 1.4-.2 6.2 0 9.5 5 9.5 5a15.5 15.5 0 01-3.4 3.6M6.3 6.3A15.7 15.7 0 002.5 12s3.3 5 9.5 5c1 0 1.9-.1 2.7-.4"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9.9 9.9A3 3 0 0014.1 14.1"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3.5l2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.8-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3.5z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'scan':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="4"
            y="4"
            width="6"
            height="6"
            rx="1.3"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Rect
            x="14"
            y="4"
            width="6"
            height="6"
            rx="1.3"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Rect
            x="4"
            y="14"
            width="6"
            height="6"
            rx="1.3"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Path d="M14 14h2v2h-2zM18 14h2v6h-6v-2h4v-4z" fill={color} />
        </Svg>
      );
    case 'gift':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="8"
            width="18"
            height="4"
            rx="1.2"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Path
            d="M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Path
            d="M12 8v13M12 8C12 8 9.5 6.1 9.5 4.7a2.5 2.5 0 015 0C14.5 6.1 12 8 12 8z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'redeem':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 6.5h10a2 2 0 012 2v3.5c0 4.1-2.7 7.2-7 8.5-4.3-1.3-7-4.4-7-8.5V8.5a2 2 0 012-2z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Path
            d="M9 10.5l2 2 4-4"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M9 4.5h6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'signOut':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M10 5H6a2 2 0 00-2 2v10a2 2 0 002 2h4"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Path
            d="M14 8l4 4-4 4M8 12h10"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'transfer':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 7h12M15 3l4 4-4 4M17 17H5M9 13l-4 4 4 4"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'order':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 7l8-4 8 4-8 4-8-4zM4 7v10l8 4 8-4V7"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Path d="M12 11v10" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'bank':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M3 9l9-5 9 5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M5 10v8M10 10v8M14 10v8M19 10v8M3 20h18"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'refer':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="8" cy="8" r="3" stroke={color} strokeWidth={strokeWidth} />
          <Circle cx="16.5" cy="7" r="2.5" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M3.5 18a4.5 4.5 0 019 0M13 17a3.5 3.5 0 017 0"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'help':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M9.5 9a2.5 2.5 0 115 0c0 1.8-2.5 2.1-2.5 4"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Circle cx="12" cy="17.2" r="0.8" fill={color} />
        </Svg>
      );
    case 'offer':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M20 12l-8 8-8-8 8-8 8 8z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Circle cx="9" cy="9" r="1" fill={color} />
          <Path d="M10 14l4-4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'notification':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 16.5V11a6 6 0 1112 0v5.5l1.2 1.2a.8.8 0 01-.57 1.36H5.37a.8.8 0 01-.57-1.36L6 16.5z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Path
            d="M10 20a2 2 0 004 0"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'settings':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
          <Path
            d="M19.4 15a1 1 0 00.2 1.1l.1.1a2 2 0 010 2.8 2 2 0 01-2.8 0l-.1-.1a1 1 0 00-1.1-.2 1 1 0 00-.6.9V20a2 2 0 01-4 0v-.2a1 1 0 00-.6-.9 1 1 0 00-1.1.2l-.1.1a2 2 0 01-2.8 0 2 2 0 010-2.8l.1-.1a1 1 0 00.2-1.1 1 1 0 00-.9-.6H4a2 2 0 010-4h.2a1 1 0 00.9-.6 1 1 0 00-.2-1.1l-.1-.1a2 2 0 010-2.8 2 2 0 012.8 0l.1.1a1 1 0 001.1.2 1 1 0 00.6-.9V4a2 2 0 014 0v.2a1 1 0 00.6.9 1 1 0 001.1-.2l.1-.1a2 2 0 012.8 0 2 2 0 010 2.8l-.1.1a1 1 0 00-.2 1.1 1 1 0 00.9.6H20a2 2 0 010 4h-.2a1 1 0 00-.4.1z"
            stroke={color}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'history':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 4v5h5M20 12a8 8 0 10-2.3 5.7"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12 8v4l2.5 1.5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'support':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 10a5 5 0 0110 0v1a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4h2M7 13H5a2 2 0 00-2 2 2 2 0 002 2h2v-4z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M12 19h2.5a2 2 0 002-2"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'camera':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="6"
            width="18"
            height="14"
            rx="3"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Path
            d="M8 6l1.2-2h5.6L16 6"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="13" r="3.4" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'gallery':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="3"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Circle cx="8.5" cy="9" r="1.3" fill={color} />
          <Path
            d="M5 16l4-4 3 3 3-2 4 3"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'phone':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6.7 4.5h2.2c.5 0 1 .4 1.1.9l.6 3c.1.4-.1.9-.5 1.1l-1.8 1a14 14 0 006.3 6.3l1-1.8c.2-.4.7-.6 1.1-.5l3 .6c.5.1.9.6.9 1.1v2.2c0 .6-.5 1.2-1.2 1.2C10 21 3 14 5.5 5.7c0-.7.5-1.2 1.2-1.2z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'mail':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="3"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Path
            d="M5 8l7 5 7-5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'building':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 20V6.5A1.5 1.5 0 016.5 5h7A1.5 1.5 0 0115 6.5V20M9 20v-4h2v4M15 9h3a1 1 0 011 1v10h-4"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M8 9h.01M12 9h.01M8 12h.01M12 12h.01"
            stroke={color}
            strokeWidth={strokeWidth + 0.4}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'link':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M10 14l4-4M8.5 15.5l-1.6 1.6a3 3 0 11-4.2-4.2L6 9.8a3 3 0 014.2 0M15.5 8.5l1.6-1.6a3 3 0 114.2 4.2L18 14.2a3 3 0 01-4.2 0"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'message':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 18l-2 2v-4.2A7 7 0 016 5h12a2 2 0 012 2v6a2 2 0 01-2 2H9.5L6 18z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M8.5 10.5h7M8.5 13.5h4.5"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'whatsapp':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3.5a8.5 8.5 0 00-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1012 3.5z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M9.5 8.6c.2-.5.4-.6.7-.6h.6c.2 0 .4.1.5.4l.7 1.8c.1.2 0 .5-.1.6l-.5.7c.5 1 1.3 1.9 2.3 2.4l.8-.5c.2-.1.4-.1.6 0l1.7.8c.2.1.4.3.3.5v.6c0 .3-.1.5-.5.7-.4.2-1 .3-1.6.2-1.4-.3-2.8-1.2-4-2.5-1.2-1.2-2-2.6-2.3-4-.1-.5 0-1.1.2-1.5z"
            fill={color}
          />
        </Svg>
      );
    case 'moon':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M19 14.5A7.5 7.5 0 019.5 5a8 8 0 1010 9.5z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'warning':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 4l8 14H4l8-14z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Path
            d="M12 9v4M12 16h.01"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'clock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M12 7.8v4.6l2.9 1.8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case 'info':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M12 10.2v5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
          <Circle cx="12" cy="7.7" r="0.9" fill={color} />
        </Svg>
      );
    case 'circle':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'arrowLeft':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 6l-6 6 6 6M9 12h10"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'backArrow':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 5L8 12L15 19"
            stroke={color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12.5l4.2 4.2L19 7"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'trash':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 7l2.5 14.5A2 2 0 008.5 22h7a2 2 0 001.5-1.5L20 7M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path d="M5 7h14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    case 'alert':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 9v4M12 17h.01"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M10.3 3.1a1.65 1.65 0 00-2.6 0l-3 5.2a1.65 1.65 0 001.3 2.5h8.9a1.65 1.65 0 001.3-2.5l-3-5.2a1.65 1.65 0 00-2.6 0z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'lock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Rect
            x="5"
            y="11"
            width="14"
            height="10"
            rx="2.5"
            stroke={color}
            strokeWidth={strokeWidth}
          />
          <Path
            d="M8 11V8.5A4 4 0 0112 4.5a4 4 0 014 4V11"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <Circle cx="12" cy="16" r="1.3" fill={color} />
        </Svg>
      );
    case 'chevronLeft':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 6l-6 6 6 6"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'chevronRight':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 6l6 6-6 6"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'chevronDown':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 9l6 6 6-6"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'chevronUp':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 15l6-6 6 6"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'location':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 21s6-4.8 6-10a6 6 0 10-12 0c0 5.2 6 10 6 10z"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="11" r="2.2" stroke={color} strokeWidth={strokeWidth} />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Circle cx="11" cy="11" r="6.5" stroke={color} strokeWidth={strokeWidth} />
          <Path d="M16 16l4 4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        </Svg>
      );
    default:
      return null;
  }
}

export function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const { theme } = usePreferenceContext();
  return (
    <View
      style={[
        shared.header,
        { backgroundColor: theme.bg, borderBottomColor: theme.border, paddingTop: 12 },
      ]}
    >
      <TouchableOpacity
        onPress={onBack}
        style={[
          shared.backBtn,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        activeOpacity={0.75}
      >
        <AppIcon name="backArrow" size={22} color={theme.textPrimary} />
      </TouchableOpacity>
      <Text style={[shared.title, { color: theme.textPrimary }]}>{title}</Text>
      <View style={{ width: 36 }} />
    </View>
  );
}

export function PrimaryBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const { theme } = usePreferenceContext();
  return (
    <TouchableOpacity
      style={[shared.primaryBtn, { backgroundColor: theme.accent }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={shared.primaryLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export function EmptyState({
  emoji,
  message,
  title,
  iconName,
}: {
  emoji?: string;
  message: string;
  title?: string;
  iconName?: IconName;
}) {
  const { theme } = usePreferenceContext();
  return (
    <View style={[shared.emptyWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[shared.emptyCircle, { backgroundColor: theme.accentSoft }]}>
        {iconName ? (
          <AppIcon name={iconName} size={34} color={theme.accent} strokeWidth={2} />
        ) : (
          <Text style={shared.emptyEmoji}>{emoji}</Text>
        )}
      </View>
      {title ? <Text style={[shared.emptyTitle, { color: theme.textPrimary }]}>{title}</Text> : null}
      <Text style={[shared.emptyText, { color: theme.textMuted }]}>{message}</Text>
    </View>
  );
}

export const shared = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  title: { fontSize: 18, fontWeight: '800' },
  primaryBtn: {
    backgroundColor: C.primary,
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 38,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 12,
  },
  emptyCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: C.muted,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
});
