const mongoose = require("mongoose");

// ─── Student <-> Class Enrollment (§3, §5) ────────────────
// A student can be enrolled in exactly one Primary Program class at a time
// and optionally one Support Class. Each enrollment carries its OWN
// start/expected-end date — §5: "Attendance calendar only generates dates
// within that enrollment window" — since two students in the same class can
// have different start/end dates (mid-cohort joins, early completions, etc).
const bhiEnrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BhiStudent",
      required: true,
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BhiClass",
      required: true,
    },
    role: {
      type: String,
      enum: ["primary", "support"], // Primary Occupational Program vs Required Support Class
      required: true,
    },
    startDate: { type: String, required: true }, // YYYY-MM-DD
    expectedEndDate: { type: String, required: true }, // YYYY-MM-DD
    actualEndDate: { type: String, default: null }, // set on withdrawal/completion
    status: {
      type: String,
      enum: ["Active", "Completed", "Withdrawn", "Transferred", "Terminated"],
      default: "Active",
    },
  },
  { timestamps: true }
);

// A student can only have ONE active enrollment per role (primary/support) at a time
bhiEnrollmentSchema.index({ student: 1, role: 1 });
bhiEnrollmentSchema.index({ class: 1, status: 1 });
bhiEnrollmentSchema.index({ student: 1, class: 1 }, { unique: true });

module.exports = mongoose.model("BhiEnrollment", bhiEnrollmentSchema);
