import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc,
  serverTimestamp,
  orderBy,
  addDoc
} from 'firebase/firestore';
import { db } from '../../firebase';
import { Check, X, Loader2, Search, CreditCard, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Deposit {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  amount: number;
  txid: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export default function ManageDeposits() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDeposits();
  }, [filter]);

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      let q;
      if (filter === 'all') {
        q = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'));
      } else {
        q = query(
          collection(db, 'deposits'), 
          where('status', '==', filter),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      const depositData = querySnapshot.docs.map(d => {
        const data = d.data() as any;
        return {
          id: d.id,
          uid: data.uid || '',
          email: data.email || '',
          displayName: data.displayName || '',
          amount: data.amount || 0,
          txid: data.txid || '',
          status: data.status || 'pending',
          createdAt: data.createdAt
        };
      }) as Deposit[];
      
      setDeposits(depositData);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (deposit: Deposit) => {
    if (!window.confirm(`Approve deposit of ${deposit.amount} TK for ${deposit.displayName}?`)) return;
    
    setProcessingId(deposit.id);
    try {
      // 1. Update user's wallet balance
      const walletRef = doc(db, 'wallets', deposit.uid);
      const walletSnap = await getDoc(walletRef);
      
      let currentBalance = 0;
      if (walletSnap.exists()) {
        currentBalance = walletSnap.data().balance || 0;
      }
      
      const newBalance = currentBalance + deposit.amount;
      
      // Update wallet directly
      await updateDoc(walletRef, {
        balance: newBalance,
        lastDeposit: serverTimestamp()
      });

      // 2. Update deposit status
      await updateDoc(doc(db, 'deposits', deposit.id), {
        status: 'approved',
        approvedAt: serverTimestamp()
      });

      // 3. Add transaction record
      await addDoc(collection(db, 'transactions'), {
        uid: deposit.uid,
        type: 'deposit',
        amount: deposit.amount,
        txid: deposit.txid,
        status: 'completed',
        createdAt: serverTimestamp()
      });

      alert('Deposit approved successfully!');
      fetchDeposits();
    } catch (error) {
      console.error('Error approving deposit:', error);
      alert('Failed to approve deposit.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (deposit: Deposit) => {
    if (!window.confirm(`Reject deposit of ${deposit.amount} TK for ${deposit.displayName}?`)) return;
    
    setProcessingId(deposit.id);
    try {
      await updateDoc(doc(db, 'deposits', deposit.id), {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      });
      
      alert('Deposit rejected.');
      fetchDeposits();
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      alert('Failed to reject deposit.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredDeposits = deposits.filter(d => 
    d.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.txid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-display font-bold text-gray-900">Manage Deposits</h2>
        
        <div className="flex flex-wrap gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${
                filter === f 
                  ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/20' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name, email or TxID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="w-10 h-10 text-brand-blue animate-spin" />
          <p className="text-gray-500 font-medium">Loading deposits...</p>
        </div>
      ) : filteredDeposits.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No deposits found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredDeposits.map((deposit) => (
              <motion.div
                key={deposit.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-blue/10 rounded-2xl flex items-center justify-center">
                      <User className="w-7 h-7 text-brand-blue" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{deposit.displayName || 'Unknown User'}</h4>
                      <p className="text-sm text-gray-500">{deposit.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 flex-1 px-0 lg:px-8">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Amount</p>
                      <p className="text-xl font-black text-brand-blue">{deposit.amount} TK</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Transaction ID</p>
                      <p className="text-sm font-mono font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded-lg">{deposit.txid}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Date</p>
                      <p className="text-sm font-medium text-gray-600">
                        {deposit.createdAt?.toDate ? deposit.createdAt.toDate().toLocaleDateString() : 'Just now'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full lg:w-auto">
                    {deposit.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(deposit)}
                          disabled={processingId === deposit.id}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-all disabled:opacity-50"
                        >
                          {processingId === deposit.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(deposit)}
                          disabled={processingId === deposit.id}
                          className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all disabled:opacity-50"
                        >
                          {processingId === deposit.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className={`px-6 py-3 rounded-xl font-bold capitalize ${
                        deposit.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {deposit.status}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
