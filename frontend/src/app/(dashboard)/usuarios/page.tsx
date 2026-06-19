'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Users, Plus, Pencil, Trash2, X, Loader2, Shield } from 'lucide-react';

const ROLES = ['ADMIN', 'COORDENADOR', 'SUPERVISOR', 'USUARIO'];
const ROLE_COLORS: Record<string, string> = {
  ADMIN: '#f97316', COORDENADOR: '#8b5cf6', SUPERVISOR: '#3b82f6', USUARIO: '#22c55e',
};

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative rounded-2xl p-6 w-full max-w-md z-10"
        style={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-white font-bold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

function FormField({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5 font-medium">{label}</label>
      <input {...props} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition-all" />
    </div>
  );
}

export default function UsuariosPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USUARIO' });
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users?limit=100');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: any) => api.post('/users', body),
    onSuccess: () => {
      toast.success('Usuário criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'USUARIO' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro ao criar usuário'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast.success('Usuário desativado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Erro'),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { toast.error('Preencha todos os campos'); return; }
    setSaving(true);
    try { await createMutation.mutateAsync(form); } finally { setSaving(false); }
  };

  const users = data?.users || [];

  return (
    <div className="space-y-6 pb-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Usuários</h1>
          <p className="text-slate-400 text-sm mt-1">Gestão de usuários e permissões do sistema</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}
        >
          <Plus size={16} /> Novo Usuário
        </motion.button>
      </motion.div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              {['Usuário', 'Email', 'Perfil', 'Equipe', 'Unidade', 'Ações'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10">
                <Loader2 className="animate-spin mx-auto text-blue-400" size={24} />
              </td></tr>
            ) : users.map((u: any, i: number) => (
              <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="border-b border-white/5 hover:bg-white/3 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                    >
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-400">{u.email}</td>
                <td className="px-5 py-3.5">
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                    style={{ background: `${ROLE_COLORS[u.role]}22`, color: ROLE_COLORS[u.role], border: `1px solid ${ROLE_COLORS[u.role]}44` }}
                  >
                    <Shield size={10} className="inline mr-1" />{u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-400">{u.equipe?.nome || '—'}</td>
                <td className="px-5 py-3.5 text-slate-400">{u.unidade?.nome || '—'}</td>
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => { if (confirm(`Desativar ${u.name}?`)) deleteMutation.mutate(u.id); }}
                    className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal title="Novo Usuário" onClose={() => setShowModal(false)}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Nome completo" placeholder="João Silva" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <FormField label="Email" type="email" placeholder="joao@empresa.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <FormField label="Senha" type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Perfil de Acesso</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
                  style={{ background: '#0d1526' }}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : null}
                  Criar Usuário
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
