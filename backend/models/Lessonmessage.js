const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url:  { type: String, required: true },
    size: { type: Number, default: 0 },
  },
  { _id: false }
);

const LessonMessageSchema = new mongoose.Schema(
  {
    course:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course',  required: true, index: true },
    lesson:   { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson',  required: true, index: true },
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    content:  { type: String, default: '' },
    files:    { type: [FileSchema], default: [] },
    replyTo:  { type: mongoose.Schema.Types.ObjectId, ref: 'LessonMessage', default: null },
    resolved: { type: Boolean, default: false },
    edited:   { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound index for fast per-lesson queries
LessonMessageSchema.index({ course: 1, lesson: 1, createdAt: 1 });

module.exports = mongoose.model('LessonMessage', LessonMessageSchema);