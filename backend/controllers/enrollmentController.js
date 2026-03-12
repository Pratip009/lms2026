const asyncHandler = require("express-async-handler");
const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Progress = require("../models/Progress");
const { successResponse } = require("../utils/response");

// ─── @desc    Get my enrollments
// ─── @route   GET /api/enrollments/my
// ─── @access  Private
const getMyEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({
    student: req.user._id,
    isActive: true,
  })
    .populate({
      path: "course",
      select: "title thumbnail description totalLessons totalDuration instructor level",
      populate: { path: "instructor", select: "name" },
    })
    .sort({ enrolledAt: -1 })
    .lean();

  // ✅ Fetch progress for all enrolled courses in one query
  const courseIds = enrollments.map(e => e.course?._id).filter(Boolean);

  const progressList = await Progress.find({
    student: req.user._id,
    course: { $in: courseIds },
  })
    .select("course progressPercentage completedLessons totalLessons isCompleted")
    .lean();

  // Map progress by courseId for O(1) lookup
  const progressMap = {};
  progressList.forEach(p => {
    progressMap[p.course.toString()] = p;
  });

  // ✅ Attach progress to each enrollment
  const enriched = enrollments.map(e => ({
    ...e,
    progress: progressMap[e.course?._id?.toString()] || null,
  }));

  return successResponse(res, { enrollments: enriched });
});

// ─── @desc    Check if student is enrolled in a course
// ─── @route   GET /api/enrollments/check/:courseId
// ─── @access  Private
const checkEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: req.params.courseId,
    isActive: true,
  }).lean();

  return successResponse(res, {
    isEnrolled: !!enrollment,
    enrollment: enrollment || null,
  });
});

// ─── @desc    Manual enrollment (Admin — e.g., free course or scholarship)
// ─── @route   POST /api/enrollments/manual
// ─── @access  Admin
const manualEnroll = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found.");
  }

  const existing = await Enrollment.findOne({ student: studentId, course: courseId });
  if (existing) {
    res.status(409);
    throw new Error("Student is already enrolled in this course.");
  }

  const Order = require("../models/Order");
  const order = await Order.create({
    student: studentId,
    course: courseId,
    amount: 0,
    currency: "usd",
    status: "completed",
    paymentMethod: "manual",
    paidAt: new Date(),
  });

  const enrollment = await Enrollment.create({
    student: studentId,
    course: courseId,
    order: order._id,
    isActive: true,
  });

  await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

  const Lesson = require("../models/Lesson");
  const lessons = await Lesson.find({ course: courseId, isPublished: true }).sort({ order: 1 });
  const lessonProgress = lessons.map((lesson, index) => ({
    lesson: lesson._id,
    isUnlocked: index === 0,
    isWatched: false,
    examPassed: false,
    examScore: 0,
    examAttempts: 0,
  }));

  await Progress.findOneAndUpdate(
    { student: studentId, course: courseId },
    {
      $setOnInsert: {
        student: studentId,
        course: courseId,
        enrollment: enrollment._id,
        lessons: lessonProgress,
        totalLessons: lessons.length,
      },
    },
    { upsert: true }
  );

  return successResponse(res, { enrollment }, "Student enrolled successfully");
});

// ─── @desc    Revoke enrollment (Admin)
// ─── @route   PATCH /api/enrollments/:id/revoke
// ─── @access  Admin
const revokeEnrollment = asyncHandler(async (req, res) => {
  const enrollment = await Enrollment.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!enrollment) {
    res.status(404);
    throw new Error("Enrollment not found.");
  }

  return successResponse(res, { enrollment }, "Enrollment revoked");
});

// ─── @desc    Get all enrollments (Admin)
// ─── @route   GET /api/enrollments
// ─── @access  Admin
const getAllEnrollments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, courseId, studentId } = req.query;
  const query = {};
  if (courseId) query.course = courseId;
  if (studentId) query.student = studentId;

  const skip = (Number(page) - 1) * Number(limit);

  const [enrollments, total] = await Promise.all([
    Enrollment.find(query)
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ enrolledAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Enrollment.countDocuments(query),
  ]);

  return successResponse(res, {
    enrollments,
    pagination: { total, page: Number(page), totalPages: Math.ceil(total / limit) },
  });
});

module.exports = {
  getMyEnrollments,
  checkEnrollment,
  manualEnroll,
  revokeEnrollment,
  getAllEnrollments,
};