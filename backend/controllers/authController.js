const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  blacklistToken,
} = require("../utils/jwt");
const { startAttendanceSession, endAttendanceSession, getActiveSessionId } = require("../utils/attendance");
const { successResponse, createdResponse } = require("../utils/response");
const logger = require("../config/logger");

// ─── @desc    Register new student
// ─── @route   POST /api/auth/register
// ─── @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.status(409);
    throw new Error("An account with this email already exists.");
  }

  const user = await User.create({ name, email, password, role: "student" });

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  // Persist refresh token
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Start attendance session
  const sessionId = uuidv4();
  await startAttendanceSession(
    user._id,
    sessionId,
    req.ip,
    req.headers["user-agent"]
  );

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return createdResponse(
    res,
    {
      user: user.toSafeObject(),
      accessToken,
      sessionId,
    },
    "Registration successful"
  );
});

// ─── @desc    Login user
// ─── @route   POST /api/auth/login
// ─── @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password +refreshToken");
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password.");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated. Please contact support.");
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // End any dangling previous session
  const existingSessionId = await getActiveSessionId(user._id);
  if (existingSessionId) {
    await endAttendanceSession(user._id, existingSessionId);
  }

  // Start new attendance session
  const sessionId = uuidv4();
  await startAttendanceSession(user._id, sessionId, req.ip, req.headers["user-agent"]);

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  logger.info(`User logged in: ${user.email} (${user.role})`);

  return successResponse(
    res,
    {
      user: user.toSafeObject(),
      accessToken,
      sessionId,
    },
    "Login successful"
  );
});

// ─── @desc    Logout user
// ─── @route   POST /api/auth/logout
// ─── @access  Private
const logout = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  // End attendance session
  if (sessionId) {
    await endAttendanceSession(req.user._id, sessionId);
  }

  // Blacklist current access token
  await blacklistToken(req.token);

  // Clear refresh token in DB
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  res.clearCookie("refreshToken");

  return successResponse(res, {}, "Logged out successfully");
});

// ─── @desc    Refresh access token
// ─── @route   POST /api/auth/refresh-token
// ─── @access  Public (uses httpOnly cookie)
const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  if (!token) {
    res.status(401);
    throw new Error("No refresh token provided.");
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    res.status(401);
    throw new Error("Invalid or expired refresh token.");
  }

  const user = await User.findById(decoded.id).select("+refreshToken");
  if (!user || user.refreshToken !== token) {
    res.status(401);
    throw new Error("Refresh token mismatch. Please log in again.");
  }

  const newAccessToken = generateAccessToken(user._id, user.role);
  const newRefreshToken = generateRefreshToken(user._id);

  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return successResponse(res, { accessToken: newAccessToken }, "Token refreshed");
});

// ─── @desc    Get authenticated user profile
// ─── @route   GET /api/auth/me
// ─── @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("enrolledCoursesCount");
  return successResponse(res, { user: user.toSafeObject() });
});

// ─── @desc    Update user profile
// ─── @route   PUT /api/auth/me
// ─── @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const updates = {};
  if (name) updates.name = name;

  // If avatar was uploaded via multer+cloudinary
  if (req.file) {
    updates.avatar = {
      url: req.file.path,
      publicId: req.file.filename,
    };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return successResponse(res, { user: user.toSafeObject() }, "Profile updated");
});

// ─── @desc    Change password
// ─── @route   PUT /api/auth/change-password
// ─── @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select("+password");
  if (!(await user.comparePassword(currentPassword))) {
    res.status(400);
    throw new Error("Current password is incorrect.");
  }

  user.password = newPassword;
  await user.save();

  // Blacklist current token — force re-login
  await blacklistToken(req.token);

  return successResponse(res, {}, "Password changed. Please log in again.");
});

// ─── @desc    Attendance heartbeat
// ─── @route   POST /api/auth/heartbeat
// ─── @access  Private
const heartbeat = asyncHandler(async (req, res) => {
  const { heartbeatSession } = require("../utils/attendance");
  const { sessionId } = req.body;

  if (!sessionId) {
    res.status(400);
    throw new Error("Session ID required for heartbeat.");
  }

  const ok = await heartbeatSession(req.user._id, sessionId);
  return successResponse(res, { active: ok }, ok ? "Heartbeat recorded" : "Session not found");
});

module.exports = { register, login, logout, refreshToken, getMe, updateProfile, changePassword, heartbeat };
