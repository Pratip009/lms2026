import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const links = [
  { to: '/teacher/bhi', label: '📚 My Classes', end: true },
  { to: '/teacher/bhi/alerts', label: '🚨 Alerts' },
];

export default function TeacherLayout() {
  return (
    <div className="layout-sidebar">
      <aside className="sidebar">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
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
