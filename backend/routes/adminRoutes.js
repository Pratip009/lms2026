const express = require("express");
const router = express.Router();

const {
  getDashboardStats,
  getStudents,
  getStudentDetail,
  toggleStudentStatus,
  getExamAttempts,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middlewares/auth");

// All admin routes require authentication + admin role
router.use(protect, authorize("admin"));

router.get("/stats", getDashboardStats);
router.get("/students", getStudents);
router.get("/students/:id", getStudentDetail);
router.patch("/students/:id/toggle-status", toggleStudentStatus);
router.get("/exam-attempts", getExamAttempts);

module.exports = router;
