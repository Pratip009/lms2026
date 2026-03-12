const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // ✅ Removed enum restriction — option labels vary per exam (A/B/C/D, a/b/c/d, 1/2/3/4 etc.)
    // Correctness is validated in examController, not at schema level
    selectedOption: { type: String, default: null },
    isCorrect: { type: Boolean, default: false },
    pointsEarned: { type: Number, default: 0 },
  },
  { _id: false }
);

const examAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    answers: [answerSchema],
    // ─── Scoring ──────────────────────────────────────────
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, default: 0 },
    totalPoints:    { type: Number, default: 0 },
    earnedPoints:   { type: Number, default: 0 },
    scorePercentage:{ type: Number, default: 0 },
    passingScore:   { type: Number, required: true },
    isPassed:       { type: Boolean, default: false },
    // ─── Timing ───────────────────────────────────────────
    startedAt:  { type: Date, default: Date.now },
    submittedAt:{ type: Date },
    timeTaken:  { type: Number, default: 0 }, // seconds
  },
  {
    timestamps: true,
  }
);

examAttemptSchema.index({ student: 1, exam: 1 });
examAttemptSchema.index({ student: 1, lesson: 1 });
examAttemptSchema.index({ student: 1, course: 1 });

const ExamAttempt = mongoose.model("ExamAttempt", examAttemptSchema);
module.exports = ExamAttempt;