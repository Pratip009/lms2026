const mongoose = require("mongoose");
const {
  CATEGORY_CODES,
  LOCATION_CODES,
  ALL_DOCUMENT_KINDS,
} = require("../../config/bhiEnrollmentForms");

/**
 * BHI Online Enrollment Application
 * ─────────────────────────────────
 * Digital replacement for the paper enrollment packet. One document per
 * applicant. Workflow:
 *
 *   Draft → Submitted → UnderReview → (NeedsInfo ⇄ Submitted) → Approved → Enrolled
 *                                   ↘ Rejected
 *
 * "Enrolled" means an admin converted it into a BhiStudent (+ optional class
 * enrollments), which is what connects the student to attendance tracking.
 *
 * Applicants have no login: they hold a random access token (only its sha256
 * hash is stored) that lets them save, resume, and — when status is NeedsInfo —
 * edit and resubmit.
 */

const { Schema } = mongoose;
const S = (extra = {}) => ({ type: String, trim: true, default: "", ...extra });
const YesNo = { type: String, enum: ["", "yes", "no"], default: "" };

const STATUSES = ["Draft", "Submitted", "UnderReview", "NeedsInfo", "Approved", "Rejected", "Enrolled"];
const APPLICANT_EDITABLE = ["Draft", "NeedsInfo"];

const addressSchema = new Schema(
  { street: S(), city: S(), state: S({ default: "NJ" }), zip: S(), county: S() },
  { _id: false }
);

const documentSchema = new Schema(
  {
    kind: { type: String, enum: ALL_DOCUMENT_KINDS, required: true },
    fileName: S(),
    mimeType: S(),
    size: { type: Number, default: 0 },
    // Cloudinary private asset — never exposed directly; admins get short-lived signed URLs.
    publicId: S(),
    resourceType: S(),
    format: S(),
    uploadedBy: { type: String, enum: ["applicant", "staff"], default: "applicant" },
    uploadedByUser: { type: Schema.Types.ObjectId, ref: "User", default: null },
    review: {
      status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
      note: S(),
      by: { type: Schema.Types.ObjectId, ref: "User", default: null },
      at: Date,
    },
  },
  { timestamps: true }
);

const signatureSchema = new Schema(
  {
    key: { type: String, required: true },
    title: S(),
    version: S(),
    accepted: { type: Boolean, default: false },
    typedName: S(),
    signedAt: Date,
    ip: S(),
    userAgent: S(),
  },
  { _id: false }
);

const applicationSchema = new Schema(
  {
    applicationNumber: { type: String, unique: true, index: true },
    category: { type: String, enum: CATEGORY_CODES, required: true },
    status: { type: String, enum: STATUSES, default: "Draft", index: true },
    accessTokenHash: { type: String, select: false },
    currentStep: { type: String, default: "" },

    // ─── Program choice ────────────────────────────────────
    program: {
      requested: { type: Schema.Types.ObjectId, ref: "BhiProgram", default: null },
      preferredLocation: { type: String, enum: ["", ...LOCATION_CODES], default: "" },
      supportInterests: [{ type: Schema.Types.ObjectId, ref: "BhiProgram" }],
      preferredSchedule: S(),
    },

    // ─── Student Data (pg. 4) + Background Check identity (pg. 6) ──
    personal: {
      firstName: S(),
      middleName: S(),
      lastName: S(),
      otherNames: S(), // maiden / other names used
      dob: S(), // YYYY-MM-DD
      ssnEncrypted: { type: String, default: "", select: false },
      ssnLast4: S(),
      gender: S(),
      hispanic: YesNo,
      race: [{ type: String }],
      address: { type: addressSchema, default: () => ({}) },
      cellPhone: S(),
      homePhone: S(),
      workPhone: S(),
      email: S({ lowercase: true }),
      gmail: S({ lowercase: true }), // required — used for Google Classroom
      usCitizen: YesNo,
      alienRegNumber: S(),
      alienRegExpiration: S(),
      social: { facebook: S(), twitter: S(), linkedin: S() },
    },

    // ─── Agency / case info (funded students only) ─────────
    agency: {
      caseNumber: S(),
      benefitStatus: { type: String, enum: ["", "SNAP", "GA", "TANF"], default: "" },
      caseworker: { name: S(), email: S({ lowercase: true }), phone: S() },
    },

    // ─── Educational Background (pg. 5) ────────────────────
    education: {
      highSchoolName: S(),
      highSchoolAddress: S(),
      highSchoolYear: S(),
      hasDiploma: YesNo,
      hasGed: YesNo,
      seekingGed: YesNo,
      tabeReading: S(),
      tabeMath: S(),
      collegeName: S(),
      collegeDegree: S(),
      collegeAddress: S(),
      collegeYear: S(),
      metWorkforceCounselor: YesNo,
      hadFacilityTour: YesNo,
    },

    // ─── Payment information (private students only) ───────
    funding: {
      plan: S(),
      seekingWorkforceFunding: YesNo,
    },

    // ─── Workforce NJ Customer Registration ────────────────
    workforce: {
      schoolStatus: S(),
      highestGradeCompleted: S(),
      employmentStatus: S(),
      jobBankResume: YesNo,
      keepInfoConfidential: YesNo,
      migrantWorker: YesNo,
      contactMethods: [{ type: String }],
      employmentDesire: { fullTime: Boolean, partTime: Boolean, permanent: Boolean, temporary: Boolean },
      shifts: [{ type: String }],
      minimumPay: S(),
      military: { branch: S(), from: S(), to: S(), disability: S(), campaignVeteran: Boolean },
      jobObjective: S(),
      interestedInTraining: YesNo,
      travelDistance: S(),
      workHistory: {
        jobTitle: S(), employer: S(), street: S(), city: S(), state: S(),
        startDate: S(), endDate: S(), wage: S(), wagePer: S(),
        reasonForLeaving: S(), duties: S(),
      },
      additionalSkills: S(),
      driversLicense: [{ type: String }],
      driversLicenseState: S(),
    },

    // ─── Emergency Medical Statement (pg. 7) ───────────────
    emergency: {
      contacts: {
        type: [{ name: S(), relationship: S(), phone: S(), _id: false }],
        default: () => [{}, {}],
      },
      physicianName: S(),
      physicianPhone: S(),
      conditions: {
        vision: Boolean, hearing: Boolean, dizziness: Boolean, learningDisorder: Boolean,
        bloodPressure: Boolean, diabetes: Boolean, epilepsy: Boolean, asthma: Boolean,
      },
      otherCondition: S(),
      conditionsExplain: S(),
      drugReaction: YesNo,
      drugReactionExplain: S(),
      takingMedication: YesNo,
      medicationExplain: S(),
      infections: YesNo,
      infectionsExplain: S(),
    },

    // ─── Background Check (pg. 6) ──────────────────────────
    background: {
      arrestedOrConvicted: YesNo,
      abuseOrSexualCrimes: YesNo,
      lifestyleConcern: YesNo,
      explanation: S(),
      expungement: S(),
    },

    // ─── Uploads & e-signatures ────────────────────────────
    documents: [documentSchema],
    signatureImage: { type: String, default: "", select: false }, // PNG data URL of drawn signature
    signatures: [signatureSchema],

    // Fee snapshot taken at submission (PRIVATE only — always empty for funded)
    feeSnapshot: {
      tuition: Number, fees: Number, books: Number, tools: Number, other: Number, total: Number,
      applicationFee: Number, registrationFee: Number,
    },

    submittedAt: Date,
    submittedFromIp: S(),

    // ─── Admin review ──────────────────────────────────────
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
    notes: [
      {
        text: { type: String, required: true, trim: true },
        by: { type: Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
      },
    ],
    activity: [
      {
        action: { type: String, required: true },
        detail: S(),
        by: { type: Schema.Types.ObjectId, ref: "User", default: null },
        byApplicant: { type: Boolean, default: false },
        at: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    infoRequest: S(), // message shown to applicant when status = NeedsInfo

    student: { type: Schema.Types.ObjectId, ref: "BhiStudent", default: null },
  },
  { timestamps: true }
);

applicationSchema.index({ category: 1, status: 1 });
applicationSchema.index({ "personal.lastName": 1, "personal.firstName": 1 });
applicationSchema.index({ "personal.email": 1 });
applicationSchema.index({ submittedAt: -1 });

applicationSchema.statics.STATUSES = STATUSES;
applicationSchema.statics.APPLICANT_EDITABLE = APPLICANT_EDITABLE;

applicationSchema.methods.log = function (action, { detail = "", by = null, byApplicant = false } = {}) {
  this.activity.push({ action, detail, by, byApplicant, at: new Date() });
};

applicationSchema.virtual("fullName").get(function () {
  const p = this.personal || {};
  return [p.firstName, p.lastName].filter(Boolean).join(" ");
});

// BHI-2026-000123 style, sequential per year.
applicationSchema.pre("validate", async function (next) {
  if (this.applicationNumber) return next();
  const year = new Date().getFullYear();
  const prefix = `BHI-${year}-`;
  const last = await this.constructor
    .findOne({ applicationNumber: new RegExp(`^${prefix}`) })
    .sort({ applicationNumber: -1 })
    .select("applicationNumber")
    .lean();
  const n = last ? parseInt(last.applicationNumber.slice(prefix.length), 10) + 1 : 1;
  this.applicationNumber = `${prefix}${String(n).padStart(6, "0")}`;
  next();
});

applicationSchema.set("toJSON", { virtuals: true });
applicationSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("BhiApplication", applicationSchema);
