import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { DepositRequest } from '../../types';

export default function DepositVerification() {
  const [requests, setRequests] = useState<DepositRequest[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'deposits'), where('status', '==', 'verifying'));
    return onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositRequest)));
    });
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const req = requests.find(r => r.id === id);
      if (!req) return;

      if (status === 'approved') {
        const userRef = doc(db, 'users', req.userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentWallet = userData.wallet || { balance: 0 };
          const newBalance = (currentWallet.balance || 0) + req.amount;
          
          await updateDoc(userRef, {
            'wallet.balance': newBalance
          });
        }
      }

      await updateDoc(doc(db, 'deposits', id), { status });
      alert(`Deposit ${status} successfully!`);
    } catch (err) {
      console.error("Error updating deposit:", err);
      alert("Action failed. Check console for details.");
    }
  };

  return (
    <div className="p-6 bg-white min-h-screen text-gray-900">
      <h2 className="text-xl font-bold mb-4 text-gray-900">OC-PAY Deposit Requests</h2>
      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-yellow-500 flex justify-between items-center">
            <div>
              <p className="font-bold text-gray-900">User: {req.userName}</p>
              <p className="text-sm text-gray-500">Method: {req.method} | Amount: ৳{req.amount}</p>
              <p className="text-sm font-mono bg-gray-50 text-gray-700 px-2 py-1 mt-1 rounded border border-gray-100">TrxID: {req.trxId}</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handleAction(req.id, 'approved')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">Approve</button>
              <button onClick={() => handleAction(req.id, 'rejected')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm hover:bg-red-200 transition-colors">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
