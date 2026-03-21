import React, { useState } from 'react';
import { motion } from 'motion/react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MultiImageUpload from '../../components/shop/MultiImageUpload';
import { Loader2 } from 'lucide-react';

export default function ProductUpload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Electronics',
    price: '',
    discountPrice: '',
    stock: '',
    images: [] as string[],
    isOfficial: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      await setDoc(doc(db, 'products', Date.now().toString()), {
        ...formData,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        stock: parseInt(formData.stock),
        sellerId: user.uid,
        sellerName: user.displayName || 'Seller',
        rating: 0,
        createdAt: serverTimestamp(),
      });
      alert('Product uploaded successfully!');
      navigate('/shop');
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#05070a] text-white">
      <div className="max-w-2xl mx-auto bg-[#0a0f19] p-8 rounded-2xl border border-gray-800">
        <h1 className="text-2xl font-bold mb-6">Upload New Product</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Product Title"
            className="w-full bg-[#05070a] border border-gray-700 rounded-lg px-4 py-3"
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            className="w-full bg-[#05070a] border border-gray-700 rounded-lg px-4 py-3"
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />
          <select
            className="w-full bg-[#05070a] border border-gray-700 rounded-lg px-4 py-3"
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          >
            <option>Electronics</option>
            <option>Fashion</option>
            <option>Home</option>
          </select>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Real Price"
              className="w-full bg-[#05070a] border border-gray-700 rounded-lg px-4 py-3"
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Discount Price"
              className="w-full bg-[#05070a] border border-gray-700 rounded-lg px-4 py-3"
              onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
            />
          </div>
          <input
            type="number"
            placeholder="Stock Quantity"
            className="w-full bg-[#05070a] border border-gray-700 rounded-lg px-4 py-3"
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            required
          />
          <MultiImageUpload images={formData.images} onChange={(images) => setFormData({ ...formData, images })} />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isOfficial}
              onChange={(e) => setFormData({ ...formData, isOfficial: e.target.checked })}
            />
            Official Product (Admin)
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-blue py-3 rounded-lg font-bold"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Upload Product'}
          </button>
        </form>
      </div>
    </div>
  );
}
