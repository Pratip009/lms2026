const asyncHandler = require("express-async-handler");
const crypto = require("crypto");
const User = require("../../models/User");

// GET /api/bhi/teacher-accounts (admin only) — list, incl. inactive
const listTeacherAccounts = asyncHandler(async (req, res) => {
  const teachers = await User.find({ role: "teacher" }).select("name email isActive createdAt");
  res.json({ success: true, teachers });
});

// POST /api/bhi/teacher-accounts (admin only)
// Body: { name, email, password? } — if password omitted, a random temp
// password is generated and returned once so the admin can share it.
const createTeacherAccount = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email) {
    res.status(400);
    throw new Error("Name and email are required.");
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    res.status(400);
    throw new Error("A user with this email already exists.");
  }

  const tempPassword = password || crypto.randomBytes(6).toString("base64url");

  const teacher = await User.create({
    name,
    email,
    password: tempPassword,
    role: "teacher",
    isEmailVerified: true, // admin-created accounts are pre-verified
  });

  res.status(201).json({
    success: true,
    teacher: teacher.toSafeObject(),
    // Only returned on creation, when we auto-generated it — never stored or logged elsewhere.
    temporaryPassword: password ? undefined : tempPassword,
  });
});

// PATCH /api/bhi/teacher-accounts/:id/deactivate (admin only)
// Soft-disable login without touching any classes/attendance already assigned to them.
const setTeacherActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const teacher = await User.findOneAndUpdate(
    { _id: req.params.id, role: "teacher" },
    { isActive: !!isActive },
    { new: true }
  ).select("name email isActive");

  if (!teacher) {
    res.status(404);
    throw new Error("Teacher account not found.");
  }
  res.json({ success: true, teacher });
});

module.exports = { listTeacherAccounts, createTeacherAccount, setTeacherActive };
