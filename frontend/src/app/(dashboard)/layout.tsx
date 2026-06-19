'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Pré-carrega dados das duas fontes assim que o usuário entra no dashboard.
  // React Query deduplica: se a aba já chamou primeiro, usa o cache existente.
  useEffect(() => {
    if (!isAuthenticated) return;
    queryClient.prefetchQuery({
      queryKey: ['backoffice-sheets'],
      queryFn: async () => { const { data } = await api.get('/backoffice/list'); return data; },
      staleTime: 1000 * 60 * 5,
    });
    queryClient.prefetchQuery({
      queryKey: ['comercial-sheets'],
      queryFn: async () => { const { data } = await api.get('/sheets/performance'); return data; },
      staleTime: 1000 * 60 * 5,
    });
    queryClient.prefetchQuery({
      queryKey: ['umbler-sheets'],
      queryFn: async () => { const { data } = await api.get('/umbler/list'); return data; },
      staleTime: 1000 * 60 * 5,
    });
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--main-bg)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
