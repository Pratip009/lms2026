import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { LoadingCenter, Alert } from '../../../components/common';
import { getRoster, submitAttendance } from '../../../services/bhiApi';

const STATUSES = ['Present', 'Absent', 'Excused', 'Late', 'Makeup'];
const STATUS_COLOR = { Present: 'badge-green', Absent: 'badge-red', Excused: 'badge-yellow', Late: 'badge-yellow', Makeup: 'badge-gray' };

export default function TeacherBhiMarkAttendance() {
  const { classId } = useParams();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState([]);
  const [marks, setMarks] = useState({}); // studentId -> { status, note }
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [lesson, setLesson] = useState({ lessonTopic: '', activitiesCompleted: '', assignmentsMaterials: '', additionalNotes: '' });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    setSuccess('');
    getRoster(classId, date)
      .then((r) => {
        setRoster(r.data.roster);
        setIsSubmitted(r.data.isSubmitted);
        const initMarks = {};
        r.data.roster.forEach((entry) => {
          initMarks[entry.student._id] = entry.existingMark
            ? { status: entry.existingMark.status, note: entry.existingMark.note || '' }
            : { status: 'Present', note: '' };
        });
        setMarks(initMarks);
        setLesson(r.data.dailyRecord
          ? {
              lessonTopic: r.data.dailyRecord.lessonTopic || '',
              activitiesCompleted: r.data.dailyRecord.activitiesCompleted || '',
              assignmentsMaterials: r.data.dailyRecord.assignmentsMaterials || '',
              additionalNotes: r.data.dailyRecord.additionalNotes || '',
            }
          : { lessonTopic: '', activitiesCompleted: '', assignmentsMaterials: '', additionalNotes: '' });
      })
      .catch(() => setError('Failed to load roster for this date.'))
      .finally(() => setLoading(false));
  }, [classId, date]);

  useEffect(() => { load(); }, [load]);

  const setMark = (studentId, field, value) => {
    setMarks((m) => ({ ...m, [studentId]: { ...m[studentId], [field]: value } }));
  };

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!lesson.lessonTopic.trim()) {
      setError("Please enter today's lesson or main instructional topic before submitting attendance.");
      return;
    }

    setSaving(true);
    try {
      await submitAttendance({
        class: classId,
        date,
        ...lesson,
        marks: roster.map((entry) => ({
          student: entry.student._id,
          status: marks[entry.student._id]?.status || 'Present',
          note: marks[entry.student._id]?.note || '',
        })),
      });
      setSuccess('Attendance submitted successfully.');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit attendance.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="container">
        <Link to="/teacher/bhi" style={{ fontSize: 13 }}>← My Classes</Link>
        <h1 style={{ margin: '8px 0 4px' }}>Mark Attendance</h1>

        <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          <label className="form-label" style={{ marginBottom: 0 }}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 200 }} />
          {isSubmitted && <span className="badge badge-green">✓ Submitted for this date</span>}
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        {loading ? <LoadingCenter /> : (
          <>
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Student</th><th>Status</th><th>Note</th></tr></thead>
                  <tbody>
                    {roster.length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--gray-500)' }}>
                        No students enrolled for this date (check enrollment start/end dates).
                      </td></tr>
                    ) : roster.map((entry) => (
                      <tr key={entry.student._id}>
                        <td>{entry.student.lastName}, {entry.student.firstName} <span style={{ color: 'var(--gray-500)' }}>({entry.student.studentId})</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {STATUSES.map((s) => (
                              <button
                                key={s}
                                type="button"
                                disabled={isSubmitted}
                                className={`badge ${marks[entry.student._id]?.status === s ? STATUS_COLOR[s] : 'badge-gray'}`}
                                style={{ cursor: isSubmitted ? 'default' : 'pointer', border: 'none' }}
                                onClick={() => setMark(entry.student._id, 'status', s)}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td>
                          <input
                            disabled={isSubmitted}
                            placeholder="Optional note…"
                            value={marks[entry.student._id]?.note || ''}
                            onChange={(e) => setMark(entry.student._id, 'note', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ marginBottom: 10 }}>Today's Lesson</h3>
              <div className="form-group">
                <label className="form-label">Lesson / Main Topic *</label>
                <input
                  disabled={isSubmitted}
                  required
                  value={lesson.lessonTopic}
                  onChange={(e) => setLesson((l) => ({ ...l, lessonTopic: e.target.value }))}
                  placeholder="What was taught today?"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Activities / Skills Completed</label>
                <textarea disabled={isSubmitted} rows={2} value={lesson.activitiesCompleted}
                  onChange={(e) => setLesson((l) => ({ ...l, activitiesCompleted: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Assignments / Materials</label>
                <textarea disabled={isSubmitted} rows={2} value={lesson.assignmentsMaterials}
                  onChange={(e) => setLesson((l) => ({ ...l, assignmentsMaterials: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Additional Notes</label>
                <textarea disabled={isSubmitted} rows={2} value={lesson.additionalNotes}
                  onChange={(e) => setLesson((l) => ({ ...l, additionalNotes: e.target.value }))} />
              </div>
            </div>

            {!isSubmitted && (
              <button className="btn btn-primary btn-lg" disabled={saving || roster.length === 0} onClick={handleSubmit}>
                {saving ? 'Submitting…' : 'Submit Attendance'}
              </button>
            )}
            {isSubmitted && (
              <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>
                This day is locked. Contact an admin if a correction is needed — all corrections are logged in the audit trail.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
