'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Shield, Search, BarChart3, Users, FileText, Activity } from 'lucide-react';
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
}

interface AuditLog {
  id: number;
  admin_name: string;
  action: string;
  target_type: string;
  details: string;
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

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) router.push('/dashboard');
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/admin/stats').then(res => setStats(res.data));
      api.get('/admin/stats/evolution').then(res => setEvolution(res.data));
    }
  }, [user]);

  const fetchUsers = () => {
    api.get(`/admin/users?search=${encodeURIComponent(search)}`).then(res => setUsers(res.data.users));
  };

  const fetchLogs = () => {
    api.get('/admin/audit').then(res => setLogs(res.data.logs));
  };

  useEffect(() => {
    if (tab === 'users') fetchUsers();
    if (tab === 'audit') fetchLogs();
  }, [tab]);

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    await api.delete(`/admin/users/${id}`);
    toast.success('Utilisateur supprimé');
    fetchUsers();
  };

  const handleBlockUser = async (id: number, block: boolean) => {
    await api.put(`/admin/users/${id}/block`, { blocked: block });
    toast.success(block ? 'Utilisateur bloqué' : 'Utilisateur débloqué');
    fetchUsers();
  };

  const handlePremium = async (id: number, enable: boolean) => {
    await api.put(`/admin/users/${id}/premium`, { premium: enable });
    toast.success(enable ? 'Premium activé' : 'Premium désactivé');
    fetchUsers();
  };

  if (loading || !user) return <div>Chargement...</div>;
  if (user.role !== 'admin') return null;

  const chartData = {
    labels: evolution.map(e => e.day),
    datasets: [
      {
        label: 'Nouveaux utilisateurs',
        data: evolution.map(e => e.new_users),
        borderColor: '#E67E22',
        backgroundColor: 'rgba(230,126,34,0.1)',
        tension: 0.3,
      },
      {
        label: 'Ventes',
        data: evolution.map(e => e.sales),
        borderColor: '#22C55E',
        backgroundColor: 'rgba(34,197,94,0.1)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
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

      {/* Contenu des onglets */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Utilisateurs', value: stats.totalUsers, color: 'text-blue-600' },
              { label: 'Premium', value: stats.premiumUsers, color: 'text-purple-600' },
              { label: 'Aujourd\'hui', value: stats.newToday, color: 'text-green-600' },
              { label: 'Ventes', value: stats.totalSales, color: 'text-orange-600' },
              { label: 'Revenus', value: `${stats.revenue.toLocaleString()} F`, color: 'text-koko-orange' },
            ].map(item => (
              <div key={item.label} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow-koko">
                <p className="text-xs text-gray-500">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko">
            <h3 className="font-semibold mb-3">Évolution (7 jours)</h3>
            <Line data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchUsers()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button onClick={fetchUsers} className="px-4 py-2 bg-koko-orange text-white rounded-lg">Chercher</button>
          </div>

          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow-koko flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{u.name} {u.role === 'admin' && <Shield className="inline w-4 h-4 text-koko-orange" />}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                  <p className="text-xs text-gray-400">Inscrit le {new Date(u.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handlePremium(u.id, !u.premium_until)} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg">
                    {u.premium_until ? 'Retirer Premium' : 'Activer Premium'}
                  </button>
                  <button onClick={() => handleBlockUser(u.id, u.role !== 'blocked')} className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg">
                    {u.role === 'blocked' ? 'Débloquer' : 'Bloquer'}
                  </button>
                  {u.id !== user.id && (
                    <button onClick={() => handleDeleteUser(u.id)} className="text-red-500"><Trash2 size={16} /></button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className="bg-white dark:bg-koko-blue p-3 rounded-xl shadow-koko">
              <p className="text-sm font-medium">{log.admin_name} : {log.action}</p>
              <p className="text-xs text-gray-500">{log.details || `${log.target_type} #${log.target_id}`}</p>
              <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
            </div>
          ))}
          {logs.length === 0 && <p className="text-gray-500 text-center py-4">Aucune entrée dans le journal.</p>}
        </div>
      )}
    </div>
  );
}
