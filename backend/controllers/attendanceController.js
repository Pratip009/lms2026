// ─── Add these routes to attendanceRoutes.js ─────────────
// router.post("/session/start", protect, startSession);
// router.post("/session/heartbeat", protect, heartbeat);
// router.post("/session/end", protect, endSession);

const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const Attendance = require("../models/Attendance");
const { successResponse } = require("../utils/response");
const { getTodayDate } = require("../utils/attendance");

// ─── @desc    Start a new session (call on login / page load)
// ─── @route   POST /api/attendance/session/start
// ─── @access  Private
const startSession = asyncHandler(async (req, res) => {
  const today = getTodayDate();
  const sessionId = uuidv4();

  const attendance = await Attendance.findOneAndUpdate(
    { student: req.user._id, date: today },
    {
      $setOnInsert: {
        student: req.user._id,
        date: today,
        requiredDuration: parseInt(process.env.MIN_DAILY_ATTENDANCE_SECONDS) || 10800,
      },
      $push: {
        sessions: {
          sessionId,
          loginAt: new Date(),
          isActive: true,
          lastHeartbeat: new Date(),
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"],
        },
      },
      $inc: { loginCount: 1 },
      $min: { firstLoginAt: new Date() },
    },
    { upsert: true, new: true }
  );

  return successResponse(res, { sessionId });
});

// ─── @desc    Heartbeat — called every 60s while user is active
// ─── @route   POST /api/attendance/session/heartbeat
// ─── @access  Private
const heartbeat = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    res.status(400);
    throw new Error("sessionId is required");
  }

  const today = getTodayDate();
  const now = new Date();
  const HEARTBEAT_INTERVAL = 60; // seconds — must match frontend interval

  // Update session's lastHeartbeat and add time to duration
  const attendance = await Attendance.findOneAndUpdate(
    {
      student: req.user._id,
      date: today,
      "sessions.sessionId": sessionId,
      "sessions.isActive": true,
    },
    {
      $set: { "sessions.$.lastHeartbeat": now },
      $inc: {
        "sessions.$.duration": HEARTBEAT_INTERVAL,
        totalDuration: HEARTBEAT_INTERVAL,
      },
    },
    { new: true }
  );

  if (!attendance) {
    // Session expired or not found — tell frontend to start new session
    return successResponse(res, { expired: true });
  }

  // Recompute status
  attendance.computeStatus();
  await attendance.save();

  return successResponse(res, {
    expired: false,
    totalDuration: attendance.totalDuration,
    meetsRequirement: attendance.meetsRequirement,
  });
});

// ─── @desc    End session (call on logout / page unload)
// ─── @route   POST /api/attendance/session/end
// ─── @access  Private
const endSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    res.status(400);
    throw new Error("sessionId is required");
  }

  const today = getTodayDate();
  const now = new Date();

  const attendance = await Attendance.findOne({
    student: req.user._id,
    date: today,
    "sessions.sessionId": sessionId,
  });

  if (attendance) {
    const session = attendance.sessions.find(s => s.sessionId === sessionId);
    if (session && session.isActive) {
      // Calculate remaining time since last heartbeat
      const lastBeat = new Date(session.lastHeartbeat);
      const extraSeconds = Math.floor((now - lastBeat) / 1000);
      const cappedExtra = Math.min(extraSeconds, 120); // cap at 2min to avoid inflating on crash

      session.isActive = false;
      session.logoutAt = now;
      session.duration += cappedExtra;
      attendance.totalDuration += cappedExtra;
      attendance.lastLogoutAt = now;
      attendance.computeStatus();
      await attendance.save();
    }
  }

  return successResponse(res, { ended: true });
});

// ─── @desc    Get today's attendance for current student
// ─── @route   GET /api/attendance/today
// ─── @access  Private
const getTodayAttendance = asyncHandler(async (req, res) => {
  const today = getTodayDate();
  const attendance = await Attendance.findOne({
    student: req.user._id,
    date: today,
  }).lean();

  return successResponse(res, {
    attendance: attendance || {
      date: today,
      totalDuration: 0,
      meetsRequirement: false,
      status: "absent",
      sessions: [],
    },
    requiredSeconds: parseInt(process.env.MIN_DAILY_ATTENDANCE_SECONDS) || 10800,
  });
});

// ─── @desc    Get student's attendance history
// ─── @route   GET /api/attendance/my
// ─── @access  Private
const getMyAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate, page = 1, limit = 30 } = req.query;

  const query = { student: req.user._id };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [records, total] = await Promise.all([
    Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-sessions.userAgent")
      .lean(),
    Attendance.countDocuments(query),
  ]);

  const summaryPipeline = [
    { $match: { student: req.user._id } },
    {
      $group: {
        _id: null,
        totalDays: { $sum: 1 },
        presentDays: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        partialDays: { $sum: { $cond: [{ $eq: ["$status", "partial"] }, 1, 0] } },
        totalSeconds: { $sum: "$totalDuration" },
      },
    },
  ];
  const summary = await Attendance.aggregate(summaryPipeline);

  return successResponse(res, {
    records,
    summary: summary[0] || { totalDays: 0, presentDays: 0, partialDays: 0, totalSeconds: 0 },
    pagination: { total, page: Number(page), totalPages: Math.ceil(total / limit) },
  });
});

// ─── @desc    Get all students' attendance (Admin)
// ─── @route   GET /api/attendance/report
// ─── @access  Admin
const getAttendanceReport = asyncHandler(async (req, res) => {
  const { date, startDate, endDate, studentId, page = 1, limit = 20 } = req.query;
  const query = {};
  if (date) query.date = date;
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }
  if (studentId) query.student = studentId;

  const skip = (Number(page) - 1) * Number(limit);
  const [records, total] = await Promise.all([
    Attendance.find(query)
      .populate("student", "name email avatar")
      .sort({ date: -1, "student.name": 1 })
      .skip(skip)
      .limit(Number(limit))
      .select("-sessions.userAgent -sessions.ipAddress")
      .lean(),
    Attendance.countDocuments(query),
  ]);

  return successResponse(res, {
    records,
    pagination: { total, page: Number(page), totalPages: Math.ceil(total / limit) },
  });
});

// ─── @desc    Get attendance summary per student (Admin)
// ─── @route   GET /api/attendance/summary
// ─── @access  Admin
const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.date = {};
    if (startDate) matchStage.date.$gte = startDate;
    if (endDate) matchStage.date.$lte = endDate;
  }

  const summary = await Attendance.aggregate([
    ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
    {
      $group: {
        _id: "$student",
        totalDays: { $sum: 1 },
        presentDays: { $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] } },
        partialDays: { $sum: { $cond: [{ $eq: ["$status", "partial"] }, 1, 0] } },
        absentDays: { $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] } },
        totalSeconds: { $sum: "$totalDuration" },
        avgDailySeconds: { $avg: "$totalDuration" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "student",
        pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
      },
    },
    { $unwind: "$student" },
    { $sort: { presentDays: -1 } },
  ]);

  return successResponse(res, { summary });
});

// ─── @desc    Get specific student's attendance detail (Admin)
// ─── @route   GET /api/attendance/student/:studentId
// ─── @access  Admin
const getStudentAttendance = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const query = { student: req.params.studentId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate;
    if (endDate) query.date.$lte = endDate;
  }

  const records = await Attendance.find(query).sort({ date: -1 }).lean();
  return successResponse(res, { records });
});

module.exports = {
  startSession,
  heartbeat,
  endSession,
  getTodayAttendance,
  getMyAttendance,
  getAttendanceReport,
  getAttendanceSummary,
  getStudentAttendance,
};