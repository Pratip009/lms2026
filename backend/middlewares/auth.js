const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { getRedis } = require("../config/redis");

// ─── Verify JWT & attach user to request ─────────────────
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized. No token provided.");
  }

  // Check if token is blacklisted (logged-out tokens)
  try {
    const redis = getRedis();
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      res.status(401);
      throw new Error("Token has been revoked. Please log in again.");
    }
  } catch (redisErr) {
    // If Redis is down, proceed without blacklist check (fail-open for availability)
    console.warn("Redis blacklist check failed:", redisErr.message);
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    if (err.name === "TokenExpiredError") throw new Error("Token expired. Please log in again.");
    if (err.name === "JsonWebTokenError") throw new Error("Invalid token. Please log in again.");
    throw new Error("Token verification failed.");
  }

  const user = await User.findById(decoded.id).select("-password -refreshToken");
  if (!user) {
    res.status(401);
    throw new Error("User no longer exists.");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated. Contact support.");
  }

  req.user = user;
  req.token = token;
  next();
});

// ─── Role-based authorization ─────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error("Not authenticated.");
    }
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Access denied. Required role: [${roles.join(", ")}]`);
    }
    next();
  };
};

// ─── Optional auth (for public routes that benefit from user context) ─
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password -refreshToken");
    } catch {
      // Not a valid token — just proceed unauthenticated
    }
  }
  next();
});

module.exports = { protect, authorize, optionalAuth };
