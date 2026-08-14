const mongoose = require("mongoose");

// ─── Class / Section (§2–3, §19–21) ───────────────────────
// A "class" is a taught, schedulable unit — an offering of a Primary
// Occupational Program (e.g. "Medical Assistant - Section A") or of a
// Required Support Class (e.g. "ESL - Evening"). Attendance, lessons and
// rosters are all tracked per class (§4 cross-cutting requirement).
const bhiClassSchema = new mongoose.Schema(
  {
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BhiProgram",
      required: true,
    },
    sectionName: {
      type: String, // e.g. "Section A", "Morning Cohort"
      trim: true,
      default: "",
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // User with role "teacher"
      required: true,
    },
    schedule: {
      // free-form so it can describe "M/W/F 9am-1pm" etc.
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

bhiClassSchema.index({ program: 1, isActive: 1 });
bhiClassSchema.index({ teacher: 1, isActive: 1 });

// Virtual: roster (active enrollments in this class)
bhiClassSchema.virtual("roster", {
  ref: "BhiEnrollment",
  localField: "_id",
  foreignField: "class",
});

bhiClassSchema.set("toJSON", { virtuals: true });
bhiClassSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("BhiClass", bhiClassSchema);
