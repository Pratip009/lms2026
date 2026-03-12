const asyncHandler  = require('express-async-handler');
const LessonMessage = require('../models/LessonMessage');

/* ── Cloudinary: lazy-init so missing .env vars don't
      crash the server on boot                          ── */
let _cloudinary = null;
function getCloudinary() {
  if (!_cloudinary) {
    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    _cloudinary = cloudinary;
  }
  return _cloudinary;
}

/* ── Populate sender + replyTo on any query ── */
const withPopulate = (query) =>
  query
    .populate('sender', 'name avatar role')
    .populate({ path: 'replyTo', populate: { path: 'sender', select: 'name avatar role' } });

/* ── Extract Cloudinary public_id from a secure URL ── */
const cloudinaryPublicId = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  return match ? match[1].replace(/\.[^/.]+$/, '') : null;
};

/* ════════════════════════════════════════════════════════
   GET /api/courses/:courseId/lessons/:lessonId/chat
════════════════════════════════════════════════════════ */
exports.getMessages = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;

  const messages = await withPopulate(
    LessonMessage.find({ course: courseId, lesson: lessonId }).sort({ createdAt: 1 })
  ).lean();

  const participantCount = new Set(
    messages.map((m) => m.sender?._id?.toString()).filter(Boolean)
  ).size;

  res.status(200).json({ success: true, data: { messages, participantCount } });
});

/* ════════════════════════════════════════════════════════
   POST /api/courses/:courseId/lessons/:lessonId/chat
════════════════════════════════════════════════════════ */
exports.sendMessage = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { content = '', replyToId } = req.body;

  const trimmed  = content.trim();
  const hasFiles = req.files?.length > 0;

  if (!trimmed && !hasFiles) {
    res.status(400);
    throw new Error('Message cannot be empty.');
  }

  const filesMeta = [];
  for (const file of req.files ?? []) {
    const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    // Detect resource type: images/videos go as-is, everything else (PDF, doc, zip) = 'raw'
    const isImage = ['image/jpeg','image/png','image/gif','image/webp'].includes(file.mimetype);
    const isVideo = ['video/mp4'].includes(file.mimetype);
    const uploadResourceType = isImage ? 'image' : isVideo ? 'video' : 'raw';

    const result  = await getCloudinary().uploader.upload(dataUri, {
      resource_type: uploadResourceType,
      type:          'upload',    // public delivery — NOT authenticated
      folder:        `lesson-chat/${courseId}/${lessonId}`,
      public_id:     `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      use_filename:  false,
    });
    filesMeta.push({ name: file.originalname, url: result.secure_url, size: file.size });
  }

  let validReplyTo = null;
  if (replyToId) {
    const parent = await LessonMessage.findOne({ _id: replyToId, course: courseId, lesson: lessonId });
    if (parent) validReplyTo = parent._id;
  }

  const msg = await LessonMessage.create({
    course:  courseId,
    lesson:  lessonId,
    sender:  req.user._id,
    content: trimmed,
    files:   filesMeta,
    replyTo: validReplyTo,
  });

  const populated = await withPopulate(LessonMessage.findById(msg._id));
  res.status(201).json({ success: true, data: { message: populated } });
});

/* ════════════════════════════════════════════════════════
   PATCH /api/courses/:courseId/lessons/:lessonId/chat/:msgId/resolve
   Access: admin / instructor — enforced by authorize() in route
════════════════════════════════════════════════════════ */
exports.resolveMessage = asyncHandler(async (req, res) => {
  const { courseId, lessonId, msgId } = req.params;

  const msg = await LessonMessage.findOneAndUpdate(
    { _id: msgId, course: courseId, lesson: lessonId },
    { resolved: true },
    { new: true }
  );

  if (!msg) { res.status(404); throw new Error('Message not found.'); }

  res.status(200).json({ success: true, data: { message: msg } });
});

/* ════════════════════════════════════════════════════════
   DELETE /api/courses/:courseId/lessons/:lessonId/chat/:msgId
   Access: sender OR admin/instructor
════════════════════════════════════════════════════════ */
exports.deleteMessage = asyncHandler(async (req, res) => {
  const { courseId, lessonId, msgId } = req.params;

  const msg = await LessonMessage.findOne({ _id: msgId, course: courseId, lesson: lessonId });
  if (!msg) { res.status(404); throw new Error('Message not found.'); }

  const isSender = msg.sender.toString() === req.user._id.toString();
  const isStaff  = ['admin', 'instructor'].includes(req.user.role);
  if (!isSender && !isStaff) { res.status(403); throw new Error('Not allowed to delete this message.'); }

  for (const f of msg.files ?? []) {
    const publicId = cloudinaryPublicId(f.url);
    if (publicId) {
      try { await getCloudinary().uploader.destroy(publicId, { resource_type: 'auto' }); }
      catch (e) { console.warn('[LessonChat] Cloudinary delete failed:', f.url, e.message); }
    }
  }

  await msg.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

/* ════════════════════════════════════════════════════════
   GET /api/courses/:courseId/lessons/:lessonId/chat/download/:msgId/:fileIndex
   Proxies a Cloudinary file through the backend so the
   browser never hits Cloudinary directly (fixes 401).
   Access: any authenticated user
════════════════════════════════════════════════════════ */
exports.downloadFile = asyncHandler(async (req, res) => {
  const { courseId, lessonId, msgId, fileIndex } = req.params;

  const msg = await LessonMessage.findOne({
    _id:    msgId,
    course: courseId,
    lesson: lessonId,
  });

  if (!msg) { res.status(404); throw new Error('Message not found.'); }

  const idx  = parseInt(fileIndex, 10);
  const file = msg.files?.[idx];
  if (!file) { res.status(404); throw new Error('File not found.'); }

  const https = require('https');
  const http  = require('http');
  const cld   = getCloudinary();

  // Detect resource_type from the stored URL path segment
  // Old uploads went to /image/ even for PDFs — we must match that exactly
  const resourceType = file.url.includes('/video/') ? 'video'
                     : file.url.includes('/raw/')   ? 'raw'
                     : 'image'; // covers /image/ path (used for PDFs uploaded with auto)

  // Extract publicId — strip version prefix AND file extension
  // e.g. lesson-chat/.../1773317426678-Offer_Letter_Pratip.pdf  (no ext in publicId)
  const rawPublicId = cloudinaryPublicId(file.url); // already strips extension via regex
  console.log('[Download] resourceType:', resourceType, 'publicId:', rawPublicId);

  // Use Cloudinary API to generate a proper signed download URL
  const signedUrl = cld.utils.private_download_url(rawPublicId, '', {
    resource_type: resourceType,
    type:          'upload',
    expires_at:    Math.floor(Date.now() / 1000) + 300,
    attachment:    file.name,
  });
  console.log('[Download] signedUrl:', signedUrl);

  const proto = signedUrl.startsWith('https') ? https : http;
  proto.get(signedUrl, (cloudRes) => {
    console.log('[Download] status:', cloudRes.statusCode);
    if (cloudRes.statusCode !== 200) {
      if (!res.headersSent) {
        res.status(502).json({ success: false, message: `Storage returned ${cloudRes.statusCode}` });
      }
      cloudRes.resume(); // drain the response
      return;
    }
    const safeName = encodeURIComponent(file.name);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${safeName}`);
    res.setHeader('Content-Type', cloudRes.headers['content-type'] || 'application/octet-stream');
    if (cloudRes.headers['content-length']) {
      res.setHeader('Content-Length', cloudRes.headers['content-length']);
    }
    cloudRes.pipe(res);
  }).on('error', (err) => {
    console.error('[Download] error:', err.message);
    if (!res.headersSent) res.status(502).json({ success: false, message: 'File download failed.' });
  });
});