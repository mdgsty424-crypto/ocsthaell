import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Hexagon, Layers, Zap, Shield, Code, Smartphone, Globe, Cloud, CheckCircle2 } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import SEO from "../components/SEO";

export default function ServiceDetails() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchService = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "services", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setService({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching service details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [id]);

  const getIcon = (name: string) => {
    const icons: any = { Layers, Zap, Shield, Code, Smartphone, Globe, Cloud };
    const Icon = icons[name] || Hexagon;
    return <Icon className="w-16 h-16 text-brand-blue" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 px-4 flex justify-center items-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen pt-32 px-4 text-center bg-white">
        <h1 className="text-4xl text-gray-900 font-bold mb-4">Service Not Found</h1>
        <Link to="/services" className="text-brand-blue hover:underline">
          Return to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 bg-white text-gray-900 overflow-hidden relative">
      <SEO 
        title={`${service.title} | OCSTHAEL Services`}
        description={service.description}
        url={window.location.href}
        type="article"
      />
      {/* Organic Liquid Blobs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[-10%] right-[-5%] w-[70%] h-[70%] bg-gradient-to-br from-brand-blue/5 to-brand-pink/5 rounded-full blur-[120px] opacity-60"
          style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
        ></motion.div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            to="/services"
            className="inline-flex items-center text-gray-500 hover:text-brand-blue mb-12 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Services
          </Link>

          <div className="flex flex-col md:flex-row gap-12 items-start mb-16">
            <div className="w-24 h-24 rounded-3xl bg-brand-blue/5 flex items-center justify-center shadow-xl border border-brand-blue/10 flex-shrink-0">
              {getIcon(service.iconName)}
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl font-display font-black text-gray-900 mb-6 leading-tight">
                {service.title}
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed font-medium">
                {service.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="p-8 rounded-[2rem] bg-gray-50 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features</h3>
              <ul className="space-y-4">
                {['Advanced Security', 'Cloud Integration', 'Real-time Analytics', 'Scalable Architecture'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 rounded-[2rem] bg-brand-blue/5 border border-brand-blue/10">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Why Choose Us?</h3>
              <p className="text-gray-600 leading-relaxed">
                Our solutions are built with precision and care, ensuring that your business stays ahead of the curve in an ever-evolving digital landscape.
              </p>
            </div>
          </div>

          <div className="prose prose-blue max-w-none">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Service Overview</h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-8">
              At OCSTHAEL, we believe in delivering excellence through innovation. Our {service.title} service is designed to address the unique challenges of modern enterprises, providing a robust framework for growth and success.
            </p>
            <p className="text-gray-600 text-lg leading-relaxed">
              Whether you are a startup looking to scale or an established corporation seeking to optimize your operations, our team of experts is here to guide you every step of the way. We combine deep industry knowledge with cutting-edge technology to deliver results that matter.
            </p>
          </div>

          <div className="mt-16 p-12 rounded-[3rem] bg-gradient-to-r from-brand-blue to-brand-mango text-white text-center shadow-2xl">
            <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
            <p className="text-white/80 mb-10 text-lg max-w-2xl mx-auto">
              Contact our team today to learn more about how our {service.title} can transform your business.
            </p>
            <Link
              to="/contact"
              className="inline-block px-12 py-5 bg-white text-brand-blue font-bold rounded-2xl hover:bg-gray-100 transition-all hover:-translate-y-1 shadow-xl"
            >
              Contact Us Now
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
