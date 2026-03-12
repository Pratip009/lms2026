const asyncHandler = require("express-async-handler");
const Progress = require("../models/Progress");
const Enrollment = require("../models/Enrollment");
const Lesson = require("../models/Lesson");
const { successResponse } = require("../utils/response");

// ─── @desc    Get student's progress for a course
// ─── @route   GET /api/progress/:courseId
// ─── @access  Private
const getCourseProgress = asyncHandler(async (req, res) => {
  const progress = await Progress.findOne({
    student: req.user._id,
    course: req.params.courseId,
  })
    .populate("lessons.lesson", "title order")
    .lean();

  if (!progress) {
    res.status(404);
    throw new Error("Progress record not found. Are you enrolled in this course?");
  }

  return successResponse(res, { progress });
});

// ─── @desc    Get all courses progress for a student
// ─── @route   GET /api/progress/my
// ─── @access  Private
const getMyProgress = asyncHandler(async (req, res) => {
  const progressList = await Progress.find({ student: req.user._id })
    .populate("course", "title thumbnail totalLessons")
    .select("course progressPercentage completedLessons totalLessons isCompleted lastAccessedAt")
    .lean();

  return successResponse(res, { progress: progressList });
});

// ─── @desc    Get all students' progress for a course (Admin)
// ─── @route   GET /api/progress/course/:courseId
// ─── @access  Admin
const getCourseProgressReport = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [progressList, total] = await Promise.all([
    Progress.find({ course: req.params.courseId })
      .populate("student", "name email avatar")
      .select("-lessons")
      .sort({ progressPercentage: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Progress.countDocuments({ course: req.params.courseId }),
  ]);

  const stats = await Progress.aggregate([
    { $match: { course: require("mongoose").Types.ObjectId.createFromHexString(req.params.courseId) } },
    {
      $group: {
        _id: null,
        avgProgress: { $avg: "$progressPercentage" },
        completedCount: { $sum: { $cond: ["$isCompleted", 1, 0] } },
        totalStudents: { $sum: 1 },
      },
    },
  ]);

  return successResponse(res, {
    progress: progressList,
    stats: stats[0] || { avgProgress: 0, completedCount: 0, totalStudents: 0 },
    pagination: {
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    },
  });
});

// ─── @desc    Mark a lesson as watched
// ─── @route   POST /api/progress/:courseId/lessons/:lessonId/watch
// ─── @access  Private (enrolled)
const markLessonWatched = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;

  // Verify enrollment
  const enrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    isActive: true,
  });
  if (!enrollment) {
    res.status(403);
    throw new Error("You are not enrolled in this course.");
  }

  let progress = await Progress.findOne({
    student: req.user._id,
    course: courseId,
  });

  // ✅ If no progress record exists, create it now (handles enrollment timing edge case)
  if (!progress) {
    const lessons = await Lesson.find({ course: courseId, isPublished: true }).sort({ order: 1 });
    const lessonProgress = lessons.map((l, index) => ({
      lesson: l._id,
      isUnlocked: index === 0,
      isWatched: false,
      examPassed: false,
      examScore: 0,
      examAttempts: 0,
    }));

    progress = await Progress.create({
      student: req.user._id,
      course: courseId,
      enrollment: enrollment._id,
      lessons: lessonProgress,
      totalLessons: lessons.length,
      completedLessons: 0,
      progressPercentage: 0,
    });
  }

  // ✅ If lesson isn't in the progress array, add it (handles newly published lessons)
  const lessonEntry = progress.lessons.find(
    (lp) => lp.lesson.toString() === lessonId
  );

  if (!lessonEntry) {
    progress.lessons.push({
      lesson: lessonId,
      isUnlocked: true,
      isWatched: true,
      watchedAt: new Date(),
      examPassed: false,
      examScore: 0,
      examAttempts: 0,
    });
  } else {
    lessonEntry.isWatched = true;
    lessonEntry.watchedAt = new Date();
  }

  progress.lastAccessedLesson = lessonId;
  progress.lastAccessedAt = new Date();

  if (typeof progress.recalculate === "function") {
    progress.recalculate();
  }

  await progress.save();

  return successResponse(res, {
    progressPercentage: progress.progressPercentage,
    completedLessons: progress.completedLessons,
  }, "Lesson marked as watched");
});

module.exports = {
  getCourseProgress,
  getMyProgress,
  getCourseProgressReport,
  markLessonWatched,
};