const express = require("express");
const router = express.Router();

const { getCourseAttempts } = require("../controllers/examController");
const { protect, authorize } = require("../middlewares/auth");

// Admin-only exam overview
router.get("/course/:courseId/attempts", protect, authorize("admin"), getCourseAttempts);

module.exports = router;
