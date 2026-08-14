const mongoose = require("mongoose");

// ─── Daily Attendance Mark (§7–9) ─────────────────────────
// One document per student, per class, per date. Kept separate from the
// existing login-duration `Attendance` model (backend/models/Attendance.js)
// which powers the paid-course platform's time-tracking — this is the
// teacher-marked, government/grant-audited attendance for the BHI module.
const bhiAttendanceRecordSchema = new mongoose.Schema(
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
    dailyRecord: {
      // the lesson/topic record this mark belongs to (§28-34)
      type: mongoose.Schema.Types.ObjectId,
      ref: "BhiDailyInstructionalRecord",
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD, denormalized for fast querying

    status: {
      type: String,
      enum: ["Present", "Absent", "Excused", "Late", "Makeup"],
      required: true,
    },

    // ─── Excused-absence support (§7) ────────────────────
    note: { type: String, trim: true, default: "" },
    attachment: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
      fileName: { type: String, default: "" },
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

bhiAttendanceRecordSchema.index({ student: 1, class: 1, date: 1 }, { unique: true });
bhiAttendanceRecordSchema.index({ class: 1, date: 1 });
bhiAttendanceRecordSchema.index({ student: 1, date: -1 });
bhiAttendanceRecordSchema.index({ status: 1 });

// "Unexcused absence" = Absent status only. Excused/Late/Makeup/Present never
// count toward the consecutive-unexcused-absence color calculation (§7).
bhiAttendanceRecordSchema.statics.UNEXCUSED_STATUS = "Absent";

module.exports = mongoose.model("BhiAttendanceRecord", bhiAttendanceRecordSchema);
