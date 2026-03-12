const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Course thumbnail storage ─────────────────────────────
const thumbnailStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "lms/thumbnails",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1280, height: 720, crop: "fill", quality: "auto" }],
  },
});

// ─── Avatar storage ───────────────────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "lms/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 200, height: 200, crop: "fill", quality: "auto" }],
  },
});

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"), false);
  },
});

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};

module.exports = { cloudinary, uploadThumbnail, uploadAvatar, deleteFromCloudinary };
