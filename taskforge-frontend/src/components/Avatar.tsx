import { AGENT_LABELS } from '../types';

const AGENT_INITIALS: Record<string, string> = {
  ARCHITECT_AI:'AR', CODE_AI:'CD', TESTER_AI:'TS',
  REVIEWER_AI:'RV', DOCUMENTATION_AI:'DC', PROJECT_MANAGER_AI:'PM',
};

const HUMAN_COLORS = ['#6366F1','#8B5CF6','#EC4899','#F59E0B','#10B981','#3B82F6','#EF4444','#06B6D4'];

function colorFor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % HUMAN_COLORS.length;
  return HUMAN_COLORS[Math.abs(h)];
}

function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name[0].toUpperCase();
}

interface AvatarProps { isAi?: boolean; agentType?: string | null; name?: string | null; size?: number; }

export default function Avatar({ isAi, agentType, name, size = 32 }: AvatarProps) {
  const dim = `${size}px`;
  const fontSize = `${Math.max(8, Math.floor(size * 0.35))}px`;

  if (isAi && agentType) {
    const label = AGENT_INITIALS[agentType] || 'AI';
    const title = AGENT_LABELS[agentType] || agentType;
    return (
      <div className="ai-ring inline-flex flex-shrink-0" style={{ width: dim, height: dim }} title={title}>
        <div className="w-full h-full rounded-full flex items-center justify-center font-bold"
             style={{ background: 'var(--bg-surface)', color: 'var(--ai)', fontSize }}>
          {label}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0"
         style={{ width: dim, height: dim, background: colorFor(name || '?'), fontSize, letterSpacing: '-0.02em' }}
         title={name || 'Unknown'}>
      {initials(name)}
    </div>
  );
}
