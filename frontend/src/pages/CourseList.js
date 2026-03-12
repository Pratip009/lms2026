import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCourses } from '../redux/slices/courseSlice';
import { LoadingCenter, Pagination } from '../components/common';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600&display=swap');

  :root {
    --white:      #ffffff;
    --surface:    #f8f8f6;
    --surface-2:  #f2f1ee;
    --border:     #e5e3de;
    --border-2:   #d6d3cc;

    --ink:        #111110;
    --ink-2:      #3d3c39;
    --ink-3:      #6e6b64;
    --ink-4:      #a09d95;
    --ink-5:      #ccc9c1;

    --accent:     #1c4ed8;
    --accent-lt:  #eff4ff;
    --accent-mid: #bfcfff;

    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans:  'Instrument Sans', system-ui, sans-serif;

    --r:    8px;
    --r-lg: 14px;
    --r-xl: 20px;

    --shadow-sm: 0 2px 8px rgba(17,17,16,0.08);
    --shadow-md: 0 8px 24px rgba(17,17,16,0.09);
    --shadow-lg: 0 20px 48px rgba(17,17,16,0.11);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cl-root {
    font-family: var(--font-sans);
    background: var(--white);
    color: var(--ink);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* ══ HEADER ══ */
  .cl-header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .cl-header-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 52px 40px 0;
  }

  .cl-header-top {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 20px; flex-wrap: wrap;
    margin-bottom: 32px;
  }

  .cl-eyebrow {
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: var(--accent);
    margin-bottom: 8px;
  }
  .cl-title {
    font-family: var(--font-serif);
    font-size: clamp(30px, 4vw, 44px);
    color: var(--ink); letter-spacing: -.025em; line-height: 1.05;
  }
  .cl-title em { font-style: italic; color: var(--ink-3); }
  .cl-subtitle {
    font-size: 13.5px; font-weight: 400; color: var(--ink-4);
    margin-top: 8px;
  }

  /* ══ FILTER BAR ══ */
  .cl-filters {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: nowrap;
    padding-bottom: 20px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .cl-filters::-webkit-scrollbar { display: none; }

  /* Search */
  .cl-search-wrap {
    position: relative;
    flex: 1; min-width: 180px; max-width: 260px;
  }
  .cl-search-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    pointer-events: none; color: var(--ink-4); display: flex; align-items: center;
  }
  .cl-search-input {
    width: 100%;
    padding: 9px 14px 9px 36px;
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: var(--r);
    color: var(--ink);
    font-family: var(--font-sans);
    font-size: 13.5px; font-weight: 400;
    outline: none;
    transition: border-color .14s, box-shadow .14s;
  }
  .cl-search-input::placeholder { color: var(--ink-5); }
  .cl-search-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px var(--accent-lt);
  }

  /* Selects — inline in row */
  .cl-select {
    flex-shrink: 0;
    padding: 9px 32px 9px 13px;
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: var(--r);
    color: var(--ink-3);
    font-family: var(--font-sans);
    font-size: 13.5px; font-weight: 400;
    outline: none; cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='11' height='11' fill='none' stroke='%23a09d95' stroke-width='2' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 11px center;
    background-color: var(--white);
    transition: border-color .14s, color .14s;
    white-space: nowrap;
  }
  .cl-select:focus { border-color: var(--accent); outline: none; color: var(--ink); box-shadow: 0 0 0 3px var(--accent-lt); }
  .cl-select option { background: white; color: var(--ink); }

  /* Divider between search+selects and clear */
  .cl-filter-divider {
    width: 1px; height: 24px; background: var(--border);
    flex-shrink: 0;
  }

  .cl-clear-btn {
    flex-shrink: 0;
    font-size: 13px; font-weight: 600; color: var(--accent);
    background: var(--accent-lt); border: 1.5px solid var(--accent-mid);
    border-radius: var(--r); padding: 9px 16px;
    cursor: pointer; white-space: nowrap;
    font-family: var(--font-sans);
    transition: background .14s;
  }
  .cl-clear-btn:hover { background: #dce8ff; }

  /* Active filter tags */
  .cl-active-filters {
    display: flex; align-items: center; gap: 7px;
    flex-wrap: wrap; padding-bottom: 16px;
  }
  .cl-filter-tag {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 8px 5px 12px;
    background: var(--surface-2); border: 1.5px solid var(--border);
    border-radius: 100px;
    font-size: 12px; font-weight: 600; color: var(--ink-2);
  }
  .cl-filter-tag-x {
    background: var(--border); border: none; color: var(--ink-3);
    cursor: pointer; width: 17px; height: 17px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; line-height: 1;
    transition: background .12s, color .12s;
  }
  .cl-filter-tag-x:hover { background: var(--ink); color: white; }

  /* ══ BODY ══ */
  .cl-body {
    max-width: 1200px; margin: 0 auto;
    padding: 36px 40px 88px;
  }

  .cl-results-bar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px; flex-wrap: wrap; gap: 10px;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--border);
  }
  .cl-results-count {
    font-size: 13px; font-weight: 400; color: var(--ink-4);
  }
  .cl-results-count strong { color: var(--ink-2); font-weight: 600; }

  /* ══ GRID ══ */
  .cl-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }

  /* ══ COURSE CARD ══ */
  .cl-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    overflow: hidden; cursor: pointer;
    display: flex; flex-direction: column;
    transition: border-color .2s, transform .2s, box-shadow .2s;
  }
  .cl-card:hover {
    border-color: var(--border-2);
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
  }

  .cl-card-img { width: 100%; height: 164px; object-fit: cover; display: block; }
  .cl-card-img-ph {
    width: 100%; height: 164px;
    display: flex; align-items: center; justify-content: center;
    font-size: 44px; background: var(--surface);
    border-bottom: 1px solid var(--border);
  }

  .cl-card-body {
    padding: 18px 20px 20px;
    display: flex; flex-direction: column; flex: 1;
  }

  .cl-card-tags {
    display: flex; align-items: center; gap: 7px; margin-bottom: 11px; flex-wrap: wrap;
  }
  .cl-card-cat {
    font-size: 11px; font-weight: 600; letter-spacing: .05em;
    text-transform: uppercase; padding: 4px 10px; border-radius: 6px;
  }
  .cl-card-lvl {
    font-size: 11px; font-weight: 500; color: var(--ink-4);
    background: var(--surface); border: 1px solid var(--border);
    padding: 4px 10px; border-radius: 6px; text-transform: capitalize;
  }

  .cl-card-title {
    font-family: var(--font-serif);
    font-size: 16px; color: var(--ink); line-height: 1.3;
    margin-bottom: 7px; letter-spacing: -.015em;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .cl-card-desc {
    font-size: 13px; color: var(--ink-4); line-height: 1.6;
    margin-bottom: 13px; flex: 1;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  .cl-card-instructor {
    display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
  }
  .cl-card-avatar {
    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; font-weight: 700; color: white;
  }
  .cl-card-avatar-name { font-size: 12.5px; font-weight: 500; color: var(--ink-3); }

  .cl-card-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 14px; border-top: 1px solid var(--border);
    margin-top: auto; gap: 8px;
  }
  .cl-card-price {
    font-family: var(--font-serif);
    font-size: 22px; color: var(--ink); letter-spacing: -.02em;
  }
  .cl-card-price-old {
    font-size: 12.5px; color: var(--ink-5);
    text-decoration: line-through; margin-left: 6px;
  }
  .cl-card-btn {
    font-family: var(--font-sans);
    font-size: 13px; font-weight: 600; color: white;
    background: var(--accent); border: none;
    border-radius: var(--r); padding: 8px 18px; cursor: pointer;
    letter-spacing: -.01em;
    transition: opacity .14s, transform .12s;
    white-space: nowrap;
  }
  .cl-card-btn:hover { opacity: .88; transform: translateY(-1px); }

  /* ══ EMPTY ══ */
  .cl-empty { text-align: center; padding: 88px 20px; }
  .cl-empty-icon { font-size: 48px; margin-bottom: 14px; opacity: .2; }
  .cl-empty-title {
    font-family: var(--font-serif); font-size: 22px; color: var(--ink);
    margin-bottom: 6px; letter-spacing: -.02em;
  }
  .cl-empty-sub { font-size: 14px; color: var(--ink-4); margin-bottom: 24px; }
  .cl-empty-btn {
    font-family: var(--font-sans); font-size: 13.5px; font-weight: 600;
    color: white; background: var(--accent); border: none;
    border-radius: var(--r); padding: 11px 26px; cursor: pointer;
    transition: opacity .14s;
  }
  .cl-empty-btn:hover { opacity: .88; }

  /* ══ RESPONSIVE ══ */
  @media (max-width: 1024px) { .cl-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px) {
    .cl-grid { grid-template-columns: 1fr; }
    .cl-header-inner { padding: 32px 20px 0; }
    .cl-body { padding: 24px 20px 64px; }
    .cl-filters { flex-wrap: wrap; }
    .cl-search-wrap { max-width: 100%; flex: 1 1 100%; }
  }
`;

/* ── Category palette ── */
const CAT_CONFIG = {
  'Web Development': { ph: '#eef4ff', emoji: '💻', cat: { color: '#1a4dc8', bg: '#eff3ff' }, av: '#1a4dc8' },
  'Design':          { ph: '#f5f0ff', emoji: '🎨', cat: { color: '#6d28d9', bg: '#f4f0fe' }, av: '#6d28d9' },
  'Data Science':    { ph: '#edfdf5', emoji: '📊', cat: { color: '#047857', bg: '#ecfdf5' }, av: '#047857' },
  'Business':        { ph: '#fffbeb', emoji: '💼', cat: { color: '#b45309', bg: '#fffbeb' }, av: '#b45309' },
  'Marketing':       { ph: '#fffbeb', emoji: '📣', cat: { color: '#b45309', bg: '#fffbeb' }, av: '#b45309' },
};
const getC = cat => CAT_CONFIG[cat] || { ph: '#f4f3f0', emoji: '📚', cat: { color: '#1c4ed8', bg: '#eff4ff' }, av: '#1c4ed8' };

function CourseCard({ course, onClick }) {
  const c = getC(course.category);
  const initials = course.instructor?.name
    ? course.instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div className="cl-card" onClick={onClick}>
      {course.thumbnail?.url
        ? <img src={course.thumbnail.url} alt={course.title} className="cl-card-img" />
        : <div className="cl-card-img-ph" style={{ background: c.ph }}>{c.emoji}</div>}

      <div className="cl-card-body">
        <div className="cl-card-tags">
          {course.category && (
            <span className="cl-card-cat" style={{ color: c.cat.color, background: c.cat.bg }}>
              {course.category}
            </span>
          )}
          {course.level && <span className="cl-card-lvl">{course.level}</span>}
        </div>

        <div className="cl-card-title">{course.title}</div>
        {course.shortDescription && <div className="cl-card-desc">{course.shortDescription}</div>}

        {course.instructor?.name && (
          <div className="cl-card-instructor">
            <div className="cl-card-avatar" style={{ background: c.av }}>{initials}</div>
            <span className="cl-card-avatar-name">{course.instructor.name}</span>
          </div>
        )}

        <div className="cl-card-footer">
          <div>
            <span className="cl-card-price">
              ${course.discountPrice > 0 ? course.discountPrice : course.price}
            </span>
            {course.discountPrice > 0 && (
              <span className="cl-card-price-old">${course.price}</span>
            )}
          </div>
          <button className="cl-card-btn" onClick={e => { e.stopPropagation(); onClick(); }}>
            Enroll
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CourseList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, loading } = useSelector(s => s.courses);
  const [search, setSearch]     = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel]       = useState('');
  const [page, setPage]         = useState(1);

  useEffect(() => {
    dispatch(fetchCourses({ search, category, level, page, limit: 12 }));
  }, [dispatch, search, category, level, page]);

  const hasFilters = search || category || level;
  const clearAll = () => { setSearch(''); setCategory(''); setLevel(''); setPage(1); };

  return (
    <>
      <style>{styles}</style>
      <div className="cl-root">

        {/* ── HEADER ── */}
        <div className="cl-header">
          <div className="cl-header-inner">
            <div className="cl-header-top">
              <div>
                <div className="cl-eyebrow">Course Catalog</div>
                <h1 className="cl-title">All courses, <em>one place.</em></h1>
                <p className="cl-subtitle">
                  {pagination?.total
                    ? `${pagination.total} course${pagination.total !== 1 ? 's' : ''} available`
                    : 'Explore our full course catalog'}
                </p>
              </div>
            </div>

            {/* ── FILTER ROW ── */}
            <div className="cl-filters">
              {/* Search */}
              <div className="cl-search-wrap">
                <span className="cl-search-icon">
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                </span>
                <input
                  className="cl-search-input"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search courses…"
                />
              </div>

              {/* Category dropdown */}
              <select
                className="cl-select"
                value={category}
                onChange={e => { setCategory(e.target.value); setPage(1); }}
              >
                <option value="">All Categories</option>
                <option value="Web Development">Web Development</option>
                <option value="Data Science">Data Science</option>
                <option value="Design">Design</option>
                <option value="Business">Business</option>
                <option value="Marketing">Marketing</option>
              </select>

              {/* Level dropdown */}
              <select
                className="cl-select"
                value={level}
                onChange={e => { setLevel(e.target.value); setPage(1); }}
              >
                <option value="">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              {hasFilters && (
                <>
                  <div className="cl-filter-divider" />
                  <button className="cl-clear-btn" onClick={clearAll}>
                    Clear all
                  </button>
                </>
              )}
            </div>

            {/* Active filter tags */}
            {hasFilters && (
              <div className="cl-active-filters">
                {search && (
                  <span className="cl-filter-tag">
                    "{search}"
                    <button className="cl-filter-tag-x" onClick={() => { setSearch(''); setPage(1); }}>×</button>
                  </span>
                )}
                {category && (
                  <span className="cl-filter-tag">
                    {category}
                    <button className="cl-filter-tag-x" onClick={() => { setCategory(''); setPage(1); }}>×</button>
                  </span>
                )}
                {level && (
                  <span className="cl-filter-tag">
                    {level}
                    <button className="cl-filter-tag-x" onClick={() => { setLevel(''); setPage(1); }}>×</button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="cl-body">
          {loading ? (
            <LoadingCenter />
          ) : list.length === 0 ? (
            <div className="cl-empty">
              <div className="cl-empty-icon">🔍</div>
              <div className="cl-empty-title">No courses found</div>
              <div className="cl-empty-sub">
                {hasFilters ? 'Try adjusting your filters.' : 'Check back soon — new courses are on the way.'}
              </div>
              {hasFilters && (
                <button className="cl-empty-btn" onClick={clearAll}>Clear filters</button>
              )}
            </div>
          ) : (
            <>
              <div className="cl-results-bar">
                <span className="cl-results-count">
                  Showing <strong>{list.length}</strong>
                  {pagination?.total ? ` of ${pagination.total}` : ''} courses
                </span>
              </div>

              <div className="cl-grid">
                {list.map(c => (
                  <CourseCard
                    key={c._id}
                    course={c}
                    onClick={() => navigate(`/courses/${c._id}`)}
                  />
                ))}
              </div>

              <div style={{ marginTop: 40 }}>
                <Pagination page={page} totalPages={pagination?.totalPages} onChange={setPage} />
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}