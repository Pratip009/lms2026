const asyncHandler = require("express-async-handler");
const BhiClass = require("../../models/bhi/BhiClass");
const BhiEnrollment = require("../../models/bhi/BhiEnrollment");

/**
 * Ensures the requesting teacher owns the class in question. Admins bypass.
 * Looks for the class id in params, body, or query (routes vary: some pass
 * classId as a route param, some as a query string, some in the POST body).
 */
const requireOwnClassOrAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin") return next();

  if (req.user.role !== "teacher") {
    res.status(403);
    throw new Error("Access denied. Teacher or admin only.");
  }

  const classId = req.params.classId || req.body.class || req.query.classId;
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

/**
 * Ensures a teacher may only view a student who is (or was) enrolled in one
 * of their own classes. Admins bypass. Expects req.params.studentId or
 * req.params.id.
 */
const requireOwnStudentOrAdmin = asyncHandler(async (req, res, next) => {
  if (req.user.role === "admin") return next();

  if (req.user.role !== "teacher") {
    res.status(403);
    throw new Error("Access denied. Teacher or admin only.");
  }

  const studentId = req.params.studentId || req.params.id;
  if (!studentId) {
    res.status(400);
    throw new Error("Student ID is required.");
  }

  const teacherClassIds = (
    await BhiClass.find({ teacher: req.user._id }).select("_id").lean()
  ).map((c) => String(c._id));

  const enrollment = await BhiEnrollment.findOne({
    student: studentId,
    class: { $in: teacherClassIds },
  }).lean();

  if (!enrollment) {
    res.status(403);
    throw new Error("You are not assigned to this student.");
  }

  next();
});

/** Returns the list of BhiClass ObjectIds this teacher teaches (admins: null = no restriction). */
async function getOwnClassIdsOrNull(user) {
  if (user.role === "admin") return null;
  const classes = await BhiClass.find({ teacher: user._id }).select("_id").lean();
  return classes.map((c) => c._id);
}

module.exports = { requireOwnClassOrAdmin, requireOwnStudentOrAdmin, getOwnClassIdsOrNull };