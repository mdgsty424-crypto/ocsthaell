import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { Order } from '../../types';
import { CheckCircle, Package, Truck, Clock, AlertCircle } from 'lucide-react';

export default function OrderStatus({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    return onSnapshot(doc(db, 'orders', orderId), (doc) => {
      setOrder({ id: doc.id, ...doc.data() } as Order);
    });
  }, [orderId]);

  if (!order) return <div>Loading...</div>;

  const steps = [
    { id: 'pending', label: 'Pending', icon: Clock },
    { id: 'confirmed', label: 'Confirmed', icon: CheckCircle },
    { id: 'processing', label: 'Processing', icon: Package },
    { id: 'shipping', label: 'Shipping', icon: Truck },
    { id: 'delivered', label: 'Delivered', icon: CheckCircle },
  ];

  return (
    <div className="flex justify-between p-4 bg-[#0a0f19] rounded-xl border border-gray-800">
      {steps.map((step, index) => (
        <div key={step.id} className={`flex flex-col items-center ${order.status === step.id ? 'text-brand-blue' : 'text-gray-500'}`}>
          <step.icon size={24} />
          <span className="text-xs mt-1">{step.label}</span>
        </div>
      ))}
    </div>
  );
}
