const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = `BHI Learning <${process.env.EMAIL_FROM}>`;

// ─── Verify on startup ────────────────────────────────────
const verifyEmailService = async () => {
  try {
    // Resend has no verify() — we just confirm the key is set
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ Resend failed: RESEND_API_KEY is not set");
    } else {
      console.log("✅ Resend is ready to send emails");
    }
  } catch (error) {
    console.error("❌ Resend failed:", error.message);
  }
};

// ─── Base sender ──────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  const { error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  if (error) throw new Error(error.message);
};

// ─── Auth ─────────────────────────────────────────────────
const sendOtpEmail = (email, otp) =>
  sendMail({
    to: email,
    subject: "Your verification code",
    html: `<p>Your OTP is <strong>${otp}</strong>. Expires in 10 minutes.</p>`,
  });

const sendWelcomeEmail = (email, name) =>
  sendMail({
    to: email,
    subject: "Welcome to BHI Learning!",
    html: `<p>Hi ${name}, welcome aboard! 🎉</p>`,
  });

// ─── Payments ─────────────────────────────────────────────
const sendPaymentSuccessEmail = (email, { name, amount, courseName }) =>
  sendMail({
    to: email,
    subject: "Payment confirmed",
    html: `<p>Hi ${name}, your payment of ₹${amount} for <strong>${courseName}</strong> was successful.</p>`,
  });

// ─── Courses ──────────────────────────────────────────────
const sendNewCourseEmail = (email, { name, courseName, courseUrl }) =>
  sendMail({
    to: email,
    subject: `New course: ${courseName}`,
    html: `<p>Hi ${name}, a new course <strong>${courseName}</strong> is live! <a href="${courseUrl}">Check it out</a></p>`,
  });

const sendCourseCompletionEmail = (email, { name, courseName }) =>
  sendMail({
    to: email,
    subject: `You completed ${courseName}!`,
    html: `<p>Congrats ${name}! You've completed <strong>${courseName}</strong>. 🎓</p>`,
  });

module.exports = {
  verifyEmailService,
  sendOtpEmail,
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendNewCourseEmail,
  sendCourseCompletionEmail,
};