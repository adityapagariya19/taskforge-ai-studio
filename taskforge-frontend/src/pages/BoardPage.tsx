import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useOrganization } from '../lib/organization';
import { useProject } from '../lib/project';
import { useDemo } from '../lib/demo';
import { Issue, Project, ProjectMember, Workspace, WorkflowStatus } from '../types';
import TopBar from '../components/TopBar';
import DepartmentSidebar from '../components/DepartmentSidebar';
import BoardColumn from '../components/BoardColumn';
import CreateIssueModal from '../components/CreateIssueModal';
import IssueDetailModal from '../components/IssueDetailModal';

export default function BoardPage() {
  const { user } = useAuth();
  const { activeOrganizationId } = useOrganization();
  const { setActiveProjectId } = useProject();
  const { isDemo } = useDemo();
  const [project, setProject] = useState<Project | null>(null);
  const [statuses, setStatuses] = useState<WorkflowStatus[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [openIssueId, setOpenIssueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOrganizationId && !isDemo) return;
    async function bootstrap() {
      try {
        const orgId = activeOrganizationId || 'demo-org-001';
        let workspaces = await api.get<Workspace[]>(`/organizations/${orgId}/workspaces`);
        let workspace = workspaces[0];
        if (!workspace) {
          workspace = await api.post<Workspace>(`/organizations/${orgId}/workspaces`, { name: 'Engineering' });
        }
        let projects = await api.get<Project[]>(`/workspaces/${workspace.id}/projects`);
        let proj = projects[0];
        if (!proj) {
          proj = await api.post<Project>(`/workspaces/${workspace.id}/projects`, {
            key: 'TF', name: 'My Project', description: 'Default project', type: 'KANBAN',
          });
        }
        setProject(proj);
        setActiveProjectId(proj.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load workspace');
      }
    }
    bootstrap();
  }, [activeOrganizationId, isDemo, setActiveProjectId]);

  const loadBoard = useCallback(() => {
    if (!project) return;
    api.get<WorkflowStatus[]>(`/projects/${project.id}/statuses`).then(setStatuses).catch(() => {});
    api.get<Issue[]>(`/projects/${project.id}/issues`).then(setIssues).catch(() => {});
    api.get<ProjectMember[]>(`/projects/${project.id}/members`).then(setMembers).catch(() => {});
  }, [project]);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  function resolveAssigneeName(issue: Issue): string | null {
    if (!issue.assigneeId) return null;
    if (user && issue.assigneeId === user.id) return user.fullName;
    return `Member-${issue.assigneeId.slice(0, 6)}`;
  }

  async function createIssue(data: { type: string; title: string; description: string; priority: string }) {
    if (!project) return;
    await api.post(`/projects/${project.id}/issues`, data);
    loadBoard();
  }

  async function changeStatus(issueId: string, newStatusId: string) {
    await api.post(`/issues/${issueId}/transition`, { statusId: newStatusId });
    loadBoard();
  }

  if (error) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className="text-center">
        <div className="text-[32px] mb-3">⚠</div>
        <p className="text-[14px]" style={{ color: 'var(--text-3)' }}>{error}</p>
      </div>
    </div>
  );

  if (!project) return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid var(--border-default)' }}>
        <div className="skeleton h-5 w-40 rounded" />
        <div className="skeleton h-7 w-7 rounded-lg" />
      </div>
      <div className="flex gap-3 p-4">
        {[0, 1, 2, 3].map(col => (
          <div key={col} className="flex-1 min-w-[240px] max-w-[300px]">
            <div className="skeleton h-4 w-20 rounded mb-3" />
            <div className="space-y-2">
              {[0, 1, col === 1 ? 2 : -1].filter(n => n >= 0).map(row => (
                <div key={row} className="skeleton rounded-xl" style={{ height: 76 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const sortedStatuses = [...statuses].sort((a, b) => a.position - b.position);
  const aiMembers = members.filter(m => m.isAi);
  const humanMembers = members.filter(m => !m.isAi);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <DepartmentSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar projectName={`${project.name} (${project.key})`} />

        {/* Board header */}
        <div className="flex items-center justify-between px-5 py-3"
             style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="flex items-center gap-4">
            <h1 className="text-[14px] font-semibold">Board</h1>
            <div className="flex items-center gap-1.5">
              {aiMembers.slice(0, 6).map(m => (
                <div key={m.id} className="ai-ring" style={{ width: 24, height: 24 }} data-tooltip={m.aiAgentType?.replace('_', ' ')}>
                  <div className="w-full h-full rounded-full flex items-center justify-center"
                       style={{ background: 'var(--bg-surface)', fontSize: 8, fontWeight: 700, color: 'var(--ai)' }}>
                    {(m.aiAgentType || '').slice(0, 2)}
                  </div>
                </div>
              ))}
              {humanMembers.slice(0, 3).map(m => (
                <div key={m.id} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white flex-shrink-0"
                     style={{ background: 'var(--primary)' }} data-tooltip={m.role}>
                  {m.role?.slice(0, 1)}
                </div>
              ))}
              <span className="text-[11px] ml-1" style={{ color: 'var(--text-3)' }}>
                {aiMembers.length} AI · {humanMembers.length} human
              </span>
            </div>
          </div>
          <button onClick={() => setShowCreate(true)}
                  className="btn btn-primary text-[12px] py-1.5 px-3">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            New issue
          </button>
        </div>

        {/* Kanban columns */}
        <div className="flex-1 flex gap-3 p-4 overflow-x-auto">
          {sortedStatuses.length === 0
            ? <div className="flex-1 flex items-center justify-center">
                <div className="skeleton w-full h-64 rounded-xl" style={{ maxWidth: 900 }} />
              </div>
            : sortedStatuses.map(status => (
                <BoardColumn
                  key={status.id}
                  status={status}
                  issues={issues.filter(i => i.statusId === status.id)}
                  allStatuses={sortedStatuses}
                  resolveAssigneeName={resolveAssigneeName}
                  onOpen={setOpenIssueId}
                  onStatusChange={changeStatus}
                />
              ))}
        </div>

        {showCreate && <CreateIssueModal onClose={() => setShowCreate(false)} onCreate={createIssue} />}
        {openIssueId && (
          <IssueDetailModal
            issueId={openIssueId}
            statuses={sortedStatuses}
            members={members}
            onClose={() => setOpenIssueId(null)}
            onChanged={loadBoard}
          />
        )}
      </div>
    </div>
  );
}
