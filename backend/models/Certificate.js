const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
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
    studentName: { type: String, required: true },
    courseName: { type: String, required: true },
    percentage: { type: Number, required: true },
    instituteName: { type: String, default: "BRIGHT HORIZON INSTITUTE" },
    certificateId: { type: String, unique: true, required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevent duplicate certificates for same student+course
certificateSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Certificate", certificateSchema);