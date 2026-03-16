import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Markdown from 'react-markdown';

export default function TermsOfService() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = await getDoc(doc(db, 'pages', 'termsOfService'));
        if (docRef.exists() && docRef.data().content) {
          setContent(docRef.data().content);
        }
      } catch (error) {
        console.error("Error fetching terms of service:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#05070a] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0f19] rounded-2xl shadow-sm border border-gray-800 p-8 md:p-12"
        >
          <div className="flex items-center space-x-4 mb-8 pb-8 border-b border-gray-800">
            <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-brand-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white">Terms of Service</h1>
              <p className="text-gray-400 mt-1">Last Updated: March 2026</p>
            </div>
          </div>

          <div className="prose prose-lg prose-invert max-w-none text-gray-300 space-y-8">
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
                  Welcome to ocsthael.com. By accessing or using our website and unified system, you agree to be bound by these Terms of Service.
                </p>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                  <p>
                    By registering an account or using our services, you agree to comply with and be bound by these Terms. If you do not agree, please do not use our services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">2. User Accounts and Verification</h2>
                  <p className="mb-4">To access certain features, you must register for an account.</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You must provide accurate, current, and complete information during registration.</li>
                    <li>You are responsible for safeguarding your password and OC-ID credentials.</li>
                    <li>We reserve the right to suspend or terminate accounts that provide false information or violate these terms.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">3. Acceptable Use</h2>
                  <p className="mb-4">You agree not to use our services to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Violate any local, state, national, or international law.</li>
                    <li>Impersonate any person or entity, or falsely state your affiliation with a person or entity.</li>
                    <li>Interfere with or disrupt the services or servers connected to the services.</li>
                    <li>Attempt to gain unauthorized access to any portion of the ecosystem.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">4. Intellectual Property</h2>
                  <p>
                    All content, trademarks, logos, and intellectual property on this site are the property of OCSTHAEL COMPANY. You may not use, reproduce, or distribute any content without our prior written permission.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">5. Limitation of Liability</h2>
                  <p>
                    OCSTHAEL COMPANY shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">6. Changes to Terms</h2>
                  <p>
                    We reserve the right to modify these Terms at any time. We will notify users of significant changes. Continued use of the services after changes constitutes your acceptance of the new Terms.
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
