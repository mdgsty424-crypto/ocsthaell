import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Hexagon,
  Facebook,
  Youtube,
  Instagram,
  Twitter,
  Send,
  Users,
  ArrowRight,
} from "lucide-react";
import { motion } from "motion/react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { sendGeneralInfo } from "../services/emailService";

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success">("idle");

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "theme"), (doc) => {
      if (doc.exists() && doc.data().logoUrl) {
        setLogoUrl(doc.data().logoUrl);
      } else {
        setLogoUrl(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await sendGeneralInfo("Website Visitor", email, message);
      setStatus("success");
      setEmail("");
      setMessage("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (error) {
      console.error("Error sending message:", error);
      setStatus("idle");
      alert("Failed to send message. Please try again later.");
    }
  };

  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-blue/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Animated Contact Form Section */}
        <div className="mb-16 bg-gray-50 border border-gray-100 rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-display font-bold text-gray-900 mb-4"
              >
                Let's Build the Future Together
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-gray-600 text-lg mb-8"
              >
                Have questions or want to learn more about the OCSTHAEL
                ecosystem? Drop us a message and our team will get back to you
                shortly.
              </motion.p>
            </div>

            <motion.form
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              onSubmit={handleContactSubmit}
              className="space-y-4"
            >
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full bg-white border border-gray-200 rounded-xl px-6 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                />
              </div>
              <div className="relative">
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  rows={3}
                  className="w-full bg-white border border-gray-200 rounded-xl px-6 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all resize-none"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={status !== "idle"}
                className="w-full sm:w-auto px-8 py-4 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-blue/90 transition-colors flex items-center justify-center disabled:opacity-70"
              >
                {status === "sending" ? (
                  "Sending..."
                ) : status === "success" ? (
                  "Message Sent!"
                ) : (
                  <>
                    Send Message <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="OCSTHAEL Logo"
                  className="h-10 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Hexagon className="w-8 h-8 text-brand-blue" />
              )}
              <span className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-mango tracking-wider">
                OCSTHAEL
              </span>
            </Link>
            <p className="text-gray-600 text-sm leading-relaxed max-w-sm">
              Building a unified digital platform connecting communication,
              social networking, online income, browsing and e-commerce in one
              ecosystem.
            </p>
          </div>

          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-brand-blue transition-colors text-sm"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/team"
                  className="text-gray-600 hover:text-brand-blue transition-colors text-sm"
                >
                  Our Staff
                </Link>
              </li>
              <li>
                <Link
                  to="/careers"
                  className="text-gray-600 hover:text-brand-blue transition-colors text-sm"
                >
                  Careers
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-gray-600 hover:text-brand-blue transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-gray-600 hover:text-brand-blue transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Platforms</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/app/oc-social"
                  className="text-gray-600 hover:text-brand-blue transition-colors text-sm"
                >
                  OC Social
                </Link>
              </li>
              <li>
                <Link
                  to="/app/oc-chat"
                  className="text-gray-600 hover:text-brand-blue transition-colors text-sm"
                >
                  OC Chat
                </Link>
              </li>
              <li>
                <Link
                  to="/app/oc-income"
                  className="text-gray-600 hover:text-brand-blue transition-colors text-sm"
                >
                  OC Income
                </Link>
              </li>
              <li>
                <Link
                  to="/app/oc-browser"
                  className="text-gray-600 hover:text-brand-blue transition-colors text-sm"
                >
                  OC Browser
                </Link>
              </li>
              <li>
                <Link
                  to="/app/oc-shopping"
                  className="text-gray-600 hover:text-brand-blue transition-colors text-sm"
                >
                  OCSTHAEL Shopping
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-gray-900 font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@ocsthael.com"
                  className="text-gray-600 hover:text-brand-blue transition-colors text-sm"
                >
                  support@ocsthael.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+8801869657287"
                  className="text-gray-600 hover:text-brand-blue transition-colors text-sm"
                >
                  +8801869657287
                </a>
              </li>
              <li>
                <Link
                  to="/help-center"
                  className="text-brand-blue hover:text-brand-blue/80 transition-colors text-sm font-medium"
                >
                  Help Center (OCSTHAEL AI)
                </Link>
              </li>
            </ul>

            <h3 className="text-gray-900 font-semibold mt-6 mb-4">Social Media</h3>
            <div className="flex flex-wrap gap-3">
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue/50 transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue/50 transition-all"
              >
                <Youtube className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue/50 transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue/50 transition-all"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue/50 transition-all"
              >
                <Send className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue/50 transition-all"
              >
                <Users className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-blue hover:border-brand-blue/50 transition-all"
              >
                <Hexagon className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} OCSTHAEL. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              to="/admin/login"
              className="text-gray-500 hover:text-brand-blue text-sm transition-colors"
            >
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
