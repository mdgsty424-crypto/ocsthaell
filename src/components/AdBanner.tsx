import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';

interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  position: string;
  active: boolean;
}

export default function AdBanner({ position }: { position: 'hero' | 'section' | 'sidebar' }) {
  const [ads, setAds] = useState<Ad[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'ads'),
      where('active', '==', true),
      where('position', '==', position)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ad[];
      setAds(adsData);
    });

    return () => unsubscribe();
  }, [position]);

  if (ads.length === 0) return null;

  // Simple rotation if multiple ads exist for the same position
  const ad = ads[0]; 

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full my-8 rounded-2xl overflow-hidden glass-panel relative group"
    >
      <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block relative aspect-[21/9] md:aspect-[32/9]">
        <img 
          src={ad.imageUrl} 
          alt={ad.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#00F0FF] mb-2 block">Sponsored</span>
            <h3 className="text-xl md:text-2xl font-display font-bold text-white">{ad.title}</h3>
          </div>
        </div>
      </a>
    </motion.div>
  );
}
