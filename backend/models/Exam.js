const mongoose = require("mongoose");

// ─── Question sub-schema ──────────────────────────────────
const questionSchema = new mongoose.Schema(
  {
    questionText: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
      minlength: [5],
      maxlength: [1000],
    },
    options: {
      type: [
        {
          label: {
            type: String,
            required: true,
            enum: ["A", "B", "C", "D"],
          },
          text: {
            type: String,
            required: true,
            trim: true,
            maxlength: [300],
          },
        },
      ],
      validate: {
        validator: (v) => v.length === 4,
        message: "Each question must have exactly 4 options",
      },
    },
    correctAnswer: {
      type: String,
      required: [true, "Correct answer is required"],
      enum: ["A", "B", "C", "D"],
    },
    explanation: {
      type: String,
      maxlength: [500],
    },
    points: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: true }
);

// ─── Exam schema ──────────────────────────────────────────
const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
      maxlength: 150,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      unique: true, // one exam per lesson
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    questions: {
      type: [questionSchema],
      validate: {
        validator: (v) => v.length >= 1,
        message: "Exam must have at least 1 question",
      },
    },
    passingScore: {
      type: Number,
      default: 70, // percentage
      min: 1,
      max: 100,
    },
    timeLimitMinutes: {
      type: Number,
      default: 0, // 0 = no limit
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 0, // 0 = unlimited
      min: 0,
    },
    shuffleQuestions: {
      type: Boolean,
      default: true,
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true, // shown only after passing
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

examSchema.index({ lesson: 1 });
examSchema.index({ course: 1 });

// ─── Virtual: total points ────────────────────────────────
examSchema.virtual("totalPoints").get(function () {
  return this.questions.reduce((sum, q) => sum + q.points, 0);
});

const Exam = mongoose.model("Exam", examSchema);
module.exports = Exam;
