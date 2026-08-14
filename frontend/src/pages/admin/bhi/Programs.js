import React, { useEffect, useState, useCallback } from 'react';
import { LoadingCenter, Alert, Modal } from '../../../components/common';
import { getPrograms, createProgram, deactivateProgram } from '../../../services/bhiApi';

export default function AdminBhiPrograms() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'primary', description: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getPrograms()
      .then((r) => setPrograms(r.data.programs))
      .catch(() => setError('Failed to load programs.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await createProgram(form);
      setShowModal(false);
      setForm({ name: '', type: 'primary', description: '' });
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add program.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Deactivate "${p.name}"?`)) return;
    await deactivateProgram(p._id);
    load();
  };

  const primary = programs.filter((p) => p.type === 'primary');
  const support = programs.filter((p) => p.type === 'support');

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>BHI Programs</h1>
            <p style={{ color: 'var(--gray-500)' }}>Extensible catalog of Primary Occupational Programs & Support Classes.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Program</button>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {loading ? <LoadingCenter /> : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>Primary Occupational Programs</h3>
              {primary.map((p) => (
                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                  <div><strong>{p.name}</strong>{p.description && <div style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>{p.description}</div>}</div>
                  <button className="btn btn-outline btn-sm" onClick={() => remove(p)}>Deactivate</button>
                </div>
              ))}
              {primary.length === 0 && <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>No primary programs yet.</div>}
            </div>
            <div className="card">
              <h3 style={{ marginBottom: 10 }}>Support Classes</h3>
              {support.map((p) => (
                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                  <div><strong>{p.name}</strong>{p.description && <div style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>{p.description}</div>}</div>
                  <button className="btn btn-outline btn-sm" onClick={() => remove(p)}>Deactivate</button>
                </div>
              ))}
              {support.length === 0 && <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>No support classes yet.</div>}
            </div>
          </div>
        )}

        {showModal && (
          <Modal title="New Program" onClose={() => setShowModal(false)}>
            <form onSubmit={submit}>
              {formError && <Alert type="error">{formError}</Alert>}
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Medical Assistant" />
              </div>
              <div className="form-group">
                <label className="form-label">Type *</label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="primary">Primary Occupational Program</option>
                  <option value="support">Required Support Class</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <button className="btn btn-primary btn-full" disabled={saving}>{saving ? 'Saving…' : 'Add Program'}</button>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}
