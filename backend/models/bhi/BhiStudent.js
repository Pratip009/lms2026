const mongoose = require("mongoose");

// ─── BHI Student Profile (§4) ─────────────────────────────
// NOTE: per §2 "Roles & Permissions", only Teacher and Admin have logins.
// A BHI student is a roster/case record managed by Admins — it is
// intentionally NOT a User account, and is completely separate from the
// existing course-purchasing "student" role on the User model.
const bhiStudentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true, unique: true },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: { type: String, trim: true, default: "" },

    // ─── Case / grant info ───────────────────────────────
    caseNumber: { type: String, trim: true, default: "" },
    caseworker: {
      name: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, lowercase: true, default: "" },
      phone: { type: String, trim: true, default: "" },
    },
    organization: {
      type: String,
      enum: ["HCDFS", "EQUSS", "PRIVATE", ""],
      default: "",
    },
    status: {
      type: String,
      enum: ["SNAP", "GA", "TANF", ""],
      default: "",
    },
    courseCode: { type: String, trim: true, default: "" },

    // ─── Enrollment status (§14, §24) ────────────────────
    enrollmentStatus: {
      type: String,
      enum: ["Active", "Completed", "Withdrawn", "Transferred", "Terminated"],
      default: "Active",
    },

    // ─── Never hard-deleted (§4, cross-cutting #1) ───────
    isArchived: { type: Boolean, default: false },

    // ─── Manual override of auto-calculated color/status (§11, §35) ─────
    colorOverride: {
      type: String,
      enum: ["Green", "Orange", "Red", null],
      default: null,
    },
    colorOverrideReason: { type: String, trim: true, default: "" },
    colorOverrideBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

bhiStudentSchema.index({ lastName: 1, firstName: 1 });
bhiStudentSchema.index({ studentId: 1 }, { unique: true });
bhiStudentSchema.index({ "caseworker.name": 1 });
bhiStudentSchema.index({ organization: 1 });
bhiStudentSchema.index({ enrollmentStatus: 1 });
bhiStudentSchema.index({ courseCode: 1 });

bhiStudentSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual: this student's class enrollments (Primary Program + Support Class)
bhiStudentSchema.virtual("enrollments", {
  ref: "BhiEnrollment",
  localField: "_id",
  foreignField: "student",
});

bhiStudentSchema.set("toJSON", { virtuals: true });
bhiStudentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("BhiStudent", bhiStudentSchema);
