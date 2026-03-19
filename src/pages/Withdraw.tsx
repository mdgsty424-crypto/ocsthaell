import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Wallet, ArrowLeft, CreditCard, Smartphone, Send, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Withdraw() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);
  const [formData, setFormData] = useState({
    amount: '',
    method: 'bkash',
    phone: '',
    operator: 'grameenphone',
  });

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setBalance(userDoc.data().wallet?.balance || 0);
        }
      } catch (error) {
        console.error("Error fetching balance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (amount > balance) {
      alert("Insufficient balance.");
      return;
    }

    if (amount < 20) {
      alert("Minimum withdrawal amount is 20 TK.");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create withdrawal request
      await addDoc(collection(db, 'withdrawals'), {
        userId: user.uid,
        userName: user.displayName || 'User',
        userEmail: user.email,
        amount: amount,
        method: formData.method === 'recharge' ? `Mobile Recharge (${formData.operator})` : formData.method,
        phone: formData.phone,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // 2. Deduct balance
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentWallet = userSnap.data().wallet;
        await updateDoc(userRef, {
          'wallet.balance': currentWallet.balance - amount
        });
        setBalance(currentWallet.balance - amount);
      }

      alert("Withdrawal request submitted successfully! It will be processed within 12-24 hours.");
      navigate(-1);
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      alert("Failed to submit withdrawal request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-[#05070a]">
        <Loader2 className="w-12 h-12 text-brand-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-white pt-24 pb-12 px-4">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Dashboard
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0f19] rounded-3xl p-8 border border-gray-800 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-brand"></div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-brand-blue/10 rounded-2xl border border-brand-blue/20">
              <Wallet className="w-8 h-8 text-brand-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Withdraw Funds</h1>
              <p className="text-gray-400 text-sm">Available: {balance.toFixed(2)} TK</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Withdrawal Amount (TK)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">TK</span>
                <input
                  type="number"
                  required
                  min="20"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-[#111827] border border-gray-800 rounded-xl pl-12 pr-4 py-4 text-white focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-2 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> Minimum withdrawal: 20 TK
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, method: 'bkash' })}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    formData.method === 'bkash' 
                      ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' 
                      : 'bg-[#111827] border-gray-800 text-gray-500 hover:border-gray-700'
                  }`}
                >
                  <CreditCard className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase">bKash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, method: 'recharge' })}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    formData.method === 'recharge' 
                      ? 'bg-brand-pink/10 border-brand-pink text-brand-pink' 
                      : 'bg-[#111827] border-gray-800 text-gray-500 hover:border-gray-700'
                  }`}
                >
                  <Smartphone className="w-6 h-6" />
                  <span className="text-xs font-bold uppercase">Recharge</span>
                </button>
              </div>
            </div>

            {formData.method === 'recharge' && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Operator</label>
                <select
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-brand-blue transition-colors"
                >
                  <option value="grameenphone">Grameenphone</option>
                  <option value="banglalink">Banglalink</option>
                  <option value="robi">Robi</option>
                  <option value="airtel">Airtel</option>
                  <option value="teletalk">Teletalk</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {formData.method === 'recharge' ? 'Mobile Number' : 'bKash Number'}
              </label>
              <input
                type="tel"
                required
                placeholder="01XXXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center disabled:opacity-50 shadow-lg shadow-brand-blue/20"
            >
              {submitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Submit Request <Send className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
