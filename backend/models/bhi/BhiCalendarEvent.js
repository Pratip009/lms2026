const mongoose = require("mongoose");

// ─── Centralized School Calendar (§6) ─────────────────────
// Holds admin-entered holidays / closures / emergency closures / other
// non-instructional days. Saturdays & Sundays are treated as non-instructional
// automatically in code (see utils/bhiCalendar.js) — they do NOT need rows here.
const bhiCalendarEventSchema = new mongoose.Schema(
  {
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      unique: true,
    },
    label: {
      type: String,
      required: [true, "Label is required (e.g. 'Thanksgiving Break')"],
      trim: true,
    },
    type: {
      type: String,
      enum: ["holiday", "closure", "emergency_closure", "other"],
      default: "holiday",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);



module.exports = mongoose.model("BhiCalendarEvent", bhiCalendarEventSchema);
