import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Save, User, Mail, Phone, Briefcase, ShieldCheck, Wallet, ArrowUpRight, Gift, Calendar, QrCode, LogOut, CreditCard, MapPin, Droplets, Info, Hexagon, ArrowRight, MessageSquare, Download, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, signOut, signInWithCustomToken } from 'firebase/auth';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import ImageUpload from '../components/admin/ImageUpload';
import { QRCodeSVG } from 'qrcode.react';
import { toPng, toBlob } from 'html-to-image';
import { useRef } from 'react';

export default function UserDashboard() {
  const { user, ocId: loggedInOcId } = useAuth();
  const navigate = useNavigate();
  const { userKey } = useParams<{ userKey: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [showBack, setShowBack] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const backCardRef = useRef<HTMLDivElement>(null);
  
  const isOwnProfile = user && (userKey === loggedInOcId || userKey === user.uid);
  const [profileUser, setProfileUser] = useState<any>(null);
  
  // Deposit Data
  const [depositForm, setDepositForm] = useState({
    amount: '',
    txid: '',
  });
  const [formData, setFormData] = useState({
    displayName: '',
    nameBengali: '',
    fatherName: '',
    motherName: '',
    dob: '',
    sex: '',
    bloodGroup: '',
    birthPlace: '',
    address: {
      house: '',
      village: '',
      postOffice: '',
      upazila: '',
      district: ''
    },
    phone: '',
    occupation: '',
    nidNumber: '',
    photoURL: '',
    signatureURL: '',
    bio: '',
    issueDate: '',
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
  const [cardDesign, setCardDesign] = useState({
    primaryColor: '#2563eb',
    secondaryColor: '#10b981',
    backgroundColor: '#ffffff',
    backgroundImage: 'https://i.postimg.cc/W1GtkQGH/1000000232-removebg-preview.png',
    borderRadius: '3rem',
    borderWidth: '12px',
    borderColor: '#2563eb',
    titleFont: 'serif',
    bodyFont: 'sans-serif',
    logoUrl: '',
  });

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
            userData = {
              email: user.email,
              role: 'user',
              createdAt: new Date(),
            };
            await setDoc(docRef, userData);
          }
        } else {
          if (!userKey) return;
          docRef = doc(db, 'users', userKey);
          let docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            userData = docSnap.data();
            targetUid = userKey;
          } else {
            const q = query(collection(db, 'users'), where('ocId', '==', userKey));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
              docSnap = querySnapshot.docs[0] as any;
              userData = docSnap.data();
              targetUid = docSnap.id;
              docRef = doc(db, 'users', targetUid);
            } else {
              setLoading(false);
              return;
            }
          }
        }

        setProfileUser({ uid: targetUid, ...userData });

        const designRef = doc(db, 'settings', 'idCard');
        const designSnap = await getDoc(designRef);
        if (designSnap.exists()) {
          setCardDesign(prev => ({ ...prev, ...designSnap.data() }));
        }

        setFormData({
          displayName: userData.displayName || userData.name || '',
          nameBengali: userData.nameBengali || '',
          fatherName: userData.fatherName || '',
          motherName: userData.motherName || '',
          dob: userData.dob || '',
          sex: userData.sex || '',
          bloodGroup: userData.bloodGroup || '',
          birthPlace: userData.birthPlace || '',
          address: userData.address || { house: '', village: '', postOffice: '', upazila: '', district: '' },
          phone: userData.phone || '',
          occupation: userData.occupation || '',
          nidNumber: userData.nidNumber || '',
          photoURL: userData.photoURL || '',
          signatureURL: userData.signatureURL || '',
          bio: userData.bio || '',
          issueDate: userData.issueDate || '',
        });

        const currentOcId = userData.ocId || `OC-${targetUid.substring(0, 8).toUpperCase()}`;
        setOcId(currentOcId);

        if (isOwnProfile && user) {
          const currentWallet = userData.wallet || {
            balance: 0,
            streak: 0,
            lastLogin: new Date(),
            welcomeBonusClaimed: false,
            streakBonusClaimed: false,
          };

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
            newStreak = 1;
          } else if (diffDays === 0 && currentWallet.streak === 0) {
            newStreak = 1;
          }

          let newBalance = currentWallet.balance;
          let streakBonusClaimed = currentWallet.streakBonusClaimed;

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

          await updateDoc(docRef, {
            ocId: currentOcId,
            wallet: updatedWallet
          });

          if (!updatedWallet.welcomeBonusClaimed) {
            setTimeout(async () => {
              try {
                const latestSnap = await getDoc(docRef);
                if (latestSnap.exists()) {
                  const latestData = latestSnap.data() as any;
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
            }, 60000);
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
        name: formData.displayName, // Update 'name' as well
        photoURL: formData.photoURL,
        signatureURL: formData.signatureURL,
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
      await addDoc(collection(db, 'withdrawals'), {
        userId: user.uid,
        userName: formData.displayName || user.email || 'User',
        userEmail: user.email || '',
        amount: amount,
        method: withdrawForm.method === 'recharge' ? `Mobile Recharge (${withdrawForm.operator})` : 'Bkash',
        phone: withdrawForm.phone,
        status: 'pending',
        createdAt: new Date()
      });

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

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isOwnProfile) return;

    const amount = parseFloat(depositForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!depositForm.txid || depositForm.txid.length < 8) {
      alert("Please enter a valid Transaction ID.");
      return;
    }

    setDepositing(true);
    try {
      // Check if TxID already used
      const q = query(collection(db, 'deposits'), where('txid', '==', depositForm.txid));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        alert("This Transaction ID has already been used.");
        setDepositing(false);
        return;
      }

      // Record Deposit as Pending
      await addDoc(collection(db, 'deposits'), {
        userId: user.uid,
        userName: formData.displayName || user.email || 'User',
        amount: amount,
        txid: depositForm.txid,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      setDepositForm({ amount: '', txid: '' });
      alert(`Deposit request of ${amount} TK submitted! Please wait for admin approval. Your balance will update once approved.`);
    } catch (error) {
      console.error("Error processing deposit:", error);
      alert("Failed to process deposit. Please try again.");
    } finally {
      setDepositing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard: " + text);
  };

  const downloadIdCard = async (format: 'png' | 'pdf') => {
    if (cardRef.current === null) return;
    
    try {
      setSaving(true);
      // Wait for images to be fully loaded and rendered
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const options = {
        cacheBust: true,
        pixelRatio: 4,
        skipFonts: false,
        backgroundColor: cardDesign.backgroundColor,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0',
          padding: '0'
        }
      };

      const frontBlob = await toBlob(cardRef.current, options);
      if (!frontBlob) throw new Error('Failed to generate front image blob');
      const frontUrl = URL.createObjectURL(frontBlob);

      let backBlob = null;
      let backUrl = null;
      if (isOwnProfile && backCardRef.current) {
        backBlob = await toBlob(backCardRef.current, options);
        if (backBlob) {
          backUrl = URL.createObjectURL(backBlob);
        }
      }

      if (format === 'png') {
        const downloadLink = (url: string, filename: string) => {
          const link = document.createElement('a');
          link.download = filename;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        downloadLink(frontUrl, `OCSTHAEL-ID-FRONT-${ocId}.png`);
        
        if (backUrl) {
          // Add a small delay to ensure the browser allows multiple downloads
          await new Promise(resolve => setTimeout(resolve, 500));
          downloadLink(backUrl, `OCSTHAEL-ID-BACK-${ocId}.png`);
        }
        
        URL.revokeObjectURL(frontUrl);
        if (backUrl) URL.revokeObjectURL(backUrl);
      } else {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [1000, 625]
        });
        pdf.addImage(frontUrl, 'PNG', 0, 0, 1000, 625);
        
        if (backUrl) {
          pdf.addPage();
          pdf.addImage(backUrl, 'PNG', 0, 0, 1000, 625);
        }
        
        pdf.save(`OCSTHAEL-ID-${ocId}.pdf`);
        URL.revokeObjectURL(frontUrl);
        if (backUrl) URL.revokeObjectURL(backUrl);
      }
    } catch (err) {
      console.error('Failed to download ID card', err);
      alert("Download failed. Please try again or use a different browser (Chrome recommended). If the problem persists, you can take a screenshot.");
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-[#05070a] text-white">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0f19] p-6 rounded-2xl border border-gray-800">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              {isOwnProfile ? 'My Dashboard' : `${formData.displayName}'s Profile`}
            </h1>
            <p className="text-gray-400">
              {isOwnProfile ? 'Manage your profile, wallet, and settings.' : 'View user information and ID card.'}
            </p>
          </div>
          {isOwnProfile && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-colors flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </button>
          )}
        </div>

        {/* Digital ID Card Section */}
        <div className="flex flex-col items-center gap-6">
          {isOwnProfile && (
            <div className="flex bg-[#111827] rounded-xl p-1 mb-2 border border-gray-800">
              <button
                onClick={() => setShowBack(false)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${!showBack ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
              >
                Front Side
              </button>
              <button
                onClick={() => setShowBack(true)}
                className={`px-6 py-2 rounded-lg font-bold transition-all ${showBack ? 'bg-brand-blue text-white' : 'text-gray-400'}`}
              >
                Back Side
              </button>
            </div>
          )}

          <div className="w-full relative">
            {/* Front Card */}
            <div className={`w-full overflow-x-auto pb-4 custom-scrollbar ${!showBack || !isOwnProfile ? 'block' : 'absolute top-0 left-0 opacity-0 pointer-events-none z-[-1]'}`}>
              <motion.div
                key="front"
                initial={{ opacity: 0, rotateY: -90 }}
                animate={{ opacity: 1, rotateY: 0 }}
                className="relative min-w-[1000px] mx-auto"
                ref={cardRef}
              >
              <div 
                className="shadow-2xl relative overflow-hidden aspect-[1.6/1] text-gray-900"
                style={{
                  backgroundColor: cardDesign.backgroundColor,
                  borderRadius: cardDesign.borderRadius,
                  border: `${cardDesign.borderWidth} solid ${cardDesign.borderColor}`,
                  fontFamily: cardDesign.bodyFont
                }}
              >
                {/* Background Logo */}
                <div 
                  className="absolute inset-0 opacity-[0.15] pointer-events-none flex items-center justify-center overflow-hidden"
                >
                  {cardDesign.backgroundImage && (
                    <img 
                      src={cardDesign.backgroundImage} 
                      alt="" 
                      className="w-[40%] h-auto object-contain"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>
                
                {/* Accents */}
                <div className="absolute top-0 right-0 w-96 h-96 rounded-full -mr-48 -mt-48 blur-3xl" style={{ backgroundColor: `${cardDesign.primaryColor}1a` }}></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full -ml-48 -mb-48 blur-3xl" style={{ backgroundColor: `${cardDesign.secondaryColor}1a` }}></div>
                
                <div className="relative z-10 h-full flex flex-col p-12">
                  {/* Card Header */}
                  <div className="flex justify-between items-center mb-10 pb-8" style={{ borderBottom: `8px solid ${cardDesign.primaryColor}` }}>
                    <div className="flex items-center gap-8">
                      <div className="p-4 rounded-3xl shadow-2xl" style={{ backgroundColor: cardDesign.primaryColor }}>
                        {cardDesign.logoUrl ? (
                          <img 
                            src={cardDesign.logoUrl} 
                            alt="Logo" 
                            className="w-16 h-16 object-contain" 
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <Hexagon className="w-16 h-16 text-white fill-current" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-5xl font-black leading-tight uppercase tracking-tighter" style={{ color: cardDesign.primaryColor, fontFamily: cardDesign.titleFont }}>OCSTHAEL ECOSYSTEM</h3>
                        <p className="text-base tracking-[0.5em] uppercase font-bold" style={{ color: cardDesign.secondaryColor }}>Digital Smart Identity Card</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 uppercase font-black tracking-widest">ID NO</p>
                      <p className="text-4xl font-mono font-black" style={{ color: cardDesign.primaryColor }}>{ocId}</p>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-1 gap-12">
                    {/* Left: QR Code (Scanner) */}
                    <div className="w-1/4 flex flex-col items-center justify-center border-r-4 border-gray-100 pr-12">
                      <div className="bg-white p-5 rounded-[2rem] shadow-2xl border-2 border-blue-100">
                        <QRCodeSVG 
                          value={JSON.stringify({
                            id: ocId,
                            name: formData.displayName,
                            nameBn: formData.nameBengali,
                            blood: formData.bloodGroup,
                            link: profileUrl
                          })} 
                          size={180} 
                          level="H"
                          includeMargin={false}
                        />
                      </div>
                      <p className="text-sm mt-6 uppercase font-black tracking-widest" style={{ color: cardDesign.primaryColor }}>Scan for Profile</p>
                    </div>

                    {/* Center: Photo */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-56 h-72 rounded-[2rem] overflow-hidden shadow-2xl bg-gray-50 relative" style={{ border: `8px solid ${cardDesign.primaryColor}` }}>
                        {formData.photoURL ? (
                          <img 
                            src={formData.photoURL} 
                            alt="ID" 
                            className="w-full h-full object-cover" 
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <User className="w-32 h-32" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Details */}
                    <div className="flex-1 flex flex-col justify-between py-2 pl-8">
                      <div className="space-y-8">
                        <div className="space-y-2">
                          <p className="text-base uppercase font-black tracking-widest" style={{ color: cardDesign.secondaryColor }}>নাম: <span className="text-gray-900 font-bold text-2xl ml-3">{formData.nameBengali}</span></p>
                          <p className="text-5xl font-black leading-none tracking-tight" style={{ color: cardDesign.primaryColor, fontFamily: cardDesign.titleFont }}>Name: {formData.displayName}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                          <div>
                            <p className="text-gray-500 text-xs uppercase font-black tracking-widest">পিতা</p>
                            <p className="text-gray-900 font-bold text-lg truncate">{formData.fatherName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase font-black tracking-widest">মাতা</p>
                            <p className="text-gray-900 font-bold text-lg truncate">{formData.motherName}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase font-black tracking-widest">Date of Birth</p>
                            <p className="text-gray-900 font-black text-xl">{formData.dob}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase font-black tracking-widest">Sex</p>
                            <p className="text-gray-900 font-bold text-lg">{formData.sex}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase font-black tracking-widest">Blood Group</p>
                            <p className="text-red-600 font-black text-xl flex items-center gap-2">
                              <Droplets className="w-5 h-5 fill-current" /> {formData.bloodGroup}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase font-black tracking-widest">Occupation</p>
                            <p className="text-gray-900 font-bold text-lg">{formData.occupation}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase font-black tracking-widest">NID Number</p>
                            <p className="text-gray-900 font-bold text-lg">{formData.nidNumber}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xs uppercase font-black tracking-widest">Phone</p>
                            <p className="text-gray-900 font-bold text-lg">{formData.phone}</p>
                          </div>
                        </div>

                        <div>
                          <p className="text-gray-500 text-xs uppercase font-black tracking-widest mb-2">ঠিকানা</p>
                          <p className="text-gray-800 text-sm font-bold leading-relaxed">
                            {formData.address.house}, {formData.address.village}, {formData.address.postOffice}, {formData.address.upazila}, {formData.address.district}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-end pt-8 border-t-4 border-gray-50">
                        <div className="space-y-2">
                          <p className="text-gray-500 text-xs uppercase font-black tracking-widest">জন্মস্থান: <span className="text-gray-900 font-bold">{formData.birthPlace}</span></p>
                          <p className="text-gray-500 text-xs uppercase font-black tracking-widest">প্রদানের তারিখ: <span className="text-gray-900 font-bold">{formData.issueDate}</span></p>
                        </div>
                        <div className="text-center">
                          <div className="w-56 h-20 border-b-4 border-gray-200 mb-2 flex items-center justify-center bg-gray-50 rounded-t-2xl">
                            {formData.signatureURL ? (
                              <img src={formData.signatureURL} alt="Signature" className="max-h-full max-w-full object-contain" />
                            ) : (
                              <span className="italic text-sm text-gray-300">Signature</span>
                            )}
                          </div>
                          <p className="text-xs font-black uppercase tracking-widest" style={{ color: cardDesign.primaryColor }}>প্রদানকারী কর্তৃপক্ষ</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Modern Accents */}
                <div className="absolute top-0 left-0 w-full h-4" style={{ background: `linear-gradient(to right, ${cardDesign.primaryColor}, ${cardDesign.secondaryColor}, ${cardDesign.primaryColor})` }}></div>
              </div>
            </motion.div>
            </div>

            {/* Back Card */}
            {isOwnProfile && (
              <div className={`w-full overflow-x-auto pb-4 custom-scrollbar ${showBack ? 'block' : 'absolute top-0 left-0 opacity-0 pointer-events-none z-[-1]'}`}>
                <motion.div
                  key="back"
                  initial={{ opacity: 0, rotateY: 90 }}
                  animate={{ opacity: 1, rotateY: 0 }}
                  className="relative min-w-[1000px] mx-auto"
                  ref={backCardRef}
                >
                <div 
                  className="shadow-2xl relative overflow-hidden aspect-[1.6/1] text-gray-900"
                style={{
                  backgroundColor: cardDesign.backgroundColor,
                  borderRadius: cardDesign.borderRadius,
                  border: `${cardDesign.borderWidth} solid ${cardDesign.borderColor}`,
                  fontFamily: cardDesign.bodyFont
                }}
              >
                {/* Background Logo */}
                <div 
                  className="absolute inset-0 opacity-[0.05] pointer-events-none flex items-center justify-center overflow-hidden"
                >
                  {cardDesign.backgroundImage && (
                    <img 
                      src={cardDesign.backgroundImage} 
                      alt="" 
                      className="w-[60%] h-auto object-contain"
                      crossOrigin="anonymous"
                    />
                  )}
                </div>

                <div className="relative z-10 h-full flex flex-col p-12">
                  <div className="flex justify-between items-start mb-12">
                    <div className="space-y-6">
                      <h3 className="text-4xl font-black uppercase tracking-tighter" style={{ color: cardDesign.primaryColor }}>Account Credentials</h3>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                          <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Email Address</p>
                          <p className="text-xl font-bold text-gray-900">{user?.email}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                          <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Account Key (OC-ID)</p>
                          <p className="text-xl font-mono font-bold text-brand-blue">{ocId}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                          <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">Security Password</p>
                          <p className="text-xl font-bold text-gray-900">********</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-6">
                      <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl border-4 border-blue-50">
                        <QRCodeSVG 
                          value="01869657287" 
                          size={220} 
                          level="H"
                        />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black uppercase tracking-widest mb-1" style={{ color: cardDesign.primaryColor }}>bKash Deposit Number</p>
                        <p className="text-3xl font-black text-gray-900">01869657287</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t-4 border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl" style={{ backgroundColor: cardDesign.primaryColor }}>
                        <ShieldCheck className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase tracking-widest" style={{ color: cardDesign.primaryColor }}>Verified Ecosystem Member</p>
                        <p className="text-xs text-gray-500">This card is property of OCSTHAEL Ecosystem. If found, please return to nearest office.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-black tracking-widest">Lenden Scanner</p>
                        <p className="text-sm font-bold text-gray-700">Scan to Verify Transaction</p>
                      </div>
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                        <QrCode className="w-10 h-10 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-0 left-0 w-full h-4" style={{ background: `linear-gradient(to right, ${cardDesign.secondaryColor}, ${cardDesign.primaryColor}, ${cardDesign.secondaryColor})` }}></div>
              </div>
            </motion.div>
            </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
            <button
              onClick={() => downloadIdCard('png')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-3 px-8 py-5 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl text-lg disabled:opacity-50"
              style={{ background: `linear-gradient(to right, ${cardDesign.primaryColor}, ${cardDesign.secondaryColor})` }}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <ImageIcon className="w-6 h-6" />}
              Download PNG
            </button>
            <button
              onClick={() => downloadIdCard('pdf')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-3 px-8 py-5 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl text-lg disabled:opacity-50"
              style={{ background: `linear-gradient(to right, #ef4444, #b91c1c)` }}
            >
              {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileText className="w-6 h-6" />}
              Download PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Wallet & Stats */}
          <div className="space-y-8">
            {isOwnProfile && (
              <>
                {/* Wallet Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0a0f19] rounded-2xl p-6 border border-gray-800"
                >
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

                  <button
                    onClick={() => navigate('/withdraw')}
                    className="w-full py-3 bg-brand-blue/10 text-brand-blue rounded-xl font-bold hover:bg-brand-blue/20 transition-all flex items-center justify-center"
                  >
                    Withdraw Funds <ArrowUpRight className="w-4 h-4 ml-2" />
                  </button>
                </motion.div>

                {/* Deposit Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0a0f19] rounded-2xl p-6 border border-gray-800"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-green-500" /> Deposit Money
                    </h2>
                  </div>
                  
                  <form onSubmit={handleDeposit} className="space-y-4">
                    <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 mb-4 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-blue-400 font-bold uppercase mb-1">bKash Personal</p>
                        <p className="text-lg font-bold text-white">01869657287</p>
                        <p className="text-[10px] text-gray-400 mt-1">Send money to this number and enter TxID below.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => copyToClipboard('01869657287')}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                      >
                        Copy
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Amount (TK)</label>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={depositForm.amount}
                        onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                        className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Transaction ID (TxID)</label>
                      <input
                        type="text"
                        placeholder="Enter bKash TxID"
                        value={depositForm.txid}
                        onChange={(e) => setDepositForm({ ...depositForm, txid: e.target.value })}
                        className="w-full bg-[#111827] border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-blue font-mono"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={depositing}
                      className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      {depositing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Deposit'}
                    </button>
                  </form>
                </motion.div>

                {/* Chat Link */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0a0f19] rounded-2xl p-6 border border-gray-800"
                >
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-brand-pink" /> Communication
                  </h2>
                  <p className="text-sm text-gray-400 mb-6">Chat with other users and join groups in the ecosystem.</p>
                  <Link
                    to="/chat"
                    className="w-full py-3 bg-brand-pink/10 text-brand-pink rounded-xl font-bold hover:bg-brand-pink/20 transition-all flex items-center justify-center"
                  >
                    Open Chat Center <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </motion.div>
              </>
            )}

            {!isOwnProfile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0f19] rounded-2xl p-6 border border-gray-800 text-center"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-gray-800">
                  {formData.photoURL ? (
                    <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-600">
                      <User className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-1">{formData.displayName}</h3>
                <p className="text-brand-blue font-mono text-sm mb-4">{ocId}</p>
                <div className="flex justify-center gap-2">
                  <Link
                    to={`/chat?user=${ocId}`}
                    className="px-6 py-2 bg-brand-blue text-white rounded-lg font-bold hover:bg-blue-600 transition-all flex items-center"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" /> Chat with User
                  </Link>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column: Profile Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-[#0a0f19] rounded-2xl border border-gray-800 overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center">
                  <ShieldCheck className="w-6 h-6 mr-2 text-brand-blue" /> 
                  {isOwnProfile ? 'Profile Settings' : 'User Information'}
                </h2>
                {isOwnProfile ? (
                  <div className="flex items-center text-xs text-brand-mango bg-brand-mango/10 px-3 py-1 rounded-full border border-brand-mango/20">
                    <Info className="w-3 h-3 mr-1" /> Some fields are locked
                  </div>
                ) : (
                  <div className="flex items-center text-xs text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full border border-brand-blue/20">
                    <User className="w-3 h-3 mr-1" /> Public Profile
                  </div>
                )}
              </div>

              {/* Bio Section for Public View */}
              {!isOwnProfile && formData.bio && (
                <div className="mb-8 p-6 bg-[#111827] rounded-2xl border border-gray-800 italic text-gray-300">
                  <p className="text-sm font-bold text-brand-blue uppercase mb-2 not-italic">About Me</p>
                  "{formData.bio}"
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Profile Picture */}
                {isOwnProfile && (
                  <div className="flex flex-col sm:flex-row items-center gap-8 bg-[#111827] p-6 rounded-2xl border border-gray-800">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-2 border-brand-blue relative flex-shrink-0">
                      {formData.photoURL ? (
                        <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <User className="w-10 h-10" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow w-full">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Change Profile Photo</label>
                      <ImageUpload
                        value={formData.photoURL}
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                )}

                {/* Signature Upload */}
                {isOwnProfile && (
                  <div className="flex flex-col sm:flex-row items-center gap-8 bg-[#111827] p-6 rounded-2xl border border-gray-800">
                    <div className="w-32 h-16 bg-white/10 border border-gray-700 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                      {formData.signatureURL ? (
                        <img src={formData.signatureURL} alt="Signature" className="max-h-full max-w-full object-contain invert brightness-200" />
                      ) : (
                        <span className="text-xs text-gray-500 italic">No Signature</span>
                      )}
                    </div>
                    <div className="flex-grow w-full">
                      <label className="block text-sm font-medium text-gray-400 mb-2">Digital Signature (Upload Image)</label>
                      <ImageUpload
                        value={formData.signatureURL}
                        onChange={(url) => setFormData({ ...formData, signatureURL: url })}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Read-only Identity Fields */}
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-900/50 rounded-2xl border border-gray-800">
                    <div className="md:col-span-2 mb-2">
                      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Identity Information (Locked)</h4>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Full Name (English)</label>
                      <input
                        type="text"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleInputChange}
                        disabled={!isOwnProfile}
                        className={`w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-brand-blue ${!isOwnProfile && 'cursor-not-allowed opacity-70'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Sex</label>
                      <input
                        type="text"
                        value={formData.sex}
                        disabled
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth</label>
                      <input
                        type="text"
                        value={formData.dob}
                        disabled
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Blood Group</label>
                      <input
                        type="text"
                        value={formData.bloodGroup}
                        disabled
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400 cursor-not-allowed"
                      />
                    </div>
                    {!isOwnProfile && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                        <div className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-gray-400">
                          {formData.address.house}, {formData.address.village}, {formData.address.postOffice}, {formData.address.upazila}, {formData.address.district}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Editable Fields */}
                  <div className="md:col-span-2 mb-2 mt-4">
                    <h4 className="text-sm font-bold text-brand-blue uppercase tracking-wider">Contact & Professional</h4>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!isOwnProfile}
                      className={`w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-brand-blue ${!isOwnProfile && 'cursor-not-allowed opacity-70'}`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Occupation</label>
                    <input
                      type="text"
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      disabled={!isOwnProfile}
                      placeholder="e.g. Student, Engineer"
                      className={`w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-brand-blue ${!isOwnProfile && 'cursor-not-allowed opacity-70'}`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Bio / About Me</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!isOwnProfile}
                      rows={4}
                      className={`w-full px-4 py-3 bg-[#111827] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-brand-blue resize-none ${!isOwnProfile && 'cursor-not-allowed opacity-70'}`}
                    />
                  </div>
                </div>

                {isOwnProfile && (
                  <div className="pt-6 border-t border-gray-800 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-8 py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center disabled:opacity-50 shadow-lg shadow-brand-blue/20"
                    >
                      {saving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" /> Save Profile
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
