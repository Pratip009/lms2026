import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../../services/api";
import { LoadingCenter } from "../../components/common";
import LessonChat from "./Lessonchat";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Epilogue:wght@300;400;500;600&display=swap');

  .vp-root {
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
    --warning: #92570a;
    --warning-bg: #fefbf0;
    --warning-border: #f0d9b0;
    --danger: #c0392b;
    --danger-bg: #fef5f4;
    --danger-border: #f4c5c0;
    font-family: 'Epilogue', sans-serif;
    background: var(--bg);
    color: var(--text);
    display: flex;
    min-height: calc(100vh - 60px);
  }

  /* ── Sidebar ── */
  .vp-sidebar {
    width: 284px;
    min-width: 284px;
    background: var(--white);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .vp-sidebar-top {
    padding: 18px 20px;
    border-bottom: 1px solid var(--border);
    background: #fcfcfb;
  }
  .vp-back-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--muted);
    text-decoration: none;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    transition: color 0.15s;
  }
  .vp-back-link:hover { color: var(--accent); }

  .vp-prog-wrap { margin-top: 14px; }
  .vp-prog-label-row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 7px;
  }
  .vp-prog-label-row em { font-style: normal; color: var(--accent); }
  .vp-prog-track {
    height: 4px;
    background: #eeeee8;
    border-radius: 4px;
    overflow: hidden;
  }
  .vp-prog-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .vp-list-label {
    padding: 13px 20px 5px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .vp-lesson-list {
    overflow-y: auto;
    flex: 1;
    scrollbar-width: thin;
    scrollbar-color: var(--border) transparent;
  }
  .vp-lesson-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 20px;
    border-bottom: 1px solid #f3f3f0;
    cursor: pointer;
    transition: background 0.12s;
  }
  .vp-lesson-item:hover:not(.locked) { background: #fafaf8; }
  .vp-lesson-item.active {
    background: var(--accent-light);
    border-left: 3px solid var(--accent);
    padding-left: 17px;
  }
  .vp-lesson-item.locked { cursor: not-allowed; opacity: 0.42; }

  .vp-lesson-num {
    font-size: 11px; font-weight: 600;
    color: var(--muted); min-width: 18px; text-align: center;
  }
  .vp-lesson-item.active .vp-lesson-num { color: var(--accent); }

  .vp-lesson-dot {
    width: 26px; height: 26px;
    border-radius: 6px;
    background: #f2f2ef;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; flex-shrink: 0; color: var(--muted);
  }
  .vp-lesson-item.active .vp-lesson-dot { background: #dce8ff; color: var(--accent); }
  .vp-lesson-dot.ok   { background: #e2f7f0; color: var(--success); }
  .vp-lesson-dot.seen { background: #fef5e0; color: var(--warning); }

  .vp-lesson-info { flex: 1; min-width: 0; }
  .vp-lesson-name {
    font-size: 13px; font-weight: 500;
    color: var(--text2);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    line-height: 1.4;
  }
  .vp-lesson-item.active .vp-lesson-name { color: var(--accent); font-weight: 600; }
  .vp-lesson-sub {
    font-size: 10px; color: var(--muted); margin-top: 1px; font-weight: 400;
  }
  .vp-lesson-sub.ok   { color: var(--success); font-weight: 500; }
  .vp-lesson-sub.seen { color: var(--warning); font-weight: 500; }

  /* ── Main ── */
  .vp-main { flex: 1; overflow-y: auto; }
  .vp-content { max-width: 880px; margin: 0 auto; padding: 36px 36px 72px; }

  .vp-crumb {
    display: flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--muted);
    margin-bottom: 16px;
  }
  .vp-crumb-sep { opacity: 0.35; }

  .vp-title-row {
    display: flex; align-items: flex-start;
    justify-content: space-between; gap: 16px;
    margin-bottom: 22px; flex-wrap: wrap;
  }
  .vp-title {
    font-family: 'Playfair Display', serif;
    font-size: 26px; font-weight: 700;
    color: var(--text); margin: 0; line-height: 1.3;
  }
  .vp-badges { display: flex; gap: 8px; padding-top: 5px; flex-shrink: 0; }
  .vp-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 5px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.03em;
  }
  .vp-badge-watched {
    background: var(--warning-bg); color: var(--warning);
    border: 1px solid var(--warning-border);
  }
  .vp-badge-passed {
    background: var(--success-bg); color: var(--success);
    border: 1px solid var(--success-border);
  }

  /* ── Video ── */
  .vp-video-shell {
    position: relative; padding-bottom: 56.25%; height: 0;
    margin-bottom: 22px; border-radius: 10px; overflow: hidden;
    background: #111;
    box-shadow: 0 2px 20px rgba(0,0,0,0.12), 0 0 0 1px var(--border);
  }
  .vp-video-shell iframe {
    position: absolute; top: 0; left: 0;
    width: 100%; height: 100%; border: none;
  }
  .vp-video-placeholder {
    position: relative; padding-bottom: 56.25%; height: 0;
    margin-bottom: 22px; border-radius: 10px; overflow: hidden;
    background: var(--white); border: 1px solid var(--border);
  }
  .vp-video-placeholder-in {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
  }
  .vp-ph-icon {
    width: 52px; height: 52px; border-radius: 12px;
    background: #f2f2ef; border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center; font-size: 20px;
  }
  .vp-ph-text { font-size: 14px; color: var(--muted); }
  .vp-spinner {
    width: 26px; height: 26px;
    border: 2px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: vpspin 0.75s linear infinite;
  }
  @keyframes vpspin { to { transform: rotate(360deg); } }

  /* ── Buttons ── */
  .vp-actions { display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; }
  .vp-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 16px; border-radius: 8px;
    font-family: 'Epilogue', sans-serif; font-size: 13px; font-weight: 500;
    cursor: pointer; border: none; transition: all 0.15s; white-space: nowrap;
  }
  .vp-btn-primary { background: var(--accent); color: #fff; }
  .vp-btn-primary:hover { background: #1649c5; }
  .vp-btn-outline {
    background: var(--white); color: var(--text2);
    border: 1px solid var(--border-strong);
  }
  .vp-btn-outline:hover { background: #f7f7f5; border-color: #bbbbb0; }
  .vp-btn-success {
    background: var(--success-bg); color: var(--success);
    border: 1px solid var(--success-border);
  }
  .vp-btn-success:hover { background: #e0f7f0; }
  .vp-btn-ghost {
    background: transparent; color: var(--muted);
    border: 1px solid var(--border);
  }
  .vp-btn-ghost:hover { color: var(--text2); border-color: var(--border-strong); background: var(--white); }

  /* ── Alert ── */
  .vp-alert {
    display: flex; align-items: center; gap: 10px;
    background: var(--danger-bg); border: 1px solid var(--danger-border);
    color: var(--danger); border-radius: 8px;
    padding: 11px 15px; font-size: 13px; margin-bottom: 20px;
  }

  /* ── Card ── */
  .vp-card {
    background: var(--white); border: 1px solid var(--border);
    border-radius: 12px; padding: 26px;
    margin-bottom: 24px;
  }
  .vp-card-heading {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted); margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .vp-card-heading::before {
    content: ''; display: block;
    width: 3px; height: 12px;
    background: var(--accent); border-radius: 2px;
  }
  .vp-card p {
    color: var(--text2); line-height: 1.85;
    font-size: 14px; font-weight: 400; margin: 0;
  }
  .vp-hr { border: none; border-top: 1px solid var(--border); margin: 20px 0; }

  /* ── Chat section ── */
  .vp-chat-section {
    margin-top: 24px;
  }
  .vp-chat-label {
    font-size: 10px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--muted);
    margin-bottom: 10px;
    display: flex; align-items: center; gap: 8px;
  }
  .vp-chat-label::before {
    content: ''; display: block;
    width: 3px; height: 12px;
    background: var(--accent); border-radius: 2px;
  }
  .vp-chat-wrap {
    height: 560px;
    display: flex;
    flex-direction: column;
  }
`;

export default function VideoPlayer() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const iframeRef = useRef(null);

  const [lesson, setLesson]             = useState(null);
  const [lessons, setLessons]           = useState([]);
  const [otpData, setOtpData]           = useState(null);
  const [progress, setProgress]         = useState(null);
  const [loading, setLoading]           = useState(true);
  const [videoLoading, setVideoLoading] = useState(false);
  const [error, setError]               = useState("");
  const [watched, setWatched]           = useState(false);

  // ── currentUser: from Redux (already fetched by App.jsx on load) ────
  const currentUser = useSelector(s => s.auth.user);
  // ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    setError("");
    setOtpData(null);
    Promise.all([
      api.get(`/lessons/${lessonId}`),
      api.get(`/courses/${courseId}/lessons`),
      api
        .get(`/progress/${courseId}`)
        .catch(() => ({ data: { data: { progress: null } } })),
    ])
      .then(([l, ll, p]) => {
        setLesson(l.data.data?.lesson || l.data.lesson);
        setLessons(ll.data.data?.lessons || ll.data.lessons || []);
        setProgress(p.data.data?.progress || p.data.progress);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load lesson"),
      )
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  useEffect(() => {
    if (!lesson?.video?.vdoCipherId) return;
    setOtpData(null);
    setVideoLoading(true);
    api
      .get(`/lessons/${lessonId}/video-otp`)
      .then((r) => setOtpData(r.data.data || r.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to load video"),
      )
      .finally(() => setVideoLoading(false));
  }, [lesson, lessonId]);

  const handleMarkWatched = async () => {
    try {
      await api.post(`/progress/${courseId}/lessons/${lessonId}/watch`);
      setWatched(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getLessonProgress = (lid) =>
    progress?.lessons?.find((l) => l.lesson?._id === lid || l.lesson === lid);

  const currentIndex          = lessons.findIndex((l) => l._id === lessonId);
  const nextLesson            = lessons[currentIndex + 1];
  const prevLesson            = lessons[currentIndex - 1];
  const currentLessonProgress = getLessonProgress(lessonId);
  const isUserAdmin           = currentUser?.role === 'admin' || currentUser?.role === 'instructor';
  // Admins are treated as having watched + passed every lesson so all actions are available
  const isWatched             = isUserAdmin || watched || currentLessonProgress?.isWatched;
  const isPassed              = isUserAdmin || currentLessonProgress?.examPassed;
  const completedCount        = progress?.lessons?.filter((l) => l.examPassed).length || 0;
  const progressPct           = lessons.length > 0
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  if (loading) return <LoadingCenter />;

  return (
    <>
      <style>{styles}</style>
      <div className="vp-root">

        {/* ── Sidebar ── */}
        <div className="vp-sidebar">
          <div className="vp-sidebar-top">
            <Link to={`/courses/${courseId}`} className="vp-back-link">
              ← Back to course
            </Link>
            <div className="vp-prog-wrap">
              <div className="vp-prog-label-row">
                <span>Progress</span>
                <em>{progressPct}%</em>
              </div>
              <div className="vp-prog-track">
                <div className="vp-prog-fill" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>

          <div className="vp-list-label">Lessons · {lessons.length}</div>

          <div className="vp-lesson-list">
            {lessons.map((l, i) => {
              const lp       = getLessonProgress(l._id);
              const isActive = l._id === lessonId;
              const isAdmin  = currentUser?.role === 'admin' || currentUser?.role === 'instructor';
              const isLocked = !isAdmin && !l.isFreePreview && !lp?.isUnlocked;
              const dotClass = lp?.examPassed ? "ok" : lp?.isWatched ? "seen" : "";
              const icon     = lp?.examPassed ? "✓" : lp?.isWatched ? "◉" : isLocked ? "⊘" : "▷";
              const subLabel = lp?.examPassed ? "Passed" : lp?.isWatched ? "Watched" : isLocked ? "Locked" : "Available";

              return (
                <div
                  key={l._id}
                  className={`vp-lesson-item${isActive ? " active" : ""}${isLocked ? " locked" : ""}`}
                  onClick={() => !isLocked && navigate(`/learn/${courseId}/lesson/${l._id}`)}
                >
                  <span className="vp-lesson-num">{i + 1}</span>
                  <div className={`vp-lesson-dot ${dotClass}`}>{icon}</div>
                  <div className="vp-lesson-info">
                    <div className="vp-lesson-name">{l.title}</div>
                    <div className={`vp-lesson-sub ${dotClass}`}>{subLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Main ── */}
        <div className="vp-main">
          <div className="vp-content">

            <div className="vp-crumb">
              <span>Lesson {currentIndex + 1}</span>
              <span className="vp-crumb-sep">›</span>
              <span style={{ color: "var(--text2)" }}>{lesson?.title}</span>
            </div>

            <div className="vp-title-row">
              <h1 className="vp-title">{lesson?.title}</h1>
              <div className="vp-badges">
                {isWatched && !isPassed && (
                  <span className="vp-badge vp-badge-watched">Watched</span>
                )}
                {isPassed && (
                  <span className="vp-badge vp-badge-passed">Passed</span>
                )}
              </div>
            </div>

            {error && (
              <div className="vp-alert"><span>⚠</span> {error}</div>
            )}

            {otpData?.otp && otpData?.playbackInfo ? (
              <div className="vp-video-shell">
                <iframe
                  ref={iframeRef}
                  title={lesson?.title}
                  src={`https://player.vdocipher.com/v2/?otp=${otpData.otp}&playbackInfo=${otpData.playbackInfo}`}
                  allowFullScreen
                  allow="encrypted-media"
                />
              </div>
            ) : (
              <div className="vp-video-placeholder">
                <div className="vp-video-placeholder-in">
                  {videoLoading ? (
                    <>
                      <div className="vp-spinner" />
                      <span className="vp-ph-text">Loading video...</span>
                    </>
                  ) : (
                    <>
                      <div className="vp-ph-icon">🎬</div>
                      <span className="vp-ph-text">
                        {error ? "Video unavailable" : "No video attached"}
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="vp-actions">
              {prevLesson && (
                <button
                  className="vp-btn vp-btn-ghost"
                  onClick={() => navigate(`/learn/${courseId}/lesson/${prevLesson._id}`)}
                >
                  ← Previous
                </button>
              )}
              {!isWatched && (
                <button className="vp-btn vp-btn-outline" onClick={handleMarkWatched}>
                  ✓ Mark as Watched
                </button>
              )}
              {isWatched && !isPassed && (
                <button
                  className="vp-btn vp-btn-primary"
                  onClick={() => navigate(`/learn/${courseId}/lesson/${lessonId}/exam`)}
                >
                  Take Exam →
                </button>
              )}
              {isPassed && nextLesson && (
                <button
                  className="vp-btn vp-btn-success"
                  onClick={() => navigate(`/learn/${courseId}/lesson/${nextLesson._id}`)}
                >
                  Next Lesson →
                </button>
              )}
            </div>

            {/* ── About this lesson ── */}
            <div className="vp-card">
              <div className="vp-card-heading">About this lesson</div>
              <p>{lesson?.description}</p>
              {lesson?.notes && (
                <>
                  <hr className="vp-hr" />
                  <div className="vp-card-heading">Notes</div>
                  <p style={{ whiteSpace: "pre-wrap" }}>{lesson.notes}</p>
                </>
              )}
            </div>

            {/* ── Lesson Discussion ── */}
            <div className="vp-chat-section">
              <div className="vp-chat-label">Discussion</div>
              <div className="vp-chat-wrap">
                <LessonChat
                  courseId={courseId}
                  lessonId={lessonId}
                  currentUser={currentUser}
                />
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}