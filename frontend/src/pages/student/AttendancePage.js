import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LoadingCenter } from '../../components/common';

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
    --rose:      #e11d48;
    --rose-lt:   #fff1f2;
    --rose-mid:  #fecdd3;
    --violet:    #7c3aed;
    --violet-lt: #f5f3ff;
    --violet-mid:#ddd6fe;

    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
    --r:    10px;
    --r-lg: 16px;
    --r-xl: 22px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ap-root {
    font-family: var(--font-body);
    background: var(--surface);
    color: var(--ink);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    position: relative;
  }
  .ap-root::before {
    content: '';
    position: fixed; inset: 0; z-index: 0;
    background-image: radial-gradient(circle, rgba(37,99,235,0.08) 1px, transparent 1px);
    background-size: 28px 28px;
    pointer-events: none;
  }
  .ap-root::after {
    content: '';
    position: fixed; top: 0; left: 0; right: 0; height: 300px; z-index: 0;
    background: linear-gradient(180deg, rgba(37,99,235,0.06) 0%, transparent 100%);
    pointer-events: none;
  }

  .ap-wrap {
    position: relative; z-index: 1;
    max-width: 1280px; margin: 0 auto;
    padding: 48px 56px 80px;
  }

  @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
  @keyframes blink  { 0%,100% { opacity:1; } 50% { opacity:.3; } }
  @keyframes arcFill { from { stroke-dashoffset:283; } }
  @keyframes barGrow { from { width: 0; } }

  /* ── Header ── */
  .ap-header {
    margin-bottom: 40px;
    animation: fadeUp .5s ease both;
  }
  .ap-kicker {
    display: inline-flex; align-items: center; gap: 10px; margin-bottom: 14px;
  }
  .ap-kicker-line { width: 28px; height: 1.5px; background: var(--b500); border-radius: 2px; }
  .ap-kicker-text {
    font-size: 11px; font-weight: 600; letter-spacing: .16em;
    text-transform: uppercase; color: var(--b600);
  }
  .ap-kicker-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--b500);
    animation: blink 2.4s ease-in-out infinite;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
  }
  .ap-title {
    font-family: var(--font-display);
    font-size: clamp(28px, 3.5vw, 42px);
    font-weight: 800; letter-spacing: -.04em; color: var(--ink); line-height: 1.05;
  }
  .ap-title em {
    font-style: normal;
    background: linear-gradient(135deg, var(--b500), var(--b700));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* ── Today section (flat, full-width) ── */
  .today-card {
    margin-bottom: 0;
    animation: fadeUp .5s ease both .1s;
    padding-bottom: 40px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 40px;
  }
  .today-band { display: none; }
  .today-body { padding: 0; }

  .today-head {
    display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px;
  }
  .today-head-left {}
  .today-label {
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: var(--ink-4); margin-bottom: 4px;
  }
  .today-date {
    font-family: var(--font-display);
    font-size: 18px; font-weight: 700; color: var(--ink); letter-spacing: -.03em;
  }

  .today-grid {
    display: grid; grid-template-columns: auto 1fr; gap: 32px; align-items: center;
  }

  /* Arc */
  .arc-wrap { position: relative; flex-shrink: 0; width: 110px; height: 110px; }
  .arc-svg { transform: rotate(-90deg); }
  .arc-track { fill: none; stroke: var(--surface-2); stroke-width: 8; }
  .arc-fill {
    fill: none; stroke-width: 8; stroke-linecap: round;
    stroke-dasharray: 283;
    animation: arcFill 1s ease both .5s;
    transition: stroke-dashoffset .6s ease;
  }
  .arc-center {
    position: absolute; inset: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .arc-val {
    font-family: var(--font-display);
    font-size: 19px; font-weight: 800; color: var(--ink);
    line-height: 1; letter-spacing: -.03em;
  }
  .arc-sub {
    font-size: 9px; color: var(--ink-4); margin-top: 3px;
    font-weight: 600; letter-spacing: .08em; text-transform: uppercase;
  }

  .today-info { display: flex; flex-direction: column; gap: 14px; }

  .today-time-row { display: flex; align-items: baseline; gap: 8px; }
  .today-time-big {
    font-family: var(--font-display);
    font-size: 36px; font-weight: 800; color: var(--ink); letter-spacing: -.04em; line-height: 1;
  }
  .today-time-goal {
    font-size: 13px; color: var(--ink-4); font-weight: 300;
  }

  .today-bar-track {
    height: 6px; background: var(--surface-2); border-radius: 100px; overflow: hidden;
  }
  .today-bar-fill {
    height: 100%; border-radius: 100px;
    animation: barGrow .8s ease both .6s;
    transition: width .5s ease;
  }

  .today-meta {
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  }
  .today-meta-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 12.5px; color: var(--ink-3); font-weight: 400;
  }
  .today-meta-item svg {
    width: 13px; height: 13px; stroke: var(--ink-4); stroke-width: 2; fill: none;
  }
  .today-meta-sep { width: 3px; height: 3px; border-radius: 50%; background: var(--ink-5); }

  /* Status badge */
  .status-badge {
    display: inline-flex; align-items: center; gap: 6px;
    border-radius: 100px; padding: 5px 13px;
    font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: capitalize;
  }
  .status-badge-dot { width: 5px; height: 5px; border-radius: 50%; animation: blink 2.4s ease-in-out infinite; }
  .badge-green  { background: var(--green-lt); color: var(--green); border: 1px solid var(--green-mid); }
  .badge-green .status-badge-dot { background: var(--green); }
  .badge-yellow { background: var(--amber-lt); color: var(--amber); border: 1px solid var(--amber-mid); }
  .badge-yellow .status-badge-dot { background: var(--amber); }
  .badge-red    { background: var(--rose-lt);  color: var(--rose);  border: 1px solid var(--rose-mid); }
  .badge-red .status-badge-dot { background: var(--rose); }

  /* ── Summary stats (flat row) ── */
  .stats-grid {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 0;
    margin-bottom: 40px;
    padding-bottom: 40px;
    border-bottom: 1px solid var(--border);
  }
  .s-card {
    padding: 0 32px 0 0;
    position: relative;
    animation: fadeUp .5s ease both;
  }
  .s-card + .s-card {
    padding-left: 32px;
    border-left: 1px solid var(--border);
  }
  .s-card-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: var(--sc-lt, var(--b50));
    border: 1px solid var(--sc-mid, var(--b200));
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; margin-bottom: 14px;
  }
  .s-card-val {
    font-family: var(--font-display);
    font-size: 34px; font-weight: 800; color: var(--ink);
    line-height: 1; letter-spacing: -.04em; margin-bottom: 4px;
  }
  .s-card-label {
    font-size: 10.5px; color: var(--ink-4); font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
  }

  /* ── History section ── */
  .history-head {
    display: flex; align-items: baseline; justify-content: space-between;
    margin-bottom: 14px;
    animation: fadeUp .5s ease both .3s;
  }
  .history-title {
    font-family: var(--font-display);
    font-size: 18px; font-weight: 800; color: var(--ink); letter-spacing: -.03em;
  }
  .history-meta { font-size: 12.5px; color: var(--ink-4); font-weight: 300; }

  .history-card {
    animation: fadeUp .5s ease both .35s;
  }

  /* Table — flat, full-width */
  .ap-table { width: 100%; border-collapse: collapse; }
  .ap-table thead tr {
    border-bottom: 2px solid var(--border);
  }
  .ap-table th {
    font-family: var(--font-body);
    font-size: 10.5px; font-weight: 600; letter-spacing: .08em;
    text-transform: uppercase; color: var(--ink-4);
    padding: 0 20px 14px 0; text-align: left;
  }
  .ap-table th:last-child { padding-right: 0; }
  .ap-table td {
    padding: 18px 20px 18px 0;
    font-size: 13.5px; color: var(--ink-2); font-weight: 400;
    border-bottom: 1px solid var(--border);
  }
  .ap-table td:last-child { padding-right: 0; }
  .ap-table tbody tr:last-child td { border-bottom: none; }
  .ap-table tbody tr { transition: opacity .12s; }
  .ap-table tbody tr:hover { opacity: .75; }

  .goal-check {
    display: inline-flex; align-items: center; justify-content: center;
    width: 20px; height: 20px; border-radius: 50%;
  }
  .goal-check.yes { background: var(--green-lt); border: 1px solid var(--green-mid); }
  .goal-check.yes svg { stroke: var(--green); }
  .goal-check.no  { background: var(--rose-lt); border: 1px solid var(--rose-mid); }
  .goal-check.no  svg { stroke: var(--rose); }
  .goal-check svg { width: 10px; height: 10px; fill: none; stroke-width: 2.5; }

  /* mini bar in table */
  .mini-bar-wrap { display: flex; align-items: center; gap: 8px; }
  .mini-bar-track {
    width: 72px; height: 4px; border-radius: 100px;
    background: var(--surface-2); overflow: hidden; flex-shrink: 0;
  }
  .mini-bar-fill { height: 100%; border-radius: 100px; transition: width .4s ease; }

  /* Empty */
  .ap-empty {
    padding: 48px 24px; text-align: center;
    color: var(--ink-4); font-size: 14px; font-weight: 300;
  }

  @media (max-width: 900px) {
    .stats-grid { grid-template-columns: 1fr 1fr; gap: 32px 0; }
    .s-card + .s-card:nth-child(odd) { padding-left: 0; border-left: none; }
    .s-card + .s-card:nth-child(even) { padding-left: 32px; border-left: 1px solid var(--border); }
  }
  @media (max-width: 640px) {
    .ap-wrap { padding: 28px 20px 60px; }
    .stats-grid { grid-template-columns: 1fr 1fr; gap: 28px 0; }
    .today-grid { grid-template-columns: 1fr; }
    .arc-wrap { display: none; }
    .ap-table th:nth-child(3),
    .ap-table td:nth-child(3) { display: none; }
  }
`;

const fmt = s => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
};

function Arc({ pct, color }) {
  const r = 45, circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  return (
    <div className="arc-wrap">
      <svg className="arc-svg" width="110" height="110" viewBox="0 0 100 100">
        <circle className="arc-track" cx="50" cy="50" r={r} />
        <circle className="arc-fill" cx="50" cy="50" r={r}
          stroke={color} strokeDasharray={circ} strokeDashoffset={offset} />
      </svg>
      <div className="arc-center">
        <span className="arc-val">{pct}%</span>
        <span className="arc-sub">of goal</span>
      </div>
    </div>
  );
}

function SCard({ icon, label, value, accent, lt, mid, delay }) {
  return (
    <div className="s-card" style={{ '--sc-accent': accent, '--sc-lt': lt, '--sc-mid': mid, animationDelay: delay }}>
      <div className="s-card-icon">{icon}</div>
      <div className="s-card-val">{value}</div>
      <div className="s-card-label">{label}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = status === 'present' ? 'badge-green' : status === 'partial' ? 'badge-yellow' : 'badge-red';
  return (
    <span className={`status-badge ${cls}`}>
      <span className="status-badge-dot" />{status}
    </span>
  );
}

const REQ = 10800;

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [today, setToday]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/attendance/today'),
      api.get('/attendance/my', { params: { limit: 30 } }),
    ]).then(([t, r]) => {
      setToday(t.data.attendance);
      setRecords(r.data.records || []);
      setSummary(r.data.summary);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingCenter />;

  const todayPct = today ? Math.min(100, Math.round((today.totalDuration / REQ) * 100)) : 0;
  const arcColor = today?.meetsRequirement ? '#16a34a' : today?.totalDuration > 0 ? '#d97706' : '#3b82f6';
  const barColor = today?.meetsRequirement
    ? 'linear-gradient(90deg,#16a34a,#22c55e)'
    : today?.totalDuration > 0
      ? 'linear-gradient(90deg,#d97706,#f59e0b)'
      : 'linear-gradient(90deg,var(--b500),var(--b400))';

  return (
    <>
      <style>{css}</style>
      <div className="ap-root">
        <div className="ap-wrap">

          {/* ── Header ── */}
          <div className="ap-header">
            <div className="ap-kicker">
              <div className="ap-kicker-line" />
              <span className="ap-kicker-text">Learning Tracker</span>
              <div className="ap-kicker-dot" />
            </div>
            <h1 className="ap-title">
              My <em>Attendance</em>
            </h1>
          </div>

          {/* ── Today card ── */}
          {today && (
            <div className="today-card">
              <div className="today-band" />
              <div className="today-body">
                <div className="today-head">
                  <div className="today-head-left">
                    <div className="today-label">Today's Session</div>
                    <div className="today-date">{today.date}</div>
                  </div>
                  <StatusBadge status={today.status} />
                </div>

                <div className="today-grid">
                  <Arc pct={todayPct} color={arcColor} />

                  <div className="today-info">
                    <div className="today-time-row">
                      <span className="today-time-big">{fmt(today.totalDuration)}</span>
                      <span className="today-time-goal">of 3h goal</span>
                    </div>

                    <div className="today-bar-track">
                      <div className="today-bar-fill" style={{ width: `${todayPct}%`, background: barColor }} />
                    </div>

                    <div className="today-meta">
                      <div className="today-meta-item">
                        <svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 5v5l3 3"/></svg>
                        {today.loginCount} session{today.loginCount !== 1 ? 's' : ''}
                      </div>
                      <div className="today-meta-sep" />
                      <div className="today-meta-item">
                        <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                        Goal {today.meetsRequirement ? 'achieved' : 'not yet met'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Summary stats ── */}
          {summary && (
            <div className="stats-grid">
              <SCard icon="📅" label="Total Days Logged" value={summary.totalDays}
                accent="#2563eb" lt="#eff6ff" mid="#bfdbfe" delay=".12s" />
              <SCard icon="✅" label="Present Days"      value={summary.presentDays}
                accent="#16a34a" lt="#f0fdf4" mid="#bbf7d0" delay=".17s" />
              <SCard icon="⚡" label="Partial Days"      value={summary.partialDays}
                accent="#d97706" lt="#fffbeb" mid="#fde68a" delay=".22s" />
              <SCard icon="⏱" label="Total Study Time"  value={fmt(summary.totalSeconds || 0)}
                accent="#7c3aed" lt="#f5f3ff" mid="#ddd6fe" delay=".27s" />
            </div>
          )}

          {/* ── History ── */}
          <div className="history-head">
            <span className="history-title">Recent History</span>
            <span className="history-meta">Last {records.length} records</span>
          </div>

          <div className="history-card">
            {records.length === 0 ? (
              <div className="ap-empty">No attendance records yet.</div>
            ) : (
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Study Time</th>
                    <th>Sessions</th>
                    <th>Progress</th>
                    <th>Goal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => {
                    const pct = Math.min(100, Math.round((r.totalDuration / REQ) * 100));
                    const fillColor = r.status === 'present' ? '#16a34a' : r.status === 'partial' ? '#d97706' : '#e11d48';
                    return (
                      <tr key={r._id}>
                        <td style={{ fontWeight: 500, color: 'var(--ink)' }}>{r.date}</td>
                        <td style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '-.02em' }}>
                          {fmt(r.totalDuration)}
                        </td>
                        <td>{r.loginCount}</td>
                        <td>
                          <div className="mini-bar-wrap">
                            <div className="mini-bar-track">
                              <div className="mini-bar-fill" style={{ width: `${pct}%`, background: fillColor }} />
                            </div>
                            <span style={{ fontSize: 11.5, color: 'var(--ink-4)', fontWeight: 600 }}>{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={`goal-check ${r.meetsRequirement ? 'yes' : 'no'}`}>
                            {r.meetsRequirement ? (
                              <svg viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3"/></svg>
                            ) : (
                              <svg viewBox="0 0 12 12"><line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/></svg>
                            )}
                          </span>
                        </td>
                        <td><StatusBadge status={r.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </>
  );
}