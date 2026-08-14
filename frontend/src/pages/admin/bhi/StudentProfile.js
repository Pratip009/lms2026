import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { LoadingCenter, Alert, ProgressBar } from '../../../components/common';
import BhiColorBadge from '../../../components/bhi/BhiColorBadge';
import {
  getStudentProfile, changeStudentStatus, correctAttendance, getAuditHistory,
} from '../../../services/bhiApi';

const STATUSES = ['Present', 'Absent', 'Excused', 'Late', 'Makeup'];

export default function AdminBhiStudentProfile() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [auditFor, setAuditFor] = useState(null);
  const [audits, setAudits] = useState([]);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getStudentProfile(id)
      .then((r) => setData(r.data))
      .catch(() => setError('Failed to load student profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleStatusChange = async (status) => {
    if (!window.confirm(`Change status to ${status}? This will close active enrollments.`)) return;
    try {
      await changeStudentStatus(id, { status });
      load();
    } catch {
      alert('Failed to update status.');
    }
  };

  const handleCorrect = async (record) => {
    const status = window.prompt(`Correct status (${STATUSES.join('/')}) — currently ${record.status}:`, record.status);
    if (!status || !STATUSES.includes(status)) return;
    const reason = window.prompt('Reason for correction (for the audit trail):') || '';
    try {
      await correctAttendance(record._id, { status, reason });
      load();
    } catch {
      alert('Failed to correct attendance.');
    }
  };

  const viewAudit = async (recordId) => {
    setAuditFor(recordId);
    const r = await getAuditHistory(recordId);
    setAudits(r.data.audits);
  };

  if (loading) return <LoadingCenter />;
  if (error) return <Alert type="error">{error}</Alert>;
  if (!data) return null;

  const { student, effectiveColor, programProgress, perClassBreakdown, attendanceHistory } = data;
  const primary = perClassBreakdown.find((c) => c.role === 'primary');

  return (
    <div className="page">
      <div className="container">

        {/* ── Header ── */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>{student.firstName} {student.lastName}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-gray">{student.enrollmentStatus}</span>
              <BhiColorBadge color={effectiveColor} overridden={!!student.colorOverride} />
              {primary && <span style={{ color: 'var(--gray-500)', fontSize: 13 }}>Overall Attendance: {primary.attendancePercent}%</span>}
            </div>
          </div>
          <select defaultValue="" onChange={(e) => e.target.value && handleStatusChange(e.target.value)}>
            <option value="" disabled>Change Status…</option>
            {['Active', 'Completed', 'Withdrawn', 'Transferred', 'Terminated'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* ── Enrollment + Progress ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Enrollment</h3>
            {perClassBreakdown.map((c) => (
              <div key={c.enrollmentId} style={{ marginBottom: 8, fontSize: 13.5 }}>
                <strong>{c.role === 'primary' ? 'Primary Program' : 'Support Class'}:</strong> {c.programName} — {c.teacher} ({c.status})
              </div>
            ))}
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Program Progress</h3>
            {programProgress ? (
              <>
                <div style={{ fontSize: 13.5, marginBottom: 6 }}>
                  Progress 🟢{programProgress.percentComplete}% / Attendance <BhiColorBadge color={programProgress.attendanceColor} /> {programProgress.attendancePercent}%
                </div>
                <ProgressBar value={programProgress.percentComplete} />
                <div style={{ fontSize: 12.5, color: 'var(--gray-500)', marginTop: 8 }}>
                  Instructional days: {programProgress.instructionalDaysCompleted} completed / {programProgress.instructionalDaysRemaining} remaining
                  <br />Expected completion: {programProgress.expectedCompletionDate}
                </div>
              </>
            ) : <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>No primary program enrollment.</div>}
          </div>
        </div>

        {/* ── Per-class attendance breakdown + summary counts ── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 10 }}>Attendance Summary by Class</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Class</th><th>%</th><th>Present</th><th>Absent</th><th>Excused</th><th>Late</th><th>Makeup</th><th>Consec. Unexcused</th><th>Color</th></tr>
              </thead>
              <tbody>
                {perClassBreakdown.map((c) => (
                  <tr key={c.enrollmentId}>
                    <td>{c.programName} <span style={{ color: 'var(--gray-500)' }}>({c.role})</span></td>
                    <td>{c.attendancePercent}%</td>
                    <td>{c.counts.Present}</td>
                    <td>{c.counts.Absent}</td>
                    <td>{c.counts.Excused}</td>
                    <td>{c.counts.Late}</td>
                    <td>{c.counts.Makeup}</td>
                    <td>{c.consecutiveUnexcused}</td>
                    <td><BhiColorBadge color={c.color} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Full attendance calendar/history table ── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 10 }}>Attendance History</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Class</th><th>Status</th><th>Notes</th><th></th><th></th></tr></thead>
              <tbody>
                {attendanceHistory.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 20, color: 'var(--gray-500)' }}>No attendance records yet.</td></tr>
                ) : attendanceHistory.map((r) => (
                  <tr key={r._id}>
                    <td>{r.date}</td>
                    <td>{r.class?.program?.name} {r.class?.sectionName}</td>
                    <td><span className={`badge ${r.status === 'Absent' ? 'badge-red' : r.status === 'Present' ? 'badge-green' : 'badge-yellow'}`}>{r.status}</span></td>
                    <td>{r.note}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => handleCorrect(r)}>Correct</button></td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => viewAudit(r._id)}>Audit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Attendance Change / Audit History (§4, §12-17) ── */}
        {auditFor && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ marginBottom: 10 }}>Audit History</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setAuditFor(null)}>Close</button>
            </div>
            {audits.length === 0 ? <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>No corrections logged for this record.</div> : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Original</th><th>New</th><th>Changed By</th><th>When</th><th>Reason</th></tr></thead>
                  <tbody>
                    {audits.map((a) => (
                      <tr key={a._id}>
                        <td>{a.originalStatus}</td><td>{a.newStatus}</td>
                        <td>{a.changedBy?.name}</td><td>{new Date(a.createdAt).toLocaleString()}</td>
                        <td>{a.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── More Information (admin-only intake details, §26) ── */}
        <div className="card">
          <button className="btn btn-outline btn-sm" onClick={() => setShowMoreInfo((v) => !v)}>
            {showMoreInfo ? 'Hide' : 'Show'} More Information
          </button>
          {showMoreInfo && (
            <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.8 }}>
              <div><strong>Student ID:</strong> {student.studentId}</div>
              <div><strong>Phone:</strong> {student.phone || '—'}</div>
              <div><strong>Email:</strong> {student.email || '—'}</div>
              <div><strong>Address:</strong> {student.address || '—'}</div>
              <div><strong>Case Number:</strong> {student.caseNumber || '—'}</div>
              <div><strong>Caseworker:</strong> {student.caseworker?.name || '—'} ({student.caseworker?.email || '—'}, {student.caseworker?.phone || '—'})</div>
              <div><strong>Organization:</strong> {student.organization || '—'}</div>
              <div><strong>Benefit Status:</strong> {student.status || '—'}</div>
              <div><strong>Course Code:</strong> {student.courseCode || '—'}</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
