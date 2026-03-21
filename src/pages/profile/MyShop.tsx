import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { Product, Order, SellerProfile } from '../../types';
import { BANGLADESH_LOCATIONS } from '../../constants/locations';
import { 
  Package, 
  DollarSign, 
  ShoppingBag, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowRight,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  User,
  LayoutDashboard,
  Settings,
  Store,
  Building2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

export default function MyShop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'settings'>('dashboard');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [pickupForm, setPickupForm] = useState({
    warehouseName: '',
    pointPersonName: '',
    pointPersonPhone: '',
    division: '',
    district: '',
    upazila: '',
    detailedAddress: ''
  });

  useEffect(() => {
    if (sellerProfile?.pickupAddress) {
      setPickupForm({
        warehouseName: sellerProfile.pickupAddress.warehouseName || '',
        pointPersonName: sellerProfile.pickupAddress.pointPersonName || '',
        pointPersonPhone: sellerProfile.pickupAddress.pointPersonPhone || '',
        division: sellerProfile.pickupAddress.division || '',
        district: sellerProfile.pickupAddress.district || '',
        upazila: sellerProfile.pickupAddress.upazila || '',
        detailedAddress: sellerProfile.pickupAddress.detailedAddress || ''
      });
    }
  }, [sellerProfile]);

  const handleUpdatePickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);
    try {
      await updateDoc(doc(db, 'sellerProfiles', user.uid), {
        pickupAddress: pickupForm
      });
      alert('Pickup address updated successfully!');
    } catch (err) {
      console.error('Error updating pickup address:', err);
    } finally {
      setUpdatingProfile(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Fetch products
    const qProducts = query(collection(db, 'products'), where('sellerId', '==', user.uid));
    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    // Fetch orders (simplified for demo - in real app filter by seller's products)
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      setOrders(allOrders);
      setLoading(false);
    });

    // Fetch seller profile
    const unsubscribeProfile = onSnapshot(doc(db, 'sellerProfiles', user.uid), (doc) => {
      if (doc.exists()) {
        setSellerProfile({ ...doc.data() } as SellerProfile);
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeProfile();
    };
  }, [user]);

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await updateDoc(doc(db, 'orders', orderId), { status });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pt-12 pb-24">
      <div className="px-4 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-blue rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-blue/20">
            <Store size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{sellerProfile?.shopName || 'My Shop'}</h1>
            <p className="text-xs font-bold text-gray-400">Seller Dashboard</p>
          </div>
        </div>
        <Link to="/shop/upload" className="p-3 bg-gray-900 text-white rounded-2xl shadow-lg active:scale-90 transition-all">
          <Plus size={24} />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="px-4 grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-3">
            <DollarSign size={20} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Earnings</p>
          <h3 className="text-xl font-black text-gray-900">{sellerProfile?.totalEarnings || 0} TK</h3>
        </div>
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="w-10 h-10 bg-brand-blue/10 text-brand-blue rounded-xl flex items-center justify-center mb-3">
            <ShoppingBag size={20} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Sales</p>
          <h3 className="text-xl font-black text-gray-900">{sellerProfile?.totalSales || 0}</h3>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-6 flex gap-2 overflow-x-auto hide-scrollbar">
        {[
          { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
          { id: 'products', label: 'Products', icon: Package },
          { id: 'orders', label: 'Orders', icon: Clock },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 rounded-2xl font-black text-xs whitespace-nowrap flex items-center gap-2 transition-all ${
              activeTab === tab.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-100'
            }`}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Recent Orders Preview */}
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">Recent Orders</h3>
                  <button onClick={() => setActiveTab('orders')} className="text-xs font-black text-brand-blue uppercase tracking-widest">View All</button>
                </div>
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl">
                      <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-100">
                        <img src={order.items[0]?.image} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-xs font-black text-gray-900">#{order.id?.slice(-6).toUpperCase()}</h4>
                        <p className="text-[10px] font-bold text-gray-400">{order.total} TK • {order.status}</p>
                      </div>
                      <button onClick={() => navigate(`/shop/order/${order.id}`)} className="p-2 text-brand-blue">
                        <ArrowRight size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pickup Address Card */}
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <MapPin size={18} className="text-brand-blue" /> Pickup Address (Fulfillment)
                </h3>
                {sellerProfile?.pickupAddress ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Warehouse / Shop Name</p>
                      <h4 className="text-sm font-black text-gray-900">{sellerProfile.pickupAddress.warehouseName}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Point Person</p>
                        <h4 className="text-sm font-black text-gray-900">{sellerProfile.pickupAddress.pointPersonName}</h4>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile</p>
                        <h4 className="text-sm font-black text-gray-900">{sellerProfile.pickupAddress.pointPersonPhone}</h4>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Full Pickup Address</p>
                      <h4 className="text-sm font-black text-gray-900 leading-tight">
                        {sellerProfile.pickupAddress.detailedAddress}, {sellerProfile.pickupAddress.upazila}, {sellerProfile.pickupAddress.district}, {sellerProfile.pickupAddress.division}
                      </h4>
                    </div>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="w-full py-4 bg-gray-900 text-white text-xs font-black rounded-2xl shadow-lg shadow-black/10"
                    >
                      Update Pickup Location
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400 text-xs font-bold mb-4">No pickup address set yet.</p>
                    <button 
                      onClick={() => setActiveTab('settings')}
                      className="px-6 py-3 bg-brand-blue text-white text-xs font-black rounded-xl shadow-lg shadow-brand-blue/20"
                    >
                      Set Pickup Address
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {products.map((product) => (
                <div key={product.id} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow flex flex-col justify-between py-1">
                    <div>
                      <h4 className="text-sm font-black text-gray-900 line-clamp-1">{product.name}</h4>
                      <p className="text-xs font-bold text-brand-blue">{product.discountPrice || product.price} TK</p>
                    </div>
                    <div className="flex gap-2">
                      <Link to={`/shop/edit/${product.id}`} className="p-2 bg-gray-50 text-gray-600 rounded-lg">
                        <Edit size={16} />
                      </Link>
                      <button onClick={() => handleDeleteProduct(product.id)} className="p-2 bg-gray-50 text-red-500 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {orders.map((order) => (
                <div key={order.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-sm font-black text-gray-900">#{order.id?.slice(-8).toUpperCase()}</h4>
                      <p className="text-[10px] font-bold text-gray-400">{order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</p>
                    </div>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id!, e.target.value)}
                      className="bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-3 py-1 outline-none"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-2xl">
                    <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-gray-100">
                      <img src={order.items[0]?.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <h5 className="text-xs font-black text-gray-900 line-clamp-1">{order.items[0]?.name}</h5>
                      <p className="text-[10px] font-bold text-gray-400">{order.items.length} items • {order.total} TK</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-grow py-3 bg-gray-900 text-white text-xs font-black rounded-xl shadow-lg shadow-black/10">
                      Process Order
                    </button>
                    <button onClick={() => navigate(`/shop/order/${order.id}`)} className="px-4 py-3 bg-white text-gray-600 border border-gray-100 rounded-xl">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Building2 size={18} className="text-brand-blue" /> Pickup Address Settings
                </h3>
                
                <form onSubmit={handleUpdatePickup} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Warehouse / Shop Name</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:ring-2 ring-brand-blue/20"
                      value={pickupForm.warehouseName}
                      onChange={e => setPickupForm({...pickupForm, warehouseName: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Point Person</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:ring-2 ring-brand-blue/20"
                        value={pickupForm.pointPersonName}
                        onChange={e => setPickupForm({...pickupForm, pointPersonName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</label>
                      <input
                        required
                        type="tel"
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:ring-2 ring-brand-blue/20"
                        value={pickupForm.pointPersonPhone}
                        onChange={e => setPickupForm({...pickupForm, pointPersonPhone: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <select
                        required
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold outline-none appearance-none focus:ring-2 ring-brand-blue/20"
                        value={pickupForm.division}
                        onChange={e => setPickupForm({...pickupForm, division: e.target.value, district: '', upazila: ''})}
                      >
                        <option value="">Select Division</option>
                        {Object.keys(BANGLADESH_LOCATIONS).map(div => (
                          <option key={div} value={div}>{div}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <select
                        required
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold outline-none appearance-none focus:ring-2 ring-brand-blue/20 disabled:opacity-50"
                        value={pickupForm.district}
                        disabled={!pickupForm.division}
                        onChange={e => setPickupForm({...pickupForm, district: e.target.value, upazila: ''})}
                      >
                        <option value="">Select District</option>
                        {pickupForm.division && Object.keys((BANGLADESH_LOCATIONS as any)[pickupForm.division]).map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative">
                      <select
                        required
                        className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold outline-none appearance-none focus:ring-2 ring-brand-blue/20 disabled:opacity-50"
                        value={pickupForm.upazila}
                        disabled={!pickupForm.district}
                        onChange={e => setPickupForm({...pickupForm, upazila: e.target.value})}
                      >
                        <option value="">Select Upazila</option>
                        {pickupForm.division && pickupForm.district && (BANGLADESH_LOCATIONS as any)[pickupForm.division][pickupForm.district].map((upz: string) => (
                          <option key={upz} value={upz}>{upz}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detailed Address</label>
                    <textarea
                      required
                      rows={3}
                      className="w-full bg-gray-50 border-none rounded-2xl py-3.5 px-4 text-sm font-bold outline-none focus:ring-2 ring-brand-blue/20 resize-none"
                      value={pickupForm.detailedAddress}
                      onChange={e => setPickupForm({...pickupForm, detailedAddress: e.target.value})}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="w-full py-4 bg-brand-blue text-white text-xs font-black rounded-2xl shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
                  >
                    {updatingProfile ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
                  </button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Location Data</h3>
                <button 
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(BANGLADESH_LOCATIONS, null, 2));
                    const downloadAnchorNode = document.createElement('a');
                    downloadAnchorNode.setAttribute("href",     dataStr);
                    downloadAnchorNode.setAttribute("download", "bangladesh_locations.json");
                    document.body.appendChild(downloadAnchorNode);
                    downloadAnchorNode.click();
                    downloadAnchorNode.remove();
                  }}
                  className="w-full py-4 bg-gray-50 text-gray-600 text-xs font-black rounded-2xl border border-gray-100 flex items-center justify-center gap-2"
                >
                  Download All Areas (JSON)
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
