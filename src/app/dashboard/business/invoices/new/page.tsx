'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { PlusCircle, Trash2, FileText, Calendar, User, Banknote, StickyNote, ClipboardList, ArrowLeft } from 'lucide-react';

interface Item {
  description: string;
  quantity: number;
  unit_price: number;
  tva: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'facture';

  const [clientName, setClientName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<Item[]>([{ description: '', quantity: 1, unit_price: 0, tva: 0 }]);
  const [totalManual, setTotalManual] = useState<number | ''>('');
  const [useManualTotal, setUseManualTotal] = useState(false);
  const [error, setError] = useState('');

  const isDevis = type === 'devis';
  const backUrl = isDevis ? '/dashboard/business/quotes' : '/dashboard/business/invoices';

  const handleItemChange = (index: number, field: keyof Item, value: string | number) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const addItem = () => setItems([...items, { description: '', quantity: 1, unit_price: 0, tva: 0 }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  const totalHT = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const totalTTC = items.reduce((sum, item) => sum + item.quantity * item.unit_price * (1 + item.tva / 100), 0);
  const net = useManualTotal && totalManual ? Number(totalManual) - discount : totalTTC - discount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!clientName.trim()) {
      setError('Veuillez entrer le nom du client.');
      return;
    }

    const payload: any = {
      type,
      client_name: clientName.trim(),
      date,
      due_date: dueDate || undefined,
      discount,
      notes: notes.trim() || undefined,
    };

    if (isDevis && useManualTotal && totalManual) {
      payload.total = Number(totalManual);
    } else {
      if (items.some(it => !it.description.trim())) {
        setError('Toutes les lignes doivent avoir une description.');
        return;
      }
      if (items.some(it => it.quantity <= 0 || it.unit_price <= 0)) {
        setError('Quantité et prix unitaire doivent être supérieurs à zéro.');
        return;
      }
      payload.items = items.map(it => ({
        description: it.description,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        tva: Number(it.tva),
      }));
    }

    try {
      await api.post('/invoices', payload);
      router.push(backUrl);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la création.');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-4">
        <Link href={backUrl} className="inline-flex items-center text-gray-500 hover:text-koko-orange transition-colors">
          <ArrowLeft size={20} className="mr-1" /> Retour
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        {isDevis ? (
          <><ClipboardList className="w-7 h-7 text-blue-500" /> Nouveau devis</>
        ) : (
          <><FileText className="w-7 h-7 text-koko-orange" /> Nouvelle facture</>
        )}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900 p-3 rounded-xl text-red-600 dark:text-red-200 text-sm">{error}</div>
        )}

        {/* Client & Date */}
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
            <label className="block text-sm font-medium mb-1">Date</label>
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
        </div>

        {/* Échéance */}
        <div>
          <label className="block text-sm font-medium mb-1">Échéance / Validité (optionnelle)</label>
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

        {/* Section articles (facture) ou montant manuel (devis) */}
        {isDevis ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useManualTotal}
                onChange={(e) => {
                  setUseManualTotal(e.target.checked);
                  if (e.target.checked) setItems([]);
                  else setItems([{ description: '', quantity: 1, unit_price: 0, tva: 0 }]);
                }}
                className="w-4 h-4"
              />
              <label className="text-sm">Montant global (sans détails)</label>
            </div>
            {useManualTotal ? (
              <div className="relative">
                <Banknote className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="number"
                  value={totalManual}
                  onChange={(e) => setTotalManual(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Montant total du devis"
                  className="w-full pl-10 pr-4 py-3 border rounded-xl dark:bg-gray-700 dark:text-white"
                  min="0"
                />
              </div>
            ) : (
              <>
                <label className="block text-sm font-medium">Articles</label>
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
                        <input
                          type="number"
                          placeholder="Qté"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          className="w-20 border rounded-lg p-2 dark:bg-gray-700"
                          min="1"
                        />
                        <input
                          type="number"
                          placeholder="Prix"
                          value={item.unit_price}
                          onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                          className="w-28 border rounded-lg p-2 dark:bg-gray-700"
                          min="0"
                        />
                        <input
                          type="number"
                          placeholder="TVA%"
                          value={item.tva}
                          onChange={(e) => handleItemChange(idx, 'tva', e.target.value)}
                          className="w-16 border rounded-lg p-2 dark:bg-gray-700"
                        />
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
              </>
            )}
          </div>
        ) : (
          <>
            <label className="block text-sm font-medium">Articles</label>
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
                    <input
                      type="number"
                      placeholder="Qté"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="w-20 border rounded-lg p-2 dark:bg-gray-700"
                      min="1"
                    />
                    <input
                      type="number"
                      placeholder="Prix"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                      className="w-28 border rounded-lg p-2 dark:bg-gray-700"
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="TVA%"
                      value={item.tva}
                      onChange={(e) => handleItemChange(idx, 'tva', e.target.value)}
                      className="w-16 border rounded-lg p-2 dark:bg-gray-700"
                    />
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
          </>
        )}

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
                placeholder="Conditions, remarques..."
                className="w-full pl-10 pr-4 py-2 border rounded-xl dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Récapitulatif */}
        <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow space-y-2">
          {isDevis && useManualTotal ? (
            <>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-blue-500">{Number(totalManual || 0).toFixed(2)} FCFA</span>
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
                <span className="text-blue-500">{net.toFixed(2)} FCFA</span>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        <button type="submit" className="w-full py-3 bg-koko-orange text-white font-bold rounded-xl hover:bg-koko-orange-dark transition-colors">
          {isDevis ? 'Enregistrer le devis' : 'Enregistrer la facture'}
        </button>
      </form>
    </div>
  );
}
