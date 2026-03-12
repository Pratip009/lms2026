const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Lesson title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Lesson description is required"],
      maxlength: [3000, "Description cannot exceed 3000 characters"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    // ─── VdoCipher ────────────────────────────────────────
    video: {
      vdoCipherId: {
        type: String,
        required: [true, "VdoCipher video ID is required"],
      },
      duration: {
        type: Number, // seconds
        default: 0,
      },
      title: String,
    },
    // ─── Access control ───────────────────────────────────
    isFreePreview: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    // ─── Resources / attachments ──────────────────────────
    resources: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        type: { type: String, enum: ["pdf", "link", "file"], default: "link" },
      },
    ],
    notes: {
      type: String,
      maxlength: [10000],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────
lessonSchema.index({ course: 1, order: 1 });
lessonSchema.index({ course: 1, isPublished: 1 });

// ─── Virtual: exam ────────────────────────────────────────
lessonSchema.virtual("exam", {
  ref: "Exam",
  localField: "_id",
  foreignField: "lesson",
  justOne: true,
});

const Lesson = mongoose.model("Lesson", lessonSchema);
module.exports = Lesson;
