import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Linkedin, Twitter, ArrowRight, Mail, Facebook, Youtube, Globe, Award, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  type?: 'Executive' | 'General';
  imageUrl?: string;
  image?: string;
  bio?: string;
  social?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
  };
}

export default function Team() {
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'team'), (snapshot) => {
      setTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember)));
    });
    return () => unsubscribe();
  }, []);

  const executives = team.filter(m => m.type === 'Executive');
  const generalMembers = team.filter(m => m.type !== 'Executive');

  return (
    <div className="pt-32 pb-24 min-h-screen bg-white text-gray-900 overflow-hidden relative">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-display font-black mb-6 text-brand-blue">Our <span className="text-brand-pink">Staff</span></h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
            Meet the visionaries and experts behind OCSTHAEL. A diverse group dedicated to building the future.
          </p>
        </motion.div>

        {/* High-Profile/Dynamic Slides Section */}
        {executives.length > 0 && (
          <div className="space-y-32 mb-32">
            {executives.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
              >
                {/* Left Content */}
                <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <h2 className="text-5xl md:text-6xl font-display font-black mb-4 leading-[1.1] tracking-tight text-brand-blue">
                    {member.role}
                  </h2>
                  <p className="text-2xl font-bold text-brand-pink uppercase tracking-widest mb-8">
                    {member.name}
                  </p>
                  <p className="text-xl text-gray-700 mb-12 max-w-xl leading-relaxed font-medium opacity-80">
                    {member.bio || "Leading with vision and integrity to build a brighter digital future for Bangladesh. Committed to innovation and excellence in every endeavor."}
                  </p>
                  
                  {/* Circular Action Buttons */}
                  <div className="flex flex-wrap gap-8 mb-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full border-2 border-brand-blue/20 flex items-center justify-center shadow-sm bg-white/50">
                        <Users className="w-8 h-8 text-brand-blue" />
                      </div>
                      <span className="text-xs font-bold text-brand-blue uppercase tracking-widest">Leadership</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full border-2 border-brand-pink/20 flex items-center justify-center shadow-sm bg-white/50">
                        <TrendingUp className="w-8 h-8 text-brand-pink" />
                      </div>
                      <span className="text-xs font-bold text-brand-pink uppercase tracking-widest">Traction</span>
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 rounded-full border-2 border-brand-mango/20 flex items-center justify-center shadow-sm bg-white/50">
                        <Award className="w-8 h-8 text-brand-mango" />
                      </div>
                      <span className="text-xs font-bold text-brand-mango uppercase tracking-widest">Other</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <Link 
                      to={`/team/${member.id}`}
                      className="px-10 py-5 bg-gradient-brand text-white font-bold rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1 flex items-center"
                    >
                      More Details <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </div>
                </div>

                {/* Right Image */}
                <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="relative">
                    <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-2xl aspect-[4/5] border-8 border-white">
                      <img 
                        src={member.imageUrl || member.image} 
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
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* General Members Grid Section */}
        {generalMembers.length > 0 && (
          <div className="pt-20 border-t border-gray-100">
            <h2 className="text-4xl font-display font-black mb-12 text-center text-brand-blue">Our <span className="text-brand-pink">Staff</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-12">
              {generalMembers.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="text-center group"
                >
                  <div className="relative mb-6 mx-auto w-40 h-40 sm:w-48 sm:h-48">
                    <div className="absolute inset-0 bg-gradient-brand rounded-full scale-105 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                    <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-all duration-500">
                      <img 
                        src={member.imageUrl || member.image} 
                        alt={member.name} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-brand-pink transition-colors">{member.name}</h3>
                  <p className="text-sm font-bold text-brand-blue uppercase tracking-widest">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {team.length === 0 && (
          <div className="text-center text-gray-500 py-20">
            <p className="text-xl">Team members will be displayed here soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
