'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Plus, Trash2, MapPin, Bell, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Medication {
  id: number;
  name: string;
  dosage?: string;
  frequency: string;
  times: string[];
  logs: Record<string, boolean>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    times: ['08:00'],
    start_date: new Date().toISOString().split('T')[0],
  });

  const fetchMeds = useCallback(async () => {
    try {
      const res = await api.get('/medications');
      setMedications(res.data.medications);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMeds(); }, [fetchMeds]);

  useEffect(() => {
    if (Notification.permission !== 'granted') return;
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = now.toISOString().split('T')[0];
      medications.forEach(med => {
        med.times.forEach(time => {
          if (time === currentTime && !med.logs[time]) {
            new Notification('💊 Rappel de prise', {
              body: `Il est l'heure de prendre : ${med.name} ${med.dosage ? `(${med.dosage})` : ''}`,
              icon: '/icons/icon-192x192.png',
            });
            toast.info(`🕐 C'est l'heure de prendre ${med.name} !`);
          }
        });
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [medications]);

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    const validTimes = newMed.times.filter(t => t.trim() !== '');
    if (validTimes.length === 0) {
      toast.error('Ajoutez au moins une heure de prise.');
      return;
    }
    try {
      await api.post('/medications', { ...newMed, times: validTimes });
      setShowAdd(false);
      setNewMed({ name: '', dosage: '', frequency: 'daily', times: ['08:00'], start_date: new Date().toISOString().split('T')[0] });
      fetchMeds();
      toast.success('Médicament ajouté !');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleTake = async (medId: number, time: string) => {
    const today = new Date().toISOString().split('T')[0];
    await api.post(`/medications/${medId}/take`, { date: today, time });
    fetchMeds();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/medications/${id}`);
    fetchMeds();
  };

  const addTime = () => setNewMed({ ...newMed, times: [...newMed.times, '08:00'] });
  const removeTime = (index: number) => {
    const updated = newMed.times.filter((_, i) => i !== index);
    setNewMed({ ...newMed, times: updated.length ? updated : ['08:00'] });
  };

  const welcomeMessage = t('dashboard.welcome').replace('{name}', user?.name || '');

  return (
    <div className="p-4" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold mb-4">{welcomeMessage}</h1>

      <Link href="/dashboard/pharmacies" className="flex items-center justify-center w-full py-3 mb-4 border-2 border-dashed border-koko-orange text-koko-orange font-bold rounded-xl hover:bg-koko-orange/5 transition-colors">
        <MapPin className="mr-2" size={20} /> Pharmacies à proximité
      </Link>

      <div className="bg-white dark:bg-koko-blue rounded-2xl p-5 shadow-koko mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">💊 {t('dashboard.pilulier')}</h2>
          <button onClick={() => setShowAdd(!showAdd)} className="flex items-center text-koko-orange font-medium">
            <Plus size={18} className="mr-1" /> {t('dashboard.addMed')}
          </button>
        </div>

        {loading && <p className="text-gray-500">Chargement...</p>}
        {!loading && medications.length === 0 && <p className="text-gray-500">{t('dashboard.noMeds')}</p>}

        {medications.map(med => (
          <div key={med.id} className="border-b border-gray-100 dark:border-gray-700 py-3 last:border-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{med.name} {med.dosage && <span className="text-sm text-gray-500">({med.dosage})</span>}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {med.times.map((time, idx) => {
                    const taken = med.logs[time] || false;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleTake(med.id, time)}
                        disabled={taken}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          taken ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 cursor-default' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100'
                        }`}
                      >
                        {taken ? <Check size={14} /> : <Bell size={14} />}
                        {time}
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => handleDelete(med.id)} className="text-red-500 ml-2"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-koko-blue p-5 rounded-2xl shadow-lg w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Ajouter un médicament</h3>
            <form onSubmit={handleAddMed} className="space-y-3">
              <input type="text" placeholder="Nom du médicament" value={newMed.name} onChange={e => setNewMed({ ...newMed, name: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" required />
              <input type="text" placeholder="Dosage (ex: 100mg)" value={newMed.dosage} onChange={e => setNewMed({ ...newMed, dosage: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
              <select value={newMed.frequency} onChange={e => setNewMed({ ...newMed, frequency: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white">
                <option value="daily">Quotidien</option>
                <option value="twice_daily">2x/jour</option>
                <option value="three_times_daily">3x/jour</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="custom">Personnalisé</option>
              </select>
              <div>
                <label className="text-sm font-medium mb-1 block">Heures de prise</label>
                {newMed.times.map((time, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input type="time" value={time} onChange={e => { const updated = [...newMed.times]; updated[idx] = e.target.value; setNewMed({ ...newMed, times: updated }); }} className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
                    {newMed.times.length > 1 && <button type="button" onClick={() => removeTime(idx)} className="text-red-500"><Trash2 size={16} /></button>}
                  </div>
                ))}
                <button type="button" onClick={addTime} className="text-sm text-koko-orange">+ Ajouter une heure</button>
              </div>
              <input type="date" value={newMed.start_date} onChange={e => setNewMed({ ...newMed, start_date: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border rounded-lg">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-koko-orange text-white rounded-lg">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
