import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LoadingCenter, Alert } from '../../../components/common';
import { getLessonHistory, getLessonDayDetail } from '../../../services/bhiApi';

export default function TeacherBhiLessonHistory() {
  const { classId } = useParams();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    getLessonHistory(classId)
      .then((r) => setRecords(r.data.records))
      .catch(() => setError('Failed to load lesson history.'))
      .finally(() => setLoading(false));
  }, [classId]);

  const openDay = async (dailyRecordId) => {
    const r = await getLessonDayDetail(dailyRecordId);
    setDetail(r.data);
  };

  if (loading) return <LoadingCenter />;

  return (
    <div className="page">
      <div className="container">
        <Link to="/teacher/bhi" style={{ fontSize: 13 }}>← My Classes</Link>
        <h1 style={{ margin: '8px 0 4px' }}>Lesson History</h1>

        {error && <Alert type="error">{error}</Alert>}

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Lesson / Topic</th><th>Teacher</th><th></th></tr></thead>
              <tbody>
                {records.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 24, color: 'var(--gray-500)' }}>No lessons submitted yet.</td></tr>
                ) : records.map((r) => (
                  <tr key={r._id}>
                    <td>{r.date}</td>
                    <td>{r.lessonTopic}</td>
                    <td>{r.teacher?.name}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => openDay(r._id)}>View Day</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {detail && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3>{detail.dailyRecord.date} — {detail.dailyRecord.lessonTopic}</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setDetail(null)}>Close</button>
            </div>
            <div style={{ fontSize: 13.5, marginBottom: 14 }}>
              {detail.dailyRecord.activitiesCompleted && <div><strong>Activities:</strong> {detail.dailyRecord.activitiesCompleted}</div>}
              {detail.dailyRecord.assignmentsMaterials && <div><strong>Assignments:</strong> {detail.dailyRecord.assignmentsMaterials}</div>}
              {detail.dailyRecord.additionalNotes && <div><strong>Notes:</strong> {detail.dailyRecord.additionalNotes}</div>}
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Student</th><th>Status</th><th>Note</th></tr></thead>
                <tbody>
                  {detail.marks.map((m) => (
                    <tr key={m._id}>
                      <td>{m.student?.lastName}, {m.student?.firstName}</td>
                      <td><span className={`badge ${m.status === 'Absent' ? 'badge-red' : m.status === 'Present' ? 'badge-green' : 'badge-yellow'}`}>{m.status}</span></td>
                      <td>{m.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
