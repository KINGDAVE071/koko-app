'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageContext';
import { ArrowRightLeft } from 'lucide-react';

const DEVISE_NAMES: Record<string, string> = {
  USD: 'Dollar US',
  EUR: 'Euro',
  XOF: 'Franc CFA',
  XAF: 'Franc CFA (CEMAC)',
  NGN: 'Naira',
  GHS: 'Cedi',
  KES: 'Shilling kenyan',
  ZAR: 'Rand',
  CNY: 'Yuan',
  JPY: 'Yen',
  GBP: 'Livre sterling',
  CAD: 'Dollar canadien',
  AUD: 'Dollar australien',
  CHF: 'Franc suisse',
  MAD: 'Dirham marocain',
  DZD: 'Dinar algérien',
  TND: 'Dinar tunisien',
  EGP: 'Livre égyptienne',
  INR: 'Roupie indienne',
  BRL: 'Real brésilien',
  RUB: 'Rouble russe',
  KRW: 'Won sud-coréen',
  SEK: 'Couronne suédoise',
  NOK: 'Couronne norvégienne',
  DKK: 'Couronne danoise',
  PLN: 'Zloty polonais',
  TRY: 'Livre turque',
  SAR: 'Riyal saoudien',
  AED: 'Dirham des Émirats',
  QAR: 'Riyal qatari',
  OMR: 'Rial omanais',
  BHD: 'Dinar bahreïni',
  KWD: 'Dinar koweïtien',
  SGD: 'Dollar singapourien',
  HKD: 'Dollar de Hong Kong',
  NZD: 'Dollar néo-zélandais',
  MXN: 'Peso mexicain',
  ARS: 'Peso argentin',
  CLP: 'Peso chilien',
  COP: 'Peso colombien',
  PEN: 'Sol péruvien',
  UYU: 'Peso uruguayen',
  VES: 'Bolívar vénézuélien',
  CRC: 'Colón costaricain',
  DOP: 'Peso dominicain',
  GTQ: 'Quetzal guatémaltèque',
  HNL: 'Lempira hondurien',
  NIO: 'Córdoba nicaraguayen',
  PAB: 'Balboa panaméen',
  PYG: 'Guaraní paraguayen',
  SVC: 'Colón salvadorien',
  BOB: 'Boliviano',
  CUP: 'Peso cubain',
  HTG: 'Gourde haïtienne',
  JMD: 'Dollar jamaïcain',
  BSD: 'Dollar bahaméen',
  BBD: 'Dollar barbadien',
  TTD: 'Dollar trinidadien',
  XCD: 'Dollar des Caraïbes orientales',
  BMD: 'Dollar bermudien',
  KYD: 'Dollar des îles Caïmans',
  AWG: 'Florin arubais',
  ANG: 'Florin des Antilles néerlandaises',
  CVE: 'Escudo cap-verdien',
  GMD: 'Dalasi gambien',
  GNF: 'Franc guinéen',
  LRD: 'Dollar libérien',
  MRU: 'Ouguiya mauritanien',
  SLL: 'Leone sierra-léonais',
  SSP: 'Livre sud-soudanaise',
  SDG: 'Livre soudanaise',
  ETB: 'Birr éthiopien',
  DJF: 'Franc djiboutien',
  SOS: 'Shilling somalien',
  KMF: 'Franc comorien',
  MGA: 'Ariary malgache',
  MUR: 'Roupie mauricienne',
  SCR: 'Roupie seychelloise',
  ZMW: 'Kwacha zambien',
  MWK: 'Kwacha malawite',
  BWP: 'Pula botswanais',
  NAD: 'Dollar namibien',
  LSL: 'Loti lesothan',
  SZL: 'Lilangeni swazi',
  ZWL: 'Dollar zimbabwéen',
  TZS: 'Shilling tanzanien',
  UGX: 'Shilling ougandais',
  RWF: 'Franc rwandais',
  BIF: 'Franc burundais',
  CDF: 'Franc congolais',
  AOA: 'Kwanza angolais',
  MZN: 'Metical mozambicain',
  MOP: 'Pataca macanais',
  PHP: 'Peso philippin',
  THB: 'Baht thaïlandais',
  MYR: 'Ringgit malaisien',
  IDR: 'Roupie indonésienne',
  VND: 'Dong vietnamien',
  LAK: 'Kip laotien',
  KHR: 'Riel cambodgien',
  MMK: 'Kyat birman',
  BDT: 'Taka bangladais',
  PKR: 'Roupie pakistanaise',
  NPR: 'Roupie népalaise',
  LKR: 'Roupie sri lankaise',
  MVR: 'Rufiyaa maldivien',
  BTN: 'Ngultrum bhoutanais',
  AFN: 'Afghani afghan',
  IRR: 'Rial iranien',
  IQD: 'Dinar irakien',
  SYP: 'Livre syrienne',
  LBP: 'Livre libanaise',
  JOD: 'Dinar jordanien',
  ILS: 'Shekel israélien',
  UAH: 'Hryvnia ukrainienne',
  BYN: 'Rouble biélorusse',
  GEL: 'Lari géorgien',
  AMD: 'Dram arménien',
  AZN: 'Manat azerbaïdjanais',
  KZT: 'Tenge kazakh',
  KGS: 'Som kirghize',
  TJS: 'Somoni tadjik',
  TMT: 'Manat turkmène',
  UZS: 'Sum ouzbek',
  MNT: 'Tugrik mongol',
  KPW: 'Won nord-coréen',
  BND: 'Dollar brunéien',
  FJD: 'Dollar fidjien',
  PGK: 'Kina papouan-néo-guinéen',
  SBD: 'Dollar des Îles Salomon',
  VUV: 'Vatu vanuatais',
  WST: 'Tala samoan',
  TOP: 'Paʻanga tongien',
  LTL: 'Litas lituanien',
  EEK: 'Couronne estonienne',
  LVL: 'Lats letton',
  ISK: 'Couronne islandaise',
  HRK: 'Kuna croate',
  RON: 'Leu roumain',
  BGN: 'Lev bulgare',
  ALL: 'Lek albanais',
  MKD: 'Denar macédonien',
  RSD: 'Dinar serbe',
  BAM: 'Mark convertible bosnien',
  MDL: 'Leu moldave',
};

export default function ConverterPage() {
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('XOF');
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [useParallel, setUseParallel] = useState(false);
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
      </div>
    </div>
  );
}
