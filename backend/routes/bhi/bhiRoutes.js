const express = require("express");
const router = express.Router();

const { protect, authorize } = require("../../middlewares/auth");
const { requireOwnClassOrAdmin } = require("../../middlewares/bhi/bhiAuth");

const programCtrl = require("../../controllers/bhi/bhiProgramController");
const classCtrl = require("../../controllers/bhi/bhiClassController");
const studentCtrl = require("../../controllers/bhi/bhiStudentController");
const calendarCtrl = require("../../controllers/bhi/bhiCalendarController");
const attendanceCtrl = require("../../controllers/bhi/bhiAttendanceController");
const reportCtrl = require("../../controllers/bhi/bhiReportController");
const teacherAccountCtrl = require("../../controllers/bhi/bhiTeacherAccountController");

// Every BHI route requires login; fine-grained role checks per-route below.
router.use(protect);

// ─── §3: Programs / Support-Class catalog ─────────────────
router.get("/programs", programCtrl.getPrograms);
router.post("/programs", authorize("admin"), programCtrl.createProgram);
router.patch("/programs/:id", authorize("admin"), programCtrl.updateProgram);
router.delete("/programs/:id", authorize("admin"), programCtrl.deactivateProgram);

// ─── §2: Teacher account management (admin only) ───────────
router.get("/teacher-accounts", authorize("admin"), teacherAccountCtrl.listTeacherAccounts);
router.post("/teacher-accounts", authorize("admin"), teacherAccountCtrl.createTeacherAccount);
router.patch(
  "/teacher-accounts/:id/deactivate",
  authorize("admin"),
  teacherAccountCtrl.setTeacherActive
);

// ─── §2-3, §19-21: Classes ─────────────────────────────────
router.get("/teachers", authorize("admin"), classCtrl.getTeachers);
router.get("/classes", authorize("admin", "teacher"), classCtrl.getClasses);
router.get("/classes/:id", authorize("admin", "teacher"), classCtrl.getClassById);
router.post("/classes", authorize("admin"), classCtrl.createClass);
router.patch("/classes/:id", authorize("admin"), classCtrl.updateClass);
router.delete("/classes/:id", authorize("admin"), classCtrl.deactivateClass);

// ─── §4, §13-14, §21, §24: Students ────────────────────────
router.get("/students", authorize("admin", "teacher"), studentCtrl.getStudents);
router.get("/students/search", authorize("admin", "teacher"), studentCtrl.searchStudents);
router.get("/students/:id", authorize("admin", "teacher"), studentCtrl.getStudentBasic);
router.post("/students", authorize("admin"), studentCtrl.createStudent);
router.patch("/students/:id", authorize("admin"), studentCtrl.updateStudent);
router.patch("/students/:id/status", authorize("admin"), studentCtrl.changeStudentStatus);
router.post("/students/:id/transfer", authorize("admin"), studentCtrl.transferStudent);

// ─── §6: School calendar ────────────────────────────────────
router.get("/calendar", calendarCtrl.getCalendarEvents);
router.post("/calendar", authorize("admin"), calendarCtrl.addCalendarEvent);
router.delete("/calendar/:id", authorize("admin"), calendarCtrl.removeCalendarEvent);

// ─── §6-9, §28-34: Daily attendance + lessons (teacher marks, admin too) ──
router.get(
  "/attendance/roster",
  authorize("admin", "teacher"),
  attendanceCtrl.getRosterForDate
);
router.post(
  "/attendance/submit",
  authorize("admin", "teacher"),
  requireOwnClassOrAdmin,
  attendanceCtrl.submitAttendance
);
router.get(
  "/attendance/lesson-history",
  authorize("admin", "teacher"),
  attendanceCtrl.getLessonHistory
);
router.get(
  "/attendance/lesson-history/:dailyRecordId",
  authorize("admin", "teacher"),
  attendanceCtrl.getLessonDayDetail
);

// ─── §4, §12-17: Corrections + audit trail (admin only) ────
router.patch(
  "/attendance/:recordId/correct",
  authorize("admin"),
  attendanceCtrl.correctAttendance
);
router.get(
  "/attendance/:recordId/audit-history",
  authorize("admin"),
  attendanceCtrl.getAuditHistory
);

// ─── §10-11: Overview lists + main dashboard (admin) ───────
router.get("/attendance/overview", authorize("admin"), attendanceCtrl.getOverviewLists);
router.get("/attendance/dashboard", authorize("admin"), attendanceCtrl.getDashboard);
router.get("/attendance/class-breakdown", authorize("admin"), attendanceCtrl.getClassColorBreakdown);
router.get("/attendance/alerts", authorize("admin", "teacher"), attendanceCtrl.getAlerts);

// ─── §11, §35: Manual override ─────────────────────────────
router.patch(
  "/attendance/students/:studentId/override",
  authorize("admin"),
  attendanceCtrl.overrideStudentColor
);

// ─── §12-17: Student attendance profile ────────────────────
router.get(
  "/attendance/students/:studentId/profile",
  authorize("admin", "teacher"),
  attendanceCtrl.getStudentProfile
);

// ─── §7: Admin-configurable color thresholds ───────────────
router.get("/attendance/color-config", authorize("admin"), attendanceCtrl.getColorConfig);
router.patch("/attendance/color-config", authorize("admin"), attendanceCtrl.updateColorConfig);

// ─── §22-23: Reports & export ───────────────────────────────
router.get("/reports", authorize("admin", "teacher"), reportCtrl.getReport);
router.get("/reports/export", authorize("admin", "teacher"), reportCtrl.exportReport);

module.exports = router;
