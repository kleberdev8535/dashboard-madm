'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  TrendingUp, RefreshCw, Users, Send, CheckCircle2, Award, FileCheck, BarChart2,
  Search, X, Filter,
} from 'lucide-react';
import DashCard from '@/components/ui/DashCard';
import DesempenhoSheets from '@/components/dashboard/DesempenhoSheets';

interface Linha {
  colaborador: string;
  equipe: string | null;
  recebidos: number;
  emitidos: number;
  assinadosSafra: number;
  vendaGanha: number;
  protocolados: number;
  convAssSafra: number;
  assinadosganhos: number;
  recebidosGanhos: number;
  convProtocSafra: number;
}

function stripAccents(s: string): string {
  return (s || '').normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().trim();
}

export default function DashboardComercialPage() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [lastUpdate, setLastUpdate] = useState(() => new Date());

  const { data, isLoading } = useQuery({
    queryKey: ['comercial-sheets'],
    queryFn: async () => { const { data } = await api.get('/sheets/performance'); return data; },
    staleTime: 1000 * 60 * 1,
    gcTime:    1000 * 60 * 10,
  });

  const allLinhas: Linha[] = useMemo(() => data?.linhas || [], [data]);
  const totais = data?.totais || {};

  const linhas = useMemo(() => {
    let r = allLinhas;
    if (search.trim()) r = r.filter(x => stripAccents(x.colaborador).includes(stripAccents(search)));
    return r;
  }, [allLinhas, search]);

  const sorted = [...linhas].sort((a, b) => (b.recebidos || 0) - (a.recebidos || 0));

  const totalRecebidos = totais.recebidos      || 0;
  const totalEmitidos  = totais.emitidos       || 0;
  const totalAssinados = totais.assinadosSafra || 0;
  const totalVendas    = totais.vendaGanha     || 0;
  const totalProtoc    = totais.protocolados   || 0;
  const convPct        = totalRecebidos > 0 ? (totalAssinados / totalRecebidos) * 100 : 0;
  const emitPct        = totalRecebidos > 0 ? (totalEmitidos  / totalRecebidos) * 100 : 0;
  const vendaPct       = totalRecebidos > 0 ? (totalVendas    / totalRecebidos) * 100 : 0;
  const protocPct      = totalRecebidos > 0 ? (totalProtoc    / totalRecebidos) * 100 : 0;

  const cards = [
    { title: 'Recebidos',    value: totalRecebidos, subtitle: 'Total do mês',          icon: Users,        color: 'blue'   as const },
    { title: 'Emitidos',     value: totalEmitidos,  subtitle: 'Propostas enviadas',     icon: Send,         color: 'green'  as const, percentage: emitPct },
    { title: 'Ass. Safra',   value: totalAssinados, subtitle: 'Contratos assinados',    icon: CheckCircle2, color: 'purple' as const, percentage: convPct },
    { title: 'Venda Ganha',  value: totalVendas,    subtitle: 'Negócios fechados',      icon: Award,        color: 'yellow' as const, percentage: vendaPct },
    { title: 'Protocolados', value: totalProtoc,    subtitle: 'Em análise',             icon: FileCheck,    color: 'pink'   as const, percentage: protocPct },
    { title: 'Conv. Geral',  value: `${convPct.toFixed(1)}%`, subtitle: 'Ass. / Recebidos', icon: BarChart2, color: 'cyan' as const, percentage: convPct },
  ];

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await api.get('/sheets/performance?force=true');
      await queryClient.refetchQueries({ queryKey: ['comercial-sheets'] });
      setLastUpdate(new Date());
    } finally { setIsRefreshing(false); }
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3">
        <TrendingUp size={24} style={{ color: 'var(--accent-bright)' }} />
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Dashboard Comercial</h1>
      </motion.div>

      {/* Filter bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-52 px-3 py-2 rounded-xl"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filtrar por analista..."
            className="bg-transparent text-sm outline-none w-full" style={{ color: 'var(--text-primary)' }} />
          {search && <button onClick={() => setSearch('')}><X size={12} style={{ color: 'var(--text-muted)' }} /></button>}
        </div>
        {/* Dates */}
        <Filter size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: dateFrom ? 'var(--text-primary)' : 'var(--text-muted)', colorScheme: 'dark' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>até</span>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: dateTo ? 'var(--text-primary)' : 'var(--text-muted)', colorScheme: 'dark' }} />
        {/* Counter + time */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ml-auto"
          style={{ color: 'var(--accent-bright)' }}>
          <span className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: isLoading ? '#f59e0b' : '#22c55e' }} />
          <span>{isLoading ? 'Carregando...' : `${sorted.length} registros`}</span>
          {!isLoading && (
            <span style={{ color: 'var(--text-muted)' }}>
              · {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {/* Refresh button */}
        <button onClick={handleRefresh} disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-70 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </motion.div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded-2xl h-44 animate-pulse"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {cards.map((c, i) => <DashCard key={c.title} {...c} index={i} refreshing={isRefreshing} />)}
        </div>
      )}

      {/* Desempenho Individual */}
      <DesempenhoSheets linhas={sorted} isLoading={isLoading} />
    </div>
  );
}
