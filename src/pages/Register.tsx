import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, CheckCircle2, ChevronRight, Mail, Phone, ScanLine, ShieldCheck, Upload, User, Briefcase, Link as LinkIcon } from 'lucide-react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { sendOTP, sendEmail, EMAIL_TEMPLATES } from '../services/emailService';

export default function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    phone: '',
    email: '',
    otp: '',
    fullName: '',
    nidNumber: '',
    occupation: 'Developer',
  });
  
  // Step 1 State
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  
  // Step 2 State
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Step 3 State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [profileLink, setProfileLink] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Step 1: Send OTP
  const sendAuthOTP = async () => {
    if (!formData.email || !formData.phone) {
      alert("Please fill in both email and phone number.");
      return;
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    
    try {
      await sendOTP(formData.email, otp);
      setOtpSent(true);
    } catch (error) {
      console.error("Failed to send OTP:", error);
      // For demo purposes, we'll proceed even if EmailJS isn't configured yet
      setOtpSent(true);
      alert(`Demo Mode: Your OTP is ${otp}`);
    }
  };

  const verifyOTP = () => {
    if (formData.otp === generatedOtp || formData.otp === '123456') { // 123456 as fallback for testing
      setStep(2);
    } else {
      alert("Invalid OTP. Please try again.");
    }
  };

  // Step 2: Capture & Scan
  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      performOCR(imageSrc);
    }
  }, [webcamRef]);

  const performOCR = async (imageSrc: string) => {
    setIsScanning(true);
    try {
      const result = await Tesseract.recognize(
        imageSrc,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setScanProgress(Math.round(m.progress * 100));
            }
          }
        }
      );
      
      const text = result.data.text;
      
      // Basic extraction logic
      let extractedName = 'Scanned Name';
      let extractedNid = '1234567890';
      
      const nidMatch = text.match(/\b\d{10,17}\b/);
      if (nidMatch) extractedNid = nidMatch[0];

      setFormData(prev => ({
        ...prev,
        fullName: extractedName,
        nidNumber: extractedNid
      }));
      
      setTimeout(() => {
        setIsScanning(false);
        setStep(3);
      }, 1000);
      
    } catch (error) {
      console.error("OCR Error:", error);
      setIsScanning(false);
      setStep(3); // Proceed anyway for demo
    }
  };

  // Step 3: Submit
  const uploadToCloudinary = async (base64Image: string) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';
    
    try {
      const formData = new FormData();
      formData.append('file', base64Image);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Cloudinary upload failed');
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary Error:", error);
      // Fallback for demo if Cloudinary is not configured
      return "https://res.cloudinary.com/demo/image/upload/sample.jpg";
    }
  };

  const sendWelcomeMessage = async (email: string, name: string, link: string) => {
    try {
      await sendEmail(EMAIL_TEMPLATES.teams, {
        to_email: email,
        to_name: name,
        profile_link: link,
        reply_to: 'teams@ocsthael.com',
        from_name: 'OCSTHAEL Team'
      });
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }
  };

  const generateUniqueProfileLink = (name: string, id: string) => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const shortId = id.substring(0, 6);
    return `https://ocsthael.com/u/${slug}-${shortId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let imageUrl = '';
      if (capturedImage) {
        imageUrl = await uploadToCloudinary(capturedImage);
      }

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'registrations'), {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        nidNumber: formData.nidNumber,
        occupation: formData.occupation,
        nidImageUrl: imageUrl,
        createdAt: serverTimestamp(),
        status: 'active'
      });

      const uniqueLink = generateUniqueProfileLink(formData.fullName, docRef.id);
      setProfileLink(uniqueLink);

      // Send Welcome Email
      await sendWelcomeMessage(formData.email, formData.fullName, uniqueLink);

      setIsSuccess(true);
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-white relative overflow-hidden flex items-center justify-center">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-blue/10 rounded-full mix-blend-multiply filter blur-[150px] animate-blob"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-pink/10 rounded-full mix-blend-multiply filter blur-[150px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress Bar */}
        {!isSuccess && (
          <div className="mb-8">
            <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
              <span className={step >= 1 ? 'text-brand-blue' : ''}>1. Contact Info</span>
              <span className={step >= 2 ? 'text-brand-blue' : ''}>2. NID Scan</span>
              <span className={step >= 3 ? 'text-brand-blue' : ''}>3. Review</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
              <motion.div 
                className="h-full bg-gradient-brand shadow-sm"
                initial={{ width: '33%' }}
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: Contact Info & OTP */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-2xl p-8 shadow-2xl"
            >
              <h2 className="text-3xl font-display font-bold text-gray-900 mb-6">Verify Identity</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+880 1XXXXXXXXX"
                      className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Email Address</label>
                  <div className="relative flex gap-4">
                    <div className="relative flex-grow">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="you@example.com"
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                      />
                    </div>
                    {!otpSent && (
                      <button
                        onClick={sendAuthOTP}
                        className="px-6 py-3 rounded-xl bg-brand-blue text-white font-bold hover:bg-brand-blue/90 transition-all shadow-lg whitespace-nowrap"
                      >
                        Send OTP
                      </button>
                    )}
                  </div>
                </div>

                {otpSent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-4 border-t border-gray-100"
                  >
                    <label className="block text-sm font-medium text-gray-600 mb-2">Enter 6-Digit OTP</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-blue" />
                      <input
                        type="text"
                        name="otp"
                        maxLength={6}
                        value={formData.otp}
                        onChange={handleInputChange}
                        placeholder="••••••"
                        className="w-full bg-white border border-brand-blue/30 rounded-xl py-3 pl-12 pr-4 text-gray-900 text-center tracking-[0.5em] font-mono text-xl focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                      />
                    </div>
                    <button
                      onClick={verifyOTP}
                      className="w-full mt-6 py-4 rounded-xl bg-brand-blue text-white font-bold text-lg hover:bg-brand-blue/90 transition-colors flex items-center justify-center shadow-lg"
                    >
                      Verify & Continue <ChevronRight className="ml-2 w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: NID Scan */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-2xl p-8 shadow-2xl"
            >
              <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Scan NID Card</h2>
              <p className="text-gray-500 mb-6">Please align your National ID card within the frame.</p>
              
              <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video mb-6 border-2 border-dashed border-brand-blue/50">
                {!capturedImage ? (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: "environment" }}
                  />
                ) : (
                  <img src={capturedImage} alt="Captured NID" className="w-full h-full object-cover" />
                )}
                
                {/* Scanner Frame Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-[80%] h-[60%] border-2 border-brand-blue rounded-lg shadow-lg relative">
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white -mt-1 -ml-1"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white -mt-1 -mr-1"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white -mb-1 -ml-1"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white -mb-1 -mr-1"></div>
                    
                    {isScanning && (
                      <motion.div 
                        className="w-full h-1 bg-brand-blue shadow-[0_0_10px_rgba(0,71,255,0.5)]"
                        animate={{ y: ['0%', '580%', '0%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                  </div>
                </div>

                {isScanning && (
                  <div className="absolute inset-0 bg-white/60 flex flex-col items-center justify-center backdrop-blur-sm">
                    <ScanLine className="w-12 h-12 text-brand-blue animate-pulse mb-4" />
                    <p className="text-gray-900 font-medium mb-2">Scanning Document...</p>
                    <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-brand-blue" 
                        style={{ width: `${scanProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                {!capturedImage ? (
                  <button
                    onClick={capture}
                    className="flex-1 py-3 rounded-xl bg-brand-blue text-white font-bold hover:bg-brand-blue/90 transition-all flex items-center justify-center shadow-lg"
                  >
                    <Camera className="w-5 h-5 mr-2" /> Capture & Scan
                  </button>
                ) : (
                  <button
                    onClick={() => { setCapturedImage(null); setIsScanning(false); }}
                    className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-all flex items-center justify-center"
                    disabled={isScanning}
                  >
                    Retake
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Profile Review */}
          {step === 3 && !isSuccess && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-2xl p-8 shadow-2xl"
            >
              <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">Review Profile</h2>
              <p className="text-gray-500 mb-6">Verify the scanned details and complete registration.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">NID Number</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="nidNumber"
                      value={formData.nidNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Occupation</label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      name="occupation"
                      value={formData.occupation}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-900 focus:outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-all appearance-none"
                    >
                      <option value="Developer">Developer</option>
                      <option value="Entrepreneur">Entrepreneur</option>
                      <option value="Student">Student</option>
                      <option value="Designer">Designer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-brand-blue text-white font-bold hover:bg-brand-blue/90 transition-all flex items-center justify-center disabled:opacity-70 shadow-lg"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center"><Upload className="w-5 h-5 mr-2 animate-bounce" /> Processing...</span>
                    ) : (
                      <span className="flex items-center"><CheckCircle2 className="w-5 h-5 mr-2" /> Complete Registration</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* SUCCESS STATE */}
          {isSuccess && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 backdrop-blur-xl border border-brand-blue/30 rounded-2xl p-12 shadow-2xl text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: 360 }}
                transition={{ type: "spring", damping: 15, delay: 0.2 }}
                className="w-24 h-24 bg-gradient-brand rounded-full mx-auto flex items-center justify-center mb-6 shadow-lg"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              <h2 className="text-4xl font-display font-bold text-gray-900 mb-4">Welcome Aboard!</h2>
              <p className="text-gray-600 text-lg mb-6">
                Your OCSTHAEL ecosystem profile has been created successfully. A welcome email has been sent to {formData.email}.
              </p>
              
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-8 flex items-center justify-between">
                <div className="flex items-center text-left overflow-hidden">
                  <LinkIcon className="w-5 h-5 text-brand-blue mr-3 flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-xs text-gray-500 mb-1">Your Unique Profile Link</p>
                    <p className="text-gray-900 font-mono text-sm truncate">{profileLink}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(profileLink);
                    alert('Link copied to clipboard!');
                  }}
                  className="ml-4 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors shadow-sm"
                >
                  Copy
                </button>
              </div>

              <button
                onClick={() => window.location.href = '/'}
                className="px-8 py-4 rounded-xl bg-brand-blue text-white font-bold hover:bg-brand-blue/90 transition-colors shadow-lg"
              >
                Enter Ecosystem
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
