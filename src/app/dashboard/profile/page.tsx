'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import type { LanguageCode } from '@/i18n';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();

  const languages = [
    { code: 'fr' as LanguageCode, label: 'Français' },
    { code: 'en' as LanguageCode, label: 'English' },
    { code: 'ar' as LanguageCode, label: 'العربية' },
    { code: 'zh' as LanguageCode, label: '中文' },
    { code: 'ja' as LanguageCode, label: '日本語' },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('profile.title')}</h1>
      <div className="bg-white dark:bg-koko-blue rounded-2xl p-5 shadow-koko space-y-4">
        <p><strong>{t('profile.name')} :</strong> {user?.name}</p>
        <p><strong>{t('profile.email')} :</strong> {user?.email}</p>
        <div>
          <label className="block text-sm font-medium mb-1">{t('profile.language')}</label>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as LanguageCode)}
            className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>
        </div>
        <button onClick={logout} className="mt-4 py-2 px-4 bg-red-500 text-white rounded-lg">
          {t('profile.logout')}
        </button>
      </div>
    </div>
  );
}
