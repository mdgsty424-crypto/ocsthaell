import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Download,
  Star,
  Shield,
  Zap,
  Globe,
  Users,
  MessageCircle,
  Wallet,
  ShoppingCart,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function AppDetails() {
  const { id } = useParams<{ id: string }>();
  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApp = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "apps", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setApp({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching app details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApp();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-4 flex justify-center items-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen pt-32 px-4 text-center bg-white">
        <h1 className="text-4xl text-gray-900 font-bold mb-4">App Not Found</h1>
        <Link to="/" className="text-brand-blue hover:underline">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center text-gray-500 hover:text-brand-blue mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2"
          >
            <div className="flex items-center gap-6 mb-6">
              <div
                className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${app.color || "from-brand-blue to-brand-mango"} p-[2px]`}
              >
                <div className="w-full h-full bg-white rounded-3xl flex items-center justify-center overflow-hidden">
                  {app.iconUrl ? (
                    <img
                      src={app.iconUrl}
                      alt={app.name}
                      className="w-16 h-16 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-brand-blue" />
                  )}
                </div>
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-2">
                  {app.name}
                </h1>
                <p className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-mango font-medium">
                  {app.tagline}
                </p>
              </div>
            </div>

            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              {app.description}
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href={app.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl bg-brand-blue text-white font-bold hover:bg-brand-blue/90 transition-all flex items-center shadow-lg"
              >
                <Download className="w-5 h-5 mr-2" /> Download App
              </a>
              <a
                href={app.link}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all flex items-center"
              >
                <Globe className="w-5 h-5 mr-2" /> Open Web Version
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-50 border border-gray-100 rounded-2xl p-8 h-fit"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              App Information
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-500">Rating</span>
                <span className="text-gray-900 font-bold flex items-center">
                  <Star className="w-4 h-4 text-yellow-500 mr-1 fill-yellow-500" />{" "}
                  {app.rating || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-500">Downloads</span>
                <span className="text-gray-900 font-bold">
                  {app.downloads || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <span className="text-gray-500">Status</span>
                <span className="text-brand-blue font-bold flex items-center">
                  <Shield className="w-4 h-4 mr-1" /> Verified
                </span>
              </div>
              {app.publishDate && (
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <span className="text-gray-500">Expected Launch</span>
                  <span className="text-gray-900 font-bold">
                    {app.publishDate}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Features & Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {app.features && app.features.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">
                Key Features
              </h2>
              <div className="space-y-4">
                {app.features.map((feature: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center p-4 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <CheckCircle2 className="w-6 h-6 text-brand-blue mr-4 flex-shrink-0" />
                    <span className="text-gray-700 text-lg">{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {app.gallery && app.gallery.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Gallery</h2>
              <div className="grid grid-cols-1 gap-4">
                {app.gallery.map((img: string, idx: number) => (
                  <div
                    key={idx}
                    className="rounded-xl overflow-hidden border border-gray-100 group"
                  >
                    <img
                      src={img}
                      alt={`${app.name} screenshot ${idx + 1}`}
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
