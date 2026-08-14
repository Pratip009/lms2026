import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LoadingCenter, Alert, Modal } from '../../../components/common';
import { getStudents, createStudent, getPrograms, getClasses } from '../../../services/bhiApi';

const ORG_OPTIONS = ['', 'HCDFS', 'EQUSS', 'PRIVATE'];
const STATUS_OPTIONS = ['', 'SNAP', 'GA', 'TANF'];
const ENROLLMENT_STATUSES = ['Active', 'Completed', 'Withdrawn', 'Transferred', 'Terminated'];

const emptyForm = {
  firstName: '', lastName: '', studentId: '', phone: '', email: '', address: '',
  caseNumber: '', caseworker: { name: '', email: '', phone: '' }, organization: '', status: '', courseCode: '',
  primaryProgram: { class: '', startDate: '', expectedEndDate: '' },
  supportClass: { class: '', startDate: '', expectedEndDate: '' },
};

export default function AdminBhiStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('lastName');
  const [order, setOrder] = useState('asc');
  const [statusFilter, setStatusFilter] = useState('Active');

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [programs, setPrograms] = useState([]);
  const [supportPrograms, setSupportPrograms] = useState([]);
  const [primaryClasses, setPrimaryClasses] = useState([]);
  const [supportClasses, setSupportClasses] = useState([]);

  const load = useCallback(() => {
    setLoading(true);
    getStudents({ search, sortBy, order, status: statusFilter || undefined })
      .then((r) => setStudents(r.data.students))
      .catch(() => setError('Failed to load students.'))
      .finally(() => setLoading(false));
  }, [search, sortBy, order, statusFilter]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    getPrograms('primary').then((r) => setPrograms(r.data.programs)).catch(() => {});
    getPrograms('support').then((r) => setSupportPrograms(r.data.programs)).catch(() => {});
    getClasses().then((r) => {
      setPrimaryClasses(r.data.classes);
      setSupportClasses(r.data.classes);
    }).catch(() => {});
  }, []);

  const toggleSort = (field) => {
    if (sortBy === field) setOrder(order === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setOrder('asc'); }
  };

  const openAddModal = () => { setForm(emptyForm); setFormError(''); setShowModal(true); };

  const submitForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await createStudent(form);
      setShowModal(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add student.');
    } finally {
      setSaving(false);
    }
  };

  const update = (path, value) => {
    setForm((f) => {
      const next = { ...f };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>BHI Students</h1>
            <p style={{ color: 'var(--gray-500)' }}>Institute roster — students are never permanently deleted.</p>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>+ Add Student</button>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <div className="card" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <input placeholder="Search name or Student ID…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {ENROLLMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <LoadingCenter /> : (
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('lastName')}>Last Name {sortBy === 'lastName' ? (order === 'asc' ? '↑' : '↓') : ''}</th>
                  <th>First Name</th>
                  <th>Student ID</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('courseCode')}>Course Code</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('caseworker')}>Caseworker</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('organization')}>Organization</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('status')}>Status</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('startDate')}>Start Date</th>
                  <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('endDate')}>End Date</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-500)' }}>No students found.</td></tr>
                ) : students.map((s) => {
                  const primary = s.enrollments?.find((e) => e.role === 'primary');
                  return (
                    <tr key={s._id}>
                      <td><Link to={`/admin/bhi/students/${s._id}`}>{s.lastName}</Link></td>
                      <td>{s.firstName}</td>
                      <td>{s.studentId}</td>
                      <td>{s.courseCode}</td>
                      <td>{s.caseworker?.name}</td>
                      <td>{s.organization}</td>
                      <td><span className="badge badge-gray">{s.enrollmentStatus}</span></td>
                      <td>{primary?.startDate || '—'}</td>
                      <td>{primary?.expectedEndDate || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {showModal && (
          <Modal title="Add Student" onClose={() => setShowModal(false)}>
            <form onSubmit={submitForm}>
              {formError && <Alert type="error">{formError}</Alert>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">First Name *</label>
                  <input required value={form.firstName} onChange={(e) => update('firstName', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Last Name *</label>
                  <input required value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Student ID *</label>
                  <input required value={form.studentId} onChange={(e) => update('studentId', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Phone</label>
                  <input value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Email</label>
                  <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Address</label>
                  <input value={form.address} onChange={(e) => update('address', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Case Number</label>
                  <input value={form.caseNumber} onChange={(e) => update('caseNumber', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Course Code</label>
                  <input value={form.courseCode} onChange={(e) => update('courseCode', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Organization</label>
                  <select value={form.organization} onChange={(e) => update('organization', e.target.value)}>
                    {ORG_OPTIONS.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">Status (SNAP/GA/TANF)</label>
                  <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                    {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
                  </select></div>
              </div>

              <h4 style={{ margin: '14px 0 8px' }}>Caseworker</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Name</label>
                  <input value={form.caseworker.name} onChange={(e) => update('caseworker.name', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Email</label>
                  <input value={form.caseworker.email} onChange={(e) => update('caseworker.email', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Phone</label>
                  <input value={form.caseworker.phone} onChange={(e) => update('caseworker.phone', e.target.value)} /></div>
              </div>

              <h4 style={{ margin: '14px 0 8px' }}>Primary Occupational Program</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Class</label>
                  <select value={form.primaryProgram.class} onChange={(e) => update('primaryProgram.class', e.target.value)}>
                    <option value="">— None —</option>
                    {primaryClasses.map((c) => <option key={c._id} value={c._id}>{c.program?.name} {c.sectionName}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">Start Date</label>
                  <input type="date" value={form.primaryProgram.startDate} onChange={(e) => update('primaryProgram.startDate', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Expected End Date</label>
                  <input type="date" value={form.primaryProgram.expectedEndDate} onChange={(e) => update('primaryProgram.expectedEndDate', e.target.value)} /></div>
              </div>

              <h4 style={{ margin: '14px 0 8px' }}>Required Support Class (optional)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group"><label className="form-label">Class</label>
                  <select value={form.supportClass.class} onChange={(e) => update('supportClass.class', e.target.value)}>
                    <option value="">— None —</option>
                    {supportClasses.map((c) => <option key={c._id} value={c._id}>{c.program?.name} {c.sectionName}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">Start Date</label>
                  <input type="date" value={form.supportClass.startDate} onChange={(e) => update('supportClass.startDate', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Expected End Date</label>
                  <input type="date" value={form.supportClass.expectedEndDate} onChange={(e) => update('supportClass.expectedEndDate', e.target.value)} /></div>
              </div>

              <button className="btn btn-primary btn-full" disabled={saving} style={{ marginTop: 10 }}>
                {saving ? 'Saving…' : 'Add Student'}
              </button>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}
