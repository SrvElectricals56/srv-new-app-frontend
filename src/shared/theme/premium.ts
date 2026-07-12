import { createShadow } from './shadows';

export const premium = {
  bg: '#F5F7FB',
  surface: '#FFFFFF',
  surfaceSoft: '#F8FAFD',
  primary: '#D92D27',
  primaryDark: '#8F1F1B',
  primarySoft: '#FFF1F0',
  navy: '#173E80',
  navySoft: '#EAF3FF',
  ink: '#172033',
  muted: '#667085',
  line: '#E5EAF1',
  success: '#159C63',
  gold: '#C99A2E',
};

export const premiumGradients = {
  red: ['#D92D27', '#8F1F1B'] as [string, string],
  navy: ['#173E80', '#355C95'] as [string, string],
  redNavy: ['#D92D27', '#173E80'] as [string, string],
  soft: ['#FFFFFF', '#F6F8FB'] as [string, string],
  warm: ['#FFF6F4', '#FFFFFF'] as [string, string],
};

export function premiumShadow(level: 'sm' | 'md' | 'lg' = 'md') {
  if (level === 'sm') {
    return createShadow({ color: premium.ink, offsetY: 5, blur: 12, opacity: 0.06, elevation: 2 });
  }
  if (level === 'lg') {
    return createShadow({ color: premium.ink, offsetY: 16, blur: 30, opacity: 0.12, elevation: 8 });
  }
  return createShadow({ color: premium.ink, offsetY: 10, blur: 22, opacity: 0.09, elevation: 5 });
}
