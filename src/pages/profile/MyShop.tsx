import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';

export default function MyShop() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
    return onSnapshot(q, (snapshot) => setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product))));
  }, [user]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#05070a] text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Shop</h1>
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0a0f19] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-gray-400">Total Sales</h3>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-[#0a0f19] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-gray-400">Pending Orders</h3>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="bg-[#0a0f19] p-6 rounded-2xl border border-gray-800">
            <h3 className="text-gray-400">Balance</h3>
            <p className="text-2xl font-bold">0 TK</p>
          </div>
        </div>
        <div className="bg-[#0a0f19] p-6 rounded-2xl border border-gray-800">
          <h2 className="text-xl font-bold mb-4">My Products</h2>
          {products.map(p => (
            <div key={p.id} className="flex justify-between items-center border-b border-gray-800 py-3">
              <span>{p.name}</span>
              <div className="flex gap-2">
                <button className="text-brand-blue">Edit</button>
                <button className="text-red-500">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
