import React, { useState, useEffect } from 'react';
import { Search, Home, LayoutGrid, ShoppingCart, User, Bell, X, History, TrendingUp } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ShopAppLayoutProps {
  children: React.ReactNode;
  onSearch?: (query: string) => void;
}

const ShopAppLayout: React.FC<ShopAppLayoutProps> = ({ children, onSearch }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [trendingSearches] = useState(['iPhone 15', 'Cotton Saree', 'Smart Watch', 'Handmade Bag']);

  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (onSearch) onSearch(query);
    
    if (query.trim() && !searchHistory.includes(query.trim())) {
      const newHistory = [query.trim(), ...searchHistory.slice(0, 4)];
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LayoutGrid, label: 'Category', path: '/categories' },
    { icon: ShoppingCart, label: 'Cart', path: '/cart', badge: 0 }, // Badge will be updated via context/state if needed
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col overflow-x-hidden relative shadow-2xl">
      {/* Header */}
      <header className="sticky top-0 bg-white shadow-sm p-4 z-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search World Products..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full bg-gray-100 pl-10 pr-4 py-2.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button className="p-2.5 bg-gray-100 text-gray-600 rounded-2xl relative hover:bg-gray-200 transition-colors">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>

        {/* Search Suggestions Overlay */}
        <AnimatePresence>
          {isSearchFocused && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-xl p-4 z-40"
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} /> Recent Searches
                </h4>
                {searchHistory.length > 0 && (
                  <button onClick={clearHistory} className="text-[10px] font-bold text-red-500 uppercase">Clear</button>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {searchHistory.length > 0 ? (
                  searchHistory.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handleSearch(item);
                        setIsSearchFocused(false);
                      }}
                      className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-bold rounded-xl border border-gray-100"
                    >
                      {item}
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 italic">No recent searches</p>
                )}
              </div>

              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <TrendingUp size={14} /> Trending Now
              </h4>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSearch(item);
                      setIsSearchFocused(false);
                    }}
                    className="px-3 py-1.5 bg-brand-blue/5 text-brand-blue text-xs font-bold rounded-xl border border-brand-blue/10"
                  >
                    {item}
                  </button>
                ))}
              </div>
              
              <button 
                onClick={() => setIsSearchFocused(false)}
                className="w-full mt-6 py-3 bg-brand-blue text-white text-xs font-black rounded-2xl"
              >
                Close
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-gray-100 flex justify-around py-3 px-2 z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-brand-blue scale-110' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className={`p-2 rounded-2xl ${isActive ? 'bg-brand-blue/10' : ''}`}>
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default ShopAppLayout;
