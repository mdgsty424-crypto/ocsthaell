import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Users, Search, Briefcase, Mail, Phone, ExternalLink } from 'lucide-react';

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: string;
  photoURL?: string;
  occupation?: string;
  phone?: string;
  ocId?: string;
}

export default function Members() {
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const membersData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            // Handle Firestore timestamp or ISO string
            createdAt: data.createdAt?.toDate?.()?.toLocaleDateString() || 
                       (data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'N/A')
          };
        }) as (UserProfile & { createdAt: string })[];
        
        // Filter out admins to show only registered members
        const registeredMembers = membersData.filter(m => m.role === 'user');
        setMembers(registeredMembers);
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const filteredMembers = members.filter(member => 
    member.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.occupation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[#05070a]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-display font-bold text-white mb-4"
          >
            Registered <span className="text-transparent bg-clip-text bg-gradient-brand">Members</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Connect with our growing community of professionals and enthusiasts.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-xl mx-auto mb-12 relative"
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search members by name, occupation, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-4 bg-[#0a0f19] border border-gray-800 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent shadow-sm transition-all"
          />
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#0a0f19] rounded-2xl shadow-sm border border-gray-800 overflow-hidden hover:shadow-md hover:border-gray-700 transition-all group flex flex-col"
              >
                <div className="p-6 flex flex-col items-center text-center flex-grow">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 mb-4 border-4 border-[#05070a] shadow-sm group-hover:scale-105 transition-transform duration-300">
                    {member.photoURL || (member as any).imageUrl || (member as any).image || (member as any).profilePhoto || (member as any).avatar || (member as any).profilePicture || (member as any).memberPhoto ? (
                      <img 
                        src={member.photoURL || (member as any).imageUrl || (member as any).image || (member as any).profilePhoto || (member as any).avatar || (member as any).profilePicture || (member as any).memberPhoto} 
                        alt={member.displayName || (member as any).name || 'Member'} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                        crossOrigin="anonymous" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500 bg-gray-800">
                        <Users className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-0.5">{member.displayName || (member as any).name || 'Anonymous User'}</h3>
                  {(member as any).nameBengali && (
                    <p className="text-sm text-gray-400 mb-1 font-medium">{(member as any).nameBengali}</p>
                  )}
                  <p className="text-xs text-gray-500 mb-2 font-mono">{member.ocId || 'No OC-ID'}</p>
                  
                  {member.occupation && (
                    <div className="flex items-center text-sm text-brand-blue font-medium mb-3">
                      <Briefcase className="w-4 h-4 mr-1" />
                      {member.occupation}
                    </div>
                  )}

                  <div className="w-full pt-4 mt-2 border-t border-gray-800 space-y-2 text-left">
                    {member.email && (
                      <div className="flex items-center text-sm text-gray-400">
                        <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center text-sm text-gray-400">
                        <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{member.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center text-xs text-gray-500 pt-1">
                      <Users className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span>Joined: {(member as any).createdAt}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 border-t border-gray-800 bg-[#05070a]/50">
                  <Link 
                    to={`/${member.ocId || member.id}/profile`}
                    className="flex items-center justify-center w-full py-2 px-4 bg-brand-blue/10 text-brand-blue hover:bg-brand-blue hover:text-white rounded-xl transition-colors font-medium text-sm"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && filteredMembers.length === 0 && (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No members found</h3>
            <p className="text-gray-400">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}
