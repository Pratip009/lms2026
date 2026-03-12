import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, clearError } from '../redux/slices/authSlice';
import { Alert } from '../components/common';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600&display=swap');

  :root {
    --white:      #ffffff;
    --surface:    #f8f8f6;
    --surface-2:  #f2f1ee;
    --border:     #e5e3de;
    --border-2:   #d6d3cc;
    --ink:        #111110;
    --ink-2:      #3d3c39;
    --ink-3:      #6e6b64;
    --ink-4:      #a09d95;
    --ink-5:      #ccc9c1;
    --accent:     #1c4ed8;
    --accent-lt:  #eff4ff;
    --accent-mid: #bfcfff;
    --danger:     #be123c;
    --danger-lt:  #fff1f3;
    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans:  'Instrument Sans', system-ui, sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .login-root {
    font-family: var(--font-sans);
    min-height: calc(100vh - 60px);
    background: var(--surface);
    display: grid;
    grid-template-columns: 1fr 1fr;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Left panel ── */
  .login-left {
    background: var(--ink);
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 52px 56px;
    position: relative; overflow: hidden;
  }

  /* Subtle grid texture */
  .login-left::before {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .login-left-logo {
    font-family: var(--font-serif);
    font-size: 20px; color: #f5f4f0;
    letter-spacing: -.01em;
    position: relative; z-index: 1;
    display: flex; align-items: baseline; gap: 2px;
  }
  .login-left-logo-dot { color: #4f71e8; font-size: 24px; line-height: 0; }

  .login-left-body {
    position: relative; z-index: 1;
    flex: 1; display: flex; flex-direction: column; justify-content: center;
    padding: 40px 0;
  }

  .login-left-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: #4f71e8;
    margin-bottom: 14px;
  }
  .login-left-headline {
    font-family: var(--font-serif);
    font-size: clamp(32px, 3.5vw, 48px);
    color: #f5f4f0; line-height: 1.08;
    letter-spacing: -.025em;
    margin-bottom: 20px;
  }
  .login-left-headline em { font-style: italic; color: #93a8ff; }

  .login-left-sub {
    font-size: 15px; color: #6b6b68;
    line-height: 1.75; max-width: 340px;
    font-weight: 400;
  }

  .login-left-pills {
    display: flex; flex-direction: column; gap: 10px;
    margin-top: 44px;
    position: relative; z-index: 1;
  }
  .login-left-pill {
    display: flex; align-items: center; gap: 12px;
    font-size: 13px; color: #6b6b68; font-weight: 500;
  }
  .login-left-pill-check {
    width: 20px; height: 20px; border-radius: 50%;
    background: rgba(79,113,232,0.15); border: 1px solid rgba(79,113,232,0.3);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 10px; color: #93a8ff;
  }

  /* ── Right panel: form ── */
  .login-right {
    display: flex; align-items: center; justify-content: center;
    padding: 40px 48px;
    background: var(--white);
  }

  .login-form-wrap {
    width: 100%; max-width: 380px;
  }

  .login-form-header { margin-bottom: 36px; }
  .login-form-title {
    font-family: var(--font-serif);
    font-size: 30px; color: var(--ink);
    letter-spacing: -.025em; line-height: 1.1;
    margin-bottom: 8px;
  }
  .login-form-sub {
    font-size: 14px; color: var(--ink-4); font-weight: 400;
  }
  .login-form-sub a {
    color: var(--accent); font-weight: 500; text-decoration: none;
  }
  .login-form-sub a:hover { text-decoration: underline; }

  /* Fields */
  .login-fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }

  .login-field { display: flex; flex-direction: column; gap: 6px; }
  .login-label {
    font-size: 13px; font-weight: 600; color: var(--ink-2);
    letter-spacing: -.01em;
  }

  .login-input-wrap { position: relative; }
  .login-input {
    width: 100%;
    padding: 11px 14px;
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: 8px;
    font-family: var(--font-sans);
    font-size: 14px; font-weight: 400; color: var(--ink);
    outline: none;
    transition: border-color .14s, box-shadow .14s, background .14s;
  }
  .login-input::placeholder { color: var(--ink-5); }
  .login-input:focus {
    background: var(--white);
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-lt);
  }

  /* Password toggle */
  .login-pw-toggle {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--ink-4); display: flex; align-items: center;
    padding: 2px; transition: color .14s;
  }
  .login-pw-toggle:hover { color: var(--ink-2); }

  /* Forgot */
  .login-forgot-row {
    display: flex; justify-content: flex-end; margin-top: -8px; margin-bottom: 4px;
  }
  .login-forgot {
    font-size: 12.5px; font-weight: 500; color: var(--ink-4);
    text-decoration: none;
    transition: color .14s;
  }
  .login-forgot:hover { color: var(--accent); }

  /* Submit */
  .login-submit {
    width: 100%; padding: 13px 20px;
    background: var(--ink); color: white; border: none;
    border-radius: 8px; cursor: pointer;
    font-family: var(--font-sans); font-size: 15px; font-weight: 600;
    letter-spacing: -.01em;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .16s, transform .12s;
    margin-bottom: 16px;
  }
  .login-submit:hover:not(:disabled) { background: var(--accent); transform: translateY(-1px); }
  .login-submit:disabled { opacity: .55; cursor: not-allowed; transform: none; }

  /* Divider */
  .login-divider {
    display: flex; align-items: center; gap: 12px;
    margin: 20px 0;
  }
  .login-divider-line { flex: 1; height: 1px; background: var(--border); }
  .login-divider-text { font-size: 12px; color: var(--ink-5); font-weight: 500; white-space: nowrap; }

  /* Footer */
  .login-footer {
    text-align: center;
    font-size: 13.5px; color: var(--ink-4); font-weight: 400;
  }
  .login-footer a {
    color: var(--ink-2); font-weight: 600; text-decoration: none;
  }
  .login-footer a:hover { color: var(--accent); text-decoration: underline; }

  /* Spinner */
  @keyframes spin { to { transform: rotate(360deg); } }
  .login-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    animation: spin .7s linear infinite;
    flex-shrink: 0;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .login-root { grid-template-columns: 1fr; }
    .login-left  { display: none; }
    .login-right { padding: 32px 24px; min-height: calc(100vh - 60px); }
  }
`;

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

        {/* ── Left panel ── */}
        <div className="login-left">
          <div className="login-left-logo">
            Learnly<span className="login-left-logo-dot">·</span>
          </div>

          <div className="login-left-body">
            <div className="login-left-eyebrow">Welcome back</div>
            <h2 className="login-left-headline">
              Keep building<br />
              <em>great things.</em>
            </h2>
            <p className="login-left-sub">
              Pick up right where you left off. Your courses, progress, and certificates are all waiting.
            </p>
          </div>

          <div className="login-left-pills">
            {[
              'Lifetime access to all your courses',
              'Track progress across every lesson',
              'Download certificates anytime',
            ].map(text => (
              <div key={text} className="login-left-pill">
                <div className="login-left-pill-check">✓</div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
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
                  <label className="login-label">Email</label>
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
                      {showPw ? (
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="login-forgot-row">
                <Link to="/forgot-password" className="login-forgot">Forgot password?</Link>
              </div>

              <button className="login-submit" type="submit" disabled={loading} style={{ marginTop: 16 }}>
                {loading ? (
                  <><div className="login-spinner" /> Signing in…</>
                ) : (
                  <>
                    Sign in
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              Don't have an account?{' '}
              <Link to="/register">Create one free</Link>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}