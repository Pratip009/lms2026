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
const certificateRoutes = require("./routes/certificateRoutes");
const app = express();
app.set("trust proxy", 1);

// ─── Connect databases ────────────────────────────────────
connectDB().catch((err) => {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
});

// ─── Verify Resend email service on startup ───────────────
const { verifyEmailService } = require("./utils/emailService");
verifyEmailService().catch((err) =>
  console.error("❌ Email service error:", err.message)
);

// ─── Stripe webhook (raw body required — MUST come before json()) ─
app.use("/api/webhooks", webhookRoutes);

// ─── Core middleware ──────────────────────────────────────
app.use(helmet());
// app.use(
//   cors({
//     origin: [
//       process.env.CLIENT_URL || "https://lms2026-chi.vercel.app",
//       "http://localhost:3000",
//     ],
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );
app.use(
  cors({
    origin: true,
    credentials: true,
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
// Key by authenticated user (decoded from the JWT) when present, falling
// back to IP. This stops one busy user from exhausting the shared budget
// for everyone else behind the same IP (school/office Wi-Fi, mobile NAT),
// and raises the ceiling to account for the app's background polling
// (chat messages, participants, attendance heartbeats, etc.) while a
// lesson page is open.
const keyByUserOrIp = (req) => {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (token) {
      const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
      if (payload?.id || payload?.sub) return `user_${payload.id || payload.sub}`;
    }
  } catch (_) {}
  return req.ip;
};

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 min
  max: parseInt(process.env.RATE_LIMIT_MAX) || 1200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByUserOrIp,
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
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
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
app.use("/api/certificates", certificateRoutes);

// Chat gets its own limiter
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
  // Log loudly but do NOT exit — a single stray rejection (e.g. a 429 from
  // an external API like Resend/VdoCipher) should not take down the whole
  // server for every other user. Routes are already wrapped in asyncHandler,
  // so this is a safety net for logging, not a reason to crash.
  console.error(`❌ Unhandled Rejection: ${err.message}`);
  console.error(err.stack);
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Process terminated.");
    process.exit(0);
  });
});

module.exports = app;