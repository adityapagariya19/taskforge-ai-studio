import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { useProject } from '../lib/project';
import { useDemo } from '../lib/demo';
import { api } from '../lib/api';
import Avatar from './Avatar';
import DemoBanner from './DemoBanner';

interface NotificationDto { id: string; title: string; body: string | null; isRead: boolean; createdAt: string; actorIsAi: boolean; }
interface TopBarProps { projectName: string }

export default function TopBar({ projectName }: TopBarProps) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { activeProjectId } = useProject();
  const { isDemo, exit } = useDemo();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = () => api.get<NotificationDto[]>('/notifications').then(setNotifications).catch(() => {});
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const unread = notifications.filter(n => !n.isRead).length;

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n));
  }

  function handleLogout() {
    if (isDemo) { exit(); } else { logout(); }
    navigate('/login');
  }

  return (
    <div>
      <DemoBanner />
      <div className="flex items-center justify-between px-4 py-2.5"
           style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 mr-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg,var(--primary) 0%,#8B5CF6 100%)' }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M2 10L7 4L12 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span className="font-semibold text-[13px]" style={{ color: 'var(--text-1)' }}>TaskForge</span>
          </div>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
          <span className="text-[13px] font-medium" style={{ color: 'var(--text-2)' }}>{projectName}</span>
          {activeProjectId && (
            <Link to={`/projects/${activeProjectId}/sprints`}
                  className="text-[12px] px-2.5 py-1 rounded-md transition-all"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
              Sprints
            </Link>
          )}
          <Link to="/board" className="text-[12px] px-2.5 py-1 rounded-md transition-all"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
            Board
          </Link>
          <Link to="/organization/graph" className="text-[12px] px-2.5 py-1 rounded-md transition-all"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
            Graph
          </Link>
          <Link to="/organization/requests" className="text-[12px] px-2.5 py-1 rounded-md transition-all"
                style={{ color: 'var(--text-3)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
            Requests
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggle}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-[14px]"
                  style={{ color: 'var(--text-3)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {dark ? '☀' : '●'}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setOpen(o => !o)}
                    className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                      style={{ background: 'var(--primary)' }}>{unread}</span>
              )}
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl shadow-lg z-50 overflow-hidden animate-scale-in"
                   style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-default)' }}>
                  <span className="text-[13px] font-semibold">Notifications</span>
                  {unread > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
                      {unread} new
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <div className="text-[24px] mb-2 opacity-40">🔔</div>
                      <p className="text-[13px]" style={{ color: 'var(--text-3)' }}>All caught up</p>
                      <p className="text-[11px] mt-1" style={{ color: 'var(--text-4)' }}>New activity will appear here</p>
                    </div>
                  ) : notifications.slice(0, 8).map(n => (
                    <div key={n.id} onClick={() => markRead(n.id)}
                         className="px-4 py-3 cursor-pointer transition-all flex items-start gap-2.5"
                         style={{ opacity: n.isRead ? 0.55 : 1, borderBottom: '1px solid var(--border-subtle)' }}
                         onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-subtle)')}
                         onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                              style={{ background: n.actorIsAi ? 'var(--ai)' : 'var(--primary)' }} />
                      )}
                      {n.isRead && <span className="w-1.5 flex-shrink-0" />}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          {n.actorIsAi && (
                            <span className="text-[9px] font-bold px-1 py-0.5 rounded"
                                  style={{ background: 'var(--ai-muted)', color: 'var(--ai)' }}>AI</span>
                          )}
                          <span className="text-[12px] font-medium truncate">{n.title}</span>
                        </div>
                        {n.body && <div className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'var(--text-3)' }}>{n.body}</div>}
                        <div className="text-[10px] mt-1" style={{ color: 'var(--text-4)' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User */}
          <div className="flex items-center gap-2 ml-1">
            <Avatar name={user?.fullName} size={28} />
            <button onClick={handleLogout}
                    className="text-[12px] px-2.5 py-1 rounded-md transition-all"
                    style={{ color: 'var(--text-3)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-1)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-3)')}>
              {isDemo ? 'Exit demo' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
