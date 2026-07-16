import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDemo } from '../lib/demo';
import { useScrollReveal } from '../lib/useScrollReveal';

export default function LandingPage() {
  const { enter } = useDemo();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 50); return () => clearTimeout(t); }, []);

  function handleDemo() { enter(); navigate('/dashboard'); }

  return (
    <div style={{ background: 'var(--bg-base)', color: 'var(--text-1)' }}>
      <Nav />
      <Hero visible={visible} onDemo={handleDemo} />
      <ScrollShowcase />
      <FeatureSection />
      <PathSelector />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <nav className="flex items-center justify-between px-8 py-5 sticky top-0 z-30"
         style={{ background: 'rgba(9,9,11,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
             style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #8B5CF6 100%)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 10L7 4L12 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <span className="font-semibold text-[15px]">TaskForge</span>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/login" className="text-[13px] font-medium px-4 py-2 rounded-lg transition-colors" style={{ color: 'var(--text-2)' }}>Sign in</Link>
        <Link to="/register" className="btn btn-primary text-[13px]">Get started</Link>
      </div>
    </nav>
  );
}

function Hero({ visible, onDemo }: { visible: boolean; onDemo: () => void }) {
  return (
    <section className="mesh-gradient flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 min-h-[90vh]">
      <div className={`mb-8 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <span className="badge" style={{ background: 'var(--ai-muted)', color: 'var(--ai)', border: '1px solid rgba(34,211,238,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ai)' }} />
          AI-Native Engineering OS
        </span>
      </div>
      <h1 className={`text-5xl sm:text-6xl md:text-7xl font-semibold leading-[1.05] tracking-tight mb-6 transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <span className="text-gradient-primary">AI teammates</span><br/>
        <span>that actually work.</span>
      </h1>
      <p className={`text-[17px] leading-relaxed max-w-lg mb-10 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
         style={{ color: 'var(--text-2)' }}>
        The engineering workspace where AI agents plan, implement, review, and test — alongside your human team, in one connected pipeline.
      </p>
      <div className={`flex flex-col sm:flex-row items-center gap-3 mb-4 transition-all duration-700 delay-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <button onClick={onDemo} className="btn btn-primary px-6 py-3 text-[14px] font-semibold">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><path d="M3 7.5L6.5 11L12 4"/></svg>
          Try live demo
        </button>
        <a href="#paths" className="btn btn-outline px-6 py-3 text-[14px]" style={{ borderColor: 'var(--border-strong)' }}>
          Join your team
        </a>
      </div>
      <div className={`mt-16 transition-all duration-700 delay-500 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        <svg width="20" height="20" viewBox="0 0 20 20" style={{ color: 'var(--text-4)' }} className="animate-bounce">
          <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
      </div>
    </section>
  );
}

/**
 * The "video" moment — instead of an embedded clip, this pins the section
 * and animates the real product UI (board, AI agent delivering, approval)
 * as you scroll through it, driven by actual scroll-progress math against
 * the section's position in the viewport. Same communicative goal as a
 * product demo video, built from real DOM/CSS, not a canned recording.
 */
function ScrollShowcase() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0); // 0 -> 1 across the pinned scroll range

  useEffect(() => {
    function onScroll() {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      if (scrollable <= 0) return;
      const raw = -rect.top / scrollable;
      setProgress(Math.min(1, Math.max(0, raw)));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Four real "frames" driven purely by scroll progress — no video asset needed.
  const frame = progress < 0.22 ? 0 : progress < 0.48 ? 1 : progress < 0.76 ? 2 : 3;
  const frameProgress = frame === 0 ? progress / 0.22 : frame === 1 ? (progress - 0.22) / 0.26 : frame === 2 ? (progress - 0.48) / 0.28 : (progress - 0.76) / 0.24;

  const captions = [
    { title: 'Create work', body: 'A human describes the task — real title, real context.' },
    { title: 'AI delivers', body: 'The right agent picks it up and produces real, working output.' },
    { title: 'You approve', body: 'Nothing ships silently. Review, then approve — or send it back.' },
    { title: 'It advances itself', body: 'Approval automatically hands off to the next stage in the pipeline.' },
  ];

  return (
    <section ref={sectionRef} style={{ height: '340vh', position: 'relative' }}>
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden px-6"
           style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl w-full grid md:grid-cols-2 gap-10 items-center">
          {/* Caption side — crossfades between the 4 story beats */}
          <div className="relative h-40">
            {captions.map((c, i) => (
              <div key={c.title}
                   className="absolute inset-0 transition-all duration-500"
                   style={{
                     opacity: frame === i ? 1 : 0,
                     transform: frame === i ? 'translateY(0)' : 'translateY(12px)',
                     pointerEvents: frame === i ? 'auto' : 'none',
                   }}>
                <div className="text-[11px] font-mono mb-3" style={{ color: 'var(--text-4)' }}>
                  {String(i + 1).padStart(2, '0')} / 04
                </div>
                <h3 className="text-2xl font-semibold mb-2">{c.title}</h3>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text-3)' }}>{c.body}</p>
              </div>
            ))}
            {/* Progress bar */}
            <div className="absolute -bottom-6 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--border-default)' }}>
              <div className="h-full rounded-full transition-none" style={{ width: `${progress * 100}%`, background: 'var(--primary)' }} />
            </div>
          </div>

          {/* Visual side — real UI mockup, animated by scroll progress */}
          <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)', aspectRatio: '4/3' }}>
            <div className="absolute inset-0 p-5" style={{ background: 'var(--bg-surface)' }}>
              {frame === 0 && (
                <div className="animate-fade-in">
                  <div className="text-[11px] mb-2" style={{ color: 'var(--text-4)' }}>New issue</div>
                  <div className="p-3 rounded-lg mb-2" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}>
                    <div className="text-[13px] font-medium">Build Multiplayer System</div>
                    <div className="text-[11px] mt-1" style={{ color: 'var(--text-3)' }}>Real-time lobby, matchmaking, game-state sync</div>
                  </div>
                  <div className="h-2 rounded" style={{ width: `${40 + frameProgress * 40}%`, background: 'var(--primary)', opacity: 0.3 }} />
                </div>
              )}
              {frame === 1 && (
                <div className="animate-fade-in flex items-start gap-2.5">
                  <div className="ai-ring flex-shrink-0" style={{ width: 26, height: 26 }}>
                    <div className="w-full h-full rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: 'var(--bg-surface)', color: 'var(--ai)' }}>CD</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-semibold mb-1" style={{ color: 'var(--ai)' }}>CodeAI</div>
                    <div className="p-2.5 rounded-lg text-[11px] mono" style={{ background: 'var(--bg-base)', border: '1px solid var(--border-subtle)', color: 'var(--text-2)', opacity: 0.4 + frameProgress * 0.6 }}>
                      class LagCompensator {'{'}<br/>&nbsp;&nbsp;public WorldState compensate(...)
                    </div>
                  </div>
                </div>
              )}
              {frame === 2 && (
                <div className="animate-fade-in">
                  <div className="text-[11px] mb-2" style={{ color: 'var(--ai)' }}>Awaiting your review</div>
                  <div className="flex gap-2">
                    <div className="flex-1 py-2 rounded-lg text-center text-[12px] font-semibold text-white" style={{ background: 'var(--primary)', opacity: 0.5 + frameProgress * 0.5 }}>
                      Approve
                    </div>
                    <div className="flex-1 py-2 rounded-lg text-center text-[12px]" style={{ border: '1px solid var(--border-default)', color: 'var(--text-3)' }}>
                      Request changes
                    </div>
                  </div>
                </div>
              )}
              {frame === 3 && (
                <div className="animate-fade-in flex items-center gap-2 flex-wrap">
                  {['CodeAI', 'ReviewerAI', 'TesterAI', 'DocumentationAI'].map((name, i) => (
                    <div key={name} className="flex items-center gap-1.5">
                      <div className="ai-ring" style={{ width: 22, height: 22, opacity: i <= Math.floor(frameProgress * 4) ? 1 : 0.25 }}>
                        <div className="w-full h-full rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: 'var(--bg-surface)', color: 'var(--ai)' }}>
                          {name.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      {i < 3 && <span style={{ color: 'var(--text-4)' }}>→</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureSection() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const features = [
    { title: 'Live organization graph', desc: 'Zoom from company to individual — see exactly who and what AI agent is working on right now.' },
    { title: 'Real approval gates', desc: 'Nothing ships silently. Every AI delivery is reviewed by a human before the pipeline advances.' },
    { title: 'Download real output', desc: 'CodeAI delivers actual files — zip them and drop straight into your repo.' },
  ];
  return (
    <section ref={ref} className="px-6 py-24" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div key={f.title}
               className={`p-6 rounded-2xl transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
               style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', transitionDelay: `${i * 120}ms` }}>
            <h3 className="text-[15px] font-semibold mb-2">{f.title}</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-3)' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function PathSelector() {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  return (
    <section id="paths" ref={ref} className="px-6 py-24" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h2 className={`text-3xl font-semibold mb-3 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          How are you joining?
        </h2>
        <p className={`text-[15px] transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ color: 'var(--text-3)' }}>
          Pick the path that matches you.
        </p>
      </div>
      <div className={`max-w-3xl mx-auto grid sm:grid-cols-2 gap-5 transition-all duration-700 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <PathCard
          to="/join"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}
          title="I'm joining a team"
          desc="Enter your organization's join code to request access."
          cta="Join with a code"
        />
        <PathCard
          to="/register"
          icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 21h18M5 21V7l8-4v18M13 21V11l6 3v7M9 9v.01M9 12v.01M9 15v.01"/></svg>}
          title="I'm setting up my organization"
          desc="Create a new organization and invite your team."
          cta="Create organization"
        />
      </div>
    </section>
  );
}

function PathCard({ to, icon, title, desc, cta }: { to: string; icon: React.ReactNode; title: string; desc: string; cta: string }) {
  return (
    <Link to={to} className="card card-hover p-6 text-left block group">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
           style={{ background: 'var(--primary-muted)', color: 'var(--primary)' }}>
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold mb-1.5">{title}</h3>
      <p className="text-[13px] leading-relaxed mb-4" style={{ color: 'var(--text-3)' }}>{desc}</p>
      <span className="text-[13px] font-medium inline-flex items-center gap-1" style={{ color: 'var(--primary)' }}>
        {cta}
        <svg width="13" height="13" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" className="transition-transform group-hover:translate-x-0.5">
          <path d="M3 6h6M6 3l3 3-3 3"/>
        </svg>
      </span>
    </Link>
  );
}

function Footer() {
  return (
    <footer className="flex flex-col items-center justify-center py-10 gap-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <div className="flex items-center gap-6">
        {['Pricing', 'Docs', 'Blog', 'GitHub'].map(item => (
          <a key={item} href="#" className="text-[12px] transition-colors" style={{ color: 'var(--text-4)' }}>{item}</a>
        ))}
      </div>
      <div className="flex items-center gap-4 text-[12px]" style={{ color: 'var(--text-4)' }}>
        <Link to="/admin/login" className="transition-colors hover:opacity-80">Platform admin</Link>
        <span>© 2026 TaskForge</span>
      </div>
    </footer>
  );
}
