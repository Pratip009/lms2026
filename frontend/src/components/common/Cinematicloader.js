import { useState, useEffect } from 'react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  .bhi-loader-root {
    position: fixed; inset: 0; z-index: 9999;
    background: #050f2b;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Grid texture ── */
  .bhi-loader-root::before {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: bhi-grid-fade 2.5s ease forwards;
  }

  /* ── Radial glows ── */
  .bhi-glow-1 {
    position: absolute;
    top: -15%; left: -10%; width: 60%; height: 60%;
    background: radial-gradient(ellipse, rgba(37,99,235,0.40) 0%, transparent 65%);
    animation: bhi-glow-drift 3s ease-in-out infinite alternate;
    pointer-events: none;
  }
  .bhi-glow-2 {
    position: absolute;
    bottom: -20%; right: -10%; width: 55%; height: 55%;
    background: radial-gradient(ellipse, rgba(59,130,246,0.22) 0%, transparent 65%);
    animation: bhi-glow-drift 3s ease-in-out infinite alternate-reverse;
    pointer-events: none;
  }
  .bhi-glow-3 {
    position: absolute;
    top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 500px; height: 500px;
    background: radial-gradient(ellipse, rgba(29,78,216,0.15) 0%, transparent 60%);
    pointer-events: none;
    animation: bhi-center-pulse 2s ease-in-out infinite;
  }

  /* ── Particles ── */
  .bhi-particles {
    position: absolute; inset: 0; pointer-events: none; overflow: hidden;
  }
  .bhi-particle {
    position: absolute; border-radius: 50%;
    background: rgba(96,165,250,0.6);
    animation: bhi-float linear infinite;
  }

  /* ── Center content ── */
  .bhi-center {
    position: relative; z-index: 2;
    display: flex; flex-direction: column;
    align-items: center; gap: 0;
  }

  /* ── Icon mark ── */
  .bhi-icon-wrap {
    width: 72px; height: 72px; border-radius: 20px;
    background: linear-gradient(135deg, #2563eb, #1e40af);
    display: flex; align-items: center; justify-content: center;
    box-shadow:
      0 0 0 1px rgba(37,99,235,0.4),
      0 0 40px rgba(37,99,235,0.5),
      inset 0 1px 0 rgba(255,255,255,0.15);
    margin-bottom: 28px;
    animation: bhi-icon-in .6s cubic-bezier(0.34,1.56,0.64,1) both;
    position: relative;
  }
  .bhi-icon-wrap::after {
    content: '';
    position: absolute; inset: -1px;
    border-radius: 21px;
    background: linear-gradient(135deg, rgba(96,165,250,0.6), transparent 60%);
    pointer-events: none;
  }
  .bhi-icon-ring {
    position: absolute; inset: -8px;
    border-radius: 28px;
    border: 1px solid rgba(96,165,250,0.2);
    animation: bhi-ring-pulse 2s ease-in-out infinite;
  }

  /* ── Title ── */
  .bhi-title-wrap {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    margin-bottom: 10px;
  }
  .bhi-eyebrow {
    font-size: 10px; font-weight: 700; letter-spacing: .22em;
    text-transform: uppercase; color: #60a5fa;
    animation: bhi-fade-up .5s ease both .3s;
    font-family: 'Syne', sans-serif;
  }
  .bhi-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(36px, 8vw, 58px);
    font-weight: 800; letter-spacing: -.05em;
    line-height: 1;
    background: linear-gradient(135deg, #f0f6ff 30%, #93c5fd 70%, #60a5fa);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: bhi-fade-up .55s ease both .15s;
  }
  .bhi-title-accent {
    font-family: 'Syne', sans-serif;
    font-size: clamp(11px, 2vw, 14px);
    font-weight: 500; letter-spacing: .12em;
    text-transform: uppercase; color: rgba(148,163,184,0.6);
    margin-top: 6px; margin-bottom: 40px;
    animation: bhi-fade-up .5s ease both .35s;
  }

  /* ── Progress bar ── */
  .bhi-progress-wrap {
    width: clamp(200px, 40vw, 320px);
    animation: bhi-fade-up .5s ease both .5s;
  }
  .bhi-progress-track {
    height: 3px; background: rgba(255,255,255,0.08);
    border-radius: 100px; overflow: hidden;
    margin-bottom: 14px;
    box-shadow: 0 0 8px rgba(37,99,235,0.2);
  }
  .bhi-progress-fill {
    height: 100%; border-radius: 100px;
    background: linear-gradient(90deg, #2563eb, #60a5fa, #93c5fd);
    background-size: 200% 100%;
    transition: width .15s ease;
    position: relative;
    animation: bhi-shimmer-bar 1.5s linear infinite;
  }
  .bhi-progress-fill::after {
    content: '';
    position: absolute; top: -2px; right: -1px;
    width: 6px; height: 6px; border-radius: 50%;
    background: #93c5fd;
    box-shadow: 0 0 8px 2px rgba(147,197,253,0.8);
  }

  .bhi-status {
    text-align: center;
    font-size: 11px; font-weight: 500; letter-spacing: .08em;
    color: rgba(148,163,184,0.55);
    height: 16px;
    animation: bhi-fade-up .5s ease both .55s;
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Dots ── */
  .bhi-dots {
    display: flex; gap: 6px; margin-top: 28px;
    animation: bhi-fade-up .5s ease both .6s;
  }
  .bhi-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: rgba(96,165,250,0.3);
    transition: background .3s, transform .3s;
  }
  .bhi-dot.active {
    background: #60a5fa;
    transform: scale(1.4);
    box-shadow: 0 0 6px rgba(96,165,250,0.6);
  }

  /* ── Exit animation ── */
  .bhi-loader-root.exiting {
    animation: bhi-exit .6s cubic-bezier(0.4,0,1,1) forwards;
  }

  /* ── Keyframes ── */
  @keyframes bhi-grid-fade {
    0%   { opacity: 0; }
    30%  { opacity: 1; }
    100% { opacity: 0.4; }
  }
  @keyframes bhi-glow-drift {
    from { transform: translate(0, 0) scale(1); }
    to   { transform: translate(2%, 3%) scale(1.06); }
  }
  @keyframes bhi-center-pulse {
    0%,100% { opacity: .8; transform: translate(-50%,-50%) scale(1); }
    50%      { opacity: 1;  transform: translate(-50%,-50%) scale(1.08); }
  }
  @keyframes bhi-icon-in {
    from { opacity: 0; transform: scale(0.5) rotate(-10deg); }
    to   { opacity: 1; transform: scale(1) rotate(0deg); }
  }
  @keyframes bhi-ring-pulse {
    0%,100% { transform: scale(1); opacity: .5; }
    50%      { transform: scale(1.08); opacity: .15; }
  }
  @keyframes bhi-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bhi-shimmer-bar {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  @keyframes bhi-float {
    0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: .6; }
    100% { transform: translateY(-100vh) translateX(var(--dx)) scale(.5); opacity: 0; }
  }
  @keyframes bhi-exit {
    0%   { opacity: 1; transform: scale(1); }
    40%  { opacity: 1; transform: scale(1.02); }
    100% { opacity: 0; transform: scale(1.06); pointer-events: none; }
  }
`;

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  size: `${2 + Math.random() * 3}px`,
  duration: `${4 + Math.random() * 6}s`,
  delay: `${Math.random() * 4}s`,
  dx: `${(Math.random() - 0.5) * 80}px`,
}));

const STEPS = [
  'Initialising platform…',
  'Loading your courses…',
  'Preparing content…',
  'Almost ready…',
];

const LogoIcon = () => (
  <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
    <path d="M6 28V12L18 7L30 12V28L18 33L6 28Z" fill="rgba(255,255,255,0.92)"/>
    <path d="M18 7V33M6 28L18 24.5M30 28L18 24.5" stroke="rgba(37,99,235,0.55)" strokeWidth="1.5"/>
    <circle cx="18" cy="18" r="4" fill="rgba(37,99,235,0.35)" stroke="rgba(96,165,250,0.7)" strokeWidth="1"/>
  </svg>
);

export default function CinematicLoader({ onDone }) {
  const [progress,  setProgress]  = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [exiting,   setExiting]   = useState(false);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    // Lock scroll
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const TOTAL = 2600; // ms total duration
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct     = Math.min((elapsed / TOTAL) * 100, 100);
      setProgress(pct);
      setActiveDot(Math.min(Math.floor(pct / 25), 3));
      setStepIndex(Math.min(Math.floor((pct / 100) * STEPS.length), STEPS.length - 1));

      if (pct < 100) {
        requestAnimationFrame(tick);
      } else {
        // Start exit
        setExiting(true);
        setTimeout(() => {
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
          onDone?.();
        }, 600);
      }
    };

    const raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, [onDone]);

  return (
    <>
      <style>{css}</style>
      <div className={`bhi-loader-root${exiting ? ' exiting' : ''}`}>
        {/* Glows */}
        <div className="bhi-glow-1" />
        <div className="bhi-glow-2" />
        <div className="bhi-glow-3" />

        {/* Particles */}
        <div className="bhi-particles">
          {PARTICLES.map(p => (
            <div key={p.id} className="bhi-particle" style={{
              left: p.left, bottom: '-10px',
              width: p.size, height: p.size,
              animationDuration: p.duration,
              animationDelay: p.delay,
              '--dx': p.dx,
            }} />
          ))}
        </div>

        {/* Center */}
        <div className="bhi-center">
          <div className="bhi-icon-wrap">
            <div className="bhi-icon-ring" />
            <LogoIcon />
          </div>

          <div className="bhi-title-wrap">
            <span className="bhi-eyebrow">Welcome to</span>
            <span className="bhi-title">BHI Learning</span>
          </div>
          <span className="bhi-title-accent">Learn · Watch · Excel</span>

          <div className="bhi-progress-wrap">
            <div className="bhi-progress-track">
              <div className="bhi-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="bhi-status">{STEPS[stepIndex]}</div>
          </div>

          <div className="bhi-dots">
            {[0,1,2,3].map(i => (
              <div key={i} className={`bhi-dot${activeDot === i ? ' active' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}