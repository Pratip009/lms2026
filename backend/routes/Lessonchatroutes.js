const express = require('express');
const multer  = require('multer');
const router  = express.Router({ mergeParams: true });

const { protect, authorize } = require('../middlewares/auth');
const lessonChatController   = require('../controllers/Lessonchatcontroller');

const ALLOWED_MIME = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'video/mp4',
  'audio/mpeg',
]);

const uploadMiddleware = (req, res, next) => {
  console.log("[uploadMiddleware] ── Incoming request ──────────────────");
  console.log("[uploadMiddleware] method         :", req.method);
  console.log("[uploadMiddleware] url            :", req.originalUrl);
  console.log("[uploadMiddleware] content-type   :", req.headers["content-type"]);
  console.log("[uploadMiddleware] content-length :", req.headers["content-length"]);

  // CRITICAL CHECK: if content-type is application/json, multer will never
  // find the files — the frontend is setting Content-Type manually.
  if (req.headers["content-type"]?.includes("application/json")) {
    console.error("[uploadMiddleware] ✗ FATAL: Content-Type is application/json!");
    console.error("[uploadMiddleware] ✗ FormData uploads require multipart/form-data.");
    console.error("[uploadMiddleware] ✗ Your axios instance is likely setting Content-Type globally.");
    console.error("[uploadMiddleware] ✗ Fix: pass { headers: { 'Content-Type': undefined } } in the request.");
  }

  if (!req.headers["content-type"]?.includes("multipart/form-data")) {
    console.warn("[uploadMiddleware] ⚠ content-type is NOT multipart/form-data — files will not be parsed.");
  } else {
    console.log("[uploadMiddleware] ✓ content-type looks correct (multipart/form-data)");
  }

  const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 20 * 1024 * 1024, files: 5 },
    fileFilter: (_req, file, cb) => {
      console.log("[uploadMiddleware] fileFilter ──────────────────────────");
      console.log("[uploadMiddleware]   fieldname   :", file.fieldname);
      console.log("[uploadMiddleware]   originalname:", file.originalname);
      console.log("[uploadMiddleware]   mimetype    :", file.mimetype);

      if (ALLOWED_MIME.has(file.mimetype)) {
        console.log("[uploadMiddleware] ✓ Accepted:", file.originalname, "(", file.mimetype, ")");
        cb(null, true);
      } else {
        console.warn("[uploadMiddleware] ✗ Rejected (MIME not in allowlist):", file.mimetype);
        cb(new Error(`File type not allowed: ${file.mimetype}`));
      }
    },
  }).array("files", 5);

  upload(req, res, (err) => {
    if (err) {
      console.error("[uploadMiddleware] ✗ Multer error:", err.message);
      console.error("[uploadMiddleware]   error type:", err.constructor?.name);
      if (err.code) console.error("[uploadMiddleware]   error code:", err.code);
      return res.status(400).json({ success: false, message: err.message });
    }

    console.log("[uploadMiddleware] ✓ Multer finished parsing");
    console.log("[uploadMiddleware]   req.files count:", req.files?.length ?? 0);
    console.log("[uploadMiddleware]   req.body keys  :", Object.keys(req.body || {}));

    if (!req.files || req.files.length === 0) {
      console.warn("[uploadMiddleware] ⚠ req.files is empty after parsing.");
      console.warn("[uploadMiddleware] ⚠ Possible causes:");
      console.warn("[uploadMiddleware]   1. Frontend FormData field name is not 'files'");
      console.warn("[uploadMiddleware]   2. No files were actually attached");
      console.warn("[uploadMiddleware]   3. Content-Type header was overridden");
    } else {
      req.files.forEach((f, i) => {
        console.log(`[uploadMiddleware]   parsed file[${i}]: ${f.originalname} | ${f.mimetype} | ${f.size} bytes`);
      });
    }

    next();
  });
};

/* ── IMPORTANT: static / prefix routes MUST come before param routes ──
   Express matches top-to-bottom. Any route with a fixed string segment
   (participants, heartbeat, download) must be registered before /:msgId
   or Express will treat the fixed string as the msgId value.           */

router.get("/",           protect, lessonChatController.getMessages);
router.post("/",          protect, uploadMiddleware, lessonChatController.sendMessage);
router.get("/participants", protect, lessonChatController.getParticipants);
router.post("/heartbeat", protect, lessonChatController.heartbeat);
router.get("/download/:msgId/:fileIndex", protect, lessonChatController.downloadFile);
router.patch("/:msgId/resolve", protect, authorize("admin", "instructor"), lessonChatController.resolveMessage);
router.delete("/", protect, authorize("admin", "instructor"), lessonChatController.clearChat);
router.delete("/:msgId", protect, lessonChatController.deleteMessage);

module.exports = router;