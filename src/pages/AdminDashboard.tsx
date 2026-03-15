import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Hexagon, LayoutDashboard, Layers, Image, Users, Newspaper, LogOut, BarChart, MonitorPlay, Image as ImageIcon, Palette, Search } from 'lucide-react';
import ManageBanners from '../components/admin/ManageBanners';
import ManageApps from '../components/admin/ManageApps';
import ManageAds from '../components/admin/ManageAds';
import ManageServices from '../components/admin/ManageServices';
import ManageStats from '../components/admin/ManageStats';
import ManageGallery from '../components/admin/ManageGallery';
import ManageNews from '../components/admin/ManageNews';
import ManageTeam from '../components/admin/ManageTeam';
import ManageTheme from '../components/admin/ManageTheme';
import ManageSEO from '../components/admin/ManageSEO';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Theme & Design', path: '/admin/dashboard/theme', icon: Palette },
    { name: 'Snap Banners', path: '/admin/dashboard/banners', icon: MonitorPlay },
    { name: 'Apps', path: '/admin/dashboard/apps', icon: Layers },
    { name: 'Services', path: '/admin/dashboard/services', icon: Layers },
    { name: 'Ads & Banners', path: '/admin/dashboard/ads', icon: Image },
    { name: 'Statistics', path: '/admin/dashboard/stats', icon: BarChart },
    { name: 'Gallery', path: '/admin/dashboard/gallery', icon: ImageIcon },
    { name: 'News', path: '/admin/dashboard/news', icon: Newspaper },
    { name: 'Our Staff', path: '/admin/dashboard/team', icon: Users },
    { name: 'SEO & Scripts', path: '/admin/dashboard/seo', icon: Search },
  ];

  return (
    <div className="min-h-screen bg-white flex pt-20">
      {/* Sidebar */}
      <aside className="w-64 glass-panel border-r border-gray-100 flex flex-col fixed h-[calc(100vh-5rem)] bg-white/80 backdrop-blur-md">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <Hexagon className="w-8 h-8 text-brand-blue" />
            <span className="text-xl font-display font-bold text-gray-900">Admin</span>
          </div>
          <div className="text-xs text-gray-400 mb-6 truncate">{user?.email}</div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-gradient-brand text-white shadow-lg' 
                    : 'text-gray-500 hover:text-brand-blue hover:bg-brand-blue/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-xl text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/theme" element={<ManageTheme />} />
            <Route path="/banners" element={<ManageBanners />} />
            <Route path="/apps" element={<ManageApps />} />
            <Route path="/services" element={<ManageServices />} />
            <Route path="/ads" element={<ManageAds />} />
            <Route path="/stats" element={<ManageStats />} />
            <Route path="/gallery" element={<ManageGallery />} />
            <Route path="/news" element={<ManageNews />} />
            <Route path="/team" element={<ManageTeam />} />
            <Route path="/seo" element={<ManageSEO />} />
          </Routes>
        </motion.div>
      </main>
    </div>
  );
}

function DashboardHome() {
  return (
    <div>
      <h1 className="text-3xl font-display font-bold text-brand-blue mb-8">Welcome to OCSTHAEL Admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Quick Actions</h3>
          <p className="text-gray-500 text-sm mb-4">Manage your ecosystem from the sidebar.</p>
        </div>
      </div>
    </div>
  );
}
