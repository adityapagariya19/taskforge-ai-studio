import { useNavigate } from 'react-router-dom';
import { useDemo } from '../lib/demo';

export default function DemoBanner() {
  const { isDemo, exit } = useDemo();
  const navigate = useNavigate();
  if (!isDemo) return null;

  function handleExit() {
    exit();
    navigate('/login');
  }

  return (
    <div className="demo-banner">
      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ai)', boxShadow: '0 0 6px var(--ai)' }} />
      <span style={{ color: 'var(--text-2)' }}>
        <span style={{ color: 'var(--ai)', fontWeight: 500 }}>Demo Mode</span>
        {' '}— You're exploring TaskForge with sample data. No backend required.
      </span>
      <button onClick={handleExit}
              className="ml-2 text-[12px] px-3 py-1 rounded-lg font-medium transition-all"
              style={{ background: 'var(--primary-muted)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.3)' }}>
        Exit demo
      </button>
    </div>
  );
}
