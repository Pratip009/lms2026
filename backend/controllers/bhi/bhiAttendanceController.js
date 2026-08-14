const asyncHandler = require("express-async-handler");
const BhiClass = require("../../models/bhi/BhiClass");
const BhiStudent = require("../../models/bhi/BhiStudent");
const BhiEnrollment = require("../../models/bhi/BhiEnrollment");
const BhiAttendanceRecord = require("../../models/bhi/BhiAttendanceRecord");
const BhiDailyInstructionalRecord = require("../../models/bhi/BhiDailyInstructionalRecord");
const BhiAttendanceAudit = require("../../models/bhi/BhiAttendanceAudit");
const BhiColorConfig = require("../../models/bhi/BhiColorConfig");
const { isWeekend, loadNonInstructionalDates } = require("../../utils/bhiCalendar");
const { getOwnClassIdsOrNull } = require("../../middlewares/bhi/bhiAuth");
const {
  getClassAttendanceSummary,
  getProgramProgress,
  calculateColor,
} = require("../../utils/bhiAttendanceEngine");

// ─────────────────────────────────────────────────────────
// §6-7: Teacher flow — Class → Date → Roster, ready to mark
// GET /api/bhi/attendance/roster?classId=&date=
// ─────────────────────────────────────────────────────────
const getRosterForDate = asyncHandler(async (req, res) => {
  const { classId, date } = req.query;
  if (!classId || !date) {
    res.status(400);
    throw new Error("classId and date are required.");
  }

  // Only students whose enrollment window covers this date (§5)
  const enrollments = await BhiEnrollment.find({
    class: classId,
    startDate: { $lte: date },
    $or: [{ actualEndDate: null }, { actualEndDate: { $gte: date } }],
  }).populate("student", "firstName lastName studentId enrollmentStatus");

  const existing = await BhiAttendanceRecord.find({ class: classId, date }).lean();
  const existingByStudent = Object.fromEntries(existing.map((r) => [String(r.student), r]));

  const dailyRecord = await BhiDailyInstructionalRecord.findOne({ class: classId, date });

  const roster = enrollments
    .filter((e) => e.student && e.student.enrollmentStatus !== "Withdrawn")
    .map((e) => ({
      enrollmentId: e._id,
      student: e.student,
      existingMark: existingByStudent[String(e.student._id)] || null,
    }));

  res.json({ success: true, roster, dailyRecord, isSubmitted: dailyRecord?.isSubmitted || false });
});

// ─────────────────────────────────────────────────────────
// §28-34: Submit attendance for a class+date. Hard-gated on lesson field.
// POST /api/bhi/attendance/submit
// Body: { class, date, lessonTopic, activitiesCompleted, assignmentsMaterials,
//         additionalNotes, marks: [{ student, status, note, attachment }] }
// ─────────────────────────────────────────────────────────
const submitAttendance = asyncHandler(async (req, res) => {
  const {
    class: classId, date, lessonTopic,
    activitiesCompleted, assignmentsMaterials, additionalNotes, marks,
  } = req.body;

  if (!classId || !date) {
    res.status(400);
    throw new Error("class and date are required.");
  }

  // ─── Hard gate (§30-31) ───────────────────────────────
  if (!lessonTopic || !lessonTopic.trim()) {
    res.status(400);
    throw new Error(
      "Please enter today's lesson or main instructional topic before submitting attendance."
    );
  }

  if (!Array.isArray(marks) || marks.length === 0) {
    res.status(400);
    throw new Error("At least one attendance mark is required.");
  }

  const validStatuses = ["Present", "Absent", "Excused", "Late", "Makeup"];
  for (const m of marks) {
    if (!validStatuses.includes(m.status)) {
      res.status(400);
      throw new Error(`Invalid attendance status: ${m.status}`);
    }
  }

  // ─── Server-side calendar validation (§5-6) ────────────
  // Don't trust the client: re-check the date isn't a weekend/holiday, and
  // that every student being marked actually has an active enrollment in
  // this class covering this date. Admins may override the weekend/holiday
  // check (e.g. backfilling a genuinely-taught makeup Saturday) by passing
  // allowNonInstructionalDay: true.
  const holidaySet = await loadNonInstructionalDates(date, date);
  if ((isWeekend(date) || holidaySet.has(date)) && !(req.user.role === "admin" && req.body.allowNonInstructionalDay)) {
    res.status(400);
    throw new Error("This date is a weekend or a non-instructional day on the school calendar.");
  }

  const studentIds = marks.map((m) => m.student);
  const enrollments = await BhiEnrollment.find({
    class: classId,
    student: { $in: studentIds },
    startDate: { $lte: date },
    $or: [{ actualEndDate: null }, { actualEndDate: { $gte: date } }],
  }).select("student");
  const enrolledSet = new Set(enrollments.map((e) => String(e.student)));

  const outOfWindow = studentIds.filter((sId) => !enrolledSet.has(String(sId)));
  if (outOfWindow.length > 0) {
    res.status(400);
    throw new Error(
      `${outOfWindow.length} student(s) are not enrolled in this class on ${date} (before start date, after end date, or not enrolled). Remove them from the roster or correct their enrollment dates.`
    );
  }

  // ─── Upsert the Daily Instructional Record (§29, §33) ──
  let dailyRecord = await BhiDailyInstructionalRecord.findOne({ class: classId, date });
  if (dailyRecord) {
    dailyRecord.lessonTopic = lessonTopic;
    dailyRecord.activitiesCompleted = activitiesCompleted || "";
    dailyRecord.assignmentsMaterials = assignmentsMaterials || "";
    dailyRecord.additionalNotes = additionalNotes || "";
    dailyRecord.isSubmitted = true;
    dailyRecord.submittedAt = new Date();
    await dailyRecord.save();
  } else {
    dailyRecord = await BhiDailyInstructionalRecord.create({
      class: classId,
      date,
      teacher: req.user._id,
      lessonTopic,
      activitiesCompleted,
      assignmentsMaterials,
      additionalNotes,
      isSubmitted: true,
      submittedAt: new Date(),
    });
  }

  // ─── Upsert each student's attendance mark (§7-8) ──────
  const results = [];
  for (const mark of marks) {
    const record = await BhiAttendanceRecord.findOneAndUpdate(
      { student: mark.student, class: classId, date },
      {
        student: mark.student,
        class: classId,
        date,
        dailyRecord: dailyRecord._id,
        status: mark.status,
        note: mark.note || "",
        attachment: mark.attachment || {},
        markedBy: req.user._id,
      },
      { upsert: true, new: true, runValidators: true }
    );
    results.push(record);
  }

  res.status(201).json({ success: true, dailyRecord, marks: results });
});

// ─────────────────────────────────────────────────────────
// §12-17, §4: Admin correction of a single attendance record, fully audited
// PATCH /api/bhi/attendance/:recordId/correct
// ─────────────────────────────────────────────────────────
const correctAttendance = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const record = await BhiAttendanceRecord.findById(req.params.recordId);
  if (!record) {
    res.status(404);
    throw new Error("Attendance record not found.");
  }

  const originalStatus = record.status;
  if (originalStatus === status) {
    return res.json({ success: true, record, message: "No change." });
  }

  record.status = status;
  record.markedBy = req.user._id;
  await record.save();

  await BhiAttendanceAudit.create({
    attendanceRecord: record._id,
    student: record.student,
    class: record.class,
    originalStatus,
    newStatus: status,
    changedBy: req.user._id,
    reason: reason || "",
  });

  res.json({ success: true, record });
});

// GET /api/bhi/attendance/:recordId/audit-history
const getAuditHistory = asyncHandler(async (req, res) => {
  const audits = await BhiAttendanceAudit.find({ attendanceRecord: req.params.recordId })
    .populate("changedBy", "name email")
    .sort({ createdAt: -1 });
  res.json({ success: true, audits });
});

// ─────────────────────────────────────────────────────────
// §10: Attendance Overview — three color lists (admin)
// GET /api/bhi/attendance/overview
// ─────────────────────────────────────────────────────────
const getOverviewLists = asyncHandler(async (req, res) => {
  const students = await BhiStudent.find({ enrollmentStatus: "Active", isArchived: false })
    .populate({
      path: "enrollments",
      match: { role: "primary", status: "Active" },
      populate: { path: "class", populate: ["program", "teacher"] },
    })
    .sort({ lastName: 1, firstName: 1 });

  const lists = { Green: [], Orange: [], Red: [] };

  for (const student of students) {
    const primaryEnrollment = student.enrollments?.[0];
    if (!primaryEnrollment) continue;

    const summary = await getClassAttendanceSummary(student._id, primaryEnrollment.class._id);
    const color = student.colorOverride || summary.color;

    lists[color].push({
      studentId: student._id,
      lastName: student.lastName,
      firstName: student.firstName,
      program: primaryEnrollment.class.program?.name,
      teacher: primaryEnrollment.class.teacher?.name,
      attendancePercent: summary.attendancePercent,
      consecutiveUnexcused: summary.consecutiveUnexcused,
      currentStatus: student.enrollmentStatus,
      isOverridden: !!student.colorOverride,
    });
  }

  res.json({ success: true, lists });
});

// ─────────────────────────────────────────────────────────
// §11: Main dashboard — header stats + filters
// GET /api/bhi/attendance/dashboard
// ─────────────────────────────────────────────────────────
const getDashboard = asyncHandler(async (req, res) => {
  const { program, class: classId, teacher, status, dateFrom, dateTo } = req.query;

  const studentFilter = { isArchived: false };
  if (status) studentFilter.enrollmentStatus = status;
  else studentFilter.enrollmentStatus = "Active";

  let students = await BhiStudent.find(studentFilter).populate({
    path: "enrollments",
    match: { role: "primary" },
    populate: { path: "class", populate: ["program", "teacher"] },
  });

  if (program || classId || teacher) {
    students = students.filter((s) => {
      const e = s.enrollments?.[0];
      if (!e) return false;
      if (classId && String(e.class._id) !== classId) return false;
      if (program && String(e.class.program?._id) !== program) return false;
      if (teacher && String(e.class.teacher?._id) !== teacher) return false;
      return true;
    });
  }

  const counts = { Green: 0, Orange: 0, Red: 0 };
  for (const student of students) {
    const e = student.enrollments?.[0];
    if (!e) continue;
    const summary = await getClassAttendanceSummary(student._id, e.class._id);
    const color = student.colorOverride || summary.color;
    counts[color] += 1;
  }

  res.json({
    success: true,
    totalActiveStudents: students.length,
    counts,
  });
});

// ─────────────────────────────────────────────────────────
// §11, §35: Manual color/status override
// PATCH /api/bhi/attendance/students/:studentId/override
// ─────────────────────────────────────────────────────────
const overrideStudentColor = asyncHandler(async (req, res) => {
  const { color, reason } = req.body;
  if (color !== null && !["Green", "Orange", "Red"].includes(color)) {
    res.status(400);
    throw new Error("color must be Green, Orange, Red, or null to clear the override.");
  }

  const student = await BhiStudent.findByIdAndUpdate(
    req.params.studentId,
    { colorOverride: color, colorOverrideReason: reason || "", colorOverrideBy: req.user._id },
    { new: true }
  );
  if (!student) {
    res.status(404);
    throw new Error("Student not found.");
  }
  res.json({ success: true, student });
});

// ─────────────────────────────────────────────────────────
// §12-17: Full student profile
// GET /api/bhi/attendance/students/:studentId/profile
// ─────────────────────────────────────────────────────────
const getStudentProfile = asyncHandler(async (req, res) => {
  const student = await BhiStudent.findById(req.params.studentId).populate({
    path: "enrollments",
    populate: { path: "class", populate: ["program", "teacher"] },
  });
  if (!student) {
    res.status(404);
    throw new Error("Student not found.");
  }

  const perClassBreakdown = [];
  let overallColor = "Green";
  let primaryProgressBlock = null;

  for (const enrollment of student.enrollments) {
    const summary = await getClassAttendanceSummary(student._id, enrollment.class._id);
    perClassBreakdown.push({
      enrollmentId: enrollment._id,
      classId: enrollment.class._id,
      programName: enrollment.class.program?.name,
      role: enrollment.role,
      teacher: enrollment.class.teacher?.name,
      status: enrollment.status,
      ...summary,
    });

    if (enrollment.role === "primary") {
      if (["Orange", "Red"].includes(summary.color)) overallColor = summary.color;
      primaryProgressBlock = await getProgramProgress(enrollment.startDate, enrollment.expectedEndDate);
      primaryProgressBlock.attendancePercent = summary.attendancePercent;
      primaryProgressBlock.attendanceColor = summary.color;
    }
  }

  const effectiveColor = student.colorOverride || overallColor;

  const attendanceHistory = await BhiAttendanceRecord.find({ student: student._id })
    .populate("class", "sectionName")
    .populate({ path: "class", populate: "program" })
    .sort({ date: -1 });

  res.json({
    success: true,
    student,
    effectiveColor,
    programProgress: primaryProgressBlock,
    perClassBreakdown,
    attendanceHistory,
  });
});

// ─────────────────────────────────────────────────────────
// §18: Alerts — students at Orange (2) or Red (3+) consecutive unexcused absences
// GET /api/bhi/attendance/alerts
// ─────────────────────────────────────────────────────────
const getAlerts = asyncHandler(async (req, res) => {
  // §2: a teacher only sees alerts for students in classes they teach
  const ownClassIds = req.user.role === "teacher" ? await getOwnClassIdsOrNull(req.user) : null;
  const overview = await getOverviewListsInternal(ownClassIds);
  res.json({
    success: true,
    concernCount: overview.Orange.length,
    criticalCount: overview.Red.length,
    concern: overview.Orange,
    critical: overview.Red,
  });
});

// internal helper reused by getOverviewLists/getAlerts
// ownClassIds: null = no restriction (admin); array = restrict to these classes (teacher, §2)
async function getOverviewListsInternal(ownClassIds = null) {
  const students = await BhiStudent.find({ enrollmentStatus: "Active", isArchived: false }).populate({
    path: "enrollments",
    match: { role: "primary", status: "Active" },
    populate: { path: "class", populate: ["program", "teacher"] },
  });

  const ownClassIdSet = ownClassIds ? new Set(ownClassIds.map(String)) : null;

  const lists = { Green: [], Orange: [], Red: [] };
  for (const student of students) {
    const primaryEnrollment = student.enrollments?.[0];
    if (!primaryEnrollment) continue;
    if (ownClassIdSet && !ownClassIdSet.has(String(primaryEnrollment.class._id))) continue;
    const summary = await getClassAttendanceSummary(student._id, primaryEnrollment.class._id);
    const color = student.colorOverride || summary.color;
    lists[color].push({
      studentId: student._id,
      name: `${student.lastName}, ${student.firstName}`,
      program: primaryEnrollment.class.program?.name,
      teacher: primaryEnrollment.class.teacher?.name,
      consecutiveUnexcused: summary.consecutiveUnexcused,
    });
  }
  return lists;
}

// ─────────────────────────────────────────────────────────
// §35: Per-class color breakdown (e.g. Medical Assistant — 🟢18 🟠3 🔴2)
// GET /api/bhi/attendance/class-breakdown
// ─────────────────────────────────────────────────────────
const getClassColorBreakdown = asyncHandler(async (req, res) => {
  const classes = await BhiClass.find({ isActive: true }).populate("program", "name");

  const breakdown = [];
  for (const bhiClass of classes) {
    const enrollments = await BhiEnrollment.find({ class: bhiClass._id, status: "Active" }).populate(
      "student",
      "colorOverride enrollmentStatus"
    );

    const counts = { Green: 0, Orange: 0, Red: 0 };
    for (const e of enrollments) {
      if (!e.student || e.student.enrollmentStatus !== "Active") continue;
      const summary = await getClassAttendanceSummary(e.student._id, bhiClass._id);
      const color = e.student.colorOverride || summary.color;
      counts[color] += 1;
    }

    breakdown.push({
      classId: bhiClass._id,
      programName: bhiClass.program?.name,
      sectionName: bhiClass.sectionName,
      counts,
    });
  }

  res.json({ success: true, breakdown });
});

// ─────────────────────────────────────────────────────────
// §33: Lesson history per class
// GET /api/bhi/attendance/lesson-history?classId=
// ─────────────────────────────────────────────────────────
const getLessonHistory = asyncHandler(async (req, res) => {
  const { classId } = req.query;
  const records = await BhiDailyInstructionalRecord.find({ class: classId, isSubmitted: true })
    .populate("teacher", "name")
    .sort({ date: -1 });
  res.json({ success: true, records });
});

// GET /api/bhi/attendance/lesson-history/:dailyRecordId — full day detail
// GET /api/bhi/attendance/lesson-history/:dailyRecordId — full day detail
const getLessonDayDetail = asyncHandler(async (req, res) => {
  const dailyRecord = await BhiDailyInstructionalRecord.findById(req.params.dailyRecordId).populate(
    "teacher",
    "name"
  );
  if (!dailyRecord) {
    res.status(404);
    throw new Error("Daily instructional record not found.");
  }

  // §2: a teacher may only view lesson detail for a class they teach
  if (req.user.role === "teacher") {
    const bhiClass = await BhiClass.findById(dailyRecord.class).select("teacher").lean();
    if (!bhiClass || String(bhiClass.teacher) !== String(req.user._id)) {
      res.status(403);
      throw new Error("You are not assigned to this class.");
    }
  }

  const marks = await BhiAttendanceRecord.find({ dailyRecord: dailyRecord._id }).populate(
    "student",
    "firstName lastName studentId"
  );
  res.json({ success: true, dailyRecord, marks });
});

// ─── Color threshold config (§7, admin only) ──────────────
const getColorConfig = asyncHandler(async (req, res) => {
  const config = await BhiColorConfig.getConfig();
  res.json({ success: true, config });
});

const updateColorConfig = asyncHandler(async (req, res) => {
  const { orangeThreshold, redThreshold } = req.body;
  const config = await BhiColorConfig.findByIdAndUpdate(
    "singleton",
    { orangeThreshold, redThreshold, updatedBy: req.user._id },
    { new: true, upsert: true }
  );
  res.json({ success: true, config });
});

module.exports = {
  getRosterForDate,
  submitAttendance,
  correctAttendance,
  getAuditHistory,
  getOverviewLists,
  getDashboard,
  overrideStudentColor,
  getStudentProfile,
  getAlerts,
  getClassColorBreakdown,
  getLessonHistory,
  getLessonDayDetail,
  getColorConfig,
  updateColorConfig,
};
