import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError } from '../redux/slices/authSlice';
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
    --green:      #16a34a;
    --green-lt:   #f0fdf4;
    --green-mid:  #bbf7d0;
    --danger:     #be123c;
    --danger-lt:  #fff1f3;
    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans:  'Instrument Sans', system-ui, sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .reg-root {
    font-family: var(--font-sans);
    min-height: calc(100vh - 60px);
    background: var(--surface);
    display: grid;
    grid-template-columns: 1fr 1fr;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Left panel ── */
  .reg-left {
    background: var(--ink);
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 52px 56px;
    position: relative; overflow: hidden;
  }
  .reg-left::before {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .reg-left-logo {
    font-family: var(--font-serif);
    font-size: 20px; color: #f5f4f0;
    letter-spacing: -.01em;
    position: relative; z-index: 1;
    display: flex; align-items: baseline; gap: 2px;
  }
  .reg-left-logo-dot { color: #4f71e8; font-size: 24px; line-height: 0; }

  .reg-left-body {
    position: relative; z-index: 1;
    flex: 1; display: flex; flex-direction: column; justify-content: center;
    padding: 40px 0;
  }
  .reg-left-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: #4f71e8; margin-bottom: 14px;
  }
  .reg-left-headline {
    font-family: var(--font-serif);
    font-size: clamp(32px, 3.5vw, 48px);
    color: #f5f4f0; line-height: 1.08;
    letter-spacing: -.025em; margin-bottom: 20px;
  }
  .reg-left-headline em { font-style: italic; color: #93a8ff; }
  .reg-left-sub {
    font-size: 15px; color: #6b6b68;
    line-height: 1.75; max-width: 340px; font-weight: 400;
  }

  .reg-left-pills {
    display: flex; flex-direction: column; gap: 10px;
    position: relative; z-index: 1;
  }
  .reg-left-pill {
    display: flex; align-items: center; gap: 12px;
    font-size: 13px; color: #6b6b68; font-weight: 500;
  }
  .reg-left-pill-check {
    width: 20px; height: 20px; border-radius: 50%;
    background: rgba(79,113,232,0.15); border: 1px solid rgba(79,113,232,0.3);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; font-size: 10px; color: #93a8ff;
  }

  /* ── Right panel ── */
  .reg-right {
    display: flex; align-items: center; justify-content: center;
    padding: 40px 48px;
    background: var(--white);
  }

  .reg-form-wrap { width: 100%; max-width: 380px; }

  .reg-form-header { margin-bottom: 32px; }
  .reg-form-title {
    font-family: var(--font-serif);
    font-size: 30px; color: var(--ink);
    letter-spacing: -.025em; line-height: 1.1; margin-bottom: 8px;
  }
  .reg-form-sub {
    font-size: 14px; color: var(--ink-4); font-weight: 400;
  }
  .reg-form-sub a {
    color: var(--accent); font-weight: 500; text-decoration: none;
  }
  .reg-form-sub a:hover { text-decoration: underline; }

  /* Fields */
  .reg-fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }

  .reg-field { display: flex; flex-direction: column; gap: 6px; }
  .reg-label {
    font-size: 13px; font-weight: 600; color: var(--ink-2); letter-spacing: -.01em;
  }

  .reg-input-wrap { position: relative; }
  .reg-input {
    width: 100%; padding: 11px 14px;
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 8px;
    font-family: var(--font-sans); font-size: 14px; font-weight: 400; color: var(--ink);
    outline: none;
    transition: border-color .14s, box-shadow .14s, background .14s;
  }
  .reg-input::placeholder { color: var(--ink-5); }
  .reg-input:focus {
    background: var(--white);
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-lt);
  }
  .reg-input.valid {
    border-color: var(--green);
    box-shadow: 0 0 0 3px var(--green-lt);
  }

  /* Password toggle */
  .reg-pw-toggle {
    position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--ink-4); display: flex; align-items: center;
    padding: 2px; transition: color .14s;
  }
  .reg-pw-toggle:hover { color: var(--ink-2); }

  /* Password strength */
  .reg-strength { margin-top: 8px; }
  .reg-strength-bars {
    display: flex; gap: 4px; margin-bottom: 5px;
  }
  .reg-strength-bar {
    flex: 1; height: 3px; border-radius: 2px;
    background: var(--border);
    transition: background .2s;
  }
  .reg-strength-bar.active-weak   { background: #ef4444; }
  .reg-strength-bar.active-medium { background: #f59e0b; }
  .reg-strength-bar.active-strong { background: var(--green); }
  .reg-strength-label {
    font-size: 11.5px; font-weight: 500; color: var(--ink-4);
  }
  .reg-strength-label.weak   { color: #ef4444; }
  .reg-strength-label.medium { color: #f59e0b; }
  .reg-strength-label.strong { color: var(--green); }

  .reg-hint { font-size: 12px; color: var(--ink-5); margin-top: 5px; }

  /* Submit */
  .reg-submit {
    width: 100%; padding: 13px 20px;
    background: var(--ink); color: white; border: none;
    border-radius: 8px; cursor: pointer;
    font-family: var(--font-sans); font-size: 15px; font-weight: 600;
    letter-spacing: -.01em;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background .16s, transform .12s;
    margin-bottom: 20px;
  }
  .reg-submit:hover:not(:disabled) { background: var(--accent); transform: translateY(-1px); }
  .reg-submit:disabled { opacity: .55; cursor: not-allowed; transform: none; }

  /* Footer */
  .reg-footer {
    text-align: center;
    font-size: 13.5px; color: var(--ink-4);
  }
  .reg-footer a {
    color: var(--ink-2); font-weight: 600; text-decoration: none;
  }
  .reg-footer a:hover { color: var(--accent); text-decoration: underline; }

  .reg-terms {
    font-size: 11.5px; color: var(--ink-5);
    text-align: center; margin-top: 16px; line-height: 1.6;
  }
  .reg-terms a { color: var(--ink-4); text-decoration: underline; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .reg-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    animation: spin .7s linear infinite; flex-shrink: 0;
  }

  @media (max-width: 768px) {
    .reg-root { grid-template-columns: 1fr; }
    .reg-left  { display: none; }
    .reg-right { padding: 32px 24px; min-height: calc(100vh - 60px); }
  }
`;

function getStrength(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, user } = useSelector(s => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => { return () => dispatch(clearError()); }, [dispatch]);

  const handleSubmit = e => {
    e.preventDefault();
    dispatch(register(form));
  };

  const strength = getStrength(form.password);
  const strengthLabel = strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong';
  const strengthClass = strength <= 1 ? 'weak' : strength <= 2 ? 'medium' : 'strong';
  const barClass = (i) => {
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

        {/* ── Left panel ── */}
        <div className="reg-left">
          <div className="reg-left-logo">
            Learnly<span className="reg-left-logo-dot">·</span>
          </div>

          <div className="reg-left-body">
            <div className="reg-left-eyebrow">Get started free</div>
            <h2 className="reg-left-headline">
              Start your<br />
              <em>learning journey.</em>
            </h2>
            <p className="reg-left-sub">
              Join hundreds of learners building real skills. No credit card needed — just create an account and dive in.
            </p>
          </div>

          <div className="reg-left-pills">
            {[
              'Free to join, no credit card required',
              'Access courses instantly after signup',
              'Earn certificates on completion',
            ].map(text => (
              <div key={text} className="reg-left-pill">
                <div className="reg-left-pill-check">✓</div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="reg-right">
          <div className="reg-form-wrap">

            <div className="reg-form-header">
              <div className="reg-form-title">Create account</div>
              <div className="reg-form-sub">
                Already have one?{' '}
                <Link to="/login">Sign in</Link>
              </div>
            </div>

            {error && <Alert type="error">{error}</Alert>}

            <form onSubmit={handleSubmit}>
              <div className="reg-fields">

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

                <div className="reg-field">
                  <label className="reg-label">Email</label>
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

                  {form.password && (
                    <div className="reg-strength">
                      <div className="reg-strength-bars">
                        {[0, 1, 2, 3].map(i => (
                          <div key={i} className={`reg-strength-bar ${barClass(i)}`} />
                        ))}
                      </div>
                      <span className={`reg-strength-label ${strengthClass}`}>{strengthLabel} password</span>
                    </div>
                  )}
                  {!form.password && (
                    <div className="reg-hint">Min 8 characters with uppercase letter and number</div>
                  )}
                </div>

              </div>

              <button className="reg-submit" type="submit" disabled={loading}>
                {loading ? (
                  <><div className="reg-spinner" /> Creating account…</>
                ) : (
                  <>
                    Create account
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="reg-footer">
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </div>

            <div className="reg-terms">
              By creating an account you agree to our{' '}
              <a href="/terms">Terms of Service</a> and{' '}
              <a href="/privacy">Privacy Policy</a>.
            </div>
          </div>
        </div>

      </div>
    </>
  );
}