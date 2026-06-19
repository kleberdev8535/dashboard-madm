'use client';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'yellow';
  index?: number;
}

const colorMap = {
  blue:   { icon: '#2563eb', light: '#eff6ff', border: '#bfdbfe' },
  green:  { icon: '#16a34a', light: '#f0fdf4', border: '#bbf7d0' },
  purple: { icon: '#7c3aed', light: '#f5f3ff', border: '#ddd6fe' },
  orange: { icon: '#ea580c', light: '#fff7ed', border: '#fed7aa' },
  red:    { icon: '#dc2626', light: '#fef2f2', border: '#fecaca' },
  cyan:   { icon: '#0891b2', light: '#ecfeff', border: '#a5f3fc' },
  yellow: { icon: '#d97706', light: '#fffbeb', border: '#fde68a' },
};

export default function StatCard({ title, value, icon: Icon, color = 'blue', index = 0 }: StatCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      className="flex flex-col items-center justify-center gap-2.5 py-5 px-3 rounded-2xl cursor-default"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${c.icon}1f` }}>
        <Icon size={22} style={{ color: c.icon }} />
      </div>
      <span className="text-2xl font-black leading-none" style={{ color: 'var(--text-primary)' }}>
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </span>
      <span className="text-xs font-medium text-center leading-tight" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </span>
    </motion.div>
  );
}
