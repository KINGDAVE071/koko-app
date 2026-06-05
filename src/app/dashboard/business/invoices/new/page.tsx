'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { PlusCircle, Trash2, FileText, Calendar, Hash, User, Banknote, Percent, StickyNote } from 'lucide-react';

interface Item {
  description: string;
  quantity: number;
  unit_price: number;
  tva: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [clientName, setClientName] = useState('');
  const [type, setType] = useState('facture');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Item[]>([{ description: '', quantity: 1, unit_price: 0, tva: 0 }]);
  const [error, setError] = useState('');

  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, tva: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const totalHT = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const totalTTC = items.reduce((sum, item) => sum + item.quantity * item.unit_price * (1 + item.tva / 100), 0);
  const net = totalTTC - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Validation basique côté client
    if (!clientName.trim()) {
      setError('Veuillez entrer le nom du client.');
      return;
    }
    if (items.some(it => !it.description.trim())) {
      setError('Toutes les lignes doivent avoir une description.');
      return;
    }
    if (items.some(it => it.quantity <= 0 || it.unit_price <= 0)) {
      setError('Quantité et prix unitaire doivent être supérieurs à zéro.');
      return;
    }

    const payload = {
      client_name: clientName.trim(),
      type,
      date,
      due_date: dueDate || undefined,
      discount,
      notes: notes.trim() || undefined,
      items: items.map(it => ({
        description: it.description,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        tva: Number(it.tva),
      })),
    };

    try {
      await api.post('/invoices', payload);
      router.push('/dashboard/business/invoices');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la création de la facture.');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <FileText className="w-7 h-7 text-koko-orange" /> Nouvelle facture
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900 p-3 rounded-xl text-red-600 dark:text-red-200 text-sm">{error}</div>
        )}

        {/* Section Client & Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Client</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nom du client"
                className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-koko-orange dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type de document</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-3 border rounded-xl dark:bg-gray-700 dark:text-white">
              <option value="facture">Facture</option>
              <option value="devis">Devis</option>
              <option value="avoir">Avoir</option>
            </select>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date de facture</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Échéance (optionnelle)</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-xl dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Articles */}
        <div>
          <label className="block text-sm font-medium mb-2">Articles</label>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <input
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  className="flex-1 min-w-[120px] border rounded-lg p-2 dark:bg-gray-700"
                  required
                />
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Hash className="absolute left-2 top-2.5 text-gray-400" size={14} />
                    <input
                      type="number"
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-20 pl-7 pr-2 py-2 border rounded-lg dark:bg-gray-700"
                      min="1"
                    />
                  </div>
                  <div className="relative">
                    <Banknote className="absolute left-2 top-2.5 text-gray-400" size={14} />
                    <input
                      type="number"
                      placeholder="Prix"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                      className="w-28 pl-7 pr-2 py-2 border rounded-lg dark:bg-gray-700"
                      min="0"
                    />
                  </div>
                  <div className="relative">
                    <Percent className="absolute left-2 top-2.5 text-gray-400" size={14} />
                    <input
                      type="number"
                      placeholder="TVA%"
                      value={item.tva}
                      onChange={(e) => handleItemChange(idx, 'tva', e.target.value)}
                      className="w-16 pl-7 pr-2 py-2 border rounded-lg dark:bg-gray-700"
                    />
                  </div>
                  <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem} className="flex items-center text-koko-orange hover:text-koko-orange-dark transition-colors">
              <PlusCircle size={18} className="mr-1" /> Ajouter une ligne
            </button>
          </div>
        </div>

        {/* Remise & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Remise (FCFA)</label>
            <div className="relative">
              <Banknote className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full pl-10 pr-4 py-3 border rounded-xl dark:bg-gray-700 dark:text-white"
                min="0"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <div className="relative">
              <StickyNote className="absolute left-3 top-3 text-gray-400" size={18} />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Conditions de paiement, remarques..."
                className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total HT</span>
            <span className="font-medium">{totalHT.toFixed(2)} FCFA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total TTC</span>
            <span className="font-medium">{totalTTC.toFixed(2)} FCFA</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-red-500">
              <span>Remise</span>
              <span>-{discount.toFixed(2)} FCFA</span>
            </div>
          )}
          <hr className="dark:border-gray-600" />
          <div className="flex justify-between text-lg font-bold">
            <span>Net à payer</span>
            <span className="text-koko-orange">{net.toFixed(2)} FCFA</span>
          </div>
        </div>

        <button type="submit" className="w-full py-3 bg-koko-orange text-white font-bold rounded-xl hover:bg-koko-orange-dark transition-colors">
          Enregistrer la facture
        </button>
      </form>
    </div>
  );
}
