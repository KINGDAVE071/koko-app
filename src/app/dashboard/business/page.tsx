'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import Link from 'next/link';
import { Package, Users, ArrowUpDown, FileText, ClipboardList } from 'lucide-react';
import { useBusinessDashboard } from '@/hooks/useKokoData';

export default function BusinessDashboard() {
  const { t } = useLanguage();
  const { dashboard, isLoading } = useBusinessDashboard();

  if (isLoading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">📊 {t('business.dashboard')}</h1>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko">
          <Package className="w-6 h-6 text-koko-orange mb-2" />
          <p className="text-2xl font-bold">{dashboard.productsCount}</p>
          <p className="text-xs text-gray-500">{t('business.products')}</p>
        </div>
        <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko">
          <Users className="w-6 h-6 text-koko-orange mb-2" />
          <p className="text-2xl font-bold">{dashboard.clientsCount}</p>
          <p className="text-xs text-gray-500">{t('business.clients')}</p>
        </div>
        <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko">
          <FileText className="w-6 h-6 text-koko-orange mb-2" />
          <p className="text-2xl font-bold">{dashboard.invoicesCount}</p>
          <p className="text-xs text-gray-500">Documents</p>
        </div>
        <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko">
          <ArrowUpDown className="w-6 h-6 text-koko-orange mb-2" />
          <p className="text-2xl font-bold">{dashboard.balance.toLocaleString()} FCFA</p>
          <p className="text-xs text-gray-500">{t('business.balance')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/dashboard/business/invoices" className="bg-koko-orange text-white p-4 rounded-xl text-center font-semibold flex items-center justify-center gap-2">
          <FileText size={20} /> Factures
        </Link>
        <Link href="/dashboard/business/quotes" className="bg-blue-500 text-white p-4 rounded-xl text-center font-semibold flex items-center justify-center gap-2">
          <ClipboardList size={20} /> Devis
        </Link>
        <Link href="/dashboard/business/products" className="bg-koko-orange text-white p-4 rounded-xl text-center font-semibold">
          {t('business.products')}
        </Link>
        <Link href="/dashboard/business/clients" className="bg-koko-orange text-white p-4 rounded-xl text-center font-semibold">
          {t('business.clients')}
        </Link>
        <Link href="/dashboard/business/transactions" className="bg-koko-orange text-white p-4 rounded-xl text-center font-semibold col-span-2">
          {t('business.transactions')}
        </Link>
      </div>
    </div>
  );
}
