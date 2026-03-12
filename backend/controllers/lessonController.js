const asyncHandler = require("express-async-handler");
const Lesson = require("../models/Lesson");
const Course = require("../models/Course");
const Progress = require("../models/Progress");
const { generateVideoOTP } = require("../utils/vdoCipher");
const { successResponse, createdResponse } = require("../utils/response");
const { cacheDel, withCache } = require("../utils/cache");

// ─── @desc    Get all lessons for a course
// ─── @route   GET /api/courses/:courseId/lessons
// ─── @access  Public (previews) / Private (enrolled)
const getLessons = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const isAdminOrEnrolled = req.user?.role === "admin" || !!req.enrollment;

  const query = { course: courseId };
  if (!isAdminOrEnrolled) {
    // Public — only return published lessons, strip sensitive fields
    query.isPublished = true;
  }

  const lessons = await Lesson.find(query)
    .sort({ order: 1 })
    .select(isAdminOrEnrolled ? "" : "-video.vdoCipherId -notes")
    .populate("exam", "title passingScore timeLimitMinutes")
    .lean();

  // Attach student progress if authenticated + enrolled
  let progressMap = {};
  if (req.user && req.enrollment) {
    const progress = await Progress.findOne({
      student: req.user._id,
      course: courseId,
    }).lean();

    if (progress) {
      progress.lessons.forEach((lp) => {
        progressMap[lp.lesson.toString()] = lp;
      });
    }
  }

  const enriched = lessons.map((lesson, index) => ({
    ...lesson,
    progress: progressMap[lesson._id.toString()] || null,
    isUnlocked: isAdminOrEnrolled
      ? index === 0
        ? true
        : (progressMap[lessons[index - 1]?._id.toString()]?.examPassed ?? false)
      : lesson.isFreePreview,
  }));

  return successResponse(res, { lessons: enriched });
});

// ─── @desc    Get single lesson
// ─── @route   GET /api/lessons/:id
// ─── @access  Private (enrolled)
const getLessonById = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id)
    .populate("exam", "title questions.length passingScore timeLimitMinutes")
    .lean();

  if (!lesson) {
    res.status(404);
    throw new Error("Lesson not found.");
  }

  // Admin bypass
  if (req.user?.role !== "admin") {
    // Check enrollment
    if (!req.enrollment) {
      res.status(403);
      throw new Error("Purchase this course to access lessons.");
    }

    // Check if lesson is unlocked via progress
    const progress = await Progress.findOne({
      student: req.user._id,
      course: lesson.course,
    });

    const lessonProgress = progress?.lessons.find(
      (lp) => lp.lesson.toString() === lesson._id.toString()
    );

    if (!lesson.isFreePreview && !lessonProgress?.isUnlocked) {
      // Check if it's the first lesson (always unlocked)
      const firstLesson = await Lesson.findOne({ course: lesson.course, order: 1 });
      if (!firstLesson || firstLesson._id.toString() !== lesson._id.toString()) {
        res.status(403);
        throw new Error("Complete the previous lesson's exam to unlock this lesson.");
      }
    }
  }

  // Update last accessed in progress
  if (req.user && req.enrollment) {
    await Progress.findOneAndUpdate(
      { student: req.user._id, course: lesson.course },
      {
        $set: {
          lastAccessedLesson: lesson._id,
          lastAccessedAt: new Date(),
        },
      }
    );
  }

  return successResponse(res, { lesson });
});

// ─── @desc    Get VdoCipher OTP for video playback
// ─── @route   POST /api/lessons/:id/video-otp
// ─── @access  Private (enrolled)
const getVideoOTP = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id).select("video course isFreePreview");

  if (!lesson) {
    res.status(404);
    throw new Error("Lesson not found.");
  }

  // Admin bypass
  if (req.user?.role !== "admin") {
    if (!lesson.isFreePreview && !req.enrollment) {
      res.status(403);
      throw new Error("Purchase this course to watch videos.");
    }
  }

  // Watermark with user email
  const annotations = [
    {
      type: "rtext",
      text: req.user.email,
      alpha: "0.4",
      color: "0xFF0000",
      size: "15",
      interval: "5000",
      skip: "5000",
      x: "10",
      y: "10",
    },
  ];

  const { otp, playbackInfo } = await generateVideoOTP(lesson.video.vdoCipherId, annotations);

  // Mark as watched in progress
  if (req.user && req.enrollment) {
    await Progress.findOneAndUpdate(
      {
        student: req.user._id,
        course: lesson.course,
        "lessons.lesson": lesson._id,
      },
      {
        $set: {
          "lessons.$.isWatched": true,
          "lessons.$.watchedAt": new Date(),
        },
      }
    );
  }

  return successResponse(res, { otp, playbackInfo });
});

// ─── @desc    Create lesson (Admin)
// ─── @route   POST /api/courses/:courseId/lessons
// ─── @access  Admin
const createLesson = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const { title, description, vdoCipherId, videoDuration, order, isFreePreview, notes, resources } = req.body;

  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error("Course not found.");
  }

  // Auto-assign order if not provided
  let lessonOrder = order;
  if (!lessonOrder) {
    const lastLesson = await Lesson.findOne({ course: courseId }).sort({ order: -1 });
    lessonOrder = lastLesson ? lastLesson.order + 1 : 1;
  }

  const lesson = await Lesson.create({
    title,
    description,
    course: courseId,
    order: lessonOrder,
    video: {
      vdoCipherId,
      duration: videoDuration || 0,
    },
    isFreePreview: !!isFreePreview,
    notes,
    resources: resources ? JSON.parse(resources) : [],
    isPublished: false,
  });

  // Update course lesson count and total duration
  await Course.findByIdAndUpdate(courseId, {
    $inc: {
      totalLessons: 1,
      totalDuration: Math.ceil((videoDuration || 0) / 60),
    },
  });

  await cacheDel(`course:${courseId}`);

  return createdResponse(res, { lesson }, "Lesson created successfully");
});

// ─── @desc    Update lesson (Admin)
// ─── @route   PUT /api/lessons/:id
// ─── @access  Admin
const updateLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    res.status(404);
    throw new Error("Lesson not found.");
  }

  const {
    title, description, vdoCipherId, videoDuration,
    order, isFreePreview, notes, resources, isPublished,
  } = req.body;

  if (title !== undefined) lesson.title = title;
  if (description !== undefined) lesson.description = description;
  if (order !== undefined) lesson.order = order;
  if (isFreePreview !== undefined) lesson.isFreePreview = isFreePreview;
  if (notes !== undefined) lesson.notes = notes;
  if (isPublished !== undefined) lesson.isPublished = isPublished;
  if (resources) lesson.resources = typeof resources === "string" ? JSON.parse(resources) : resources;

  if (vdoCipherId !== undefined) {
    const oldDuration = lesson.video.duration;
    lesson.video.vdoCipherId = vdoCipherId;
    if (videoDuration !== undefined) {
      lesson.video.duration = videoDuration;
      // Update course total duration
      const diff = videoDuration - oldDuration;
      await Course.findByIdAndUpdate(lesson.course, {
        $inc: { totalDuration: Math.ceil(diff / 60) },
      });
    }
  }

  await lesson.save();
  await cacheDel(`course:${lesson.course}`);

  return successResponse(res, { lesson }, "Lesson updated");
});

// ─── @desc    Delete lesson (Admin)
// ─── @route   DELETE /api/lessons/:id
// ─── @access  Admin
const deleteLesson = asyncHandler(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) {
    res.status(404);
    throw new Error("Lesson not found.");
  }

  await Course.findByIdAndUpdate(lesson.course, {
    $inc: {
      totalLessons: -1,
      totalDuration: -Math.ceil((lesson.video.duration || 0) / 60),
    },
  });

  await lesson.deleteOne();
  await cacheDel(`course:${lesson.course}`);

  return successResponse(res, {}, "Lesson deleted");
});

// ─── @desc    Reorder lessons (Admin)
// ─── @route   PUT /api/courses/:courseId/lessons/reorder
// ─── @access  Admin
const reorderLessons = asyncHandler(async (req, res) => {
  const { lessonOrders } = req.body; // [{ id, order }]

  if (!Array.isArray(lessonOrders)) {
    res.status(400);
    throw new Error("lessonOrders must be an array of { id, order }");
  }

  const bulkOps = lessonOrders.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: id, course: req.params.courseId },
      update: { $set: { order } },
    },
  }));

  await Lesson.bulkWrite(bulkOps);
  await cacheDel(`course:${req.params.courseId}`);

  return successResponse(res, {}, "Lessons reordered");
});

module.exports = {
  getLessons,
  getLessonById,
  getVideoOTP,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
};
