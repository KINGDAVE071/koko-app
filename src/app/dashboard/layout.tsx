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
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/login');
    }
  }, [mounted, user, loading, router]);

  // Récupère le nombre de prises en attente via l'API medications
  useEffect(() => {
    if (!user) return;
    const fetchPending = async () => {
      try {
        const { default: api } = await import('@/lib/api');
        const res = await api.get('/medications');
        const meds = res.data.medications || [];
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        let count = 0;
        meds.forEach((med: any) => {
          med.times.forEach((time: string) => {
            if (time <= currentTime && !med.logs[time]) count++;
          });
        });
        setPendingCount(count);
      } catch (e) {}
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!mounted || loading) return <LoadingScreen />;
  if (!user) return null;

  const isActive = (href: string) => pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  return (
    <div className="min-h-screen flex flex-col" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <main className="flex-1 pb-20">
        <PageTransition>{children}</PageTransition>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg border-t border-koko-orange/20 shadow-[0_-4px_20px_rgba(230,126,34,0.05)]">
        <div className="flex items-center justify-around px-4 py-2 max-w-lg mx-auto">
          {[
            { href: '/dashboard', icon: Pill, labelKey: 'nav.health' },
            { href: '/dashboard/converter', icon: ArrowLeftRight, labelKey: 'nav.convert' },
            { href: '/dashboard/receipts', icon: FileText, labelKey: 'nav.receipts' },
            { href: '/dashboard/business', icon: Briefcase, labelKey: 'nav.business' },
            { href: '/dashboard/admin', icon: Shield, labelKey: 'nav.admin', adminOnly: true },
            { href: '/dashboard/profile', icon: User, labelKey: 'nav.profile' },
          ].map(({ href, icon: Icon, labelKey, adminOnly }) => {
            if (adminOnly && user?.role !== 'admin') return null;
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-[44px] rounded-xl transition-all duration-200 ${
                  active
                    ? 'text-koko-orange'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {active && (
                  <span className="absolute inset-0 rounded-xl bg-koko-orange/5 dark:bg-koko-orange/10" />
                )}
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} className="relative z-10" />
                <span className="text-[10px] font-medium relative z-10">{t(labelKey)}</span>
                {active && (
                  <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-koko-orange" />
                )}
                {/* Badge de prises en attente */}
                {href === '/dashboard' && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-koko-orange text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-20">
                    {pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
