'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  type: string;
}

export default function ClientsPage() {
  const { t } = useLanguage();
  const [clients, setClients] = useState<Client[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', type: 'client' });

  const fetchClients = async () => {
    const res = await api.get('/clients');
    setClients(res.data.clients);
  };

  useEffect(() => { fetchClients(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/clients', form);
    setShowAdd(false);
    setForm({ name: '', email: '', phone: '', type: 'client' });
    fetchClients();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/clients/${id}`);
    fetchClients();
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Link href="/dashboard/business" className="mr-3 text-gray-500 hover:text-koko-orange transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold flex-1">👥 {t('business.clients')}</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-koko-orange text-white p-2 rounded-lg">
          <Plus size={20} />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko mb-4 space-y-3">
          <input placeholder="Nom" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded-lg" required />
          <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full p-2 border rounded-lg" />
          <input placeholder="Téléphone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full p-2 border rounded-lg" />
          <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className="w-full p-2 border rounded-lg">
            <option value="client">Client</option>
            <option value="fournisseur">Fournisseur</option>
          </select>
          <button type="submit" className="w-full bg-koko-orange text-white py-2 rounded-lg">{t('business.addClient')}</button>
        </form>
      )}

      {clients.map(c => (
        <div key={c.id} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow-koko mb-2 flex justify-between items-center">
          <div>
            <p className="font-semibold">{c.name} <span className="text-xs text-gray-400">({c.type})</span></p>
            <p className="text-sm text-gray-500">{c.phone || c.email}</p>
          </div>
          <button onClick={() => handleDelete(c.id)} className="text-red-500"><Trash2 size={18} /></button>
        </div>
      ))}
    </div>
  );
}
