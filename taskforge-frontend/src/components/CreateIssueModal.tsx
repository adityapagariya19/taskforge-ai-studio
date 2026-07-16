import { useState } from 'react';

interface CreateIssueModalProps {
  onClose: () => void;
  onCreate: (data: { type: string; title: string; description: string; priority: string }) => Promise<void>;
}

export default function CreateIssueModal({ onClose, onCreate }: CreateIssueModalProps) {
  const [type, setType] = useState('TASK');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!title.trim()) { setError('Title is required'); return; }
    setSubmitting(true); setError(null);
    try { await onCreate({ type, title, description, priority }); onClose(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[16px] font-semibold">Create issue</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center transition-all text-[16px]"
                  style={{ color: 'var(--text-3)' }} onMouseEnter={e => (e.currentTarget.style.background='var(--bg-subtle)')} onMouseLeave={e => (e.currentTarget.style.background='transparent')}>×</button>
        </div>

        <div className="flex gap-3 mb-4">
          {['EPIC','STORY','TASK','BUG'].map(t => (
            <button key={t} onClick={() => setType(t)}
                    className="flex-1 py-2 rounded-lg text-[12px] font-medium transition-all"
                    style={{ background: type === t ? 'var(--primary-muted)' : 'var(--bg-subtle)',
                             color: type === t ? 'var(--primary)' : 'var(--text-3)',
                             border: `1px solid ${type === t ? 'rgba(99,102,241,0.3)' : 'var(--border-subtle)'}` }}>
              {t}
            </button>
          ))}
        </div>

        <div className="mb-3">
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Title</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)}
                 placeholder="What needs to be done?" autoFocus onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submit()} />
        </div>

        <div className="mb-4">
          <label className="block text-[12px] font-medium mb-1.5" style={{ color: 'var(--text-2)' }}>Description</label>
          <textarea className="input h-20 resize-none" value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Add more context… AI agents will use this to understand the task." />
        </div>

        <div className="mb-5">
          <label className="block text-[12px] font-medium mb-2" style={{ color: 'var(--text-2)' }}>Priority</label>
          <div className="flex gap-2">
            {(['HIGHEST','HIGH','MEDIUM','LOW','LOWEST'] as const).map(p => (
              <button key={p} onClick={() => setPriority(p)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all flex-1 justify-center"
                      style={{ background: priority === p ? 'var(--bg-subtle)' : 'transparent',
                               border: `1px solid ${priority === p ? 'var(--border-strong)' : 'var(--border-subtle)'}`,
                               color: priority === p ? 'var(--text-1)' : 'var(--text-3)' }}>
                <span className={`priority-dot p-${p}`} />
                {p.slice(0,3)}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="mb-4 px-3 py-2 rounded-lg text-[12px]" style={{ background:'rgba(239,68,68,0.1)', color:'#FCA5A5' }}>{error}</div>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={submit} disabled={submitting} className="btn btn-primary">
            {submitting ? 'Creating…' : 'Create issue'}
          </button>
        </div>
      </div>
    </div>
  );
}
