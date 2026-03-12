import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../redux/slices/authSlice';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Instrument+Sans:wght@400;500;600&display=swap');

  :root {
    --white:      #ffffff;
    --surface:    #f8f8f6;
    --surface-2:  #f2f1ee;
    --border:     #e5e3de;
    --border-2:   #d6d3cc;

    --ink:        #111110;
    --ink-2:      #3d3c39;
    --ink-3:      #6e6b64;
    --ink-4:      #a09d95;
    --ink-5:      #ccc9c1;

    --accent:     #1c4ed8;
    --accent-lt:  #eff4ff;
    --accent-mid: #bfcfff;
    --danger:     #be123c;
    --danger-lt:  #fff1f3;

    --font-serif: 'Instrument Serif', Georgia, serif;
    --font-sans:  'Instrument Sans', system-ui, sans-serif;

    --shadow-sm: 0 2px 8px rgba(17,17,16,0.07);
    --shadow-md: 0 8px 24px rgba(17,17,16,0.09);
  }

  /* ══ NAVBAR ══ */
  .navbar {
    position: sticky; top: 0; z-index: 200;
    height: 60px;
    display: flex; align-items: center;
    padding: 0 40px;
    justify-content: space-between;
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Logo ── */
  .nav-logo {
    display: flex; align-items: baseline; gap: 2px;
    text-decoration: none; flex-shrink: 0;
    user-select: none;
  }
  .nav-logo:hover { text-decoration: none; }
  .nav-logo-text {
    font-family: var(--font-serif);
    font-size: 20px; color: var(--ink);
    letter-spacing: -.01em; line-height: 1;
  }
  .nav-logo-dot { color: var(--accent); font-size: 24px; line-height: 0; }

  /* ── Center nav links ── */
  .nav-links {
    display: flex; align-items: center; gap: 2px;
    position: absolute; left: 50%; transform: translateX(-50%);
  }
  .nav-link {
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 14px; font-weight: 500; color: var(--ink-3);
    text-decoration: none;
    transition: color .14s, background .14s;
    white-space: nowrap; letter-spacing: -.01em;
    font-family: var(--font-sans);
  }
  .nav-link:hover { color: var(--ink); background: var(--surface); text-decoration: none; }
  .nav-link.active { color: var(--ink); background: var(--surface); font-weight: 600; }

  /* Admin link — subtle amber tint, no capsule */
  .nav-link-admin {
    padding: 7px 14px; border-radius: 8px;
    font-size: 14px; font-weight: 600; color: #92400e;
    background: #fef3c7; text-decoration: none;
    transition: background .14s; white-space: nowrap;
    letter-spacing: -.01em; font-family: var(--font-sans);
  }
  .nav-link-admin:hover { background: #fde68a; text-decoration: none; color: #92400e; }

  /* ── Right side ── */
  .nav-right {
    display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  }

  .btn-nav-login {
    font-family: var(--font-sans); font-size: 14px; font-weight: 500;
    color: var(--ink-3); background: transparent; border: none;
    padding: 7px 14px; cursor: pointer; text-decoration: none;
    border-radius: 8px;
    transition: color .14s, background .14s;
    display: inline-flex; align-items: center;
  }
  .btn-nav-login:hover { color: var(--ink); background: var(--surface); text-decoration: none; }

  .btn-nav-signup {
    font-family: var(--font-sans); font-size: 14px; font-weight: 600;
    color: white; background: var(--accent); border: none;
    border-radius: 8px; padding: 8px 20px; cursor: pointer;
    text-decoration: none; display: inline-flex; align-items: center;
    transition: opacity .14s, transform .12s; letter-spacing: -.01em;
  }
  .btn-nav-signup:hover { opacity: .88; transform: translateY(-1px); text-decoration: none; color: white; }

  /* ── User button ── */
  .nav-user { position: relative; }

  .nav-user-btn {
    display: flex; align-items: center; gap: 9px;
    padding: 5px 12px 5px 6px;
    border-radius: 8px;
    border: 1.5px solid var(--border);
    background: var(--white); cursor: pointer;
    transition: background .14s, border-color .14s;
  }
  .nav-user-btn:hover { background: var(--surface); border-color: var(--border-2); }

  .nav-avatar {
    width: 27px; height: 27px; border-radius: 50%;
    background: var(--ink);
    display: flex; align-items: center; justify-content: center;
    font-size: 10.5px; font-weight: 600; color: white; flex-shrink: 0;
    font-family: var(--font-sans);
  }
  .nav-user-name {
    font-size: 13.5px; font-weight: 600; color: var(--ink);
    max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .nav-chevron {
    color: var(--ink-4); display: flex; align-items: center;
    transition: transform .2s;
  }
  .nav-chevron.open { transform: rotate(180deg); }

  /* ── Dropdown ── */
  .nav-dropdown {
    position: absolute; top: calc(100% + 8px); right: 0;
    min-width: 224px;
    background: var(--white);
    border: 1.5px solid var(--border);
    border-radius: 14px;
    box-shadow: var(--shadow-md);
    overflow: hidden;
    animation: dropIn .15s ease;
    z-index: 300;
  }
  @keyframes dropIn {
    from { opacity: 0; transform: translateY(-6px) scale(.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .nav-dropdown-header {
    padding: 14px 16px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .nav-dropdown-name {
    font-family: var(--font-serif);
    font-size: 15px; color: var(--ink); letter-spacing: -.015em;
  }
  .nav-dropdown-email {
    font-size: 12px; color: var(--ink-4); margin-top: 2px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .nav-role-badge {
    display: inline-block; margin-top: 9px;
    font-size: 11px; font-weight: 600; letter-spacing: .06em;
    text-transform: uppercase; padding: 3px 10px; border-radius: 6px;
    background: var(--surface-2); color: var(--ink-4);
    border: 1px solid var(--border);
  }
  .nav-role-badge-admin {
    background: #fef3c7; color: #92400e; border-color: #fde68a;
  }

  .nav-dropdown-section { padding: 6px; }

  .nav-dropdown-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 11px;
    font-size: 13.5px; font-weight: 500; color: var(--ink-3);
    text-decoration: none; border: none; background: none;
    width: 100%; cursor: pointer; font-family: var(--font-sans);
    text-align: left; border-radius: 8px;
    transition: background .12s, color .12s;
  }
  .nav-dropdown-item:hover { background: var(--surface); color: var(--ink); text-decoration: none; }

  .nav-dropdown-divider { height: 1px; background: var(--border); margin: 0 6px; }

  .nav-dropdown-item-danger { color: var(--danger); }
  .nav-dropdown-item-danger:hover { background: var(--danger-lt); color: var(--danger); }

  /* ── Hamburger ── */
  .nav-hamburger {
    display: none; flex-direction: column; gap: 5px;
    cursor: pointer; padding: 8px;
    border: 1.5px solid var(--border);
    background: var(--white); border-radius: 8px;
    transition: background .14s, border-color .14s;
  }
  .nav-hamburger:hover { background: var(--surface); border-color: var(--border-2); }
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
    position: fixed; top: 60px; left: 0; right: 0; bottom: 0;
    background: var(--white); z-index: 199;
    padding: 14px 20px;
    overflow-y: auto;
    border-top: 1px solid var(--border);
    animation: drawerIn .18s ease;
  }
  @keyframes drawerIn {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .nav-drawer.open { display: block; }

  .nav-drawer-user {
    display: flex; align-items: center; gap: 13px;
    padding: 13px 15px;
    background: var(--surface); border: 1.5px solid var(--border);
    border-radius: 12px; margin-bottom: 10px;
  }
  .nav-drawer-avatar {
    width: 38px; height: 38px; border-radius: 50%;
    background: var(--ink);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 600; color: white; flex-shrink: 0;
  }
  .nav-drawer-user-name {
    font-family: var(--font-serif); font-size: 15px; color: var(--ink); letter-spacing: -.015em;
  }
  .nav-drawer-user-email { font-size: 12px; color: var(--ink-4); margin-top: 2px; }

  .nav-drawer-links { display: flex; flex-direction: column; gap: 2px; margin-bottom: 10px; }

  .nav-drawer-link {
    display: flex; align-items: center;
    padding: 10px 13px; border-radius: 8px;
    font-size: 14px; font-weight: 500; color: var(--ink-3);
    text-decoration: none;
    transition: background .12s, color .12s;
    font-family: var(--font-sans);
  }
  .nav-drawer-link:hover { background: var(--surface); color: var(--ink); text-decoration: none; }
  .nav-drawer-link.active { background: var(--surface); color: var(--ink); font-weight: 600; }

  .nav-drawer-divider { height: 1px; background: var(--border); margin: 8px 0; }

  .nav-drawer-logout {
    display: flex; align-items: center;
    padding: 10px 13px; border-radius: 8px;
    font-size: 14px; font-weight: 600; color: var(--danger);
    background: none; border: none; width: 100%;
    cursor: pointer; font-family: var(--font-sans); text-align: left;
    transition: background .12s;
  }
  .nav-drawer-logout:hover { background: var(--danger-lt); }

  .nav-drawer-auth {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;
  }
  .btn-drawer-login, .btn-drawer-signup {
    font-family: var(--font-sans); font-size: 14px; font-weight: 600;
    padding: 12px; border-radius: 8px; text-align: center;
    text-decoration: none; display: flex; align-items: center; justify-content: center;
    transition: all .16s;
  }
  .btn-drawer-login {
    color: var(--ink); border: 1.5px solid var(--border); background: var(--white);
  }
  .btn-drawer-login:hover { background: var(--surface); border-color: var(--border-2); text-decoration: none; color: var(--ink); }
  .btn-drawer-signup {
    color: white; background: var(--accent); border: none;
  }
  .btn-drawer-signup:hover { opacity: .88; text-decoration: none; color: white; }

  @media (max-width: 768px) {
    .navbar { padding: 0 20px; }
    .nav-links { display: none; }
    .nav-right { display: none; }
    .nav-hamburger { display: flex; }
  }
`;

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

  const navLinks = [
    { label: 'Home',       path: '/' },
    { label: 'Courses',    path: '/courses' },
    ...(user?.role === 'student' ? [
      { label: 'Dashboard',  path: '/dashboard' },
      { label: 'My Courses', path: '/my-courses' },
    ] : []),
  ];

  const dropdownItems = [
    ...(user?.role === 'student' ? [
      { label: 'Dashboard',  path: '/dashboard' },
      { label: 'My Courses', path: '/my-courses' },
      { label: 'Profile',    path: '/profile' },
    ] : []),
    ...(user?.role === 'admin' ? [
      { label: 'Admin Panel', path: '/admin' },
    ] : []),
  ];

  return (
    <>
      <style>{styles}</style>

      <nav className="navbar">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          <span className="nav-logo-text">E-Learning</span>
          <span className="nav-logo-dot">·</span>
        </Link>

        {/* Center links — desktop */}
        <div className="nav-links">
          {navLinks.map(({ label, path }) => (
            <Link key={path} to={path} className={`nav-link ${isActive(path) ? 'active' : ''}`}>
              {label}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <Link to="/admin" className="nav-link-admin">Admin</Link>
          )}
        </div>

        {/* Right — desktop */}
        <div className="nav-right">
          {user ? (
            <div className="nav-user" ref={dropdownRef}>
              <button className="nav-user-btn" onClick={() => setDropdownOpen(o => !o)}>
                <div className="nav-avatar">{initials}</div>
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
                    <div className="nav-dropdown-name">{user.name}</div>
                    <div className="nav-dropdown-email">{user.email}</div>
                    <div className={`nav-role-badge ${user.role === 'admin' ? 'nav-role-badge-admin' : ''}`}>
                      {user.role}
                    </div>
                  </div>

                  {dropdownItems.length > 0 && (
                    <>
                      <div className="nav-dropdown-section">
                        {dropdownItems.map(({ label, path }) => (
                          <Link key={path} to={path} className="nav-dropdown-item">
                            {label}
                          </Link>
                        ))}
                      </div>
                      <div className="nav-dropdown-divider" />
                    </>
                  )}

                  <div className="nav-dropdown-section" style={{ paddingTop: 4 }}>
                    <button className="nav-dropdown-item nav-dropdown-item-danger" onClick={handleLogout}>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-nav-login">Sign in</Link>
              <Link to="/register" className="btn-nav-signup">Get started</Link>
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
            <div className="nav-drawer-avatar">{initials}</div>
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
          {user?.role === 'admin' && (
            <Link to="/admin" className="nav-drawer-link">Admin Panel</Link>
          )}
          {user?.role === 'student' && (
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