import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LoadingCenter, Alert, Modal } from '../../../components/common';
import {
  getApplicationAdmin, revealApplicationSsn, updateApplicationStatus, addApplicationNote,
  reviewApplicationDocument, getApplicationDocumentUrl, uploadApplicationDocument,
  convertApplication, downloadApplicationPdf, getClasses,
} from '../../../services/bhiApi';
import { STATUS_META, CATEGORY_LABEL, CAMPUS_LABEL } from './Applications';

const yn = (v) => (v === 'yes' ? 'Yes' : v === 'no' ? 'No' : '—');
const val = (v) => (v === undefined || v === null || v === '' ? '—' : String(v));
const money = (n) => `$${Number(n || 0).toLocaleString('en-US')}`;
const fmt = (d) => (d ? new Date(d).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '—');
const errMsg = (e, f) => e?.response?.data?.message || f;

const ACTION_COPY = {
  UnderReview: { label: 'Start review', btn: 'btn-outline' },
  NeedsInfo: { label: 'Request more info', btn: 'btn-outline', needsMessage: true, prompt: 'What does the applicant need to fix or provide? This is emailed to them with a link to update their application.' },
  Approved: { label: 'Approve', btn: 'btn-success' },
  Rejected: { label: 'Reject', btn: 'btn-danger', needsMessage: true, prompt: 'Reason for rejecting (internal note).' },
};
const ACTIVITY_COPY = {
  created: 'Application started', submitted: 'Submitted', resubmitted: 'Resubmitted', status_changed: 'Status changed',
  document_uploaded: 'Document uploaded', document_removed: 'Document removed', document_reviewed: 'Document reviewed',
  document_viewed: 'Document viewed', ssn_viewed: 'SSN viewed', pdf_downloaded: 'PDF downloaded', enrolled: 'Enrolled as student',
  resume_link_requested: 'Resume link requested',
};

function KV({ rows }) {
  return (
    <dl className="appd-kv">
      {rows.filter(Boolean).map(([k, v]) => (
        <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>
      ))}
    </dl>
  );
}

function Section({ title, children }) {
  return <section className="card appd-section"><h3>{title}</h3>{children}</section>;
}

// ─── Overview tab ────────────────────────────────────────
function Overview({ a, onRevealSsn, ssn }) {
  const p = a.personal || {};
  const ad = p.address || {};
  const e = a.education || {};
  const w = a.workforce || {};
  const wh = w.workHistory || {};
  const em = a.emergency || {};
  const b = a.background || {};
  const conds = Object.entries(em.conditions || {}).filter(([, v]) => v).map(([k]) => k);
  return (
    <div className="appd-grid">
      <Section title="Program">
        <KV rows={[
          ['Program', a.program?.requested ? `${a.program.requested.name}${a.program.requested.courseCode ? ` (${a.program.requested.courseCode})` : ''}` : '—'],
          ['Campus', CAMPUS_LABEL[a.program?.preferredLocation] || '—'],
          ['Support classes', (a.program?.supportInterests || []).map((s) => s.name).join(', ') || 'None'],
          ['Preferred schedule', val(a.program?.preferredSchedule)],
        ]} />
      </Section>

      <Section title="Student data">
        <KV rows={[
          ['Name', [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ')],
          p.otherNames && ['Other names', p.otherNames],
          ['Date of birth', val(p.dob)],
          ['SSN', p.ssnLast4 ? (
            <span>{ssn || `***-**-${p.ssnLast4}`}{' '}
              {!ssn && <button className="appd-link" onClick={onRevealSsn}>Show (logged)</button>}
            </span>
          ) : '—'],
          ['Address', [ad.street, ad.city, ad.state, ad.zip].filter(Boolean).join(', ') || '—'],
          ['County', val(ad.county)],
          ['Cell / home / work', [p.cellPhone, p.homePhone, p.workPhone].map(val).join(' / ')],
          ['Email', val(p.email)],
          ['Gmail', val(p.gmail)],
          ['Gender', val(p.gender)],
          ['Hispanic/Latino', yn(p.hispanic)],
          ['Race', (p.race || []).join(', ') || '—'],
          ['US citizen', yn(p.usCitizen)],
          p.usCitizen === 'no' && ['Alien reg. #', `${val(p.alienRegNumber)} (exp. ${val(p.alienRegExpiration)})`],
          (p.social?.facebook || p.social?.twitter || p.social?.linkedin) && ['Social', [p.social.facebook, p.social.twitter, p.social.linkedin].filter(Boolean).join(' · ')],
        ]} />
      </Section>

      {a.funded && (
        <Section title="Agency & caseworker">
          <KV rows={[
            ['Case number', val(a.agency?.caseNumber)],
            ['Benefit status', val(a.agency?.benefitStatus)],
            ['Caseworker', val(a.agency?.caseworker?.name)],
            ['Caseworker contact', [a.agency?.caseworker?.email, a.agency?.caseworker?.phone].filter(Boolean).join(' · ') || '—'],
          ]} />
        </Section>
      )}

      {!a.funded && (
        <Section title="Payment">
          <KV rows={[
            ['Funding plan', val(a.funding?.plan)],
            ['Seeking Workforce funding', yn(a.funding?.seekingWorkforceFunding)],
            ...(a.feeSnapshot?.total != null ? [
              ['Tuition / fees / books', `${money(a.feeSnapshot.tuition)} / ${money(a.feeSnapshot.fees)} / ${money(a.feeSnapshot.books)}`],
              ['Tools / other', `${money(a.feeSnapshot.tools)} / ${money(a.feeSnapshot.other)}`],
              ['Program total (agreed)', <strong>{money(a.feeSnapshot.total)}</strong>],
              ['Due at enrollment', `${money(a.feeSnapshot.applicationFee)} application + ${money(a.feeSnapshot.registrationFee)} registration`],
            ] : []),
          ]} />
        </Section>
      )}

      <Section title="Education">
        <KV rows={[
          ['High school', [e.highSchoolName, e.highSchoolAddress].filter(Boolean).join(', ') || '—'],
          ['Year completed', val(e.highSchoolYear)],
          ['Diploma / GED / seeking GED', `${yn(e.hasDiploma)} / ${yn(e.hasGed)} / ${yn(e.seekingGed)}`],
          ['TABE reading / math', `${val(e.tabeReading)} / ${val(e.tabeMath)}`],
          ['College', [e.collegeName, e.collegeDegree, e.collegeYear].filter(Boolean).join(', ') || '—'],
          ['Met Workforce counselor', yn(e.metWorkforceCounselor)],
          ['Toured facility', yn(e.hadFacilityTour)],
        ]} />
      </Section>

      <Section title="Workforce registration">
        <KV rows={[
          ['School status', val(w.schoolStatus)],
          ['Employment status', val(w.employmentStatus)],
          ['Job objective', val(w.jobObjective)],
          ['Shifts', (w.shifts || []).join(', ') || '—'],
          ['Min. pay / travel', `${val(w.minimumPay)} / ${val(w.travelDistance)}`],
          ['Interested in training', yn(w.interestedInTraining)],
          (wh.employer || wh.jobTitle) && ['Last job', `${val(wh.jobTitle)} at ${val(wh.employer)} (${val(wh.startDate)} – ${val(wh.endDate)})`],
          ['Driver\'s license', (w.driversLicense || []).join(', ') || '—'],
          w.military?.branch && ['Military', `${w.military.branch}${w.military.campaignVeteran ? ', campaign veteran' : ''}`],
        ]} />
      </Section>

      <Section title="Emergency & medical">
        <KV rows={[
          ...(em.contacts || []).filter((c) => c?.name).map((c, i) => [`Contact ${i + 1}`, `${c.name} (${val(c.relationship)}) ${val(c.phone)}`]),
          ['Physician', `${val(em.physicianName)} ${em.physicianPhone || ''}`],
          ['Conditions', [...conds, em.otherCondition].filter(Boolean).join(', ') || 'None reported'],
          em.conditionsExplain && ['Explanation', em.conditionsExplain],
          ['Drug reaction', `${yn(em.drugReaction)} ${em.drugReactionExplain || ''}`],
          ['Medications', `${yn(em.takingMedication)} ${em.medicationExplain || ''}`],
          ['Infections', `${yn(em.infections)} ${em.infectionsExplain || ''}`],
        ]} />
      </Section>

      <Section title="Background check">
        <KV rows={[
          ['Arrested / convicted', yn(b.arrestedOrConvicted)],
          ['Abuse / sexual crimes', yn(b.abuseOrSexualCrimes)],
          ['Lifestyle concern', yn(b.lifestyleConcern)],
          ['Explanation', val(b.explanation)],
          ['Expungement', val(b.expungement)],
        ]} />
      </Section>
    </div>
  );
}

// ─── Documents tab ───────────────────────────────────────
function Documents({ a, types, onChanged, setError }) {
  const [busy, setBusy] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [staffKind, setStaffKind] = useState(types.staff[0]?.kind || 'other');
  const allTypes = [...types.applicant, ...types.staff];
  const label = (kind) => allTypes.find((t) => t.kind === kind)?.label || kind;

  const open = async (doc, download) => {
    // Open the tab synchronously so pop-up blockers allow it, then point it at the signed URL.
    const win = download ? null : window.open('', '_blank');
    try {
      const { data } = await getApplicationDocumentUrl(a._id, doc._id, download);
      if (win) win.location = data.url; else window.location = data.url;
    } catch (e) {
      if (win) win.close();
      setError(errMsg(e, 'Could not open the document.'));
    }
  };
  const review = async (doc, status, note) => {
    setBusy(doc._id);
    try { await reviewApplicationDocument(a._id, doc._id, { status, note }); onChanged(); }
    catch (e) { setError(errMsg(e, 'Could not update the document.')); }
    finally { setBusy(''); setRejecting(null); setRejectNote(''); }
  };
  const staffUpload = async (file) => {
    setBusy('upload');
    try { await uploadApplicationDocument(a._id, staffKind, file); onChanged(); }
    catch (e) { setError(errMsg(e, 'Upload failed.')); }
    finally { setBusy(''); }
  };

  const missing = types.applicant.filter((t) => t.required && !(a.documents || []).some((d) => d.kind === t.kind));

  return (
    <>
      {missing.length > 0 && <Alert type="warning">Missing: {missing.map((m) => m.label).join(', ')}</Alert>}
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Document</th><th>File</th><th>From</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {(a.documents || []).length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--gray-500)' }}>No documents yet.</td></tr>}
            {(a.documents || []).map((d) => (
              <tr key={d._id}>
                <td style={{ fontWeight: 600 }}>{label(d.kind)}</td>
                <td>{d.fileName}<div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{fmt(d.createdAt)}</div></td>
                <td>{d.uploadedBy === 'staff' ? 'Staff' : 'Applicant'}</td>
                <td>
                  <span className={`badge ${d.review?.status === 'verified' ? 'badge-green' : d.review?.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>
                    {d.review?.status === 'verified' ? 'Verified' : d.review?.status === 'rejected' ? 'Rejected' : 'Not checked'}
                  </span>
                  {d.review?.note && <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{d.review.note}</div>}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <button className="btn btn-outline btn-sm" onClick={() => open(d)}>View</button>{' '}
                  <button className="btn btn-outline btn-sm" onClick={() => open(d, true)}>Download</button>{' '}
                  {d.review?.status !== 'verified' && <button className="btn btn-success btn-sm" disabled={busy === d._id} onClick={() => review(d, 'verified')}>Verify</button>}{' '}
                  {d.uploadedBy === 'applicant' && d.review?.status !== 'rejected' && <button className="btn btn-outline btn-sm" onClick={() => setRejecting(d)}>Reject</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3 style={{ marginBottom: 8 }}>Add to student file</h3>
        <p style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 10 }}>Progress reports, attendance sheets, certifications, transcripts, employment verification, or a referral form from the caseworker.</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={staffKind} onChange={(e) => setStaffKind(e.target.value)} style={{ flex: '1 1 220px' }}>
            {allTypes.filter((t) => !['resume', 'photo_id', 'ss_card'].includes(t.kind)).map((t) => <option key={t.kind} value={t.kind}>{t.label}</option>)}
          </select>
          <label className="btn btn-primary" style={{ position: 'relative', overflow: 'hidden' }}>
            {busy === 'upload' ? 'Uploading…' : 'Upload file'}
            <input type="file" disabled={busy === 'upload'} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) staffUpload(f); }} />
          </label>
        </div>
      </div>

      {rejecting && (
        <Modal title={`Reject ${label(rejecting.kind)}`} onClose={() => setRejecting(null)}>
          <div className="form-group">
            <label className="form-label">What's wrong with it? (shown to the applicant)</label>
            <textarea rows={3} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} placeholder="e.g. The photo is blurry — upload a clearer picture of the front." />
          </div>
          <button className="btn btn-danger btn-full" disabled={!rejectNote.trim()} onClick={() => review(rejecting, 'rejected', rejectNote)}>Reject document</button>
          <p className="form-hint" style={{ marginTop: 8 }}>To let the applicant re-upload, also use "Request more info" on the application.</p>
        </Modal>
      )}
    </>
  );
}

// ─── Agreements tab ──────────────────────────────────────
function Agreements({ a, agreements }) {
  return (
    <>
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Agreement</th><th>Signed as</th><th>When</th><th>IP</th><th>Wording version</th></tr></thead>
          <tbody>
            {agreements.map((ag) => {
              const s = (a.signatures || []).find((x) => x.key === ag.key);
              return (
                <tr key={ag.key}>
                  <td style={{ fontWeight: 600 }}>{ag.title}{ag.optional && <span style={{ color: 'var(--gray-500)', fontWeight: 400 }}> (optional)</span>}</td>
                  <td>{s?.accepted ? s.typedName : <span style={{ color: 'var(--gray-500)' }}>{ag.optional ? 'Declined' : 'Not signed'}</span>}</td>
                  <td>{s?.accepted ? fmt(s.signedAt) : '—'}</td>
                  <td>{s?.accepted ? s.ip : '—'}</td>
                  <td>{s?.version || ag.version}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {a.signatureImage && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3 style={{ marginBottom: 8 }}>Drawn signature</h3>
          <img src={a.signatureImage} alt={`Signature of ${a.personal?.firstName} ${a.personal?.lastName}`} style={{ maxWidth: 360, width: '100%', border: '1px solid var(--gray-200)', borderRadius: 6 }} />
        </div>
      )}
    </>
  );
}

// ─── Notes & activity tab ────────────────────────────────
function Activity({ a, onChanged, setError }) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { await addApplicationNote(a._id, text); setText(''); onChanged(); }
    catch (err) { setError(errMsg(err, 'Could not save note.')); }
    finally { setSaving(false); }
  };
  return (
    <div className="appd-grid">
      <Section title="Staff notes">
        <form onSubmit={save} style={{ marginBottom: 12 }}>
          <textarea rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a note for Mahek, Nancy, and Zeba…" style={{ width: '100%' }} />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 6 }} disabled={!text.trim() || saving}>Add note</button>
        </form>
        {[...(a.notes || [])].reverse().map((n) => (
          <div key={n._id} className="appd-note">
            <div>{n.text}</div>
            <div className="appd-meta">{n.by?.name || 'Staff'} · {fmt(n.at)}</div>
          </div>
        ))}
        {!(a.notes || []).length && <div style={{ color: 'var(--gray-500)', fontSize: 13 }}>No notes yet.</div>}
      </Section>
      <Section title="Activity">
        {[...(a.activity || [])].reverse().map((x, i) => (
          <div key={i} className="appd-note">
            <div><strong>{ACTIVITY_COPY[x.action] || x.action}</strong>{x.detail ? ` — ${x.detail}` : ''}</div>
            <div className="appd-meta">{x.byApplicant ? 'Applicant' : x.by?.name || 'Staff'} · {fmt(x.at)}</div>
          </div>
        ))}
      </Section>
    </div>
  );
}

// ─── Enroll tab ──────────────────────────────────────────
function Enroll({ a, onChanged }) {
  const [classes, setClasses] = useState([]);
  const [f, setF] = useState({
    studentId: '', location: a.program?.preferredLocation || '', courseCode: a.program?.requested?.courseCode || '',
    primary: { class: '', startDate: '', expectedEndDate: '' }, support: { class: '', startDate: '', expectedEndDate: '' },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { getClasses().then((r) => setClasses(r.data.classes)).catch(() => {}); }, []);

  if (a.status === 'Enrolled' && a.student) {
    return (
      <div className="card">
        <h3 style={{ marginBottom: 6 }}>Enrolled</h3>
        <p>This applicant is student <strong>{a.student.studentId}</strong>. Class assignments, attendance and status are managed from their student profile.</p>
        <Link className="btn btn-primary" to={`/admin/bhi/students/${a.student._id}`} style={{ marginTop: 10, display: 'inline-block' }}>Open student profile</Link>
      </div>
    );
  }
  if (a.status !== 'Approved') {
    return <div className="card" style={{ color: 'var(--gray-600)' }}>Approve the application to enroll this applicant as a student and assign classes.</div>;
  }

  const programId = a.program?.requested?._id;
  const primaryClasses = classes.filter((c) => c.program?.type === 'primary');
  const matching = primaryClasses.filter((c) => c.program?._id === programId);
  const supportClasses = classes.filter((c) => c.program?.type === 'support' || c.program?.offeredAsSupport);
  const classLabel = (c) => `${c.program?.name}${c.sectionName ? ` — ${c.sectionName}` : ''}${c.location ? ` (${CAMPUS_LABEL[c.location]})` : ''}${c.teacher ? ` · ${c.teacher.name}` : ' · no teacher yet'}`;
  const setRole = (role, k, v) => setF((s) => ({ ...s, [role]: { ...s[role], [k]: v } }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await convertApplication(a._id, {
        studentId: f.studentId, location: f.location, courseCode: f.courseCode,
        primary: f.primary.class ? f.primary : undefined,
        support: f.support.class ? f.support : undefined,
      });
      onChanged();
    } catch (err) {
      setError(errMsg(err, 'Could not enroll this student.'));
    } finally {
      setSaving(false);
    }
  };

  const classPicker = (role, title, options, hint) => (
    <fieldset style={{ border: '1px solid var(--gray-200)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
      <legend style={{ fontWeight: 600, padding: '0 6px' }}>{title}</legend>
      <div className="form-group">
        <select value={f[role].class} onChange={(e) => setRole(role, 'class', e.target.value)}>
          <option value="">Assign later</option>
          {options.map((c) => <option key={c._id} value={c._id}>{classLabel(c)}</option>)}
        </select>
        {hint && <div className="form-hint">{hint}</div>}
      </div>
      {f[role].class && (
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="form-group" style={{ flex: 1 }}><label className="form-label">Start date *</label><input type="date" required value={f[role].startDate} onChange={(e) => setRole(role, 'startDate', e.target.value)} /></div>
          <div className="form-group" style={{ flex: 1 }}><label className="form-label">Expected end date *</label><input type="date" required value={f[role].expectedEndDate} onChange={(e) => setRole(role, 'expectedEndDate', e.target.value)} /></div>
        </div>
      )}
    </fieldset>
  );

  return (
    <form className="card" onSubmit={submit} style={{ maxWidth: 720 }}>
      <h3 style={{ marginBottom: 4 }}>Enroll as student</h3>
      <p style={{ color: 'var(--gray-500)', fontSize: 13, marginBottom: 14 }}>
        Creates the student record used for class rosters and attendance. Contact, case and caseworker details are copied from this application.
      </p>
      {error && <Alert type="error">{error}</Alert>}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: '1 1 160px' }}><label className="form-label">Student ID *</label><input required value={f.studentId} onChange={(e) => setF({ ...f, studentId: e.target.value })} /></div>
        <div className="form-group" style={{ flex: '1 1 160px' }}><label className="form-label">Course code</label><input value={f.courseCode} onChange={(e) => setF({ ...f, courseCode: e.target.value })} /></div>
        <div className="form-group" style={{ flex: '1 1 180px' }}>
          <label className="form-label">Campus</label>
          <select value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })}>
            <option value="">Not set</option>
            {Object.entries(CAMPUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
      </div>
      {classPicker('primary', 'Primary program class', matching.length ? matching : primaryClasses,
        matching.length ? null : `No classes exist yet for ${a.program?.requested?.name || 'this program'}. Create one under BHI Classes, or assign later.`)}
      {classPicker('support', 'Support class (ESL, GED, Digital Literacy…)', supportClasses,
        (a.program?.supportInterests || []).length ? `Applicant asked about: ${a.program.supportInterests.map((s) => s.name).join(', ')}` : null)}
      <button className="btn btn-primary" disabled={saving}>{saving ? 'Enrolling…' : 'Enroll student'}</button>
    </form>
  );
}

// ─── Page ────────────────────────────────────────────────
export default function AdminBhiApplicationDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('overview');
  const [ssn, setSsn] = useState('');
  const [action, setAction] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    getApplicationAdmin(id)
      .then((r) => { setData(r.data); setError(''); })
      .catch((e) => setError(errMsg(e, 'Failed to load application.')))
      .finally(() => setLoading(false));
  }, [id]);
  useEffect(() => { load(); }, [load]);

  // Approving with unresolved required documents is allowed (BHI's call), but never silent.
  const approvalWarnings = () => {
    const docs = data.application.documents || [];
    return data.documentTypes.applicant.filter((t) => t.required).map((t) => {
      const d = docs.find((x) => x.kind === t.kind);
      if (!d) return `${t.label}: missing`;
      if (d.review?.status === 'rejected') return `${t.label}: rejected`;
      if (d.review?.status !== 'verified') return `${t.label}: not checked yet`;
      return null;
    }).filter(Boolean);
  };

  const doStatus = async (status, msg) => {
    if (status === 'Approved') {
      const issues = approvalWarnings();
      if (issues.length && !window.confirm(`These required documents aren't verified:\n\n• ${issues.join('\n• ')}\n\nApprove anyway?`)) return;
    }
    setSaving(true);
    try {
      const { data: r } = await updateApplicationStatus(id, { status, message: msg });
      setAction(null);
      setMessage('');
      setNotice(status === 'NeedsInfo' ? (r.emailed ? 'Request sent — the applicant was emailed a link to update their application.' : 'Status updated, but the email failed to send. Contact the applicant directly.') : '');
      if (status === 'Approved') setTab('enroll');
      load();
    } catch (e) {
      setError(errMsg(e, 'Could not update status.'));
    } finally {
      setSaving(false);
    }
  };
  const reveal = async () => {
    try { const { data: r } = await revealApplicationSsn(id); setSsn(r.ssn); }
    catch (e) { setError(errMsg(e, 'Could not show SSN.')); }
  };

  if (loading) return <div className="page"><div className="container"><LoadingCenter /></div></div>;
  if (!data) return <div className="page"><div className="container"><Alert type="error">{error}</Alert></div></div>;

  const a = data.application;
  const meta = STATUS_META[a.status] || {};
  const docs = a.documents || [];
  const TABS = [
    ['overview', 'Forms'],
    ['documents', `Documents (${docs.length})`],
    ['agreements', 'Signatures'],
    ['activity', `Notes & activity${(a.notes || []).length ? ` (${a.notes.length})` : ''}`],
    ['enroll', 'Enroll'],
  ];

  return (
    <div className="page">
      <style>{`
        .appd-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 12px; }
        .appd-section h3 { font-size: 15px; margin-bottom: 10px; }
        .appd-kv { display: grid; grid-template-columns: minmax(120px, 38%) 1fr; gap: 6px 12px; font-size: 13.5px; }
        .appd-kv dt { color: var(--gray-500); }
        .appd-kv dd { margin: 0; overflow-wrap: anywhere; }
        .appd-link { background: none; border: 0; padding: 0; color: var(--primary); font-size: 12.5px; text-decoration: underline; }
        .appd-note { padding: 8px 0; border-bottom: 1px solid var(--gray-200); font-size: 13.5px; }
        .appd-meta { color: var(--gray-500); font-size: 12px; margin-top: 2px; }
      `}</style>
      <div className="container">
        <Link to="/admin/bhi/applications" style={{ fontSize: 13 }}>← All applications</Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, margin: '8px 0 16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>{a.personal?.firstName} {a.personal?.lastName}</h1>
            <div style={{ color: 'var(--gray-500)', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{a.applicationNumber}</span>
              <span className={`badge ${meta.badge}`}>{meta.label}</span>
              <span>{CATEGORY_LABEL[a.category]}</span>
              <span>Submitted {fmt(a.submittedAt)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data.allowedTransitions.map((s) => {
              const c = ACTION_COPY[s];
              if (!c) return null;
              return (
                <button key={s} className={`btn ${c.btn} btn-sm`} disabled={saving}
                  onClick={() => (c.needsMessage ? setAction(s) : doStatus(s))}>{c.label}</button>
              );
            })}
            {a.status !== 'Draft' && <button className="btn btn-outline btn-sm" onClick={() => downloadApplicationPdf(a._id, a.applicationNumber).catch(() => setError('PDF download failed.'))}>Download PDF</button>}
          </div>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {notice && <Alert type="success">{notice}</Alert>}
        {a.status === 'NeedsInfo' && a.infoRequest && <Alert type="warning">Waiting on applicant: {a.infoRequest}</Alert>}

        <div className="tabs" style={{ marginBottom: 12 }}>
          {TABS.map(([k, l]) => <button key={k} className={`tab-btn ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</button>)}
        </div>

        {tab === 'overview' && <Overview a={a} ssn={ssn} onRevealSsn={reveal} />}
        {tab === 'documents' && <Documents a={a} types={data.documentTypes} onChanged={load} setError={setError} />}
        {tab === 'agreements' && <Agreements a={a} agreements={data.agreements} />}
        {tab === 'activity' && <Activity a={a} onChanged={load} setError={setError} />}
        {tab === 'enroll' && <Enroll a={a} onChanged={load} />}

        {action && (
          <Modal title={ACTION_COPY[action].label} onClose={() => setAction(null)}>
            <div className="form-group">
              <label className="form-label">{ACTION_COPY[action].prompt}</label>
              <textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <button className={`btn ${action === 'Rejected' ? 'btn-danger' : 'btn-primary'} btn-full`} disabled={!message.trim() || saving} onClick={() => doStatus(action, message)}>
              {action === 'NeedsInfo' ? 'Send request' : 'Reject application'}
            </button>
          </Modal>
        )}
      </div>
    </div>
  );
}
