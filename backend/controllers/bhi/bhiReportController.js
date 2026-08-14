const asyncHandler = require("express-async-handler");
const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { Parser: CsvParser } = require("json2csv");

const BhiAttendanceRecord = require("../../models/bhi/BhiAttendanceRecord");
const BhiStudent = require("../../models/bhi/BhiStudent");
const { getClassAttendanceSummary } = require("../../utils/bhiAttendanceEngine");

/**
 * Builds the underlying row-set for a report given the standard filter set
 * used across the report types (§23: "admin selects Student, Program, Class,
 * Teacher, Date range").
 */
async function buildReportRows({ studentId, classId, teacherId, dateFrom, dateTo, concernOnly }) {
  const filter = {};
  if (studentId) filter.student = studentId;
  if (classId) filter.class = classId;
  if (dateFrom && dateTo) filter.date = { $gte: dateFrom, $lte: dateTo };

  let records = await BhiAttendanceRecord.find(filter)
    .populate("student", "firstName lastName studentId")
    .populate({ path: "class", populate: ["program", "teacher"] })
    .sort({ date: -1 })
    .lean();

  if (teacherId) {
    records = records.filter((r) => String(r.class?.teacher?._id) === teacherId);
  }

  let rows = records.map((r) => ({
    Date: r.date,
    "Last Name": r.student?.lastName,
    "First Name": r.student?.firstName,
    "Student ID": r.student?.studentId,
    Program: r.class?.program?.name,
    Class: r.class?.sectionName,
    Teacher: r.class?.teacher?.name,
    Status: r.status,
    Note: r.note || "",
  }));

  // Attendance Concern report (§23): all currently Orange/Red students
  if (concernOnly) {
    const students = await BhiStudent.find({ enrollmentStatus: "Active", isArchived: false }).populate(
      {
        path: "enrollments",
        match: { role: "primary", status: "Active" },
        populate: { path: "class", populate: ["program", "teacher"] },
      }
    );
    rows = [];
    for (const student of students) {
      const e = student.enrollments?.[0];
      if (!e) continue;
      const summary = await getClassAttendanceSummary(student._id, e.class._id);
      const color = student.colorOverride || summary.color;
      if (color === "Green") continue;
      rows.push({
        "Last Name": student.lastName,
        "First Name": student.firstName,
        "Student ID": student.studentId,
        Program: e.class.program?.name,
        Teacher: e.class.teacher?.name,
        "Attendance %": summary.attendancePercent,
        "Consecutive Unexcused Absences": summary.consecutiveUnexcused,
        Color: color,
      });
    }
  }

  return rows;
}

// GET /api/bhi/reports?type=daily|weekly|monthly|student|program|class|teacher|concern
//     &studentId=&classId=&teacherId=&dateFrom=&dateTo=
const getReport = asyncHandler(async (req, res) => {
  const { type, studentId, classId, teacherId, dateFrom, dateTo } = req.query;
  const rows = await buildReportRows({
    studentId,
    classId,
    teacherId,
    dateFrom,
    dateTo,
    concernOnly: type === "concern",
  });
  res.json({ success: true, type, rowCount: rows.length, rows });
});

// GET /api/bhi/reports/export?format=csv|excel|pdf&...same filters as above
const exportReport = asyncHandler(async (req, res) => {
  const { format, type, studentId, classId, teacherId, dateFrom, dateTo } = req.query;
  const rows = await buildReportRows({
    studentId,
    classId,
    teacherId,
    dateFrom,
    dateTo,
    concernOnly: type === "concern",
  });

  const filenameBase = `bhi-attendance-${type || "report"}-${new Date().toISOString().slice(0, 10)}`;

  if (rows.length === 0) {
    res.status(404);
    throw new Error("No records match the selected filters.");
  }

  if (format === "csv") {
    const parser = new CsvParser({ fields: Object.keys(rows[0]) });
    const csv = parser.parse(rows);
    res.header("Content-Type", "text/csv");
    res.attachment(`${filenameBase}.csv`);
    return res.send(csv);
  }

  if (format === "excel") {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Attendance Report");
    sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: 20 }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };

    res.header(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.attachment(`${filenameBase}.xlsx`);
    await workbook.xlsx.write(res);
    return res.end();
  }

  if (format === "pdf") {
    const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
    res.header("Content-Type", "application/pdf");
    res.attachment(`${filenameBase}.pdf`);
    doc.pipe(res);

    doc.fontSize(16).text(`BHI Attendance Report — ${type || "Report"}`, { align: "center" });
    doc.moveDown();

    const columns = Object.keys(rows[0]);
    const colWidth = 750 / columns.length;

    doc.fontSize(9).font("Helvetica-Bold");
    columns.forEach((col, i) => doc.text(col, 30 + i * colWidth, doc.y, { width: colWidth, continued: false }));
    doc.moveDown(0.5);
    doc.font("Helvetica");

    rows.forEach((row) => {
      const y = doc.y;
      columns.forEach((col, i) => {
        doc.text(String(row[col] ?? ""), 30 + i * colWidth, y, { width: colWidth });
      });
      doc.moveDown(0.3);
      if (doc.y > 500) doc.addPage({ margin: 30, size: "A4", layout: "landscape" });
    });

    doc.end();
    return;
  }

  res.status(400);
  throw new Error("format must be one of: csv, excel, pdf");
});

module.exports = { getReport, exportReport };
