'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useProducts } from '@/hooks/useKokoData';

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  stock: number;
  tva: number;
}

export default function ProductsPage() {
  const { t } = useLanguage();
  const { products, isLoading, mutate } = useProducts();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', unit: 'pièce', stock: '0', tva: '0' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/products', {
      name: form.name,
      price: parseFloat(form.price),
      unit: form.unit,
      stock: parseInt(form.stock),
      tva: parseFloat(form.tva),
    });
    setShowAdd(false);
    setForm({ name: '', price: '', unit: 'pièce', stock: '0', tva: '0' });
    mutate();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/products/${id}`);
    mutate();
  };

  if (isLoading) return <div className="p-4 text-center">Chargement...</div>;

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Link href="/dashboard/business" className="mr-3 text-gray-500 hover:text-koko-orange transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold flex-1">📦 {t('business.products')}</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-koko-orange text-white p-2 rounded-lg">
          <Plus size={20} />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko mb-4 space-y-3">
          <input placeholder="Nom" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 border rounded-lg" required />
          <input type="number" placeholder="Prix" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full p-2 border rounded-lg" required />
          <input placeholder="Unité" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full p-2 border rounded-lg" />
          <input type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full p-2 border rounded-lg" />
          <input type="number" placeholder="TVA (%)" value={form.tva} onChange={e => setForm({...form, tva: e.target.value})} className="w-full p-2 border rounded-lg" />
          <button type="submit" className="w-full bg-koko-orange text-white py-2 rounded-lg">{t('business.addProduct')}</button>
        </form>
      )}

      {products.map((p: Product) => (
        <div key={p.id} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow-koko mb-2 flex justify-between items-center">
          <div>
            <p className="font-semibold">{p.name}</p>
            <p className="text-sm text-gray-500">{p.price} FCFA / {p.unit} - Stock: {p.stock} - TVA: {p.tva}%</p>
          </div>
          <button onClick={() => handleDelete(p.id)} className="text-red-500"><Trash2 size={18} /></button>
        </div>
      ))}
    </div>
  );
}
