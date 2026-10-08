import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as apiE from '../../services/enrollmentApi';
import { Text, Row } from './fields';
import {
  STEP_DEFS, STEP_SECTIONS, ProgramStep, PersonalStep, AgencyStep, EducationStep,
  WorkforceStep, EmergencyStep, BackgroundStep, DocumentsStep, SignStep,
} from './steps';
import './enroll.css';

const FUNDED = ['HCDFS', 'EQISS'];
const EDITABLE = ['Draft', 'NeedsInfo'];
const CATEGORY_COPY = {
  HCDFS: 'Referred by Hudson County (HCDFS)',
  EQISS: 'Referred by EQISS',
  PRIVATE: 'Paying for myself',
};

const errMsg = (e, fallback) => e?.response?.data?.message || fallback;

// Immutable set by dotted path; numeric segments create arrays.
function setPath(obj, path, value) {
  const [head, ...rest] = path.split('.');
  const key = /^\d+$/.test(head) ? Number(head) : head;
  const base = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  base[key] = rest.length ? setPath(base[key] ?? (/^\d+$/.test(rest[0]) ? [] : {}), rest.join('.'), value) : value;
  return base;
}

const formFromApplication = (a) => ({
  program: {
    requested: a.program?.requested || '',
    preferredLocation: a.program?.preferredLocation || '',
    supportInterests: (a.program?.supportInterests || []).map(String),
    preferredSchedule: a.program?.preferredSchedule || '',
  },
  personal: { ...(a.personal || {}), ssn: '' },
  agency: a.agency || {},
  education: a.education || {},
  funding: a.funding || {},
  workforce: a.workforce || {},
  emergency: a.emergency || {},
  background: a.background || {},
});

const payloadFor = (stepKey, form) => {
  const out = {};
  for (const section of STEP_SECTIONS[stepKey] || []) out[section] = form[section];
  if (out.personal) {
    const { ssn, hasSsn, ssnLast4, ...rest } = out.personal;
    out.personal = ssn ? { ...rest, ssn } : rest; // never send an empty SSN (would clear it)
  }
  return out;
};

// ─── Start screen ────────────────────────────────────────
function StartScreen({ onStarted }) {
  const [category, setCategory] = useState('');
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', gmail: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resumeEmail, setResumeEmail] = useState('');
  const [resumeMsg, setResumeMsg] = useState('');

  const start = async (e) => {
    e.preventDefault();
    if (!category) return setError('Choose how your program will be paid for.');
    setBusy(true);
    setError('');
    try {
      const { data } = await apiE.startApplication({ category, personal: f });
      apiE.saveSession(data.application._id, data.token);
      onStarted(data.application._id, data.token);
    } catch (err) {
      setError(errMsg(err, 'We could not start your application. Check your connection and try again.'));
    } finally {
      setBusy(false);
    }
  };

  const sendLink = async (e) => {
    e.preventDefault();
    try {
      const { data } = await apiE.requestResumeLink(resumeEmail);
      setResumeMsg(data.message);
    } catch (err) {
      setResumeMsg(errMsg(err, 'We could not send the link. Try again in a few minutes.'));
    }
  };

  return (
    <div className="enr-start">
      <div className="enr-start-intro">
        <h1>Enroll at Bright Horizon Institute</h1>
        <p>
          This replaces the paper enrollment packet. It takes about 30 minutes, and your answers are saved after every
          step, so you can stop and come back later.
        </p>
        <div className="enr-bring">
          <div className="enr-bring-title">Have these ready</div>
          <ul>
            <li>Your resume</li>
            <li>A state-issued photo ID, passport, or green card</li>
            <li>Your Social Security card</li>
            <li>A Gmail address — you'll use it for Google Classroom</li>
            <li>Contact details for an emergency contact</li>
          </ul>
        </div>
      </div>

      <form className="enr-card" onSubmit={start} noValidate>
        <fieldset className="enr-field">
          <legend className="enr-label">How will your program be paid for? <span className="enr-req">*</span></legend>
          <div className="enr-categories">
            {Object.entries(CATEGORY_COPY).map(([code, label]) => (
              <label key={code} className={`enr-category ${category === code ? 'on' : ''}`}>
                <input type="radio" name="category" value={code} checked={category === code} onChange={() => setCategory(code)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <div className="enr-hint">If a caseworker sent you to BHI, choose the agency that referred you.</div>
        </fieldset>
        <Row>
          <Text label="First name" required value={f.firstName} onChange={(v) => setF({ ...f, firstName: v })} autoComplete="given-name" />
          <Text label="Last name" required value={f.lastName} onChange={(v) => setF({ ...f, lastName: v })} autoComplete="family-name" />
        </Row>
        <Text label="Email" required type="email" value={f.email} onChange={(v) => setF({ ...f, email: v })} autoComplete="email"
          hint="We'll email you a private link to continue your application." />
        {error && <div className="enr-banner error" role="alert">{error}</div>}
        <button className="btn btn-primary btn-lg btn-full" disabled={busy}>{busy ? 'Starting…' : 'Start my application'}</button>
      </form>

      <form className="enr-resume" onSubmit={sendLink}>
        <div className="enr-label">Already started?</div>
        <div className="enr-resume-row">
          <input type="email" placeholder="Your email" aria-label="Your email" value={resumeEmail} onChange={(e) => setResumeEmail(e.target.value)} />
          <button className="btn btn-outline">Email me a link</button>
        </div>
        {resumeMsg && <div className="enr-hint" role="status">{resumeMsg}</div>}
      </form>
    </div>
  );
}

// ─── Submitted / read-only ───────────────────────────────
function SubmittedScreen({ application, onStartNew }) {
  return (
    <div className="enr-card enr-done">
      <div className="enr-done-mark" aria-hidden="true">✓</div>
      <h1>Application submitted</h1>
      <p>Your application number is <strong>{application.applicationNumber}</strong>. We sent a copy to {application.personal?.email}.</p>
      <p>
        BHI admissions will review your forms and documents and contact you about next steps, including the mandatory
        orientation before your first class. Questions? Call (201) 377-1594.
      </p>
      <button type="button" className="enr-linkbtn" onClick={onStartNew}>Start a different application on this device</button>
    </div>
  );
}

// ─── Wizard ──────────────────────────────────────────────
export default function Enroll() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState(() => apiE.loadSession());
  const [application, setApplication] = useState(null);
  const [config, setConfig] = useState(null);
  const [form, setForm] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [loading, setLoading] = useState(Boolean(session));
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState(null);
  const [fieldErrors, setFieldErrors] = useState([]);
  const [busyKind, setBusyKind] = useState('');
  const [accepted, setAccepted] = useState({});
  const [signature, setSignature] = useState('');
  const [typedName, setTypedName] = useState('');
  const topRef = useRef(null);

  // /enroll/continue?id=…&token=… → store the session and clean the URL.
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const id = q.get('id');
    const token = q.get('token');
    if (id && token) {
      apiE.saveSession(id, token);
      setSession({ id, token });
      navigate('/enroll', { replace: true });
    }
  }, [location.search, navigate]);

  const load = useCallback(async (s) => {
    setLoading(true);
    try {
      const { data } = await apiE.getApplication(s.id, s.token);
      const cfg = await apiE.getEnrollmentConfig(data.application.category);
      setApplication(data.application);
      setConfig(cfg.data);
      setForm(formFromApplication(data.application));
      const keys = STEP_DEFS.filter((d) => !d.fundedOnly || FUNDED.includes(data.application.category)).map((d) => d.key);
      const resumeAt = keys.indexOf(data.application.currentStep);
      setStepIdx(resumeAt > 0 ? resumeAt : 0);
    } catch (err) {
      apiE.clearSession();
      setSession(null);
      setBanner({ type: 'error', text: errMsg(err, 'We could not open that application.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (session) load(session); }, [session, load]);

  const funded = application ? FUNDED.includes(application.category) : false;
  const steps = useMemo(() => STEP_DEFS.filter((d) => !d.fundedOnly || funded), [funded]);
  const step = steps[stepIdx];

  const err = useCallback((path) => fieldErrors.find((e) => e.field === path)?.message, [fieldErrors]);
  // Editing a field clears its error (and errors on its sub-fields), so stale messages don't linger.
  const clearError = useCallback((path) => {
    setFieldErrors((errs) => (errs.some((e) => e.field === path || e.field.startsWith(`${path}.`) || path.startsWith(`${e.field}.`))
      ? errs.filter((e) => !(e.field === path || e.field.startsWith(`${path}.`) || path.startsWith(`${e.field}.`)))
      : errs));
  }, []);
  const set = useCallback((path, value) => { setForm((f) => setPath(f, path, value)); clearError(path); }, [clearError]);

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const persist = async (targetIdx) => {
    if (!STEP_SECTIONS[step.key]) return true; // documents/sign save themselves
    setSaving(true);
    try {
      const { data } = await apiE.saveApplication(session.id, session.token, {
        ...payloadFor(step.key, form),
        currentStep: steps[targetIdx]?.key || step.key,
      });
      setApplication(data.application);
      if (data.errors?.length) {
        setFieldErrors(data.errors.map((e) => ({ ...e, step: step.key })));
        setBanner({ type: 'error', text: data.errors[0].message });
        return false;
      }
      setForm((f) => ({ ...f, personal: { ...f.personal, ssn: '' } }));
      return true;
    } catch (e) {
      setBanner({ type: 'error', text: errMsg(e, 'Your answers were not saved. Check your connection and try again.') });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goTo = async (idx) => {
    if (idx === stepIdx) return;
    setBanner(null);
    const ok = await persist(idx);
    if (!ok) return;
    setFieldErrors((errs) => errs.filter((e) => e.step !== step.key));
    setStepIdx(idx);
    scrollTop();
  };

  const onUpload = async (kind, file) => {
    if (file.size > 10 * 1024 * 1024) return setBanner({ type: 'error', text: `${file.name} is larger than 10 MB. Upload a smaller file or a photo instead.` });
    setBusyKind(kind);
    setBanner(null);
    try {
      const { data } = await apiE.uploadDocument(session.id, session.token, kind, file);
      setApplication(data.application);
      setFieldErrors((errs) => errs.filter((e) => e.field !== `documents.${kind}`));
    } catch (e) {
      setBanner({ type: 'error', text: errMsg(e, 'The upload failed. Try again.') });
    } finally {
      setBusyKind('');
    }
  };

  const onRemove = async (docId) => {
    try {
      const { data } = await apiE.deleteDocument(session.id, session.token, docId);
      setApplication(data.application);
    } catch (e) {
      setBanner({ type: 'error', text: errMsg(e, 'Could not remove the file.') });
    }
  };

  const submit = async () => {
    setSaving(true);
    setBanner(null);
    try {
      const { data } = await apiE.submitApplication(session.id, session.token, { signatureImage: signature, typedName, agreements: accepted });
      setApplication(data.application);
      setFieldErrors([]);
      window.scrollTo(0, 0);
    } catch (e) {
      const errors = e.response?.data?.errors || [];
      setFieldErrors(errors);
      setBanner({ type: 'error', text: errMsg(e, 'Submission failed. Try again.'), errors });
      scrollTop();
    } finally {
      setSaving(false);
    }
  };

  const startNew = () => {
    apiE.clearSession();
    setSession(null);
    setApplication(null);
    setForm(null);
    setBanner(null);
    setFieldErrors([]);
    setStepIdx(0);
  };

  // ─── Render ────────────────────────────────────────────
  if (loading) return <div className="enr-page"><div className="loading-center"><div className="spinner spinner-lg" /></div></div>;

  if (!session || !application) {
    return (
      <div className="enr-page">
        {banner && <div className="enr-banner error enr-narrow" role="alert">{banner.text}</div>}
        <StartScreen onStarted={(id, token) => setSession({ id, token })} />
      </div>
    );
  }

  if (!EDITABLE.includes(application.status)) {
    return <div className="enr-page"><SubmittedScreen application={application} onStartNew={startNew} /></div>;
  }

  const stepErrorCount = (key) => fieldErrors.filter((e) => e.step === key).length;
  const isLast = stepIdx === steps.length - 1;
  const common = { form, set, err, config, funded, application };

  return (
    <div className="enr-page" ref={topRef}>
      <div className="enr-shell">
        <aside className="enr-rail" aria-label="Application steps">
          <div className="enr-rail-head">
            <div className="enr-rail-number">{application.applicationNumber}</div>
            <div className="enr-rail-cat">{CATEGORY_COPY[application.category]}</div>
          </div>
          <ol>
            {steps.map((s, i) => (
              <li key={s.key}>
                <button
                  type="button" onClick={() => goTo(i)} disabled={saving}
                  className={`${i === stepIdx ? 'current' : ''} ${i < stepIdx ? 'past' : ''} ${stepErrorCount(s.key) ? 'flag' : ''}`}
                  aria-current={i === stepIdx ? 'step' : undefined}
                >
                  <span className="enr-rail-n">{i + 1}</span>
                  <span>{s.title}</span>
                  {stepErrorCount(s.key) > 0 && <span className="enr-rail-flag" aria-label={`${stepErrorCount(s.key)} items to fix`}>{stepErrorCount(s.key)}</span>}
                </button>
              </li>
            ))}
          </ol>
          <div className="enr-rail-foot">Saved automatically when you move between steps.</div>
        </aside>

        <main className="enr-main">
          <div className="enr-mobile-progress" aria-hidden="true">
            Step {stepIdx + 1} of {steps.length}
            <div className="enr-mobile-bar"><span style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }} /></div>
          </div>

          {application.status === 'NeedsInfo' && application.infoRequest && (
            <div className="enr-banner info">
              <strong>BHI needs more information:</strong> {application.infoRequest}
              <div className="enr-hint">Make the changes, then sign and submit again on the last step.</div>
            </div>
          )}

          <header className="enr-step-head">
            <h1>{step.title}</h1>
            <p>{step.blurb}</p>
          </header>

          {banner && (
            <div className={`enr-banner ${banner.type}`} role="alert">
              {banner.text}
              {banner.errors?.length > 0 && (
                <ul className="enr-fixlist">
                  {steps.filter((s) => stepErrorCount(s.key)).map((s) => (
                    <li key={s.key}>
                      <button type="button" className="enr-linkbtn" onClick={() => { setStepIdx(steps.indexOf(s)); setBanner(null); scrollTop(); }}>
                        {s.title}
                      </button>
                      : {fieldErrors.filter((e) => e.step === s.key).map((e) => e.message).join(' ')}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="enr-card">
            {step.key === 'program' && <ProgramStep {...common} />}
            {step.key === 'personal' && <PersonalStep {...common} />}
            {step.key === 'agency' && <AgencyStep {...common} />}
            {step.key === 'education' && <EducationStep {...common} />}
            {step.key === 'workforce' && <WorkforceStep {...common} />}
            {step.key === 'emergency' && <EmergencyStep {...common} />}
            {step.key === 'background' && <BackgroundStep {...common} />}
            {step.key === 'documents' && <DocumentsStep {...common} onUpload={onUpload} onRemove={onRemove} busyKind={busyKind} />}
            {step.key === 'sign' && (
              <SignStep
                {...common}
                accepted={accepted}
                setAccepted={(next) => {
                  Object.keys(next).filter((k) => next[k] && !accepted[k]).forEach((k) => clearError(`agreements.${k}`));
                  setAccepted(next);
                }}
                signature={signature} setSignature={(v) => { setSignature(v); if (v) clearError('signature'); }}
                typedName={typedName} setTypedName={(v) => { setTypedName(v); clearError('typedName'); }}
              />
            )}
          </div>

          <div className="enr-nav">
            {stepIdx > 0 ? (
              <button type="button" className="btn btn-outline" disabled={saving} onClick={() => goTo(stepIdx - 1)}>Back</button>
            ) : <span />}
            {isLast ? (
              <button type="button" className="btn btn-primary btn-lg" disabled={saving} onClick={submit}>
                {saving ? 'Submitting…' : application.status === 'NeedsInfo' ? 'Resubmit application' : 'Submit application'}
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-lg" disabled={saving || Boolean(busyKind)} onClick={() => goTo(stepIdx + 1)}>
                {saving ? 'Saving…' : 'Save and continue'}
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
