'use client';

import { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { Eye, EyeOff, User, Mail, Lock, CheckCircle2 } from 'lucide-react';
import KokoLogo from '@/components/KokoLogo';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

  const handleClick = async () => {
    setError('');
    if (!name.trim()) { setError(t('register.name') + ' est requis.'); return; }
    if (!email.trim()) { setError(t('register.email') + ' est requis.'); return; }
    if (!password) { setError((t('register.password') || 'Mot de passe') + ' est requis.'); return; }
    try {
      await register(email, password, name);
      setSuccess(true);
      toast.success(t('register.success') || 'Compte créé avec succès !');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) { setError(err.response?.data?.error || 'Erreur inscription'); }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 size={64} className="text-green-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('register.success') || 'Compte créé avec succès !'}</h2>
          <p className="text-gray-500 dark:text-gray-400">Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 shadow-lg dark:shadow-[0_8px_32px_rgba(230,126,34,0.15)]">
        <div className="flex flex-col items-center mb-8">
          <KokoLogo size={56} />
          <h1 className="mt-4 text-2xl font-extrabold text-gray-800 dark:text-white">{t('register.title')}</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('register.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange focus:ring-2 focus:ring-koko-orange/20 transition"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="email"
              placeholder={t('register.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange focus:ring-2 focus:ring-koko-orange/20 transition"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('register.password') || 'Mot de passe'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange focus:ring-2 focus:ring-koko-orange/20 transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button onClick={handleClick} className="w-full py-3 rounded-xl bg-koko-orange hover:bg-koko-orange-dark text-white font-bold transition-colors shadow-lg hover:shadow-koko-orange/30">
            {t('register.submit')}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t('register.hasAccount')}{' '}
            <Link href="/login" className="text-koko-orange font-semibold hover:underline">
              {t('register.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:to-[#0F172A] text-gray-800 dark:text-white">
        Chargement...
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
