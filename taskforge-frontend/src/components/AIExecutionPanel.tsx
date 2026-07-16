import { useState } from 'react';
import { api } from '../lib/api';
import { isDemoMode } from '../lib/demo';
import { buildZip, downloadBlob } from '../lib/zip';
import { AGENT_LABELS, AGENT_TYPES, AgentExecution } from '../types';
import Avatar from './Avatar';

interface Props {
  issueId: string;
  issueKey: string;
  executions: AgentExecution[];
  onChanged: () => void;
}

const PIPELINE_ORDER = ['CODE_AI', 'REVIEWER_AI', 'TESTER_AI', 'DOCUMENTATION_AI'];

export default function AIExecutionPanel({ issueId, issueKey, executions, onChanged }: Props) {
  const [selectedAgent, setSelectedAgent] = useState<typeof AGENT_TYPES[number]>(AGENT_TYPES[0]);
  const [instructions, setInstructions] = useState('');
  const [invoking, setInvoking] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function invoke() {
    setInvoking(true);
    try {
      await api.post(`/issues/${issueId}/ai/invoke`, { agentType: selectedAgent, instructions: instructions || null });
      setInstructions('');
      onChanged();
    } finally { setInvoking(false); }
  }

  async function approve(execution: AgentExecution) {
    setBusyId(execution.id);
    try {
      await api.post(`/issues/${issueId}/ai/executions/${execution.id}/approve`, {});
      onChanged();
    } finally { setBusyId(null); }
  }

  async function requestChanges(execution: AgentExecution) {
    if (!reviewNote.trim()) return;
    setBusyId(execution.id);
    try {
      await api.post(`/issues/${issueId}/ai/executions/${execution.id}/request-changes`, { note: reviewNote });
      setReviewingId(null); setReviewNote('');
      onChanged();
    } finally { setBusyId(null); }
  }

  async function downloadFiles(execution: AgentExecution) {
    if (isDemoMode()) {
      // Real client-side zip — the execution's files are already fully in memory
      // from the demo API response (unlike the real backend response shape,
      // demo executions carry file `content` inline so no extra fetch is needed).
      const demoFiles = execution.files as unknown as { filename: string; content: string }[];
      if (!demoFiles || demoFiles.length === 0) return;
      const blob = buildZip(demoFiles.map(f => ({ filename: f.filename, content: f.content })));
      downloadBlob(blob, `${issueKey.toLowerCase()}-codeai.zip`);
      return;
    }
    const blob = await api.downloadBlob(`/issues/${issueId}/ai/executions/${execution.id}/download`);
    downloadBlob(blob, `${issueKey.toLowerCase()}-codeai.zip`);
  }

  return (
    <div>
      {/* Instruction box — the real "assign work to an AI teammate" interface */}
      <div className="mb-5 p-4 rounded-xl" style={{ background: 'var(--ai-muted)', border: '1px solid rgba(34,211,238,0.2)' }}>
        <div className="text-[11px] font-semibold uppercase tracking-wide mb-2.5" style={{ color: 'var(--ai)' }}>
          Instruct an AI teammate
        </div>
        <div className="flex gap-2 mb-2.5 flex-wrap">
          {AGENT_TYPES.map(t => (
            <button key={t} onClick={() => setSelectedAgent(t)}
                    className="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-lg transition-all"
                    style={{
                      background: selectedAgent === t ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${selectedAgent === t ? 'rgba(34,211,238,0.5)' : 'rgba(34,211,238,0.15)'}`,
                      color: selectedAgent === t ? 'var(--ai)' : 'var(--text-2)',
                    }}>
              <Avatar isAi agentType={t} size={14} />
              {AGENT_LABELS[t].replace(' Agent', '')}
            </button>
          ))}
        </div>
        <textarea
          className="input h-16 resize-none text-[12px] mb-2.5"
          placeholder={`What should ${AGENT_LABELS[selectedAgent]} do? e.g. "Build a login page with working backend authentication"`}
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
        />
        <button onClick={invoke} disabled={invoking}
                className="btn text-[12px] py-1.5"
                style={{ background: 'var(--ai)', color: '#050507', fontWeight: 600 }}>
          {invoking ? 'Working…' : `Deliver to ${AGENT_LABELS[selectedAgent].replace(' Agent', '')}`}
        </button>
      </div>

      {/* Execution history — instruction, output, approve/request-changes, download */}
      {executions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>No AI activity yet on this issue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {executions.map(execution => (
            <ExecutionCard
              key={execution.id}
              execution={execution}
              isReviewing={reviewingId === execution.id}
              reviewNote={reviewNote}
              busy={busyId === execution.id}
              onStartReview={() => { setReviewingId(execution.id); setReviewNote(''); }}
              onCancelReview={() => setReviewingId(null)}
              onReviewNoteChange={setReviewNote}
              onApprove={() => approve(execution)}
              onRequestChanges={() => requestChanges(execution)}
              onDownload={() => downloadFiles(execution)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ExecutionCard({
  execution, isReviewing, reviewNote, busy,
  onStartReview, onCancelReview, onReviewNoteChange, onApprove, onRequestChanges, onDownload,
}: {
  execution: AgentExecution;
  isReviewing: boolean;
  reviewNote: string;
  busy: boolean;
  onStartReview: () => void;
  onCancelReview: () => void;
  onReviewNoteChange: (v: string) => void;
  onApprove: () => void;
  onRequestChanges: () => void;
  onDownload: () => void;
}) {
  const needsReview = execution.approvalStatus === 'PENDING_REVIEW';
  const nextAgent = PIPELINE_ORDER[PIPELINE_ORDER.indexOf(execution.agentType) + 1];

  return (
    <div className="p-4 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Avatar isAi agentType={execution.agentType} size={26} />
          <div>
            <div className="text-[13px] font-semibold" style={{ color: 'var(--ai)' }}>{AGENT_LABELS[execution.agentType]}</div>
            <div className="text-[10.5px]" style={{ color: 'var(--text-4)' }}>{new Date(execution.createdAt).toLocaleString()}</div>
          </div>
        </div>
        <ApprovalBadge status={execution.approvalStatus} />
      </div>

      {execution.instructions && (
        <div className="mb-2.5 px-3 py-2 rounded-lg text-[12px]" style={{ background: 'var(--bg-subtle)', color: 'var(--text-2)' }}>
          <span className="font-medium" style={{ color: 'var(--text-3)' }}>Instructions: </span>{execution.instructions}
        </div>
      )}

      <div className="mb-3 px-3 py-2 rounded-lg text-[11.5px]" style={{ background: 'var(--bg-subtle)', color: 'var(--text-3)' }}>
        Full output posted to the <strong style={{ color: 'var(--text-2)' }}>Comments</strong> tab below, attributed to {AGENT_LABELS[execution.agentType]}.
      </div>

      {execution.files && execution.files.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <span className="text-[12px]" style={{ color: 'var(--text-2)' }}>
              {execution.files.length} file{execution.files.length > 1 ? 's' : ''} generated
            </span>
            <button onClick={onDownload} className="text-[11px] font-semibold px-2.5 py-1 rounded-md"
                    style={{ background: 'var(--primary)', color: 'white' }}>
              Download .zip
            </button>
          </div>
        </div>
      )}

      {execution.reviewNote && execution.approvalStatus === 'CHANGES_REQUESTED' && (
        <div className="mb-3 px-3 py-2 rounded-lg text-[12px]" style={{ background: 'rgba(239,68,68,0.08)', color: '#FCA5A5' }}>
          <span className="font-medium">Feedback given: </span>{execution.reviewNote}
        </div>
      )}

      {needsReview && (
        isReviewing ? (
          <div className="space-y-2">
            <textarea className="input h-16 resize-none text-[12px]" placeholder="What needs to change?"
                      value={reviewNote} onChange={e => onReviewNoteChange(e.target.value)} autoFocus />
            <div className="flex gap-2">
              <button onClick={onRequestChanges} disabled={busy || !reviewNote.trim()} className="btn btn-danger text-[12px] py-1.5">
                {busy ? 'Sending…' : 'Send feedback'}
              </button>
              <button onClick={onCancelReview} className="btn btn-ghost text-[12px] py-1.5">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={onApprove} disabled={busy} className="btn btn-primary text-[12px] py-1.5">
              {busy ? 'Approving…' : nextAgent ? `Approve → ${AGENT_LABELS[nextAgent].replace(' Agent', '')}` : 'Approve'}
            </button>
            <button onClick={onStartReview} className="btn btn-outline text-[12px] py-1.5">Request changes</button>
          </div>
        )
      )}
    </div>
  );
}

function ApprovalBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; label: string }> = {
    PENDING_REVIEW: { bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', label: 'Awaiting review' },
    APPROVED: { bg: 'rgba(34,197,94,0.12)', color: '#22C55E', label: 'Approved' },
    CHANGES_REQUESTED: { bg: 'rgba(239,68,68,0.12)', color: '#EF4444', label: 'Revising' },
    NOT_REQUIRED: { bg: 'var(--bg-subtle)', color: 'var(--text-4)', label: 'Complete' },
  };
  const c = config[status] || config.NOT_REQUIRED;
  return <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.color }}>{c.label}</span>;
}
