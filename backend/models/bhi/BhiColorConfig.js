const mongoose = require("mongoose");

// ─── Attendance Color Thresholds (§7) ─────────────────────
// Singleton document (one row, _id: "singleton") so admins can change the
// consecutive-unexcused-absence thresholds for future policy changes without
// a code deploy. Defaults match the spec: 0-1 green, 2 orange, 3+ red.
const bhiColorConfigSchema = new mongoose.Schema({
  _id: { type: String, default: "singleton" },
  orangeThreshold: { type: Number, default: 2 }, // consecutive unexcused absences
  redThreshold: { type: Number, default: 3 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

bhiColorConfigSchema.statics.getConfig = async function () {
  let config = await this.findById("singleton");
  if (!config) config = await this.create({ _id: "singleton" });
  return config;
};

module.exports = mongoose.model("BhiColorConfig", bhiColorConfigSchema);
