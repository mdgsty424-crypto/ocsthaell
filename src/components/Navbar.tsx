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
  { name: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, isAdmin, ocId } = useAuth();

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
            {navLinks.map((link) => (
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
              <Link to={isAdmin ? "/admin/dashboard" : `/${ocId}/profile`} className="px-6 py-2.5 rounded-2xl bg-gray-100 text-gray-900 font-bold hover:bg-gray-200 transition-all flex items-center">
                <User className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-sm font-bold text-gray-600 hover:text-brand-blue transition-colors">
                  Login
                </Link>
                <a href="https://registration.ocsthael.com" target="_blank" rel="noopener noreferrer" className="px-8 py-3 rounded-2xl bg-brand-blue text-white font-bold shadow-lg hover:bg-brand-blue/90 hover:-translate-y-0.5 transition-all active:scale-95">
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
            {navLinks.map((link) => (
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
                to={isAdmin ? "/admin/dashboard" : `/${ocId}/profile`}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-4 rounded-2xl text-center text-base font-bold text-gray-900 bg-gray-100 flex items-center justify-center"
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
                  href="https://registration.ocsthael.com"
                  target="_blank"
                  rel="noopener noreferrer"
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
