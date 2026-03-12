import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/admin', label: '📊 Dashboard', end: true },
  { to: '/admin/courses', label: '📚 Courses' },
  { to: '/admin/students', label: '👥 Students' },
  { to: '/admin/orders', label: '💳 Orders' },
  { to: '/admin/attendance', label: '📅 Attendance' },
];

export default function AdminLayout() {
  return (
    <div className="layout-sidebar">
      <aside className="sidebar">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            {l.label}
          </NavLink>
        ))}
      </aside>
      <div className="sidebar-content">
        <Outlet />
      </div>
    </div>
  );
}
