import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trash2, Edit2, Plus, X, Shield, ShieldAlert, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UserData {
  id: string;
  email: string;
  displayName?: string;
  role?: string;
  occupation?: string;
  photoURL?: string;
  createdAt?: any;
}

const ManageUsers = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<UserData>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user record? Note: This does not delete their authentication account, only their database record.')) {
      try {
        await deleteDoc(doc(db, 'users', id));
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      }
    }
  };

  const startEdit = (user: UserData) => {
    setEditingId(user.id);
    setEditData({
      role: user.role || 'user',
      displayName: user.displayName || '',
      occupation: user.occupation || '',
      photoURL: user.photoURL || ''
    });
  };

  const saveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'users', id), {
        role: editData.role,
        displayName: editData.displayName,
        occupation: editData.occupation,
        photoURL: editData.photoURL
      });
      setEditingId(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manage Members</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">User</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Email</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Role</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {users.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
                  >
                    <td className="p-4">
                      {editingId === user.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editData.displayName || ''}
                            onChange={(e) => setEditData({ ...editData, displayName: e.target.value })}
                            placeholder="Display Name"
                            className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue text-sm dark:bg-gray-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={editData.occupation || ''}
                            onChange={(e) => setEditData({ ...editData, occupation: e.target.value })}
                            placeholder="Occupation"
                            className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue text-sm dark:bg-gray-700 dark:text-white"
                          />
                          <input
                            type="text"
                            value={editData.photoURL || ''}
                            onChange={(e) => setEditData({ ...editData, photoURL: e.target.value })}
                            placeholder="Photo URL"
                            className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue text-sm dark:bg-gray-700 dark:text-white"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center text-brand-blue overflow-hidden">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <UserIcon size={20} />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 dark:text-white">{user.displayName || 'Unknown User'}</p>
                            {user.occupation && <p className="text-xs text-gray-500 dark:text-gray-400">{user.occupation}</p>}
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{user.id}</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{user.email || 'No email'}</td>
                    <td className="p-4">
                      {editingId === user.id ? (
                        <select
                          value={editData.role || 'user'}
                          onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                          className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent dark:bg-gray-700 dark:text-white"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' 
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {user.role === 'admin' ? <Shield size={14} /> : <UserIcon size={14} />}
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {editingId === user.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => saveEdit(user.id)}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                            title="Save"
                          >
                            <ShieldAlert size={18} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Cancel"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => startEdit(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit Role"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      No users found in the database.
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

export default ManageUsers;
