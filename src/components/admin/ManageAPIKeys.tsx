import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Key, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ManageAPIKeys() {
  const [geminiKey, setGeminiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchAPIKeys();
  }, []);

  const fetchAPIKeys = async () => {
    try {
      const docRef = doc(db, 'systemSettings', 'apiKeys');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.geminiApiKey) {
          setGeminiKey(data.geminiApiKey);
        }
      }
    } catch (err) {
      console.error("Error fetching API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);

    try {
      await setDoc(doc(db, 'systemSettings', 'apiKeys'), {
        geminiApiKey: geminiKey,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setStatus({ type: 'success', message: 'API Keys saved successfully!' });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Failed to save: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">API Keys Management</h1>
        <p className="text-gray-500">Manage external API keys like Google Gemini AI directly from the dashboard.</p>
      </div>

      {status && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl mb-6 flex items-center space-x-3 ${
            status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{status.message}</span>
        </motion.div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-brand-blue" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Google Gemini AI</h2>
              <p className="text-xs text-gray-500">Used for OC Chat and AI Assistant features</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Gemini API Key</label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-brand-blue hover:underline">Google AI Studio</a>.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gradient-brand text-white rounded-xl font-bold flex items-center space-x-2 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save API Keys</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
