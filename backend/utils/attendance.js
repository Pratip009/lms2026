const { getRedis } = require("../config/redis");
const Attendance = require("../models/Attendance");
const logger = require("../config/logger");

const getTodayDate = () => new Date().toISOString().split("T")[0]; // YYYY-MM-DD

const SESSION_KEY = (userId, sessionId) => `session:${userId}:${sessionId}`;
const ACTIVE_SESSION_KEY = (userId) => `active_session:${userId}`;

/**
 * Start a new attendance session for a user.
 */
const startAttendanceSession = async (userId, sessionId, ipAddress, userAgent) => {
  try {
    const redis = getRedis();
    const now = new Date();
    const todayDate = getTodayDate();

    // Store active session in Redis
    const sessionData = {
      sessionId,
      userId: userId.toString(),
      loginAt: now.toISOString(),
      lastHeartbeat: now.toISOString(),
      ipAddress: ipAddress || "",
      userAgent: userAgent || "",
    };

    const TTL = 24 * 60 * 60; // 24 hours
    await redis.setex(SESSION_KEY(userId, sessionId), TTL, JSON.stringify(sessionData));
    await redis.setex(ACTIVE_SESSION_KEY(userId), TTL, sessionId);

    // Upsert daily attendance record
    await Attendance.findOneAndUpdate(
      { student: userId, date: todayDate },
      {
        $setOnInsert: { student: userId, date: todayDate },
        $push: {
          sessions: {
            sessionId,
            loginAt: now,
            ipAddress,
            userAgent,
            isActive: true,
            lastHeartbeat: now,
          },
        },
        $inc: { loginCount: 1 },
        $set: { firstLoginAt: now },
      },
      { upsert: true, new: true }
    );

    logger.info(`Attendance session started: user=${userId} session=${sessionId}`);
  } catch (err) {
    logger.error(`startAttendanceSession error: ${err.message}`);
  }
};

/**
 * Heartbeat — update session last-active time in Redis.
 */
const heartbeatSession = async (userId, sessionId) => {
  try {
    const redis = getRedis();
    const key = SESSION_KEY(userId, sessionId);
    const raw = await redis.get(key);
    if (!raw) return false;

    const data = JSON.parse(raw);
    data.lastHeartbeat = new Date().toISOString();
    await redis.setex(key, 24 * 60 * 60, JSON.stringify(data));
    return true;
  } catch (err) {
    logger.error(`heartbeatSession error: ${err.message}`);
    return false;
  }
};

/**
 * End a session — compute duration and persist to MongoDB.
 */
const endAttendanceSession = async (userId, sessionId) => {
  try {
    const redis = getRedis();
    const key = SESSION_KEY(userId, sessionId);
    const raw = await redis.get(key);

    if (!raw) {
      logger.warn(`endAttendanceSession: session ${sessionId} not found in Redis`);
      return;
    }

    const data = JSON.parse(raw);
    const loginAt = new Date(data.loginAt);
    const logoutAt = new Date();
    const duration = Math.floor((logoutAt - loginAt) / 1000); // seconds

    const todayDate = getTodayDate();

    // Update MongoDB session record
    const attendance = await Attendance.findOneAndUpdate(
      { student: userId, date: todayDate, "sessions.sessionId": sessionId },
      {
        $set: {
          "sessions.$.logoutAt": logoutAt,
          "sessions.$.duration": duration,
          "sessions.$.isActive": false,
          lastLogoutAt: logoutAt,
        },
        $inc: { totalDuration: duration },
      },
      { new: true }
    );

    if (attendance) {
      attendance.computeStatus();
      await attendance.save();
    }

    // Cleanup Redis
    await redis.del(key);
    const activeSession = await redis.get(ACTIVE_SESSION_KEY(userId));
    if (activeSession === sessionId) {
      await redis.del(ACTIVE_SESSION_KEY(userId));
    }

    logger.info(`Session ended: user=${userId} session=${sessionId} duration=${duration}s`);
  } catch (err) {
    logger.error(`endAttendanceSession error: ${err.message}`);
  }
};

/**
 * Get the active session ID for a user (from Redis).
 */
const getActiveSessionId = async (userId) => {
  try {
    const redis = getRedis();
    return await redis.get(ACTIVE_SESSION_KEY(userId));
  } catch {
    return null;
  }
};

module.exports = {
  startAttendanceSession,
  heartbeatSession,
  endAttendanceSession,
  getActiveSessionId,
  getTodayDate,
};
