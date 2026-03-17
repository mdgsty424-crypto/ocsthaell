import React, { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Hexagon, Lock, Mail } from 'lucide-react';

export default function AdminLogin() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let userCredential;
      if (isSignUp) {
        if (email !== 'info@ocsthael.com') {
          setError('Access Denied. Only authorized admins can enter.');
          setLoading(false);
          return;
        }
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create user document
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          role: 'admin',
          createdAt: serverTimestamp()
        });
        navigate('/admin/dashboard');
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (userCredential.user.email !== 'info@ocsthael.com') {
          await auth.signOut();
          setError('Access Denied. Only authorized admins can enter.');
          setLoading(false);
          return;
        }
        
        // Ensure user document exists
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: userCredential.user.email,
            role: 'admin',
            createdAt: serverTimestamp()
          });
        }
        navigate('/admin/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password. If you don\'t have an account, please Sign Up first.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please Sign In.');
      } else {
        setError(err.message || `Failed to ${isSignUp ? 'sign up' : 'log in'}`);
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      if (userCredential.user.email !== 'info@ocsthael.com') {
        await auth.signOut();
        setError('Access Denied. Only authorized admins can enter.');
        setLoading(false);
        return;
      }

      // Ensure user document exists
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        const userData: any = {
          email: userCredential.user.email,
          role: 'admin',
          createdAt: serverTimestamp()
        };
        if (userCredential.user.displayName) {
          userData.displayName = userCredential.user.displayName;
        }
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      }
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to log in with Google');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl p-10 relative overflow-hidden shadow-2xl border border-gray-100"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand"></div>
        
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Hexagon className="w-16 h-16 text-brand-blue drop-shadow-lg" />
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
            {isSignUp ? 'Create Admin Account' : 'Admin Portal'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isSignUp ? 'Register a new administrator' : 'Secure access for OCSTHAEL administrators'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                required
                placeholder="Password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl bg-brand-blue text-white font-semibold hover:bg-brand-blue/90 transition-all flex items-center justify-center disabled:opacity-50 shadow-lg"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              isSignUp ? 'Sign Up' : 'Sign In'
            )}
          </button>
        </form>

        <div className="text-center mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-sm text-gray-500 hover:text-brand-blue transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        <div className="relative flex items-center py-2 mb-6">
          <div className="flex-grow border-t border-gray-100"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or</span>
          <div className="flex-grow border-t border-gray-100"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 px-6 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold transition-all flex items-center justify-center group disabled:opacity-50 shadow-sm"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Unauthorized access is strictly prohibited.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
