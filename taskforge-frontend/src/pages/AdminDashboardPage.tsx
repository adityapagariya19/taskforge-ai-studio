import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { OrgSummary, PlatformStats } from '../types';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [o, s] = await Promise.all([
        api.get<OrgSummary[]>('/admin/organizations'),
        api.get<PlatformStats>('/admin/stats'),
      ]);
      setOrgs(o); setStats(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('tf_admin_token')) { navigate('/admin/login'); return; }
    load();
  }, [load, navigate]);

  async function toggleStatus(org: OrgSummary) {
    setActioning(org.id);
    try {
      if (org.status === 'SUSPENDED') await api.post(`/admin/organizations/${org.id}/reactivate`);
      else await api.post(`/admin/organizations/${org.id}/suspend`, { reason: 'Suspended via admin panel' });
      await load();
    } finally { setActioning(null); }
  }

  function logout() {
    localStorage.removeItem('tf_admin_token');
    localStorage.removeItem('tf_admin_name');
    localStorage.removeItem('tf_demo_admin');
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen" style={{ background: '#050507', color: 'var(--text-1)' }}>
      {/* Admin top bar — visually distinct dark chrome, unmistakably a different surface from the org app */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid #1F1F23' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: '#27272A', border: '1px solid #3F3F46' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z"/></svg>
          </div>
          <span className="font-semibold text-[13px]" style={{ color: 'var(--text-2)' }}>Platform Admin</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.1)', color: '#F87171' }}>
            Restricted access
          </span>
        </div>
        <button onClick={logout} className="text-[12px]" style={{ color: 'var(--text-4)' }}>Sign out</button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-[22px] font-semibold mb-1">Organizations</h1>
        <p className="text-[13px] mb-8" style={{ color: 'var(--text-4)' }}>Every tenant on the platform, in one place.</p>

        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
          </div>
        )}

        {error && <div className="text-[13px] p-4 rounded-xl mb-6" style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>{error}</div>}

        {!loading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <StatCard label="Organizations" value={stats.totalOrganizations} />
            <StatCard label="Active" value={stats.activeOrganizations} accent="#22C55E" />
            <StatCard label="Suspended" value={stats.suspendedOrganizations} accent="#EF4444" />
            <StatCard label="Human members" value={stats.totalHumanMembers} />
            <StatCard label="AI agents" value={stats.totalAiAgents} accent="#22D3EE" />
          </div>
        )}

        {!loading && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #1F1F23' }}>
            <table className="w-full text-[13px]">
              <thead>
                <tr style={{ background: '#0D0D0F', borderBottom: '1px solid #1F1F23' }}>
                  {['Organization', 'Join code', 'Plan', 'Members', 'AI agents', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-[11px] uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orgs.map((org, i) => (
                  <tr key={org.id} style={{ borderBottom: i < orgs.length - 1 ? '1px solid #1A1A1D' : 'none' }}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{org.name}</div>
                      <div className="text-[11px]" style={{ color: 'var(--text-4)' }}>{org.slug}</div>
                    </td>
                    <td className="px-4 py-3 mono text-[12px]" style={{ color: 'var(--text-3)' }}>{org.joinCode}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-subtle)', color: 'var(--text-2)' }}>{org.planTier}</span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--text-2)' }}>{org.memberCount}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--ai)' }}>{org.aiAgentCount}</td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                            style={{
                              background: org.status === 'ACTIVE' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                              color: org.status === 'ACTIVE' ? '#22C55E' : '#EF4444',
                            }}>
                        {org.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => toggleStatus(org)} disabled={actioning === org.id}
                              className="text-[12px] font-medium px-3 py-1 rounded-lg transition-all"
                              style={{ border: '1px solid #27272A', color: org.status === 'ACTIVE' ? '#F87171' : '#4ADE80' }}>
                        {actioning === org.id ? '…' : org.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="p-4 rounded-xl" style={{ background: '#0D0D0F', border: '1px solid #1F1F23' }}>
      <div className="text-2xl font-bold" style={{ color: accent || 'var(--text-1)' }}>{value}</div>
      <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-4)' }}>{label}</div>
    </div>
  );
}
