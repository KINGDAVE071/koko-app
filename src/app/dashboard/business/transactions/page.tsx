'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { Plus, X } from 'lucide-react';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  date: string;
}

export default function TransactionsPage() {
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'income', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchData = async () => {
    const res = await api.get('/transactions');
    setTransactions(res.data.transactions);
    setBalance(res.data.balance);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/transactions', { ...form, amount: parseFloat(form.amount) });
    setShowAdd(false);
    setForm({ type: 'income', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
    fetchData();
  };

  const handleDeleteSingle = async (id: number) => {
    if (confirm('Supprimer cette transaction ?')) {
      await api.delete(`/transactions/${id}`);
      fetchData();
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Supprimer ${selectedIds.length} transaction(s) sélectionnée(s) ?`)) return;
    for (const id of selectedIds) {
      await api.delete(`/transactions/${id}`);
    }
    fetchData();
    setSelectedIds([]);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">💰 {t('business.transactions')}</h1>
        <div className="flex space-x-2">
          {selectedIds.length > 0 && (
            <button onClick={handleDeleteSelected} className="px-3 py-1 bg-red-500 text-white text-sm rounded-lg">
              Supprimer ({selectedIds.length})
            </button>
          )}
          <button onClick={() => setShowAdd(!showAdd)} className="bg-koko-orange text-white p-2 rounded-lg">
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko mb-4">
        <p className="text-lg font-bold">{t('business.balance')}: {balance.toLocaleString()} FCFA</p>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko mb-4 space-y-3">
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-2 border rounded-lg">
            <option value="income">{t('business.income')}</option>
            <option value="expense">{t('business.expense')}</option>
          </select>
          <input type="number" placeholder="Montant" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full p-2 border rounded-lg" required />
          <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-2 border rounded-lg" />
          <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full p-2 border rounded-lg" required />
          <button type="submit" className="w-full bg-koko-orange text-white py-2 rounded-lg">{t('business.addTransaction')}</button>
        </form>
      )}

      <div className="space-y-2">
        {transactions.map(tx => (
          <div key={tx.id} className={`p-3 rounded-xl shadow-koko flex items-center ${tx.type === 'income' ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'}`}>
            <input
              type="checkbox"
              checked={selectedIds.includes(tx.id)}
              onChange={() => toggleSelect(tx.id)}
              className="mr-2"
            />
            <div className="flex-1">
              <p className="font-semibold">{tx.description || (tx.type === 'income' ? t('business.income') : t('business.expense'))}</p>
              <p className="text-sm text-gray-500">{tx.date}</p>
            </div>
            <p className={`font-bold mr-2 ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()} FCFA
            </p>
            <button onClick={() => handleDeleteSingle(tx.id)} className="text-red-500 hover:text-red-700">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
