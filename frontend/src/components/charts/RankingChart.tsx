'use client';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface RankingItem { nome: string; total: number; consultorId?: string }

const medals = ['🥇', '🥈', '🥉'];

export default function RankingChart({ data, title = 'Ranking' }: { data: RankingItem[]; title?: string }) {
  const max = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <motion.div
          key={item.consultorId || item.nome}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08 }}
          className="flex items-center gap-3"
        >
          <div className="w-6 text-center text-sm">
            {i < 3 ? medals[i] : <span className="text-slate-500 text-xs font-bold">{i + 1}º</span>}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-white font-medium truncate max-w-[180px]">{item.nome}</span>
              <span className="text-sm font-bold text-blue-400">{item.total.toLocaleString('pt-BR')}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.total / max) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: i === 0 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : i === 1 ? 'linear-gradient(90deg, #6b7280, #9ca3af)' : i === 2 ? 'linear-gradient(90deg, #b45309, #d97706)' : 'linear-gradient(90deg, #2563eb, #3b82f6)' }}
              />
            </div>
          </div>
        </motion.div>
      ))}
      {data.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Trophy size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum dado disponível</p>
        </div>
      )}
    </div>
  );
}
