import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Mail,
  User as UserIcon,
  Briefcase,
  Calendar
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function MemberDetails() {
  const { id } = useParams<{ id: string }>();
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMember = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "users", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMember({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching member details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMember();
  }, [id]);

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
          Member Not Found
        </h1>
        <Link to="/" className="text-brand-blue hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden relative">
      {/* Organic Liquid Blobs */}
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-32 pb-20">
        <Link
          to="/"
          className="inline-flex items-center text-gray-500 hover:text-brand-blue mb-12 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-7xl font-display font-black mb-4 leading-[1.1] tracking-tight text-brand-blue">
              Registered Member
            </h1>
            <p className="text-2xl font-bold text-brand-pink uppercase tracking-widest mb-8">
              {member.displayName || "Anonymous User"}
            </p>
            
            <div className="space-y-6 mb-12">
              {member.occupation && (
                <div className="flex items-center text-gray-700">
                  <Briefcase className="w-6 h-6 mr-4 text-brand-blue" />
                  <span className="text-xl">{member.occupation}</span>
                </div>
              )}
              {member.email && (
                <div className="flex items-center text-gray-700">
                  <Mail className="w-6 h-6 mr-4 text-brand-pink" />
                  <span className="text-xl">{member.email}</span>
                </div>
              )}
              {member.createdAt && (
                <div className="flex items-center text-gray-700">
                  <Calendar className="w-6 h-6 mr-4 text-brand-mango" />
                  <span className="text-xl">Joined: {new Date(member.createdAt?.seconds * 1000).toLocaleDateString() || 'Recently'}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-6">
              <a 
                href={`mailto:${member.email}`}
                className="px-10 py-5 bg-gradient-brand text-white font-bold rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1 flex items-center"
              >
                <Mail className="w-5 h-5 mr-2" /> Send Message
              </a>
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-2xl aspect-[4/5] border-8 border-white bg-gray-100 flex items-center justify-center">
              {member.photoURL ? (
                <img 
                  src={member.photoURL} 
                  alt={member.displayName} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserIcon className="w-48 h-48 text-gray-300" />
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
