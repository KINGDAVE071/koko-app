'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Upload, LogOut, Shield, Mail, Globe, Bell, Moon, Sun, Monitor, ChevronDown, Copyright } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [logo, setLogo] = useState<string | null>(user?.logo || null);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [legalTexts, setLegalTexts] = useState({
    privacy_policy: '',
    terms_of_service: '',
    contact_email: 'alimossidavid071@gmail.com',
  });

  useEffect(() => {
    setMounted(true);
    // Charger les textes légaux
    api.get('/public/settings')
      .then(res => {
        if (res.data.privacy_policy) setLegalTexts(prev => ({ ...prev, privacy_policy: res.data.privacy_policy }));
        if (res.data.terms_of_service) setLegalTexts(prev => ({ ...prev, terms_of_service: res.data.terms_of_service }));
        if (res.data.contact_email) setLegalTexts(prev => ({ ...prev, contact_email: res.data.contact_email }));
      })
      .catch(() => {});
  }, []);

  // Évite le rendu côté serveur pour le thème
  if (!mounted) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Veuillez sélectionner une image'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('L\'image est trop lourde (max 2 Mo)'); return; }
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

  const currentTheme = theme === 'system' ? systemTheme : theme;

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">⚙️ Paramètres</h1>

      {/* Profil utilisateur */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-2xl shadow-lg p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-koko-orange flex items-center justify-center text-white text-2xl font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{user?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            {user?.role === 'admin' && (
              <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-koko-orange/10 text-koko-orange text-xs font-medium">
                <Shield size={12} /> Administrateur
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Réglages */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-2xl shadow-lg p-5 mb-6 space-y-5">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Globe size={20} /> {t('profile.language')}
        </h3>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value as any)}
          className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-koko-orange transition"
        >
          {languages.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
            <Bell size={20} /> Notifications
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Rappels de prise (pilulier)</span>
            <button
              onClick={() => {
                if (Notification.permission === 'granted') {
                  toast.info('Notifications déjà activées');
                } else {
                  Notification.requestPermission().then(perm => {
                    if (perm === 'granted') toast.success('Notifications activées');
                    else toast.error('Permission refusée');
                  });
                }
              }}
              className="px-4 py-2 rounded-xl bg-koko-orange hover:bg-koko-orange-dark text-white text-sm font-medium transition"
            >
              {Notification.permission === 'granted' ? 'Activées' : 'Activer'}
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
            <Sun size={20} /> Apparence
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                theme === 'light' ? 'bg-koko-orange text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Sun size={16} className="inline mr-1" /> Clair
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                theme === 'dark' ? 'bg-koko-orange text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Moon size={16} className="inline mr-1" /> Sombre
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                theme === 'system' ? 'bg-koko-orange text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Monitor size={16} className="inline mr-1" /> Système
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
            <Upload size={20} /> Logo des reçus
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Formats acceptés : PNG, JPG. Taille maximale : 2 Mo.</p>
          {logo && (
            <div className="mb-2 flex justify-center">
              <img src={logo} alt="Logo" className="h-16 object-contain bg-gray-100 dark:bg-gray-800 rounded p-1" />
            </div>
          )}
          <label className="flex items-center justify-center gap-2 py-2 px-4 bg-koko-orange hover:bg-koko-orange-dark text-white rounded-lg cursor-pointer transition">
            <Upload size={18} />
            {loadingLogo ? 'Enregistrement...' : 'Charger un logo'}
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Légal & Contact */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-2xl shadow-lg p-5 mb-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Shield size={20} /> Informations légales
        </h3>
        
        <div className="space-y-3 text-sm">
          {legalTexts.privacy_policy && (
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
                Politique de confidentialité
                <ChevronDown size={16} className="transition group-open:rotate-180" />
              </summary>
              <div className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {legalTexts.privacy_policy}
              </div>
            </details>
          )}

          {legalTexts.terms_of_service && (
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
                Conditions d'utilisation
                <ChevronDown size={16} className="transition group-open:rotate-180" />
              </summary>
              <div className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">
                {legalTexts.terms_of_service}
              </div>
            </details>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
              <Mail size={16} /> Contact développeur
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              <a href={`mailto:${legalTexts.contact_email}`} className="text-koko-orange hover:underline">{legalTexts.contact_email}</a>
            </p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-gray-900/50 backdrop-blur-md border border-koko-orange/10">
          <Copyright size={14} className="text-gray-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            2026 KOKO<span className="text-koko-orange font-bold">®</span> – Tous droits réservés
          </span>
        </div>
      </div>

      <button
        onClick={logout}
        className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors flex items-center justify-center gap-2"
      >
        <LogOut size={18} /> {t('profile.logout')}
      </button>
    </div>
  );
}
