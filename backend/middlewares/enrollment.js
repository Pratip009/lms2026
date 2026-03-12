const asyncHandler = require("express-async-handler");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");

/**
 * Verifies the authenticated student is enrolled in the course.
 * Expects req.params.courseId or req.body.courseId.
 */
const requireEnrollment = asyncHandler(async (req, res, next) => {
  const courseId = req.params.courseId || req.body.courseId;

  if (!courseId) {
    res.status(400);
    throw new Error("Course ID is required.");
  }

  // Admins bypass enrollment check
  if (req.user.role === "admin") return next();

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    isActive: true,
  });

  if (!enrollment) {
    res.status(403);
    throw new Error("You must purchase this course to access its content.");
  }

  // Check expiry
  if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
    res.status(403);
    throw new Error("Your access to this course has expired.");
  }

  req.enrollment = enrollment;
  next();
});

/**
 * Resolves courseId from a lesson ID, then checks enrollment.
 * Use this on routes like GET /api/lessons/:id where courseId isn't in params.
 */
const requireEnrollmentByLesson = asyncHandler(async (req, res, next) => {
  // Admins bypass entirely
  if (req.user.role === "admin") return next();

  const lessonId = req.params.id || req.params.lessonId;

  const lesson = await Lesson.findById(lessonId).select("course isFreePreview").lean();
  if (!lesson) {
    res.status(404);
    throw new Error("Lesson not found.");
  }

  // Free preview lessons are accessible without enrollment
  if (lesson.isFreePreview) return next();

  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: lesson.course,
    isActive: true,
  });

  if (!enrollment) {
    res.status(403);
    throw new Error("Purchase this course to access lessons.");
  }

  // Check expiry
  if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
    res.status(403);
    throw new Error("Your access to this course has expired.");
  }

  req.enrollment = enrollment;
  next();
});

/**
 * Middleware to check if course is published (for public-facing routes).
 * Expects req.params.courseId.
 */
const requirePublishedCourse = asyncHandler(async (req, res, next) => {
  const courseId = req.params.courseId || req.params.id;
  const course = await Course.findById(courseId);

  if (!course) {
    res.status(404);
    throw new Error("Course not found.");
  }

  if (!course.isPublished && req.user?.role !== "admin") {
    res.status(404);
    throw new Error("Course not found.");
  }

  req.course = course;
  next();
});

module.exports = { requireEnrollment, requireEnrollmentByLesson, requirePublishedCourse };