const jwt = require("jsonwebtoken");
const { getRedis } = require("../config/redis");
const logger = require("../config/logger");

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
const blacklistToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    if (!decoded?.exp) return;
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl <= 0) return;
    const redis = getRedis();
    await redis.setex(`blacklist:${token}`, ttl, "1");
  } catch (err) {
    logger.error(`blacklistToken error: ${err.message}`);
  }
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

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  blacklistToken,
  sendTokenResponse,
};
