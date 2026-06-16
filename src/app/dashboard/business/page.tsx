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
  const [showRevenue, setShowRevenue] = useState(false);
  const [showProfit, setShowProfit] = useState(false);
  const timerRefRevenue = useRef<NodeJS.Timeout | null>(null);
  const timerRefProfit = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const [statsRes, productsRes] = await Promise.all([
        api.get('/sales/stats'),
        api.get('/products'),
      ]);
      setStats(statsRes.data);
      const allProducts = productsRes.data.products || [];
      setLowStockProducts(
        allProducts.filter(
          (p: Product) => p.min_stock > 0 && p.stock <= p.min_stock
        )
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
      if (timerRefRevenue.current) clearTimeout(timerRefRevenue.current);
      if (timerRefProfit.current) clearTimeout(timerRefProfit.current);
    };
  }, []);

  // Masquage auto après 10 secondes
  const handleToggleRevenue = () => {
    if (showRevenue) {
      setShowRevenue(false);
      if (timerRefRevenue.current) {
        clearTimeout(timerRefRevenue.current);
        timerRefRevenue.current = null;
      }
    } else {
      setShowRevenue(true);
      timerRefRevenue.current = setTimeout(() => {
        setShowRevenue(false);
      }, 10000);
    }
  };

  const handleToggleProfit = () => {
    if (showProfit) {
      setShowProfit(false);
      if (timerRefProfit.current) {
        clearTimeout(timerRefProfit.current);
        timerRefProfit.current = null;
      }
    } else {
      setShowProfit(true);
      timerRefProfit.current = setTimeout(() => {
        setShowProfit(false);
      }, 10000);
    }
  };

  if (loading)
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Chargement...
      </div>
    );

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
        📊 {t('business.dashboard')}
      </h1>

      {/* Chiffre d'affaires */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-2xl shadow-lg dark:shadow-[0_8px_32px_rgba(230,126,34,0.15)] p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400">
            Chiffre d’affaires
          </h2>
          <button
            onClick={handleToggleRevenue}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title={showRevenue ? 'Masquer' : 'Révéler'}
          >
            {showRevenue ? (
              <EyeOff size={18} className="text-gray-500" />
            ) : (
              <Eye size={18} className="text-gray-500" />
            )}
          </button>
        </div>
        <p className="text-3xl font-bold text-gray-800 dark:text-white">
          {showRevenue
            ? `${stats.total_revenue.toLocaleString()} FCFA`
            : '••••••'}
        </p>
        {showRevenue && (
          <p className="text-xs text-gray-400 mt-1">
            Masquage automatique dans 10 secondes
          </p>
        )}
      </div>

      {/* Bénéfice */}
      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-2xl shadow-lg dark:shadow-[0_8px_32px_rgba(230,126,34,0.15)] p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-sm text-gray-500 dark:text-gray-400">
            Bénéfice
          </h2>
          <button
            onClick={handleToggleProfit}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            title={showProfit ? 'Masquer' : 'Révéler'}
          >
            {showProfit ? (
              <EyeOff size={18} className="text-gray-500" />
            ) : (
              <Eye size={18} className="text-gray-500" />
            )}
          </button>
        </div>
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
          {showProfit
            ? `${stats.total_profit.toLocaleString()} FCFA`
            : '••••••'}
        </p>
        {showProfit && (
          <p className="text-xs text-gray-400 mt-1">
            Masquage automatique dans 10 secondes
          </p>
        )}
      </div>

      {/* Alertes stock bas */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 p-3 rounded-xl mb-4">
          <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
            <AlertTriangle size={18} /> Stock bas
          </h3>
          {lowStockProducts.map((p) => (
            <p
              key={p.id}
              className="text-sm text-red-600 dark:text-red-300"
            >
              {p.name} : {p.stock} restant(s) (min. {p.min_stock})
            </p>
          ))}
        </div>
      )}

      {/* Raccourcis */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/business/quick-sale"
          className="bg-koko-orange hover:bg-koko-orange-dark text-white p-4 rounded-xl text-center font-semibold flex flex-col items-center gap-2 transition shadow-lg"
        >
          <ShoppingCart size={24} /> Caisse rapide
        </Link>
        <Link
          href="/dashboard/business/products"
          className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 p-4 rounded-xl text-center font-semibold flex flex-col items-center gap-2 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <Package size={24} className="text-koko-orange" /> Produits
        </Link>
        <Link
          href="/dashboard/business/sales"
          className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 p-4 rounded-xl text-center font-semibold flex flex-col items-center gap-2 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <FileText size={24} className="text-koko-orange" /> Historique des ventes
        </Link>
        <Link
          href="/dashboard/receipts"
          className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 p-4 rounded-xl text-center font-semibold flex flex-col items-center gap-2 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition"
        >
          <FileText size={24} className="text-koko-orange" /> Quittances
        </Link>
      </div>
    </div>
  );
}
