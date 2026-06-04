'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function NewInvoicePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    client_name: '',
    type: 'facture',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    discount: 0,
    notes: '',
  });
  const [items, setItems] = useState([{ description: '', quantity: 1, unit_price: 0, tva: 0 }]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, tva: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: any) => {
    const copy = [...items];
    (copy[i] as any)[field] = value;
    setItems(copy);
  };

  const totalHT = items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
  const totalTTC = items.reduce((sum, it) => sum + it.quantity * it.unit_price * (1 + it.tva / 100), 0);
  const net = totalTTC - form.discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/invoices', {
        ...form,
        items: items.map(it => ({ ...it, quantity: Number(it.quantity), unit_price: Number(it.unit_price) })),
      });
      router.push('/dashboard/business/invoicelist');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Nouvelle facture</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input placeholder="Nom du client" value={form.client_name} onChange={e => setForm({...form, client_name: e.target.value})} className="w-full border rounded-lg p-2 dark:bg-gray-700" required />
        <div className="flex space-x-2">
          <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border rounded-lg p-2 dark:bg-gray-700" />
          <input type="date" placeholder="Échéance" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="border rounded-lg p-2 dark:bg-gray-700" />
        </div>

        {items.map((item, i) => (
          <div key={i} className="flex items-center space-x-2">
            <input placeholder="Description" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} className="flex-1 border rounded p-2 dark:bg-gray-700" required />
            <input type="number" placeholder="Qté" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} className="w-16 border rounded p-2 dark:bg-gray-700" min="1" />
            <input type="number" placeholder="Prix" value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)} className="w-24 border rounded p-2 dark:bg-gray-700" min="0" />
            <input type="number" placeholder="TVA%" value={item.tva} onChange={e => updateItem(i, 'tva', e.target.value)} className="w-16 border rounded p-2 dark:bg-gray-700" />
            <button type="button" onClick={() => removeItem(i)} className="text-red-500"><Trash2 size={16} /></button>
          </div>
        ))}
        <button type="button" onClick={addItem} className="flex items-center text-koko-orange"><PlusCircle size={16} className="mr-1" /> Ajouter une ligne</button>

        <div className="flex space-x-2">
          <input type="number" placeholder="Remise (FCFA)" value={form.discount} onChange={e => setForm({...form, discount: Number(e.target.value)})} className="border rounded-lg p-2 dark:bg-gray-700" />
          <textarea placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border rounded-lg p-2 flex-1 dark:bg-gray-700" />
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
          <p>Total HT : {totalHT.toFixed(2)} FCFA</p>
          <p>Total TTC : {totalTTC.toFixed(2)} FCFA</p>
          {form.discount > 0 && <p>Remise : -{form.discount} FCFA</p>}
          <p className="text-lg font-bold">Net à payer : {net.toFixed(2)} FCFA</p>
        </div>

        <button type="submit" className="w-full py-3 bg-koko-orange text-white font-bold rounded-xl">Enregistrer</button>
      </form>
    </div>
  );
}
