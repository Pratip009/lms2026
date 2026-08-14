const asyncHandler = require("express-async-handler");
const BhiClass = require("../../models/bhi/BhiClass");
const BhiEnrollment = require("../../models/bhi/BhiEnrollment");
const User = require("../../models/User");

// GET /api/bhi/classes — admin: all classes; teacher: only their own ("My Classes", §19)
const getClasses = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.user.role === "teacher") filter.teacher = req.user._id;
  if (req.query.program) filter.program = req.query.program;

  const classes = await BhiClass.find(filter)
    .populate("program", "name type")
    .populate("teacher", "name email")
    .sort({ createdAt: -1 });

  res.json({ success: true, classes });
});

// GET /api/bhi/classes/:id — full detail incl. roster
const getClassById = asyncHandler(async (req, res) => {
  const bhiClass = await BhiClass.findById(req.params.id)
    .populate("program", "name type")
    .populate("teacher", "name email");

  if (!bhiClass) {
    res.status(404);
    throw new Error("Class not found.");
  }

  if (req.user.role === "teacher" && String(bhiClass.teacher._id) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You are not assigned to this class.");
  }

  const roster = await BhiEnrollment.find({ class: bhiClass._id, status: "Active" })
    .populate("student", "firstName lastName studentId enrollmentStatus")
    .sort({ "student.lastName": 1 });

  res.json({ success: true, class: bhiClass, roster });
});

// POST /api/bhi/classes (admin only)
const createClass = asyncHandler(async (req, res) => {
  const { program, sectionName, teacher, schedule } = req.body;

  const teacherUser = await User.findById(teacher);
  if (!teacherUser || teacherUser.role !== "teacher") {
    res.status(400);
    throw new Error("A valid teacher account must be assigned to this class.");
  }

  const bhiClass = await BhiClass.create({ program, sectionName, teacher, schedule });
  res.status(201).json({ success: true, class: bhiClass });
});

// PATCH /api/bhi/classes/:id (admin only) — includes reassigning teacher
const updateClass = asyncHandler(async (req, res) => {
  if (req.body.teacher) {
    const teacherUser = await User.findById(req.body.teacher);
    if (!teacherUser || teacherUser.role !== "teacher") {
      res.status(400);
      throw new Error("A valid teacher account must be assigned to this class.");
    }
  }

  const bhiClass = await BhiClass.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!bhiClass) {
    res.status(404);
    throw new Error("Class not found.");
  }
  res.json({ success: true, class: bhiClass });
});

// DELETE /api/bhi/classes/:id — soft delete (admin only)
const deactivateClass = asyncHandler(async (req, res) => {
  const bhiClass = await BhiClass.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );
  if (!bhiClass) {
    res.status(404);
    throw new Error("Class not found.");
  }
  res.json({ success: true, class: bhiClass });
});

// GET /api/bhi/teachers — list of teacher accounts, for assignment dropdowns (admin only)
const getTeachers = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: "teacher", isActive: true }).select("name email");
  res.json({ success: true, teachers });
});

module.exports = {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deactivateClass,
  getTeachers,
};
