import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trash2, CheckCircle, XCircle, Clock, Send, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendWithdrawalSuccessMail, sendWithdrawalRejectedMail } from '../../services/emailService';

interface WithdrawalRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  method: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  transactionId?: string;
  rejectionReason?: string;
}

const ManageWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [sendingApproval, setSendingApproval] = useState(false);
  const [sendingRejection, setSendingRejection] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'withdrawals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const withdrawalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WithdrawalRequest[];
      setWithdrawals(withdrawalsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this withdrawal request?')) {
      try {
        await deleteDoc(doc(db, 'withdrawals', id));
      } catch (error) {
        console.error('Error deleting withdrawal:', error);
        alert('Failed to delete withdrawal');
      }
    }
  };

  const updateStatus = async (id: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'withdrawals', id), {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating withdrawal status:', error);
      alert('Failed to update status');
    }
  };

  const handleReject = async (withdrawal: WithdrawalRequest) => {
    if (!rejectionReason.trim()) {
      alert('Please enter a reason for rejection.');
      return;
    }

    setSendingRejection(true);
    try {
      // 1. Send rejection email
      await sendWithdrawalRejectedMail({
        userName: withdrawal.userName,
        userEmail: withdrawal.userEmail,
        amount: withdrawal.amount.toString(),
        reason: rejectionReason
      });

      // 2. Update withdrawal in Firestore
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), {
        status: 'rejected',
        rejectionReason: rejectionReason,
        rejectedAt: new Date()
      });

      // 3. Return balance to user
      const userRef = doc(db, 'users', withdrawal.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentWallet = userSnap.data().wallet;
        await updateDoc(userRef, {
          'wallet.balance': (currentWallet.balance || 0) + withdrawal.amount
        });
      }

      setRejectingId(null);
      setRejectionReason('');
      alert('Withdrawal rejected, balance returned, and email sent.');
    } catch (error) {
      console.error('Error rejecting withdrawal:', error);
      alert('An error occurred while rejecting the withdrawal.');
    } finally {
      setSendingRejection(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock size={14} /> Pending</span>;
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle size={14} /> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle size={14} /> Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Withdrawals</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Request Info</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">User</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {withdrawals.map((withdrawal) => (
                  <React.Fragment key={withdrawal.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white flex items-center gap-1">
                            <DollarSign size={16} className="text-green-500" />
                            {withdrawal.amount.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Method: {withdrawal.method}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Phone: {withdrawal.phone}</p>
                          <p className="text-xs text-gray-400 mt-1 font-mono">ID: {withdrawal.id}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{withdrawal.userName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{withdrawal.userEmail}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={withdrawal.status}
                            onChange={(e) => updateStatus(withdrawal.id, e.target.value as any)}
                            className="p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          
                          {withdrawal.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setApprovingId(approvingId === withdrawal.id ? null : withdrawal.id)}
                                className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Approve & Send Email"
                              >
                                <Send size={18} />
                              </button>
                              <button
                                onClick={() => setRejectingId(rejectingId === withdrawal.id ? null : withdrawal.id)}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Reject & Return Balance"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => handleDelete(withdrawal.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Request"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                    {rejectingId === withdrawal.id && (
                      <tr className="bg-red-50/50 dark:bg-red-900/10">
                        <td colSpan={4} className="p-4 border-b border-gray-100 dark:border-gray-700">
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Reason for Rejection (will be sent to {withdrawal.userEmail})
                            </label>
                            <textarea
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                              placeholder="Enter reason for rejection..."
                              rows={3}
                            />
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => setRejectingId(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReject(withdrawal)}
                                disabled={sendingRejection || !rejectionReason.trim()}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {sendingRejection ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Rejecting...
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={16} />
                                    Reject & Return Balance
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No withdrawal requests found.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageWithdrawals;
