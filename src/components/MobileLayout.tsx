import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'motion/react';

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { cartCount } = useCart();

  const navItems = [
    { path: '/shop', icon: Home, label: 'Home' },
    { path: '/shop/categories', icon: Grid, label: 'Categories' },
    { path: '/profile/my-shop', icon: ShoppingBag, label: 'My Shop' },
    { path: '/shop/cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const isShopRoute = location.pathname.startsWith('/shop') || location.pathname.startsWith('/profile');

  if (!isShopRoute) return <>{children}</>;

  return (
    <div className="min-h-screen bg-white pb-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center gap-1 transition-all ${
                isActive ? 'text-brand-blue scale-110' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="relative">
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-brand-pink text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -bottom-1 w-1 h-1 bg-brand-blue rounded-full"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
