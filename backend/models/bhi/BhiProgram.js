const mongoose = require("mongoose");

// ─── Program / Support-Class catalog ──────────────────────
// §3: "Program, examples given ... 'other BHI programs' (must be extensible)"
// Admins can add new Primary Programs or Support Class types at any time
// without a code change — that's the whole point of this being a collection
// instead of a hardcoded enum.
const bhiProgramSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Program name is required"],
      trim: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["primary", "support"], // Primary Occupational Program vs Required Support Class
      required: true,
    },
    description: { type: String, trim: true, default: "" },
    isActive: {
      type: Boolean,
      default: true, // deactivate instead of delete, keeps historical integrity
    },
  },
  { timestamps: true }
);

bhiProgramSchema.index({ type: 1, isActive: 1 });

module.exports = mongoose.model("BhiProgram", bhiProgramSchema);
