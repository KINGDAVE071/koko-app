'use client';

import { useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Trash2, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAdminUsers, useAdminStats } from '@/hooks/useKokoData';

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
  const { users, isLoading: usersLoading, mutate: mutateUsers } = useAdminUsers();
  const { stats, isLoading: statsLoading } = useAdminStats();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user) return <div>Chargement...</div>;
  if (user.role !== 'admin') return null;

  const handleDeleteUser = async (id: number) => {
    if (confirm('Supprimer cet utilisateur ?')) {
      await api.delete(`/admin/users/${id}`);
      mutateUsers();
    }
  };

  const handleTogglePremium = async (id: number) => {
    await api.put(`/admin/users/${id}/premium`, { premium: true });
    mutateUsers();
  };

  if (usersLoading || statsLoading) return <div>Chargement...</div>;

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <Link href="/dashboard" className="mr-3 text-gray-500 hover:text-koko-orange transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold flex-1">🛡️ Administration</h1>
      </div>
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
                  onClick={() => handleTogglePremium(u.id)}
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
