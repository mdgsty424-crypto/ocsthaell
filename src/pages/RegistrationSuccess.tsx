import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function RegistrationSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const { ocId, token } = location.state || {};
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!ocId || !token) {
      navigate('/login');
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // 3. Secure Redirect
          // Use current origin if we are on a dev/preview domain, otherwise use main domain
          const redirectUrl = `/${ocId}/profile`;
          navigate(redirectUrl);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [ocId, navigate]);

  if (!ocId) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-2xl"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>
        
        <h2 className="text-3xl font-display font-bold text-gray-900 mb-4">
          Registration Successful!
        </h2>
        
        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
          <p className="text-gray-500 text-sm mb-2">Your Unique OC-ID</p>
          <p className="text-2xl font-mono font-bold text-brand-blue">{ocId}</p>
        </div>

        <div className="space-y-4">
          <p className="text-gray-500">
            Redirecting to your dashboard in <span className="text-gray-900 font-bold">{countdown}</span> seconds...
          </p>
          
          <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-brand-blue"
            />
          </div>

          <button
            onClick={() => navigate(`/${ocId}/profile`)}
            className="w-full py-4 px-6 rounded-xl bg-brand-blue text-white font-semibold hover:bg-blue-600 transition-all flex items-center justify-center group"
          >
            Go to Dashboard <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center text-gray-400 text-xs">
          <Loader2 className="w-3 h-3 animate-spin mr-2" />
          Securing your session...
        </div>
      </motion.div>
    </div>
  );
}
