import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { generateImgAlt } from '../lib/seo-utils';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  date: any; // Firestore timestamp
}

export default function News() {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'news'), (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem)));
    });
    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  };

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <SEO 
        title="News & Updates"
        description="Stay updated with the latest news, announcements and product releases from OCSTHAEL."
        url={window.location.href}
        type="website"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">News & <span className="text-gradient">Updates</span></h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
            Stay informed with the latest announcements, product releases, and insights from OCSTHAEL.
          </p>
        </motion.div>

        {news.length === 0 ? (
          <div className="text-center text-gray-500 py-20">
            <p className="text-xl">News items will be displayed here soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {news.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group glass-panel rounded-3xl overflow-hidden flex flex-col hover:glow-pink transition-all duration-500"
              >
                <div className="aspect-video overflow-hidden relative">
                  <img 
                    src={item.imageUrl} 
                    alt={generateImgAlt(item.title, 'News')} 
                    title={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60"></div>
                  <div className="absolute bottom-4 left-6 flex items-center text-brand-blue text-sm font-medium">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(item.date)}
                  </div>
                </div>
                
                <div className="p-8 flex-1 flex flex-col">
                  <h3 className="text-2xl font-display font-bold text-gray-900 mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-brand-blue group-hover:to-brand-pink transition-all line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-8 flex-1 line-clamp-3">
                    {item.content}
                  </p>
                  
                  <Link to={`/news/${item.id}`} className="inline-flex items-center text-sm font-semibold uppercase tracking-wider text-red-600 hover:text-brand-blue transition-colors self-start">
                    Read Full Article <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
