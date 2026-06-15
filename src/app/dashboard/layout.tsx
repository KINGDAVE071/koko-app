'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Pill, ArrowLeftRight, FileText, User, Briefcase, Shield } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import LoadingScreen from '@/components/LoadingScreen';
import PageTransition from '@/components/PageTransition';

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
    return <LoadingScreen />;
  }

  if (!user) {
    return null;
  }

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  return (
    <div className="min-h-screen flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <main className="flex-1 pb-20">
        <PageTransition>{children}</PageTransition>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-koko-dark-surface border-t border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-between items-center z-50 overflow-x-auto shadow-nav">
        <Link href="/dashboard" className={`flex flex-col items-center transition-colors duration-200 ${isActive('/dashboard') && !isActive('/dashboard/converter') && !isActive('/dashboard/receipts') && !isActive('/dashboard/business') && !isActive('/dashboard/profile') && !isActive('/dashboard/admin') ? 'text-koko-orange' : 'text-gray-400 dark:text-gray-500 hover:text-koko-orange'}`}>
          <Pill className="w-5 h-5" />
          <span className="text-xs">{t('nav.health')}</span>
        </Link>
        <Link href="/dashboard/converter" className={`flex flex-col items-center transition-colors duration-200 ${isActive('/dashboard/converter') ? 'text-koko-orange' : 'text-gray-400 dark:text-gray-500 hover:text-koko-orange'}`}>
          <ArrowLeftRight className="w-5 h-5" />
          <span className="text-xs">{t('nav.convert')}</span>
        </Link>
        <Link href="/dashboard/receipts" className={`flex flex-col items-center transition-colors duration-200 ${isActive('/dashboard/receipts') ? 'text-koko-orange' : 'text-gray-400 dark:text-gray-500 hover:text-koko-orange'}`}>
          <FileText className="w-5 h-5" />
          <span className="text-xs">{t('nav.receipts')}</span>
        </Link>
        <Link href="/dashboard/business" className={`flex flex-col items-center transition-colors duration-200 ${isActive('/dashboard/business') ? 'text-koko-orange' : 'text-gray-400 dark:text-gray-500 hover:text-koko-orange'}`}>
          <Briefcase className="w-5 h-5" />
          <span className="text-xs">{t('nav.business')}</span>
        </Link>
        {user.role === 'admin' && (
          <Link href="/dashboard/admin" className={`flex flex-col items-center transition-colors duration-200 ${isActive('/dashboard/admin') ? 'text-koko-orange' : 'text-gray-400 dark:text-gray-500 hover:text-koko-orange'}`}>
            <Shield className="w-5 h-5" />
            <span className="text-xs">Admin</span>
          </Link>
        )}
        <Link href="/dashboard/profile" className={`flex flex-col items-center transition-colors duration-200 ${isActive('/dashboard/profile') ? 'text-koko-orange' : 'text-gray-400 dark:text-gray-500 hover:text-koko-orange'}`}>
          <User className="w-5 h-5" />
          <span className="text-xs">{t('nav.profile')}</span>
        </Link>
      </nav>
    </div>
  );
}
