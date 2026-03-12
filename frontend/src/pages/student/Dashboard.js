import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { LoadingCenter } from '../../components/common';

/* ─── CSS ─────────────────────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600;700&display=swap');

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
    --amber:      #d97706;
    --amber-lt:   #fffbeb;
    --rose:       #e11d48;
    --rose-lt:    #fff1f2;

    --serif: 'Instrument Serif', Georgia, serif;
    --sans:  'Instrument Sans', system-ui, sans-serif;

    --r:    8px;
    --r-lg: 14px;
    --r-xl: 22px;

    --shadow-xs: 0 1px 3px rgba(17,17,16,0.06);
    --shadow-sm: 0 2px 8px rgba(17,17,16,0.07);
    --shadow-md: 0 8px 24px rgba(17,17,16,0.09);
    --shadow-lg: 0 20px 48px rgba(17,17,16,0.10);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sd-root {
    font-family: var(--sans);
    background: #faf9f7;
    color: var(--ink);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    position: relative;
  }

  /* dot-grid texture — same as hero */
  .sd-root::before {
    content: '';
    position: fixed; inset: 0; z-index: 0;
    background-image: radial-gradient(circle, #d0cdc6 1px, transparent 1px);
    background-size: 28px 28px;
    opacity: .38;
    pointer-events: none;
  }

  .sd-wrap {
    position: relative; z-index: 1;
    max-width: 1100px; margin: 0 auto;
    padding: 48px 40px 80px;
  }

  /* ── Animations ── */
  @keyframes fadeUp  { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: translateY(0); } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes blink   { 0%,100% { opacity:1; } 50% { opacity:.3; } }
  @keyframes arcFill { from { stroke-dashoffset: 283; } }

  /* ─────────────────────────────────────────
     HEADER
  ───────────────────────────────────────── */
  .sd-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 44px;
    padding-bottom: 32px;
    border-bottom: 1px solid var(--border);
    animation: fadeUp .55s ease both;
  }

  .sd-kicker {
    display: inline-flex; align-items: center; gap: 10px;
    margin-bottom: 14px;
  }
  .sd-kicker-line { width: 28px; height: 1.5px; background: var(--accent); }
  .sd-kicker-text {
    font-size: 11px; font-weight: 700; letter-spacing: .16em;
    text-transform: uppercase; color: var(--accent);
  }
  .sd-kicker-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--accent);
    animation: blink 2.4s ease-in-out infinite;
  }

  .sd-greeting {
    font-family: var(--serif);
    font-size: clamp(32px, 3.8vw, 50px);
    line-height: 1.0; letter-spacing: -.03em; color: var(--ink);
  }
  .sd-greeting em { font-style: italic; color: var(--accent); }

  .sd-header-date { text-align: right; }
  .sd-date-day {
    font-family: var(--serif);
    font-size: 30px; color: var(--ink-3); letter-spacing: -.02em; line-height: 1;
  }
  .sd-date-full {
    font-size: 12px; color: var(--ink-4); margin-top: 5px; font-weight: 500; letter-spacing: .03em;
  }

  /* ─────────────────────────────────────────
     BENTO GRID
  ───────────────────────────────────────── */
  .sd-bento {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 12px;
  }

  /* ── Stat card ── */
  .stat-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 24px 22px 20px;
    position: relative; overflow: hidden;
    box-shadow: var(--shadow-xs);
    transition: border-color .2s, box-shadow .2s, transform .2s;
    animation: fadeUp .5s ease both;
  }
  .stat-card:hover { border-color: var(--border-2); box-shadow: var(--shadow-md); transform: translateY(-3px); }
  /* top accent stripe */
  .stat-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: var(--sc-accent, var(--accent));
    border-radius: var(--r-xl) var(--r-xl) 0 0;
    opacity: .65;
  }
  .stat-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--sc-accent-lt, var(--accent-lt));
    border: 1px solid var(--sc-accent-border, var(--accent-mid));
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; margin-bottom: 16px;
  }
  .stat-val {
    font-family: var(--serif);
    font-size: 34px; color: var(--ink); line-height: 1;
    letter-spacing: -.025em; margin-bottom: 5px;
  }
  .stat-label {
    font-size: 10.5px; color: var(--ink-4); font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
  }

  /* ── Attendance card ── */
  .attend-card {
    grid-column: 1 / 3;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 26px 28px;
    box-shadow: var(--shadow-xs);
    animation: fadeUp .5s ease both .14s;
    transition: border-color .2s, box-shadow .2s;
  }
  .attend-card:hover { border-color: var(--border-2); box-shadow: var(--shadow-sm); }

  .attend-head {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px;
  }
  .attend-head-title { font-family: var(--serif); font-size: 17px; color: var(--ink); letter-spacing: -.01em; }
  .attend-head-link {
    font-size: 12px; color: var(--ink-4); text-decoration: none; font-weight: 500;
    display: inline-flex; align-items: center; gap: 5px;
    transition: color .15s;
  }
  .attend-head-link:hover { color: var(--accent); }

  .attend-body { display: flex; align-items: center; gap: 28px; }

  /* Arc */
  .arc-wrap { position: relative; flex-shrink: 0; width: 96px; height: 96px; }
  .arc-svg { transform: rotate(-90deg); }
  .arc-track { fill: none; stroke: var(--surface-2); stroke-width: 7; }
  .arc-fill {
    fill: none; stroke-width: 7; stroke-linecap: round;
    stroke-dasharray: 283;
    animation: arcFill .9s ease both .4s;
    transition: stroke-dashoffset .5s ease;
  }
  .arc-center {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .arc-pct  { font-family: var(--serif); font-size: 17px; color: var(--ink); line-height: 1; letter-spacing: -.02em; }
  .arc-sub  { font-size: 9px; color: var(--ink-4); margin-top: 3px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }

  .attend-info { flex: 1; }
  .attend-goal-row {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 9px;
  }
  .attend-goal-label { font-size: 13px; color: var(--ink-3); }
  .attend-goal-val   { font-size: 13px; font-weight: 600; color: var(--ink); }
  .attend-bar-track {
    height: 5px; background: var(--surface-2); border-radius: 100px; overflow: hidden; margin-bottom: 16px;
  }
  .attend-bar-fill { height: 100%; border-radius: 100px; transition: width .6s ease; }

  .attend-badge {
    display: inline-flex; align-items: center; gap: 7px;
    border-radius: 100px; padding: 5px 13px;
    font-size: 12px; font-weight: 600; letter-spacing: .02em;
  }
  .attend-badge-dot { width: 5px; height: 5px; border-radius: 50%; animation: blink 2.4s ease-in-out infinite; }
  .attend-badge.met  { background: var(--green-lt); color: var(--green); border: 1px solid #bbf7d0; }
  .attend-badge.met .attend-badge-dot { background: var(--green); }
  .attend-badge.prog { background: var(--amber-lt); color: var(--amber); border: 1px solid #fde68a; }
  .attend-badge.prog .attend-badge-dot { background: var(--amber); }

  /* ── Quick links ── */
  .quick-card {
    grid-column: 3 / 5;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    padding: 26px 24px;
    box-shadow: var(--shadow-xs);
    animation: fadeUp .5s ease both .2s;
    transition: border-color .2s, box-shadow .2s;
    display: flex; flex-direction: column;
  }
  .quick-card:hover { border-color: var(--border-2); box-shadow: var(--shadow-sm); }
  .quick-card-title { font-family: var(--serif); font-size: 17px; color: var(--ink); letter-spacing: -.01em; margin-bottom: 14px; }

  .quick-links { display: flex; flex-direction: column; gap: 8px; }
  .quick-btn {
    display: flex; align-items: center; gap: 11px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--r); padding: 11px 14px;
    text-decoration: none; color: var(--ink-2);
    font-size: 13px; font-weight: 500; font-family: var(--sans);
    transition: border-color .15s, color .15s, background .15s;
  }
  .quick-btn:hover { border-color: var(--border-2); color: var(--ink); background: var(--surface-2); }
  .quick-btn-icon {
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0;
  }
  .quick-btn-arrow { margin-left: auto; color: var(--ink-5); font-size: 15px; transition: transform .15s; }
  .quick-btn:hover .quick-btn-arrow { transform: translateX(3px); color: var(--ink-3); }

  /* ─────────────────────────────────────────
     COURSES
  ───────────────────────────────────────── */
  .sd-courses-head {
    display: flex; align-items: baseline; justify-content: space-between;
    margin-bottom: 16px;
    animation: fadeUp .5s ease both .28s;
  }
  .sd-courses-title { font-family: var(--serif); font-size: 22px; color: var(--ink); letter-spacing: -.015em; }
  .sd-courses-meta  { font-size: 12.5px; color: var(--ink-4); font-weight: 500; }

  .courses-list { display: flex; flex-direction: column; gap: 10px; }

  .course-row {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    padding: 20px 24px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 20px; align-items: center;
    cursor: pointer;
    box-shadow: var(--shadow-xs);
    position: relative; overflow: hidden;
    transition: border-color .2s, box-shadow .2s, transform .2s;
    animation: fadeUp .5s ease both;
  }
  /* left accent bar */
  .course-row::before {
    content: '';
    position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
    background: var(--row-accent, var(--accent));
    opacity: 0; transition: opacity .2s;
    border-radius: 2px 0 0 2px;
  }
  .course-row:hover { border-color: var(--border-2); box-shadow: var(--shadow-md); transform: translateX(4px); }
  .course-row:hover::before { opacity: 1; }

  .course-title {
    font-size: 14.5px; font-weight: 600; color: var(--ink);
    letter-spacing: -.01em; margin-bottom: 4px;
  }
  .course-meta {
    font-size: 12px; color: var(--ink-4);
    display: flex; gap: 10px; align-items: center;
  }
  .course-meta-sep { color: var(--ink-5); }

  .course-bar-row { margin-top: 12px; display: flex; align-items: center; gap: 10px; }
  .crb-track { flex: 1; height: 4px; background: var(--surface-2); border-radius: 100px; overflow: hidden; }
  .crb-fill  {
    height: 100%; border-radius: 100px;
    background: var(--row-accent, var(--accent));
    transition: width .5s ease;
  }
  .crb-pct { font-size: 11.5px; font-weight: 700; color: var(--ink-3); min-width: 32px; text-align: right; }

  .course-row-right { display: flex; flex-direction: column; align-items: flex-end; gap: 9px; }

  .badge-done {
    font-size: 10.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
    background: var(--green-lt); color: var(--green); border: 1px solid #bbf7d0;
    border-radius: 100px; padding: 3px 10px;
    display: inline-flex; align-items: center; gap: 5px;
  }

  .continue-btn {
    font-family: var(--sans); font-size: 11px; font-weight: 700;
    color: white; background: var(--ink);
    border: none; border-radius: 100px; padding: 9px 20px; cursor: pointer;
    letter-spacing: .06em; text-transform: uppercase;
    transition: background .16s, transform .12s, box-shadow .16s;
    box-shadow: 0 3px 10px rgba(17,17,16,.14);
    white-space: nowrap;
  }
  .continue-btn:hover {
    background: var(--accent); transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(28,78,216,.25);
  }

  /* ── Empty ── */
  .sd-empty {
    text-align: center; padding: 56px 24px;
    background: var(--white); border: 1px dashed var(--border-2);
    border-radius: var(--r-xl);
    animation: fadeIn .6s ease both;
  }
  .sd-empty-icon { font-size: 36px; margin-bottom: 12px; opacity: .3; }
  .sd-empty-text { font-size: 14px; color: var(--ink-3); }
  .sd-empty-text a { color: var(--accent); text-decoration: none; font-weight: 600; }
  .sd-empty-text a:hover { text-decoration: underline; }

  /* ─────────────────────────────────────────
     RESPONSIVE
  ───────────────────────────────────────── */
  @media (max-width: 900px) {
    .sd-bento { grid-template-columns: 1fr 1fr; }
    .attend-card, .quick-card { grid-column: 1 / 3; }
  }
  @media (max-width: 600px) {
    .sd-wrap { padding: 28px 20px 60px; }
    .sd-header { flex-direction: column; align-items: flex-start; gap: 10px; }
    .sd-bento { gap: 10px; }
    .attend-body { flex-direction: column; align-items: flex-start; gap: 18px; }
    .course-row { grid-template-columns: 1fr; }
    .course-row-right { flex-direction: row; align-items: center; justify-content: space-between; }
  }
`;

/* ─── Arc SVG ─────────────────────────────────────────────────────── */
function Arc({ pct, color }) {
  const r = 45, circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="arc-wrap">
      <svg className="arc-svg" width="96" height="96" viewBox="0 0 100 100">
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

/* ─── Stat Card ───────────────────────────────────────────────────── */
function StatCard({ icon, label, value, accent, accentLt, accentBorder, delay }) {
  return (
    <div className="stat-card"
      style={{ '--sc-accent': accent, '--sc-accent-lt': accentLt, '--sc-accent-border': accentBorder, animationDelay: delay }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-val">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ─── Accent palette for course rows ─────────────────────────────── */
const ROW_ACCENTS = ['#1c4ed8','#16a34a','#d97706','#e11d48','#7c3aed','#0891b2'];

/* ─── Main ────────────────────────────────────────────────────────── */
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
    ? Math.round(progress.reduce((s, p) => s + p.progressPercentage, 0) / progress.length)
    : 0;

  const fmt = s => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  const studyPct = attendance
    ? Math.min(100, Math.round((attendance.totalDuration / 10800) * 100))
    : 0;

  const now     = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <>
      <style>{css}</style>
      <div className="sd-root">
        <div className="sd-wrap">

          {/* Header */}
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

          {/* Bento grid */}
          <div className="sd-bento">

            {/* Stats row */}
            <StatCard icon="📚" label="Enrolled"      value={enrolledCount}
              accent="#1c4ed8" accentLt="#eff4ff" accentBorder="#bfcfff" delay=".05s" />
            <StatCard icon="🏁" label="Completed"     value={completedCount}
              accent="#16a34a" accentLt="#f0fdf4" accentBorder="#bbf7d0" delay=".1s" />
            <StatCard icon="📈" label="Avg Progress"  value={`${avgProgress}%`}
              accent="#d97706" accentLt="#fffbeb" accentBorder="#fde68a" delay=".15s" />
            <StatCard icon="⏱"  label="Today's Study" value={attendance ? fmt(attendance.totalDuration) : '—'}
              accent="#e11d48" accentLt="#fff1f2" accentBorder="#fecdd3" delay=".2s" />

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
                  <div style={{ fontSize:30, marginBottom:8, opacity:.3 }}>🕐</div>
                  <div style={{ fontSize:13 }}>No attendance recorded yet today</div>
                </div>
              </div>
            )}

            {/* Quick links */}
            <div className="quick-card">
              <div className="quick-card-title">Quick Access</div>
              <div className="quick-links">
                {[
                  { icon:'🔍', label:'Browse all courses',      to:'/courses',      bg:'#eff4ff' },
                  { icon:'📋', label:'View attendance history',  to:'/attendance',   bg:'#f0fdf4' },
                  { icon:'🏅', label:'My certificates',          to:'/certificates', bg:'#fffbeb' },
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

          {/* Courses */}
          <div className="sd-courses-head">
            <span className="sd-courses-title">My Courses</span>
            <span className="sd-courses-meta">{enrolledCount} enrolled · {completedCount} completed</span>
          </div>

          {progress.length === 0 ? (
            <div className="sd-empty">
              <div className="sd-empty-icon">📚</div>
              <div className="sd-empty-text">No courses yet. <Link to="/courses">Browse the catalog →</Link></div>
            </div>
          ) : (
            <div className="courses-list">
              {progress.map((p, i) => {
                const accent = ROW_ACCENTS[i % ROW_ACCENTS.length];
                return (
                  <div key={p._id} className="course-row"
                    style={{ '--row-accent': accent, animationDelay: `${0.3 + i * 0.06}s` }}
                    onClick={() => navigate(`/courses/${p.course?._id}`)}>
                    <div>
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