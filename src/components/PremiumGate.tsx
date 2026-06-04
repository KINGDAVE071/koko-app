'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Lock } from 'lucide-react';

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
    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
      <Lock className="mx-auto mb-2 text-koko-orange" size={32} />
      <p className="text-gray-500 dark:text-gray-400">{featureName} est réservé aux membres Premium.</p>
      <p className="text-sm text-gray-400 mt-1">Le paiement sera disponible prochainement.</p>
    </div>
  );
}
