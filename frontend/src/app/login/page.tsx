'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';
import { ArrowRight, Loader2, CheckSquare, Square, ChevronLeft } from 'lucide-react';
import { getRememberedUser, clearRememberedUser, type RememberedUser } from '@/stores/auth.store';
import Image from 'next/image';

// ─── Floating Icon Card ────────────────────────────────────────────────────
function FloatingIcon({
  src, alt, x, y, delay = 0, size = 56,
}: {
  src: string; alt: string; x: string; y: string; delay?: number; size?: number;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 4 + delay, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          width: size, height: size,
          background: 'rgba(15, 30, 80, 0.7)',
          border: '1px solid rgba(80, 160, 255, 0.35)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px rgba(30, 100, 255, 0.18)',
        }}
      >
        {/* SVG icons inline */}
        {alt === 'shield' && (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6L12 2z" fill="none" stroke="#60a5fa" strokeWidth="1.8" />
            <path d="M9 12l2 2 4-4" stroke="#60a5fa" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
        {alt === 'person' && (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="#93c5fd" strokeWidth="1.8" />
            <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="#93c5fd" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
        {alt === 'chart' && (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="12" width="4" height="9" rx="1" fill="#60a5fa" opacity="0.5" />
            <rect x="10" y="7" width="4" height="14" rx="1" fill="#60a5fa" opacity="0.75" />
            <rect x="17" y="3" width="4" height="18" rx="1" fill="#60a5fa" />
          </svg>
        )}
        {alt === 'lock' && (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="5" y="11" width="14" height="10" rx="2" stroke="#93c5fd" strokeWidth="1.8" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#93c5fd" strokeWidth="1.8" />
            <circle cx="12" cy="16" r="1.5" fill="#93c5fd" />
          </svg>
        )}
      </div>
    </motion.div>
  );
}

// ─── Particle background ────────────────────────────────────────────────────
function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d')!;
    c.width = window.innerWidth; c.height = window.innerHeight;

    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.4, a: Math.random() * 0.4 + 0.1,
    }));

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = c.width; if (p.x > c.width) p.x = 0;
        if (p.y < 0) p.y = c.height; if (p.y > c.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96,165,250,${p.a})`; ctx.fill();
      });
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(96,165,250,${0.12 * (1 - d / 100)})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      raf = requestAnimationFrame(draw);
    };
    draw();
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

// ─── Social Button ──────────────────────────────────────────────────────────
function SocialButton({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 bg-white hover:bg-gray-50 transition-all"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      {icon}
      {label}
    </motion.button>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);

  // Login rápido — usuário que logou antes
  const [remembered, setRemembered] = useState<RememberedUser | null>(null);
  const [quickMode, setQuickMode] = useState(false); // true = só senha

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPw, setShowRegPw] = useState(false);

  // Mouse tracking for mascot 3D tilt
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateY = useSpring(useTransform(mouseX, [-1, 1], [-18, 18]), { stiffness: 80, damping: 18 });
  const rotateX = useSpring(useTransform(mouseY, [-1, 1], [12, -12]), { stiffness: 80, damping: 18 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set((clientX / innerWidth - 0.5) * 2);
    mouseY.set((clientY / innerHeight - 0.5) * 2);
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (isAuthenticated) { router.replace('/dashboard'); return; }
    const r = getRememberedUser();
    if (r) { setRemembered(r); setQuickMode(true); setEmail(r.email); }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const loginEmail = quickMode ? (remembered?.email ?? email) : email;
    if (!loginEmail || !password) { toast.error('Preencha e-mail e senha'); return; }
    setLoading(true);
    try {
      await login(loginEmail, password, true);
      toast.success(`Bem-vindo de volta${remembered ? ', ' + remembered.name.split(' ')[0] : ''}!`);
      router.replace('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Senha incorreta');
    } finally {
      setLoading(false);
    }
  };

  function handleSwitchAccount() {
    clearRememberedUser();
    setRemembered(null);
    setQuickMode(false);
    setEmail('');
    setPassword('');
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regConfirm) {
      toast.error('Preencha todos os campos'); return;
    }
    if (regPassword !== regConfirm) {
      toast.error('As senhas não coincidem'); return;
    }
    if (regPassword.length < 6) {
      toast.error('A senha deve ter ao menos 6 caracteres'); return;
    }
    setLoading(true);
    try {
      const { api } = await import('@/lib/api');
      const { data } = await api.post('/auth/register', {
        name: regName, email: regEmail, password: regPassword,
      });
      await login(regEmail, regPassword, true);
      toast.success(`Conta criada! Bem-vindo, ${data.user.name}!`);
      router.replace('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden relative"
      style={{ background: 'radial-gradient(ellipse at 25% 60%, #0a1840 0%, #050c20 45%, #030810 100%)' }}
      onMouseMove={handleMouseMove}
    >
      <Particles />

      {/* Ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)' }} />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)' }} />

      {/* ── OUTER PANEL — neon border curved card ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 flex rounded-[2.5rem] overflow-hidden"
        style={{
          width: 'min(960px, 95vw)',
          minHeight: 540,
          boxShadow: '0 0 0 2px rgba(60,140,255,0.5), 0 0 60px rgba(37,99,235,0.35), 0 0 120px rgba(37,99,235,0.15)',
          perspective: 1200,
        }}
      >

        {/* ── LEFT: Mascot panel ────────────────────────────────────────── */}
        <div
          className="relative flex-1 flex items-center justify-center overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0d1f5c 0%, #071030 50%, #050c20 100%)',
            minWidth: '52%',
          }}
        >
          {/* Grid lines subtle */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(96,165,250,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(96,165,250,0.4) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Floating icons */}
          <FloatingIcon alt="shield" x="6%"  y="10%" delay={0}   size={58} src="" />
          <FloatingIcon alt="person" x="74%" y="8%"  delay={1.2} size={54} src="" />
          <FloatingIcon alt="chart"  x="4%"  y="65%" delay={0.6} size={52} src="" />
          <FloatingIcon alt="lock"   x="76%" y="62%" delay={1.8} size={52} src="" />

          {/* Mascot with 3D tilt — centralizado vertical e horizontal */}
          <motion.div
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 1000 }}
            className="relative z-10 select-none flex items-center justify-center"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="relative" style={{ width: 380, height: 460 }}>
              <Image
                src="/mascote.png"
                alt="Mascote MADM"
                fill
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center center',
                  filter: 'drop-shadow(0 24px 48px rgba(37,99,235,0.55)) drop-shadow(0 0 80px rgba(34,197,94,0.15))',
                }}
                priority
              />
            </div>
          </motion.div>

          {/* Bottom reflection */}
          <div className="absolute bottom-0 left-0 right-0 h-20"
            style={{ background: 'linear-gradient(to top, rgba(5,12,32,0.9), transparent)' }} />
        </div>

        {/* ── RIGHT: Form panel ─────────────────────────────────────────── */}
        <div
          className="flex flex-col justify-center px-10 py-8"
          style={{ background: 'rgba(245,247,255,0.97)', minWidth: '48%', maxWidth: 430 }}
        >
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'radial-gradient(circle at 40% 40%, #1a3a8a, #0d1f5c)', boxShadow: '0 4px 20px rgba(13,31,92,0.4)', border: '3px solid #1a4dcc' }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V6L12 2z" fill="#22c55e" opacity="0.9"/>
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6 gap-1" style={{ background: '#e8eaf0' }}>
            {(['login', 'register'] as const).map((tab) => (
              <motion.button
                key={tab}
                type="button"
                onClick={() => setMode(tab)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors"
                animate={{ background: mode === tab ? '#ffffff' : 'transparent', color: mode === tab ? '#1d4ed8' : '#6b7280' }}
                style={{ boxShadow: mode === tab ? '0 1px 6px rgba(0,0,0,0.1)' : 'none' }}
              >
                {tab === 'login' ? 'Entrar' : 'Criar conta'}
              </motion.button>
            ))}
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              {/* ── QUICK LOGIN: avatar + nome + só senha ── */}
              {quickMode && remembered ? (
                <>
                  {/* Card do usuário */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl border border-blue-100"
                    style={{ background: '#f0f4ff' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
                      {remembered.name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate" style={{ color: '#0f172a' }}>{remembered.name}</p>
                      <p className="text-xs truncate" style={{ color: '#64748b' }}>
                        {remembered.email.replace(/(.{2}).+(@.+)/, '$1***$2')}
                      </p>
                    </div>
                    <button type="button" onClick={handleSwitchAccount}
                      className="text-xs font-medium px-2 py-1 rounded-lg transition-colors hover:bg-blue-100"
                      style={{ color: '#2563eb' }}>
                      Trocar
                    </button>
                  </div>

                  {/* Só senha */}
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="#9ca3af" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#9ca3af" strokeWidth="1.8"/></svg>
                    </div>
                    <input type={showPw ? 'text' : 'password'} placeholder="Digite sua senha" value={password}
                      onChange={e => setPassword(e.target.value)} autoFocus
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw
                        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        : <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9ca3af" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="1.8"/></svg>}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Email */}
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#9ca3af" strokeWidth="1.8"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    </div>
                    <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      autoComplete="email" />
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="#9ca3af" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#9ca3af" strokeWidth="1.8"/></svg>
                    </div>
                    <input type={showPw ? 'text' : 'password'} placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw
                        ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/></svg>
                        : <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9ca3af" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="1.8"/></svg>}
                    </button>
                  </div>

                  {/* Remember + Forgot */}
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => setRemember(!remember)} className="flex items-center gap-2 text-sm text-gray-600">
                      {remember ? <CheckSquare size={15} className="text-blue-600"/> : <Square size={15} className="text-gray-400"/>}
                      Lembrar-me
                    </button>
                    <a href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">Esqueci minha senha</a>
                  </div>
                </>
              )}

              {/* Submit */}
              <motion.button type="submit" disabled={loading}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(37,99,235,0.4)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 60%, #22c55e 100%)', boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}
              >
                {loading ? <><Loader2 size={15} className="animate-spin"/> Autenticando...</> : <>Entrar no sistema <ArrowRight size={15}/></>}
              </motion.button>

              {/* Divider + Social */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-gray-200"/>
                <span className="text-xs text-gray-400">ou continue com</span>
                <div className="flex-1 h-px bg-gray-200"/>
              </div>
              <div className="flex gap-3">
                <SocialButton label="Google" icon={<svg width="17" height="17" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>} />
                <SocialButton label="Microsoft" icon={<svg width="17" height="17" viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>} />
              </div>
            </motion.form>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === 'register' && (
            <motion.form
              key="register"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleRegister}
              className="space-y-3.5"
            >
              {/* Nome */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#9ca3af" strokeWidth="1.8"/><path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/></svg>
                </div>
                <input type="text" placeholder="Seu nome completo" value={regName} onChange={e => setRegName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  autoComplete="name" />
              </div>

              {/* Email */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="#9ca3af" strokeWidth="1.8"/><path d="M2 7l10 7 10-7" stroke="#9ca3af" strokeWidth="1.8"/></svg>
                </div>
                <input type="email" placeholder="E-mail corporativo" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  autoComplete="email" />
              </div>

              {/* Senha */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="10" rx="2" stroke="#9ca3af" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#9ca3af" strokeWidth="1.8"/></svg>
                </div>
                <input type={showRegPw ? 'text' : 'password'} placeholder="Criar senha (mín. 6 caracteres)" value={regPassword} onChange={e => setRegPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
                <button type="button" onClick={() => setShowRegPw(!showRegPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showRegPw
                    ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/></svg>
                    : <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9ca3af" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="1.8"/></svg>}
                </button>
              </div>

              {/* Confirmar senha */}
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round"/><rect x="5" y="11" width="14" height="10" rx="2" stroke="#9ca3af" strokeWidth="1.8"/><path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="#9ca3af" strokeWidth="1.8"/></svg>
                </div>
                <input type="password" placeholder="Confirmar senha" value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 text-sm outline-none focus:ring-2 transition-all ${regConfirm && regConfirm !== regPassword ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'}`} />
                {regConfirm && regConfirm !== regPassword && (
                  <p className="text-red-500 text-xs mt-1 ml-1">As senhas não coincidem</p>
                )}
              </div>

              {/* Password strength */}
              {regPassword && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-all"
                        style={{ background: i <= (regPassword.length >= 10 ? 4 : regPassword.length >= 8 ? 3 : regPassword.length >= 6 ? 2 : 1) ? (regPassword.length >= 10 ? '#22c55e' : regPassword.length >= 8 ? '#3b82f6' : '#f59e0b') : '#e5e7eb' }} />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    {regPassword.length < 6 ? 'Muito curta' : regPassword.length < 8 ? 'Fraca' : regPassword.length < 10 ? 'Boa' : 'Forte ✓'}
                  </p>
                </div>
              )}

              {/* Submit */}
              <motion.button type="submit" disabled={loading || (!!regConfirm && regConfirm !== regPassword)}
                whileHover={{ scale: 1.02, boxShadow: '0 8px 30px rgba(34,197,94,0.35)' }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #22c55e 100%)', boxShadow: '0 4px 20px rgba(34,197,94,0.25)' }}
              >
                {loading ? <><Loader2 size={15} className="animate-spin"/> Criando conta...</> : <>Criar minha conta <ArrowRight size={15}/></>}
              </motion.button>

              <p className="text-center text-xs text-gray-400">
                O primeiro cadastro recebe acesso de{' '}
                <span className="font-semibold text-blue-600">Administrador</span>
              </p>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
