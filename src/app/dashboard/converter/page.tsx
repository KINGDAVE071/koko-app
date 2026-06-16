'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowRightLeft, TrendingUp } from 'lucide-react';

const DEVISE_NAMES: Record<string, string> = {
  USD: 'Dollar US',
  EUR: 'Euro',
  XOF: 'Franc CFA',
  NGN: 'Naira',
  GHS: 'Cedi',
  KES: 'Shilling kenyan',
  ZAR: 'Rand',
  CNY: 'Yuan',
  JPY: 'Yen',
  GBP: 'Livre sterling',
};

export default function ConverterPage() {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('XOF');
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [useParallel, setUseParallel] = useState(false);
  const [marginResult, setMarginResult] = useState<number | null>(null);
  const [currencies, setCurrencies] = useState<string[]>([]);

  useEffect(() => {
    api.get('/converter/live-rates')
      .then(res => {
        if (res.data.rates) setCurrencies(Object.keys(res.data.rates));
      })
      .catch(() => setCurrencies(['USD','EUR','XOF','NGN','GHS','KES','ZAR','CNY','JPY','GBP']));
  }, []);

  const handleConvert = async () => {
    if (!amount) return;
    try {
      const res = await api.post('/converter/convert', {
        amount: parseFloat(amount),
        from,
        to,
        useParallel,
      });
      setResult(res.data.result);
      setRate(res.data.rate);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erreur de conversion');
    }
  };

  const handleMargin = async () => {
    const cost = parseFloat(prompt("Prix d'achat ?") || '0');
    const margin = parseFloat(prompt("Marge en % ?") || '0');
    if (cost && margin) {
      try {
        const res = await api.post('/converter/margin', { costPrice: cost, marginPercent: margin, currency: from });
        setMarginResult(res.data.sellingPrice);
      } catch (err) {}
    }
  };

  const displayName = (code: string) => DEVISE_NAMES[code] || code;

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">💱 {t('converter.title')}</h1>

      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-2xl shadow-lg dark:shadow-[0_8px_32px_rgba(230,126,34,0.15)] p-5 space-y-5">
        {/* Montant */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
            {t('converter.amount')}
          </label>
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange focus:ring-2 focus:ring-koko-orange/20 transition text-lg font-medium"
          />
        </div>

        {/* Sélecteurs de devises */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              {t('converter.from')}
            </label>
            <select
              value={from}
              onChange={e => setFrom(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-koko-orange focus:ring-2 focus:ring-koko-orange/20 transition"
            >
              {currencies.map(code => (
                <option key={code} value={code}>{displayName(code)} ({code})</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { const temp = from; setFrom(to); setTo(temp); }}
            className="mt-6 p-2 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-koko-orange hover:bg-koko-orange/10 transition"
            title="Inverser les devises"
          >
            <ArrowRightLeft size={20} />
          </button>

          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
              {t('converter.to')}
            </label>
            <select
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-koko-orange focus:ring-2 focus:ring-koko-orange/20 transition"
            >
              {currencies.map(code => (
                <option key={code} value={code}>{displayName(code)} ({code})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Taux parallèle */}
        <label className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={useParallel}
            onChange={e => setUseParallel(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-koko-orange focus:ring-koko-orange"
          />
          <span>{t('converter.parallelRate')}</span>
        </label>

        {/* Bouton convertir */}
        <button
          onClick={handleConvert}
          className="w-full py-3 rounded-xl bg-koko-orange hover:bg-koko-orange-dark text-white font-bold transition-colors shadow-lg hover:shadow-koko-orange/30"
        >
          {t('converter.convert')}
        </button>

        {/* Résultat */}
        {result !== null && (
          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {amount} {displayName(from)} =
            </p>
            <p className="text-3xl font-bold text-gray-800 dark:text-white mt-1">
              {result.toLocaleString()} {displayName(to)}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Taux : {rate} ({useParallel ? t('converter.parallelRate') : t('converter.officialRate')})
            </p>
          </div>
        )}

        {/* Séparateur */}
        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Calcul de marge */}
        <button
          onClick={handleMargin}
          className="w-full py-3 rounded-xl border-2 border-koko-orange text-koko-orange font-bold hover:bg-koko-orange/5 transition-colors flex items-center justify-center gap-2"
        >
          <TrendingUp size={18} />
          {t('converter.margin')}
        </button>

        {marginResult !== null && (
          <p className="text-center text-gray-800 dark:text-white font-medium">
            {t('converter.result')} : {marginResult.toLocaleString()} {displayName(from)}
          </p>
        )}
      </div>
    </div>
  );
}
