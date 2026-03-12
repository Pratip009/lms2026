import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import { LoadingCenter, Alert } from '../../components/common';

const INIT = {
  title: '',
  description: '',
  shortDescription: '',
  price: '',
  discountPrice: '0',
  category: '',
  level: 'beginner',
  language: 'English',
  requirements: '',
  whatYouWillLearn: '',
  tags: '',
};

export default function AdminCourseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(INIT);
  const [thumbnail, setThumbnail] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/courses/${id}`)
      .then((r) => {
        const c = r.data.course;
        setForm({
          title: c.title || '',
          description: c.description || '',
          shortDescription: c.shortDescription || '',
          price: c.price || '',
          discountPrice: c.discountPrice || '0',
          category: c.category || '',
          level: c.level || 'beginner',
          language: c.language || 'English',
          requirements: (c.requirements || []).join('\n'),
          whatYouWillLearn: (c.whatYouWillLearn || []).join('\n'),
          tags: (c.tags || []).join(', '),
        });
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Build a plain object with arrays properly parsed
  const buildPayload = () => ({
    ...form,
    requirements: form.requirements.split('\n').filter(Boolean),
    whatYouWillLearn: form.whatYouWillLearn.split('\n').filter(Boolean),
    tags: form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = buildPayload();

      if (thumbnail) {
        // Only use FormData when a file needs to be uploaded
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          // Arrays must be JSON-stringified inside FormData
          fd.append(k, Array.isArray(v) ? JSON.stringify(v) : v);
        });
        fd.append('thumbnail', thumbnail);

        if (isEdit) {
          await api.put(`/courses/${id}`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          await api.post('/courses', fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        }
      } else {
        // No file — send as plain JSON so the backend can parse it cleanly
        if (isEdit) {
          await api.put(`/courses/${id}`, payload);
        } else {
          await api.post('/courses', payload);
        }
      }

      navigate('/admin/courses');
    } catch (err) {
      console.error('Course save error:', err.response?.data);
      setError(err.response?.data?.message || 'Save failed. Please check all fields and try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingCenter />;

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="flex justify-between items-center mb-20">
        <h1 style={{ fontSize: 20, fontWeight: 700 }}>
          {isEdit ? 'Edit Course' : 'New Course'}
        </h1>
        <button className="btn btn-outline" onClick={() => navigate('/admin/courses')}>
          ← Back
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Basic Info</h3>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Short Description</label>
            <input
              value={form.shortDescription}
              onChange={(e) => set('shortDescription', e.target.value)}
              placeholder="One line summary"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Full Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={5}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                required
                placeholder="e.g. Web Development"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Level</label>
              <select value={form.level} onChange={(e) => set('level', e.target.value)}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Language</label>
              <input
                value={form.language}
                onChange={(e) => set('language', e.target.value)}
                placeholder="e.g. English"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Price (USD) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Discount Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.discountPrice}
                onChange={(e) => set('discountPrice', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma separated)</label>
            <input
              value={form.tags}
              onChange={(e) => set('tags', e.target.value)}
              placeholder="javascript, nodejs, backend"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Requirements (one per line)</label>
            <textarea
              value={form.requirements}
              onChange={(e) => set('requirements', e.target.value)}
              rows={3}
              placeholder={'Basic JavaScript\nNode.js installed'}
            />
          </div>

          <div className="form-group">
            <label className="form-label">What You'll Learn (one per line)</label>
            <textarea
              value={form.whatYouWillLearn}
              onChange={(e) => set('whatYouWillLearn', e.target.value)}
              rows={3}
              placeholder={'Build REST APIs\nConnect to MongoDB'}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Thumbnail Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnail(e.target.files[0] || null)}
              style={{ padding: 6 }}
            />
            {thumbnail && (
              <small style={{ color: '#666', marginTop: 4, display: 'block' }}>
                Selected: {thumbnail.name}
              </small>
            )}
          </div>
        </div>

        <div className="flex gap-12 mt-16">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={saving}
          >
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Course'}
          </button>
          <button
            type="button"
            className="btn btn-outline btn-lg"
            onClick={() => navigate('/admin/courses')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}