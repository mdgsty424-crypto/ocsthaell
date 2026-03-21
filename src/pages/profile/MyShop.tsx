import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { Plus, Edit, Trash2, Package, DollarSign, ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

export default function MyShop() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (err) {
        console.error('Delete failed', err);
        alert('Delete failed');
      }
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#05070a] text-white">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Shop</h1>
            <p className="text-gray-400">Manage your products and sales</p>
          </div>
          <Link
            to="/shop/upload"
            className="flex items-center gap-2 bg-brand-blue px-6 py-3 rounded-xl font-bold hover:bg-brand-blue/90 transition-all shadow-lg shadow-brand-blue/20"
          >
            <Plus size={20} /> Add New Product
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0a0f19] p-6 rounded-2xl border border-gray-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <DollarSign className="text-emerald-500" size={20} />
              </div>
              <h3 className="text-gray-400 font-medium">Total Revenue</h3>
            </div>
            <p className="text-3xl font-bold">0 TK</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0a0f19] p-6 rounded-2xl border border-gray-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-blue/10 rounded-lg">
                <ShoppingBag className="text-brand-blue" size={20} />
              </div>
              <h3 className="text-gray-400 font-medium">Active Orders</h3>
            </div>
            <p className="text-3xl font-bold">0</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0a0f19] p-6 rounded-2xl border border-gray-800"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-brand-pink/10 rounded-lg">
                <Package className="text-brand-pink" size={20} />
              </div>
              <h3 className="text-gray-400 font-medium">Total Products</h3>
            </div>
            <p className="text-3xl font-bold">{products.length}</p>
          </motion.div>
        </div>

        <div className="bg-[#0a0f19] rounded-2xl border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-xl font-bold">My Products</h2>
            <Link to="/shop" className="text-sm text-brand-blue flex items-center gap-1 hover:underline">
              View in Shop <ArrowRight size={14} />
            </Link>
          </div>
          
          <div className="divide-y divide-gray-800">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="p-12 text-center">
                <Package size={48} className="mx-auto mb-4 text-gray-700" />
                <p className="text-gray-400 mb-6">You haven't uploaded any products yet.</p>
                <Link
                  to="/shop/upload"
                  className="inline-flex items-center gap-2 text-brand-blue font-bold hover:underline"
                >
                  Upload your first product <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              products.map(p => (
                <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                  <div className="w-16 h-16 bg-[#05070a] rounded-lg overflow-hidden border border-gray-800 flex-shrink-0">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700">
                        <Package size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-bold truncate">{p.name}</h4>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-brand-blue font-bold">{p.price} TK</span>
                      <span className="text-gray-500">Stock: {p.stock}</span>
                      {p.isOfficial && (
                        <span className="text-[10px] bg-brand-blue/20 text-brand-blue px-1.5 py-0.5 rounded uppercase font-black">Official</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link 
                      to={`/shop/edit/${p.id}`}
                      className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                      title="Edit Product"
                    >
                      <Edit size={18} />
                    </Link>
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
