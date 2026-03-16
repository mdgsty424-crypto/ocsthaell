import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Save, User, Mail, Phone, Briefcase, ShieldCheck, Wallet, ArrowUpRight, Gift, Calendar, QrCode, LogOut } from 'lucide-react';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateProfile, signOut } from 'firebase/auth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/admin/ImageUpload';
import { QRCodeSVG } from 'qrcode.react';
import { sendWithdrawalRequest } from '../services/emailService';

export default function UserDashboard() {
  const { user, ocId: loggedInOcId } = useAuth();
  const navigate = useNavigate();
  const { userKey } = useParams<{ userKey: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  
  const isOwnProfile = user && (userKey === loggedInOcId || userKey === user.uid);
  const [profileUser, setProfileUser] = useState<any>(null);
  
  // User Data
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    occupation: '',
    nidNumber: '',
    photoURL: '',
    bio: '',
  });
  
  // Wallet Data
  const [wallet, setWallet] = useState({
    balance: 0,
    streak: 0,
    lastLogin: null as any,
    welcomeBonusClaimed: false,
    streakBonusClaimed: false,
  });

  // Withdrawal Data
  const [withdrawForm, setWithdrawForm] = useState({
    amount: '',
    method: 'bkash',
    phone: '',
    operator: 'grameenphone',
  });

  // OC-ID for QR Code
  const [ocId, setOcId] = useState('');

  useEffect(() => {
    const initDashboard = async () => {
      try {
        let targetUid = '';
        let userData: any = {};
        let docRef: any = null;

        if (isOwnProfile && user) {
          targetUid = user.uid;
          docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            userData = docSnap.data();
          } else {
            // Initialize if not exists
            userData = {
              email: user.email,
              role: 'user',
              createdAt: new Date(),
            };
            await setDoc(docRef, userData);
          }
        } else {
          // Fetch by userKey (could be ocId or uid)
          if (!userKey) return;
          
          // First try by UID
          docRef = doc(db, 'users', userKey);
          let docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            userData = docSnap.data();
            targetUid = userKey;
          } else {
            // Try by ocId
            const q = query(collection(db, 'users'), where('ocId', '==', userKey));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              docSnap = querySnapshot.docs[0] as any;
              userData = docSnap.data();
              targetUid = docSnap.id;
              docRef = doc(db, 'users', targetUid);
            } else {
              setLoading(false);
              return; // User not found
            }
          }
        }

        setProfileUser({ uid: targetUid, ...userData });

        setFormData({
          displayName: userData.displayName || (isOwnProfile ? user?.displayName : '') || '',
          phone: userData.phone || '',
          occupation: userData.occupation || '',
          nidNumber: userData.nidNumber || '',
          photoURL: userData.photoURL || (isOwnProfile ? user?.photoURL : '') || '',
          bio: userData.bio || '',
        });

        // Generate or get OC-ID
        const currentOcId = userData.ocId || `OC-${targetUid.substring(0, 8).toUpperCase()}`;
        setOcId(currentOcId);

        if (isOwnProfile && user) {
          // Initialize Wallet
          const currentWallet = userData.wallet || {
            balance: 0,
            streak: 0,
            lastLogin: new Date(),
            welcomeBonusClaimed: false,
            streakBonusClaimed: false,
          };

          // Handle Streak Logic
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          let newStreak = currentWallet.streak;
          let lastLoginDate = currentWallet.lastLogin ? (currentWallet.lastLogin.toDate ? currentWallet.lastLogin.toDate() : new Date(currentWallet.lastLogin)) : new Date(0);
          lastLoginDate.setHours(0, 0, 0, 0);

          const diffTime = Math.abs(today.getTime() - lastLoginDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            newStreak += 1;
          } else if (diffDays > 1) {
            newStreak = 1; // Reset streak
          } else if (diffDays === 0 && currentWallet.streak === 0) {
            newStreak = 1; // First login
          }

          let newBalance = currentWallet.balance;
          let streakBonusClaimed = currentWallet.streakBonusClaimed;

          // 30 Day Streak Bonus
          if (newStreak >= 30 && !streakBonusClaimed) {
            newBalance += 500;
            streakBonusClaimed = true;
            alert("Congratulations! You've reached a 30-day login streak and earned 500 TK!");
          }

          const updatedWallet = {
            ...currentWallet,
            streak: newStreak,
            lastLogin: new Date(),
            balance: newBalance,
            streakBonusClaimed,
          };

          setWallet(updatedWallet);

          // Save updates (OC-ID, Wallet)
          await updateDoc(docRef, {
            ocId: currentOcId,
            wallet: updatedWallet
          });

          // Welcome Bonus Logic (1 minute delay)
          if (!updatedWallet.welcomeBonusClaimed) {
            setTimeout(async () => {
              try {
                const latestSnap = await getDoc(docRef);
                if (latestSnap.exists()) {
                  const latestData = latestSnap.data();
                  if (!latestData.wallet?.welcomeBonusClaimed) {
                    const newWalletState = {
                      ...latestData.wallet,
                      balance: (latestData.wallet?.balance || 0) + 20,
                      welcomeBonusClaimed: true
                    };
                    await updateDoc(docRef, { wallet: newWalletState });
                    setWallet(newWalletState);
                    alert("Welcome! 20 TK has been added to your wallet.");
                  }
                }
              } catch (err) {
                console.error("Error claiming welcome bonus", err);
              }
            }, 60000); // 1 minute
          }
        }

      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [user, userKey, isOwnProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleWithdrawChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setWithdrawForm({ ...withdrawForm, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, photoURL: url });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, {
        displayName: formData.displayName,
        photoURL: formData.photoURL
      });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: formData.displayName,
        photoURL: formData.photoURL,
        phone: formData.phone,
        occupation: formData.occupation,
        nidNumber: formData.nidNumber,
        bio: formData.bio,
      });

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const amount = parseFloat(withdrawForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (amount > wallet.balance) {
      alert("Insufficient balance.");
      return;
    }

    setWithdrawing(true);
    try {
      // Send email to admin
      await sendWithdrawalRequest(
        formData.displayName || user.email || 'User',
        user.email || '',
        withdrawForm.phone,
        amount,
        withdrawForm.method === 'recharge' ? `Mobile Recharge (${withdrawForm.operator})` : 'Bkash'
      );

      // Deduct balance
      const newBalance = wallet.balance - amount;
      const updatedWallet = { ...wallet, balance: newBalance };
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { wallet: updatedWallet });
      
      setWallet(updatedWallet);
      setWithdrawForm({ ...withdrawForm, amount: '' });
      alert("Withdrawal request sent successfully! Please allow up to 12 hours for processing.");
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      alert("Failed to process withdrawal request. Please try again.");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-12 flex items-center justify-center bg-[#05070a]">
        <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen pt-32 px-4 text-center bg-[#05070a] text-white">
        <h1 className="text-4xl font-bold mb-4">Profile Not Found</h1>
        <Link to="/" className="text-brand-blue hover:underline">
          Return to Home
        </Link>
      </div>
    );
  }

  const profileUrl = `https://ocsthael.com/${ocId}/profile`;

  if (!isOwnProfile) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[#05070a] text-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0a0f19] rounded-3xl p-8 md:p-12 border border-gray-800 text-center relative overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-brand-blue/20 to-brand-pink/20 blur-3xl opacity-50"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden bg-[#111827] border-4 border-gray-800 shadow-2xl mb-6">
                {formData.photoURL ? (
                  <img src={formData.photoURL} alt={formData.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600">
                    <User className="w-16 h-16" />
                  </div>
                )}
              </div>
              
              <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-2">
                {formData.displayName || "Anonymous User"}
              </h1>
              <p className="text-brand-blue font-mono mb-6">{ocId}</p>

              {formData.bio && (
                <p className="text-gray-300 max-w-2xl mx-auto mb-8 text-lg leading-relaxed">
                  "{formData.bio}"
                </p>
              )}

              <div className="flex flex-wrap justify-center gap-4 mb-12">
                {formData.occupation && (
                  <div className="flex items-center bg-[#111827] px-4 py-2 rounded-full border border-gray-800 text-gray-300">
                    <Briefcase className="w-4 h-4 mr-2 text-brand-mango" />
                    {formData.occupation}
                  </div>
                )}
                {profileUser.createdAt && (
                  <div className="flex items-center bg-[#111827] px-4 py-2 rounded-full border border-gray-800 text-gray-300">
                    <Calendar className="w-4 h-4 mr-2 text-brand-pink" />
                    Joined {profileUser.createdAt.toDate ? profileUser.createdAt.toDate().toLocaleDateString() : new Date(profileUser.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="bg-white p-4 rounded-2xl inline-block shadow-xl">
                <QRCodeSVG value={profileUrl} size={150} />
              </div>
              <p className="text-sm text-gray-500 mt-4">Scan to view profile</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[#05070a] text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0f19] p-6 rounded-2xl border border-gray-800">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">My Dashboard</h1>
            <p className="text-gray-400">Manage your profile, wallet, and settings.</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-colors flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Wallet & QR */}
          <div className="space-y-8">
            {/* Wallet Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-brand-blue/20 to-brand-pink/20 p-[1px] rounded-2xl"
            >
              <div className="bg-[#0a0f19] rounded-2xl p-6 h-full border border-gray-800/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold flex items-center">
                    <Wallet className="w-5 h-5 mr-2 text-brand-blue" /> My Wallet
                  </h2>
                  <span className="text-xs font-bold bg-brand-blue/20 text-brand-blue px-2 py-1 rounded-md">Active</span>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-1">Available Balance</p>
                  <h3 className="text-4xl font-black text-white">{wallet.balance.toFixed(2)} <span className="text-xl text-gray-500">TK</span></h3>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#111827] p-3 rounded-xl border border-gray-800">
                    <div className="flex items-center text-brand-mango mb-1">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span className="text-xs font-bold uppercase">Streak</span>
                    </div>
                    <p className="text-xl font-bold">{wallet.streak} <span className="text-sm text-gray-400 font-normal">Days</span></p>
                  </div>
                  <div className="bg-[#111827] p-3 rounded-xl border border-gray-800">
                    <div className="flex items-center text-brand-pink mb-1">
                      <Gift className="w-4 h-4 mr-1" />
                      <span className="text-xs font-bold uppercase">Next Reward</span>
                    </div>
                    <p className="text-sm font-medium text-gray-300">500 TK at 30 days</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Withdrawal Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0a0f19] rounded-2xl p-6 border border-gray-800"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <ArrowUpRight className="w-5 h-5 mr-2 text-brand-pink" /> Withdraw Funds
              </h2>
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Method</label>
                  <select
                    name="method"
                    value={withdrawForm.method}
                    onChange={handleWithdrawChange}
                    className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue"
                  >
                    <option value="bkash">Bkash</option>
                    <option value="recharge">Mobile Recharge</option>
                  </select>
                </div>
                
                {withdrawForm.method === 'recharge' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="block text-sm font-medium text-gray-400 mb-2">Operator</label>
                    <select
                      name="operator"
                      value={withdrawForm.operator}
                      onChange={handleWithdrawChange}
                      className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue"
                    >
                      <option value="grameenphone">Grameenphone</option>
                      <option value="robi">Robi</option>
                      <option value="airtel">Airtel</option>
                      <option value="banglalink">Banglalink</option>
                      <option value="teletalk">Teletalk</option>
                    </select>
                  </motion.div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={withdrawForm.phone}
                    onChange={handleWithdrawChange}
                    placeholder="e.g., 01XXXXXXXXX"
                    className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Amount (TK)</label>
                  <input
                    type="number"
                    name="amount"
                    required
                    min="10"
                    max={wallet.balance}
                    value={withdrawForm.amount}
                    onChange={handleWithdrawChange}
                    placeholder="0.00"
                    className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue"
                  />
                </div>
                <button
                  type="submit"
                  disabled={withdrawing || wallet.balance <= 0}
                  className="w-full py-3 bg-brand-blue text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {withdrawing ? 'Processing...' : 'Request Withdrawal'}
                </button>
              </form>
            </motion.div>

            {/* QR Code Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0a0f19] rounded-2xl p-6 border border-gray-800 text-center"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center justify-center">
                <QrCode className="w-5 h-5 mr-2 text-brand-mango" /> My Public Profile
              </h2>
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <QRCodeSVG value={profileUrl} size={150} />
              </div>
              <p className="text-sm text-gray-400 mb-2">Scan to view profile</p>
              <div className="bg-[#111827] px-4 py-2 rounded-lg border border-gray-800 flex items-center justify-between">
                <span className="text-xs font-mono text-gray-300 truncate mr-2">{profileUrl}</span>
                <button 
                  onClick={() => { navigator.clipboard.writeText(profileUrl); alert('Copied!'); }}
                  className="text-brand-blue text-xs font-bold hover:text-blue-400"
                >
                  COPY
                </button>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-[#0a0f19] rounded-2xl shadow-xl overflow-hidden border border-gray-800"
          >
            <div className="p-8">
              <h2 className="text-2xl font-bold mb-8 flex items-center">
                <User className="w-6 h-6 mr-2 text-brand-blue" /> Profile Settings
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-8 mb-8">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-[#111827] border-4 border-gray-800 shadow-lg relative flex-shrink-0">
                    {formData.photoURL ? (
                      <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        <User className="w-12 h-12" />
                      </div>
                    )}
                  </div>
                  <div className="flex-grow w-full">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Profile Photo</label>
                    <ImageUpload
                      value={formData.photoURL}
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#111827] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>

                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full pl-10 pr-4 py-3 bg-[#111827]/50 border border-gray-800 rounded-xl text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-[#111827] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>

                  {/* Occupation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Occupation</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <select
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-[#111827] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-brand-blue appearance-none"
                      >
                        <option value="">Select Occupation</option>
                        <option value="Developer">Developer</option>
                        <option value="Entrepreneur">Entrepreneur</option>
                        <option value="Student">Student</option>
                        <option value="Designer">Designer</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* NID Number */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">NID Number</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        name="nidNumber"
                        value={formData.nidNumber}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-3 bg-[#111827] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder="Tell us a bit about yourself..."
                      className="w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-brand-blue resize-none"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-brand-blue text-white rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center disabled:opacity-70"
                  >
                    {saving ? (
                      <span className="flex items-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> Saving...</span>
                    ) : (
                      <span className="flex items-center"><Save className="w-5 h-5 mr-2" /> Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
