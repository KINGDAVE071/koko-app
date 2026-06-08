'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { Plus } from 'lucide-react';
import ReceiptV2 from '@/components/ReceiptV2';
import { useReceipts } from '@/hooks/useKokoData';

interface Receipt {
  id: number;
  type: string;
  from_name: string;
  to_name: string;
  amount: number;
  currency: string;
  description?: string;
  location?: string;
  hash: string;
  created_at: string;
}

export default function ReceiptsPage() {
  const { t } = useLanguage();
  const { receipts, isLoading, mutate } = useReceipts();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'location', from_name: '', to_name: '', amount: '', currency: 'XOF', description: '', location: '' });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/receipts', { ...form, amount: parseFloat(form.amount) });
    setShowAdd(false);
    mutate();
  };

  const handleDeleteSingle = (id: number) => {
    mutate(); // sera rappelé après suppression dans ReceiptV2
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Supprimer ${selectedIds.length} reçu(s) sélectionné(s) ?`)) return;
    for (const id of selectedIds) {
      await api.delete(`/receipts/${id}`);
    }
    setSelectedIds([]);
    mutate();
  };

  if (isLoading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">🧾 {t('receipts.title')}</h1>
        <div className="flex space-x-2">
          {selectedIds.length > 0 && (
            <button onClick={handleDeleteSelected} className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg">
              Supprimer ({selectedIds.length})
            </button>
          )}
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center text-koko-orange font-medium">
            <Plus size={18} className="mr-1" /> {t('receipts.new')}
          </button>
        </div>
      </div>
      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko mb-4 space-y-3">
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-2 border rounded-lg">
            <option value="location">Location</option>
            <option value="vente">Vente</option>
            <option value="pret">Prêt</option>
            <option value="service">Service</option>
            <option value="autre">Autre</option>
          </select>
          <input placeholder={t('receipts.from')} value={form.from_name} onChange={e => setForm({...form, from_name: e.target.value})} className="w-full p-2 border rounded-lg" required />
          <input placeholder={t('receipts.to')} value={form.to_name} onChange={e => setForm({...form, to_name: e.target.value})} className="w-full p-2 border rounded-lg" required />
          <input type="number" placeholder={t('receipts.amount')} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full p-2 border rounded-lg" required />
          <input placeholder={t('receipts.description')} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2 border rounded-lg" />
          <input placeholder={t('receipts.location')} value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full p-2 border rounded-lg" />
          <button type="submit" className="w-full py-2 bg-koko-orange text-white rounded-lg">{t('receipts.create')}</button>
        </form>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {receipts.map(r => (
          <ReceiptV2
            key={r.id}
            receipt={r}
            onDelete={handleDeleteSingle}
            isSelected={selectedIds.includes(r.id)}
            onSelect={toggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
