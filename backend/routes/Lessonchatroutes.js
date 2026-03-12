const express = require('express');
const multer  = require('multer');
const router  = express.Router({ mergeParams: true });

// ── IMPORTANT ─────────────────────────────────────────────────────────
// Change this path to match what your other route files use.
// Run this to find out:
//   grep -r "protect" D:\newlife2025\lmsnew\backend\routes\courseRoutes.js
// ──────────────────────────────────────────────────────────────────────
const { protect, authorize } = require('../middlewares/auth');

const lessonChatController = require('../controllers/Lessonchatcontroller');

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

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    ALLOWED_MIME.has(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`File type not allowed: ${file.mimetype}`));
  },
});

// ── IMPORTANT: specific routes MUST come before param routes (:msgId)
// otherwise Express matches "download" as a :msgId value

// GET  /api/courses/:courseId/lessons/:lessonId/chat
router.get('/', protect, lessonChatController.getMessages);

// POST /api/courses/:courseId/lessons/:lessonId/chat
router.post('/', protect, upload.array('files', 5), lessonChatController.sendMessage);

// GET  /api/courses/:courseId/lessons/:lessonId/chat/download/:msgId/:fileIndex
// ← Must be BEFORE /:msgId routes so "download" isn't treated as a msgId
router.get('/download/:msgId/:fileIndex', protect, lessonChatController.downloadFile);

// PATCH /api/courses/:courseId/lessons/:lessonId/chat/:msgId/resolve
router.patch('/:msgId/resolve', protect, authorize('admin', 'instructor'), lessonChatController.resolveMessage);

// DELETE /api/courses/:courseId/lessons/:lessonId/chat/:msgId
router.delete('/:msgId', protect, lessonChatController.deleteMessage);

module.exports = router;