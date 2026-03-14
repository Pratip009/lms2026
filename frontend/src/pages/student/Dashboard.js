import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { LoadingCenter } from '../../components/common';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --b50:#eff6ff; --b100:#dbeafe; --b200:#bfdbfe; --b300:#93c5fd;
    --b400:#60a5fa; --b500:#3b82f6; --b600:#2563eb; --b700:#1d4ed8;
    --b800:#1e40af; --b900:#1e3a8a;
    --hero:#050f2b;
    --ink:#0f172a; --ink-2:#334155; --ink-3:#64748b; --ink-4:#94a3b8; --ink-5:#cbd5e1;
    --surface:#f8fafc; --surface-2:#f1f5f9;
    --border:rgba(15,23,42,0.08); --border-2:rgba(15,23,42,0.14);
    --white:#ffffff;
    --green:#16a34a; --green-lt:#f0fdf4; --green-mid:#bbf7d0;
    --amber:#d97706; --amber-lt:#fffbeb; --amber-mid:#fde68a;
    --rose:#e11d48; --rose-lt:#fff1f2; --rose-mid:#fecdd3;
    --font-display:'Syne',sans-serif; --font-body:'DM Sans',sans-serif;
    --r:10px; --r-lg:16px; --r-xl:22px;
  }

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes shimmer { 0%{left:-100%} 60%{left:150%} 100%{left:150%} }
  @keyframes arcFill { from{stroke-dashoffset:283} }
  @keyframes pulse   { 0%,100%{box-shadow:0 0 0 2px rgba(59,130,246,.2)} 50%{box-shadow:0 0 0 6px rgba(59,130,246,.06)} }

  /* ══ Root ══ */
  .sd-root {
    font-family: var(--font-body);
    background: var(--surface);
    color: var(--ink);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    position: relative;
    overflow-x: hidden;
  }

  /* Hero band at top */
  .sd-hero-band {
    position: absolute; top:0; left:0; right:0;
    height: 320px; z-index: 0;
    background: linear-gradient(175deg, #050f2b 0%, #0c1e4a 45%, transparent 100%);
    pointer-events: none;
  }

  /* Dot-grid texture inside hero */
  .sd-hero-band::before {
    content:'';
    position:absolute; inset:0;
    background-image: radial-gradient(circle, rgba(59,130,246,0.18) 1px, transparent 1px);
    background-size: 26px 26px;
    mask-image: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%);
  }

  /* Radial glow */
  .sd-hero-band::after {
    content:'';
    position:absolute; top:-80px; left:50%; transform:translateX(-50%);
    width:700px; height:500px;
    background: radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.22) 0%, transparent 70%);
    pointer-events:none;
  }

  /* Subtle dot grid on body area */
  .sd-body-grid {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: radial-gradient(circle, rgba(37,99,235,0.045) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  .sd-wrap {
    position:relative; z-index:1;
    width:100%; padding:0 40px 80px;
  }

  /* ══ Header (sits inside hero band) ══ */
  .sd-header {
    padding: 40px 0 36px;
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 32px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    animation: fadeUp .55s ease both;
  }

  .sd-kicker {
    display:inline-flex; align-items:center; gap:10px; margin-bottom:14px;
  }
  .sd-kicker-line { width:28px; height:1.5px; background:var(--b400); border-radius:2px; opacity:.8; }
  .sd-kicker-text {
    font-size:11px; font-weight:600; letter-spacing:.18em;
    text-transform:uppercase; color:var(--b300);
  }
  .sd-kicker-dot {
    width:5px; height:5px; border-radius:50%; background:var(--b400);
    animation: blink 2.4s ease-in-out infinite;
    box-shadow:0 0 0 3px rgba(96,165,250,0.25);
  }

  .sd-greeting {
    font-family: var(--font-display);
    font-size: clamp(28px, 3.5vw, 46px);
    font-weight: 800; line-height: 1.05;
    letter-spacing: -.04em; color: #fff;
  }
  .sd-greeting em {
    font-style: normal;
    background: linear-gradient(135deg, var(--b300), var(--b500));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .sd-header-date { text-align:right; }
  .sd-date-day {
    font-family: var(--font-display);
    font-size:24px; font-weight:700; color:rgba(255,255,255,0.55);
    letter-spacing:-.03em; line-height:1;
  }
  .sd-date-full {
    font-size:12px; color:rgba(255,255,255,0.3); margin-top:5px;
    font-weight:500; letter-spacing:.03em;
  }

  /* ══ Bento grid ══ */
  .sd-bento {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px; margin-bottom: 14px;
  }

  /* ── Stat card ── */
  .stat-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 24px 22px 20px;
    position: relative; overflow: hidden;
    box-shadow: 0 1px 3px rgba(15,23,42,0.04);
    transition: border-color .2s, box-shadow .25s, transform .2s;
    animation: fadeUp .5s ease both;
  }
  .stat-card:hover {
    border-color: rgba(37,99,235,0.22);
    box-shadow: 0 10px 32px rgba(37,99,235,0.12), 0 1px 3px rgba(15,23,42,0.04);
    transform: translateY(-4px);
  }
  /* Accent top bar */
  .stat-card::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:3px;
    background: var(--sc-accent, var(--b600));
    border-radius: var(--r-xl) var(--r-xl) 0 0;
  }
  /* Subtle glow wash */
  .stat-card::after {
    content:'';
    position:absolute; top:0; left:0; right:0; bottom:0;
    background: radial-gradient(ellipse at 50% 0%, var(--sc-glow, rgba(37,99,235,0.04)) 0%, transparent 70%);
    pointer-events:none;
  }
  .stat-icon {
    width:40px; height:40px; border-radius:11px;
    background: var(--sc-accent-lt, var(--b50));
    border: 1px solid var(--sc-accent-border, var(--b200));
    display:flex; align-items:center; justify-content:center;
    font-size:17px; margin-bottom:18px;
    box-shadow: 0 2px 8px var(--sc-glow, rgba(37,99,235,0.08));
  }
  .stat-val {
    font-family: var(--font-display);
    font-size:34px; font-weight:800; color:var(--ink);
    line-height:1; letter-spacing:-.04em; margin-bottom:5px;
  }
  .stat-label {
    font-size:10.5px; color:var(--ink-4); font-weight:600;
    letter-spacing:.09em; text-transform:uppercase;
  }

  /* ── Attendance card ── */
  .attend-card {
    grid-column: 1 / 3;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 28px 30px;
    box-shadow: 0 1px 3px rgba(15,23,42,0.04);
    animation: fadeUp .5s ease both .14s;
    transition: border-color .2s, box-shadow .25s;
    position: relative; overflow: hidden;
  }
  .attend-card::after {
    content:'';
    position:absolute; top:0; right:0; width:200px; height:200px;
    background: radial-gradient(ellipse at 100% 0%, rgba(37,99,235,0.04) 0%, transparent 70%);
    pointer-events:none;
  }
  .attend-card:hover {
    border-color: rgba(37,99,235,0.16);
    box-shadow: 0 8px 28px rgba(37,99,235,0.09);
  }

  .attend-head {
    display:flex; align-items:center; justify-content:space-between; margin-bottom:24px;
  }
  .attend-head-title {
    font-family: var(--font-display);
    font-size:16px; font-weight:700; color:var(--ink); letter-spacing:-.03em;
  }
  .attend-head-link {
    font-size:12px; color:var(--ink-4); text-decoration:none; font-weight:500;
    display:inline-flex; align-items:center; gap:5px; transition:color .15s;
    font-family: var(--font-body);
  }
  .attend-head-link:hover { color:var(--b600); }

  .attend-body { display:flex; align-items:center; gap:30px; }

  .arc-wrap { position:relative; flex-shrink:0; width:100px; height:100px; }
  .arc-svg { transform:rotate(-90deg); }
  .arc-track { fill:none; stroke:var(--surface-2); stroke-width:7; }
  .arc-fill {
    fill:none; stroke-width:7; stroke-linecap:round;
    stroke-dasharray:283;
    animation: arcFill .9s ease both .4s;
    transition: stroke-dashoffset .5s ease;
  }
  .arc-center {
    position:absolute; inset:0;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
  }
  .arc-pct {
    font-family: var(--font-display);
    font-size:18px; font-weight:800; color:var(--ink);
    line-height:1; letter-spacing:-.03em;
  }
  .arc-sub {
    font-size:9px; color:var(--ink-4); margin-top:3px;
    font-weight:600; letter-spacing:.08em; text-transform:uppercase;
  }

  .attend-info { flex:1; }
  .attend-goal-row {
    display:flex; align-items:center; justify-content:space-between; margin-bottom:9px;
  }
  .attend-goal-label { font-size:13px; color:var(--ink-3); font-weight:300; }
  .attend-goal-val   { font-size:13px; font-weight:600; color:var(--ink); }
  .attend-bar-track {
    height:5px; background:var(--surface-2); border-radius:100px;
    overflow:hidden; margin-bottom:16px;
  }
  .attend-bar-fill { height:100%; border-radius:100px; transition:width .6s ease; }
  .attend-badge {
    display:inline-flex; align-items:center; gap:7px;
    border-radius:100px; padding:5px 13px;
    font-size:12px; font-weight:600; letter-spacing:.02em;
    font-family: var(--font-body);
  }
  .attend-badge-dot {
    width:5px; height:5px; border-radius:50%;
    animation: blink 2.4s ease-in-out infinite;
  }
  .attend-badge.met  { background:var(--green-lt); color:var(--green); border:1px solid var(--green-mid); }
  .attend-badge.met .attend-badge-dot  { background:var(--green); }
  .attend-badge.prog { background:var(--amber-lt); color:var(--amber); border:1px solid var(--amber-mid); }
  .attend-badge.prog .attend-badge-dot { background:var(--amber); }

  /* ── Quick links card ── */
  .quick-card {
    grid-column: 3 / 5;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 28px 26px;
    box-shadow: 0 1px 3px rgba(15,23,42,0.04);
    animation: fadeUp .5s ease both .2s;
    transition: border-color .2s, box-shadow .25s;
    display: flex; flex-direction: column;
    position: relative; overflow: hidden;
  }
  .quick-card::after {
    content:'';
    position:absolute; bottom:0; left:0; width:220px; height:180px;
    background: radial-gradient(ellipse at 0% 100%, rgba(37,99,235,0.04) 0%, transparent 70%);
    pointer-events:none;
  }
  .quick-card:hover {
    border-color: rgba(37,99,235,0.16);
    box-shadow: 0 8px 28px rgba(37,99,235,0.09);
  }
  .quick-card-title {
    font-family: var(--font-display);
    font-size:16px; font-weight:700; color:var(--ink);
    letter-spacing:-.03em; margin-bottom:14px;
  }

  .quick-links { display:flex; flex-direction:column; gap:8px; }
  .quick-btn {
    display:flex; align-items:center; gap:12px;
    background:var(--surface); border:1px solid var(--border);
    border-radius:var(--r); padding:12px 14px;
    text-decoration:none; color:var(--ink-2);
    font-size:13px; font-weight:500; font-family:var(--font-body);
    transition: border-color .15s, color .15s, background .15s, box-shadow .18s, transform .15s;
  }
  .quick-btn:hover {
    border-color:rgba(37,99,235,0.2);
    color:var(--b700); background:var(--b50);
    box-shadow:0 4px 14px rgba(37,99,235,0.09);
    transform:translateX(3px);
  }
  .quick-btn-icon {
    width:30px; height:30px; border-radius:9px;
    display:flex; align-items:center; justify-content:center;
    font-size:14px; flex-shrink:0;
  }
  .quick-btn-arrow {
    margin-left:auto; color:var(--ink-5); font-size:16px; transition:transform .15s;
  }
  .quick-btn:hover .quick-btn-arrow { transform:translateX(4px); color:var(--b500); }

  /* ══ Courses section ══ */
  .sd-section-head {
    display:flex; align-items:baseline; justify-content:space-between;
    margin-bottom:16px;
    animation: fadeUp .5s ease both .28s;
  }
  .sd-section-title {
    font-family: var(--font-display);
    font-size:22px; font-weight:800; color:var(--ink); letter-spacing:-.04em;
  }
  .sd-section-meta { font-size:12.5px; color:var(--ink-4); font-weight:400; }

  .courses-list { display:flex; flex-direction:column; gap:10px; }

  .course-row {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 20px 28px;
    display: flex; align-items: center; gap:24px;
    width: 100%;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(15,23,42,0.04);
    position: relative; overflow: hidden;
    transition: border-color .2s, box-shadow .25s, transform .2s;
    animation: fadeUp .5s ease both;
  }
  /* Left accent bar */
  .course-row::before {
    content:'';
    position:absolute; left:0; top:0; bottom:0; width:3px;
    background: var(--row-accent, var(--b600));
    opacity:0; transition:opacity .2s;
    border-radius:2px 0 0 2px;
  }
  /* Radial glow on hover */
  .course-row::after {
    content:'';
    position:absolute; inset:0;
    background: radial-gradient(ellipse at 0% 50%, var(--row-glow, rgba(37,99,235,0.04)) 0%, transparent 60%);
    opacity:0; transition:opacity .25s;
    pointer-events:none;
  }
  .course-row:hover {
    border-color: rgba(37,99,235,0.18);
    box-shadow: 0 8px 30px rgba(37,99,235,0.11), 0 1px 3px rgba(15,23,42,0.04);
    transform: translateX(4px);
  }
  .course-row:hover::before { opacity:1; }
  .course-row:hover::after  { opacity:1; }

  .course-main { flex:1; min-width:0; }
  .course-title {
    font-family: var(--font-display);
    font-size:14px; font-weight:700; color:var(--ink);
    letter-spacing:-.02em; margin-bottom:4px;
  }
  .course-meta {
    font-size:12px; color:var(--ink-4); font-weight:300;
    display:flex; gap:10px; align-items:center;
  }
  .course-meta-sep { color:var(--ink-5); }

  .course-bar-row { margin-top:12px; display:flex; align-items:center; gap:10px; }
  .crb-track {
    flex:1; height:4px; background:var(--surface-2); border-radius:100px; overflow:hidden;
  }
  .crb-fill {
    height:100%; border-radius:100px;
    background: var(--row-accent, var(--b600));
    transition: width .5s ease;
    position:relative;
  }
  /* Shimmer on progress fill */
  .crb-fill::after {
    content:'';
    position:absolute; top:0; left:-100%; width:50%; height:100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent);
    animation: shimmer 2.6s ease-in-out infinite;
  }
  .crb-pct { font-size:11.5px; font-weight:700; color:var(--ink-3); min-width:34px; text-align:right; }

  .course-row-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }

  .badge-done {
    font-size:10.5px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
    background:var(--green-lt); color:var(--green); border:1px solid var(--green-mid);
    border-radius:100px; padding:4px 11px;
    display:inline-flex; align-items:center; gap:5px;
  }

  /* ── Primary shimmer button ── */
  .continue-btn {
    position:relative; overflow:hidden;
    font-family:var(--font-display); font-size:11px; font-weight:700;
    color:white;
    background: linear-gradient(135deg, var(--b500) 0%, var(--b700) 100%);
    border:none; border-radius:100px; padding:10px 22px; cursor:pointer;
    letter-spacing:.05em; text-transform:uppercase;
    box-shadow: 0 3px 14px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
    transition: box-shadow .18s, transform .14s;
    white-space:nowrap;
  }
  .continue-btn::after {
    content:'';
    position:absolute; top:0; left:-100%; width:60%; height:100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    animation: shimmer 2.8s ease-in-out infinite;
    pointer-events:none;
  }
  .continue-btn:hover {
    box-shadow: 0 6px 22px rgba(37,99,235,0.38), inset 0 1px 0 rgba(255,255,255,0.15);
    transform: translateY(-2px);
  }

  /* ── Empty state ── */
  .sd-empty {
    text-align:center; padding:60px 24px;
    background:var(--white); border:1px dashed rgba(37,99,235,0.2);
    border-radius:var(--r-xl);
    animation: fadeIn .6s ease both;
  }
  .sd-empty-icon { font-size:38px; margin-bottom:12px; opacity:.3; }
  .sd-empty-text { font-size:14px; color:var(--ink-3); font-weight:300; }
  .sd-empty-text a { color:var(--b600); text-decoration:none; font-weight:600; }
  .sd-empty-text a:hover { text-decoration:underline; }

  @media (max-width:900px) {
    .sd-bento { grid-template-columns:1fr 1fr; }
    .attend-card, .quick-card { grid-column:1/3; }
  }
  @media (max-width:600px) {
    .sd-wrap { padding:0 20px 60px; }
    .sd-header { flex-direction:column; align-items:flex-start; gap:10px; }
    .sd-bento { gap:10px; }
    .attend-body { flex-direction:column; align-items:flex-start; gap:18px; }
    .course-row { flex-wrap:wrap; padding:16px 20px; }
    .course-row-right { width:100%; justify-content:flex-end; }
  }
`;

function Arc({ pct, color }) {
  const r = 45, circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="arc-wrap">
      <svg className="arc-svg" width="100" height="100" viewBox="0 0 100 100">
        <circle className="arc-track" cx="50" cy="50" r={r} />
        <circle className="arc-fill" cx="50" cy="50" r={r}
          stroke={color} strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div className="arc-center">
        <span className="arc-pct">{pct}%</span>
        <span className="arc-sub">of goal</span>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent, accentLt, accentBorder, accentGlow, delay }) {
  return (
    <div className="stat-card" style={{
      '--sc-accent': accent,
      '--sc-accent-lt': accentLt,
      '--sc-accent-border': accentBorder,
      '--sc-glow': accentGlow,
      animationDelay: delay
    }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-val">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

const ROW_ACCENTS = [
  { color:'#2563eb', glow:'rgba(37,99,235,0.06)' },
  { color:'#16a34a', glow:'rgba(22,163,74,0.06)' },
  { color:'#d97706', glow:'rgba(217,119,6,0.06)' },
  { color:'#e11d48', glow:'rgba(225,29,72,0.06)' },
  { color:'#7c3aed', glow:'rgba(124,58,237,0.06)' },
  { color:'#0891b2', glow:'rgba(8,145,178,0.06)' },
];

export default function StudentDashboard() {
  const { user }    = useSelector(s => s.auth);
  const navigate    = useNavigate();
  const [progress, setProgress]     = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/progress/my'),
      api.get('/attendance/today'),
    ]).then(([p, a]) => {
      setProgress(p.data.progress || []);
      setAttendance(a.data.attendance);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingCenter />;

  const enrolledCount  = progress.length;
  const completedCount = progress.filter(p => p.isCompleted).length;
  const avgProgress    = progress.length > 0
    ? Math.round(progress.reduce((s, p) => s + p.progressPercentage, 0) / progress.length) : 0;

  const fmt = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const studyPct = attendance
    ? Math.min(100, Math.round((attendance.totalDuration / 10800) * 100)) : 0;

  const now     = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      <style>{css}</style>
      <div className="sd-root">
        <div className="sd-body-grid" />
        <div className="sd-hero-band" />

        <div className="sd-wrap">
          {/* ── Header ── */}
          <div className="sd-header">
            <div>
              <div className="sd-kicker">
                <div className="sd-kicker-line" />
                <span className="sd-kicker-text">Student Dashboard</span>
                <div className="sd-kicker-dot" />
              </div>
              <h1 className="sd-greeting">
                Welcome back, <em>{user?.name?.split(' ')[0] || 'there'}</em>
              </h1>
            </div>
            <div className="sd-header-date">
              <div className="sd-date-day">{dayName}</div>
              <div className="sd-date-full">{dateStr}</div>
            </div>
          </div>

          {/* ── Bento grid ── */}
          <div className="sd-bento">
            <StatCard icon="📚" label="Enrolled"      value={enrolledCount}
              accent="#2563eb" accentLt="#eff6ff" accentBorder="#bfdbfe"
              accentGlow="rgba(37,99,235,0.07)" delay=".05s" />
            <StatCard icon="🏁" label="Completed"     value={completedCount}
              accent="#16a34a" accentLt="#f0fdf4" accentBorder="#bbf7d0"
              accentGlow="rgba(22,163,74,0.07)" delay=".10s" />
            <StatCard icon="📈" label="Avg Progress"  value={`${avgProgress}%`}
              accent="#d97706" accentLt="#fffbeb" accentBorder="#fde68a"
              accentGlow="rgba(217,119,6,0.07)" delay=".15s" />
            <StatCard icon="⏱"  label="Today's Study" value={attendance ? fmt(attendance.totalDuration) : '—'}
              accent="#e11d48" accentLt="#fff1f2" accentBorder="#fecdd3"
              accentGlow="rgba(225,29,72,0.07)" delay=".20s" />

            {/* Attendance */}
            {attendance ? (
              <div className="attend-card">
                <div className="attend-head">
                  <span className="attend-head-title">Today's Attendance</span>
                  <Link to="/attendance" className="attend-head-link">
                    View history
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
                <div className="attend-body">
                  <Arc pct={studyPct} color={attendance.meetsRequirement ? '#16a34a' : '#d97706'} />
                  <div className="attend-info">
                    <div className="attend-goal-row">
                      <span className="attend-goal-label">Progress toward 3-hour goal</span>
                      <span className="attend-goal-val">{fmt(attendance.totalDuration)}</span>
                    </div>
                    <div className="attend-bar-track">
                      <div className="attend-bar-fill" style={{
                        width: `${studyPct}%`,
                        background: attendance.meetsRequirement
                          ? 'linear-gradient(90deg,#16a34a,#22c55e)'
                          : 'linear-gradient(90deg,#d97706,#f59e0b)',
                      }} />
                    </div>
                    <div className={`attend-badge ${attendance.meetsRequirement ? 'met' : 'prog'}`}>
                      <span className="attend-badge-dot" />
                      {attendance.meetsRequirement ? 'Daily goal achieved' : 'In progress'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="attend-card" style={{ display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ textAlign:'center', color:'var(--ink-4)' }}>
                  <div style={{ fontSize:32, marginBottom:8, opacity:.25 }}>🕐</div>
                  <div style={{ fontSize:13, fontWeight:300 }}>No attendance recorded yet today</div>
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="quick-card">
              <div className="quick-card-title">Quick Access</div>
              <div className="quick-links">
                {[
                  { icon:'🔍', label:'Browse all courses',      to:'/courses',      bg:'var(--b50)' },
                  { icon:'📋', label:'View attendance history',  to:'/attendance',   bg:'var(--green-lt)' },
                  { icon:'🏅', label:'My certificates',          to:'/certificates', bg:'var(--amber-lt)' },
                  { icon:'⚙️', label:'Account settings',        to:'/settings',     bg:'var(--surface-2)' },
                ].map(l => (
                  <Link key={l.to} to={l.to} className="quick-btn">
                    <span className="quick-btn-icon" style={{ background: l.bg }}>{l.icon}</span>
                    {l.label}
                    <span className="quick-btn-arrow">›</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* ── Courses ── */}
          <div className="sd-section-head">
            <span className="sd-section-title">My Courses</span>
            <span className="sd-section-meta">{enrolledCount} enrolled · {completedCount} completed</span>
          </div>

          {progress.length === 0 ? (
            <div className="sd-empty">
              <div className="sd-empty-icon">📚</div>
              <div className="sd-empty-text">
                No courses yet. <Link to="/courses">Browse the catalog →</Link>
              </div>
            </div>
          ) : (
            <div className="courses-list">
              {progress.map((p, i) => {
                const { color, glow } = ROW_ACCENTS[i % ROW_ACCENTS.length];
                return (
                  <div key={p._id} className="course-row"
                    style={{ '--row-accent': color, '--row-glow': glow, animationDelay: `${0.3 + i * 0.06}s` }}
                    onClick={() => navigate(`/courses/${p.course?._id}`)}>
                    <div className="course-main">
                      <div className="course-title">{p.course?.title}</div>
                      <div className="course-meta">
                        <span>{p.completedLessons} of {p.totalLessons} lessons</span>
                        <span className="course-meta-sep">·</span>
                        <span>{p.progressPercentage}% complete</span>
                      </div>
                      <div className="course-bar-row">
                        <div className="crb-track">
                          <div className="crb-fill" style={{ width:`${p.progressPercentage}%` }} />
                        </div>
                        <span className="crb-pct">{p.progressPercentage}%</span>
                      </div>
                    </div>
                    <div className="course-row-right">
                      {p.isCompleted && <span className="badge-done">✓ Done</span>}
                      <button className="continue-btn"
                        onClick={e => { e.stopPropagation(); navigate(`/courses/${p.course?._id}`); }}>
                        {p.isCompleted ? 'Review' : 'Continue →'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}