import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { JoinRequest } from '../types';

/**
 * The employee side of the join-by-code flow. Requires being logged in
 * (identity-only token is enough — no organization membership needed yet),
 * so an unauthenticated visitor is routed to register/login first with a
 * return path back here.
 */
export default function JoinOrgPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [roleCode, setRoleCode] = useState('DEVELOPER');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState<{ organizationName: string } | null>(null);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    if (!user) { setLoadingRequests(false); return; }
    api.get<JoinRequest[]>('/join-requests/mine')
      .then(setMyRequests)
      .catch(() => {})
      .finally(() => setLoadingRequests(false));
  }, [user]);

  async function submit() {
    if (!code.trim()) { setError('Enter your organization\'s join code'); return; }
    setLoading(true); setError(null);
    try {
      const res = await api.post<{ organizationId: string; organizationName: string; requestId: string; status: string }>(
        '/join-requests', { joinCode: code.trim().toUpperCase(), requestedRoleCode: roleCode, message: message || null }
      );
      setSubmitted({ organizationName: res.organizationName });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit request');
    } finally { setLoading(false); }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)', color: 'var(--text-1)' }}>
        <div className="card w-full max-w-sm p-6 text-center animate-fade-in">
          <h1 className="text-[16px] font-semibold mb-2">Sign in first</h1>
          <p className="text-[13px] mb-5" style={{ color: 'var(--text-3)' }}>
            Create an account or sign in, then come back to enter your organization's join code.
          </p>
          <Link to="/register" className="btn btn-primary w-full justify-center mb-2 text-[13px]">Create account</Link>
          <Link to="/login" className="btn btn-outline w-full justify-center text-[13px]">Sign in</Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)', color: 'var(--text-1)' }}>
        <div className="card w-full max-w-sm p-6 text-center animate-scale-in">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'rgba(245,158,11,0.1)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <h1 className="text-[16px] font-semibold mb-1.5">Request sent</h1>
          <p className="text-[13px] mb-5 leading-relaxed" style={{ color: 'var(--text-3)' }}>
            Your request to join <strong style={{ color: 'var(--text-1)' }}>{submitted.organizationName}</strong> is pending approval. You'll be notified once an admin reviews it.
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-outline w-full justify-center text-[13px]">Back to sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)', color: 'var(--text-1)' }}>
      <div className="w-full max-w-sm animate-fade-in">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
             style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #8B5CF6 100%)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <h1 className="text-[20px] font-semibold mb-1.5">Join your organization</h1>
        <p className="text-[13px] mb-6" style={{ color: 'var(--text-3)' }}>
          Ask your organization owner or admin for their unique join code.
        </p>

        <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Join code</label>
        <input className="input mb-4 mono uppercase tracking-widest text-center text-[15px]" style={{ letterSpacing: '0.15em' }}
               placeholder="XXXXXXXX" maxLength={12} value={code}
               onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && submit()} />

        <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Your role</label>
        <select className="input mb-4 text-[13px]" value={roleCode} onChange={e => setRoleCode(e.target.value)}>
          <option value="DEVELOPER">Developer</option>
          <option value="QA_ENGINEER">QA Engineer</option>
          <option value="DESIGNER">Designer</option>
          <option value="PRODUCT_MANAGER">Product Manager</option>
          <option value="ENGINEERING_MANAGER">Engineering Manager</option>
          <option value="GUEST">Guest</option>
        </select>

        <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Note to the admin (optional)</label>
        <input className="input mb-5 text-[13px]" placeholder="e.g. Referred by Jordan on the platform team"
               value={message} onChange={e => setMessage(e.target.value)} />

        {error && (
          <div className="mb-4 px-3 py-2.5 rounded-lg text-[12px]" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        <button onClick={submit} disabled={loading} className="btn btn-primary w-full py-2.5 justify-center text-[14px]">
          {loading ? 'Submitting…' : 'Request to join'}
        </button>

        {!loadingRequests && myRequests.length > 0 && (
          <div className="mt-8">
            <div className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--text-4)' }}>
              Your requests
            </div>
            {myRequests.map(r => (
              <div key={r.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg mb-1.5"
                   style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <span className="text-[12px]" style={{ color: 'var(--text-2)' }}>{r.requestedRoleCode}</span>
                <StatusPill status={r.status} />
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-[12px] mt-6" style={{ color: 'var(--text-4)' }}>
          Setting up a new organization instead? <Link to="/register" className="font-medium" style={{ color: 'var(--primary)' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    PENDING: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'Pending' },
    APPROVED: { bg: 'rgba(34,197,94,0.12)', color: '#22C55E', label: 'Approved' },
    REJECTED: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Rejected' },
    WITHDRAWN: { bg: 'var(--bg-subtle)', color: 'var(--text-4)', label: 'Withdrawn' },
  };
  const c = config[status] || config.PENDING;
  return <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>{c.label}</span>;
}
