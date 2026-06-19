'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Search, RefreshCw, Calendar, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useThemeStore } from '@/stores/theme.store';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Header() {
  const { user } = useAuthStore();
  const { isDark, toggle } = useThemeStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
    window.location.reload();
  };

  const btn = {
    background: 'var(--input-bg)',
    border: `1px solid ${isDark ? '#18211c' : '#e2e8f0'}`,
    color: 'var(--text-secondary)',
  };
  const btnHover = isDark ? '#0a140d' : '#e2e8f0';

  return (
    <header className="flex items-center justify-between px-6 py-3.5 flex-shrink-0"
      style={{
        background: 'var(--header-bg)',
        borderBottom: `1px solid ${isDark ? '#18211c' : '#e2e8f0'}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}>

      {/* Data */}
      <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
        <Calendar size={15} />
        <span className="text-sm capitalize">
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </span>
      </div>

      {/* Busca */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#94a3b8' }} />
          <input
            placeholder="Buscar colaboradores, indicadores..."
            className="w-full rounded-xl py-2 pl-9 pr-4 text-sm outline-none transition-all"
            style={{
              background: 'var(--input-bg)',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
              color: 'var(--text-primary)',
            }}
            onFocus={e => { e.target.style.borderColor = '#22c55e'; e.target.style.background = isDark ? '#0a140d' : '#fff'; }}
            onBlur={e => { e.target.style.borderColor = isDark ? '#18211c' : '#e2e8f0'; e.target.style.background = 'var(--input-bg)'; }}
          />
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2">

        {/* Toggle tema */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggle}
          title={isDark ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={btn}
          onMouseEnter={e => (e.currentTarget.style.background = btnHover)}
          onMouseLeave={e => (e.currentTarget.style.background = btn.background)}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </motion.button>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={btn}
          onMouseEnter={e => (e.currentTarget.style.background = btnHover)}
          onMouseLeave={e => (e.currentTarget.style.background = btn.background)}
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
        </motion.button>

        <motion.button whileHover={{ scale: 1.05 }}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={btn}
          onMouseEnter={e => (e.currentTarget.style.background = btnHover)}
          onMouseLeave={e => (e.currentTarget.style.background = btn.background)}
        >
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
        </motion.button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: 'var(--input-bg)', border: `1px solid ${isDark ? '#18211c' : '#e2e8f0'}` }}>
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #14532d, #16a34a)' }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <div className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>{user?.name}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{user?.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
