import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Loader2 } from 'lucide-react';

export default function Checkout({ cartTotal = 1000 }: { cartTotal?: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'cod' | 'wallet' | 'card' | 'bank'>('cod');
  const [guestInfo, setGuestInfo] = useState({ name: '', phone: '', address: '' });

  const handleCheckout = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'orders'), {
        buyerId: user?.uid || null,
        buyerName: guestInfo.name,
        total: cartTotal,
        status: 'pending',
        shippingAddress: guestInfo.address,
        paymentMethod,
        createdAt: serverTimestamp(),
      });
      alert('Order placed successfully!');
      navigate('/shop');
    } catch (err) {
      console.error(err);
      alert('Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#05070a] text-white">
      <div className="max-w-2xl mx-auto bg-[#0a0f19] p-8 rounded-2xl border border-gray-800">
        <h1 className="text-2xl font-bold mb-6">Shipping Details</h1>
        <div className="space-y-4">
          <input className="w-full bg-[#05070a] border border-gray-700 rounded-lg p-3" placeholder="Full Name" onChange={e => setGuestInfo({...guestInfo, name: e.target.value})} />
          <input className="w-full bg-[#05070a] border border-gray-700 rounded-lg p-3" placeholder="Phone Number" onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})} />
          <textarea className="w-full bg-[#05070a] border border-gray-700 rounded-lg p-3" placeholder="Full Delivery Address" onChange={e => setGuestInfo({...guestInfo, address: e.target.value})} />
        </div>

        <h2 className="text-xl font-bold mt-8 mb-4">Select Payment Method</h2>
        <div className="grid grid-cols-2 gap-3">
          {['cod', 'bkash', 'nagad', 'card', 'wallet'].map((method) => (
            <button
              key={method}
              disabled={method === 'wallet' && !user}
              onClick={() => setPaymentMethod(method as any)}
              className={`p-3 border rounded-lg text-sm font-medium transition ${
                paymentMethod === method ? 'bg-brand-blue text-white' : 'bg-gray-800'
              } ${method === 'wallet' && !user ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {method.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="mt-8 border-t border-gray-800 pt-4">
          <div className="flex justify-between text-lg font-bold">
            <span>Total Amount:</span>
            <span>৳{cartTotal}</span>
          </div>
          <button onClick={handleCheckout} disabled={loading} className="w-full bg-brand-blue py-3 rounded-xl mt-4 font-bold hover:bg-blue-600">
            {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirm Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
