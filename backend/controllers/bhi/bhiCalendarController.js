const asyncHandler = require("express-async-handler");
const BhiCalendarEvent = require("../../models/bhi/BhiCalendarEvent");

// GET /api/bhi/calendar?start=YYYY-MM-DD&end=YYYY-MM-DD
const getCalendarEvents = asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const filter = {};
  if (start && end) filter.date = { $gte: start, $lte: end };
  const events = await BhiCalendarEvent.find(filter).sort({ date: 1 });
  res.json({ success: true, events });
});

// POST /api/bhi/calendar (admin only)
const addCalendarEvent = asyncHandler(async (req, res) => {
  const { date, label, type } = req.body;
  if (!date || !label) {
    res.status(400);
    throw new Error("Date and label are required.");
  }
  const event = await BhiCalendarEvent.create({
    date,
    label,
    type,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, event });
});

// DELETE /api/bhi/calendar/:id (admin only)
const removeCalendarEvent = asyncHandler(async (req, res) => {
  const event = await BhiCalendarEvent.findByIdAndDelete(req.params.id);
  if (!event) {
    res.status(404);
    throw new Error("Calendar event not found.");
  }
  res.json({ success: true, message: "Calendar event removed." });
});

module.exports = { getCalendarEvents, addCalendarEvent, removeCalendarEvent };
