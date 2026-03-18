import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';
import { Loader2 } from 'lucide-react';

export default function AutoLogin() {
  const { ocId, token } = useParams<{ ocId: string; token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAndLogin = async () => {
      if (!ocId || !token) {
        navigate('/login');
        return;
      }

      try {
        // If already logged in as the correct user, just navigate
        if (auth.currentUser) {
          navigate(`/${ocId}/profile`);
          return;
        }

        // Note: signInWithCustomToken requires a server-generated custom token.
        // If 'token' is an ID token (which it is from Registration.tsx), this will fail.
        // We catch the error and redirect to login if not already authenticated.
        if (token && token.length > 100) { // Basic check for JWT-like string
          try {
            await signInWithCustomToken(auth, token);
            navigate(`/${ocId}/profile`);
          } catch (authError: any) {
            console.error("Custom token login failed:", authError);
            if (authError.code === 'auth/network-request-failed') {
              // Stay on page or show error? For auto-login, redirecting to login is safer but maybe show why
              navigate('/login?error=network');
            } else {
              navigate('/login');
            }
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error("Auto-login failed:", error);
        navigate('/login');
      }
    };

    verifyAndLogin();
  }, [ocId, token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] text-white">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-brand-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Authenticating...</h2>
        <p className="text-gray-400">Please wait while we secure your session.</p>
      </div>
    </div>
  );
}
