import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingCenter, Alert } from '../../../components/common';
import { getClassBreakdown } from '../../../services/bhiApi';

// §35: "Don't only have the three overall student lists — you should also
// be able to see: Medical Assistant — 🟢18 🟠3 🔴2, then Digital Literacy — ..."
// One row per class, grouped by program, with a proportional color bar so
// admins can spot a struggling class at a glance instead of reading numbers.
export default function AdminBhiClassBreakdown() {
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getClassBreakdown()
      .then((r) => setBreakdown(r.data.breakdown))
      .catch(() => setError('Failed to load class breakdown.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingCenter />;

  // Group rows by program name so related classes/sections sit together.
  const grouped = breakdown.reduce((acc, row) => {
    const key = row.programName || 'Unassigned';
    (acc[key] = acc[key] || []).push(row);
    return acc;
  }, {});

  return (
    <div className="page">
      <div className="container">
        <Link to="/admin/bhi" style={{ fontSize: 13 }}>← BHI Dashboard</Link>
        <h1 style={{ margin: '8px 0 4px' }}>Attendance Summary by Class</h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: 20 }}>
          Green / Orange / Red counts for every active class, so you can see exactly which class is driving an attendance concern.
        </p>

        {error && <Alert type="error">{error}</Alert>}

        {Object.keys(grouped).length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 30, color: 'var(--gray-500)' }}>
            No active classes with enrolled students yet.
          </div>
        ) : (
          Object.entries(grouped).map(([programName, rows]) => (
            <div key={programName} className="card" style={{ marginBottom: 18 }}>
              <h3 style={{ marginBottom: 12 }}>{programName}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {rows.map((row) => {
                  const total = row.counts.Green + row.counts.Orange + row.counts.Red;
                  const pct = (n) => (total > 0 ? (n / total) * 100 : 0);
                  return (
                    <div key={row.classId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 14 }}>
                        <span style={{ fontWeight: 600 }}>{row.sectionName}</span>
                        <span style={{ color: 'var(--gray-500)' }}>
                          🟢 {row.counts.Green} &nbsp; 🟠 {row.counts.Orange} &nbsp; 🔴 {row.counts.Red} &nbsp;
                          <span style={{ color: 'var(--gray-400, #999)' }}>({total} students)</span>
                        </span>
                      </div>
                      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden', background: 'var(--gray-100, #eee)' }}>
                        {total === 0 ? null : (
                          <>
                            <div style={{ width: `${pct(row.counts.Green)}%`, background: '#22c55e' }} title={`Green: ${row.counts.Green}`} />
                            <div style={{ width: `${pct(row.counts.Orange)}%`, background: '#f59e0b' }} title={`Orange: ${row.counts.Orange}`} />
                            <div style={{ width: `${pct(row.counts.Red)}%`, background: '#ef4444' }} title={`Red: ${row.counts.Red}`} />
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
