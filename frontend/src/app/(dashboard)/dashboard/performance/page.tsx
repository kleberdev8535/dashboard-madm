'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { BarChart2, RefreshCw, TrendingUp, Send, Award, CheckCircle2, FileCheck, Users } from 'lucide-react';

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

function pct(v: number) {
  if (!v) return '0%';
  const val = v > 1 ? v : v * 100;
  return `${val.toFixed(1)}%`;
}

function Avatar({ nome }: { nome: string }) {
  const initials = nome.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f97316','#22c55e','#06b6d4','#3b82f6','#eab308','#ef4444'];
  const color = colors[nome.charCodeAt(0) % colors.length];
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
      style={{ background: color }}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: any; icon: any; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-5">
      <Icon size={26} style={{ color, filter: `drop-shadow(0 0 8px ${color}55)` }} />
      <span className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>{value}</span>
      <span className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

export default function PerformancePage() {
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['performance-mes'],
    queryFn: async () => {
      const { data } = await api.get('/sheets/performance');
      return data;
    },
    staleTime: 1000 * 60 * 5,
    gcTime:    1000 * 60 * 20,
  });

  const linhas: Linha[] = data?.linhas || [];
  const totais = data?.totais || {};
  const sorted = [...linhas].sort((a, b) => (b.recebidos || 0) - (a.recebidos || 0));

  const cards = [
    { label: 'Recebidos',    value: totais.recebidos        || 0, icon: Users,        color: '#60a5fa' },
    { label: 'Emitidos',     value: totais.emitidos         || 0, icon: Send,         color: '#34d399' },
    { label: 'Ass. Safra',   value: totais.assinadosSafra   || 0, icon: CheckCircle2, color: '#a78bfa' },
    { label: 'Venda Ganha',  value: totais.vendaGanha       || 0, icon: Award,        color: '#fbbf24' },
    { label: 'Protocolados', value: totais.protocolados     || 0, icon: FileCheck,    color: '#f472b6' },
  ];

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <BarChart2 size={24} style={{ color: 'var(--accent-bright)' }} />
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Performance do Mês</h1>
          </div>
          <p className="text-sm ml-9" style={{ color: 'var(--text-secondary)' }}>
            Acumulado mensal · {linhas.length} colaboradores
          </p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
          <RefreshCw size={12} /> Atualizar
        </button>
      </motion.div>

      {/* Cards totais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}>
            <StatCard {...c} />
          </motion.div>
        ))}
      </div>

      {/* Tabela */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
        className="rounded-2xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <TrendingUp size={16} style={{ color: 'var(--accent-bright)' }} />
            Ranking de Colaboradores — Mês Atual
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sorted.length} colaboradores</span>
        </div>

        {isLoading && (
          <div className="space-y-2">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'var(--card-bg)' }} />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-10 text-red-400 text-sm">
            Erro ao carregar dados. Verifique se o backend está rodando.
          </div>
        )}

        {!isLoading && !error && sorted.length === 0 && (
          <div className="text-center py-10 text-sm" style={{ color: 'var(--text-muted)' }}>Nenhum dado encontrado na planilha.</div>
        )}

        {!isLoading && sorted.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--card-bg)' }}>
                  {['#','Colaborador','Equipe','Recebidos','Emitidos','Ass. Safra','Venda Ganha','Protocolados','Conv Ass/Safra','Ass/Ganhos','Receb/Ganhos'].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((linha, i) => {
                  const conv = linha.convAssSafra || 0;
                  const convColor = conv >= 0.1 ? '#4ade80' : conv >= 0.05 ? '#fbbf24' : '#f87171';
                  return (
                    <motion.tr key={i}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.015 }}
                      className="border-t transition-colors"
                      style={{ borderColor: 'var(--card-border)' }}>
                      <td className="px-3 py-3 text-xs w-8" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar nome={linha.colaborador} />
                          <span className="font-medium text-xs whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>{linha.colaborador}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>{linha.equipe || '—'}</td>
                      <td className="px-3 py-3 text-center font-bold" style={{ color: 'var(--text-primary)' }}>{linha.recebidos || 0}</td>
                      <td className="px-3 py-3 text-center font-semibold" style={{ color: (linha.emitidos||0)>0?'#60a5fa':'var(--text-muted)' }}>{linha.emitidos || 0}</td>
                      <td className="px-3 py-3 text-center font-semibold" style={{ color: (linha.assinadosSafra||0)>0?'#a78bfa':'var(--text-muted)' }}>{linha.assinadosSafra || 0}</td>
                      <td className="px-3 py-3 text-center font-semibold" style={{ color: (linha.vendaGanha||0)>0?'#fbbf24':'var(--text-muted)' }}>{linha.vendaGanha || 0}</td>
                      <td className="px-3 py-3 text-center font-semibold" style={{ color: (linha.protocolados||0)>0?'#f472b6':'var(--text-muted)' }}>{linha.protocolados || 0}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: `${convColor}18`, color: convColor, border: `1px solid ${convColor}33` }}>
                          {pct(conv)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-xs" style={{ color: (linha.assinadosganhos||0)>0?'#4ade80':'var(--text-muted)' }}>{pct(linha.assinadosganhos||0)}</td>
                      <td className="px-3 py-3 text-center text-xs" style={{ color: (linha.recebidosGanhos||0)>0?'#34d399':'var(--text-muted)' }}>{pct(linha.recebidosGanhos||0)}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}


