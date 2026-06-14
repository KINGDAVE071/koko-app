'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { signIn } from 'next-auth/react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import KokoLogo from '@/components/KokoLogo';

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
    <div className="min-h-screen flex items-center justify-center px-4 bg-koko-dark-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md p-8 rounded-2xl bg-koko-dark-surface/80 backdrop-blur-lg border border-koko-orange/20 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <KokoLogo size={56} />
          <h1 className="mt-4 text-2xl font-extrabold text-white">KOKO</h1>
          <p className="mt-1 text-sm text-gray-400">{t('app.tagline')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              placeholder={t('login.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-koko-dark-surface-2 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-koko-orange focus:ring-2 focus:ring-koko-orange/20 transition"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('login.password') || 'Mot de passe'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-koko-dark-surface-2 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-koko-orange focus:ring-2 focus:ring-koko-orange/20 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button onClick={handleClick} className="w-full py-3 rounded-xl bg-koko-orange hover:bg-koko-orange-dark text-white font-bold transition-colors">
            {t('login.submit')}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-gray-500">{t('login.or') || 'ou'}</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full py-3 rounded-xl bg-koko-dark-surface-2 border border-gray-700 text-white hover:bg-koko-dark-surface flex items-center justify-center gap-3 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{t('login.google') || 'Continuer avec Google'}</span>
          </button>

          <p className="text-center text-sm text-gray-500">
            {t('login.noAccount')}{' '}
            <Link href="/register" className="text-koko-orange font-semibold hover:underline">
              {t('login.registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
