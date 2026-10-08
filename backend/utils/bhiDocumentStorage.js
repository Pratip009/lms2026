const multer = require("multer");
const { cloudinary } = require("../config/cloudinary");

/**
 * Enrollment documents (IDs, Social Security cards, resumes) are sensitive,
 * so they are uploaded to Cloudinary as `type: "private"` assets. Private
 * assets cannot be fetched by URL guessing — admins get a short-lived signed
 * download URL from getSignedUrl().
 */

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

const uploadDocumentMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED[file.mimetype]) return cb(null, true);
    const err = new Error("Upload a PDF, JPG, PNG, HEIC, or Word document.");
    err.statusCode = 400;
    cb(err, false);
  },
});

/** Wraps multer so its errors come back as clean 400 JSON instead of 500s. */
const singleDocument = (field = "file") => (req, res, next) =>
  uploadDocumentMemory.single(field)(req, res, (err) => {
    if (!err) return next();
    res.status(400);
    if (err.code === "LIMIT_FILE_SIZE") return next(new Error("That file is larger than 10 MB."));
    next(err);
  });

// Word documents are stored as "raw"; images and PDFs as "image" (lets Cloudinary preview them).
const resourceTypeFor = (mime) => (mime.includes("word") ? "raw" : "image");

const uploadPrivate = (file, folder) =>
  new Promise((resolve, reject) => {
    const resource_type = resourceTypeFor(file.mimetype);
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        type: "private",
        resource_type,
        use_filename: false,
        unique_filename: true,
        // raw files need the extension in the public id to download correctly
        ...(resource_type === "raw" ? { format: ALLOWED[file.mimetype] } : {}),
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(file.buffer);
  });

const getSignedUrl = (doc, { expiresInSeconds = 300, attachment = false } = {}) =>
  cloudinary.utils.private_download_url(doc.publicId, doc.format || "", {
    resource_type: doc.resourceType || "image",
    type: "private",
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
    attachment,
  });

const deletePrivate = async (doc) => {
  try {
    await cloudinary.uploader.destroy(doc.publicId, {
      type: "private",
      resource_type: doc.resourceType || "image",
    });
  } catch (err) {
    console.error("Cloudinary private delete error:", err.message);
  }
};

/** Builds the sub-document stored on BhiApplication.documents */
const toDocumentRecord = (file, result, extra = {}) => ({
  fileName: String(file.originalname || "").slice(0, 200),
  mimeType: file.mimetype,
  size: file.size,
  publicId: result.public_id,
  resourceType: result.resource_type,
  format: result.format || ALLOWED[file.mimetype] || "",
  ...extra,
});

module.exports = { singleDocument, uploadPrivate, getSignedUrl, deletePrivate, toDocumentRecord, MAX_BYTES };
