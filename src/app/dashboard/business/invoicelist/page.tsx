'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Plus, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: number;
  number: string;
  client_name: string;
  date: string;
  total_ttc: number;
  status: string;
}

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data.invoices);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer cette facture ?')) {
      await api.delete(`/invoices/${id}`);
      setInvoices(invoices.filter(inv => inv.id !== id));
    }
  };

  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🧾 Factures</h1>
        <Link href="/dashboard/business/invoicelist/new" className="bg-koko-orange text-white px-4 py-2 rounded-lg flex items-center text-sm">
          <Plus size={16} className="mr-1" /> Nouvelle
        </Link>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <p>Aucune facture pour le moment.</p>
          <p className="text-sm mt-2">Créez votre première facture en cliquant sur « Nouvelle ».</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div key={inv.id} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow flex justify-between items-center">
              <div>
                <p className="font-bold">{inv.number}</p>
                <p className="text-sm text-gray-500">{inv.client_name || 'Client inconnu'} – {inv.date}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                  inv.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {inv.status === 'paid' ? 'Payée' : inv.status === 'cancelled' ? 'Annulée' : 'En attente'}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <p className="font-bold">{inv.total_ttc} FCFA</p>
                <Link href={`/dashboard/business/invoicelist/${inv.id}`} className="text-koko-orange"><Eye size={18} /></Link>
                <button onClick={() => handleDelete(inv.id)} className="text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
