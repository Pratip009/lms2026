const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    // ─── Access ───────────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null, // null = lifetime access
    },
    // ─── Completion ───────────────────────────────────────
    completedAt: Date,
    isCompleted: {
      type: Boolean,
      default: false,
    },
    certificateUrl: String,
    certificateIssuedAt: Date,
  },
  {
    timestamps: true,
  }
);

// ─── Unique enrollment per student+course ─────────────────
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1, isActive: 1 });
enrollmentSchema.index({ course: 1 });

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);
module.exports = Enrollment;
