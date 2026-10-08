/**
 * End-to-end tests for BHI online enrollment.
 *
 *   MONGO_URI=mongodb://127.0.0.1:27017/bhi_test npm run test:bhi
 *
 * Boots the real Express app against a throwaway database. Only two things
 * are stubbed: Cloudinary uploads and outgoing email.
 */
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT || "5099";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.BHI_ENCRYPTION_KEY = process.env.BHI_ENCRYPTION_KEY || "a".repeat(64);
process.env.CLIENT_URL = "https://bhi.example";
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY || "re_test";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/bhi_test";
process.env.RATE_LIMIT_MAX = "100000";

// ─── Stubs (must be installed before the app is required) ───
const sentEmails = [];
const email = require("../utils/emailService");
for (const fn of ["sendEnrollmentResumeLink", "sendEnrollmentSubmitted", "sendEnrollmentInfoRequest"]) {
  email[fn] = async (to, data) => { sentEmails.push({ fn, to, ...data }); };
}
const storage = require("../utils/bhiDocumentStorage");
let uploadCount = 0;
storage.uploadPrivate = async (file) => ({
  public_id: `test/${++uploadCount}`, resource_type: "image", format: "pdf", bytes: file.size,
});
storage.deletePrivate = async () => {};
storage.getSignedUrl = (doc) => `https://signed.example/${doc.publicId}`;

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const app = require("../server");
const User = require("../models/User");
const BhiProgram = require("../models/bhi/BhiProgram");
const BhiApplication = require("../models/bhi/BhiApplication");
const BhiStudent = require("../models/bhi/BhiStudent");
const BhiEnrollment = require("../models/bhi/BhiEnrollment");
const BhiClass = require("../models/bhi/BhiClass");
const { encrypt, decrypt, normalizeSsn } = require("../utils/bhiCrypto");
const { GMAIL_RE } = require("../utils/bhiApplicationService");

const BASE = `http://127.0.0.1:${process.env.PORT}/api`;
const SIGNATURE = `data:image/png;base64,${fs.readFileSync(path.join(__dirname, "fixtures/signature.png")).toString("base64")}`;

let adminToken, teacherToken, program, ccma;

const call = async (method, url, { body, token, appToken, form } = {}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (appToken) headers["X-Application-Token"] = appToken;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${url}`, { method, headers, body: payload });
  const type = res.headers.get("content-type") || "";
  const data = type.includes("json") ? await res.json() : Buffer.from(await res.arrayBuffer());
  return { status: res.status, data, headers: res.headers };
};

const upload = (id, appToken, kind, { mime = "application/pdf", name = "file.pdf", token } = {}) => {
  const form = new FormData();
  form.append("kind", kind);
  form.append("file", new Blob([fs.readFileSync(path.join(__dirname, "fixtures/resume.pdf"))], { type: mime }), name);
  return call("POST", token ? `/bhi/applications/${id}/documents` : `/bhi/public/applications/${id}/documents`, { appToken, token, form });
};

const fullSections = (programId, extra = {}) => ({
  program: { requested: programId, preferredLocation: "SUMMIT" },
  personal: {
    firstName: "Test", lastName: "Applicant", dob: "1990-04-12", ssn: "123-45-6789",
    address: { street: "1 Main St", city: "Jersey City", state: "NJ", zip: "07306", county: "Hudson" },
    cellPhone: "201-555-0100", email: "test.applicant@example.com", gmail: "test.applicant@gmail.com",
  },
  education: { hasDiploma: "yes" },
  workforce: { employmentStatus: "Not employed" },
  emergency: { contacts: [{ name: "Pat Doe", relationship: "Sister", phone: "201-555-0101" }, {}] },
  background: { arrestedOrConvicted: "no", abuseOrSexualCrimes: "no", lifestyleConcern: "no" },
  ...extra,
});

const acceptAll = (agreements) => Object.fromEntries(agreements.map((a) => [a.key, true]));

before(async () => {
  await new Promise((r) => (mongoose.connection.readyState === 1 ? r() : mongoose.connection.once("open", r)));
  await mongoose.connection.db.dropDatabase();
  await Promise.all([BhiApplication.init(), BhiStudent.init(), BhiProgram.init(), BhiEnrollment.init()]);
  const admin = await User.create({ name: "Mahek Admin", email: "admin@bhi.test", password: "password123", role: "admin" });
  const teacher = await User.create({ name: "T Teacher", email: "teacher@bhi.test", password: "password123", role: "teacher" });
  adminToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET);
  teacherToken = jwt.sign({ id: teacher._id, role: "teacher" }, process.env.JWT_SECRET);
  program = await BhiProgram.create({
    name: "Pharmacy Technician", type: "primary", hours: 300, certification: "MEDCA",
    cost: { tuition: 3500, fees: 100, books: 100, tools: 200, other: 0 },
  });
  ccma = await BhiProgram.create({ name: "Closed Program", type: "primary", openForEnrollment: false });
  await BhiProgram.create({ name: "Digital Literacy", type: "support" });
});

after(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  setImmediate(() => process.exit(0)); // server.js keeps the HTTP listener open
});

// ─── Unit checks ──────────────────────────────────────────
test("SSN encryption round-trips and never stores plaintext", () => {
  const stored = encrypt("123456789");
  assert.ok(!stored.includes("123456789"));
  assert.equal(decrypt(stored), "123456789");
  assert.equal(normalizeSsn("123-45-6789"), "123456789");
  assert.equal(normalizeSsn("12345"), "");
});

test("Gmail rule accepts only Gmail addresses", () => {
  assert.ok(GMAIL_RE.test("a.b+c@gmail.com"));
  assert.ok(!GMAIL_RE.test("a@yahoo.com"));
  assert.ok(!GMAIL_RE.test("a@gmail.co"));
});

// ─── Config: the funding rule ─────────────────────────────
test("Funded categories never receive fee data; private does", async () => {
  for (const cat of ["HCDFS", "EQISS", ""]) {
    const { status, data } = await call("GET", `/bhi/public/enrollment-config?category=${cat}`);
    assert.equal(status, 200);
    const json = JSON.stringify(data);
    assert.ok(!/"cost"|"totalCost"|"tuition"|enrollmentFees|refund_policy|\$25|\$100/.test(json), `fee data leaked for "${cat}"`);
    assert.ok(!data.programs.some((p) => p.name === "Closed Program"), "closed program listed");
  }
  const priv = await call("GET", "/bhi/public/enrollment-config?category=PRIVATE");
  const pharm = priv.data.programs.find((p) => p.name === "Pharmacy Technician");
  assert.equal(pharm.totalCost, 3900);
  assert.deepEqual(priv.data.enrollmentFees, { application: 25, registration: 100 });
  assert.ok(priv.data.agreements.some((a) => a.key === "refund_policy"));
  assert.ok(priv.data.supportClasses.some((s) => s.name === "Digital Literacy"));
});

// ─── Full funded (HCDFS) workflow ─────────────────────────
test("HCDFS applicant: start → save → upload → submit → review → needs info → resubmit → approve → enroll", async () => {
  // Start
  const start = await call("POST", "/bhi/public/applications", {
    body: { category: "HCDFS", personal: { firstName: "Test", lastName: "Applicant", email: "test.applicant@example.com" } },
  });
  assert.equal(start.status, 201);
  const { token } = start.data;
  const id = start.data.application._id;
  assert.match(start.data.application.applicationNumber, /^BHI-\d{4}-\d{6}$/);
  assert.ok(sentEmails.some((e) => e.fn === "sendEnrollmentResumeLink" && e.url.includes(token)));

  // Wrong token looks exactly like a missing application
  assert.equal((await call("GET", `/bhi/public/applications/${id}`, { appToken: "nope" })).status, 404);

  // Save — including fields an applicant must NOT be able to set
  const save = await call("PATCH", `/bhi/public/applications/${id}`, {
    appToken: token,
    body: {
      ...fullSections(program._id, { agency: { caseNumber: "C-1", benefitStatus: "TANF", caseworker: { name: "Case Worker" } } }),
      status: "Approved", feeSnapshot: { total: 1 }, notes: [{ text: "x" }],
      funding: { plan: "I will pay cash" },
    },
  });
  assert.equal(save.status, 200);
  const view = save.data.application;
  assert.equal(view.status, "Draft");
  assert.equal(view.personal.ssnLast4, "6789");
  assert.equal(view.personal.ssnEncrypted, undefined);
  assert.equal(view.funding, undefined, "funded applicant got funding section");
  const raw = await BhiApplication.findById(id).select("+personal.ssnEncrypted").lean();
  assert.ok(raw.personal.ssnEncrypted.startsWith("v1:"));
  assert.equal(raw.funding.plan, "");
  assert.equal(raw.notes.length, 0);

  // Bad SSN is rejected but the rest of the save applies
  const bad = await call("PATCH", `/bhi/public/applications/${id}`, { appToken: token, body: { personal: { ssn: "123" }, education: { tabeMath: "8" } } });
  assert.equal(bad.data.errors[0].field, "personal.ssn");
  assert.equal(bad.data.application.education.tabeMath, "8");
  assert.equal(bad.data.application.personal.ssnLast4, "6789");

  // Uploads
  assert.equal((await upload(id, token, "resume", { mime: "application/x-msdownload", name: "a.exe" })).status, 400);
  assert.equal((await upload(id, token, "progress_report")).status, 400, "applicant uploaded a staff-only type");
  for (const kind of ["resume", "photo_id", "ss_card"]) assert.equal((await upload(id, token, kind)).status, 201);
  const re = await upload(id, token, "resume"); // replace, not duplicate
  assert.equal(re.data.application.documents.filter((d) => d.kind === "resume").length, 1);
  assert.ok(!JSON.stringify(re.data).includes("test/"), "storage id leaked to applicant");

  // Submit with problems → 422 listing what's missing
  const cfg = (await call("GET", "/bhi/public/enrollment-config?category=HCDFS")).data;
  const missing = await call("POST", `/bhi/public/applications/${id}/submit`, {
    appToken: token, body: { signatureImage: "", typedName: "Wrong Name", agreements: {} },
  });
  assert.equal(missing.status, 422);
  const fields = missing.data.errors.map((e) => e.field);
  assert.ok(fields.includes("signature") && fields.includes("typedName") && fields.includes("agreements.enrollment_agreement"));
  assert.ok(!fields.includes("agreements.photo_release"), "optional agreement treated as required");

  // Submit properly
  const sub = await call("POST", `/bhi/public/applications/${id}/submit`, {
    appToken: token, body: { signatureImage: SIGNATURE, typedName: "test  applicant", agreements: acceptAll(cfg.agreements) },
  });
  assert.equal(sub.status, 200, JSON.stringify(sub.data));
  assert.equal(sub.data.application.status, "Submitted");
  assert.equal(sub.data.application.feeSnapshot, undefined);
  assert.ok(!/tuition|feeSnapshot/i.test(JSON.stringify(sub.data)));
  const stored = await BhiApplication.findById(id).lean();
  assert.equal(stored.feeSnapshot?.total, undefined);
  assert.ok(stored.signatures.every((s) => s.key !== "refund_policy"));
  assert.ok(stored.signatures.find((s) => s.key === "enrollment_agreement").signedAt);

  // Locked after submit
  assert.equal((await call("PATCH", `/bhi/public/applications/${id}`, { appToken: token, body: { personal: { firstName: "X" } } })).status, 409);

  // Admin access control
  assert.equal((await call("GET", "/bhi/applications", {})).status, 401);
  assert.equal((await call("GET", "/bhi/applications", { token: teacherToken })).status, 403);

  // Admin list / detail
  const list = await call("GET", "/bhi/applications?category=HCDFS&search=applicant", { token: adminToken });
  assert.equal(list.status, 200);
  assert.equal(list.data.applications.length, 1);
  assert.equal(list.data.counts.Submitted, 1);
  const detail = await call("GET", `/bhi/applications/${id}`, { token: adminToken });
  assert.equal(detail.data.application.personal.ssnEncrypted, undefined);
  assert.ok(!JSON.stringify(detail.data).includes('"publicId"'));
  assert.ok(detail.data.application.signatureImage.startsWith("data:image/png"));
  assert.deepEqual(detail.data.allowedTransitions, ["UnderReview", "NeedsInfo", "Approved", "Rejected"]);

  // SSN reveal is logged
  const ssn = await call("POST", `/bhi/applications/${id}/reveal-ssn`, { token: adminToken });
  assert.equal(ssn.data.ssn, "123-45-6789");

  // Document review + signed URL
  const docId = detail.data.application.documents.find((d) => d.kind === "photo_id")._id;
  assert.equal((await call("PATCH", `/bhi/applications/${id}/documents/${docId}/review`, { token: adminToken, body: { status: "rejected" } })).status, 400);
  assert.equal((await call("PATCH", `/bhi/applications/${id}/documents/${docId}/review`, { token: adminToken, body: { status: "rejected", note: "Photo is blurry" } })).status, 200);
  const url = await call("GET", `/bhi/applications/${id}/documents/${docId}/url`, { token: adminToken });
  assert.match(url.data.url, /^https:\/\/signed\.example\//);

  // Invalid transitions
  assert.equal((await call("PATCH", `/bhi/applications/${id}/status`, { token: adminToken, body: { status: "Enrolled" } })).status, 400);
  assert.equal((await call("PATCH", `/bhi/applications/${id}/status`, { token: adminToken, body: { status: "NeedsInfo" } })).status, 400);

  // Needs info → email with a fresh link; old link stops working
  const ni = await call("PATCH", `/bhi/applications/${id}/status`, {
    token: adminToken, body: { status: "NeedsInfo", message: "Please re-upload a clear photo ID." },
  });
  assert.equal(ni.data.emailed, true);
  const infoEmail = sentEmails.filter((e) => e.fn === "sendEnrollmentInfoRequest").pop();
  const newToken = new URL(infoEmail.url).searchParams.get("token");
  assert.notEqual(newToken, token);
  assert.equal((await call("GET", `/bhi/public/applications/${id}`, { appToken: token })).status, 404);
  const reopened = await call("GET", `/bhi/public/applications/${id}`, { appToken: newToken });
  assert.equal(reopened.data.application.infoRequest, "Please re-upload a clear photo ID.");
  assert.equal(reopened.data.application.documents.find((d) => d.kind === "photo_id").review.note, "Photo is blurry");

  // Applicant fixes and resubmits
  assert.equal((await upload(id, newToken, "photo_id")).status, 201);
  const resub = await call("POST", `/bhi/public/applications/${id}/submit`, {
    appToken: newToken, body: { signatureImage: SIGNATURE, typedName: "Test Applicant", agreements: acceptAll(cfg.agreements) },
  });
  assert.equal(resub.status, 200);
  assert.equal(resub.data.application.infoRequest, "");

  // Approve, then enroll into a class that has no teacher yet
  assert.equal((await call("PATCH", `/bhi/applications/${id}/status`, { token: adminToken, body: { status: "Approved" } })).status, 200);
  const cls = await call("POST", "/bhi/classes", { token: adminToken, body: { program: program._id, sectionName: "Oct cohort", location: "SUMMIT" } });
  assert.equal(cls.status, 201, JSON.stringify(cls.data));
  assert.equal(cls.data.class.teacher, null);

  const badDates = await call("POST", `/bhi/applications/${id}/convert`, {
    token: adminToken, body: { studentId: "S-1001", primary: { class: cls.data.class._id, startDate: "2026-11-02", expectedEndDate: "2026-10-01" } },
  });
  assert.equal(badDates.status, 400);
  assert.equal(await BhiStudent.countDocuments(), 0, "partial student created on validation failure");

  const conv = await call("POST", `/bhi/applications/${id}/convert`, {
    token: adminToken,
    body: { studentId: "S-1001", location: "SUMMIT", primary: { class: cls.data.class._id, startDate: "2026-11-02", expectedEndDate: "2027-03-31" } },
  });
  assert.equal(conv.status, 201, JSON.stringify(conv.data));
  const student = await BhiStudent.findById(conv.data.student._id).lean();
  assert.equal(student.organization, "HCDFS");
  assert.equal(student.gmail, "test.applicant@gmail.com");
  assert.equal(student.caseworker.name, "Case Worker");
  assert.equal(student.status, "TANF");
  assert.equal(String(student.application), id);
  assert.equal(await BhiEnrollment.countDocuments({ student: student._id, role: "primary" }), 1);
  assert.equal((await BhiApplication.findById(id)).status, "Enrolled");

  // Class detail works for a teacher-less class (previously crashed on teacher._id)
  const clsDetail = await call("GET", `/bhi/classes/${cls.data.class._id}`, { token: adminToken });
  assert.equal(clsDetail.status, 200);
  assert.equal(clsDetail.data.roster.length, 1);
  assert.equal((await call("GET", `/bhi/classes/${cls.data.class._id}`, { token: teacherToken })).status, 403);

  // Student now appears in the attendance roster for a class day
  const roster = await call("GET", `/bhi/attendance/roster?classId=${cls.data.class._id}&date=2026-11-03`, { token: adminToken });
  assert.equal(roster.status, 200, JSON.stringify(roster.data));
  assert.ok(JSON.stringify(roster.data).includes("S-1001"), "enrolled student missing from attendance roster");

  // Duplicate student id rejected
  await BhiApplication.updateOne({ _id: id }, { status: "Approved" });
  assert.equal((await call("POST", `/bhi/applications/${id}/convert`, { token: adminToken, body: { studentId: "S-1001" } })).status, 409);

  // PDF packet
  const pdf = await call("GET", `/bhi/applications/${id}/pdf`, { token: adminToken });
  assert.equal(pdf.status, 200);
  assert.equal(pdf.data.subarray(0, 4).toString(), "%PDF");
  fs.writeFileSync("/tmp/bhi-funded-packet.pdf", pdf.data);

  const activity = (await BhiApplication.findById(id).lean()).activity.map((a) => a.action);
  for (const a of ["created", "submitted", "ssn_viewed", "document_viewed", "status_changed", "resubmitted", "enrolled", "pdf_downloaded"])
    assert.ok(activity.includes(a), `activity missing ${a}`);
});

// ─── Private applicant: fees appear and are frozen at submission ──
test("Private applicant sees fees and gets a fee snapshot", async () => {
  const start = await call("POST", "/bhi/public/applications", {
    body: { category: "PRIVATE", personal: { firstName: "Priya", lastName: "Payer", email: "priya@example.com" } },
  });
  const { token } = start.data;
  const id = start.data.application._id;
  const sections = fullSections(program._id, { funding: { plan: "Personal savings", seekingWorkforceFunding: "no" } });
  sections.personal = { ...sections.personal, firstName: "Priya", lastName: "Payer", email: "priya@example.com", gmail: "priya@gmail.com" };
  await call("PATCH", `/bhi/public/applications/${id}`, { appToken: token, body: { ...sections, agency: { caseNumber: "should be dropped" } } });
  for (const kind of ["resume", "photo_id", "ss_card"]) await upload(id, token, kind);

  const cfg = (await call("GET", "/bhi/public/enrollment-config?category=PRIVATE")).data;
  const noRefund = acceptAll(cfg.agreements.filter((a) => a.key !== "refund_policy"));
  const r1 = await call("POST", `/bhi/public/applications/${id}/submit`, { appToken: token, body: { signatureImage: SIGNATURE, typedName: "Priya Payer", agreements: noRefund } });
  assert.equal(r1.status, 422);
  assert.ok(r1.data.errors.some((e) => e.field === "agreements.refund_policy"));

  const r2 = await call("POST", `/bhi/public/applications/${id}/submit`, { appToken: token, body: { signatureImage: SIGNATURE, typedName: "Priya Payer", agreements: acceptAll(cfg.agreements) } });
  assert.equal(r2.status, 200, JSON.stringify(r2.data));
  assert.deepEqual(
    { total: r2.data.application.feeSnapshot.total, app: r2.data.application.feeSnapshot.applicationFee, reg: r2.data.application.feeSnapshot.registrationFee },
    { total: 3900, app: 25, reg: 100 }
  );
  const stored = await BhiApplication.findById(id).lean();
  assert.equal(stored.agency.caseNumber, "");
  assert.equal(stored.funding.plan, "Personal savings");

  // Later price changes don't alter what the student agreed to
  await BhiProgram.updateOne({ _id: program._id }, { "cost.tuition": 9999 });
  const again = await call("GET", `/bhi/public/applications/${id}`, { appToken: token });
  assert.equal(again.data.application.feeSnapshot.total, 3900);
  await BhiProgram.updateOne({ _id: program._id }, { "cost.tuition": 3500 });

  const pdf = await call("GET", `/bhi/applications/${id}/pdf`, { token: adminToken });
  fs.writeFileSync("/tmp/bhi-private-packet.pdf", pdf.data);
});

test("Closed programs can't be submitted and resume-link responds the same either way", async () => {
  const start = await call("POST", "/bhi/public/applications", {
    body: { category: "EQISS", personal: { firstName: "Ed", lastName: "Quiss", email: "ed@example.com" } },
  });
  const { token } = start.data;
  const id = start.data.application._id;
  await call("PATCH", `/bhi/public/applications/${id}`, { appToken: token, body: { program: { requested: ccma._id, preferredLocation: "BERGEN" } } });
  const sub = await call("POST", `/bhi/public/applications/${id}/submit`, { appToken: token, body: {} });
  assert.ok(sub.data.errors.some((e) => e.field === "program.requested" && /isn't open/.test(e.message)));

  const known = await call("POST", "/bhi/public/resume-link", { body: { email: "ed@example.com" } });
  const unknown = await call("POST", "/bhi/public/resume-link", { body: { email: "nobody@example.com" } });
  assert.deepEqual(known.data, unknown.data);
  assert.equal((await call("GET", `/bhi/public/applications/${id}`, { appToken: token })).status, 404, "old link still valid after resume request");

  // Admin queue hides drafts by default
  const q = await call("GET", "/bhi/applications", { token: adminToken });
  assert.ok(!q.data.applications.some((a) => a._id === id));
  const drafts = await call("GET", "/bhi/applications?status=Draft", { token: adminToken });
  assert.ok(drafts.data.applications.some((a) => a._id === id));
});
