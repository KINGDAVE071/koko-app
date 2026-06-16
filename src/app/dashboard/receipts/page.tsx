'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { Plus } from 'lucide-react';
import ReceiptV2 from '@/components/ReceiptV2';

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
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'location', from_name: '', to_name: '', amount: '', currency: 'XOF', description: '', location: '' });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchReceipts = async () => { const res = await api.get('/receipts'); setReceipts(res.data.receipts); };
  useEffect(() => { fetchReceipts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(form.amount);
    if (isNaN(numericAmount) || numericAmount <= 0) { alert('Veuillez entrer un montant valide.'); return; }
    await api.post('/receipts', { ...form, amount: numericAmount });
    setShowAdd(false);
    fetchReceipts();
  };

  const handleDeleteSingle = (id: number) => { setReceipts(prev => prev.filter(r => r.id !== id)); setSelectedIds(prev => prev.filter(x => x !== id)); };
  const toggleSelect = (id: number) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Supprimer ${selectedIds.length} reçu(s) ?`)) return;
    for (const id of selectedIds) await api.delete(`/receipts/${id}`);
    fetchReceipts();
    setSelectedIds([]);
  };

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🧾 {t('receipts.title')}</h1>
        <div className="flex space-x-2">
          {selectedIds.length > 0 && (
            <button onClick={handleDeleteSelected} className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg">Supprimer ({selectedIds.length})</button>
          )}
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center text-koko-orange font-medium">
            <Plus size={18} className="mr-1" /> {t('receipts.new')}
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-2xl shadow-lg dark:shadow-[0_8px_32px_rgba(230,126,34,0.15)] p-5 mb-4 space-y-3">
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-koko-orange transition">
            <option value="location">Location</option>
            <option value="vente">Vente</option>
            <option value="pret">Prêt</option>
            <option value="service">Service</option>
            <option value="autre">Autre</option>
          </select>
          <input placeholder={t('receipts.from')} value={form.from_name} onChange={e => setForm({...form, from_name: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" required />
          <input placeholder={t('receipts.to')} value={form.to_name} onChange={e => setForm({...form, to_name: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" required />
          <input type="number" placeholder={t('receipts.amount')} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" required />
          <input placeholder={t('receipts.description')} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" />
          <input placeholder={t('receipts.location')} value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" />
          <button type="submit" className="w-full py-2 rounded-xl bg-koko-orange hover:bg-koko-orange-dark text-white font-bold transition-colors shadow-lg">{t('receipts.create')}</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {receipts.map(r => (
          <ReceiptV2 key={r.id} receipt={r} onDelete={handleDeleteSingle} isSelected={selectedIds.includes(r.id)} onSelect={toggleSelect} />
        ))}
      </div>
    </div>
  );
}
