import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order } from '../../types';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin, 
  Phone, 
  User,
  Navigation
} from 'lucide-react';
import { motion } from 'motion/react';

export default function OrderTracking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(doc(db, 'orders', id), (doc) => {
      if (doc.exists()) {
        setOrder({ id: doc.id, ...doc.data() } as Order);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <Package size={64} className="text-gray-200 mb-4" />
      <h2 className="text-2xl font-black text-gray-900 mb-4">Order not found</h2>
      <button onClick={() => navigate('/shop')} className="text-brand-blue font-bold flex items-center gap-2">
        <ArrowLeft size={20} /> Back to Shop
      </button>
    </div>
  );

  const steps = [
    { label: 'Order Placed', icon: Clock },
    { label: 'Confirmed', icon: CheckCircle },
    { label: 'Processing', icon: Package },
    { label: 'Shipped', icon: Truck },
    { label: 'Delivered', icon: MapPin },
  ];

  const currentStepIndex = steps.findIndex(s => s.label === order.status) || 0;

  return (
    <div className="min-h-screen bg-gray-50/50 pt-12 pb-24">
      <div className="px-4 mb-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-gray-900">Track Order</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* Order Summary Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Order ID</p>
              <h3 className="text-sm font-black text-gray-900">#{order.id?.slice(-8).toUpperCase()}</h3>
            </div>
            <div className="bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              {order.status}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              <img
                src={order.items[0]?.image || 'https://picsum.photos/seed/product/200/200'}
                alt={order.items[0]?.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{order.items[0]?.name}</h4>
              <p className="text-xs text-gray-400 font-bold">{order.items.length} items • {order.total} TK</p>
            </div>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8 flex items-center gap-2">
            <Navigation size={18} className="text-brand-blue" /> Delivery Status
          </h3>

          <div className="space-y-8 relative">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-100" />
            
            {steps.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <div key={step.label} className="flex gap-6 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${
                    isCompleted ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' : 'bg-gray-100 text-gray-300'
                  }`}>
                    <step.icon size={16} />
                  </div>
                  <div className="flex-grow pt-1">
                    <h4 className={`text-sm font-black ${isCompleted ? 'text-gray-900' : 'text-gray-300'}`}>
                      {step.label}
                    </h4>
                    {isCurrent && (
                      <p className="text-[10px] font-bold text-brand-blue mt-1">Expected: Today, 4:00 PM</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Shipping Info */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
            <MapPin size={18} className="text-brand-blue" /> Shipping Info
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                <User size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recipient</p>
                <h4 className="text-sm font-black text-gray-900">{order.shippingAddress.fullName}</h4>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact</p>
                <h4 className="text-sm font-black text-gray-900">{order.shippingAddress.phone}</h4>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</p>
                <h4 className="text-sm font-black text-gray-900 leading-tight">
                  {order.shippingAddress.detailedAddress}, {order.shippingAddress.area}, {order.shippingAddress.district}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
