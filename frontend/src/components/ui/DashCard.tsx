'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { LucideIcon } from 'lucide-react';

interface DashCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'orange' | 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'cyan' | 'pink' | 'gray';
  percentage?: number;
  index?: number;
  refreshing?: boolean;
}

const colorMap: Record<string, { bg: string; icon: string; bar: string; bgDark: string }> = {
  orange: { bg: '#fff4ed', icon: '#f97316', bar: '#f97316', bgDark: 'rgba(249,115,22,0.12)' },
  green:  { bg: '#f0fdf4', icon: '#16a34a', bar: '#16a34a', bgDark: 'rgba(22,163,74,0.12)'  },
  blue:   { bg: '#eff6ff', icon: '#2563eb', bar: '#2563eb', bgDark: 'rgba(37,99,235,0.12)'  },
  yellow: { bg: '#fffbeb', icon: '#d97706', bar: '#d97706', bgDark: 'rgba(217,119,6,0.12)'  },
  red:    { bg: '#fef2f2', icon: '#dc2626', bar: '#dc2626', bgDark: 'rgba(220,38,38,0.12)'  },
  purple: { bg: '#f5f3ff', icon: '#7c3aed', bar: '#7c3aed', bgDark: 'rgba(124,58,237,0.12)' },
  cyan:   { bg: '#ecfeff', icon: '#0891b2', bar: '#0891b2', bgDark: 'rgba(8,145,178,0.12)'  },
  pink:   { bg: '#fdf2f8', icon: '#db2777', bar: '#db2777', bgDark: 'rgba(219,39,119,0.12)' },
  gray:   { bg: '#f8fafc', icon: '#64748b', bar: '#64748b', bgDark: 'rgba(100,116,139,0.12)'},
};

export default function DashCard({
  title, value, subtitle, icon: Icon, color = 'blue', percentage, index = 0, refreshing = false,
}: DashCardProps) {
  const c = colorMap[color];
  const pct = percentage !== undefined ? Math.min(Math.max(percentage, 0), 100) : undefined;
  const prevRefreshing = useRef(false);
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => {
    if (prevRefreshing.current && !refreshing) {
      // acabou de atualizar — dispara pop com delay escalonado
      const t = setTimeout(() => {
        setJustUpdated(true);
        setTimeout(() => setJustUpdated(false), 700);
      }, index * 60);
      return () => clearTimeout(t);
    }
    prevRefreshing.current = refreshing;
  }, [refreshing, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={justUpdated
        ? { scale: [1, 1.04, 1], borderColor: [c.bar + '55', c.bar, 'var(--card-border)'] }
        : { opacity: 1, y: 0 }}
      transition={justUpdated
        ? { duration: 0.45, ease: 'easeOut' }
        : { delay: index * 0.05, duration: 0.35 }}
      whileHover={{ y: -3, boxShadow: '0 8px 28px rgba(0,0,0,0.10)' }}
      className="rounded-2xl p-4 flex flex-col gap-2 cursor-default select-none relative overflow-hidden"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: justUpdated ? `0 0 0 2px ${c.bar}55` : '0 1px 4px rgba(0,0,0,0.05)' }}
    >
      {/* shimmer durante refresh */}
      {refreshing && (
        <motion.div
          className="absolute inset-0 z-10 pointer-events-none"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.2, delay: index * 0.07 }}
          style={{ background: `linear-gradient(90deg, transparent 0%, ${c.bar}30 50%, transparent 100%)` }}
        />
      )}
      {refreshing && (
        <motion.div
          className="absolute top-2 right-2 w-2 h-2 rounded-full z-20"
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: index * 0.07 }}
          style={{ background: c.icon }}
        />
      )}
      {/* flash verde ao concluir */}
      <AnimatePresence>
        {justUpdated && (
          <motion.div
            key="flash"
            className="absolute inset-0 z-10 pointer-events-none rounded-2xl"
            initial={{ opacity: 0.35 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            style={{ background: `radial-gradient(circle at 50% 40%, ${c.bar}40, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      {/* Row 1: icon + title */}
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: c.bgDark, border: `1px solid ${c.bar}33` }}>
          <Icon size={20} style={{ color: c.icon }} />
        </div>
        <span className="font-bold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>{title}</span>
      </div>

      {/* Row 2: big number */}
      <div className="px-1">
        <span className="text-4xl font-black leading-none tracking-tight" style={{ color: 'var(--text-primary)' }}>
          {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
        </span>
      </div>

      {/* Row 3: subtitle */}
      {subtitle && (
        <p className="text-xs px-1 leading-snug" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
      )}

      {/* Row 4: progress bar (opcional) — sem sparkline */}
      {pct !== undefined && (
        <div className="px-1 mt-1">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--input-bg)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.9, delay: index * 0.05 + 0.3, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: c.bar }}
            />
          </div>
          <p className="text-right text-xs font-semibold mt-1" style={{ color: c.icon }}>
            {pct.toFixed(1)}%
          </p>
        </div>
      )}
    </motion.div>
  );
}
