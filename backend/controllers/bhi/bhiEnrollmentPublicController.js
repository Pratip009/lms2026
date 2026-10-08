const asyncHandler = require("express-async-handler");
const BhiApplication = require("../../models/bhi/BhiApplication");
const BhiProgram = require("../../models/bhi/BhiProgram");
const forms = require("../../config/bhiEnrollmentForms");
const svc = require("../../utils/bhiApplicationService");
const { newToken, hashToken, tokenMatches } = require("../../utils/bhiCrypto");
const storage = require("../../utils/bhiDocumentStorage");
const {
  sendEnrollmentResumeLink,
  sendEnrollmentSubmitted,
} = require("../../utils/emailService");

const CLIENT_URL = () => (process.env.CLIENT_URL || "https://bhilearning.com").replace(/\/$/, "");
const resumeUrl = (app, token) => `${CLIENT_URL()}/enroll/continue?id=${app._id}&token=${token}`;
const clientIp = (req) => String(req.ip || "").slice(0, 64);
const userAgent = (req) => String(req.get("user-agent") || "").slice(0, 300);
const MAX_SIGNATURE_BYTES = 300 * 1024;

const fireAndForget = (promise, label) =>
  promise.catch((err) => console.error(`❌ ${label}:`, err.message));

// ─── Applicant auth: id + token in X-Application-Token header ───
const loadApplicantApplication = (extraSelect = "") =>
  asyncHandler(async (req, res, next) => {
    const token = req.get("x-application-token") || "";
    const app = await BhiApplication.findById(req.params.id).select(`+accessTokenHash ${extraSelect}`);
    // Same 404 whether the id or the token is wrong — don't reveal which.
    if (!app || !tokenMatches(token, app.accessTokenHash)) {
      res.status(404);
      throw new Error("Application not found. Check your link or request a new one.");
    }
    req.application = app;
    next();
  });

const requireEditable = (req, res, next) => {
  if (!BhiApplication.APPLICANT_EDITABLE.includes(req.application.status)) {
    res.status(409);
    return next(new Error("This application has been submitted and can no longer be changed."));
  }
  next();
};

// GET /api/bhi/public/enrollment-config?category=PRIVATE
// Everything the wizard needs. Fee data is only included for PRIVATE.
const getEnrollmentConfig = asyncHandler(async (req, res) => {
  const category = forms.CATEGORY_CODES.includes(req.query.category) ? req.query.category : null;

  const programs = await BhiProgram.find({ isActive: true, openForEnrollment: { $ne: false } }).sort({ name: 1 });
  const primary = programs.filter((p) => p.type === "primary");
  const support = programs.filter((p) => p.type === "support" || p.offeredAsSupport);

  // No category chosen yet → no fee data at all.
  const viewCategory = category || "HCDFS";
  res.json({
    success: true,
    categories: Object.values(forms.CATEGORIES).map(({ code, label }) => ({ code, label })),
    locations: forms.LOCATIONS,
    options: forms.OPTIONS,
    category,
    programs: primary.map((p) => svc.programForApplicant(p, viewCategory)),
    supportClasses: support.map((p) => ({ _id: p._id, name: p.name })),
    documents: category ? forms.applicantDocumentsFor(category) : [],
    agreements: category ? forms.agreementsFor(category) : [],
    enrollmentFees: category && !forms.isFunded(category) ? forms.PRIVATE_ENROLLMENT_FEES : undefined,
  });
});

// POST /api/bhi/public/applications
// Body: { category, personal: { firstName, lastName, email, gmail } }
const startApplication = asyncHandler(async (req, res) => {
  const { category, personal = {} } = req.body || {};
  if (!forms.CATEGORY_CODES.includes(category)) {
    res.status(400);
    throw new Error("Choose your student category to begin.");
  }
  if (!personal.firstName || !personal.lastName || !/^\S+@\S+\.\S+$/.test(personal.email || "")) {
    res.status(400);
    throw new Error("Enter your first name, last name, and a valid email address to begin.");
  }

  const token = newToken();
  let app;
  for (let attempt = 0; attempt < 3; attempt++) {
    app = new BhiApplication({ category, accessTokenHash: hashToken(token) });
    svc.applyApplicantUpdate(app, {
      personal: {
        firstName: personal.firstName,
        lastName: personal.lastName,
        email: personal.email,
        gmail: personal.gmail || "",
      },
    });
    app.log("created", { byApplicant: true, detail: `Category ${category}` });
    try {
      await app.save();
      break;
    } catch (err) {
      // Two applications started in the same instant can race for the same number.
      if (err.code === 11000 && err.keyPattern?.applicationNumber && attempt < 2) continue;
      throw err;
    }
  }

  fireAndForget(
    sendEnrollmentResumeLink(app.personal.email, {
      name: app.personal.firstName,
      applicationNumber: app.applicationNumber,
      url: resumeUrl(app, token),
    }),
    "Enrollment resume email"
  );

  res.status(201).json({ success: true, token, application: svc.toApplicantView(app) });
});

// GET /api/bhi/public/applications/:id
const getApplication = asyncHandler(async (req, res) => {
  res.json({ success: true, application: svc.toApplicantView(req.application) });
});

// PATCH /api/bhi/public/applications/:id — autosave one or more sections
const saveApplication = asyncHandler(async (req, res) => {
  const app = req.application;
  const errors = svc.applyApplicantUpdate(app, req.body || {});
  await app.save();
  res.json({ success: true, errors, application: svc.toApplicantView(app) });
});

// POST /api/bhi/public/applications/:id/documents  (multipart: file, kind)
const uploadDocument = asyncHandler(async (req, res) => {
  const app = req.application;
  const kind = req.body.kind;
  const allowedKinds = forms.applicantDocumentsFor(app.category).map((d) => d.kind);
  if (!allowedKinds.includes(kind)) {
    res.status(400);
    throw new Error("Choose which document you're uploading.");
  }
  if (!req.file) {
    res.status(400);
    throw new Error("Choose a file to upload.");
  }

  const result = await storage.uploadPrivate(req.file, `bhi/applications/${app._id}`);

  // One file per applicant document type — replace the previous upload.
  const previous = app.documents.filter((d) => d.kind === kind && d.uploadedBy === "applicant");
  app.documents = app.documents.filter((d) => !(d.kind === kind && d.uploadedBy === "applicant"));
  app.documents.push(storage.toDocumentRecord(req.file, result, { kind, uploadedBy: "applicant" }));
  app.log("document_uploaded", { byApplicant: true, detail: kind });
  await app.save();
  previous.forEach((d) => fireAndForget(storage.deletePrivate(d), "Delete replaced document"));

  res.status(201).json({ success: true, application: svc.toApplicantView(app) });
});

// DELETE /api/bhi/public/applications/:id/documents/:docId
const deleteDocument = asyncHandler(async (req, res) => {
  const app = req.application;
  const doc = app.documents.id(req.params.docId);
  if (!doc || doc.uploadedBy !== "applicant") {
    res.status(404);
    throw new Error("Document not found.");
  }
  app.documents.pull(doc._id);
  app.log("document_removed", { byApplicant: true, detail: doc.kind });
  await app.save();
  fireAndForget(storage.deletePrivate(doc), "Delete document");
  res.json({ success: true, application: svc.toApplicantView(app) });
});

// POST /api/bhi/public/applications/:id/submit
// Body: { signatureImage: "data:image/png;base64,…", typedName, agreements: { key: true } }
const submitApplication = asyncHandler(async (req, res) => {
  const app = req.application;
  const { signatureImage = "", typedName = "", agreements = {} } = req.body || {};

  const signatureOk =
    typeof signatureImage === "string" &&
    signatureImage.startsWith("data:image/png;base64,") &&
    signatureImage.length > 200 &&
    Buffer.byteLength(signatureImage) <= MAX_SIGNATURE_BYTES;

  const program = app.program?.requested ? await BhiProgram.findById(app.program.requested) : null;

  const errors = svc.validateForSubmit(app, {
    program,
    signatureProvided: signatureOk,
    agreementsAccepted: agreements,
    typedName,
  });
  if (errors.length) {
    return res.status(422).json({
      success: false,
      message: "Some required information is missing. Fix the items listed and submit again.",
      errors,
    });
  }

  const now = new Date();
  const ip = clientIp(req);
  const ua = userAgent(req);
  app.signatureImage = signatureImage;
  app.signatures = forms.agreementsFor(app.category).map((a) => ({
    key: a.key,
    title: a.title,
    version: a.version,
    accepted: Boolean(agreements[a.key]),
    typedName: agreements[a.key] ? typedName.trim() : "",
    signedAt: agreements[a.key] ? now : undefined,
    ip,
    userAgent: ua,
  }));

  const snapshot = svc.buildFeeSnapshot(app.category, program);
  app.feeSnapshot = snapshot || undefined;

  const wasResubmission = app.status === "NeedsInfo";
  app.status = "Submitted";
  app.submittedAt = now;
  app.submittedFromIp = ip;
  app.infoRequest = "";
  app.log(wasResubmission ? "resubmitted" : "submitted", { byApplicant: true });
  await app.save();

  fireAndForget(
    sendEnrollmentSubmitted(app.personal.email, {
      name: app.personal.firstName,
      applicationNumber: app.applicationNumber,
      programName: program?.name,
    }),
    "Enrollment submitted email"
  );

  res.json({ success: true, application: svc.toApplicantView(app) });
});

// POST /api/bhi/public/resume-link  { email }
// Issues a fresh link for every open application under that email. Always
// responds the same way so it can't be used to discover who has applied.
const requestResumeLink = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (/^\S+@\S+\.\S+$/.test(email)) {
    const apps = await BhiApplication.find({
      "personal.email": email,
      status: { $in: BhiApplication.APPLICANT_EDITABLE },
    }).select("+accessTokenHash");
    for (const app of apps) {
      const token = newToken();
      app.accessTokenHash = hashToken(token); // old links stop working
      app.log("resume_link_requested", { byApplicant: true });
      await app.save();
      fireAndForget(
        sendEnrollmentResumeLink(email, {
          name: app.personal.firstName,
          applicationNumber: app.applicationNumber,
          url: resumeUrl(app, token),
        }),
        "Enrollment resume email"
      );
    }
  }
  res.json({
    success: true,
    message: "If there's an open application for that email, we've sent a link to continue it.",
  });
});

module.exports = {
  loadApplicantApplication,
  requireEditable,
  getEnrollmentConfig,
  startApplication,
  getApplication,
  saveApplication,
  uploadDocument,
  deleteDocument,
  submitApplication,
  requestResumeLink,
  resumeUrl,
};
