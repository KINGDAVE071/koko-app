'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  language: string;
  role?: string;
  premium_until?: string;
  logo?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialisation : restauration de la session + logo
  useEffect(() => {
    const storedToken = localStorage.getItem('koko_token');
    const storedUser = localStorage.getItem('koko_user');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        // Recharger le logo depuis le serveur (au cas où il a changé)
        api.get('/auth-logo/logo')
          .then(res => {
            if (res.data.logo !== undefined) {
              const updatedUser = { ...parsedUser, logo: res.data.logo };
              setUser(updatedUser);
              localStorage.setItem('koko_user', JSON.stringify(updatedUser));
            }
          })
          .catch(() => {}) // silencieux si échec
          .finally(() => setLoading(false));
      } catch (e) {
        localStorage.removeItem('koko_token');
        localStorage.removeItem('koko_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    // Récupérer le logo après connexion
    let logo = undefined;
    try {
      const logoRes = await api.get('/auth-logo/logo');
      logo = logoRes.data.logo;
    } catch (e) {}
    const fullUser = { ...newUser, logo };
    localStorage.setItem('koko_token', newToken);
    localStorage.setItem('koko_user', JSON.stringify(fullUser));
    setToken(newToken);
    setUser(fullUser);
  };

  const register = async (email: string, password: string, name: string) => {
    const res = await api.post('/auth/register', { email, password, name });
    const { token: newToken, user: newUser } = res.data;
    const fullUser = { ...newUser, logo: undefined };
    localStorage.setItem('koko_token', newToken);
    localStorage.setItem('koko_user', JSON.stringify(fullUser));
    setToken(newToken);
    setUser(fullUser);
  };

  const logout = () => {
    localStorage.removeItem('koko_token');
    localStorage.removeItem('koko_user');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      const updatedUser = res.data.user;
      let logo = undefined;
      try {
        const logoRes = await api.get('/auth-logo/logo');
        logo = logoRes.data.logo;
      } catch (e) {}
      const fullUser = { ...updatedUser, logo };
      setUser(fullUser);
      localStorage.setItem('koko_user', JSON.stringify(fullUser));
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
