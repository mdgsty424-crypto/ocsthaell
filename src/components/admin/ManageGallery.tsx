import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface GalleryImage {
  id: string;
  title: string;
  imageUrl: string;
}

export default function ManageGallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentImage, setCurrentImage] = useState<Partial<GalleryImage>>({});

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      setImages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryImage)));
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentImage.id) {
        await updateDoc(doc(db, 'gallery', currentImage.id), {
          title: currentImage.title,
          imageUrl: currentImage.imageUrl,
        });
      } else {
        await addDoc(collection(db, 'gallery'), {
          title: currentImage.title,
          imageUrl: currentImage.imageUrl,
          createdAt: serverTimestamp(),
        });
      }
      setIsEditing(false);
      setCurrentImage({});
    } catch (error) {
      console.error("Error saving image:", error);
      alert("Failed to save image");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await deleteDoc(doc(db, 'gallery', id));
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold text-brand-blue">Manage Gallery</h2>
        <button
          onClick={() => { setCurrentImage({}); setIsEditing(true); }}
          className="flex items-center px-4 py-2 bg-brand-blue/10 text-brand-blue border border-brand-blue/50 rounded-lg hover:bg-brand-blue/20 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Image
        </button>
      </div>

      {isEditing && (
        <div className="glass-panel p-6 rounded-2xl mb-8 border border-gray-100 relative bg-white/80 backdrop-blur-md">
          <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-bold text-gray-900 mb-6">{currentImage.id ? 'Edit Image' : 'New Image'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Image Title</label>
              <input
                type="text"
                required
                value={currentImage.title || ''}
                onChange={e => setCurrentImage({ ...currentImage, title: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
            
            <ImageUpload
              label="Image URL (Cloudinary)"
              value={currentImage.imageUrl || ''}
              onChange={(url) => setCurrentImage({ ...currentImage, imageUrl: url })}
            />

            <div className="flex justify-end pt-4">
              <button type="submit" className="px-6 py-3 bg-gradient-brand text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                Save Image
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map(image => (
          <div key={image.id} className="glass-panel rounded-2xl border border-gray-100 overflow-hidden relative group bg-white shadow-sm">
            <div className="absolute top-2 right-2 flex space-x-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setCurrentImage(image); setIsEditing(true); }} className="p-2 rounded-full bg-white/80 text-gray-600 hover:text-brand-blue shadow-lg">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(image.id)} className="p-2 rounded-full bg-white/80 text-gray-600 hover:text-red-500 shadow-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-square">
              <img src={image.imageUrl} alt={image.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="p-4 bg-white">
              <h3 className="text-sm font-bold text-gray-900 truncate">{image.title}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
