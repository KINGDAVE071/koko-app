'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowLeft, Eye } from 'lucide-react';
import Link from 'next/link';

interface Sale {
  id: number;
  amount: number;
  description: string;
  hash: string;
  created_at: string;
  profit: number;
}

export default function SalesHistoryPage() {
  const { t } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/sales')
      .then(res => setSales(res.data.sales))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Link href="/dashboard/business" className="mr-3 text-gray-500 hover:text-koko-orange">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold flex-1">📋 Historique des ventes</h1>
      </div>

      {loading && <p className="text-gray-500 text-center">Chargement...</p>}
      {!loading && sales.length === 0 && (
        <p className="text-gray-500 text-center py-8">Aucune vente enregistrée.</p>
      )}

      <div className="space-y-2">
        {sales.map(sale => (
          <div key={sale.id} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow-koko flex justify-between items-center">
            <div>
              <p className="font-semibold">{sale.description}</p>
              <p className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleString()}</p>
              <p className="text-xs text-gray-400">Hash : #{sale.hash}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-koko-orange">{sale.amount} FCFA</p>
              <p className="text-xs text-green-600">+{sale.profit} FCFA (bénéfice)</p>
              <Link href={`/dashboard/receipts`} className="text-koko-orange text-xs flex items-center justify-end gap-1 mt-1">
                <Eye size={14} /> Voir ticket
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
