'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Settings, Lock, User, Bell, Loader2 } from 'lucide-react';

export default function ConfiguracoesPage() {
  const { user } = useAuthStore();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Senhas não coincidem'); return; }
    if (pwForm.newPassword.length < 8) { toast.error('Senha deve ter ao menos 8 caracteres'); return; }
    setSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Senha alterada com sucesso!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black text-white">Configurações</h1>
        <p className="text-slate-400 text-sm mt-1">Gerencie sua conta e preferências</p>
      </motion.div>

      {/* Profile */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-blue-400" />
          <h3 className="text-white font-semibold text-sm">Perfil</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-white font-semibold text-lg">{user?.name}</p>
            <p className="text-slate-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/20">
                {user?.role}
              </span>
              {user?.unidade && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
                  {user.unidade}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-blue-400" />
          <h3 className="text-white font-semibold text-sm">Alterar Senha</h3>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { label: 'Senha atual', key: 'currentPassword' },
            { label: 'Nova senha', key: 'newPassword' },
            { label: 'Confirmar nova senha', key: 'confirm' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">{label}</label>
              <input
                type="password"
                value={(pwForm as any)[key]}
                onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
                placeholder="••••••••"
              />
            </div>
          ))}
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Alterar Senha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
