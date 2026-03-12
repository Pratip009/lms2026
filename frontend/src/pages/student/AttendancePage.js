import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { LoadingCenter, ProgressBar, StatCard } from '../../components/common';

const formatTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
};

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [today, setToday] = useState(null);
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

  const reqSeconds = 10800;

  return (
    <div className="container page">
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>My Attendance</h1>

      {/* Today */}
      {today && (
        <div className="card mb-24">
          <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Today — {today.date}</h3>
          <div className="grid-2" style={{ gap: 20 }}>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
                {formatTime(today.totalDuration)}
              </div>
              <div className="text-sm text-muted">Studied today (goal: 3 hours)</div>
              <div style={{ marginTop: 12 }}>
                <ProgressBar value={Math.min(100, (today.totalDuration / reqSeconds) * 100)} />
              </div>
            </div>
            <div className="flex-col gap-8">
              <div className="flex justify-between text-sm">
                <span>Sessions</span><span>{today.loginCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status</span>
                <span className={`badge ${today.meetsRequirement ? 'badge-green' : today.totalDuration > 0 ? 'badge-yellow' : 'badge-red'}`}>
                  {today.status}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Goal (3h)</span>
                <span>{today.meetsRequirement ? '✓ Met' : 'Not yet'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary stats */}
      {summary && (
        <div className="grid-4 mb-24">
          <StatCard label="Total Days Logged" value={summary.totalDays} />
          <StatCard label="Present Days" value={summary.presentDays} color="#16a34a" />
          <StatCard label="Partial Days" value={summary.partialDays} color="#d97706" />
          <StatCard label="Total Study Time" value={formatTime(summary.totalSeconds || 0)} color="#7c3aed" />
        </div>
      )}

      {/* History */}
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recent History</h2>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Study Time</th>
                <th>Sessions</th>
                <th>Goal Met</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted" style={{ padding: 24 }}>No attendance records yet.</td></tr>
              ) : records.map(r => (
                <tr key={r._id}>
                  <td>{r.date}</td>
                  <td>{formatTime(r.totalDuration)}</td>
                  <td>{r.loginCount}</td>
                  <td>{r.meetsRequirement ? '✓' : '✗'}</td>
                  <td>
                    <span className={`badge ${r.status === 'present' ? 'badge-green' : r.status === 'partial' ? 'badge-yellow' : 'badge-red'}`}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
