import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { fetchMyEnrollments } from '../../redux/slices/enrollmentSlice';
import { LoadingCenter } from '../../components/common';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --b50:#eff6ff; --b100:#dbeafe; --b200:#bfdbfe; --b300:#93c5fd;
    --b400:#60a5fa; --b500:#3b82f6; --b600:#2563eb; --b700:#1d4ed8;
    --b800:#1e40af; --b900:#1e3a8a;
    --hero:#050f2b;
    --ink:#0f172a; --ink-2:#334155; --ink-3:#64748b; --ink-4:#94a3b8; --ink-5:#cbd5e1;
    --surface:#f8fafc; --surface-2:#f1f5f9;
    --border:rgba(15,23,42,0.08); --border-2:rgba(15,23,42,0.14);
    --white:#ffffff;
    --green:#16a34a; --green-lt:#f0fdf4; --green-mid:#bbf7d0;
    --font-display:'Syne',sans-serif; --font-body:'DM Sans',sans-serif;
    --r:10px; --r-lg:16px; --r-xl:22px;
  }

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes shimmer { 0%{left:-100%} 60%{left:150%} 100%{left:150%} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }

  /* ══ Root ══ */
  .mc-root {
    font-family: var(--font-body);
    background: var(--surface);
    color: var(--ink);
    min-height: calc(100vh - 60px);
    padding: 0 40px 80px;
    -webkit-font-smoothing: antialiased;
    position: relative;
    overflow-x: hidden;
  }

  /* Hero band */
  .mc-hero {
    position: absolute; top:0; left:0; right:0; height:280px; z-index:0;
    background: linear-gradient(175deg, #050f2b 0%, #0c1e4a 48%, transparent 100%);
    pointer-events: none;
  }
  .mc-hero::before {
    content:''; position:absolute; inset:0;
    background-image: radial-gradient(circle, rgba(59,130,246,0.18) 1px, transparent 1px);
    background-size: 26px 26px;
    mask-image: linear-gradient(180deg, rgba(0,0,0,.75) 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,.75) 0%, transparent 100%);
  }
  .mc-hero::after {
    content:''; position:absolute; top:-80px; left:50%; transform:translateX(-50%);
    width:700px; height:500px;
    background: radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.2) 0%, transparent 70%);
  }

  /* Body dot grid */
  .mc-body-grid {
    position: fixed; inset:0; z-index:0; pointer-events:none;
    background-image: radial-gradient(circle, rgba(37,99,235,0.04) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  /* ══ Header ══ */
  .mc-header {
    position: relative; z-index:1;
    display: flex; align-items: flex-end; justify-content: space-between;
    padding: 42px 0 32px;
    margin-bottom: 32px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    flex-wrap: wrap; gap:16px;
    animation: fadeUp .55s ease both;
  }

  .mc-kicker {
    display: inline-flex; align-items:center; gap:10px; margin-bottom:14px;
  }
  .mc-kicker-line { width:28px; height:1.5px; background:var(--b400); border-radius:2px; opacity:.8; }
  .mc-kicker-text {
    font-size:11px; font-weight:600; letter-spacing:.18em;
    text-transform:uppercase; color:var(--b300);
  }
  .mc-kicker-dot {
    width:5px; height:5px; border-radius:50%; background:var(--b400);
    animation: blink 2.4s ease-in-out infinite;
    box-shadow:0 0 0 3px rgba(96,165,250,0.25);
  }

  .mc-heading {
    font-family: var(--font-display);
    font-size: clamp(28px,3.5vw,44px);
    font-weight: 800; line-height:1.05; letter-spacing:-.04em;
    color: #fff; margin:0 0 6px;
  }
  .mc-subheading {
    font-size:13px; color:rgba(255,255,255,0.45);
    font-weight:400; margin:0;
  }

  .mc-browse-link {
    display: inline-flex; align-items:center; gap:7px;
    padding:10px 18px; border-radius:var(--r);
    background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.75);
    border:1px solid rgba(255,255,255,0.14);
    text-decoration:none; font-size:13px; font-weight:600;
    font-family:var(--font-display); letter-spacing:.02em;
    transition:all .15s; backdrop-filter:blur(8px); flex-shrink:0;
  }
  .mc-browse-link:hover { background:rgba(255,255,255,0.14); color:#fff; }

  /* ══ Grid ══ */
  .mc-grid {
    position: relative; z-index:1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 18px;
  }

  /* ══ Card ══ */
  .mc-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: var(--r-xl);
    overflow: hidden;
    display: flex; flex-direction:column;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(15,23,42,0.05);
    transition: box-shadow .22s, border-color .2s, transform .2s;
    animation: fadeUp .5s ease both;
    position: relative;
  }
  /* Top accent bar */
  .mc-card::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:3px;
    background: linear-gradient(90deg, var(--b500), var(--b400));
    opacity:0; transition:opacity .2s; z-index:1;
  }
  .mc-card:hover {
    box-shadow: 0 10px 34px rgba(37,99,235,0.13), 0 1px 3px rgba(15,23,42,0.05);
    border-color: rgba(37,99,235,0.2);
    transform: translateY(-4px);
  }
  .mc-card:hover::before { opacity:1; }

  /* Thumbnail */
  .mc-thumb {
    height:158px; overflow:hidden;
    background: var(--surface-2); flex-shrink:0; position:relative;
  }
  .mc-thumb img {
    width:100%; height:100%; object-fit:cover;
    transition:transform .4s ease;
  }
  .mc-card:hover .mc-thumb img { transform:scale(1.04); }

  .mc-thumb-placeholder {
    width:100%; height:100%;
    display:flex; align-items:center; justify-content:center;
    font-size:40px;
    background: linear-gradient(135deg, var(--surface-2) 0%, var(--b50) 100%);
  }

  /* Progress overlay on thumb */
  .mc-thumb-progress {
    position:absolute; bottom:0; left:0; right:0; height:3px;
    background:rgba(255,255,255,0.3);
  }
  .mc-thumb-progress-fill {
    height:100%;
    background: linear-gradient(90deg, var(--b400), var(--b300));
    transition:width .5s ease;
  }
  .mc-thumb-progress-fill.complete {
    background: linear-gradient(90deg, var(--green), #22c55e);
  }

  /* Card body */
  .mc-card-body {
    padding: 20px 20px 20px;
    display:flex; flex-direction:column; flex:1;
  }

  .mc-card-title {
    font-family: var(--font-display);
    font-size:15px; font-weight:700; color:var(--ink);
    margin:0 0 7px; line-height:1.4; letter-spacing:-.02em;
    display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
  }

  .mc-card-meta {
    font-size:12px; color:var(--ink-4); margin-bottom:16px;
    display:flex; align-items:center; gap:8px; font-weight:300;
  }
  .mc-meta-sep { opacity:.35; }
  .mc-meta-icon { font-size:11px; }

  /* Progress */
  .mc-prog-wrap { margin-bottom:18px; }
  .mc-prog-label {
    display:flex; justify-content:space-between;
    font-size:10px; font-weight:700; letter-spacing:.09em; text-transform:uppercase;
    color:var(--ink-4); margin-bottom:7px; font-family:var(--font-display);
  }
  .mc-prog-label em { font-style:normal; color:var(--b600); }
  .mc-prog-label em.done { color:var(--green); }
  .mc-prog-track {
    height:5px; background:var(--surface-2); border-radius:100px; overflow:hidden;
  }
  .mc-prog-fill {
    height:100%; border-radius:100px;
    background:linear-gradient(90deg,var(--b500),var(--b400));
    transition:width .5s ease; position:relative;
  }
  .mc-prog-fill::after {
    content:''; position:absolute; top:0; left:-100%; width:50%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.45),transparent);
    animation:shimmer 2.6s ease-in-out infinite;
  }
  .mc-prog-fill.complete {
    background:linear-gradient(90deg,var(--green),#22c55e);
  }

  /* CTA button */
  .mc-card-footer { margin-top:auto; }
  .mc-go-btn {
    position:relative; overflow:hidden;
    display:flex; align-items:center; justify-content:center; gap:7px;
    width:100%; padding:11px;
    border-radius:var(--r); font-family:var(--font-display);
    font-size:12px; font-weight:700; border:none; cursor:pointer;
    transition:all .16s; letter-spacing:.04em; text-transform:uppercase;
  }
  /* Shimmer sweep */
  .mc-go-btn::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
    animation:shimmer 2.8s ease-in-out infinite; pointer-events:none;
  }
  .mc-go-btn.primary {
    background:linear-gradient(135deg,var(--b500),var(--b700)); color:#fff;
    box-shadow:0 3px 14px rgba(37,99,235,0.28), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .mc-go-btn.primary:hover {
    box-shadow:0 6px 22px rgba(37,99,235,0.38), inset 0 1px 0 rgba(255,255,255,0.15);
    transform:translateY(-1px);
  }
  .mc-go-btn.complete {
    background:var(--green-lt); color:var(--green);
    border:1px solid var(--green-mid);
    box-shadow:0 2px 8px rgba(22,163,74,0.1);
  }
  .mc-go-btn.complete::after {
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent);
  }
  .mc-go-btn.complete:hover {
    background:#e0f7f0;
    box-shadow:0 4px 14px rgba(22,163,74,0.15);
    transform:translateY(-1px);
  }

  /* ══ Empty state ══ */
  .mc-empty {
    position:relative; z-index:1;
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    padding:80px 20px; text-align:center; gap:14px;
    animation: fadeIn .6s ease both;
  }
  .mc-empty-icon {
    width:88px; height:88px; border-radius:24px;
    background:var(--white); border:1px solid var(--border);
    display:flex; align-items:center; justify-content:center;
    font-size:38px; margin-bottom:6px;
    box-shadow:0 4px 18px rgba(37,99,235,0.1), 0 1px 3px rgba(15,23,42,0.05);
  }
  .mc-empty h2 {
    font-family:var(--font-display);
    font-size:22px; font-weight:800; color:var(--ink); margin:0;
    letter-spacing:-.04em;
  }
  .mc-empty p { font-size:14px; color:var(--ink-3); margin:0; font-weight:300; }

  .mc-empty-btn {
    position:relative; overflow:hidden;
    display:inline-flex; align-items:center; gap:7px;
    padding:12px 24px; border-radius:var(--r);
    background:linear-gradient(135deg,var(--b500),var(--b700)); color:#fff;
    text-decoration:none; font-size:12px; font-weight:700;
    font-family:var(--font-display); letter-spacing:.04em; text-transform:uppercase;
    margin-top:6px;
    box-shadow:0 3px 14px rgba(37,99,235,0.28), inset 0 1px 0 rgba(255,255,255,0.15);
    transition:all .15s;
  }
  .mc-empty-btn::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
    animation:shimmer 2.8s ease-in-out infinite; pointer-events:none;
  }
  .mc-empty-btn:hover {
    box-shadow:0 6px 22px rgba(37,99,235,0.38), inset 0 1px 0 rgba(255,255,255,0.15);
    transform:translateY(-1px);
  }

  @media (max-width:600px) {
    .mc-root { padding:0 20px 60px; }
    .mc-header { flex-direction:column; align-items:flex-start; }
    .mc-grid { grid-template-columns:1fr; }
  }
`;

export default function MyCourses() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading } = useSelector(s => s.enrollments);

  useEffect(() => { dispatch(fetchMyEnrollments()); }, [dispatch]);

  if (loading) return <LoadingCenter />;

  return (
    <>
      <style>{styles}</style>
      <div className="mc-root">
        <div className="mc-body-grid" />
        <div className="mc-hero" />

        {/* ── Header ── */}
        <div className="mc-header">
          <div>
            <div className="mc-kicker">
              <div className="mc-kicker-line" />
              <span className="mc-kicker-text">E.Learning</span>
              <div className="mc-kicker-dot" />
            </div>
            <h1 className="mc-heading">My Courses</h1>
            <p className="mc-subheading">
              {list.length > 0
                ? `${list.length} enrolled course${list.length !== 1 ? 's' : ''}`
                : 'Your learning journey starts here'}
            </p>
          </div>
          <Link to="/courses" className="mc-browse-link">Browse Courses →</Link>
        </div>

        {/* ── Empty ── */}
        {list.length === 0 ? (
          <div className="mc-empty">
            <div className="mc-empty-icon">📚</div>
            <h2>No courses yet</h2>
            <p>You haven't enrolled in any courses yet.</p>
            <Link to="/courses" className="mc-empty-btn">Browse Courses →</Link>
          </div>
        ) : (
          <div className="mc-grid">
            {list.map((e, i) => {
              const pct      = e.progress?.progressPercentage || 0;
              const lessons  = e.course?.totalLessons || 0;
              const complete = pct === 100;
              const btnLabel = complete ? '✓ Review Course' : pct > 0 ? 'Continue →' : 'Start Learning →';

              return (
                <div key={e._id} className="mc-card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                  onClick={() => navigate(`/courses/${e.course?._id}`)}>

                  <div className="mc-thumb">
                    {e.course?.thumbnail?.url
                      ? <img src={e.course.thumbnail.url} alt={e.course.title} />
                      : <div className="mc-thumb-placeholder">📚</div>
                    }
                    {/* Progress strip on thumbnail */}
                    <div className="mc-thumb-progress">
                      <div className={`mc-thumb-progress-fill${complete ? ' complete' : ''}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="mc-card-body">
                    <h3 className="mc-card-title">{e.course?.title}</h3>

                    <div className="mc-card-meta">
                      {e.course?.instructor?.name && (
                        <><span className="mc-meta-icon">👤</span><span>{e.course.instructor.name}</span></>
                      )}
                      {e.course?.instructor?.name && lessons > 0 && <span className="mc-meta-sep">·</span>}
                      {lessons > 0 && <span>{lessons} lesson{lessons !== 1 ? 's' : ''}</span>}
                    </div>

                    <div className="mc-prog-wrap">
                      <div className="mc-prog-label">
                        <span>Progress</span>
                        <em className={complete ? 'done' : ''}>{pct}%</em>
                      </div>
                      <div className="mc-prog-track">
                        <div className={`mc-prog-fill${complete ? ' complete' : ''}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="mc-card-footer">
                      <button
                        className={`mc-go-btn ${complete ? 'complete' : 'primary'}`}
                        onClick={ev => { ev.stopPropagation(); navigate(`/courses/${e.course?._id}`); }}>
                        {btnLabel}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}