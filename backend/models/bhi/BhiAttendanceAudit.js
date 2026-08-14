const mongoose = require("mongoose");

// ─── Attendance Change / Audit History (§4, §12–17) ───────
// Every correction to a submitted attendance record is logged here —
// original status, new status, who changed it, when, and why. This is the
// backbone of grant/government audit-readiness (§25).
const bhiAttendanceAuditSchema = new mongoose.Schema(
  {
    attendanceRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BhiAttendanceRecord",
      required: true,
    },
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
    originalStatus: { type: String, required: true },
    newStatus: { type: String, required: true },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: { type: String, trim: true, default: "" },
  },
  { timestamps: true } // createdAt = date/time of change
);

bhiAttendanceAuditSchema.index({ student: 1, createdAt: -1 });
bhiAttendanceAuditSchema.index({ attendanceRecord: 1 });

module.exports = mongoose.model("BhiAttendanceAudit", bhiAttendanceAuditSchema);
