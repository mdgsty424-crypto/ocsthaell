import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardRedirect() {
  const { user, ocId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const ocIdParam = urlParams.get('oc-id');
    const authKey = urlParams.get('key');

    if (ocIdParam && authKey) {
      // If we have auto-login params, redirect to profile with them
      navigate(`/${ocIdParam}/profile${location.search}`, { replace: true });
    } else if (user && ocId) {
      // If already logged in, go to own profile
      navigate(`/${ocId}/profile`, { replace: true });
    } else {
      // Otherwise go to login
      navigate('/login', { replace: true });
    }
  }, [user, ocId, navigate, location]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-gray-900">
      <Loader2 className="w-12 h-12 animate-spin text-brand-blue" />
    </div>
  );
}
