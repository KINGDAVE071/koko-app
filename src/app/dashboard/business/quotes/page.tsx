'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { ClipboardList, Plus, Trash2, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useQuotes } from '@/hooks/useKokoData';

interface Quote {
  id: number;
  number: string;
  client_name: string;
  date: string;
  total_ttc: number;
  status: string;
  type: string;
}

export default function QuotesPage() {
  const { quotes, isLoading, mutate } = useQuotes();

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer ce devis ?')) {
      await api.delete(`/invoices/${id}`);
      mutate();
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    await api.put(`/invoices/${id}`, { status: newStatus });
    mutate();
  };

  if (isLoading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Link href="/dashboard/business" className="mr-3 text-gray-500 hover:text-blue-500 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold flex-1">📋 Devis</h1>
        <Link href="/dashboard/business/invoices/new?type=devis" className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center text-sm">
          <Plus size={16} className="mr-1" /> Nouveau
        </Link>
      </div>

      {quotes.length === 0 ? (
        <div className="text-center text-gray-500 py-12">
          <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
          <p>Aucun devis pour le moment.</p>
          <p className="text-sm mt-2">Créez votre premier devis en cliquant sur « Nouveau ».</p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map(inv => (
            <div key={inv.id} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow flex justify-between items-center">
              <div>
                <p className="font-bold flex items-center gap-2">
                  <ClipboardList size={16} className="text-blue-500" />
                  {inv.number}
                </p>
                <p className="text-sm text-gray-500">{inv.client_name || 'Client inconnu'} – {inv.date}</p>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                  inv.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {inv.status === 'paid' ? 'Payé' : inv.status === 'cancelled' ? 'Annulé' : 'En attente'}
                </span>
                <select
                  value={inv.status}
                  onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                  className="text-xs border rounded p-1 ml-2 dark:bg-gray-700"
                >
                  <option value="pending">En attente</option>
                  <option value="paid">Payé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              <div className="flex items-center space-x-3">
                <p className="font-bold">{inv.total_ttc} FCFA</p>
                <Link href={`/dashboard/business/invoices/${inv.id}`} className="text-blue-500"><Eye size={18} /></Link>
                <button onClick={() => handleDelete(inv.id)} className="text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
