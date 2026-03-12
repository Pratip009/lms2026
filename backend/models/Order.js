const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    // ─── Pricing snapshot ─────────────────────────────────
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
      uppercase: true,
    },
    // ─── Stripe ───────────────────────────────────────────
    stripeSessionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripeCustomerId: String,
    // ─── Status ───────────────────────────────────────────
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "stripe",
    },
    // ─── Timestamps ───────────────────────────────────────
    paidAt: Date,
    refundedAt: Date,
    refundReason: String,
    // ─── Metadata ─────────────────────────────────────────
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.index({ student: 1, status: 1 });
orderSchema.index({ course: 1, status: 1 });
orderSchema.index({ stripeSessionId: 1 });
orderSchema.index({ stripePaymentIntentId: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
