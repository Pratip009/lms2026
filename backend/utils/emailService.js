const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Base sender ──────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"BHI Learning" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
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
  sendOtpEmail,
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendNewCourseEmail,
  sendCourseCompletionEmail,
};