import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LoadingCenter } from '../../components/common';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Epilogue:wght@300;400;500;600&display=swap');

  .ep-root {
    --bg: #f7f7f5;
    --white: #ffffff;
    --border: #e4e4df;
    --border-strong: #d0d0c8;
    --accent: #1a56db;
    --accent-light: #eff4ff;
    --accent-border: #c3d4f7;
    --text: #111118;
    --text2: #44444f;
    --muted: #888896;
    --success: #0e7c59;
    --success-bg: #f0faf6;
    --success-border: #b6e8d5;
    --danger: #c0392b;
    --danger-bg: #fef5f4;
    --danger-border: #f4c5c0;
    --danger-light: #fff8f7;
    font-family: 'Epilogue', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: calc(100vh - 60px);
    padding: 40px 20px 80px;
  }

  .ep-wrap {
    max-width: 680px;
    margin: 0 auto;
  }

  /* ── Exam header ── */
  .ep-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .ep-title {
    font-family: 'Playfair Display', serif;
    font-size: 24px;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 5px;
    line-height: 1.3;
  }
  .ep-meta {
    font-size: 13px;
    color: var(--muted);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .ep-meta-sep { opacity: 0.35; }

  .ep-back-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 14px; border-radius: 8px;
    background: var(--white); color: var(--text2);
    border: 1px solid var(--border-strong);
    font-family: 'Epilogue', sans-serif;
    font-size: 13px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
    flex-shrink: 0;
  }
  .ep-back-btn:hover { background: var(--bg); border-color: #bbbbb0; }

  /* ── Progress bar ── */
  .ep-prog-wrap {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 18px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .ep-prog-text {
    font-size: 12px; font-weight: 600;
    letter-spacing: 0.05em; text-transform: uppercase;
    color: var(--muted); white-space: nowrap;
  }
  .ep-prog-text em { font-style: normal; color: var(--accent); }
  .ep-prog-track {
    flex: 1; height: 4px;
    background: #eeeee8; border-radius: 4px; overflow: hidden;
  }
  .ep-prog-fill {
    height: 100%; background: var(--accent);
    border-radius: 4px; transition: width 0.3s ease;
  }

  /* ── Alert ── */
  .ep-alert {
    display: flex; align-items: center; gap: 10px;
    background: var(--danger-bg); border: 1px solid var(--danger-border);
    color: var(--danger); border-radius: 8px;
    padding: 11px 15px; font-size: 13px; margin-bottom: 20px;
  }

  /* ── Question card ── */
  .ep-q-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 22px 24px;
    margin-bottom: 14px;
    transition: border-color 0.15s;
  }
  .ep-q-card.answered { border-color: var(--accent-border); }

  .ep-q-num {
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 8px;
    display: flex; align-items: center; gap: 8px;
  }
  .ep-q-num::before {
    content: ''; display: block;
    width: 3px; height: 12px;
    background: var(--accent); border-radius: 2px;
  }
  .ep-q-card.answered .ep-q-num { color: var(--accent); }

  .ep-q-text {
    font-size: 15px; font-weight: 500;
    color: var(--text); line-height: 1.6;
    margin: 0 0 16px;
  }

  .ep-options { display: flex; flex-direction: column; gap: 8px; }

  .ep-option {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 14px; border-radius: 8px;
    border: 1.5px solid var(--border);
    cursor: pointer; transition: all 0.15s;
    background: var(--white);
    user-select: none;
  }
  .ep-option:hover { border-color: var(--accent-border); background: var(--accent-light); }
  .ep-option.selected {
    border-color: var(--accent);
    background: var(--accent-light);
  }

  .ep-option-radio {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid var(--border-strong);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.15s;
    background: var(--white);
  }
  .ep-option.selected .ep-option-radio {
    border-color: var(--accent);
    background: var(--accent);
  }
  .ep-option-radio-dot {
    width: 6px; height: 6px;
    border-radius: 50%; background: #fff;
    opacity: 0; transition: opacity 0.15s;
  }
  .ep-option.selected .ep-option-radio-dot { opacity: 1; }

  .ep-option-label {
    font-size: 12px; font-weight: 700;
    color: var(--muted); min-width: 18px;
    transition: color 0.15s;
  }
  .ep-option.selected .ep-option-label { color: var(--accent); }

  .ep-option-text {
    font-size: 14px; color: var(--text2);
    line-height: 1.5; transition: color 0.15s;
  }
  .ep-option.selected .ep-option-text { color: var(--text); }

  /* ── Footer ── */
  .ep-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 12px;
  }
  .ep-footer-info {
    font-size: 13px; color: var(--muted); font-weight: 400;
  }
  .ep-footer-info strong { color: var(--text2); font-weight: 600; }

  .ep-submit-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 24px; border-radius: 8px;
    background: var(--accent); color: #fff;
    font-family: 'Epilogue', sans-serif;
    font-size: 14px; font-weight: 600;
    border: none; cursor: pointer; transition: all 0.15s;
  }
  .ep-submit-btn:hover:not(:disabled) { background: #1649c5; }
  .ep-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  /* ── Result screen ── */
  .ep-result-wrap {
    max-width: 600px;
    margin: 0 auto;
  }

  .ep-result-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 40px 36px 36px;
    text-align: center;
    margin-bottom: 16px;
  }

  .ep-result-icon {
    width: 72px; height: 72px;
    border-radius: 20px;
    display: flex; align-items: center; justify-content: center;
    font-size: 34px; margin: 0 auto 20px;
  }
  .ep-result-icon.pass { background: var(--success-bg); border: 1px solid var(--success-border); }
  .ep-result-icon.fail { background: var(--danger-bg);  border: 1px solid var(--danger-border); }

  .ep-result-title {
    font-family: 'Playfair Display', serif;
    font-size: 26px; font-weight: 700;
    color: var(--text); margin: 0 0 8px;
  }
  .ep-result-msg {
    font-size: 14px; color: var(--muted);
    margin: 0 0 28px; line-height: 1.6;
  }

  .ep-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }
  .ep-stat {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px 12px;
  }
  .ep-stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 24px; font-weight: 700;
    margin-bottom: 4px;
  }
  .ep-stat-value.pass { color: var(--success); }
  .ep-stat-value.fail { color: var(--danger); }
  .ep-stat-value.neutral { color: var(--text); }
  .ep-stat-label {
    font-size: 11px; font-weight: 600;
    letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--muted);
  }

  .ep-result-actions {
    display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
  }

  .ep-btn {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 10px 18px; border-radius: 8px;
    font-family: 'Epilogue', sans-serif;
    font-size: 13px; font-weight: 600;
    cursor: pointer; border: none; transition: all 0.15s;
  }
  .ep-btn-primary { background: var(--accent); color: #fff; }
  .ep-btn-primary:hover { background: #1649c5; }
  .ep-btn-success {
    background: var(--success-bg); color: var(--success);
    border: 1px solid var(--success-border);
  }
  .ep-btn-success:hover { background: #e0f7f0; }
  .ep-btn-outline {
    background: var(--white); color: var(--text2);
    border: 1px solid var(--border-strong);
  }
  .ep-btn-outline:hover { background: var(--bg); border-color: #bbbbb0; }

  /* ── Feedback ── */
  .ep-feedback-card {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }
  .ep-feedback-header {
    padding: 16px 22px;
    border-bottom: 1px solid var(--border);
    background: #fcfcfb;
  }
  .ep-feedback-title {
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--muted);
    display: flex; align-items: center; gap: 8px;
  }
  .ep-feedback-title::before {
    content: ''; display: block;
    width: 3px; height: 12px;
    background: var(--accent); border-radius: 2px;
  }
  .ep-feedback-item {
    padding: 14px 22px;
    border-bottom: 1px solid #f3f3f0;
    font-size: 13px;
  }
  .ep-feedback-item:last-child { border-bottom: none; }
  .ep-feedback-q {
    font-weight: 500; color: var(--text2); margin-bottom: 5px;
  }
  .ep-feedback-ans {
    color: var(--success); font-weight: 600; font-size: 12px;
  }
  .ep-feedback-exp {
    color: var(--muted); margin-top: 3px; font-size: 12px; line-height: 1.6;
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
    setSubmitting(true);
    setError('');
    try {
      const answerList = exam.questions.map(q => ({
        questionId: q._id,
        selectedOption: answers[q._id],
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

  /* ── Result screen ── */
  if (result) {
    const passed = result.isPassed;
    return (
      <>
        <style>{styles}</style>
        <div className="ep-root">
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
                  <button className="ep-btn ep-btn-primary" onClick={handleRetry}>
                    Retry Exam
                  </button>
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
      </>
    );
  }

  /* ── Exam screen ── */
  return (
    <>
      <style>{styles}</style>
      <div className="ep-root">
        <div className="ep-wrap">

          <div className="ep-header">
            <div>
              <h1 className="ep-title">{exam?.title}</h1>
              <div className="ep-meta">
                <span>{totalCount} question{totalCount !== 1 ? 's' : ''}</span>
                <span className="ep-meta-sep">·</span>
                <span>Pass with {exam?.passingScore}%</span>
                {exam?.timeLimitMinutes && (
                  <>
                    <span className="ep-meta-sep">·</span>
                    <span>{exam.timeLimitMinutes} min</span>
                  </>
                )}
              </div>
            </div>
            <button className="ep-back-btn" onClick={() => navigate(-1)}>← Back</button>
          </div>

          <div className="ep-prog-wrap">
            <span className="ep-prog-text">
              <em>{answeredCount}</em> / {totalCount} answered
            </span>
            <div className="ep-prog-track">
              <div className="ep-prog-fill" style={{ width: `${progPct}%` }} />
            </div>
            <span className="ep-prog-text"><em>{progPct}%</em></span>
          </div>

          {error && <div className="ep-alert"><span>⚠</span> {error}</div>}

          {exam?.questions?.map((q, qi) => {
            const isAnswered = !!answers[q._id];
            return (
              <div key={q._id} className={`ep-q-card${isAnswered ? ' answered' : ''}`}>
                <div className="ep-q-num">Question {qi + 1}</div>
                <p className="ep-q-text">{q.questionText}</p>
                <div className="ep-options">
                  {q.options.map(opt => {
                    const selected = answers[q._id] === opt.label;
                    return (
                      <div
                        key={opt.label}
                        className={`ep-option${selected ? ' selected' : ''}`}
                        onClick={() => handleSelect(q._id, opt.label)}
                      >
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
              {submitting ? 'Submitting...' : 'Submit Exam →'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}