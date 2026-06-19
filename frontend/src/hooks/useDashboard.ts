import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const STALE = 1000 * 60 * 10;  // 10 min — não rebusca ao trocar de aba
const GC    = 1000 * 60 * 30;  // 30 min em cache após sair da tela

interface DashboardFilters {
  dataInicio?: string;
  dataFim?: string;
  unidadeId?: string;
  equipeId?: string;
}

export function useDashboardGeral(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['dashboard', 'geral', filters],
    queryFn: async () => { const { data } = await api.get('/dashboard/geral', { params: filters }); return data; },
    staleTime: STALE, gcTime: GC,
  });
}

export function useDashboardComercial(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['dashboard', 'comercial', filters],
    queryFn: async () => { const { data } = await api.get('/dashboard/comercial', { params: filters }); return data; },
    staleTime: STALE, gcTime: GC,
  });
}

export function useDashboardBackoffice(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['dashboard', 'backoffice', filters],
    queryFn: async () => { const { data } = await api.get('/dashboard/backoffice', { params: filters }); return data; },
    staleTime: STALE, gcTime: GC,
  });
}

export function useDashboardRibeiraoPreto(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['dashboard', 'ribeirao-preto', filters],
    queryFn: async () => { const { data } = await api.get('/dashboard/ribeirao-preto', { params: filters }); return data; },
    staleTime: STALE, gcTime: GC,
  });
}
