import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Careers() {
  return (
    <div className="pt-24 pb-16 min-h-screen bg-[#05070a] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-4"
          >
            Join the <span className="text-transparent bg-clip-text bg-gradient-brand">OCSTHAEL</span> Team
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Help us build the future of unified digital ecosystems. We're always looking for talented individuals to join our mission.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0a0f19] rounded-2xl shadow-sm border border-gray-800 p-8 md:p-12 text-center max-w-3xl mx-auto"
        >
          <div className="w-20 h-20 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-brand-blue" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">No Open Positions Currently</h2>
          <p className="text-gray-400 mb-8">
            We don't have any open positions at the moment, but we're always interested in connecting with great talent. Send us your resume and we'll keep you in mind for future opportunities.
          </p>
          <a
            href="mailto:careers@ocsthael.com"
            className="inline-flex items-center justify-center space-x-2 px-8 py-3 bg-brand-blue text-white rounded-xl hover:bg-blue-600 transition-colors font-medium"
          >
            <span>Email Your Resume</span>
            <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </div>
  );
}
