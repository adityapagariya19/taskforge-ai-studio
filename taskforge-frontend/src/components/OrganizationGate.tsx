import { useEffect, useState } from 'react';
import { useOrganization } from '../lib/organization';
import { useDemo } from '../lib/demo';

/**
 * Sits between login and the rest of the app. All hooks are called
 * unconditionally at the top (React's rules of hooks) — the demo-mode
 * bypass is a conditional *inside* the effect and a conditional *render*,
 * never a conditional hook call. This was the actual cause of the runtime
 * crash: an earlier version returned early before calling useEffect,
 * which throws "Rendered fewer hooks than expected on a subsequent render."
 */
export default function OrganizationGate({ children }: { children: React.ReactNode }) {
  const { organizations, activeOrganizationId, loading, error: orgError, createOrganization, activate } = useOrganization();
  const { isDemo, enter } = useDemo();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [autoActivating, setAutoActivating] = useState(false);

  useEffect(() => {
    if (isDemo) return;
    if (!loading && !activeOrganizationId && organizations.length === 1 && !autoActivating) {
      setAutoActivating(true);
      activate(organizations[0].id).catch(e => setError(e instanceof Error ? e.message : 'Activation failed'));
    }
  }, [isDemo, loading, activeOrganizationId, organizations, activate, autoActivating]);

  if (isDemo) return <>{children}</>;

  if (orgError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
        <div className="card w-full max-w-sm p-6 text-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
               style={{ background: 'rgba(239,68,68,0.1)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M10.3 3.86l-8.2 14.14A1.5 1.5 0 0 0 3.5 20h17a1.5 1.5 0 0 0 1.4-2L13.7 3.86a1.5 1.5 0 0 0-2.6 0z"/>
            </svg>
          </div>
          <h1 className="text-[15px] font-semibold mb-1.5">Can't reach the server</h1>
          <p className="text-[13px] mb-5" style={{ color: 'var(--text-3)' }}>
            No backend is running for this deployment. You can still explore the full product with sample data.
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={() => enter()} className="btn btn-primary justify-center text-[13px] py-2.5">
              Continue in demo mode
            </button>
            <button onClick={() => window.location.reload()} className="btn btn-ghost justify-center text-[13px]">
              Retry connection instead
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading || autoActivating) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>Loading your workspace…</p>
      </div>
    );
  }

  if (activeOrganizationId) return <>{children}</>;

  if (organizations.length > 1) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
        <div className="card w-full max-w-sm p-6 animate-scale-in">
          <h1 className="text-lg font-semibold mb-4">Choose an organization</h1>
          {organizations.map(org => (
            <button key={org.id} onClick={() => activate(org.id).catch(e => setError(e instanceof Error ? e.message : 'Failed'))}
                    className="w-full text-left px-4 py-3 mb-2 rounded-xl transition-all text-[13px] font-medium"
                    style={{ border: '1px solid var(--border-default)', color: 'var(--text-1)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-default)')}>
              {org.name}
            </button>
          ))}
          {error && <p className="text-[12px] mt-2" style={{ color: 'var(--danger)' }}>{error}</p>}
        </div>
      </div>
    );
  }

  async function submit() {
    if (!name.trim()) { setError('Organization name is required'); return; }
    setCreating(true); setError(null);
    try {
      const org = await createOrganization(name);
      await activate(org.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create organization');
    } finally { setCreating(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base)' }}>
      <div className="card w-full max-w-sm p-6 animate-scale-in">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
             style={{ background: 'linear-gradient(135deg,var(--primary) 0%,#8B5CF6 100%)' }}>
          <svg width="18" height="18" viewBox="0 0 14 14" fill="none"><path d="M2 10L7 4L12 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 className="text-lg font-semibold mb-1">Create your organization</h1>
        <p className="text-[13px] mb-5" style={{ color: 'var(--text-3)' }}>Your workspace, projects, and AI teammates live inside it.</p>
        <input className="input mb-4" placeholder="e.g. Acme Engineering" value={name}
               onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} />
        {error && <p className="text-[12px] mb-3" style={{ color: 'var(--danger)' }}>{error}</p>}
        <button onClick={submit} disabled={creating} className="btn btn-primary w-full py-2.5 justify-center text-[13px]">
          {creating ? 'Creating…' : 'Create organization'}
        </button>
      </div>
    </div>
  );
}
