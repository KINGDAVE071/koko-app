import useSWR, { mutate } from 'swr';
import api from '@/lib/api';

const fetcher = (url: string) => api.get(url).then(res => res.data);

// Fonction de préchargement global (appelée depuis le layout)
export function prefetchAll() {
  // Déclenche les requêtes en arrière-plan sans bloquer l'interface
  mutate('/medications', fetcher('/medications'));
  mutate('/receipts', fetcher('/receipts'));
  mutate('/products', fetcher('/products'));
  mutate('/clients', fetcher('/clients'));
  mutate('/transactions', fetcher('/transactions'));
  mutate('/invoices', fetcher('/invoices'));
  mutate('/business/dashboard', fetcher('/business/dashboard'));
  mutate('/sales/stats', fetcher('/sales/stats'));
  mutate('/sales', fetcher('/sales'));
  mutate('/admin/users', fetcher('/admin/users'));
  mutate('/admin/stats', fetcher('/admin/stats'));
  mutate('/admin/audit', fetcher('/admin/audit'));
  mutate('/admin/stats/evolution', fetcher('/admin/stats/evolution'));
  // Les pages légères (convertisseur, pharmacies) n'ont pas besoin de préchargement
}

// Hooks individuels (inchangés, avec revalidateOnFocus)
export function useMedications() {
  const { data, error, mutate } = useSWR('/medications', fetcher, { revalidateOnFocus: true });
  return { medications: data?.medications || [], isLoading: !error && !data, isError: error, mutate };
}

export function useReceipts() {
  const { data, error, mutate } = useSWR('/receipts', fetcher, { revalidateOnFocus: true });
  return { receipts: data?.receipts || [], isLoading: !error && !data, isError: error, mutate };
}

export function useProducts() {
  const { data, error, mutate } = useSWR('/products', fetcher, { revalidateOnFocus: true });
  return { products: data?.products || [], isLoading: !error && !data, isError: error, mutate };
}

export function useClients() {
  const { data, error, mutate } = useSWR('/clients', fetcher, { revalidateOnFocus: true });
  return { clients: data?.clients || [], isLoading: !error && !data, isError: error, mutate };
}

export function useTransactions() {
  const { data, error, mutate } = useSWR('/transactions', fetcher, { revalidateOnFocus: true });
  return { transactions: data?.transactions || [], balance: data?.balance || 0, isLoading: !error && !data, isError: error, mutate };
}

export function useInvoices() {
  const { data, error, mutate } = useSWR('/invoices', fetcher, { revalidateOnFocus: true });
  const all = data?.invoices || [];
  return { invoices: all.filter((inv: any) => inv.type !== 'devis'), allInvoices: all, isLoading: !error && !data, isError: error, mutate };
}

export function useQuotes() {
  const { data, error, mutate } = useSWR('/invoices', fetcher, { revalidateOnFocus: true });
  const all = data?.invoices || [];
  return { quotes: all.filter((inv: any) => inv.type === 'devis'), isLoading: !error && !data, isError: error, mutate };
}

export function useBusinessDashboard() {
  const { data, error, mutate } = useSWR('/business/dashboard', fetcher, { revalidateOnFocus: true });
  return { dashboard: data || { productsCount: 0, clientsCount: 0, invoicesCount: 0, income: 0, expense: 0, balance: 0 }, isLoading: !error && !data, isError: error, mutate };
}

export function useSalesStats() {
  const { data, error, mutate } = useSWR('/sales/stats', fetcher, { revalidateOnFocus: true });
  return { stats: data || { total_revenue: 0, total_profit: 0, total_sales: 0 }, isLoading: !error && !data, isError: error, mutate };
}

export function useSales() {
  const { data, error, mutate } = useSWR('/sales', fetcher, { revalidateOnFocus: true });
  return { sales: data?.sales || [], isLoading: !error && !data, isError: error, mutate };
}

export function useAdminUsers() {
  const { data, error, mutate } = useSWR('/admin/users', fetcher, { revalidateOnFocus: true });
  return { users: data?.users || [], isLoading: !error && !data, isError: error, mutate };
}

export function useAdminStats() {
  const { data, error, mutate } = useSWR('/admin/stats', fetcher, { revalidateOnFocus: true });
  return { stats: data || { totalUsers: 0, premiumUsers: 0 }, isLoading: !error && !data, isError: error, mutate };
}
