import React, { useEffect, useState, useCallback } from 'react';
import { LoadingCenter, Alert, Modal } from '../../../components/common';
import {
  getClasses, createClass, updateClass, deactivateClass, getPrograms, getTeachers,
  listTeacherAccounts, createTeacherAccount, setTeacherActive,
} from '../../../services/bhiApi';

const emptyForm = { program: '', sectionName: '', teacher: '', schedule: '' };
const emptyTeacherForm = { name: '', email: '', password: '' };

export default function AdminBhiClasses() {
  const [classes, setClasses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // ─── Teacher accounts panel (§2) ───────────────────────
  const [teacherAccounts, setTeacherAccounts] = useState([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [teacherForm, setTeacherForm] = useState(emptyTeacherForm);
  const [teacherSaving, setTeacherSaving] = useState(false);
  const [teacherFormError, setTeacherFormError] = useState('');
  const [newCredentials, setNewCredentials] = useState(null);

  const loadTeacherAccounts = useCallback(() => {
    listTeacherAccounts().then((r) => setTeacherAccounts(r.data.teachers)).catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([getClasses(), getPrograms(), getTeachers()])
      .then(([c, p, t]) => { setClasses(c.data.classes); setPrograms(p.data.programs); setTeachers(t.data.teachers); })
      .catch(() => setError('Failed to load classes.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadTeacherAccounts(); }, [loadTeacherAccounts]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormError(''); setShowModal(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ program: c.program?._id, sectionName: c.sectionName, teacher: c.teacher?._id, schedule: c.schedule });
    setFormError('');
    setShowModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) await updateClass(editing._id, form);
      else await createClass(form);
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save class.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Deactivate "${c.program?.name} ${c.sectionName}"? Historical attendance is preserved.`)) return;
    await deactivateClass(c._id);
    load();
  };

  // ─── Teacher account handlers ───────────────────────────
  const openTeacherModal = () => {
    setTeacherForm(emptyTeacherForm);
    setTeacherFormError('');
    setNewCredentials(null);
    setShowTeacherModal(true);
  };

  const submitTeacher = async (e) => {
    e.preventDefault();
    setTeacherSaving(true);
    setTeacherFormError('');
    try {
      const res = await createTeacherAccount({
        name: teacherForm.name,
        email: teacherForm.email,
        password: teacherForm.password || undefined,
      });
      loadTeacherAccounts();
      load(); // refresh teacher dropdown for class assignment too
      if (res.data.temporaryPassword) {
        setNewCredentials({ email: teacherForm.email, password: res.data.temporaryPassword });
      } else {
        setShowTeacherModal(false);
      }
    } catch (err) {
      setTeacherFormError(err.response?.data?.message || 'Failed to create teacher account.');
    } finally {
      setTeacherSaving(false);
    }
  };

  const toggleTeacherActive = async (t) => {
    await setTeacherActive(t._id, !t.isActive);
    loadTeacherAccounts();
    load();
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>BHI Classes</h1>
            <p style={{ color: 'var(--gray-500)' }}>Program/section offerings, each with an assigned teacher and schedule.</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ New Class</button>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {/* ── Teacher Accounts (§2) ── */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3>Teacher Accounts</h3>
            <button className="btn btn-outline btn-sm" onClick={openTeacherModal}>+ Create Teacher Account</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {teacherAccounts.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 16, color: 'var(--gray-500)' }}>No teacher accounts yet.</td></tr>
                ) : teacherAccounts.map((t) => (
                  <tr key={t._id}>
                    <td>{t.name}</td>
                    <td>{t.email}</td>
                    <td><span className={`badge ${t.isActive ? 'badge-green' : 'badge-gray'}`}>{t.isActive ? 'Active' : 'Deactivated'}</span></td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => toggleTeacherActive(t)}>
                        {t.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {loading ? <LoadingCenter /> : (
          <div className="card table-wrap">
            <table>
              <thead><tr><th>Program</th><th>Section</th><th>Type</th><th>Teacher</th><th>Schedule</th><th></th></tr></thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-500)' }}>No classes yet.</td></tr>
                ) : classes.map((c) => (
                  <tr key={c._id}>
                    <td>{c.program?.name}</td>
                    <td>{c.sectionName || '—'}</td>
                    <td><span className="badge badge-gray">{c.program?.type}</span></td>
                    <td>{c.teacher?.name}</td>
                    <td>{c.schedule || '—'}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(c)}>Deactivate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <Modal title={editing ? 'Edit Class' : 'New Class'} onClose={() => setShowModal(false)}>
            <form onSubmit={submit}>
              {formError && <Alert type="error">{formError}</Alert>}
              <div className="form-group">
                <label className="form-label">Program *</label>
                <select required value={form.program} onChange={(e) => setForm((f) => ({ ...f, program: e.target.value }))}>
                  <option value="">Select…</option>
                  {programs.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.type})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Section Name</label>
                <input value={form.sectionName} onChange={(e) => setForm((f) => ({ ...f, sectionName: e.target.value }))} placeholder="e.g. Section A" />
              </div>
              <div className="form-group">
                <label className="form-label">Teacher *</label>
                <select required value={form.teacher} onChange={(e) => setForm((f) => ({ ...f, teacher: e.target.value }))}>
                  <option value="">Select…</option>
                  {teachers.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
                {teachers.length === 0 && <div className="form-hint">No teacher accounts found — create a User with role "teacher" first.</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Schedule</label>
                <input value={form.schedule} onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))} placeholder="e.g. M/W/F 9am-1pm" />
              </div>
              <button className="btn btn-primary btn-full" disabled={saving}>{saving ? 'Saving…' : 'Save Class'}</button>
            </form>
          </Modal>
        )}

        {showTeacherModal && (
          <Modal title="Create Teacher Account" onClose={() => setShowTeacherModal(false)}>
            {newCredentials ? (
              <div>
                <Alert type="success">Teacher account created.</Alert>
                <p style={{ fontSize: 13.5, marginBottom: 10 }}>
                  Share these credentials with the teacher — this password is shown only once and isn't stored anywhere retrievable.
                </p>
                <div className="card" style={{ background: 'var(--gray-50)', fontFamily: 'monospace', fontSize: 13 }}>
                  <div>Email: {newCredentials.email}</div>
                  <div>Temporary password: {newCredentials.password}</div>
                </div>
                <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} onClick={() => setShowTeacherModal(false)}>Done</button>
              </div>
            ) : (
              <form onSubmit={submitTeacher}>
                {teacherFormError && <Alert type="error">{teacherFormError}</Alert>}
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input required value={teacherForm.name} onChange={(e) => setTeacherForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" required value={teacherForm.email} onChange={(e) => setTeacherForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="text" value={teacherForm.password} onChange={(e) => setTeacherForm((f) => ({ ...f, password: e.target.value }))} placeholder="Leave blank to auto-generate" />
                  <div className="form-hint">Leave blank and we'll generate a temporary one to share with the teacher.</div>
                </div>
                <button className="btn btn-primary btn-full" disabled={teacherSaving}>{teacherSaving ? 'Creating…' : 'Create Account'}</button>
              </form>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
