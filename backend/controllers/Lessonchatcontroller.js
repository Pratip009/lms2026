const asyncHandler = require("express-async-handler");
const LessonMessage = require("../models/Lessonmessage.js");
const Enrollment = require("../models/Enrollment.js");
const User = require("../models/User.js");
const Course = require("../models/Course.js");

/* ── Cloudinary: lazy-init so missing .env vars don't
      crash the server on boot                          ── */
let _cloudinary = null;
function getCloudinary() {
  if (!_cloudinary) {
    const cloudinary = require("cloudinary").v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key:    process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    _cloudinary = cloudinary;

    console.log("[Cloudinary] Initialized with cloud_name:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("[Cloudinary] api_key present:", !!process.env.CLOUDINARY_API_KEY);
    console.log("[Cloudinary] api_secret present:", !!process.env.CLOUDINARY_API_SECRET);
  }
  return _cloudinary;
}

/* ── Populate sender + replyTo on any query ── */
const withPopulate = (query) =>
  query.populate("sender", "name avatar role").populate({
    path: "replyTo",
    populate: { path: "sender", select: "name avatar role" },
  });

/* ── Extract Cloudinary public_id from a secure URL ── */
const cloudinaryPublicId = (url) => {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
  return match ? match[1].replace(/\.[^/.]+$/, "") : null;
};

/* ════════════════════════════════════════════════════════
   GET /api/courses/:courseId/lessons/:lessonId/chat
════════════════════════════════════════════════════════ */
exports.getMessages = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;

  console.log("[getMessages] courseId:", courseId, "| lessonId:", lessonId);

  const messages = await withPopulate(
    LessonMessage.find({ course: courseId, lesson: lessonId }).sort({ createdAt: 1 })
  ).lean();

  console.log("[getMessages] found", messages.length, "messages");

  const participantCount = new Set(
    messages.map((m) => m.sender?._id?.toString()).filter(Boolean)
  ).size;

  res.status(200).json({ success: true, data: { messages, participantCount } });
});

/* ════════════════════════════════════════════════════════
   POST /api/courses/:courseId/lessons/:lessonId/chat/heartbeat
════════════════════════════════════════════════════════ */
exports.heartbeat = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { lastActive: new Date() });
  console.log("[heartbeat] updated lastActive for user:", req.user._id);
  res.status(200).json({ success: true });
});

/* ════════════════════════════════════════════════════════
   GET /api/courses/:courseId/lessons/:lessonId/chat/participants
════════════════════════════════════════════════════════ */
exports.getParticipants = asyncHandler(async (req, res) => {
  const { courseId } = req.params;

  console.log("[getParticipants] courseId:", courseId);

  const enrollments = await Enrollment.find({ course: courseId, isActive: true })
    .select("student")
    .lean();

  const enrolledCount = enrollments.length;
  const studentIds    = enrollments.map((e) => e.student);

  console.log("[getParticipants] enrolledCount:", enrolledCount);

  const students = await User.find({ _id: { $in: studentIds }, isActive: true })
    .select("name avatar role lastActive")
    .lean();

  const course = await Course.findById(courseId).select("instructor").lean();

  const staffFromMessages = await LessonMessage.distinct("sender", { course: courseId });

  const allStaffIds = [
    ...new Set(
      [course?.instructor?.toString(), ...staffFromMessages.map(String)].filter(Boolean)
    ),
  ];

  const studentIdSet = new Set(studentIds.map(String));
  const staffOnlyIds = allStaffIds.filter((id) => !studentIdSet.has(id));

  const staffUsers = await User.find({
    _id:  { $in: staffOnlyIds },
    role: { $in: ["admin", "instructor"] },
    isActive: true,
  })
    .select("name avatar role lastActive")
    .lean();

  console.log("[getParticipants] staff count:", staffUsers.length, "| student count:", students.length);

  const participants = [...staffUsers, ...students].map((u) => ({
    _id:        u._id,
    name:       u.name,
    role:       u.role,
    avatar:     u.avatar,
    lastActive: u.lastActive || null,
  }));

  res.status(200).json({ success: true, data: { enrolledCount, participants } });
});

/* ════════════════════════════════════════════════════════
   POST /api/courses/:courseId/lessons/:lessonId/chat
════════════════════════════════════════════════════════ */
exports.sendMessage = asyncHandler(async (req, res) => {
  const { courseId, lessonId } = req.params;
  const { content = "", replyToId } = req.body;

  console.log("[sendMessage] ─────────────────────────────────────────");
  console.log("[sendMessage] courseId:", courseId);
  console.log("[sendMessage] lessonId:", lessonId);
  console.log("[sendMessage] user._id:", req.user?._id, "| role:", req.user?.role);
  console.log("[sendMessage] content:", JSON.stringify(content));
  console.log("[sendMessage] replyToId:", replyToId);
  console.log("[sendMessage] content-type header:", req.headers["content-type"]);
  console.log("[sendMessage] req.files:", req.files);
  console.log("[sendMessage] req.files count:", req.files?.length ?? 0);

  // Log individual file info from multer
  if (req.files && req.files.length > 0) {
    req.files.forEach((f, i) => {
      console.log(`[sendMessage] file[${i}] fieldname    :`, f.fieldname);
      console.log(`[sendMessage] file[${i}] originalname :`, f.originalname);
      console.log(`[sendMessage] file[${i}] mimetype     :`, f.mimetype);
      console.log(`[sendMessage] file[${i}] size (bytes) :`, f.size);
      console.log(`[sendMessage] file[${i}] buffer exists:`, !!f.buffer);
      console.log(`[sendMessage] file[${i}] buffer length:`, f.buffer?.length ?? "N/A");
    });
  } else {
    console.warn("[sendMessage] ⚠ No files found in req.files — multer may not have parsed them.");
    console.warn("[sendMessage] ⚠ Make sure the frontend is NOT setting Content-Type manually.");
    console.warn("[sendMessage] ⚠ FormData field name must be 'files' to match multer .array('files', 5).");
  }

  const trimmed  = content.trim();
  const hasFiles = req.files?.length > 0;

  console.log("[sendMessage] trimmed content:", JSON.stringify(trimmed));
  console.log("[sendMessage] hasFiles:", hasFiles);

  if (!trimmed && !hasFiles) {
    console.warn("[sendMessage] ✗ Rejected — empty content and no files");
    res.status(400);
    throw new Error("Message cannot be empty.");
  }

  await User.findByIdAndUpdate(req.user._id, { lastActive: new Date() });
  console.log("[sendMessage] ✓ lastActive updated");

  const filesMeta = [];

  for (const [i, file] of (req.files ?? []).entries()) {
    console.log(`[sendMessage] ── Uploading file [${i}] ───────────────────`);
    console.log(`[sendMessage]   originalname     :`, file.originalname);
    console.log(`[sendMessage]   mimetype         :`, file.mimetype);
    console.log(`[sendMessage]   size (bytes)     :`, file.size);
    console.log(`[sendMessage]   buffer length    :`, file.buffer?.length ?? "N/A");

    const isImage = ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.mimetype);
    const isVideo = ["video/mp4"].includes(file.mimetype);
    const uploadResourceType = isImage ? "image" : isVideo ? "video" : "raw";

    const ext      = file.originalname.split(".").pop().toLowerCase();
    const baseName = file.originalname
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const publicId = `${Date.now()}-${baseName}.${ext}`;
    const folder   = `lesson-chat/${courseId}/${lessonId}`;

    console.log(`[sendMessage]   isImage          :`, isImage);
    console.log(`[sendMessage]   isVideo          :`, isVideo);
    console.log(`[sendMessage]   uploadResourceType:`, uploadResourceType);
    console.log(`[sendMessage]   ext              :`, ext);
    console.log(`[sendMessage]   baseName         :`, baseName);
    console.log(`[sendMessage]   publicId         :`, publicId);
    console.log(`[sendMessage]   folder           :`, folder);
    console.log(`[sendMessage]   Sending to Cloudinary…`);

    try {
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

      console.log(`[sendMessage]   dataUri prefix   :`, dataUri.slice(0, 60));

      const result = await getCloudinary().uploader.upload(dataUri, {
        resource_type: uploadResourceType,
        type:          "upload",
        folder,
        public_id:     publicId,
        use_filename:  false,
      });

      console.log(`[sendMessage] ✓ Cloudinary upload OK [${i}]`);
      console.log(`[sendMessage]   secure_url        :`, result.secure_url);
      console.log(`[sendMessage]   public_id (result):`, result.public_id);
      console.log(`[sendMessage]   resource_type     :`, result.resource_type);
      console.log(`[sendMessage]   format            :`, result.format);
      console.log(`[sendMessage]   bytes             :`, result.bytes);

      filesMeta.push({
        name:         file.originalname,
        url:          result.secure_url,
        size:         file.size,
        resourceType: uploadResourceType,
      });

    } catch (uploadErr) {
      console.error(`[sendMessage] ✗ Cloudinary upload FAILED [${i}]`);
      console.error(`[sendMessage]   error.message :`, uploadErr.message);
      console.error(`[sendMessage]   error.http_code:`, uploadErr.http_code);
      console.error(`[sendMessage]   full error    :`, JSON.stringify(uploadErr, null, 2));
      throw uploadErr; // bubble up so asyncHandler returns 500
    }
  }

  console.log("[sendMessage] filesMeta to save in DB:", JSON.stringify(filesMeta, null, 2));

  let validReplyTo = null;
  if (replyToId) {
    const parent = await LessonMessage.findOne({
      _id:    replyToId,
      course: courseId,
      lesson: lessonId,
    });
    console.log("[sendMessage] replyTo lookup:", parent ? parent._id : "not found");
    if (parent) validReplyTo = parent._id;
  }

  console.log("[sendMessage] Creating LessonMessage in DB…");

  const msg = await LessonMessage.create({
    course:  courseId,
    lesson:  lessonId,
    sender:  req.user._id,
    content: trimmed,
    files:   filesMeta,
    replyTo: validReplyTo,
  });

  console.log("[sendMessage] ✓ Message created, _id:", msg._id);
  console.log("[sendMessage] files saved to DB:", JSON.stringify(msg.files, null, 2));

  const populated = await withPopulate(LessonMessage.findById(msg._id));
  console.log("[sendMessage] ✓ Sending 201 response");

  res.status(201).json({ success: true, data: { message: populated } });
});

/* ════════════════════════════════════════════════════════
   PATCH /api/courses/:courseId/lessons/:lessonId/chat/:msgId/resolve
════════════════════════════════════════════════════════ */
exports.resolveMessage = asyncHandler(async (req, res) => {
  const { courseId, lessonId, msgId } = req.params;

  console.log("[resolveMessage] msgId:", msgId);

  const msg = await LessonMessage.findOneAndUpdate(
    { _id: msgId, course: courseId, lesson: lessonId },
    { resolved: true },
    { new: true }
  );

  if (!msg) {
    console.warn("[resolveMessage] ✗ Message not found:", msgId);
    res.status(404);
    throw new Error("Message not found.");
  }

  console.log("[resolveMessage] ✓ Resolved:", msgId);
  res.status(200).json({ success: true, data: { message: msg } });
});

/* ════════════════════════════════════════════════════════
   DELETE /api/courses/:courseId/lessons/:lessonId/chat/:msgId
════════════════════════════════════════════════════════ */
exports.deleteMessage = asyncHandler(async (req, res) => {
  const { courseId, lessonId, msgId } = req.params;

  console.log("[deleteMessage] msgId:", msgId, "| user:", req.user._id);

  const msg = await LessonMessage.findOne({ _id: msgId, course: courseId, lesson: lessonId });
  if (!msg) {
    console.warn("[deleteMessage] ✗ Message not found:", msgId);
    res.status(404);
    throw new Error("Message not found.");
  }

  const isSender = msg.sender.toString() === req.user._id.toString();
  const isStaff  = ["admin", "instructor"].includes(req.user.role);

  console.log("[deleteMessage] isSender:", isSender, "| isStaff:", isStaff);

  if (!isSender && !isStaff) {
    console.warn("[deleteMessage] ✗ Forbidden — user not allowed to delete this message");
    res.status(403);
    throw new Error("Not allowed to delete this message.");
  }

  for (const [i, f] of (msg.files ?? []).entries()) {
    const publicId     = cloudinaryPublicId(f.url);
    const resourceType = f.resourceType || "raw";
    console.log(`[deleteMessage] Deleting file [${i}] publicId:`, publicId, "| resourceType:", resourceType);
    if (publicId) {
      try {
        await getCloudinary().uploader.destroy(publicId, { resource_type: resourceType });
        console.log(`[deleteMessage] ✓ Cloudinary file deleted [${i}]`);
      } catch (e) {
        console.warn(`[deleteMessage] ⚠ Cloudinary delete failed [${i}]:`, f.url, e.message);
      }
    }
  }

  await msg.deleteOne();
  console.log("[deleteMessage] ✓ Message deleted:", msgId);
  res.status(200).json({ success: true, data: {} });
});

/* ════════════════════════════════════════════════════════
   GET /api/courses/:courseId/lessons/:lessonId/chat/download/:msgId/:fileIndex
════════════════════════════════════════════════════════ */
exports.downloadFile = asyncHandler(async (req, res) => {
  const { courseId, lessonId, msgId, fileIndex } = req.params;

  console.log("[downloadFile] ─────────────────────────────────────────");
  console.log("[downloadFile] msgId:", msgId, "| fileIndex:", fileIndex);
  console.log("[downloadFile] user:", req.user._id);

  const msg = await LessonMessage.findOne({ _id: msgId, course: courseId, lesson: lessonId });

  if (!msg) {
    console.warn("[downloadFile] ✗ Message not found:", msgId);
    res.status(404);
    throw new Error("Message not found.");
  }

  const idx  = parseInt(fileIndex, 10);
  const file = msg.files?.[idx];

  if (!file) {
    console.warn("[downloadFile] ✗ File not found at index:", idx, "| files count:", msg.files?.length);
    res.status(404);
    throw new Error("File not found.");
  }

  console.log("[downloadFile] file.name        :", file.name);
  console.log("[downloadFile] file.url         :", file.url);
  console.log("[downloadFile] file.resourceType:", file.resourceType);
  console.log("[downloadFile] file.size        :", file.size);

  const https = require("https");
  const http  = require("http");
  const cld   = getCloudinary();

  const resourceType =
    file.resourceType ||
    (file.url.includes("/video/") ? "video"
     : file.url.includes("/raw/") ? "raw"
     : "image");

  const rawPublicId = cloudinaryPublicId(file.url);
  console.log("[downloadFile] rawPublicId (extracted):", rawPublicId);

  const publicIdForDownload =
    resourceType === "raw"
      ? (() => {
          const ext = file.url.split("?")[0].split(".").pop();
          const full = ext ? `${rawPublicId}.${ext}` : rawPublicId;
          console.log("[downloadFile] raw ext:", ext, "| publicIdForDownload:", full);
          return full;
        })()
      : rawPublicId;

  console.log("[downloadFile] resourceType         :", resourceType);
  console.log("[downloadFile] publicIdForDownload  :", publicIdForDownload);

  const signedUrl = cld.utils.private_download_url(publicIdForDownload, "", {
    resource_type: resourceType,
    type:          "upload",
    expires_at:    Math.floor(Date.now() / 1000) + 300,
    attachment:    file.name,
  });

  console.log("[downloadFile] signedUrl:", signedUrl);

  const proto = signedUrl.startsWith("https") ? https : http;

  proto.get(signedUrl, (cloudRes) => {
    console.log("[downloadFile] Cloudinary response status:", cloudRes.statusCode);
    console.log("[downloadFile] Cloudinary response headers:", cloudRes.headers);

    if (cloudRes.statusCode !== 200) {
      console.error("[downloadFile] ✗ Non-200 from Cloudinary:", cloudRes.statusCode);
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          message: `Storage returned ${cloudRes.statusCode}`,
        });
      }
      cloudRes.resume();
      return;
    }

    const safeName = encodeURIComponent(file.name);
    res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${safeName}`);
    res.setHeader("Content-Type", cloudRes.headers["content-type"] || "application/octet-stream");
    if (cloudRes.headers["content-length"]) {
      res.setHeader("Content-Length", cloudRes.headers["content-length"]);
    }

    console.log("[downloadFile] ✓ Piping file to client:", file.name);
    cloudRes.pipe(res);

  }).on("error", (err) => {
    console.error("[downloadFile] ✗ HTTPS request error:", err.message);
    if (!res.headersSent) {
      res.status(502).json({ success: false, message: "File download failed." });
    }
  });
});