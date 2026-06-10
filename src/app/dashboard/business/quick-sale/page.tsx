'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowLeft, Plus, Minus, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface CartItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export default function QuickSalePage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data.products)).catch(console.error);
  }, []);

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        toast.error('Stock insuffisant');
        return;
      }
      setCart(cart.map(item =>
        item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
      }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product_id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.product_id !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return item;
      const prod = products.find(p => p.id === productId);
      if (prod && newQty > prod.stock) {
        toast.error('Stock insuffisant');
        return item;
      }
      return { ...item, quantity: newQty };
    }));
  };

  const total = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const handleSell = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await api.post('/sales', {
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        description: 'Vente rapide',
      });
      setShowReceipt(res.data.receipt);
      setCart([]);
      // Recharger les produits pour avoir les stocks à jour
      api.get('/products').then(r => setProducts(r.data.products));
      toast.success('Vente enregistrée !');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur lors de la vente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Link href="/dashboard/business" className="mr-3 text-gray-500 hover:text-koko-orange">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold flex-1">🛒 Caisse rapide</h1>
      </div>

      {/* Liste des produits */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Produits disponibles</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
          {products.map(p => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock === 0}
              className={`p-2 rounded-lg text-sm text-left border transition-all ${
                p.stock === 0 ? 'opacity-50 cursor-not-allowed bg-gray-100' : 'bg-white dark:bg-koko-blue border-gray-200 hover:border-koko-orange'
              }`}
            >
              <p className="font-medium truncate">{p.name}</p>
              <p className="text-xs text-gray-500">{p.price} FCFA (stock: {p.stock})</p>
            </button>
          ))}
        </div>
      </div>

      {/* Panier */}
      <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko mb-4">
        <h2 className="font-semibold flex items-center gap-2 mb-2">
          <ShoppingCart size={18} /> Panier
        </h2>
        {cart.length === 0 && <p className="text-gray-500 text-sm">Aucun article</p>}
        {cart.map(item => (
          <div key={item.product_id} className="flex items-center justify-between py-1 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm">{item.product_name}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.product_id, -1)} className="p-0.5 text-gray-400 hover:text-koko-orange"><Minus size={14} /></button>
              <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.product_id, 1)} className="p-0.5 text-gray-400 hover:text-koko-orange"><Plus size={14} /></button>
              <span className="text-sm w-16 text-right">{item.unit_price * item.quantity} FCFA</span>
              <button onClick={() => removeFromCart(item.product_id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-200 dark:border-gray-600">
          <span className="font-bold">Total</span>
          <span className="text-lg font-bold text-koko-orange">{total} FCFA</span>
        </div>
      </div>

      <button
        onClick={handleSell}
        disabled={cart.length === 0 || loading}
        className="w-full py-3 bg-koko-orange text-white font-bold rounded-xl hover:bg-koko-orange-dark transition disabled:opacity-50"
      >
        {loading ? 'Enregistrement...' : 'Vendre'}
      </button>

      {/* Reçu après vente */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-koko-blue p-5 rounded-2xl shadow-lg w-full max-w-sm mx-4 text-center">
            <p className="font-bold text-lg mb-2">🧾 Vente enregistrée</p>
            <p className="text-sm text-gray-500">Total : {showReceipt.amount} FCFA</p>
            <p className="text-xs text-gray-400">Hash : #{showReceipt.hash}</p>
            <button
              onClick={() => setShowReceipt(null)}
              className="mt-4 w-full py-2 bg-koko-orange text-white rounded-lg"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
