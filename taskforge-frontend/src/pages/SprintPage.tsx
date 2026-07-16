import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Sprint, BurndownData, Issue, WorkflowStatus } from '../types';
import TopBar from '../components/TopBar';

export default function SprintPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [burndown, setBurndown] = useState<BurndownData | null>(null);
  const [backlog, setBacklog] = useState<Issue[]>([]);
  const [activeIssues, setActiveIssues] = useState<Issue[]>([]);
  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true); setError(null);
    try {
      const [allSprints, allIssues, allStatuses] = await Promise.all([
        api.get<Sprint[]>(`/projects/${projectId}/sprints`),
        api.get<Issue[]>(`/projects/${projectId}/issues`),
        api.get<WorkflowStatus[]>(`/projects/${projectId}/statuses`),
      ]);
      setSprints(allSprints);
      setStatuses(allStatuses);
      setBacklog(allIssues.filter(i => !i.sprintId));
      const active = allSprints.find(s => s.status === 'ACTIVE');
      if (active) {
        setActiveIssues(allIssues.filter(i => i.sprintId === active.id));
        api.get<BurndownData>(`/projects/${projectId}/sprints/${active.id}/burndown`).then(setBurndown).catch(() => {});
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  }, [projectId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function startSprint(id: string) {
    await api.post(`/projects/${projectId}/sprints/${id}/start`);
    loadAll();
  }
  async function completeSprint(id: string) {
    await api.post(`/projects/${projectId}/sprints/${id}/complete`, {});
    setCompleting(null); loadAll();
  }
  async function addToSprint(sprintId: string, issueId: string) {
    await api.post(`/projects/${projectId}/sprints/${sprintId}/issues`, { issueId });
    loadAll();
  }

  const activeSprint = sprints.find(s => s.status === 'ACTIVE');
  const plannedSprints = sprints.filter(s => s.status === 'PLANNED');
  const completedSprints = sprints.filter(s => s.status === 'COMPLETED');
  const daysLeft = activeSprint ? Math.max(0, Math.ceil((new Date(activeSprint.endDate).getTime() - Date.now()) / 86400000)) : 0;
  const progressPct = burndown && burndown.totalPoints > 0 ? Math.round(burndown.completedPoints / burndown.totalPoints * 100) : 0;

  const projectName = projectId ? `Project (${projectId.slice(0, 8)}…)` : 'Project';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <TopBar projectName={projectName} />

      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-6">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Sprint Planning</h1>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary text-[13px]">
            + New sprint
          </button>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
          </div>
        )}

        {error && <div className="text-[13px] p-4 rounded-xl" style={{ background:'rgba(239,68,68,0.1)', color:'#FCA5A5' }}>{error}</div>}

        {!loading && !error && (
          <div className="space-y-6">
            {/* Active sprint card */}
            {activeSprint && (
              <div className="rounded-2xl p-5 animate-fade-in"
                   style={{ background:'var(--bg-surface)', border:'1px solid rgba(99,102,241,0.25)', boxShadow:'0 0 0 1px rgba(99,102,241,0.08)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge text-[10px]" style={{ background:'rgba(34,211,238,0.15)', color:'var(--ai)', border:'1px solid rgba(34,211,238,0.25)' }}>
                        ● ACTIVE
                      </span>
                    </div>
                    <h2 className="text-[16px] font-semibold">{activeSprint.name}</h2>
                    {activeSprint.goal && <p className="text-[13px] mt-0.5" style={{ color:'var(--text-3)' }}>{activeSprint.goal}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{ color: daysLeft <= 2 ? 'var(--danger)' : 'var(--text-1)' }}>{daysLeft}</div>
                    <div className="text-[11px]" style={{ color:'var(--text-3)' }}>days left</div>
                  </div>
                </div>

                {burndown && (
                  <>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {[
                        { label:'Total pts', val: burndown.totalPoints },
                        { label:'Completed', val: burndown.completedPoints, accent: true },
                        { label:'Issues',    val: burndown.totalIssues },
                        { label:'Done',      val: burndown.completedIssues, accent: true },
                      ].map(({ label, val, accent }) => (
                        <div key={label} className="text-center p-3 rounded-xl" style={{ background:'var(--bg-elevated)' }}>
                          <div className="text-2xl font-bold" style={{ color: accent ? 'var(--ai)' : 'var(--text-1)' }}>{val}</div>
                          <div className="text-[11px] mt-0.5" style={{ color:'var(--text-3)' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mb-1 flex justify-between text-[11px]" style={{ color:'var(--text-3)' }}>
                      <span>Progress</span><span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full" style={{ background:'var(--bg-elevated)' }}>
                      <div className="h-2 rounded-full transition-all duration-500"
                           style={{ width:`${progressPct}%`, background:'linear-gradient(90deg,var(--primary),var(--ai))' }} />
                    </div>
                  </>
                )}

                {/* Active sprint issues */}
                {activeIssues.length > 0 && (
                  <div className="mt-4">
                    <div className="text-[12px] font-medium mb-2" style={{ color:'var(--text-3)' }}>
                      {activeIssues.length} issues in sprint
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {statuses.filter(s=>s.category!=='TODO'||s.position===1).sort((a,b)=>a.position-b.position).map(status => {
                        const sIssues = activeIssues.filter(i => i.statusId === status.id);
                        return sIssues.length > 0 ? (
                          <div key={status.id} className="flex-shrink-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background:status.color }} />
                              <span className="text-[11px]" style={{ color:'var(--text-3)' }}>{status.name} ({sIssues.length})</span>
                            </div>
                            {sIssues.slice(0,3).map(iss => (
                              <div key={iss.id} className="mb-1.5 px-2.5 py-1.5 rounded-lg text-[11px] truncate" style={{ maxWidth:180, background:'var(--bg-elevated)', border:'1px solid var(--border-subtle)', color:'var(--text-2)' }}>
                                <span className="mono text-[10px] mr-1.5" style={{ color:'var(--text-4)' }}>{iss.issueKey}</span>{iss.title}
                              </div>
                            ))}
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button onClick={() => setCompleting(activeSprint.id)} className="btn btn-outline text-[12px]">
                    Complete sprint
                  </button>
                </div>
              </div>
            )}

            {/* Planned sprints */}
            {plannedSprints.length > 0 && (
              <div>
                <h3 className="text-[13px] font-semibold mb-3" style={{ color:'var(--text-2)' }}>Planned</h3>
                {plannedSprints.map(sprint => (
                  <div key={sprint.id} className="card p-4 mb-3 animate-fade-in">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-[14px] font-medium">{sprint.name}</h4>
                        <div className="text-[12px] mt-0.5" style={{ color:'var(--text-3)' }}>
                          {sprint.startDate} → {sprint.endDate}
                        </div>
                        {sprint.goal && <p className="text-[12px] mt-1" style={{ color:'var(--text-3)' }}>{sprint.goal}</p>}
                      </div>
                      {!activeSprint && (
                        <button onClick={() => startSprint(sprint.id)} className="btn btn-primary text-[12px] py-1.5">
                          Start sprint
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Backlog */}
            <div>
              <h3 className="text-[13px] font-semibold mb-3" style={{ color:'var(--text-2)' }}>
                Backlog <span style={{ color:'var(--text-4)', fontWeight:400 }}>({backlog.length} issues)</span>
              </h3>
              <div className="card overflow-hidden">
                {backlog.length === 0
                  ? <div className="py-10 text-center text-[13px]" style={{ color:'var(--text-4)' }}>All issues are in a sprint ✓</div>
                  : backlog.map((issue, i) => (
                      <div key={issue.id} className="flex items-center justify-between px-4 py-3 transition-all"
                           style={{ borderBottom: i < backlog.length-1 ? '1px solid var(--border-subtle)' : 'none' }}
                           onMouseEnter={e => (e.currentTarget.style.background='var(--bg-subtle)')}
                           onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`priority-dot p-${issue.priority} flex-shrink-0`} />
                          <span className="mono text-[11px] flex-shrink-0" style={{ color:'var(--text-4)' }}>{issue.issueKey}</span>
                          <span className="text-[13px] truncate">{issue.title}</span>
                          {issue.storyPoints != null && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0" style={{ background:'var(--bg-elevated)', color:'var(--text-3)' }}>
                              {issue.storyPoints}sp
                            </span>
                          )}
                        </div>
                        {(plannedSprints.length > 0 || activeSprint) && (
                          <select onChange={e => e.target.value && addToSprint(e.target.value, issue.id)}
                                  className="text-[11px] rounded-lg px-2 py-1 ml-3 flex-shrink-0"
                                  style={{ background:'var(--bg-elevated)', border:'1px solid var(--border-default)', color:'var(--text-2)' }}
                                  defaultValue="">
                            <option value="">Add to sprint…</option>
                            {plannedSprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            {activeSprint && <option value={activeSprint.id}>{activeSprint.name} (active)</option>}
                          </select>
                        )}
                      </div>
                    ))}
              </div>
            </div>

            {/* Completed sprints */}
            {completedSprints.length > 0 && (
              <details>
                <summary className="text-[13px] cursor-pointer font-medium" style={{ color:'var(--text-3)' }}>
                  Completed sprints ({completedSprints.length})
                </summary>
                <div className="mt-3 space-y-2">
                  {completedSprints.map(sprint => (
                    <div key={sprint.id} className="card px-4 py-3 flex items-center justify-between">
                      <span className="text-[13px] font-medium">{sprint.name}</span>
                      <span className="text-[11px]" style={{ color:'var(--text-3)' }}>
                        {sprint.startDate} → {sprint.endDate}
                        {sprint.completedAt && ` · completed ${new Date(sprint.completedAt).toLocaleDateString()}`}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Create sprint modal */}
      {showCreate && <CreateSprintModal projectId={projectId!} onClose={() => setShowCreate(false)} onCreated={loadAll} />}

      {/* Complete confirmation */}
      {completing && (
        <div className="modal-backdrop" onClick={() => setCompleting(null)}>
          <div className="modal p-6" style={{ maxWidth:400 }} onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold mb-2">Complete sprint?</h2>
            <p className="text-[13px] mb-5" style={{ color:'var(--text-3)' }}>Incomplete issues move to backlog. This cannot be undone.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setCompleting(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={() => completeSprint(completing)} className="btn btn-primary">Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateSprintModal({ projectId, onClose, onCreated }: { projectId:string; onClose:()=>void; onCreated:()=>void }) {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) { setError('Name required'); return; }
    if (!startDate || !endDate) { setError('Dates required'); return; }
    if (endDate < startDate) { setError('End must be after start'); return; }
    setLoading(true); setError(null);
    try {
      await api.post(`/projects/${projectId}/sprints`, { name, goal: goal||null, startDate, endDate });
      onCreated(); onClose();
    } catch(e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal p-6" style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
        <h2 className="font-semibold text-[16px] mb-4">New sprint</h2>
        <div className="mb-3">
          <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text-2)' }}>Sprint name</label>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Sprint 4 — Auth & Payments" autoFocus/>
        </div>
        <div className="mb-3">
          <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text-2)' }}>Goal (optional)</label>
          <input className="input" value={goal} onChange={e=>setGoal(e.target.value)} placeholder="What will this sprint achieve?"/>
        </div>
        <div className="flex gap-3 mb-5">
          <div className="flex-1">
            <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text-2)' }}>Start</label>
            <input type="date" className="input" value={startDate} onChange={e=>setStartDate(e.target.value)}/>
          </div>
          <div className="flex-1">
            <label className="block text-[12px] font-medium mb-1.5" style={{ color:'var(--text-2)' }}>End</label>
            <input type="date" className="input" value={endDate} onChange={e=>setEndDate(e.target.value)}/>
          </div>
        </div>
        {error && <div className="mb-3 text-[12px]" style={{ color:'var(--danger)' }}>{error}</div>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={submit} disabled={loading} className="btn btn-primary">{loading ? 'Creating…' : 'Create sprint'}</button>
        </div>
      </div>
    </div>
  );
}
