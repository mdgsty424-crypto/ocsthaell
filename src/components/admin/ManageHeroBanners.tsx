import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Edit2, Trash2, X, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface HeroBannerData {
  id: string;
  mediaUrl?: string;
  imageUrl?: string;
  mediaType?: 'image' | 'video';
  active: boolean;
  order: number;
}

export default function ManageHeroBanners() {
  const [banners, setBanners] = useState<HeroBannerData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBanner, setCurrentBanner] = useState<Partial<HeroBannerData>>({ active: true, order: 0, mediaType: 'image' });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'heroBanners'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HeroBannerData));
      setBanners(data.sort((a, b) => a.order - b.order));
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentBanner.id) {
        await updateDoc(doc(db, 'heroBanners', currentBanner.id), {
          mediaUrl: currentBanner.mediaUrl || currentBanner.imageUrl || '',
          imageUrl: currentBanner.mediaUrl || currentBanner.imageUrl || '',
          mediaType: currentBanner.mediaType || 'image',
          active: currentBanner.active ?? true,
          order: currentBanner.order || 0,
        });
      } else {
        await addDoc(collection(db, 'heroBanners'), {
          mediaUrl: currentBanner.mediaUrl || currentBanner.imageUrl || '',
          imageUrl: currentBanner.mediaUrl || currentBanner.imageUrl || '',
          mediaType: currentBanner.mediaType || 'image',
          active: currentBanner.active ?? true,
          order: currentBanner.order || 0,
          createdAt: serverTimestamp(),
        });
      }
      setIsEditing(false);
      setCurrentBanner({ active: true, order: 0, mediaType: 'image' });
    } catch (error) {
      console.error("Error saving hero banner:", error);
      alert("Failed to save banner");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await deleteDoc(doc(db, 'heroBanners', id));
      } catch (error) {
        console.error("Error deleting banner:", error);
      }
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'heroBanners', id), { active: !currentStatus });
    } catch (error) {
      console.error("Error toggling banner status:", error);
    }
  };

  const isVideoUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg)$/i) || url.includes('video');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold text-brand-blue">Manage Hero Banners</h2>
        <button
          onClick={() => { setCurrentBanner({ active: true, order: banners.length }); setIsEditing(true); }}
          className="flex items-center px-4 py-2 bg-brand-blue/10 text-brand-blue border border-brand-blue/50 rounded-lg hover:bg-brand-blue/20 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Hero Banner
        </button>
      </div>

      {isEditing && (
        <div className="glass-panel p-6 rounded-2xl mb-8 border border-gray-100 shadow-sm relative bg-white/80 backdrop-blur-md">
          <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-bold text-gray-900 mb-6">{currentBanner.id ? 'Edit Hero Banner' : 'New Hero Banner'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Media Type</label>
                <select
                  value={currentBanner.mediaType || 'image'}
                  onChange={e => setCurrentBanner({ ...currentBanner, mediaType: e.target.value as any })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors appearance-none"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
            </div>

            <ImageUpload
              label="Banner Media URL (Image or Video)"
              value={currentBanner.mediaUrl || currentBanner.imageUrl || ''}
              onChange={(url) => {
                const isVideo = url.match(/\.(mp4|webm|ogg)$/i) || url.includes('video');
                setCurrentBanner({ 
                  ...currentBanner, 
                  mediaUrl: url, 
                  imageUrl: url,
                  mediaType: isVideo ? 'video' : 'image'
                });
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input
                  type="number"
                  value={currentBanner.order || 0}
                  onChange={e => setCurrentBanner({ ...currentBanner, order: parseInt(e.target.value) || 0 })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentBanner.active || false}
                    onChange={e => setCurrentBanner({ ...currentBanner, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-blue"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Active Status</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="px-6 py-3 bg-gradient-brand text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                Save Banner
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map(banner => (
          <div key={banner.id} className="glass-panel p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative overflow-hidden bg-white">
            <div className="absolute top-4 right-4 flex space-x-2 z-10">
              <button onClick={() => toggleActive(banner.id, banner.active)} className={`p-2 rounded-full bg-white shadow ${banner.active ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-500'}`} title="Toggle Active">
                {banner.active ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </button>
              <button onClick={() => { setCurrentBanner(banner); setIsEditing(true); }} className="p-2 rounded-full bg-white shadow text-gray-500 hover:text-brand-blue">
                <Edit2 className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(banner.id)} className="p-2 rounded-full bg-white shadow text-gray-500 hover:text-red-500">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="aspect-video bg-gray-100 rounded-xl mb-4 overflow-hidden border border-gray-200 relative flex items-center justify-center">
              {banner.mediaType === 'video' || isVideoUrl(banner.mediaUrl || banner.imageUrl) ? (
                <video src={banner.mediaUrl || banner.imageUrl} className="w-full h-full object-cover opacity-80" autoPlay muted loop playsInline />
              ) : (banner.mediaUrl || banner.imageUrl) ? (
                <img src={banner.mediaUrl || banner.imageUrl} alt="Hero Banner" className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
              ) : (
                <ImageIcon className="w-12 h-12 text-gray-400" />
              )}
            </div>
            
            <p className="text-sm text-gray-600">Order: {banner.order}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
