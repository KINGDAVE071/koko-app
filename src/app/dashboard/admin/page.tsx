'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Shield, Search, BarChart3, Users, Activity, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Types
interface Stats {
  totalUsers: number;
  premiumUsers: number;
  totalSales: number;
  revenue: number;
  newToday: number;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
  premium_until: string | null;
  blocked: boolean;
}

interface AuditLog {
  id: number;
  admin_name: string;
  action: string;
  target_type?: string;
  target_id?: number;
  details?: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'dashboard' | 'users' | 'audit'>('dashboard');
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, premiumUsers: 0, totalSales: 0, revenue: 0, newToday: 0 });
  const [evolution, setEvolution] = useState<any[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Redirection si non admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Charger stats et évolution
  useEffect(() => {
    if (user?.role !== 'admin') return;
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
    api.get('/admin/stats/evolution')
      .then(res => { setEvolution(res.data); setDataLoaded(true); })
      .catch(() => setDataLoaded(true));
  }, [user]);

  // Recherche utilisateurs (immédiate avec annulation)
  const fetchUsers = useCallback(async (searchTerm: string) => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearchLoading(true);
    try {
      const res = await api.get(`/admin/users?search=${encodeURIComponent(searchTerm)}`, {
        signal: controller.signal,
      });
      setUsers(res.data.users);
    } catch (error: any) {
      if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
        toast.error('Erreur lors de la recherche');
      }
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'users') fetchUsers(search);
  }, [search, tab, fetchUsers]);

  // Charger les logs
  const fetchLogs = useCallback(async () => {
    try {
      const res = await api.get('/admin/audit');
      setLogs(res.data.logs);
    } catch {}
  }, []);

  useEffect(() => {
    if (tab === 'audit') fetchLogs();
  }, [tab, fetchLogs]);

  // Actions
  const handleDeleteUser = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    await api.delete(`/admin/users/${id}`);
    toast.success('Utilisateur supprimé');
    fetchUsers(search);
  };

  const handleBlockUser = async (id: number, block: boolean) => {
    try {
      await api.put(`/admin/users/${id}/block`, { blocked: block });
      toast.success(block ? 'Utilisateur bloqué' : 'Utilisateur débloqué');
      fetchUsers(search);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handlePremium = async (id: number, enable: boolean) => {
    await api.put(`/admin/users/${id}/premium`, { premium: enable });
    toast.success(enable ? 'Premium activé' : 'Premium désactivé');
    fetchUsers(search);
  };

  if (loading || !user) return <div className="p-4 text-center">Chargement...</div>;
  if (user.role !== 'admin') return null;

  // Données du graphique
  const chartData = {
    labels: evolution.map(e => e.day),
    datasets: [
      { label: 'Nouveaux utilisateurs', data: evolution.map(e => e.new_users), borderColor: '#E67E22', backgroundColor: 'rgba(230,126,34,0.1)', tension: 0.3 },
      { label: 'Ventes', data: evolution.map(e => e.sales), borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.1)', tension: 0.3 },
    ],
  };

  const rev = stats.revenue ?? 0;
  const tSales = stats.totalSales ?? 0;
  const nToday = stats.newToday ?? 0;
  const pUsers = stats.premiumUsers ?? 0;
  const tUsers = stats.totalUsers ?? 0;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-3 text-gray-500 hover:text-koko-orange">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold flex-1">🛡️ Administration</h1>
      </div>

      {/* Navigation onglets */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'dashboard' as const, icon: BarChart3, label: 'Tableau de bord' },
          { id: 'users' as const, icon: Users, label: 'Utilisateurs' },
          { id: 'audit' as const, icon: Activity, label: 'Journal' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-koko-orange text-white' : 'bg-white dark:bg-koko-blue text-gray-600 dark:text-gray-300'
            }`}
          >
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>

      {/* Onglet Tableau de bord */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Utilisateurs', value: tUsers, color: 'text-blue-600' },
              { label: 'Premium', value: pUsers, color: 'text-purple-600' },
              { label: 'Aujourd\'hui', value: nToday, color: 'text-green-600' },
              { label: 'Ventes', value: tSales, color: 'text-orange-600' },
              { label: 'Revenus', value: `${rev.toLocaleString()} F`, color: 'text-koko-orange' },
            ].map(item => (
              <div key={item.label} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow-koko">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          {dataLoaded && evolution.length > 0 && (
            <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko">
              <h3 className="font-semibold mb-3">Évolution (7 jours)</h3>
              <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
            </div>
          )}
          {dataLoaded && evolution.length === 0 && (
            <p className="text-center text-gray-500 py-8">Pas encore de données pour le graphique.</p>
          )}
        </div>
      )}

      {/* Onglet Utilisateurs */}
      {tab === 'users' && (
        <div>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button onClick={() => fetchUsers(search)} className="px-4 py-2 bg-koko-orange text-white rounded-lg flex items-center gap-2">
              {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              Chercher
            </button>
          </div>
          {searchLoading && <p className="text-sm text-gray-500 mb-2">Recherche en cours...</p>}
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow-koko flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {u.name}
                    {u.role === 'admin' && <Shield className="w-4 h-4 text-koko-orange" />}
                    {u.blocked && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Bloqué</span>}
                  </p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                  <p className="text-xs text-gray-400">Inscrit le {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handlePremium(u.id, !u.premium_until)} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg">
                    {u.premium_until ? 'Retirer Premium' : 'Activer Premium'}
                  </button>
                  <button onClick={() => handleBlockUser(u.id, !u.blocked)} className={`px-2 py-1 text-xs rounded-lg ${u.blocked ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {u.blocked ? 'Débloquer' : 'Bloquer'}
                  </button>
                  {u.id !== user.id && (
                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-500"><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && !searchLoading && (
              <p className="text-gray-500 text-center py-4">Aucun utilisateur trouvé.</p>
            )}
          </div>
        </div>
      )}

      {/* Onglet Journal */}
      {tab === 'audit' && (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow-koko">
              <p className="text-sm font-medium">{log.admin_name} : {log.action}</p>
              <p className="text-xs text-gray-500">{log.details || (log.target_type ? `${log.target_type} #${log.target_id}` : '')}</p>
              <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))}
          {logs.length === 0 && <p className="text-gray-500 text-center py-4">Aucune entrée dans le journal.</p>}
        </div>
      )}
    </div>
  );
}
