import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Edit2, Trash2, X, Hexagon, Layers, Zap, Shield, Code, Smartphone, Globe, Cloud } from 'lucide-react';

interface ServiceData {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

const availableIcons = [
  { name: 'Layers', icon: Layers },
  { name: 'Zap', icon: Zap },
  { name: 'Shield', icon: Shield },
  { name: 'Code', icon: Code },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Globe', icon: Globe },
  { name: 'Cloud', icon: Cloud },
  { name: 'Hexagon', icon: Hexagon },
];

export default function ManageServices() {
  const [services, setServices] = useState<ServiceData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentService, setCurrentService] = useState<Partial<ServiceData>>({ iconName: 'Hexagon' });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceData)));
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentService.id) {
        await updateDoc(doc(db, 'services', currentService.id), {
          title: currentService.title,
          description: currentService.description,
          iconName: currentService.iconName,
        });
      } else {
        await addDoc(collection(db, 'services'), {
          title: currentService.title,
          description: currentService.description,
          iconName: currentService.iconName,
          createdAt: serverTimestamp(),
        });
      }
      setIsEditing(false);
      setCurrentService({ iconName: 'Hexagon' });
    } catch (error) {
      console.error("Error saving service:", error);
      alert("Failed to save service");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteDoc(doc(db, 'services', id));
      } catch (error) {
        console.error("Error deleting service:", error);
      }
    }
  };

  const getIcon = (name: string) => {
    const iconObj = availableIcons.find(i => i.name === name);
    const Icon = iconObj ? iconObj.icon : Hexagon;
    return <Icon className="w-8 h-8 text-brand-blue" />;
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold text-brand-blue">Manage Services</h2>
        <button
          onClick={() => { setCurrentService({ iconName: 'Hexagon' }); setIsEditing(true); }}
          className="flex items-center px-4 py-2 bg-brand-blue/10 text-brand-blue border border-brand-blue/50 rounded-lg hover:bg-brand-blue/20 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Service
        </button>
      </div>

      {isEditing && (
        <div className="glass-panel p-6 rounded-2xl mb-8 border border-gray-100 relative bg-white/80 backdrop-blur-md">
          <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-bold text-gray-900 mb-6">{currentService.id ? 'Edit Service' : 'New Service'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Service Title</label>
              <input
                type="text"
                required
                value={currentService.title || ''}
                onChange={e => setCurrentService({ ...currentService, title: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={currentService.description || ''}
                onChange={e => setCurrentService({ ...currentService, description: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Select Icon</label>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                {availableIcons.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setCurrentService({ ...currentService, iconName: name })}
                    className={`p-4 rounded-xl flex flex-col items-center justify-center border transition-all ${
                      currentService.iconName === name 
                        ? 'bg-brand-blue/10 border-brand-blue text-brand-blue' 
                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-300 hover:text-gray-600'
                    }`}
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-xs">{name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button type="submit" className="px-6 py-3 bg-gradient-brand text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                Save Service
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <div key={service.id} className="glass-panel p-6 rounded-2xl border border-gray-100 flex flex-col bg-white shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                {getIcon(service.iconName)}
              </div>
              <div className="flex space-x-2">
                <button onClick={() => { setCurrentService(service); setIsEditing(true); }} className="p-2 text-gray-400 hover:text-brand-blue transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(service.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{service.title}</h3>
            <p className="text-gray-600 text-sm flex-1">{service.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
