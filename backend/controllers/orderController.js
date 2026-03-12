const asyncHandler = require("express-async-handler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Course = require("../models/Course");
const Order = require("../models/Order");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");
const Lesson = require("../models/Lesson");
const { successResponse, createdResponse } = require("../utils/response");
const logger = require("../config/logger");

// ─── Helper: initialize Progress after enrollment ─────────
const initializeProgress = async (studentId, courseId, enrollmentId) => {
  const lessons = await Lesson.find({
    course: courseId,
    isPublished: true,
  }).sort({ order: 1 });

  const lessonProgress = lessons.map((lesson, index) => ({
    lesson: lesson._id,
    isUnlocked: index === 0, // first lesson always unlocked
    isWatched: false,
    examPassed: false,
    examScore: 0,
    examAttempts: 0,
  }));

  await Progress.findOneAndUpdate(
    { student: studentId, course: courseId },
    {
      $setOnInsert: {
        student: studentId,
        course: courseId,
        enrollment: enrollmentId,
        lessons: lessonProgress,
        totalLessons: lessons.length,
        completedLessons: 0,
        progressPercentage: 0,
      },
    },
    { upsert: true },
  );
};

// ─── @desc    Create Stripe checkout session
// ─── @route   POST /api/orders/checkout
// ─── @access  Private (student)
const createCheckoutSession = asyncHandler(async (req, res) => {
  const { courseId } = req.body;

  const course = await Course.findOne({ _id: courseId, isPublished: true });
  if (!course) {
    res.status(404);
    throw new Error("Course not found.");
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({
    student: req.user._id,
    course: courseId,
    isActive: true,
  });
  if (existingEnrollment) {
    res.status(400);
    throw new Error("You are already enrolled in this course.");
  }

  // Check for existing pending order
  const existingOrder = await Order.findOne({
    student: req.user._id,
    course: courseId,
    status: "pending",
  });
  if (existingOrder?.stripeSessionId) {
    // Return existing session if still valid
    try {
      const existingSession = await stripe.checkout.sessions.retrieve(
        existingOrder.stripeSessionId,
      );
      if (existingSession.status === "open") {
        return successResponse(res, {
          sessionId: existingSession.id,
          url: existingSession.url,
        });
      }
    } catch {
      // Session expired — create new one
    }
  }

  const effectivePrice =
    course.discountPrice > 0 ? course.discountPrice : course.price;

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: req.user.email,
    client_reference_id: req.user._id.toString(),
    line_items: [
      {
        price_data: {
          currency: course.currency?.toLowerCase() || "usd",
          product_data: {
            name: course.title,
            description:
              course.shortDescription || course.description.slice(0, 150),
            images: course.thumbnail?.url ? [course.thumbnail.url] : [],
            metadata: { courseId: course._id.toString() },
          },
          unit_amount: Math.round(effectivePrice * 100), // cents
        },
        quantity: 1,
      },
    ],
    metadata: {
      courseId: course._id.toString(),
      studentId: req.user._id.toString(),
    },
    success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/courses/${course._id}?payment=cancelled`,
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 min
  });

  // Save pending order
  await Order.findOneAndUpdate(
    { student: req.user._id, course: courseId, status: "pending" },
    {
      student: req.user._id,
      course: courseId,
      amount: effectivePrice,
      currency: course.currency?.toLowerCase() || "usd",
      stripeSessionId: session.id,
      status: "pending",
    },
    { upsert: true, new: true },
  );

  return successResponse(res, { sessionId: session.id, url: session.url });
});

// ─── @desc    Verify payment after Stripe redirect
// ─── @route   GET /api/orders/verify/:sessionId
// ─── @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return successResponse(res, {
      isPaid: false,
      status: session.payment_status,
    });
  }

  const order = await Order.findOne({ stripeSessionId: sessionId });
  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  // ✅ Fallback: enroll if webhook hasn't fired yet
  if (order.status !== "completed") {
    await handlePaymentSuccess(session);
  }

  const enrollment = await Enrollment.findOne({
    student: order.student,
    course: order.course,
  });

  return successResponse(res, {
    isPaid: true,
    order,
    isEnrolled: !!enrollment,
    courseId: order.course,
  });
});

// ─── @desc    Get student's order history
// ─── @route   GET /api/orders/my
// ─── @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ student: req.user._id })
    .populate("course", "title thumbnail price")
    .sort({ createdAt: -1 })
    .lean();

  return successResponse(res, { orders });
});

// ─── @desc    Get all orders (Admin)
// ─── @route   GET /api/orders
// ─── @access  Admin
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, search } = req.query;
  const query = {};
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate("student", "name email")
      .populate("course", "title price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Order.countDocuments(query),
  ]);

  const totalRevenue = await Order.aggregate([
    { $match: { status: "completed" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return successResponse(res, {
    orders,
    pagination: {
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    },
    totalRevenue: totalRevenue[0]?.total || 0,
  });
});

// ─── @desc    Stripe webhook handler
// ─── @route   POST /api/webhooks/stripe
// ─── @access  Stripe (raw body)
const stripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    logger.error(`Stripe webhook signature error: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      await handlePaymentSuccess(session);
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      await Order.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntent.id },
        { status: "failed" },
      );
      break;
    }
    case "charge.refunded": {
      const charge = event.data.object;
      await Order.findOneAndUpdate(
        { stripePaymentIntentId: charge.payment_intent },
        { status: "refunded", refundedAt: new Date() },
      );
      break;
    }
    default:
      logger.debug(`Unhandled Stripe event: ${event.type}`);
  }

  res.json({ received: true });
});

// ─── Internal: handle successful payment ─────────────────
const handlePaymentSuccess = async (session) => {
  try {
    const { courseId, studentId } = session.metadata;

    // Update order
    const order = await Order.findOneAndUpdate(
      { stripeSessionId: session.id },
      {
        status: "completed",
        stripePaymentIntentId: session.payment_intent,
        stripeCustomerId: session.customer,
        paidAt: new Date(),
      },
      { new: true },
    );

    if (!order) {
      logger.error(
        `handlePaymentSuccess: Order not found for session ${session.id}`,
      );
      return;
    }

    // Create enrollment
    const enrollment = await Enrollment.findOneAndUpdate(
      { student: studentId, course: courseId },
      {
        student: studentId,
        course: courseId,
        order: order._id,
        isActive: true,
        enrolledAt: new Date(),
      },
      { upsert: true, new: true },
    );

    // Increment course enrollment count
    await Course.findByIdAndUpdate(courseId, { $inc: { enrollmentCount: 1 } });

    // Initialize progress tracking
    await initializeProgress(studentId, courseId, enrollment._id);

    logger.info(
      `Payment success: student=${studentId} course=${courseId} order=${order._id}`,
    );
  } catch (err) {
    logger.error(`handlePaymentSuccess error: ${err.message}`);
  }
};

module.exports = {
  createCheckoutSession,
  verifyPayment,
  getMyOrders,
  getAllOrders,
  stripeWebhook,
};
