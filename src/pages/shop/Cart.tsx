import React from 'react';
import { useCart } from '../../context/CartContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white pt-24 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Looks like you haven't added anything to your cart yet.</p>
        <Link
          to="/shop"
          className="bg-brand-blue text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-brand-blue/20 flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pt-12 pb-24">
      <div className="px-4 mb-6 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-black text-gray-900">My Cart</h1>
      </div>

      <div className="px-4 space-y-4 mb-8">
        {cart.map((item) => (
          <motion.div
            layout
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4"
          >
            <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0">
              <img
                src={item.images[0] || 'https://picsum.photos/seed/product/200/200'}
                alt={item.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex-grow flex flex-col justify-between py-1">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{item.name}</h3>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <p className="text-brand-blue font-black text-base mt-1">
                  {item.discountPrice || item.price} TK
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center bg-gray-50 rounded-xl p-1">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-brand-blue"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-brand-blue"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Card */}
      <div className="px-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
            <span>Subtotal</span>
            <span>{cartTotal} TK</span>
          </div>
          <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
            <span>Shipping</span>
            <span className="text-emerald-500">FREE</span>
          </div>
          <div className="h-px bg-gray-100" />
          <div className="flex justify-between items-center">
            <span className="text-lg font-black text-gray-900">Total</span>
            <span className="text-xl font-black text-brand-blue">{cartTotal} TK</span>
          </div>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="fixed bottom-24 left-0 right-0 px-4 z-40">
        <Link
          to="/shop/checkout"
          className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-black/10 flex items-center justify-center gap-2 group active:scale-95 transition-all"
        >
          Checkout Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
