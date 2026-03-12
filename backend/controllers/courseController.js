const asyncHandler = require("express-async-handler");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const { deleteFromCloudinary } = require("../config/cloudinary");
const {
  successResponse,
  createdResponse,
  paginatedResponse,
} = require("../utils/response");
const { withCache, cacheDel, cacheDelPattern } = require("../utils/cache");

// ─── @desc    Get all published courses (with search, filter, pagination)
// ─── @route   GET /api/courses
// ─── @access  Public
const getCourses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 12,
    search,
    category,
    level,
    minPrice,
    maxPrice,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const query = { isPublished: true };

  if (search) {
    query.$text = { $search: search };
  }
  if (category) query.category = new RegExp(category, "i");
  if (level) query.level = level;
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const cacheKey = `courses:list:${JSON.stringify({ query, sort, skip, limit })}`;
  const result = await withCache(
    cacheKey,
    async () => {
      const [courses, total] = await Promise.all([
        Course.find(query)
          .sort(sort)
          .skip(skip)
          .limit(Number(limit))
          .populate("instructor", "name avatar")
          .lean(),
        Course.countDocuments(query),
      ]);
      return { courses, total };
    },
    120,
  );

  return paginatedResponse(res, {
    data: result.courses,
    total: result.total,
    page: Number(page),
    limit: Number(limit),
  });
});

// ─── @desc    Get ALL courses for admin (published + drafts)
// ─── @route   GET /api/admin/courses
// ─── @access  Admin
const getAdminCourses = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    search,
    category,
    level,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  // No isPublished filter — admins see everything
  const query = {};

  if (search) query.$text = { $search: search };
  if (category) query.category = new RegExp(category, "i");
  if (level) query.level = level;

  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [courses, total] = await Promise.all([
    Course.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate("instructor", "name avatar")
      .lean(),
    Course.countDocuments(query),
  ]);

  return paginatedResponse(res, {
    data: courses,
    total,
    page: Number(page),
    limit: Number(limit),
  });
});

// ─── @desc    Get single course details
// ─── @route   GET /api/courses/:id
// ─── @access  Public
const getCourseById = asyncHandler(async (req, res) => {
  const course = await withCache(
    `course:${req.params.id}`,
    async () =>
      Course.findOne({ _id: req.params.id, isPublished: true })
        .populate("instructor", "name avatar")
        .populate({
          path: "lessons",
          match: { isPublished: true },
          select: "title order description isFreePreview video.duration",
        })
        .lean(),
    300,
  );

  if (!course) {
    res.status(404);
    throw new Error("Course not found.");
  }

  let isEnrolled = false;
  if (req.user) {
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
      isActive: true,
    });
    isEnrolled = !!enrollment;
  }

  return successResponse(res, { course: { ...course, isEnrolled } });
});

// ─── @desc    Create a new course (Admin)
// ─── @route   POST /api/courses
// ─── @access  Admin
const createCourse = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    shortDescription,
    price,
    discountPrice,
    category,
    tags,
    level,
    language,
    requirements,
    whatYouWillLearn,
  } = req.body;

  const courseData = {
    title,
    description,
    shortDescription,
    price: Number(price),
    discountPrice: Number(discountPrice || 0),
    category,
    tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [],
    level,
    language,
    requirements: requirements
      ? Array.isArray(requirements)
        ? requirements
        : JSON.parse(requirements)
      : [],
    whatYouWillLearn: whatYouWillLearn
      ? Array.isArray(whatYouWillLearn)
        ? whatYouWillLearn
        : JSON.parse(whatYouWillLearn)
      : [],
    instructor: req.user._id,
  };

  if (req.file) {
    courseData.thumbnail = {
      url: req.file.path,
      publicId: req.file.filename,
    };
  }

  const course = await Course.create(courseData);
  await cacheDelPattern("courses:list:*");

  return createdResponse(res, { course }, "Course created successfully");
});

// ─── @desc    Update a course (Admin)
// ─── @route   PUT /api/courses/:id
// ─── @access  Admin
const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error("Course not found.");
  }

  const updatableFields = [
    "title",
    "description",
    "shortDescription",
    "price",
    "discountPrice",
    "category",
    "level",
    "language",
    "isPublished",
    "isFeatured",
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) course[field] = req.body[field];
  });

  ["tags", "requirements", "whatYouWillLearn"].forEach((field) => {
    if (req.body[field]) {
      course[field] =
        typeof req.body[field] === "string"
          ? JSON.parse(req.body[field])
          : req.body[field];
    }
  });

  if (req.file) {
    if (course.thumbnail?.publicId) {
      await deleteFromCloudinary(course.thumbnail.publicId);
    }
    course.thumbnail = { url: req.file.path, publicId: req.file.filename };
  }

  await course.save();

  await cacheDel(`course:${course._id}`);
  await cacheDelPattern("courses:list:*");

  return successResponse(res, { course }, "Course updated successfully");
});

// ─── @desc    Delete a course (Admin)
// ─── @route   DELETE /api/courses/:id
// ─── @access  Admin
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error("Course not found.");
  }

  if (course.thumbnail?.publicId) {
    await deleteFromCloudinary(course.thumbnail.publicId);
  }

  await Lesson.deleteMany({ course: course._id });
  await course.deleteOne();

  await cacheDel(`course:${course._id}`);
  await cacheDelPattern("courses:list:*");

  return successResponse(res, {}, "Course deleted successfully");
});

// ─── @desc    Toggle publish status (Admin)
// ─── @route   PATCH /api/courses/:id/publish
// ─── @access  Admin
const togglePublish = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    res.status(404);
    throw new Error("Course not found.");
  }

  course.isPublished = !course.isPublished;
  await course.save();

  await cacheDel(`course:${course._id}`);
  await cacheDelPattern("courses:list:*");

  return successResponse(
    res,
    { isPublished: course.isPublished },
    `Course ${course.isPublished ? "published" : "unpublished"}`,
  );
});

// ─── @desc    Get featured courses
// ─── @route   GET /api/courses/featured
// ─── @access  Public
const getFeaturedCourses = asyncHandler(async (req, res) => {
  const courses = await withCache(
    "courses:featured",
    () =>
      Course.find({ isPublished: true, isFeatured: true })
        .limit(6)
        .populate("instructor", "name avatar")
        .lean(),
    600,
  );

  return successResponse(res, { courses });
});

// ─── @desc    Get all course categories
// ─── @route   GET /api/courses/categories
// ─── @access  Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await withCache(
    "courses:categories",
    () => Course.distinct("category", { isPublished: true }),
    600,
  );
  return successResponse(res, { categories });
});
// ─── @desc    Get single course for admin (draft or published)
// ─── @route   GET /api/courses/admin/:id
// ─── @access  Admin
const getAdminCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("instructor", "name avatar")
    .populate({
      path: "lessons",
      select: "title order description isFreePreview video isPublished",
    })
    .lean();

  if (!course) {
    res.status(404);
    throw new Error("Course not found.");
  }

  return successResponse(res, { course });
});

module.exports = {
  getCourses,
  getAdminCourses,
  getAdminCourseById,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublish,
  getFeaturedCourses,
  getCategories,
};
