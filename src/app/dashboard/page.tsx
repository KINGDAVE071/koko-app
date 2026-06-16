'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { Plus, Trash2, MapPin, Bell, Check, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import PremiumGate from '@/components/PremiumGate';
import { usePillAlerts } from '@/hooks/usePillAlerts';

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
    name: '', dosage: '', frequency: 'daily',
    times: ['08:00'], start_date: new Date().toISOString().split('T')[0]
  });

  const fetchMeds = useCallback(async () => {
    try { const res = await api.get('/medications'); setMedications(res.data.medications); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMeds(); }, [fetchMeds]);

  // Système d'alertes amélioré
  const { pendingCount, missedMeds } = usePillAlerts(medications);

  const handleAddMed = async (e: React.FormEvent) => {
    e.preventDefault();
    const validTimes = newMed.times.filter(t => t.trim() !== '');
    if (validTimes.length === 0) { toast.error('Ajoutez au moins une heure de prise.'); return; }
    try {
      await api.post('/medications', { ...newMed, times: validTimes });
      setShowAdd(false);
      setNewMed({ name: '', dosage: '', frequency: 'daily', times: ['08:00'], start_date: new Date().toISOString().split('T')[0] });
      fetchMeds();
      toast.success('Médicament ajouté !');
    } catch (err: any) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  const handleTake = async (medId: number, time: string) => {
    const today = new Date().toISOString().split('T')[0];
    await api.post(`/medications/${medId}/take`, { date: today, time });
    fetchMeds();
  };

  const handleDelete = async (id: number) => { await api.delete(`/medications/${id}`); fetchMeds(); };

  const addTime = () => setNewMed({ ...newMed, times: [...newMed.times, '08:00'] });
  const removeTime = (index: number) => {
    const updated = newMed.times.filter((_, i) => i !== index);
    setNewMed({ ...newMed, times: updated.length ? updated : ['08:00'] });
  };

  const welcomeMessage = t('dashboard.welcome').replace('{name}', user?.name || '');

  return (
    <div className="p-4 min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{welcomeMessage}</h1>

      {/* Alertes d'oublis */}
      {missedMeds.length > 0 && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-3 mb-4">
          <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
            <AlertTriangle size={18} /> Prises oubliées
          </h3>
          {missedMeds.map((m, idx) => (
            <p key={idx} className="text-sm text-red-600 dark:text-red-300">
              {m.name} – prévu à {m.time}
            </p>
          ))}
        </div>
      )}

      <Link href="/dashboard/pharmacies" className="flex items-center justify-center w-full py-3 mb-4 border-2 border-dashed border-koko-orange text-koko-orange font-bold rounded-xl hover:bg-koko-orange/10 transition-colors">
        <MapPin className="mr-2" size={20} /> Pharmacies à proximité
      </Link>

      <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-2xl shadow-lg dark:shadow-[0_8px_32px_rgba(230,126,34,0.15)] p-5 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">💊 {t('dashboard.pilulier')}</h2>
          <PremiumGate featureName="Ajouter plus de 3 médicaments">
            <button onClick={() => setShowAdd(!showAdd)} className="flex items-center text-koko-orange font-medium">
              <Plus size={18} className="mr-1" /> {t('dashboard.addMed')}
            </button>
          </PremiumGate>
        </div>

        {loading && <p className="text-gray-500 dark:text-gray-400">Chargement...</p>}
        {!loading && medications.length === 0 && <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noMeds')}</p>}

        {medications.map(med => (
          <div key={med.id} className="border-b border-gray-200 dark:border-gray-700 py-3 last:border-0">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg text-gray-800 dark:text-white">{med.name} {med.dosage && <span className="text-sm text-gray-500 dark:text-gray-400">({med.dosage})</span>}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {med.times.map((time, idx) => {
                    const taken = med.logs[time] || false;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleTake(med.id, time)}
                        disabled={taken}
                        className={`relative overflow-hidden rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                          taken
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-500/30'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-koko-orange/50 hover:bg-white dark:hover:bg-gray-700'
                        }`}
                      >
                        {taken && (
                          <span className="absolute inset-0 bg-green-500/10 animate-pulse" />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          {taken ? <Check size={14} /> : <Bell size={14} />}
                          {time}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button onClick={() => handleDelete(med.id)} className="text-red-500 dark:text-red-400 ml-2"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-koko-orange/20 rounded-2xl shadow-2xl p-5 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Ajouter un médicament</h3>
            <form onSubmit={handleAddMed} className="space-y-3">
              <input type="text" placeholder={t("dashboard.medName")} value={newMed.name} onChange={e => setNewMed({...newMed, name: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" required />
              <input type="text" placeholder={t("dashboard.dosage")} value={newMed.dosage} onChange={e => setNewMed({...newMed, dosage: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" />
              <select value={newMed.frequency} onChange={e => setNewMed({...newMed, frequency: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-koko-orange">
                <option value="daily">Quotidien</option>
                <option value="twice_daily">2x/jour</option>
                <option value="three_times_daily">3x/jour</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="custom">Personnalisé</option>
              </select>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Heures de prise</label>
                {newMed.times.map((time, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input type="time" value={time} onChange={e => { const updated = [...newMed.times]; updated[idx] = e.target.value; setNewMed({...newMed, times: updated}); }} className="flex-1 p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-koko-orange" />
                    {newMed.times.length > 1 && <button type="button" onClick={() => removeTime(idx)} className="text-red-500"><Trash2 size={16} /></button>}
                  </div>
                ))}
                <button type="button" onClick={addTime} className="text-sm text-koko-orange">+ Ajouter une heure</button>
              </div>
              <input type="date" value={newMed.start_date} onChange={e => setNewMed({...newMed, start_date: e.target.value})} className="w-full p-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-koko-orange" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-koko-orange hover:bg-koko-orange-dark text-white rounded-xl font-bold transition">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
