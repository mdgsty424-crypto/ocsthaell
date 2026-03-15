import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, HelpCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendSupportTicket } from '../services/emailService';

export default function HelpCenter() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    type: 'help', // 'help' or 'report'
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');

    try {
      // Save to Firestore
      await addDoc(collection(db, 'support_tickets'), {
        ...formData,
        createdAt: serverTimestamp(),
        status: 'open'
      });

      // Send Email Notification
      await sendSupportTicket(
        formData.name,
        formData.email,
        `[${formData.type.toUpperCase()}] ${formData.subject}`,
        formData.message
      );

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', type: 'help', message: '' });
    } catch (error) {
      console.error("Error submitting ticket:", error);
      setStatus('error');
    }
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-display font-bold text-brand-blue mb-4">Help & Support Center</h1>
          <p className="text-lg text-gray-600">
            Need assistance or want to report an issue? Our team is here to help.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-8"
        >
          {status === 'success' ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Sent Successfully!</h2>
              <p className="text-gray-600 mb-8">
                Thank you for reaching out. Our support team will review your request and get back to you shortly.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="px-6 py-3 bg-brand-blue text-white font-medium rounded-xl hover:bg-brand-blue/90 transition-colors"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
                  <div className="relative">
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleChange}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    >
                      <option value="help">General Help / Inquiry</option>
                      <option value="report">Report an Issue / Bug</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                      {formData.type === 'help' ? <HelpCircle className="w-5 h-5 text-brand-blue" /> : <AlertTriangle className="w-5 h-5 text-brand-pink" />}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                    placeholder="Brief description of your request"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message Details</label>
                <textarea
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue"
                  placeholder="Please provide as much detail as possible..."
                ></textarea>
              </div>

              {status === 'error' && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200">
                  There was an error submitting your request. Please try again.
                </div>
              )}

              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full flex items-center justify-center px-8 py-4 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 transition-colors disabled:opacity-50 shadow-lg"
              >
                {status === 'submitting' ? 'Submitting...' : (
                  <>
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Submit Request
                  </>
                )}
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
}
