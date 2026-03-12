import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LoadingCenter, Alert, ProgressBar } from '../../components/common';

const formatTime = s => `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('progress');

  useEffect(() => {
    api.get(`/admin/students/${id}`)
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingCenter />;
  if (!data) return <Alert type="error">Student not found.</Alert>;

  const { student, enrollments, progressList, recentAttendance } = data;

  return (
    <div>
      <button className="btn btn-outline btn-sm mb-16" onClick={() => navigate('/admin/students')}>← Back</button>

      {/* Profile */}
      <div className="card mb-20">
        <div className="flex items-center gap-16">
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            {student.avatar?.url ? <img src={student.avatar.url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18 }}>{student.name}</div>
            <div className="text-muted">{student.email}</div>
            <div className="flex gap-8 mt-4">
              <span className={`badge ${student.isActive ? 'badge-green' : 'badge-red'}`}>{student.isActive ? 'Active' : 'Inactive'}</span>
              <span className="text-xs text-muted">Joined {new Date(student.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {['progress', 'attendance', 'enrollments'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'progress' && (
        <div>
          {progressList.length === 0 ? (
            <div className="empty"><div className="empty-icon">📊</div><p>No progress data.</p></div>
          ) : progressList.map(p => (
            <div key={p._id} className="card mb-12">
              <div className="flex justify-between items-center mb-8">
                <div style={{ fontWeight: 600 }}>{p.course?.title}</div>
                <div className="flex items-center gap-12">
                  <span>{p.progressPercentage}%</span>
                  {p.isCompleted && <span className="badge badge-green">Completed</span>}
                </div>
              </div>
              <ProgressBar value={p.progressPercentage} />
              <div className="text-sm text-muted mt-8">
                {p.completedLessons} / {p.totalLessons} lessons completed
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Study Time</th><th>Sessions</th><th>Status</th></tr></thead>
              <tbody>
                {recentAttendance.length === 0 ? (
                  <tr><td colSpan={4} className="text-center text-muted" style={{ padding: 24 }}>No attendance data.</td></tr>
                ) : recentAttendance.map(r => (
                  <tr key={r._id}>
                    <td>{r.date}</td>
                    <td>{formatTime(r.totalDuration)}</td>
                    <td>{r.loginCount}</td>
                    <td><span className={`badge ${r.status === 'present' ? 'badge-green' : r.status === 'partial' ? 'badge-yellow' : 'badge-red'}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'enrollments' && (
        <div>
          {enrollments.length === 0 ? (
            <div className="empty"><div className="empty-icon">📚</div><p>No enrollments.</p></div>
          ) : enrollments.map(e => (
            <div key={e._id} className="card mb-12 flex justify-between items-center">
              <div>
                <div style={{ fontWeight: 600 }}>{e.course?.title}</div>
                <div className="text-sm text-muted">Enrolled {new Date(e.enrolledAt).toLocaleDateString()}</div>
              </div>
              <span className={`badge ${e.isActive ? 'badge-green' : 'badge-red'}`}>{e.isActive ? 'Active' : 'Revoked'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
