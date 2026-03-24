import { useState, useEffect } from 'react';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Tenor+Sans&display=swap');

  :root {
    --gold:        #b89a5a;
    --gold-light:  #d4b97a;
    --gold-pale:   #f0e6cc;
    --ink:         #1a1714;
    --ink-soft:    #3d3830;
    --silk:        #faf9f7;
    --line:        rgba(184,154,90,0.2);
    --line-strong: rgba(184,154,90,0.5);
  }

  /* ══════════════════════════════
     SOCIAL RAIL — LEFT EDGE
  ══════════════════════════════ */
  .fp-rail {
    position: fixed;
    left: 28px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
  }

  .fp-line {
    width: 1px;
    height: 64px;
    background: linear-gradient(to bottom, transparent, var(--gold));
    animation: fp-line-grow .8s cubic-bezier(0.22,1,0.36,1) both;
    transform-origin: top;
  }
  .fp-line-bot {
    width: 1px;
    height: 64px;
    background: linear-gradient(to bottom, var(--gold), transparent);
    animation: fp-line-grow .8s cubic-bezier(0.22,1,0.36,1) both .3s;
    transform-origin: bottom;
  }
  @keyframes fp-line-grow {
    from { transform: scaleY(0); opacity: 0; }
    to   { transform: scaleY(1); opacity: 1; }
  }

  .fp-monogram {
    font-family: 'Cormorant Garamond', serif;
    font-style: italic;
    font-size: 9px;
    letter-spacing: .28em;
    text-transform: uppercase;
    color: var(--gold);
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    margin: 10px 0;
    opacity: .65;
    user-select: none;
    animation: fp-fade-in .6s ease both .5s;
  }
  @keyframes fp-fade-in {
    from { opacity: 0; }
    to   { opacity: .65; }
  }

  .fp-icon {
    position: relative;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    text-decoration: none;
    margin: 3px 0;
    animation: fp-icon-in .5s cubic-bezier(0.22,1,0.36,1) both;
  }
  .fp-icon:nth-child(3) { animation-delay: .10s; }
  .fp-icon:nth-child(4) { animation-delay: .16s; }
  .fp-icon:nth-child(5) { animation-delay: .22s; }
  .fp-icon:nth-child(6) { animation-delay: .28s; }
  .fp-icon:nth-child(7) { animation-delay: .34s; }

  @keyframes fp-icon-in {
    from { opacity: 0; transform: translateX(-10px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* Circular border drawn on hover */
  .fp-icon::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 1px solid transparent;
    transition: border-color .3s ease;
  }
  .fp-icon:hover::before {
    border-color: var(--line-strong);
  }

  /* Gold dot */
  .fp-icon::after {
    content: '';
    position: absolute;
    bottom: 2px; right: 2px;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--gold);
    opacity: 0;
    transform: scale(0);
    transition: opacity .2s, transform .25s cubic-bezier(0.34,1.56,0.64,1);
  }
  .fp-icon:hover::after {
    opacity: 1;
    transform: scale(1);
  }

  .fp-icon svg {
    width: 14px; height: 14px;
    fill: #9a8f84;
    transition: fill .25s ease, transform .3s cubic-bezier(0.34,1.56,0.64,1);
    flex-shrink: 0;
  }
  .fp-icon:hover svg {
    fill: var(--gold);
    transform: scale(1.12);
  }

  .fp-tip {
    position: absolute;
    left: 50px;
    top: 50%;
    transform: translateY(-50%) translateX(-6px);
    background: var(--ink);
    color: var(--gold-pale);
    font-family: 'Tenor Sans', sans-serif;
    font-size: 8.5px;
    letter-spacing: .22em;
    text-transform: uppercase;
    padding: 5px 12px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity .2s ease, transform .2s ease;
    border-left: 1px solid var(--gold);
  }
  .fp-tip::before {
    content: '';
    position: absolute;
    right: 100%; top: 50%;
    transform: translateY(-50%);
    border: 4px solid transparent;
    border-right-color: var(--ink);
  }
  .fp-icon:hover .fp-tip {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }


  /* ══════════════════════════════
     SCROLL TO TOP — BOTTOM RIGHT
  ══════════════════════════════ */
  .fp-stt {
    position: fixed;
    bottom: 36px; right: 34px;
    z-index: 600;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    opacity: 0;
    transform: translateY(14px);
    transition: opacity .45s ease, transform .45s ease;
    pointer-events: none;
  }
  .fp-stt.show {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .fp-pct {
    font-family: 'Cormorant Garamond', serif;
    font-size: 11px;
    font-weight: 300;
    letter-spacing: .14em;
    color: var(--gold);
    margin-bottom: 7px;
    text-align: center;
  }

  .fp-spine {
    width: 1px;
    height: 52px;
    background: var(--line);
    position: relative;
    margin-bottom: 12px;
    overflow: hidden;
  }
  .fp-spine-fill {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: linear-gradient(to top, var(--gold-light), var(--gold));
    transition: height .12s linear;
  }

  .fp-stt-btn {
    position: relative;
    width: 48px; height: 48px;
    border-radius: 50%;
    border: 1px solid var(--line-strong);
    background: rgba(250,249,247,0.92);
    backdrop-filter: blur(10px);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    outline: none;
    padding: 0;
    transition: border-color .3s, background .3s, box-shadow .3s, transform .2s;
    box-shadow:
      0 2px 16px rgba(184,154,90,0.1),
      inset 0 1px 0 rgba(255,255,255,0.95);
  }
  .fp-stt-btn:hover {
    border-color: var(--gold);
    background: var(--ink);
    box-shadow:
      0 10px 36px rgba(184,154,90,0.2),
      0 0 0 5px rgba(184,154,90,0.07);
  }
  .fp-stt-btn:hover .fp-stt-arrow {
    stroke: var(--gold-pale);
    transform: translateY(-2px);
  }
  .fp-stt-btn:active {
    transform: scale(.94);
  }

  /* SVG ring */
  .fp-stt-ring {
    position: absolute;
    inset: -7px;
    border-radius: 50%;
    pointer-events: none;
    overflow: visible;
  }
  .fp-stt-ring .track {
    fill: none;
    stroke: var(--line);
    stroke-width: 1;
  }
  .fp-stt-ring .fill {
    fill: none;
    stroke: var(--gold);
    stroke-width: 1;
    stroke-linecap: round;
    transition: stroke-dashoffset .12s linear;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
  }

  .fp-stt-arrow {
    width: 15px; height: 15px;
    stroke: var(--ink-soft);
    fill: none;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: stroke .25s, transform .3s cubic-bezier(0.34,1.56,0.64,1);
    position: relative; z-index: 1;
  }

  .fp-stt-caption {
    font-family: 'Tenor Sans', sans-serif;
    font-size: 7.5px;
    letter-spacing: .3em;
    text-transform: uppercase;
    color: var(--gold);
    margin-top: 10px;
    opacity: 0;
    transform: translateY(-3px);
    transition: opacity .22s, transform .22s;
    white-space: nowrap;
  }
  .fp-stt:hover .fp-stt-caption {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .fp-rail { display: none; }
    .fp-stt  { bottom: 22px; right: 18px; }
  }
`;

const C = 2 * Math.PI * 31; // r=31

const SOCIALS = [
  {
    key: 'instagram', label: 'Instagram', href: 'https://instagram.com',
    icon: <svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>,
  },
  {
    key: 'youtube', label: 'YouTube', href: 'https://youtube.com',
    icon: <svg viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>,
  },
  {
    key: 'twitter', label: 'Twitter / X', href: 'https://twitter.com',
    icon: <svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  },
  {
    key: 'linkedin', label: 'LinkedIn', href: 'https://linkedin.com',
    icon: <svg viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  },
  {
    key: 'whatsapp', label: 'WhatsApp', href: 'https://wa.me',
    icon: <svg viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>,
  },
];

export default function FloatingUI() {
  const [scrollPct, setScrollPct] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? top / max : 0);
      setVisible(top > 280);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const pct = Math.round(scrollPct * 100);
  const dashOffset = C - scrollPct * C;

  return (
    <>
      <style>{css}</style>

      {/* ── Social Rail ── */}
      <aside className="fp-rail" aria-label="Social links">
        <div className="fp-line" />
        <span className="fp-monogram">Follow</span>
        {SOCIALS.map(s => (
          <a
            key={s.key}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="fp-icon"
            aria-label={s.label}
          >
            {s.icon}
            <span className="fp-tip">{s.label}</span>
          </a>
        ))}
        <div className="fp-line-bot" />
      </aside>

      {/* ── Scroll to Top ── */}
      <div className={`fp-stt ${visible ? 'show' : ''}`}>
        <div className="fp-pct">
          {pct}<span style={{ fontSize: '7px', letterSpacing: '.08em' }}>&thinsp;%</span>
        </div>

        <div className="fp-spine">
          <div className="fp-spine-fill" style={{ height: `${pct}%` }} />
        </div>

        <button className="fp-stt-btn" onClick={scrollToTop} aria-label="Back to top">
          <svg className="fp-stt-ring" viewBox="0 0 76 76" width="62" height="62">
            <circle className="track" cx="38" cy="38" r="31" />
            <circle
              className="fill"
              cx="38" cy="38" r="31"
              strokeDasharray={C}
              strokeDashoffset={dashOffset}
            />
          </svg>
          <svg className="fp-stt-arrow" viewBox="0 0 24 24">
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>

        <div className="fp-stt-caption">Return</div>
      </div>
    </>
  );
}