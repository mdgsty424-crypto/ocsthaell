import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { Users, CheckCircle, Clock, AlertCircle, BarChart, Hexagon, LogOut, LayoutDashboard, MessageSquare } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function TeamDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingWithdrawals: 0,
    activeTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const withdrawalsSnap = await getDocs(query(collection(db, 'withdrawals'), where('status', '==', 'pending')));
        const ticketsSnap = await getDocs(query(collection(db, 'support_tickets'), where('status', '==', 'open')));

        setStats({
          totalUsers: usersSnap.size,
          pendingWithdrawals: withdrawalsSnap.size,
          activeTickets: ticketsSnap.size,
        });
      } catch (error) {
        console.error("Error fetching team stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#05070a]">
        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12 bg-[#0a0f19] p-8 rounded-3xl border border-gray-800 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand-blue/10 rounded-2xl border border-brand-blue/20">
              <Hexagon className="w-8 h-8 text-brand-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white">Team Workspace</h1>
              <p className="text-gray-400">Welcome back, {user?.displayName || 'Staff Member'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/chat" className="px-6 py-3 bg-brand-pink/10 text-brand-pink rounded-xl font-bold hover:bg-brand-pink/20 transition-all flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" /> Team Chat
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-[#0a0f19] p-8 rounded-3xl border border-gray-800 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded">Community</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Total Members</h3>
            <p className="text-4xl font-black text-white">{stats.totalUsers}</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-[#0a0f19] p-8 rounded-3xl border border-gray-800 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-brand-mango/10 rounded-xl">
                <Clock className="w-6 h-6 text-brand-mango" />
              </div>
              <span className="text-xs font-bold text-brand-mango bg-brand-mango/10 px-2 py-1 rounded">Pending</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Withdrawal Requests</h3>
            <p className="text-4xl font-black text-white">{stats.pendingWithdrawals}</p>
          </motion.div>

          <motion.div
            whileHover={{ y: -5 }}
            className="bg-[#0a0f19] p-8 rounded-3xl border border-gray-800 shadow-xl"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-brand-pink/10 rounded-xl">
                <AlertCircle className="w-6 h-6 text-brand-pink" />
              </div>
              <span className="text-xs font-bold text-brand-pink bg-brand-pink/10 px-2 py-1 rounded">Urgent</span>
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">Open Tickets</h3>
            <p className="text-4xl font-black text-white">{stats.activeTickets}</p>
          </motion.div>
        </div>

        {/* Action Center */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#0a0f19] rounded-3xl border border-gray-800 p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <CheckCircle className="w-6 h-6 mr-2 text-green-400" /> Task Management
            </h2>
            <div className="space-y-4">
              <Link to="/admin/dashboard/withdrawals" className="block p-4 bg-[#111827] rounded-2xl border border-gray-800 hover:border-brand-blue transition-all group">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white group-hover:text-brand-blue transition-colors">Process Withdrawals</h4>
                    <p className="text-sm text-gray-500">Review and approve member payout requests.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-brand-blue" />
                </div>
              </Link>
              <Link to="/admin/dashboard/support" className="block p-4 bg-[#111827] rounded-2xl border border-gray-800 hover:border-brand-pink transition-all group">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-white group-hover:text-brand-pink transition-colors">Support Center</h4>
                    <p className="text-sm text-gray-500">Respond to member inquiries and issues.</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-brand-pink" />
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-[#0a0f19] rounded-3xl border border-gray-800 p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <BarChart className="w-6 h-6 mr-2 text-brand-blue" /> Quick Insights
            </h2>
            <div className="bg-[#111827] p-6 rounded-2xl border border-gray-800 h-48 flex items-center justify-center text-gray-600 italic">
              Chart visualization coming soon...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
  );
}
