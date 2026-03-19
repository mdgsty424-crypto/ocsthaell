import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Send, CheckCircle, AlertCircle, Loader2, Save, Shield, Headphones, Info, Users, ShoppingBag } from 'lucide-react';
import { sendTestEmail } from '../../services/emailService';
import { db } from '../../firebase';
import { collection, doc, setDoc, getDocs, query } from 'firebase/firestore';

interface EmailConfig {
  category: string;
  serviceId: string;
  templateId: string;
  templateSecondaryId?: string;
  publicKey: string;
  privateKey?: string;
  role?: string;
  description?: string;
}

const CATEGORIES = [
  { id: 'auth', name: 'Authentication', icon: Shield, email: 'auth@ocsthael.com' },
  { id: 'support', name: 'Support', icon: Headphones, email: 'support@ocsthael.com' },
  { id: 'info', name: 'General Info', icon: Info, email: 'info@ocsthael.com' },
  { id: 'teams', name: 'Teams & Finance', icon: Users, email: 'teams@ocsthael.com' },
  { id: 'ocshopping', name: 'OC Shopping', icon: ShoppingBag, email: 'ocshoping@ocsthael.com' },
];

export default function ManageEmail() {
  const [configs, setConfigs] = useState<Record<string, EmailConfig>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'emailSettings'));
      const snapshot = await getDocs(q);
      const fetchedConfigs: Record<string, EmailConfig> = {};
      snapshot.forEach(doc => {
        const data = doc.data() as EmailConfig;
        fetchedConfigs[data.category] = data;
      });
      setConfigs(fetchedConfigs);
    } catch (err) {
      console.error("Error fetching configs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (category: string) => {
    setSaving(category);
    try {
      const config = configs[category] || { category, serviceId: '', templateId: '', publicKey: '' };
      await setDoc(doc(db, 'emailSettings', category), {
        ...config,
        category,
        updatedAt: new Date().toISOString()
      });
      setStatus({ type: 'success', message: `${category.toUpperCase()} settings updated successfully!` });
    } catch (err: any) {
      setStatus({ type: 'error', message: `Failed to save: ${err.message}` });
    } finally {
      setSaving(null);
    }
  };

  const handleChange = (category: string, field: keyof EmailConfig, value: string) => {
    setConfigs(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] || { category, serviceId: '', templateId: '', publicKey: '' }),
        [field]: value
      }
    }));
  };

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setIsSending(true);
    setStatus(null);
    try {
      const result = await sendTestEmail(testEmail);
      if (result.success) {
        setStatus({ type: 'success', message: 'Test email sent successfully! Please check your inbox (and spam folder).' });
        setTestEmail('');
      } else {
        setStatus({ type: 'error', message: `Failed to send email: ${JSON.stringify(result.error)}` });
      }
    } catch (error: any) {
      setStatus({ type: 'error', message: `An error occurred: ${error.message}` });
    } finally {
      setIsSending(false);
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
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-brand-blue/10 rounded-2xl">
            <Mail className="w-6 h-6 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">Email Management</h1>
            <p className="text-gray-500">Configure and test EmailJS settings for all departments</p>
          </div>
        </div>
      </div>

      {status && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-xl flex items-start space-x-3 ${
            status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5" />
          )}
          <p className="text-sm font-medium">{status.message}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {CATEGORIES.map((cat) => {
            const config = configs[cat.id] || { category: cat.id, serviceId: '', templateId: '', publicKey: '' };
            const Icon = cat.icon;
            
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 rounded-3xl border border-gray-100 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Icon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{cat.name}</h3>
                      <p className="text-xs text-gray-500">{cat.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSave(cat.id)}
                    disabled={saving === cat.id}
                    className="px-4 py-2 bg-brand-blue text-white rounded-xl text-sm font-bold flex items-center space-x-2 hover:bg-brand-blue/90 transition-all disabled:opacity-50"
                  >
                    {saving === cat.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Service ID</label>
                    <input
                      type="text"
                      value={config.serviceId}
                      onChange={(e) => handleChange(cat.id, 'serviceId', e.target.value)}
                      placeholder="e.g. service_xxxxxx"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Public Key</label>
                    <input
                      type="text"
                      value={config.publicKey}
                      onChange={(e) => handleChange(cat.id, 'publicKey', e.target.value)}
                      placeholder="e.g. user_xxxxxx"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Template ID (Primary)</label>
                    <input
                      type="text"
                      value={config.templateId}
                      onChange={(e) => handleChange(cat.id, 'templateId', e.target.value)}
                      placeholder="e.g. template_xxxxxx"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Template ID (Secondary)</label>
                    <input
                      type="text"
                      value={config.templateSecondaryId || ''}
                      onChange={(e) => handleChange(cat.id, 'templateSecondaryId', e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Private Key (Optional)</label>
                    <input
                      type="password"
                      value={config.privateKey || ''}
                      onChange={(e) => handleChange(cat.id, 'privateKey', e.target.value)}
                      placeholder="For internal reference"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Role/Description</label>
                    <input
                      type="text"
                      value={config.description || ''}
                      onChange={(e) => handleChange(cat.id, 'description', e.target.value)}
                      placeholder="e.g. Handles user registration"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-brand-blue/20 outline-none"
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="space-y-6">
          {/* Test Email Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-panel p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-6"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-4">Send Test Email</h2>
            <p className="text-xs text-gray-500 mb-6">Uses the "Teams & Finance" configuration to send a test message.</p>
            <form onSubmit={handleTestEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Email</label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="Enter email to receive test"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue outline-none transition-all"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSending || !testEmail}
                className="w-full py-3 bg-gradient-brand text-white rounded-xl font-bold flex items-center justify-center space-x-2 disabled:opacity-50 transition-all hover:shadow-lg active:scale-95"
              >
                {isSending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Send Test Email</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 p-4 bg-brand-blue/5 rounded-2xl border border-brand-blue/10">
              <h3 className="text-sm font-bold text-brand-blue mb-2 flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>Quick Setup Guide</span>
              </h3>
              <ul className="text-xs text-brand-blue/80 space-y-2 list-disc list-inside">
                <li>Create 5 separate EmailJS services for each email address.</li>
                <li>Match the Service ID and Public Key for each category.</li>
                <li>Ensure Template IDs are correctly mapped to their roles.</li>
                <li>Settings are applied in real-time once saved.</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

