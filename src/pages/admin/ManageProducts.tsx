import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Product } from '../../types';
import { Edit, Trash2, Star, CheckCircle } from 'lucide-react';

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
    <div className="p-6 bg-[#05070a] min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Product Control Center</h1>
      
      <div className="overflow-x-auto bg-[#0a0f19] rounded-xl border border-gray-800">
        <table className="w-full text-left">
          <thead className="bg-[#111827] border-b border-gray-800">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Seller</th>
              <th className="p-4">Pricing</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-800 hover:bg-[#111827]/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img src={product.images[0]} alt="" className="w-10 h-10 rounded object-cover" />
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.category}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    {product.isOfficial && <CheckCircle className="w-3 h-3 text-blue-500" />}
                    <span className="text-sm">{product.sellerName}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="text-sm">
                    <p className="text-green-500">৳{product.discountPrice || product.price}</p>
                    {product.discountPrice && <p className="text-gray-500 line-through text-xs">৳{product.price}</p>}
                  </div>
                </td>
                <td className="p-4 text-sm">{product.stock}</td>
                <td className="p-4">
                  <button 
                    onClick={() => toggleFeatured(product.id, !!product.isFeatured)}
                    className={`p-1 rounded ${product.isFeatured ? 'text-yellow-500 bg-yellow-500/10' : 'text-gray-500'}`}
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button onClick={() => setEditingProduct(product)} className="p-2 hover:bg-blue-500/10 text-blue-500 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-red-500/10 text-red-500 rounded">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a0f19] p-6 rounded-2xl border border-gray-800 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Pricing: {editingProduct.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Real Price</label>
                <input 
                  type="number" 
                  defaultValue={editingProduct.price}
                  className="w-full bg-[#05070a] border border-gray-700 rounded-lg p-2"
                  id="edit-price"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Sale Price (Optional)</label>
                <input 
                  type="number" 
                  defaultValue={editingProduct.discountPrice}
                  className="w-full bg-[#05070a] border border-gray-700 rounded-lg p-2"
                  id="edit-discount"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2 rounded-lg border border-gray-700"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const p = parseFloat((document.getElementById('edit-price') as HTMLInputElement).value);
                    const d = parseFloat((document.getElementById('edit-discount') as HTMLInputElement).value);
                    updatePrice(editingProduct.id, p, d || undefined);
                  }}
                  className="flex-1 py-2 rounded-lg bg-brand-blue font-bold"
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
