import { useEffect, useState, useCallback } from 'react';
import { api } from '../lib/api';
import { useOrganization } from '../lib/organization';
import { GraphData, GraphNode, AGENT_LABELS } from '../types';
import TopBar from '../components/TopBar';
import OrgGraphCanvas from '../components/OrgGraphCanvas';

export default function OrgGraphPage() {
  const { activeOrganizationId } = useOrganization();
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);

  const load = useCallback(async () => {
    if (!activeOrganizationId) return;
    setLoading(true); setError(null);
    try {
      const result = await api.get<GraphData>(`/organizations/${activeOrganizationId}/graph`);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load organization graph');
    } finally { setLoading(false); }
  }, [activeOrganizationId]);

  useEffect(() => { load(); }, [load]);

  const humanCount = data?.nodes.filter(n => n.type === 'member' && !n.isAi).length ?? 0;
  const aiCount = data?.nodes.filter(n => n.type === 'member' && n.isAi).length ?? 0;
  const onlineCount = data?.nodes.filter(n => n.type === 'member' && n.status === 'online').length ?? 0;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <TopBar projectName="Organization Graph" />

      <div className="flex-1 flex flex-col p-5 gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[16px] font-semibold">Organization graph</h1>
            <p className="text-[12px]" style={{ color: 'var(--text-3)' }}>
              {humanCount} people · {aiCount} AI agents · {onlineCount} online now
            </p>
          </div>
        </div>

        {loading && <div className="skeleton flex-1 rounded-2xl" />}
        {error && <div className="text-[13px] p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.1)', color: '#FCA5A5' }}>{error}</div>}

        {!loading && !error && data && (
          <div className="flex-1 min-h-[600px]">
            <OrgGraphCanvas nodes={data.nodes} onSelectMember={setSelected} />
          </div>
        )}
      </div>

      {/* Sliding member detail panel */}
      {selected && (
        <div className="fixed inset-0 z-40" onClick={() => setSelected(null)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm animate-slide-right p-5 overflow-y-auto"
               style={{ background: 'var(--bg-elevated)', borderLeft: '1px solid var(--border-default)' }}
               onClick={e => e.stopPropagation()}>
            <MemberDetailPanel node={selected} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function MemberDetailPanel({ node, onClose }: { node: GraphNode; onClose: () => void }) {
  const statusLabel = node.status === 'online' ? 'Online now' : node.status === 'idle' ? 'Idle' : 'Offline';
  const statusColor = node.status === 'online' ? '#22C55E' : node.status === 'idle' ? '#F59E0B' : '#52525B';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>
          {node.isAi ? 'AI Agent' : 'Team Member'}
        </span>
        <button onClick={onClose} className="text-[18px]" style={{ color: 'var(--text-3)' }}>×</button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className={node.isAi ? 'ai-ring' : ''} style={{ width: 52, height: 52 }}>
          <div className="w-full h-full rounded-full flex items-center justify-center text-[15px] font-bold"
               style={{
                 background: node.isAi ? 'var(--bg-surface)' : '#6366F1',
                 color: node.isAi ? 'var(--ai)' : 'white',
               }}>
            {node.isAi
              ? (AGENT_LABELS[node.agentType || ''] || 'AI').slice(0, 2).toUpperCase()
              : node.label.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        </div>
        <div>
          <div className="text-[16px] font-semibold">{node.label}</div>
          <div className="text-[13px]" style={{ color: 'var(--text-3)' }}>{node.subtitle}</div>
        </div>
      </div>

      {!node.isAi && (
        <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-subtle)' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
          <span className="text-[12px] font-medium">{statusLabel}</span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-4)' }}>Current task</div>
          <div className="text-[13px] p-3 rounded-lg" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: node.currentTask ? 'var(--text-1)' : 'var(--text-4)' }}>
            {node.currentTask || 'No active task'}
          </div>
        </div>

        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--text-4)' }}>
            {node.isAi ? 'Total executions' : 'Assigned tasks'}
          </div>
          <div className="text-[24px] font-bold">{node.taskCount ?? 0}</div>
        </div>

        {node.isAi && (
          <div className="px-3 py-2.5 rounded-lg text-[12px] leading-relaxed" style={{ background: 'var(--ai-muted)', color: 'var(--text-2)' }}>
            This agent operates within the same permission system as human members — its role grants exactly
            the actions it's allowed to take, nothing more.
          </div>
        )}
      </div>
    </div>
  );
}
