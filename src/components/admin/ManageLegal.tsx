import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Save, FileText } from 'lucide-react';

export default function ManageLegal() {
  const [termsContent, setTermsContent] = useState('');
  const [privacyContent, setPrivacyContent] = useState('');
  const [refundContent, setRefundContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const termsDoc = await getDoc(doc(db, 'pages', 'termsOfService'));
      if (termsDoc.exists()) {
        setTermsContent(termsDoc.data().content || '');
      }

      const privacyDoc = await getDoc(doc(db, 'pages', 'privacyPolicy'));
      if (privacyDoc.exists()) {
        setPrivacyContent(privacyDoc.data().content || '');
      }

      const refundDoc = await getDoc(doc(db, 'pages', 'refundPolicy'));
      if (refundDoc.exists()) {
        setRefundContent(refundDoc.data().content || '');
      }
    } catch (error) {
      console.error("Error fetching legal content:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTerms = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await setDoc(doc(db, 'pages', 'termsOfService'), {
        content: termsContent,
        updatedAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Terms of Service saved successfully!' });
    } catch (error) {
      console.error("Error saving terms:", error);
      setMessage({ type: 'error', text: 'Failed to save Terms of Service.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await setDoc(doc(db, 'pages', 'privacyPolicy'), {
        content: privacyContent,
        updatedAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Privacy Policy saved successfully!' });
    } catch (error) {
      console.error("Error saving privacy policy:", error);
      setMessage({ type: 'error', text: 'Failed to save Privacy Policy.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRefund = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await setDoc(doc(db, 'pages', 'refundPolicy'), {
        content: refundContent,
        updatedAt: new Date().toISOString()
      });
      setMessage({ type: 'success', text: 'Refund Policy saved successfully!' });
    } catch (error) {
      console.error("Error saving refund policy:", error);
      setMessage({ type: 'error', text: 'Failed to save Refund Policy.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold text-gray-900">Manage Legal Pages</h2>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="w-6 h-6 text-brand-blue" />
          <h3 className="text-xl font-bold text-gray-900">Terms of Service</h3>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Content (Markdown or HTML supported)</label>
          <textarea
            value={termsContent}
            onChange={(e) => setTermsContent(e.target.value)}
            rows={15}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono text-sm"
            placeholder="Enter Terms of Service content here..."
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSaveTerms}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-brand-blue text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Terms of Service'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="w-6 h-6 text-brand-blue" />
          <h3 className="text-xl font-bold text-gray-900">Privacy Policy</h3>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Content (Markdown or HTML supported)</label>
          <textarea
            value={privacyContent}
            onChange={(e) => setPrivacyContent(e.target.value)}
            rows={15}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono text-sm"
            placeholder="Enter Privacy Policy content here..."
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSavePrivacy}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-brand-blue text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Privacy Policy'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="w-6 h-6 text-brand-blue" />
          <h3 className="text-xl font-bold text-gray-900">Refund Policy</h3>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Content (Markdown or HTML supported)</label>
          <textarea
            value={refundContent}
            onChange={(e) => setRefundContent(e.target.value)}
            rows={15}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono text-sm"
            placeholder="Enter Refund Policy content here..."
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleSaveRefund}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-brand-blue text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Saving...' : 'Save Refund Policy'}
          </button>
        </div>
      </div>
    </div>
  );
}
