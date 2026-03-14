import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

const styles = `
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

    --ink:      #0f172a;
    --ink-2:    #334155;
    --ink-3:    #64748b;
    --ink-4:    #94a3b8;
    --ink-5:    #cbd5e1;

    --surface:   #f8fafc;
    --surface-2: #f1f5f9;
    --border:    rgba(15,23,42,0.08);
    --border-2:  rgba(15,23,42,0.14);
    --white:     #ffffff;

    --danger:    #be123c;
    --danger-lt: #fff1f2;

    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  /* ══ NAVBAR ══ */
  .navbar {
    position: sticky; top: 0; z-index: 200;
    height: 64px;
    display: flex; align-items: center;
    padding: 0 36px;
    justify-content: space-between;
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border-bottom: 1px solid rgba(37,99,235,0.10);
    box-shadow: 0 1px 0 rgba(37,99,235,0.06), 0 4px 24px rgba(15,23,42,0.05);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Logo ── */
  .nav-logo {
    display: flex; align-items: center; gap: 8px;
    text-decoration: none; flex-shrink: 0; user-select: none;
  }
  .nav-logo:hover { text-decoration: none; }
  .nav-logo-mark {
    width: 32px; height: 32px; border-radius: 9px;
    background: linear-gradient(135deg, var(--b600) 0%, var(--b800) 100%);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(37,99,235,0.28), inset 0 1px 0 rgba(255,255,255,0.18);
    flex-shrink: 0;
  }
  .nav-logo-mark svg { width: 16px; height: 16px; }
  .nav-logo-text {
    font-family: var(--font-display);
    font-size: 17px; font-weight: 700; color: var(--ink);
    letter-spacing: -.03em; line-height: 1;
  }
  .nav-logo-text span { color: var(--b600); }

  /* ── Center nav links ── */
  .nav-links {
    display: flex; align-items: center; gap: 2px;
    position: absolute; left: 50%; transform: translateX(-50%);
    background: rgba(248,250,252,0.70);
    border: 1px solid rgba(37,99,235,0.08);
    border-radius: 14px; padding: 4px;
    backdrop-filter: blur(12px);
  }
  .nav-link {
    padding: 7px 16px; border-radius: 10px;
    font-size: 13.5px; font-weight: 500; color: var(--ink-3);
    text-decoration: none;
    transition: color .14s, background .14s, box-shadow .14s;
    white-space: nowrap; letter-spacing: -.01em;
    font-family: var(--font-body);
  }
  .nav-link:hover { color: var(--ink); background: white; text-decoration: none; }
  .nav-link.active {
    color: var(--b700); background: white;
    box-shadow: 0 1px 6px rgba(37,99,235,0.12), 0 0 0 1px rgba(37,99,235,0.10);
    font-weight: 600;
  }

  /* Admin link */
  .nav-link-admin {
    padding: 7px 16px; border-radius: 10px;
    font-size: 13.5px; font-weight: 600; color: #92400e;
    background: #fef3c7; text-decoration: none;
    transition: background .14s; white-space: nowrap;
    letter-spacing: -.01em; font-family: var(--font-body);
    border: 1px solid #fde68a;
  }
  .nav-link-admin:hover { background: #fde68a; text-decoration: none; color: #92400e; }

  /* ── Right side ── */
  .nav-right {
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  }

  .btn-nav-login {
    font-family: var(--font-body); font-size: 14px; font-weight: 500;
    color: var(--ink-3); background: transparent; border: none;
    padding: 8px 16px; cursor: pointer; text-decoration: none;
    border-radius: 10px;
    transition: color .14s, background .14s;
    display: inline-flex; align-items: center;
  }
  .btn-nav-login:hover { color: var(--ink); background: var(--surface); text-decoration: none; }

  /* Shimmer CTA button */
  .btn-nav-signup {
    position: relative; overflow: hidden;
    font-family: var(--font-body); font-size: 13.5px; font-weight: 600;
    color: white; border: none;
    border-radius: 10px; padding: 9px 22px; cursor: pointer;
    text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
    background: linear-gradient(135deg, var(--b500) 0%, var(--b700) 100%);
    box-shadow: 0 2px 12px rgba(37,99,235,0.30), 0 0 0 1px rgba(37,99,235,0.15), inset 0 1px 0 rgba(255,255,255,0.18);
    transition: box-shadow .2s, transform .15s;
    letter-spacing: -.02em;
  }
  .btn-nav-signup::after {
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
  .btn-nav-signup:hover {
    box-shadow: 0 4px 20px rgba(37,99,235,0.38), 0 0 0 1px rgba(37,99,235,0.20), inset 0 1px 0 rgba(255,255,255,0.18);
    transform: translateY(-1px);
    text-decoration: none; color: white;
  }
  .btn-nav-signup svg { width: 13px; height: 13px; opacity: .9; }

  /* ── User button ── */
  .nav-user { position: relative; }

  .nav-user-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 5px 12px 5px 5px;
    border-radius: 12px;
    border: 1px solid var(--border-2);
    background: var(--white); cursor: pointer;
    transition: background .14s, border-color .14s, box-shadow .14s;
  }
  .nav-user-btn:hover {
    background: var(--surface);
    border-color: rgba(37,99,235,0.18);
    box-shadow: 0 2px 12px rgba(37,99,235,0.10);
  }

  .nav-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: linear-gradient(135deg, var(--b500), var(--b800));
    display: flex; align-items: center; justify-content: center;
    font-size: 10.5px; font-weight: 700; color: white; flex-shrink: 0;
    font-family: var(--font-display);
    box-shadow: 0 1px 4px rgba(37,99,235,0.30);
  }
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
    position: absolute; top: calc(100% + 8px); right: 0;
    min-width: 240px;
    background: var(--white);
    border: 1px solid rgba(37,99,235,0.12);
    border-radius: 18px;
    box-shadow: 0 8px 40px rgba(37,99,235,0.12), 0 2px 12px rgba(15,23,42,0.07);
    overflow: hidden;
    animation: dropIn .16s cubic-bezier(.22,1,.36,1);
    z-index: 300;
  }
  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-8px) scale(.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .nav-dropdown-header {
    padding: 16px 18px;
    background: linear-gradient(135deg, var(--b50) 0%, rgba(219,234,254,0.40) 100%);
    border-bottom: 1px solid rgba(37,99,235,0.08);
  }
  .nav-dropdown-avatar-row {
    display: flex; align-items: center; gap: 11px; margin-bottom: 10px;
  }
  .nav-dropdown-avatar-lg {
    width: 38px; height: 38px; border-radius: 50%;
    background: linear-gradient(135deg, var(--b400), var(--b800));
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
    font-family: var(--font-display);
    box-shadow: 0 2px 8px rgba(37,99,235,0.28);
  }
  .nav-dropdown-name {
    font-family: var(--font-display);
    font-size: 15px; font-weight: 700; color: var(--ink); letter-spacing: -.03em;
  }
  .nav-dropdown-email {
    font-size: 12px; color: var(--ink-4); margin-top: 2px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .nav-role-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 600; letter-spacing: .05em;
    text-transform: uppercase; padding: 4px 10px; border-radius: 8px;
    background: var(--surface-2); color: var(--ink-4);
    border: 1px solid var(--border);
  }
  .nav-role-badge-admin { background: #fef3c7; color: #92400e; border-color: #fde68a; }
  .nav-role-badge-student {
    background: var(--b50); color: var(--b700); border-color: var(--b200);
  }

  .nav-dropdown-label {
    font-size: 10.5px; font-weight: 600; letter-spacing: .08em;
    text-transform: uppercase; color: var(--ink-5);
    padding: 10px 12px 4px; font-family: var(--font-body);
  }

  .nav-dropdown-section { padding: 6px; }

  .nav-dropdown-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 12px;
    font-size: 13.5px; font-weight: 500; color: var(--ink-2);
    text-decoration: none; border: none; background: none;
    width: 100%; cursor: pointer; font-family: var(--font-body);
    text-align: left; border-radius: 10px;
    transition: background .12s, color .12s;
  }
  .nav-dropdown-item:hover { background: var(--b50); color: var(--b700); text-decoration: none; }

  .nav-dropdown-item-icon {
    width: 30px; height: 30px; border-radius: 8px;
    background: var(--surface-2); display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background .12s;
  }
  .nav-dropdown-item:hover .nav-dropdown-item-icon { background: var(--b100); }

  .nav-dropdown-divider { height: 1px; background: rgba(37,99,235,0.08); margin: 0 6px; }

  .nav-dropdown-item-danger { color: var(--danger); }
  .nav-dropdown-item-danger:hover { background: var(--danger-lt); color: var(--danger); }
  .nav-dropdown-item-danger:hover .nav-dropdown-item-icon { background: #ffe4ea; }

  /* ── Hamburger ── */
  .nav-hamburger {
    display: none; flex-direction: column; gap: 5px;
    cursor: pointer; padding: 8px;
    border: 1px solid var(--border-2);
    background: var(--white); border-radius: 10px;
    transition: background .14s, border-color .14s;
  }
  .nav-hamburger:hover { background: var(--surface); border-color: rgba(37,99,235,0.18); }
  .nav-hamburger span {
    display: block; width: 18px; height: 1.5px;
    background: var(--ink-3); border-radius: 2px;
    transition: all .22s ease;
  }
  .nav-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); background: var(--ink); }
  .nav-hamburger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
  .nav-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); background: var(--ink); }

  /* ── Mobile Drawer ── */
  .nav-drawer {
    display: none;
    position: fixed; top: 64px; left: 0; right: 0; bottom: 0;
    background: var(--white); z-index: 199;
    padding: 14px 20px;
    overflow-y: auto;
    border-top: 1px solid rgba(37,99,235,0.08);
    animation: drawerIn .18s ease;
  }
  @keyframes drawerIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .nav-drawer.open { display: block; }

  .nav-drawer-user {
    display: flex; align-items: center; gap: 13px;
    padding: 14px 16px;
    background: linear-gradient(135deg, var(--b50), rgba(219,234,254,0.3));
    border: 1px solid rgba(37,99,235,0.10);
    border-radius: 14px; margin-bottom: 10px;
  }
  .nav-drawer-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: linear-gradient(135deg, var(--b500), var(--b800));
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: white; flex-shrink: 0;
    font-family: var(--font-display);
    box-shadow: 0 2px 8px rgba(37,99,235,0.25);
  }
  .nav-drawer-user-name {
    font-family: var(--font-display); font-size: 15px; font-weight: 700;
    color: var(--ink); letter-spacing: -.03em;
  }
  .nav-drawer-user-email { font-size: 12px; color: var(--ink-4); margin-top: 2px; }

  .nav-drawer-links { display: flex; flex-direction: column; gap: 2px; margin-bottom: 10px; }

  .nav-drawer-link {
    display: flex; align-items: center;
    padding: 11px 14px; border-radius: 10px;
    font-size: 14px; font-weight: 500; color: var(--ink-3);
    text-decoration: none;
    transition: background .12s, color .12s;
    font-family: var(--font-body);
  }
  .nav-drawer-link:hover { background: var(--b50); color: var(--b700); text-decoration: none; }
  .nav-drawer-link.active { background: var(--b50); color: var(--b700); font-weight: 600; }

  .nav-drawer-divider { height: 1px; background: rgba(37,99,235,0.08); margin: 8px 0; }

  .nav-drawer-logout {
    display: flex; align-items: center;
    padding: 11px 14px; border-radius: 10px;
    font-size: 14px; font-weight: 600; color: var(--danger);
    background: none; border: none; width: 100%;
    cursor: pointer; font-family: var(--font-body); text-align: left;
    transition: background .12s;
  }
  .nav-drawer-logout:hover { background: var(--danger-lt); }

  .nav-drawer-auth {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;
  }
  .btn-drawer-login, .btn-drawer-signup {
    font-family: var(--font-body); font-size: 14px; font-weight: 600;
    padding: 12px; border-radius: 10px; text-align: center;
    text-decoration: none; display: flex; align-items: center; justify-content: center;
    transition: all .16s;
  }
  .btn-drawer-login {
    color: var(--ink); border: 1px solid var(--border-2); background: var(--white);
  }
  .btn-drawer-login:hover {
    background: var(--surface); border-color: var(--b300);
    text-decoration: none; color: var(--ink);
  }
  .btn-drawer-signup {
    position: relative; overflow: hidden;
    color: white;
    background: linear-gradient(135deg, var(--b500) 0%, var(--b700) 100%);
    border: none;
    box-shadow: 0 2px 12px rgba(37,99,235,0.28);
  }
  .btn-drawer-signup::after {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent);
    animation: shimmer 2.8s ease-in-out infinite;
  }
  .btn-drawer-signup:hover { opacity: .90; text-decoration: none; color: white; }

  @media (max-width: 768px) {
    .navbar { padding: 0 20px; }
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
  <svg viewBox="0 0 13 13" fill="none" width="13" height="13">
    <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const LogoMark = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="16" height="16">
    <path d="M3 12V5.5L8 3l5 2.5V12L8 13.5 3 12z" fill="rgba(255,255,255,0.9)"/>
    <path d="M8 3v10.5M3 12l5-1.5M13 12l-5-1.5" stroke="rgba(37,99,235,0.5)" strokeWidth="0.8"/>
  </svg>
);

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

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  const isAdmin = user?.role === 'admin';
  const isStudent = user?.role === 'student';

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

  const avatarStyle = isAdmin
    ? { background: 'linear-gradient(135deg,#f59e0b,#d97706)' }
    : undefined;

  const userBtnStyle = isAdmin
    ? { borderColor: 'rgba(245,158,11,0.30)', background: 'rgba(255,251,235,0.60)' }
    : undefined;

  const dropdownHeaderStyle = isAdmin
    ? { background: 'linear-gradient(135deg,#fffbeb,rgba(253,230,138,0.30))' }
    : undefined;

  return (
    <>
      <style>{styles}</style>

      <nav className="navbar">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <div className="nav-logo-mark"><LogoMark /></div>
          <span className="nav-logo-text">E<span>·</span>Learning</span>
        </Link>

        {/* Center links — desktop */}
        <div className="nav-links">
          {navLinks.map(({ label, path }) => (
            <Link key={path} to={path} className={`nav-link ${isActive(path) ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="nav-link-admin">Admin</Link>
          )}
        </div>

        {/* Right — desktop */}
        <div className="nav-right">
          {user ? (
            <div className="nav-user" ref={dropdownRef}>
              <button
                className="nav-user-btn"
                style={userBtnStyle}
                onClick={() => setDropdownOpen(o => !o)}
              >
                <div className="nav-avatar" style={avatarStyle}>{initials}</div>
                <span className="nav-user-name">{user.name}</span>
                <span className={`nav-chevron ${dropdownOpen ? 'open' : ''}`}>
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </span>
              </button>

              {dropdownOpen && (
                <div className="nav-dropdown">
                  <div className="nav-dropdown-header" style={dropdownHeaderStyle}>
                    <div className="nav-dropdown-avatar-row">
                      <div className="nav-dropdown-avatar-lg" style={avatarStyle}>{initials}</div>
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

      {/* Mobile Drawer */}
      <div className={`nav-drawer ${mobileOpen ? 'open' : ''}`}>
        {user && (
          <div className="nav-drawer-user">
            <div className="nav-drawer-avatar" style={avatarStyle}>{initials}</div>
            <div>
              <div className="nav-drawer-user-name">{user.name}</div>
              <div className="nav-drawer-user-email">{user.email}</div>
            </div>
          </div>
        )}

        <div className="nav-drawer-links">
          {navLinks.map(({ label, path }) => (
            <Link key={path} to={path} className={`nav-drawer-link ${isActive(path) ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="nav-drawer-link">⚡ Admin Panel</Link>
          )}
          {isStudent && (
            <Link to="/profile" className="nav-drawer-link">Profile</Link>
          )}
        </div>

        <div className="nav-drawer-divider" />

        {user ? (
          <button className="nav-drawer-logout" onClick={handleLogout}>
            Sign out
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