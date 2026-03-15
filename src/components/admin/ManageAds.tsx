import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Edit2, Trash2, X, CheckCircle, XCircle } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface AdData {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  position: 'hero' | 'section' | 'sidebar';
  active: boolean;
}

export default function ManageAds() {
  const [ads, setAds] = useState<AdData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAd, setCurrentAd] = useState<Partial<AdData>>({ active: true, position: 'hero' });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'ads'), (snapshot) => {
      setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdData)));
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentAd.id) {
        await updateDoc(doc(db, 'ads', currentAd.id), {
          title: currentAd.title,
          imageUrl: currentAd.imageUrl,
          link: currentAd.link,
          position: currentAd.position,
          active: currentAd.active,
        });
      } else {
        await addDoc(collection(db, 'ads'), {
          title: currentAd.title,
          imageUrl: currentAd.imageUrl,
          link: currentAd.link,
          position: currentAd.position,
          active: currentAd.active,
          createdAt: serverTimestamp(),
        });
      }
      setIsEditing(false);
      setCurrentAd({ active: true, position: 'hero' });
    } catch (error) {
      console.error("Error saving ad:", error);
      alert("Failed to save ad");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      try {
        await deleteDoc(doc(db, 'ads', id));
      } catch (error) {
        console.error("Error deleting ad:", error);
      }
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'ads', id), { active: !currentStatus });
    } catch (error) {
      console.error("Error toggling ad status:", error);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold text-white">Manage Ads & Banners</h2>
        <button
          onClick={() => { setCurrentAd({ active: true, position: 'hero' }); setIsEditing(true); }}
          className="flex items-center px-4 py-2 bg-[#8A2BE2]/20 text-[#8A2BE2] border border-[#8A2BE2]/50 rounded-lg hover:bg-[#8A2BE2]/30 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Banner
        </button>
      </div>

      {isEditing && (
        <div className="glass-panel p-6 rounded-2xl mb-8 border border-white/10 relative">
          <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-bold text-white mb-6">{currentAd.id ? 'Edit Banner' : 'New Banner'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Banner Title</label>
              <input
                type="text"
                required
                value={currentAd.title || ''}
                onChange={e => setCurrentAd({ ...currentAd, title: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF] transition-colors"
              />
            </div>
            
            <ImageUpload
              label="Banner Image URL (Cloudinary)"
              value={currentAd.imageUrl || ''}
              onChange={(url) => setCurrentAd({ ...currentAd, imageUrl: url })}
            />

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Target Link URL</label>
              <input
                type="url"
                required
                value={currentAd.link || ''}
                onChange={e => setCurrentAd({ ...currentAd, link: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Position</label>
                <select
                  value={currentAd.position || 'hero'}
                  onChange={e => setCurrentAd({ ...currentAd, position: e.target.value as any })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#00F0FF] transition-colors appearance-none"
                >
                  <option value="hero">Hero Slider</option>
                  <option value="section">Section Banner</option>
                  <option value="sidebar">Sidebar Ad</option>
                </select>
              </div>
              <div className="flex items-center pt-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentAd.active || false}
                    onChange={e => setCurrentAd({ ...currentAd, active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00F0FF]"></div>
                  <span className="ml-3 text-sm font-medium text-gray-300">Active Status</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" className="px-6 py-3 bg-gradient-brand text-white rounded-xl font-semibold hover:glow-purple transition-all">
                Save Banner
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ads.map(ad => (
          <div key={ad.id} className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col relative overflow-hidden">
            <div className="absolute top-4 right-4 flex space-x-2 z-10">
              <button onClick={() => toggleActive(ad.id, ad.active)} className={`p-2 rounded-full glass-panel ${ad.active ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`} title="Toggle Active">
                {ad.active ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </button>
              <button onClick={() => { setCurrentAd(ad); setIsEditing(true); }} className="p-2 rounded-full glass-panel text-gray-400 hover:text-[#00F0FF]">
                <Edit2 className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(ad.id)} className="p-2 rounded-full glass-panel text-gray-400 hover:text-red-400">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <div className="aspect-video bg-black rounded-xl mb-4 overflow-hidden border border-white/10 relative">
              <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-xs font-bold uppercase text-[#00F0FF]">
                {ad.position}
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-white mb-2">{ad.title}</h3>
            <a href={ad.link} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-[#00F0FF] truncate">
              {ad.link}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
