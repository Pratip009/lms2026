import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LoadingCenter, Alert } from '../../../components/common';
import BhiColorBadge from '../../../components/bhi/BhiColorBadge';
import {
  getDashboard, getOverviewLists, getPrograms, getClasses, getTeachers, overrideStudentColor,
  getColorConfig, updateColorConfig,
} from '../../../services/bhiApi';

export default function AdminBhiDashboard() {
  const [stats, setStats] = useState(null);
  const [lists, setLists] = useState({ Green: [], Orange: [], Red: [] });
  const [activeColor, setActiveColor] = useState('Red');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [programs, setPrograms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [filters, setFilters] = useState({ program: '', class: '', teacher: '', status: 'Active' });

  const [config, setConfig] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    Promise.all([getDashboard(filters), getOverviewLists()])
      .then(([d, o]) => {
        setStats(d.data);
        setLists(o.data.lists);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    getPrograms().then((r) => setPrograms(r.data.programs)).catch(() => {});
    getClasses().then((r) => setClasses(r.data.classes)).catch(() => {});
    getTeachers().then((r) => setTeachers(r.data.teachers)).catch(() => {});
    getColorConfig().then((r) => setConfig(r.data.config)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleOverride = async (studentId, color) => {
    const reason = window.prompt(`Reason for setting this student to ${color || 'auto-calculated'}?`) || '';
    try {
      await overrideStudentColor(studentId, { color, reason });
      load();
    } catch {
      alert('Failed to update override.');
    }
  };

  const saveConfig = async () => {
    setConfigSaving(true);
    try {
      const r = await updateColorConfig({
        orangeThreshold: Number(config.orangeThreshold),
        redThreshold: Number(config.redThreshold),
      });
      setConfig(r.data.config);
      setShowConfig(false);
      load();
    } catch {
      alert('Failed to update thresholds.');
    } finally {
      setConfigSaving(false);
    }
  };

  if (loading && !stats) return <LoadingCenter />;

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>BHI Attendance Dashboard</h1>
            <p style={{ color: 'var(--gray-500)', marginBottom: 20 }}>
              Real-time attendance status across all active students.
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => setShowConfig((v) => !v)}>
            ⚙️ Color Thresholds{config ? ` (🟠 ${config.orangeThreshold} / 🔴 ${config.redThreshold})` : ''}
          </button>
        </div>

        {showConfig && config && (
          <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-end', marginBottom: 20 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Orange threshold (consecutive unexcused)</label>
              <input type="number" min={1} value={config.orangeThreshold}
                onChange={(e) => setConfig((c) => ({ ...c, orangeThreshold: e.target.value }))} style={{ maxWidth: 100 }} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Red threshold (consecutive unexcused)</label>
              <input type="number" min={1} value={config.redThreshold}
                onChange={(e) => setConfig((c) => ({ ...c, redThreshold: e.target.value }))} style={{ maxWidth: 100 }} />
            </div>
            <button className="btn btn-primary btn-sm" disabled={configSaving} onClick={saveConfig}>
              {configSaving ? 'Saving…' : 'Save Thresholds'}
            </button>
          </div>
        )}

        {error && <Alert type="error">{error}</Alert>}

        {/* ── Filters ── */}
        <div className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
          <select value={filters.program} onChange={(e) => setFilters((f) => ({ ...f, program: e.target.value }))}>
            <option value="">All Programs</option>
            {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select value={filters.class} onChange={(e) => setFilters((f) => ({ ...f, class: e.target.value }))}>
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>{c.program?.name} {c.sectionName}</option>
            ))}
          </select>
          <select value={filters.teacher} onChange={(e) => setFilters((f) => ({ ...f, teacher: e.target.value }))}>
            <option value="">All Teachers</option>
            {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Withdrawn">Withdrawn</option>
            <option value="Transferred">Transferred</option>
          </select>
        </div>

        {/* ── Header stat cards, clickable to drill in ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{stats?.totalActiveStudents ?? 0}</div>
            <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>Total Active Students</div>
          </div>
          {['Green', 'Orange', 'Red'].map((c) => (
            <div
              key={c}
              className="card"
              style={{ textAlign: 'center', cursor: 'pointer', border: activeColor === c ? '2px solid var(--primary)' : undefined }}
              onClick={() => setActiveColor(c)}
            >
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {c === 'Green' ? '🟢' : c === 'Orange' ? '🟠' : '🔴'} {stats?.counts?.[c] ?? 0}
              </div>
              <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>{c} students</div>
            </div>
          ))}
        </div>

        {/* ── Active list table ── */}
        <div className="card">
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {['Green', 'Orange', 'Red'].map((c) => (
              <button
                key={c}
                className={`btn btn-sm ${activeColor === c ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveColor(c)}
              >
                {c} ({lists[c]?.length || 0})
              </button>
            ))}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Last Name</th><th>First Name</th><th>Program</th><th>Teacher</th>
                  <th>Attendance %</th><th>Consec. Unexcused</th><th>Status</th><th>Override</th>
                </tr>
              </thead>
              <tbody>
                {(lists[activeColor] || []).length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-500)' }}>No students in this list.</td></tr>
                ) : lists[activeColor].map((s) => (
                  <tr key={s.studentId}>
                    <td><Link to={`/admin/bhi/students/${s.studentId}`}>{s.lastName}</Link></td>
                    <td>{s.firstName}</td>
                    <td>{s.program}</td>
                    <td>{s.teacher}</td>
                    <td>{s.attendancePercent}%</td>
                    <td>{s.consecutiveUnexcused}</td>
                    <td><BhiColorBadge color={activeColor} overridden={s.isOverridden} /></td>
                    <td>
                      <select
                        defaultValue=""
                        onChange={(e) => { if (e.target.value !== '') handleOverride(s.studentId, e.target.value === 'clear' ? null : e.target.value); e.target.value = ''; }}
                      >
                        <option value="" disabled>Set…</option>
                        <option value="Green">Force Green</option>
                        <option value="Orange">Force Orange</option>
                        <option value="Red">Force Red</option>
                        <option value="clear">Clear override</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
