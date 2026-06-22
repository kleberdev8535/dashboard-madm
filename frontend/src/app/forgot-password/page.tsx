'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Loader2, Mail, KeyRound, Lock, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

type Step = 'email' | 'code' | 'password' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep]         = useState<Step>('email');
  const [loading, setLoading]   = useState(false);
  const [email, setEmail]       = useState('');
  const [code, setCode]         = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  function startCooldown() {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Novo código enviado!');
      startCooldown();
    } catch {
      toast.error('Erro ao reenviar código');
    } finally { setLoading(false); }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { toast.error('Digite seu e-mail'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setStep('code');
      startCooldown();
      toast.success('Código enviado! Verifique seu e-mail.');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao enviar código');
    } finally { setLoading(false); }
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) { toast.error('Digite o código de 6 dígitos'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-code', { email, code });
      setStep('password');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Código inválido ou expirado');
    } finally { setLoading(false); }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error('Senha deve ter ao menos 6 caracteres'); return; }
    if (newPassword !== confirm) { toast.error('As senhas não coincidem'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, code, newPassword });
      setStep('done');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao redefinir senha');
    } finally { setLoading(false); }
  }

  const steps = ['email', 'code', 'password', 'done'];
  const stepIdx = steps.indexOf(step);

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'radial-gradient(ellipse at 25% 60%, #0a1840 0%, #050c20 45%, #030810 100%)' }}>

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Card */}
        <div className="rounded-3xl p-8"
          style={{ background: '#0a0c0b', border: '1px solid #18211c', boxShadow: '0 0 0 1px rgba(34,197,94,0.15), 0 32px 64px rgba(0,0,0,0.6)' }}>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {['email', 'code', 'password'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{ background: i <= stepIdx ? '#22c55e' : '#18211c', boxShadow: i === stepIdx ? '0 0 8px #22c55e' : 'none' }} />
                {i < 2 && <div className="w-8 h-px transition-all duration-300" style={{ background: i < stepIdx ? '#22c55e' : '#18211c' }} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* STEP 1 — Email */}
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-6 mx-auto"
                  style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.22)' }}>
                  <Mail size={26} style={{ color: '#22c55e' }} />
                </div>
                <h1 className="text-xl font-black text-center mb-1" style={{ color: '#e8edea' }}>Esqueceu sua senha?</h1>
                <p className="text-sm text-center mb-3" style={{ color: '#8a9a90' }}>
                  Digite seu e-mail e solicite o código de recuperação.
                </p>
                <div className="rounded-xl px-4 py-3 mb-4 text-center text-sm" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', color: '#8a9a90' }}>
                  📩 O código será encaminhado pelo <strong style={{ color: '#e8edea' }}>administrador</strong> — entre em contato com o admin para recebê-lo.
                </div>
                <form onSubmit={handleSendCode} className="space-y-4">
                  <input
                    type="email" placeholder="seu@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} autoFocus
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#050a0a', border: '1px solid #18211c', color: '#e8edea' }}
                    onFocus={e => e.target.style.borderColor = '#22c55e'}
                    onBlur={e => e.target.style.borderColor = '#18211c'}
                  />
                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
                    {loading ? <><Loader2 size={15} className="animate-spin" /> Enviando...</> : <>Enviar código <ArrowRight size={15} /></>}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* STEP 2 — Código */}
            {step === 'code' && (
              <motion.div key="code" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-6 mx-auto"
                  style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.22)' }}>
                  <KeyRound size={26} style={{ color: '#22c55e' }} />
                </div>
                <h1 className="text-xl font-black text-center mb-1" style={{ color: '#e8edea' }}>Digite o código</h1>
                <p className="text-sm text-center mb-1" style={{ color: '#8a9a90' }}>
                  Enviamos um código de 6 dígitos para
                </p>
                <p className="text-sm text-center font-semibold mb-6" style={{ color: '#22c55e' }}>{email}</p>
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <input
                    type="text" placeholder="000000" value={code} maxLength={6}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))} autoFocus
                    className="w-full px-4 py-4 rounded-xl text-3xl font-black tracking-widest text-center outline-none transition-all"
                    style={{ background: '#050a0a', border: '1px solid #18211c', color: '#22c55e', fontFamily: 'monospace' }}
                    onFocus={e => e.target.style.borderColor = '#22c55e'}
                    onBlur={e => e.target.style.borderColor = '#18211c'}
                  />
                  <motion.button type="submit" disabled={loading || code.length !== 6}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
                    {loading ? <><Loader2 size={15} className="animate-spin" /> Verificando...</> : <>Verificar código <ArrowRight size={15} /></>}
                  </motion.button>
                  <button type="button" onClick={handleResend} disabled={loading || resendCooldown > 0}
                    className="w-full text-sm flex items-center justify-center gap-1.5 py-2 transition-colors disabled:opacity-50"
                    style={{ color: resendCooldown > 0 ? '#4a5650' : '#22c55e' }}>
                    {resendCooldown > 0 ? `Reenviar código em ${resendCooldown}s` : 'Não recebi — reenviar código'}
                  </button>
                  <button type="button" onClick={() => setStep('email')}
                    className="w-full text-sm flex items-center justify-center gap-1.5 py-2 transition-colors"
                    style={{ color: '#4a5650' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#8a9a90')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4a5650')}>
                    <ArrowLeft size={13} /> Tentar outro e-mail
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 3 — Nova senha */}
            {step === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="flex items-center justify-center w-14 h-14 rounded-2xl mb-6 mx-auto"
                  style={{ background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.22)' }}>
                  <Lock size={26} style={{ color: '#22c55e' }} />
                </div>
                <h1 className="text-xl font-black text-center mb-1" style={{ color: '#e8edea' }}>Nova senha</h1>
                <p className="text-sm text-center mb-6" style={{ color: '#8a9a90' }}>
                  Escolha uma senha forte com ao menos 6 caracteres
                </p>
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'} placeholder="Nova senha" value={newPassword}
                      onChange={e => setNewPassword(e.target.value)} autoFocus
                      className="w-full px-4 py-3 pr-10 rounded-xl text-sm outline-none transition-all"
                      style={{ background: '#050a0a', border: '1px solid #18211c', color: '#e8edea' }}
                      onFocus={e => e.target.style.borderColor = '#22c55e'}
                      onBlur={e => e.target.style.borderColor = '#18211c'}
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: '#4a5650' }}>
                      {showPw
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>}
                    </button>
                  </div>

                  {/* Força da senha */}
                  {newPassword && (
                    <div className="space-y-1 px-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all"
                            style={{ background: i <= (newPassword.length >= 10 ? 4 : newPassword.length >= 8 ? 3 : newPassword.length >= 6 ? 2 : 1)
                              ? (newPassword.length >= 10 ? '#22c55e' : newPassword.length >= 8 ? '#3b82f6' : '#f59e0b')
                              : '#18211c' }} />
                        ))}
                      </div>
                      <p className="text-xs" style={{ color: '#4a5650' }}>
                        {newPassword.length < 6 ? 'Muito curta' : newPassword.length < 8 ? 'Fraca' : newPassword.length < 10 ? 'Boa' : 'Forte ✓'}
                      </p>
                    </div>
                  )}

                  <input
                    type="password" placeholder="Confirmar nova senha" value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: '#050a0a',
                      border: `1px solid ${confirm && confirm !== newPassword ? '#ef4444' : '#18211c'}`,
                      color: '#e8edea'
                    }}
                    onFocus={e => e.target.style.borderColor = confirm !== newPassword ? '#ef4444' : '#22c55e'}
                    onBlur={e => e.target.style.borderColor = confirm && confirm !== newPassword ? '#ef4444' : '#18211c'}
                  />
                  {confirm && confirm !== newPassword && (
                    <p className="text-xs px-1" style={{ color: '#ef4444' }}>As senhas não coincidem</p>
                  )}

                  <motion.button type="submit" disabled={loading || newPassword.length < 6 || newPassword !== confirm}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60 mt-2"
                    style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
                    {loading ? <><Loader2 size={15} className="animate-spin" /> Salvando...</> : <>Redefinir senha <ArrowRight size={15} /></>}
                  </motion.button>
                </form>
              </motion.div>
            )}

            {/* STEP 4 — Sucesso */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="flex items-center justify-center w-20 h-20 rounded-full mx-auto mb-6"
                  style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e' }}>
                  <CheckCircle2 size={40} style={{ color: '#22c55e' }} />
                </motion.div>
                <h1 className="text-xl font-black mb-2" style={{ color: '#e8edea' }}>Senha redefinida!</h1>
                <p className="text-sm mb-8" style={{ color: '#8a9a90' }}>
                  Sua senha foi alterada com sucesso. Agora você pode fazer login.
                </p>
                <motion.button onClick={() => router.replace('/login')}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm"
                  style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
                  Ir para o login <ArrowRight size={15} />
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Voltar ao login */}
          {step !== 'done' && (
            <button onClick={() => router.push('/login')}
              className="mt-6 w-full text-sm flex items-center justify-center gap-1.5 py-2 transition-colors"
              style={{ color: '#4a5650' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#8a9a90')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4a5650')}>
              <ArrowLeft size={13} /> Voltar ao login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
