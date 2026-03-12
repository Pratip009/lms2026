import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { fetchMyEnrollments } from '../../redux/slices/enrollmentSlice';
import { LoadingCenter } from '../../components/common';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Epilogue:wght@300;400;500;600&display=swap');

  .mc-root {
    --bg: #f7f7f5;
    --white: #ffffff;
    --border: #e4e4df;
    --border-strong: #d0d0c8;
    --accent: #1a56db;
    --accent-light: #eff4ff;
    --text: #111118;
    --text2: #44444f;
    --muted: #888896;
    --success: #0e7c59;
    --success-bg: #f0faf6;
    --success-border: #b6e8d5;
    font-family: 'Epilogue', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: calc(100vh - 60px);
    padding: 48px 40px 80px;
  }

  /* ── Header ── */
  .mc-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 36px;
    flex-wrap: wrap;
    gap: 16px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border);
  }
  .mc-heading {
    font-family: 'Playfair Display', serif;
    font-size: 30px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
    margin: 0 0 4px;
    line-height: 1;
  }
  .mc-subheading {
    font-size: 13px;
    color: var(--muted);
    font-weight: 400;
    margin: 0;
  }
  .mc-browse-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 9px 16px;
    border-radius: 8px;
    background: var(--white);
    border: 1px solid var(--border-strong);
    color: var(--text2);
    text-decoration: none;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.15s;
  }
  .mc-browse-link:hover { border-color: #bbbbb0; background: #f7f7f5; }

  /* ── Grid ── */
  .mc-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(296px, 1fr));
    gap: 18px;
  }

  /* ── Card ── */
  .mc-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    transition: box-shadow 0.18s, border-color 0.18s, transform 0.18s;
  }
  .mc-card:hover {
    box-shadow: 0 8px 28px rgba(0,0,0,0.08);
    border-color: var(--border-strong);
    transform: translateY(-2px);
  }

  .mc-thumb {
    height: 152px;
    overflow: hidden;
    background: #eeeee8;
    flex-shrink: 0;
    position: relative;
  }
  .mc-thumb img {
    width: 100%; height: 100%;
    object-fit: cover;
    transition: transform 0.35s ease;
  }
  .mc-card:hover .mc-thumb img { transform: scale(1.03); }
  .mc-thumb-placeholder {
    width: 100%; height: 100%;
    display: flex; align-items: center; justify-content: center;
    font-size: 38px; background: #f0f0ec;
  }

  .mc-card-body {
    padding: 18px 18px 18px;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  .mc-card-title {
    font-family: 'Playfair Display', serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 6px;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .mc-card-meta {
    font-size: 12px;
    color: var(--muted);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .mc-meta-sep { opacity: 0.35; }

  /* Progress */
  .mc-prog-wrap { margin-bottom: 16px; }
  .mc-prog-label {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 6px;
  }
  .mc-prog-label em { font-style: normal; color: var(--accent); }
  .mc-prog-track {
    height: 4px;
    background: #eeeee8;
    border-radius: 4px;
    overflow: hidden;
  }
  .mc-prog-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 4px;
    transition: width 0.5s ease;
  }
  .mc-prog-fill.complete { background: var(--success); }

  .mc-card-footer { margin-top: auto; }
  .mc-go-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    font-family: 'Epilogue', sans-serif;
    font-size: 13px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: all 0.15s;
  }
  .mc-go-btn.primary {
    background: var(--accent);
    color: #fff;
  }
  .mc-go-btn.primary:hover { background: #1649c5; }
  .mc-go-btn.complete {
    background: var(--success-bg);
    color: var(--success);
    border: 1px solid var(--success-border);
  }
  .mc-go-btn.complete:hover { background: #e0f7f0; }

  /* ── Empty ── */
  .mc-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    text-align: center;
    gap: 14px;
  }
  .mc-empty-icon {
    width: 80px; height: 80px;
    border-radius: 20px;
    background: var(--white);
    border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 36px; margin-bottom: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .mc-empty h2 {
    font-family: 'Playfair Display', serif;
    font-size: 20px; font-weight: 700; color: var(--text); margin: 0;
  }
  .mc-empty p { font-size: 14px; color: var(--muted); margin: 0; }
  .mc-empty-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 11px 22px; border-radius: 8px;
    background: var(--accent); color: #fff;
    text-decoration: none; font-size: 13px; font-weight: 600;
    margin-top: 6px; transition: background 0.15s;
  }
  .mc-empty-btn:hover { background: #1649c5; }
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

        {/* Header */}
        <div className="mc-header">
          <div>
            <h1 className="mc-heading">My Courses</h1>
            <p className="mc-subheading">
              {list.length > 0
                ? `${list.length} enrolled course${list.length !== 1 ? 's' : ''}`
                : 'Your learning journey starts here'}
            </p>
          </div>
          <Link to="/courses" className="mc-browse-link">Browse Courses →</Link>
        </div>

        {/* Empty */}
        {list.length === 0 ? (
          <div className="mc-empty">
            <div className="mc-empty-icon">📚</div>
            <h2>No courses yet</h2>
            <p>You haven't enrolled in any courses yet.</p>
            <Link to="/courses" className="mc-empty-btn">Browse Courses →</Link>
          </div>
        ) : (
          <div className="mc-grid">
            {list.map(e => {
              const pct      = e.progress?.progressPercentage || 0;
              const lessons  = e.course?.totalLessons || 0;
              const complete = pct === 100;
              const btnLabel = complete ? '✓ Review Course' : pct > 0 ? 'Continue Learning →' : 'Start Learning →';

              return (
                <div
                  key={e._id}
                  className="mc-card"
                  onClick={() => navigate(`/courses/${e.course?._id}`)}
                >
                  <div className="mc-thumb">
                    {e.course?.thumbnail?.url
                      ? <img src={e.course.thumbnail.url} alt={e.course.title} />
                      : <div className="mc-thumb-placeholder">📚</div>
                    }
                  </div>

                  <div className="mc-card-body">
                    <h3 className="mc-card-title">{e.course?.title}</h3>

                    <div className="mc-card-meta">
                      {e.course?.instructor?.name && <span>{e.course.instructor.name}</span>}
                      {e.course?.instructor?.name && lessons > 0 && <span className="mc-meta-sep">·</span>}
                      {lessons > 0 && <span>{lessons} lesson{lessons !== 1 ? 's' : ''}</span>}
                    </div>

                    <div className="mc-prog-wrap">
                      <div className="mc-prog-label">
                        <span>Progress</span>
                        <em>{pct}%</em>
                      </div>
                      <div className="mc-prog-track">
                        <div className={`mc-prog-fill${complete ? ' complete' : ''}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    <div className="mc-card-footer">
                      <button
                        className={`mc-go-btn ${complete ? 'complete' : 'primary'}`}
                        onClick={ev => { ev.stopPropagation(); navigate(`/courses/${e.course?._id}`); }}
                      >
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