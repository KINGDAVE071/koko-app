'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';
import ReceiptV2 from '@/components/ReceiptV2';

interface SaleItem { product_name: string; quantity: number; unit_price: number; cost_price: number; }
interface Sale { id: number; amount: number; description: string; hash: string; created_at: string; profit: number; items: SaleItem[]; }

export default function SalesHistoryPage() {
  const { t } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sales').then(res => setSales(res.data.sales)).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <div className="flex items-center mb-4">
        <Link href="/dashboard/business" className="mr-3 text-gray-500 dark:text-gray-400 hover:text-koko-orange"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex-1">📋 Historique des ventes</h1>
      </div>
      {loading && <p className="text-gray-500 text-center">Chargement...</p>}
      {!loading && sales.length === 0 && <p className="text-gray-500 text-center py-8">Aucune vente enregistrée.</p>}
      <div className="space-y-3">
        {sales.map(sale => (
          <ReceiptV2
            key={sale.id}
            receipt={{
              id: sale.id,
              type: 'vente',
              from_name: 'Client',
              to_name: 'KOKO',
              amount: sale.amount,
              currency: 'XOF',
              description: sale.description,
              hash: sale.hash,
              created_at: sale.created_at,
              location: undefined,
            }}
            items={sale.items}
            onDelete={(id) => { /* optionnel */ }}
          />
        ))}
      </div>
    </div>
  );
}
