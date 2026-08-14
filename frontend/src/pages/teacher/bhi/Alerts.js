import React, { useEffect, useState } from 'react';
import { LoadingCenter, Alert } from '../../../components/common';
import { getAlerts } from '../../../services/bhiApi';

export default function TeacherBhiAlerts() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAlerts()
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load alerts.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingCenter />;

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ marginBottom: 4 }}>Attendance Alerts</h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: 20 }}>Students flagged for consecutive unexcused absences.</p>

        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}>🔴 Critical ({data?.criticalCount ?? 0})</h3>
            {data?.critical?.length === 0 ? <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>No critical cases.</div> : (
              data?.critical?.map((s) => (
                <div key={s.studentId} style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-200)', fontSize: 13.5 }}>
                  <strong>{s.name}</strong> — {s.program} ({s.teacher}) — {s.consecutiveUnexcused} consecutive unexcused
                </div>
              ))
            )}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}>🟠 Concern ({data?.concernCount ?? 0})</h3>
            {data?.concern?.length === 0 ? <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>No concern cases.</div> : (
              data?.concern?.map((s) => (
                <div key={s.studentId} style={{ padding: '8px 0', borderBottom: '1px solid var(--gray-200)', fontSize: 13.5 }}>
                  <strong>{s.name}</strong> — {s.program} ({s.teacher}) — {s.consecutiveUnexcused} consecutive unexcused
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
