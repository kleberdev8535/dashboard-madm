'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Phone, RefreshCw, CheckCircle2, XCircle, AlertCircle, UserX,
  BookOpen, TrendingDown, Clock, Users, Search, X, Filter,
} from 'lucide-react';
import { api } from '@/lib/api';
import DashCard from '@/components/ui/DashCard';

interface UmblerRow {
  assessor: string;
  cpf: string;
  estadoCliente: string;
  data: string;
  status: string;
  observacao: string;
  advogado: string;
}

/** remove acentos para comparação */
function stripAccents(s: string): string {
  return (s || '').normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().trim();
}
function cnt(rows: UmblerRow[], partial: string): number {
  const p = stripAccents(partial);
  return rows.filter(r => stripAccents(r.status).includes(p)).length;
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();
  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
  const bg = palette[name.charCodeAt(0) % palette.length];
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
      style={{ background: bg }}>{initials}</div>
  );
}

function AssessorCard({ assessor, rows }: { assessor: string; rows: UmblerRow[] }) {
  const total       = rows.length;
  const emAndamento = cnt(rows, 'em andamento');
  const concluidos  = cnt(rows, 'conclu');
  const auditoria   = cnt(rows, 'auditoria');
  const desqualif   = cnt(rows, 'desqualif');
  const pro         = cnt(rows, 'pro');
  const vendaPerda  = cnt(rows, 'venda perdida');
  const desistiu    = cnt(rows, 'desistiu');
  const taxa        = total > 0 ? (concluidos / total) * 100 : 0;

  const metrics = [
    { label: 'Registros',        value: total,       icon: Phone },
    { label: 'Em Andamento',     value: emAndamento, icon: Clock },
    { label: 'Concluídos',       value: concluidos,  icon: CheckCircle2 },
    { label: 'Auditoria',        value: auditoria,   icon: AlertCircle },
    { label: 'Desqualificados',  value: desqualif,   icon: UserX },
    { label: 'PRO (Prontuário)', value: pro,         icon: BookOpen },
    { label: 'Venda Perdida',    value: vendaPerda,  icon: TrendingDown },
    { label: 'Desistiu',         value: desistiu,    icon: XCircle },
  ];

  const barColor = taxa >= 10 ? '#16a34a' : taxa >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={assessor} />
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{assessor}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Assessor · {total} registros</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
          style={{ background: barColor }}>
          {taxa.toFixed(0)}%
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          <span>Taxa de finalização</span>
          <span>{concluidos} / {total}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--input-bg)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(taxa > 0 ? 2 : 0, taxa)}%` }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: barColor }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <Icon size={12} style={{ color: '#94a3b8', flexShrink: 0 }} />
              <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </div>
            <span className="text-xs font-bold ml-2" style={{ color: '#22c55e' }}>{value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function UmblerPage() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch]     = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');
  const [lastUpdate, setLastUpdate] = useState(() => new Date());

  const { data, isLoading } = useQuery({
    queryKey: ['umbler-sheets'],
    queryFn: async () => { const { data } = await api.get('/umbler/list'); return data; },
    staleTime: 1000 * 60 * 1, gcTime: 1000 * 60 * 10,
  });

  const allRows: UmblerRow[] = useMemo(() => data?.rows || [], [data]);

  const rows = useMemo(() => {
    let r = allRows;
    if (search.trim()) r = r.filter(x => stripAccents(x.assessor).includes(stripAccents(search)));
    if (dateFrom) r = r.filter(x => { const d = x.data.split('/').reverse().join('-'); return d >= dateFrom; });
    if (dateTo)   r = r.filter(x => { const d = x.data.split('/').reverse().join('-'); return d <= dateTo; });
    return r;
  }, [allRows, search, dateFrom, dateTo]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await api.get('/umbler/list?force=true');
      await queryClient.refetchQueries({ queryKey: ['umbler-sheets'] });
      setLastUpdate(new Date());
    } finally { setIsRefreshing(false); }
  }

  const total       = rows.length;
  const emAndamento = cnt(rows, 'em andamento');
  const concluidos  = cnt(rows, 'conclu');
  const auditoria   = cnt(rows, 'auditoria');
  const desqualif   = cnt(rows, 'desqualif');
  const pro         = cnt(rows, 'pro');
  const vendaPerda  = cnt(rows, 'venda perdida');
  const desistiu    = cnt(rows, 'desistiu');

  const row1 = [
    { title: 'Registros',        value: total,       subtitle: 'Total de registros',       icon: Phone,        color: 'green'  as const },
    { title: 'Em Andamento',     value: emAndamento, subtitle: 'Processos em andamento',   icon: Clock,        color: 'blue'   as const },
    { title: 'Concluídos',       value: concluidos,  subtitle: 'Conversão',                icon: CheckCircle2, color: 'green'  as const },
    { title: 'Auditoria',        value: auditoria,   subtitle: 'Concluído, falta auditar', icon: AlertCircle,  color: 'blue'   as const },
    { title: 'Desqualificados',  value: desqualif,   subtitle: 'Fora do perfil',           icon: UserX,        color: 'gray'   as const },
    { title: 'PRO (Prontuário)', value: pro,         subtitle: 'Encaminhados',             icon: BookOpen,     color: 'red'    as const },
  ];
  const row2 = [
    { title: 'Venda Perdida', value: vendaPerda, subtitle: 'Desqualif. c/ venda perdida', icon: TrendingDown, color: 'red'  as const },
    { title: 'Desistiu',      value: desistiu,   subtitle: 'Cliente desistiu',            icon: XCircle,      color: 'gray' as const },
  ];

  const assessores = useMemo(() => {
    const map = new Map<string, UmblerRow[]>();
    rows.forEach(r => {
      if (!r.assessor?.trim()) return;
      if (!map.has(r.assessor)) map.set(r.assessor, []);
      map.get(r.assessor)!.push(r);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .map(([name, r]) => ({ name, rows: r }));
  }, [rows]);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3">
        <Phone size={24} style={{ color: 'var(--accent-bright)' }} />
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Dashboard Umbler</h1>
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
          <span>{isLoading ? 'Carregando...' : `${total} registros`}</span>
          {!isLoading && (
            <span style={{ color: 'var(--text-muted)' }}>
              · {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {/* Refresh button */}
        <button onClick={handleRefresh} disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-70 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', boxShadow: '0 4px 12px rgba(34,197,94,0.30)' }}>
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </motion.div>

      {/* Row 1 — 6 cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
          {row1.map((c, i) => <DashCard key={c.title} {...c} index={i} refreshing={isRefreshing} />)}
        </div>
      )}

      {/* Row 2 — 2 cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {row2.map((c, i) => <DashCard key={c.title} {...c} index={i} refreshing={isRefreshing} />)}
        </div>
      )}

      {/* Desempenho Individual */}
      {!isLoading && assessores.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Users size={18} style={{ color: 'var(--accent-bright)' }} />
              <h2 className="font-black text-lg" style={{ color: 'var(--text-primary)' }}>Desempenho Individual</h2>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {assessores.length} assessores encontrados
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {assessores.map(({ name, rows: r }) => (
              <AssessorCard key={name} assessor={name} rows={r} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
