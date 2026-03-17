import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trash2, Edit2, CheckCircle, XCircle, Clock, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendResolutionMail } from '../../services/emailService';

interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  issueSubject: string;
  issueDescription: string;
  status: 'open' | 'in-progress' | 'resolved';
  createdAt: any;
  resolutionMessage?: string;
}

const ManageSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionMessage, setResolutionMessage] = useState('');
  const [sendingResolution, setSendingResolution] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ticketsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportTicket[];
      setTickets(ticketsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await deleteDoc(doc(db, 'support_tickets', id));
      } catch (error) {
        console.error('Error deleting ticket:', error);
        alert('Failed to delete ticket');
      }
    }
  };

  const updateStatus = async (id: string, newStatus: 'open' | 'in-progress' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'support_tickets', id), {
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update status');
    }
  };

  const handleResolve = async (ticket: SupportTicket) => {
    if (!resolutionMessage.trim()) {
      alert('Please enter a resolution message.');
      return;
    }

    setSendingResolution(true);
    try {
      // Send resolution email
      const emailSent = await sendResolutionMail({
        name: ticket.userName,
        userEmail: ticket.userEmail,
        ticketId: ticket.id,
        msg: resolutionMessage
      });

      if (emailSent) {
        // Update ticket in Firestore
        await updateDoc(doc(db, 'support_tickets', ticket.id), {
          status: 'resolved',
          resolutionMessage: resolutionMessage,
          resolvedAt: new Date()
        });
        setResolvingId(null);
        setResolutionMessage('');
        alert('Resolution email sent and ticket marked as resolved.');
      } else {
        alert('Failed to send resolution email. Please try again.');
      }
    } catch (error) {
      console.error('Error resolving ticket:', error);
      alert('An error occurred while resolving the ticket.');
    } finally {
      setSendingResolution(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle size={14} /> Open</span>;
      case 'in-progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock size={14} /> In Progress</span>;
      case 'resolved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle size={14} /> Resolved</span>;
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
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Support Tickets</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Ticket Info</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">User</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {tickets.map((ticket) => (
                  <React.Fragment key={ticket.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{ticket.issueSubject}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{ticket.issueDescription}</p>
                          <p className="text-xs text-gray-400 mt-1 font-mono">ID: {ticket.id}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white">{ticket.userName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.userEmail}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={ticket.status}
                            onChange={(e) => updateStatus(ticket.id, e.target.value as any)}
                            className="p-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
                          >
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                          
                          {ticket.status !== 'resolved' && (
                            <button
                              onClick={() => setResolvingId(resolvingId === ticket.id ? null : ticket.id)}
                              className="p-2 text-brand-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Resolve & Send Email"
                            >
                              <Send size={18} />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(ticket.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Ticket"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                    {resolvingId === ticket.id && (
                      <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                        <td colSpan={4} className="p-4 border-b border-gray-100 dark:border-gray-700">
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Resolution Message (will be sent to {ticket.userEmail})
                            </label>
                            <textarea
                              value={resolutionMessage}
                              onChange={(e) => setResolutionMessage(e.target.value)}
                              className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-blue dark:bg-gray-700 dark:text-white"
                              rows={4}
                              placeholder="Explain how the issue was resolved..."
                            />
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => setResolvingId(null)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleResolve(ticket)}
                                disabled={sendingResolution || !resolutionMessage.trim()}
                                className="px-4 py-2 bg-brand-blue text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {sendingResolution ? (
                                  <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Sending...
                                  </>
                                ) : (
                                  <>
                                    <Send size={16} />
                                    Send Resolution
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
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No support tickets found.
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

export default ManageSupportTickets;
