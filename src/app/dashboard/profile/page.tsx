'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Upload, LogOut, Shield, Mail, Globe, Bell, Moon, Sun, ChevronDown, Copyright } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [logo, setLogo] = useState<string | null>(user?.logo || null);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

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

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.classList.toggle('dark', newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
  };

  const languages = [
    { code: 'fr' as const, label: 'Français' },
    { code: 'en' as const, label: 'English' },
    { code: 'ar' as const, label: 'العربية' },
    { code: 'zh' as const, label: '中文' },
    { code: 'ja' as const, label: '日本語' },
  ];

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
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">Mode sombre</span>
            <button
              onClick={toggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-koko-orange' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : ''}`} />
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
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
              Politique de confidentialité
              <ChevronDown size={16} className="transition group-open:rotate-180" />
            </summary>
            <div className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed space-y-2">
              <p><strong>Collecte des données :</strong> KOKO collecte uniquement les informations nécessaires à votre utilisation (email, nom, médicaments, produits, transactions).</p>
              <p><strong>Utilisation :</strong> Vos données ne sont jamais partagées avec des tiers. Elles sont stockées de manière sécurisée et chiffrée.</p>
              <p><strong>Cookies :</strong> KOKO utilise des cookies techniques indispensables au fonctionnement de l'application.</p>
              <p><strong>Droits :</strong> Vous pouvez demander la suppression de votre compte à tout moment en contactant le développeur.</p>
              <p className="text-xs mt-2">Dernière mise à jour : Juin 2026</p>
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer text-gray-700 dark:text-gray-300 font-medium">
              Conditions d'utilisation
              <ChevronDown size={16} className="transition group-open:rotate-180" />
            </summary>
            <div className="mt-2 text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>En utilisant KOKO, vous acceptez de respecter les lois en vigueur dans votre pays. L'application est fournie "en l'état", sans garantie. Le développeur ne peut être tenu responsable des éventuelles pertes de données ou dommages liés à l'utilisation de l'application.</p>
            </div>
          </details>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 className="text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2">
              <Mail size={16} /> Contact développeur
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              <a href="mailto:alimossidavid071@gmail.com" className="text-koko-orange hover:underline">alimossidavid071@gmail.com</a>
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
