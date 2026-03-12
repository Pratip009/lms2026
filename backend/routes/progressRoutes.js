const express = require("express");
const router = express.Router();

const {
  getCourseProgress,
  getMyProgress,
  getCourseProgressReport,
  markLessonWatched,
} = require("../controllers/progressController");
const { protect, authorize } = require("../middlewares/auth");

// Student routes
router.get("/my", protect, getMyProgress);
router.get("/:courseId", protect, getCourseProgress);
router.post("/:courseId/lessons/:lessonId/watch", protect, markLessonWatched);

// Admin routes
router.get("/course/:courseId/report", protect, authorize("admin"), getCourseProgressReport);

module.exports = router;
