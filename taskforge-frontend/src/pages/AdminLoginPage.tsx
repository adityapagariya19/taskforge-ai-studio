import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { enterAdminDemo, isAdminDemoMode } from '../lib/demo';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Email and password required'); return; }
    setLoading(true); setError(null);
    try {
      if (isAdminDemoMode() || email === 'demo') {
        enterAdminDemo();
        navigate('/admin');
        return;
      }
      const res = await api.post<{ accessToken: string; adminId: string; fullName: string }>('/admin/auth/login', { email, password });
      localStorage.setItem('tf_admin_token', res.accessToken);
      localStorage.setItem('tf_admin_name', res.fullName);
      navigate('/admin');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally { setLoading(false); }
  }

  function handleDemoAdmin() {
    enterAdminDemo();
    navigate('/admin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#050507', color: 'var(--text-1)' }}>
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#27272A', border: '1px solid #3F3F46' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2">
              <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/>
            </svg>
          </div>
          <span className="font-semibold text-[14px]" style={{ color: 'var(--text-2)' }}>TaskForge · Platform Admin</span>
        </div>

        <h1 className="text-[19px] font-semibold mb-1.5">Administrator access</h1>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text-4)' }}>
          Restricted to platform administrators. This is a separate identity system from organization accounts.
        </p>

        <div className="mb-3">
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Admin email</label>
          <input className="input" type="email" placeholder="admin@taskforge.local" value={email}
                 onChange={e => setEmail(e.target.value)} autoComplete="off" />
        </div>
        <div className="mb-5">
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Password</label>
          <input className="input" type="password" placeholder="••••••••" value={password}
                 onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoComplete="off" />
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-lg text-[12px]" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={loading} className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white mb-3"
                style={{ background: '#27272A', border: '1px solid #3F3F46' }}>
          {loading ? 'Verifying…' : 'Sign in as administrator'}
        </button>

        <button onClick={handleDemoAdmin} className="w-full py-2.5 rounded-lg text-[13px] font-medium"
                style={{ background: 'transparent', border: '1px solid #27272A', color: 'var(--text-3)' }}>
          Explore admin panel demo
        </button>

        <p className="text-center text-[12px] mt-8" style={{ color: 'var(--text-4)' }}>
          <Link to="/" style={{ color: 'var(--text-4)' }}>← Back to TaskForge</Link>
        </p>
      </div>
    </div>
  );
}
