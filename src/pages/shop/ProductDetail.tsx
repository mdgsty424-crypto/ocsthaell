import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product, Review } from '../../types';
import { Star, ShoppingCart, ShieldCheck, Truck, RotateCcw, User, MessageSquare, Package, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

const PriceDisplay = ({ realPrice, sellPrice }: { realPrice: number, sellPrice: number }) => {
  const discount = Math.round(((realPrice - sellPrice) / realPrice) * 100);
  return (
    <div className="flex items-center space-x-4 mb-6">
      <span className="text-4xl font-black text-brand-blue">৳{sellPrice}</span>
      {realPrice > sellPrice && (
        <div className="flex flex-col">
          <span className="text-gray-500 line-through text-sm">৳{realPrice}</span>
          <span className="text-red-500 text-xs font-bold uppercase tracking-tighter">Save {discount}%</span>
        </div>
      )}
    </div>
  );
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'products', id)).then(doc => {
      if (doc.exists()) {
        setProduct({ id: doc.id, ...doc.data() } as Product);
      }
    });
    const q = query(collection(db, 'reviews'), where('productId', '==', id));
    return onSnapshot(q, (snapshot) => setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review))));
  }, [id]);

  const handleReview = async () => {
    if (!comment.trim()) return;
    await addDoc(collection(db, 'reviews'), {
      productId: id,
      userName: guestName || 'Guest',
      rating,
      comment,
      createdAt: serverTimestamp()
    });
    setComment('');
    setGuestName('');
  };

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-bold">Loading product details...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#05070a] text-white">
      <div className="max-w-6xl mx-auto">
        <Link to="/shop" className="inline-flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors">
          <ArrowLeft size={20} /> Back to Shop
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-3xl overflow-hidden bg-[#0a0f19] border border-gray-800"
            >
              <img 
                src={product.images[activeImage] || 'https://picsum.photos/seed/product/800/800'} 
                alt={product.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            {product.images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImage === idx ? 'border-brand-blue' : 'border-transparent opacity-50 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-brand-blue/10 text-brand-blue text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest border border-brand-blue/20">
                {product.category}
              </span>
              {product.isOfficial && (
                <span className="bg-emerald-500/10 text-emerald-500 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle size={10} /> Official
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-1 text-yellow-500">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={16} className={i <= Math.round(product.rating || 5) ? 'fill-current' : 'text-gray-700'} />
                ))}
              </div>
              <span className="text-gray-500 text-sm font-bold">{reviews.length} Customer Reviews</span>
            </div>

            <PriceDisplay realPrice={product.price} sellPrice={product.discountPrice || product.price} />

            <p className="text-gray-400 leading-relaxed mb-8 text-lg">{product.description}</p>

            <div className="bg-[#0a0f19] p-6 rounded-2xl border border-gray-800 mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Availability</span>
                <span className={product.stock > 0 ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                  {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center bg-[#05070a] rounded-xl border border-gray-700">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 py-2 hover:text-brand-blue transition-colors"
                  >-</button>
                  <span className="px-4 font-bold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-4 py-2 hover:text-brand-blue transition-colors"
                  >+</button>
                </div>
                <button className="flex-grow bg-brand-blue py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-lg shadow-brand-blue/20">
                  <ShoppingCart size={20} /> Add to Cart
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                <ShieldCheck className="text-brand-blue mb-2" size={24} />
                <span className="text-[10px] font-bold uppercase text-gray-400">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                <Truck className="text-brand-pink mb-2" size={24} />
                <span className="text-[10px] font-bold uppercase text-gray-400">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/5 border border-white/10">
                <RotateCcw className="text-emerald-500 mb-2" size={24} />
                <span className="text-[10px] font-bold uppercase text-gray-400">Easy Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="bg-[#0a0f19] p-8 rounded-3xl border border-gray-800 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-blue/20 flex items-center justify-center text-brand-blue">
              <User size={32} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-1">Sold By</p>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {product.sellerName}
                {product.isOfficial && <CheckCircle size={16} className="text-brand-blue" />}
              </h3>
            </div>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-colors flex items-center gap-2">
              <MessageSquare size={18} /> Contact Seller
            </button>
            <Link to={`/shop?seller=${product.sellerId}`} className="px-6 py-3 bg-brand-blue/10 text-brand-blue rounded-xl font-bold hover:bg-brand-blue/20 transition-colors">
              View Store
            </Link>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-[#0a0f19] p-8 rounded-3xl border border-gray-800">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold">Customer Reviews</h2>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-brand-blue">{product.rating || '5.0'}</span>
              <div className="flex flex-col">
                <div className="flex text-yellow-500">
                  <Star size={12} className="fill-current" />
                  <Star size={12} className="fill-current" />
                  <Star size={12} className="fill-current" />
                  <Star size={12} className="fill-current" />
                  <Star size={12} className="fill-current" />
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase">{reviews.length} Reviews</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              {reviews.length > 0 ? (
                reviews.map(r => (
                  <div key={r.id} className="bg-[#05070a] p-6 rounded-2xl border border-gray-800">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-500">
                          <User size={20} />
                        </div>
                        <div>
                          <p className="font-bold">{r.userName}</p>
                          <div className="flex text-yellow-500">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} size={10} className={i <= r.rating ? 'fill-current' : 'text-gray-700'} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Verified Purchase</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed">{r.comment}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-800 rounded-2xl">
                  <MessageSquare size={48} className="mx-auto mb-4 text-gray-800" />
                  <p className="text-gray-500 font-bold">No reviews yet. Be the first to review!</p>
                </div>
              )}
            </div>

            <div className="bg-[#05070a] p-8 rounded-2xl border border-gray-800 h-fit sticky top-24">
              <h3 className="text-xl font-bold mb-6">Write a Review</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Your Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button 
                        key={i} 
                        onClick={() => setRating(i)}
                        className={`p-2 rounded-lg transition-all ${rating >= i ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-700 bg-gray-800/50'}`}
                      >
                        <Star size={24} className={rating >= i ? 'fill-current' : ''} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Your Name</label>
                  <input 
                    className="w-full bg-[#0a0f19] border border-gray-800 rounded-xl p-4 focus:border-brand-blue outline-none transition-all" 
                    placeholder="Enter your name" 
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest">Your Review</label>
                  <textarea 
                    className="w-full bg-[#0a0f19] border border-gray-800 rounded-xl p-4 h-32 focus:border-brand-blue outline-none transition-all resize-none" 
                    placeholder="Share your experience with this product..." 
                    value={comment}
                    onChange={e => setComment(e.target.value)} 
                  />
                </div>
                <button 
                  onClick={handleReview} 
                  className="w-full bg-brand-blue py-4 rounded-xl font-bold shadow-lg shadow-brand-blue/20 hover:scale-[1.02] transition-transform"
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
