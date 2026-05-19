const Attendance = require("../models/Attendance");
const logger = require("../config/logger");

const getTodayDate = () => new Date().toISOString().split("T")[0]; // YYYY-MM-DD

const SESSION_KEY = (userId, sessionId) => `session:${userId}:${sessionId}`;
const ACTIVE_SESSION_KEY = (userId) => `active_session:${userId}`;

// In-memory store replacing Redis
const sessionStore = new Map();
const activeSessionStore = new Map();

/**
 * Start a new attendance session for a user.
 */
const startAttendanceSession = async (userId, sessionId, ipAddress, userAgent) => {
  try {
    const now = new Date();
    const todayDate = getTodayDate();

    const sessionData = {
      sessionId,
      userId: userId.toString(),
      loginAt: now.toISOString(),
      lastHeartbeat: now.toISOString(),
      ipAddress: ipAddress || "",
      userAgent: userAgent || "",
    };

    sessionStore.set(SESSION_KEY(userId, sessionId), sessionData);
    activeSessionStore.set(ACTIVE_SESSION_KEY(userId), sessionId);

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
 * Heartbeat — update session last-active time in memory.
 */
const heartbeatSession = async (userId, sessionId) => {
  try {
    const key = SESSION_KEY(userId, sessionId);
    const data = sessionStore.get(key);
    if (!data) return false;

    data.lastHeartbeat = new Date().toISOString();
    sessionStore.set(key, data);
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
    const key = SESSION_KEY(userId, sessionId);
    const data = sessionStore.get(key);

    if (!data) {
      logger.warn(`endAttendanceSession: session ${sessionId} not found in store`);
      return;
    }

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

    // Cleanup in-memory store
    sessionStore.delete(key);
    const activeSession = activeSessionStore.get(ACTIVE_SESSION_KEY(userId));
    if (activeSession === sessionId) {
      activeSessionStore.delete(ACTIVE_SESSION_KEY(userId));
    }

    logger.info(`Session ended: user=${userId} session=${sessionId} duration=${duration}s`);
  } catch (err) {
    logger.error(`endAttendanceSession error: ${err.message}`);
  }
};

/**
 * Get the active session ID for a user (from memory).
 */
const getActiveSessionId = async (userId) => {
  try {
    return activeSessionStore.get(ACTIVE_SESSION_KEY(userId)) ?? null;
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