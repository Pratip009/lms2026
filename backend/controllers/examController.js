const asyncHandler = require("express-async-handler");
const Exam = require("../models/Exam");
const ExamAttempt = require("../models/ExamAttempt");
const Lesson = require("../models/Lesson");
const Progress = require("../models/Progress");
const { successResponse, createdResponse } = require("../utils/response");

// ─── @desc    Get exam for a lesson (questions without correct answers)
// ─── @route   GET /api/lessons/:lessonId/exam
// ─── @access  Private (enrolled)
const getExamForLesson = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({
    lesson: req.params.lessonId,
    isActive: true,
  })
    .select("-questions.correctAnswer -questions.explanation")
    .lean();

  if (!exam) {
    res.status(404);
    throw new Error("No exam found for this lesson.");
  }

  const attemptCount = await ExamAttempt.countDocuments({
    student: req.user._id,
    exam: exam._id,
  });

  if (exam.maxAttempts > 0 && attemptCount >= exam.maxAttempts) {
    res.status(403);
    throw new Error(`Maximum attempts (${exam.maxAttempts}) reached for this exam.`);
  }

  let questions = exam.questions;
  if (exam.shuffleQuestions) {
    questions = [...questions].sort(() => Math.random() - 0.5);
  }

  return successResponse(res, {
    exam: {
      ...exam,
      questions,
      attemptNumber: attemptCount + 1,
      attemptsRemaining: exam.maxAttempts > 0 ? exam.maxAttempts - attemptCount : null,
    },
  });
});

// ─── @desc    Submit exam answers
// ─── @route   POST /api/lessons/:lessonId/exam/submit
// ─── @access  Private (enrolled)
const submitExam = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;
  const { answers, startedAt } = req.body;

  const exam = await Exam.findOne({ lesson: lessonId, isActive: true });
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found.");
  }

  // ✅ Resolve courseId — fall back to lesson if exam.course is missing
  let courseId = exam.course;
  if (!courseId) {
    const lesson = await Lesson.findById(lessonId).select("course").lean();
    if (!lesson) {
      res.status(404);
      throw new Error("Lesson not found.");
    }
    courseId = lesson.course;
    // Backfill exam.course so future calls don't need this fallback
    await Exam.findByIdAndUpdate(exam._id, { course: courseId });
  }

  const attemptCount = await ExamAttempt.countDocuments({
    student: req.user._id,
    exam: exam._id,
  });

  if (exam.maxAttempts > 0 && attemptCount >= exam.maxAttempts) {
    res.status(403);
    throw new Error(`Maximum attempts (${exam.maxAttempts}) reached.`);
  }

  // ─── Grade the exam ───────────────────────────────────
  const answerMap = {};
  (answers || []).forEach((a) => {
    answerMap[a.questionId] = a.selectedOption;
  });

  let earnedPoints = 0;
  let correctAnswers = 0;
  const totalPoints = exam.questions.reduce((s, q) => s + q.points, 0);

  const gradedAnswers = exam.questions.map((question) => {
    const selected = answerMap[question._id.toString()] || null;
    const isCorrect = selected === question.correctAnswer;
    const points = isCorrect ? question.points : 0;
    if (isCorrect) { earnedPoints += points; correctAnswers++; }
    return {
      questionId: question._id,
      selectedOption: selected,
      isCorrect,
      pointsEarned: points,
    };
  });

  const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const isPassed = scorePercentage >= exam.passingScore;
  const submittedAt = new Date();
  const timeTaken = startedAt ? Math.floor((submittedAt - new Date(startedAt)) / 1000) : 0;

  // ─── Save attempt ─────────────────────────────────────
  const attempt = await ExamAttempt.create({
    student: req.user._id,
    exam: exam._id,
    lesson: lessonId,
    course: courseId,           // ✅ always resolved above
    attemptNumber: attemptCount + 1,
    answers: gradedAnswers,
    totalQuestions: exam.questions.length,
    correctAnswers,
    totalPoints,
    earnedPoints,
    scorePercentage,
    passingScore: exam.passingScore,
    isPassed,
    startedAt: startedAt ? new Date(startedAt) : submittedAt,
    submittedAt,
    timeTaken,
  });

  // ─── Update progress if passed ────────────────────────
  if (isPassed) {
    const progress = await Progress.findOne({
      student: req.user._id,
      course: courseId,
    });

    if (progress) {
      const lessonProgress = progress.lessons.find(
        (lp) => lp.lesson.toString() === lessonId
      );

      if (lessonProgress && !lessonProgress.examPassed) {
        lessonProgress.examPassed = true;
        lessonProgress.examScore = scorePercentage;
        lessonProgress.examAttempts = attemptCount + 1;
        lessonProgress.lastAttemptAt = submittedAt;
        lessonProgress.examPassedAt = submittedAt;

        // Fetch current lesson order then find next lesson
        const currentLesson = await Lesson.findById(lessonId).select("order").lean();

        if (currentLesson) {
          const nextLesson = await Lesson.findOne({
            course: courseId,
            order: { $gt: currentLesson.order },
            isPublished: true,
          }).sort({ order: 1 });

          if (nextLesson) {
            const nextProgress = progress.lessons.find(
              (lp) => lp.lesson.toString() === nextLesson._id.toString()
            );
            if (nextProgress) {
              nextProgress.isUnlocked = true;
            } else {
              progress.lessons.push({
                lesson: nextLesson._id,
                isUnlocked: true,
                isWatched: false,
                examPassed: false,
                examScore: 0,
                examAttempts: 0,
              });
            }
          }
        }

        progress.recalculate();
        await progress.save();
      }
    }
  }

  // ─── Build feedback ───────────────────────────────────
  let feedback = null;
  if (isPassed && exam.showCorrectAnswers) {
    feedback = exam.questions.map((q) => ({
      questionId: q._id,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));
  }

  return successResponse(res, {
    result: {
      attemptId: attempt._id,
      scorePercentage,
      correctAnswers,
      totalQuestions: exam.questions.length,
      earnedPoints,
      totalPoints,
      isPassed,
      passingScore: exam.passingScore,
      timeTaken,
      feedback,
      message: isPassed
        ? "Congratulations! You passed the exam."
        : `Score: ${scorePercentage}%. You need ${exam.passingScore}% to pass. Please retry.`,
    },
  });
});

// ─── @desc    Get student's exam attempts for a lesson
// ─── @route   GET /api/lessons/:lessonId/exam/attempts
// ─── @access  Private
const getExamAttempts = asyncHandler(async (req, res) => {
  const attempts = await ExamAttempt.find({
    student: req.user._id,
    lesson: req.params.lessonId,
  })
    .sort({ createdAt: -1 })
    .select("-answers")
    .lean();

  return successResponse(res, { attempts });
});

// ─── @desc    Create exam for a lesson (Admin)
// ─── @route   POST /api/lessons/:lessonId/exam
// ─── @access  Admin
const createExam = asyncHandler(async (req, res) => {
  const { lessonId } = req.params;

  const lesson = await Lesson.findById(lessonId);
  if (!lesson) {
    res.status(404);
    throw new Error("Lesson not found.");
  }

  const existing = await Exam.findOne({ lesson: lessonId });
  if (existing) {
    res.status(409);
    throw new Error("An exam already exists for this lesson. Use PUT to update it.");
  }

  const { title, questions, passingScore, timeLimitMinutes, maxAttempts, shuffleQuestions } = req.body;

  const exam = await Exam.create({
    title,
    lesson: lessonId,
    course: lesson.course,
    questions,
    passingScore: passingScore || 70,
    timeLimitMinutes: timeLimitMinutes || 0,
    maxAttempts: maxAttempts || 0,
    shuffleQuestions: shuffleQuestions !== false,
  });

  return createdResponse(res, { exam }, "Exam created successfully");
});

// ─── @desc    Update exam (Admin)
// ─── @route   PUT /api/lessons/:lessonId/exam
// ─── @access  Admin
const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOne({ lesson: req.params.lessonId });
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found.");
  }

  const fields = ["title", "questions", "passingScore", "timeLimitMinutes", "maxAttempts", "shuffleQuestions", "showCorrectAnswers", "isActive"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) exam[f] = req.body[f];
  });

  await exam.save();
  return successResponse(res, { exam }, "Exam updated");
});

// ─── @desc    Delete exam (Admin)
// ─── @route   DELETE /api/lessons/:lessonId/exam
// ─── @access  Admin
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findOneAndDelete({ lesson: req.params.lessonId });
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found.");
  }
  await ExamAttempt.deleteMany({ exam: exam._id });
  return successResponse(res, {}, "Exam deleted");
});

// ─── @desc    Get all attempts for a course (Admin)
// ─── @route   GET /api/exams/course/:courseId/attempts
// ─── @access  Admin
const getCourseAttempts = asyncHandler(async (req, res) => {
  const attempts = await ExamAttempt.find({ course: req.params.courseId })
    .populate("student", "name email")
    .populate("lesson", "title order")
    .sort({ createdAt: -1 })
    .lean();

  return successResponse(res, { attempts });
});

module.exports = {
  getExamForLesson,
  submitExam,
  getExamAttempts,
  createExam,
  updateExam,
  deleteExam,
  getCourseAttempts,
};