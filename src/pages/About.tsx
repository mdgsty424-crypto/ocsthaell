import { motion } from 'motion/react';
import { Target, Eye, Zap, ShieldCheck, Globe, Smartphone, Briefcase, MessageSquare, ShoppingCart, DollarSign, Cloud, BookOpen, Music, Video, Map, Bot } from 'lucide-react';

export default function About() {
  return (
    <div className="pt-32 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">About <span className="text-gradient">OCSTHAEL</span></h1>
          <h2 className="text-2xl md:text-3xl text-gray-800 font-light mb-8">Building a Unified Digital Ecosystem</h2>
          <div className="text-lg text-gray-600 max-w-4xl mx-auto font-light space-y-6 text-left md:text-center leading-relaxed">
            <p>
              OCSTHAEL একটি উদ্ভাবনী প্রযুক্তি ভিত্তিক উদ্যোগ যার লক্ষ্য হলো একটি শক্তিশালী ডিজিটাল ইকোসিস্টেম তৈরি করা যেখানে যোগাযোগ, সামাজিক যোগাযোগ, অনলাইন আয়, ইন্টারনেট ব্যবহার এবং ই-কমার্স সবকিছু একসাথে একটি প্ল্যাটফর্মে সংযুক্ত থাকবে।
            </p>
            <p>
              বর্তমান সময়ে বিশ্বের অধিকাংশ ডিজিটাল সেবা বিদেশি কোম্পানির উপর নির্ভরশীল। OCSTHAEL এর মূল লক্ষ্য হলো একটি স্বাধীন ও শক্তিশালী ডিজিটাল প্ল্যাটফর্ম তৈরি করা যা ব্যবহারকারীদের জন্য সহজ, নিরাপদ এবং কার্যকর প্রযুক্তি সেবা প্রদান করবে।
            </p>
            <p>
              OCSTHAEL শুধুমাত্র একটি অ্যাপ বা একটি সেবা নয়, এটি একটি complete digital ecosystem যেখানে বিভিন্ন ধরনের অ্যাপ এবং প্ল্যাটফর্ম একসাথে কাজ করবে। এই ecosystem এর মাধ্যমে ব্যবহারকারীরা সামাজিক যোগাযোগ, মেসেজিং, অনলাইন আয়, ইন্টারনেট ব্রাউজিং এবং অনলাইন শপিং এক জায়গা থেকেই ব্যবহার করতে পারবে।
            </p>
          </div>
        </motion.div>

        {/* Mission, Vision, Goal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-panel p-10 rounded-3xl hover:glow-blue transition-all duration-500"
          >
            <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-6">
              <Target className="w-8 h-8 text-brand-blue" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed">
              মানুষের জন্য সহজ, নিরাপদ এবং কার্যকর ডিজিটাল সেবা তৈরি করা এবং একটি শক্তিশালী স্থানীয় ডিজিটাল ইকোসিস্টেম গড়ে তোলা।
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-10 rounded-3xl hover:glow-pink transition-all duration-500"
          >
            <div className="w-16 h-16 bg-brand-pink/10 rounded-full flex items-center justify-center mb-6">
              <Eye className="w-8 h-8 text-brand-pink" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
            <p className="text-gray-600 leading-relaxed">
              একটি সমন্বিত ডিজিটাল প্ল্যাটফর্ম তৈরি করা যেখানে যোগাযোগ, ব্যবসা, প্রযুক্তি এবং অর্থনৈতিক সুযোগ একসাথে কাজ করবে।
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="glass-panel p-10 rounded-3xl hover:glow-mango transition-all duration-500"
          >
            <div className="w-16 h-16 bg-brand-mango/10 rounded-full flex items-center justify-center mb-6">
              <Zap className="w-8 h-8 text-brand-mango" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Goal</h3>
            <ul className="text-gray-600 leading-relaxed space-y-2 list-disc list-inside">
              <li>একটি শক্তিশালী ডিজিটাল ecosystem তৈরি করা</li>
              <li>মানুষের জন্য নতুন অনলাইন সুযোগ তৈরি করা</li>
              <li>প্রযুক্তির মাধ্যমে ব্যবসা ও উদ্যোক্তাদের সহায়তা করা</li>
              <li>একটি নিরাপদ এবং ব্যবহারবান্ধব ডিজিটাল প্ল্যাটফর্ম তৈরি করা</li>
            </ul>
          </motion.div>
        </div>

        {/* Why Choose OCSTHAEL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gray-900">Why Choose <span className="text-brand-blue">OCSTHAEL</span></h2>
            <p className="text-gray-600 leading-relaxed text-lg">
              OCSTHAEL এমন একটি ডিজিটাল প্ল্যাটফর্ম যা ব্যবহারকারীদের জন্য একাধিক গুরুত্বপূর্ণ সেবা একসাথে একটি ecosystem এর মধ্যে নিয়ে আসে। আমাদের লক্ষ্য হলো একটি সহজ, নিরাপদ এবং শক্তিশালী প্রযুক্তি পরিবেশ তৈরি করা যেখানে মানুষ যোগাযোগ, ব্যবসা, সামাজিক যোগাযোগ এবং অনলাইন আয়ের সুযোগ একসাথে পাবে।
            </p>
            <p className="text-gray-600 leading-relaxed text-lg">
              অনেক সময় মানুষকে বিভিন্ন কাজের জন্য বিভিন্ন অ্যাপ ব্যবহার করতে হয়। OCSTHAEL এই সমস্যার সমাধান করে একটি integrated digital ecosystem তৈরি করছে যেখানে একাধিক সেবা একই প্ল্যাটফর্মে পাওয়া যাবে।
            </p>
            <p className="text-gray-600 leading-relaxed text-lg">
              OCSTHAEL ব্যবহারকারীদের জন্য security, simplicity এবং opportunity কে সবচেয়ে বেশি গুরুত্ব দেয়। আমাদের প্ল্যাটফর্ম এমনভাবে তৈরি করা হয়েছে যাতে নতুন ব্যবহারকারীরাও সহজে এটি ব্যবহার করতে পারে।
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="glass-panel p-8 rounded-3xl border border-gray-200"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Reasons</h3>
            <ul className="space-y-4">
              {[
                { icon: Globe, text: 'Unified digital ecosystem' },
                { icon: Smartphone, text: 'Easy and user-friendly platform' },
                { icon: ShieldCheck, text: 'Secure digital services' },
                { icon: DollarSign, text: 'Opportunities for online earning' },
                { icon: Briefcase, text: 'Support for digital businesses and entrepreneurs' }
              ].map((item, index) => (
                <li key={index} className="flex items-center text-gray-700 bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-brand-blue/30 transition-colors">
                  <item.icon className="w-6 h-6 text-brand-blue mr-4 flex-shrink-0" />
                  <span className="text-lg">{item.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* OCSTHAEL Ecosystem */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-gray-900 mb-6">OCSTHAEL <span className="text-gradient">Ecosystem</span></h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
              OCSTHAEL ecosystem এমনভাবে তৈরি করা হয়েছে যাতে সব অ্যাপ একে অপরের সাথে সংযুক্ত থাকে। এর ফলে ব্যবহারকারীরা একই ecosystem এর মধ্যে বিভিন্ন সেবা ব্যবহার করতে পারে।
            </p>
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Main Ecosystem Apps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {[
              { name: 'OC-SOCIAL', desc: 'একটি আধুনিক সোশ্যাল মিডিয়া প্ল্যাটফর্ম যেখানে মানুষ যোগাযোগ, পোস্ট শেয়ার এবং কমিউনিটি তৈরি করতে পারে।', icon: Globe, color: 'text-brand-blue' },
              { name: 'OC-CHAT', desc: 'দ্রুত এবং নিরাপদ মেসেজিং ও যোগাযোগের জন্য একটি স্মার্ট চ্যাট অ্যাপ।', icon: MessageSquare, color: 'text-brand-pink' },
              { name: 'OC-INCOME', desc: 'মানুষকে অনলাইনে আয়ের সুযোগ তৈরি করে এমন একটি ডিজিটাল আয়ের প্ল্যাটফর্ম।', icon: DollarSign, color: 'text-emerald-500' },
              { name: 'OC-BROWSER', desc: 'নিরাপদ এবং দ্রুত ইন্টারনেট ব্যবহারের জন্য একটি স্মার্ট ওয়েব ব্রাউজার।', icon: Globe, color: 'text-rose-500' },
              { name: 'OCSTHAEL SHOPPING', desc: 'একটি আধুনিক ই-কমার্স মার্কেটপ্লেস যেখানে মানুষ পণ্য কিনতে এবং বিক্রি করতে পারে।', icon: ShoppingCart, color: 'text-brand-mango' },
            ].map((app, index) => (
              <div key={index} className="glass-panel p-6 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-100 hover:border-gray-200">
                <div className="flex items-center mb-4">
                  <app.icon className={`w-8 h-8 ${app.color} mr-3`} />
                  <h4 className="text-xl font-bold text-gray-900">{app.name}</h4>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{app.desc}</p>
              </div>
            ))}
          </div>

          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Future Apps of OCSTHAEL</h3>
          <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
            ভবিষ্যতে OCSTHAEL ecosystem আরও বিস্তৃত করার পরিকল্পনা রয়েছে। নতুন প্রযুক্তি এবং সেবা যুক্ত করে একটি সম্পূর্ণ ডিজিটাল প্ল্যাটফর্ম তৈরি করা হবে।
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'OC-PAY', desc: 'ডিজিটাল পেমেন্ট ফিনটেক', icon: DollarSign },
              { name: 'OC-CLOUD', desc: 'ডেটা স্টোরেজ ও ক্লাউড', icon: Cloud },
              { name: 'OC-LEARN', desc: 'অনলাইন শিক্ষা প্ল্যাটফর্ম', icon: BookOpen },
              { name: 'OC-MUSIC', desc: 'মিউজিক স্ট্রিমিং', icon: Music },
              { name: 'OC-VIDEO', desc: 'ভিডিও শেয়ারিং', icon: Video },
              { name: 'OC-MAP', desc: 'লোকেশন ও নেভিগেশন', icon: Map },
              { name: 'OC-AI', desc: 'কৃত্রিম বুদ্ধিমত্তা সেবা', icon: Bot },
            ].map((app, index) => (
              <div key={index} className="bg-white/80 border border-gray-100 p-5 rounded-xl text-center hover:border-brand-pink/50 transition-colors">
                <app.icon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <h5 className="text-gray-900 font-bold mb-1">{app.name}</h5>
                <p className="text-xs text-gray-500">{app.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* OCSTHAEL Story */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-panel p-10 md:p-16 rounded-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-brand opacity-10 blur-3xl rounded-full"></div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-gray-900 mb-8">OCSTHAEL <span className="text-brand-pink">Story</span></h2>
            <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
              <p>
                OCSTHAEL এর ধারণা এসেছে একটি শক্তিশালী এবং স্বাধীন ডিজিটাল প্ল্যাটফর্ম তৈরির চিন্তা থেকে। বর্তমানে অনেক ডিজিটাল সেবা বিদেশি কোম্পানির উপর নির্ভরশীল। OCSTHAEL এর লক্ষ্য হলো এমন একটি প্রযুক্তি প্ল্যাটফর্ম তৈরি করা যা স্থানীয়ভাবে শক্তিশালী হবে এবং ব্যবহারকারীদের জন্য নতুন সুযোগ তৈরি করবে।
              </p>
              <p>
                এই উদ্যোগের লক্ষ্য শুধুমাত্র প্রযুক্তি তৈরি করা নয়, বরং একটি ডিজিটাল কমিউনিটি এবং অর্থনৈতিক সুযোগ তৈরি করা যেখানে মানুষ নতুন ব্যবসা শুরু করতে পারবে, অনলাইনে আয় করতে পারবে এবং একটি শক্তিশালী ডিজিটাল সমাজের অংশ হতে পারবে।
              </p>
              <p className="text-gray-900 font-medium">
                OCSTHAEL ভবিষ্যতে আরও উন্নত প্রযুক্তি এবং নতুন সেবা যুক্ত করে একটি সম্পূর্ণ ডিজিটাল ecosystem তৈরি করার লক্ষ্য নিয়ে এগিয়ে যাচ্ছে।
              </p>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
