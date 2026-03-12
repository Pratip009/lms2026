const mongoose = require("mongoose");

// ─── Session sub-schema ───────────────────────────────────
const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true },
    loginAt: { type: Date, required: true },
    logoutAt: Date,
    duration: { type: Number, default: 0 }, // seconds
    ipAddress: String,
    userAgent: String,
    isActive: { type: Boolean, default: true },
    lastHeartbeat: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ─── Daily attendance schema ──────────────────────────────
const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    sessions: [sessionSchema],
    // ─── Aggregated daily totals ──────────────────────────
    totalDuration: { type: Number, default: 0 }, // seconds
    loginCount: { type: Number, default: 0 },
    firstLoginAt: Date,
    lastLogoutAt: Date,
    // ─── Compliance ───────────────────────────────────────
    requiredDuration: {
      type: Number,
      default: parseInt(process.env.MIN_DAILY_ATTENDANCE_SECONDS) || 10800,
    },
    meetsRequirement: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["present", "partial", "absent"],
      default: "absent",
    },
  },
  {
    timestamps: true,
  }
);

// ─── Indexes ──────────────────────────────────────────────
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ student: 1, meetsRequirement: 1 });

// ─── Auto-compute status ──────────────────────────────────
attendanceSchema.methods.computeStatus = function () {
  this.meetsRequirement = this.totalDuration >= this.requiredDuration;
  if (this.totalDuration === 0) {
    this.status = "absent";
  } else if (this.meetsRequirement) {
    this.status = "present";
  } else {
    this.status = "partial";
  }
};

const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = Attendance;
