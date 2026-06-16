'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Product { id: number; name: string; price: number; cost_price: number; stock: number; min_stock: number; tva: number; }

export default function ProductsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', price: '', cost_price: '', stock: '', min_stock: '', tva: '0' });

  const fetchProducts = async () => { try { const res = await api.get('/products'); setProducts(res.data.products); } catch(e){} };
  useEffect(() => { fetchProducts(); }, []);

  const openAdd = () => { setEditId(null); setForm({ name:'', price:'', cost_price:'', stock:'', min_stock:'', tva:'0' }); setShowForm(true); };
  const openEdit = (p: Product) => { setEditId(p.id); setForm({ name:p.name, price:String(p.price), cost_price:String(p.cost_price||0), stock:String(p.stock||0), min_stock:String(p.min_stock||0), tva:String(p.tva||0) }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { name: form.name, price: Number(form.price), cost_price: Number(form.cost_price)||0, stock: Number(form.stock)||0, min_stock: Number(form.min_stock)||0, tva: Number(form.tva)||0 };
    try {
      if (editId) { await api.put(`/products/${editId}`, payload); toast.success('Produit modifié'); }
      else { await api.post('/products', payload); toast.success('Produit ajouté'); }
      setShowForm(false);
      fetchProducts();
    } catch(err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  const handleDelete = async (id: number) => { if (!confirm('Supprimer ce produit ?')) return; await api.delete(`/products/${id}`); toast.success('Produit supprimé'); fetchProducts(); };

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <div className="flex items-center mb-4">
        <Link href="/dashboard/business" className="mr-3 text-gray-500 dark:text-gray-400 hover:text-koko-orange"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex-1">📦 {t('business.products')}</h1>
        <button onClick={openAdd} className="bg-koko-orange hover:bg-koko-orange-dark text-white p-2 rounded-lg transition"><Plus size={20} /></button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-koko-orange/20 rounded-2xl shadow-2xl p-5 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{editId ? 'Modifier' : 'Nouveau'}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder={t("business.description")} value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" required />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder={t("business.unitPrice")} value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" required />
                <input type="number" placeholder="Prix achat" value={form.cost_price} onChange={e => setForm({...form, cost_price: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" placeholder="Stock" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" />
                <input type="number" placeholder="Stock min alerte" value={form.min_stock} onChange={e => setForm({...form, min_stock: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" />
              </div>
              <input type="number" placeholder="TVA (%)" value={form.tva} onChange={e => setForm({...form, tva: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-koko-orange hover:bg-koko-orange-dark text-white rounded-xl font-bold transition">{editId ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {products.map(p => (
          <div key={p.id} className={`bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-xl p-3 flex justify-between items-center shadow-sm ${p.min_stock > 0 && p.stock <= p.min_stock ? 'border-red-400' : ''}`}>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">{p.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Vente: {p.price} FCFA | Achat: {p.cost_price} FCFA | Stock: {p.stock} | TVA: {p.tva}%</p>
              {p.min_stock > 0 && p.stock <= p.min_stock && <p className="text-xs text-red-500 font-bold">⚠ Stock bas ! (min: {p.min_stock})</p>}
            </div>
            <div className="flex space-x-2">
              <button onClick={() => openEdit(p)} className="text-koko-orange"><Edit size={18} /></button>
              <button onClick={() => handleDelete(p.id)} className="text-red-500"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
        {products.length === 0 && <p className="text-gray-500 text-center py-4">Aucun produit.</p>}
      </div>
    </div>
  );
}
