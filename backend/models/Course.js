const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    slug: {
      type: String,
      unique: true,      // ← already creates an index automatically
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
      minlength: [20, "Description must be at least 20 characters"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [300, "Short description cannot exceed 300 characters"],
    },
    thumbnail: {
      url: { type: String, default: "" },
      publicId: { type: String, default: "" },
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
      uppercase: true,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    tags: [{ type: String, trim: true, lowercase: true }],
    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    language: {
      type: String,
      default: "English",
    },
    requirements: [{ type: String, trim: true }],
    whatYouWillLearn: [{ type: String, trim: true }],
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    totalLessons: {
      type: Number,
      default: 0,
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    stripeProductId: String,
    stripePriceId: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────
// NOTE: slug index is already created by unique:true above — do NOT add it here
courseSchema.index({ isPublished: 1, category: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ title: "text", description: "text", tags: "text" });

// ─── Auto-generate slug from title ───────────────────────
courseSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
      + "-" + Date.now();
  }
  next();
});

// ─── Virtual: lessons ─────────────────────────────────────
courseSchema.virtual("lessons", {
  ref: "Lesson",
  localField: "_id",
  foreignField: "course",
  options: { sort: { order: 1 } },
});

// ─── Virtual: effective price ─────────────────────────────
courseSchema.virtual("effectivePrice").get(function () {
  return this.discountPrice > 0 ? this.discountPrice : this.price;
});

const Course = mongoose.model("Course", courseSchema);
module.exports = Course;