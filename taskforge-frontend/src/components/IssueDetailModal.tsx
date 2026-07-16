import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { AGENT_LABELS, AGENT_TYPES, ActivityEntry, AgentExecution, CommentDto, Issue, ProjectMember, WorkflowStatus } from '../types';
import Avatar from './Avatar';
import CommentBody from './CommentBody';
import AIExecutionPanel from './AIExecutionPanel';

interface Props {
  issueId: string;
  statuses: WorkflowStatus[];
  members: ProjectMember[];
  onClose: () => void;
  onChanged: () => void;
}

const PRIORITY_COLOR: Record<string, string> = {
  HIGHEST:'var(--p-highest)', HIGH:'var(--p-high)', MEDIUM:'var(--p-medium)', LOW:'var(--p-low)', LOWEST:'var(--p-lowest)',
};
const TYPE_ICON: Record<string, string> = { EPIC:'◈', STORY:'◇', TASK:'□', SUBTASK:'↳', BUG:'⬡' };

export default function IssueDetailModal({ issueId, statuses, members, onClose, onChanged }: Props) {
  const { user } = useAuth();
  const [issue, setIssue] = useState<Issue | null>(null);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [newComment, setNewComment] = useState('');
  const [tab, setTab] = useState<'comments' | 'ai' | 'activity'>('comments');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([
      api.get<Issue>(`/issues/${issueId}`),
      api.get<CommentDto[]>(`/issues/${issueId}/comments`),
      api.get<ActivityEntry[]>(`/issues/${issueId}/activity`),
      api.get<AgentExecution[]>(`/issues/${issueId}/ai/executions`),
    ]).then(([i, c, a, e]) => { setIssue(i); setComments(c); setActivity(a); setExecutions(e); setLoading(false); })
      .catch(() => setLoading(false));
  }, [issueId]);

  useEffect(() => { load(); }, [load]);

  function resolveName(userId: string | null) {
    if (!userId) return null;
    if (user && userId === user.id) return user.fullName;
    return `Member`;
  }

  async function changeStatus(statusId: string) {
    await api.post(`/issues/${issueId}/transition`, { statusId });
    load(); onChanged();
  }

  async function changeAssignee(value: string) {
    const body: Record<string, unknown> = {};
    if (value.startsWith('ai:')) body.assigneeAiType = value.replace('ai:', '');
    else if (value.startsWith('human:')) body.assigneeUserId = value.replace('human:', '');
    await api.patch(`/issues/${issueId}`, body);
    load(); onChanged();
  }

  async function postComment() {
    if (!newComment.trim()) return;
    await api.post(`/issues/${issueId}/comments`, { body: newComment });
    setNewComment(''); load();
  }

  if (loading || !issue) return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal p-6">
        <div className="space-y-3">
          {[200,140,100].map(w => <div key={w} className="skeleton h-4 rounded" style={{ width: w }} />)}
        </div>
      </div>
    </div>
  );

  const humanMembers = members.filter(m => !m.isAi);
  const currentStatus = statuses.find(s => s.id === issue.statusId);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 740 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-5 pb-4" style={{ borderBottom: '1px solid var(--border-default)' }}>
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[13px]" style={{ color: 'var(--text-3)' }}>{TYPE_ICON[issue.type]}</span>
              <span className="mono text-[12px] font-medium" style={{ color: 'var(--text-3)' }}>{issue.issueKey}</span>
              <span className="badge text-[10px]" style={{ background: 'var(--bg-subtle)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}>{issue.type}</span>
            </div>
            <h2 className="text-[17px] font-semibold leading-snug" style={{ color: 'var(--text-1)' }}>{issue.title}</h2>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-[18px] flex-shrink-0 transition-all"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => (e.currentTarget.style.background='var(--bg-subtle)')}
                  onMouseLeave={e => (e.currentTarget.style.background='transparent')}>×</button>
        </div>

        <div className="flex" style={{ height: 560 }}>
          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Description */}
            {issue.description && (
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-2)' }}>{issue.description}</p>
              </div>
            )}

            {/* Compact AI status indicator — the real instruction/approval interface lives in the AI tab below */}
            {executions.length > 0 && (
              <div className="px-5 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--ai-muted)' }}>
                <Avatar isAi agentType={executions[0].agentType} size={18} />
                <span className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                  {AGENT_LABELS[executions[0].agentType]} — {executions[0].approvalStatus === 'PENDING_REVIEW' ? 'awaiting your review' : executions[0].status.toLowerCase()}
                </span>
                {executions[0].approvalStatus === 'PENDING_REVIEW' && (
                  <button onClick={() => setTab('ai')} className="ml-auto text-[11px] font-semibold" style={{ color: 'var(--ai)' }}>
                    Review now →
                  </button>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex px-5 pt-3 gap-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              {(['comments', 'ai', 'activity'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                        className="pb-2.5 text-[13px] font-medium capitalize transition-all"
                        style={{ color: tab === t ? 'var(--text-1)' : 'var(--text-3)',
                                 borderBottom: tab === t ? `2px solid var(--primary)` : '2px solid transparent' }}>
                  {t === 'ai' ? 'AI' : t} {t === 'comments' ? `(${comments.length})` : t === 'activity' ? `(${activity.length})` : ''}
                </button>
              ))}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {tab === 'ai' && (
                <AIExecutionPanel issueId={issueId} issueKey={issue.issueKey} executions={executions} onChanged={load} />
              )}
              {tab === 'comments' && (
                <div>
                  {comments.map(c => (
                    <div key={c.id} className="flex gap-3 mb-4">
                      <Avatar isAi={c.authorIsAi} agentType={c.authorAiType} name={resolveName(c.authorId)} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[12px] font-semibold"
                                style={{ color: c.authorIsAi ? 'var(--ai)' : 'var(--text-1)' }}>
                            {c.authorIsAi ? AGENT_LABELS[c.authorAiType || ''] : resolveName(c.authorId) || 'Unknown'}
                          </span>
                          <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>
                            {new Date(c.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="prose-comment">
                          <CommentBody text={c.body} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-2xl mb-2">💬</div>
                      <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>No comments yet. Ask an AI teammate or add your thoughts.</p>
                    </div>
                  )}
                </div>
              )}
              {tab === 'activity' && (
                <div>
                  {activity.map(a => (
                    <div key={a.id} className="flex gap-3 mb-3 items-start">
                      <Avatar isAi={a.actorIsAi} agentType={a.actorAiType} name={resolveName(a.actorId)} size={22} />
                      <div className="text-[12px]">
                        <span className="font-medium"
                              style={{ color: a.actorIsAi ? 'var(--ai)' : 'var(--text-1)' }}>
                          {a.actorIsAi ? AGENT_LABELS[a.actorAiType || ''] : resolveName(a.actorId) || 'System'}
                        </span>{' '}
                        <span style={{ color: 'var(--text-2)' }}>
                          {a.actionType === 'ISSUE_CREATED' ? 'created this issue' :
                           a.actionType === 'STATUS_CHANGED' ? `moved ${a.oldValue} → ${a.newValue}` :
                           a.actionType === 'COMMENT_ADDED' ? 'commented' :
                           a.actionType === 'SUBISSUE_CREATED' ? `created subtask "${a.newValue}"` :
                           a.actionType.toLowerCase().replace(/_/g, ' ')}
                        </span>
                        <span className="ml-2 text-[11px]" style={{ color: 'var(--text-4)' }}>
                          {new Date(a.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comment input */}
            {tab === 'comments' && (
              <div className="px-5 py-3" style={{ borderTop: '1px solid var(--border-default)' }}>
                <div className="flex gap-2">
                  <input className="input flex-1" value={newComment} onChange={e => setNewComment(e.target.value)}
                         placeholder="Add a comment…" onKeyDown={e => e.key === 'Enter' && !e.shiftKey && postComment()} />
                  <button onClick={postComment} className="btn btn-primary px-3">Send</button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-52 flex-shrink-0 overflow-y-auto p-4 space-y-5"
               style={{ borderLeft: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>

            {/* Status */}
            <div>
              <div className="text-[11px] font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>Status</div>
              <select className="input text-[12px]" value={issue.statusId} onChange={e => changeStatus(e.target.value)}>
                {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {/* Priority */}
            <div>
              <div className="text-[11px] font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>Priority</div>
              <div className="flex items-center gap-2">
                <span className={`priority-dot p-${issue.priority}`} />
                <span className="text-[12px]" style={{ color: 'var(--text-2)' }}>{issue.priority}</span>
              </div>
            </div>

            {/* Assignee */}
            <div>
              <div className="text-[11px] font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>Assignee</div>
              <select className="input text-[12px]"
                      value={issue.assigneeIsAi ? `ai:${issue.assigneeAiType}` : issue.assigneeId ? `human:${issue.assigneeId}` : ''}
                      onChange={e => changeAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                <optgroup label="Team">
                  {humanMembers.map(m => <option key={m.id} value={`human:${m.userId}`}>{resolveName(m.userId) || m.role}</option>)}
                </optgroup>
                <optgroup label="AI Teammates">
                  {AGENT_TYPES.map(t => <option key={t} value={`ai:${t}`}>{AGENT_LABELS[t]}</option>)}
                </optgroup>
              </select>
              {(issue.assigneeId || issue.assigneeIsAi) && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar isAi={issue.assigneeIsAi} agentType={issue.assigneeAiType} name={resolveName(issue.assigneeId)} size={22} />
                  <span className="text-[12px]" style={{ color: 'var(--text-2)' }}>
                    {issue.assigneeIsAi ? AGENT_LABELS[issue.assigneeAiType || ''] : resolveName(issue.assigneeId)}
                  </span>
                </div>
              )}
            </div>

            {/* Story points */}
            <div>
              <div className="text-[11px] font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>Story Points</div>
              <div className="text-[13px] font-semibold" style={{ color: issue.storyPoints ? 'var(--text-1)' : 'var(--text-4)' }}>
                {issue.storyPoints ?? '—'}
              </div>
            </div>

            {/* Dates */}
            <div>
              <div className="text-[11px] font-semibold mb-2 uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>Created</div>
              <div className="text-[12px]" style={{ color: 'var(--text-3)' }}>
                {new Date(issue.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
