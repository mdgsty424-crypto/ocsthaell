import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Youtube, Facebook, Image as ImageIcon, MousePointer2, ChevronDown, Users, TrendingUp, Globe, Hexagon, Layers, Zap, Shield, Code, Smartphone, Cloud, Calendar, Target, Eye, ShieldCheck, DollarSign, Briefcase, MessageSquare, ShoppingCart, BookOpen, Music, Video, Map, Bot, Mail, MapPin, Send, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, limit, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function Home() {
  const [apps, setApps] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [heroBanners, setHeroBanners] = useState<any[]>([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [heroBackground, setHeroBackground] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [contactStatus, setContactStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const isVideoUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg)$/i) || url.includes('video');
  };

  const getServiceIcon = (name: string) => {
    const icons: any = { Layers, Zap, Shield, Code, Smartphone, Globe, Cloud };
    const Icon = icons[name] || Hexagon;
    return <Icon className="w-10 h-10 text-brand-blue" />;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('sending');
    setTimeout(() => {
      setContactStatus('success');
      setTimeout(() => setContactStatus('idle'), 3000);
    }, 1500);
  };

  useEffect(() => {
    const appsUnsubscribe = onSnapshot(collection(db, 'apps'), (snapshot) => {
      const appsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApps(appsData.slice(0, 3));
    });

    const teamUnsubscribe = onSnapshot(collection(db, 'team'), (snapshot) => {
      const teamData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const executiveData = teamData
        .filter((m: any) => m.type === 'Executive')
        .slice(0, 3);
      const staffData = teamData
        .filter((m: any) => m.type === 'General')
        .slice(0, 5);
      setTeam(executiveData);
      setStaff(staffData);
    });

    const membersUnsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const membersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const registeredMembers = membersData
        .filter((m: any) => m.role === 'user')
        .slice(0, 5);
      setMembers(registeredMembers);
    });

    const servicesUnsubscribe = onSnapshot(collection(db, 'services'), (snapshot) => {
      const servicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setServices(servicesData.slice(0, 3));
    });

    const newsUnsubscribe = onSnapshot(collection(db, 'news'), (snapshot) => {
      const newsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNews(newsData.slice(0, 3));
    });

    const galleryUnsubscribe = onSnapshot(collection(db, 'gallery'), (snapshot) => {
      const galleryData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGallery(galleryData.slice(0, 6));
    });

    const bannersUnsubscribe = onSnapshot(query(collection(db, 'banners'), where('active', '==', true)), (snapshot) => {
      const bannersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBanners(bannersData.sort((a: any, b: any) => a.order - b.order));
    });

    const adsUnsubscribe = onSnapshot(query(collection(db, 'ads'), where('active', '==', true)), (snapshot) => {
      const adsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAds(adsData);
    });

    const heroBannersUnsubscribe = onSnapshot(query(collection(db, 'heroBanners'), where('active', '==', true)), (snapshot) => {
      const heroBannersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHeroBanners(heroBannersData.sort((a: any, b: any) => a.order - b.order));
    });
    
    const heroBackgroundUnsubscribe = onSnapshot(collection(db, 'heroBackground'), (snapshot) => {
      if (!snapshot.empty) {
        setHeroBackground({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setHeroBackground(null);
      }
    });

    return () => {
      appsUnsubscribe();
      teamUnsubscribe();
      membersUnsubscribe();
      servicesUnsubscribe();
      newsUnsubscribe();
      galleryUnsubscribe();
      bannersUnsubscribe();
      adsUnsubscribe();
      heroBannersUnsubscribe();
      heroBackgroundUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (heroBanners.length > 1) {
      const interval = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % heroBanners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [heroBanners]);

  return (
    <div className="bg-white text-gray-900 min-h-screen relative">
      {/* Hero Background Video */}
      {heroBackground && (heroBackground.mediaType === 'video' || isVideoUrl(heroBackground.mediaUrl)) && heroBackground.active && (
        <div className="absolute inset-0 w-full h-screen overflow-hidden z-0">
          <video
            src={heroBackground.mediaUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]"></div>
        </div>
      )}
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-6xl md:text-8xl font-display font-black mb-8 leading-[1.1] tracking-tight text-gray-900">
                Building a <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-pink to-brand-mango">New Bangladesh</span>
              </h1>
              <p className="text-xl text-gray-600 mb-12 max-w-xl leading-relaxed font-medium">
                Empowering your digital future through a unified ecosystem. We connect communication, social networking, and online income in one seamless experience.
              </p>
              
              {/* Circular Action Buttons */}
              <div className="flex flex-wrap gap-8 mb-12">
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="flex flex-col items-center gap-3 group cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-full border-2 border-brand-blue/50 flex items-center justify-center group-hover:border-brand-blue group-hover:bg-brand-blue/10 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                    <Users className="w-8 h-8 text-brand-blue" />
                  </div>
                  <span className="text-xs font-bold text-brand-blue uppercase tracking-widest">Leadership</span>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="flex flex-col items-center gap-3 group cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-full border-2 border-brand-pink/50 flex items-center justify-center group-hover:border-brand-pink group-hover:bg-brand-pink/10 transition-all shadow-[0_0_20px_rgba(236,72,153,0.2)]">
                    <TrendingUp className="w-8 h-8 text-brand-pink" />
                  </div>
                  <span className="text-xs font-bold text-brand-pink uppercase tracking-widest">Traction</span>
                </motion.div>
                
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="flex flex-col items-center gap-3 group cursor-pointer"
                >
                  <div className="w-20 h-20 rounded-full border-2 border-brand-mango/50 flex items-center justify-center group-hover:border-brand-mango group-hover:bg-brand-mango/10 transition-all shadow-[0_0_20px_rgba(255,190,0,0.2)]">
                    <Globe className="w-8 h-8 text-brand-mango" />
                  </div>
                  <span className="text-xs font-bold text-brand-mango uppercase tracking-widest">Other</span>
                </motion.div>
              </div>

              <div className="flex flex-wrap gap-6">
                <Link to="/services" className="px-10 py-5 bg-gradient-to-r from-brand-blue to-brand-pink text-white font-bold rounded-2xl hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all hover:-translate-y-1">
                  Our Services
                </Link>
                <a href="https://oc-registration.netlify.app" target="_blank" rel="noopener noreferrer" className="px-10 py-5 border-2 border-brand-mango/50 text-brand-mango font-bold rounded-2xl hover:bg-brand-mango/10 transition-all hover:-translate-y-1">
                  Get Started
                </a>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/20 via-brand-pink/20 to-brand-mango/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="relative z-10 rounded-[3rem] overflow-hidden border border-gray-100 shadow-2xl backdrop-blur-sm bg-white/50 aspect-[4/3]">
                <AnimatePresence mode="wait">
                  {heroBanners.length > 0 && (heroBanners[currentHeroIndex]?.mediaType === 'video' || isVideoUrl(heroBanners[currentHeroIndex]?.mediaUrl || heroBanners[currentHeroIndex]?.imageUrl)) ? (
                    <motion.video
                      key={heroBanners[currentHeroIndex]?.id}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      src={heroBanners[currentHeroIndex]?.mediaUrl || heroBanners[currentHeroIndex]?.imageUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <motion.img 
                      key={heroBanners.length > 0 ? heroBanners[currentHeroIndex]?.id : 'default'}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      src={heroBanners.length > 0 ? (heroBanners[currentHeroIndex]?.mediaUrl || heroBanners[currentHeroIndex]?.imageUrl) : "https://i.postimg.cc/05ZcC2b1/14.jpg"} 
                      alt="Hero Banner" 
                      className="absolute inset-0 w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </AnimatePresence>
                
                {/* Banner Navigation Dots */}
                {heroBanners.length > 1 && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {heroBanners.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentHeroIndex(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          idx === currentHeroIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {/* Floating Badge */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-10 -left-10 bg-white/90 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 flex items-center gap-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 flex items-center justify-center">
                  <MousePointer2 className="w-8 h-8 text-brand-blue" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Innovation</p>
                  <p className="text-2xl font-black text-gray-900">Next Gen UI</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Down Animation */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="w-6 h-10 border-2 border-gray-900 rounded-full flex justify-center p-1">
            <motion.div 
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-gray-900 rounded-full"
            />
          </div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-gray-900">Scroll Down</span>
        </div>
      </section>

      {/* Banners Section */}
      {banners.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <a 
                  key={banner.id} 
                  href={banner.link || '#'} 
                  target={banner.link ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="block relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all group"
                >
                  <div className="aspect-[21/9] md:aspect-video w-full relative">
                    {banner.mediaType === 'video' || isVideoUrl(banner.mediaUrl || banner.imageUrl) ? (
                      <video 
                        src={banner.mediaUrl || banner.imageUrl} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        autoPlay 
                        muted 
                        loop 
                        playsInline
                      />
                    ) : (
                      <img 
                        src={banner.mediaUrl || banner.imageUrl} 
                        alt={banner.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                    <h3 className="text-white font-bold text-xl mb-1">{banner.title}</h3>
                    {banner.description && <p className="text-gray-300 text-sm line-clamp-2">{banner.description}</p>}
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Ads Section (Marquee) */}
      {ads.length > 0 && (
        <div className="bg-brand-blue/10 py-4 overflow-hidden border-y border-brand-blue/20">
          <div className="flex whitespace-nowrap animate-marquee">
            {[...ads, ...ads, ...ads].map((ad, idx) => (
              <a 
                key={`${ad.id}-${idx}`} 
                href={ad.link || '#'} 
                target={ad.link ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className="inline-flex items-center mx-8 text-gray-800 hover:text-brand-blue transition-colors"
              >
                {ad.imageUrl && (
                  <img src={ad.imageUrl} alt={ad.title} className="h-8 w-auto mr-3 rounded" referrerPolicy="no-referrer" />
                )}
                <span className="font-bold">{ad.title}</span>
                {ad.description && <span className="ml-2 text-gray-500 text-sm">- {ad.description}</span>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* About Us Section */}
      <section className="py-32 bg-transparent relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <Link to="/about">
              <h2 className="text-5xl md:text-6xl font-display font-bold mb-6 text-brand-blue hover:text-brand-pink transition-colors inline-block">About <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-pink to-brand-mango">OCSTHAEL</span></h2>
            </Link>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto font-light leading-relaxed">
              OCSTHAEL একটি উদ্ভাবনী প্রযুক্তি ভিত্তিক উদ্যোগ যার লক্ষ্য হলো একটি শক্তিশালী ডিজিটাল ইকোসিস্টেম তৈরি করা যেখানে যোগাযোগ, সামাজিক যোগাযোগ, অনলাইন আয়, ইন্টারনেট ব্যবহার এবং ই-কমার্স সবকিছু একসাথে একটি প্ল্যাটফর্মে সংযুক্ত থাকবে।
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {[
              { title: 'Our Mission', icon: Target, color: 'text-brand-blue', desc: 'মানুষের জন্য সহজ, নিরাপদ এবং কার্যকর ডিজিটাল সেবা তৈরি করা এবং একটি শক্তিশালী স্থানীয় ডিজিটাল ইকোসিস্টেম গড়ে তোলা।' },
              { title: 'Our Vision', icon: Eye, color: 'text-brand-pink', desc: 'একটি সমন্বিত ডিজিটাল প্ল্যাটফর্ম তৈরি করা যেখানে যোগাযোগ, ব্যবসা, প্রযুক্তি এবং অর্থনৈতিক সুযোগ একসাথে কাজ করবে।' },
              { title: 'Our Goal', icon: Zap, color: 'text-brand-mango', desc: 'মানুষের জন্য নতুন অনলাইন সুযোগ তৈরি করা এবং প্রযুক্তির মাধ্যমে ব্যবসা ও উদ্যোক্তাদের সহায়তা করা।' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 backdrop-blur-sm p-10 rounded-[2.5rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all group"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-blue transition-colors">
                  <item.icon className={`w-8 h-8 ${item.color} group-hover:text-white transition-colors`} />
                </div>
                <h3 className="text-2xl font-bold text-brand-blue mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="py-32 relative overflow-hidden bg-transparent text-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <Link to="/team">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-5xl md:text-6xl font-display font-bold mb-6 text-brand-blue hover:text-brand-pink transition-colors inline-block"
              >
                Our Team
              </motion.h2>
            </Link>
          </div>

          <div className="space-y-32">
            {team.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
              >
                <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                  <h3 className="text-5xl md:text-6xl font-display font-black mb-4 leading-[1.1] tracking-tight text-brand-blue">
                    {member.role}
                  </h3>
                  <p className="text-2xl font-bold text-brand-pink uppercase tracking-widest mb-8">
                    {member.name}
                  </p>
                  <p className="text-xl text-gray-600 mb-12 max-w-xl leading-relaxed font-medium">
                    {member.bio || "Leading with vision and integrity to build a brighter digital future for Bangladesh."}
                  </p>
                  
                  <div className="flex flex-wrap gap-8 mb-12">
                    {[
                      { icon: Users, label: 'Leadership', color: 'text-brand-blue', border: 'border-brand-blue/20' },
                      { icon: TrendingUp, label: 'Traction', color: 'text-brand-pink', border: 'border-brand-pink/20' },
                      { icon: Globe, label: 'Global', color: 'text-brand-mango', border: 'border-brand-mango/20' }
                    ].map((btn, i) => (
                      <div key={i} className="flex flex-col items-center gap-3">
                        <div className={`w-20 h-20 rounded-full border-2 ${btn.border} flex items-center justify-center shadow-sm bg-white/50`}>
                          <btn.icon className={`w-8 h-8 ${btn.color}`} />
                        </div>
                        <span className={`text-xs font-bold ${btn.color} uppercase tracking-widest`}>{btn.label}</span>
                      </div>
                    ))}
                  </div>

                  <Link to={`/team/${member.id}`} className="px-10 py-5 bg-gradient-to-r from-brand-blue to-brand-pink text-white font-bold rounded-2xl hover:shadow-xl transition-all hover:-translate-y-1 inline-flex items-center">
                    More Details <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </div>

                <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                  <div className="relative">
                    <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-2xl aspect-[4/5] border-8 border-white">
                      <img 
                        src={member.imageUrl || member.image} 
                        alt={member.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <motion.div 
                      animate={{ y: [0, -20, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -bottom-10 -left-10 bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 flex items-center gap-6"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-brand-mango/10 flex items-center justify-center">
                        <Globe className="w-8 h-8 text-brand-mango" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Global</p>
                        <p className="text-2xl font-black text-gray-900">Strategy</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Staff Section */}
      {staff.length > 0 && (
        <section className="py-20 relative overflow-hidden bg-gray-50 text-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div className="max-w-2xl">
                <Link to="/staff">
                  <motion.h2 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-display font-bold mb-4 text-brand-blue hover:text-brand-pink transition-colors inline-block"
                  >
                    Our Staff
                  </motion.h2>
                </Link>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-gray-600"
                >
                  Meet the dedicated employees who drive OCSTHAEL forward every day.
                </motion.p>
              </div>
              <Link to="/staff" className="px-8 py-4 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl font-bold text-brand-blue hover:border-brand-pink hover:text-brand-pink transition-all shadow-sm">
                View All Staff
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
              {staff.map((member, index) => (
                <Link to={`/staff/${member.id}`} key={member.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="text-center group cursor-pointer"
                  >
                    <div className="relative mb-6 mx-auto w-32 h-32 sm:w-40 sm:h-40">
                      <div className="absolute inset-0 bg-gradient-brand rounded-full scale-105 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                      <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-all duration-500">
                        <img 
                          src={member.imageUrl || member.image || "https://picsum.photos/seed/user/200/200"} 
                          alt={member.name} 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-brand-pink transition-colors">{member.name}</h3>
                    <p className="text-xs font-bold text-brand-blue uppercase tracking-widest">{member.role}</p>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Registered Members Section */}
      {members.length > 0 && (
        <section className="py-20 relative overflow-hidden bg-white text-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
              <div className="max-w-2xl">
                <Link to="/members">
                  <motion.h2 
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-5xl font-display font-bold mb-4 text-brand-blue hover:text-brand-pink transition-colors inline-block"
                  >
                    Registered Members
                  </motion.h2>
                </Link>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-gray-600"
                >
                  Connect with our growing community of professionals and enthusiasts.
                </motion.p>
              </div>
              <Link to="/members" className="px-8 py-4 bg-gray-50 backdrop-blur-sm border border-gray-200 rounded-2xl font-bold text-brand-blue hover:border-brand-pink hover:text-brand-pink transition-all shadow-sm">
                View All Members
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
              {members.map((member, index) => (
                <Link to={`/members/${member.id}`} key={member.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="text-center group cursor-pointer"
                  >
                    <div className="relative mb-6 mx-auto w-32 h-32 sm:w-40 sm:h-40">
                      <div className="absolute inset-0 bg-gradient-brand rounded-full scale-105 opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                      <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:shadow-xl transition-all duration-500 bg-gray-100 flex items-center justify-center">
                        {member.photoURL || (member as any).imageUrl || (member as any).image || (member as any).profilePhoto || (member as any).avatar || (member as any).profilePicture || (member as any).memberPhoto ? (
                          <img 
                            src={member.photoURL || (member as any).imageUrl || (member as any).image || (member as any).profilePhoto || (member as any).avatar || (member as any).profilePicture || (member as any).memberPhoto} 
                            alt={member.displayName || (member as any).name || 'Member'} 
                            className="w-full h-full object-cover transition-all duration-700"
                            referrerPolicy="no-referrer"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <Users className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-brand-pink transition-colors">{member.displayName || (member as any).name || 'Anonymous User'}</h3>
                    {member.occupation && (
                      <p className="text-xs font-bold text-brand-blue uppercase tracking-widest">{member.occupation}</p>
                    )}
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Our Platforms Section */}
      <section className="py-32 bg-transparent relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <Link to="/apps">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="text-5xl font-display font-bold mb-6 text-brand-blue hover:text-brand-pink transition-colors inline-block"
                >
                  Our Platforms
                </motion.h2>
              </Link>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-600"
              >
                Discover the diverse range of digital solutions we've built to empower the people of Bangladesh.
              </motion.p>
            </div>
            <Link to="/apps" className="px-8 py-4 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl font-bold text-brand-blue hover:border-brand-pink hover:text-brand-pink transition-all shadow-sm">
              View All Apps
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {apps.map((app, index) => (
              <motion.div 
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="h-full bg-white/80 backdrop-blur-md border border-gray-100 rounded-[2.5rem] p-10 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col group relative overflow-hidden">
                  <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-8 overflow-hidden group-hover:bg-brand-blue group-hover:scale-110 transition-all duration-500 shadow-inner">
                    {app.iconUrl ? (
                      <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover group-hover:opacity-20 transition-opacity" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-gray-400 group-hover:text-white transition-colors" />
                    )}
                    <ImageIcon className="absolute w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-4 text-brand-blue group-hover:text-brand-pink transition-colors">{app.name}</h3>
                  <p className="text-gray-600 mb-8 line-clamp-3 flex-grow text-lg leading-relaxed">
                    {app.description || "A revolutionary platform designed to simplify digital interactions and create new opportunities."}
                  </p>
                  
                  <Link to={`/apps/${app.id}`} className="inline-flex items-center text-brand-blue font-bold text-lg group/link mt-auto">
                    Learn More 
                    <div className="ml-3 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover/link:bg-brand-blue group-hover/link:text-white transition-all">
                      <ArrowRight className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-32 bg-transparent text-gray-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <Link to="/services">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="text-5xl font-display font-bold mb-6 text-brand-blue hover:text-brand-pink transition-colors inline-block"
                >
                  Core Services
                </motion.h2>
              </Link>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-600"
              >
                Empowering businesses with next-generation technological solutions.
              </motion.p>
            </div>
            <Link to="/services" className="px-8 py-4 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-all shadow-sm">
              View All Services
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 bg-white/80 backdrop-blur-sm rounded-[2.5rem] border border-gray-100 shadow-lg hover:shadow-2xl transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-6 group-hover:bg-brand-blue transition-colors">
                  {getServiceIcon(service.iconName)}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-brand-blue">{service.title}</h3>
                <p className="text-gray-600 mb-6 line-clamp-3">{service.description}</p>
                <Link to={`/services/${service.id}`} className="text-brand-pink font-bold inline-flex items-center group/btn">
                  Learn More <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-32 bg-transparent relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <Link to="/news">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="text-5xl font-display font-bold mb-6 text-brand-blue hover:text-brand-pink transition-colors inline-block"
                >
                  Latest News
                </motion.h2>
              </Link>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-xl text-gray-600"
              >
                Stay updated with our latest announcements and technological breakthroughs.
              </motion.p>
            </div>
            <Link to="/news" className="px-8 py-4 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl font-bold text-brand-blue hover:text-brand-pink transition-all shadow-sm">
              Read All News
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.map((item, index) => (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white/80 backdrop-blur-sm border border-gray-100 rounded-[2.5rem] overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className="aspect-video overflow-hidden relative">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-4 left-6 flex items-center text-brand-blue text-xs font-bold uppercase tracking-widest bg-white/90 px-3 py-1 rounded-lg">
                    <Calendar className="w-3 h-3 mr-2" />
                    {formatDate(item.date)}
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-brand-blue mb-4 line-clamp-2 group-hover:text-brand-pink transition-colors">{item.title}</h3>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-3">{item.content}</p>
                  <Link to={`/news/${item.id}`} className="text-red-500 font-bold inline-flex items-center group/btn">
                    Read Full Article <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Our Gallery Section */}
      <section className="py-32 bg-transparent relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Link to="/gallery">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-5xl font-display font-bold mb-6 text-brand-blue hover:text-brand-pink transition-colors inline-block"
              >
                Our Gallery
              </motion.h2>
            </Link>
            <Link to="/gallery" className="inline-flex items-center px-8 py-4 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-2xl font-bold text-brand-blue hover:bg-brand-blue hover:text-white transition-all shadow-sm">
              View Full Gallery <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {gallery.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="aspect-square rounded-2xl overflow-hidden relative group cursor-pointer border border-gray-100 shadow-sm"
              >
                <img 
                  src={image.imageUrl} 
                  alt={image.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-brand-blue/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
                  <span className="text-white text-xs font-bold uppercase tracking-widest">{image.title}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-32 bg-transparent relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <Link to="/contact">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-5xl font-display font-bold mb-6 text-brand-blue hover:text-brand-pink transition-colors inline-block"
              >
                Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-pink to-brand-mango">Touch</span>
              </motion.h2>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-12"
            >
              <div className="space-y-8">
                {[
                  { icon: Mail, title: 'Email Us', text: 'contact@ocsthael.com', color: 'text-brand-blue' },
                  { icon: Phone, title: 'Call Us', text: '+880 1XXX XXXXXX', color: 'text-brand-pink' },
                  { icon: MapPin, title: 'Visit Us', text: 'Dhaka, Bangladesh', color: 'text-brand-mango' }
                ].map((item, i) => (
                  <div key={i} className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mr-6 shrink-0">
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div>
                      <h4 className="text-brand-blue font-bold mb-1">{item.title}</h4>
                      <p className="text-gray-600">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white/80 backdrop-blur-xl p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl relative overflow-hidden"
            >
              <h3 className="text-2xl font-bold text-brand-blue mb-8">Send a Message</h3>
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <input type="text" placeholder="First Name" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-blue transition-colors" />
                  <input type="text" placeholder="Last Name" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-blue transition-colors" />
                </div>
                <input type="email" placeholder="Email Address" required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-blue transition-colors" />
                <textarea placeholder="Message" rows={4} required className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-blue transition-colors resize-none"></textarea>
                <button
                  type="submit"
                  disabled={contactStatus === 'sending'}
                  className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center transition-all ${
                    contactStatus === 'success' ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-brand-blue to-brand-pink text-white hover:shadow-lg'
                  }`}
                >
                  {contactStatus === 'sending' ? 'Sending...' : contactStatus === 'success' ? 'Message Sent!' : 'Send Message'}
                </button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Experience the Ecosystem */}
      <section className="py-32 bg-transparent relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl font-display font-bold mb-6 text-brand-blue"
            >
              Experience the Ecosystem
            </motion.h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A seamless, unified interface designed for the modern user.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative mx-auto max-w-5xl"
          >
            {/* Browser Frame */}
            <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-[0_0_100px_rgba(59,130,246,0.15)] bg-white/80 backdrop-blur-sm">
              {/* Browser Header */}
              <div className="bg-gray-50 border-b border-gray-100 px-6 py-4 flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                </div>
                <div className="flex-grow mx-4">
                  <div className="bg-white rounded-lg px-4 py-1.5 text-xs text-gray-400 font-mono truncate border border-gray-100">
                    https://ocsthael.com/dashboard
                  </div>
                </div>
              </div>
              
              {/* Browser Content Placeholder */}
              <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-brand-blue/5 to-brand-pink/5 p-8">
                <div className="grid grid-cols-12 gap-6 h-full">
                  <div className="col-span-3 space-y-4">
                    <div className="h-8 bg-brand-blue/10 rounded-lg w-full"></div>
                    <div className="h-32 bg-gray-50 rounded-2xl w-full"></div>
                    <div className="h-32 bg-gray-50 rounded-2xl w-full"></div>
                  </div>
                  <div className="col-span-9 space-y-6">
                    <div className="h-12 bg-brand-pink/10 rounded-xl w-3/4"></div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="h-40 bg-brand-blue/5 border border-brand-blue/10 rounded-3xl"></div>
                      <div className="h-40 bg-brand-pink/5 border border-brand-pink/10 rounded-3xl"></div>
                      <div className="h-40 bg-brand-mango/5 border border-brand-mango/10 rounded-3xl"></div>
                    </div>
                    <div className="h-48 bg-gray-50 rounded-3xl w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* A Connected Digital Ecosystem */}
      <section className="py-32 bg-transparent relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-5xl font-display font-bold mb-6 text-brand-blue"
            >
              A Connected Digital Ecosystem
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Our platforms are built to communicate with each other, creating a unified experience for users across all our services.
            </motion.p>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {apps.map((app, index) => (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/apps/${app.id}`} className="flex items-center p-6 bg-white/80 backdrop-blur-md border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mr-6 overflow-hidden shadow-inner group-hover:bg-brand-blue transition-colors">
                    {app.iconUrl ? (
                      <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-xl text-brand-blue group-hover:text-brand-pink transition-colors">{app.name}</span>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Connected</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}


