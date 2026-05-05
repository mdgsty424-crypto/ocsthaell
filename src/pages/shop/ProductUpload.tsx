import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { doc, setDoc, serverTimestamp, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import MultiImageUpload from '../../components/shop/MultiImageUpload';
import { Loader2, ArrowLeft, Package, Tag, Info, DollarSign, Layers, CheckCircle, Globe } from 'lucide-react';
import { COUNTRIES, CATEGORIES } from '../../constants/locations';
import { pingGoogleSearchConsole } from '../../lib/seo-utils';

export default function ProductUpload() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Electronics',
    price: '',
    discountPrice: '',
    stock: '',
    images: [] as string[],
    isOfficial: false,
    origin: {
      countryName: 'Bangladesh',
      countryCode: 'BD',
      flag: '🇧🇩'
    }
  });

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        setFetching(true);
        try {
          const docRef = doc(db, 'products', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Security check: only owner or admin can edit
            if (data.sellerId !== user?.uid && !isAdmin) {
              alert('You do not have permission to edit this product');
              navigate('/profile/my-shop');
              return;
            }
            setFormData({
              name: data.name || '',
              description: data.description || '',
              category: data.category || 'Electronics',
              price: data.price?.toString() || '',
              discountPrice: data.discountPrice?.toString() || '',
              stock: data.stock?.toString() || '',
              images: data.images || [],
              isOfficial: data.isOfficial || false,
              origin: data.origin || { countryName: 'Bangladesh', countryCode: 'BD', flag: '🇧🇩' }
            });
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        } finally {
          setFetching(false);
        }
      };
      fetchProduct();
    }
  }, [id, user, isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : null,
        stock: parseInt(formData.stock),
        images: formData.images,
        isOfficial: isAdmin ? formData.isOfficial : false,
        origin: formData.origin,
        updatedAt: serverTimestamp(),
      };

      if (id) {
        await updateDoc(doc(db, 'products', id), productData);
        alert('Product updated successfully!');
      } else {
        const productId = Date.now().toString();
        await setDoc(doc(db, 'products', productId), {
          ...productData,
          sellerId: user.uid,
          sellerName: user.displayName || user.email?.split('@')[0] || 'Seller',
          rating: 5,
          createdAt: serverTimestamp(),
        });
        alert('Product uploaded successfully!');
      }
      
      pingGoogleSearchConsole();
      navigate('/shop');
    } catch (err: any) {
      console.error("Product operation error details:", err);
      alert(`Operation failed: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-white text-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-brand-blue animate-spin" />
          <p className="text-gray-500 font-bold">Fetching product data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-white text-gray-900">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-500 hover:text-brand-blue mb-8 transition-colors font-bold"
        >
          <ArrowLeft size={20} /> Back to Shop
        </button>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-brand-blue/10 rounded-2xl">
              <Package className="text-brand-blue" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">{id ? 'Edit Product' : 'Upload Product'}</h1>
              <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.2em]">
                {id ? 'Update your product details' : 'List your product in the shop'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image Section */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-500 tracking-widest">
                <Layers size={14} className="text-brand-blue" /> Product Images
              </label>
              <MultiImageUpload 
                images={formData.images} 
                onChange={(images) => setFormData({ ...formData, images })} 
              />
              <p className="text-[10px] text-gray-400 italic">Upload at least one high-quality image of your product.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-500 tracking-widest">
                  <Tag size={14} className="text-brand-blue" /> Product Name
                </label>
                <input
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-brand-blue outline-none transition-all text-gray-900"
                  placeholder="e.g. Premium Wireless Headphones"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-500 tracking-widest">
                  <Layers size={14} className="text-brand-blue" /> Category
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-brand-blue outline-none transition-all appearance-none text-gray-900"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <Layers className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-500 tracking-widest">
                  <Globe size={14} className="text-brand-blue" /> Country of Origin
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-brand-blue outline-none transition-all appearance-none text-gray-900"
                    value={formData.origin.countryCode}
                    onChange={(e) => {
                      const country = COUNTRIES.find(c => c.code === e.target.value);
                      if (country) {
                        setFormData({ 
                          ...formData, 
                          origin: {
                            countryName: country.name,
                            countryCode: country.code,
                            flag: country.flag
                          } 
                        });
                      }
                    }}
                  >
                    {COUNTRIES.map(country => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.name}
                      </option>
                    ))}
                  </select>
                  <Globe className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-500 tracking-widest">
                  <Package size={14} className="text-brand-blue" /> Stock Quantity
                </label>
                <input
                  required
                  type="number"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-brand-blue outline-none transition-all text-gray-900"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-500 tracking-widest">
                <Info size={14} className="text-brand-blue" /> Description
              </label>
              <textarea
                required
                rows={4}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-brand-blue outline-none transition-all resize-none text-gray-900"
                placeholder="Tell customers about your product..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-500 tracking-widest">
                  <DollarSign size={14} className="text-brand-blue" /> Regular Price
                </label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pl-10 focus:border-brand-blue outline-none transition-all text-gray-900"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-500 tracking-widest">
                  <DollarSign size={14} className="text-brand-blue" /> Sale Price (Optional)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 pl-10 focus:border-brand-blue outline-none transition-all text-gray-900"
                    placeholder="0.00"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="bg-brand-blue/5 p-6 rounded-2xl border border-brand-blue/10">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={formData.isOfficial}
                      onChange={(e) => setFormData({ ...formData, isOfficial: e.target.checked })}
                    />
                    <div className={`w-12 h-6 rounded-full transition-colors ${formData.isOfficial ? 'bg-brand-blue' : 'bg-gray-200'}`}></div>
                    <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.isOfficial ? 'translate-x-6' : ''}`}></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={formData.isOfficial ? 'text-brand-blue' : 'text-gray-400'} size={18} />
                    <div>
                      <span className="font-bold block text-gray-900">Mark as Official Product</span>
                      <span className="text-[10px] text-gray-500 uppercase font-black">Admin Only Feature</span>
                    </div>
                  </div>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-blue text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-brand-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {id ? 'Update Product' : 'Publish Product'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
