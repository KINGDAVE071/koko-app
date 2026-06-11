'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import Link from 'next/link';
import {
  ShoppingCart,
  Package,
  FileText,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';

interface Stats {
  total_revenue: number;
  total_profit: number;
  total_sales: number;
}

interface Product {
  id: number;
  name: string;
  stock: number;
  min_stock: number;
}

export default function BusinessDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<Stats>({
    total_revenue: 0,
    total_profit: 0,
    total_sales: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAmounts, setShowAmounts] = useState(false);
  const [view, setView] = useState<'revenue' | 'profit'>('revenue');
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, productsRes] = await Promise.all([
        api.get('/sales/stats'),
        api.get('/products'),
      ]);
      setStats(statsRes.data);
      const allProducts = productsRes.data.products || [];
      setLowStockProducts(
        allProducts.filter((p: Product) => p.min_stock > 0 && p.stock <= p.min_stock)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Bouton Actualiser : recharge simplement les données
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  };

  // Bouton Révéler / Masquer
  const handleToggleVisibility = async () => {
    if (showAmounts) {
      // Masquer immédiatement
      setShowAmounts(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    } else {
      // Révéler : on actualise d'abord
      await fetchStats();
      setShowAmounts(true);
      // Programmer le masquage automatique après 10 secondes
      timerRef.current = setTimeout(() => {
        setShowAmounts(false);
      }, 10000);
    }
  };

  if (loading) return <div className="p-4 text-center">Chargement...</div>;

  const displayedAmount =
    view === 'revenue' ? stats.total_revenue : stats.total_profit;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">📊 {t('business.dashboard')}</h1>

      {/* Bloc unique Recette / Bénéfice */}
      <div className="bg-white dark:bg-koko-blue p-5 rounded-2xl shadow-koko mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400">
            {view === 'revenue' ? 'Chiffre d’affaires' : 'Bénéfice'}
          </h2>
          <div className="flex gap-2">
            {/* Bouton Actualiser */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Actualiser les données"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            {/* Bouton Révéler / Masquer */}
            <button
              onClick={handleToggleVisibility}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title={showAmounts ? 'Masquer les montants' : 'Révéler les montants'}
            >
              {showAmounts ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {/* Bouton basculer recette / bénéfice */}
            <button
              onClick={() => setView(view === 'revenue' ? 'profit' : 'revenue')}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              title="Basculer entre recette et bénéfice"
            >
              <RefreshCw size={18} /> {/* On garde une icône différente, mais tu peux changer */}
            </button>
          </div>
        </div>

        <p className="text-3xl font-bold text-koko-text dark:text-white">
          {showAmounts
            ? `${displayedAmount.toLocaleString()} FCFA`
            : '••••••'}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {stats.total_sales} vente{stats.total_sales > 1 ? 's' : ''} au total
        </p>
        {showAmounts && (
          <p className="text-xs text-gray-400 mt-1">
            Masquage automatique dans 10 secondes
          </p>
        )}
      </div>

      {/* Alertes stock bas */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-xl mb-4">
          <h3 className="font-semibold text-red-600 flex items-center gap-2 mb-2">
            <AlertTriangle size={18} /> Stock bas
          </h3>
          {lowStockProducts.map(p => (
            <p key={p.id} className="text-sm text-red-600 dark:text-red-300">
              {p.name} : {p.stock} restant(s) (min. {p.min_stock})
            </p>
          ))}
        </div>
      )}

      {/* Raccourcis */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/business/quick-sale"
          className="bg-koko-orange text-white p-4 rounded-xl text-center font-semibold flex flex-col items-center gap-2"
        >
          <ShoppingCart size={24} /> Caisse rapide
        </Link>
        <Link
          href="/dashboard/business/products"
          className="bg-white dark:bg-koko-blue p-4 rounded-xl text-center font-semibold flex flex-col items-center gap-2 border border-gray-200 dark:border-gray-600"
        >
          <Package size={24} className="text-koko-orange" /> Produits
        </Link>
        <Link
          href="/dashboard/business/sales"
          className="bg-white dark:bg-koko-blue p-4 rounded-xl text-center font-semibold flex flex-col items-center gap-2 border border-gray-200 dark:border-gray-600"
        >
          <FileText size={24} className="text-koko-orange" /> Historique des ventes
        </Link>
        <Link
          href="/dashboard/receipts"
          className="bg-white dark:bg-koko-blue p-4 rounded-xl text-center font-semibold flex flex-col items-center gap-2 border border-gray-200 dark:border-gray-600"
        >
          <FileText size={24} className="text-koko-orange" /> Quittances
        </Link>
      </div>
    </div>
  );
}
