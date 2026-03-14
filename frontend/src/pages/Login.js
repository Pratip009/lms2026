import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, clearError } from '../redux/slices/authSlice';
import { Alert } from '../components/common';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --b50:  #eff6ff;
    --b100: #dbeafe;
    --b200: #bfdbfe;
    --b300: #93c5fd;
    --b400: #60a5fa;
    --b500: #3b82f6;
    --b600: #2563eb;
    --b700: #1d4ed8;
    --b800: #1e40af;
    --b900: #1e3a8a;

    --hero:      #050f2b;

    --ink:       #0f172a;
    --ink-2:     #334155;
    --ink-3:     #64748b;
    --ink-4:     #94a3b8;
    --ink-5:     #cbd5e1;

    --surface:   #f8fafc;
    --surface-2: #f1f5f9;
    --border:    rgba(15,23,42,0.08);
    --border-2:  rgba(15,23,42,0.14);
    --white:     #ffffff;

    --danger:    #be123c;
    --danger-lt: #fff1f2;

    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .login-root {
    font-family: var(--font-body);
    min-height: calc(100vh - 64px);
    display: grid;
    grid-template-columns: 1fr 1fr;
    -webkit-font-smoothing: antialiased;
  }

  /* ══ LEFT DARK HERO ══ */
  .login-left {
    background: var(--hero);
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 48px 52px;
    position: relative; overflow: hidden;
  }

  /* Grid texture */
  .login-left::before {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 36px 36px;
  }

  /* Primary radial glow top-left */
  .login-left::after {
    content: '';
    position: absolute;
    top: -20%; left: -10%; width: 70%; height: 70%;
    background: radial-gradient(ellipse, rgba(37,99,235,0.35) 0%, transparent 68%);
    pointer-events: none;
  }

  /* Secondary glow bottom-right */
  .login-glow2 {
    position: absolute;
    bottom: -15%; right: -15%; width: 55%; height: 55%;
    background: radial-gradient(ellipse, rgba(59,130,246,0.18) 0%, transparent 68%);
    pointer-events: none;
  }

  /* ── Logo ── */
  .login-logo {
    position: relative; z-index: 2;
    display: flex; align-items: center; gap: 8px;
    text-decoration: none;
  }
  .login-logo-mark {
    width: 30px; height: 30px; border-radius: 8px;
    background: linear-gradient(135deg, var(--b600), var(--b800));
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(37,99,235,0.40), inset 0 1px 0 rgba(255,255,255,0.15);
    flex-shrink: 0;
  }
  .login-logo-mark svg { width: 14px; height: 14px; }
  .login-logo-text {
    font-family: var(--font-display);
    font-size: 16px; font-weight: 700;
    color: #f0f6ff; letter-spacing: -.03em;
  }
  .login-logo-text span { color: var(--b400); }

  /* ── Hero body ── */
  .login-left-body {
    position: relative; z-index: 2;
    flex: 1; display: flex; flex-direction: column;
    justify-content: center; padding: 32px 0;
  }

  .login-eyebrow {
    font-family: var(--font-body);
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: var(--b400);
    margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }
  .login-eyebrow-line {
    display: inline-block; width: 24px; height: 1.5px;
    background: var(--b500); border-radius: 2px;
  }

  .login-headline {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(28px, 3vw, 44px);
    color: #f0f6ff; line-height: 1.05;
    letter-spacing: -.04em; margin-bottom: 18px;
  }
  .login-headline em {
    font-style: normal;
    background: linear-gradient(135deg, var(--b300), var(--b500));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .login-sub {
    font-size: 14px; font-weight: 300;
    color: rgba(148,163,184,0.85);
    line-height: 1.75; max-width: 300px;
  }

  /* ── Feature pills ── */
  .login-pills {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; gap: 10px;
  }
  .login-pill {
    display: flex; align-items: center; gap: 12px;
    font-family: var(--font-body);
    font-size: 13px; font-weight: 400;
    color: rgba(148,163,184,0.75);
  }
  .login-pill-check {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
    background: rgba(37,99,235,0.15);
    border: 1px solid rgba(37,99,235,0.30);
    display: flex; align-items: center; justify-content: center;
  }
  .login-pill-check svg {
    width: 10px; height: 10px;
    stroke: var(--b400); stroke-width: 2.5; fill: none;
  }

  /* ══ RIGHT FORM PANEL ══ */
  .login-right {
    background: var(--white);
    display: flex; align-items: center; justify-content: center;
    padding: 48px 52px;
    position: relative;
  }

  /* Blue gradient accent line at top */
  .login-right::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--b700), var(--b500), var(--b300));
    opacity: 0.55;
  }

  .login-form-wrap { width: 100%; max-width: 360px; }

  .login-form-header { margin-bottom: 32px; }
  .login-form-title {
    font-family: var(--font-display);
    font-size: 28px; font-weight: 800; color: var(--ink);
    letter-spacing: -.04em; margin-bottom: 6px;
  }
  .login-form-sub {
    font-size: 13.5px; color: var(--ink-4); font-weight: 300;
  }
  .login-form-sub a {
    color: var(--b600); font-weight: 500; text-decoration: none;
  }
  .login-form-sub a:hover { text-decoration: underline; }

  /* Fields */
  .login-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px; }
  .login-field { display: flex; flex-direction: column; gap: 6px; }
  .login-label {
    font-family: var(--font-body);
    font-size: 12.5px; font-weight: 600; color: var(--ink-2);
    letter-spacing: .01em;
  }

  .login-input-wrap { position: relative; }
  .login-input {
    width: 100%; padding: 11px 14px;
    background: var(--surface);
    border: 1.5px solid var(--border-2);
    border-radius: 10px;
    font-family: var(--font-body);
    font-size: 14px; font-weight: 400; color: var(--ink);
    outline: none;
    transition: border-color .14s, box-shadow .14s, background .14s;
  }
  .login-input::placeholder { color: var(--ink-5); }
  .login-input:focus {
    background: var(--white);
    border-color: var(--b500);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  }

  /* Password toggle */
  .login-pw-toggle {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--ink-4); display: flex; align-items: center;
    padding: 2px; transition: color .14s;
  }
  .login-pw-toggle:hover { color: var(--b600); }

  /* Forgot */
  .login-forgot-row {
    display: flex; justify-content: flex-end; margin-bottom: 18px;
  }
  .login-forgot {
    font-size: 12.5px; font-weight: 500; color: var(--ink-4);
    text-decoration: none; transition: color .14s;
  }
  .login-forgot:hover { color: var(--b600); }

  /* ── Shimmer primary button ── */
  .login-submit {
    position: relative; overflow: hidden;
    width: 100%; padding: 13px 20px;
    background: linear-gradient(135deg, var(--b500) 0%, var(--b700) 100%);
    color: white; border: none; border-radius: 10px; cursor: pointer;
    font-family: var(--font-display);
    font-size: 15px; font-weight: 700; letter-spacing: -.02em;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow:
      0 4px 20px rgba(37,99,235,0.32),
      0 0 0 1px rgba(37,99,235,0.15),
      inset 0 1px 0 rgba(255,255,255,0.15);
    transition: box-shadow .2s, transform .15s;
    margin-bottom: 20px;
  }
  .login-submit::after {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    animation: shimmer 2.8s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes shimmer {
    0%   { left: -100%; }
    60%  { left: 150%; }
    100% { left: 150%; }
  }
  .login-submit:hover:not(:disabled) {
    box-shadow:
      0 8px 28px rgba(37,99,235,0.40),
      0 0 0 1px rgba(37,99,235,0.20),
      inset 0 1px 0 rgba(255,255,255,0.15);
    transform: translateY(-1px);
  }
  .login-submit:disabled { opacity: .55; cursor: not-allowed; transform: none; }

  /* Spinner */
  @keyframes spin { to { transform: rotate(360deg); } }
  .login-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.30);
    border-top-color: white;
    animation: spin .7s linear infinite;
    flex-shrink: 0;
  }

  /* Footer */
  .login-footer {
    text-align: center;
    font-size: 13px; color: var(--ink-4); font-weight: 300;
  }
  .login-footer a { color: var(--ink-2); font-weight: 600; text-decoration: none; }
  .login-footer a:hover { color: var(--b600); text-decoration: underline; }

  /* Trust bar */
  .login-trust {
    display: flex; align-items: center; justify-content: center; gap: 18px;
    margin-top: 20px; padding-top: 20px;
    border-top: 1px solid var(--border);
  }
  .login-trust-item {
    display: flex; align-items: center; gap: 5px;
    font-size: 11.5px; color: var(--ink-5); font-weight: 500;
  }
  .login-trust-item svg {
    width: 12px; height: 12px;
    stroke: var(--b400); stroke-width: 2.5; fill: none;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .login-root { grid-template-columns: 1fr; }
    .login-left  { display: none; }
    .login-right { padding: 32px 24px; min-height: calc(100vh - 64px); }
    .login-right::before { display: none; }
  }
`;

const PILLS = [
  'Lifetime access to all your courses',
  'Track progress across every lesson',
  'Download certificates anytime',
];

const IconCheck = () => (
  <svg viewBox="0 0 12 12" fill="none">
    <polyline points="2,6 5,9 10,3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconArrow = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const LogoMark = () => (
  <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
    <path d="M2 11V5L7 3l5 2v6L7 12 2 11z" fill="rgba(255,255,255,0.9)"/>
    <path d="M7 3v9M2 11l5-1.3M12 11l-5-1.3" stroke="rgba(37,99,235,0.5)" strokeWidth="0.8"/>
  </svg>
);

const IconLock = () => (
  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="2" y="5" width="8" height="6" rx="1"/>
    <path d="M4 5V3.5a2 2 0 114 0V5"/>
  </svg>
);

const EyeOpen = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeClosed = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector(s => s.auth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (user) navigate(user.role === 'admin' ? '/admin' : '/dashboard');
  }, [user, navigate]);

  useEffect(() => { return () => dispatch(clearError()); }, [dispatch]);

  const handleSubmit = e => {
    e.preventDefault();
    dispatch(login(form));
  };

  return (
    <>
      <style>{css}</style>
      <div className="login-root">

        {/* ── LEFT DARK HERO ── */}
        <div className="login-left">
          <div className="login-glow2" />

          <Link to="/" className="login-logo">
            <div className="login-logo-mark"><LogoMark /></div>
            <span className="login-logo-text">E<span>·</span>Learn</span>
          </Link>

          <div className="login-left-body">
            <div className="login-eyebrow">
              <span className="login-eyebrow-line" />
              Welcome back
            </div>
            <h2 className="login-headline">
              Keep building<br />
              <em>great things.</em>
            </h2>
            <p className="login-sub">
              Pick up right where you left off. Your courses, progress, and certificates are waiting.
            </p>
          </div>

          <div className="login-pills">
            {PILLS.map(text => (
              <div key={text} className="login-pill">
                <div className="login-pill-check"><IconCheck /></div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT FORM ── */}
        <div className="login-right">
          <div className="login-form-wrap">

            <div className="login-form-header">
              <div className="login-form-title">Sign in</div>
              <div className="login-form-sub">
                No account?{' '}
                <Link to="/register">Create one free</Link>
              </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <div className="login-fields">
                <div className="login-field">
                  <label className="login-label">Email address</label>
                  <div className="login-input-wrap">
                    <input
                      className="login-input"
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <label className="login-label">Password</label>
                  <div className="login-input-wrap">
                    <input
                      className="login-input"
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      className="login-pw-toggle"
                      onClick={() => setShowPw(v => !v)}
                      tabIndex={-1}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeClosed /> : <EyeOpen />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="login-forgot-row">
                <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
              </div>

              <button className="login-submit" type="submit" disabled={loading}>
                {loading ? (
                  <><div className="login-spinner" /> Signing in…</>
                ) : (
                  <>Sign in <IconArrow /></>
                )}
              </button>
            </form>

            <div className="login-footer">
              Don't have an account?{' '}
              <Link to="/register">Create one free</Link>
            </div>

            <div className="login-trust">
              <div className="login-trust-item">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M6 1l1.5 3h3l-2.5 2 1 3L6 7.5 3 9l1-3L1.5 4h3z"/>
                </svg>
                SSL secured
              </div>
              <div className="login-trust-item">
                <IconLock />
                Private & encrypted
              </div>
              <div className="login-trust-item">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <circle cx="6" cy="6" r="5"/>
                  <polyline points="4,6 5.5,7.5 8.5,4.5"/>
                </svg>
                Trusted by 40k+
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}