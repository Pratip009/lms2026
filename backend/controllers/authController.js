const asyncHandler = require("express-async-handler");
const { v4: uuidv4 } = require("uuid");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  blacklistToken,
} = require("../utils/jwt");
const {
  startAttendanceSession,
  endAttendanceSession,
  getActiveSessionId,
} = require("../utils/attendance");
const { successResponse, createdResponse } = require("../utils/response");
const logger = require("../config/logger");
const { sendOtpEmail, sendWelcomeEmail } = require("../utils/emailService");

// ─── Cookie helper ────────────────────────────────────────
// FIX: sameSite "strict" silently drops cookies on cross-domain requests
// (Vercel frontend → Render backend). Must use "none" in production,
// which requires secure:true (Render provides HTTPS automatically).
const setRefreshTokenCookie = (res, token) => {
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// ─── @desc    Verify OTP and complete registration
// ─── @route   POST /api/auth/verify-otp
// ─── @access  Public
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  console.log("verifyOtp hit:", { email, otp });
  console.log("otp type:", typeof otp);

  const user = await User.findOne({ email }).select("+otp +otpExpires");

  console.log("user found:", !!user);
  console.log("user.otp:", user?.otp);
  console.log("user.otpExpires:", user?.otpExpires);
  console.log("otp match:", user?.otp === otp);
  console.log("isEmailVerified:", user?.isEmailVerified);
  console.log("expired:", user?.otpExpires < new Date());

  if (!user) {
    res.status(404);
    throw new Error("No account found with this email.");
  }

  if (user.isEmailVerified) {
    res.status(400);
    throw new Error("Email is already verified.");
  }

  if (!user.otp || user.otp !== otp) {
    res.status(400);
    throw new Error("Invalid OTP.");
  }

  if (user.otpExpires < new Date()) {
    res.status(400);
    throw new Error("OTP has expired. Please request a new one.");
  }

  // Mark verified, clear OTP fields
  user.isEmailVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  user.lastLogin = new Date();

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  const sessionId = uuidv4();
  await startAttendanceSession(
    user._id,
    sessionId,
    req.ip,
    req.headers["user-agent"],
  );

  // FIX: use helper with sameSite "none" for cross-domain (Vercel ↔ Render)
  setRefreshTokenCookie(res, refreshToken);

  return successResponse(
    res,
    { user: user.toSafeObject(), accessToken, sessionId },
    "Email verified. Welcome!",
  );
});

// ─── @desc    Resend OTP
// ─── @route   POST /api/auth/resend-otp
// ─── @access  Public
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email }).select("+otp +otpExpires");
  if (!user) {
    res.status(404);
    throw new Error("No account found with this email.");
  }

  if (user.isEmailVerified) {
    res.status(400);
    throw new Error("Email is already verified.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = otp;
  user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  await sendOtpEmail(email, otp);

  return successResponse(res, {}, "A new OTP has been sent to your email.");
});

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

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  const user = await User.create({
    name,
    email,
    password,
    role: "student",
    otp,
    otpExpires,
    isEmailVerified: false,
  });

  await sendOtpEmail(email, otp);

  return createdResponse(
    res,
    { email: user.email },
    "Registration successful. Check your email for the OTP.",
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
    throw new Error(
      "Your account has been deactivated. Please contact support.",
    );
  }

  if (!user.isEmailVerified) {
    res.status(403);
    throw new Error("Please verify your email before logging in.");
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const existingSessionId = await getActiveSessionId(user._id);
  if (existingSessionId) {
    await endAttendanceSession(user._id, existingSessionId);
  }

  const sessionId = uuidv4();
  await startAttendanceSession(
    user._id,
    sessionId,
    req.ip,
    req.headers["user-agent"],
  );

  // FIX: use helper with sameSite "none" for cross-domain (Vercel ↔ Render)
  setRefreshTokenCookie(res, refreshToken);

  logger.info(`User logged in: ${user.email} (${user.role})`);

  return successResponse(
    res,
    {
      user: user.toSafeObject(),
      accessToken,
      sessionId,
    },
    "Login successful",
  );
});

// ─── @desc    Logout user
// ─── @route   POST /api/auth/logout
// ─── @access  Private
const logout = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  if (sessionId) {
    await endAttendanceSession(req.user._id, sessionId);
  }

  await blacklistToken(req.token);

  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

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

  // FIX: use helper with sameSite "none" for cross-domain (Vercel ↔ Render)
  setRefreshTokenCookie(res, newRefreshToken);

  return successResponse(
    res,
    { accessToken: newAccessToken },
    "Token refreshed",
  );
});

// ─── @desc    Get authenticated user profile
// ─── @route   GET /api/auth/me
// ─── @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "enrolledCoursesCount",
  );
  return successResponse(res, { user: user.toSafeObject() });
});

// ─── @desc    Update user profile
// ─── @route   PUT /api/auth/me
// ─── @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const updates = {};
  if (name) updates.name = name;

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
  return successResponse(
    res,
    { active: ok },
    ok ? "Heartbeat recorded" : "Session not found",
  );
});

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  heartbeat,
  verifyOtp,
  resendOtp,
};