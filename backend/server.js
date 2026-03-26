process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err.message);
  console.error(err.stack);
  process.exit(1);
});

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const connectRedis = require("./config/redis");
const logger = require("./config/logger");
const errorHandler = require("./middlewares/errorHandler");
const { notFound } = require("./middlewares/notFound");

// ─── Route imports ────────────────────────────────────────
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const courseRoutes = require("./routes/courseRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const examRoutes = require("./routes/examRoutes");
const orderRoutes = require("./routes/orderRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const progressRoutes = require("./routes/progressRoutes");
const adminRoutes = require("./routes/adminRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const lessonChatRoutes = require("./routes/Lessonchatroutes.js");

const app = express();
app.set("trust proxy", 1);

// ─── Connect databases ────────────────────────────────────
connectDB().catch((err) => {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
});

// Redis is non-critical — log warning but keep server running
connectRedis().catch((err) => {
  console.warn("⚠️  Redis connection failed (caching disabled):", err.message);
});

// ─── Verify Nodemailer on startup ─────────────────────────
const { verifyEmailService } = require("./utils/emailService");
verifyEmailService();

// ─── Stripe webhook (raw body required — MUST come before json()) ─
app.use("/api/webhooks", webhookRoutes);

// ─── Core middleware ──────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "https://lms2026-three.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// ─── Global rate limiter ──────────────────────────────────
// Raised from 100 → 300 so normal API usage isn't throttled
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use("/api", limiter);

// ─── Auth rate limiter (stricter) ─────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skip: (req) => req.method === "OPTIONS",
  message: {
    success: false,
    message: "Too many auth attempts, please try again in 15 minutes.",
  },
});
app.use("/api/auth", authLimiter);

// ─── Chat rate limiter ────────────────────────────────────
// Much more generous than the global limiter because the frontend
// polls /chat and /chat/participants on a repeating interval.
// Using per-user key (not per-IP) so shared networks aren't penalised.
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600,                  // ~40 req/min sustained — well above polling needs
  standardHeaders: true,
  legacyHeaders: false,
  // req.user is populated by protect() middleware in each route handler,
  // but rate limiting runs before route handlers. We fall back to IP here;
  // the large max means IP-level collisions aren't a practical problem.
  keyGenerator: (req) => {
    // Authorization header carries the JWT — extract sub as key if possible
    try {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      if (token) {
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString()
        );
        if (payload?.id || payload?.sub) return `chat_${payload.id || payload.sub}`;
      }
    } catch (_) {}
    return `chat_ip_${req.ip}`;
  },
  skip: (req) => req.method === "OPTIONS",
  message: {
    success: false,
    message: "Too many chat requests, please try again later.",
  },
});

// ─── Health check ─────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "LMS API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);

// Chat gets its own limiter — must be registered BEFORE the generic
// /api/courses route so Express uses chatLimiter for this path.
app.use(
  "/api/courses/:courseId/lessons/:lessonId/chat",
  chatLimiter,
  lessonChatRoutes
);

// ─── 404 & Error handlers ─────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(
    `🚀 LMS Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  );
});

// ─── Graceful shutdown ────────────────────────────────────
process.on("unhandledRejection", (err) => {
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
  server.close(() => process.exit(1));
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated.");
    process.exit(0);
  });
});

module.exports = app;