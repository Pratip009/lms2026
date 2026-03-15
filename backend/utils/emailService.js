const nodemailer = require("nodemailer");

// FIX: Render free tier blocks outbound IPv6.
// Using service:"gmail" lets Node resolve Gmail's SMTP to an IPv6 address
// (2607:...) which causes ENETUNREACH and silently kills email sending.
// Fix: use explicit host + port + family:4 to force IPv4 only.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for port 465 (SSL)
  family: 4,    // ← force IPv4, prevents ENETUNREACH on Render free tier
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
  transporter, // ← exported so server.js can call transporter.verify()
  sendOtpEmail,
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendNewCourseEmail,
  sendCourseCompletionEmail,
};