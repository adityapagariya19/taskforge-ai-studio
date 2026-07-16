import { Component, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Top-level safety net. React error boundaries only catch errors thrown
 * during render/lifecycle — not async/promise rejections (those are
 * handled at the source now, see organization.tsx) — but this guarantees
 * that if a render-time error ever slips through, the person sees a clean
 * recovery screen instead of a blank white/black page.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error('[TaskForge] Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-base, #09090B)' }}>
          <div className="w-full max-w-sm text-center p-6 rounded-2xl"
               style={{ background: 'var(--bg-surface, #111113)', border: '1px solid var(--border-default, #27272A)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4"
                 style={{ background: 'rgba(239,68,68,0.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                <path d="M12 9v4m0 4h.01M10.3 3.86l-8.2 14.14A1.5 1.5 0 0 0 3.5 20h17a1.5 1.5 0 0 0 1.4-2L13.7 3.86a1.5 1.5 0 0 0-2.6 0z"/>
              </svg>
            </div>
            <h1 className="text-[15px] font-semibold mb-1.5" style={{ color: 'var(--text-1, #FAFAFA)' }}>
              Something went wrong
            </h1>
            <p className="text-[13px] mb-5" style={{ color: 'var(--text-3, #71717A)' }}>
              An unexpected error occurred. Reloading usually resolves this.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 rounded-lg text-[13px] font-medium text-white"
              style={{ background: '#6366F1' }}
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
