import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

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
    --font-display:'Syne',sans-serif; --font-body:'DM Sans',sans-serif;
    --r:10px; --r-lg:16px; --r-xl:22px;
  }

  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

  @keyframes fadeUp  { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{left:-100%} 60%{left:150%} 100%{left:150%} }
  @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes spin    { to{transform:rotate(360deg)} }

  /* ══ Page shell ══ */
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

  /* Hero band */
  .pf-hero {
    position: absolute; top:0; left:0; right:0; height:260px; z-index:0;
    background: linear-gradient(175deg, #050f2b 0%, #0c1e4a 48%, transparent 100%);
    pointer-events: none;
  }
  .pf-hero::before {
    content:''; position:absolute; inset:0;
    background-image: radial-gradient(circle, rgba(59,130,246,0.18) 1px, transparent 1px);
    background-size: 26px 26px;
    mask-image: linear-gradient(180deg, rgba(0,0,0,.75) 0%, transparent 100%);
    -webkit-mask-image: linear-gradient(180deg, rgba(0,0,0,.75) 0%, transparent 100%);
  }
  .pf-hero::after {
    content:''; position:absolute; top:-80px; left:50%; transform:translateX(-50%);
    width:700px; height:500px;
    background: radial-gradient(ellipse at 50% 30%, rgba(59,130,246,0.2) 0%, transparent 70%);
  }

  /* Body dot grid */
  .pf-body-grid {
    position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image: radial-gradient(circle, rgba(37,99,235,0.04) 1px, transparent 1px);
    background-size: 28px 28px;
  }

  /* ══ Header row ══ */
  .pf-page-header {
    position:relative; z-index:1;
    padding: 42px 0 28px;
    margin-bottom: 28px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    display: flex; align-items: flex-end; justify-content: space-between; gap:16px;
    animation: fadeUp .5s ease both;
  }
  .pf-kicker {
    display:inline-flex; align-items:center; gap:10px; margin-bottom:14px;
  }
  .pf-kicker-line { width:28px; height:1.5px; background:var(--b400); border-radius:2px; opacity:.8; }
  .pf-kicker-text {
    font-size:11px; font-weight:600; letter-spacing:.18em;
    text-transform:uppercase; color:var(--b300);
  }
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

  /* ══ Layout ══ */
  .pf-layout {
    position:relative; z-index:1;
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 20px;
    align-items: start;
  }

  /* ══ Identity card (left) ══ */
  .pf-identity {
    background:var(--white); border:1px solid var(--border);
    border-radius:var(--r-xl); overflow:hidden;
    box-shadow:0 1px 3px rgba(15,23,42,0.05);
    animation: fadeUp .5s ease both .08s;
    transition: border-color .2s, box-shadow .25s;
  }
  .pf-identity:hover {
    border-color:rgba(37,99,235,0.14);
    box-shadow:0 8px 28px rgba(37,99,235,0.09);
  }

  /* Avatar band */
  .pf-avatar-band {
    padding: 32px 24px 24px;
    background: linear-gradient(175deg, #050f2b 0%, #0d1f4a 100%);
    display:flex; flex-direction:column; align-items:center; gap:0;
    position:relative; overflow:hidden;
    text-align:center;
  }
  .pf-avatar-band::before {
    content:''; position:absolute; inset:0;
    background-image:radial-gradient(circle,rgba(59,130,246,0.15) 1px,transparent 1px);
    background-size:20px 20px; pointer-events:none;
    mask-image:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,.5) 0%,transparent 70%);
    -webkit-mask-image:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,.5) 0%,transparent 70%);
  }

  .pf-avatar {
    width:80px; height:80px; border-radius:22px;
    background:linear-gradient(135deg,var(--b500),var(--b700));
    color:#fff; font-size:28px; font-weight:800;
    display:flex; align-items:center; justify-content:center;
    font-family:var(--font-display); letter-spacing:-.02em;
    border:3px solid rgba(255,255,255,0.15);
    box-shadow:0 6px 22px rgba(37,99,235,0.35);
    margin-bottom:14px; position:relative; z-index:1;
    overflow:hidden; flex-shrink:0;
  }
  .pf-avatar img { width:100%; height:100%; object-fit:cover; }

  .pf-id-name {
    font-family:var(--font-display);
    font-size:17px; font-weight:800; color:#fff;
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

  /* Identity meta rows */
  .pf-identity-meta {
    padding:20px 22px; display:flex; flex-direction:column; gap:0;
  }
  .pf-meta-row {
    display:flex; align-items:center; gap:12px;
    padding:12px 0; border-bottom:1px solid var(--surface-2);
  }
  .pf-meta-row:last-child { border-bottom:none; }
  .pf-meta-icon {
    width:32px; height:32px; border-radius:8px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center; font-size:13px;
  }
  .pf-meta-icon.blue   { background:var(--b50); border:1px solid var(--b200); }
  .pf-meta-icon.green  { background:var(--green-lt); border:1px solid var(--green-mid); }
  .pf-meta-label {
    font-size:10px; font-weight:700; letter-spacing:.09em; text-transform:uppercase;
    color:var(--ink-4); margin-bottom:2px; font-family:var(--font-display);
  }
  .pf-meta-value { font-size:13px; font-weight:500; color:var(--ink-2); }

  /* ══ Details card (right) ══ */
  .pf-details {
    background:var(--white); border:1px solid var(--border);
    border-radius:var(--r-xl); overflow:hidden;
    box-shadow:0 1px 3px rgba(15,23,42,0.05);
    animation: fadeUp .5s ease both .14s;
    transition: border-color .2s, box-shadow .25s;
    position:relative;
  }
  .pf-details::after {
    content:''; position:absolute; top:0; right:0; width:200px; height:200px;
    background:radial-gradient(ellipse at 100% 0%,rgba(37,99,235,0.04) 0%,transparent 70%);
    pointer-events:none;
  }
  .pf-details:hover {
    border-color:rgba(37,99,235,0.14);
    box-shadow:0 8px 28px rgba(37,99,235,0.09);
  }

  .pf-details-header {
    padding:20px 26px 18px;
    border-bottom:1px solid var(--border);
    background:var(--surface);
    display:flex; align-items:center; gap:10px;
  }
  .pf-details-pip { width:3px; height:14px; background:linear-gradient(180deg,var(--b500),var(--b400)); border-radius:2px; flex-shrink:0; }
  .pf-details-title {
    font-size:11px; font-weight:800; letter-spacing:.12em; text-transform:uppercase;
    color:var(--ink-3); font-family:var(--font-display);
  }
  .pf-edit-toggle {
    margin-left:auto;
    display:inline-flex; align-items:center; gap:6px;
    padding:6px 13px; border-radius:var(--r);
    background:var(--b50); color:var(--b600); border:1px solid var(--b200);
    font-family:var(--font-display); font-size:11px; font-weight:700;
    cursor:pointer; transition:all .15s; letter-spacing:.04em; text-transform:uppercase;
  }
  .pf-edit-toggle:hover { background:var(--b100); border-color:var(--b300); }

  .pf-fields { padding:22px 26px; display:flex; flex-direction:column; gap:20px; }

  .pf-field { display:flex; flex-direction:column; gap:7px; }
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
  .pf-field-value.muted { color:var(--ink-3); font-size:14px; }

  .pf-input {
    font-size:14px; font-weight:400; color:var(--ink);
    padding:10px 14px; border-radius:var(--r);
    background:var(--white); border:1.5px solid var(--border-2);
    font-family:var(--font-body); outline:none; width:100%;
    transition:border-color .15s, box-shadow .15s;
  }
  .pf-input:focus {
    border-color:var(--b500);
    box-shadow:0 0 0 3px rgba(59,130,246,0.1);
  }

  /* Read-only role row */
  .pf-role-row {
    display:flex; align-items:center; gap:10px;
    padding:10px 14px; border-radius:var(--r);
    background:var(--surface); border:1px solid var(--border);
  }
  .pf-role-dot {
    width:7px; height:7px; border-radius:50%; background:var(--b500); flex-shrink:0;
  }
  .pf-role-text { font-size:14px; color:var(--ink-2); text-transform:capitalize; }
  .pf-role-lock { font-size:11px; color:var(--ink-5); margin-left:auto; font-weight:500; }

  /* ── Footer actions ── */
  .pf-actions {
    padding:20px 26px;
    border-top:1px solid var(--border);
    display:flex; gap:10px; justify-content:flex-end;
  }

  .pf-btn-primary {
    position:relative; overflow:hidden;
    display:inline-flex; align-items:center; gap:7px;
    padding:11px 24px; border-radius:var(--r);
    background:linear-gradient(135deg,var(--b500),var(--b700)); color:#fff;
    font-family:var(--font-display); font-size:12px; font-weight:700;
    border:none; cursor:pointer; transition:all .15s;
    letter-spacing:.04em; text-transform:uppercase;
    box-shadow:0 3px 14px rgba(37,99,235,0.28), inset 0 1px 0 rgba(255,255,255,0.15);
  }
  .pf-btn-primary::after {
    content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);
    animation:shimmer 2.8s ease-in-out infinite; pointer-events:none;
  }
  .pf-btn-primary:hover {
    box-shadow:0 6px 22px rgba(37,99,235,0.38), inset 0 1px 0 rgba(255,255,255,0.15);
    transform:translateY(-1px);
  }

  .pf-btn-ghost {
    display:inline-flex; align-items:center; gap:7px;
    padding:11px 20px; border-radius:var(--r);
    background:var(--white); color:var(--ink-2); border:1px solid var(--border-2);
    font-family:var(--font-display); font-size:12px; font-weight:700;
    cursor:pointer; transition:all .15s;
    letter-spacing:.04em; text-transform:uppercase;
  }
  .pf-btn-ghost:hover { background:var(--surface); border-color:var(--ink-4); }

  @media (max-width:860px) {
    .pf-root { padding:0 20px 60px; }
    .pf-layout { grid-template-columns:1fr; }
    .pf-page-header { flex-direction:column; align-items:flex-start; gap:12px; }
  }
`;

function initials(name) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export default function Profile() {
  const { user }  = useSelector(s => s.auth);
  const navigate  = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({
    name:  user?.name  || "",
    email: user?.email || "",
  });

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = () => {
    // TODO: dispatch updateProfile thunk
    setEditing(false);
  };

  const avatarUrl = typeof user?.avatar === "string"
    ? user.avatar
    : user?.avatar?.url || null;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <>
      <style>{css}</style>
      <div className="pf-root">
        <div className="pf-body-grid" />
        <div className="pf-hero" />

        {/* ── Page header ── */}
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

        {/* ── Layout ── */}
        <div className="pf-layout">

          {/* Left — identity card */}
          <div className="pf-identity">
            <div className="pf-avatar-band">
              <div className="pf-avatar">
                {avatarUrl
                  ? <img src={avatarUrl} alt={user?.name}
                      onError={e => { e.currentTarget.style.display = "none"; }} />
                  : initials(user?.name)
                }
              </div>
              <div className="pf-id-name">{user?.name || "—"}</div>
              <div className="pf-role-badge">
                {user?.role || "student"}
              </div>
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

          {/* Right — editable details */}
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
              {/* Name */}
              <div className="pf-field">
                <div className="pf-field-label">Full Name</div>
                {editing
                  ? <input className="pf-input" name="name" value={form.name} onChange={handleChange} />
                  : <div className="pf-field-value">{user?.name || "—"}</div>
                }
              </div>

              {/* Email */}
              <div className="pf-field">
                <div className="pf-field-label">Email Address</div>
                {editing
                  ? <input className="pf-input" name="email" type="email" value={form.email} onChange={handleChange} />
                  : <div className="pf-field-value">{user?.email || "—"}</div>
                }
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
            </div>

            {/* Actions */}
            {editing && (
              <div className="pf-actions">
                <button className="pf-btn-ghost" onClick={() => { setEditing(false); setForm({ name: user?.name || "", email: user?.email || "" }); }}>
                  Cancel
                </button>
                <button className="pf-btn-primary" onClick={handleSave}>
                  Save Changes
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}