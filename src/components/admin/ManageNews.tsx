import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import ImageUpload from './ImageUpload';
import { pingGoogleSearchConsole } from '../../lib/seo-utils';

interface NewsItem {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  date: any;
}

export default function ManageNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<NewsItem>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'news'), (snapshot) => {
      setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NewsItem)));
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentItem.id) {
        await updateDoc(doc(db, 'news', currentItem.id), {
          title: currentItem.title,
          content: currentItem.content,
          imageUrl: currentItem.imageUrl,
          date: currentItem.date || serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, 'news'), {
          title: currentItem.title,
          content: currentItem.content,
          imageUrl: currentItem.imageUrl,
          date: currentItem.date || serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }
      setIsEditing(false);
      setCurrentItem({});
      // Alert Search Engines
      pingGoogleSearchConsole();
    } catch (error) {
      console.error("Error saving news:", error);
      alert("Failed to save news");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await deleteDoc(doc(db, 'news', id));
      } catch (error) {
        console.error("Error deleting news:", error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold text-brand-blue">Manage News</h2>
        <button
          onClick={() => { setCurrentItem({}); setIsEditing(true); }}
          className="flex items-center px-4 py-2 bg-brand-blue/10 text-brand-blue border border-brand-blue/50 rounded-lg hover:bg-brand-blue/20 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add News
        </button>
      </div>

      {isEditing && (
        <div className="glass-panel p-6 rounded-2xl mb-8 border border-gray-100 relative bg-white/80 backdrop-blur-md">
          <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-bold text-gray-900 mb-6">{currentItem.id ? 'Edit News' : 'New News'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Title</label>
              <input
                type="text"
                required
                value={currentItem.title || ''}
                onChange={e => setCurrentItem({ ...currentItem, title: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Content</label>
              <textarea
                required
                rows={5}
                value={currentItem.content || ''}
                onChange={e => setCurrentItem({ ...currentItem, content: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
            
            <ImageUpload
              label="Cover Image URL (Cloudinary)"
              value={currentItem.imageUrl || ''}
              onChange={(url) => setCurrentItem({ ...currentItem, imageUrl: url })}
            />

            <div className="flex justify-end pt-4">
              <button type="submit" className="px-6 py-3 bg-gradient-brand text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                Save News
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {news.map(item => (
          <div key={item.id} className="glass-panel p-6 rounded-2xl border border-gray-100 flex flex-col bg-white shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900 line-clamp-2 pr-4">{item.title}</h3>
              <div className="flex space-x-2 shrink-0">
                <button onClick={() => { setCurrentItem(item); setIsEditing(true); }} className="p-2 text-gray-400 hover:text-brand-blue transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="aspect-video bg-gray-100 rounded-xl mb-4 overflow-hidden border border-gray-100">
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <p className="text-gray-600 text-sm flex-1 line-clamp-3">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
