import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ 
  children, 
  requireAdmin = true,
  requireTeam = false
}: { 
  children: React.ReactNode, 
  requireAdmin?: boolean,
  requireTeam?: boolean
}) {
  const { user, isAdmin, isTeam, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={requireAdmin ? "/admin/login" : "/login"} state={{ from: location }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    setTimeout(() => {
      alert('Access Denied: Only Official Admin Allowed');
    }, 0);
    return <Navigate to="/" replace />;
  }

  if (requireTeam && !isTeam) {
    setTimeout(() => {
      alert('Access Denied: Only Team Members Allowed');
    }, 0);
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
