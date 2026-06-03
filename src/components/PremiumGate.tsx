'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: React.ReactNode;
  featureName: string;
}

export default function PremiumGate({ children, featureName }: Props) {
  const { user } = useAuth();
  const isPremium = user?.role === 'admin' || (user?.premium_until && new Date(user.premium_until) > new Date());

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="text-center p-4">
      <Lock className="mx-auto mb-2 text-koko-orange" size={32} />
      <p className="text-gray-500 dark:text-gray-400">{featureName} est réservé aux membres Premium.</p>
      <Link href="/dashboard/premium" className="inline-block mt-3 px-4 py-2 bg-koko-orange text-white rounded-lg">
        Devenir Premium
      </Link>
    </div>
  );
}
