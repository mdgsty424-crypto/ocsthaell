import { motion } from 'motion/react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import React, { useState } from 'react';
import { sendInquiryMail } from '../services/emailService';

export default function Contact() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    
    const result = await sendInquiryMail({
      senderName: `${formData.firstName} ${formData.lastName}`,
      topic: 'General Inquiry from Contact Form',
      senderEmail: formData.email
    });

    if (result.success) {
      setStatus('success');
      setFormData({ firstName: '', lastName: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 text-brand-blue">Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-pink to-brand-mango">Touch</span></h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
            Have a project in mind or want to learn more about our ecosystem? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div>
              <h2 className="text-3xl font-display font-bold mb-6 text-brand-blue">Contact Information</h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                Our team is ready to assist you with any inquiries regarding our applications, services, or partnership opportunities.
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-brand-blue/10 flex items-center justify-center mr-6 shrink-0">
                  <Mail className="w-6 h-6 text-brand-blue" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold mb-1">Email Us</h4>
                  <p className="text-gray-600">contact@ocsthael.com</p>
                  <p className="text-gray-600">support@ocsthael.com</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-brand-pink/10 flex items-center justify-center mr-6 shrink-0">
                  <Phone className="w-6 h-6 text-brand-pink" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold mb-1">Call Us</h4>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                  <p className="text-gray-600">Mon-Fri, 9am-6pm EST</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 rounded-full bg-brand-mango/10 flex items-center justify-center mr-6 shrink-0">
                  <MapPin className="w-6 h-6 text-brand-mango" />
                </div>
                <div>
                  <h4 className="text-gray-900 font-bold mb-1">Visit Us</h4>
                  <p className="text-gray-600">100 Innovation Drive</p>
                  <p className="text-gray-600">Tech District, NY 10001</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-panel p-10 rounded-3xl relative overflow-hidden border border-gray-100 shadow-xl"
          >
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-blue rounded-full mix-blend-multiply filter blur-[80px] opacity-10"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-pink rounded-full mix-blend-multiply filter blur-[80px] opacity-10"></div>
            
            <h3 className="text-2xl font-bold text-brand-blue mb-8 relative z-10">Send a Message</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors resize-none"
                ></textarea>
              </div>
              
              <button
                type="submit"
                disabled={status === 'sending'}
                className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center transition-all ${
                  status === 'success' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gradient-brand text-white hover:shadow-lg disabled:opacity-50'
                }`}
              >
                {status === 'sending' ? (
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : status === 'success' ? (
                  'Message Sent!'
                ) : (
                  <>
                    Send Message <Send className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
