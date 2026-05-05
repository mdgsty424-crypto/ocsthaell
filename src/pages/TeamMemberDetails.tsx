import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Mail,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
  Globe,
  Award,
  TrendingUp,
  Users,
  Share2
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import SEO from "../components/SEO";

export default function TeamMemberDetails() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "team", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMember({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching team member details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

  const handleShare = async () => {
    const url = window.location.href;
    const title = `${member?.name} - ${member?.role || "Team Member"}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: member?.bio || title,
          url: url,
        });
      } catch (err) {
        console.warn('Share cancelled or failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-4 flex justify-center items-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen pt-32 px-4 text-center bg-white">
        <h1 className="text-4xl text-gray-900 font-bold mb-4">
          Team Member Not Found
        </h1>
        <Link to="/" className="text-brand-blue hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": member.name,
    "jobTitle": member.role,
    "image": member.imageUrl || member.image,
    "description": member.bio,
    "url": window.location.href
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden relative">
      <SEO 
        title={`${member.name} | ${member.role || 'Executive'}`}
        description={member.bio ? member.bio.substring(0, 160) : `Meet ${member.name}, our ${member.role || 'Executive'}.`}
        image={member.imageUrl || member.image}
        url={window.location.href}
        type="article"
        schema={personSchema}
      />
      {/* Organic Liquid Blobs (Matching Image Template) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-5%] w-[70%] h-[70%] bg-gradient-to-br from-brand-pink/10 to-brand-blue/10 rounded-full blur-[120px] opacity-60"
          style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
        ></motion.div>
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, -5, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-5%] left-[-5%] w-[50%] h-[50%] bg-gradient-to-tr from-brand-blue/10 to-brand-mango/10 rounded-full blur-[100px] opacity-40"
          style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
        ></motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-32 pb-20">
        <div className="flex justify-between items-center mb-12">
          <Link
            to="/"
            className="inline-flex items-center text-gray-500 hover:text-brand-blue transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
          </Link>
          <button 
            onClick={handleShare}
            className="p-4 bg-gray-50 rounded-2xl text-gray-700 hover:bg-gray-100 transition-all flex items-center gap-2 font-bold"
          >
            <Share2 className="w-5 h-5" /> Share
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content (Matching Template Layout) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl font-display font-black mb-4 leading-[1.1] tracking-tight text-brand-blue">
              Meet Our {member.role || "Executive"}
            </h1>
            <p className="text-2xl font-bold text-brand-pink uppercase tracking-widest mb-8">
              {member.name}
            </p>
            <p className="text-xl text-gray-700 mb-12 max-w-xl leading-relaxed font-medium opacity-80">
              {member.bio || "Leading with vision and integrity to build a brighter digital future for Bangladesh. Committed to innovation and excellence in every endeavor."}
            </p>
            
            {/* Circular Action Buttons (Matching Template) */}
            <div className="flex flex-wrap gap-8 mb-12">
              <motion.div 
                whileHover={{ y: -5 }}
                className="flex flex-col items-center gap-3 group cursor-pointer"
              >
                <div className="w-24 h-24 rounded-full border-2 border-brand-blue/20 flex items-center justify-center group-hover:border-brand-blue group-hover:bg-brand-blue/5 transition-all shadow-sm bg-white/50">
                  <Users className="w-10 h-10 text-brand-blue" />
                </div>
                <span className="text-sm font-bold text-brand-blue uppercase tracking-widest">Leadership</span>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="flex flex-col items-center gap-3 group cursor-pointer"
              >
                <div className="w-24 h-24 rounded-full border-2 border-brand-pink/20 flex items-center justify-center group-hover:border-brand-pink group-hover:bg-brand-pink/5 transition-all shadow-sm bg-white/50">
                  <TrendingUp className="w-10 h-10 text-brand-pink" />
                </div>
                <span className="text-sm font-bold text-brand-pink uppercase tracking-widest">Traction</span>
              </motion.div>
              
              <motion.div 
                whileHover={{ y: -5 }}
                className="flex flex-col items-center gap-3 group cursor-pointer"
              >
                <div className="w-24 h-24 rounded-full border-2 border-brand-mango/20 flex items-center justify-center group-hover:border-brand-mango group-hover:bg-brand-mango/5 transition-all shadow-sm bg-white/50">
                  <Award className="w-10 h-10 text-brand-mango" />
                </div>
                <span className="text-sm font-bold text-brand-mango uppercase tracking-widest">Other</span>
              </motion.div>
            </div>

            <div className="flex flex-wrap gap-6">
              <a 
                href={`mailto:${member.email || 'contact@ocsthael.com'}`}
                className="px-10 py-5 bg-gradient-brand text-white font-bold rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1 flex items-center"
              >
                <Mail className="w-5 h-5 mr-2" /> Contact Me
              </a>
              <div className="flex gap-4">
                <a href="#" className="w-16 h-16 rounded-2xl border-2 border-gray-100 flex items-center justify-center hover:bg-brand-blue/10 transition-all">
                  <Facebook className="w-6 h-6 text-brand-blue" />
                </a>
                <a href="#" className="w-16 h-16 rounded-2xl border-2 border-gray-100 flex items-center justify-center hover:bg-brand-pink/10 transition-all">
                  <Youtube className="w-6 h-6 text-brand-pink" />
                </a>
              </div>
            </div>
          </motion.div>

          {/* Right Image (Matching Template) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-2xl aspect-[4/5] border-8 border-white">
              <img 
                src={member.imageUrl || member.image || `https://picsum.photos/seed/${member.name}/1000/1200`} 
                alt={member.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Floating Badge */}
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-10 -left-10 bg-white/90 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 flex items-center gap-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center">
                <Globe className="w-8 h-8 text-brand-blue" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Global</p>
                <p className="text-2xl font-black text-gray-900">Strategy</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
