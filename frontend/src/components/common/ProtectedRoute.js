import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ role }) {
  const { user, token } = useSelector(s => s.auth);

  if (!token) return <Navigate to="/login" replace />;
  if (!user)  return <div className="loading-center"><div className="spinner spinner-lg" /></div>;

  // Admin can access any route regardless of the required role
  if (role && user.role !== role && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}