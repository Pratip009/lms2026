import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
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
    --rose:#e11d48; --rose-lt:#fff1f2; --rose-mid:#fecdd3;
    --font-display:'Syne',sans-serif; --font-body:'DM Sans',sans-serif;
    --r:10px; --r-lg:16px; --r-xl:22px;
  }

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes shimmer { 0%{left:-100%} 60%{left:150%} 100%{left:150%} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }

  .ep-root {
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
  .ep-hero {
    position: absolute; top:0; left:0; right:0; height:220px; z-index:0;
    background: linear-gradient(175deg, #050f2b 0%, #0c1e4a 50%, transparent 100%);
    pointer-events:none;
  }
  .ep-hero::before {
    content:'';
    position:absolute; inset:0;
    background-image: radial-gradient(circle, rgba(59,130,246,0.18) 1px, transparent 1px);
    background-size:26px 26px;
    mask-image: linear-gradient(180deg,rgba(0,0,0,.7) 0%,transparent 100%);
    -webkit-mask-image: linear-gradient(180deg,rgba(0,0,0,.7) 0%,transparent 100%);
  }
  .ep-hero::after {
    content:'';
    position:absolute; top:-60px; left:50%; transform:translateX(-50%);
    width:600px; height:400px;
    background: radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.2) 0%, transparent 70%);
  }

  /* Body dot grid */
  .ep-body-grid {
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image: radial-gradient(circle, rgba(37,99,235,0.04) 1px, transparent 1px);
    background-size:28px 28px;
  }

  .ep-wrap {
    position:relative; z-index:1;
    width:100%;
  }

  /* ── Page header ── */
  .ep-page-header {
    padding: 40px 0 28px;
    display:flex; align-items:flex-end; justify-content:space-between; gap:16px;
    margin-bottom:28px;
    border-bottom:1px solid rgba(255,255,255,0.1);
    flex-wrap:wrap;
  }

  .ep-kicker {
    display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
  }
  .ep-kicker-line { width:24px; height:1.5px; background:var(--b400); border-radius:2px; opacity:.8; }
  .ep-kicker-text {
    font-size:11px; font-weight:600; letter-spacing:.18em;
    text-transform:uppercase; color:var(--b300);
  }
  .ep-kicker-dot {
    width:5px; height:5px; border-radius:50%; background:var(--b400);
    animation:blink 2.4s ease-in-out infinite;
    box-shadow:0 0 0 3px rgba(96,165,250,0.25);
  }

  .ep-title {
    font-family: var(--font-display);
    font-size: clamp(22px, 3vw, 34px);
    font-weight:800; color:#fff;
    margin:0; line-height:1.1; letter-spacing:-.04em;
  }
  .ep-meta {
    font-size:13px; color:rgba(255,255,255,0.45);
    display:flex; align-items:center; gap:10px; margin-top:6px;
  }
  .ep-meta-sep { opacity:.35; }

  .ep-back-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:9px 16px; border-radius:var(--r);
    background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.75);
    border:1px solid rgba(255,255,255,0.14);
    font-family:var(--font-body); font-size:13px; font-weight:500;
    cursor:pointer; transition:all 0.15s; white-space:nowrap; flex-shrink:0;
    backdrop-filter:blur(8px);
  }
  .ep-back-btn:hover { background:rgba(255,255,255,0.14); color:#fff; }

  /* ── Progress bar ── */
  .ep-prog-wrap {
    background:var(--white); border:1px solid var(--border);
    border-radius:var(--r-lg); padding:16px 20px; margin-bottom:26px;
    display:flex; align-items:center; gap:16px;
    box-shadow:0 1px 3px rgba(15,23,42,0.04);
    animation: fadeUp .45s ease both .1s;
  }
  .ep-prog-text {
    font-size:11px; font-weight:700; letter-spacing:.07em; text-transform:uppercase;
    color:var(--ink-4); white-space:nowrap;
    font-family:var(--font-display);
  }
  .ep-prog-text em { font-style:normal; color:var(--b600); }
  .ep-prog-track { flex:1; height:5px; background:var(--surface-2); border-radius:100px; overflow:hidden; }
  .ep-prog-fill {
    height:100%; background:linear-gradient(90deg,var(--b500),var(--b400));
    border-radius:100px; transition:width .3s ease;
    position:relative;
  }
  .ep-prog-fill::after {
    content:'';
    position:absolute; top:0; left:-100%; width:50%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent);
    animation:shimmer 2.4s ease-in-out infinite;
  }

  /* ── Alert ── */
  .ep-alert {
    display:flex; align-items:center; gap:10px;
    background:var(--rose-lt); border:1px solid var(--rose-mid);
    color:var(--rose); border-radius:var(--r);
    padding:12px 16px; font-size:13px; margin-bottom:22px;
    animation: fadeIn .3s ease;
  }

  /* ── Question card ── */
  .ep-q-card {
    background:var(--white); border:1px solid var(--border);
    border-radius:var(--r-xl); padding:24px 26px;
    margin-bottom:14px;
    box-shadow:0 1px 3px rgba(15,23,42,0.04);
    transition:border-color .2s, box-shadow .25s;
    animation: fadeUp .4s ease both;
    position:relative; overflow:hidden;
  }
  .ep-q-card::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:2px;
    background:var(--border); transition:background .2s;
  }
  .ep-q-card.answered { border-color:var(--b200); }
  .ep-q-card.answered::before { background:linear-gradient(90deg,var(--b500),var(--b400)); }
  .ep-q-card.answered {
    box-shadow:0 4px 18px rgba(37,99,235,0.08);
  }

  .ep-q-num {
    font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
    color:var(--ink-4); margin-bottom:10px;
    display:flex; align-items:center; gap:8px;
    font-family:var(--font-display);
  }
  .ep-q-num-pip {
    width:3px; height:14px; background:var(--b500); border-radius:2px;
    transition:background .2s;
  }
  .ep-q-card.answered .ep-q-num { color:var(--b600); }
  .ep-q-card.answered .ep-q-num-pip { background:var(--b500); }

  .ep-q-text {
    font-size:15px; font-weight:500;
    color:var(--ink); line-height:1.65; margin:0 0 18px;
  }

  .ep-options { display:flex; flex-direction:column; gap:9px; }

  .ep-option {
    display:flex; align-items:center; gap:13px;
    padding:12px 16px; border-radius:var(--r-lg);
    border:1.5px solid var(--border);
    cursor:pointer; transition:all .15s;
    background:var(--white); user-select:none;
  }
  .ep-option:hover { border-color:var(--b200); background:var(--b50); }
  .ep-option.selected {
    border-color:var(--b500);
    background:var(--b50);
    box-shadow:0 0 0 3px rgba(59,130,246,0.08);
  }

  .ep-option-radio {
    width:18px; height:18px; border-radius:50%;
    border:2px solid var(--ink-5);
    display:flex; align-items:center; justify-content:center;
    flex-shrink:0; transition:all .15s; background:var(--white);
  }
  .ep-option.selected .ep-option-radio { border-color:var(--b600); background:var(--b600); }
  .ep-option-radio-dot {
    width:6px; height:6px; border-radius:50%; background:#fff;
    opacity:0; transition:opacity .15s;
  }
  .ep-option.selected .ep-option-radio-dot { opacity:1; }

  .ep-option-label {
    font-size:11px; font-weight:800; color:var(--ink-4); min-width:20px;
    transition:color .15s; font-family:var(--font-display); letter-spacing:.04em;
  }
  .ep-option.selected .ep-option-label { color:var(--b600); }

  .ep-option-text {
    font-size:14px; color:var(--ink-2); line-height:1.5; transition:color .15s;
  }
  .ep-option.selected .ep-option-text { color:var(--ink); }

  /* ── Footer ── */
  .ep-footer {
    display:flex; justify-content:space-between; align-items:center;
    margin-top:28px; padding-top:22px;
    border-top:1px solid var(--border);
    flex-wrap:wrap; gap:12px;
  }
  .ep-footer-info { font-size:13px; color:var(--ink-4); }
  .ep-footer-info strong { color:var(--ink-2); font-weight:600; }

  /* Shimmer submit button */
  .ep-submit-btn {
    position:relative; overflow:hidden;
    display:inline-flex; align-items:center; gap:8px;
    padding:12px 28px; border-radius:var(--r);
    background:linear-gradient(135deg,var(--b500) 0%,var(--b700) 100%); color:#fff;
    font-family:var(--font-display); font-size:13px; font-weight:700;
    border:none; cursor:pointer; transition:all .15s;
    box-shadow:0 4px 16px rgba(37,99,235,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
    letter-spacing:.04em; text-transform:uppercase;
  }
  .ep-submit-btn::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);
    animation:shimmer 2.8s ease-in-out infinite; pointer-events:none;
  }
  .ep-submit-btn:hover:not(:disabled) {
    box-shadow:0 6px 22px rgba(37,99,235,0.38), inset 0 1px 0 rgba(255,255,255,0.15);
    transform:translateY(-1px);
  }
  .ep-submit-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }

  /* ══ Result screen ══ */
  .ep-result-wrap { width:100%; }

  .ep-result-card {
    background:var(--white); border:1px solid var(--border);
    border-radius:var(--r-xl); padding:44px 40px 40px;
    text-align:center; margin-bottom:16px;
    box-shadow:0 2px 8px rgba(15,23,42,0.05);
    position:relative; overflow:hidden;
    animation: fadeUp .5s ease both;
  }
  /* Top gradient stripe */
  .ep-result-card::before {
    content:'';
    position:absolute; top:0; left:0; right:0; height:4px;
    background:linear-gradient(90deg,var(--b500),var(--b400),var(--b600));
  }
  /* Glow wash */
  .ep-result-card::after {
    content:'';
    position:absolute; top:0; left:50%; transform:translateX(-50%);
    width:500px; height:300px;
    background:radial-gradient(ellipse at 50% 0%,rgba(59,130,246,0.05) 0%,transparent 70%);
    pointer-events:none;
  }

  .ep-result-icon {
    width:80px; height:80px; border-radius:22px;
    display:flex; align-items:center; justify-content:center;
    font-size:36px; margin:0 auto 22px;
  }
  .ep-result-icon.pass {
    background:var(--green-lt); border:1px solid var(--green-mid);
    box-shadow:0 4px 16px rgba(22,163,74,0.12);
  }
  .ep-result-icon.fail {
    background:var(--rose-lt); border:1px solid var(--rose-mid);
    box-shadow:0 4px 16px rgba(225,29,72,0.1);
  }

  .ep-result-title {
    font-family:var(--font-display);
    font-size:28px; font-weight:800; color:var(--ink);
    margin:0 0 8px; letter-spacing:-.04em;
  }
  .ep-result-msg { font-size:14px; color:var(--ink-3); margin:0 0 32px; line-height:1.65; }

  .ep-stats {
    display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:32px;
  }
  .ep-stat {
    background:var(--surface); border:1px solid var(--border);
    border-radius:var(--r-lg); padding:18px 14px;
    transition:border-color .2s, box-shadow .2s;
  }
  .ep-stat:hover {
    border-color:var(--b200);
    box-shadow:0 4px 14px rgba(37,99,235,0.08);
  }
  .ep-stat-value {
    font-family:var(--font-display);
    font-size:26px; font-weight:800; margin-bottom:5px; letter-spacing:-.04em;
  }
  .ep-stat-value.pass { color:var(--green); }
  .ep-stat-value.fail { color:var(--rose); }
  .ep-stat-value.neutral { color:var(--ink); }
  .ep-stat-label {
    font-size:10.5px; font-weight:700; letter-spacing:.09em; text-transform:uppercase;
    color:var(--ink-4); font-family:var(--font-display);
  }

  .ep-result-actions { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }

  .ep-btn {
    position:relative; overflow:hidden;
    display:inline-flex; align-items:center; gap:7px;
    padding:11px 20px; border-radius:var(--r);
    font-family:var(--font-display); font-size:12px; font-weight:700;
    cursor:pointer; border:none; transition:all .15s;
    letter-spacing:.04em; text-transform:uppercase;
  }
  .ep-btn-primary {
    background:linear-gradient(135deg,var(--b500),var(--b700)); color:#fff;
    box-shadow:0 3px 14px rgba(37,99,235,0.28), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .ep-btn-primary::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
    animation:shimmer 2.8s ease-in-out infinite; pointer-events:none;
  }
  .ep-btn-primary:hover { box-shadow:0 6px 22px rgba(37,99,235,0.36); transform:translateY(-1px); }
  .ep-btn-success {
    background:var(--green-lt); color:var(--green);
    border:1px solid var(--green-mid);
    box-shadow:0 2px 8px rgba(22,163,74,0.1);
  }
  .ep-btn-success:hover { background:#e0f7f0; box-shadow:0 4px 14px rgba(22,163,74,0.15); }
  .ep-btn-outline {
    background:var(--white); color:var(--ink-2);
    border:1px solid var(--border-2);
  }
  .ep-btn-outline:hover { background:var(--surface); border-color:var(--ink-4); }

  /* ── Feedback ── */
  .ep-feedback-card {
    background:var(--white); border:1px solid var(--border);
    border-radius:var(--r-xl); overflow:hidden;
    box-shadow:0 1px 3px rgba(15,23,42,0.04);
    animation: fadeUp .5s ease both .1s;
  }
  .ep-feedback-header {
    padding:18px 24px; border-bottom:1px solid var(--border);
    background:var(--surface);
    display:flex; align-items:center; gap:10px;
  }
  .ep-feedback-pip { width:3px; height:14px; background:var(--b500); border-radius:2px; flex-shrink:0; }
  .ep-feedback-title {
    font-size:11px; font-weight:700; letter-spacing:.12em; text-transform:uppercase;
    color:var(--ink-3); font-family:var(--font-display);
  }
  .ep-feedback-item {
    padding:16px 24px; border-bottom:1px solid var(--surface-2); font-size:13px;
    transition:background .15s;
  }
  .ep-feedback-item:last-child { border-bottom:none; }
  .ep-feedback-item:hover { background:var(--surface); }
  .ep-feedback-q { font-weight:500; color:var(--ink-2); margin-bottom:5px; }
  .ep-feedback-ans { color:var(--green); font-weight:700; font-size:12px; }
  .ep-feedback-exp { color:var(--ink-4); margin-top:4px; font-size:12px; line-height:1.65; }

  @media (max-width:600px) {
    .ep-root { padding:0 20px 60px; }
    .ep-stats { grid-template-columns:1fr 1fr; }
    .ep-result-card { padding:28px 20px 24px; }
  }
`;

export default function ExamPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam]           = useState(null);
  const [answers, setAnswers]     = useState({});
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [startedAt]               = useState(new Date().toISOString());

  useEffect(() => {
    api.get(`/lessons/${lessonId}/exam`)
      .then(r => setExam(r.data.data?.exam || r.data.exam))
      .catch(err => setError(err.response?.data?.message || 'Failed to load exam'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const handleSelect = (questionId, option) =>
    setAnswers(prev => ({ ...prev, [questionId]: option }));

  const handleSubmit = async () => {
    const unanswered = exam.questions.filter(q => !answers[q._id]);
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} remaining.`);
      return;
    }
    setSubmitting(true); setError('');
    try {
      const answerList = exam.questions.map(q => ({
        questionId: q._id, selectedOption: answers[q._id],
      }));
      const res = await api.post(`/lessons/${lessonId}/exam/submit`, { answers: answerList, startedAt });
      setResult(res.data.data?.result || res.data.result);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setResult(null); setAnswers({}); setError(''); setLoading(true);
    api.get(`/lessons/${lessonId}/exam`)
      .then(r => setExam(r.data.data?.exam || r.data.exam))
      .catch(err => setError(err.response?.data?.message))
      .finally(() => setLoading(false));
  };

  if (loading) return <LoadingCenter />;

  const answeredCount = Object.keys(answers).length;
  const totalCount    = exam?.questions?.length || 0;
  const progPct       = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  if (result) {
    const passed = result.isPassed;
    return (
      <>
        <style>{styles}</style>
        <div className="ep-root">
          <div className="ep-body-grid" />
          <div className="ep-hero" />
          <div className="ep-wrap">
            <div className="ep-page-header">
              <div>
                <div className="ep-kicker">
                  <div className="ep-kicker-line" />
                  <span className="ep-kicker-text">Exam Results</span>
                  <div className="ep-kicker-dot" />
                </div>
                <h1 className="ep-title">{exam?.title}</h1>
              </div>
              <button className="ep-back-btn" onClick={() => navigate(-1)}>← Back</button>
            </div>

            <div className="ep-result-wrap">
              <div className="ep-result-card">
                <div className={`ep-result-icon ${passed ? 'pass' : 'fail'}`}>
                  {passed ? '🎓' : '📋'}
                </div>
                <h2 className="ep-result-title">{passed ? 'Exam Passed' : 'Not Quite There'}</h2>
                <p className="ep-result-msg">{result.message}</p>
                <div className="ep-stats">
                  <div className="ep-stat">
                    <div className={`ep-stat-value ${passed ? 'pass' : 'fail'}`}>{result.scorePercentage}%</div>
                    <div className="ep-stat-label">Your Score</div>
                  </div>
                  <div className="ep-stat">
                    <div className="ep-stat-value neutral">{result.correctAnswers}/{result.totalQuestions}</div>
                    <div className="ep-stat-label">Correct</div>
                  </div>
                  <div className="ep-stat">
                    <div className="ep-stat-value neutral">{result.passingScore}%</div>
                    <div className="ep-stat-label">Pass Mark</div>
                  </div>
                </div>
                <div className="ep-result-actions">
                  {passed ? (
                    <button className="ep-btn ep-btn-success"
                      onClick={() => navigate(`/learn/${courseId}/lesson/${lessonId}`)}>
                      Continue to Next Lesson →
                    </button>
                  ) : (
                    <button className="ep-btn ep-btn-primary" onClick={handleRetry}>Retry Exam</button>
                  )}
                  <button className="ep-btn ep-btn-outline"
                    onClick={() => navigate(`/learn/${courseId}/lesson/${lessonId}`)}>
                    Back to Lesson
                  </button>
                </div>
              </div>

              {result.feedback?.length > 0 && (
                <div className="ep-feedback-card">
                  <div className="ep-feedback-header">
                    <div className="ep-feedback-pip" />
                    <div className="ep-feedback-title">Answer Review</div>
                  </div>
                  {result.feedback.map((f, i) => (
                    <div key={f.questionId} className="ep-feedback-item">
                      <div className="ep-feedback-q">Q{i + 1} — Correct answer: <span className="ep-feedback-ans">{f.correctAnswer}</span></div>
                      {f.explanation && <div className="ep-feedback-exp">{f.explanation}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="ep-root">
        <div className="ep-body-grid" />
        <div className="ep-hero" />
        <div className="ep-wrap">

          <div className="ep-page-header">
            <div>
              <div className="ep-kicker">
                <div className="ep-kicker-line" />
                <span className="ep-kicker-text">Lesson Exam</span>
                <div className="ep-kicker-dot" />
              </div>
              <h1 className="ep-title">{exam?.title}</h1>
              <div className="ep-meta">
                <span>{totalCount} question{totalCount !== 1 ? 's' : ''}</span>
                <span className="ep-meta-sep">·</span>
                <span>Pass with {exam?.passingScore}%</span>
                {exam?.timeLimitMinutes && (
                  <><span className="ep-meta-sep">·</span><span>{exam.timeLimitMinutes} min</span></>
                )}
              </div>
            </div>
            <button className="ep-back-btn" onClick={() => navigate(-1)}>← Back</button>
          </div>

          <div className="ep-prog-wrap">
            <span className="ep-prog-text"><em>{answeredCount}</em> / {totalCount} answered</span>
            <div className="ep-prog-track">
              <div className="ep-prog-fill" style={{ width: `${progPct}%` }} />
            </div>
            <span className="ep-prog-text"><em>{progPct}%</em></span>
          </div>

          {error && <div className="ep-alert"><span>⚠</span> {error}</div>}

          {exam?.questions?.map((q, qi) => {
            const isAnswered = !!answers[q._id];
            return (
              <div key={q._id} className={`ep-q-card${isAnswered ? ' answered' : ''}`}
                style={{ animationDelay: `${0.1 + qi * 0.04}s` }}>
                <div className="ep-q-num">
                  <div className="ep-q-num-pip" />
                  Question {qi + 1}
                </div>
                <p className="ep-q-text">{q.questionText}</p>
                <div className="ep-options">
                  {q.options.map(opt => {
                    const selected = answers[q._id] === opt.label;
                    return (
                      <div key={opt.label}
                        className={`ep-option${selected ? ' selected' : ''}`}
                        onClick={() => handleSelect(q._id, opt.label)}>
                        <div className="ep-option-radio">
                          <div className="ep-option-radio-dot" />
                        </div>
                        <span className="ep-option-label">{opt.label}</span>
                        <span className="ep-option-text">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="ep-footer">
            <span className="ep-footer-info">
              <strong>{answeredCount}</strong> of <strong>{totalCount}</strong> questions answered
            </span>
            <button className="ep-submit-btn" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Exam →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}