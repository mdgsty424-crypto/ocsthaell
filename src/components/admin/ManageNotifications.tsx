import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Send, Trash2, Info, Phone, MessageSquare } from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { useEffect } from 'react';

export default function ManageNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'message' | 'call'>('message');
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'global_notifications'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'global_notifications'), {
        title,
        message,
        type,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      setTitle('');
      setMessage('');
      alert('Notification queued for sending!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this notification record?')) {
      await deleteDoc(doc(db, 'global_notifications', id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-gray-900">Push Notifications</h2>
          <p className="text-gray-500">Send real-time alerts to all users</p>
        </div>
        <Bell className="w-8 h-8 text-brand-blue" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Send Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-6 rounded-2xl border border-gray-100 shadow-sm bg-white"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Send className="w-5 h-5 text-brand-blue" />
            Send New Notification
          </h3>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notification Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New Update Available!"
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-brand-blue outline-none resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notification Type</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setType('message')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                    type === 'message' 
                      ? 'bg-brand-blue/10 border-brand-blue text-brand-blue font-bold' 
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </button>
                <button
                  type="button"
                  onClick={() => setType('call')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border transition-all ${
                    type === 'call' 
                      ? 'bg-red-50 border-red-500 text-red-500 font-bold' 
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Call Alert
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-brand text-white py-3 rounded-xl font-bold shadow-lg shadow-brand-blue/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Sending...' : 'Send to All Users'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700">
              Note: This will send a push notification to every user who has granted permission. 
              This action cannot be undone.
            </p>
          </div>
        </motion.div>

        {/* History */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-6 rounded-2xl border border-gray-100 shadow-sm bg-white"
        >
          <h3 className="text-lg font-bold text-gray-900 mb-6">Recent Notifications</h3>
          
          <div className="space-y-4">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No notifications sent yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="p-4 rounded-xl border border-gray-100 hover:border-brand-blue/30 transition-colors group">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${notif.type === 'call' ? 'bg-red-500' : 'bg-brand-blue'}`} />
                      <h4 className="font-bold text-gray-900">{notif.title}</h4>
                    </div>
                    <button 
                      onClick={() => handleDelete(notif.id)}
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{notif.message}</p>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider">
                    <span>{notif.createdAt?.toDate().toLocaleString()}</span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">{notif.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
