'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { Plus, Eye } from 'lucide-react';

interface Receipt {
  id: number;
  type: string;
  from_name: string;
  to_name: string;
  amount: number;
  currency: string;
  description?: string;
  created_at: string;
}

export default function ReceiptsPage() {
  const { t } = useLanguage();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'location', from_name: '', to_name: '', amount: '', currency: 'XOF', description: '', location: '' });

  const fetchReceipts = async () => {
    const res = await api.get('/receipts');
    setReceipts(res.data.receipts);
  };

  useEffect(() => { fetchReceipts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/receipts', { ...form, amount: parseFloat(form.amount) });
    setShowAdd(false);
    fetchReceipts();
  };

  const typeOptions = [
    { value: 'location', label: 'Location' },
    { value: 'vente', label: 'Vente' },
    { value: 'pret', label: 'Prêt' },
    { value: 'service', label: 'Service' },
    { value: 'autre', label: 'Autre' },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">📄 {t('receipts.title')}</h1>
      <button onClick={() => setShowAdd(!showAdd)} className="flex items-center text-koko-orange font-medium mb-4 transition-colors duration-200 hover:text-koko-orange-dark">
        <Plus size={18} className="mr-1" /> {t('receipts.new')}
      </button>
      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko mb-4 space-y-3">
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-2 border rounded-lg">
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <input placeholder={t('receipts.from')} value={form.from_name} onChange={e => setForm({...form, from_name: e.target.value})} className="w-full p-2 border rounded-lg" required />
          <input placeholder={t('receipts.to')} value={form.to_name} onChange={e => setForm({...form, to_name: e.target.value})} className="w-full p-2 border rounded-lg" required />
          <input type="number" placeholder={t('receipts.amount')} value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full p-2 border rounded-lg" required />
          <input placeholder={t('receipts.description')} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2 border rounded-lg" />
          <button type="submit" className="w-full py-2 bg-koko-orange text-white rounded-lg transition-colors duration-200 hover:bg-koko-orange-dark">
            {t('receipts.create')}
          </button>
        </form>
      )}
      <div className="space-y-3">
        {receipts.map(r => (
          <div key={r.id} className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko transition-all duration-200 hover:shadow-koko-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">{r.from_name} → {r.to_name}</p>
                <p className="text-sm text-gray-500">{r.type} - {r.amount} {r.currency}</p>
                <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
              <button className="text-koko-orange hover:text-koko-orange-dark transition-colors duration-200"><Eye size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
