const asyncHandler = require("express-async-handler");
const BhiClass = require("../../models/bhi/BhiClass");

/**
 * Ensures the requesting teacher owns the class in question. Admins bypass.
 * Expects req.params.classId or req.body.class.
 */
const requireOwnClassOrAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin") return next();

  if (req.user.role !== "teacher") {
    res.status(403);
    throw new Error("Access denied. Teacher or admin only.");
  }

  const classId = req.params.classId || req.body.class;
  if (!classId) {
    res.status(400);
    throw new Error("Class ID is required.");
  }

  const bhiClass = await BhiClass.findById(classId).select("teacher").lean();
  if (!bhiClass) {
    res.status(404);
    throw new Error("Class not found.");
  }

  if (String(bhiClass.teacher) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You are not assigned to this class.");
  }

  next();
});

module.exports = { requireOwnClassOrAdmin };
