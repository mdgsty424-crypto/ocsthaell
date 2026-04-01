import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';
import ImageUpload from './ImageUpload';
import FileUpload from './FileUpload';

interface AppData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  iconUrl: string;
  apkUrl: string;
  link: string;
  color: string;
  features: string[];
  gallery: string[];
  rating: number;
  downloads: string;
  publishDate?: string;
  category: string;
  downloadCount: number;
  videoUrl?: string;
  videoFileUrl?: string;
  downloadLink?: string;
}

export default function ManageApps() {
  const [apps, setApps] = useState<AppData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentApp, setCurrentApp] = useState<Partial<AppData>>({
    features: [''],
    gallery: ['']
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'apps'), (snapshot) => {
      setApps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppData)));
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const appDataToSave = {
        name: currentApp.name || '',
        tagline: currentApp.tagline || '',
        description: currentApp.description || '',
        iconUrl: currentApp.iconUrl || '',
        apkUrl: currentApp.apkUrl || '',
        link: currentApp.link || '',
        color: currentApp.color || 'from-blue-500 to-cyan-400',
        features: currentApp.features?.filter(f => f.trim() !== '') || [],
        gallery: currentApp.gallery?.filter(g => g.trim() !== '') || [],
        rating: Number(currentApp.rating) || 0,
        downloads: currentApp.downloads || '0',
        publishDate: currentApp.publishDate || '',
        category: currentApp.category || 'General',
        downloadCount: Number(currentApp.downloadCount) || 0,
        videoUrl: currentApp.videoUrl || '',
        videoFileUrl: currentApp.videoFileUrl || '',
        downloadLink: currentApp.downloadLink || '',
      };

      if (currentApp.id) {
        await updateDoc(doc(db, 'apps', currentApp.id), appDataToSave);
      } else {
        await addDoc(collection(db, 'apps'), {
          ...appDataToSave,
          createdAt: serverTimestamp(),
        });
      }
      setIsEditing(false);
      setCurrentApp({ features: [''], gallery: [''] });
    } catch (error) {
      console.error("Error saving app:", error);
      alert("Failed to save app");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this app?')) {
      try {
        await deleteDoc(doc(db, 'apps', id));
      } catch (error) {
        console.error("Error deleting app:", error);
      }
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...(currentApp.features || [])];
    newFeatures[index] = value;
    setCurrentApp({ ...currentApp, features: newFeatures });
  };

  const addFeature = () => {
    setCurrentApp({ ...currentApp, features: [...(currentApp.features || []), ''] });
  };

  const removeFeature = (index: number) => {
    const newFeatures = [...(currentApp.features || [])];
    newFeatures.splice(index, 1);
    setCurrentApp({ ...currentApp, features: newFeatures });
  };

  const handleGalleryChange = (index: number, value: string) => {
    const newGallery = [...(currentApp.gallery || [])];
    newGallery[index] = value;
    setCurrentApp({ ...currentApp, gallery: newGallery });
  };

  const addGalleryImage = () => {
    setCurrentApp({ ...currentApp, gallery: [...(currentApp.gallery || []), ''] });
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = [...(currentApp.gallery || [])];
    newGallery.splice(index, 1);
    setCurrentApp({ ...currentApp, gallery: newGallery });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold text-brand-blue">Manage Apps</h2>
        <button
          onClick={() => { setCurrentApp({ features: [''], gallery: [''] }); setIsEditing(true); }}
          className="flex items-center px-4 py-2 bg-brand-blue/10 text-brand-blue border border-brand-blue/50 rounded-lg hover:bg-brand-blue/20 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add App
        </button>
      </div>

      {isEditing && (
        <div className="glass-panel p-6 rounded-2xl mb-8 border border-gray-100 relative bg-white/80 backdrop-blur-md">
          <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-bold text-gray-900 mb-6">{currentApp.id ? 'Edit App' : 'New App'}</h3>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">App Name</label>
                <input
                  type="text"
                  required
                  value={currentApp.name || ''}
                  onChange={e => setCurrentApp({ ...currentApp, name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Tagline</label>
                <input
                  type="text"
                  required
                  value={currentApp.tagline || ''}
                  onChange={e => setCurrentApp({ ...currentApp, tagline: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={currentApp.description || ''}
                  onChange={e => setCurrentApp({ ...currentApp, description: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              
              <div className="md:col-span-2">
                <ImageUpload
                  label="App Icon URL (Cloudinary)"
                  value={currentApp.iconUrl || ''}
                  onChange={(url) => setCurrentApp({ ...currentApp, iconUrl: url })}
                />
              </div>

              <div className="md:col-span-2">
                <FileUpload
                  label="APK File"
                  value={currentApp.apkUrl || ''}
                  onChange={(url) => setCurrentApp({ ...currentApp, apkUrl: url })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Web Version Link</label>
                <input
                  type="url"
                  value={currentApp.link || ''}
                  onChange={e => setCurrentApp({ ...currentApp, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Download Link (External)</label>
                <input
                  type="url"
                  value={currentApp.downloadLink || ''}
                  onChange={e => setCurrentApp({ ...currentApp, downloadLink: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                <input
                  type="text"
                  required
                  value={currentApp.category || ''}
                  onChange={e => setCurrentApp({ ...currentApp, category: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Download Count</label>
                <input
                  type="number"
                  value={currentApp.downloadCount || 0}
                  onChange={e => setCurrentApp({ ...currentApp, downloadCount: Number(e.target.value) })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">YouTube Video URL</label>
                <input
                  type="url"
                  value={currentApp.videoUrl || ''}
                  onChange={e => setCurrentApp({ ...currentApp, videoUrl: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <FileUpload
                  label="Video File Upload"
                  value={currentApp.videoFileUrl || ''}
                  onChange={(url) => setCurrentApp({ ...currentApp, videoFileUrl: url })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Theme Color Gradient (Tailwind classes)</label>
                <input
                  type="text"
                  value={currentApp.color || ''}
                  onChange={e => setCurrentApp({ ...currentApp, color: e.target.value })}
                  placeholder="e.g., from-blue-500 to-cyan-400"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Rating (e.g., 4.8)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={currentApp.rating || ''}
                  onChange={e => setCurrentApp({ ...currentApp, rating: Number(e.target.value) })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Downloads (e.g., 1M+)</label>
                <input
                  type="text"
                  value={currentApp.downloads || ''}
                  onChange={e => setCurrentApp({ ...currentApp, downloads: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Expected Launch Date (Optional)</label>
                <input
                  type="text"
                  value={currentApp.publishDate || ''}
                  onChange={e => setCurrentApp({ ...currentApp, publishDate: e.target.value })}
                  placeholder="e.g., Q4 2026"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-600">Features</label>
                <button type="button" onClick={addFeature} className="text-xs text-brand-blue hover:underline flex items-center">
                  <Plus className="w-3 h-3 mr-1" /> Add Feature
                </button>
              </div>
              <div className="space-y-3">
                {(currentApp.features || []).map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={e => handleFeatureChange(index, e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                      placeholder="e.g., Real-time messaging"
                    />
                    <button type="button" onClick={() => removeFeature(index)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-600">Gallery Images (URLs)</label>
                <button type="button" onClick={addGalleryImage} className="text-xs text-brand-blue hover:underline flex items-center">
                  <Plus className="w-3 h-3 mr-1" /> Add Image
                </button>
              </div>
              <div className="space-y-3">
                {(currentApp.gallery || []).map((img, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={img}
                      onChange={e => handleGalleryChange(index, e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                      placeholder="https://..."
                    />
                    <button type="button" onClick={() => removeGalleryImage(index)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" className="px-6 py-3 bg-gradient-brand text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                Save App Details
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map(app => (
          <div key={app.id} className="glass-panel p-6 rounded-2xl border border-gray-100 flex flex-col bg-white shadow-sm">
            <div className="flex items-center space-x-4 mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center p-2 bg-gradient-to-br ${app.color || 'from-gray-700 to-gray-900'}`}>
                {app.iconUrl ? (
                  <img src={app.iconUrl} alt={app.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{app.name}</h3>
                <p className="text-xs text-brand-blue truncate max-w-[150px]">{app.tagline}</p>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-6 flex-1 line-clamp-3">{app.description}</p>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-400">
                {app.features?.length || 0} features | {app.gallery?.length || 0} images
              </div>
              <div className="flex space-x-2">
                <button onClick={() => { setCurrentApp(app); setIsEditing(true); }} className="p-2 text-gray-400 hover:text-brand-blue transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(app.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
