const BhiAttendanceRecord = require("../models/bhi/BhiAttendanceRecord");
const BhiColorConfig = require("../models/bhi/BhiColorConfig");
const { generateInstructionalDates } = require("./bhiCalendar");

/**
 * Consecutive unexcused (Absent) count, walking backward from the most
 * recent attendance record for a given student+class. Any non-Absent status
 * (Present/Excused/Late/Makeup) breaks the streak (§7).
 */
async function getConsecutiveUnexcusedAbsences(studentId, classId) {
  const records = await BhiAttendanceRecord.find({ student: studentId, class: classId })
    .sort({ date: -1 })
    .select("status date")
    .lean();

  let streak = 0;
  for (const record of records) {
    if (record.status === "Absent") {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Maps a consecutive-unexcused-absence count to a color, using the
 * admin-configurable thresholds (§7, §9).
 */
async function calculateColor(consecutiveUnexcused) {
  const config = await BhiColorConfig.getConfig();
  if (consecutiveUnexcused >= config.redThreshold) return "Red";
  if (consecutiveUnexcused >= config.orangeThreshold) return "Orange";
  return "Green";
}

/**
 * Full attendance summary for a student in one class: %, day-type counts,
 * consecutive unexcused absences, and derived color (§12-17).
 */
async function getClassAttendanceSummary(studentId, classId) {
  const records = await BhiAttendanceRecord.find({ student: studentId, class: classId }).lean();

  const counts = { Present: 0, Absent: 0, Excused: 0, Late: 0, Makeup: 0 };
  records.forEach((r) => {
    if (counts[r.status] !== undefined) counts[r.status] += 1;
  });

  const totalMarked = records.length;
  // Present/Late/Makeup count toward "attended"; Excused is neutral (removed
  // from denominator, per common attendance-policy practice — does not
  // penalize a documented excused absence) (§7).
  const attendedDays = counts.Present + counts.Late + counts.Makeup;
  const countableDays = totalMarked - counts.Excused;
  const attendancePercent = countableDays > 0 ? Math.round((attendedDays / countableDays) * 1000) / 10 : 100;

  const consecutiveUnexcused = await getConsecutiveUnexcusedAbsences(studentId, classId);
  const color = await calculateColor(consecutiveUnexcused);

  return {
    attendancePercent,
    counts,
    totalMarked,
    consecutiveUnexcused,
    color,
  };
}

/**
 * Program progress vs. attendance (§12-17): time completed/remaining, %
 * complete from enrollment dates, instructional days completed/remaining.
 */
async function getProgramProgress(startDate, expectedEndDate) {
  const today = new Date().toISOString().slice(0, 10);
  const cappedToday = today < expectedEndDate ? today : expectedEndDate;

  const allInstructionalDates = await generateInstructionalDates(startDate, expectedEndDate);
  const completedInstructionalDates = await generateInstructionalDates(startDate, expectedEndDate, cappedToday);

  const totalDays = allInstructionalDates.length || 1;
  const completedDays = completedInstructionalDates.length;
  const percentComplete = Math.min(100, Math.round((completedDays / totalDays) * 1000) / 10);

  return {
    instructionalDaysTotal: totalDays,
    instructionalDaysCompleted: completedDays,
    instructionalDaysRemaining: Math.max(0, totalDays - completedDays),
    percentComplete,
    expectedCompletionDate: expectedEndDate,
  };
}

module.exports = {
  getConsecutiveUnexcusedAbsences,
  calculateColor,
  getClassAttendanceSummary,
  getProgramProgress,
};
