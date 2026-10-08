const PDFDocument = require("pdfkit");
const forms = require("../config/bhiEnrollmentForms");

/**
 * Renders a submitted enrollment application as a PDF packet for the
 * student's file: every form section, the full agreement wording the
 * applicant accepted, and the e-signature audit record (typed name, drawn
 * signature, timestamp, IP, wording version).
 *
 * SSN is always masked. Fee amounts appear only for PRIVATE applicants.
 */

const yn = (v) => (v === "yes" ? "Yes" : v === "no" ? "No" : "—");
const val = (v) => (v === undefined || v === null || v === "" ? "—" : String(v));
const money = (n) => `$${Number(n || 0).toLocaleString("en-US")}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleString("en-US", { timeZone: "America/New_York" }) : "—");
const locationLabel = (code) => forms.LOCATIONS.find((l) => l.code === code)?.label || "—";

function buildApplicationPdf(app, stream) {
  const doc = new PDFDocument({ size: "LETTER", margin: 54, info: { Title: `BHI Enrollment ${app.applicationNumber}` } });
  doc.pipe(stream);

  const funded = forms.isFunded(app.category);
  const p = app.personal || {};
  const program = app.program?.requested;
  const studentName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(" ");

  const heading = (t) => {
    if (doc.y > 660) doc.addPage();
    doc.moveDown(0.8).font("Helvetica-Bold").fontSize(13).fillColor("#111").text(t);
    doc.moveTo(doc.page.margins.left, doc.y + 2).lineTo(doc.page.width - doc.page.margins.right, doc.y + 2).strokeColor("#bbb").stroke();
    doc.moveDown(0.5).font("Helvetica").fontSize(10).fillColor("#222");
  };
  const row = (label, value) => {
    doc.font("Helvetica-Bold").text(`${label}: `, { continued: true }).font("Helvetica").text(val(value));
  };
  const para = (t) => doc.font("Helvetica").fontSize(10).text(t, { align: "left" }).moveDown(0.4);

  // ─── Cover ─────────────────────────────────────────────
  doc.font("Helvetica-Bold").fontSize(18).text("Bright Horizon Institute");
  doc.font("Helvetica").fontSize(9).fillColor("#444")
    .text("591 Summit Ave, Suite 400, Jersey City, NJ 07306  |  910 Bergen Ave, 3rd Floor, Jersey City, NJ 07306")
    .text("brighthorizoninstitute.com  |  Phone (201) 377-1594  |  Fax (973) 255-3900");
  doc.moveDown(1).fillColor("#111").font("Helvetica-Bold").fontSize(15).text("Online Enrollment Packet");
  doc.moveDown(0.4).font("Helvetica").fontSize(10);
  row("Application", app.applicationNumber);
  row("Student", studentName);
  row("Category", forms.CATEGORIES[app.category]?.label);
  row("Status", app.status);
  row("Submitted", fmtDate(app.submittedAt));
  row("Program", program ? `${program.name}${program.courseCode ? ` (${program.courseCode})` : ""}` : "—");
  row("Campus", locationLabel(app.program?.preferredLocation));
  row("Support classes of interest", (app.program?.supportInterests || []).map((s) => s.name).join(", ") || "None");

  // ─── Student data ──────────────────────────────────────
  heading("Student Data");
  row("Name", studentName);
  row("Other names used", p.otherNames);
  row("Date of birth", p.dob);
  row("Social Security #", p.ssnLast4 ? `***-**-${p.ssnLast4}` : "—");
  row("Gender", p.gender);
  row("Hispanic or Latino", yn(p.hispanic));
  row("Race", (p.race || []).join(", "));
  const a = p.address || {};
  row("Address", [a.street, a.city, a.state, a.zip].filter(Boolean).join(", "));
  row("County", a.county);
  row("Cell / Home / Work", [p.cellPhone, p.homePhone, p.workPhone].map(val).join("  /  "));
  row("Email", p.email);
  row("Gmail (Google Classroom)", p.gmail);
  row("US citizen", yn(p.usCitizen));
  if (p.usCitizen === "no") row("Alien reg. # / expiration", `${val(p.alienRegNumber)} / ${val(p.alienRegExpiration)}`);
  const so = p.social || {};
  if (so.facebook || so.twitter || so.linkedin)
    row("Social media", [so.facebook, so.twitter, so.linkedin].filter(Boolean).join("  |  "));

  if (funded) {
    heading("Agency / Case Information");
    const ag = app.agency || {};
    row("Case number", ag.caseNumber);
    row("Benefit status", ag.benefitStatus);
    row("Caseworker", [ag.caseworker?.name, ag.caseworker?.email, ag.caseworker?.phone].filter(Boolean).join("  |  "));
  }

  // ─── Education ─────────────────────────────────────────
  heading("Educational Background");
  const e = app.education || {};
  row("High school", `${val(e.highSchoolName)}${e.highSchoolAddress ? `, ${e.highSchoolAddress}` : ""}`);
  row("Year completed", e.highSchoolYear);
  row("High school diploma", yn(e.hasDiploma));
  row("Has GED", yn(e.hasGed));
  row("Seeking GED", yn(e.seekingGed));
  row("TABE reading / math", `${val(e.tabeReading)} / ${val(e.tabeMath)}`);
  row("College", [e.collegeName, e.collegeDegree, e.collegeAddress, e.collegeYear].filter(Boolean).join(", "));
  row("Met with Workforce/Social Services counselor", yn(e.metWorkforceCounselor));
  row("Toured facility", yn(e.hadFacilityTour));

  if (!funded) {
    heading("Payment Information");
    row("How the student plans to fund their education", app.funding?.plan);
    row("Seeking funding from Workforce", yn(app.funding?.seekingWorkforceFunding));
    const f = app.feeSnapshot;
    if (f && f.total != null) {
      doc.moveDown(0.3);
      row("Tuition", money(f.tuition));
      row("Fees", money(f.fees));
      row("Books", money(f.books));
      row("Tools / supplies", money(f.tools));
      row("Other", money(f.other));
      row("Program total", money(f.total));
      row("Due at enrollment", `${money(f.applicationFee)} application + ${money(f.registrationFee)} registration`);
    }
  }

  // ─── Workforce registration ────────────────────────────
  heading("Workforce New Jersey Customer Registration");
  const w = app.workforce || {};
  row("School status", w.schoolStatus);
  row("Highest grade/degree completed", w.highestGradeCompleted);
  row("Employment status", w.employmentStatus);
  row("Job bank resume / keep info confidential", `${yn(w.jobBankResume)} / ${yn(w.keepInfoConfidential)}`);
  row("Migrant/seasonal worker", yn(w.migrantWorker));
  row("Preferred contact", (w.contactMethods || []).join(", "));
  const ed = w.employmentDesire || {};
  row("Employment desired", ["fullTime", "partTime", "permanent", "temporary"].filter((k) => ed[k]).join(", "));
  row("Shifts", (w.shifts || []).join(", "));
  row("Minimum desired pay", w.minimumPay);
  const m = w.military || {};
  if (m.branch) row("Military", `${m.branch} ${val(m.from)}–${val(m.to)}; disability: ${val(m.disability)}${m.campaignVeteran ? "; campaign veteran" : ""}`);
  row("Job objective", w.jobObjective);
  row("Interested in training", yn(w.interestedInTraining));
  row("Willing to travel", w.travelDistance);
  const wh = w.workHistory || {};
  if (wh.employer || wh.jobTitle) {
    row("Current/last job", `${val(wh.jobTitle)} at ${val(wh.employer)} (${val(wh.startDate)} – ${val(wh.endDate)})`);
    row("Wage", wh.wage ? `${wh.wage} per ${val(wh.wagePer)}` : "—");
    row("Reason for leaving", wh.reasonForLeaving);
    row("Duties", wh.duties);
  }
  row("Additional skills", w.additionalSkills);
  row("Driver's license", `${(w.driversLicense || []).join(", ") || "—"}${w.driversLicenseState ? ` (${w.driversLicenseState})` : ""}`);

  // ─── Emergency medical ─────────────────────────────────
  heading("Emergency Medical Statement");
  const em = app.emergency || {};
  (em.contacts || []).forEach((c, i) => {
    if (c?.name) row(`Emergency contact ${i + 1}`, `${c.name} (${val(c.relationship)}) ${val(c.phone)}`);
  });
  row("Family physician", `${val(em.physicianName)} ${em.physicianPhone ? `(${em.physicianPhone})` : ""}`);
  const conds = forms.OPTIONS.medicalConditions.filter(([k]) => em.conditions?.[k]).map(([, l]) => l);
  row("Conditions", [...conds, em.otherCondition].filter(Boolean).join(", ") || "None reported");
  if (em.conditionsExplain) row("Explanation", em.conditionsExplain);
  row("Reaction to serum/drugs/medicines", `${yn(em.drugReaction)} ${em.drugReactionExplain || ""}`);
  row("Taking medicines", `${yn(em.takingMedication)} ${em.medicationExplain || ""}`);
  row("Infections/diseases", `${yn(em.infections)} ${em.infectionsExplain || ""}`);

  // ─── Background ────────────────────────────────────────
  heading("Background Check");
  const b = app.background || {};
  row("Arrested or convicted (excluding minor traffic)", yn(b.arrestedOrConvicted));
  row("Accused/arrested/convicted of abuse or sexually related crimes", yn(b.abuseOrSexualCrimes));
  row("Anything that would call ability into question", yn(b.lifestyleConcern));
  row("Explanation", b.explanation);
  row("Expungement", b.expungement);

  // ─── Documents ─────────────────────────────────────────
  heading("Documents on File");
  const allDocs = [...forms.APPLICANT_DOCUMENTS, ...forms.STAFF_DOCUMENTS];
  if (!(app.documents || []).length) para("None.");
  (app.documents || []).forEach((d) => {
    const label = allDocs.find((x) => x.kind === d.kind)?.label || d.kind;
    row(label, `${d.fileName} — ${d.review?.status || "pending"} (${d.uploadedBy})`);
  });

  // ─── Agreements & signatures ───────────────────────────
  const fill = (t) => t.replace("{studentName}", studentName || "________").replace("{programName}", program?.name || "________");
  for (const ag of forms.agreementsFor(app.category)) {
    const sig = (app.signatures || []).find((s) => s.key === ag.key);
    heading(ag.title);
    if (ag.paragraphs && ag.key === "enrollment_agreement") {
      ag.paragraphs.forEach((pp) => {
        if (pp.type === "section") {
          doc.font("Helvetica-Bold").text(pp.heading);
          pp.body.forEach((t) => para(t));
        } else para(fill(pp.text));
      });
      const f = app.feeSnapshot;
      if (!funded && f && f.total != null)
        para(`Tuition ${money(f.tuition)}   Fees ${money(f.fees)}   Books ${money(f.books)}   Tools/supplies ${money(f.tools)}   Other ${money(f.other)}   Total ${money(f.total)}`);
    } else if (ag.paragraphs) {
      ag.paragraphs.forEach((t, i) => para(i === 0 ? t : `${i}. ${t}`));
    } else if (ag.refundPolicy) {
      const r = ag.refundPolicy;
      para(r.intro);
      r.standard.forEach(([when, keep]) => para(`${when} — school retains ${keep}`));
      para(r.partTimeIntro);
      r.partTime.forEach(([when, keep]) => para(`${when} — school retains ${keep}`));
    } else if (ag.body) {
      para(fill(ag.body));
    }
    doc.moveDown(0.2).font("Helvetica-Oblique").fontSize(9).fillColor("#333");
    if (sig?.accepted) {
      doc.text(`Electronically signed by "${sig.typedName}" on ${fmtDate(sig.signedAt)} from IP ${val(sig.ip)} — wording version ${sig.version}`);
    } else {
      doc.text(ag.optional ? "Not accepted (optional)." : "Not signed.");
    }
    doc.fillColor("#222").fontSize(10);
  }

  // ─── Signature image ───────────────────────────────────
  if (app.signatureImage) {
    heading("Applicant Signature");
    try {
      const buf = Buffer.from(app.signatureImage.split(",")[1], "base64");
      doc.image(buf, { fit: [260, 90] });
    } catch {
      para("[Signature image could not be rendered]");
    }
    doc.moveDown(0.3);
    row("Signed", fmtDate(app.submittedAt));
    row("IP address", app.submittedFromIp);
  }

  doc.end();
}

module.exports = { buildApplicationPdf };
