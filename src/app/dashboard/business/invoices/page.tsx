'use client';

import { useLanguage } from '@/i18n/LanguageContext';

export default function InvoicesPage() {
  const { t } = useLanguage();
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🧾 Factures & Devis</h1>
      <div className="bg-white dark:bg-koko-blue rounded-2xl p-5 shadow-koko text-center">
        <p className="text-gray-500 dark:text-gray-400">Fonctionnalité en cours de déploiement.</p>
        <p className="text-sm text-gray-400 mt-2">Vous pourrez bientôt créer des factures et devis.</p>
      </div>
    </div>
  );
}
