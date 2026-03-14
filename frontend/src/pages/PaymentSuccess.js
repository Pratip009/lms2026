import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { LoadingCenter } from '../components/common';

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
    --green-mid: #bbf7d0;

    --amber:     #d97706;
    --amber-lt:  #fffbeb;
    --amber-mid: #fde68a;

    --danger:    #be123c;
    --danger-lt: #fff1f2;
    --danger-mid:#fecdd3;

    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ps-root {
    font-family: var(--font-body);
    min-height: calc(100vh - 64px);
    display: flex; align-items: center; justify-content: center;
    padding: 40px 20px;
    background:
      radial-gradient(ellipse 80% 50% at 50% -5%, rgba(37,99,235,0.10) 0%, transparent 65%),
      linear-gradient(180deg, #eef3ff 0%, var(--surface) 50%);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Card ── */
  .ps-card {
    width: 100%; max-width: 420px;
    background: var(--white);
    border-radius: 24px;
    border: 1px solid rgba(37,99,235,0.10);
    box-shadow:
      0 2px 8px rgba(15,23,42,0.05),
      0 20px 60px rgba(37,99,235,0.10);
    overflow: hidden;
    animation: cardIn .4s cubic-bezier(.22,1,.36,1) both;
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(20px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Card top accent band ── */
  .ps-band {
    height: 4px; width: 100%;
  }
  .ps-band-success { background: linear-gradient(90deg, #16a34a, #4ade80, #16a34a); }
  .ps-band-pending { background: linear-gradient(90deg, var(--amber), #fbbf24, var(--amber)); }
  .ps-band-error   { background: linear-gradient(90deg, var(--danger), #fb7185, var(--danger)); }

  /* ── Card body ── */
  .ps-body {
    padding: 44px 40px 40px;
    display: flex; flex-direction: column; align-items: center; text-align: center;
  }

  /* ── Icon ring ── */
  .ps-icon-ring {
    width: 80px; height: 80px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 28px;
    position: relative;
  }
  .ps-icon-ring::before {
    content: '';
    position: absolute; inset: -6px;
    border-radius: 50%;
    opacity: 0.25;
    animation: ringPulse 2.4s ease-in-out infinite;
  }
  @keyframes ringPulse {
    0%, 100% { transform: scale(1); opacity: 0.25; }
    50%       { transform: scale(1.08); opacity: 0.12; }
  }

  .ps-icon-ring-success { background: var(--green-lt); border: 1.5px solid var(--green-mid); }
  .ps-icon-ring-success::before { background: var(--green); }
  .ps-icon-ring-pending { background: var(--amber-lt); border: 1.5px solid var(--amber-mid); }
  .ps-icon-ring-pending::before { background: var(--amber); }
  .ps-icon-ring-error   { background: var(--danger-lt); border: 1.5px solid var(--danger-mid); }
  .ps-icon-ring-error::before   { background: var(--danger); }

  .ps-icon-svg { position: relative; z-index: 1; }

  /* ── Text ── */
  .ps-title {
    font-family: var(--font-display);
    font-size: 24px; font-weight: 800;
    color: var(--ink); letter-spacing: -.04em;
    margin-bottom: 10px;
  }
  .ps-desc {
    font-size: 14px; font-weight: 300;
    color: var(--ink-4); line-height: 1.7;
    max-width: 300px; margin-bottom: 32px;
  }

  /* ── Success checklist ── */
  .ps-checklist {
    width: 100%;
    background: var(--surface);
    border: 1px solid var(--border-2);
    border-radius: 14px;
    padding: 16px 18px;
    margin-bottom: 28px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .ps-check-item {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 400; color: var(--ink-3);
    text-align: left;
  }
  .ps-check-dot {
    width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
    background: var(--green-lt); border: 1px solid var(--green-mid);
    display: flex; align-items: center; justify-content: center;
  }
  .ps-check-dot svg { width: 9px; height: 9px; stroke: var(--green); stroke-width: 2.8; fill: none; }

  /* ── Buttons ── */
  .ps-btn-primary {
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
    margin-bottom: 10px;
  }
  .ps-btn-primary::after {
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
  .ps-btn-primary:hover {
    box-shadow:
      0 8px 28px rgba(37,99,235,0.40),
      0 0 0 1px rgba(37,99,235,0.20),
      inset 0 1px 0 rgba(255,255,255,0.15);
    transform: translateY(-1px);
  }

  .ps-btn-outline {
    width: 100%; padding: 12px 20px;
    background: var(--white); color: var(--ink-2);
    border: 1.5px solid var(--border-2); border-radius: 10px; cursor: pointer;
    font-family: var(--font-body);
    font-size: 14px; font-weight: 500; letter-spacing: -.01em;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: border-color .16s, box-shadow .16s, transform .15s;
    margin-bottom: 10px;
  }
  .ps-btn-outline:hover {
    border-color: var(--b300);
    box-shadow: 0 2px 12px rgba(37,99,235,0.09);
    transform: translateY(-1px);
  }

  /* ── Pending spinner ── */
  @keyframes spin { to { transform: rotate(360deg); } }
  .ps-spin {
    width: 32px; height: 32px; border-radius: 50%;
    border: 3px solid var(--amber-mid);
    border-top-color: var(--amber);
    animation: spin 1s linear infinite;
    position: relative; z-index: 1;
  }

  /* ── Error X icon ── */
  .ps-x { position: relative; z-index: 1; }

  /* ── Footer note ── */
  .ps-note {
    font-size: 12px; color: var(--ink-5); margin-top: 4px;
    font-weight: 300;
  }
`;

const SuccessIcon = () => (
  <svg className="ps-icon-svg" width="36" height="36" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="18" r="18" fill="rgba(22,163,74,0.12)"/>
    <polyline points="10,18 15,23 26,13"
      stroke="#16a34a" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const PendingIcon = () => (
  <div className="ps-spin" />
);

const ErrorIcon = () => (
  <svg className="ps-x" width="36" height="36" viewBox="0 0 36 36" fill="none">
    <circle cx="18" cy="18" r="18" fill="rgba(190,18,60,0.10)"/>
    <line x1="12" y1="12" x2="24" y2="24" stroke="#be123c" strokeWidth="2.8" strokeLinecap="round"/>
    <line x1="24" y1="12" x2="12" y2="24" stroke="#be123c" strokeWidth="2.8" strokeLinecap="round"/>
  </svg>
);

const CheckItem = ({ text }) => (
  <div className="ps-check-item">
    <div className="ps-check-dot">
      <svg viewBox="0 0 10 10"><polyline points="2,5 4,7.5 8,3"/></svg>
    </div>
    {text}
  </div>
);

const ArrowRight = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = params.get('session_id');
  const [status, setStatus] = useState('loading');
  const [courseId, setCourseId] = useState(null);

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }
    api.get(`/orders/verify/${sessionId}`)
      .then(r => {
        if (r.data.isPaid) {
          setCourseId(r.data.courseId);
          setStatus('success');
        } else {
          setStatus('pending');
        }
      })
      .catch(() => setStatus('error'));
  }, [sessionId]);

  if (status === 'loading') return <LoadingCenter />;

  return (
    <>
      <style>{css}</style>
      <div className="ps-root">
        <div className="ps-card">

          {/* Top accent band */}
          <div className={`ps-band ps-band-${status}`} />

          <div className="ps-body">

            {/* ── SUCCESS ── */}
            {status === 'success' && (
              <>
                <div className="ps-icon-ring ps-icon-ring-success">
                  <SuccessIcon />
                </div>
                <div className="ps-title">Payment successful!</div>
                <div className="ps-desc">
                  You're officially enrolled. Your course is ready and waiting — let's get started.
                </div>
                <div className="ps-checklist">
                  <CheckItem text="Full lifetime access unlocked" />
                  <CheckItem text="Progress tracked automatically" />
                  <CheckItem text="Certificate awarded on completion" />
                </div>
                <button
                  className="ps-btn-primary"
                  onClick={() => navigate(courseId ? `/courses/${courseId}` : '/my-courses')}
                >
                  Start learning <ArrowRight />
                </button>
                <button className="ps-btn-outline" onClick={() => navigate('/my-courses')}>
                  Go to My Courses
                </button>
              </>
            )}

            {/* ── PENDING ── */}
            {status === 'pending' && (
              <>
                <div className="ps-icon-ring ps-icon-ring-pending">
                  <PendingIcon />
                </div>
                <div className="ps-title">Processing payment…</div>
                <div className="ps-desc">
                  Your payment is being verified. This usually takes just a moment — hang tight.
                </div>
                <button className="ps-btn-outline" onClick={() => navigate('/my-courses')}>
                  Go to My Courses
                </button>
                <div className="ps-note">We'll send a confirmation email once complete.</div>
              </>
            )}

            {/* ── ERROR ── */}
            {status === 'error' && (
              <>
                <div className="ps-icon-ring ps-icon-ring-error">
                  <ErrorIcon />
                </div>
                <div className="ps-title">Verification failed</div>
                <div className="ps-desc">
                  We couldn't confirm your payment. If you were charged, please contact support and we'll sort it out.
                </div>
                <button className="ps-btn-outline" onClick={() => navigate('/courses')}>
                  Back to Courses
                </button>
                <div className="ps-note">Need help? Reach out to support@elearn.com</div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}