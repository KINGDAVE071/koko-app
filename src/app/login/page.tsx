'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Mail, Lock, Sunset } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const { t, lang } = useLanguage();

  const handleClick = async () => {
    setError('');
    if (!email.trim()) {
      setError(t('login.email') + ' est requis.');
      return;
    }
    if (!password) {
      setError((t('login.password') || 'Mot de passe') + ' est requis.');
      return;
    }
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || t('login.error') || 'Erreur de connexion');
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-midnight via-midnight to-teal-deep"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* ---- Formes décoratives floutées (orbites / sunset) ---- */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grande sphère orange/corail en haut à droite */}
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-solar-flare/30 blur-[120px] opacity-70" />
        {/* Touche de jaune pâle/crème en bas à gauche */}
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full bg-golden-glow/20 blur-[100px] opacity-80" />
        {/* Petite sphère violette pour la profondeur (optionnel) */}
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-purple-500/10 blur-[80px] opacity-60" />
      </div>

      {/* ---- Carte en verre (Glassmorphism) ---- */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-scale-in">
        {/* Logo + Titre */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 text-3xl font-bold text-white">
            <Sunset className="w-8 h-8 text-cosmic-500" />
            KOKO
          </div>
          <p className="mt-2 text-sm text-white/60">{t('app.tagline')}</p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm text-center">
            {error}
          </div>
        )}

        {/* Formulaire */}
        <div className="space-y-5">
          {/* Champ Email */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-cosmic-500 transition-colors" />
            <input
              type="email"
              placeholder={t('login.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cosmic-500 focus:ring-2 focus:ring-cosmic-500/30 transition-all duration-300"
            />
          </div>

          {/* Champ Mot de passe */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 group-focus-within:text-cosmic-500 transition-colors" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('login.password') || 'Mot de passe'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-cosmic-500 focus:ring-2 focus:ring-cosmic-500/30 transition-all duration-300"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Bouton Connexion (corail vibrant) */}
          <button
            onClick={handleClick}
            className="w-full py-3.5 rounded-xl bg-cosmic-500 hover:bg-cosmic-600 text-white font-bold text-lg tracking-wide shadow-lg hover:shadow-cosmic-500/25 transition-all duration-300 active:scale-[0.98]"
          >
            {t('login.submit')}
          </button>

          {/* Séparateur */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/40">{t('login.or') || 'ou'}</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Bouton Google */}
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white flex items-center justify-center gap-3 transition-all duration-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>{t('login.google') || 'Continuer avec Google'}</span>
          </button>

          {/* Lien inscription */}
          <p className="text-center text-sm text-white/50 mt-4">
            {t('login.noAccount')}{' '}
            <Link href="/register" className="text-cosmic-500 hover:text-cosmic-400 font-semibold transition-colors">
              {t('login.registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
