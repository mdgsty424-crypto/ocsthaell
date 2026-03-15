import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AppData {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  link: string;
}

export default function Apps() {
  const [apps, setApps] = useState<AppData[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'apps'), (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppData)));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="pt-32 pb-24 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 text-brand-blue">Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-pink to-brand-mango">Applications</span></h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
            Explore the OCSTHAEL digital ecosystem. A suite of interconnected, futuristic applications designed to elevate your digital experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {apps.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-500 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-brand-blue/10 to-brand-pink/10 rounded-bl-full -z-10 group-hover:opacity-20 transition-opacity"></div>
              
              <div className="flex items-start justify-between mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-pink p-[1px]">
                  <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center overflow-hidden">
                    <img src={app.iconUrl} alt={app.name} className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                  </div>
                </div>
                <a href={app.link} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-brand-blue transition-colors">
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
              
              <h3 className="text-2xl font-display font-bold mb-4 text-gray-900 group-hover:text-brand-pink transition-all">{app.name}</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">{app.description}</p>
              
              <Link to={`/apps/${app.id}`} className="inline-flex items-center text-sm font-bold uppercase tracking-wider text-brand-blue hover:text-brand-pink transition-colors">
                Learn More <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
