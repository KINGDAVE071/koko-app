'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [logo, setLogo] = useState<string | null>(user?.logo || null);
  const [loadingLogo, setLoadingLogo] = useState(false);

  useEffect(() => {
    setLogo(user?.logo || null);
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }
    // Vérifier la taille (2 Mo max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('L\'image est trop lourde (max 2 Mo)');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogo(base64);
      setLoadingLogo(true);
      api.put('/auth-logo/logo', { logo: base64 }).then(() => {
        toast.success('Logo enregistré !');
        refreshUser();
      }).catch(() => toast.error('Erreur lors de l\'enregistrement'))
      .finally(() => setLoadingLogo(false));
    };
    reader.readAsDataURL(file);
  };

  const languages = [
    { code: 'fr' as const, label: 'Français' },
    { code: 'en' as const, label: 'English' },
    { code: 'ar' as const, label: 'العربية' },
    { code: 'zh' as const, label: '中文' },
    { code: 'ja' as const, label: '日本語' },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">👤 {t('profile.title')}</h1>
      <div className="bg-white dark:bg-koko-blue rounded-2xl p-5 shadow-koko space-y-4">
        <p><strong>{t('profile.name')} :</strong> {user?.name}</p>
        <p><strong>{t('profile.email')} :</strong> {user?.email}</p>
        <p><strong>{t('profile.language')} :</strong></p>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as any)}
          className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white"
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>

        {/* Section Logo */}
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">Logo des reçus</h3>
          <p className="text-xs text-gray-400 mb-2">Formats acceptés : PNG, JPG. Taille maximale : 2 Mo.</p>
          {logo && (
            <div className="mb-2 flex justify-center">
              <img src={logo} alt="Logo" className="h-16 object-contain bg-gray-100 rounded p-1" />
            </div>
          )}
          <label className="flex items-center justify-center gap-2 py-2 px-4 bg-koko-orange text-white rounded-lg cursor-pointer hover:bg-koko-orange-dark transition">
            <Upload size={18} />
            {loadingLogo ? 'Enregistrement...' : 'Charger un logo'}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>

        <button onClick={logout} className="mt-4 py-2 px-4 bg-red-500 text-white rounded-lg">
          {t('profile.logout')}
        </button>
      </div>
    </div>
  );
}
