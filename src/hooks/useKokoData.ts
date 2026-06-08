import useSWR from 'swr';
import api from '@/lib/api';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export function useMedications() {
  const { data, error, mutate } = useSWR('/medications', fetcher);
  return {
    medications: data?.medications || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useReceipts() {
  const { data, error, mutate } = useSWR('/receipts', fetcher);
  return {
    receipts: data?.receipts || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useProducts() {
  const { data, error, mutate } = useSWR('/products', fetcher);
  return {
    products: data?.products || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useClients() {
  const { data, error, mutate } = useSWR('/clients', fetcher);
  return {
    clients: data?.clients || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useTransactions() {
  const { data, error, mutate } = useSWR('/transactions', fetcher);
  return {
    transactions: data?.transactions || [],
    balance: data?.balance || 0,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useInvoices() {
  const { data, error, mutate } = useSWR('/invoices', fetcher);
  const all = data?.invoices || [];
  return {
    invoices: all.filter((inv: any) => inv.type !== 'devis'),
    allInvoices: all,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useQuotes() {
  const { data, error, mutate } = useSWR('/invoices', fetcher);
  const all = data?.invoices || [];
  return {
    quotes: all.filter((inv: any) => inv.type === 'devis'),
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useBusinessDashboard() {
  const { data, error, mutate } = useSWR('/business/dashboard', fetcher);
  return {
    dashboard: data || { productsCount: 0, clientsCount: 0, invoicesCount: 0, income: 0, expense: 0, balance: 0 },
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useAdminUsers() {
  const { data, error, mutate } = useSWR('/admin/users', fetcher);
  return {
    users: data?.users || [],
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}

export function useAdminStats() {
  const { data, error, mutate } = useSWR('/admin/stats', fetcher);
  return {
    stats: data || { totalUsers: 0, premiumUsers: 0 },
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
