'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Plus, Trash2, MapPin } from 'lucide-react';
import PremiumGate from '@/components/PremiumGate';
import Link from 'next/link';

interface Medication {
  id: number;
  name: string;
  dosage?: string;
  time: string;
  frequency: string;
  active: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '08:00', frequency: 'daily', start_date: new Date().toISOString().split('T')[0] });

  const fetchMeds = async () => {
    try {
      const res = await api.get('/medications');
      setMedications(res.data.medications);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeds();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/medications', newMed);
      setShowAdd(false);
      setNewMed({ name: '', dosage: '', time: '08:00', frequency: 'daily', start_date: new Date().toISOString().split('T')[0] });
      fetchMeds();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/medications/${id}`);
    fetchMeds();
  };

  const welcomeMessage = t('dashboard.welcome').replace('{name}', user?.name || '');

  return (
    <div className="p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold mb-4">{welcomeMessage}</h1>

      <Link href="/dashboard/pharmacies" className="flex items-center justify-center w-full py-3 mb-4 border-2 border-dashed border-koko-orange text-koko-orange font-bold rounded-xl hover:bg-koko-orange/5 transition-colors">
        <MapPin className="mr-2" size={20} /> Pharmacies à proximité
      </Link>

      <div className="bg-white dark:bg-koko-blue rounded-2xl p-5 shadow-koko mb-4">
        <h2 className="text-lg font-bold mb-3">💊 {t('dashboard.pilulier')}</h2>
        {medications.length === 0 && <p className="text-gray-500">{t('dashboard.noMeds')}</p>}
        {medications.map((med) => (
          <div key={med.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
            <div>
              <p className="font-medium">{med.name} {med.dosage && `(${med.dosage})`}</p>
              <p className="text-sm text-gray-500">{med.time} - {med.frequency}</p>
            </div>
            <button onClick={() => handleDelete(med.id)} className="text-red-500"><Trash2 size={18} /></button>
          </div>
        ))}

        <PremiumGate featureName="Ajouter plus de 3 médicaments">
          <button onClick={() => setShowAdd(!showAdd)} className="mt-3 flex items-center text-koko-orange font-medium">
            <Plus size={18} className="mr-1" /> {t('dashboard.addMed')}
          </button>
        </PremiumGate>

        {showAdd && (
          <form onSubmit={handleAdd} className="mt-4 space-y-3">
            <input type="text" placeholder="Nom" value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
            <input type="text" placeholder="Dosage (ex: 100mg)" value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
            <input type="time" value={newMed.time} onChange={e => setNewMed({...newMed, time: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
            <select value={newMed.frequency} onChange={e => setNewMed({...newMed, frequency: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white">
              <option value="daily">Quotidien</option>
              <option value="twice_daily">2x/jour</option>
              <option value="three_times_daily">3x/jour</option>
              <option value="weekly">Hebdomadaire</option>
            </select>
            <button type="submit" className="w-full py-2 bg-koko-orange text-white rounded-lg">Enregistrer</button>
          </form>
        )}
      </div>
    </div>
  );
}
