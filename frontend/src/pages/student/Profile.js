import React, { useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../../redux/slices/authSlice";
/* ─────────────────────────────────────────────────────────────
   API BASE — matches your Vercel ↔ Render setup
   ───────────────────────────────────────────────────────────── */
const API_BASE = import.meta.env.VITE_API_URL;

// ── Debug: printed once on page load — check browser console ──
// Should show your Render URL + a non-empty token


/* ─────────────────────────────────────────────────────────────
   TOKEN HELPER
   Your authSlice does: localStorage.setItem("token", p.accessToken)
   so the key is definitely "token". The 401 means the header isn't
   being sent — fixed below by always reading fresh from localStorage.
   ───────────────────────────────────────────────────────────── */
const getToken = () => localStorage.getItem("token") || "";

/* ─────────────────────────────────────────────────────────────
   REDUX ACTION
   Dispatch this after a successful save so the header / sidebar
   reflect the new name/avatar without a page reload.

   In your authSlice, add (if not already there):
     setUser: (state, action) => { state.user = action.payload; }

   Then import and use:  dispatch(setUser(updatedUser))
   ───────────────────────────────────────────────────────────── */
// ← adjust path if needed

/* ══════════════════════════════════════════════════════════════
   CSS
   ══════════════════════════════════════════════════════════════ */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --b50:#eff6ff; --b100:#dbeafe; --b200:#bfdbfe; --b300:#93c5fd;
    --b400:#60a5fa; --b500:#3b82f6; --b600:#2563eb; --b700:#1d4ed8;
    --hero:#050f2b;
    --ink:#0f172a; --ink-2:#334155; --ink-3:#64748b; --ink-4:#94a3b8; --ink-5:#cbd5e1;
    --surface:#f8fafc; --surface-2:#f1f5f9;
    --border:rgba(15,23,42,0.08); --border-2:rgba(15,23,42,0.14);
    --white:#ffffff;
    --green:#16a34a; --green-lt:#f0fdf4; --green-mid:#bbf7d0;
    --red:#ef4444; --red-lt:#fef2f2;
    --font-display:'Syne',sans-serif; --font-body:'DM Sans',sans-serif;
    --r:10px; --r-lg:16px; --r-xl:22px;
  }

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{left:-100%} 60%{left:150%} 100%{left:150%} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes spin    { to{transform:rotate(360deg)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.55} }

  .pf-root {
    font-family: var(--font-body);
    background: var(--surface);
    color: var(--ink);
    min-height: calc(100vh - 60px);
    padding: 0 40px 80px;
    -webkit-font-smoothing: antialiased;
    position: relative;
    overflow-x: hidden;
  }

  .pf-hero {
    position:absolute; top:0; left:0; right:0; height:260px; z-index:0;
    background:linear-gradient(175deg,#050f2b 0%,#0c1e4a 48%,transparent 100%);
    pointer-events:none;
  }
  .pf-hero::before {
    content:''; position:absolute; inset:0;
    background-image:radial-gradient(circle,rgba(59,130,246,0.18) 1px,transparent 1px);
    background-size:26px 26px;
    mask-image:linear-gradient(180deg,rgba(0,0,0,.75) 0%,transparent 100%);
    -webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,.75) 0%,transparent 100%);
  }
  .pf-hero::after {
    content:''; position:absolute; top:-80px; left:50%; transform:translateX(-50%);
    width:700px; height:500px;
    background:radial-gradient(ellipse at 50% 30%,rgba(59,130,246,0.2) 0%,transparent 70%);
  }
  .pf-body-grid {
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:radial-gradient(circle,rgba(37,99,235,0.04) 1px,transparent 1px);
    background-size:28px 28px;
  }

  /* ── Header ── */
  .pf-page-header {
    position:relative; z-index:1;
    padding:42px 0 28px; margin-bottom:28px;
    border-bottom:1px solid rgba(255,255,255,0.1);
    display:flex; align-items:flex-end; justify-content:space-between; gap:16px;
    animation:fadeUp .5s ease both;
  }
  .pf-kicker { display:inline-flex; align-items:center; gap:10px; margin-bottom:14px; }
  .pf-kicker-line { width:28px; height:1.5px; background:var(--b400); border-radius:2px; opacity:.8; }
  .pf-kicker-text { font-size:11px; font-weight:600; letter-spacing:.18em; text-transform:uppercase; color:var(--b300); }
  .pf-kicker-dot {
    width:5px; height:5px; border-radius:50%; background:var(--b400);
    animation:blink 2.4s ease-in-out infinite;
    box-shadow:0 0 0 3px rgba(96,165,250,0.25);
  }
  .pf-page-title {
    font-family:var(--font-display);
    font-size:clamp(26px,3.2vw,40px); font-weight:800;
    color:#fff; margin:0; line-height:1.05; letter-spacing:-.04em;
  }
  .pf-back-btn {
    display:inline-flex; align-items:center; gap:7px;
    padding:10px 18px; border-radius:var(--r);
    background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.75);
    border:1px solid rgba(255,255,255,0.14);
    font-family:var(--font-display); font-size:12px; font-weight:700;
    cursor:pointer; transition:all .15s; white-space:nowrap;
    letter-spacing:.04em; text-transform:uppercase; backdrop-filter:blur(8px);
  }
  .pf-back-btn:hover { background:rgba(255,255,255,0.14); color:#fff; }

  /* ── Layout ── */
  .pf-layout {
    position:relative; z-index:1;
    display:grid; grid-template-columns:300px 1fr;
    gap:20px; align-items:start;
  }

  /* ── Identity card ── */
  .pf-identity {
    background:var(--white); border:1px solid var(--border);
    border-radius:var(--r-xl); overflow:hidden;
    box-shadow:0 1px 3px rgba(15,23,42,0.05);
    animation:fadeUp .5s ease both .08s;
    transition:border-color .2s, box-shadow .25s;
  }
  .pf-identity:hover { border-color:rgba(37,99,235,0.14); box-shadow:0 8px 28px rgba(37,99,235,0.09); }

  .pf-avatar-band {
    padding:32px 24px 24px;
    background:linear-gradient(175deg,#050f2b 0%,#0d1f4a 100%);
    display:flex; flex-direction:column; align-items:center;
    position:relative; overflow:hidden; text-align:center;
  }
  .pf-avatar-band::before {
    content:''; position:absolute; inset:0;
    background-image:radial-gradient(circle,rgba(59,130,246,0.15) 1px,transparent 1px);
    background-size:20px 20px; pointer-events:none;
    mask-image:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,.5) 0%,transparent 70%);
    -webkit-mask-image:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,.5) 0%,transparent 70%);
  }

  /* Clickable avatar */
  .pf-avatar-wrap {
    position:relative; margin-bottom:14px; z-index:1;
    cursor:pointer;
  }
  .pf-avatar-wrap:hover .pf-avatar-overlay { opacity:1; }
  .pf-avatar-wrap:hover .pf-avatar { box-shadow:0 6px 26px rgba(37,99,235,0.55); }

  .pf-avatar {
    width:80px; height:80px; border-radius:22px;
    background:linear-gradient(135deg,var(--b500),var(--b700));
    color:#fff; font-size:28px; font-weight:800;
    display:flex; align-items:center; justify-content:center;
    font-family:var(--font-display); letter-spacing:-.02em;
    border:3px solid rgba(255,255,255,0.15);
    box-shadow:0 6px 22px rgba(37,99,235,0.35);
    position:relative; overflow:hidden; flex-shrink:0;
    transition:box-shadow .2s;
  }
  .pf-avatar img { width:100%; height:100%; object-fit:cover; display:block; }

  .pf-avatar-overlay {
    position:absolute; inset:0; border-radius:22px;
    background:rgba(2,12,40,0.72);
    display:flex; flex-direction:column; align-items:center; justify-content:center;
    gap:3px; opacity:0; transition:opacity .18s; backdrop-filter:blur(2px);
  }
  .pf-avatar-overlay-icon { font-size:18px; line-height:1; }
  .pf-avatar-overlay-text {
    font-size:8.5px; font-weight:700; letter-spacing:.09em;
    text-transform:uppercase; color:rgba(255,255,255,0.9);
    font-family:var(--font-display);
  }

  /* Progress ring */
  .pf-avatar-ring { position:absolute; inset:-5px; border-radius:27px; pointer-events:none; }
  .pf-avatar-ring svg { width:100%; height:100%; transform:rotate(-90deg); }
  .pf-ring-track { fill:none; stroke:rgba(255,255,255,0.12); stroke-width:2.5; }
  .pf-ring-fill  { fill:none; stroke:var(--b400); stroke-width:2.5; stroke-linecap:round; transition:stroke-dashoffset .3s linear; }

  .pf-upload-status {
    font-size:10px; font-weight:600; color:rgba(255,255,255,0.6);
    letter-spacing:.08em; text-transform:uppercase; font-family:var(--font-display);
    animation:pulse 1.4s ease-in-out infinite; margin-top:2px; position:relative; z-index:1;
  }

  .pf-id-name {
    font-family:var(--font-display); font-size:17px; font-weight:800; color:#fff;
    letter-spacing:-.03em; margin-bottom:8px; position:relative; z-index:1;
  }
  .pf-role-badge {
    display:inline-flex; align-items:center; gap:5px;
    padding:4px 12px; border-radius:100px;
    font-size:10.5px; font-weight:700; letter-spacing:.08em; text-transform:capitalize;
    font-family:var(--font-display); position:relative; z-index:1;
    border:1px solid rgba(255,255,255,0.18);
    background:rgba(255,255,255,0.1); color:rgba(255,255,255,0.8);
    backdrop-filter:blur(4px);
  }

  .pf-identity-meta { padding:20px 22px; display:flex; flex-direction:column; }
  .pf-meta-row {
    display:flex; align-items:center; gap:12px;
    padding:12px 0; border-bottom:1px solid var(--surface-2);
  }
  .pf-meta-row:last-child { border-bottom:none; }
  .pf-meta-icon {
    width:32px; height:32px; border-radius:8px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; font-size:13px;
  }
  .pf-meta-icon.blue  { background:var(--b50); border:1px solid var(--b200); }
  .pf-meta-icon.green { background:var(--green-lt); border:1px solid var(--green-mid); }
  .pf-meta-label {
    font-size:10px; font-weight:700; letter-spacing:.09em; text-transform:uppercase;
    color:var(--ink-4); margin-bottom:2px; font-family:var(--font-display);
  }
  .pf-meta-value { font-size:13px; font-weight:500; color:var(--ink-2); }

  /* ── Details card ── */
  .pf-details {
    background:var(--white); border:1px solid var(--border);
    border-radius:var(--r-xl); overflow:hidden;
    box-shadow:0 1px 3px rgba(15,23,42,0.05);
    animation:fadeUp .5s ease both .14s;
    transition:border-color .2s, box-shadow .25s; position:relative;
  }
  .pf-details::after {
    content:''; position:absolute; top:0; right:0; width:200px; height:200px;
    background:radial-gradient(ellipse at 100% 0%,rgba(37,99,235,0.04) 0%,transparent 70%);
    pointer-events:none;
  }
  .pf-details:hover { border-color:rgba(37,99,235,0.14); box-shadow:0 8px 28px rgba(37,99,235,0.09); }

  .pf-details-header {
    padding:20px 26px 18px; border-bottom:1px solid var(--border);
    background:var(--surface); display:flex; align-items:center; gap:10px;
  }
  .pf-details-pip { width:3px; height:14px; background:linear-gradient(180deg,var(--b500),var(--b400)); border-radius:2px; flex-shrink:0; }
  .pf-details-title {
    font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase;
    color:var(--ink-3); font-family:var(--font-display);
  }
  .pf-edit-toggle {
    margin-left:auto; display:inline-flex; align-items:center; gap:6px;
    padding:6px 13px; border-radius:var(--r);
    background:var(--b50); color:var(--b600); border:1px solid var(--b200);
    font-family:var(--font-display); font-size:11px; font-weight:700;
    cursor:pointer; transition:all .15s; letter-spacing:.04em; text-transform:uppercase;
  }
  .pf-edit-toggle:hover { background:var(--b100); border-color:var(--b300); }

  .pf-fields { padding:22px 26px; display:flex; flex-direction:column; gap:20px; }
  .pf-field  { display:flex; flex-direction:column; gap:7px; }
  .pf-field-label {
    font-size:10px; font-weight:800; letter-spacing:.12em; text-transform:uppercase;
    color:var(--ink-4); font-family:var(--font-display);
    display:flex; align-items:center; gap:8px;
  }
  .pf-field-label::before {
    content:''; display:block; width:3px; height:11px;
    background:var(--b400); border-radius:2px; opacity:.6;
  }
  .pf-field-value {
    font-size:15px; font-weight:400; color:var(--ink);
    padding:10px 14px; border-radius:var(--r);
    background:var(--surface); border:1px solid var(--border);
  }

  .pf-input {
    font-size:14px; font-weight:400; color:var(--ink);
    padding:10px 14px; border-radius:var(--r);
    background:var(--white); border:1.5px solid var(--border-2);
    font-family:var(--font-body); outline:none; width:100%;
    transition:border-color .15s, box-shadow .15s;
  }
  .pf-input:focus  { border-color:var(--b500); box-shadow:0 0 0 3px rgba(59,130,246,0.1); }
  .pf-input:disabled { opacity:.5; cursor:not-allowed; }

  .pf-field-note {
    font-size:11px; color:var(--ink-4); font-family:var(--font-display); font-weight:500; margin-top:2px;
  }

  .pf-role-row {
    display:flex; align-items:center; gap:10px; padding:10px 14px;
    border-radius:var(--r); background:var(--surface); border:1px solid var(--border);
  }
  .pf-role-dot  { width:7px; height:7px; border-radius:50%; background:var(--b500); flex-shrink:0; }
  .pf-role-text { font-size:14px; color:var(--ink-2); text-transform:capitalize; }
  .pf-role-lock { font-size:11px; color:var(--ink-5); margin-left:auto; font-weight:500; }

  .pf-divider { height:1px; background:var(--border); margin:4px 0; }

  .pf-pw-link {
    display:inline-flex; align-items:center; gap:6px;
    font-size:12px; font-weight:600; color:var(--b600);
    cursor:pointer; font-family:var(--font-display); letter-spacing:.02em;
    transition:color .15s; text-decoration:none;
  }
  .pf-pw-link:hover { color:var(--b700); text-decoration:underline; }

  .pf-actions {
    padding:20px 26px; border-top:1px solid var(--border);
    display:flex; gap:10px; justify-content:flex-end; align-items:center;
  }
  .pf-saving-dot {
    font-size:11px; color:var(--ink-4); font-family:var(--font-display);
    font-weight:600; letter-spacing:.06em; animation:pulse 1.2s ease-in-out infinite;
    margin-right:auto;
  }

  .pf-btn-primary {
    position:relative; overflow:hidden;
    display:inline-flex; align-items:center; gap:7px;
    padding:11px 24px; border-radius:var(--r);
    background:linear-gradient(135deg,var(--b500),var(--b700)); color:#fff;
    font-family:var(--font-display); font-size:12px; font-weight:700;
    border:none; cursor:pointer; transition:all .15s;
    letter-spacing:.04em; text-transform:uppercase;
    box-shadow:0 3px 14px rgba(37,99,235,0.28),inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .pf-btn-primary::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);
    animation:shimmer 2.8s ease-in-out infinite; pointer-events:none;
  }
  .pf-btn-primary:hover:not(:disabled) {
    box-shadow:0 6px 22px rgba(37,99,235,0.38),inset 0 1px 0 rgba(255,255,255,0.15);
    transform:translateY(-1px);
  }
  .pf-btn-primary:disabled { opacity:.6; cursor:not-allowed; }

  .pf-btn-ghost {
    display:inline-flex; align-items:center; gap:7px;
    padding:11px 20px; border-radius:var(--r);
    background:var(--white); color:var(--ink-2); border:1px solid var(--border-2);
    font-family:var(--font-display); font-size:12px; font-weight:700;
    cursor:pointer; transition:all .15s; letter-spacing:.04em; text-transform:uppercase;
  }
  .pf-btn-ghost:hover:not(:disabled) { background:var(--surface); border-color:var(--ink-4); }
  .pf-btn-ghost:disabled { opacity:.5; cursor:not-allowed; }

  /* Toast */
  .pf-toast {
    position:fixed; bottom:28px; right:28px; z-index:9999;
    display:flex; align-items:center; gap:10px;
    padding:12px 18px; border-radius:var(--r-lg);
    font-family:var(--font-display); font-size:12.5px; font-weight:700;
    letter-spacing:.03em; box-shadow:0 8px 32px rgba(15,23,42,0.18);
    animation:fadeUp .3s ease both; max-width:320px;
  }
  .pf-toast.success { background:var(--green-lt); color:var(--green); border:1px solid var(--green-mid); }
  .pf-toast.error   { background:var(--red-lt);   color:var(--red);   border:1px solid #fecaca; }

  @media (max-width:860px) {
    .pf-root { padding:0 20px 60px; }
    .pf-layout { grid-template-columns:1fr; }
    .pf-page-header { flex-direction:column; align-items:flex-start; gap:12px; }
    .pf-toast { bottom:16px; right:16px; left:16px; }
  }
`;

/* ── Helpers ─────────────────────────────────────────────── */
function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

/* ── Progress ring ───────────────────────────────────────── */
function ProgressRing({ progress }) {
  const size = 90;
  const r    = size / 2 - 4;
  const circ = 2 * Math.PI * r;
  return (
    <div className="pf-avatar-ring">
      <svg viewBox={`0 0 ${size} ${size}`}>
        <rect className="pf-ring-track" x="4" y="4" width={size - 8} height={size - 8} rx="19" />
        <rect
          className="pf-ring-fill"
          x="4" y="4" width={size - 8} height={size - 8} rx="19"
          style={{ strokeDasharray: circ, strokeDashoffset: circ - (progress / 100) * circ }}
        />
      </svg>
    </div>
  );
}

/* ── Toast ───────────────────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  React.useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`pf-toast ${type}`}>
      <span>{type === "success" ? "✓" : "✕"}</span>
      <span>{msg}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export default function Profile() {
  const { user } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  /* edit state */
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm]       = useState({ name: user?.name || "" });
  // NOTE: email is NOT editable — your updateProfile controller only
  // accepts `name`. Email changes would need a separate verify flow.

  /* avatar state */
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading,     setUploading]     = useState(false);
  const [uploadPct,     setUploadPct]     = useState(0);

  /* toast */
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = "success") => setToast({ msg, type });

  /* computed */
  // Your avatar shape in MongoDB: { url: String, publicId: String }
  const avatarUrl = avatarPreview || user?.avatar?.url || null;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  /* ── Avatar upload ──────────────────────────────────────── */
  // Route:   POST /api/users/avatar          (userController → uploadUserAvatar)
  // Multer:  uploadAvatar.single("avatar")   (field name = "avatar")
  // Returns: { success, data: { avatar: { url, publicId } }, message }
  const handleAvatarClick = () => { if (!uploading) fileRef.current?.click(); };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.", "error"); return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be under 5 MB.", "error"); return;
    }

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setUploading(true);
    setUploadPct(0);

    try {
      const formData = new FormData();
      formData.append("avatar", file); // must match uploadAvatar.single("avatar")

      const avatarUrl2 = `${API_BASE}/users/avatar`;
      console.log("[avatar upload] POST", avatarUrl2); // confirm URL in devtools

      const data = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", avatarUrl2);
        xhr.setRequestHeader("Authorization", `Bearer ${getToken()}`);

        xhr.upload.onprogress = ev => {
          if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)); }
            catch { reject(new Error("Invalid JSON response")); }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new Error(err.message || `Upload failed (${xhr.status})`));
            } catch { reject(new Error(`Upload failed (${xhr.status})`)); }
          }
        };
        xhr.onerror = () => reject(new Error("Network error — check your connection."));
        xhr.send(formData);
      });

      // successResponse shape: { success: true, data: { avatar: { url, publicId } } }
      const newAvatar = data.data?.avatar;
      URL.revokeObjectURL(localUrl);
      setAvatarPreview(newAvatar?.url || null);

      // Sync Redux so header/sidebar avatars update immediately
      dispatch(setUser({ ...user, avatar: newAvatar }));

      showToast("Profile photo updated!");
    } catch (err) {
      console.error("[avatar upload]", err);
      setAvatarPreview(null); // revert preview on failure
      showToast(err.message || "Upload failed. Try again.", "error");
    } finally {
      setUploading(false);
      setUploadPct(0);
      e.target.value = ""; // allow re-picking same file
    }
  };

  /* ── Profile save ───────────────────────────────────────── */
  // Route:   PUT /api/auth/me                (authController → updateProfile)
  // Body:    { name }
  // Returns: { success, data: { user: SafeObject }, message }
  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) { showToast("Name cannot be empty.", "error"); return; }
    if (form.name.trim() === user?.name) { setEditing(false); return; } // unchanged — skip API call

    setSaving(true);
    try {
      const url = `${API_BASE}/auth/me`;
      console.log("[profile save] PUT", url); // confirm URL in devtools
      const res = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ name: form.name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `Server error (${res.status})`);

      // Handle both response shapes defensively:
      // successResponse wraps as { success, data: { user } }
      // but login thunk reads p?.user flat — support both
      const updatedUser = data?.data?.user ?? data?.user ?? null;
      if (updatedUser) dispatch(setUser(updatedUser));

      showToast("Profile saved!");
      setEditing(false);
    } catch (err) {
      console.error("[profile save]", err);
      showToast(err.message || "Save failed. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({ name: user?.name || "" });
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <>
      <style>{css}</style>

      {/* Hidden file input — field name "avatar" matches multer config */}
      <input
        ref={fileRef} type="file" accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="pf-root">
        <div className="pf-body-grid" />
        <div className="pf-hero" />

        {/* Page header */}
        <div className="pf-page-header">
          <div>
            <div className="pf-kicker">
              <div className="pf-kicker-line" />
              <span className="pf-kicker-text">Account</span>
              <div className="pf-kicker-dot" />
            </div>
            <h1 className="pf-page-title">My Profile</h1>
          </div>
          <button className="pf-back-btn" onClick={() => navigate("/dashboard")}>
            ← Dashboard
          </button>
        </div>

        <div className="pf-layout">

          {/* ── Identity card (left) ── */}
          <div className="pf-identity">
            <div className="pf-avatar-band">

              <div
                className="pf-avatar-wrap"
                onClick={handleAvatarClick}
                title="Click to change profile photo"
              >
                <div className="pf-avatar">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={user?.name}
                        onError={e => { e.currentTarget.style.display = "none"; }} />
                    : initials(user?.name)
                  }
                  {!uploading && (
                    <div className="pf-avatar-overlay">
                      <span className="pf-avatar-overlay-icon">📷</span>
                      <span className="pf-avatar-overlay-text">Change</span>
                    </div>
                  )}
                </div>
                {uploading && <ProgressRing progress={uploadPct} />}
              </div>

              {uploading && (
                <div className="pf-upload-status">Uploading… {uploadPct}%</div>
              )}

              <div className="pf-id-name">{user?.name || "—"}</div>
              <div className="pf-role-badge">{user?.role || "student"}</div>
            </div>

            <div className="pf-identity-meta">
              <div className="pf-meta-row">
                <div className="pf-meta-icon blue">✉️</div>
                <div>
                  <div className="pf-meta-label">Email</div>
                  <div className="pf-meta-value">{user?.email || "—"}</div>
                </div>
              </div>
              {memberSince && (
                <div className="pf-meta-row">
                  <div className="pf-meta-icon green">📅</div>
                  <div>
                    <div className="pf-meta-label">Member since</div>
                    <div className="pf-meta-value">{memberSince}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Details card (right) ── */}
          <div className="pf-details">
            <div className="pf-details-header">
              <div className="pf-details-pip" />
              <span className="pf-details-title">Profile Details</span>
              {!editing && (
                <button className="pf-edit-toggle" onClick={() => setEditing(true)}>
                  ✏ Edit
                </button>
              )}
            </div>

            <div className="pf-fields">

              {/* Name — editable */}
              <div className="pf-field">
                <div className="pf-field-label">Full Name</div>
                {editing
                  ? <input
                      className="pf-input" name="name"
                      value={form.name} onChange={handleChange}
                      disabled={saving} placeholder="Your full name"
                      autoFocus
                    />
                  : <div className="pf-field-value">{user?.name || "—"}</div>
                }
              </div>

              {/* Email — display only (controller doesn't accept email changes) */}
              <div className="pf-field">
                <div className="pf-field-label">Email Address</div>
                <div className="pf-field-value">{user?.email || "—"}</div>
                {editing && (
                  <span className="pf-field-note">
                    Email cannot be changed here. Contact support if needed.
                  </span>
                )}
              </div>

              {/* Role — always read-only */}
              <div className="pf-field">
                <div className="pf-field-label">Role</div>
                <div className="pf-role-row">
                  <div className="pf-role-dot" />
                  <span className="pf-role-text">{user?.role || "student"}</span>
                  <span className="pf-role-lock">Read-only</span>
                </div>
              </div>

              {/* Change password shortcut (view mode only) */}
              {!editing && (
                <>
                  <div className="pf-divider" />
                  <div className="pf-field">
                    <div className="pf-field-label">Password</div>
                    <a className="pf-pw-link" onClick={() => navigate("/change-password")}>
                      🔑 Change password →
                    </a>
                  </div>
                </>
              )}
            </div>

            {editing && (
              <div className="pf-actions">
                {saving && <span className="pf-saving-dot">Saving…</span>}
                <button className="pf-btn-ghost" onClick={handleCancel} disabled={saving}>
                  Cancel
                </button>
                <button className="pf-btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}