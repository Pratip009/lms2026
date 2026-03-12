const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const { uploadAvatar } = require("../config/cloudinary");
const { deleteFromCloudinary } = require("../config/cloudinary");
const { successResponse } = require("../utils/response");

// ─── @desc    Get user profile
// ─── @route   GET /api/users/profile
// ─── @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("enrolledCoursesCount")
    .lean();

  return successResponse(res, { user });
});

// ─── @desc    Upload/update avatar
// ─── @route   POST /api/users/avatar
// ─── @access  Private
const uploadUserAvatar = [
  uploadAvatar.single("avatar"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      res.status(400);
      throw new Error("No image file provided.");
    }

    // Remove old avatar from Cloudinary
    const user = await User.findById(req.user._id);
    if (user.avatar?.publicId) {
      await deleteFromCloudinary(user.avatar.publicId);
    }

    user.avatar = {
      url: req.file.path,
      publicId: req.file.filename,
    };
    await user.save({ validateBeforeSave: false });

    return successResponse(res, { avatar: user.avatar }, "Avatar updated");
  }),
];

module.exports = { getProfile, uploadUserAvatar };
