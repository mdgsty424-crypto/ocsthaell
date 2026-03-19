import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCcw } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Markdown from 'react-markdown';

export default function RefundPolicy() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docRef = await getDoc(doc(db, 'pages', 'refundPolicy'));
        if (docRef.exists() && docRef.data().content) {
          setContent(docRef.data().content);
        }
      } catch (error) {
        console.error("Error fetching refund policy:", error);
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
              <RefreshCcw className="w-8 h-8 text-brand-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-white">Refund Policy</h1>
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
                  Welcome to our Refund Policy. This page outlines the conditions under which refunds are provided.
                </p>
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">1. General Policy</h2>
                  <p className="mb-4">
                    All transactions are final unless otherwise specified in this policy. We strive to provide the best service possible, but we understand that issues may arise.
                  </p>
                </section>
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility for Refunds</h2>
                  <p className="mb-4">
                    Refunds may be granted under the following circumstances:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Service not delivered as described.</li>
                    <li>Technical issues preventing access to purchased features.</li>
                    <li>Duplicate charges or billing errors.</li>
                  </ul>
                </section>
                <section>
                  <h2 className="text-2xl font-bold text-white mb-4">3. How to Request a Refund</h2>
                  <p className="mb-4">
                    To request a refund, please contact our support team with your transaction details and the reason for your request.
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
