import React from 'react';

export function Spinner({ large }) {
  return <div className={`spinner ${large ? 'spinner-lg' : ''}`} />;
}

export function LoadingCenter() {
  return <div className="loading-center"><Spinner large /></div>;
}

export function Alert({ type = 'error', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ProgressBar({ value }) {
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-fill" style={{ width: `${Math.min(100, value || 0)}%` }} />
    </div>
  );
}

export function StatCard({ label, value, color = '#2563eb' }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 700, color }}>{value}</div>
      <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>{label}</div>
    </div>
  );
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-8 mt-16">
      <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>← Prev</button>
      <span className="text-sm text-muted">Page {page} of {totalPages}</span>
      <button className="btn btn-outline btn-sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>Next →</button>
    </div>
  );
}

export function CourseCard({ course, onClick }) {
  const price = course.discountPrice > 0 ? course.discountPrice : course.price;
  return (
    <div className="card" style={{ cursor: 'pointer', transition: 'box-shadow 0.15s' }}
      onClick={onClick}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
      {course.thumbnail?.url && (
        <img src={course.thumbnail.url} alt={course.title}
          style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 4, marginBottom: 12 }} />
      )}
      {!course.thumbnail?.url && (
        <div style={{ width: '100%', height: 140, background: '#eff6ff', borderRadius: 4, marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>📚</div>
      )}
      <div style={{ fontWeight: 600, marginBottom: 4 }} className="truncate">{course.title}</div>
      <div className="text-sm text-muted" style={{ marginBottom: 8 }}>
        {course.instructor?.name} · <span className="badge badge-gray">{course.level}</span>
      </div>
      <div className="flex items-center justify-between">
        <span style={{ fontWeight: 700, color: '#2563eb' }}>${price}</span>
        <span className="text-xs text-muted">{course.totalLessons} lessons</span>
      </div>
    </div>
  );
}
