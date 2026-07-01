import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { LoadingCenter, Alert } from '../../components/common';

// ─── Templates ───────────────────────────────────────────
const PASTE_TEMPLATE = `Q: What is the capital of France?
A: London
B: Berlin
C: Paris
D: Rome
Answer: C
Explanation: Paris is the capital and most populous city of France.
Points: 1

Q: Which planet is closest to the Sun?
A: Earth
B: Mercury
C: Venus
D: Mars
Answer: B`;

const CSV_TEMPLATE = `questionText,A,B,C,D,correctAnswer,explanation,points
What is the capital of France?,London,Berlin,Paris,Rome,C,Paris is the capital of France.,1
Which planet is closest to the Sun?,Earth,Mercury,Venus,Mars,B,,1`;

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

// ─── Parse plain-text bulk paste ─────────────────────────
function parsePasteText(raw) {
  const errors = [];
  const questions = [];
  const blocks = raw.trim().split(/\n\s*\n+/).filter(Boolean);

  blocks.forEach((block, bi) => {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const q = { questionText: '', options: [], correctAnswer: '', explanation: '', points: 1 };

    for (const line of lines) {
      if (/^Q:/i.test(line))               q.questionText = line.replace(/^Q:/i, '').trim();
      else if (/^A:/i.test(line))          q.options.push({ label: 'A', text: line.replace(/^A:/i, '').trim() });
      else if (/^B:/i.test(line))          q.options.push({ label: 'B', text: line.replace(/^B:/i, '').trim() });
      else if (/^C:/i.test(line))          q.options.push({ label: 'C', text: line.replace(/^C:/i, '').trim() });
      else if (/^D:/i.test(line))          q.options.push({ label: 'D', text: line.replace(/^D:/i, '').trim() });
      else if (/^Answer:/i.test(line))     q.correctAnswer = line.replace(/^Answer:/i, '').trim().toUpperCase();
      else if (/^Explanation:/i.test(line)) q.explanation = line.replace(/^Explanation:/i, '').trim();
      else if (/^Points:/i.test(line)) {
        const p = parseInt(line.replace(/^Points:/i, '').trim(), 10);
        if (!isNaN(p) && p >= 1) q.points = p;
      }
    }

    if (!q.questionText)                         errors.push(`Block ${bi + 1}: Missing Q:`);
    else if (q.options.length !== 4)             errors.push(`Q${bi + 1} "${q.questionText.slice(0,30)}…": Need exactly 4 options (A B C D)`);
    else if (!['A','B','C','D'].includes(q.correctAnswer)) errors.push(`Q${bi + 1}: Answer must be A, B, C, or D`);
    else questions.push(q);
  });

  return { questions, errors };
}

// ─── Parse CSV ───────────────────────────────────────────
function parseCSV(raw) {
  const errors = [];
  const questions = [];
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) { return { questions: [], errors: ['CSV must have a header row + at least 1 data row'] }; }

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredCols = ['questiontext', 'a', 'b', 'c', 'd', 'correctanswer'];
  const missing = requiredCols.filter(c => !header.includes(c));
  if (missing.length) { return { questions: [], errors: [`Missing columns: ${missing.join(', ')}`] }; }

  const idx = k => header.indexOf(k);

  lines.slice(1).forEach((line, i) => {
    // simple CSV split (handles quoted fields with commas inside)
    const cols = [];
    let cur = '', inQ = false;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') { inQ = !inQ; }
      else if (line[c] === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += line[c]; }
    }
    cols.push(cur.trim());

    const get = k => (cols[idx(k)] || '').replace(/^"|"$/g, '').trim();
    const ans = get('correctanswer').toUpperCase();
    const pts = parseInt(get('points'), 10);

    if (!get('questiontext'))                       { errors.push(`Row ${i + 2}: Missing questionText`); return; }
    if (!['A','B','C','D'].includes(ans))           { errors.push(`Row ${i + 2}: correctAnswer must be A, B, C, or D`); return; }

    questions.push({
      questionText: get('questiontext'),
      options: [
        { label: 'A', text: get('a') },
        { label: 'B', text: get('b') },
        { label: 'C', text: get('c') },
        { label: 'D', text: get('d') },
      ],
      correctAnswer: ans,
      explanation: get('explanation') || '',
      points: (!isNaN(pts) && pts >= 1) ? pts : 1,
    });
  });

  return { questions, errors };
}

// ─── Preview Card ─────────────────────────────────────────
function PreviewQuestion({ q, idx }) {
  return (
    <div style={{
      border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px',
      marginBottom: 10, background: '#fafafa', fontSize: 13,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>
        Q{idx + 1}. {q.questionText}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', marginBottom: 6 }}>
        {q.options.map(o => (
          <div key={o.label} style={{
            color: o.label === q.correctAnswer ? '#16a34a' : '#374151',
            fontWeight: o.label === q.correctAnswer ? 700 : 400,
          }}>
            {o.label}. {o.text} {o.label === q.correctAnswer && '✓'}
          </div>
        ))}
      </div>
      {q.explanation && <div style={{ color: '#6b7280', fontStyle: 'italic' }}>💡 {q.explanation}</div>}
    </div>
  );
}

// ─── Bulk Import Panel ────────────────────────────────────
function BulkImportPanel({ onImport }) {
  const [tab, setTab] = useState('paste'); // 'paste' | 'csv'
  const [pasteText, setPasteText] = useState('');
  const [csvText, setCsvText] = useState('');
  const [preview, setPreview] = useState(null); // { questions, errors }
  const [mergeMode, setMergeMode] = useState('append'); // 'append' | 'replace'
  const fileRef = useRef();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCsvText(ev.target.result);
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePreview = () => {
    if (tab === 'paste') setPreview(parsePasteText(pasteText));
    else setPreview(parseCSV(csvText));
  };

  const handleImport = () => {
    if (!preview || preview.questions.length === 0) return;
    onImport(preview.questions, mergeMode);
    setPreview(null);
    setPasteText('');
    setCsvText('');
  };

  const downloadTemplate = () => {
    const content = tab === 'paste' ? PASTE_TEMPLATE : CSV_TEMPLATE;
    const mime = tab === 'paste' ? 'text/plain' : 'text/csv';
    const ext = tab === 'paste' ? 'txt' : 'csv';
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `exam-template.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card mb-16" style={{ border: '2px dashed #2563eb22', background: '#f0f7ff' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <strong style={{ fontSize: 15 }}>⚡ Bulk Import Questions</strong>
          <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 8 }}>
            Paste text or upload CSV — import dozens of questions at once
          </span>
        </div>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={downloadTemplate}
          title="Download template"
        >
          ↓ Template
        </button>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-8 mb-12">
        {[['paste', '📋 Paste Text'], ['csv', '📄 CSV / File']].map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => { setTab(k); setPreview(null); }}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
              border: tab === k ? '2px solid #2563eb' : '2px solid #e5e7eb',
              background: tab === k ? '#2563eb' : '#fff',
              color: tab === k ? '#fff' : '#374151',
              cursor: 'pointer',
            }}
          >{label}</button>
        ))}
      </div>

      {/* Paste tab */}
      {tab === 'paste' && (
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
            Format each question as a block separated by a blank line. Download the template to see an example.
          </div>
          <textarea
            value={pasteText}
            onChange={e => { setPasteText(e.target.value); setPreview(null); }}
            rows={10}
            placeholder={PASTE_TEMPLATE}
            style={{ fontFamily: 'monospace', fontSize: 12, width: '100%', resize: 'vertical' }}
          />
        </div>
      )}

      {/* CSV tab */}
      {tab === 'csv' && (
        <div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
            Required columns: <code>questionText, A, B, C, D, correctAnswer</code> · Optional: <code>explanation, points</code>
          </div>
          <div className="flex gap-8 mb-8">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => fileRef.current.click()}
            >📂 Upload CSV</button>
            <span style={{ color: '#6b7280', fontSize: 12, alignSelf: 'center' }}>or paste CSV below</span>
          </div>
          <textarea
            value={csvText}
            onChange={e => { setCsvText(e.target.value); setPreview(null); }}
            rows={8}
            placeholder={CSV_TEMPLATE}
            style={{ fontFamily: 'monospace', fontSize: 12, width: '100%', resize: 'vertical' }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-12 mt-12" style={{ flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handlePreview}
          disabled={!(tab === 'paste' ? pasteText.trim() : csvText.trim())}
        >🔍 Preview Questions</button>

        {preview && preview.questions.length > 0 && (
          <>
            <select
              value={mergeMode}
              onChange={e => setMergeMode(e.target.value)}
              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 13 }}
            >
              <option value="append">Append to existing</option>
              <option value="replace">Replace all questions</option>
            </select>
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: '#16a34a', color: '#fff', fontWeight: 600 }}
              onClick={handleImport}
            >✅ Import {preview.questions.length} Questions</button>
          </>
        )}
      </div>

      {/* Errors */}
      {preview && preview.errors.length > 0 && (
        <div style={{ marginTop: 12, padding: 10, background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6 }}>
          <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: 4 }}>
            ⚠ {preview.errors.length} error{preview.errors.length > 1 ? 's' : ''} found:
          </div>
          {preview.errors.map((e, i) => (
            <div key={i} style={{ color: '#dc2626', fontSize: 13 }}>• {e}</div>
          ))}
        </div>
      )}

      {/* Preview */}
      {preview && preview.questions.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, color: '#16a34a', marginBottom: 8 }}>
            ✓ {preview.questions.length} question{preview.questions.length > 1 ? 's' : ''} ready to import:
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
            {preview.questions.map((q, i) => <PreviewQuestion key={i} q={q} idx={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ExamForm ────────────────────────────────────────
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
  const [showBulk, setShowBulk] = useState(false);

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

  const handleBulkImport = (imported, mode) => {
    if (mode === 'replace') {
      setQuestions(imported);
    } else {
      setQuestions(prev => {
        // if the only existing question is the blank starter, replace it
        const isBlankOnly = prev.length === 1 && !prev[0].questionText.trim();
        return isBlankOnly ? imported : [...prev, ...imported];
      });
    }
    setShowBulk(false);
    setMsg(`${imported.length} question${imported.length > 1 ? 's' : ''} imported — review below and save when ready.`);
    setTimeout(() => setMsg(''), 5000);
  };

  const addQuestion = () =>
    setQuestions(prev => [...prev, { ...BLANK_Q, options: BLANK_Q.options.map(o => ({ ...o })) }]);

  const removeQuestion = (i) =>
    setQuestions(prev => prev.filter((_, idx) => idx !== i));

  const updateQuestion = (i, field, val) =>
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: val } : q));

  const updateOption = (qi, oi, val) =>
    setQuestions(prev => prev.map((q, idx) => {
      if (idx !== qi) return q;
      const opts = q.options.map((o, oidx) => oidx === oi ? { ...o, text: val } : o);
      return { ...q, options: opts };
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
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
        <button
          type="button"
          className="btn btn-sm"
          style={{
            background: showBulk ? '#374151' : '#2563eb',
            color: '#fff', fontWeight: 600,
          }}
          onClick={() => setShowBulk(v => !v)}
        >
          {showBulk ? '✕ Close Import' : '⚡ Bulk Import'}
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {msg && <Alert type="success">{msg}</Alert>}

      {/* Bulk import panel */}
      {showBulk && <BulkImportPanel onImport={handleBulkImport} />}

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

        {/* Question count badge */}
        <div className="flex justify-between items-center mb-12">
          <span style={{ fontWeight: 600, color: '#374151' }}>
            Questions
            <span style={{
              marginLeft: 8, background: '#2563eb', color: '#fff',
              borderRadius: 12, padding: '2px 9px', fontSize: 12, fontWeight: 700,
            }}>{questions.length}</span>
          </span>
          <button type="button" className="btn btn-outline btn-sm" onClick={addQuestion}>+ Add Manually</button>
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
                  <span style={{
                    fontWeight: 700, minWidth: 20,
                    color: opt.label === q.correctAnswer ? '#16a34a' : '#374151',
                  }}>{opt.label}.</span>
                  <input value={opt.text} onChange={e => updateOption(qi, oi, e.target.value)}
                    placeholder={`Option ${opt.label}`} required
                    style={{ borderColor: opt.label === q.correctAnswer ? '#16a34a' : '' }}
                  />
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