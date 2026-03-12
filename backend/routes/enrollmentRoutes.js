const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  getMyEnrollments,
  checkEnrollment,
  manualEnroll,
  revokeEnrollment,
  getAllEnrollments,
} = require("../controllers/enrollmentController");
const { protect, authorize } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");

router.get("/my", protect, getMyEnrollments);
router.get("/check/:courseId", protect, checkEnrollment);

// Admin routes
router.get("/", protect, authorize("admin"), getAllEnrollments);
router.post(
  "/manual",
  protect,
  authorize("admin"),
  [
    body("studentId").notEmpty().withMessage("Student ID required"),
    body("courseId").notEmpty().withMessage("Course ID required"),
  ],
  validate,
  manualEnroll
);
router.patch("/:id/revoke", protect, authorize("admin"), revokeEnrollment);

module.exports = router;
