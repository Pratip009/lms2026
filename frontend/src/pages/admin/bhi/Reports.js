import React, { useEffect, useState } from 'react';
import { LoadingCenter, Alert } from '../../../components/common';
import {
  getReport, downloadReport, getStudents, getClasses, getTeachers, getClassBreakdown,
} from '../../../services/bhiApi';

const REPORT_TYPES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'student', label: 'Student' },
  { value: 'program', label: 'Program' },
  { value: 'class', label: 'Class' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'concern', label: 'Attendance Concern (🟠/🔴)' },
];

export default function AdminBhiReports() {
  const [type, setType] = useState('daily');
  const [studentId, setStudentId] = useState('');
  const [classId, setClassId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [breakdown, setBreakdown] = useState([]);

  useEffect(() => {
    getStudents({}).then((r) => setStudents(r.data.students)).catch(() => {});
    getClasses().then((r) => setClasses(r.data.classes)).catch(() => {});
    getTeachers().then((r) => setTeachers(r.data.teachers)).catch(() => {});
    getClassBreakdown().then((r) => setBreakdown(r.data.breakdown)).catch(() => {});
  }, []);

  const runReport = () => {
    setLoading(true);
    setError('');
    getReport({ type, studentId, classId, teacherId, dateFrom, dateTo })
      .then((r) => setRows(r.data.rows))
      .catch(() => setError('Failed to generate report.'))
      .finally(() => setLoading(false));
  };

  const handleExport = async (format) => {
    try {
      await downloadReport({ format, type, studentId, classId, teacherId, dateFrom, dateTo });
    } catch {
      setError('Export failed — try narrowing your filters.');
    }
  };

  const columns = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ marginBottom: 4 }}>BHI Reports & Export</h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: 20 }}>
          Built for grant, government, caseworker, and internal audit needs.
        </p>

        {error && <Alert type="error">{error}</Alert>}

        {/* ── Filters ── */}
        <div className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 20 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Report Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Student</label>
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              <option value="">All</option>
              {students.map((s) => <option key={s._id} value={s._id}>{s.lastName}, {s.firstName}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Class</label>
            <select value={classId} onChange={(e) => setClassId(e.target.value)}>
              <option value="">All</option>
              {classes.map((c) => <option key={c._id} value={c._id}>{c.program?.name} {c.sectionName}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Teacher</label>
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">All</option>
              {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={runReport}>Run Report</button>
        </div>

        {rows.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <strong>{rows.length} rows</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline btn-sm" onClick={() => handleExport('csv')}>Export CSV</button>
                <button className="btn btn-outline btn-sm" onClick={() => handleExport('excel')}>Export Excel</button>
                <button className="btn btn-outline btn-sm" onClick={() => handleExport('pdf')}>Export PDF</button>
              </div>
            </div>
            {loading ? <LoadingCenter /> : (
              <div className="table-wrap" style={{ maxHeight: 420, overflowY: 'auto' }}>
                <table>
                  <thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
                  <tbody>
                    {rows.map((row, i) => (
                      <tr key={i}>{columns.map((c) => <td key={c}>{String(row[c] ?? '')}</td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Per-class color breakdown (§35) ── */}
        <div className="card">
          <h3 style={{ marginBottom: 10 }}>Attendance Summary by Class</h3>
          {breakdown.length === 0 ? <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>No active classes.</div> : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Program / Section</th><th>🟢 Green</th><th>🟠 Orange</th><th>🔴 Red</th></tr></thead>
                <tbody>
                  {breakdown.map((b) => (
                    <tr key={b.classId}>
                      <td>{b.programName} {b.sectionName}</td>
                      <td>{b.counts.Green}</td>
                      <td>{b.counts.Orange}</td>
                      <td>{b.counts.Red}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
