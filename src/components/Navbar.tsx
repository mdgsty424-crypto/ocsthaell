import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Apps', path: '/apps' },
  { name: 'Services', path: '/services' },
  { name: 'Our Team', path: '/team' },
  { name: 'Our Staff', path: '/staff' },
  { name: 'Members', path: '/members' },
  { name: 'Gallery', path: '/gallery' },
  { name: 'News', path: '/news' },
  { name: 'Chat', path: '/chat' },
  { name: 'Shop', path: '/shop' },
  { name: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin, isTeam, ocId, profileData } = useAuth();

  const getDashboardPath = () => {
    if (isAdmin) return "/admin/dashboard";
    if (isTeam) return "/team/dashboard";
    return `/${ocId}/profile`;
  };

  const userDisplayName = profileData?.displayName || profileData?.name || user?.displayName || 'User';
  const userPhotoURL = profileData?.photoURL || profileData?.imageUrl || profileData?.image || profileData?.profilePhoto || profileData?.avatar || profileData?.profilePicture || profileData?.memberPhoto || user?.photoURL;

  const filteredNavLinks = [...navLinks];
  if (isTeam && !isAdmin) {
    filteredNavLinks.push({ name: 'Team Workspace', path: '/team/dashboard' });
  }
  if (user) {
    filteredNavLinks.push({ name: 'My Shop', path: '/profile/my-shop' });
  }

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'theme'), (doc) => {
      if (doc.exists() && doc.data().logoUrl) {
        setLogoUrl(doc.data().logoUrl);
      } else {
        setLogoUrl(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <nav className={clsx(
      "fixed w-full z-50 transition-all duration-500",
      isScrolled ? "bg-white/90 backdrop-blur-xl border-b border-gray-100 py-2 shadow-sm" : "bg-transparent py-6"
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center group">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" referrerPolicy="no-referrer" />
            ) : (
              <Logo variant="horizontal" className="scale-110" />
            )}
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {filteredNavLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={clsx(
                  'text-sm font-bold tracking-widest uppercase transition-all hover:text-brand-blue relative group',
                  location.pathname === link.path ? 'text-brand-blue' : 'text-gray-600'
                )}
              >
                {link.name}
                <span className={clsx(
                  "absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-blue transition-all duration-300 group-hover:w-full",
                  location.pathname === link.path && "w-full"
                )}></span>
              </Link>
            ))}
            {user ? (
              <Link to={getDashboardPath()} className="flex items-center gap-3 pl-4 border-l border-gray-100">
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">{userDisplayName}</p>
                  <p className="text-[10px] text-gray-400 font-mono">{ocId}</p>
                </div>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm group hover:border-brand-blue transition-colors">
                  {userPhotoURL ? (
                    <img src={userPhotoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-brand-blue transition-colors">
                  Login
                </Link>
                <a href="https://oc-registration.netlify.app" className="px-8 py-3 rounded-2xl bg-brand-blue text-white font-bold shadow-lg hover:bg-brand-blue/90 hover:-translate-y-0.5 transition-all active:scale-95">
                  Get Started
                </a>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-brand-blue focus:outline-none transition-colors"
            >
              {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-white border-t border-gray-100"
        >
          <div className="px-4 pt-4 pb-8 space-y-2">
            {user && (
              <div className="flex items-center gap-4 px-4 py-4 mb-2 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-200">
                  {userPhotoURL ? (
                    <img src={userPhotoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{userDisplayName}</p>
                  <p className="text-xs text-gray-400 font-mono">{ocId}</p>
                </div>
              </div>
            )}
            {filteredNavLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'block px-4 py-3 rounded-2xl text-base font-bold tracking-widest uppercase transition-all',
                  location.pathname === link.path
                    ? 'text-brand-blue bg-brand-blue/5'
                    : 'text-gray-600 hover:text-brand-blue hover:bg-gray-50'
                )}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <Link
                to={getDashboardPath()}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-4 rounded-2xl text-center text-base font-bold text-white bg-brand-blue shadow-lg flex items-center justify-center"
              >
                <User className="w-5 h-5 mr-2" />
                Dashboard
              </Link>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-4 rounded-2xl text-center text-base font-bold text-gray-600 bg-gray-50 border border-gray-100"
                >
                  Login
                </Link>
                <a
                  href="https://oc-registration.netlify.app"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-4 rounded-2xl text-center text-base font-bold text-white bg-brand-blue shadow-lg"
                >
                  Get Started
                </a>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </nav>
  );
}
