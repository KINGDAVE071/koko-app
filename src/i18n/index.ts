import fr from './translations/fr.json';
import en from './translations/en.json';
import ar from './translations/ar.json';
import zh from './translations/zh.json';
import ja from './translations/ja.json';

export type Direction = 'ltr' | 'rtl';

export const languages: Record<string, { label: string; direction: Direction; translations: Record<string, string> }> = {
  fr: { label: 'Français', direction: 'ltr', translations: fr },
  en: { label: 'English', direction: 'ltr', translations: en },
  ar: { label: 'العربية', direction: 'rtl', translations: ar },
  zh: { label: '中文', direction: 'ltr', translations: zh },
  ja: { label: '日本語', direction: 'ltr', translations: ja },
};

export type LanguageCode = keyof typeof languages;

export const getLanguage = (code: LanguageCode) => languages[code];
