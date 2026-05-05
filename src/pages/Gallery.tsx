import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      setImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage)));
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
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 text-brand-blue">Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-pink to-brand-mango">Gallery</span></h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
            A visual journey through the OCSTHAEL ecosystem, events, and technological milestones.
          </p>
        </motion.div>

        {images.length === 0 ? (
          <div className="text-center text-gray-400 py-20">
            <p className="text-xl">Gallery images will be displayed here soon.</p>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="break-inside-avoid rounded-3xl overflow-hidden glass-panel relative group border border-gray-100 shadow-lg"
              >
                <img 
                  src={image.imageUrl} 
                  alt={image.title} 
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/80 via-brand-pink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                  <h3 className="text-xl font-bold text-white">{image.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
