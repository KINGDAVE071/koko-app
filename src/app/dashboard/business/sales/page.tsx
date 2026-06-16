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
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

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

      <div className="space-y-2">
        {sales.map(sale => (
          <div key={sale.id} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-xl p-3 flex justify-between items-center shadow-sm">
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">{sale.description || 'Vente'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(sale.created_at).toLocaleString()}</p>
              <p className="text-sm text-green-600 dark:text-green-400">+{sale.profit} FCFA (bénéfice)</p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-bold text-koko-orange">{sale.amount} FCFA</p>
              <button onClick={() => setSelectedSale(sale)} className="text-koko-orange hover:text-koko-orange-dark transition">
                <Eye size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modale ticket */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSelectedSale(null)}>
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-koko-orange/20 rounded-2xl p-5 shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <ReceiptV2
              receipt={{
                id: selectedSale.id,
                type: 'vente',
                from_name: 'Client',
                to_name: 'KOKO',
                amount: selectedSale.amount,
                currency: 'XOF',
                description: selectedSale.description,
                hash: selectedSale.hash,
                created_at: selectedSale.created_at,
                location: undefined,
              }}
              items={selectedSale.items}
            />
            <button onClick={() => setSelectedSale(null)} className="w-full mt-4 py-2 rounded-lg bg-koko-orange hover:bg-koko-orange-dark text-white transition">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
