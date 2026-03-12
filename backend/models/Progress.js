const mongoose = require("mongoose");

// ─── Per-lesson progress sub-schema ──────────────────────
const lessonProgressSchema = new mongoose.Schema(
  {
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    isWatched: { type: Boolean, default: false },
    watchedAt: Date,
    watchDuration: { type: Number, default: 0 }, // seconds watched
    // ─── Exam result ──────────────────────────────────────
    examPassed: { type: Boolean, default: false },
    examScore: { type: Number, default: 0 }, // percentage
    examAttempts: { type: Number, default: 0 },
    lastAttemptAt: Date,
    examPassedAt: Date,
    // ─── Unlock status ────────────────────────────────────
    isUnlocked: { type: Boolean, default: false },
  },
  { _id: false },
);

// ─── Course progress schema ───────────────────────────────
const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Enrollment",
      required: true,
    },
    // ─── Lesson-level data ────────────────────────────────
    lessons: [lessonProgressSchema],
    // ─── Aggregated ───────────────────────────────────────
    completedLessons: { type: Number, default: 0 },
    totalLessons: { type: Number, default: 0 },
    passedExams: { type: Number, default: 0 },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    lastAccessedLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },
    lastAccessedAt: Date,
    // ─── Course completion ────────────────────────────────
    isCompleted: { type: Boolean, default: false },
    completedAt: Date,
  },
  {
    timestamps: true,
  },
);

// ─── Indexes ──────────────────────────────────────────────
progressSchema.index({ student: 1, course: 1 }, { unique: true });
progressSchema.index({ student: 1 });
progressSchema.index({ course: 1 });

// ─── Recalculate aggregates before save ──────────────────
progressSchema.methods.recalculate = function () {
  const total = this.lessons.length; // ✅ always use actual array length
  const completedLessons = this.lessons.filter(
    (l) => l.isWatched && l.examPassed,
  ).length;
  const passedExams = this.lessons.filter((l) => l.examPassed).length;

  this.totalLessons = total; // ✅ keep totalLessons in sync
  this.completedLessons = completedLessons;
  this.passedExams = passedExams;
  this.progressPercentage =
    total > 0
      ? Math.min(100, Math.round((completedLessons / total) * 100)) // ✅ cap at 100
      : 0;

  if (this.progressPercentage === 100 && !this.isCompleted) {
    this.isCompleted = true;
    this.completedAt = new Date();
  }
};

const Progress = mongoose.model("Progress", progressSchema);
module.exports = Progress;
