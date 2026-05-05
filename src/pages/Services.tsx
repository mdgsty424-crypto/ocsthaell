import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Hexagon, Layers, Zap, Shield, Code, Smartphone, Globe, Cloud, ArrowRight } from 'lucide-react';
import SEO from '../components/SEO';

interface ServiceData {
  id: string;
  title: string;
  description: string;
  iconName: string;
}

export default function Services() {
  const [services, setServices] = useState<ServiceData[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'services'), (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ServiceData)));
    });
    return () => unsubscribe();
  }, []);

  const getIcon = (name: string) => {
    const icons: any = { Layers, Zap, Shield, Code, Smartphone, Globe, Cloud };
    const Icon = icons[name] || Hexagon;
    return <Icon className="w-10 h-10 text-brand-blue" />;
  };

  return (
    <div className="pt-32 pb-24 min-h-screen">
      <SEO 
        title="Our Services"
        description="Explore the core services of OCSTHAEL ecosystem: Social Media, Chat, Online Income, and E-commerce."
        url={window.location.href}
        type="website"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">Core <span className="text-gradient">Services</span></h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light">
            Empowering businesses with next-generation technological solutions. We provide the tools you need to build the future.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel rounded-2xl p-8 hover:glow-blue transition-shadow duration-300 relative overflow-hidden group"
            >
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-brand-pink rounded-full mix-blend-multiply filter blur-[50px] opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {getIcon(service.iconName)}
              </div>
              
              <h3 className="text-2xl font-bold mb-4 text-gray-900">{service.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">{service.description}</p>
              
              <Link to={`/services/${service.id}`} className="inline-flex items-center text-brand-blue hover:text-brand-pink transition-colors text-sm font-semibold">
                Learn More <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
