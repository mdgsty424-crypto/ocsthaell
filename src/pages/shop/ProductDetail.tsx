import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product, Review } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { 
  ArrowLeft, 
  ShoppingCart, 
  Star, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  User, 
  MessageSquare, 
  CheckCircle,
  Package,
  ChevronRight,
  ChevronLeft,
  Heart,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SEO from '../../components/SEO';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentImage, setCurrentImage] = useState(0);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', name: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProduct = async () => {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() } as Product);
      }
      setLoading(false);
    };
    fetchProduct();

    const q = query(collection(db, 'reviews'), where('productId', '==', id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
    }, (error) => {
      console.error("Error fetching reviews:", error);
      // Fallback if index is missing
      const fallbackQ = query(collection(db, 'reviews'), where('productId', '==', id));
      onSnapshot(fallbackQ, (snapshot) => {
        setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review)));
      });
    });
    return () => unsubscribe();
  }, [id]);

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        productId: id,
        userId: user?.uid || 'guest',
        userName: user?.displayName || newReview.name || 'Guest User',
        rating: newReview.rating,
        comment: newReview.comment,
        createdAt: serverTimestamp()
      });
      setNewReview({ rating: 5, comment: '', name: '' });
    } catch (err) {
      console.error('Error adding review:', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = product?.name || "Product";
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: product?.description || title,
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <Package size={64} className="text-gray-200 mb-4" />
      <h2 className="text-2xl font-black text-gray-900 mb-4">Product not found</h2>
      <button onClick={() => navigate('/shop')} className="text-brand-blue font-bold flex items-center gap-2">
        <ArrowLeft size={20} /> Back to Shop
      </button>
    </div>
  );

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images || [product.image],
    "description": product.description,
    "sku": product.id,
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "BDT",
      "price": product.discountPrice || product.price,
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": reviews.length > 0 ? {
      "@type": "AggregateRating",
      "ratingValue": product.rating || "5.0",
      "reviewCount": reviews.length
    } : undefined
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-32">
      <SEO 
        title={product.name}
        description={product.description.substring(0, 160)}
        image={product.images[0]}
        url={window.location.href}
        type="product"
        schema={productSchema}
      />
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 z-50 px-4 py-4 flex justify-between items-center pointer-events-none">
        <button 
          onClick={() => navigate(-1)} 
          className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg pointer-events-auto active:scale-90 transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex gap-2">
          <button 
            onClick={handleShare}
            className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg pointer-events-auto active:scale-90 transition-all"
          >
            <Share2 size={20} />
          </button>
          <button className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg pointer-events-auto active:scale-90 transition-all">
            <Heart size={20} />
          </button>
        </div>
      </div>

      {/* Image Slider */}
<div className="relative aspect-square bg-white overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            src={product.images[currentImage] || 'https://picsum.photos/seed/product/800/800'}
            alt={product.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </AnimatePresence>
        
        {product.images.length > 1 && (
          <>
            <button 
              onClick={() => setCurrentImage(prev => (prev === 0 ? product.images.length - 1 : prev - 1))}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white"
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              onClick={() => setCurrentImage(prev => (prev === product.images.length - 1 ? 0 : prev + 1))}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {product.images.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all ${currentImage === i ? 'w-6 bg-brand-blue' : 'w-1.5 bg-white/50'}`} 
            />
          ))}
        </div>
      </div>

      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-black/5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star size={16} className="fill-current" />
              <span className="text-sm font-black text-gray-900">{product.rating || '5.0'}</span>
            </div>
            <span className="text-gray-300">|</span>
            <span className="text-xs font-bold text-gray-400">{reviews.length} Reviews</span>
            {product.isOfficial && (
              <span className="ml-auto bg-brand-blue/10 text-brand-blue text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={10} /> OFFICIAL
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{product.name}</h1>
          
          <div className="flex items-end gap-3 mb-6">
            <span className="text-3xl font-black text-brand-blue">
              {product.discountPrice || product.price} TK
            </span>
            {product.discountPrice && (
              <span className="text-lg text-gray-300 line-through font-bold mb-1">
                {product.price} TK
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center text-center">
              <Truck size={20} className="text-brand-blue mb-1" />
              <span className="text-[10px] font-black text-gray-900">Free Delivery</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center text-center">
              <RotateCcw size={20} className="text-brand-pink mb-1" />
              <span className="text-[10px] font-black text-gray-900">7 Days Return</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-2xl flex flex-col items-center text-center">
              <ShieldCheck size={20} className="text-emerald-500 mb-1" />
              <span className="text-[10px] font-black text-gray-900">100% Authentic</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-3">Description</h3>
            <p className="text-gray-500 text-sm leading-relaxed font-medium">
              {product.description}
            </p>
          </div>

          {/* Seller Info */}
          <div className="bg-gray-50 p-4 rounded-3xl flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
              <Package size={24} className="text-brand-blue" />
            </div>
            <div className="flex-grow">
              <h4 className="font-black text-gray-900 text-sm">Official Store</h4>
              <p className="text-[10px] font-bold text-gray-400">Verified Seller</p>
            </div>
            <button className="px-4 py-2 bg-white text-brand-blue text-xs font-black rounded-xl border border-gray-100 shadow-sm">
              Chat
            </button>
          </div>

          {/* Reviews Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Reviews</h3>
              <button className="text-xs font-black text-brand-blue uppercase tracking-widest">View All</button>
            </div>

            <div className="space-y-6">
              {reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-gray-900">{review.userName}</h5>
                      <div className="flex items-center gap-1 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={8} className={i < review.rating ? 'fill-current' : 'text-gray-200'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>

            {/* Write Review */}
            <form onSubmit={handleAddReview} className="mt-8 bg-gray-50 p-6 rounded-3xl">
              <h4 className="text-sm font-black text-gray-900 mb-4">Write a Review</h4>
              {!user && (
                <input
                  type="text"
                  placeholder="Your Name"
                  className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold mb-4 outline-none"
                  value={newReview.name}
                  onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                  required
                />
              )}
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className={`p-2 rounded-xl transition-all ${newReview.rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                  >
                    <Star size={20} className={newReview.rating >= star ? 'fill-current' : ''} />
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Share your experience..."
                className="w-full bg-white border-none rounded-2xl py-3 px-4 text-sm font-bold mb-4 outline-none min-h-[100px]"
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                required
              />
              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-4 pb-8 flex gap-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => addToCart(product)}
          className="flex-grow bg-gray-100 text-gray-900 py-4 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <ShoppingCart size={20} /> Add to Cart
        </button>
        <button 
          onClick={() => {
            addToCart(product);
            navigate('/shop/checkout');
          }}
          className="flex-grow bg-brand-blue text-white py-4 rounded-2xl font-black shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
