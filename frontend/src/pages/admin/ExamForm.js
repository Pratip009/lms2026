import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LoadingCenter, Alert } from '../../components/common';

const BLANK_Q = {
  questionText: '',
  options: [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
    { label: 'D', text: '' },
  ],
  correctAnswer: 'A',
  explanation: '',
  points: 1,
};

export default function AdminExamForm() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const [title, setTitle] = useState('');
  const [passingScore, setPassingScore] = useState(70);
  const [questions, setQuestions] = useState([{ ...BLANK_Q, options: BLANK_Q.options.map(o => ({ ...o })) }]);

  useEffect(() => {
    api.get(`/lessons/${lessonId}/exam`)
      .then(r => {
        const e = r.data.exam;
        setExam(e);
        setTitle(e.title);
        setPassingScore(e.passingScore);
        setQuestions(e.questions.map(q => ({
          ...q,
          options: q.options.map(o => ({ ...o })),
        })));
      })
      .catch(() => { /* No exam yet */ })
      .finally(() => setLoading(false));
  }, [lessonId]);

  const addQuestion = () => {
    setQuestions(prev => [...prev, { ...BLANK_Q, options: BLANK_Q.options.map(o => ({ ...o })) }]);
  };

  const removeQuestion = (i) => {
    setQuestions(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateQuestion = (i, field, val) => {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: val } : q));
  };

  const updateOption = (qi, oi, val) => {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx !== qi) return q;
      const opts = q.options.map((o, oidx) => oidx === oi ? { ...o, text: val } : o);
      return { ...q, options: opts };
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Validate
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) { setError(`Question ${i + 1} text is required`); return; }
      if (q.options.some(o => !o.text.trim())) { setError(`All 4 options required for Q${i + 1}`); return; }
    }

    setSaving(true);
    try {
      const payload = { title, passingScore: Number(passingScore), questions };
      if (exam) {
        await api.put(`/lessons/${lessonId}/exam`, payload);
        setMsg('Exam updated!');
      } else {
        await api.post(`/lessons/${lessonId}/exam`, payload);
        setMsg('Exam created!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingCenter />;

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="flex justify-between items-center mb-20">
        <div>
          <button className="btn btn-outline btn-sm mb-8"
            onClick={() => navigate(`/admin/courses/${courseId}/lessons`)}>← Back to Lessons</button>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{exam ? 'Edit Exam' : 'Create Exam'}</h1>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      <form onSubmit={handleSubmit}>
        <div className="card mb-16">
          <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Exam Settings</h3>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Exam Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Lesson 1 Quiz" />
            </div>
            <div className="form-group">
              <label className="form-label">Passing Score (%)</label>
              <input type="number" min="1" max="100" value={passingScore} onChange={e => setPassingScore(e.target.value)} />
            </div>
          </div>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="card mb-16">
            <div className="flex justify-between items-center mb-12">
              <strong>Question {qi + 1}</strong>
              {questions.length > 1 && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeQuestion(qi)}>Remove</button>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Question Text *</label>
              <textarea value={q.questionText} onChange={e => updateQuestion(qi, 'questionText', e.target.value)} rows={2} required />
            </div>
            <div className="form-group">
              <label className="form-label">Options (fill all 4)</label>
              {q.options.map((opt, oi) => (
                <div key={opt.label} className="flex items-center gap-8 mb-8">
                  <span style={{ fontWeight: 700, minWidth: 20 }}>{opt.label}.</span>
                  <input value={opt.text} onChange={e => updateOption(qi, oi, e.target.value)}
                    placeholder={`Option ${opt.label}`} required />
                </div>
              ))}
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Correct Answer</label>
                <select value={q.correctAnswer} onChange={e => updateQuestion(qi, 'correctAnswer', e.target.value)}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Points</label>
                <input type="number" min="1" value={q.points} onChange={e => updateQuestion(qi, 'points', Number(e.target.value))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Explanation (shown after passing)</label>
              <input value={q.explanation} onChange={e => updateQuestion(qi, 'explanation', e.target.value)} placeholder="Optional" />
            </div>
          </div>
        ))}

        <button type="button" className="btn btn-outline btn-full mb-16" onClick={addQuestion}>+ Add Question</button>

        <div className="flex gap-12">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Saving...' : exam ? 'Update Exam' : 'Create Exam'}
          </button>
          <button type="button" className="btn btn-outline btn-lg"
            onClick={() => navigate(`/admin/courses/${courseId}/lessons`)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
