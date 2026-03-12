import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LoadingCenter, Alert, Pagination } from '../../components/common';

const styles = `
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
    --danger-mid: #fecdd3;
    --amber:      #b45309;
    --amber-lt:   #fffbeb;
    --amber-mid:  #fde68a;
    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans:  'Instrument Sans', system-ui, sans-serif;
    --shadow-sm:  0 2px 8px rgba(17,17,16,0.07);
    --shadow-md:  0 8px 24px rgba(17,17,16,0.09);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .aa-root {
    font-family: var(--font-sans);
    background: var(--surface);
    min-height: 100vh;
    color: var(--ink);
    padding: 40px;
    -webkit-font-smoothing: antialiased;
  }

  /* ══ HEADER ══ */
  .aa-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 20px; flex-wrap: wrap;
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  .aa-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 6px;
  }
  .aa-title {
    font-family: var(--font-serif);
    font-size: 30px; color: var(--ink);
    letter-spacing: -.025em; line-height: 1.05;
  }
  .aa-subtitle { font-size: 13px; color: var(--ink-4); margin-top: 4px; }

  /* ══ TABS ══ */
  .aa-tabs {
    display: flex; gap: 2px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 4px;
    margin-bottom: 24px;
    align-self: flex-start;
    width: fit-content;
  }
  .aa-tab {
    font-family: var(--font-sans); font-size: 13.5px; font-weight: 500;
    color: var(--ink-4); background: none; border: none; cursor: pointer;
    padding: 8px 20px; border-radius: 7px;
    transition: color .14s, background .14s;
    white-space: nowrap; letter-spacing: -.01em;
  }
  .aa-tab:hover { color: var(--ink-2); background: var(--white); }
  .aa-tab.active {
    color: var(--ink); background: var(--white);
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(17,17,16,0.08);
  }

  /* ══ CONTROLS ══ */
  .aa-controls {
    display: flex; align-items: flex-end; gap: 14px;
    margin-bottom: 20px; flex-wrap: wrap;
  }
  .aa-field { display: flex; flex-direction: column; gap: 6px; }
  .aa-label {
    font-size: 12px; font-weight: 600; color: var(--ink-3);
    letter-spacing: .02em; text-transform: uppercase;
  }
  .aa-date {
    padding: 8px 12px;
    background: var(--white); border: 1.5px solid var(--border);
    border-radius: 8px; font-family: var(--font-sans);
    font-size: 13.5px; color: var(--ink); outline: none;
    transition: border-color .14s, box-shadow .14s;
    cursor: pointer;
  }
  .aa-date:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-lt); }

  /* ══ TABLE CARD ══ */
  .aa-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    margin-bottom: 24px;
  }

  .aa-card-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-bottom: 1px solid var(--border);
  }
  .aa-card-title {
    font-family: var(--font-serif);
    font-size: 16px; color: var(--ink); letter-spacing: -.015em;
  }
  .aa-card-meta { font-size: 12.5px; color: var(--ink-5); font-weight: 500; }

  /* ── Table ── */
  .aa-table-wrap { overflow-x: auto; }
  .aa-table { width: 100%; border-collapse: collapse; }

  .aa-table thead tr { border-bottom: 1px solid var(--border); }
  .aa-table th {
    padding: 11px 16px; text-align: left;
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .08em; color: var(--ink-4); white-space: nowrap;
  }
  .aa-table td {
    padding: 13px 16px; font-size: 13.5px; color: var(--ink-3);
    border-bottom: 1px solid var(--border); vertical-align: middle;
  }
  .aa-table tbody tr:last-child td { border-bottom: none; }
  .aa-table tbody tr:hover td { background: var(--surface); }

  /* Student cell */
  .aa-student-cell { display: flex; align-items: center; gap: 10px; }
  .aa-avatar {
    width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10.5px; font-weight: 600; color: white;
  }
  .aa-student-name  { font-size: 13.5px; font-weight: 600; color: var(--ink); }
  .aa-student-email { font-size: 11.5px; color: var(--ink-4); margin-top: 1px; }

  /* Badges */
  .aa-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11.5px; font-weight: 600; padding: 3px 10px;
    border-radius: 6px; white-space: nowrap; text-transform: capitalize;
  }
  .aa-badge-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .aa-badge-green   { background: var(--green-lt);   color: var(--green);  border: 1px solid var(--green-mid); }
  .aa-badge-amber   { background: var(--amber-lt);   color: var(--amber);  border: 1px solid var(--amber-mid); }
  .aa-badge-red     { background: var(--danger-lt);  color: var(--danger); border: 1px solid var(--danger-mid); }
  .aa-badge-neutral { background: var(--surface-2);  color: var(--ink-4);  border: 1px solid var(--border); }

  /* Goal cell */
  .aa-goal-met   { color: var(--green); font-weight: 600; font-size: 13px; }
  .aa-goal-unmet { color: var(--danger); font-weight: 600; font-size: 13px; }

  /* Progress bar (for summary avg) */
  .aa-bar-wrap { width: 64px; height: 3px; background: var(--border); border-radius: 2px; margin-top: 4px; }
  .aa-bar-fill { height: 100%; border-radius: 2px; }

  /* Time display */
  .aa-time { font-family: var(--font-serif); font-size: 15px; color: var(--ink-2); letter-spacing: -.01em; }

  /* Num display */
  .aa-num { font-weight: 600; color: var(--ink-2); }

  /* Empty */
  .aa-empty { text-align: center; padding: 72px 20px; }
  .aa-empty-icon  { font-size: 40px; opacity: .2; margin-bottom: 14px; }
  .aa-empty-title {
    font-family: var(--font-serif); font-size: 20px; color: var(--ink);
    letter-spacing: -.02em; margin-bottom: 6px;
  }
  .aa-empty-sub { font-size: 13.5px; color: var(--ink-4); }

  @media (max-width: 768px) {
    .aa-root { padding: 24px 16px; }
    .aa-student-email { display: none; }
  }
`;

const AVATAR_COLORS = ['#1c4ed8','#7c3aed','#047857','#b45309','#be123c','#0369a1','#4d7c0f'];
function avatarColor(name) {
  return AVATAR_COLORS[((name || '').charCodeAt(0) || 0) % AVATAR_COLORS.length];
}
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const formatTime = s => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export default function AdminAttendance() {
  const [records, setRecords]     = useState([]);
  const [summary, setSummary]     = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('daily');
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage]           = useState(1);
  const [error, setError]         = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    if (tab === 'daily') {
      api.get('/attendance/report', { params: { date, page, limit: 20 } })
        .then(r => { setRecords(r.data.records || []); setPagination(r.data.pagination); })
        .catch(() => setError('Failed to load attendance records'))
        .finally(() => setLoading(false));
    } else {
      api.get('/attendance/summary')
        .then(r => setSummary(r.data.summary || []))
        .catch(() => setError('Failed to load summary'))
        .finally(() => setLoading(false));
    }
  }, [tab, date, page]);

  const statusBadgeClass = s => s === 'present' ? 'aa-badge-green' : s === 'partial' ? 'aa-badge-amber' : 'aa-badge-red';
  const statusDotColor   = s => s === 'present' ? 'var(--green)' : s === 'partial' ? 'var(--amber)' : 'var(--danger)';

  const maxTotal = Math.max(...summary.map(s => s.totalSeconds || 0), 1);

  return (
    <>
      <style>{styles}</style>
      <div className="aa-root">

        {/* ── Header ── */}
        <div className="aa-header">
          <div>
            <div className="aa-eyebrow">Admin Panel</div>
            <div className="aa-title">Attendance</div>
            <div className="aa-subtitle">Track daily presence and student study time</div>
          </div>
        </div>

        {error && <div style={{ marginBottom: 20 }}><Alert type="error">{error}</Alert></div>}

        {/* ── Tabs ── */}
        <div className="aa-tabs">
          <button className={`aa-tab ${tab === 'daily' ? 'active' : ''}`} onClick={() => { setTab('daily'); setPage(1); }}>
            Daily Report
          </button>
          <button className={`aa-tab ${tab === 'summary' ? 'active' : ''}`} onClick={() => setTab('summary')}>
            Student Summary
          </button>
        </div>

        {/* ══ DAILY TAB ══ */}
        {tab === 'daily' && (
          <>
            <div className="aa-controls">
              <div className="aa-field">
                <label className="aa-label">Date</label>
                <input
                  type="date"
                  className="aa-date"
                  value={date}
                  onChange={e => { setDate(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            {loading ? <LoadingCenter /> : (
              <div className="aa-card">
                <div className="aa-card-head">
                  <div className="aa-card-title">Daily Report</div>
                  <div className="aa-card-meta">
                    {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div className="aa-table-wrap">
                  <table className="aa-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Study Time</th>
                        <th>Sessions</th>
                        <th>3h Goal</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan={5}>
                            <div className="aa-empty">
                              <div className="aa-empty-icon">📅</div>
                              <div className="aa-empty-title">No records for this date</div>
                              <div className="aa-empty-sub">No attendance was logged on this day.</div>
                            </div>
                          </td>
                        </tr>
                      ) : records.map(r => (
                        <tr key={r._id}>
                          <td>
                            <div className="aa-student-cell">
                              <div className="aa-avatar" style={{ background: avatarColor(r.student?.name) }}>
                                {getInitials(r.student?.name)}
                              </div>
                              <div>
                                <div className="aa-student-name">{r.student?.name || '—'}</div>
                                <div className="aa-student-email">{r.student?.email}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="aa-time">{formatTime(r.totalDuration)}</span></td>
                          <td><span className="aa-num">{r.loginCount}</span></td>
                          <td>
                            {r.meetsRequirement
                              ? <span className="aa-goal-met">✓ Met</span>
                              : <span className="aa-goal-unmet">✗ Not met</span>}
                          </td>
                          <td>
                            <span className={`aa-badge ${statusBadgeClass(r.status)}`}>
                              <span className="aa-badge-dot" style={{ background: statusDotColor(r.status) }} />
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <Pagination page={page} totalPages={pagination?.totalPages} onChange={setPage} />
          </>
        )}

        {/* ══ SUMMARY TAB ══ */}
        {tab === 'summary' && (
          loading ? <LoadingCenter /> : (
            <div className="aa-card">
              <div className="aa-card-head">
                <div className="aa-card-title">Student Summary</div>
                <div className="aa-card-meta">{summary.length} students</div>
              </div>
              <div className="aa-table-wrap">
                <table className="aa-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Present</th>
                      <th>Partial</th>
                      <th>Absent</th>
                      <th>Total Time</th>
                      <th>Avg / Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.length === 0 ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="aa-empty">
                            <div className="aa-empty-icon">📊</div>
                            <div className="aa-empty-title">No summary data yet</div>
                            <div className="aa-empty-sub">Attendance data will appear here once students start logging in.</div>
                          </div>
                        </td>
                      </tr>
                    ) : summary.map(s => (
                      <tr key={s._id}>
                        <td>
                          <div className="aa-student-cell">
                            <div className="aa-avatar" style={{ background: avatarColor(s.student?.name) }}>
                              {getInitials(s.student?.name)}
                            </div>
                            <div>
                              <div className="aa-student-name">{s.student?.name || '—'}</div>
                              <div className="aa-student-email">{s.student?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="aa-badge aa-badge-green">{s.presentDays}</span>
                        </td>
                        <td>
                          <span className="aa-badge aa-badge-amber">{s.partialDays}</span>
                        </td>
                        <td>
                          <span className="aa-badge aa-badge-red">{s.absentDays}</span>
                        </td>
                        <td>
                          <span className="aa-time">{formatTime(s.totalSeconds)}</span>
                          <div className="aa-bar-wrap">
                            <div
                              className="aa-bar-fill"
                              style={{
                                width: `${Math.min((s.totalSeconds / maxTotal) * 100, 100)}%`,
                                background: 'var(--accent)',
                              }}
                            />
                          </div>
                        </td>
                        <td><span className="aa-time">{formatTime(Math.round(s.avgDailySeconds || 0))}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

      </div>
    </>
  );
}