import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../services/api';
import { LoadingCenter, Alert } from '../components/common';

const css = `
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
    --green:      #16a34a;
    --green-lt:   #f0fdf4;
    --green-mid:  #bbf7d0;
    --amber:      #b45309;
    --amber-lt:   #fffbeb;
    --amber-mid:  #fde68a;
    --danger:     #be123c;
    --danger-lt:  #fff1f3;

    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans:  'Instrument Sans', system-ui, sans-serif;

    --r:    8px;
    --r-lg: 14px;
    --r-xl: 20px;

    --shadow-sm: 0 2px 8px rgba(17,17,16,0.07);
    --shadow-md: 0 8px 24px rgba(17,17,16,0.09);
    --shadow-lg: 0 20px 48px rgba(17,17,16,0.11);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .cd {
    font-family: var(--font-sans);
    color: var(--ink);
    min-height: 100vh;
    background: var(--white);
    -webkit-font-smoothing: antialiased;
  }

  /* ══ HERO ══ */
  .cd-hero {
    background: var(--ink);
    border-bottom: 1px solid #1e1e1c;
  }
  .cd-hero-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 0 40px;
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 0; align-items: end;
  }

  .cd-hero-content { padding: 40px 48px 40px 0; }

  .cd-nav {
    display: flex; align-items: center; gap: 6px;
    font-size: 12.5px; font-weight: 500; color: #6b6b68;
    margin-bottom: 20px; flex-wrap: wrap;
  }
  .cd-nav-btn {
    color: #a09d95; text-decoration: none; cursor: pointer;
    background: none; border: none; font: inherit; padding: 0;
    transition: color .14s; display: flex; align-items: center; gap: 5px;
  }
  .cd-nav-btn:hover { color: #d4d1cb; }
  .cd-nav-sep { color: #3a3a38; }
  .cd-nav-current { color: #6b6b68; }

  .cd-hero-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
  .cd-tag {
    font-size: 11px; font-weight: 600; letter-spacing: .06em;
    padding: 4px 10px; border-radius: 6px; text-transform: uppercase;
  }
  .cd-tag-bestseller { background: #fef3c7; color: #92400e; }
  .cd-tag-new       { background: #dcfce7; color: #15803d; }
  .cd-tag-admin     { background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe; }

  .cd-hero-title {
    font-family: var(--font-serif);
    font-size: clamp(26px, 3.2vw, 42px);
    color: #f5f4f0; line-height: 1.08;
    letter-spacing: -.025em; margin-bottom: 14px;
  }
  .cd-hero-sub {
    font-size: 15px; font-weight: 400; color: #a09d95;
    line-height: 1.75; margin-bottom: 24px; max-width: 560px;
  }

  .cd-hero-meta {
    display: flex; flex-wrap: wrap; align-items: center; gap: 18px;
    font-size: 13px; color: #6b6b68;
  }
  .cd-hero-meta-item { display: flex; align-items: center; gap: 6px; }
  .cd-hero-meta strong { color: #c9c6c0; font-weight: 600; }

  .cd-stars { display: flex; align-items: center; gap: 3px; }
  .cd-star { color: #f59e0b; font-size: 12px; }
  .cd-rating-num { color: #f59e0b; font-weight: 600; font-size: 13px; margin-left: 4px; }

  .cd-hero-thumb-col {
    display: flex; align-items: flex-end; justify-content: center;
    border-left: 1px solid #1e1e1c;
  }
  .cd-hero-thumb {
    width: 100%; aspect-ratio: 16/10;
    border-radius: var(--r-lg) var(--r-lg) 0 0;
    overflow: hidden; background: #1a1a18;
    position: relative;
  }
  .cd-hero-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cd-hero-thumb-ph {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 60px; background: #1a1a18;
  }
  .cd-play-btn {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 50px; height: 50px; border-radius: 50%;
    background: rgba(255,255,255,0.9); border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--ink); box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    transition: transform .2s, background .2s;
  }
  .cd-play-btn:hover { transform: translate(-50%,-50%) scale(1.07); background: #fff; }

  /* ══ BODY ══ */
  .cd-body {
    max-width: 1200px; margin: 0 auto;
    padding: 36px 40px 88px;
    display: grid;
    grid-template-columns: 1fr 360px;
    gap: 36px; align-items: start;
  }

  .cd-section { margin-bottom: 36px; }
  .cd-section-title {
    font-family: var(--font-serif);
    font-size: 22px; color: var(--ink);
    letter-spacing: -.02em; line-height: 1.1;
    margin-bottom: 18px; padding-bottom: 14px;
    border-bottom: 1px solid var(--border);
  }
  .cd-desc-text {
    font-size: 14.5px; color: var(--ink-3); line-height: 1.8; font-weight: 400;
  }

  .cd-learn-box {
    border: 1px solid var(--border); border-radius: var(--r-lg);
    padding: 24px 26px; background: var(--surface);
  }
  .cd-learn-box-title {
    font-family: var(--font-serif);
    font-size: 19px; color: var(--ink);
    letter-spacing: -.02em; margin-bottom: 18px;
  }
  .cd-learn-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px 28px;
  }
  .cd-learn-item {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13.5px; color: var(--ink-3); line-height: 1.5;
  }
  .cd-learn-check {
    flex-shrink: 0; margin-top: 1px;
    color: var(--green); font-size: 13px; font-weight: 600;
  }

  .cd-curriculum {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-lg);
    overflow: hidden;
  }
  .cd-curriculum-head {
    padding: 14px 20px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .cd-curriculum-head-title { font-size: 13.5px; font-weight: 600; color: var(--ink); }
  .cd-curriculum-head-meta  { font-size: 12.5px; color: var(--ink-4); font-weight: 500; }

  .cd-lesson {
    display: flex; align-items: center; gap: 13px;
    padding: 13px 20px; border-bottom: 1px solid var(--border);
    transition: background .12s;
  }
  .cd-lesson:last-child { border-bottom: none; }
  .cd-lesson:hover { background: var(--surface); }

  .cd-lesson-num {
    width: 24px; height: 24px; border-radius: 50%;
    background: var(--surface-2); border: 1.5px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 600; color: var(--ink-4); flex-shrink: 0;
  }
  .cd-lesson-num-done {
    background: var(--green-lt); border-color: var(--green-mid); color: var(--green);
  }

  .cd-lesson-lock {
    width: 28px; height: 28px; border-radius: var(--r);
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; flex-shrink: 0; color: var(--ink-5);
    background: var(--surface);
  }
  .cd-lesson-lock-free  { color: var(--accent); background: var(--accent-lt); }
  .cd-lesson-lock-admin { color: #6d28d9; background: #ede9fe; }

  .cd-lesson-info { flex: 1; min-width: 0; }
  .cd-lesson-title {
    font-size: 13.5px; font-weight: 500; color: var(--ink);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.4;
  }
  .cd-lesson-sub { font-size: 11.5px; color: var(--ink-5); margin-top: 2px; }

  .cd-lesson-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .cd-preview-badge {
    font-size: 10.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
    padding: 2px 8px; border-radius: 6px;
    background: var(--accent-lt); color: var(--accent); border: 1px solid var(--accent-mid);
  }
  .cd-lesson-dur { font-size: 12px; color: var(--ink-5); font-weight: 500; }

  .cd-progress-bar-wrap {
    height: 2px; background: var(--border); border-radius: 2px; margin-top: 5px;
  }
  .cd-progress-bar { height: 100%; background: var(--green); border-radius: 2px; }

  /* ── Right: purchase card ── */
  .cd-body-right { position: sticky; top: 24px; }

  .cd-price-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }

  .cd-card-thumb {
    display: none; width: 100%; aspect-ratio: 16/9;
    overflow: hidden; background: var(--ink);
  }
  .cd-card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cd-card-thumb-ph {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 44px; background: #1a1a18;
  }

  .cd-card-body { padding: 22px 22px 24px; }

  .cd-card-price-row {
    display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 18px;
  }
  .cd-card-price {
    font-family: var(--font-serif);
    font-size: 32px; color: var(--ink); letter-spacing: -.03em; line-height: 1;
  }
  .cd-card-price-orig {
    font-size: 15px; color: var(--ink-5); text-decoration: line-through;
  }
  .cd-discount-badge {
    font-size: 11.5px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
    padding: 3px 9px; border-radius: 6px;
    background: var(--green-lt); color: var(--green); border: 1px solid var(--green-mid);
  }

  .cd-timer {
    display: flex; align-items: center; gap: 7px;
    font-size: 12.5px; font-weight: 500; color: var(--amber);
    background: var(--amber-lt); border: 1px solid var(--amber-mid);
    border-radius: var(--r); padding: 9px 13px; margin-bottom: 16px;
  }

  /* Admin access banner inside card */
  .cd-admin-access {
    display: flex; align-items: center; gap: 10px;
    background: #f5f3ff; border: 1px solid #ddd6fe;
    border-radius: var(--r); padding: 11px 14px;
    margin-bottom: 14px;
    font-size: 12.5px; color: #6d28d9; font-weight: 500;
  }
  .cd-admin-access svg { flex-shrink: 0; }

  .cd-btn-enroll {
    width: 100%; padding: 14px 20px; border-radius: var(--r); border: none;
    background: var(--accent); color: white; cursor: pointer;
    font-family: var(--font-sans); font-size: 15px; font-weight: 600;
    letter-spacing: -.01em;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .16s, transform .12s;
    margin-bottom: 10px;
  }
  .cd-btn-enroll:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
  .cd-btn-enroll:disabled { opacity: .55; cursor: not-allowed; transform: none; }

  .cd-btn-continue {
    width: 100%; padding: 14px 20px; border-radius: var(--r); border: none;
    background: var(--green); color: white; cursor: pointer;
    font-family: var(--font-sans); font-size: 15px; font-weight: 600;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .16s, transform .12s;
    margin-bottom: 10px;
  }
  .cd-btn-continue:hover { opacity: .88; transform: translateY(-1px); }

  .cd-btn-admin {
    width: 100%; padding: 14px 20px; border-radius: var(--r); border: none;
    background: #7c3aed; color: white; cursor: pointer;
    font-family: var(--font-sans); font-size: 15px; font-weight: 600;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: opacity .16s, transform .12s;
    margin-bottom: 10px;
  }
  .cd-btn-admin:hover { opacity: .88; transform: translateY(-1px); }

  .cd-btn-wishlist {
    width: 100%; padding: 12px 20px; border-radius: var(--r);
    border: 1.5px solid var(--border); background: transparent; color: var(--ink-3);
    font-family: var(--font-sans); font-size: 14px; font-weight: 500; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    transition: border-color .14s, color .14s, background .14s;
    margin-bottom: 18px;
  }
  .cd-btn-wishlist:hover { border-color: var(--border-2); color: var(--ink); background: var(--surface); }

  .cd-card-divider { border: none; border-top: 1px solid var(--border); margin: 18px 0; }

  .cd-includes-title {
    font-size: 11px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase;
    color: var(--ink-4); margin-bottom: 13px;
  }
  .cd-includes-list { display: flex; flex-direction: column; gap: 9px; }
  .cd-include-item {
    display: flex; align-items: center; gap: 10px;
    font-size: 13px; color: var(--ink-3);
  }
  .cd-include-check { color: var(--green); font-size: 13px; font-weight: 600; flex-shrink: 0; }

  .cd-alert {
    max-width: 1200px; margin: 0 auto;
    padding: 12px 40px;
    font-size: 13.5px; color: var(--danger);
    background: var(--danger-lt); border-bottom: 1px solid #fecdd3;
    display: flex; align-items: center; gap: 9px;
  }

  .cd-mobile-thumb {
    display: none; width: 100%; aspect-ratio: 16/9;
    border-radius: var(--r-lg); overflow: hidden; margin-bottom: 24px;
    background: var(--ink); box-shadow: var(--shadow-md);
  }
  .cd-mobile-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cd-mobile-thumb-ph {
    width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    font-size: 52px; background: #1a1a18;
  }

  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin   { to { transform: rotate(360deg); } }
  .cd-anim-1 { animation: fadeUp .4s ease both; }
  .cd-anim-2 { animation: fadeUp .4s .06s ease both; }
  .cd-anim-3 { animation: fadeUp .4s .12s ease both; }
  .cd-anim-4 { animation: fadeUp .4s .18s ease both; }

  @media (max-width: 900px) {
    .cd-hero-inner { grid-template-columns: 1fr; padding: 0 20px; }
    .cd-hero-thumb-col { display: none; }
    .cd-hero-content { padding: 36px 0 32px; }
    .cd-body { grid-template-columns: 1fr; padding: 20px 20px 60px; }
    .cd-body-right { order: -1; }
    .cd-card-thumb { display: block; }
    .cd-mobile-thumb { display: block; }
  }
  @media (max-width: 600px) {
    .cd-learn-grid { grid-template-columns: 1fr; }
    .cd-alert { padding: 12px 20px; }
  }
`;

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector(s => s.auth);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');

  // ── Admin / instructor bypass ──────────────────────────────────────
  const isAdmin = user?.role === 'admin' || user?.role === 'instructor';
  // ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    api.get(`/courses/${id}`)
      .then(r => setCourse(r.data.course))
      .catch(() => setError('Course not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBuy = async () => {
    if (!user) { navigate('/login'); return; }
    setBuying(true);
    try {
      const res = await api.post('/orders/checkout', { courseId: id });
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
      setBuying(false);
    }
  };

  const handleStartLearning = () => {
    const first = course.lessons?.[0];
    if (first) navigate(`/learn/${id}/lesson/${first._id}`);
  };

  if (loading) return <LoadingCenter />;
  if (!course) return (
    <div className="cd"><style>{css}</style>
      <div style={{ padding: 32 }}><Alert type="error">Course not found.</Alert></div>
    </div>
  );

  const price = course.discountPrice > 0 ? course.discountPrice : course.price;
  const savePct = course.discountPrice > 0
    ? Math.round((1 - course.discountPrice / course.price) * 100) : null;
  const totalHours = Math.round((course.totalDuration || 0) / 60);

  return (
    <div className="cd">
      <style>{css}</style>

      {error && (
        <div className="cd-alert">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
          </svg>
          {error}
        </div>
      )}

      {/* ══ HERO ══ */}
      <div className="cd-hero">
        <div className="cd-hero-inner">
          <div className="cd-hero-content cd-anim-1">

            <nav className="cd-nav">
              <button className="cd-nav-btn" onClick={() => navigate(-1)}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
                Courses
              </button>
              {course.category && (
                <>
                  <span className="cd-nav-sep">›</span>
                  <span className="cd-nav-current">{course.category}</span>
                </>
              )}
              <span className="cd-nav-sep">›</span>
              <span className="cd-nav-current" style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {course.title}
              </span>
            </nav>

            {(course.isBestseller || course.isNew || isAdmin) && (
              <div className="cd-hero-tags">
                {course.isBestseller && <span className="cd-tag cd-tag-bestseller">Bestseller</span>}
                {course.isNew        && <span className="cd-tag cd-tag-new">New</span>}
                {isAdmin             && <span className="cd-tag cd-tag-admin">Admin Access</span>}
              </div>
            )}

            <h1 className="cd-hero-title">{course.title}</h1>
            <p className="cd-hero-sub">{course.shortDescription || course.description?.slice(0, 160)}</p>

            <div className="cd-hero-meta">
              <div className="cd-hero-meta-item cd-stars">
                {[1,2,3,4,5].map(s => <span key={s} className="cd-star">★</span>)}
                <span className="cd-rating-num">4.8</span>
              </div>
              {course.instructor?.name && (
                <div className="cd-hero-meta-item">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  <strong>{course.instructor.name}</strong>
                </div>
              )}
              {course.totalLessons > 0 && (
                <div className="cd-hero-meta-item">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  <strong>{course.totalLessons}</strong> lessons
                </div>
              )}
              {totalHours > 0 && (
                <div className="cd-hero-meta-item">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                  <strong>{totalHours}h</strong> total
                </div>
              )}
              {course.level && (
                <div className="cd-hero-meta-item">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M18 20V10M12 20V4M6 20v-6"/>
                  </svg>
                  <strong>{course.level}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="cd-hero-thumb-col cd-anim-2">
            <div className="cd-hero-thumb">
              {course.thumbnail?.url
                ? <img src={course.thumbnail.url} alt={course.title} />
                : <div className="cd-hero-thumb-ph">📚</div>}
              <button className="cd-play-btn" aria-label="Preview">
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY ══ */}
      <div className="cd-body">

        {/* ── Left column ── */}
        <div>
          <div className="cd-mobile-thumb cd-anim-3">
            {course.thumbnail?.url
              ? <img src={course.thumbnail.url} alt={course.title} />
              : <div className="cd-mobile-thumb-ph">📚</div>}
          </div>

          {course.whatYouWillLearn?.length > 0 && (
            <div className="cd-section cd-anim-3">
              <div className="cd-learn-box">
                <div className="cd-learn-box-title">What you'll learn</div>
                <div className="cd-learn-grid">
                  {course.whatYouWillLearn.map((item, i) => (
                    <div key={i} className="cd-learn-item">
                      <span className="cd-learn-check">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="cd-section cd-anim-4">
            <div className="cd-section-title">Course description</div>
            <p className="cd-desc-text">{course.description}</p>
          </div>

          {course.lessons?.length > 0 && (
            <div className="cd-section cd-anim-4">
              <div className="cd-section-title">Course content</div>
              <div className="cd-curriculum">
                <div className="cd-curriculum-head">
                  <span className="cd-curriculum-head-title">{course.lessons.length} lessons</span>
                  {totalHours > 0 && <span className="cd-curriculum-head-meta">{totalHours}h total</span>}
                </div>
                {course.lessons.map((lesson, i) => {
                  const mins = Math.round((lesson.video?.duration || 0) / 60);
                  // Admin sees all lessons as unlocked
                  const lockCls = isAdmin
                    ? 'cd-lesson-lock-admin'
                    : lesson.isFreePreview ? 'cd-lesson-lock-free' : '';
                  return (
                    <div key={lesson._id} className="cd-lesson">
                      <div className={`cd-lesson-num ${lesson.completed ? 'cd-lesson-num-done' : ''}`}>
                        {lesson.completed ? '✓' : i + 1}
                      </div>

                      <div className={`cd-lesson-lock ${lockCls}`}>
                        {isAdmin ? (
                          // Shield-check icon for admin
                          <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4zm-1 13l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z"/>
                          </svg>
                        ) : lesson.isFreePreview ? (
                          <svg width="11" height="11" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        ) : (
                          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        )}
                      </div>

                      <div className="cd-lesson-info">
                        <div className="cd-lesson-title">{lesson.title}</div>
                        {lesson.completed && (
                          <div className="cd-progress-bar-wrap">
                            <div className="cd-progress-bar" style={{ width: '100%' }} />
                          </div>
                        )}
                      </div>

                      <div className="cd-lesson-right">
                        {lesson.isFreePreview && !isAdmin && <span className="cd-preview-badge">Preview</span>}
                        {isAdmin && <span className="cd-preview-badge" style={{ background: '#ede9fe', color: '#6d28d9', borderColor: '#ddd6fe' }}>Admin</span>}
                        {mins > 0 && <span className="cd-lesson-dur">{mins}m</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: purchase card ── */}
        <div className="cd-body-right cd-anim-2">
          <div className="cd-price-card">
            <div className="cd-card-thumb">
              {course.thumbnail?.url
                ? <img src={course.thumbnail.url} alt={course.title} />
                : <div className="cd-card-thumb-ph">📚</div>}
            </div>

            <div className="cd-card-body">

              {/* ── ADMIN: skip price, show access banner + direct button ── */}
              {isAdmin ? (
                <>
                  <div className="cd-admin-access">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4zm-1 13l-3-3 1.41-1.41L11 12.17l4.59-4.58L17 9l-6 6z"/>
                    </svg>
                    Admin access — no payment required
                  </div>
                  <button className="cd-btn-admin" onClick={handleStartLearning}>
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    Go to course
                  </button>
                </>
              ) : (
                /* ── STUDENT: normal price + enroll flow ── */
                <>
                  <div className="cd-card-price-row">
                    <span className="cd-card-price">${price}</span>
                    {course.discountPrice > 0 && (
                      <>
                        <span className="cd-card-price-orig">${course.price}</span>
                        <span className="cd-discount-badge">{savePct}% off</span>
                      </>
                    )}
                  </div>

                  {course.discountPrice > 0 && (
                    <div className="cd-timer">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                      </svg>
                      <span><strong>2 days</strong> left at this price</span>
                    </div>
                  )}

                  {course.isEnrolled ? (
                    <button className="cd-btn-continue" onClick={handleStartLearning}>
                      <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      Go to course
                    </button>
                  ) : (
                    <>
                      <button className="cd-btn-enroll" onClick={handleBuy} disabled={buying}>
                        {buying ? (
                          <>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                              style={{ animation: 'spin .8s linear infinite' }}>
                              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                            </svg>
                            Processing…
                          </>
                        ) : 'Enroll now'}
                      </button>
                      <button className="cd-btn-wishlist">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                        Add to wishlist
                      </button>
                    </>
                  )}
                </>
              )}

              <hr className="cd-card-divider" />

              <div className="cd-includes-title">This course includes</div>
              <div className="cd-includes-list">
                {[
                  `${totalHours > 0 ? totalHours + 'h' : course.totalLessons + ' lessons'} of on-demand video`,
                  'Downloadable resources',
                  'Access on mobile & desktop',
                  'Certificate of completion',
                  'Full lifetime access',
                ].map(label => (
                  <div key={label} className="cd-include-item">
                    <span className="cd-include-check">✓</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}