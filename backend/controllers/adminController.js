const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Course = require("../models/Course");
const Order = require("../models/Order");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const Attendance = require("../models/Attendance");
const ExamAttempt = require("../models/ExamAttempt");
const { successResponse, paginatedResponse } = require("../utils/response");
const { withCache } = require("../utils/cache");

// ─── @desc    Admin dashboard stats
// ─── @route   GET /api/admin/stats
// ─── @access  Admin
const getDashboardStats = asyncHandler(async (req, res) => {
  const stats = await withCache(
    "admin:dashboard:stats",
    async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      const today = now.toISOString().split("T")[0];

      const [
        totalStudents,
        totalCourses,
        publishedCourses,
        totalOrders,
        revenueData,
        newStudentsThisMonth,
        newOrdersThisMonth,
        todayAttendance,
        activeEnrollments,
      ] = await Promise.all([
        User.countDocuments({ role: "student" }),
        Course.countDocuments({}),
        Course.countDocuments({ isPublished: true }),
        Order.countDocuments({ status: "completed" }),
        Order.aggregate([
          { $match: { status: "completed" } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]),
        User.countDocuments({ role: "student", createdAt: { $gte: thirtyDaysAgo } }),
        Order.countDocuments({ status: "completed", paidAt: { $gte: thirtyDaysAgo } }),
        Attendance.countDocuments({ date: today, status: "present" }),
        Enrollment.countDocuments({ isActive: true }),
      ]);

      // Revenue over last 12 months
      const revenueByMonth = await Order.aggregate([
        { $match: { status: "completed", paidAt: { $exists: true } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$paidAt" } },
            revenue: { $sum: "$amount" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]);

      // Top courses by enrollment
      const topCourses = await Course.find({ isPublished: true })
        .sort({ enrollmentCount: -1 })
        .limit(5)
        .select("title enrollmentCount rating thumbnail")
        .lean();

      return {
        counts: {
          totalStudents,
          totalCourses,
          publishedCourses,
          totalOrders,
          totalRevenue: revenueData[0]?.total || 0,
          newStudentsThisMonth,
          newOrdersThisMonth,
          todayPresentStudents: todayAttendance,
          activeEnrollments,
        },
        charts: {
          revenueByMonth,
          topCourses,
        },
      };
    },
    120 // 2 min cache
  );

  return successResponse(res, { stats });
});

// ─── @desc    Get all students (Admin)
// ─── @route   GET /api/admin/students
// ─── @access  Admin
const getStudents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, isActive } = req.query;

  const query = { role: "student" };
  if (search) {
    query.$or = [
      { name: new RegExp(search, "i") },
      { email: new RegExp(search, "i") },
    ];
  }
  if (isActive !== undefined) query.isActive = isActive === "true";

  const skip = (Number(page) - 1) * Number(limit);

  const [students, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-password -refreshToken")
      .lean(),
    User.countDocuments(query),
  ]);

  // Attach enrollment counts
  const studentIds = students.map((s) => s._id);
  const enrollmentCounts = await Enrollment.aggregate([
    { $match: { student: { $in: studentIds }, isActive: true } },
    { $group: { _id: "$student", count: { $sum: 1 } } },
  ]);
  const enrollMap = {};
  enrollmentCounts.forEach((e) => { enrollMap[e._id.toString()] = e.count; });

  const enriched = students.map((s) => ({
    ...s,
    enrollmentCount: enrollMap[s._id.toString()] || 0,
  }));

  return paginatedResponse(res, {
    data: enriched,
    total,
    page: Number(page),
    limit: Number(limit),
  });
});

// ─── @desc    Get single student detail (Admin)
// ─── @route   GET /api/admin/students/:id
// ─── @access  Admin
const getStudentDetail = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: "student" })
    .select("-password -refreshToken")
    .lean();

  if (!student) {
    res.status(404);
    throw new Error("Student not found.");
  }

  const [enrollments, progressList, recentAttendance] = await Promise.all([
    Enrollment.find({ student: student._id, isActive: true })
      .populate("course", "title thumbnail")
      .lean(),
    Progress.find({ student: student._id })
      .populate("course", "title")
      .select("course progressPercentage completedLessons totalLessons isCompleted")
      .lean(),
    Attendance.find({ student: student._id })
      .sort({ date: -1 })
      .limit(30)
      .lean(),
  ]);

  return successResponse(res, {
    student,
    enrollments,
    progressList,
    recentAttendance,
  });
});

// ─── @desc    Toggle student active status (Admin)
// ─── @route   PATCH /api/admin/students/:id/toggle-status
// ─── @access  Admin
const toggleStudentStatus = asyncHandler(async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: "student" });
  if (!student) {
    res.status(404);
    throw new Error("Student not found.");
  }

  student.isActive = !student.isActive;
  await student.save();

  return successResponse(
    res,
    { isActive: student.isActive },
    `Student account ${student.isActive ? "activated" : "deactivated"}`
  );
});

// ─── @desc    Get exam attempts across all students (Admin)
// ─── @route   GET /api/admin/exam-attempts
// ─── @access  Admin
const getExamAttempts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, courseId, isPassed } = req.query;

  const query = {};
  if (courseId) query.course = courseId;
  if (isPassed !== undefined) query.isPassed = isPassed === "true";

  const skip = (Number(page) - 1) * Number(limit);

  const [attempts, total] = await Promise.all([
    ExamAttempt.find(query)
      .populate("student", "name email")
      .populate("lesson", "title order")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-answers")
      .lean(),
    ExamAttempt.countDocuments(query),
  ]);

  return paginatedResponse(res, {
    data: attempts,
    total,
    page: Number(page),
    limit: Number(limit),
  });
});

module.exports = {
  getDashboardStats,
  getStudents,
  getStudentDetail,
  toggleStudentStatus,
  getExamAttempts,
};
