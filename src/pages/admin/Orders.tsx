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
    <div className="p-6 bg-[#05070a] min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">Admin Order Management</h1>
      <div className="overflow-x-auto bg-[#0a0f19] rounded-xl border border-gray-800">
        <table className="w-full text-left">
          <thead className="bg-[#111827] border-b border-gray-800">
            <tr>
              <th className="p-4">Order ID</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Payment</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-800">
                <td className="p-4 font-mono">{order.id.slice(0, 8)}</td>
                <td className="p-4">{order.shippingAddress?.fullName || 'Guest'}</td>
                <td className="p-4">৳{order.total}</td>
                <td className="p-4 uppercase">{order.paymentMethod}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${order.status === 'pending' ? 'bg-yellow-900 text-yellow-200' : 'bg-green-900 text-green-200'}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4">
                  <select 
                    className="bg-[#05070a] border border-gray-700 rounded p-1"
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
