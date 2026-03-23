import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product } from '../../types';
import { Edit, Trash2, Star, CheckCircle, Plus, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ManageProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    return onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
  }, []);

  const toggleFeatured = async (id: string, current: boolean) => {
    await updateDoc(doc(db, 'products', id), { isFeatured: !current });
  };

  const deleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const updatePrice = async (id: string, price: number, discountPrice?: number) => {
    await updateDoc(doc(db, 'products', id), { price, discountPrice });
    setEditingProduct(null);
  };

  return (
    <div className="p-6 bg-white min-h-screen text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Product Control Center</h1>
        <Link 
          to="/shop/upload" 
          className="bg-brand-blue hover:bg-brand-blue/90 px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all shadow-lg shadow-brand-blue/20 text-white"
        >
          <Plus className="w-5 h-5" />
          Upload Product
        </Link>
      </div>
      
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-gray-700 font-semibold">Product</th>
              <th className="p-4 text-gray-700 font-semibold">Seller</th>
              <th className="p-4 text-gray-700 font-semibold">Pricing</th>
              <th className="p-4 text-gray-700 font-semibold">Stock</th>
              <th className="p-4 text-gray-700 font-semibold">Status</th>
              <th className="p-4 text-gray-700 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                      {product.images && product.images.length > 0 ? (
                        <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900">{product.name}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{product.category}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    {product.isOfficial && <CheckCircle className="w-3 h-3 text-blue-500" />}
                    <span className="text-sm text-gray-700">{product.sellerName}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    <p className="text-green-600 font-semibold">৳{product.discountPrice || product.price}</p>
                    {product.discountPrice && <p className="text-gray-400 line-through text-xs">৳{product.price}</p>}
                  </div>
                </td>
                <td className="p-4 text-sm text-gray-700">{product.stock}</td>
                <td className="p-4">
                  <button 
                    onClick={() => toggleFeatured(product.id, !!product.isFeatured)}
                    className={`p-1 rounded transition-colors ${product.isFeatured ? 'text-yellow-500 bg-yellow-50' : 'text-gray-300 hover:text-gray-400'}`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => setEditingProduct(product)} className="p-2 hover:bg-blue-50 text-blue-600 rounded transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-red-50 text-red-600 rounded transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Pricing: {editingProduct.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Real Price</label>
                <input 
                  type="number" 
                  defaultValue={editingProduct.price}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-brand-blue outline-none"
                  id="edit-price"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Sale Price (Optional)</label>
                <input 
                  type="number" 
                  defaultValue={editingProduct.discountPrice}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-gray-900 focus:border-brand-blue outline-none"
                  id="edit-discount"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const p = parseFloat((document.getElementById('edit-price') as HTMLInputElement).value);
                    const d = parseFloat((document.getElementById('edit-discount') as HTMLInputElement).value);
                    updatePrice(editingProduct.id, p, d || undefined);
                  }}
                  className="flex-1 py-2 rounded-lg bg-brand-blue font-bold text-white hover:bg-blue-600 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
