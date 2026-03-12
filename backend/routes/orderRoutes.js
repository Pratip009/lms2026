const express = require("express");
const { body } = require("express-validator");
const router = express.Router();

const {
  createCheckoutSession,
  verifyPayment,
  getMyOrders,
  getAllOrders,
} = require("../controllers/orderController");
const { protect, authorize } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");

router.post(
  "/checkout",
  protect,
  [body("courseId").notEmpty().withMessage("Course ID is required")],
  validate,
  createCheckoutSession
);

router.get("/verify/:sessionId", protect, verifyPayment);
router.get("/my", protect, getMyOrders);
router.get("/", protect, authorize("admin"), getAllOrders);

module.exports = router;
