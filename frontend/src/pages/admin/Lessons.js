import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LoadingCenter, Alert, Modal } from '../../components/common';

const BLANK = { title: '', description: '', vdoCipherId: '', videoDuration: '', isFreePreview: false };

export default function AdminLessons() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = () => {
    Promise.all([
      api.get(`/courses/admin/${courseId}`),
      api.get(`/courses/${courseId}/lessons`),
    ]).then(([c, l]) => {
      setCourse(c.data.course);
      setLessons(l.data.lessons || []);
    }).finally(() => setLoading(false));
  };

  useEffect(load, [courseId]);

  const openAdd = () => { setEditing(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (l) => {
    setEditing(l);
    setForm({
      title: l.title,
      description: l.description,
      vdoCipherId: l.video?.vdoCipherId || '',
      videoDuration: l.video?.duration || '',
      isFreePreview: l.isFreePreview,
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await api.put(`/lessons/${editing._id}`, {
          ...form,
          videoDuration: Number(form.videoDuration) || 0,
        });
        setMsg('Lesson updated');
      } else {
        await api.post(`/courses/${courseId}/lessons`, {
          ...form,
          videoDuration: Number(form.videoDuration) || 0,
        });
        setMsg('Lesson added');
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/lessons/${id}`);
      setMsg('Lesson deleted');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleTogglePublish = async (l) => {
    try {
      await api.put(`/lessons/${l._id}`, { isPublished: !l.isPublished });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <LoadingCenter />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <button className="btn btn-outline btn-sm mb-8" onClick={() => navigate('/admin/courses')}>← Back</button>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{course?.title}</h1>
          <p className="text-sm text-muted">Manage Lessons</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Lesson</button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      <div className="card mt-16">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Title</th><th>Duration</th><th>Preview</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {lessons.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted" style={{ padding: 24 }}>No lessons yet. Add one!</td></tr>
              ) : lessons.map(l => (
                <tr key={l._id}>
                  <td>{l.order}</td>
                  <td>{l.title}</td>
                  <td>{Math.round((l.video?.duration || 0) / 60)}m</td>
                  <td>{l.isFreePreview ? <span className="badge badge-green">Free</span> : '—'}</td>
                  <td>
                    <span className={`badge ${l.isPublished ? 'badge-green' : 'badge-gray'}`}>
                      {l.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-8">
                      <button className="btn btn-outline btn-sm"
                        onClick={() => navigate(`/admin/courses/${courseId}/lessons/${l._id}/exam`)}>
                        Exam
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(l)}>Edit</button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleTogglePublish(l)}>
                        {l.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l._id, l.title)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? 'Edit Lesson' : 'Add Lesson'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave}>
            {error && <Alert type="error">{error}</Alert>}
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Description *</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} required />
            </div>
            <div className="form-group">
              <label className="form-label">VdoCipher Video ID *</label>
              <input value={form.vdoCipherId} onChange={e => setForm({ ...form, vdoCipherId: e.target.value })} required placeholder="e.g. abc123xyz" />
              <p className="form-hint">Get this from your VdoCipher dashboard</p>
            </div>
            <div className="form-group">
              <label className="form-label">Video Duration (seconds)</label>
              <input type="number" min="0" value={form.videoDuration} onChange={e => setForm({ ...form, videoDuration: e.target.value })} placeholder="e.g. 1800 for 30 min" />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isFreePreview} onChange={e => setForm({ ...form, isFreePreview: e.target.checked })} style={{ width: 'auto' }} />
                Free Preview (visible without purchase)
              </label>
            </div>
            <div className="flex gap-12">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Lesson'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
