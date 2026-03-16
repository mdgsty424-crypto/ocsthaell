import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  type: 'Executive' | 'General';
  imageUrl: string;
  image?: string;
  bio: string;
  experience: string;
  education: string;
  skills: string[];
  social: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

export default function ManageTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<TeamMember>>({
    type: 'General',
    skills: [''],
    social: { linkedin: '', twitter: '', github: '' }
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'team'), (snapshot) => {
      setTeam(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TeamMember)));
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const memberDataToSave = {
        name: currentMember.name || '',
        role: currentMember.role || '',
        type: currentMember.type || 'General',
        imageUrl: currentMember.imageUrl || currentMember.image || '',
        bio: currentMember.bio || '',
        experience: currentMember.experience || '',
        education: currentMember.education || '',
        skills: currentMember.skills?.filter(s => s.trim() !== '') || [],
        social: {
          linkedin: currentMember.social?.linkedin || '',
          twitter: currentMember.social?.twitter || '',
          github: currentMember.social?.github || ''
        }
      };

      if (currentMember.id) {
        await updateDoc(doc(db, 'team', currentMember.id), memberDataToSave);
      } else {
        await addDoc(collection(db, 'team'), {
          ...memberDataToSave,
          createdAt: serverTimestamp(),
        });
      }
      setIsEditing(false);
      setCurrentMember({ type: 'General', skills: [''], social: { linkedin: '', twitter: '', github: '' } });
    } catch (error) {
      console.error("Error saving team member:", error);
      alert("Failed to save team member");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        await deleteDoc(doc(db, 'team', id));
      } catch (error) {
        console.error("Error deleting team member:", error);
      }
    }
  };

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...(currentMember.skills || [])];
    newSkills[index] = value;
    setCurrentMember({ ...currentMember, skills: newSkills });
  };

  const addSkill = () => {
    setCurrentMember({ ...currentMember, skills: [...(currentMember.skills || []), ''] });
  };

  const removeSkill = (index: number) => {
    const newSkills = [...(currentMember.skills || [])];
    newSkills.splice(index, 1);
    setCurrentMember({ ...currentMember, skills: newSkills });
  };

  const handleSocialChange = (platform: 'linkedin' | 'twitter' | 'github', value: string) => {
    setCurrentMember({
      ...currentMember,
      social: {
        ...(currentMember.social || {}),
        [platform]: value
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-display font-bold text-brand-blue">Manage Team & Staff</h2>
        <button
          onClick={() => { setCurrentMember({ skills: [''], social: { linkedin: '', twitter: '', github: '' } }); setIsEditing(true); }}
          className="flex items-center px-4 py-2 bg-brand-blue/10 text-brand-blue border border-brand-blue/50 rounded-lg hover:bg-brand-blue/20 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" /> Add Member
        </button>
      </div>

      {isEditing && (
        <div className="glass-panel p-6 rounded-2xl mb-8 border border-gray-100 relative bg-white/80 backdrop-blur-md">
          <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
          <h3 className="text-xl font-bold text-gray-900 mb-6">{currentMember.id ? 'Edit Member' : 'New Member'}</h3>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={currentMember.name || ''}
                  onChange={e => setCurrentMember({ ...currentMember, name: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
                <input
                  type="text"
                  required
                  value={currentMember.role || ''}
                  onChange={e => setCurrentMember({ ...currentMember, role: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Member Type</label>
                <select
                  value={currentMember.type || 'General'}
                  onChange={e => setCurrentMember({ ...currentMember, type: e.target.value as 'Executive' | 'General' })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                >
                  <option value="General">General Member</option>
                  <option value="Executive">Executive (Premium Slide)</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Bio</label>
                <textarea
                  required
                  rows={3}
                  value={currentMember.bio || ''}
                  onChange={e => setCurrentMember({ ...currentMember, bio: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <ImageUpload
                  label="Profile Image URL (Cloudinary)"
                  value={currentMember.imageUrl || currentMember.image || ''}
                  onChange={(url) => setCurrentMember({ ...currentMember, imageUrl: url })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Experience</label>
                <input
                  type="text"
                  value={currentMember.experience || ''}
                  onChange={e => setCurrentMember({ ...currentMember, experience: e.target.value })}
                  placeholder="e.g., 10+ Years in Tech"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Education</label>
                <input
                  type="text"
                  value={currentMember.education || ''}
                  onChange={e => setCurrentMember({ ...currentMember, education: e.target.value })}
                  placeholder="e.g., MSc in Computer Science"
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-600">Skills</label>
                <button type="button" onClick={addSkill} className="text-xs text-brand-blue hover:underline flex items-center">
                  <Plus className="w-3 h-3 mr-1" /> Add Skill
                </button>
              </div>
              <div className="space-y-3">
                {(currentMember.skills || []).map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={skill}
                      onChange={e => handleSkillChange(index, e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                      placeholder="e.g., Strategic Planning"
                    />
                    <button type="button" onClick={() => removeSkill(index)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <label className="block text-sm font-medium text-gray-600 mb-4">Social Links</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={currentMember.social?.linkedin || ''}
                    onChange={e => handleSocialChange('linkedin', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Twitter</label>
                  <input
                    type="url"
                    value={currentMember.social?.twitter || ''}
                    onChange={e => handleSocialChange('twitter', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                    placeholder="https://twitter.com/..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">GitHub</label>
                  <input
                    type="url"
                    value={currentMember.social?.github || ''}
                    onChange={e => handleSocialChange('github', e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" className="px-6 py-3 bg-gradient-brand text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                Save Member
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {team.map(member => (
          <div key={member.id} className="glass-panel rounded-2xl border border-gray-100 overflow-hidden relative group bg-white shadow-sm">
            <div className="absolute top-2 right-2 flex space-x-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => { setCurrentMember(member); setIsEditing(true); }} className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:text-brand-blue shadow-sm">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(member.id)} className="p-2 rounded-full bg-white/80 backdrop-blur-sm text-gray-600 hover:text-red-500 shadow-sm">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-[3/4]">
              <img src={member.imageUrl || member.image} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="p-4 bg-white">
              <div className="flex justify-between items-start mb-1">
                <h3 className="text-lg font-bold text-gray-900 truncate">{member.name}</h3>
                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${member.type === 'Executive' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-gray-100 text-gray-600'}`}>
                  {member.type}
                </span>
              </div>
              <p className="text-sm text-brand-blue truncate">{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
