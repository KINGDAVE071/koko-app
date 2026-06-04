'use client';

import { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { toast } from 'sonner';

// Composant interne qui utilise useSearchParams
function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();

  // Pré-remplir l'email si présent dans l'URL
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) setEmail(emailParam);
  }, [searchParams]);

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full bg-white dark:bg-koko-blue rounded-2xl p-8 shadow-koko-lg">
        <h1 className="text-3xl font-bold text-center mb-6">🌅 {t('app.name')}</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success ? (
          <div className="text-center text-green-600 font-medium">
            {t('register.success') || 'Compte créé avec succès ! Redirection...'}
          </div>
        ) : (
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
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="password"
              placeholder={t('register.password') || 'Mot de passe'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button onClick={handleClick} className="w-full py-3 bg-koko-orange text-white font-bold rounded-xl hover:bg-koko-orange-dark transition">
              {t('register.submit')}
            </button>
          </div>
        )}
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

// Page principale avec Suspense
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
