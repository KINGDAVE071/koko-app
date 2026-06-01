'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/i18n/LanguageContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const router = useRouter();
  const { t, lang } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, pin, name);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur d\'inscription');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full bg-white dark:bg-koko-blue rounded-2xl p-8 shadow-koko-lg">
        <h1 className="text-3xl font-bold text-center mb-6">🌅 {t('app.name')}</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={t('register.name')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
          <input
            type="email"
            placeholder={t('register.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            required
          />
          <input
            type="password"
            placeholder={t('register.pin')}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            maxLength={6}
            required
          />
          <button type="submit" className="w-full py-3 bg-koko-orange text-white font-bold rounded-xl hover:bg-koko-orange-dark transition">
            {t('register.submit')}
          </button>
        </form>
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
