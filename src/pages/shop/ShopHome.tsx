import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingCart, Star, Filter, Package, ArrowRight, Tag, CheckCircle } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product } from '../../types';
import { Link } from 'react-router-dom';

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Gadgets', 'Accessories', 'Software'];

export default function ShopHome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // We use a simple query first to ensure it works without complex indexes
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(docs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching products:", error);
      // Fallback to query without order if index is missing or error occurs
      const fallbackQ = query(collection(db, 'products'));
      onSnapshot(fallbackQ, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
        setLoading(false);
      });
    });
    return () => unsubscribe();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredProducts = products.filter(p => p.isFeatured).slice(0, 4);
  const officialProducts = products.filter(p => p.isOfficial).slice(0, 4);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="relative rounded-3xl overflow-hidden mb-12 bg-gradient-to-r from-brand-blue/5 to-brand-pink/5 border border-gray-100 p-8 md:p-12 shadow-sm">
          <div className="relative z-10 max-w-2xl">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-black mb-4 tracking-tighter text-gray-900"
            >
              OCSTHAEL <span className="text-brand-blue">MARKET</span>
            </motion.h1>
            <p className="text-gray-600 text-lg mb-8">Discover exclusive products, official gear, and community favorites in our next-gen marketplace.</p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-3 bg-brand-blue text-white rounded-xl font-bold shadow-lg shadow-brand-blue/20 hover:scale-105 transition-transform flex items-center gap-2">
                <ShoppingCart size={20} /> Shop Now
              </button>
              <Link to="/shop/upload" className="px-8 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Package size={20} /> Start Selling
              </Link>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-l from-white to-transparent z-10" />
            <ShoppingCart className="w-full h-full text-brand-blue rotate-12" />
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search for products, brands, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-12 pr-4 py-4 focus:border-brand-blue outline-none transition-all text-gray-900"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl border transition-all ${showFilters ? 'bg-brand-blue border-brand-blue text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400'}`}
          >
            <Filter size={20} />
            <span className="font-bold">Filters</span>
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2">
                  <Tag size={14} /> Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-brand-blue text-white' : 'bg-white text-gray-600 hover:text-brand-blue border border-gray-200'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Featured Section */}
        {featuredProducts.length > 0 && selectedCategory === 'All' && !searchQuery && (
          <section className="mb-12">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Star className="text-brand-mango fill-current" size={24} /> Featured Products
                </h2>
                <p className="text-gray-500">Handpicked favorites from our team</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} featured />
              ))}
            </div>
          </section>
        )}

        {/* Main Grid */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-brand-blue" size={24} />
                {searchQuery ? `Results for "${searchQuery}"` : selectedCategory !== 'All' ? `${selectedCategory}` : 'All Products'}
              </h2>
              <p className="text-gray-500">{filteredProducts.length} items found</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="aspect-[3/4] bg-gray-50 rounded-2xl animate-pulse border border-gray-200" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 bg-gray-50 rounded-3xl border border-gray-200">
              <Package size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-bold mb-2 text-gray-900">No products found</h3>
              <p className="text-gray-500 mb-8">Try adjusting your search or filters to find what you're looking for.</p>
              <button 
                onClick={() => {setSearchQuery(''); setSelectedCategory('All');}}
                className="text-brand-blue font-bold hover:underline flex items-center gap-2 mx-auto"
              >
                <ArrowRight size={16} /> Clear all filters
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ProductCard({ product, featured = false }: { product: Product, featured?: boolean }) {
  const discount = product.discountPrice ? Math.round(((product.price - product.discountPrice) / product.price) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:border-brand-blue/30 transition-all ${featured ? 'md:col-span-1' : ''}`}
    >
      <Link to={`/shop/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img 
            src={product.images[0] || 'https://picsum.photos/seed/product/400/400'} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
          {discount > 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter">
              {discount}% OFF
            </div>
          )}
          {product.isOfficial && (
            <div className="absolute top-3 right-3 bg-brand-blue text-white p-1.5 rounded-full shadow-lg">
              <CheckCircle size={14} />
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1 text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">
            <Tag size={10} /> {product.category}
          </div>
          <h3 className="font-bold text-sm mb-2 line-clamp-1 text-gray-900 group-hover:text-brand-blue transition-colors">{product.name}</h3>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-gray-900">{product.discountPrice || product.price} TK</span>
                {product.discountPrice && (
                  <span className="text-xs text-gray-400 line-through">{product.price} TK</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold">
              <Star size={12} className="fill-current" />
              {product.rating || '5.0'}
            </div>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button className="w-full py-2 bg-gray-50 hover:bg-brand-blue hover:text-white border border-gray-100 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 text-gray-600">
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </motion.div>
  );
}
