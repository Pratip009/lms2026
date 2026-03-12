const express = require("express");
const router = express.Router();

const {
  getLessonById,
  getVideoOTP,
  updateLesson,
  deleteLesson,
} = require("../controllers/lessonController");
const {
  getExamForLesson,
  submitExam,
  getExamAttempts,
  createExam,
  updateExam,
  deleteExam,
} = require("../controllers/examController");
const { markLessonWatched } = require("../controllers/progressController");

const { protect, authorize } = require("../middlewares/auth");
const { requireEnrollmentByLesson } = require("../middlewares/enrollment");

// ─── Lesson routes ────────────────────────────────────────
// requireEnrollmentByLesson looks up the lesson's courseId automatically,
// then verifies the student is enrolled. Free preview lessons are allowed through.
router.get("/:id", protect, requireEnrollmentByLesson, getLessonById);
router.get("/:id/video-otp", protect, requireEnrollmentByLesson, getVideoOTP);
router.put("/:id", protect, authorize("admin"), updateLesson);
router.delete("/:id", protect, authorize("admin"), deleteLesson);

// ─── Progress ─────────────────────────────────────────────
router.post("/:id/watch", protect, markLessonWatched);

// ─── Exams ────────────────────────────────────────────────
router.get("/:lessonId/exam", protect, getExamForLesson);
router.post("/:lessonId/exam/submit", protect, submitExam);
router.get("/:lessonId/exam/attempts", protect, getExamAttempts);

// Admin exam management
router.post("/:lessonId/exam", protect, authorize("admin"), createExam);
router.put("/:lessonId/exam", protect, authorize("admin"), updateExam);
router.delete("/:lessonId/exam", protect, authorize("admin"), deleteExam);

module.exports = router;