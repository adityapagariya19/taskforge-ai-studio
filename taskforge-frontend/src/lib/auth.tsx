import { createContext, useContext, useState, ReactNode } from 'react';
import { api } from './api';

interface AuthUser { id: string; email: string; fullName: string }
interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResponse { accessToken: string; userId: string; email: string; fullName: string }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const id = localStorage.getItem('tf_user_id');
    const email = localStorage.getItem('tf_user_email');
    const fullName = localStorage.getItem('tf_user_name');
    return id && email && fullName ? { id, email, fullName } : null;
  });

  function persist(res: AuthResponse) {
    localStorage.setItem('tf_token', res.accessToken);
    localStorage.setItem('tf_user_id', res.userId);
    localStorage.setItem('tf_user_email', res.email);
    localStorage.setItem('tf_user_name', res.fullName);
    setUser({ id: res.userId, email: res.email, fullName: res.fullName });
  }

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    persist(res);
  }

  async function register(email: string, password: string, fullName: string) {
    const res = await api.post<AuthResponse>('/auth/register', { email, password, fullName });
    persist(res);
  }

  function logout() {
    localStorage.clear();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
