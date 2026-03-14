import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";
// ── top of file, update imports ──
import { useDispatch } from "react-redux";
import { verifyOtp as verifyOtpAction } from "../redux/slices/authSlice";
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --b50:  #eff6ff;
    --b100: #dbeafe;
    --b200: #bfdbfe;
    --b300: #93c5fd;
    --b400: #60a5fa;
    --b500: #3b82f6;
    --b600: #2563eb;
    --b700: #1d4ed8;
    --b800: #1e40af;
    --b900: #1e3a8a;

    --hero:      #050f2b;

    --ink:       #0f172a;
    --ink-2:     #334155;
    --ink-3:     #64748b;
    --ink-4:     #94a3b8;
    --ink-5:     #cbd5e1;

    --surface:   #f8fafc;
    --surface-2: #f1f5f9;
    --border:    rgba(15,23,42,0.08);
    --border-2:  rgba(15,23,42,0.14);
    --white:     #ffffff;

    --green:     #16a34a;
    --green-lt:  #f0fdf4;

    --danger:    #be123c;
    --danger-lt: #fff1f2;

    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .otp-root {
    font-family: var(--font-body);
    min-height: calc(100vh - 64px);
    display: grid;
    grid-template-columns: 1fr 1fr;
    -webkit-font-smoothing: antialiased;
  }

  /* ══ LEFT DARK HERO ══ */
  .otp-left {
    background: var(--hero);
    display: flex; flex-direction: column;
    justify-content: space-between;
    padding: 48px 52px;
    position: relative; overflow: hidden;
  }
  .otp-left::before {
    content: '';
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
    background-size: 36px 36px;
  }
  .otp-left::after {
    content: '';
    position: absolute;
    top: -20%; left: -10%; width: 70%; height: 70%;
    background: radial-gradient(ellipse, rgba(37,99,235,0.35) 0%, transparent 68%);
    pointer-events: none;
  }
  .otp-glow2 {
    position: absolute;
    bottom: -15%; right: -15%; width: 55%; height: 55%;
    background: radial-gradient(ellipse, rgba(59,130,246,0.18) 0%, transparent 68%);
    pointer-events: none;
  }

  .otp-logo {
    position: relative; z-index: 2;
    display: flex; align-items: center; gap: 8px;
    text-decoration: none;
  }
  .otp-logo-mark {
    width: 30px; height: 30px; border-radius: 8px;
    background: linear-gradient(135deg, var(--b600), var(--b800));
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(37,99,235,0.40), inset 0 1px 0 rgba(255,255,255,0.15);
    flex-shrink: 0;
  }
  .otp-logo-mark svg { width: 14px; height: 14px; }
  .otp-logo-text {
    font-family: var(--font-display);
    font-size: 16px; font-weight: 700;
    color: #f0f6ff; letter-spacing: -.03em;
  }
  .otp-logo-text span { color: var(--b400); }

  .otp-left-body {
    position: relative; z-index: 2;
    flex: 1; display: flex; flex-direction: column;
    justify-content: center; padding: 32px 0;
  }
  .otp-eyebrow {
    font-family: var(--font-body);
    font-size: 11px; font-weight: 600; letter-spacing: .12em;
    text-transform: uppercase; color: var(--b400);
    margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }
  .otp-eyebrow-line {
    display: inline-block; width: 24px; height: 1.5px;
    background: var(--b500); border-radius: 2px;
  }
  .otp-headline {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: clamp(28px, 3vw, 44px);
    color: #f0f6ff; line-height: 1.05;
    letter-spacing: -.04em; margin-bottom: 18px;
  }
  .otp-headline em {
    font-style: normal;
    background: linear-gradient(135deg, var(--b300), var(--b500));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .otp-sub {
    font-size: 14px; font-weight: 300;
    color: rgba(148,163,184,0.85);
    line-height: 1.75; max-width: 300px;
  }

  /* ── Animated envelope illustration ── */
  .otp-envelope-wrap {
    position: relative; z-index: 2;
    margin: 32px 0;
    display: flex; align-items: center; gap: 20px;
  }
  .otp-envelope {
    width: 72px; height: 54px; position: relative; flex-shrink: 0;
  }
  .otp-env-body {
    width: 72px; height: 54px; border-radius: 6px;
    background: linear-gradient(160deg, rgba(37,99,235,0.22), rgba(37,99,235,0.10));
    border: 1px solid rgba(37,99,235,0.35);
    position: absolute; top: 0; left: 0;
  }
  .otp-env-flap {
    position: absolute; top: 0; left: 0;
    width: 0; height: 0;
    border-left: 36px solid transparent;
    border-right: 36px solid transparent;
    border-top: 22px solid rgba(37,99,235,0.30);
  }
  .otp-env-lines {
    position: absolute; bottom: 12px; left: 12px; right: 12px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .otp-env-line {
    height: 2px; border-radius: 1px;
    background: rgba(96,165,250,0.35);
  }
  .otp-env-line:first-child { width: 70%; }
  .otp-env-dot {
    position: absolute; top: -5px; right: -5px;
    width: 14px; height: 14px; border-radius: 50%;
    background: var(--b500);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.25);
    animation: otp-pulse 2s ease-in-out infinite;
  }
  @keyframes otp-pulse {
    0%, 100% { box-shadow: 0 0 0 3px rgba(59,130,246,0.25); }
    50%       { box-shadow: 0 0 0 6px rgba(59,130,246,0.10); }
  }

  .otp-steps {
    display: flex; flex-direction: column; gap: 10px;
  }
  .otp-step {
    display: flex; align-items: center; gap: 10px;
    font-size: 12.5px; font-weight: 400;
    color: rgba(148,163,184,0.70);
  }
  .otp-step-num {
    width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0;
    background: rgba(37,99,235,0.12);
    border: 1px solid rgba(37,99,235,0.25);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
    color: var(--b400); font-family: var(--font-display);
  }

  .otp-pills {
    position: relative; z-index: 2;
    display: flex; flex-direction: column; gap: 10px;
  }
  .otp-pill {
    display: flex; align-items: center; gap: 12px;
    font-family: var(--font-body);
    font-size: 13px; font-weight: 400;
    color: rgba(148,163,184,0.75);
  }
  .otp-pill-check {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0;
    background: rgba(37,99,235,0.15);
    border: 1px solid rgba(37,99,235,0.30);
    display: flex; align-items: center; justify-content: center;
  }
  .otp-pill-check svg {
    width: 10px; height: 10px;
    stroke: var(--b400); stroke-width: 2.5; fill: none;
  }

  /* ══ RIGHT PANEL ══ */
  .otp-right {
    background: var(--white);
    display: flex; align-items: center; justify-content: center;
    padding: 48px 52px;
    position: relative;
  }
  .otp-right::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, var(--b700), var(--b500), var(--b300));
    opacity: 0.55;
  }

  .otp-form-wrap { width: 100%; max-width: 360px; }

  /* ── Email badge ── */
  .otp-email-badge {
    display: inline-flex; align-items: center; gap: 7px;
    padding: 6px 12px 6px 8px;
    background: var(--b50);
    border: 1px solid var(--b100);
    border-radius: 100px;
    margin-bottom: 28px;
  }
  .otp-email-badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--b500);
    animation: otp-pulse 2s ease-in-out infinite;
  }
  .otp-email-badge-text {
    font-size: 12px; font-weight: 500;
    color: var(--b700); letter-spacing: -.01em;
    max-width: 220px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .otp-form-header { margin-bottom: 32px; }
  .otp-form-title {
    font-family: var(--font-display);
    font-size: 28px; font-weight: 800; color: var(--ink);
    letter-spacing: -.04em; margin-bottom: 6px;
  }
  .otp-form-sub {
    font-size: 13px; color: var(--ink-4); font-weight: 300;
    line-height: 1.6;
  }

  /* ── OTP boxes ── */
  .otp-inputs-label {
    font-size: 12.5px; font-weight: 600; color: var(--ink-2);
    letter-spacing: .01em; margin-bottom: 10px;
    font-family: var(--font-body);
  }

  .otp-inputs {
    display: flex; gap: 8px;
    justify-content: flex-start;
    margin-bottom: 8px;
  }

  .otp-box {
    width: 50px; height: 58px;
    border: 1.5px solid var(--border-2);
    border-radius: 12px;
    font-family: var(--font-display);
    font-size: 24px; font-weight: 700;
    text-align: center; color: var(--ink);
    background: var(--surface);
    outline: none;
    transition: border-color .14s, box-shadow .14s, background .14s, transform .1s;
    caret-color: var(--b500);
  }
  .otp-box:focus {
    background: var(--white);
    border-color: var(--b500);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
    transform: translateY(-2px);
  }
  .otp-box.filled {
    background: var(--white);
    border-color: var(--b400);
  }
  .otp-box.error {
    border-color: var(--danger);
    box-shadow: 0 0 0 3px rgba(190,18,60,0.08);
    animation: otp-shake .35s ease;
  }
  .otp-box.success {
    border-color: var(--green);
    box-shadow: 0 0 0 3px rgba(22,163,74,0.10);
  }
  @keyframes otp-shake {
    0%,100% { transform: translateX(0); }
    20%      { transform: translateX(-4px); }
    40%      { transform: translateX(4px); }
    60%      { transform: translateX(-3px); }
    80%      { transform: translateX(3px); }
  }

  /* ── Divider between box 3 & 4 ── */
  .otp-sep {
    display: flex; align-items: center;
    color: var(--ink-5); font-size: 18px; font-weight: 300;
    padding-bottom: 2px; user-select: none;
  }

  /* ── Feedback ── */
  .otp-feedback {
    min-height: 20px; margin-bottom: 20px;
  }
  .otp-error-msg {
    font-size: 12.5px; color: var(--danger); font-weight: 500;
    display: flex; align-items: center; gap: 5px;
  }
  .otp-error-msg svg {
    width: 12px; height: 12px; flex-shrink: 0;
    stroke: var(--danger); stroke-width: 2.5; fill: none;
  }
  .otp-success-msg {
    font-size: 12.5px; color: var(--green); font-weight: 500;
    display: flex; align-items: center; gap: 5px;
  }
  .otp-success-msg svg {
    width: 12px; height: 12px; flex-shrink: 0;
    stroke: var(--green); stroke-width: 2.5; fill: none;
  }

  /* ── Submit ── */
  .otp-submit {
    position: relative; overflow: hidden;
    width: 100%; padding: 13px 20px;
    background: linear-gradient(135deg, var(--b500) 0%, var(--b700) 100%);
    color: white; border: none; border-radius: 10px; cursor: pointer;
    font-family: var(--font-display);
    font-size: 15px; font-weight: 700; letter-spacing: -.02em;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    box-shadow:
      0 4px 20px rgba(37,99,235,0.32),
      0 0 0 1px rgba(37,99,235,0.15),
      inset 0 1px 0 rgba(255,255,255,0.15);
    transition: box-shadow .2s, transform .15s;
    margin-bottom: 20px;
  }
  .otp-submit::after {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
    animation: shimmer 2.8s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes shimmer {
    0%   { left: -100%; }
    60%  { left: 150%; }
    100% { left: 150%; }
  }
  .otp-submit:hover:not(:disabled) {
    box-shadow:
      0 8px 28px rgba(37,99,235,0.40),
      0 0 0 1px rgba(37,99,235,0.20),
      inset 0 1px 0 rgba(255,255,255,0.15);
    transform: translateY(-1px);
  }
  .otp-submit:disabled { opacity: .55; cursor: not-allowed; transform: none; }

  @keyframes spin { to { transform: rotate(360deg); } }
  .otp-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.30);
    border-top-color: white;
    animation: spin .7s linear infinite; flex-shrink: 0;
  }

  /* ── Progress dots ── */
  .otp-progress {
    display: flex; gap: 5px; justify-content: center;
    margin-bottom: 6px;
  }
  .otp-progress-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--border-2);
    transition: background .2s, transform .2s;
  }
  .otp-progress-dot.active {
    background: var(--b500);
    transform: scale(1.2);
  }

  /* ── Resend ── */
  .otp-resend-wrap {
    text-align: center;
    font-size: 13px; color: var(--ink-4); font-weight: 300;
    margin-bottom: 20px;
  }
  .otp-resend-btn {
    background: none; border: none; cursor: pointer;
    color: var(--b600); font-size: 13px; font-weight: 600;
    font-family: var(--font-body);
    padding: 0; text-decoration: underline;
    transition: color .14s;
  }
  .otp-resend-btn:hover { color: var(--b800); }
  .otp-resend-timer {
    color: var(--ink-5); font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  /* ── Footer ── */
  .otp-footer-link {
    text-align: center;
    font-size: 13px; color: var(--ink-4); font-weight: 300;
    margin-bottom: 0;
  }
  .otp-footer-link a {
    color: var(--ink-2); font-weight: 600; text-decoration: none;
  }
  .otp-footer-link a:hover { color: var(--b600); text-decoration: underline; }

  /* Trust bar */
  .otp-trust {
    display: flex; align-items: center; justify-content: center; gap: 18px;
    margin-top: 20px; padding-top: 20px;
    border-top: 1px solid var(--border);
  }
  .otp-trust-item {
    display: flex; align-items: center; gap: 5px;
    font-size: 11.5px; color: var(--ink-5); font-weight: 500;
  }
  .otp-trust-item svg {
    width: 12px; height: 12px;
    stroke: var(--b400); stroke-width: 2.5; fill: none;
  }

  /* Expiry bar */
  .otp-expiry {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px;
  }
  .otp-expiry-label {
    font-size: 11.5px; color: var(--ink-5); font-weight: 400;
  }
  .otp-expiry-bar-wrap {
    flex: 1; height: 3px; background: var(--border-2);
    border-radius: 2px; margin: 0 10px; overflow: hidden;
  }
  .otp-expiry-bar {
    height: 100%; border-radius: 2px;
    background: linear-gradient(90deg, var(--b500), var(--b300));
    transition: width 1s linear, background .5s;
  }
  .otp-expiry-bar.warn { background: linear-gradient(90deg, #f59e0b, #fcd34d); }
  .otp-expiry-bar.crit { background: linear-gradient(90deg, #ef4444, #fca5a5); }
  .otp-expiry-time {
    font-size: 11.5px; font-weight: 600; color: var(--ink-3);
    font-variant-numeric: tabular-nums; min-width: 32px; text-align: right;
    font-family: var(--font-display);
  }
  .otp-expiry-time.warn { color: #d97706; }
  .otp-expiry-time.crit { color: #dc2626; }

  @media (max-width: 768px) {
    .otp-root { grid-template-columns: 1fr; }
    .otp-left  { display: none; }
    .otp-right { padding: 32px 24px; min-height: calc(100vh - 64px); }
    .otp-right::before { display: none; }
    .otp-box { width: 44px; height: 52px; font-size: 20px; }
  }
`;

const OTP_LENGTH = 6;
const EXPIRY_SECONDS = 600; // 10 min
const RESEND_COOLDOWN = 30;

const PILLS = [
  "Your account is almost ready",
  "One-time code expires in 10 min",
  "Check spam if not in inbox",
];

const LogoMark = () => (
  <svg viewBox="0 0 14 14" fill="none" width="14" height="14">
    <path d="M2 11V5L7 3l5 2v6L7 12 2 11z" fill="rgba(255,255,255,0.9)" />
    <path
      d="M7 3v9M2 11l5-1.3M12 11l-5-1.3"
      stroke="rgba(37,99,235,0.5)"
      strokeWidth="0.8"
    />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 12 12" fill="none">
    <polyline
      points="2,6 5,9 10,3"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const IconArrow = () => (
  <svg
    width="13"
    height="13"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);
const IconWarn = () => (
  <svg viewBox="0 0 12 12" fill="none">
    <path
      d="M6 1L11 10H1L6 1z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M6 5v2.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="6" cy="9" r=".6" fill="currentColor" />
  </svg>
);
const IconCheckCircle = () => (
  <svg viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" />
    <polyline
      points="3.5,6 5,7.5 8.5,4.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function VerifyOtp() {
  const dispatch = useDispatch();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const [expiry, setExpiry] = useState(EXPIRY_SECONDS);
  const [boxState, setBoxState] = useState("idle"); // idle | error | success

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  useEffect(() => {
    if (!email) navigate("/register", { replace: true });
  }, [email, navigate]);

  // Resend cooldown
  useEffect(() => {
    if (resendTimer === 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Expiry countdown (visual only — server enforces real expiry)
  useEffect(() => {
    if (expiry === 0) return;
    const t = setTimeout(() => setExpiry((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [expiry]);

  const expiryPct = (expiry / EXPIRY_SECONDS) * 100;
  const expiryMins = String(Math.floor(expiry / 60)).padStart(2, "0");
  const expirySecs = String(expiry % 60).padStart(2, "0");
  const expiryClass = expiry < 60 ? "crit" : expiry < 120 ? "warn" : "";

  const focusNext = (i) => inputRefs.current[i + 1]?.focus();
  const focusPrev = (i) => inputRefs.current[i - 1]?.focus();

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    setError("");
    setBoxState("idle");
    if (value && index < OTP_LENGTH - 1) focusNext(index);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) focusPrev(index);
    if (e.key === "ArrowLeft" && index > 0) focusPrev(index);
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) focusNext(index);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const updated = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((c, i) => (updated[i] = c));
    setOtp(updated);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    console.log("payload:", { email, otp: otpString });
    console.log("email:", email);
    console.log("otp:", otpString, "length:", otpString.length);
    if (otpString.length < OTP_LENGTH) {
      setError("Please enter all 6 digits.");
      setBoxState("error");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // use Redux thunk instead of raw axios
      // so user state gets set in the store
      const result = await dispatch(verifyOtpAction({ email, otp: otpString }));

      if (result.meta.requestStatus === "fulfilled") {
        setBoxState("success");
        setTimeout(() => navigate("/", { replace: true }), 600); // ← home page
      } else {
        throw new Error(result.payload || "Verification failed.");
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Invalid code. Please try again.";

      if (msg.includes("already verified")) {
        navigate("/login", { replace: true });
        return;
      }

      setBoxState("error");
      setError(msg);
      setOtp(Array(OTP_LENGTH).fill(""));
      setTimeout(() => {
        setBoxState("idle");
        inputRefs.current[0]?.focus();
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setResendTimer(RESEND_COOLDOWN);
    setExpiry(EXPIRY_SECONDS);
    setError("");
    setMessage("");
    setOtp(Array(OTP_LENGTH).fill(""));
    setBoxState("idle");
    try {
      await axios.post("/api/auth/resend-otp", { email });
      setMessage("New code sent to your email.");
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend. Try again.");
    }
  };

  const filledCount = otp.filter(Boolean).length;

  return (
    <>
      <style>{css}</style>
      <div className="otp-root">
        {/* ── LEFT DARK HERO ── */}
        <div className="otp-left">
          <div className="otp-glow2" />

          <Link to="/" className="otp-logo">
            <div className="otp-logo-mark">
              <LogoMark />
            </div>
            <span className="otp-logo-text">
              E<span>·</span>Learn
            </span>
          </Link>

          <div className="otp-left-body">
            <div className="otp-eyebrow">
              <span className="otp-eyebrow-line" />
              Verify your email
            </div>
            <h2 className="otp-headline">
              One step
              <br />
              <em>from learning.</em>
            </h2>
            <p className="otp-sub">
              We sent a 6-digit code to your inbox. Enter it to activate your
              account and start your journey.
            </p>

            <div className="otp-envelope-wrap">
              <div className="otp-envelope">
                <div className="otp-env-body" />
                <div className="otp-env-flap" />
                <div className="otp-env-lines">
                  <div className="otp-env-line" />
                  <div className="otp-env-line" />
                </div>
                <div className="otp-env-dot" />
              </div>
              <div className="otp-steps">
                {[
                  "Check your inbox",
                  "Enter the 6-digit code",
                  "Start learning instantly",
                ].map((s, i) => (
                  <div key={s} className="otp-step">
                    <div className="otp-step-num">{i + 1}</div>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="otp-pills">
            {PILLS.map((text) => (
              <div key={text} className="otp-pill">
                <div className="otp-pill-check">
                  <IconCheck />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="otp-right">
          <div className="otp-form-wrap">
            {/* Email badge */}
            <div className="otp-email-badge">
              <div className="otp-email-badge-dot" />
              <span className="otp-email-badge-text">{email}</span>
            </div>

            <div className="otp-form-header">
              <div className="otp-form-title">Enter your code</div>
              <div className="otp-form-sub">
                A 6-digit verification code was sent to your email address.
              </div>
            </div>

            {/* OTP input */}
            <div className="otp-inputs-label">Verification code</div>
            <div className="otp-inputs" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <>
                  {index === 3 && (
                    <div key="sep" className="otp-sep">
                      –
                    </div>
                  )}
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    className={[
                      "otp-box",
                      digit ? "filled" : "",
                      boxState === "error" ? "error" : "",
                      boxState === "success" ? "success" : "",
                    ].join(" ")}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    autoFocus={index === 0}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                  />
                </>
              ))}
            </div>

            {/* Progress dots */}
            <div className="otp-progress" style={{ marginTop: 10 }}>
              {Array(OTP_LENGTH)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className={`otp-progress-dot ${i < filledCount ? "active" : ""}`}
                  />
                ))}
            </div>

            {/* Feedback */}
            <div className="otp-feedback">
              {error && (
                <div className="otp-error-msg">
                  <IconWarn />
                  {error}
                </div>
              )}
              {!error && message && (
                <div className="otp-success-msg">
                  <IconCheckCircle />
                  {message}
                </div>
              )}
            </div>

            {/* Expiry bar */}
            <div className="otp-expiry">
              <span className="otp-expiry-label">Code expires in</span>
              <div className="otp-expiry-bar-wrap">
                <div
                  className={`otp-expiry-bar ${expiryClass}`}
                  style={{ width: `${expiryPct}%` }}
                />
              </div>
              <span className={`otp-expiry-time ${expiryClass}`}>
                {expiryMins}:{expirySecs}
              </span>
            </div>

            {/* Submit */}
            <button
              className="otp-submit"
              onClick={handleVerify}
              disabled={loading || filledCount < OTP_LENGTH}
            >
              {loading ? (
                <>
                  <div className="otp-spinner" /> Verifying…
                </>
              ) : (
                <>
                  Verify email <IconArrow />
                </>
              )}
            </button>

            {/* Resend */}
            <div className="otp-resend-wrap">
              Didn't receive it?{" "}
              {canResend ? (
                <button className="otp-resend-btn" onClick={handleResend}>
                  Resend code
                </button>
              ) : (
                <span className="otp-resend-timer">
                  Resend in {resendTimer}s
                </span>
              )}
            </div>

            <div className="otp-footer-link">
              Wrong email? <Link to="/register">Go back and re-register</Link>
            </div>

            <div className="otp-trust">
              <div className="otp-trust-item">
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                >
                  <path d="M6 1l1.5 3h3l-2.5 2 1 3L6 7.5 3 9l1-3L1.5 4h3z" />
                </svg>
                SSL secured
              </div>
              <div className="otp-trust-item">
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                >
                  <rect x="2" y="5" width="8" height="6" rx="1" />
                  <path d="M4 5V3.5a2 2 0 114 0V5" />
                </svg>
                Encrypted
              </div>
              <div className="otp-trust-item">
                <svg
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.3"
                >
                  <circle cx="6" cy="6" r="5" />
                  <polyline points="4,6 5.5,7.5 8.5,4.5" />
                </svg>
                Code expires in 10 min
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
