import { Issue, WorkflowStatus } from '../types';
import IssueCard from './IssueCard';

interface BoardColumnProps {
  status: WorkflowStatus;
  issues: Issue[];
  allStatuses: WorkflowStatus[];
  resolveAssigneeName: (issue: Issue) => string | null;
  onOpen: (issueId: string) => void;
  onStatusChange: (issueId: string, newStatusId: string) => void;
}

export default function BoardColumn({ status, issues, allStatuses, resolveAssigneeName, onOpen, onStatusChange }: BoardColumnProps) {
  return (
    <div className="flex-1 min-w-[240px] max-w-[300px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: status.color || '#8A8F9C' }} />
        <span className="text-[12px] font-semibold" style={{ color: 'var(--text-2)' }}>{status.name}</span>
        <span className="text-[11px] ml-auto px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--bg-subtle)', color: 'var(--text-3)' }}>{issues.length}</span>
      </div>
      <div className="min-h-[120px] rounded-xl p-2"
           style={{ background: issues.length === 0 ? 'var(--bg-subtle)' : 'transparent',
                    border: issues.length === 0 ? '1px dashed var(--border-default)' : 'none' }}>
        {issues.map(issue => (
          <IssueCard key={issue.id} issue={issue} statuses={allStatuses}
            assigneeName={resolveAssigneeName(issue)} onOpen={onOpen} onStatusChange={onStatusChange} />
        ))}
        {issues.length === 0 && (
          <div className="h-full flex items-center justify-center py-6">
            <span className="text-[12px]" style={{ color: 'var(--text-4)' }}>No issues</span>
          </div>
        )}
      </div>
    </div>
  );
}
