import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Linkedin, Twitter, Mail, Facebook, Youtube } from 'lucide-react';
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

export default function Staff() {
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'team'), (snapshot) => {
      setTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember)));
    });
    return () => unsubscribe();
  }, []);

  const generalMembers = team.filter(m => m.type !== 'Executive');

  return (
    <div className="pt-32 pb-24 min-h-screen bg-white text-gray-900 overflow-hidden relative">
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
            Meet the dedicated employees and staff members who drive OCSTHAEL forward every day.
          </p>
        </motion.div>

        {/* General Members Grid Section */}
        {generalMembers.length > 0 && (
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
                <Link to={`/staff/${member.id}`} className="block">
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
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {generalMembers.length === 0 && (
          <div className="text-center text-gray-500 py-20">
            <p className="text-xl">Staff members will be displayed here soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
