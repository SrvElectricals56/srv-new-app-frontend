import type { AppLanguage } from '@/shared/preferences';

export type SpeechVoice = {
  identifier: string;
  language: string;
  name: string;
  quality?: string;
};

type SpeechProfile = {
  locale: string;
  rate: number;
  pitch: number;
};

const PROFILES: Record<AppLanguage, SpeechProfile> = {
  English: { locale: 'en-IN', rate: 0.94, pitch: 1 },
  Hindi: { locale: 'hi-IN', rate: 0.88, pitch: 1 },
  Punjabi: { locale: 'pa-IN', rate: 0.86, pitch: 1 },
};

export function getSpeechProfile(language: AppLanguage): SpeechProfile {
  return PROFILES[language];
}

function normalizeLocale(locale: string): string {
  return locale.replace(/_/g, '-').toLowerCase();
}

export function selectBestSpeechVoice(voices: SpeechVoice[], language: AppLanguage): SpeechVoice | undefined {
  const target = normalizeLocale(PROFILES[language].locale);
  const targetBase = target.split('-')[0];

  return voices
    .map((voice, index) => {
      const locale = normalizeLocale(voice.language);
      const base = locale.split('-')[0];
      if (base !== targetBase) return { voice, score: -1, index };

      let score = locale === target ? 100 : 60;
      if (locale.endsWith('-in')) score += 10;
      if (String(voice.quality).toLowerCase() === 'enhanced') score += 25;
      if (/enhanced|premium|neural|natural/i.test(`${voice.name} ${voice.identifier}`)) score += 5;
      return { voice, score, index };
    })
    .filter(({ score }) => score >= 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.voice;
}

const SPOKEN_TERMS: Record<AppLanguage, Record<string, string>> = {
  English: { SRV: 'S R V', QR: 'Q R', SKU: 'S K U', OTP: 'O T P' },
  Hindi: { SRV: 'एस आर वी', QR: 'क्यू आर', SKU: 'एस के यू', OTP: 'ओ टी पी' },
  Punjabi: { SRV: 'ਐਸ ਆਰ ਵੀ', QR: 'ਕਿਊ ਆਰ', SKU: 'ਐਸ ਕੇ ਯੂ', OTP: 'ਓ ਟੀ ਪੀ' },
};

export function prepareSpeechText(text: string, language: AppLanguage): string {
  const terms = SPOKEN_TERMS[language];
  const linkFallback = language === 'Hindi' ? 'लिंक' : language === 'Punjabi' ? 'ਲਿੰਕ' : 'link';
  const currency = language === 'Hindi' ? 'रुपये' : language === 'Punjabi' ? 'ਰੁਪਏ' : 'rupees';
  const percent = language === 'Hindi' ? 'प्रतिशत' : language === 'Punjabi' ? 'ਫੀਸਦੀ' : 'percent';

  const languageTerms: Record<string, string> = language === 'Hindi'
    ? { whatsapp: 'व्हाट्सऐप', scan: 'स्कैन', app: 'ऐप', support: 'मदद' }
    : language === 'Punjabi'
      ? { whatsapp: 'ਵਟਸਐਪ', scan: 'ਸਕੈਨ', app: 'ਐਪ', support: 'ਮਦਦ' }
      : {};

  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\[([^\]]+)]\((?:https?:\/\/|www\.)[^)]+\)/gi, '$1')
    .replace(/(?:https?:\/\/|www\.)\S+/gi, linkFallback)
    .replace(/^\s{0,3}(?:#{1,6}|[-*•])\s*/gm, '')
    .replace(/[*_~`]/g, '')
    .replace(/₹\s*([\d,.]+)/g, `$1 ${currency}`)
    .replace(/([\d,.]+)\s*%/g, `$1 ${percent}`)
    .replace(/\b(SRV|QR|SKU|OTP)\b/gi, (term) => terms[term.toUpperCase()])
    .replace(/\b(WhatsApp|Scan|app|support)\b/gi, (term) => languageTerms[term.toLowerCase()] ?? term)
    .replace(/\s*\n+\s*/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.{2,}/g, '.')
    .trim();
}
