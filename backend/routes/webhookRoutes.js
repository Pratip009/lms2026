const express = require("express");
const router = express.Router();
const { stripeWebhook } = require("../controllers/orderController");

// Stripe requires the raw request body for signature verification
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

module.exports = router;
