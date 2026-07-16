import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useOrganization } from '../lib/organization';
import { JoinRequest } from '../types';
import TopBar from '../components/TopBar';

export default function JoinRequestsPage() {
  const { activeOrganizationId } = useOrganization();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const load = useCallback(async () => {
    if (!activeOrganizationId) return;
    setLoading(true); setError(null);
    try {
      const data = await api.get<JoinRequest[]>(`/organizations/${activeOrganizationId}/join-requests`);
      setRequests(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load requests');
    } finally { setLoading(false); }
  }, [activeOrganizationId]);

  useEffect(() => { load(); }, [load]);

  async function approve(requestId: string) {
    setActioning(requestId);
    try {
      await api.post(`/organizations/${activeOrganizationId}/join-requests/${requestId}/approve`);
      load();
    } finally { setActioning(null); }
  }

  async function reject(requestId: string) {
    setActioning(requestId);
    try {
      await api.post(`/organizations/${activeOrganizationId}/join-requests/${requestId}/reject`, { reviewNote: rejectNote || null });
      setRejectingId(null); setRejectNote('');
      load();
    } finally { setActioning(null); }
  }

  const pending = requests.filter(r => r.status === 'PENDING');
  const reviewed = requests.filter(r => r.status !== 'PENDING');

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <TopBar projectName="Join Requests" />
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-6">
        <h1 className="text-xl font-semibold mb-1">Join requests</h1>
        <p className="text-[13px] mb-6" style={{ color: 'var(--text-3)' }}>
          Review employees requesting to join your organization.
        </p>

        {loading && <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}</div>}
        {error && <div className="text-[13px] p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>{error}</div>}

        {!loading && !error && (
          <>
            {pending.length === 0 ? (
              <div className="card p-10 text-center">
                <div className="text-[24px] mb-2 opacity-40">✓</div>
                <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>No pending requests.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-8">
                {pending.map(req => (
                  <div key={req.id} className="card p-4 animate-fade-in">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-[13px] font-medium">Requesting role: {req.requestedRoleCode}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-4)' }}>
                          {new Date(req.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span className="badge text-[10px]" style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>PENDING</span>
                    </div>
                    {req.message && (
                      <p className="text-[12px] mb-3 p-2.5 rounded-lg" style={{ background: 'var(--bg-subtle)', color: 'var(--text-2)' }}>
                        "{req.message}"
                      </p>
                    )}
                    {rejectingId === req.id ? (
                      <div className="flex gap-2">
                        <input className="input flex-1 text-[12px]" placeholder="Optional reason…" value={rejectNote}
                               onChange={e => setRejectNote(e.target.value)} />
                        <button onClick={() => reject(req.id)} disabled={actioning === req.id} className="btn btn-danger text-[12px]">Confirm reject</button>
                        <button onClick={() => setRejectingId(null)} className="btn btn-ghost text-[12px]">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => approve(req.id)} disabled={actioning === req.id}
                                className="btn btn-primary text-[12px] py-1.5">
                          {actioning === req.id ? 'Approving…' : 'Approve'}
                        </button>
                        <button onClick={() => setRejectingId(req.id)} className="btn btn-outline text-[12px] py-1.5">Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {reviewed.length > 0 && (
              <details>
                <summary className="text-[13px] font-medium cursor-pointer" style={{ color: 'var(--text-3)' }}>
                  Reviewed ({reviewed.length})
                </summary>
                <div className="mt-3 space-y-2">
                  {reviewed.map(req => (
                    <div key={req.id} className="flex items-center justify-between px-4 py-2.5 rounded-lg"
                         style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                      <span className="text-[12px]" style={{ color: 'var(--text-3)' }}>{req.requestedRoleCode}</span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                            style={{ background: req.status === 'APPROVED' ? 'rgba(34,197,94,0.12)' : 'var(--bg-subtle)',
                                     color: req.status === 'APPROVED' ? '#22C55E' : 'var(--text-4)' }}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}
