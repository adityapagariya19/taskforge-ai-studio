import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useDemo } from '../lib/demo';

export default function RegisterPage() {
  const { register } = useAuth();
  const { enter } = useDemo();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName.trim() || !email.trim() || !password) { setError('All fields required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError(null); setConnectionFailed(false);
    try {
      await register(email, password, fullName);
      navigate('/dashboard');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Registration failed';
      const isNetworkFailure = e instanceof TypeError || /failed to fetch|network/i.test(message);
      if (isNetworkFailure) {
        setConnectionFailed(true);
        setError('No backend is available for this deployment.');
      } else {
        setError(message);
      }
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)', color: 'var(--text-1)' }}>
      <div className="w-full max-w-[380px] animate-fade-in">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,var(--primary) 0%,#8B5CF6 100%)' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 10L7 4L12 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span className="font-semibold">TaskForge</span>
        </div>

        <h1 className="text-2xl font-semibold mb-1.5">Create your account</h1>
        <p className="text-[13px] mb-7" style={{ color: 'var(--text-3)' }}>Start collaborating with your AI team today</p>

        <button onClick={() => { enter(); navigate('/dashboard'); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl mb-5 text-[13px] font-medium"
                style={{ background: 'var(--ai-muted)', border: '1px solid rgba(34,211,238,0.2)', color: 'var(--ai)' }}>
          Try demo instead — no signup needed
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }}/>
          <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>create account</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-default)' }}/>
        </div>

        <div className="mb-3">
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Full name</label>
          <input className="input" placeholder="Alex Rivera" value={fullName} onChange={e => setFullName(e.target.value)} autoComplete="name"/>
        </div>
        <div className="mb-3">
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Work email</label>
          <input className="input" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email"/>
        </div>
        <div className="mb-5">
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Password</label>
          <input className="input" type="password" placeholder="Min. 8 characters" value={password}
                 onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} autoComplete="new-password"/>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-lg text-[12px]" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
            {error}
            {connectionFailed && (
              <button onClick={() => { enter(); navigate('/dashboard'); }}
                      className="block mt-2 text-[12px] font-semibold underline"
                      style={{ color: '#FCA5A5' }}>
                Continue in demo mode instead →
              </button>
            )}
          </div>
        )}

        <button onClick={handleRegister} disabled={loading} className="btn btn-primary w-full py-2.5 text-[14px] justify-center">
          {loading ? 'Creating account…' : 'Create free account'}
        </button>

        <p className="text-center text-[13px] mt-5" style={{ color: 'var(--text-3)' }}>
          Already have an account? <Link to="/login" className="font-medium" style={{ color: 'var(--primary)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
