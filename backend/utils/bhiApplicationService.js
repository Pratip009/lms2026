/**
 * Pure (DB-free) logic for BHI online enrollment applications.
 * Kept separate from controllers so it can be unit-tested without Mongo.
 */
const {
  CATEGORY_CODES,
  LOCATION_CODES,
  isFunded,
  agreementsFor,
  applicantDocumentsFor,
  PRIVATE_ENROLLMENT_FEES,
} = require("../config/bhiEnrollmentForms");
const { encrypt, normalizeSsn } = require("./bhiCrypto");

const GMAIL_RE = /^[a-z0-9._%+-]+@(gmail|googlemail)\.com$/i;
const EMAIL_RE = /^\S+@\S+\.\S+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ─── Whitelists ──────────────────────────────────────────
// Only these paths can be written by an applicant. Anything else in the
// request body (status, notes, feeSnapshot, student, documents…) is ignored.
const APPLICANT_FIELDS = {
  program: ["requested", "preferredLocation", "supportInterests", "preferredSchedule"],
  personal: [
    "firstName", "middleName", "lastName", "otherNames", "dob", "gender", "hispanic", "race",
    "address", "cellPhone", "homePhone", "workPhone", "email", "gmail", "usCitizen",
    "alienRegNumber", "alienRegExpiration", "social",
  ],
  agency: ["caseNumber", "benefitStatus", "caseworker"],
  education: [
    "highSchoolName", "highSchoolAddress", "highSchoolYear", "hasDiploma", "hasGed", "seekingGed",
    "tabeReading", "tabeMath", "collegeName", "collegeDegree", "collegeAddress", "collegeYear",
    "metWorkforceCounselor", "hadFacilityTour",
  ],
  funding: ["plan", "seekingWorkforceFunding"],
  workforce: [
    "schoolStatus", "highestGradeCompleted", "employmentStatus", "jobBankResume", "keepInfoConfidential",
    "migrantWorker", "contactMethods", "employmentDesire", "shifts", "minimumPay", "military",
    "jobObjective", "interestedInTraining", "travelDistance", "workHistory", "additionalSkills",
    "driversLicense", "driversLicenseState",
  ],
  emergency: [
    "contacts", "physicianName", "physicianPhone", "conditions", "otherCondition", "conditionsExplain",
    "drugReaction", "drugReactionExplain", "takingMedication", "medicationExplain", "infections",
    "infectionsExplain",
  ],
  background: ["arrestedOrConvicted", "abuseOrSexualCrimes", "lifestyleConcern", "explanation", "expungement"],
};

const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);

/**
 * Applies an applicant's partial update onto a mongoose application doc.
 * Returns an array of field-level errors for values that were rejected outright
 * (e.g. malformed SSN) — the rest of the update still applies.
 */
function applyApplicantUpdate(app, body = {}) {
  const errors = [];

  if (body.category !== undefined) {
    if (!CATEGORY_CODES.includes(body.category)) {
      errors.push({ field: "category", message: "Choose a valid student category." });
    } else {
      app.category = body.category;
    }
  }

  if (typeof body.currentStep === "string") app.currentStep = body.currentStep.slice(0, 40);

  for (const [section, fields] of Object.entries(APPLICANT_FIELDS)) {
    const incoming = body[section];
    if (!isPlainObject(incoming)) continue;
    for (const f of fields) {
      if (incoming[f] === undefined) continue;
      app.set(`${section}.${f}`, incoming[f]);
    }
  }

  // SSN — encrypt at rest, keep last-4 for display. Empty string clears it.
  if (body.personal && body.personal.ssn !== undefined) {
    const raw = String(body.personal.ssn || "").trim();
    if (raw === "") {
      app.personal.ssnEncrypted = "";
      app.personal.ssnLast4 = "";
    } else {
      const ssn = normalizeSsn(raw);
      if (!ssn) {
        errors.push({ field: "personal.ssn", message: "Social Security number must be 9 digits." });
      } else {
        app.personal.ssnEncrypted = encrypt(ssn);
        app.personal.ssnLast4 = ssn.slice(-4);
      }
    }
  }

  if (body.program?.preferredLocation && !LOCATION_CODES.includes(body.program.preferredLocation)) {
    errors.push({ field: "program.preferredLocation", message: "Choose a valid campus." });
    app.set("program.preferredLocation", "");
  }

  // Funded students never carry payment answers.
  if (isFunded(app.category)) {
    app.set("funding", { plan: "", seekingWorkforceFunding: "" });
  } else {
    // Agency/case info doesn't apply to private students.
    app.set("agency", { caseNumber: "", benefitStatus: "", caseworker: { name: "", email: "", phone: "" } });
  }

  return errors;
}

/** Program as the applicant may see it — cost removed for funded categories. */
function programForApplicant(program, category) {
  if (!program) return null;
  const p = typeof program.toObject === "function" ? program.toObject() : { ...program };
  const view = {
    _id: p._id,
    name: p.name,
    type: p.type,
    description: p.description,
    courseCode: p.courseCode,
    hours: p.hours,
    certification: p.certification,
    locations: p.locations || [],
    offeredAsSupport: Boolean(p.offeredAsSupport),
  };
  if (!isFunded(category)) {
    const c = p.cost || {};
    view.cost = {
      tuition: c.tuition || 0, fees: c.fees || 0, books: c.books || 0, tools: c.tools || 0, other: c.other || 0,
    };
    view.totalCost = Object.values(view.cost).reduce((a, b) => a + b, 0);
  }
  return view;
}

/**
 * Strips everything an applicant must not see: token hash, encrypted SSN,
 * storage ids, admin notes/activity — and for funded students, every
 * fee/payment field.
 */
function toApplicantView(app) {
  const o = typeof app.toObject === "function" ? app.toObject({ virtuals: false }) : { ...app };
  const funded = isFunded(o.category);

  const personal = { ...(o.personal || {}) };
  delete personal.ssnEncrypted;
  personal.hasSsn = Boolean(personal.ssnLast4);

  const view = {
    _id: o._id,
    applicationNumber: o.applicationNumber,
    category: o.category,
    status: o.status,
    currentStep: o.currentStep,
    program: o.program,
    personal,
    agency: funded ? o.agency : undefined,
    education: o.education,
    funding: funded ? undefined : o.funding,
    workforce: o.workforce,
    emergency: o.emergency,
    background: o.background,
    documents: (o.documents || [])
      .filter((d) => d.uploadedBy === "applicant")
      .map((d) => ({
        _id: d._id, kind: d.kind, fileName: d.fileName, size: d.size, createdAt: d.createdAt,
        review: { status: d.review?.status, note: d.review?.status === "rejected" ? d.review?.note : "" },
      })),
    hasSignature: Boolean(o.signatureImage) || (o.signatures || []).some((s) => s.accepted),
    signatures: (o.signatures || []).map(({ key, accepted, typedName, signedAt }) => ({ key, accepted, typedName, signedAt })),
    submittedAt: o.submittedAt,
    infoRequest: o.status === "NeedsInfo" ? o.infoRequest : "",
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
  if (!funded && o.feeSnapshot && o.feeSnapshot.total != null) view.feeSnapshot = o.feeSnapshot;
  return view;
}

/** Fee snapshot frozen at submission time. Returns null for funded categories. */
function buildFeeSnapshot(category, program) {
  if (isFunded(category) || !program) return null;
  const c = program.cost || {};
  const parts = {
    tuition: c.tuition || 0, fees: c.fees || 0, books: c.books || 0, tools: c.tools || 0, other: c.other || 0,
  };
  return {
    ...parts,
    total: Object.values(parts).reduce((a, b) => a + b, 0),
    applicationFee: PRIVATE_ENROLLMENT_FEES.application,
    registrationFee: PRIVATE_ENROLLMENT_FEES.registration,
  };
}

/**
 * Full validation run before submission. Returns [{ step, field, message }].
 * `step` matches the frontend wizard step keys so errors can be linked.
 */
function validateForSubmit(app, { program, signatureProvided, agreementsAccepted = {}, typedName = "" } = {}) {
  const errs = [];
  const add = (step, field, message) => errs.push({ step, field, message });
  const p = app.personal || {};
  const funded = isFunded(app.category);

  if (!CATEGORY_CODES.includes(app.category)) add("start", "category", "Choose your student category.");

  // Program
  if (!app.program?.requested || !program) add("program", "program.requested", "Choose the program you want to enroll in.");
  else if (program.isActive === false || program.openForEnrollment === false)
    add("program", "program.requested", "That program isn't open for enrollment. Choose another.");
  if (!app.program?.preferredLocation) add("program", "program.preferredLocation", "Choose a campus.");

  // Personal
  if (!p.firstName) add("personal", "personal.firstName", "Enter your first name.");
  if (!p.lastName) add("personal", "personal.lastName", "Enter your last name.");
  if (!DATE_RE.test(p.dob || "")) add("personal", "personal.dob", "Enter your date of birth.");
  if (!p.ssnLast4) add("personal", "personal.ssn", "Enter your Social Security number.");
  if (!p.address?.street || !p.address?.city || !p.address?.zip)
    add("personal", "personal.address", "Enter your full street address, city and ZIP code.");
  if (!p.cellPhone) add("personal", "personal.cellPhone", "Enter a cell phone number.");
  if (!EMAIL_RE.test(p.email || "")) add("personal", "personal.email", "Enter a valid email address.");
  if (!GMAIL_RE.test(p.gmail || ""))
    add("personal", "personal.gmail", "Enter a Gmail address (ending in @gmail.com). It's used for Google Classroom.");

  // Agency (funded only)
  if (funded) {
    if (!app.agency?.caseworker?.name) add("agency", "agency.caseworker.name", "Enter your caseworker's name.");
  }

  // Education — high-school diploma question is the minimum
  if (!app.education?.hasDiploma) add("education", "education.hasDiploma", "Tell us whether you have a high school diploma.");
  if (!funded && !app.funding?.plan) add("education", "funding.plan", "Tell us how you plan to pay for your program.");

  // Workforce
  if (!app.workforce?.employmentStatus) add("workforce", "workforce.employmentStatus", "Choose your employment status.");

  // Emergency
  const c0 = app.emergency?.contacts?.[0] || {};
  if (!c0.name || !c0.phone) add("emergency", "emergency.contacts", "Add at least one emergency contact with a phone number.");

  // Background — the three yes/no questions must be answered
  const b = app.background || {};
  for (const k of ["arrestedOrConvicted", "abuseOrSexualCrimes", "lifestyleConcern"])
    if (!b[k]) add("background", `background.${k}`, "Answer every background question.");
  if ([b.arrestedOrConvicted, b.abuseOrSexualCrimes, b.lifestyleConcern].includes("yes") && !b.explanation)
    add("background", "background.explanation", "You answered yes to a background question — please explain.");

  // Documents
  const kinds = new Set((app.documents || []).map((d) => d.kind));
  for (const d of applicantDocumentsFor(app.category))
    if (d.required && !kinds.has(d.kind)) add("documents", `documents.${d.kind}`, `Upload your ${d.label.toLowerCase()}.`);

  // Signatures
  if (!signatureProvided) add("sign", "signature", "Draw your signature.");
  const fullName = `${p.firstName || ""} ${p.lastName || ""}`.trim().toLowerCase().replace(/\s+/g, " ");
  if (!typedName || typedName.trim().toLowerCase().replace(/\s+/g, " ") !== fullName)
    add("sign", "typedName", "Type your full name exactly as entered (first and last).");
  for (const a of agreementsFor(app.category))
    if (!a.optional && !agreementsAccepted[a.key]) add("sign", `agreements.${a.key}`, `Accept the ${a.title}.`);

  return errs;
}

module.exports = {
  APPLICANT_FIELDS,
  GMAIL_RE,
  applyApplicantUpdate,
  programForApplicant,
  toApplicantView,
  buildFeeSnapshot,
  validateForSubmit,
};
