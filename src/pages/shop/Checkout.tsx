import React, { useState, useEffect } from 'react';
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
  Building2,
  Home,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  Map as MapIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { BANGLADESH_LOCATIONS } from '../../constants/locations';

// Fix for Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (pos: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? <Marker position={position} /> : null;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review, 4: Success
  
  const deliveryFee = 60;
  const discount = 0;
  const finalTotal = cartTotal + deliveryFee - discount;

  const [address, setAddress] = useState({
    fullName: user?.displayName || '',
    phone: '',
    altPhone: '',
    division: '',
    district: '',
    upazila: '',
    detailedAddress: '',
    addressType: 'Home' as 'Home' | 'Office'
  });

  const [mapPosition, setMapPosition] = useState<[number, number]>([23.8103, 90.4125]); // Default to Dhaka
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [trxId, setTrxId] = useState('');
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderId = `OCST-${Math.floor(1000 + Math.random() * 9000)}`;
      setConfirmedOrderId(orderId);
      const orderData = {
        orderId,
        userId: user?.uid || 'guest',
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.discountPrice || item.price,
          quantity: item.quantity,
          image: item.images[0]
        })),
        subtotal: cartTotal,
        deliveryFee,
        discount,
        total: finalTotal,
        status: 'pending',
        paymentMethod,
        trxId: (paymentMethod === 'bkash' || paymentMethod === 'nagad' || paymentMethod === 'rocket') ? trxId : null,
        shippingAddress: address,
        deliveryLocation: { lat: mapPosition[0], lng: mapPosition[1] },
        createdAt: serverTimestamp(),
        trackingTimeline: [
          { status: 'Order Placed', time: new Date().toISOString(), completed: true }
        ]
      };

      await addDoc(collection(db, 'orders'), orderData);
      clearCart();
      setStep(4);
    } catch (err) {
      console.error('Error placing order:', err);
    } finally {
      setLoading(false);
    }
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center max-w-md mx-auto overflow-hidden">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle size={48} className="text-emerald-500" />
        </motion.div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Order Placed!</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Your order has been successfully placed and is being processed.</p>
        
        <div className="bg-gray-50 p-4 rounded-2xl mb-8 w-full max-w-xs border border-gray-100">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
          <p className="text-lg font-black text-brand-blue">#{confirmedOrderId}</p>
        </div>

        <button
          onClick={() => navigate('/shop')}
          className="w-full max-w-xs bg-brand-blue text-white py-4 rounded-2xl font-black shadow-xl shadow-brand-blue/20"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pt-12 pb-24 max-w-md mx-auto overflow-x-hidden relative">
      <div className="px-4 mb-6 flex items-center gap-4">
        <button onClick={() => step === 1 ? navigate(-1) : setStep(step - 1)} className="p-2 bg-white rounded-xl shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-gray-900">
          {step === 1 ? 'Shipping' : step === 2 ? 'Payment' : 'Review'}
        </h1>
      </div>

      {/* Progress Stepper */}
      <div className="px-4 mb-8">
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s}
              className={`flex-grow h-1.5 rounded-full transition-all duration-500 ${
                step >= s ? 'bg-brand-blue' : 'bg-gray-200'
              }`} 
            />
          ))}
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
                  <Truck size={18} className="text-brand-blue" /> Shipping Details
                </h3>
                
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 ring-brand-blue/20"
                      value={address.fullName}
                      onChange={e => setAddress({...address, fullName: e.target.value})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        placeholder="Primary Phone Number"
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 ring-brand-blue/20"
                        value={address.phone}
                        onChange={e => setAddress({...address, phone: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="tel"
                        placeholder="Alternative Phone (Optional)"
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 ring-brand-blue/20"
                        value={address.altPhone}
                        onChange={e => setAddress({...address, altPhone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none appearance-none focus:ring-2 ring-brand-blue/20"
                        value={address.division}
                        onChange={e => setAddress({...address, division: e.target.value, district: '', upazila: ''})}
                      >
                        <option value="">Select Division</option>
                        {Object.keys(BANGLADESH_LOCATIONS).map(div => (
                          <option key={div} value={div}>{div}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none appearance-none focus:ring-2 ring-brand-blue/20 disabled:opacity-50"
                        value={address.district}
                        disabled={!address.division}
                        onChange={e => setAddress({...address, district: e.target.value, upazila: ''})}
                      >
                        <option value="">Select District</option>
                        {address.division && Object.keys((BANGLADESH_LOCATIONS as any)[address.division]).map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none appearance-none focus:ring-2 ring-brand-blue/20 disabled:opacity-50"
                        value={address.upazila}
                        disabled={!address.district}
                        onChange={e => setAddress({...address, upazila: e.target.value})}
                      >
                        <option value="">Select Upazila</option>
                        {address.division && address.district && (BANGLADESH_LOCATIONS as any)[address.division][address.district].map((upz: string) => (
                          <option key={upz} value={upz}>{upz}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <textarea
                    placeholder="Detailed Street Address (House, Road, Flat, Landmark...)"
                    className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold outline-none min-h-[100px] focus:ring-2 ring-brand-blue/20"
                    value={address.detailedAddress}
                    onChange={e => setAddress({...address, detailedAddress: e.target.value})}
                  />

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <MapIcon size={14} /> Pin Delivery Location
                    </h4>
                    <div className="h-48 rounded-2xl overflow-hidden border border-gray-100 z-0">
                      <MapContainer center={mapPosition} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <LocationMarker position={mapPosition} setPosition={setMapPosition} />
                      </MapContainer>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setAddress({...address, addressType: 'Home'})}
                      className={`flex-grow py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border-2 transition-all ${
                        address.addressType === 'Home' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-gray-50 bg-gray-50 text-gray-400'
                      }`}
                    >
                      <Home size={16} /> Home
                    </button>
                    <button
                      onClick={() => setAddress({...address, addressType: 'Office'})}
                      className={`flex-grow py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 border-2 transition-all ${
                        address.addressType === 'Office' ? 'border-brand-blue bg-brand-blue/5 text-brand-blue' : 'border-gray-50 bg-gray-50 text-gray-400'
                      }`}
                    >
                      <Briefcase size={16} /> Office
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => setStep(2)}
                disabled={!address.fullName || !address.phone || !address.division || !address.district || !address.upazila || !address.detailedAddress}
                className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black shadow-xl shadow-brand-blue/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Continue to Payment <ChevronRight size={20} />
              </button>
            </motion.div>
          ) : step === 2 ? (
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

                <div className="space-y-3">
                  {[
                    { id: 'cod', name: 'Cash on Delivery', icon: Truck, desc: 'Pay when you receive' },
                    { id: 'bkash', name: 'bKash', icon: Smartphone, desc: 'Digital payment' },
                    { id: 'nagad', name: 'Nagad', icon: Smartphone, desc: 'Digital payment' },
                    { id: 'wallet', name: 'OC Wallet', icon: Wallet, desc: 'Pay from balance' },
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
                      <div className="text-left">
                        <p className="font-black text-gray-900 text-sm">{method.name}</p>
                        <p className="text-[10px] font-bold text-gray-400">{method.desc}</p>
                      </div>
                      {paymentMethod === method.id && (
                        <CheckCircle size={20} className="ml-auto text-brand-blue" />
                      )}
                    </button>
                  ))}
                </div>

                {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-6 pt-6 border-t border-gray-100 space-y-4"
                  >
                    <div className="bg-brand-blue/5 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-brand-blue uppercase tracking-widest mb-1">Merchant Number</p>
                      <p className="text-lg font-black text-gray-900">01700-000000</p>
                    </div>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Enter Transaction ID"
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-bold outline-none focus:ring-2 ring-brand-blue/20"
                        value={trxId}
                        onChange={e => setTrxId(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full bg-brand-blue text-white py-4 rounded-2xl font-black shadow-xl shadow-brand-blue/20 flex items-center justify-center gap-2"
              >
                Review Order <ChevronRight size={20} />
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Order Summary</h3>
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl overflow-hidden">
                        <img src={item.images[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-xs font-black text-gray-900 line-clamp-1">{item.name}</h4>
                        <p className="text-[10px] font-bold text-gray-400">{item.quantity} x {item.discountPrice || item.price} TK</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Shipping to</h3>
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-brand-blue mt-1" />
                  <div>
                    <p className="text-sm font-black text-gray-900">{address.fullName}</p>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed">
                      {address.detailedAddress}, {address.upazila}, {address.district}, {address.division}
                    </p>
                    <p className="text-xs text-gray-500 font-medium mt-1">{address.phone}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
                  <span>Subtotal</span>
                  <span>{cartTotal} TK</span>
                </div>
                <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
                  <span>Delivery Fee</span>
                  <span>{deliveryFee} TK</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black text-gray-900">Total Bill</span>
                  <span className="text-xl font-black text-brand-blue">{finalTotal} TK</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Confirm Order'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
