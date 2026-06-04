'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { FileText, Plus } from 'lucide-react';

interface Invoice {
  id: number;
  number: string;
  date: string;
  total_ttc: number;
  status: string;
  type: string;
}

export default function InvoicesPage() {
  const { t } = useLanguage();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    // Pour l'instant, la table invoices est vide, on affiche un tableau vide
    api.get('/invoices')  // route à créer plus tard, pour l'instant ça va échouer en silence
      .then(res => setInvoices(res.data.invoices))
      .catch(() => {});
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🧾 Factures & Devis</h1>
      <button className="flex items-center text-koko-orange font-medium mb-4 opacity-50 cursor-not-allowed">
        <Plus size={18} className="mr-1" /> Nouvelle facture (bientôt)
      </button>
      {invoices.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p>Aucune facture pour le moment.</p>
          <p className="text-sm mt-2">La création de factures sera disponible dans une prochaine mise à jour.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => (
            <div key={inv.id} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow flex justify-between">
              <div>
                <p className="font-semibold">{inv.number}</p>
                <p className="text-sm text-gray-500">{inv.date}</p>
              </div>
              <p className="font-bold">{inv.total_ttc} FCFA</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
