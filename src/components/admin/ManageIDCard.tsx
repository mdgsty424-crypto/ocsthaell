import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, Palette, Type, LayoutTemplate, Image as ImageIcon, Hexagon, Droplets, User } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { QRCodeSVG } from 'qrcode.react';

export default function ManageIDCard() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [design, setDesign] = useState({
    primaryColor: '#2563eb', // Blue-600
    secondaryColor: '#10b981', // Emerald-500
    backgroundColor: '#ffffff',
    backgroundImage: 'https://i.postimg.cc/W1GtkQGH/1000000232-removebg-preview.png',
    borderRadius: '3rem',
    borderWidth: '12px',
    borderColor: '#2563eb',
    titleFont: 'serif',
    bodyFont: 'sans-serif',
    logoUrl: '', // If empty, use Hexagon icon
  });

  useEffect(() => {
    const fetchDesign = async () => {
      try {
        const docRef = doc(db, 'settings', 'idCard');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDesign(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error('Error fetching ID card design:', error);
      }
    };
    fetchDesign();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDesign(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await setDoc(doc(db, 'settings', 'idCard'), {
        ...design,
        updatedAt: serverTimestamp(),
      });
      setMessage({ type: 'success', text: 'ID Card design saved successfully!' });
    } catch (error) {
      console.error('Error saving ID card design:', error);
      setMessage({ type: 'error', text: 'Failed to save design.' });
    } finally {
      setLoading(false);
    }
  };

  // Mock data for preview
  const mockData = {
    displayName: 'Mina Akter',
    nameBengali: 'মিনা আক্তার',
    fatherName: 'Anwar Hossain',
    motherName: 'Nuruchhafa Begum',
    dob: '01 Mar 1986',
    bloodGroup: 'O+',
    sex: 'Female',
    occupation: 'Entrepreneur',
    nidNumber: '1234567890',
    phone: '01700000000',
    address: {
      house: '123',
      village: 'Green Valley',
      postOffice: 'City Center',
      upazila: 'Main Town',
      district: 'Dhaka'
    },
    birthPlace: 'Dhaka',
    issueDate: '18 Mar 2024'
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold text-brand-blue flex items-center">
          <Palette className="w-8 h-8 mr-3 text-brand-blue" />
          Smart ID Card Designer
        </h2>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center px-6 py-3 bg-gradient-brand text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? 'Saving...' : 'Save Design'}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Palette className="w-5 h-5 mr-2 text-gray-400" /> Colors & Borders
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Primary Color</label>
                <div className="flex items-center space-x-2">
                  <input type="color" name="primaryColor" value={design.primaryColor} onChange={handleChange} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                  <input type="text" name="primaryColor" value={design.primaryColor} onChange={handleChange} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Secondary Color</label>
                <div className="flex items-center space-x-2">
                  <input type="color" name="secondaryColor" value={design.secondaryColor} onChange={handleChange} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                  <input type="text" name="secondaryColor" value={design.secondaryColor} onChange={handleChange} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Border Color</label>
                <div className="flex items-center space-x-2">
                  <input type="color" name="borderColor" value={design.borderColor} onChange={handleChange} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                  <input type="text" name="borderColor" value={design.borderColor} onChange={handleChange} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Background Color</label>
                <div className="flex items-center space-x-2">
                  <input type="color" name="backgroundColor" value={design.backgroundColor} onChange={handleChange} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0" />
                  <input type="text" name="backgroundColor" value={design.backgroundColor} onChange={handleChange} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Border Radius</label>
                <input type="text" name="borderRadius" value={design.borderRadius} onChange={handleChange} placeholder="e.g. 3rem" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Border Width</label>
                <input type="text" name="borderWidth" value={design.borderWidth} onChange={handleChange} placeholder="e.g. 12px" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <ImageIcon className="w-5 h-5 mr-2 text-gray-400" /> Images & Logos
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Background Watermark URL</label>
                <input type="text" name="backgroundImage" value={design.backgroundImage} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Header Logo URL (Optional)</label>
                <input type="text" name="logoUrl" value={design.logoUrl} onChange={handleChange} placeholder="Leave empty for default icon" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6 space-y-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Type className="w-5 h-5 mr-2 text-gray-400" /> Typography
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Title Font</label>
                <select name="titleFont" value={design.titleFont} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="serif">Serif (Elegant)</option>
                  <option value="sans-serif">Sans-Serif (Modern)</option>
                  <option value="mono">Monospace (Tech)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Body Font</label>
                <select name="bodyFont" value={design.bodyFont} onChange={handleChange} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option value="sans-serif">Sans-Serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Live Preview */}
        <div className="space-y-6 sticky top-24">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <LayoutTemplate className="w-5 h-5 mr-2 text-gray-400" /> Live Preview
          </h3>
          
          <div className="scale-[0.6] origin-top-left xl:scale-[0.8] 2xl:scale-100">
            <div 
              className="relative w-[1000px] aspect-[1.6/1] shadow-2xl overflow-hidden"
              style={{ 
                backgroundColor: design.backgroundColor,
                borderRadius: design.borderRadius,
                border: `${design.borderWidth} solid ${design.borderColor}`,
                fontFamily: design.bodyFont
              }}
            >
              {/* Background Logo */}
              <div 
                className="absolute inset-0 opacity-[0.15] pointer-events-none flex items-center justify-center"
                style={{ 
                  backgroundImage: `url('${design.backgroundImage}')`,
                  backgroundSize: '40%',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'center'
                }}
              ></div>
              
              {/* Accents */}
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full -mr-48 -mt-48 blur-3xl" style={{ backgroundColor: `${design.primaryColor}1a` }}></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full -ml-48 -mb-48 blur-3xl" style={{ backgroundColor: `${design.secondaryColor}1a` }}></div>
              
              <div className="relative z-10 h-full flex flex-col p-12">
                {/* Header */}
                <div className="flex justify-between items-center mb-10 pb-8" style={{ borderBottom: `8px solid ${design.primaryColor}` }}>
                  <div className="flex items-center gap-8">
                    <div className="p-4 rounded-3xl shadow-2xl" style={{ backgroundColor: design.primaryColor }}>
                      {design.logoUrl ? (
                        <img src={design.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                      ) : (
                        <Hexagon className="w-16 h-16 text-white fill-current" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-5xl font-black leading-tight uppercase tracking-tighter" style={{ color: design.primaryColor, fontFamily: design.titleFont }}>OCSTHAEL ECOSYSTEM</h3>
                      <p className="text-base tracking-[0.5em] uppercase font-bold" style={{ color: design.secondaryColor }}>Digital Smart Identity Card</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 uppercase font-black tracking-widest">ID NO</p>
                    <p className="text-4xl font-mono font-black" style={{ color: design.primaryColor }}>OC-3529</p>
                  </div>
                </div>

                <div className="flex flex-1 gap-12">
                  {/* Left: QR */}
                  <div className="w-1/4 flex flex-col items-center justify-center border-r-4 border-gray-100 pr-12">
                    <div className="bg-white p-5 rounded-[2rem] shadow-2xl border-2 border-blue-100">
                      <QRCodeSVG value="preview" size={180} level="H" />
                    </div>
                    <p className="text-sm mt-6 uppercase font-black tracking-widest" style={{ color: design.primaryColor }}>Scan for Profile</p>
                  </div>

                  {/* Center: Photo */}
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-56 h-72 rounded-[2rem] overflow-hidden shadow-2xl bg-gray-50 relative" style={{ border: `8px solid ${design.primaryColor}` }}>
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <User className="w-32 h-32" />
                      </div>
                    </div>
                  </div>

                  {/* Right: Details */}
                  <div className="flex-1 flex flex-col justify-between py-2 pl-8">
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <p className="text-base uppercase font-black tracking-widest" style={{ color: design.secondaryColor }}>নাম: <span className="text-gray-900 font-bold text-2xl ml-3">{mockData.nameBengali}</span></p>
                        <p className="text-5xl font-black leading-none tracking-tight" style={{ color: design.primaryColor, fontFamily: design.titleFont }}>Name: {mockData.displayName}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div>
                          <p className="text-gray-500 text-xs uppercase font-black tracking-widest">পিতা</p>
                          <p className="text-gray-900 font-bold text-lg truncate">{mockData.fatherName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase font-black tracking-widest">মাতা</p>
                          <p className="text-gray-900 font-bold text-lg truncate">{mockData.motherName}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase font-black tracking-widest">Date of Birth</p>
                          <p className="text-gray-900 font-black text-xl">{mockData.dob}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase font-black tracking-widest">Blood Group</p>
                          <p className="text-red-600 font-black text-xl flex items-center gap-2">
                            <Droplets className="w-5 h-5 fill-current" /> {mockData.bloodGroup}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-end pt-8 border-t-4 border-gray-50">
                      <div className="space-y-2">
                        <p className="text-gray-500 text-xs uppercase font-black tracking-widest">জন্মস্থান: <span className="text-gray-900 font-bold">{mockData.birthPlace}</span></p>
                        <p className="text-gray-500 text-xs uppercase font-black tracking-widest">প্রদানের তারিখ: <span className="text-gray-900 font-bold">{mockData.issueDate}</span></p>
                      </div>
                      <div className="text-center">
                        <div className="w-56 h-20 border-b-4 border-gray-200 mb-2 flex items-center justify-center bg-gray-50 rounded-t-2xl">
                          <span className="italic text-sm text-gray-300">Signature</span>
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest" style={{ color: design.primaryColor }}>প্রদানকারী কর্তৃপক্ষ</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Top Bar Accent */}
              <div className="absolute top-0 left-0 w-full h-4" style={{ background: `linear-gradient(to right, ${design.primaryColor}, ${design.secondaryColor}, ${design.primaryColor})` }}></div>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 italic">
            * This is a live preview. Changes will be applied to all user ID cards once saved.
          </p>
        </div>
      </div>
    </div>
  );
}
