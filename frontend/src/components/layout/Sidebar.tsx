'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth.store';
import {
  LayoutDashboard, TrendingUp, MapPin, Briefcase, Phone,
  FileText, Upload, Users, Settings, LogOut,
  ChevronLeft, ChevronRight, BarChart3, BarChart2,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard Geral', roles: ['ADMIN', 'COORDENADOR', 'SUPERVISOR', 'USUARIO'] },
  { href: '/dashboard/comercial', icon: TrendingUp, label: 'Comercial', roles: ['ADMIN', 'COORDENADOR', 'SUPERVISOR', 'USUARIO'] },
  { href: '/dashboard/ribeirao-preto', icon: MapPin, label: 'Ribeirão Preto', roles: ['ADMIN', 'COORDENADOR', 'SUPERVISOR', 'USUARIO'] },
  { href: '/dashboard/backoffice', icon: Briefcase, label: 'Backoffice', roles: ['ADMIN', 'COORDENADOR', 'SUPERVISOR', 'USUARIO'] },
  { href: '/dashboard/umbler', icon: Phone, label: 'Umbler', roles: ['ADMIN', 'COORDENADOR', 'SUPERVISOR', 'USUARIO'] },
  { href: '/dashboard/performance', icon: BarChart2, label: 'Performance Diária', roles: ['ADMIN', 'COORDENADOR', 'SUPERVISOR', 'USUARIO'] },
  { divider: true },
  { href: '/relatorios', icon: FileText, label: 'Relatórios', roles: ['ADMIN', 'COORDENADOR', 'SUPERVISOR'] },
  { href: '/importacoes', icon: Upload, label: 'Importações', roles: ['ADMIN', 'COORDENADOR', 'SUPERVISOR'] },
  { divider: true },
  { href: '/usuarios', icon: Users, label: 'Usuários', roles: ['ADMIN', 'COORDENADOR'] },
  { href: '/configuracoes', icon: Settings, label: 'Configurações', roles: ['ADMIN'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  const visible = navItems.filter((item) => {
    if ('divider' in item) return true;
    return item.roles.includes(user?.role || '');
  });

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col h-full relative z-20 overflow-hidden"
      style={{
        background: '#000000',
        minWidth: collapsed ? 72 : 240,
        borderRight: '1px solid #16241b',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: '1px solid #16241b' }}>
        <motion.div
          whileHover={{ scale: 1.08 }}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #14532d, #16a34a)', boxShadow: '0 0 18px rgba(22,163,74,0.35)' }}
        >
          <BarChart3 size={20} className="text-white" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="font-bold text-sm leading-tight" style={{ color: '#e8edea' }}>Corporate Insights</div>
              <div className="text-xs" style={{ color: '#16a34a' }}>Platform</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {visible.map((item, i) => {
          if ('divider' in item) {
            return <div key={i} className="my-3" style={{ borderTop: '1px solid #16241b' }} />;
          }
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: active ? 'rgba(22,163,74,0.15)' : 'transparent',
                  color: active ? '#4ade80' : 'rgba(138,154,144,0.75)',
                  borderLeft: active ? '2px solid #16a34a' : '2px solid transparent',
                }}
                title={collapsed ? item.label : undefined}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={18} className="flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium truncate"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && !collapsed && (
                  <motion.div
                    layoutId="active-indicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: '#22c55e' }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid #16241b' }}>
        <div className={cn('flex items-center gap-3 px-2 py-2 rounded-lg', collapsed && 'justify-center')}
          style={{ background: 'rgba(22,163,74,0.07)' }}>
          <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #14532d, #16a34a)' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                <div className="text-xs font-semibold truncate" style={{ color: '#e8edea' }}>{user?.name}</div>
                <div className="text-xs truncate" style={{ color: '#16a34a' }}>{user?.role}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <button
          onClick={logout}
          className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-red-500', collapsed && 'justify-center')}
          style={{ fontSize: 14 }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -right-3 w-6 h-6 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform shadow-lg z-30"
        style={{ background: '#16a34a', border: '1px solid #14532d' }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
