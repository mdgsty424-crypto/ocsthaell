import React, { useState } from 'react';
import { motion } from 'motion/react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Hexagon, Mail, Lock, User, ArrowRight, Loader2, Phone } from 'lucide-react';
import { sendWelcomeMail, sendBonusMail } from '../services/emailService';
import ImageUpload from '../components/admin/ImageUpload';

export default function Registration() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [nameBengali, setNameBengali] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState('');
  const [sex, setSex] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('A+');
  const [birthPlace, setBirthPlace] = useState('');
  const [address, setAddress] = useState({
    house: '',
    village: '',
    postOffice: '',
    upazila: '',
    district: ''
  });
  const [signatureURL, setSignatureURL] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 1. OC-ID Generation
      const ocId = `OC-${Math.floor(1000 + Math.random() * 9000)}`;
      
      // 2. Save to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        displayName: displayName,
        name: displayName, // Save as 'name' for fallback
        phone: phone,
        photoURL: photoURL,
        nameBengali: nameBengali,
        fatherName: fatherName,
        motherName: motherName,
        dob: dob,
        sex: sex,
        bloodGroup: bloodGroup,
        birthPlace: birthPlace,
        address: address,
        signatureURL: signatureURL,
        bio: bio,
        role: 'user',
        ocId: ocId,
        key: ocId, // Key and OC-ID are now the same
        createdAt: serverTimestamp(),
        issueDate: new Date().toISOString().split('T')[0],
        wallet: {
          balance: 20,
          streak: 0,
          lastLogin: serverTimestamp(),
          welcomeBonusClaimed: true,
          streakBonusClaimed: false,
        }
      });

      // Send Welcome and Bonus Emails asynchronously (don't block navigation)
      if (user.email) {
        sendWelcomeMail({ name: displayName, userEmail: user.email }).catch(console.error);
        sendBonusMail({ name: displayName, amount: "20", email: user.email }).catch(console.error);
      }

      // 3. Generate Token
      const token = await user.getIdToken();

      // Navigate to Success Flow
      navigate('/registration-success', { state: { ocId, token } });

    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError('Network error. This may be due to an ad-blocker, firewall, or if the current domain is not allowlisted in Firebase Console.');
      } else {
        setError(err.message || 'Registration failed');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-white rounded-3xl p-10 relative overflow-hidden shadow-2xl border border-gray-100"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-brand"></div>
        
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Hexagon className="w-16 h-16 text-brand-blue drop-shadow-lg" />
          </div>
          <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
            {step === 1 ? 'Create Account' : step === 2 ? 'Personal Details' : 'Address & Identity'}
          </h2>
          <p className="text-gray-400 text-sm">
            Step {step} of 3 - Join OCSTHAEL and get your unique OC-ID
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegistration} className="space-y-6">
          {step === 1 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Full Name (English)</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">নাম (বাংলায়)</label>
                  <input
                    type="text"
                    required
                    placeholder="নাম (বাংলায়)"
                    value={nameBengali}
                    onChange={(e) => setNameBengali(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">পিতার নাম</label>
                  <input
                    type="text"
                    required
                    placeholder="পিতার নাম"
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <ImageUpload 
                    label="Profile Picture"
                    value={photoURL}
                    onChange={(url) => setPhotoURL(url)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">মাতার নাম</label>
                  <input
                    type="text"
                    required
                    placeholder="মাতার নাম"
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Sex</label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">জন্মস্থান</label>
                <input
                  type="text"
                  required
                  placeholder="জন্মস্থান"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">বাসা/হোল্ডিং</label>
                  <input
                    type="text"
                    required
                    placeholder="বাসা/হোল্ডিং"
                    value={address.house}
                    onChange={(e) => setAddress({ ...address, house: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">গ্রাম-রাস্তা</label>
                  <input
                    type="text"
                    required
                    placeholder="গ্রাম-রাস্তা"
                    value={address.village}
                    onChange={(e) => setAddress({ ...address, village: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">ডাকঘর</label>
                  <input
                    type="text"
                    required
                    placeholder="ডাকঘর"
                    value={address.postOffice}
                    onChange={(e) => setAddress({ ...address, postOffice: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">উপজেলা/চকরিয়া</label>
                  <input
                    type="text"
                    required
                    placeholder="উপজেলা"
                    value={address.upazila}
                    onChange={(e) => setAddress({ ...address, upazila: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-2">জেলা/কক্সবাজার</label>
                  <input
                    type="text"
                    required
                    placeholder="জেলা"
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-2">Bio / About Me (Optional)</label>
                  <textarea
                    placeholder="Tell us about yourself..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-brand-blue transition-colors resize-none"
                    rows={3}
                  />
                </div>
                <div className="md:col-span-2">
                  <ImageUpload 
                    label="Digital Signature"
                    value={signatureURL}
                    onChange={(url) => setSignatureURL(url)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div className="flex gap-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 py-4 px-6 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all shadow-md"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 px-6 rounded-xl bg-brand-blue text-white font-semibold hover:bg-blue-600 transition-all flex items-center justify-center disabled:opacity-50 shadow-lg"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                step === 3 ? 'Complete Registration' : 'Next Step'
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-blue hover:text-blue-400 font-medium inline-flex items-center">
              Sign In <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
