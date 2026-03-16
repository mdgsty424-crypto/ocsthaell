import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Code, Search, Globe } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function ManageSEO() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [seoData, setSeoData] = useState({
    siteTitle: 'OCSTHAEL - Your Complete Digital Ecosystem',
    metaDescription: 'OCSTHAEL is building a unified digital platform connecting communication, social networking, online income, browsing and e-commerce in one ecosystem.',
    metaKeywords: 'digital ecosystem, social network, online income, secure chat, web browser',
    googleAnalyticsId: '',
    facebookPixelId: '',
    customHeadScript: '',
    customBodyScript: ''
  });

  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const docRef = doc(db, 'settings', 'seo');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSeoData(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Error fetching SEO data:", error);
      }
    };
    fetchSEO();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSeoData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await setDoc(doc(db, 'settings', 'seo'), seoData);
      setMessage({ type: 'success', text: 'SEO & Script settings saved successfully!' });
      
      // In a real app, you would need a mechanism to inject these scripts into the document head/body
      // This is often handled at the server level or via a dedicated component in the app root.
    } catch (error) {
      console.error("Error saving SEO data:", error);
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold text-brand-blue flex items-center">
          <Search className="w-8 h-8 mr-3 text-brand-blue" />
          Script & SEO Control
        </h2>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center px-6 py-3 bg-gradient-brand text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Globe className="w-5 h-5 mr-2 text-gray-400" /> Global SEO Meta Tags
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Default Site Title</label>
              <input
                type="text"
                name="siteTitle"
                value={seoData.siteTitle}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue"
                placeholder="e.g., OCSTHAEL - Digital Ecosystem"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Meta Description</label>
              <textarea
                name="metaDescription"
                value={seoData.metaDescription}
                onChange={handleChange}
                rows={4}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue resize-none"
                placeholder="Brief description of the website for search engines..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Meta Keywords (Comma separated)</label>
              <input
                type="text"
                name="metaKeywords"
                value={seoData.metaKeywords}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue"
                placeholder="tech, ecosystem, social, chat"
              />
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Code className="w-5 h-5 mr-2 text-gray-400" /> Tracking & Custom Scripts
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Google Analytics ID (e.g., G-XXXXXXXXXX)</label>
              <input
                type="text"
                name="googleAnalyticsId"
                value={seoData.googleAnalyticsId}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue font-mono"
                placeholder="G-"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Facebook Pixel ID</label>
              <input
                type="text"
                name="facebookPixelId"
                value={seoData.facebookPixelId}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue font-mono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Custom &lt;head&gt; Scripts</label>
              <textarea
                name="customHeadScript"
                value={seoData.customHeadScript}
                onChange={handleChange}
                rows={4}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue font-mono text-sm resize-none"
                placeholder="<!-- Paste custom scripts here -->"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Custom &lt;body&gt; Scripts</label>
              <textarea
                name="customBodyScript"
                value={seoData.customBodyScript}
                onChange={handleChange}
                rows={4}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue font-mono text-sm resize-none"
                placeholder="<!-- Paste custom scripts here -->"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
