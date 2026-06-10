'use client';

import { Suspense, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';

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

  const fromGoogle = searchParams.get('fromGoogle') === 'true';
  const googleEmail = searchParams.get('email') || '';

  // Pré-remplir l'email si venant de Google
  useEffect(() => {
    if (googleEmail) setEmail(googleEmail);
  }, [googleEmail]);

  const handleClick = async () => {
    setError('');

    if (!name.trim()) {
      setError((t('register.name') || 'Nom') + ' est requis.');
      return;
    }
    if (!email.trim()) {
      setError((t('register.email') || 'Email') + ' est requis.');
      return;
    }
    if (!password) {
      setError((t('register.password') || 'Mot de passe') + ' est requis.');
      return;
    }

    try {
      await register(email, password, name);
      setSuccess(true);
      toast.success(t('register.success') || 'Compte créé avec succès !');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur inscription');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-koko-cream dark:bg-koko-cream-dark">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 size={64} className="text-koko-success mb-4" />
          <h2 className="text-xl font-bold text-koko-text dark:text-white mb-2">
            {t('register.success') || 'Compte créé avec succès !'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full bg-white dark:bg-koko-blue rounded-2xl p-8 shadow-koko-lg">
        <h1 className="text-3xl font-bold text-center mb-6">🌅 {t('app.name')}</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {fromGoogle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 text-center">
            Créez un mot de passe pour finaliser votre inscription avec Google.
          </p>
        )}
        <div className="space-y-4">
          <input
            type="text"
            placeholder={t('register.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="email"
            placeholder={t('register.email')}
            value={email}
            onChange={(e) => !fromGoogle && setEmail(e.target.value)}
            readOnly={fromGoogle}
            className={`w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white ${fromGoogle ? 'opacity-75 cursor-not-allowed' : ''}`}
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder={t('register.password') || 'Mot de passe'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button onClick={handleClick} className="w-full py-3 bg-koko-orange text-white font-bold rounded-xl hover:bg-koko-orange-dark transition">
            {t('register.submit')}
          </button>
        </div>
        <p className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
          {t('register.hasAccount')}{' '}
          <Link href="/login" className="text-koko-orange font-medium">
            {t('register.loginLink')}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-4xl">🌅</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
