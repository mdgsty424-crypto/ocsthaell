import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ShoppingCart, Star } from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product } from '../../types';
import { Link } from 'react-router-dom';

export default function ShopHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#05070a] text-white">
      <div className="max-w-7xl mx-auto">
        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for products..."
            className="w-full bg-[#0a0f19] border border-gray-800 rounded-xl pl-12 pr-4 py-4 focus:border-brand-blue outline-none"
          />
        </div>

        {/* Trending */}
        <h2 className="text-2xl font-bold mb-6">Trending Now</h2>
        <div className="flex gap-4 overflow-x-auto pb-6 mb-8">
          {products.slice(0, 5).map(product => (
            <div key={product.id} className="min-w-[200px] bg-[#0a0f19] p-4 rounded-xl border border-gray-800">
              <img src={product.images[0]} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-2" />
              <h3 className="font-bold truncate">{product.name}</h3>
              <p className="text-brand-blue font-bold">{product.price} TK</p>
            </div>
          ))}
        </div>

        {/* Grid */}
        <h2 className="text-2xl font-bold mb-6">All Products</h2>
        <div className="grid grid-cols-2 gap-4">
          {products.map(product => (
            <Link to={`/shop/product/${product.id}`} key={product.id} className="bg-[#0a0f19] p-4 rounded-xl border border-gray-800 hover:border-brand-blue transition-colors">
              <img src={product.images[0]} alt={product.name} className="w-full h-40 object-cover rounded-lg mb-3" />
              <h3 className="font-bold truncate">{product.name}</h3>
              <div className="flex justify-between items-center mt-2">
                <p className="text-brand-blue font-bold">{product.price} TK</p>
                <div className="flex items-center text-yellow-500 text-sm">
                  <Star size={14} className="fill-current" /> {product.rating}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
