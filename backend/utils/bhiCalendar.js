const BhiCalendarEvent = require("../models/bhi/BhiCalendarEvent");

/**
 * Returns true if the given YYYY-MM-DD date is a Saturday or Sunday.
 */
function isWeekend(dateStr) {
  const day = new Date(`${dateStr}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Loads all admin-entered holiday/closure dates as a Set for O(1) lookup.
 * Optionally scoped to a date range for efficiency.
 */
async function loadNonInstructionalDates(startDate, endDate) {
  const query = {};
  if (startDate && endDate) query.date = { $gte: startDate, $lte: endDate };
  const events = await BhiCalendarEvent.find(query).select("date").lean();
  return new Set(events.map((e) => e.date));
}

/**
 * Generates the list of instructional (YYYY-MM-DD) dates between two dates
 * (inclusive), excluding weekends and admin-entered non-instructional days.
 * §5: "Attendance calendar only generates dates within that enrollment window."
 * §6: "Only applicable instructional days count toward attendance %."
 */
async function generateInstructionalDates(startDate, endDate, upToDate = null) {
  const holidaySet = await loadNonInstructionalDates(startDate, endDate);
  const end = upToDate && upToDate < endDate ? upToDate : endDate;

  const dates = [];
  let cursor = new Date(`${startDate}T00:00:00Z`);
  const last = new Date(`${end}T00:00:00Z`);

  while (cursor <= last) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (!isWeekend(dateStr) && !holidaySet.has(dateStr)) {
      dates.push(dateStr);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

module.exports = { isWeekend, loadNonInstructionalDates, generateInstructionalDates };
