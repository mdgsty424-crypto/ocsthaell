import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Calendar, Share2, MessageSquare, User } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import SEO from "../components/SEO";

export default function NewsDetails() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "news", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching news details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = article?.title || "News Article";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: article?.description || title,
          url: url,
        });
      } catch (err) {
        console.warn('Share cancelled or failed:', err);
      }
    } else {
      // Fallback: Copy to clipboard
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

  if (!article) {
    return (
      <div className="min-h-screen pt-32 px-4 text-center bg-white">
        <h1 className="text-4xl text-gray-900 font-bold mb-4">Article Not Found</h1>
        <Link to="/news" className="text-brand-blue hover:underline">
          Return to News
        </Link>
      </div>
    );
  }

  const newsSchema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [article.imageUrl],
    "datePublished": article.date?.toDate ? article.date.toDate().toISOString() : new Date(article.date).toISOString(),
    "author": [{
      "@type": "Organization",
      "name": "OCSTHAEL Editorial",
      "url": window.location.origin
    }]
  };

  return (
    <div className="min-h-screen pt-24 pb-24 bg-white">
      <SEO 
        title={article.title}
        description={article.content ? article.content.substring(0, 160) + '...' : ''}
        image={article.imageUrl}
        url={window.location.href}
        type="article"
        schema={newsSchema}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            to="/news"
            className="inline-flex items-center text-gray-500 hover:text-brand-blue mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to News
          </Link>

          <div className="mb-10">
            <div className="flex items-center gap-4 text-brand-blue text-sm font-bold uppercase tracking-widest mb-6">
              <Calendar className="w-4 h-4" />
              {formatDate(article.date)}
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <User className="w-4 h-4" />
              OCSTHAEL Editorial
            </div>
            <h1 className="text-4xl md:text-6xl font-display font-black text-gray-900 mb-8 leading-tight">
              {article.title}
            </h1>
          </div>

          <div className="rounded-[3rem] overflow-hidden mb-12 shadow-2xl border border-gray-100">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-auto object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="prose prose-blue max-w-none">
            <div className="text-gray-700 text-xl leading-relaxed whitespace-pre-wrap font-light">
              {article.content}
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-gray-100 flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-xl text-gray-700 hover:bg-gray-100 transition-all active:scale-95"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
              <button className="flex items-center gap-2 px-6 py-3 bg-gray-50 rounded-xl text-gray-700 hover:bg-gray-100 transition-all">
                <MessageSquare className="w-4 h-4" /> 12 Comments
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-sm">Tags:</span>
              <span className="px-3 py-1 bg-brand-pink/10 text-brand-pink rounded-full text-xs font-bold uppercase tracking-widest">Technology</span>
              <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-xs font-bold uppercase tracking-widest">Innovation</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
