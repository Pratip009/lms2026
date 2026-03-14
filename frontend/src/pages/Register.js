import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { register, clearError } from '../redux/slices/authSlice';
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

    --green:     #16a34a;
    --green-lt:  #f0fdf4;

    --danger:    #be123c;
    --danger-lt: #fff1f2;

    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .reg-root {
    font-family: var(--font-body);
    min-height: calc(100vh - 64px);
    display: grid;
    grid-template-columns: 1fr 1fr;
    -webkit-font-smoothing: antialiased;
  }

  .reg-left {
    background: var(--hero);
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 48px 52px;
    position: relative; overflow: hidden;
  }
  .reg-left::before {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 36px 36px;
  }
  .reg-left::after {
    content: '';
    position: absolute;
    top: -20%; left: -10%; width: 70%; height: 70%;
    background: radial-gradient(ellipse, rgba(37,99,235,0.35) 0%, transparent 68%);
    pointer-events: none;
  }
  .reg-glow2 {
    position: absolute;
    bottom: -15%; right: -15%; width: 55%; height: 55%;
    background: radial-gradient(ellipse, rgba(59,130,246,0.18) 0%, transparent 68%);
    pointer-events: none;
  }

  .reg-logo {
    position: relative; z-index: 2;
    display: flex; align-items: center; gap: 8px;
    text-decoration: none;
  }
  .reg-logo-mark {
    width: 30px; height: 30px; border-radius: 8px;
    background: linear-gradient(135deg, var(--b600), var(--b800));
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(37,99,235,0.40), inset 0 1px 0 rgba(255,255,255,0.15);
    flex-shrink: 0;
  }
  .reg-logo-mark svg { width: 14px; height: 14px; }
  .reg-logo-text {
    font-family: var(--font-display);
    font-size: 16px; font-weight: 700;
    color: #f0f6ff; letter-spacing: -.03em;
  }
  .reg-logo-text span { color: var(--b400); }

  .reg-left-body {
    position: relative; z-index: 2;
    flex: 1; display: flex; flex-direction: column;
    justify-content: center; padding: 32px 0;
  }
  .reg-eyebrow {
    font-family: var(--font-body);
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: var(--b400);
    margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }
  .reg-eyebrow-line {
    display: inline-block; width: 24px; height: 1.5px;
    background: var(--b500); border-radius: 2px;
  }
  .reg-headline {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(28px, 3vw, 44px);
    color: #f0f6ff; line-height: 1.05;
    letter-spacing: -.04em; margin-bottom: 18px;
  }
  .reg-headline em {
    font-style: normal;
    background: linear-gradient(135deg, var(--b300), var(--b500));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .reg-sub {
    font-size: 14px; font-weight: 300;
    color: rgba(148,163,184,0.85);
    line-height: 1.75; max-width: 300px;
  }

  .reg-pills {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; gap: 10px;
  }
  .reg-pill {
    display: flex; align-items: center; gap: 12px;
    font-family: var(--font-body);
    font-size: 13px; font-weight: 400;
    color: rgba(148,163,184,0.75);
  }
  .reg-pill-check {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
    background: rgba(37,99,235,0.15);
    border: 1px solid rgba(37,99,235,0.30);
    display: flex; align-items: center; justify-content: center;
  }
  .reg-pill-check svg {
    width: 10px; height: 10px;
    stroke: var(--b400); stroke-width: 2.5; fill: none;
  }

  .reg-right {
    background: var(--white);
    display: flex; align-items: center; justify-content: center;
    padding: 48px 52px;
    position: relative;
  }
  .reg-right::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--b700), var(--b500), var(--b300));
    opacity: 0.55;
  }

  .reg-form-wrap { width: 100%; max-width: 360px; }

  .reg-form-header { margin-bottom: 32px; }
  .reg-form-title {
    font-family: var(--font-display);
    font-size: 28px; font-weight: 800; color: var(--ink);
    letter-spacing: -.04em; margin-bottom: 6px;
  }
  .reg-form-sub {
    font-size: 13px; color: var(--ink-4); font-weight: 300;
  }

  .reg-fields { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
  .reg-field { display: flex; flex-direction: column; gap: 6px; }
  .reg-label {
    font-family: var(--font-body);
    font-size: 12.5px; font-weight: 600; color: var(--ink-2);
    letter-spacing: .01em;
  }

  .reg-input-wrap { position: relative; }
  .reg-input {
    width: 100%; padding: 11px 14px;
    background: var(--surface);
    border: 1.5px solid var(--border-2);
    border-radius: 10px;
    font-family: var(--font-body);
    font-size: 14px; font-weight: 400; color: var(--ink);
    outline: none;
    transition: border-color .14s, box-shadow .14s, background .14s;
  }
  .reg-input::placeholder { color: var(--ink-5); }
  .reg-input:focus {
    background: var(--white);
    border-color: var(--b500);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  }
  .reg-input.valid {
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(22,163,74,0.10);
  }

  .reg-pw-toggle {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--ink-4); display: flex; align-items: center;
    padding: 2px; transition: color .14s;
  }
  .reg-pw-toggle:hover { color: var(--b600); }

  .reg-strength { margin-top: 8px; }
  .reg-strength-bars { display: flex; gap: 4px; margin-bottom: 5px; }
  .reg-strength-bar {
    flex: 1; height: 3px; border-radius: 2px;
    background: var(--border-2);
    transition: background .2s;
  }
  .reg-strength-bar.active-weak   { background: #ef4444; }
  .reg-strength-bar.active-medium { background: #f59e0b; }
  .reg-strength-bar.active-strong { background: var(--green); }
  .reg-strength-label { font-size: 11.5px; font-weight: 500; color: var(--ink-4); }
  .reg-strength-label.weak   { color: #ef4444; }
  .reg-strength-label.medium { color: #f59e0b; }
  .reg-strength-label.strong { color: var(--green); }
  .reg-hint { font-size: 12px; color: var(--ink-5); margin-top: 5px; }

  .reg-submit {
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
  .reg-submit::after {
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
  .reg-submit:hover:not(:disabled) {
    box-shadow:
      0 8px 28px rgba(37,99,235,0.40),
      0 0 0 1px rgba(37,99,235,0.20),
      inset 0 1px 0 rgba(255,255,255,0.15);
    transform: translateY(-1px);
  }
  .reg-submit:disabled { opacity: .55; cursor: not-allowed; transform: none; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .reg-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.30);
    border-top-color: white;
    animation: spin .7s linear infinite; flex-shrink: 0;
  }

  .reg-terms {
    font-size: 11.5px; color: var(--ink-5);
    text-align: center; line-height: 1.6;
  }
  .reg-terms a { color: var(--ink-4); text-decoration: underline; }

  .reg-trust {
    display: flex; align-items: center; justify-content: center; gap: 18px;
    margin-top: 18px; padding-top: 18px;
    border-top: 1px solid var(--border);
  }
  .reg-trust-item {
    display: flex; align-items: center; gap: 5px;
    font-size: 11.5px; color: var(--ink-5); font-weight: 500;
  }
  .reg-trust-item svg {
    width: 12px; height: 12px;
    stroke: var(--b400); stroke-width: 2.5; fill: none;
  }

  @media (max-width: 768px) {
    .reg-root { grid-template-columns: 1fr; }
    .reg-left  { display: none; }
    .reg-right { padding: 32px 24px; min-height: calc(100vh - 64px); }
    .reg-right::before { display: none; }
  }
`;

const PILLS = [
  'Free to join, no credit card required',
  'Access courses instantly after signup',
  'Earn certificates on completion',
];

function getStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

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

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector(s => s.auth);  // ← removed 'user' — not set after register anymore
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => { return () => dispatch(clearError()); }, [dispatch]);

  // ── Submit: on success go to OTP page, pass email via router state ──
  const handleSubmit = async e => {
    e.preventDefault();
    const result = await dispatch(register(form));
    if (result.meta.requestStatus === 'fulfilled') {
      navigate('/verify-otp', { state: { email: form.email } });
    }
  };

  const strength = getStrength(form.password);
  const strengthLabel = strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong';
  const strengthClass = strength <= 1 ? 'weak' : strength <= 2 ? 'medium' : 'strong';
  const barClass = i => {
    if (!form.password) return '';
    if (strength <= 1) return i < 1 ? 'active-weak' : '';
    if (strength === 2) return i < 2 ? 'active-medium' : '';
    if (strength === 3) return i < 3 ? 'active-medium' : '';
    return 'active-strong';
  };

  return (
    <>
      <style>{css}</style>
      <div className="reg-root">

        {/* ── LEFT DARK HERO ── */}
        <div className="reg-left">
          <div className="reg-glow2" />

          <div className="reg-logo">
            <div className="reg-logo-mark"><LogoMark /></div>
            <span className="reg-logo-text">E<span>·</span>Learn</span>
          </div>

          <div className="reg-left-body">
            <div className="reg-eyebrow">
              <span className="reg-eyebrow-line" />
              Get started free
            </div>
            <h2 className="reg-headline">
              Start your<br />
              <em>learning journey.</em>
            </h2>
            <p className="reg-sub">
              Join hundreds of learners building real skills. No credit card needed — just create an account and dive in.
            </p>
          </div>

          <div className="reg-pills">
            {PILLS.map(text => (
              <div key={text} className="reg-pill">
                <div className="reg-pill-check"><IconCheck /></div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT FORM ── */}
        <div className="reg-right">
          <div className="reg-form-wrap">

            <div className="reg-form-header">
              <div className="reg-form-title">Create account</div>
              <div className="reg-form-sub">Fill in your details to get started.</div>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <div className="reg-fields">

                {/* Name */}
                <div className="reg-field">
                  <label className="reg-label">Full name</label>
                  <div className="reg-input-wrap">
                    <input
                      className={`reg-input${form.name.length > 1 ? ' valid' : ''}`}
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Jane Smith"
                      required
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="reg-field">
                  <label className="reg-label">Email address</label>
                  <div className="reg-input-wrap">
                    <input
                      className={`reg-input${form.email.includes('@') ? ' valid' : ''}`}
                      type="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="reg-field">
                  <label className="reg-label">Password</label>
                  <div className="reg-input-wrap">
                    <input
                      className="reg-input"
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="Min 8 characters"
                      required
                      autoComplete="new-password"
                      style={{ paddingRight: 40 }}
                    />
                    <button
                      type="button"
                      className="reg-pw-toggle"
                      onClick={() => setShowPw(v => !v)}
                      tabIndex={-1}
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeClosed /> : <EyeOpen />}
                    </button>
                  </div>

                  {form.password ? (
                    <div className="reg-strength">
                      <div className="reg-strength-bars">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className={`reg-strength-bar ${barClass(i)}`} />
                        ))}
                      </div>
                      <span className={`reg-strength-label ${strengthClass}`}>{strengthLabel} password</span>
                    </div>
                  ) : (
                    <div className="reg-hint">Min 8 characters with uppercase letter and number</div>
                  )}
                </div>

              </div>

              <button className="reg-submit" type="submit" disabled={loading}>
                {loading ? (
                  <><div className="reg-spinner" /> Creating account…</>
                ) : (
                  <>Create account <IconArrow /></>
                )}
              </button>
            </form>

            <div className="reg-terms">
              By creating an account you agree to our{' '}
              <a href="/terms">Terms of Service</a> and{' '}
              <a href="/privacy">Privacy Policy</a>.
            </div>

            <div className="reg-trust">
              <div className="reg-trust-item">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <path d="M6 1l1.5 3h3l-2.5 2 1 3L6 7.5 3 9l1-3L1.5 4h3z"/>
                </svg>
                SSL secured
              </div>
              <div className="reg-trust-item">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <rect x="2" y="5" width="8" height="6" rx="1"/>
                  <path d="M4 5V3.5a2 2 0 114 0V5"/>
                </svg>
                Private & encrypted
              </div>
              <div className="reg-trust-item">
                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <circle cx="6" cy="6" r="5"/>
                  <polyline points="4,6 5.5,7.5 8.5,4.5"/>
                </svg>
                Free forever
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}