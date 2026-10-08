import React, { useState } from 'react';
import { Text, TextArea, Select, YesNo, Checks, Checkbox, Row, Field, SignaturePad, money } from './fields';

/**
 * Wizard sections. Each receives:
 *   form      – current values (mirrors the server application)
 *   set(path, value)
 *   err(path) – validation message for a field, if any
 *   config    – enrollment config from the server (programs, options, agreements…)
 *   funded    – true for HCDFS/EQISS (no fee or payment content is rendered or even received)
 */

export const STEP_DEFS = [
  { key: 'program', title: 'Program', blurb: 'Choose what you want to study and where.' },
  { key: 'personal', title: 'About you', blurb: 'Your contact details and identification.' },
  { key: 'agency', title: 'Agency & caseworker', blurb: 'Who referred you to BHI.', fundedOnly: true },
  { key: 'education', title: 'Education', blurb: 'Your school history.' },
  { key: 'workforce', title: 'Work & job goals', blurb: 'For your Workforce New Jersey registration.' },
  { key: 'emergency', title: 'Emergency & medical', blurb: 'Who to call and what we should know.' },
  { key: 'background', title: 'Background check', blurb: 'All answers are kept strictly confidential.' },
  { key: 'documents', title: 'Documents', blurb: 'Upload your resume and ID.' },
  { key: 'sign', title: 'Review & sign', blurb: 'Read the agreements and sign.' },
];

// Which form sections each step saves.
export const STEP_SECTIONS = {
  program: ['program'],
  personal: ['personal'],
  agency: ['agency'],
  education: ['education', 'funding'],
  workforce: ['workforce'],
  emergency: ['emergency'],
  background: ['background'],
};

const LOCATION_SHORT = { SUMMIT: '591 Summit Ave', BERGEN: '910 Bergen Ave' };

// ─── Program ─────────────────────────────────────────────
export function ProgramStep({ form, set, err, config, funded }) {
  const selected = config.programs.find((p) => p._id === form.program?.requested);
  const campuses = config.locations.filter((l) => !selected?.locations?.length || selected.locations.includes(l.code));

  return (
    <>
      <fieldset className={`enr-field ${err('program.requested') ? 'has-error' : ''}`}>
        <legend className="enr-label">Program <span className="enr-req">*</span></legend>
        <div className="enr-programs">
          {config.programs.map((p) => (
            <label key={p._id} className={`enr-program ${form.program?.requested === p._id ? 'on' : ''}`}>
              <input
                type="radio" name="program" checked={form.program?.requested === p._id}
                onChange={() => set('program.requested', p._id)}
              />
              <span className="enr-program-name">{p.name}</span>
              <span className="enr-program-meta">
                {p.hours ? `${p.hours} hours` : null}
                {p.hours && p.certification ? ' · ' : null}
                {p.certification ? `Prepares for ${p.certification}` : null}
              </span>
              {!funded && p.cost && <span className="enr-program-cost">{money(p.totalCost)}</span>}
            </label>
          ))}
        </div>
        {config.programs.length === 0 && <div className="enr-hint">No programs are open for enrollment right now. Call (201) 377-1594.</div>}
        {err('program.requested') && <div className="enr-error" role="alert">{err('program.requested')}</div>}
      </fieldset>

      {!funded && selected?.cost && (
        <div className="enr-costs" aria-label="Program costs">
          <div className="enr-costs-title">{selected.name} — costs</div>
          <table>
            <tbody>
              {[['Tuition', selected.cost.tuition], ['Fees', selected.cost.fees], ['Books', selected.cost.books],
                ['Tools / supplies', selected.cost.tools], ['Other', selected.cost.other]].map(([l, v]) => (
                <tr key={l}><td>{l}</td><td>{money(v)}</td></tr>
              ))}
              <tr className="total"><td>Program total</td><td>{money(selected.totalCost)}</td></tr>
            </tbody>
          </table>
          {config.enrollmentFees && (
            <p className="enr-hint">
              Due at enrollment: {money(config.enrollmentFees.application)} application fee and {money(config.enrollmentFees.registration)} registration fee.
            </p>
          )}
        </div>
      )}

      <fieldset className={`enr-field ${err('program.preferredLocation') ? 'has-error' : ''}`}>
        <legend className="enr-label">Campus <span className="enr-req">*</span></legend>
        <div className="enr-pills">
          {campuses.map((l) => (
            <label key={l.code} className={`enr-pill ${form.program?.preferredLocation === l.code ? 'on' : ''}`}>
              <input type="radio" name="campus" checked={form.program?.preferredLocation === l.code} onChange={() => set('program.preferredLocation', l.code)} />
              {LOCATION_SHORT[l.code] || l.label}
            </label>
          ))}
        </div>
        <div className="enr-hint">Both campuses are in Jersey City.</div>
        {err('program.preferredLocation') && <div className="enr-error" role="alert">{err('program.preferredLocation')}</div>}
      </fieldset>

      {config.supportClasses.length > 0 && (
        <Checks
          label="Would you also like help with any of these?"
          hint="Optional. These classes can be taken alongside your program."
          value={form.program?.supportInterests || []}
          onChange={(v) => set('program.supportInterests', v)}
          options={config.supportClasses.filter((s) => s._id !== form.program?.requested).map((s) => [s._id, s.name])}
        />
      )}
      <Text label="Preferred schedule" hint="For example: mornings, evenings, weekdays only." value={form.program?.preferredSchedule} onChange={(v) => set('program.preferredSchedule', v)} />
    </>
  );
}

// ─── Personal (Student Data + identity) ──────────────────
export function PersonalStep({ form, set, err, config, application }) {
  const p = form.personal || {};
  const [ssnEditing, setSsnEditing] = useState(!application?.personal?.hasSsn);
  return (
    <>
      <Row>
        <Text label="First name" required value={p.firstName} onChange={(v) => set('personal.firstName', v)} error={err('personal.firstName')} autoComplete="given-name" />
        <Text label="Middle name" value={p.middleName} onChange={(v) => set('personal.middleName', v)} autoComplete="additional-name" />
        <Text label="Last name" required value={p.lastName} onChange={(v) => set('personal.lastName', v)} error={err('personal.lastName')} autoComplete="family-name" />
      </Row>
      <Text label="Maiden name or other names used" value={p.otherNames} onChange={(v) => set('personal.otherNames', v)} />
      <Row>
        <Text label="Date of birth" required type="date" value={p.dob} onChange={(v) => set('personal.dob', v)} error={err('personal.dob')} autoComplete="bday" />
        {ssnEditing ? (
          <Text
            label="Social Security number" required inputMode="numeric" placeholder="123-45-6789" maxLength={11}
            value={p.ssn} onChange={(v) => set('personal.ssn', v)} error={err('personal.ssn')}
            hint="Encrypted and only visible to BHI admissions staff."
          />
        ) : (
          <Field label="Social Security number" error={err('personal.ssn')}>
            <div className="enr-static">
              On file, ending in {application.personal.ssnLast4}
              <button type="button" className="enr-linkbtn" onClick={() => setSsnEditing(true)}>Change</button>
            </div>
          </Field>
        )}
      </Row>

      <h3 className="enr-subhead">Address</h3>
      <Text label="Street address" required value={p.address?.street} onChange={(v) => set('personal.address.street', v)} error={err('personal.address')} autoComplete="street-address" />
      <Row>
        <Text label="City" required value={p.address?.city} onChange={(v) => set('personal.address.city', v)} autoComplete="address-level2" />
        <Text label="State" value={p.address?.state} onChange={(v) => set('personal.address.state', v)} autoComplete="address-level1" maxLength={2} />
        <Text label="ZIP code" required value={p.address?.zip} onChange={(v) => set('personal.address.zip', v)} inputMode="numeric" autoComplete="postal-code" maxLength={10} />
        <Text label="County" value={p.address?.county} onChange={(v) => set('personal.address.county', v)} />
      </Row>

      <h3 className="enr-subhead">Phone & email</h3>
      <Row>
        <Text label="Cell phone" required type="tel" value={p.cellPhone} onChange={(v) => set('personal.cellPhone', v)} error={err('personal.cellPhone')} autoComplete="tel" />
        <Text label="Home phone" type="tel" value={p.homePhone} onChange={(v) => set('personal.homePhone', v)} />
        <Text label="Work phone" type="tel" value={p.workPhone} onChange={(v) => set('personal.workPhone', v)} />
      </Row>
      <Row>
        <Text label="Email" required type="email" value={p.email} onChange={(v) => set('personal.email', v)} error={err('personal.email')} autoComplete="email" />
        <Text
          label="Gmail address" required type="email" placeholder="name@gmail.com" value={p.gmail}
          onChange={(v) => set('personal.gmail', v)} error={err('personal.gmail')}
          hint="Required for Google Classroom. Can be the same as your email if it's a Gmail address."
        />
      </Row>

      <h3 className="enr-subhead">Demographics</h3>
      <Row>
        <Select label="Gender" value={p.gender} onChange={(v) => set('personal.gender', v)} options={config.options.gender} />
        <YesNo label="Are you Hispanic or Latino?" value={p.hispanic} onChange={(v) => set('personal.hispanic', v)} />
      </Row>
      <Checks label="Race (choose all that apply)" value={p.race || []} onChange={(v) => set('personal.race', v)} options={config.options.race} />
      <YesNo label="Are you a US citizen?" value={p.usCitizen} onChange={(v) => set('personal.usCitizen', v)} />
      {p.usCitizen === 'no' && (
        <Row>
          <Text label="Alien registration number" value={p.alienRegNumber} onChange={(v) => set('personal.alienRegNumber', v)} />
          <Text label="Expiration date" type="date" value={p.alienRegExpiration} onChange={(v) => set('personal.alienRegExpiration', v)} />
        </Row>
      )}

      <h3 className="enr-subhead">Social media <span className="enr-optional">optional</span></h3>
      <p className="enr-hint">We'd like to stay in touch and help make you more marketable in your industry.</p>
      <Row>
        <Text label="Facebook" value={p.social?.facebook} onChange={(v) => set('personal.social.facebook', v)} />
        <Text label="Twitter / X" value={p.social?.twitter} onChange={(v) => set('personal.social.twitter', v)} />
        <Text label="LinkedIn" value={p.social?.linkedin} onChange={(v) => set('personal.social.linkedin', v)} />
      </Row>
    </>
  );
}

// ─── Agency (funded only) ────────────────────────────────
export function AgencyStep({ form, set, err, config }) {
  const a = form.agency || {};
  return (
    <>
      <Row>
        <Text label="Case number" value={a.caseNumber} onChange={(v) => set('agency.caseNumber', v)} />
        <Select label="Benefit status" value={a.benefitStatus} onChange={(v) => set('agency.benefitStatus', v)} options={config.options.benefitStatus} placeholder="Not sure / none" />
      </Row>
      <h3 className="enr-subhead">Your caseworker</h3>
      <Text label="Caseworker name" required value={a.caseworker?.name} onChange={(v) => set('agency.caseworker.name', v)} error={err('agency.caseworker.name')} />
      <Row>
        <Text label="Caseworker email" type="email" value={a.caseworker?.email} onChange={(v) => set('agency.caseworker.email', v)} />
        <Text label="Caseworker phone" type="tel" value={a.caseworker?.phone} onChange={(v) => set('agency.caseworker.phone', v)} />
      </Row>
    </>
  );
}

// ─── Education (+ payment questions for private) ─────────
export function EducationStep({ form, set, err, config, funded }) {
  const e = form.education || {};
  const f = form.funding || {};
  return (
    <>
      <h3 className="enr-subhead first">High school</h3>
      <Text label="High school name" value={e.highSchoolName} onChange={(v) => set('education.highSchoolName', v)} />
      <Row>
        <Text label="High school address" value={e.highSchoolAddress} onChange={(v) => set('education.highSchoolAddress', v)} />
        <Text label="Year completed" inputMode="numeric" maxLength={4} value={e.highSchoolYear} onChange={(v) => set('education.highSchoolYear', v)} />
      </Row>
      <YesNo label="Did you get your high school diploma?" required value={e.hasDiploma} onChange={(v) => set('education.hasDiploma', v)} error={err('education.hasDiploma')} />
      <Row>
        <YesNo label="Do you have a GED?" value={e.hasGed} onChange={(v) => set('education.hasGed', v)} />
        {e.hasGed !== 'yes' && <YesNo label="Are you currently working toward your GED?" value={e.seekingGed} onChange={(v) => set('education.seekingGed', v)} />}
      </Row>
      <Row>
        <Text label="TABE reading level" hint="Leave blank if you haven't taken the TABE test." value={e.tabeReading} onChange={(v) => set('education.tabeReading', v)} />
        <Text label="TABE math level" value={e.tabeMath} onChange={(v) => set('education.tabeMath', v)} />
      </Row>

      <h3 className="enr-subhead">College <span className="enr-optional">if any</span></h3>
      <Row>
        <Text label="School name" value={e.collegeName} onChange={(v) => set('education.collegeName', v)} />
        <Select label="Degree" value={e.collegeDegree} onChange={(v) => set('education.collegeDegree', v)} options={config.options.degree} placeholder="None" />
      </Row>
      <Row>
        <Text label="School address" value={e.collegeAddress} onChange={(v) => set('education.collegeAddress', v)} />
        <Text label="Year completed" inputMode="numeric" maxLength={4} value={e.collegeYear} onChange={(v) => set('education.collegeYear', v)} />
      </Row>

      {!funded && (
        <>
          <h3 className="enr-subhead">Payment</h3>
          <TextArea label="How do you plan to pay for your program?" required value={f.plan} onChange={(v) => set('funding.plan', v)} error={err('funding.plan')} rows={2} />
          <YesNo label="Will you be seeking funding from Workforce?" value={f.seekingWorkforceFunding} onChange={(v) => set('funding.seekingWorkforceFunding', v)} />
        </>
      )}

      <h3 className="enr-subhead">A couple more questions</h3>
      <YesNo label="Have you met with a counselor at Workforce or Social Services?" value={e.metWorkforceCounselor} onChange={(v) => set('education.metWorkforceCounselor', v)} />
      <YesNo label="Have you had a tour of our facility?" value={e.hadFacilityTour} onChange={(v) => set('education.hadFacilityTour', v)} />
    </>
  );
}

// ─── Workforce NJ registration ───────────────────────────
export function WorkforceStep({ form, set, err, config }) {
  const w = form.workforce || {};
  const wh = w.workHistory || {};
  const desire = w.employmentDesire || {};
  return (
    <>
      <Select label="School status" value={w.schoolStatus} onChange={(v) => set('workforce.schoolStatus', v)} options={config.options.schoolStatus} />
      <Text label="Highest grade or degree completed" value={w.highestGradeCompleted} onChange={(v) => set('workforce.highestGradeCompleted', v)} />
      <Select label="Employment status" required value={w.employmentStatus} onChange={(v) => set('workforce.employmentStatus', v)} options={config.options.employmentStatus} error={err('workforce.employmentStatus')} />
      <Row>
        <YesNo label="List your resume in America's Job Bank?" value={w.jobBankResume} onChange={(v) => set('workforce.jobBankResume', v)} />
        <YesNo label="Keep your personal information confidential?" value={w.keepInfoConfidential} onChange={(v) => set('workforce.keepInfoConfidential', v)} />
      </Row>
      <YesNo label="Are you a migrant or seasonal worker?" value={w.migrantWorker} onChange={(v) => set('workforce.migrantWorker', v)} />
      <Checks label="How should Workforce contact you?" value={w.contactMethods || []} onChange={(v) => set('workforce.contactMethods', v)} options={config.options.contactMethods} />

      <h3 className="enr-subhead">The job you want</h3>
      <Checks
        label="Type of work"
        value={['fullTime', 'partTime', 'permanent', 'temporary'].filter((k) => desire[k])}
        onChange={(v) => set('workforce.employmentDesire', { fullTime: v.includes('fullTime'), partTime: v.includes('partTime'), permanent: v.includes('permanent'), temporary: v.includes('temporary') })}
        options={[['fullTime', 'Full-time'], ['partTime', 'Part-time'], ['permanent', 'Permanent'], ['temporary', 'Temporary']]}
      />
      <Checks label="Shifts you can work" value={w.shifts || []} onChange={(v) => set('workforce.shifts', v)} options={config.options.shift} />
      <Row>
        <Text label="Minimum desired pay" placeholder="e.g. $18 per hour" value={w.minimumPay} onChange={(v) => set('workforce.minimumPay', v)} />
        <Select label="How far will you travel for work?" value={w.travelDistance} onChange={(v) => set('workforce.travelDistance', v)} options={config.options.travelDistance} />
      </Row>
      <TextArea label="Job objective" rows={2} value={w.jobObjective} onChange={(v) => set('workforce.jobObjective', v)} />
      <YesNo label="Are you interested in training?" value={w.interestedInTraining} onChange={(v) => set('workforce.interestedInTraining', v)} />

      <h3 className="enr-subhead">Current or most recent job <span className="enr-optional">if any</span></h3>
      <Row>
        <Text label="Job title" value={wh.jobTitle} onChange={(v) => set('workforce.workHistory.jobTitle', v)} />
        <Text label="Employer" value={wh.employer} onChange={(v) => set('workforce.workHistory.employer', v)} />
      </Row>
      <Row>
        <Text label="City" value={wh.city} onChange={(v) => set('workforce.workHistory.city', v)} />
        <Text label="State" maxLength={2} value={wh.state} onChange={(v) => set('workforce.workHistory.state', v)} />
      </Row>
      <Row>
        <Text label="Start date" type="date" value={wh.startDate} onChange={(v) => set('workforce.workHistory.startDate', v)} />
        <Text label="End date" type="date" value={wh.endDate} onChange={(v) => set('workforce.workHistory.endDate', v)} />
        <Text label="Wage" value={wh.wage} onChange={(v) => set('workforce.workHistory.wage', v)} />
        <Select label="Per" value={wh.wagePer} onChange={(v) => set('workforce.workHistory.wagePer', v)} options={['hour', 'week', 'month', 'year']} placeholder="—" />
      </Row>
      <Select label="Reason for leaving" value={wh.reasonForLeaving} onChange={(v) => set('workforce.workHistory.reasonForLeaving', v)} options={['Lack of work / laid off', 'Plant or department closure', 'Still employed', 'Other']} />
      <TextArea label="Job duties" rows={2} value={wh.duties} onChange={(v) => set('workforce.workHistory.duties', v)} />

      <h3 className="enr-subhead">Other</h3>
      <TextArea label="Additional skills" rows={2} value={w.additionalSkills} onChange={(v) => set('workforce.additionalSkills', v)} />
      <Row>
        <Checks label="Driver's license" value={w.driversLicense || []} onChange={(v) => set('workforce.driversLicense', v)} options={config.options.driversLicense} />
        <Text label="License state" maxLength={2} value={w.driversLicenseState} onChange={(v) => set('workforce.driversLicenseState', v)} />
      </Row>
      <details className="enr-details">
        <summary>Military service</summary>
        <Row>
          <Text label="Branch" value={w.military?.branch} onChange={(v) => set('workforce.military.branch', v)} />
          <Text label="Active service from" type="date" value={w.military?.from} onChange={(v) => set('workforce.military.from', v)} />
          <Text label="To" type="date" value={w.military?.to} onChange={(v) => set('workforce.military.to', v)} />
        </Row>
        <Row>
          <Select label="Service disability" value={w.military?.disability} onChange={(v) => set('workforce.military.disability', v)} options={['Disabled', 'Not disabled', 'Special']} />
          <Checkbox label="Campaign veteran" checked={w.military?.campaignVeteran} onChange={(v) => set('workforce.military.campaignVeteran', v)} />
        </Row>
      </details>
    </>
  );
}

// ─── Emergency medical ───────────────────────────────────
export function EmergencyStep({ form, set, err, config }) {
  const em = form.emergency || {};
  const contacts = em.contacts?.length ? em.contacts : [{}, {}];
  const anyCondition = config.options.medicalConditions.some(([k]) => em.conditions?.[k]) || em.otherCondition;
  return (
    <>
      <h3 className="enr-subhead first">In an emergency, who should we contact?</h3>
      {[0, 1].map((i) => (
        <Row key={i}>
          <Text label={`Contact ${i + 1} name`} required={i === 0} value={contacts[i]?.name} onChange={(v) => set(`emergency.contacts.${i}.name`, v)} error={i === 0 ? err('emergency.contacts') : undefined} />
          <Text label="Relationship" value={contacts[i]?.relationship} onChange={(v) => set(`emergency.contacts.${i}.relationship`, v)} />
          <Text label="Phone" required={i === 0} type="tel" value={contacts[i]?.phone} onChange={(v) => set(`emergency.contacts.${i}.phone`, v)} />
        </Row>
      ))}
      <Row>
        <Text label="Family physician" value={em.physicianName} onChange={(v) => set('emergency.physicianName', v)} />
        <Text label="Physician phone" type="tel" value={em.physicianPhone} onChange={(v) => set('emergency.physicianPhone', v)} />
      </Row>

      <h3 className="enr-subhead">Medical information</h3>
      <Checks
        label="Have you ever had, or do you have, any of these?"
        value={config.options.medicalConditions.filter(([k]) => em.conditions?.[k]).map(([k]) => k)}
        onChange={(v) => set('emergency.conditions', Object.fromEntries(config.options.medicalConditions.map(([k]) => [k, v.includes(k)])))}
        options={config.options.medicalConditions}
      />
      <Text label="Other (please specify)" value={em.otherCondition} onChange={(v) => set('emergency.otherCondition', v)} />
      {anyCondition && <TextArea label="Please explain" value={em.conditionsExplain} onChange={(v) => set('emergency.conditionsExplain', v)} />}
      <YesNo label="Have you ever had a reaction to serum, drugs, or any medicines (aspirin, penicillin)?" value={em.drugReaction} onChange={(v) => set('emergency.drugReaction', v)} />
      {em.drugReaction === 'yes' && <TextArea label="Please explain" value={em.drugReactionExplain} onChange={(v) => set('emergency.drugReactionExplain', v)} />}
      <YesNo label="Are you taking any medicines now?" value={em.takingMedication} onChange={(v) => set('emergency.takingMedication', v)} />
      {em.takingMedication === 'yes' && <TextArea label="Please explain" value={em.medicationExplain} onChange={(v) => set('emergency.medicationExplain', v)} />}
      <YesNo label="Do you have any infections or diseases?" value={em.infections} onChange={(v) => set('emergency.infections', v)} />
      {em.infections === 'yes' && <TextArea label="Please explain" value={em.infectionsExplain} onChange={(v) => set('emergency.infectionsExplain', v)} />}
    </>
  );
}

// ─── Background check ────────────────────────────────────
export function BackgroundStep({ form, set, err }) {
  const b = form.background || {};
  const anyYes = [b.arrestedOrConvicted, b.abuseOrSexualCrimes, b.lifestyleConcern].includes('yes');
  return (
    <>
      <YesNo label="Have you ever been arrested or convicted for any criminal offense, excluding minor traffic violations?" required value={b.arrestedOrConvicted} onChange={(v) => set('background.arrestedOrConvicted', v)} error={err('background.arrestedOrConvicted')} />
      <YesNo label="Have you ever been accused, arrested or convicted of abuse or sexually related crimes?" required value={b.abuseOrSexualCrimes} onChange={(v) => set('background.abuseOrSexualCrimes', v)} error={err('background.abuseOrSexualCrimes')} />
      <YesNo label="Is there anything in your lifestyle or background that would call into question your ability?" required value={b.lifestyleConcern} onChange={(v) => set('background.lifestyleConcern', v)} error={err('background.lifestyleConcern')} />
      <div className="enr-note">Answering "yes" does not automatically disqualify you. Use the space below to explain the circumstances.</div>
      {(anyYes || b.explanation) && (
        <TextArea label="Please explain" required={anyYes} rows={4} value={b.explanation} onChange={(v) => set('background.explanation', v)} error={err('background.explanation')} />
      )}
      <TextArea
        label="Have you previously sought, or are you currently seeking, expungement of your records? If so, where are you in the process? If not, why not?"
        rows={3} value={b.expungement} onChange={(v) => set('background.expungement', v)}
      />
    </>
  );
}

// ─── Documents ───────────────────────────────────────────
const fmtSize = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

export function DocumentsStep({ application, config, err, onUpload, onRemove, busyKind }) {
  return (
    <div className="enr-docs">
      {config.documents.map((d) => {
        const doc = application.documents.find((x) => x.kind === d.kind);
        const rejected = doc?.review?.status === 'rejected';
        return (
          <div key={d.kind} className={`enr-doc ${doc ? 'done' : ''} ${rejected || err(`documents.${d.kind}`) ? 'has-error' : ''}`}>
            <div className="enr-doc-info">
              <div className="enr-doc-title">{d.label}{d.required && <span className="enr-req"> *</span>}</div>
              {doc ? (
                <div className="enr-doc-file">
                  {doc.fileName} · {fmtSize(doc.size)}
                  {rejected && <div className="enr-error">BHI asked for a new copy: {doc.review.note}</div>}
                </div>
              ) : (
                <div className="enr-hint">{d.hint}</div>
              )}
              {err(`documents.${d.kind}`) && !doc && <div className="enr-error" role="alert">{err(`documents.${d.kind}`)}</div>}
            </div>
            <div className="enr-doc-actions">
              <label className={`btn ${doc ? 'btn-outline' : 'btn-primary'} btn-sm enr-upload`}>
                {busyKind === d.kind ? 'Uploading…' : doc ? 'Replace' : 'Upload'}
                <input
                  type="file" disabled={Boolean(busyKind)}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,image/*"
                  onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onUpload(d.kind, f); }}
                />
              </label>
              {doc && <button type="button" className="enr-linkbtn" onClick={() => onRemove(doc._id)}>Remove</button>}
            </div>
          </div>
        );
      })}
      <p className="enr-hint">PDF, photo, or Word document, up to 10 MB each. On a phone you can take a photo directly.</p>
    </div>
  );
}

// ─── Agreements & signature ──────────────────────────────
const fill = (text, vars) => text.replace('{studentName}', vars.studentName || '________').replace('{programName}', vars.programName || '________');

function AgreementBody({ agreement, vars, program, funded, enrollmentFees }) {
  if (agreement.key === 'enrollment_agreement') {
    return agreement.paragraphs.map((p, i) =>
      p.type === 'section' ? (
        <div key={i}><h4>{p.heading}</h4>{p.body.map((t, j) => <p key={j}>{t}</p>)}</div>
      ) : p.type === 'fees' ? (
        <div key={i}>
          <p>{p.text}</p>
          {!funded && program?.cost && (
            <p className="enr-fee-line">
              Tuition {money(program.cost.tuition)} · Fees {money(program.cost.fees)} · Books {money(program.cost.books)} · Tools/supplies {money(program.cost.tools)} · Other {money(program.cost.other)} · <strong>Total {money(program.totalCost)}</strong>
            </p>
          )}
        </div>
      ) : (
        <p key={i}>{fill(p.text, vars)}</p>
      )
    );
  }
  if (agreement.key === 'grievance_policy') {
    return <><p>{agreement.paragraphs[0]}</p><ol>{agreement.paragraphs.slice(1).map((t, i) => <li key={i}>{t}</li>)}</ol></>;
  }
  if (agreement.refundPolicy) {
    const r = agreement.refundPolicy;
    const tbl = (rows) => (
      <table className="enr-refund"><thead><tr><th>If withdrawal or cancellation occurs</th><th>The school will retain</th></tr></thead>
        <tbody>{rows.map(([a, b]) => <tr key={a}><td>{a}</td><td>{b}</td></tr>)}</tbody></table>
    );
    return <><p>{r.intro}</p>{tbl(r.standard)}<p>{r.partTimeIntro}</p>{tbl(r.partTime)}</>;
  }
  return <p>{fill(agreement.body || '', vars)}</p>;
}

export function SignStep({ form, err, config, funded, accepted, setAccepted, signature, setSignature, typedName, setTypedName }) {
  const program = config.programs.find((p) => p._id === form.program?.requested);
  const studentName = [form.personal?.firstName, form.personal?.lastName].filter(Boolean).join(' ');
  const vars = { studentName, programName: program?.name };

  return (
    <>
      <p className="enr-lede">
        Please read each agreement. Your typed name and drawn signature apply to every agreement you check, the same as signing each paper form.
      </p>
      {config.agreements.map((a) => (
        <section key={a.key} className={`enr-agreement ${err(`agreements.${a.key}`) ? 'has-error' : ''}`}>
          <h3>{a.title}{a.optional && <span className="enr-optional">optional</span>}</h3>
          <div className="enr-agreement-body" tabIndex={0}>
            <AgreementBody agreement={a} vars={vars} program={program} funded={funded} enrollmentFees={config.enrollmentFees} />
          </div>
          <Checkbox
            label={a.optional ? `I agree to the ${a.title}.` : `I have read and agree to the ${a.title}.`}
            checked={accepted[a.key]} onChange={(v) => setAccepted({ ...accepted, [a.key]: v })}
            error={err(`agreements.${a.key}`)}
          />
        </section>
      ))}

      <div className="enr-signblock">
        <Text
          label="Type your full name" required value={typedName} onChange={setTypedName}
          hint={studentName ? `Type it exactly as: ${studentName}` : undefined} error={err('typedName')} autoComplete="name"
        />
        <SignaturePad value={signature} onChange={setSignature} error={err('signature')} />
        <p className="enr-hint">By signing, you agree that your electronic signature is the legal equivalent of your handwritten signature. Today's date, time, and your IP address are recorded with it.</p>
      </div>
    </>
  );
}
