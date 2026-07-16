import { Issue, WorkflowStatus } from '../types';
import Avatar from './Avatar';

const PRIORITY_LABELS: Record<string, string> = {
  HIGHEST:'P1', HIGH:'P2', MEDIUM:'P3', LOW:'P4', LOWEST:'P5',
};
const TYPE_ICONS: Record<string, string> = {
  EPIC:'◈', STORY:'◇', TASK:'□', SUBTASK:'↳', BUG:'⬡',
};

interface IssueCardProps {
  issue: Issue;
  statuses: WorkflowStatus[];
  assigneeName?: string | null;
  onOpen: (id: string) => void;
  onStatusChange: (id: string, statusId: string) => void;
}

export default function IssueCard({ issue, statuses, assigneeName, onOpen, onStatusChange }: IssueCardProps) {
  return (
    <div className={`issue-card priority-${issue.priority} mb-2`} onClick={() => onOpen(issue.id)}>
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>{TYPE_ICONS[issue.type] || '□'}</span>
          <span className="mono text-[11px] font-medium" style={{ color: 'var(--text-3)' }}>{issue.issueKey}</span>
        </div>
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <select className="text-[10px] rounded-md px-1.5 py-0.5 font-medium"
                  style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-3)', cursor: 'pointer' }}
                  value={issue.statusId}
                  onChange={e => onStatusChange(issue.id, e.target.value)}>
            {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      {/* Title */}
      <p className="text-[13px] font-medium leading-snug mb-3" style={{ color: 'var(--text-1)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {issue.title}
      </p>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`priority-dot p-${issue.priority}`} />
          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-4)' }}>
            {PRIORITY_LABELS[issue.priority]}
          </span>
          {issue.storyPoints != null && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ background: 'var(--bg-subtle)', color: 'var(--text-3)', border: '1px solid var(--border-subtle)' }}>
              {issue.storyPoints}sp
            </span>
          )}
        </div>
        <Avatar
          isAi={issue.assigneeIsAi}
          agentType={issue.assigneeAiType}
          name={assigneeName}
          size={22}
        />
      </div>
    </div>
  );
}
