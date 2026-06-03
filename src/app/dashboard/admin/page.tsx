'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Trash2, Shield } from 'lucide-react';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, premiumUsers: 0 });

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchUsers();
      fetchStats();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.users);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('Supprimer cet utilisateur ?')) {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
      fetchStats();
    }
  };

  const handleTogglePremium = async (id: number, currentStatus: boolean) => {
    await api.put(`/admin/users/${id}/premium`, { premium: !currentStatus });
    fetchUsers();
    fetchStats();
  };

  if (loading || !user) return <div>Chargement...</div>;
  if (user.role !== 'admin') return null;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🛡️ Administration</h1>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko">
          <p className="text-sm text-gray-500">Utilisateurs</p>
          <p className="text-2xl font-bold">{stats.totalUsers}</p>
        </div>
        <div className="bg-white dark:bg-koko-blue p-4 rounded-xl shadow-koko">
          <p className="text-sm text-gray-500">Premium</p>
          <p className="text-2xl font-bold">{stats.premiumUsers}</p>
        </div>
      </div>
      <div className="bg-white dark:bg-koko-blue rounded-2xl p-5 shadow-koko">
        <h2 className="text-lg font-bold mb-3">Liste des utilisateurs</h2>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 py-2">
              <div>
                <p className="font-medium">{u.name} {u.role === 'admin' && <Shield className="inline w-4 h-4 text-koko-orange" />}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
                <p className="text-xs text-gray-400">Inscrit le {new Date(u.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTogglePremium(u.id, false)}
                  className="px-2 py-1 text-xs bg-koko-orange text-white rounded-lg"
                >
                  Premium
                </button>
                {u.id !== user.id && (
                  <button onClick={() => handleDeleteUser(u.id)} className="text-red-500"><Trash2 size={16} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
