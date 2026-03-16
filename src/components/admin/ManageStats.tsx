import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Save } from 'lucide-react';

interface StatData {
  users: number;
  apps: number;
  downloads: number;
  growth: number;
}

export default function ManageStats() {
  const [stats, setStats] = useState<StatData>({ users: 0, apps: 0, downloads: 0, growth: 0 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statDoc = await getDoc(doc(db, 'stats', 'main'));
        if (statDoc.exists()) {
          setStats(statDoc.data() as StatData);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, 'stats', 'main'), {
        users: Number(stats.users),
        apps: Number(stats.apps),
        downloads: Number(stats.downloads),
        growth: Number(stats.growth),
      });
      alert("Statistics updated successfully!");
    } catch (error) {
      console.error("Error saving stats:", error);
      alert("Failed to update statistics");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold text-brand-blue">Manage Statistics</h2>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-gray-100 shadow-sm max-w-2xl bg-white/80 backdrop-blur-md">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Active Users</label>
              <input
                type="number"
                required
                min="0"
                value={stats.users}
                onChange={e => setStats({ ...stats, users: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors text-2xl font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Apps Deployed</label>
              <input
                type="number"
                required
                min="0"
                value={stats.apps}
                onChange={e => setStats({ ...stats, apps: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors text-2xl font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Total Downloads (in Millions)</label>
              <input
                type="number"
                required
                min="0"
                value={stats.downloads}
                onChange={e => setStats({ ...stats, downloads: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors text-2xl font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">YoY Growth (%)</label>
              <input
                type="number"
                required
                min="0"
                value={stats.growth}
                onChange={e => setStats({ ...stats, growth: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors text-2xl font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-6 border-t border-gray-100">
            <button 
              type="submit" 
              disabled={saving}
              className="flex items-center px-8 py-4 bg-gradient-brand text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Update Statistics
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
