const asyncHandler = require("express-async-handler");
const BhiApplication = require("../../models/bhi/BhiApplication");
const BhiProgram = require("../../models/bhi/BhiProgram");
const BhiClass = require("../../models/bhi/BhiClass");
const BhiStudent = require("../../models/bhi/BhiStudent");
const BhiEnrollment = require("../../models/bhi/BhiEnrollment");
const forms = require("../../config/bhiEnrollmentForms");
const { decrypt, newToken, hashToken } = require("../../utils/bhiCrypto");
const storage = require("../../utils/bhiDocumentStorage");
const { buildApplicationPdf } = require("../../utils/bhiApplicationPdf");
const { sendEnrollmentInfoRequest } = require("../../utils/emailService");
const { resumeUrl } = require("./bhiEnrollmentPublicController");

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Allowed admin status moves. "Enrolled" is only reachable via convertToStudent.
const TRANSITIONS = {
  Draft: ["Rejected"],
  Submitted: ["UnderReview", "NeedsInfo", "Approved", "Rejected"],
  UnderReview: ["NeedsInfo", "Approved", "Rejected"],
  NeedsInfo: ["UnderReview", "Rejected"],
  Approved: ["UnderReview", "Rejected"],
  Rejected: ["UnderReview"],
  Enrolled: [],
};

const loadApp = async (id, res, select = "") => {
  const app = await BhiApplication.findById(id).select(select);
  if (!app) {
    res.status(404);
    throw new Error("Application not found.");
  }
  return app;
};

const adminView = (app) => {
  const o = app.toObject({ virtuals: true });
  if (o.personal) delete o.personal.ssnEncrypted;
  delete o.accessTokenHash;
  o.documents = (o.documents || []).map((d) => {
    const { publicId, ...rest } = d; // never expose storage ids
    return rest;
  });
  o.funded = forms.isFunded(o.category);
  return o;
};

// GET /api/bhi/applications?status=&category=&location=&program=&search=&page=&limit=
const listApplications = asyncHandler(async (req, res) => {
  const { status, category, location, program, search } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));

  const filter = {};
  // Drafts are noise in the review queue unless explicitly asked for.
  if (status) filter.status = status;
  else filter.status = { $ne: "Draft" };
  if (category) filter.category = category;
  if (location) filter["program.preferredLocation"] = location;
  if (program) filter["program.requested"] = program;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    filter.$or = [
      { "personal.firstName": rx },
      { "personal.lastName": rx },
      { "personal.email": rx },
      { "personal.gmail": rx },
      { applicationNumber: rx },
    ];
  }

  const [items, total, counts] = await Promise.all([
    BhiApplication.find(filter)
      .select("applicationNumber category status personal.firstName personal.lastName personal.email personal.gmail program submittedAt createdAt updatedAt documents.kind documents.review.status student")
      .populate("program.requested", "name courseCode")
      .sort({ submittedAt: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean({ virtuals: false }),
    BhiApplication.countDocuments(filter),
    BhiApplication.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
  ]);

  res.json({
    success: true,
    applications: items,
    counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// GET /api/bhi/applications/:id
const getApplication = asyncHandler(async (req, res) => {
  const app = await BhiApplication.findById(req.params.id)
    .select("+signatureImage")
    .populate("program.requested")
    .populate("program.supportInterests", "name")
    .populate("notes.by", "name")
    .populate("activity.by", "name")
    .populate("documents.review.by", "name")
    .populate("student", "firstName lastName studentId enrollmentStatus");
  if (!app) {
    res.status(404);
    throw new Error("Application not found.");
  }
  res.json({
    success: true,
    application: adminView(app),
    allowedTransitions: TRANSITIONS[app.status] || [],
    documentTypes: { applicant: forms.applicantDocumentsFor(app.category), staff: forms.STAFF_DOCUMENTS },
    agreements: forms.agreementsFor(app.category).map(({ key, title, version, optional }) => ({ key, title, version, optional })),
  });
});

// POST /api/bhi/applications/:id/reveal-ssn — audited
const revealSsn = asyncHandler(async (req, res) => {
  const app = await loadApp(req.params.id, res, "+personal.ssnEncrypted");
  if (!app.personal?.ssnEncrypted) {
    res.status(404);
    throw new Error("No Social Security number on file.");
  }
  const ssn = decrypt(app.personal.ssnEncrypted);
  app.log("ssn_viewed", { by: req.user._id });
  await app.save();
  res.json({ success: true, ssn: `${ssn.slice(0, 3)}-${ssn.slice(3, 5)}-${ssn.slice(5)}` });
});

// PATCH /api/bhi/applications/:id/status  { status, message }
const updateStatus = asyncHandler(async (req, res) => {
  const { status, message = "" } = req.body || {};
  const app = await loadApp(req.params.id, res, "+accessTokenHash");

  if (!(TRANSITIONS[app.status] || []).includes(status)) {
    res.status(400);
    throw new Error(`An application that is ${app.status} can't be moved to ${status}.`);
  }
  if ((status === "NeedsInfo" || status === "Rejected") && !String(message).trim()) {
    res.status(400);
    throw new Error(status === "NeedsInfo"
      ? "Tell the applicant what they need to fix or provide."
      : "Add a reason for rejecting this application.");
  }

  const from = app.status;
  app.status = status;
  app.log("status_changed", { by: req.user._id, detail: `${from} → ${status}${message ? `: ${message}` : ""}` });
  if (message) app.notes.push({ text: `[${status}] ${message}`, by: req.user._id });
  if (!app.assignedTo) app.assignedTo = req.user._id;

  let emailed = false;
  if (status === "NeedsInfo") {
    app.infoRequest = String(message).trim();
    const token = newToken();
    app.accessTokenHash = hashToken(token); // fresh link in the email
    try {
      await sendEnrollmentInfoRequest(app.personal.email, {
        name: app.personal.firstName,
        applicationNumber: app.applicationNumber,
        message: app.infoRequest,
        url: resumeUrl(app, token),
      });
      emailed = true;
    } catch (err) {
      console.error("❌ Info-request email:", err.message);
    }
  }
  await app.save();
  res.json({ success: true, status: app.status, emailed });
});

// POST /api/bhi/applications/:id/notes  { text }
const addNote = asyncHandler(async (req, res) => {
  const text = String(req.body?.text || "").trim();
  if (!text) {
    res.status(400);
    throw new Error("Write a note first.");
  }
  const app = await loadApp(req.params.id, res);
  app.notes.push({ text: text.slice(0, 4000), by: req.user._id });
  await app.save();
  await app.populate("notes.by", "name");
  res.status(201).json({ success: true, notes: app.notes });
});

// PATCH /api/bhi/applications/:id/documents/:docId/review  { status: verified|rejected|pending, note }
const reviewDocument = asyncHandler(async (req, res) => {
  const { status, note = "" } = req.body || {};
  if (!["verified", "rejected", "pending"].includes(status)) {
    res.status(400);
    throw new Error("Status must be verified, rejected or pending.");
  }
  if (status === "rejected" && !note.trim()) {
    res.status(400);
    throw new Error("Say why the document was rejected so the applicant can fix it.");
  }
  const app = await loadApp(req.params.id, res);
  const doc = app.documents.id(req.params.docId);
  if (!doc) {
    res.status(404);
    throw new Error("Document not found.");
  }
  doc.review = { status, note: note.trim(), by: req.user._id, at: new Date() };
  app.log("document_reviewed", { by: req.user._id, detail: `${doc.kind}: ${status}` });
  await app.save();
  res.json({ success: true, document: { _id: doc._id, kind: doc.kind, review: doc.review } });
});

// GET /api/bhi/applications/:id/documents/:docId/url?download=1 — 5-minute signed URL, audited
const getDocumentUrl = asyncHandler(async (req, res) => {
  const app = await loadApp(req.params.id, res);
  const doc = app.documents.id(req.params.docId);
  if (!doc) {
    res.status(404);
    throw new Error("Document not found.");
  }
  const url = storage.getSignedUrl(doc, { attachment: req.query.download === "1" });
  app.log("document_viewed", { by: req.user._id, detail: doc.kind });
  await app.save();
  res.json({ success: true, url, expiresInSeconds: 300 });
});

// POST /api/bhi/applications/:id/documents  (multipart: file, kind) — staff upload
const uploadStaffDocument = asyncHandler(async (req, res) => {
  const app = await loadApp(req.params.id, res);
  const kind = req.body.kind;
  if (!forms.ALL_DOCUMENT_KINDS.includes(kind)) {
    res.status(400);
    throw new Error("Choose a document type.");
  }
  if (!req.file) {
    res.status(400);
    throw new Error("Choose a file to upload.");
  }
  const result = await storage.uploadPrivate(req.file, `bhi/applications/${app._id}`);
  app.documents.push(
    storage.toDocumentRecord(req.file, result, {
      kind,
      uploadedBy: "staff",
      uploadedByUser: req.user._id,
      review: { status: "verified", by: req.user._id, at: new Date() },
    })
  );
  app.log("document_uploaded", { by: req.user._id, detail: kind });
  await app.save();
  res.status(201).json({ success: true, application: adminView(app) });
});

// POST /api/bhi/applications/:id/convert
// Body: { studentId, location, courseCode?, primary?: { class, startDate, expectedEndDate },
//         support?: { class, startDate, expectedEndDate } }
// Creates the BhiStudent record that attendance tracking runs on.
const convertToStudent = asyncHandler(async (req, res) => {
  const { studentId, location, courseCode, primary, support } = req.body || {};
  const app = await loadApp(req.params.id, res);

  if (app.status !== "Approved") {
    res.status(400);
    throw new Error("Approve the application before enrolling the student.");
  }
  if (!studentId || !String(studentId).trim()) {
    res.status(400);
    throw new Error("Enter a Student ID.");
  }
  if (location && !forms.LOCATION_CODES.includes(location)) {
    res.status(400);
    throw new Error("Choose a valid campus.");
  }
  if (await BhiStudent.exists({ studentId: String(studentId).trim() })) {
    res.status(409);
    throw new Error("That Student ID is already in use.");
  }

  // Validate class assignments up front so we don't leave half-created records.
  const assignments = [];
  for (const [role, a] of [["primary", primary], ["support", support]]) {
    if (!a?.class) continue;
    const cls = await BhiClass.findById(a.class).populate("program", "type offeredAsSupport");
    if (!cls || !cls.isActive) {
      res.status(400);
      throw new Error(`The ${role} class you chose isn't available.`);
    }
    if (!DATE_RE.test(a.startDate || "") || !DATE_RE.test(a.expectedEndDate || "") || a.expectedEndDate < a.startDate) {
      res.status(400);
      throw new Error(`Enter a valid start and expected end date for the ${role} class.`);
    }
    assignments.push({ role, cls, startDate: a.startDate, expectedEndDate: a.expectedEndDate });
  }

  const program = app.program?.requested ? await BhiProgram.findById(app.program.requested) : null;
  const p = app.personal;
  const address = [p.address?.street, p.address?.city, p.address?.state, p.address?.zip].filter(Boolean).join(", ");

  const student = await BhiStudent.create({
    firstName: p.firstName,
    lastName: p.lastName,
    studentId: String(studentId).trim(),
    phone: p.cellPhone,
    email: p.email,
    gmail: p.gmail,
    dob: p.dob,
    address,
    caseNumber: app.agency?.caseNumber || "",
    caseworker: app.agency?.caseworker || {},
    organization: app.category,
    status: app.agency?.benefitStatus || "",
    courseCode: courseCode || program?.courseCode || "",
    location: location || app.program?.preferredLocation || "",
    application: app._id,
    createdBy: req.user._id,
  });

  const enrollments = [];
  try {
    for (const a of assignments) {
      enrollments.push(
        await BhiEnrollment.create({
          student: student._id,
          class: a.cls._id,
          role: a.role,
          startDate: a.startDate,
          expectedEndDate: a.expectedEndDate,
        })
      );
    }
  } catch (err) {
    // Roll back so the admin can retry cleanly.
    await BhiEnrollment.deleteMany({ student: student._id });
    await BhiStudent.deleteOne({ _id: student._id });
    throw err;
  }

  app.student = student._id;
  app.status = "Enrolled";
  app.log("enrolled", {
    by: req.user._id,
    detail: `Student ${student.studentId}${assignments.length ? `; classes: ${assignments.map((a) => a.role).join(", ")}` : ""}`,
  });
  await app.save();

  res.status(201).json({ success: true, student, enrollments });
});

// GET /api/bhi/applications/:id/pdf — signed enrollment packet for the student file
const downloadPdf = asyncHandler(async (req, res) => {
  const app = await BhiApplication.findById(req.params.id)
    .select("+signatureImage")
    .populate("program.requested")
    .populate("program.supportInterests", "name");
  if (!app) {
    res.status(404);
    throw new Error("Application not found.");
  }
  app.log("pdf_downloaded", { by: req.user._id });
  await app.save();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${app.applicationNumber}.pdf"`);
  buildApplicationPdf(app, res);
});

module.exports = {
  TRANSITIONS,
  listApplications,
  getApplication,
  revealSsn,
  updateStatus,
  addNote,
  reviewDocument,
  getDocumentUrl,
  uploadStaffDocument,
  convertToStudent,
  downloadPdf,
};
