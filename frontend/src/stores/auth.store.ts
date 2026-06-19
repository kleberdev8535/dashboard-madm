import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  equipe?: string;
  unidade?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  initAuth: () => Promise<void>;
}

const TOKEN_KEY    = 'cip_token';
const REMEMBER_KEY = 'cip_remembered'; // guarda { name, email } para login rápido

export interface RememberedUser { name: string; email: string; avatar?: string }

export function getRememberedUser(): RememberedUser | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null'); } catch { return null; }
}

function saveRememberedUser(user: { name: string; email: string; avatar?: string }) {
  localStorage.setItem(REMEMBER_KEY, JSON.stringify({ name: user.name, email: user.email, avatar: user.avatar }));
}

export function clearRememberedUser() {
  localStorage.removeItem(REMEMBER_KEY);
}

function saveToken(token: string, remember: boolean) {
  if (remember) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY);
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY);
  }
}

function readToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  // Remove legacy key from previous versions
  localStorage.removeItem('cip_auth');
  localStorage.removeItem('cip_user');
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email, password, remember) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      saveToken(data.token, remember);
      saveRememberedUser(data.user); // salva nome+email para login rápido futuro
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    clearToken();
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user) => set({ user }),

  // Chamado no bootstrap do app — recupera sessão sem expor email em disco
  initAuth: async () => {
    const token = readToken();
    if (!token) { set({ isLoading: false }); return; }
    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const { data } = await api.get('/auth/me');
      saveRememberedUser(data);
      set({ user: data, token, isAuthenticated: true, isLoading: false });
    } catch {
      clearToken();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
