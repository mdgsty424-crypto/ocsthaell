import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, runTransaction, collection, query, where, getDocs, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowRight, Wallet, Lock, QrCode, X } from 'lucide-react';
import Scanner from '../components/Scanner';

export default function Transfer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (decodedText: string) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.id) {
        setRecipientId(data.id);
        setShowScanner(false);
      }
    } catch (e) {
      setError('Invalid QR code');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const transferAmount = parseFloat(amount);
      if (isNaN(transferAmount) || transferAmount <= 0) {
        throw new Error('Invalid amount');
      }

      // 1. Find recipient
      let recipientUid = '';
      const q = query(collection(db, 'users'), where('ocId', '==', recipientId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Try email
        const qEmail = query(collection(db, 'users'), where('email', '==', recipientId));
        const qEmailSnapshot = await getDocs(qEmail);
        if (qEmailSnapshot.empty) {
          throw new Error('Recipient not found');
        }
        recipientUid = qEmailSnapshot.docs[0].id;
      } else {
        recipientUid = querySnapshot.docs[0].id;
      }

      if (recipientUid === user.uid) {
        throw new Error('Cannot transfer to yourself');
      }

      // 2. Perform transaction
      await runTransaction(db, async (transaction) => {
        const senderRef = doc(db, 'users', user.uid);
        const recipientRef = doc(db, 'users', recipientUid);
        
        const senderDoc = await transaction.get(senderRef);
        const recipientDoc = await transaction.get(recipientRef);

        if (!senderDoc.exists() || !recipientDoc.exists()) {
          throw new Error('User not found');
        }

        const senderData = senderDoc.data();
        const senderBalance = senderData.wallet?.balance || 0;

        if (senderBalance < transferAmount) {
          throw new Error('Insufficient balance');
        }

        // Update balances
        transaction.update(senderRef, { 'wallet.balance': senderBalance - transferAmount });
        transaction.update(recipientRef, { 'wallet.balance': (recipientDoc.data().wallet?.balance || 0) + transferAmount });

        // Record transaction
        await addDoc(collection(db, 'transactions'), {
          sender: user.uid,
          recipient: recipientUid,
          amount: transferAmount,
          timestamp: serverTimestamp(),
          type: 'transfer'
        });
      });

      alert('Transfer successful!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 bg-[#05070a] text-white">
      <div className="max-w-md mx-auto bg-[#0a0f19] p-8 rounded-2xl border border-gray-800">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Wallet className="text-brand-blue" /> Transfer Money
        </h1>
        {showScanner ? (
          <div className="relative">
            <button onClick={() => setShowScanner(false)} className="absolute top-2 right-2 z-20 bg-gray-800 p-2 rounded-full"><X className="w-5 h-5" /></button>
            <Scanner onScan={handleScan} />
          </div>
        ) : (
          <form onSubmit={handleTransfer} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Recipient OC ID or Email</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="flex-1 bg-[#05070a] border border-gray-700 rounded-lg px-4 py-3 focus:border-brand-blue outline-none"
                  required
                />
                <button type="button" onClick={() => setShowScanner(true)} className="bg-gray-800 p-3 rounded-lg"><QrCode className="w-6 h-6" /></button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#05070a] border border-gray-700 rounded-lg px-4 py-3 focus:border-brand-blue outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#05070a] border border-gray-700 rounded-lg px-4 py-3 focus:border-brand-blue outline-none"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-blue hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Transfer</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
