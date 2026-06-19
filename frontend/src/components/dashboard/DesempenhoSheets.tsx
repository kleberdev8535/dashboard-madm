'use client';
import { motion } from 'framer-motion';
import { Phone, RefreshCw, CheckCircle2, FileSearch, UserX, BookOpen, XCircle, Award } from 'lucide-react';

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
  return `${val.toFixed(0)}%`;
}

function Avatar({ nome }: { nome: string }) {
  const initials = nome.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f97316','#22c55e','#06b6d4','#3b82f6','#eab308','#ef4444','#14b8a6'];
  return (
    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
      style={{ background: colors[nome.charCodeAt(0) % colors.length], boxShadow: '0 0 0 2px var(--card-bg), 0 0 0 3px var(--card-border)' }}>
      {initials}
    </div>
  );
}

function ColaboradorCard({ linha, index }: { linha: Linha; index: number }) {
  const taxa = linha.recebidos > 0 ? (linha.vendaGanha / linha.recebidos) * 100 : 0;
  const taxaColor = taxa >= 10 ? '#22c55e' : taxa >= 5 ? '#eab308' : '#ef4444';
  const taxaBg    = `${taxaColor}1f`;
  const emAndamento = Math.max(0, linha.recebidos - linha.emitidos - linha.protocolados);

  const metricas = [
    { label: 'Registros',    value: linha.recebidos,      icon: Phone,        color: '#2563eb' },
    { label: 'Em Andamento', value: emAndamento,           icon: RefreshCw,    color: '#7c3aed' },
    { label: 'Concluídos',   value: linha.assinadosSafra,  icon: CheckCircle2, color: '#16a34a' },
    { label: 'Auditoria',    value: linha.protocolados,    icon: FileSearch,   color: '#0891b2' },
    { label: 'Emitidos',     value: linha.emitidos,        icon: BookOpen,     color: '#d97706' },
    { label: 'Venda Ganha',  value: linha.vendaGanha,      icon: Award,        color: '#f59e0b' },
    { label: 'Conv Safra',   value: pct(linha.convAssSafra), icon: XCircle,    color: '#6366f1' },
    { label: 'Rec/Ganhos',   value: pct(linha.recebidosGanhos), icon: UserX,  color: '#ec4899' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 1px 6px rgba(0,0,0,0.20)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar nome={linha.colaborador} />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{linha.colaborador}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {linha.equipe || 'Assessor'} · {linha.recebidos} registros
            </p>
          </div>
        </div>
        {/* Badge taxa */}
        <div className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-xs font-black"
          style={{ background: taxaBg, color: taxaColor, border: `2px solid ${taxaColor}33` }}>
          {taxa.toFixed(0)}%
        </div>
      </div>

      {/* Barra de progresso */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          <span>Taxa de finalização</span>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{linha.vendaGanha} / {linha.recebidos}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--input-bg)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(Math.max(taxa, linha.recebidos > 0 ? 1.5 : 0), 100)}%` }}
            transition={{ duration: 0.9, delay: index * 0.06 + 0.2, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${taxaColor}99, ${taxaColor})` }}
          />
        </div>
      </div>

      {/* Grid métricas 2x4 */}
      <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
        {metricas.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
              <Icon size={12} style={{ color }} className="flex-shrink-0" />
              <span>{label}</span>
            </div>
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface Props {
  linhas: Linha[];
  isLoading?: boolean;
}

export default function DesempenhoSheets({ linhas, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="rounded-2xl p-5 h-52 animate-pulse"
            style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} />
        ))}
      </div>
    );
  }

  if (!linhas.length) return null;

  const sorted = [...linhas].sort((a, b) => (b.recebidos || 0) - (a.recebidos || 0));

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Desempenho Individual</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {sorted.length} {sorted.length === 1 ? 'colaborador encontrado' : 'colaboradores encontrados'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((linha, i) => (
          <ColaboradorCard key={linha.colaborador} linha={linha} index={i} />
        ))}
      </div>
    </div>
  );
}
