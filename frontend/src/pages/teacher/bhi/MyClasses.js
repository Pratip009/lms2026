import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingCenter, Alert } from '../../../components/common';
import { getClasses } from '../../../services/bhiApi';

export default function TeacherBhiMyClasses() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getClasses()
      .then((r) => setClasses(r.data.classes))
      .catch(() => setError('Failed to load your classes.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingCenter />;

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ marginBottom: 4 }}>My Classes</h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: 20 }}>Select a class to mark today's attendance or review lesson history.</p>

        {error && <Alert type="error">{error}</Alert>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {classes.length === 0 ? (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', color: 'var(--gray-500)' }}>
              No classes assigned to you yet — ask an admin to assign you to a class.
            </div>
          ) : classes.map((c) => (
            <div className="card" key={c._id}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{c.program?.name}</div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 4 }}>{c.sectionName}</div>
              <div style={{ color: 'var(--gray-500)', fontSize: 12.5, marginBottom: 12 }}>{c.schedule}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link className="btn btn-primary btn-sm" to={`/teacher/bhi/classes/${c._id}/attendance`}>Mark Attendance</Link>
                <Link className="btn btn-outline btn-sm" to={`/teacher/bhi/classes/${c._id}/lessons`}>Lesson History</Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
