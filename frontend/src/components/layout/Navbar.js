import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';
import logo from '../../assets/logo.png';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --b50:  #e8f0fe;
    --b100: #c5d8fc;
    --b200: #93b8fa;
    --b300: #5c94f5;
    --b400: #4285f4;
    --b500: #1a6bf0;
    --b600: #1558d0;
    --b800: #0a3580;
    --b900: #061e54;
    --hero-bg: #050f2b;

    --ink:      #111110;
    --ink-2:    #3d3c39;
    --ink-3:    #6e6b64;
    --ink-4:    #a09d95;
    --ink-5:    #ccc9c1;

    --surface:   #f8f8f6;
    --surface-2: #f2f1ee;
    --border:    #e5e3de;
    --border-2:  #d6d3cc;
    --white:     #ffffff;

    --danger:    #be123c;
    --danger-lt: #fff1f3;
    --amber:     #b45309;
    --amber-lt:  #fffbeb;

    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; }

  @keyframes navShimmer {
    0%   { transform: translateX(-100%); }
    100% { transform: translateX(250%); }
  }
  @keyframes navFadeDown {
    from { opacity: 0; transform: translateY(-14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes navDropIn {
    from { opacity: 0; transform: translateY(-8px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes navDrawerIn {
    from { opacity: 0; transform: translateX(28px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes navBlink {
    0%,100% { opacity: 1;  }
    50%      { opacity: .3; }
  }
  @keyframes navGradShift {
    0%,100% { background-position: 0% 50%; }
    50%      { background-position: 100% 50%; }
  }

  /* ══════════════════════════════════════════
     STICKY WRAP — gives the floating pill room
  ══════════════════════════════════════════ */
 .navbar-wrap {
    position: sticky; top: 0; z-index: 500;
  }

  /* ══════════════════════════════════════════
     FLOATING GLASS NAVBAR
  ══════════════════════════════════════════ */
  .navbar {
    position: relative;
    width: 100%;
    display: flex; align-items: center; justify-content: space-between;
    gap: 20px;
    padding: 12px 36px;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border-bottom: 1px solid rgba(66,133,244,0.12);
    box-shadow: 0 1px 0 rgba(66,133,244,0.06), 0 6px 24px rgba(5,15,43,0.05);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    animation: navFadeDown .4s ease both;
  }

  /* ── Logo ── */
  .nav-logo {
    display: flex; align-items: center; gap: 10px;
    text-decoration: none; flex-shrink: 0; user-select: none;
  }
  .nav-logo:hover { text-decoration: none; }
  .nav-logo-mark {
    width: 36px; height: 36px; border-radius: 11px;
    background: linear-gradient(135deg, var(--b400), var(--b600));
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 14px rgba(66,133,244,.42), inset 0 1px 0 rgba(255,255,255,.25);
    flex-shrink: 0; overflow: hidden;
  }
  .nav-logo-mark img { width: 20px; height: 20px; object-fit: contain; filter: brightness(0) invert(1); }
  .nav-logo-text {
    font-family: var(--font-display);
    font-size: 16.5px; font-weight: 800; color: var(--ink);
    letter-spacing: -.03em; line-height: 1;
    display: none;
  }
  .nav-logo-text span { color: var(--b600); }
  @media (min-width: 900px) { .nav-logo-text { display: block; } }

  /* ── Center pill links ── */
  .nav-links {
    display: flex; align-items: center; gap: 3px;
    background: rgba(66,133,244,0.06);
    border: 1px solid rgba(66,133,244,0.1);
    border-radius: 100px; padding: 4px;
  }
  .nav-link {
    position: relative;
    padding: 8px 18px; border-radius: 100px;
    font-size: 13.5px; font-weight: 500; color: var(--ink-3);
    text-decoration: none; white-space: nowrap; letter-spacing: -.01em;
    font-family: var(--font-body);
    transition: color .18s;
  }
  .nav-link:hover { color: var(--ink); text-decoration: none; }
  .nav-link.active {
    color: var(--white); font-weight: 600;
    background: linear-gradient(135deg, var(--b400), var(--b600));
    box-shadow: 0 4px 14px rgba(66,133,244,.35);
  }

  .nav-link-admin {
    display: flex; align-items: center; gap: 5px;
    padding: 8px 16px 8px 14px; border-radius: 100px;
    font-size: 13px; font-weight: 700; color: var(--amber);
    background: var(--amber-lt); text-decoration: none;
    letter-spacing: -.01em; font-family: var(--font-display);
    border: 1px solid #fde68a;
    transition: background .16s, transform .14s;
  }
  .nav-link-admin:hover { background: #fde68a; transform: translateY(-1px); text-decoration: none; color: var(--amber); }

  /* ── Right side ── */
  .nav-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  .btn-nav-login {
    font-family: var(--font-body); font-size: 13.5px; font-weight: 500;
    color: var(--ink-3); background: transparent; border: none;
    padding: 9px 16px; cursor: pointer; text-decoration: none;
    border-radius: 100px;
    transition: color .16s, background .16s;
  }
  .btn-nav-login:hover { color: var(--ink); background: var(--surface-2); text-decoration: none; }

  .btn-nav-signup {
    position: relative; overflow: hidden;
    display: inline-flex; align-items: center; gap: 7px;
    font-family: var(--font-display); font-size: 12.5px; font-weight: 700;
    color: white; border: none;
    border-radius: 100px; padding: 10px 20px 10px 22px; cursor: pointer;
    text-decoration: none;
    background: linear-gradient(135deg, var(--b400) 0%, var(--b600) 100%);
    letter-spacing: .04em; text-transform: uppercase;
    box-shadow: 0 6px 20px rgba(66,133,244,.4), inset 0 1px 0 rgba(255,255,255,.2);
    transition: box-shadow .2s, transform .15s;
  }
  .btn-nav-signup::after {
    content: '';
    position: absolute; top: 0; left: 0; width: 35%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.28), transparent);
    animation: navShimmer 3.2s ease-in-out infinite 1s;
  }
  .btn-nav-signup:hover {
    box-shadow: 0 10px 28px rgba(66,133,244,.5), inset 0 1px 0 rgba(255,255,255,.2);
    transform: translateY(-1px);
    text-decoration: none; color: white;
  }
  .btn-nav-signup svg { width: 12px; height: 12px; }

  /* ── User button ── */
  .nav-user { position: relative; }

  .nav-user-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 4px 14px 4px 4px;
    border-radius: 100px;
    border: 1px solid rgba(66,133,244,0.16);
    background: var(--white); cursor: pointer;
    transition: background .16s, border-color .16s, box-shadow .16s;
  }
  .nav-user-btn:hover {
    background: var(--surface);
    border-color: rgba(66,133,244,0.3);
    box-shadow: 0 4px 16px rgba(66,133,244,.14);
  }

  .nav-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: white; flex-shrink: 0;
    font-family: var(--font-display);
    box-shadow: 0 0 0 2px var(--white), 0 0 0 3.5px rgba(66,133,244,.35);
    overflow: hidden;
  }
  .nav-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .nav-user-name {
    font-size: 13.5px; font-weight: 600; color: var(--ink);
    max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font-family: var(--font-body);
  }
  .nav-chevron {
    color: var(--ink-4); display: flex; align-items: center;
    transition: transform .2s;
  }
  .nav-chevron.open { transform: rotate(180deg); }

  /* ── Dropdown ── */
  .nav-dropdown {
    position: absolute; top: calc(100% + 12px); right: 0;
    min-width: 260px;
    background: var(--white);
    border: 1px solid rgba(66,133,244,0.14);
    border-radius: 20px;
    box-shadow: 0 20px 50px rgba(5,15,43,.16), 0 4px 14px rgba(5,15,43,.08);
    overflow: hidden;
    animation: navDropIn .16s cubic-bezier(.22,1,.36,1);
    z-index: 600;
  }

  .nav-dropdown-header {
    position: relative; overflow: hidden;
    padding: 20px 20px 16px;
    background: var(--hero-bg);
  }
  .nav-dropdown-header::before {
    content: '';
    position: absolute; inset: 0;
    background:
      radial-gradient(ellipse 80% 60% at 100% 0%, rgba(66,133,244,.35) 0%, transparent 60%);
    pointer-events: none;
  }
  .nav-dropdown-avatar-row {
    position: relative; z-index: 1;
    display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
  }
  .nav-dropdown-avatar-lg {
    width: 42px; height: 42px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: white; flex-shrink: 0;
    font-family: var(--font-display);
    box-shadow: 0 0 0 2.5px rgba(255,255,255,.15);
    overflow: hidden;
  }
  .nav-dropdown-avatar-lg img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .nav-dropdown-name {
    font-family: var(--font-display);
    font-size: 15px; font-weight: 700; color: var(--white); letter-spacing: -.03em;
  }
  .nav-dropdown-email {
    font-size: 12px; color: rgba(255,255,255,.4); margin-top: 2px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 170px;
  }

  .nav-role-badge {
    position: relative; z-index: 1;
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10.5px; font-weight: 700; letter-spacing: .08em;
    text-transform: uppercase; padding: 5px 11px; border-radius: 100px;
    font-family: var(--font-display);
    background: rgba(255,255,255,.1); color: rgba(255,255,255,.7);
    border: 1px solid rgba(255,255,255,.14);
  }
  .nav-role-badge-admin { background: rgba(251,191,36,.15); color: #fcd34d; border-color: rgba(252,211,77,.25); }
  .nav-role-badge-student { background: rgba(66,133,244,.18); color: var(--b200); border-color: rgba(66,133,244,.3); }

  .nav-dropdown-label {
    font-size: 10.5px; font-weight: 700; letter-spacing: .09em;
    text-transform: uppercase; color: var(--ink-5);
    padding: 12px 14px 4px; font-family: var(--font-display);
  }

  .nav-dropdown-section { padding: 6px; }

  .nav-dropdown-item {
    display: flex; align-items: center; gap: 11px;
    padding: 10px 12px;
    font-size: 13.5px; font-weight: 500; color: var(--ink-2);
    text-decoration: none; border: none; background: none;
    width: 100%; cursor: pointer; font-family: var(--font-body);
    text-align: left; border-radius: 12px;
    transition: background .14s, color .14s;
  }
  .nav-dropdown-item:hover { background: var(--b50); color: var(--b600); text-decoration: none; }

  .nav-dropdown-item-icon {
    width: 30px; height: 30px; border-radius: 9px;
    background: var(--surface-2); display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; color: var(--ink-3);
    transition: background .14s, color .14s;
  }
  .nav-dropdown-item:hover .nav-dropdown-item-icon { background: var(--b100); color: var(--b600); }

  .nav-dropdown-divider { height: 1px; background: var(--border); margin: 4px 6px; }

  .nav-dropdown-item-danger { color: var(--danger); }
  .nav-dropdown-item-danger:hover { background: var(--danger-lt); color: var(--danger); }
  .nav-dropdown-item-danger:hover .nav-dropdown-item-icon { background: #ffd7e0; color: var(--danger); }

  /* ── Hamburger ── */
  .nav-hamburger {
    display: none; flex-direction: column; align-items: center; justify-content: center;
    gap: 4.5px; width: 40px; height: 40px;
    cursor: pointer; border: 1px solid rgba(66,133,244,0.16);
    background: var(--white); border-radius: 50%;
    transition: background .16s, border-color .16s;
    flex-shrink: 0;
  }
  .nav-hamburger:hover { background: var(--surface); border-color: rgba(66,133,244,0.3); }
  .nav-hamburger span {
    display: block; width: 16px; height: 1.5px;
    background: var(--ink-2); border-radius: 2px;
    transition: all .25s ease;
  }
  .nav-hamburger.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); background: var(--b600); }
  .nav-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .nav-hamburger.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); background: var(--b600); }

  /* ── Mobile Drawer — slide-in dark panel ── */
  .nav-drawer-backdrop {
    display: none;
    position: fixed; inset: 0; z-index: 550;
    background: rgba(5,15,43,.45);
    backdrop-filter: blur(3px);
  }
  .nav-drawer-backdrop.open { display: block; animation: navFadeDown .18s ease both; }

  .nav-drawer {
    display: none;
    position: fixed; top: 0; right: 0; bottom: 0; z-index: 560;
    width: min(340px, 86vw);
    background: var(--hero-bg);
    padding: 26px 20px 24px;
    overflow-y: auto;
    box-shadow: -24px 0 60px rgba(0,0,0,.35);
  }
  .nav-drawer::before {
    content: '';
    position: absolute; inset: 0; z-index: -1;
    background:
      radial-gradient(ellipse 70% 40% at 100% 0%, rgba(66,133,244,.22) 0%, transparent 60%),
      linear-gradient(rgba(66,133,244,.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(66,133,244,.045) 1px, transparent 1px);
    background-size: 100% 100%, 40px 40px, 40px 40px;
  }
  .nav-drawer.open { display: block; animation: navDrawerIn .22s cubic-bezier(.22,1,.36,1) both; }

  .nav-drawer-top { display: flex; justify-content: flex-end; margin-bottom: 18px; }
  .nav-drawer-close {
    width: 34px; height: 34px; border-radius: 50%;
    border: 1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.06);
    color: rgba(255,255,255,.7); display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: background .15s;
  }
  .nav-drawer-close:hover { background: rgba(255,255,255,.12); }

  .nav-drawer-user {
    display: flex; align-items: center; gap: 13px;
    padding: 16px; border-radius: 16px; margin-bottom: 22px;
    background: rgba(255,255,255,.05);
    border: 1px solid rgba(255,255,255,.1);
  }
  .nav-drawer-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
    font-family: var(--font-display);
    box-shadow: 0 0 0 2px rgba(255,255,255,.15);
    overflow: hidden;
  }
  .nav-drawer-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .nav-drawer-user-name {
    font-family: var(--font-display); font-size: 15px; font-weight: 700;
    color: var(--white); letter-spacing: -.03em;
  }
  .nav-drawer-user-email { font-size: 12px; color: rgba(255,255,255,.35); margin-top: 2px; }

  .nav-drawer-label {
    font-size: 10.5px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    color: rgba(255,255,255,.25); font-family: var(--font-display);
    padding: 4px 6px 10px;
  }

  .nav-drawer-links { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }

  .nav-drawer-link {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; border-radius: 12px;
    font-size: 14.5px; font-weight: 500; color: rgba(255,255,255,.55);
    text-decoration: none;
    transition: background .14s, color .14s;
    font-family: var(--font-body);
  }
  .nav-drawer-link:hover { background: rgba(66,133,244,.12); color: var(--white); text-decoration: none; }
  .nav-drawer-link.active {
    background: linear-gradient(135deg, var(--b400), var(--b600));
    color: var(--white); font-weight: 600;
    box-shadow: 0 4px 14px rgba(66,133,244,.35);
  }
  .nav-drawer-link.admin { color: #fcd34d; }
  .nav-drawer-link.admin:hover { background: rgba(251,191,36,.12); color: #fcd34d; }

  .nav-drawer-divider { height: 1px; background: rgba(255,255,255,.08); margin: 14px 0; }

  .nav-drawer-logout {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 14px; border-radius: 12px;
    font-size: 14.5px; font-weight: 600; color: #fb7185;
    background: rgba(251,113,133,.08); border: 1px solid rgba(251,113,133,.18);
    width: 100%; cursor: pointer; font-family: var(--font-body); text-align: left;
    transition: background .14s;
  }
  .nav-drawer-logout:hover { background: rgba(251,113,133,.16); }

  .nav-drawer-auth { display: flex; flex-direction: column; gap: 10px; margin-top: 6px; }
  .btn-drawer-login, .btn-drawer-signup {
    font-family: var(--font-body); font-size: 14px; font-weight: 600;
    padding: 13px; border-radius: 12px; text-align: center;
    text-decoration: none; display: flex; align-items: center; justify-content: center;
    transition: all .16s;
  }
  .btn-drawer-login {
    color: rgba(255,255,255,.8); border: 1px solid rgba(255,255,255,.16); background: rgba(255,255,255,.05);
  }
  .btn-drawer-login:hover { background: rgba(255,255,255,.1); text-decoration: none; color: var(--white); }
  .btn-drawer-signup {
    position: relative; overflow: hidden;
    color: white; font-family: var(--font-display); font-weight: 700;
    letter-spacing: .03em; text-transform: uppercase; font-size: 12.5px;
    background: linear-gradient(135deg, var(--b400) 0%, var(--b600) 100%);
    border: none;
    box-shadow: 0 6px 20px rgba(66,133,244,.35);
  }
  .btn-drawer-signup::after {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent);
    animation: navShimmer 2.8s ease-in-out infinite;
  }
  .btn-drawer-signup:hover { text-decoration: none; color: white; transform: translateY(-1px); }

  @media (max-width: 900px) {
    .navbar { padding: 10px 20px; }
    .nav-links { display: none; }
    .nav-right { display: none; }
    .nav-hamburger { display: flex; }
  }
`;

// Icon components
const IconDashboard = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <rect x="3" y="3" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7"/>
    <rect x="11" y="3" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4"/>
    <rect x="3" y="11" width="6" height="6" rx="1.5" fill="currentColor" opacity=".4"/>
    <rect x="11" y="11" width="6" height="6" rx="1.5" fill="currentColor" opacity=".7"/>
  </svg>
);
const IconCourses = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <path d="M3 6h14M3 10h10M3 14h7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconProfile = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.6"/>
    <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const IconAdmin = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <path d="M10 2l2 4h4l-3.3 2.4 1.3 4L10 10 6 12.4l1.3-4L4 6h4z" stroke="currentColor" strokeWidth="1.4" fill="none"/>
  </svg>
);
const IconSignOut = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <path d="M13 4l4 4-4 4M17 8H8M10 13v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h3a2 2 0 012 2v2"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconArrow = () => (
  <svg viewBox="0 0 13 13" fill="none" width="12" height="12">
    <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconClose = () => (
  <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
    <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);
const LogoMark = () => (
  <img src={logo} alt="Logo" />
);

/* ── Avatar component — shows image if available, else initials ── */
function Avatar({ url, name, className, style, imgStyle }) {
  const [imgError, setImgError] = useState(false);

  const ini = name
    ? name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  // Reset error state if URL changes (e.g. after a new upload)
  useEffect(() => { setImgError(false); }, [url]);

  const showImage = url && !imgError;

  return (
    <div
      className={className}
      // Only apply gradient background when showing initials
      style={showImage ? { ...style, background: 'transparent' } : style}
    >
      {showImage ? (
        <img
          src={url}
          alt={name || 'User avatar'}
          style={imgStyle || { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setImgError(true)}
        />
      ) : ini}
    </div>
  );
}

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, sessionId } = useSelector(s => s.auth);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMobileOpen(false);
    dispatch(logout(sessionId));
    navigate('/login');
  };

  const isActive = path =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

  // Avatar URL from user object (set by Profile page after upload)
  const avatarUrl = user?.avatar?.url || null;

  const avatarGradient = isAdmin
    ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)' }
    : { background: 'linear-gradient(135deg, var(--b400), var(--b600))' };

  const userBtnStyle = isAdmin
    ? { borderColor: 'rgba(245,158,11,0.30)', background: 'rgba(255,251,235,0.60)' }
    : undefined;

  const navLinks = [
    { label: 'Home',       path: '/' },
    { label: 'Courses',    path: '/courses' },
    ...(isStudent ? [
      { label: 'Dashboard',  path: '/dashboard' },
      { label: 'My Courses', path: '/my-courses' },
    ] : []),
  ];

  const dropdownItems = [
    ...(isStudent ? [
      { label: 'Dashboard',  path: '/dashboard',  Icon: IconDashboard },
      { label: 'My Courses', path: '/my-courses', Icon: IconCourses },
      { label: 'Profile',    path: '/profile',    Icon: IconProfile },
    ] : []),
    ...(isAdmin ? [
      { label: 'Admin Panel', path: '/admin', Icon: IconAdmin },
    ] : []),
  ];

  return (
    <>
      <style>{styles}</style>

      <div className="navbar-wrap">
        <nav className="navbar">
          {/* Logo */}
          <Link to="/" className="nav-logo">
            <div className="nav-logo-mark"><LogoMark /></div>
            <span className="nav-logo-text">Bright Learning <span>Academy</span></span>
          </Link>

          {/* Center links — desktop */}
          <div className="nav-links">
            {navLinks.map(({ label, path }) => (
              <Link key={path} to={path} className={`nav-link ${isActive(path) ? 'active' : ''}`}>
                {label}
              </Link>
            ))}
          </div>

          {/* Right — desktop */}
          <div className="nav-right">
            {isAdmin && (
              <Link to="/admin" className="nav-link-admin">
                <IconAdmin /> Admin
              </Link>
            )}

            {user ? (
              <div className="nav-user" ref={dropdownRef}>
                <button
                  className="nav-user-btn"
                  style={userBtnStyle}
                  onClick={() => setDropdownOpen(o => !o)}
                >
                  <Avatar
                    url={avatarUrl}
                    name={user.name}
                    className="nav-avatar"
                    style={avatarGradient}
                  />
                  <span className="nav-user-name">{user.name}</span>
                  <span className={`nav-chevron ${dropdownOpen ? 'open' : ''}`}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="nav-dropdown">
                    <div className="nav-dropdown-header">
                      <div className="nav-dropdown-avatar-row">
                        <Avatar
                          url={avatarUrl}
                          name={user.name}
                          className="nav-dropdown-avatar-lg"
                          style={avatarGradient}
                        />
                        <div>
                          <div className="nav-dropdown-name">{user.name}</div>
                          <div className="nav-dropdown-email">{user.email}</div>
                        </div>
                      </div>
                      <div className={`nav-role-badge ${isAdmin ? 'nav-role-badge-admin' : isStudent ? 'nav-role-badge-student' : ''}`}>
                        {isAdmin ? '⚡ ' : ''}{user.role}
                      </div>
                    </div>

                    {dropdownItems.length > 0 && (
                      <>
                        <div className="nav-dropdown-label">Navigation</div>
                        <div className="nav-dropdown-section">
                          {dropdownItems.map(({ label, path, Icon }) => (
                            <Link key={path} to={path} className="nav-dropdown-item">
                              <div className="nav-dropdown-item-icon"><Icon /></div>
                              {label}
                            </Link>
                          ))}
                        </div>
                        <div className="nav-dropdown-divider" />
                      </>
                    )}

                    <div className="nav-dropdown-section" style={{ paddingTop: 4 }}>
                      <button className="nav-dropdown-item nav-dropdown-item-danger" onClick={handleLogout}>
                        <div className="nav-dropdown-item-icon"><IconSignOut /></div>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="btn-nav-login">Sign in</Link>
                <Link to="/register" className="btn-nav-signup">
                  Get started <IconArrow />
                </Link>
              </>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button
            className={`nav-hamburger ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </nav>
      </div>

      {/* Mobile Drawer */}
      <div className={`nav-drawer-backdrop ${mobileOpen ? 'open' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className={`nav-drawer ${mobileOpen ? 'open' : ''}`}>
        <div className="nav-drawer-top">
          <button className="nav-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <IconClose />
          </button>
        </div>

        {user && (
          <div className="nav-drawer-user">
            <Avatar
              url={avatarUrl}
              name={user.name}
              className="nav-drawer-avatar"
              style={avatarGradient}
            />
            <div>
              <div className="nav-drawer-user-name">{user.name}</div>
              <div className="nav-drawer-user-email">{user.email}</div>
            </div>
          </div>
        )}

        <div className="nav-drawer-label">Navigate</div>
        <div className="nav-drawer-links">
          {navLinks.map(({ label, path }) => (
            <Link key={path} to={path} className={`nav-drawer-link ${isActive(path) ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="nav-drawer-link admin">⚡ Admin Panel</Link>
          )}
          {isStudent && (
            <Link to="/profile" className="nav-drawer-link">Profile</Link>
          )}
        </div>

        <div className="nav-drawer-divider" />

        {user ? (
          <button className="nav-drawer-logout" onClick={handleLogout}>
            <IconSignOut /> Sign out
          </button>
        ) : (
          <div className="nav-drawer-auth">
            <Link to="/login" className="btn-drawer-login">Sign in</Link>
            <Link to="/register" className="btn-drawer-signup">Get started</Link>
          </div>
        )}
      </div>
    </>
  );
}