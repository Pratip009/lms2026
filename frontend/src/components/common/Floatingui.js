import { useState, useEffect } from 'react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');

  /* ══ SCROLL TO TOP ══ */
  .stt-btn {
    position: fixed;
    bottom: 28px; right: 24px;
    z-index: 500;
    width: 48px; height: 48px;
    border: none; cursor: pointer;
    border-radius: 14px;
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow:
      0 4px 20px rgba(37,99,235,0.45),
      0 0 0 1px rgba(37,99,235,0.3),
      inset 0 1px 0 rgba(255,255,255,0.18);
    transition: opacity .3s, transform .3s, box-shadow .25s;
    overflow: hidden;
    outline: none;
  }

  .stt-btn.hidden {
    opacity: 0; pointer-events: none;
    transform: translateY(16px) scale(0.88);
  }
  .stt-btn.visible {
    opacity: 1; pointer-events: auto;
    transform: translateY(0) scale(1);
  }

  /* Shimmer sweep */
  .stt-btn::before {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    animation: stt-shimmer 2.6s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes stt-shimmer {
    0%   { left: -100%; }
    60%  { left: 150%; }
    100% { left: 150%; }
  }

  /* Ripple on click */
  .stt-btn::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 65%);
    opacity: 0;
    transition: opacity .15s;
  }
  .stt-btn:active::after { opacity: 1; }

  .stt-btn:hover {
    box-shadow:
      0 8px 30px rgba(37,99,235,0.55),
      0 0 0 1px rgba(96,165,250,0.4),
      inset 0 1px 0 rgba(255,255,255,0.18);
    transform: translateY(-3px) scale(1.04);
  }

  /* Progress ring around button */
  .stt-ring {
    position: absolute; inset: -4px;
    border-radius: 18px;
    pointer-events: none;
    overflow: visible;
  }
  .stt-ring-track {
    fill: none;
    stroke: rgba(96,165,250,0.15);
    stroke-width: 2;
  }
  .stt-ring-fill {
    fill: none;
    stroke: url(#sttGrad);
    stroke-width: 2;
    stroke-linecap: round;
    transition: stroke-dashoffset .1s linear;
  }

  .stt-arrow {
    position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: center;
    transition: transform .2s cubic-bezier(0.34,1.56,0.64,1);
  }
  .stt-btn:hover .stt-arrow { transform: translateY(-2px); }

  /* Tooltip */
  .stt-tooltip {
    position: absolute; bottom: 56px; right: 0;
    background: #050f2b;
    border: 1px solid rgba(37,99,235,0.3);
    color: rgba(240,246,255,0.9);
    font-family: 'DM Sans', sans-serif;
    font-size: 10px; font-weight: 600; letter-spacing: .08em;
    text-transform: uppercase;
    padding: 5px 10px; border-radius: 8px;
    white-space: nowrap;
    opacity: 0; transform: translateY(4px);
    transition: opacity .2s, transform .2s;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(5,15,43,0.4);
  }
  .stt-tooltip::after {
    content: '';
    position: absolute; top: 100%; right: 16px;
    border: 4px solid transparent;
    border-top-color: rgba(37,99,235,0.3);
  }
  .stt-btn:hover .stt-tooltip { opacity: 1; transform: translateY(0); }

  /* ══ SOCIAL SIDEBAR ══ */
  .social-rail {
    position: fixed;
    left: 20px; top: 50%;
    transform: translateY(-50%);
    z-index: 500;
    display: flex; flex-direction: column;
    align-items: center; gap: 6px;
  }

  /* Vertical line above */
  .social-line {
    width: 1.5px; height: 48px;
    background: linear-gradient(180deg, transparent, rgba(37,99,235,0.5));
    border-radius: 2px;
    margin-bottom: 4px;
    animation: social-line-in .6s ease both;
  }
  .social-line-bottom {
    width: 1.5px; height: 48px;
    background: linear-gradient(180deg, rgba(37,99,235,0.5), transparent);
    border-radius: 2px;
    margin-top: 4px;
    animation: social-line-in .6s ease both .2s;
  }

  @keyframes social-line-in {
    from { opacity: 0; transform: scaleY(0); }
    to   { opacity: 1; transform: scaleY(1); }
  }

  .social-btn {
    position: relative;
    width: 40px; height: 40px;
    border-radius: 12px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.07);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; text-decoration: none;
    transition: all .22s cubic-bezier(0.34,1.56,0.64,1);
    backdrop-filter: blur(6px);
    overflow: hidden;
  }

  /* Individual brand colors on hover */
  .social-btn.instagram:hover { background: rgba(225,48,108,0.15); border-color: rgba(225,48,108,0.4); box-shadow: 0 6px 20px rgba(225,48,108,0.25), 0 0 0 1px rgba(225,48,108,0.2); }
  .social-btn.youtube:hover   { background: rgba(255,0,0,0.15);    border-color: rgba(255,0,0,0.4);    box-shadow: 0 6px 20px rgba(255,0,0,0.25),    0 0 0 1px rgba(255,0,0,0.2); }
  .social-btn.twitter:hover   { background: rgba(29,161,242,0.15); border-color: rgba(29,161,242,0.4); box-shadow: 0 6px 20px rgba(29,161,242,0.25), 0 0 0 1px rgba(29,161,242,0.2); }
  .social-btn.linkedin:hover  { background: rgba(10,102,194,0.15); border-color: rgba(10,102,194,0.4); box-shadow: 0 6px 20px rgba(10,102,194,0.25), 0 0 0 1px rgba(10,102,194,0.2); }
  .social-btn.whatsapp:hover  { background: rgba(37,211,102,0.15); border-color: rgba(37,211,102,0.4); box-shadow: 0 6px 20px rgba(37,211,102,0.25), 0 0 0 1px rgba(37,211,102,0.2); }

  .social-btn:hover { transform: translateX(4px) scale(1.08); }

  /* Shimmer on hover */
  .social-btn::before {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
    transition: left .4s ease;
    pointer-events: none;
  }
  .social-btn:hover::before { left: 150%; }

  .social-btn svg {
    width: 16px; height: 16px;
    transition: transform .2s;
    color: rgba(148,163,184,0.7);
    fill: currentColor;
  }
  .social-btn.instagram:hover svg { color: #e1306c; }
  .social-btn.youtube:hover svg   { color: #ff0000; }
  .social-btn.twitter:hover svg   { color: #1da1f2; }
  .social-btn.linkedin:hover svg  { color: #0a66c2; }
  .social-btn.whatsapp:hover svg  { color: #25d366; }

  .social-btn:hover svg { transform: scale(1.15); }

  /* Tooltip on right */
  .social-tooltip {
    position: absolute; left: 52px; top: 50%;
    transform: translateY(-50%) translateX(-4px);
    background: #050f2b;
    border: 1px solid rgba(37,99,235,0.25);
    color: rgba(240,246,255,0.85);
    font-family: 'DM Sans', sans-serif;
    font-size: 10px; font-weight: 600; letter-spacing: .07em;
    text-transform: uppercase;
    padding: 4px 9px; border-radius: 7px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity .18s, transform .18s;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(5,15,43,0.5);
  }
  .social-tooltip::before {
    content: '';
    position: absolute; right: 100%; top: 50%;
    transform: translateY(-50%);
    border: 4px solid transparent;
    border-right-color: rgba(37,99,235,0.25);
  }
  .social-btn:hover .social-tooltip {
    opacity: 1; transform: translateY(-50%) translateX(0);
  }

  /* Staggered entrance */
  .social-btn { animation: social-btn-in .4s cubic-bezier(0.34,1.56,0.64,1) both; }
  .social-btn:nth-child(1) { animation-delay: .05s; }
  .social-btn:nth-child(2) { animation-delay: .10s; }
  .social-btn:nth-child(3) { animation-delay: .15s; }
  .social-btn:nth-child(4) { animation-delay: .20s; }
  .social-btn:nth-child(5) { animation-delay: .25s; }

  @keyframes social-btn-in {
    from { opacity: 0; transform: translateX(-14px) scale(0.8); }
    to   { opacity: 1; transform: translateX(0) scale(1); }
  }

  /* ── Mobile: hide social rail, move STT ── */
  @media (max-width: 768px) {
    .social-rail { display: none; }
    .stt-btn { bottom: 20px; right: 16px; width: 44px; height: 44px; border-radius: 12px; }
  }
`;

const SOCIALS = [
  {
    key: 'instagram',
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    key: 'youtube',
    label: 'YouTube',
    href: 'https://youtube.com',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
      </svg>
    ),
  },
  {
    key: 'twitter',
    label: 'Twitter / X',
    href: 'https://twitter.com',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    href: 'https://wa.me',
    icon: (
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
      </svg>
    ),
  },
];

// SVG perimeter length for rounded rect 56x56 r=18: ~2*(56-36)+(PI*36) ≈ 153
const PERIMETER = 153;

export default function FloatingUI() {
  const [visible,  setVisible]  = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop    = window.scrollY;
      const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
      const pct          = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollPct(pct);
      setVisible(scrollTop > 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const dashOffset = PERIMETER - scrollPct * PERIMETER;

  return (
    <>
      <style>{css}</style>

      {/* ── Social Rail (left) ── */}
      <div className="social-rail">
        <div className="social-line" />
        {SOCIALS.map(s => (
          <a
            key={s.key}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`social-btn ${s.key}`}
            aria-label={s.label}
          >
            {s.icon}
            <span className="social-tooltip">{s.label}</span>
          </a>
        ))}
        <div className="social-line-bottom" />
      </div>

      {/* ── Scroll to Top (bottom right) ── */}
      <button
        className={`stt-btn ${visible ? 'visible' : 'hidden'}`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        {/* Progress ring */}
        <svg className="stt-ring" viewBox="0 0 56 56" width="56" height="56">
          <defs>
            <linearGradient id="sttGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#93c5fd" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <rect
            className="stt-ring-track"
            x="3" y="3" width="50" height="50" rx="15"
          />
          <rect
            className="stt-ring-fill"
            x="3" y="3" width="50" height="50" rx="15"
            strokeDasharray={PERIMETER}
            strokeDashoffset={dashOffset}
            style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          />
        </svg>

        {/* Arrow */}
        <span className="stt-arrow">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 19V5M5 12l7-7 7 7"/>
          </svg>
        </span>

        {/* Tooltip */}
        <span className="stt-tooltip">Back to top</span>
      </button>
    </>
  );
}