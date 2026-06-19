'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import {
  Phone, RefreshCw, CheckCircle, FileSearch,
  UserX, BookOpen, XCircle, UserMinus,
} from 'lucide-react';

interface Filtros {
  equipeId?: string;
  unidadeId?: string;
  dataInicio?: string;
  dataFim?: string;
}

interface Colaborador {
  id: string;
  nome: string;
  avatar: string | null;
  cargo: string;
  registros: number;
  emAndamento: number;
  concluidos: number;
  auditoria: number;
  desqualificados: number;
  pro: number;
  vendaPerdida: number;
  desistiu: number;
  taxaFinalizacao: number;
}

const metricas = [
  { key: 'registros',      label: 'Registros',       icon: Phone      },
  { key: 'emAndamento',    label: 'Em Andamento',     icon: RefreshCw  },
  { key: 'concluidos',     label: 'Concluídos',       icon: CheckCircle},
  { key: 'auditoria',      label: 'Auditoria',        icon: FileSearch },
  { key: 'desqualificados',label: 'Desqualificados',  icon: UserX      },
  { key: 'pro',            label: 'PRO (Prontuário)', icon: BookOpen   },
  { key: 'vendaPerdida',   label: 'Venda Perdida',    icon: XCircle    },
  { key: 'desistiu',       label: 'Desistiu',         icon: UserMinus  },
];

function Avatar({ nome, src }: { nome: string; src: string | null }) {
  if (src) {
    return <img src={src} alt={nome} className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10" />;
  }
  const initials = nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f97316','#22c55e','#06b6d4','#3b82f6','#eab308'];
  const color = colors[nome.charCodeAt(0) % colors.length];
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white ring-2 ring-white/10 flex-shrink-0"
      style={{ background: color }}>
      {initials}
    </div>
  );
}

function ColaboradorCard({ c, index }: { c: Colaborador; index: number }) {
  const taxaColor = c.taxaFinalizacao >= 50 ? '#4ade80' : c.taxaFinalizacao >= 20 ? '#fbbf24' : '#f87171';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Header: avatar + nome + badge taxa */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar nome={c.nome} src={c.avatar} />
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{c.nome}</p>
            <p className="text-slate-400 text-xs">
              {c.cargo === 'ADMIN' ? 'Administrador' : c.cargo === 'SUPERVISOR' ? 'Supervisor' : c.cargo === 'COORDENADOR' ? 'Coordenador' : 'Assessor'}
              {' · '}{c.registros} registros
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-black"
          style={{ background: taxaColor === '#4ade80' ? 'rgba(74,222,128,0.15)' : taxaColor === '#fbbf24' ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.2)', color: taxaColor, border: `1px solid ${taxaColor}44` }}>
          {c.taxaFinalizacao}%
        </div>
      </div>

      {/* Barra de progresso */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1.5">
          <span>Taxa de finalização</span>
          <span className="font-semibold text-white">{c.concluidos} / {c.registros}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(c.taxaFinalizacao, c.registros > 0 ? 2 : 0)}%` }}
            transition={{ duration: 0.8, delay: index * 0.07 + 0.2, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, #ef4444, ${taxaColor})` }}
          />
        </div>
      </div>

      {/* Grid de métricas 2x4 */}
      <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
        {metricas.map(({ key, label, icon: Icon }) => (
          <div key={key} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs">
              <Icon size={12} className="flex-shrink-0" />
              <span>{label}</span>
            </div>
            <span className="text-xs font-bold" style={{ color: '#4ade80' }}>
              {(c as any)[key]}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function DesempenhoIndividual({ filtros = {} }: { filtros?: Filtros }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['desempenho', filtros],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filtros).filter(([, v]) => v));
      const { data } = await api.get('/dashboard/desempenho', { params });
      return data;
    },
    staleTime: 1000 * 60 * 10,
    gcTime:    1000 * 60 * 30,
  });

  const colaboradores: Colaborador[] = data?.colaboradores || [];

  return (
    <div className="space-y-4">
      {/* Título da seção */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-base">Desempenho Individual</h2>
          {!isLoading && (
            <p className="text-slate-400 text-xs mt-0.5">
              {colaboradores.length} {colaboradores.length === 1 ? 'assessor encontrado' : 'assessores encontrados'}
            </p>
          )}
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <RefreshCw size={12} /> Atualizar
        </button>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl p-5 animate-pulse h-52"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }} />
          ))}
        </div>
      ) : colaboradores.length === 0 ? (
        <div className="rounded-2xl p-10 text-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <UserX size={32} className="mx-auto mb-2 text-slate-600" />
          <p className="text-slate-500 text-sm">Nenhum colaborador encontrado.</p>
          <p className="text-slate-600 text-xs mt-1">Importe dados do Kommo para visualizar o desempenho.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {colaboradores.map((c, i) => (
            <ColaboradorCard key={c.id} c={c} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
