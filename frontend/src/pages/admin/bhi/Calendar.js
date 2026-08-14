import React, { useEffect, useState, useCallback } from 'react';
import { LoadingCenter, Alert } from '../../../components/common';
import { getCalendarEvents, addCalendarEvent, removeCalendarEvent } from '../../../services/bhiApi';

const TYPE_LABEL = { holiday: 'Holiday', closure: 'Closure', emergency_closure: 'Emergency Closure', other: 'Other' };

export default function AdminBhiCalendar() {
  const year = new Date().getFullYear();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ date: '', label: '', type: 'holiday' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getCalendarEvents(`${year}-01-01`, `${year + 1}-12-31`)
      .then((r) => setEvents(r.data.events))
      .catch(() => setError('Failed to load calendar.'))
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.label) return;
    setSaving(true);
    try {
      await addCalendarEvent(form);
      setForm({ date: '', label: '', type: 'holiday' });
      load();
    } catch {
      setError('Failed to add calendar event.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (ev) => {
    if (!window.confirm(`Remove "${ev.label}" (${ev.date})?`)) return;
    await removeCalendarEvent(ev._id);
    load();
  };

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ marginBottom: 4 }}>BHI School Calendar</h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: 16 }}>
          Holidays, closures & non-instructional days. Weekends are excluded automatically — no need to add them here.
        </p>

        {error && <Alert type="error">{error}</Alert>}

        <form className="card" onSubmit={submit} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 20 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date</label>
            <input type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label className="form-label">Label</label>
            <input required placeholder="e.g. Thanksgiving Break" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add'}</button>
        </form>

        {loading ? <LoadingCenter /> : (
          <div className="card table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Label</th><th>Type</th><th></th></tr></thead>
              <tbody>
                {events.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-500)' }}>No calendar events yet.</td></tr>
                ) : events.map((ev) => (
                  <tr key={ev._id}>
                    <td>{ev.date}</td>
                    <td>{ev.label}</td>
                    <td><span className="badge badge-gray">{TYPE_LABEL[ev.type]}</span></td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => remove(ev)}>Remove</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
