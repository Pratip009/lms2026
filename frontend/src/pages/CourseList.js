import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCourses } from '../redux/slices/courseSlice';
import { LoadingCenter, Pagination } from '../components/common';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&display=swap');

  :root {
    /* Blues */
    --b50:  #e8f0fe;
    --b100: #c5d8fc;
    --b200: #93b8fa;
    --b300: #5c94f5;
    --b400: #4285f4;
    --b500: #1a6bf0;
    --b600: #1558d0;
    --b800: #0a3580;
    --b900: #061e54;
    --hero-bg: #050f2b;

    /* Light surfaces */
    --white:     #ffffff;
    --surface:   #f8f8f6;
    --surface-2: #f2f1ee;
    --border:    #e5e3de;
    --border-2:  #d6d3cc;
    --ink:       #111110;
    --ink-2:     #3d3c39;
    --ink-3:     #6e6b64;
    --ink-4:     #a09d95;
    --ink-5:     #ccc9c1;

    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;

    --r:    8px;
    --r-lg: 14px;
    --r-xl: 20px;
    --shadow-sm: 0 2px 8px rgba(17,17,16,0.07);
    --shadow-md: 0 8px 24px rgba(17,17,16,0.09);
    --shadow-lg: 0 20px 48px rgba(17,17,16,0.11);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cl-root {
    font-family: var(--font-body);
    background: var(--white);
    color: var(--ink);
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  /* ════════════════════════════════
     KEYFRAMES
  ════════════════════════════════ */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes gradShift {
    0%,100% { background-position: 0%   50%; }
    50%      { background-position: 100% 50%; }
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes shimmerSlide {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(250%);  }
  }
  @keyframes blink {
    0%,100% { opacity: 1;  }
    50%      { opacity: .3; }
  }

  /* ════════════════════════════════
     HEADER  — dark blue banner
  ════════════════════════════════ */
  .cl-header {
    background: var(--hero-bg);
    position: relative;
    overflow: hidden;
  }
  /* subtle dot-grid */
  .cl-header::before {
    content: '';
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(66,133,244,.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(66,133,244,.05) 1px, transparent 1px);
    background-size: 52px 52px;
    pointer-events: none;
  }
  /* radial glow */
  .cl-header::after {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 60% 80% at 0% 50%,   rgba(66,133,244,.16) 0%, transparent 55%),
      radial-gradient(ellipse 40% 60% at 100% 50%,  rgba(21, 88,208,.12) 0%, transparent 50%);
    pointer-events: none;
  }

  .cl-header-inner {
    position: relative; z-index: 2;
    max-width: 1280px; margin: 0 auto;
    padding: 56px 64px 0;
  }

  .cl-header-top {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 24px; flex-wrap: wrap;
    margin-bottom: 36px;
    animation: fadeIn .5s ease both;
  }

  .cl-eyebrow {
    font-family: var(--font-display);
    font-size: 11px; font-weight: 600; letter-spacing: .14em;
    text-transform: uppercase; color: var(--b300); margin-bottom: 10px;
  }

  .cl-title {
    font-family: var(--font-display);
    font-size: clamp(32px, 4vw, 52px);
    font-weight: 800; letter-spacing: -.035em; line-height: .95;
    color: var(--white);
  }
  .cl-title-grad {
    display: block;
    background: linear-gradient(100deg, var(--b100) 0%, var(--b300) 50%, var(--b200) 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradShift 5s ease-in-out infinite;
  }

  .cl-subtitle {
    font-size: 14px; font-weight: 300; color: rgba(255,255,255,.38);
    margin-top: 12px; font-family: var(--font-body); font-style: italic;
  }

  /* Total count pill */
  .cl-count-pill {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(66,133,244,.12);
    border: 1px solid rgba(66,133,244,.22);
    border-radius: 100px; padding: 8px 16px;
    font-family: var(--font-display);
    font-size: 13px; font-weight: 600; color: var(--b200);
    white-space: nowrap;
  }
  .cl-count-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--b400);
    animation: blink 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  /* ════════════════════════════════
     FILTER BAR  — inside dark header
  ════════════════════════════════ */
  .cl-filters-wrap {
    padding-bottom: 0;
    animation: fadeIn .5s ease both .1s;
  }

  .cl-filter-row {
    display: flex; align-items: center; gap: 8px;
    flex-wrap: nowrap; padding-bottom: 24px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .cl-filter-row::-webkit-scrollbar { display: none; }

  /* Search */
  .cl-search-wrap {
    position: relative;
    flex: 1; min-width: 180px; max-width: 280px;
  }
  .cl-search-icon {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    pointer-events: none; color: rgba(255,255,255,.3);
    display: flex; align-items: center;
  }
  .cl-search-input {
    width: 100%;
    padding: 10px 14px 10px 38px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(66,133,244,.2);
    border-radius: var(--r);
    color: var(--white);
    font-family: var(--font-body);
    font-size: 13.5px; font-weight: 400;
    outline: none;
    transition: border-color .15s, background .15s, box-shadow .15s;
  }
  .cl-search-input::placeholder { color: rgba(255,255,255,.25); }
  .cl-search-input:focus {
    border-color: var(--b400);
    background: rgba(66,133,244,.08);
    box-shadow: 0 0 0 3px rgba(66,133,244,.15);
  }

  /* Selects */
  .cl-select {
    flex-shrink: 0;
    padding: 10px 34px 10px 14px;
    background: rgba(255,255,255,.06);
    border: 1px solid rgba(66,133,244,.2);
    border-radius: var(--r);
    color: rgba(255,255,255,.6);
    font-family: var(--font-body);
    font-size: 13.5px; font-weight: 400;
    outline: none; cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg width='11' height='11' fill='none' stroke='%234285f4' stroke-width='2' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-color: rgba(255,255,255,.06);
    transition: border-color .15s, color .15s, background-color .15s;
    white-space: nowrap;
  }
  .cl-select:focus {
    border-color: var(--b400);
    color: var(--white);
    background-color: rgba(66,133,244,.1);
    box-shadow: 0 0 0 3px rgba(66,133,244,.15);
  }
  .cl-select option { background: #0d1e45; color: var(--white); }

  .cl-filter-divider {
    width: 1px; height: 26px;
    background: rgba(66,133,244,.18);
    flex-shrink: 0;
  }

  .cl-clear-btn {
    flex-shrink: 0;
    font-family: var(--font-display);
    font-size: 12.5px; font-weight: 600;
    color: var(--b200);
    background: rgba(66,133,244,.12);
    border: 1px solid rgba(66,133,244,.25);
    border-radius: var(--r); padding: 10px 16px;
    cursor: pointer; white-space: nowrap;
    transition: background .15s, border-color .15s;
  }
  .cl-clear-btn:hover { background: rgba(66,133,244,.22); border-color: rgba(66,133,244,.4); }

  /* Active filter tags — light pills at bottom of dark header */
  .cl-active-filters {
    display: flex; align-items: center; gap: 7px;
    flex-wrap: wrap;
    padding: 0 0 20px;
  }
  .cl-filter-tag {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 5px 8px 5px 12px;
    background: rgba(66,133,244,.15);
    border: 1px solid rgba(66,133,244,.28);
    border-radius: 100px;
    font-size: 12px; font-weight: 600;
    font-family: var(--font-display);
    color: var(--b200);
  }
  .cl-filter-tag-x {
    background: rgba(66,133,244,.2); border: none;
    color: var(--b200); cursor: pointer;
    width: 18px; height: 18px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; line-height: 1;
    transition: background .12s, color .12s;
  }
  .cl-filter-tag-x:hover { background: var(--b400); color: white; }

  /* Header bottom border fade into white body */
  .cl-header-fade {
    height: 32px;
    background: linear-gradient(to bottom, var(--hero-bg), var(--white));
  }

  /* ════════════════════════════════
     BODY
  ════════════════════════════════ */
  .cl-body {
    max-width: 1280px; margin: 0 auto;
    padding: 32px 64px 96px;
  }

  .cl-results-bar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 28px; flex-wrap: wrap; gap: 10px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }
  .cl-results-count {
    font-size: 13px; font-weight: 400; color: var(--ink-4);
    font-family: var(--font-body);
  }
  .cl-results-count strong { color: var(--ink-2); font-weight: 600; }

  /* ════════════════════════════════
     GRID
  ════════════════════════════════ */
  .cl-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }

  /* ════════════════════════════════
     COURSE CARD  — fully light theme
  ════════════════════════════════ */
  .cl-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    overflow: hidden; cursor: pointer;
    display: flex; flex-direction: column;
    transition: border-color .2s, transform .22s, box-shadow .22s;
    animation: cardIn .4s ease both;
  }
  .cl-card:hover {
    border-color: #c5d8fc;
    transform: translateY(-5px);
    box-shadow: 0 20px 48px rgba(66,133,244,.12), 0 4px 12px rgba(17,17,16,.06);
  }

  /* Image area */
  .cl-card-img-wrap { position: relative; overflow: hidden; }
  .cl-card-img {
    width: 100%; height: 172px;
    object-fit: cover; display: block;
    transition: transform .5s ease;
  }
  .cl-card:hover .cl-card-img { transform: scale(1.04); }
  .cl-card-img-ph {
    width: 100%; height: 172px;
    display: flex; align-items: center; justify-content: center;
    font-size: 44px;
    border-bottom: 1px solid var(--border);
  }

  /* Enroll overlay on hover */
  .cl-card-img-overlay {
    position: absolute; inset: 0;
    background: rgba(5,15,43,.52);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity .22s;
  }
  .cl-card:hover .cl-card-img-overlay { opacity: 1; }
  .cl-card-img-overlay-btn {
    font-family: var(--font-display);
    font-size: 13px; font-weight: 700;
    background: var(--b400); color: white;
    border: none; border-radius: 10px;
    padding: 11px 26px; cursor: pointer;
    letter-spacing: .06em; text-transform: uppercase;
    transform: translateY(6px);
    transition: transform .22s, background .2s;
    position: relative; overflow: hidden;
  }
  .cl-card:hover .cl-card-img-overlay-btn { transform: translateY(0); }
  .cl-card-img-overlay-btn::after {
    content: '';
    position: absolute; top: 0; left: 0;
    width: 35%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.18), transparent);
    animation: shimmerSlide 2.5s ease-in-out infinite;
  }
  .cl-card-img-overlay-btn:hover { background: var(--b500); }

  .cl-card-body {
    padding: 18px 20px 20px;
    display: flex; flex-direction: column; flex: 1;
  }

  .cl-card-tags {
    display: flex; align-items: center; gap: 7px;
    margin-bottom: 11px; flex-wrap: wrap;
  }
  .cl-card-cat {
    font-family: var(--font-display);
    font-size: 10.5px; font-weight: 700; letter-spacing: .07em;
    text-transform: uppercase; padding: 4px 10px; border-radius: 6px;
  }
  .cl-card-lvl {
    font-size: 11px; font-weight: 500; color: var(--ink-4);
    background: var(--surface); border: 1px solid var(--border);
    padding: 4px 10px; border-radius: 6px; text-transform: capitalize;
    font-family: var(--font-body);
  }

  .cl-card-title {
    font-family: var(--font-display);
    font-size: 16px; font-weight: 700; color: var(--ink); line-height: 1.28;
    margin-bottom: 7px; letter-spacing: -.02em;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }
  .cl-card-desc {
    font-size: 13px; color: var(--ink-4); line-height: 1.65;
    margin-bottom: 13px; flex: 1;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  .cl-card-instructor {
    display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
  }
  .cl-card-avatar {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-family: var(--font-display);
    font-size: 9px; font-weight: 700; color: white;
  }
  .cl-card-avatar-img {
    width: 26px; height: 26px; border-radius: 50%;
    object-fit: cover; flex-shrink: 0;
  }
  .cl-card-avatar-name {
    font-size: 12.5px; font-weight: 500; color: var(--ink-3);
    font-family: var(--font-body);
  }

  .cl-card-footer {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 14px; border-top: 1px solid var(--border);
    margin-top: auto; gap: 8px;
  }
  .cl-card-price {
    font-family: var(--font-display);
    font-size: 22px; font-weight: 800; color: var(--ink); letter-spacing: -.02em;
  }
  .cl-card-price-old {
    font-size: 12.5px; color: var(--ink-5);
    text-decoration: line-through; margin-left: 6px;
    font-family: var(--font-body);
  }
  .cl-card-btn {
    font-family: var(--font-display);
    font-size: 12.5px; font-weight: 700; color: white;
    background: var(--b500); border: none;
    border-radius: var(--r); padding: 8px 18px; cursor: pointer;
    letter-spacing: .02em; text-transform: uppercase;
    transition: background .16s, transform .12s, box-shadow .18s;
    white-space: nowrap;
  }
  .cl-card-btn:hover {
    background: var(--b600);
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(26,107,240,.3);
  }

  /* ════════════════════════════════
     EMPTY STATE
  ════════════════════════════════ */
  .cl-empty {
    text-align: center; padding: 96px 20px;
    animation: fadeIn .4s ease both;
  }
  .cl-empty-icon {
    width: 72px; height: 72px; border-radius: 20px;
    background: var(--b50); border: 1px solid var(--b100);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px;
  }
  .cl-empty-icon svg { width: 30px; height: 30px; }
  .cl-empty-title {
    font-family: var(--font-display); font-size: 24px; font-weight: 800;
    color: var(--ink); margin-bottom: 8px; letter-spacing: -.025em;
  }
  .cl-empty-sub {
    font-size: 14px; color: var(--ink-4); margin-bottom: 28px;
    font-family: var(--font-body); line-height: 1.6;
  }
  .cl-empty-btn {
    font-family: var(--font-display); font-size: 13px; font-weight: 700;
    color: white; background: var(--b500); border: none;
    border-radius: var(--r); padding: 12px 28px; cursor: pointer;
    letter-spacing: .04em; text-transform: uppercase;
    transition: background .16s, transform .12s;
  }
  .cl-empty-btn:hover { background: var(--b600); transform: translateY(-1px); }

  /* ════════════════════════════════
     RESPONSIVE
  ════════════════════════════════ */
  @media (max-width: 1060px) {
    .cl-grid { grid-template-columns: repeat(2, 1fr); }
    .cl-header-inner, .cl-body { padding-left: 40px; padding-right: 40px; }
  }
  @media (max-width: 680px) {
    .cl-grid { grid-template-columns: 1fr; }
    .cl-header-inner { padding: 36px 20px 0; }
    .cl-body { padding: 24px 20px 64px; }
    .cl-filter-row { flex-wrap: wrap; }
    .cl-search-wrap { max-width: 100%; flex: 1 1 100%; }
    .cl-header-top { flex-direction: column; align-items: flex-start; }
  }
`;

/* ── Category palette ── */
const CAT_CONFIG = {
  'Web Development': { ph: '#eef4ff', emoji: '💻', cat: { color: '#1a4dc8', bg: '#eff3ff' }, av: '#1a4dc8' },
  'Design':          { ph: '#f5f0ff', emoji: '🎨', cat: { color: '#6d28d9', bg: '#f4f0fe' }, av: '#6d28d9' },
  'Data Science':    { ph: '#edfdf5', emoji: '📊', cat: { color: '#047857', bg: '#ecfdf5' }, av: '#047857' },
  'Business':        { ph: '#fffbeb', emoji: '💼', cat: { color: '#b45309', bg: '#fffbeb' }, av: '#b45309' },
  'Marketing':       { ph: '#fffbeb', emoji: '📣', cat: { color: '#b45309', bg: '#fffbeb' }, av: '#b45309' },
  'Photography':     { ph: '#fff1f2', emoji: '📷', cat: { color: '#be123c', bg: '#fff1f3' }, av: '#be123c' },
};
const getC = cat =>
  CAT_CONFIG[cat] || { ph: '#f4f3f0', emoji: '📚', cat: { color: '#1558d0', bg: '#eff4ff' }, av: '#1558d0' };

function CourseCard({ course, onClick, index }) {
  const c = getC(course.category);
  const initials = course.instructor?.name
    ? course.instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  return (
    <div
      className="cl-card"
      onClick={onClick}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Image / placeholder */}
      <div className="cl-card-img-wrap">
        {course.thumbnail?.url ? (
          <img
            src={course.thumbnail.url}
            alt={course.title}
            className="cl-card-img"
          />
        ) : (
          <div className="cl-card-img-ph" style={{ background: c.ph }}>
            {c.emoji}
          </div>
        )}
        {/* Hover overlay with quick-enroll */}
        <div className="cl-card-img-overlay">
          <button
            className="cl-card-img-overlay-btn"
            onClick={e => { e.stopPropagation(); onClick(); }}
          >
            Enroll now
          </button>
        </div>
      </div>

      <div className="cl-card-body">
        {/* Tags */}
        <div className="cl-card-tags">
          {course.category && (
            <span
              className="cl-card-cat"
              style={{ color: c.cat.color, background: c.cat.bg }}
            >
              {course.category}
            </span>
          )}
          {course.level && (
            <span className="cl-card-lvl">{course.level}</span>
          )}
        </div>

        <div className="cl-card-title">{course.title}</div>
        {course.shortDescription && (
          <div className="cl-card-desc">{course.shortDescription}</div>
        )}

        {/* Instructor */}
        {course.instructor?.name && (
          <div className="cl-card-instructor">
            {course.instructor?.avatar ? (
              <img
                src={course.instructor.avatar}
                alt={course.instructor.name}
                className="cl-card-avatar-img"
              />
            ) : (
              <div
                className="cl-card-avatar"
                style={{ background: c.av }}
              >
                {initials}
              </div>
            )}
            <span className="cl-card-avatar-name">{course.instructor.name}</span>
          </div>
        )}

        {/* Footer */}
        <div className="cl-card-footer">
          <div>
            <span className="cl-card-price">
              ${course.discountPrice > 0 ? course.discountPrice : course.price}
            </span>
            {course.discountPrice > 0 && (
              <span className="cl-card-price-old">${course.price}</span>
            )}
          </div>
          <button
            className="cl-card-btn"
            onClick={e => { e.stopPropagation(); onClick(); }}
          >
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

  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const [level,    setLevel]    = useState('');
  const [page,     setPage]     = useState(1);

  useEffect(() => {
    dispatch(fetchCourses({ search, category, level, page, limit: 12 }));
  }, [dispatch, search, category, level, page]);

  const hasFilters = search || category || level;
  const clearAll = () => { setSearch(''); setCategory(''); setLevel(''); setPage(1); };

  return (
    <>
      <style>{styles}</style>
      <div className="cl-root">

        {/* ══════════ HEADER ══════════ */}
        <div className="cl-header">
          <div className="cl-header-inner">

            <div className="cl-header-top">
              <div>
                <div className="cl-eyebrow">Course Catalog</div>
                <h1 className="cl-title">
                  All courses,{' '}
                  <span className="cl-title-grad">one place.</span>
                </h1>
                <p className="cl-subtitle">
                  {pagination?.total
                    ? `${pagination.total} course${pagination.total !== 1 ? 's' : ''} available — find your next skill.`
                    : 'Explore our full course catalog.'}
                </p>
              </div>

              {/* Live count pill */}
              {pagination?.total > 0 && (
                <div className="cl-count-pill">
                  <div className="cl-count-dot" />
                  {pagination.total} courses live
                </div>
              )}
            </div>

            {/* ── FILTER ROW ── */}
            <div className="cl-filters-wrap">
              <div className="cl-filter-row">
                {/* Search */}
                <div className="cl-search-wrap">
                  <span className="cl-search-icon">
                    <svg width="14" height="14" fill="none" stroke="currentColor"
                      strokeWidth="2" viewBox="0 0 24 24">
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

                {/* Category */}
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
                  <option value="Photography">Photography</option>
                </select>

                {/* Level */}
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

              {/* Active filter pills */}
              {hasFilters && (
                <div className="cl-active-filters">
                  {search && (
                    <span className="cl-filter-tag">
                      "{search}"
                      <button
                        className="cl-filter-tag-x"
                        onClick={() => { setSearch(''); setPage(1); }}
                      >×</button>
                    </span>
                  )}
                  {category && (
                    <span className="cl-filter-tag">
                      {category}
                      <button
                        className="cl-filter-tag-x"
                        onClick={() => { setCategory(''); setPage(1); }}
                      >×</button>
                    </span>
                  )}
                  {level && (
                    <span className="cl-filter-tag">
                      {level}
                      <button
                        className="cl-filter-tag-x"
                        onClick={() => { setLevel(''); setPage(1); }}
                      >×</button>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gradient fade dark→white */}
        <div className="cl-header-fade" />

        {/* ══════════ BODY ══════════ */}
        <div className="cl-body">
          {loading ? (
            <LoadingCenter />
          ) : list.length === 0 ? (
            <div className="cl-empty">
              <div className="cl-empty-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="#4285f4" strokeWidth="1.6"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                  <path d="M8 11h6M11 8v6" opacity=".5"/>
                </svg>
              </div>
              <div className="cl-empty-title">No courses found</div>
              <div className="cl-empty-sub">
                {hasFilters
                  ? 'Try adjusting your filters — something might be just around the corner.'
                  : 'New courses are on the way. Check back soon.'}
              </div>
              {hasFilters && (
                <button className="cl-empty-btn" onClick={clearAll}>
                  Clear filters
                </button>
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
                {list.map((c, i) => (
                  <CourseCard
                    key={c._id}
                    course={c}
                    index={i}
                    onClick={() => navigate(`/courses/${c._id}`)}
                  />
                ))}
              </div>

              <div style={{ marginTop: 44 }}>
                <Pagination
                  page={page}
                  totalPages={pagination?.totalPages}
                  onChange={setPage}
                />
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}