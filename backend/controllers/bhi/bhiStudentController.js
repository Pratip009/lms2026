const asyncHandler = require("express-async-handler");
const BhiStudent = require("../../models/bhi/BhiStudent");
const BhiEnrollment = require("../../models/bhi/BhiEnrollment");
const BhiClass = require("../../models/bhi/BhiClass");
const { getOwnClassIdsOrNull } = require("../../middlewares/bhi/bhiAuth");

// POST /api/bhi/students — Add Student (admin only, §4)
// Body: student info + optional { primaryProgram: { class, startDate, expectedEndDate } }
//                    + optional { supportClass: { class, startDate, expectedEndDate } }
const createStudent = asyncHandler(async (req, res) => {
  const {
    firstName, lastName, studentId, phone, email, address,
    caseNumber, caseworker, organization, status, courseCode,
    primaryProgram, supportClass,
  } = req.body;

  if (!firstName || !lastName || !studentId) {
    res.status(400);
    throw new Error("First name, last name, and Student ID are required.");
  }

  const student = await BhiStudent.create({
    firstName, lastName, studentId, phone, email, address,
    caseNumber, caseworker, organization, status, courseCode,
    createdBy: req.user._id,
  });

  const enrollments = [];
  if (primaryProgram?.class) {
    enrollments.push(
      await BhiEnrollment.create({
        student: student._id,
        class: primaryProgram.class,
        role: "primary",
        startDate: primaryProgram.startDate,
        expectedEndDate: primaryProgram.expectedEndDate,
      })
    );
  }
  if (supportClass?.class) {
    enrollments.push(
      await BhiEnrollment.create({
        student: student._id,
        class: supportClass.class,
        role: "support",
        startDate: supportClass.startDate,
        expectedEndDate: supportClass.expectedEndDate,
      })
    );
  }

  res.status(201).json({ success: true, student, enrollments });
});

// GET /api/bhi/students — sortable/filterable list (§4)
// ?sortBy=startDate|endDate|courseCode|caseworker|status|organization&order=asc|desc
const getStudents = asyncHandler(async (req, res) => {
  const { status, organization, caseworker, search, sortBy, order } = req.query;

  const filter = { isArchived: false };
  if (status) filter.enrollmentStatus = status;
  if (organization) filter.organization = organization;
  if (caseworker) filter["caseworker.name"] = new RegExp(caseworker, "i");
  if (search) {
    filter.$or = [
      { firstName: new RegExp(search, "i") },
      { lastName: new RegExp(search, "i") },
      { studentId: new RegExp(search, "i") },
    ];
  }

  // §2: teachers only see students assigned to their own classes
  const ownClassIds = await getOwnClassIdsOrNull(req.user);
  if (ownClassIds) {
    const ownStudentIds = (
      await BhiEnrollment.find({ class: { $in: ownClassIds } }).select("student").lean()
    ).map((e) => e.student);
    filter._id = { $in: ownStudentIds };
  }

  const sortMap = {
    courseCode: "courseCode",
    caseworker: "caseworker.name",
    status: "enrollmentStatus",
    organization: "organization",
  };
  const sortField = sortMap[sortBy] || "lastName";
  const sortDir = order === "desc" ? -1 : 1;

  let query = BhiStudent.find(filter).sort({ [sortField]: sortDir });

  const students = await query;

  // startDate/endDate live on enrollments, not the student — sort in memory if requested
  if (sortBy === "startDate" || sortBy === "endDate") {
    const withEnrollments = await BhiStudent.populate(students, {
      path: "enrollments",
      match: { role: "primary" },
    });
    const field = sortBy === "startDate" ? "startDate" : "expectedEndDate";
    withEnrollments.sort((a, b) => {
      const av = a.enrollments?.[0]?.[field] || "";
      const bv = b.enrollments?.[0]?.[field] || "";
      return sortDir === 1 ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return res.json({ success: true, students: withEnrollments });
  }

  res.json({ success: true, students });
});

// GET /api/bhi/students/search?q= — by First/Last Name or Student ID (§21)
const searchStudents = asyncHandler(async (req, res) => {
  const q = req.query.q || "";
  const filter = {
    isArchived: false,
    $or: [
      { firstName: new RegExp(q, "i") },
      { lastName: new RegExp(q, "i") },
      { studentId: new RegExp(q, "i") },
    ],
  };

  // §2: teachers only see students assigned to their own classes
  const ownClassIds = await getOwnClassIdsOrNull(req.user);
  if (ownClassIds) {
    const ownStudentIds = (
      await BhiEnrollment.find({ class: { $in: ownClassIds } }).select("student").lean()
    ).map((e) => e.student);
    filter._id = { $in: ownStudentIds };
  }

  const students = await BhiStudent.find(filter)
    .limit(20)
    .populate({ path: "enrollments", populate: { path: "class", populate: "program" } });

  res.json({ success: true, students });
});

// GET /api/bhi/students/:id — full profile (detailed logic in bhiAttendanceController.getStudentProfile)
// Access-scoped by the requireOwnStudentOrAdmin middleware on the route.
const getStudentBasic = asyncHandler(async (req, res) => {
  const student = await BhiStudent.findById(req.params.id).populate({
    path: "enrollments",
    populate: { path: "class", populate: "program" },
  });
  if (!student) {
    res.status(404);
    throw new Error("Student not found.");
  }
  res.json({ success: true, student });
});

// PATCH /api/bhi/students/:id — update enrollment info (admin only)
const updateStudent = asyncHandler(async (req, res) => {
  const student = await BhiStudent.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!student) {
    res.status(404);
    throw new Error("Student not found.");
  }
  res.json({ success: true, student });
});

// PATCH /api/bhi/students/:id/status — Active/Completed/Withdrawn/Transferred/Terminated (§14, §24)
// Never hard-deletes; attendance history is preserved forever.
const changeStudentStatus = asyncHandler(async (req, res) => {
  const { status, actualEndDate } = req.body;
  const valid = ["Active", "Completed", "Withdrawn", "Transferred", "Terminated"];
  if (!valid.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${valid.join(", ")}`);
  }

  const student = await BhiStudent.findByIdAndUpdate(
    req.params.id,
    { enrollmentStatus: status },
    { new: true }
  );
  if (!student) {
    res.status(404);
    throw new Error("Student not found.");
  }

  // Close out active enrollments so attendance stops auto-generating (§5)
  if (status !== "Active") {
    await BhiEnrollment.updateMany(
      { student: student._id, status: "Active" },
      { status, actualEndDate: actualEndDate || new Date().toISOString().slice(0, 10) }
    );
  }

  res.json({ success: true, student });
});

// POST /api/bhi/students/:id/transfer — move student to a different class (admin only, §3)
const transferStudent = asyncHandler(async (req, res) => {
  const { fromEnrollmentId, toClass, startDate, expectedEndDate } = req.body;

  const oldEnrollment = await BhiEnrollment.findById(fromEnrollmentId);
  if (!oldEnrollment || String(oldEnrollment.student) !== req.params.id) {
    res.status(404);
    throw new Error("Existing enrollment not found for this student.");
  }

  oldEnrollment.status = "Transferred";
  oldEnrollment.actualEndDate = new Date().toISOString().slice(0, 10);
  await oldEnrollment.save();

  const newClass = await BhiClass.findById(toClass);
  if (!newClass) {
    res.status(404);
    throw new Error("Target class not found.");
  }

  const newEnrollment = await BhiEnrollment.create({
    student: req.params.id,
    class: toClass,
    role: oldEnrollment.role,
    startDate,
    expectedEndDate,
  });

  res.json({ success: true, oldEnrollment, newEnrollment });
});

module.exports = {
  createStudent,
  getStudents,
  searchStudents,
  getStudentBasic,
  updateStudent,
  changeStudentStatus,
  transferStudent,
};