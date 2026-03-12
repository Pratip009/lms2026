import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

  .as-root {
    font-family: var(--font-sans);
    background: var(--surface);
    min-height: 100vh;
    color: var(--ink);
    padding: 40px;
    -webkit-font-smoothing: antialiased;
  }

  /* ══ HEADER ══ */
  .as-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 20px; flex-wrap: wrap;
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  .as-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 6px;
  }
  .as-title {
    font-family: var(--font-serif);
    font-size: 30px; color: var(--ink);
    letter-spacing: -.025em; line-height: 1.05;
  }
  .as-subtitle { font-size: 13px; color: var(--ink-4); margin-top: 4px; }

  /* ══ ALERTS ══ */
  .as-alerts { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }

  /* ══ TABLE CARD ══ */
  .as-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    margin-bottom: 24px;
  }

  /* Search bar */
  .as-bar {
    display: flex; align-items: center; gap: 10px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .as-search-wrap { position: relative; flex: 1; min-width: 180px; max-width: 300px; }
  .as-search-icon {
    position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
    color: var(--ink-5); display: flex; align-items: center; pointer-events: none;
  }
  .as-search {
    width: 100%; padding: 8px 12px 8px 34px;
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 8px; font-family: var(--font-sans);
    font-size: 13.5px; color: var(--ink); outline: none;
    transition: border-color .14s, box-shadow .14s;
  }
  .as-search::placeholder { color: var(--ink-5); }
  .as-search:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-lt);
    background: var(--white);
  }

  .as-count { font-size: 13px; color: var(--ink-4); margin-left: auto; white-space: nowrap; }
  .as-count strong { color: var(--ink-2); font-weight: 600; }

  /* ── Table ── */
  .as-table-wrap { overflow-x: auto; }
  .as-table { width: 100%; border-collapse: collapse; }

  .as-table thead tr { border-bottom: 1px solid var(--border); }
  .as-table th {
    padding: 11px 16px; text-align: left;
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .08em; color: var(--ink-4); white-space: nowrap;
  }
  .as-table td {
    padding: 13px 16px; font-size: 13.5px; color: var(--ink-3);
    border-bottom: 1px solid var(--border); vertical-align: middle;
  }
  .as-table tbody tr:last-child td { border-bottom: none; }
  .as-table tbody tr:hover td { background: var(--surface); }

  /* Student name cell */
  .as-student-cell { display: flex; align-items: center; gap: 10px; }
  .as-avatar {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    background: var(--ink); display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; color: white; letter-spacing: .02em;
  }
  .as-student-name { font-size: 13.5px; font-weight: 600; color: var(--ink); }
  .as-student-email { font-size: 12px; color: var(--ink-4); margin-top: 1px; }

  /* Badges */
  .as-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11.5px; font-weight: 600; padding: 3px 10px;
    border-radius: 6px; letter-spacing: .02em; white-space: nowrap;
  }
  .as-badge-green { background: var(--green-lt); color: var(--green); border: 1px solid var(--green-mid); }
  .as-badge-red   { background: var(--danger-lt); color: var(--danger); border: 1px solid var(--danger-mid); }
  .as-badge-dot   { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

  /* Action buttons */
  .as-actions { display: flex; align-items: center; gap: 6px; }
  .as-btn {
    font-family: var(--font-sans); font-size: 12.5px; font-weight: 600;
    border-radius: 7px; padding: 6px 13px; cursor: pointer;
    border: 1.5px solid var(--border); background: var(--white); color: var(--ink-3);
    transition: border-color .13s, color .13s, background .13s;
    white-space: nowrap; letter-spacing: -.01em;
  }
  .as-btn:hover { border-color: var(--border-2); color: var(--ink); background: var(--surface); }

  .as-btn-activate {
    border-color: var(--green-mid); color: var(--green); background: var(--green-lt);
  }
  .as-btn-activate:hover { background: #dcfce7; border-color: var(--green); }

  .as-btn-deactivate {
    border-color: var(--amber-mid); color: var(--amber); background: var(--amber-lt);
  }
  .as-btn-deactivate:hover { background: #fef3c7; border-color: var(--amber); }

  /* Empty */
  .as-empty { text-align: center; padding: 72px 20px; }
  .as-empty-icon { font-size: 40px; opacity: .2; margin-bottom: 14px; }
  .as-empty-title {
    font-family: var(--font-serif); font-size: 20px; color: var(--ink);
    letter-spacing: -.02em; margin-bottom: 6px;
  }
  .as-empty-sub { font-size: 13.5px; color: var(--ink-4); }

  @media (max-width: 768px) {
    .as-root { padding: 24px 16px; }
    .as-student-email { display: none; }
  }
`;

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

// Deterministic avatar color from name
const AVATAR_COLORS = ['#1c4ed8','#7c3aed','#047857','#b45309','#be123c','#0369a1','#4d7c0f'];
function avatarColor(name) {
  const i = (name || '').charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}

export default function AdminStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/admin/students', { params: { search, page, limit: 20 } })
      .then(r => {
        setStudents(r.data.data || []);
        setPagination(r.data.pagination);
      })
      .catch(() => setError('Failed to load students'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, page]);

  const handleToggle = async (id, isActive) => {
    setError(''); setMsg('');
    try {
      await api.patch(`/admin/students/${id}/toggle-status`);
      setMsg(`Student ${isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return (
    <div style={{ background: 'var(--surface, #f8f8f6)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingCenter />
    </div>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="as-root">

        {/* ── Header ── */}
        <div className="as-header">
          <div>
            <div className="as-eyebrow">Admin Panel</div>
            <div className="as-title">Students</div>
            <div className="as-subtitle">
              {pagination?.total
                ? `${pagination.total} student${pagination.total !== 1 ? 's' : ''} registered`
                : `${students.length} students`}
            </div>
          </div>
        </div>

        {/* ── Alerts ── */}
        {(error || msg) && (
          <div className="as-alerts">
            {error && <Alert type="error">{error}</Alert>}
            {msg   && <Alert type="success">{msg}</Alert>}
          </div>
        )}

        {/* ── Table Card ── */}
        <div className="as-card">
          <div className="as-bar">
            <div className="as-search-wrap">
              <span className="as-search-icon">
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </span>
              <input
                className="as-search"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name or email…"
              />
            </div>
            <div className="as-count">
              <strong>{students.length}</strong>
              {pagination?.total ? ` of ${pagination.total}` : ''} students
            </div>
          </div>

          <div className="as-table-wrap">
            <table className="as-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Enrolled</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="as-empty">
                        <div className="as-empty-icon">👤</div>
                        <div className="as-empty-title">No students found</div>
                        <div className="as-empty-sub">
                          {search ? 'Try a different search term.' : 'Students will appear here once they register.'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : students.map(s => (
                  <tr key={s._id}>
                    {/* Student */}
                    <td>
                      <div className="as-student-cell">
                        <div className="as-avatar" style={{ background: avatarColor(s.name) }}>
                          {getInitials(s.name)}
                        </div>
                        <div>
                          <div className="as-student-name">{s.name}</div>
                          <div className="as-student-email">{s.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Enrollments */}
                    <td style={{ fontWeight: 500, color: 'var(--ink-2)' }}>
                      {s.enrollmentCount ?? 0}
                    </td>

                    {/* Joined */}
                    <td>{new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>

                    {/* Status */}
                    <td>
                      <span className={`as-badge ${s.isActive ? 'as-badge-green' : 'as-badge-red'}`}>
                        <span className="as-badge-dot" style={{ background: s.isActive ? 'var(--green)' : 'var(--danger)' }} />
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="as-actions">
                        <button
                          className="as-btn"
                          onClick={() => navigate(`/admin/students/${s._id}`)}
                        >
                          View
                        </button>
                        <button
                          className={`as-btn ${s.isActive ? 'as-btn-deactivate' : 'as-btn-activate'}`}
                          onClick={() => handleToggle(s._id, s.isActive)}
                        >
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination page={page} totalPages={pagination?.totalPages} onChange={setPage} />

      </div>
    </>
  );
}