import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useOrganization } from '../lib/organization';
import { Department } from '../types';

const DEPT_ICONS: Record<string, string> = {
  Engineering: '◆', Product: '◇', 'AI Operations': '◈', HR: '●', Finance: '▲', Sales: '■', Marketing: '▶', Design: '◎', Operations: '▣', Legal: '⬟',
};

/**
 * Real department navigation — reads from the actual Department entities
 * built in Module 1, not a hardcoded list. An organization with no
 * departments yet sees an honest empty state, not fabricated defaults.
 */
export default function DepartmentSidebar() {
  const { activeOrganizationId } = useOrganization();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!activeOrganizationId) return;
    api.get<Department[]>(`/organizations/${activeOrganizationId}/departments`)
      .then(setDepartments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeOrganizationId]);

  const topLevel = departments.filter(d => !d.parentDepartmentId);

  if (collapsed) {
    return (
      <div className="w-11 flex-shrink-0 flex flex-col items-center py-4 gap-3"
           style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}>
        <button onClick={() => setCollapsed(false)} className="text-[13px]" style={{ color: 'var(--text-3)' }}>»</button>
      </div>
    );
  }

  return (
    <div className="w-56 flex-shrink-0 flex flex-col py-4 px-3"
         style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-4)' }}>Departments</span>
        <button onClick={() => setCollapsed(true)} className="text-[11px]" style={{ color: 'var(--text-4)' }}>«</button>
      </div>

      {loading && (
        <div className="space-y-2 px-1">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-7 rounded-lg" />)}
        </div>
      )}

      {!loading && topLevel.length === 0 && (
        <div className="px-1 py-3 text-[11.5px]" style={{ color: 'var(--text-4)' }}>
          No departments yet.
        </div>
      )}

      {!loading && topLevel.map(dept => (
        <button key={dept.id}
                className="sidebar-item w-full text-left"
                style={{ marginBottom: 2 }}>
          <span className="w-4 text-center text-[12px]" style={{ color: 'var(--text-4)' }}>
            {DEPT_ICONS[dept.name] || '◇'}
          </span>
          <span className="truncate">{dept.name}</span>
        </button>
      ))}

      <div className="mt-auto pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <Link to="/organization/graph" className="sidebar-item">
          <span className="w-4 text-center text-[12px]">◈</span>
          Organization graph
        </Link>
        <Link to="/organization/requests" className="sidebar-item">
          <span className="w-4 text-center text-[12px]">✓</span>
          Join requests
        </Link>
      </div>
    </div>
  );
}
