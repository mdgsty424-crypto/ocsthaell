import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User, 
  Truck, 
  CreditCard, 
  CheckCircle, 
  Loader2,
  Wallet,
  Smartphone,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success
  const [address, setAddress] = useState({
    fullName: user?.displayName || '',
    phone: '',
    altPhone: '',
    district: '',
    area: '',
    postCode: '',
    detailedAddress: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        userId: user?.uid || 'guest',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.discountPrice || item.price,
          quantity: item.quantity,
          image: item.images[0]
        })),
        total: cartTotal,
        status: 'pending',
        paymentMethod,
        shippingAddress: address,
        createdAt: serverTimestamp(),
        trackingTimeline: [
          { status: 'Order Placed', time: new Date().toISOString(), completed: true }
        ]
      };

      await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      setStep(3);
    } catch (err) {
      console.error('Error placing order:', err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle size={48} className="text-emerald-500" />
        </motion.div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Your order has been successfully placed and is being processed.</p>
        <button
          onClick={() => navigate('/shop')}
          className="w-full max-w-xs bg-gray-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-black/10"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pt-12 pb-24">
      <div className="px-4 mb-6 flex items-center gap-4">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(1)} className="p-2 bg-white rounded-xl shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-gray-900">Checkout</h1>
      </div>

      {/* Progress Stepper */}
      <div className="px-4 mb-8">
        <div className="flex items-center gap-4">
          <div className={`flex-grow h-1.5 rounded-full transition-all ${step >= 1 ? 'bg-brand-blue' : 'bg-gray-200'}`} />
          <div className={`flex-grow h-1.5 rounded-full transition-all ${step >= 2 ? 'bg-brand-blue' : 'bg-gray-200'}`} />
        </div>
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="shipping"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Truck size={18} className="text-brand-blue" /> Shipping Address
                </h3>
                
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none"
                      value={address.fullName}
                      onChange={e => setAddress({...address, fullName: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        placeholder="Phone"
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none"
                        value={address.phone}
                        onChange={e => setAddress({...address, phone: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        placeholder="Alt Phone"
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none"
                        value={address.altPhone}
                        onChange={e => setAddress({...address, altPhone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="District"
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none"
                        value={address.district}
                        onChange={e => setAddress({...address, district: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Area"
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none"
                        value={address.area}
                        onChange={e => setAddress({...address, area: e.target.value})}
                      />
                    </div>
                  </div>
                  <textarea
                    placeholder="Detailed Address (House, Road, Block...)"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold outline-none min-h-[100px]"
                    value={address.detailedAddress}
                    onChange={e => setAddress({...address, detailedAddress: e.target.value})}
                  />
                </div>
              </div>
              
              <button
                onClick={() => setStep(2)}
                disabled={!address.fullName || !address.phone || !address.district}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-black/10 disabled:opacity-50"
              >
                Continue to Payment
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="payment"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <CreditCard size={18} className="text-brand-blue" /> Payment Method
                </h3>

                <div className="space-y-4">
                  {[
                    { id: 'cod', name: 'Cash on Delivery', icon: Truck },
                    { id: 'bkash', name: 'bKash', icon: Smartphone },
                    { id: 'nagad', name: 'Nagad', icon: Smartphone },
                    { id: 'wallet', name: 'OC Wallet', icon: Wallet },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${
                        paymentMethod === method.id ? 'border-brand-blue bg-brand-blue/5' : 'border-gray-50 bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        paymentMethod === method.id ? 'bg-brand-blue text-white' : 'bg-white text-gray-400'
                      }`}>
                        <method.icon size={20} />
                      </div>
                      <span className="font-black text-gray-900">{method.name}</span>
                      {paymentMethod === method.id && (
                        <CheckCircle size={20} className="ml-auto text-brand-blue" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500 font-bold text-sm">Order Total</span>
                  <span className="text-xl font-black text-brand-blue">{cartTotal} TK</span>
                </div>
                <p className="text-[10px] text-gray-400 font-bold">By placing this order, you agree to our Terms of Service.</p>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-black/10 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Place Order'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
