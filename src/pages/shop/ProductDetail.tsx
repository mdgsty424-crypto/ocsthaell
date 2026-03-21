import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, query, where, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product, Review } from '../../types';
import { Star } from 'lucide-react';

const PriceDisplay = ({ realPrice, sellPrice }: { realPrice: number, sellPrice: number }) => {
  const discount = Math.round(((realPrice - sellPrice) / realPrice) * 100);
  return (
    <div className="flex items-center space-x-3 mb-4">
      <span className="text-2xl font-bold text-brand-blue">৳{sellPrice}</span>
      {realPrice > sellPrice && (
        <>
          <span className="text-gray-400 line-through text-sm">৳{realPrice}</span>
          <span className="bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded-full">-{discount}% OFF</span>
        </>
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

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, 'products', id)).then(doc => setProduct({ id: doc.id, ...doc.data() } as Product));
    const q = query(collection(db, 'reviews'), where('productId', '==', id));
    return onSnapshot(q, (snapshot) => setReviews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review))));
  }, [id]);

  const handleReview = async () => {
    await addDoc(collection(db, 'reviews'), {
      productId: id,
      userName: guestName || 'Guest',
      rating,
      comment,
      createdAt: serverTimestamp()
    });
    setComment('');
  };

  if (!product) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#05070a] text-white">
      <div className="max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          <img src={product.images[0]} alt={product.name} className="w-full rounded-2xl" />
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <PriceDisplay realPrice={product.price} sellPrice={product.discountPrice || product.price} />
            <div className="flex gap-4">
              <button className="flex-1 bg-gray-800 py-3 rounded-lg font-bold">Add to Cart</button>
              <button className="flex-1 bg-brand-blue py-3 rounded-lg font-bold">Buy Now</button>
            </div>
          </div>
        </div>

        <div className="mt-12 bg-[#0a0f19] p-8 rounded-2xl border border-gray-800">
          <h2 className="text-xl font-bold mb-4">Reviews</h2>
          <div className="space-y-4 mb-6">
            {reviews.map(r => <div key={r.id} className="border-b border-gray-800 pb-2"><p className="font-bold">{r.userName} - {r.rating}*</p><p>{r.comment}</p></div>)}
          </div>
          <input className="w-full bg-[#05070a] border border-gray-700 rounded-lg p-3 mb-2" placeholder="Your Name (Guest)" onChange={e => setGuestName(e.target.value)} />
          <textarea className="w-full bg-[#05070a] border border-gray-700 rounded-lg p-3 mb-2" placeholder="Your Review" onChange={e => setComment(e.target.value)} />
          <button onClick={handleReview} className="bg-brand-blue px-6 py-2 rounded-lg">Submit Review</button>
        </div>
      </div>
    </div>
  );
}
