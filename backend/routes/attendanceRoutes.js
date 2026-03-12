const express = require("express");
const router = express.Router();

const {
  startSession,
  heartbeat,
  endSession,
  getTodayAttendance,
  getMyAttendance,
  getAttendanceReport,
  getAttendanceSummary,
  getStudentAttendance,
} = require("../controllers/attendanceController");
const { protect, authorize } = require("../middlewares/auth");

// ─── Session tracking ─────────────────────────────────────
router.post("/session/start", protect, startSession);
router.post("/session/heartbeat", protect, heartbeat);
router.post("/session/end", protect, endSession);

// ─── Student routes ───────────────────────────────────────
router.get("/today", protect, getTodayAttendance);
router.get("/my", protect, getMyAttendance);

// ─── Admin routes ─────────────────────────────────────────
router.get("/report", protect, authorize("admin"), getAttendanceReport);
router.get("/summary", protect, authorize("admin"), getAttendanceSummary);
router.get("/student/:studentId", protect, authorize("admin"), getStudentAttendance);

module.exports = router;