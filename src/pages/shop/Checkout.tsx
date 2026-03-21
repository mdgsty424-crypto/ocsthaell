import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Loader2, CreditCard, Truck, Phone, User, MapPin, CheckCircle, ArrowLeft, ShoppingBag, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

export default function Checkout({ cartTotal = 1000 }: { cartTotal?: number }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'cod' | 'wallet' | 'card' | 'bank'>('cod');
  const [guestInfo, setGuestInfo] = useState({ name: '', phone: '', address: '' });
  const [success, setSuccess] = useState(false);

  const handleCheckout = async () => {
    if (!guestInfo.name || !guestInfo.phone || !guestInfo.address) {
      return;
    }
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
      setSuccess(true);
      setTimeout(() => navigate('/shop'), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 bg-white text-gray-900 flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md bg-gray-50 p-12 rounded-3xl border border-gray-100 shadow-xl"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={48} />
          </div>
          <h1 className="text-3xl font-black mb-4">Order Placed!</h1>
          <p className="text-gray-500 font-bold mb-8">Thank you for your purchase. Your order has been placed successfully and is being processed.</p>
          <div className="flex flex-col gap-4">
            <Link to="/shop" className="bg-brand-blue text-white py-4 rounded-xl font-black shadow-lg shadow-brand-blue/20 hover:scale-[1.02] transition-transform">
              Continue Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-white text-gray-900">
      <div className="max-w-2xl mx-auto">
        <Link to="/shop" className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-blue mb-8 transition-colors font-bold">
          <ArrowLeft size={20} /> Back to Shop
        </Link>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-brand-blue/5 rounded-2xl text-brand-blue">
              <Truck size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Checkout</h1>
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Complete your order details</p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest flex items-center gap-2">
                <User size={14} /> Full Name
              </label>
              <input 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-brand-blue outline-none transition-all text-gray-900" 
                placeholder="Enter your full name" 
                onChange={e => setGuestInfo({...guestInfo, name: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest flex items-center gap-2">
                <Phone size={14} /> Phone Number
              </label>
              <input 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 focus:border-brand-blue outline-none transition-all text-gray-900" 
                placeholder="Enter your phone number" 
                onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-widest flex items-center gap-2">
                <MapPin size={14} /> Delivery Address
              </label>
              <textarea 
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 h-32 focus:border-brand-blue outline-none transition-all resize-none text-gray-900" 
                placeholder="Enter your full delivery address" 
                onChange={e => setGuestInfo({...guestInfo, address: e.target.value})} 
              />
            </div>
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-black mb-6 flex items-center gap-2 text-gray-900">
              <CreditCard size={20} className="text-brand-blue" /> Payment Method
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { id: 'cod', label: 'Cash on Delivery', icon: <Truck size={18} /> },
                { id: 'bkash', label: 'bKash', icon: <Wallet size={18} /> },
                { id: 'nagad', label: 'Nagad', icon: <Wallet size={18} /> },
                { id: 'card', label: 'Card Payment', icon: <CreditCard size={18} /> },
                { id: 'wallet', label: 'My Wallet', icon: <Wallet size={18} /> }
              ].map((method) => (
                <button
                  key={method.id}
                  disabled={method.id === 'wallet' && !user}
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`p-4 border rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-2 ${
                    paymentMethod === method.id 
                      ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20 scale-[1.02]' 
                      : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                  } ${method.id === 'wallet' && !user ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {method.icon}
                  {method.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100">
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Subtotal</span>
                <span className="text-gray-900 font-bold">{cartTotal} TK</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-bold uppercase text-xs tracking-widest">Shipping</span>
                <span className="text-emerald-600 font-bold">FREE</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-gray-900 font-black text-lg">Total Amount</span>
                <span className="text-2xl font-black text-brand-blue">{cartTotal} TK</span>
              </div>
            </div>
            
            <button 
              onClick={handleCheckout} 
              disabled={loading || !guestInfo.name || !guestInfo.phone || !guestInfo.address} 
              className="w-full bg-brand-blue text-white py-5 rounded-2xl font-black shadow-lg shadow-brand-blue/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? <Loader2 className="animate-spin" /> : (
                <>
                  <ShoppingBag size={20} /> Confirm Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
