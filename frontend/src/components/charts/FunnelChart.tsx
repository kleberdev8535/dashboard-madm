'use client';
import { motion } from 'framer-motion';

interface FunnelItem { etapa: string; valor: number }

export default function FunnelChart({ data }: { data: FunnelItem[] }) {
  const max = Math.max(...data.map((d) => d.valor), 1);

  const colors = ['#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#f97316','#22c55e','#10b981'];

  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const pct = (item.valor / max) * 100;
        const conv = i > 0 && data[i - 1].valor > 0
          ? ((item.valor / data[i - 1].valor) * 100).toFixed(0)
          : null;
        return (
          <div key={item.etapa} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-medium">{item.etapa}</span>
              <div className="flex items-center gap-3">
                {conv && (
                  <span className="text-xs text-slate-500">↓ {conv}%</span>
                )}
                <span className="text-sm font-bold text-white">{item.valor.toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div className="h-7 rounded-lg overflow-hidden bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                className="h-full rounded-lg flex items-center justify-end pr-2 relative overflow-hidden"
                style={{ background: `linear-gradient(90deg, ${colors[i % colors.length]}88, ${colors[i % colors.length]})` }}
              >
                <div className="absolute inset-0 opacity-30"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2))' }}
                />
              </motion.div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
