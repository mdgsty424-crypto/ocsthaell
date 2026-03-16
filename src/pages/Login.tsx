import React, { useState } from 'react';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Hexagon, Lock, Mail, Key, ArrowRight } from 'lucide-react';

export default function Login() {
  const [loginMethod, setLoginMethod] = useState<'email' | 'ocid'>('email');
  const [identifier, setIdentifier] = useState(''); // Email or OC-ID
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let loginEmail = identifier;

      // If using OC-ID, we need to find the associated email first
      if (loginMethod === 'ocid') {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('ocId', '==', identifier));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          throw new Error('No user found with this OC-ID.');
        }
        
        // Assuming OC-ID is unique, get the first match
        loginEmail = querySnapshot.docs[0].data().email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      
      // Ensure user document exists
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      let ocId = `OC-${userCredential.user.uid.substring(0, 8).toUpperCase()}`;
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          role: 'user',
          ocId: ocId,
          createdAt: serverTimestamp()
        });
      } else {
        ocId = userDoc.data().ocId || ocId;
      }
      
      navigate(`/${ocId}/profile`);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please check your details and try again.');
      } else {
        setError(err.message || 'Failed to log in');
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
      
      // Ensure user document exists
      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userDocRef);
      let ocId = `OC-${userCredential.user.uid.substring(0, 8).toUpperCase()}`;
      
      if (!userDoc.exists()) {
        const userData: any = {
          email: userCredential.user.email,
          role: 'user',
          ocId: ocId,
          createdAt: serverTimestamp()
        };
        if (userCredential.user.displayName) {
          userData.displayName = userCredential.user.displayName;
        }
        if (userCredential.user.photoURL) {
          userData.photoURL = userCredential.user.photoURL;
        }
        await setDoc(userDocRef, userData);
      } else {
        ocId = userDoc.data().ocId || ocId;
      }
      
      navigate(`/${ocId}/profile`);
    } catch (err: any) {
      setError(err.message || 'Failed to log in with Google');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] px-4 pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-[#0a0f19] rounded-3xl p-10 relative overflow-hidden shadow-2xl border border-gray-800"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand"></div>
        
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Hexagon className="w-16 h-16 text-brand-blue drop-shadow-lg" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">
            Welcome Back
          </h2>
          <p className="text-gray-400 text-sm">
            Log in to access your OCSTHAEL dashboard
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {/* Login Method Toggle */}
        <div className="flex bg-[#111827] rounded-xl p-1 mb-6 border border-gray-800">
          <button
            type="button"
            onClick={() => { setLoginMethod('email'); setIdentifier(''); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              loginMethod === 'email' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('ocid'); setIdentifier(''); setError(''); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              loginMethod === 'ocid' ? 'bg-brand-blue text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            OC-ID
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 mb-6">
          <div>
            <div className="relative">
              {loginMethod === 'email' ? (
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              ) : (
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              )}
              <input
                type={loginMethod === 'email' ? 'email' : 'text'}
                required
                placeholder={loginMethod === 'email' ? 'Email address' : 'Your OC-ID'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-[#111827] border border-gray-800 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#111827] border border-gray-800 rounded-xl pl-12 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl bg-brand-blue text-white font-semibold hover:bg-blue-600 transition-all flex items-center justify-center disabled:opacity-50 shadow-lg"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="relative flex items-center py-2 mb-6">
          <div className="flex-grow border-t border-gray-800"></div>
          <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">or</span>
          <div className="flex-grow border-t border-gray-800"></div>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 px-6 rounded-xl bg-[#111827] hover:bg-gray-800 border border-gray-800 text-white font-semibold transition-all flex items-center justify-center group disabled:opacity-50 shadow-sm mb-6"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>
        
        <div className="text-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <a href="https://registration.ocsthael.com" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:text-blue-400 font-medium inline-flex items-center">
              Get Started <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
