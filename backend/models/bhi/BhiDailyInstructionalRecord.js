const mongoose = require("mongoose");

// ─── Daily Instructional Record (§28–34) ──────────────────
// One per class+date. Holds the required lesson/topic that gates attendance
// submission, plus optional activities/assignments/notes. Attendance marks
// for that class+date (BhiAttendanceRecord) reference this record.
const bhiDailyInstructionalRecordSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BhiClass",
      required: true,
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ─── Required (§30-31: hard gate) ────────────────────
    lessonTopic: {
      type: String,
      required: [true, "Please enter today's lesson or main instructional topic before submitting attendance."],
      trim: true,
    },
    // ─── Optional ─────────────────────────────────────────
    activitiesCompleted: { type: String, trim: true, default: "" },
    assignmentsMaterials: { type: String, trim: true, default: "" },
    additionalNotes: { type: String, trim: true, default: "" },

    isSubmitted: { type: Boolean, default: false }, // finalized (attendance locked in)
    submittedAt: Date,
  },
  { timestamps: true }
);

bhiDailyInstructionalRecordSchema.index({ class: 1, date: 1 }, { unique: true });
bhiDailyInstructionalRecordSchema.index({ date: 1 });

module.exports = mongoose.model(
  "BhiDailyInstructionalRecord",
  bhiDailyInstructionalRecordSchema
);
