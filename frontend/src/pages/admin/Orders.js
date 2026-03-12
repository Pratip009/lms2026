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

  .ao-root {
    font-family: var(--font-sans);
    background: var(--surface);
    min-height: 100vh;
    color: var(--ink);
    padding: 40px;
    -webkit-font-smoothing: antialiased;
  }

  /* ══ HEADER ══ */
  .ao-header {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 20px; flex-wrap: wrap;
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  .ao-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 6px;
  }
  .ao-title {
    font-family: var(--font-serif);
    font-size: 30px; color: var(--ink);
    letter-spacing: -.025em; line-height: 1.05;
  }
  .ao-subtitle { font-size: 13px; color: var(--ink-4); margin-top: 4px; }

  /* ══ STAT CARDS ══ */
  .ao-stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 14px; margin-bottom: 20px;
  }
  .ao-stat {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 14px; padding: 20px 22px;
    transition: box-shadow .2s, transform .2s;
  }
  .ao-stat:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .ao-stat-label {
    font-size: 11px; font-weight: 600; letter-spacing: .09em;
    text-transform: uppercase; color: var(--ink-4); margin-bottom: 10px;
  }
  .ao-stat-value {
    font-family: var(--font-serif);
    font-size: 30px; color: var(--ink);
    letter-spacing: -.03em; line-height: 1;
  }
  .ao-stat-value.green { color: var(--green); }

  /* ══ TABLE CARD ══ */
  .ao-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    margin-bottom: 24px;
  }

  /* Bar: filter */
  .ao-bar {
    display: flex; align-items: center; gap: 10px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }
  .ao-select {
    padding: 8px 30px 8px 12px;
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 8px; font-family: var(--font-sans);
    font-size: 13.5px; color: var(--ink-3); outline: none; cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='11' height='11' fill='none' stroke='%23a09d95' stroke-width='2' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
    background-color: var(--surface);
    transition: border-color .14s;
  }
  .ao-select:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px var(--accent-lt); background-color: var(--white); }

  .ao-count { font-size: 13px; color: var(--ink-4); margin-left: auto; white-space: nowrap; }
  .ao-count strong { color: var(--ink-2); font-weight: 600; }

  /* ── Table ── */
  .ao-table-wrap { overflow-x: auto; }
  .ao-table { width: 100%; border-collapse: collapse; }

  .ao-table thead tr { border-bottom: 1px solid var(--border); }
  .ao-table th {
    padding: 11px 16px; text-align: left;
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .08em; color: var(--ink-4); white-space: nowrap;
  }
  .ao-table td {
    padding: 13px 16px; font-size: 13.5px; color: var(--ink-3);
    border-bottom: 1px solid var(--border); vertical-align: middle;
  }
  .ao-table tbody tr:last-child td { border-bottom: none; }
  .ao-table tbody tr:hover td { background: var(--surface); }

  /* Student cell */
  .ao-student-cell { display: flex; align-items: center; gap: 10px; }
  .ao-avatar {
    width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10.5px; font-weight: 600; color: white; letter-spacing: .02em;
  }
  .ao-student-name { font-size: 13.5px; font-weight: 600; color: var(--ink); }
  .ao-student-email { font-size: 11.5px; color: var(--ink-4); margin-top: 1px; }

  /* Course name */
  .ao-course-name {
    font-size: 13.5px; color: var(--ink-2); font-weight: 500;
    max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* Amount */
  .ao-amount { font-family: var(--font-serif); font-size: 16px; color: var(--ink); letter-spacing: -.01em; }

  /* Status badges */
  .ao-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11.5px; font-weight: 600; padding: 3px 10px;
    border-radius: 6px; white-space: nowrap; text-transform: capitalize;
  }
  .ao-badge-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .ao-badge-completed { background: var(--green-lt);   color: var(--green);  border: 1px solid var(--green-mid); }
  .ao-badge-pending   { background: var(--amber-lt);   color: var(--amber);  border: 1px solid var(--amber-mid); }
  .ao-badge-failed    { background: var(--danger-lt);  color: var(--danger); border: 1px solid var(--danger-mid); }
  .ao-badge-refunded  { background: var(--surface-2);  color: var(--ink-4);  border: 1px solid var(--border); }

  /* Empty */
  .ao-empty { text-align: center; padding: 72px 20px; }
  .ao-empty-icon { font-size: 40px; opacity: .2; margin-bottom: 14px; }
  .ao-empty-title {
    font-family: var(--font-serif); font-size: 20px; color: var(--ink);
    letter-spacing: -.02em; margin-bottom: 6px;
  }
  .ao-empty-sub { font-size: 13.5px; color: var(--ink-4); }

  @media (max-width: 1024px) { .ao-stats { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 768px)  {
    .ao-root { padding: 24px 16px; }
    .ao-stats { grid-template-columns: repeat(2, 1fr); }
    .ao-student-email { display: none; }
  }
  @media (max-width: 480px)  { .ao-stats { grid-template-columns: 1fr; } }
`;

const AVATAR_COLORS = ['#1c4ed8','#7c3aed','#047857','#b45309','#be123c','#0369a1','#4d7c0f'];
function avatarColor(name) {
  return AVATAR_COLORS[((name || '').charCodeAt(0) || 0) % AVATAR_COLORS.length];
}
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

const BADGE_CLASS = {
  completed: 'ao-badge-completed',
  pending:   'ao-badge-pending',
  failed:    'ao-badge-failed',
  refunded:  'ao-badge-refunded',
};
const BADGE_DOT_COLOR = {
  completed: 'var(--green)',
  pending:   'var(--amber)',
  failed:    'var(--danger)',
  refunded:  'var(--ink-5)',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [revenue, setRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/orders', { params: { page, limit: 20, status } })
      .then(r => {
        setOrders(r.data.orders || []);
        setPagination(r.data.pagination);
        setRevenue(r.data.totalRevenue || 0);
      })
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [page, status]);

  if (loading) return (
    <div style={{ background: 'var(--surface, #f8f8f6)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingCenter />
    </div>
  );

  const totalOrders = pagination?.total || orders.length;

  return (
    <>
      <style>{styles}</style>
      <div className="ao-root">

        {/* ── Header ── */}
        <div className="ao-header">
          <div>
            <div className="ao-eyebrow">Admin Panel</div>
            <div className="ao-title">Orders</div>
            <div className="ao-subtitle">{totalOrders} order{totalOrders !== 1 ? 's' : ''} total</div>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 20 }}>
            <Alert type="error">{error}</Alert>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="ao-stats">
          <div className="ao-stat">
            <div className="ao-stat-label">Total Revenue</div>
            <div className="ao-stat-value green">${revenue.toFixed(2)}</div>
          </div>
          <div className="ao-stat">
            <div className="ao-stat-label">Total Orders</div>
            <div className="ao-stat-value">{totalOrders.toLocaleString()}</div>
          </div>
          <div className="ao-stat">
            <div className="ao-stat-label">Completed</div>
            <div className="ao-stat-value">{orders.filter(o => o.status === 'completed').length}</div>
          </div>
          <div className="ao-stat">
            <div className="ao-stat-label">Pending</div>
            <div className="ao-stat-value">{orders.filter(o => o.status === 'pending').length}</div>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="ao-card">
          <div className="ao-bar">
            <select
              className="ao-select"
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <div className="ao-count">
              <strong>{orders.length}</strong>
              {pagination?.total ? ` of ${pagination.total}` : ''} orders
            </div>
          </div>

          <div className="ao-table-wrap">
            <table className="ao-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="ao-empty">
                        <div className="ao-empty-icon">🧾</div>
                        <div className="ao-empty-title">No orders found</div>
                        <div className="ao-empty-sub">
                          {status ? 'Try a different status filter.' : 'Orders will appear here once students enroll.'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : orders.map(o => (
                  <tr key={o._id}>
                    {/* Student */}
                    <td>
                      <div className="ao-student-cell">
                        <div className="ao-avatar" style={{ background: avatarColor(o.student?.name) }}>
                          {getInitials(o.student?.name)}
                        </div>
                        <div>
                          <div className="ao-student-name">{o.student?.name || '—'}</div>
                          <div className="ao-student-email">{o.student?.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Course */}
                    <td>
                      <div className="ao-course-name">{o.course?.title || '—'}</div>
                    </td>

                    {/* Amount */}
                    <td>
                      <span className="ao-amount">${o.amount?.toFixed(2)}</span>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`ao-badge ${BADGE_CLASS[o.status] || 'ao-badge-refunded'}`}>
                        <span className="ao-badge-dot" style={{ background: BADGE_DOT_COLOR[o.status] || 'var(--ink-5)' }} />
                        {o.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td>{new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
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