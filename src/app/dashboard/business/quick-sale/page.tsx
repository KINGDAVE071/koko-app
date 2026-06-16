'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowLeft, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Product { id: number; name: string; price: number; stock: number; }
interface CartItem { product_id: number; product_name: string; quantity: number; unit_price: number; }

export default function QuickSalePage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/products').then(res => setProducts(res.data.products)).catch(console.error); }, []);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) { toast.error('Stock insuffisant'); return; }
      setCart(cart.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product_id: product.id, product_name: product.name, quantity: 1, unit_price: product.price }]);
    }
  };

  const removeFromCart = (productId: number) => setCart(cart.filter(item => item.product_id !== productId));

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product_id !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      const prod = products.find(p => p.id === productId);
      if (prod && newQty > prod.stock) { toast.error('Stock insuffisant'); return item; }
      return { ...item, quantity: newQty };
    }));
  };

  const total = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const handleSell = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/sales', {
        items: cart.map(item => ({ product_id: item.product_id, quantity: item.quantity, unit_price: item.unit_price })),
        description: 'Vente rapide',
      });
      setShowReceipt({ receipt: res.data.receipt, items: res.data.items });
      setCart([]);
      api.get('/products').then(r => setProducts(r.data.products));
      toast.success('Vente enregistrée !');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
    finally { setLoading(false); }
  };

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <div className="flex items-center mb-4">
        <Link href="/dashboard/business" className="mr-3 text-gray-500 dark:text-gray-400 hover:text-koko-orange"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex-1">🛒 Caisse rapide</h1>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Produits disponibles</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
          {products.map(p => (
            <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock === 0}
              className={`p-2 rounded-lg text-sm text-left border transition-all ${
                p.stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-800 border-gray-200' : 'bg-white/70 dark:bg-gray-900/70 border border-koko-orange/20 hover:border-koko-orange text-gray-800 dark:text-white'
              }`}>
              <p className="font-medium truncate">{p.name}</p>
              <p className="text-xs text-gray-500">{p.price} FCFA (stock: {p.stock})</p>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-2xl shadow-lg p-4 mb-4">
        <h2 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-2"><ShoppingCart size={18} /> Panier</h2>
        {cart.length === 0 && <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun article</p>}
        {cart.map(item => (
          <div key={item.product_id} className="flex items-center justify-between py-1 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-800 dark:text-white">{item.product_name}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.product_id, -1)} className="p-0.5 text-gray-400 hover:text-koko-orange"><Minus size={14} /></button>
              <span className="text-sm font-bold text-gray-800 dark:text-white w-6 text-center">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.product_id, 1)} className="p-0.5 text-gray-400 hover:text-koko-orange"><Plus size={14} /></button>
              <span className="text-sm w-16 text-right text-gray-800 dark:text-white">{item.unit_price * item.quantity} FCFA</span>
              <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="font-bold text-gray-800 dark:text-white">Total</span>
          <span className="text-lg font-bold text-koko-orange">{total} FCFA</span>
        </div>
      </div>

      <button onClick={handleSell} disabled={cart.length === 0 || loading}
        className="w-full py-3 rounded-xl bg-koko-orange hover:bg-koko-orange-dark text-white font-bold transition-colors shadow-lg hover:shadow-koko-orange/30 disabled:opacity-50">
        {loading ? 'Enregistrement...' : 'Vendre'}
      </button>

      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-koko-orange/20 rounded-2xl p-5 shadow-2xl w-full max-w-sm mx-4 text-gray-800 dark:text-white">
            <p className="font-bold text-lg mb-2 text-center">🧾 Vente enregistrée</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{new Date().toLocaleString()}</p>
            <div className="mt-3 bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
              <table className="w-full text-xs">
                <thead><tr className="text-gray-500"><th className="text-left">Article</th><th className="text-right">Qté</th><th className="text-right">Prix</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {showReceipt.items.map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td>{it.product_name}</td>
                      <td className="text-right">{it.quantity}</td>
                      <td className="text-right">{it.unit_price}</td>
                      <td className="text-right">{(it.unit_price * it.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="font-bold"><td colSpan={3} className="text-right">Total TTC</td><td className="text-right text-koko-orange">{showReceipt.receipt.amount.toLocaleString()} FCFA</td></tr></tfoot>
              </table>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">#{showReceipt.receipt.hash}</p>
            <button onClick={() => setShowReceipt(null)} className="w-full mt-4 py-2 rounded-lg bg-koko-orange hover:bg-koko-orange-dark text-white transition">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
}
