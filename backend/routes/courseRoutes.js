const express = require("express");
const { body, param } = require("express-validator");
const router = express.Router();

const {
  getCourses,
  getAdminCourses,
  getAdminCourseById,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
  getFeaturedCourses,
  getCategories,
} = require("../controllers/courseController");
const {
  getLessons,
  createLesson,
  reorderLessons,
} = require("../controllers/lessonController");

const { protect, authorize, optionalAuth } = require("../middlewares/auth");
const { requireEnrollment } = require("../middlewares/enrollment");
const { validate } = require("../middlewares/validate");
const { uploadThumbnail } = require("../config/cloudinary");

// ─── Validation ───────────────────────────────────────────
const courseValidation = [
  body("title").trim().isLength({ min: 5, max: 150 }).withMessage("Title must be 5–150 chars"),
  body("description").trim().isLength({ min: 20 }).withMessage("Description must be at least 20 chars"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("category").trim().notEmpty().withMessage("Category is required"),
];

const lessonValidation = [
  body("title").trim().isLength({ min: 3, max: 150 }).withMessage("Lesson title required"),
  body("description").trim().notEmpty().withMessage("Lesson description required"),
  body("vdoCipherId").trim().notEmpty().withMessage("VdoCipher video ID is required"),
];

// ─── Admin: get all courses (drafts + published) ──────────
// MUST be before /:id routes to avoid "admin" being treated as an id param
router.get("/admin/all", protect, authorize("admin"), getAdminCourses);
router.get("/admin/:id", protect, authorize("admin"), getAdminCourseById);

// ─── Public routes ────────────────────────────────────────
router.get("/featured", getFeaturedCourses);
router.get("/categories", getCategories);
router.get("/", optionalAuth, getCourses);
router.get("/:id", optionalAuth, getCourseById);

// ─── Lessons under a course ───────────────────────────────
router.get(
  "/:courseId/lessons",
  protect,
  (req, res, next) => {
    if (req.user.role === "admin") return next();
    requireEnrollment(req, res, next);
  },
  getLessons
);

// ─── Admin: course management ─────────────────────────────
router.post(
  "/",
  protect,
  authorize("admin"),
  uploadThumbnail.single("thumbnail"),
  courseValidation,
  validate,
  createCourse
);

router.put(
  "/:id",
  protect,
  authorize("admin"),
  uploadThumbnail.single("thumbnail"),
  validate,
  updateCourse
);

router.delete("/:id", protect, authorize("admin"), deleteCourse);
router.patch("/:id/publish", protect, authorize("admin"), togglePublish);

// ─── Admin: lessons under a course ───────────────────────
router.post(
  "/:courseId/lessons",
  protect,
  authorize("admin"),
  lessonValidation,
  validate,
  createLesson
);

router.put(
  "/:courseId/lessons/reorder",
  protect,
  authorize("admin"),
  reorderLessons
);

module.exports = router;