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
    <div className="p-6 bg-[#05070a] min-h-screen text-white">
      <h2 className="text-xl font-bold mb-4">OC-PAY Deposit Requests</h2>
      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.id} className="bg-[#0a0f19] p-4 rounded-lg shadow border-l-4 border-yellow-500 flex justify-between items-center">
            <div>
              <p className="font-bold">User: {req.userName}</p>
              <p className="text-sm text-gray-500">Method: {req.method} | Amount: ৳{req.amount}</p>
              <p className="text-sm font-mono bg-[#05070a] px-2 py-1 mt-1 rounded">TrxID: {req.trxId}</p>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => handleAction(req.id, 'approved')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Approve</button>
              <button onClick={() => handleAction(req.id, 'rejected')} className="bg-red-900 text-red-200 px-4 py-2 rounded-lg text-sm">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
