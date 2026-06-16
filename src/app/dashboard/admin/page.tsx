'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Shield, Search, BarChart3, Users, Activity, Loader2, Settings, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Types existants (inchangés)...
interface Stats { totalUsers:number; premiumUsers:number; totalSales:number; revenue:number; newToday:number; }
interface User { id:number; email:string; name:string; role:string; created_at:string; premium_until:string|null; blocked:boolean; }
interface AuditLog { id:number; admin_name:string; action:string; target_type?:string; target_id?:number; details?:string; created_at:string; }

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'dashboard'|'users'|'audit'|'settings'>('dashboard');
  const [stats, setStats] = useState<Stats>({ totalUsers:0, premiumUsers:0, totalSales:0, revenue:0, newToday:0 });
  const [evolution, setEvolution] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const abortRef = useRef<AbortController|null>(null);

  // États pour les paramètres légaux
  const [legalSettings, setLegalSettings] = useState({
    privacy_policy: '',
    terms_of_service: '',
    contact_email: '',
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => { if (!loading && (!user || user.role !== 'admin')) router.push('/dashboard'); }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/admin/stats').then(res => setStats(res.data)).catch(()=>{});
      api.get('/admin/stats/evolution')
        .then(res => { setEvolution(res.data); setDataLoaded(true); })
        .catch(() => setDataLoaded(true));
      // Charger les paramètres légaux
      api.get('/admin/settings')
        .then(res => setLegalSettings({
          privacy_policy: res.data.privacy_policy || '',
          terms_of_service: res.data.terms_of_service || '',
          contact_email: res.data.contact_email || 'alimossidavid071@gmail.com',
        }))
        .catch(() => {});
    }
  }, [user]);

  const fetchUsers = useCallback(async (searchTerm:string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearchLoading(true);
    try {
      const res = await api.get(`/admin/users?search=${encodeURIComponent(searchTerm)}`, { signal: controller.signal });
      setUsers(res.data.users);
    } catch (error:any) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') toast.error('Erreur recherche');
    } finally { setSearchLoading(false); }
  }, []);

  useEffect(() => { if (tab === 'users') fetchUsers(search); }, [search, tab, fetchUsers]);

  const fetchLogs = useCallback(async () => {
    try { const res = await api.get('/admin/audit'); setLogs(res.data.logs); } catch {}
  }, []);
  useEffect(() => { if (tab === 'audit') fetchLogs(); }, [tab, fetchLogs]);

  const handleDeleteUser = async (id:number) => { if (!confirm('Supprimer ?')) return; await api.delete(`/admin/users/${id}`); toast.success('Supprimé'); fetchUsers(search); };
  const handleBlockUser = async (id:number, block:boolean) => {
    try { await api.put(`/admin/users/${id}/block`, { blocked: block }); toast.success(block ? 'Bloqué' : 'Débloqué'); fetchUsers(search); }
    catch (err:any) { toast.error(err.response?.data?.error || 'Erreur'); }
  };
  const handlePremium = async (id:number, enable:boolean) => {
    await api.put(`/admin/users/${id}/premium`, { premium: enable }); toast.success(enable ? 'Premium activé' : 'Désactivé'); fetchUsers(search);
  };

  // Sauvegarder les paramètres légaux
  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      await api.put('/admin/settings', legalSettings);
      toast.success('Paramètres légaux mis à jour');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading || !user) return <div className="p-4 text-center text-gray-500">Chargement...</div>;
  if (user.role !== 'admin') return null;

  const chartData = {
    labels: evolution.map(e => e.day),
    datasets: [
      { label: 'Nouveaux utilisateurs', data: evolution.map(e => e.new_users), borderColor: '#E67E22', backgroundColor: 'rgba(230,126,34,0.1)', tension: 0.3 },
      { label: 'Ventes', data: evolution.map(e => e.sales), borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)', tension: 0.3 },
    ],
  };

  const rev = stats.revenue ?? 0, tSales = stats.totalSales ?? 0, nToday = stats.newToday ?? 0, pUsers = stats.premiumUsers ?? 0, tUsers = stats.totalUsers ?? 0;

  return (
    <div className="p-4 max-w-5xl mx-auto min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0F172A]">
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-3 text-gray-500 dark:text-gray-400 hover:text-koko-orange"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex-1">🛡️ Administration</h1>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { id: 'dashboard' as const, icon: BarChart3, label: 'Tableau de bord' },
          { id: 'users' as const, icon: Users, label: 'Utilisateurs' },
          { id: 'audit' as const, icon: Activity, label: 'Journal' },
          { id: 'settings' as const, icon: Settings, label: 'Paramètres' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === t.id ? 'bg-koko-orange text-white' : 'bg-white/70 dark:bg-gray-900/70 border border-koko-orange/20 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}>
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets existants (dashboard, users, audit) – repris intégralement pour ne pas briser le code, mais je les raccourcis ici pour ne pas dupliquer. En pratique, il faut conserver le code complet des onglets précédents. */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Utilisateurs', value: tUsers, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Premium', value: pUsers, color: 'text-purple-600 dark:text-purple-400' },
              { label: 'Aujourd\'hui', value: nToday, color: 'text-green-600 dark:text-green-400' },
              { label: 'Ventes', value: tSales, color: 'text-orange-600 dark:text-orange-400' },
              { label: 'Revenus', value: `${rev.toLocaleString()} F`, color: 'text-koko-orange' },
            ].map(item => (
              <div key={item.label} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-xl p-3 shadow-sm">
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          {dataLoaded && evolution.length > 0 && (
            <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-xl p-4 shadow-sm">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Évolution (7 jours)</h3>
              <Line data={chartData} options={{ responsive:true, plugins:{ legend:{ position:'bottom', labels:{ color:'#6B7280' } } }, scales:{ x:{ ticks:{ color:'#6B7280' } }, y:{ ticks:{ color:'#6B7280' } } } }} />
            </div>
          )}
          {dataLoaded && evolution.length === 0 && <p className="text-center text-gray-500 py-8">Pas encore de données pour le graphique.</p>}
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Rechercher par nom ou email..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/70 dark:bg-gray-900/70 border border-koko-orange/20 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-koko-orange transition" />
            </div>
            <button onClick={() => fetchUsers(search)} className="px-4 py-2 bg-koko-orange hover:bg-koko-orange-dark text-white rounded-lg flex items-center gap-2 transition">
              {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} Chercher
            </button>
          </div>
          {searchLoading && <p className="text-sm text-gray-500 mb-2">Recherche en cours...</p>}
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                <div>
                  <p className="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                    {u.name} {u.role === 'admin' && <Shield className="w-4 h-4 text-koko-orange" />}
                    {u.blocked && <span className="text-xs bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">Bloqué</span>}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                  <p className="text-xs text-gray-400">Inscrit le {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handlePremium(u.id, !u.premium_until)} className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 rounded-lg">
                    {u.premium_until ? 'Retirer Premium' : 'Activer Premium'}
                  </button>
                  <button onClick={() => handleBlockUser(u.id, !u.blocked)} className={`px-2 py-1 text-xs rounded-lg ${u.blocked ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'}`}>
                    {u.blocked ? 'Débloquer' : 'Bloquer'}
                  </button>
                  {u.id !== user.id && <button onClick={() => handleDeleteUser(u.id)} className="text-red-500"><Trash2 size={16} /></button>}
                </div>
              </div>
            ))}
            {users.length === 0 && !searchLoading && <p className="text-gray-500 text-center py-4">Aucun utilisateur trouvé.</p>}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-xl p-3 shadow-sm">
              <p className="text-sm font-medium text-gray-800 dark:text-white">{log.admin_name} : {log.action}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{log.details || (log.target_type ? `${log.target_type} #${log.target_id}` : '')}</p>
              <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))}
          {logs.length === 0 && <p className="text-gray-500 text-center py-4">Aucune entrée dans le journal.</p>}
        </div>
      )}

      {tab === 'settings' && (
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border border-koko-orange/20 rounded-2xl shadow-lg p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Settings size={24} /> Paramètres légaux
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Politique de confidentialité</label>
            <textarea
              value={legalSettings.privacy_policy}
              onChange={e => setLegalSettings({...legalSettings, privacy_policy: e.target.value})}
              rows={5}
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-koko-orange transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conditions d'utilisation</label>
            <textarea
              value={legalSettings.terms_of_service}
              onChange={e => setLegalSettings({...legalSettings, terms_of_service: e.target.value})}
              rows={5}
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-koko-orange transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email de contact</label>
            <input
              type="email"
              value={legalSettings.contact_email}
              onChange={e => setLegalSettings({...legalSettings, contact_email: e.target.value})}
              className="w-full p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-koko-orange transition"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="w-full py-3 rounded-xl bg-koko-orange hover:bg-koko-orange-dark text-white font-bold transition flex items-center justify-center gap-2"
          >
            <Save size={18} /> {savingSettings ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      )}
    </div>
  );
}
