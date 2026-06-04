'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';

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
        if (res.data.rates) {
          setCurrencies(Object.keys(res.data.rates));
        }
      })
      .catch(() => {
        setCurrencies(['USD','EUR','XOF','NGN','GHS','KES','ZAR','CNY','JPY','GBP']);
      });
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">💱 {t('converter.title')}</h1>
      <div className="bg-white dark:bg-koko-blue rounded-2xl p-5 shadow-koko space-y-4">
        <input
          type="number"
          placeholder={t('converter.amount')}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          className="w-full p-3 border rounded-xl dark:bg-gray-700 dark:text-white"
        />
        <div className="flex space-x-2">
          <select value={from} onChange={e => setFrom(e.target.value)} className="flex-1 p-3 border rounded-xl dark:bg-gray-700 dark:text-white">
            {currencies.map(code => <option key={code} value={code}>{code}</option>)}
          </select>
          <select value={to} onChange={e => setTo(e.target.value)} className="flex-1 p-3 border rounded-xl dark:bg-gray-700 dark:text-white">
            {currencies.map(code => <option key={code} value={code}>{code}</option>)}
          </select>
        </div>
        <label className="flex items-center space-x-2 text-sm">
          <input type="checkbox" checked={useParallel} onChange={e => setUseParallel(e.target.checked)} />
          <span>{t('converter.parallelRate')}</span>
        </label>
        <button onClick={handleConvert} className="w-full py-3 bg-koko-orange text-white font-bold rounded-xl hover:bg-koko-orange-dark transition-colors">
          {t('converter.convert')}
        </button>
        {result !== null && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
            <p className="text-lg font-bold">{amount} {from} = {result} {to}</p>
            <p className="text-sm text-gray-500">{t('converter.officialRate')}: {rate} ({useParallel ? t('converter.parallelRate') : t('converter.officialRate')})</p>
          </div>
        )}
        <hr className="my-4" />
        <button onClick={handleMargin} className="w-full py-3 border-2 border-koko-orange text-koko-orange font-bold rounded-xl hover:bg-koko-orange/10 transition-colors">
          {t('converter.margin')}
        </button>
        {marginResult !== null && <p className="text-center mt-2">{t('converter.result')}: {marginResult} {from}</p>}
      </div>
    </div>
  );
}
