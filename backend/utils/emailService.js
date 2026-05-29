const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `BHI Learning <${process.env.EMAIL_FROM}>`;

// ─── Design Tokens ────────────────────────────────────────
const tokens = {
  accent:  "#6C63FF",
  gold:    "#F5A623",
  success: "#00C896",
};

// ─── Verify on startup ────────────────────────────────────
const verifyEmailService = async () => {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌  RESEND_API_KEY is not set — emails will not send");
    return;
  }
  if (!process.env.EMAIL_FROM) {
    console.error("❌  EMAIL_FROM is not set — emails will not send");
    return;
  }
  console.log(`✅  Resend ready  |  from: ${FROM}`);
};

// ─── Base sender with logging + retry ────────────────────
const sendMail = async ({ to, subject, html }, attempt = 1) => {
  const MAX_ATTEMPTS = 3;

  if (!to || !subject) {
    console.error("❌  sendMail: missing 'to' or 'subject'", { to, subject });
    throw new Error("sendMail: 'to' and 'subject' are required");
  }

  console.log(`📧  [attempt ${attempt}] Sending "${subject}" → ${to}`);

  const { data, error } = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  if (error) {
    console.error(`❌  Resend error (attempt ${attempt}):`, error);

    // Retry on transient network errors, not on auth/validation failures
    const isTransient =
      error.statusCode >= 500 ||
      error.message?.toLowerCase().includes("network") ||
      error.message?.toLowerCase().includes("timeout");

    if (isTransient && attempt < MAX_ATTEMPTS) {
      const delay = attempt * 1500; // 1.5s, 3s
      console.log(`🔄  Retrying in ${delay}ms…`);
      await new Promise((r) => setTimeout(r, delay));
      return sendMail({ to, subject, html }, attempt + 1);
    }

    throw new Error(`Email failed after ${attempt} attempt(s): ${error.message}`);
  }

  console.log(`✅  Email sent  |  id: ${data?.id}  |  "${subject}" → ${to}`);
  return data;
};

// ─── Base HTML layout ─────────────────────────────────────
const baseTemplate = ({ preheader = "", content, accentColor = tokens.accent }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
  <title>BHI Learning</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#EEEDF6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#EEEDF6;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:600px;width:100%;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 40px rgba(10,15,30,0.10);">

          <!-- Accent bar -->
          <tr><td style="background:${accentColor};padding:0;height:5px;"></td></tr>

          <!-- Logo -->
          <tr>
            <td style="padding:36px 48px 28px;border-bottom:1px solid #F0EFF8;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td>
                    <span style="font-family:'Georgia','Times New Roman',serif;font-size:22px;font-weight:700;color:#0A0F1E;letter-spacing:-0.5px;">
                      BHI <span style="color:${accentColor};">Learning</span>
                    </span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;color:#9CA3AF;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;">Education Platform</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dynamic content injected here -->
          ${content}

          <!-- Footer -->
          <tr>
            <td style="padding:32px 48px;background:#F8F7FF;border-top:1px solid #F0EFF8;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px;font-size:13px;color:#9CA3AF;line-height:1.6;">
                      You're receiving this because you have an account at BHI Learning.
                    </p>
                    <p style="margin:0;font-size:13px;color:#C4C2D6;">
                      &copy; ${new Date().getFullYear()} BHI Learning &middot; All rights reserved
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Templates ────────────────────────────────────────────

const otpTemplate = (otp) => baseTemplate({
  preheader: `Your BHI Learning verification code is ${otp}`,
  accentColor: tokens.accent,
  content: `
  <tr>
    <td style="padding:52px 48px 20px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#EDE9FF,#D4D0FF);border-radius:16px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:28px;">
        <span style="font-size:28px;line-height:64px;display:block;text-align:center;">&#x1F510;</span>
      </div>
      <h1 style="margin:0 0 12px;font-family:'Georgia','Times New Roman',serif;font-size:32px;font-weight:700;color:#0A0F1E;letter-spacing:-1px;line-height:1.2;">
        Verify your identity
      </h1>
      <p style="margin:0 0 40px;font-size:16px;color:#6B7280;line-height:1.7;">
        Use the code below to complete your sign-in. It expires in <strong style="color:#0A0F1E;">10 minutes</strong>.
      </p>
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 0 40px;">
        <tr>
          <td style="background:linear-gradient(135deg,#6C63FF,#8B85FF);border-radius:16px;padding:2px;">
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="background:#fff;border-radius:14px;padding:20px 48px;">
                  <span style="font-family:'Georgia',serif;font-size:48px;font-weight:700;color:#0A0F1E;letter-spacing:16px;display:block;">${otp}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" role="presentation" style="background:#FFF8E1;border-radius:12px;width:100%;margin-bottom:8px;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0;font-size:13px;color:#92740A;line-height:1.5;">
              &#x26A0;&#xFE0F; &nbsp;Never share this code with anyone. BHI Learning will never ask for your OTP.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`,
});

const welcomeTemplate = (name) => baseTemplate({
  preheader: `Welcome aboard, ${name}! Your learning journey starts today.`,
  accentColor: tokens.success,
  content: `
  <tr>
    <td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#0A0F1E;">
        <tr>
          <td style="padding:52px 48px;">
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
              <tr>
                <td style="background:rgba(0,200,150,0.18);border:1px solid rgba(0,200,150,0.3);border-radius:100px;padding:6px 14px;">
                  <span style="color:#00C896;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Account Activated</span>
                </td>
              </tr>
            </table>
            <h1 style="margin:0 0 12px;font-family:'Georgia','Times New Roman',serif;font-size:38px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.2;">
              Welcome,<br/>${name}!
            </h1>
            <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.65);line-height:1.7;">
              You're now part of the BHI Learning community. Let's build something great together.
            </p>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding:44px 48px;">
            <p style="margin:0 0 28px;font-size:12px;color:#6B7280;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;">What's waiting for you</p>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td width="48%" style="background:#F8F7FF;border-radius:14px;padding:24px;vertical-align:top;">
                  <p style="margin:0 0 10px;font-size:24px;">&#x1F4DA;</p>
                  <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0A0F1E;">Expert Courses</p>
                  <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.5;">Industry-vetted curriculum built for real outcomes.</p>
                </td>
                <td width="4%"></td>
                <td width="48%" style="background:#F8F7FF;border-radius:14px;padding:24px;vertical-align:top;">
                  <p style="margin:0 0 10px;font-size:24px;">&#x1F3C6;</p>
                  <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#0A0F1E;">Certificates</p>
                  <p style="margin:0;font-size:13px;color:#9CA3AF;line-height:1.5;">Earn credentials that open new career doors.</p>
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:36px;">
              <tr>
                <td style="background:#6C63FF;border-radius:12px;">
                  <a href="${process.env.APP_URL || 'https://bhilearning.com'}/dashboard"
                    style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                    Explore Courses &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`,
});

const paymentSuccessTemplate = ({ name, amount, courseName }) => baseTemplate({
  preheader: `Payment confirmed! You're enrolled in ${courseName}.`,
  accentColor: tokens.gold,
  content: `
  <tr>
    <td style="padding:52px 48px 44px;">
      <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px;">
        <tr>
          <td style="background:#FEF3C7;border-radius:100px;padding:10px 20px;">
            <span style="font-size:13px;font-weight:700;color:#92610A;letter-spacing:0.5px;">&#x2713; &nbsp;Payment Successful</span>
          </td>
        </tr>
      </table>
      <h1 style="margin:0 0 12px;font-family:'Georgia','Times New Roman',serif;font-size:34px;font-weight:700;color:#0A0F1E;letter-spacing:-1px;line-height:1.2;">
        You're all set, ${name}!
      </h1>
      <p style="margin:0 0 40px;font-size:16px;color:#6B7280;line-height:1.7;">
        Your enrollment is confirmed. Jump in anytime and learn at your own pace.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#F8F7FF;border-radius:16px;margin-bottom:36px;">
        <tr>
          <td style="padding:28px 28px 0;">
            <p style="margin:0 0 20px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#9CA3AF;">Order Summary</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 28px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="padding:14px 0;border-bottom:1px solid #EEEDF6;">
                  <span style="font-size:14px;color:#6B7280;">Course</span>
                </td>
                <td align="right" style="padding:14px 0;border-bottom:1px solid #EEEDF6;">
                  <span style="font-size:14px;font-weight:700;color:#0A0F1E;">${courseName}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 0;border-bottom:1px solid #EEEDF6;">
                  <span style="font-size:14px;color:#6B7280;">Access</span>
                </td>
                <td align="right" style="padding:14px 0;border-bottom:1px solid #EEEDF6;">
                  <span style="font-size:14px;font-weight:700;color:#0A0F1E;">Lifetime</span>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 0 0;">
                  <span style="font-size:16px;font-weight:700;color:#0A0F1E;">Total Paid</span>
                </td>
                <td align="right" style="padding:18px 0 0;">
                  <span style="font-family:'Georgia',serif;font-size:24px;font-weight:700;color:#F5A623;">&#x20B9;${amount}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <table cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="background:#0A0F1E;border-radius:12px;">
            <a href="${process.env.APP_URL || 'https://bhilearning.com'}/my-courses"
              style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
              Start Learning &rarr;
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`,
});

const newCourseTemplate = ({ name, courseName, courseUrl }) => baseTemplate({
  preheader: `New course alert: ${courseName} is now live on BHI Learning!`,
  accentColor: tokens.accent,
  content: `
  <tr>
    <td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#4F46E5;">
        <tr>
          <td style="padding:52px 48px;">
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
              <tr>
                <td style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);border-radius:100px;padding:6px 14px;">
                  <span style="color:#ffffff;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">New Course Live</span>
                </td>
              </tr>
            </table>
            <h1 style="margin:0 0 16px;font-family:'Georgia','Times New Roman',serif;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.2;">
              ${courseName}
            </h1>
            <p style="margin:0;font-size:16px;color:rgba(255,255,255,0.75);line-height:1.7;">
              Hey ${name}, we just published something we think you'll love.
            </p>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding:44px 48px;">
            <p style="margin:0 0 32px;font-size:16px;color:#6B7280;line-height:1.8;">
              This course is freshly crafted and ready to help you level up. Be among the first to explore it.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:36px;">
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #F0EFF8;font-size:14px;color:#0A0F1E;">
                  &#x1F4F9; &nbsp;HD video lessons
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #F0EFF8;font-size:14px;color:#0A0F1E;">
                  &#x1F4DD; &nbsp;Downloadable resources
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0;font-size:14px;color:#0A0F1E;">
                  &#x1F393; &nbsp;Certificate of completion
                </td>
              </tr>
            </table>
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="background:#6C63FF;border-radius:12px;">
                  <a href="${courseUrl}"
                    style="display:inline-block;padding:16px 36px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                    View Course &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`,
});

const courseCompletionTemplate = ({ name, courseName }) => baseTemplate({
  preheader: `You did it, ${name}! ${courseName} is complete.`,
  accentColor: tokens.gold,
  content: `
  <tr>
    <td style="padding:0;">
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
        style="background:#0A0F1E;">
        <tr>
          <td style="padding:60px 48px;text-align:center;">
            <p style="margin:0 0 20px;font-size:60px;line-height:1;">&#x1F393;</p>
            <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto 20px;">
              <tr>
                <td style="background:rgba(245,166,35,0.15);border:1px solid rgba(245,166,35,0.3);border-radius:100px;padding:6px 16px;">
                  <span style="color:#F5A623;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Course Complete</span>
                </td>
              </tr>
            </table>
            <h1 style="margin:0 0 12px;font-family:'Georgia','Times New Roman',serif;font-size:38px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1.2;">
              Outstanding,<br/>${name}!
            </h1>
            <p style="margin:0 auto;font-size:16px;color:rgba(255,255,255,0.6);line-height:1.7;max-width:360px;">
              You've completed <strong style="color:#F5A623;">${courseName}</strong>. That takes real dedication.
            </p>
          </td>
        </tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
        <tr>
          <td style="padding:44px 48px;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
              style="background:#FFFBEB;border-radius:16px;margin-bottom:36px;border:1px solid #FDE68A;">
              <tr>
                <td style="padding:28px;">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td style="vertical-align:middle;">
                        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#92610A;">Achievement Unlocked</p>
                        <p style="margin:0;font-size:18px;font-weight:700;color:#0A0F1E;">${courseName}</p>
                      </td>
                      <td align="right" style="vertical-align:middle;font-size:36px;">&#x1F3C5;</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 32px;font-size:16px;color:#6B7280;line-height:1.8;">
              Your certificate is ready. Download it and add it to your portfolio or LinkedIn profile &mdash; you've earned it.
            </p>
            <table cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td style="background:#0A0F1E;border-radius:12px;">
                  <a href="${process.env.APP_URL || 'https://bhilearning.com'}/certificates"
                    style="display:inline-block;padding:16px 32px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">
                    Get Certificate &rarr;
                  </a>
                </td>
                <td style="width:12px;"></td>
                <td style="border:2px solid #EEEDF6;border-radius:12px;">
                  <a href="${process.env.APP_URL || 'https://bhilearning.com'}/courses"
                    style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#6B7280;text-decoration:none;">
                    Browse More
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>`,
});

// ─── Public senders ───────────────────────────────────────
// IMPORTANT: always await these in your route/controller.
// Wrap in try/catch so your API doesn't crash on email failure.
//
// Example:
//   try {
//     await sendWelcomeEmail(user.email, user.name);
//   } catch (err) {
//     console.error("Welcome email failed (non-fatal):", err.message);
//   }

const sendOtpEmail = (email, otp) => {
  if (!otp) throw new Error("sendOtpEmail: otp is required");
  return sendMail({
    to: email,
    subject: "Your BHI Learning verification code",
    html: otpTemplate(otp),
  });
};

const sendWelcomeEmail = (email, name) => {
  if (!name) throw new Error("sendWelcomeEmail: name is required");
  return sendMail({
    to: email,
    subject: `Welcome to BHI Learning, ${name}!`,
    html: welcomeTemplate(name),
  });
};

const sendPaymentSuccessEmail = (email, { name, amount, courseName } = {}) => {
  if (!name || !amount || !courseName)
    throw new Error("sendPaymentSuccessEmail: name, amount, and courseName are required");
  return sendMail({
    to: email,
    subject: `Payment confirmed — ${courseName}`,
    html: paymentSuccessTemplate({ name, amount, courseName }),
  });
};

const sendNewCourseEmail = (email, { name, courseName, courseUrl } = {}) => {
  if (!name || !courseName || !courseUrl)
    throw new Error("sendNewCourseEmail: name, courseName, and courseUrl are required");
  return sendMail({
    to: email,
    subject: `New course: ${courseName}`,
    html: newCourseTemplate({ name, courseName, courseUrl }),
  });
};

const sendCourseCompletionEmail = (email, { name, courseName } = {}) => {
  if (!name || !courseName)
    throw new Error("sendCourseCompletionEmail: name and courseName are required");
  return sendMail({
    to: email,
    subject: `You completed ${courseName}!`,
    html: courseCompletionTemplate({ name, courseName }),
  });
};

module.exports = {
  verifyEmailService,
  sendOtpEmail,
  sendWelcomeEmail,
  sendPaymentSuccessEmail,
  sendNewCourseEmail,
  sendCourseCompletionEmail,
};