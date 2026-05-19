const jwt = require("jsonwebtoken");
const logger = require("../config/logger");
const tokenBlacklist = new Set();
const generateAccessToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Blacklist an access token until it would naturally expire.
 */
const blacklistToken = async (token, ttl) => {
  tokenBlacklist.add(token);
  // Auto-remove after TTL (same behaviour as Redis SETEX)
  setTimeout(() => tokenBlacklist.delete(token), ttl * 1000);
};

/**
 * Attach tokens to response and set cookie.
 */
const sendTokenResponse = (res, user, statusCode = 200) => {
  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);

  return {
    accessToken,
    refreshToken,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  };
};
const isTokenBlacklisted = (token) => tokenBlacklist.has(token);


module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  isTokenBlacklisted,
  blacklistToken,
  sendTokenResponse,
};
