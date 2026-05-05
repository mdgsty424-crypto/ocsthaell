import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Share2 } from 'lucide-react';
import SEO from '../components/SEO';
import { generateImgAlt } from '../lib/seo-utils';

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

  const handleShare = async (image: GalleryImage) => {
    const url = `${window.location.origin}/gallery#${image.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: image.title,
          text: `Check out this image in our gallery: ${image.title}`,
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

  const gallerySchema = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "name": "OCSTHAEL Gallery",
    "description": "A visual journey through the OCSTHAEL ecosystem.",
    "image": images.map(img => ({
      "@type": "ImageObject",
      "contentUrl": img.imageUrl,
      "name": img.title
    }))
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-white">
      <SEO 
        title="Gallery | OCSTHAEL"
        description="A visual journey through the OCSTHAEL ecosystem, events, and technological milestones."
        image={images[0]?.imageUrl}
        url={window.location.href}
        type="website"
        schema={gallerySchema}
      />
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
                id={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="break-inside-avoid rounded-3xl overflow-hidden glass-panel relative group border border-gray-100 shadow-lg"
              >
                <img 
                  src={image.imageUrl} 
                  alt={generateImgAlt(image.title, 'Gallery')} 
                  title={image.title}
                  className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">{image.title}</h3>
                    <button 
                      onClick={() => handleShare(image)}
                      className="p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/40 transition-all"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
