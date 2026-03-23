import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order } from '../../types';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
  };

  return (
    <div className="p-6 bg-white min-h-screen text-gray-900">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Admin Order Management</h1>
      <div className="overflow-x-auto bg-white rounded-xl border border-gray-100 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="p-4 text-gray-700 font-semibold">Order ID</th>
              <th className="p-4 text-gray-700 font-semibold">Customer</th>
              <th className="p-4 text-gray-700 font-semibold">Amount</th>
              <th className="p-4 text-gray-700 font-semibold">Payment</th>
              <th className="p-4 text-gray-700 font-semibold">Status</th>
              <th className="p-4 text-gray-700 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="p-4 font-mono text-sm text-gray-600">{order.id.slice(0, 8)}</td>
                <td className="p-4 text-gray-900">{order.shippingAddress?.fullName || 'Guest'}</td>
                <td className="p-4 text-gray-900 font-medium">৳{order.total}</td>
                <td className="p-4 uppercase text-xs text-gray-500 font-bold">{order.paymentMethod}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                    order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4">
                  <select 
                    className="bg-gray-50 border border-gray-200 rounded p-1 text-sm text-gray-700 focus:border-brand-blue outline-none"
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
