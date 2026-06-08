'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pill, ArrowLeftRight, FileText, User, Briefcase, Shield } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { t, lang } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login');
    }
  }, [mounted, user, loading, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-koko-cream">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-2">🌅</div>
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  return (
    <div className="min-h-screen flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <main className="flex-1 pb-20">{children}</main>

      {/* Barre de navigation modernisée */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-koko-blue/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-around px-6 py-2 max-w-lg mx-auto">
          <Link href="/dashboard" className={`relative flex flex-col items-center p-2 transition-colors ${isActive('/dashboard') ? 'text-koko-orange' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <Pill size={22} strokeWidth={isActive('/dashboard') ? 2.5 : 1.8} />
            <span className="text-[10px] mt-0.5 font-medium">{t('nav.health')}</span>
            {isActive('/dashboard') && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-koko-orange" />}
          </Link>

          <Link href="/dashboard/converter" className={`relative flex flex-col items-center p-2 transition-colors ${isActive('/dashboard/converter') ? 'text-koko-orange' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <ArrowLeftRight size={22} strokeWidth={isActive('/dashboard/converter') ? 2.5 : 1.8} />
            <span className="text-[10px] mt-0.5 font-medium">{t('nav.convert')}</span>
            {isActive('/dashboard/converter') && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-koko-orange" />}
          </Link>

          <Link href="/dashboard/receipts" className={`relative flex flex-col items-center p-2 transition-colors ${isActive('/dashboard/receipts') ? 'text-koko-orange' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <FileText size={22} strokeWidth={isActive('/dashboard/receipts') ? 2.5 : 1.8} />
            <span className="text-[10px] mt-0.5 font-medium">{t('nav.receipts')}</span>
            {isActive('/dashboard/receipts') && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-koko-orange" />}
          </Link>

          <Link href="/dashboard/business" className={`relative flex flex-col items-center p-2 transition-colors ${isActive('/dashboard/business') ? 'text-koko-orange' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <Briefcase size={22} strokeWidth={isActive('/dashboard/business') ? 2.5 : 1.8} />
            <span className="text-[10px] mt-0.5 font-medium">{t('nav.business')}</span>
            {isActive('/dashboard/business') && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-koko-orange" />}
          </Link>

          {user.role === 'admin' && (
            <Link href="/dashboard/admin" className={`relative flex flex-col items-center p-2 transition-colors ${isActive('/dashboard/admin') ? 'text-koko-orange' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
              <Shield size={22} strokeWidth={isActive('/dashboard/admin') ? 2.5 : 1.8} />
              <span className="text-[10px] mt-0.5 font-medium">Admin</span>
              {isActive('/dashboard/admin') && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-koko-orange" />}
            </Link>
          )}

          <Link href="/dashboard/profile" className={`relative flex flex-col items-center p-2 transition-colors ${isActive('/dashboard/profile') ? 'text-koko-orange' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
            <User size={22} strokeWidth={isActive('/dashboard/profile') ? 2.5 : 1.8} />
            <span className="text-[10px] mt-0.5 font-medium">{t('nav.profile')}</span>
            {isActive('/dashboard/profile') && <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-koko-orange" />}
          </Link>
        </div>
      </nav>
    </div>
  );
}
