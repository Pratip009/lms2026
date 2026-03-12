import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { LoadingCenter } from '../../components/common';

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
    --amber:      #b45309;
    --amber-lt:   #fffbeb;
    --amber-mid:  #fde68a;
    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans:  'Instrument Sans', system-ui, sans-serif;
    --shadow-sm:  0 2px 8px rgba(17,17,16,0.07);
    --shadow-md:  0 8px 24px rgba(17,17,16,0.09);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ad-root {
    font-family: var(--font-sans);
    background: var(--surface);
    min-height: 100vh;
    color: var(--ink);
    padding: 40px;
    -webkit-font-smoothing: antialiased;
  }

  /* ══ HEADER ══ */
  .ad-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 36px; flex-wrap: wrap; gap: 16px;
    padding-bottom: 28px; border-bottom: 1px solid var(--border);
  }
  .ad-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 6px;
  }
  .ad-title {
    font-family: var(--font-serif);
    font-size: 34px; color: var(--ink);
    letter-spacing: -.025em; line-height: 1.05;
  }
  .ad-date { font-size: 13px; color: var(--ink-4); margin-top: 5px; font-weight: 400; }

  .ad-live-badge {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 16px;
    background: var(--green-lt); border: 1px solid var(--green-mid);
    border-radius: 8px;
    font-size: 13px; font-weight: 500; color: var(--green);
    align-self: flex-start;
  }
  .ad-live-dot {
    width: 7px; height: 7px; border-radius: 50%; background: var(--green);
    animation: livePulse 2.2s ease infinite; flex-shrink: 0;
  }
  @keyframes livePulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: .4; }
  }

  /* ══ STAT CARDS ══ */
  .ad-stats {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 14px; margin-bottom: 20px;
  }
  .ad-stat {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px; padding: 22px 22px 20px;
    transition: border-color .2s, box-shadow .2s, transform .2s;
  }
  .ad-stat:hover {
    border-color: var(--border-2);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .ad-stat-top {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .ad-stat-label {
    font-size: 12px; font-weight: 600; letter-spacing: .08em;
    text-transform: uppercase; color: var(--ink-4);
  }
  .ad-stat-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
  }

  .ad-stat-value {
    font-family: var(--font-serif);
    font-size: 34px; color: var(--ink);
    letter-spacing: -.03em; line-height: 1; margin-bottom: 8px;
  }
  .ad-stat-change {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 6px;
  }
  .ad-stat-change.up      { background: var(--green-lt); color: var(--green); }
  .ad-stat-change.neutral { background: var(--surface-2); color: var(--ink-4); border: 1px solid var(--border); }

  /* ══ MIDDLE ROW ══ */
  .ad-mid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 14px; margin-bottom: 20px;
  }

  .ad-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px; padding: 22px 24px;
  }
  .ad-card-head {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 18px; padding-bottom: 14px; border-bottom: 1px solid var(--border);
  }
  .ad-card-title {
    font-family: var(--font-serif);
    font-size: 17px; color: var(--ink); letter-spacing: -.015em;
  }
  .ad-card-meta {
    font-size: 12px; color: var(--ink-5); font-weight: 500;
  }

  /* Month items */
  .ad-month-item {
    display: flex; align-items: center; justify-content: space-between;
    padding: 11px 0; border-bottom: 1px solid var(--border);
  }
  .ad-month-item:last-child { border-bottom: none; }
  .ad-month-label {
    font-size: 13.5px; color: var(--ink-3); font-weight: 500;
  }
  .ad-month-value {
    font-family: var(--font-serif);
    font-size: 20px; color: var(--ink); letter-spacing: -.02em;
  }

  /* Top courses */
  .ad-course-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 0; border-bottom: 1px solid var(--border); gap: 12px;
  }
  .ad-course-row:last-child { border-bottom: none; }
  .ad-course-row-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
  .ad-course-num {
    width: 22px; height: 22px; border-radius: 6px;
    background: var(--surface-2); border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; color: var(--ink-4); flex-shrink: 0;
  }
  .ad-course-name {
    font-size: 13.5px; color: var(--ink-2); font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ad-enroll-badge {
    background: var(--accent-lt); color: var(--accent);
    border: 1px solid var(--accent-mid);
    padding: 3px 10px; border-radius: 6px;
    font-size: 11.5px; font-weight: 600; white-space: nowrap; flex-shrink: 0;
  }

  /* ══ REVENUE TABLE ══ */
  .ad-revenue { margin-bottom: 20px; }
  .ad-table { width: 100%; border-collapse: collapse; }
  .ad-table thead tr { border-bottom: 1px solid var(--border); }
  .ad-table th {
    padding: 10px 14px; text-align: left;
    font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: .08em; color: var(--ink-4);
  }
  .ad-table td {
    padding: 12px 14px; font-size: 13.5px; color: var(--ink-3);
    border-bottom: 1px solid var(--border);
  }
  .ad-table tbody tr:last-child td { border-bottom: none; }
  .ad-table tbody tr:hover td { background: var(--surface); color: var(--ink-2); }
  .ad-revenue-amount { font-weight: 600; color: var(--green) !important; }

  .ad-rev-bar-wrap {
    width: 80px; height: 3px;
    background: var(--border); border-radius: 2px; overflow: hidden;
  }
  .ad-rev-bar-fill { height: 100%; background: var(--green); border-radius: 2px; }

  /* ══ QUICK LINKS ══ */
  .ad-links {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  }
  .ad-link {
    display: flex; align-items: center; gap: 12px;
    padding: 15px 18px; border-radius: 12px;
    text-decoration: none; font-size: 14px; font-weight: 600;
    background: var(--white); border: 1.5px solid var(--border);
    color: var(--ink-3);
    transition: border-color .16s, color .16s, background .16s, transform .14s, box-shadow .16s;
  }
  .ad-link:hover {
    transform: translateY(-2px);
    text-decoration: none;
    color: var(--ink);
    border-color: var(--border-2);
    box-shadow: var(--shadow-md);
    background: var(--surface);
  }
  .ad-link-icon {
    width: 34px; height: 34px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0;
    background: var(--surface-2); border: 1px solid var(--border);
  }

  /* Empty */
  .ad-empty { color: var(--ink-5); font-size: 13px; text-align: center; padding: 24px 0; }

  /* ══ RESPONSIVE ══ */
  @media (max-width: 1024px) {
    .ad-stats { grid-template-columns: repeat(2, 1fr); }
    .ad-links { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    .ad-root { padding: 24px 20px; }
    .ad-mid  { grid-template-columns: 1fr; }
    .ad-stats { grid-template-columns: repeat(2, 1fr); }
    .ad-links { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 480px) {
    .ad-stats { grid-template-columns: 1fr; }
    .ad-links { grid-template-columns: 1fr; }
  }
`;

const now = new Date();
const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats').then(r => setStats(r.data.stats)).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingCenter />
    </div>
  );

  const c = stats?.counts || {};
  const topCourses = stats?.charts?.topCourses || [];
  const revenueByMonth = stats?.charts?.revenueByMonth || [];
  const maxRevenue = Math.max(...revenueByMonth.map(r => r.revenue), 1);

  const statCards = [
    {
      label: 'Total Students',
      value: (c.totalStudents || 0).toLocaleString(),
      icon: '👤',
      iconBg: '#eff4ff',
      change: `+${c.newStudentsThisMonth || 0} this month`,
      up: true,
    },
    {
      label: 'Published Courses',
      value: c.publishedCourses || 0,
      icon: '📚',
      iconBg: '#f5f0ff',
      change: `${c.totalCourses || 0} total`,
      up: false,
    },
    {
      label: 'Total Orders',
      value: (c.totalOrders || 0).toLocaleString(),
      icon: '🧾',
      iconBg: '#f0fdf4',
      change: `+${c.newOrdersThisMonth || 0} this month`,
      up: true,
    },
    {
      label: 'Total Revenue',
      value: `$${(c.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: '💵',
      iconBg: '#fffbeb',
      change: `${c.activeEnrollments || 0} active enrollments`,
      up: false,
    },
  ];

  const monthItems = [
    { label: 'New Students',       value: c.newStudentsThisMonth || 0 },
    { label: 'New Orders',         value: c.newOrdersThisMonth || 0 },
    { label: 'Present Today',      value: c.todayPresentStudents || 0 },
    { label: 'Active Enrollments', value: c.activeEnrollments || 0 },
  ];

  const quickLinks = [
    { to: '/admin/courses/new', label: 'New Course',       icon: '＋' },
    { to: '/admin/students',    label: 'Students',         icon: '👤' },
    { to: '/admin/orders',      label: 'Orders',           icon: '🧾' },
    { to: '/admin/attendance',  label: 'Attendance',       icon: '📅' },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="ad-root">

        {/* ── Header ── */}
        <div className="ad-header">
          <div>
            <div className="ad-eyebrow">Admin Panel</div>
            <div className="ad-title">Dashboard</div>
            <div className="ad-date">{dateStr}</div>
          </div>
          <div className="ad-live-badge">
            <div className="ad-live-dot" />
            System Online
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="ad-stats">
          {statCards.map((s, i) => (
            <div className="ad-stat" key={i}>
              <div className="ad-stat-top">
                <div className="ad-stat-label">{s.label}</div>
                <div className="ad-stat-icon" style={{ background: s.iconBg }}>{s.icon}</div>
              </div>
              <div className="ad-stat-value">{s.value}</div>
              <div className={`ad-stat-change ${s.up ? 'up' : 'neutral'}`}>
                {s.up ? '↑' : '◆'} {s.change}
              </div>
            </div>
          ))}
        </div>

        {/* ── Middle Row ── */}
        <div className="ad-mid">
          <div className="ad-card">
            <div className="ad-card-head">
              <div className="ad-card-title">This Month</div>
              <div className="ad-card-meta">Last 30 days</div>
            </div>
            {monthItems.map((item, i) => (
              <div className="ad-month-item" key={i}>
                <div className="ad-month-label">{item.label}</div>
                <div className="ad-month-value">{item.value}</div>
              </div>
            ))}
          </div>

          <div className="ad-card">
            <div className="ad-card-head">
              <div className="ad-card-title">Top Courses</div>
              <div className="ad-card-meta">By enrollment</div>
            </div>
            {topCourses.length === 0 ? (
              <div className="ad-empty">No courses yet</div>
            ) : topCourses.map((course, i) => (
              <div className="ad-course-row" key={course._id}>
                <div className="ad-course-row-left">
                  <div className="ad-course-num">{i + 1}</div>
                  <div className="ad-course-name">{course.title}</div>
                </div>
                <div className="ad-enroll-badge">{course.enrollmentCount} enrolled</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Revenue Table ── */}
        {revenueByMonth.length > 0 && (
          <div className="ad-card ad-revenue">
            <div className="ad-card-head">
              <div className="ad-card-title">Monthly Revenue</div>
              <div className="ad-card-meta">Last 12 months</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="ad-table">
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Revenue</th>
                    <th>Orders</th>
                    <th>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueByMonth.map(r => (
                    <tr key={r._id}>
                      <td>{r._id}</td>
                      <td className="ad-revenue-amount">${r.revenue.toFixed(2)}</td>
                      <td>{r.orders}</td>
                      <td>
                        <div className="ad-rev-bar-wrap">
                          <div className="ad-rev-bar-fill" style={{ width: `${(r.revenue / maxRevenue) * 100}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Quick Links ── */}
        <div className="ad-links">
          {quickLinks.map(l => (
            <Link key={l.to} to={l.to} className="ad-link">
              <div className="ad-link-icon">{l.icon}</div>
              {l.label}
            </Link>
          ))}
        </div>

      </div>
    </>
  );
}