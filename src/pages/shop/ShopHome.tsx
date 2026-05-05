import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product } from '../../types';
import { 
  ShoppingCart, 
  Package, 
  Star, 
  ArrowRight, 
  Plus, 
  Zap,
  Smartphone,
  Watch,
  Laptop,
  Shirt,
  Gamepad,
  Grid,
  Globe,
  Home
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import ShopAppLayout from '../../components/shop/ShopAppLayout';
import SEO from '../../components/SEO';
import { generateImgAlt } from '../../lib/seo-utils';

import { BANGLADESH_LOCATIONS, COUNTRIES, CATEGORIES as GLOBAL_CATEGORIES } from '../../constants/locations';
import { broadcastAutoNotifications } from '../../lib/messaging';

const CATEGORIES = [
  { id: 'All', name: 'All', icon: Grid },
  ...GLOBAL_CATEGORIES.map(cat => ({
    id: cat,
    name: cat,
    icon: cat === 'Electronics' ? Smartphone : 
          cat === 'Fashion' ? Shirt : 
          cat === 'Gadgets' ? Watch : 
          cat === 'Global Imports' ? Globe : 
          cat === 'Home Decor' ? Home : 
          cat === 'Handmade' ? Package : 
          cat === 'Beauty' ? Star : 
          cat === 'Sports' ? Gamepad : Grid
  }))
];

export default function ShopHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { addToCart } = useCart();
  const [timeLeft, setTimeLeft] = useState({ h: 12, m: 45, s: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { ...prev, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { ...prev, h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    broadcastAutoNotifications();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      const fallbackQ = query(collection(db, 'products'));
      onSnapshot(fallbackQ, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setLoading(false);
      });
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || 
                         p.description.toLowerCase().includes(q) ||
                         p.category.toLowerCase().includes(q) ||
                         p.origin?.countryName.toLowerCase().includes(q) ||
                         p.origin?.countryCode.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <ShopAppLayout onSearch={setSearchQuery}>
      <SEO 
        title="OCSTHAEL Shopping"
        description="Shop the latest gadgets, electronics, fashion and global imports from OCSTHAEL Shopping."
        url={window.location.href}
        type="website"
      />
      {/* Category Wrap Fix */}
      <div className="px-4 py-6 flex flex-wrap gap-4 justify-center">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex flex-col items-center gap-2 transition-all ${
              selectedCategory === cat.id ? 'scale-110' : 'opacity-60 grayscale'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              selectedCategory === cat.id ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'bg-white text-gray-600 border border-gray-100'
            }`}>
              <cat.icon size={24} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              selectedCategory === cat.id ? 'text-brand-blue' : 'text-gray-500'
            }`}>
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {/* Deal of the Day Banner */}
      <div className="px-4 mb-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue to-brand-pink p-6 text-white shadow-xl shadow-brand-blue/10">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="fill-current text-yellow-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Deal of the Day</span>
            </div>
            <h2 className="text-2xl font-black mb-4 leading-tight">Flash Sale<br/>Up to 70% Off</h2>
            
            <div className="flex items-center gap-2">
              <div className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl text-center min-w-[45px]">
                <span className="block text-lg font-black leading-none">{timeLeft.h}</span>
                <span className="text-[8px] font-bold uppercase opacity-60">Hrs</span>
              </div>
              <span className="font-black">:</span>
              <div className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl text-center min-w-[45px]">
                <span className="block text-lg font-black leading-none">{timeLeft.m}</span>
                <span className="text-[8px] font-bold uppercase opacity-60">Min</span>
              </div>
              <span className="font-black">:</span>
              <div className="bg-white/20 backdrop-blur-md px-3 py-2 rounded-xl text-center min-w-[45px]">
                <span className="block text-lg font-black leading-none">{timeLeft.s}</span>
                <span className="text-[8px] font-bold uppercase opacity-60">Sec</span>
              </div>
            </div>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-20">
            <ShoppingCart size={160} />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Package size={20} className="text-brand-blue" /> Recommended
          </h3>
          <button className="text-xs font-black text-brand-blue uppercase tracking-widest flex items-center gap-1">
            View All <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="aspect-[3/4] bg-white rounded-3xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} />
            ))}
          </div>
        )}
      </div>
    </ShopAppLayout>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product, onAddToCart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm group relative"
    >
      <Link to={`/shop/product/${product.id}`} className="block">
        <div className="aspect-square relative overflow-hidden bg-gray-50">
          <img
            src={product.images[0] || 'https://picsum.photos/seed/product/400/400'}
            alt={generateImgAlt(product.name, 'Shop')}
            title={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.discountPrice && (
              <div className="bg-brand-pink text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">
                -{Math.round((1 - product.discountPrice / product.price) * 100)}%
              </div>
            )}
            {product.origin && (
              <div className="bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] font-black px-2 py-1 rounded-lg shadow-sm flex items-center gap-1 border border-gray-100">
                <span>{product.origin.flag}</span>
                <span className="uppercase tracking-tighter">{product.origin.countryCode}</span>
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-center gap-1 text-yellow-500 mb-1">
          <Star size={10} className="fill-current" />
          <span className="text-[10px] font-black text-gray-400">{product.rating || '5.0'}</span>
        </div>
        
        <Link to={`/shop/product/${product.id}`}>
          <h4 className="font-bold text-gray-900 text-sm mb-2 line-clamp-1 group-hover:text-brand-blue transition-colors">
            {product.name}
          </h4>
        </Link>

        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-brand-blue font-black text-base">
                {product.discountPrice || product.price} TK
              </span>
            </div>
            {product.discountPrice && (
              <span className="text-gray-300 line-through text-[10px] font-bold">
                {product.price} TK
              </span>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.preventDefault();
              onAddToCart();
            }}
            className="w-10 h-10 bg-brand-blue text-white rounded-2xl flex items-center justify-center hover:bg-brand-blue/80 transition-all active:scale-90 shadow-lg shadow-brand-blue/20"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
