import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useDemo } from '../lib/demo';

export default function LoginPage() {
  const { login } = useAuth();
  const { enter } = useDemo();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Email and password are required'); return; }
    setLoading(true); setError(null); setConnectionFailed(false);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign in failed';
      // "Failed to fetch" / TypeError is what a genuinely unreachable backend
      // throws (e.g. this frontend deployed alone on Vercel, no backend at
      // all) — distinct from a real 401 "invalid credentials" response.
      const isNetworkFailure = e instanceof TypeError || /failed to fetch|network/i.test(message);
      if (isNetworkFailure) {
        setConnectionFailed(true);
        setError('No backend is available for this deployment.');
      } else {
        setError(message);
      }
    } finally { setLoading(false); }
  }

  function handleDemo() { enter(); navigate('/dashboard'); }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)', color: 'var(--text-1)' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-10 relative overflow-hidden"
           style={{ background: 'linear-gradient(155deg,#0D0D1A 0%,#0A0A14 100%)', borderRight:'1px solid var(--border-subtle)' }}>
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position:'absolute', top:'10%', left:'15%', width:400, height:400, background:'radial-gradient(circle,rgba(99,102,241,0.06) 0%,transparent 70%)', borderRadius:'50%' }}/>
        </div>
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'linear-gradient(135deg,var(--primary) 0%,#8B5CF6 100%)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2.5 11.5L8 4.5L13.5 11.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span className="text-base font-semibold">TaskForge</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-semibold leading-tight mb-4">Your AI team<br/><span className="text-gradient-primary">never sleeps.</span></h2>
          <p className="text-[14px] leading-relaxed mb-8" style={{ color:'var(--text-3)' }}>Six AI agents collaborate with your human team in real time — planning, coding, reviewing, and documenting.</p>
          <div className="space-y-3">
            {[
              { name:'ArchitectAI', action:'Created 5 subtasks for ACE-101', init:'AR', time:'2m' },
              { name:'TesterAI',    action:'Generated 4 test scenarios for ACE-104', init:'TS', time:'8m' },
              { name:'CodeAI',      action:'Posted lag compensation implementation', init:'CD', time:'15m' },
            ].map(item => (
              <div key={item.name} className="flex items-start gap-3 p-3 rounded-xl"
                   style={{ background:'rgba(255,255,255,0.03)', border:'1px solid var(--border-subtle)' }}>
                <div className="ai-ring flex-shrink-0" style={{ width:28, height:28 }}>
                  <div className="w-full h-full rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background:'var(--bg-surface)', color:'var(--ai)' }}>{item.init}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] font-medium" style={{ color:'var(--ai)' }}>{item.name}</span>
                  <p className="text-[12px] truncate" style={{ color:'var(--text-3)' }}>{item.action}</p>
                </div>
                <span className="text-[11px] flex-shrink-0" style={{ color:'var(--text-4)' }}>{item.time} ago</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-[12px]" style={{ color:'var(--text-4)' }}>© 2026 TaskForge AI Studio</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[380px] animate-fade-in">
          <h1 className="text-2xl font-semibold mb-1.5">Welcome back</h1>
          <p className="text-[13px] mb-7" style={{ color:'var(--text-3)' }}>Sign in to your workspace</p>

          {/* Demo CTA */}
          <button onClick={handleDemo} className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl mb-5 text-[13px] font-medium transition-all"
                  style={{ background:'linear-gradient(135deg,var(--primary-muted),var(--ai-muted))', border:'1px solid rgba(99,102,241,0.3)', color:'var(--text-1)' }}>
            <div className="ai-ring" style={{ width:18, height:18 }}>
              <div className="w-full h-full rounded-full flex items-center justify-center text-[7px] font-bold" style={{ background:'var(--bg-surface)', color:'var(--ai)' }}>AI</div>
            </div>
            Try live demo — no account needed
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background:'var(--border-default)' }}/>
            <span className="text-[11px]" style={{ color:'var(--text-4)' }}>or continue with email</span>
            <div className="flex-1 h-px" style={{ background:'var(--border-default)' }}/>
          </div>

          <div className="mb-3">
            <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text-2)' }}>Email</label>
            <input className="input" type="email" placeholder="you@company.com" value={email}
                   onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoComplete="email"/>
          </div>
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[12px] font-medium" style={{ color:'var(--text-2)' }}>Password</label>
              <a href="#" className="text-[11px]" style={{ color:'var(--text-3)' }}>Forgot?</a>
            </div>
            <div className="relative">
              <input className="input pr-10" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password}
                     onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} autoComplete="current-password"/>
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]" style={{ color:'var(--text-3)' }}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-lg text-[12px]" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#FCA5A5' }}>
              {error}
              {connectionFailed && (
                <button onClick={handleDemo}
                        className="block mt-2 text-[12px] font-semibold underline"
                        style={{ color: '#FCA5A5' }}>
                  Continue in demo mode instead →
                </button>
              )}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading} className="btn btn-primary w-full py-2.5 text-[14px] justify-center">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <p className="text-center text-[13px] mt-5" style={{ color:'var(--text-3)' }}>
            No account? <Link to="/register" className="font-medium" style={{ color:'var(--primary)' }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
