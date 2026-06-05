'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { FileText, FilePlus, ClipboardList, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';

interface Invoice {
  id: number;
  number: string;
  client_name: string;
  date: string;
  total_ttc: number;
  status: string;
  type: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/invoices');
      setInvoices(res.data.invoices);
    } catch (e) {}
  };

  useEffect(() => { fetchInvoices(); }, []);

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer ce document ?')) {
      await api.delete(`/invoices/${id}`);
      setInvoices(invoices.filter(inv => inv.id !== id));
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    await api.put(`/invoices/${id}`, { status: newStatus });
    fetchInvoices();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📄 Documents</h1>
        <div className="flex space-x-2">
          <Link href="/dashboard/business/invoices/new?type=facture" className="bg-koko-orange text-white px-3 py-2 rounded-lg text-sm flex items-center">
            <FilePlus size={16} className="mr-1" /> Facture
          </Link>
          <Link href="/dashboard/business/invoices/new?type=devis" className="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm flex items-center">
            <ClipboardList size={16} className="mr-1" /> Devis
          </Link>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <FileText size={48} className="mx-auto mb-4 opacity-30" />
          <p>Aucun document pour le moment.</p>
          <p className="text-sm mt-2">Créez une facture ou un devis en quelques clics.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(inv => (
            <div key={inv.id} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow flex justify-between items-center">
              <div>
                <p className="font-bold flex items-center gap-2">
                  {inv.type === 'devis' ? <ClipboardList size={16} className="text-blue-500" /> : <FileText size={16} className="text-koko-orange" />}
                  {inv.number}
                </p>
                <p className="text-sm text-gray-500">{inv.client_name || 'Client inconnu'} – {inv.date}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                  inv.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {inv.status === 'paid' ? 'Payée' : inv.status === 'cancelled' ? 'Annulée' : 'En attente'}
                </span>
                <select
                  value={inv.status}
                  onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                  className="text-xs border rounded p-1 ml-2 dark:bg-gray-700"
                >
                  <option value="pending">En attente</option>
                  <option value="paid">Payée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <p className="font-bold">{inv.total_ttc} FCFA</p>
                <Link href={`/dashboard/business/invoices/${inv.id}`} className="text-koko-orange"><Eye size={18} /></Link>
                <button onClick={() => handleDelete(inv.id)} className="text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
