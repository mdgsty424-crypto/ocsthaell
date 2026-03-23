import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Markdown from 'react-markdown';

export default function PrivacyPolicy() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = await getDoc(doc(db, 'pages', 'privacyPolicy'));
        if (docRef.exists() && docRef.data().content) {
          setContent(docRef.data().content);
        }
      } catch (error) {
        console.error("Error fetching privacy policy:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-white text-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12"
        >
          <div className="flex items-center space-x-4 mb-8 pb-8 border-b border-gray-100">
            <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center">
              <Shield className="w-8 h-8 text-brand-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900">Privacy Policy for ocsthael.com</h1>
              <p className="text-gray-500 mt-1">Last Updated: March 2026</p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-gray-600 space-y-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : content ? (
              <div className="markdown-body">
                <Markdown>{content}</Markdown>
              </div>
            ) : (
              <>
                <p className="text-lg">
                  Welcome to ocsthael.com. Your privacy is our top priority. This Privacy Policy explains how we collect, use, and protect your information when you register through our unified system.
                </p>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
                  <p className="mb-4">To provide a secure and verified experience across all our applications, we collect the following information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Personal Identity:</strong> Name, Email Address, and Phone Number.</li>
                    <li><strong>Verification Documents:</strong> Scanned copies of NID or Birth Certificate and Digital Signature.</li>
                    <li><strong>Profile Data:</strong> Profile Picture, Bio, and a unique User ID (OC-ID).</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Why We Collect This Data</h2>
                  <p className="mb-4">We use your information for the following purposes:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Identity Verification:</strong> To prevent fraudulent accounts and ensure every member is a real person.</li>
                    <li><strong>Unified Access (SSO):</strong> To allow you to log in to all current and future ocsthael apps using a single set of credentials.</li>
                    <li><strong>Account Recovery:</strong> To help you regain access to your account if you lose your password.</li>
                    <li><strong>Community Safety:</strong> To maintain a trusted environment for all users within our ecosystem.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Data Sharing & Disclosure</h2>
                  <p className="mb-4">We do not sell, rent, or trade your personal data to third-party marketing agencies.</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Internal Ecosystem:</strong> Your profile data (Name, Photo, OC-ID) is shared across our sub-domains and official apps to provide a seamless experience.</li>
                    <li><strong>Legal Requirements:</strong> We only disclose information if required by law or in response to valid requests by public authorities (e.g., a court or government agency).</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
                  <p className="mb-4">We use industry-standard security measures:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Storage:</strong> Images are securely hosted on Cloudinary, and data is managed via Firebase (Google Cloud) with end-to-end encryption.</li>
                    <li><strong>Access Control:</strong> Only authorized administrators can access sensitive documents for verification purposes.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
                  <p className="mb-4">You have the right to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Access and update your personal information via the Manual Edit or Profile settings.</li>
                    <li>Request the deletion of your account and associated data (subject to verification).</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Consent</h2>
                  <p>
                    By clicking "Register" or "I Agree," you consent to the collection and use of your information as described in this policy.
                  </p>
                </section>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
