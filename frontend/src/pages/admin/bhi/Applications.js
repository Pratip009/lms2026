import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LoadingCenter, Alert, Pagination } from '../../../components/common';
import { listApplications, getPrograms } from '../../../services/bhiApi';

export const STATUS_META = {
  Submitted: { label: 'New', badge: 'badge-blue' },
  UnderReview: { label: 'Under review', badge: 'badge-yellow' },
  NeedsInfo: { label: 'Needs info', badge: 'badge-red' },
  Approved: { label: 'Approved', badge: 'badge-green' },
  Enrolled: { label: 'Enrolled', badge: 'badge-green' },
  Rejected: { label: 'Rejected', badge: 'badge-gray' },
  Draft: { label: 'Draft', badge: 'badge-gray' },
};
export const CATEGORY_LABEL = { HCDFS: 'Hudson County', EQISS: 'EQISS', PRIVATE: 'Private' };
export const CAMPUS_LABEL = { SUMMIT: '591 Summit Ave', BERGEN: '910 Bergen Ave' };

const TABS = ['', 'Submitted', 'UnderReview', 'NeedsInfo', 'Approved', 'Enrolled', 'Rejected', 'Draft'];
const REQUIRED_DOCS = ['resume', 'photo_id', 'ss_card'];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

export default function AdminBhiApplications() {
  const [status, setStatus] = useState('');
  const [filters, setFilters] = useState({ category: '', location: '', program: '', search: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ applications: [], counts: {}, pagination: {} });
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { getPrograms('primary').then((r) => setPrograms(r.data.programs)).catch(() => {}); }, []);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, status: status || undefined };
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    listApplications(params)
      .then((r) => { setData(r.data); setError(''); })
      .catch((e) => setError(e.response?.data?.message || 'Failed to load applications.'))
      .finally(() => setLoading(false));
  }, [page, status, filters]);

  useEffect(() => {
    const t = setTimeout(load, filters.search ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, filters.search]);

  const setFilter = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };
  const openCount = (data.counts.Submitted || 0) + (data.counts.UnderReview || 0);
  const enrollLink = `${window.location.origin}/enroll`;

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>Enrollment applications</h1>
            <p style={{ color: 'var(--gray-500)' }}>
              {openCount} waiting for review. Students apply at{' '}
              <a href={enrollLink} target="_blank" rel="noreferrer">{enrollLink}</a>
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard?.writeText(enrollLink)}>Copy enrollment link</button>
        </div>

        <div className="tabs" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
          {TABS.map((s) => (
            <button key={s || 'all'} className={`tab-btn ${status === s ? 'active' : ''}`} onClick={() => { setStatus(s); setPage(1); }}>
              {s ? STATUS_META[s].label : 'All'}
              {s && data.counts[s] ? ` (${data.counts[s]})` : ''}
            </button>
          ))}
        </div>

        <div className="card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, padding: 12 }}>
          <input style={{ flex: '2 1 220px' }} placeholder="Search name, email, or application #" value={filters.search} onChange={(e) => setFilter('search', e.target.value)} />
          <select style={{ flex: '1 1 140px' }} value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {Object.entries(CATEGORY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select style={{ flex: '1 1 140px' }} value={filters.location} onChange={(e) => setFilter('location', e.target.value)}>
            <option value="">Both campuses</option>
            {Object.entries(CAMPUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          <select style={{ flex: '1 1 180px' }} value={filters.program} onChange={(e) => setFilter('program', e.target.value)}>
            <option value="">All programs</option>
            {programs.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {loading ? <LoadingCenter /> : (
          <div className="card table-wrap">
            <table>
              <thead>
                <tr><th>Application</th><th>Applicant</th><th>Category</th><th>Program</th><th>Campus</th><th>Submitted</th><th>Documents</th><th>Status</th></tr>
              </thead>
              <tbody>
                {data.applications.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-500)' }}>
                    No applications match these filters.
                  </td></tr>
                ) : data.applications.map((a) => {
                  const docs = a.documents || [];
                  const have = REQUIRED_DOCS.filter((k) => docs.some((d) => d.kind === k)).length;
                  const rejected = docs.some((d) => d.review?.status === 'rejected');
                  const verified = REQUIRED_DOCS.filter((k) => docs.some((d) => d.kind === k && d.review?.status === 'verified')).length;
                  const meta = STATUS_META[a.status] || {};
                  return (
                    <tr key={a._id}>
                      <td><Link to={`/admin/bhi/applications/${a._id}`} style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{a.applicationNumber}</Link></td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{a.personal?.firstName} {a.personal?.lastName}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--gray-500)' }}>{a.personal?.email}</div>
                      </td>
                      <td>{CATEGORY_LABEL[a.category]}</td>
                      <td>{a.program?.requested?.name || '—'}</td>
                      <td>{CAMPUS_LABEL[a.program?.preferredLocation] || '—'}</td>
                      <td>{fmtDate(a.submittedAt)}</td>
                      <td>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{have}/3 uploaded</span>
                        <div style={{ fontSize: 12.5, color: rejected ? 'var(--danger)' : 'var(--gray-500)' }}>
                          {rejected ? 'Re-upload requested' : `${verified} verified`}
                        </div>
                      </td>
                      <td><span className={`badge ${meta.badge}`}>{meta.label}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination page={data.pagination.page || 1} totalPages={data.pagination.totalPages || 1} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
