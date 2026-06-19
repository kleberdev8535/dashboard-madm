'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState, useMemo } from 'react';
import { api } from '@/lib/api';
import DashCard from '@/components/ui/DashCard';
import {
  Briefcase, CheckCircle2, AlertCircle, Clock, Zap,
  RefreshCw, RotateCcw, Phone, XCircle, UserX, ShieldAlert, Search, Filter, X,
} from 'lucide-react';

interface Row {
  Assessor: string;
  CPF: string;
  Data: string;
  Status: string;
  Observação: string;
  Supervisor: string;
  Backoffice: string;
  Demanda: string;
  Advogado: string;
}

function normalize(s: string) {
  return String(s || '').normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().trim();
}

function count(rows: Row[], ...terms: string[]) {
  return rows.filter(r => terms.some(t => normalize(r.Status) === normalize(t))).length;
}

function Avatar({ nome }: { nome: string }) {
  const initials = nome.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f97316','#22c55e','#06b6d4','#3b82f6','#eab308','#ef4444','#14b8a6'];
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
      style={{ background: colors[nome.charCodeAt(0) % colors.length] }}>
      {initials}
    </div>
  );
}

function AnalystCard({ name, rows, index }: { name: string; rows: Row[]; index: number }) {
  const total      = rows.length;
  const finalizados = count(rows, 'Finalizado');
  const auditoria   = count(rows, 'Auditoria');
  const pendente    = count(rows, 'Pendente');
  const pendAudit   = count(rows, 'Pendente auditoria');
  const pendResp    = count(rows, 'Pendente resposta do cliente');
  const naoResponde = count(rows, 'Não responde mais');
  const desistiu    = count(rows, 'Desistiu');
  const desqualif   = count(rows, 'Desqualificado');
  const pro         = count(rows, 'PRO');
  const vendaPerdida= count(rows, 'Venda perdida');
  const sanada      = count(rows, 'Sanada');
  const reset       = count(rows, 'Reset');

  const taxa = total > 0 ? (finalizados / total) * 100 : 0;
  const taxaColor = taxa >= 30 ? '#16a34a' : taxa >= 15 ? '#d97706' : '#dc2626';
  const taxaBg    = `${taxaColor}1f`;

  const metricas = [
    { label: 'Acionados',    value: total,        color: '#2563eb' },
    { label: 'Finalizados',  value: finalizados,   color: '#16a34a' },
    { label: 'Auditoria',    value: auditoria,     color: '#0891b2' },
    { label: 'Pendente',     value: pendente,      color: '#d97706' },
    { label: 'Pend. Audit.', value: pendAudit,     color: '#f97316' },
    { label: 'PRO',          value: pro,           color: '#7c3aed' },
    { label: 'Não Responde', value: naoResponde,   color: '#f97316' },
    { label: 'Venda Perdida',value: vendaPerdida,  color: '#dc2626' },
    { label: 'Desistiu',     value: desistiu,      color: '#94a3b8' },
    { label: 'Desqualif.',   value: desqualif,     color: '#94a3b8' },
    { label: 'Sanada',       value: sanada,        color: '#22c55e' },
    { label: 'Reset',        value: reset,         color: '#3b82f6' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar nome={name} />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{name}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Backoffice · {total} registros</p>
          </div>
        </div>
        <div className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-xs font-black"
          style={{ background: taxaBg, color: taxaColor, border: `2px solid ${taxaColor}33` }}>
          {taxa.toFixed(0)}%
        </div>
      </div>

      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          <span>Taxa de finalização</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{finalizados} / {total}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--input-bg)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(taxa, 100)}%` }}
            transition={{ duration: 0.9, delay: index * 0.06 + 0.2 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${taxaColor}99, ${taxaColor})` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        {metricas.map(({ label, value, color }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function parseDate(str: string): Date | null {
  if (!str) return null;
  const [d, m, y] = str.split('/');
  if (!d || !m || !y) return null;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export default function DashboardBackofficePage() {
  const [analista, setAnalista] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');

  const queryClient = useQueryClient();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: sheetsData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['backoffice-sheets'],
    queryFn: async () => {
      const { data } = await api.get('/backoffice/list');
      return data;
    },
    staleTime: 1000 * 30,       // considera stale após 30s
    gcTime:    1000 * 60 * 10,
    refetchOnWindowFocus: true, // atualiza ao voltar para a aba
  });

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      // Dispara revalidação no backend em background (não bloqueia)
      api.get('/backoffice/list?force=true').catch(() => {});
      // Invalida cache do React Query e refaz com dado atual (pode ser stale por ~1s)
      await queryClient.invalidateQueries({ queryKey: ['backoffice-sheets'] });
      await queryClient.refetchQueries({ queryKey: ['backoffice-sheets'] });
      // Após 4s busca de novo com dado já atualizado
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['backoffice-sheets'] });
      }, 4000);
    } finally {
      setIsRefreshing(false);
    }
  }

  const allRows: Row[] = (sheetsData?.rows || []).filter((r: Row) => r.Backoffice && r.Backoffice.trim());

  const rows = useMemo(() => {
    let r = allRows;
    if (analista.trim()) {
      const q = analista.toLowerCase();
      r = r.filter(row => row.Backoffice.toLowerCase().includes(q));
    }
    if (dateFrom) {
      const from = parseDate(dateFrom.split('-').reverse().join('/'));
      if (from) r = r.filter(row => { const d = parseDate(row.Data); return d && d >= from; });
    }
    if (dateTo) {
      const to = parseDate(dateTo.split('-').reverse().join('/'));
      if (to) r = r.filter(row => { const d = parseDate(row.Data); return d && d <= to; });
    }
    return r;
  }, [allRows, analista, dateFrom, dateTo]);

  const hasFilter = analista || dateFrom || dateTo;
  const updatedTime = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
  const total = rows.length;

  const acionados    = total;
  const finalizados  = count(rows, 'Finalizado');
  const auditoria    = count(rows, 'Auditoria');
  const pendente     = count(rows, 'Pendente');
  const pendAudit    = count(rows, 'Pendente auditoria');
  const pendResp     = count(rows, 'Pendente resposta do cliente');
  const aguardando   = count(rows, 'Pendente');
  const naoResponde  = count(rows, 'Não responde mais');
  const desistiu     = count(rows, 'Desistiu');
  const desqualif    = count(rows, 'Desqualificado');
  const pro          = count(rows, 'PRO');
  const vendaPerdida = count(rows, 'Venda perdida');
  const sanada       = count(rows, 'Sanada');
  const reset        = count(rows, 'Reset');

  const pct = (v: number) => total > 0 ? (v / total) * 100 : 0;

  const row1 = [
    { title: 'Acionados',       value: acionados,   subtitle: 'Com backoffice',            icon: Phone,        color: 'orange' as const },
    { title: 'Finalizados',     value: finalizados,  subtitle: 'Conversão',                 icon: CheckCircle2, color: 'green'  as const, percentage: pct(finalizados) },
    { title: 'Auditoria',       value: auditoria,    subtitle: 'Finalizado, falta auditar', icon: Search,       color: 'blue'   as const, percentage: pct(auditoria) },
    { title: 'Pendentes',       value: aguardando,   subtitle: 'Aguardando ação',           icon: AlertCircle,  color: 'yellow' as const },
    { title: 'Aguardando',      value: pendResp,     subtitle: 'Resp. do cliente',          icon: Clock,        color: 'orange' as const },
    { title: 'Desqualificados', value: desqualif,    subtitle: 'Fora do perfil',            icon: UserX,        color: 'gray'   as const },
    { title: 'PRO (Prontuário)',value: pro,           subtitle: 'Encaminhados',              icon: Zap,          color: 'purple' as const },
  ];

  const row2 = [
    { title: 'Venda Perdida',   value: vendaPerdida, subtitle: 'Desqualif. c/ venda perdida', icon: XCircle,     color: 'red'    as const, percentage: pct(vendaPerdida) },
    { title: 'Pend. Auditoria', value: pendAudit,    subtitle: 'Aguardando auditoria',        icon: ShieldAlert, color: 'orange' as const, percentage: pct(pendAudit) },
    { title: 'Não Responde',    value: naoResponde,  subtitle: 'Sem retorno do cliente',      icon: Phone,       color: 'orange' as const, percentage: pct(naoResponde) },
    { title: 'Desistiu',        value: desistiu,     subtitle: 'Cliente desistiu',            icon: UserX,       color: 'gray'   as const, percentage: pct(desistiu) },
    { title: 'Sanada',          value: sanada,       subtitle: 'Demanda sanada',              icon: CheckCircle2,color: 'green'  as const, percentage: pct(sanada) },
    { title: 'Reset',           value: reset,        subtitle: 'Processo reiniciado',         icon: RotateCcw,   color: 'blue'   as const, percentage: pct(reset) },
    { title: 'Pend. Resp. Cliente', value: pendResp, subtitle: 'Aguardando cliente',          icon: Clock,       color: 'yellow' as const, percentage: pct(pendResp) },
  ];

  // Desempenho por analista
  const analistas = Array.from(new Set(rows.map(r => r.Backoffice.trim()))).filter(Boolean).sort();
  const rowsByAnalista = analistas.map(name => ({
    name,
    rows: rows.filter(r => r.Backoffice.trim() === name),
  })).sort((a, b) => b.rows.length - a.rows.length);

  return (
    <div className="space-y-6 pb-6">
      {/* Barra de progresso de atualização */}
      {isRefreshing && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 h-0.5"
          style={{ background: 'var(--card-border)' }}
        >
          <motion.div
            className="h-full"
            style={{ background: 'linear-gradient(90deg, #15803d, #22c55e, #4ade80)' }}
            initial={{ width: '0%', x: 0 }}
            animate={{ width: ['0%', '70%', '85%'] }}
            transition={{ duration: 3.5, ease: 'easeOut' }}
          />
        </motion.div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Briefcase size={24} style={{ color: '#7c3aed' }} />
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Dashboard Backoffice</h1>
          </div>
          <p className="text-sm ml-9" style={{ color: 'var(--text-secondary)' }}>
            Controle operacional · {total} registros
          </p>
        </div>
      </motion.div>

      {/* Barra de filtros */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

        {/* Busca por analista */}
        <div className="flex items-center gap-2 flex-1 min-w-48 px-3 py-2 rounded-xl"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)' }}>
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Filtrar por analista..."
            value={analista}
            onChange={e => setAnalista(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>

        {/* Ícone filtro */}
        <Filter size={16} style={{ color: 'var(--text-muted)' }} />

        {/* Data de */}
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: dateFrom ? 'var(--text-primary)' : 'var(--text-muted)', colorScheme: 'dark' }}
        />

        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>até</span>

        {/* Data até */}
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm outline-none"
          style={{ background: 'var(--input-bg)', border: '1px solid var(--card-border)', color: dateTo ? 'var(--text-primary)' : 'var(--text-muted)', colorScheme: 'dark' }}
        />

        {/* Limpar */}
        {hasFilter && (
          <button onClick={() => { setAnalista(''); setDateFrom(''); setDateTo(''); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            <X size={13} /> Limpar
          </button>
        )}

        {/* Contador */}
        <div className="ml-auto flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{rows.length} registros</span>
          {updatedTime && <span>· {updatedTime}</span>}
        </div>

        {/* Atualizar */}
        <button onClick={handleRefresh} disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-70"
          style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', boxShadow: '0 4px 12px rgba(34,197,94,0.30)' }}>
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Atualizando...' : 'Atualizar'}
        </button>
      </motion.div>

      {/* Cards linha 1 */}
      {isLoading ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[1,2,3,4,5,6,7].map(i => <div key={i} className="rounded-2xl h-44 animate-pulse" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} />)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[1,2,3,4,5,6,7].map(i => <div key={i} className="rounded-2xl h-44 animate-pulse" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} />)}
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {row1.map((c, i) => <DashCard key={c.title} {...c} index={i} refreshing={isRefreshing} />)}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {row2.map((c, i) => <DashCard key={c.title} {...c} index={i + 7} refreshing={isRefreshing} />)}
          </div>
        </>
      )}

      {/* Desempenho Individual */}
      {!isLoading && rowsByAnalista.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Desempenho Individual</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {rowsByAnalista.length} analistas encontrados
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rowsByAnalista.map((a, i) => (
              <AnalystCard key={a.name} name={a.name} rows={a.rows} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
