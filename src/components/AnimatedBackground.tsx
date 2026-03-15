import React from 'react';
import { motion } from 'motion/react';
import { Star } from 'lucide-react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-white">
      {/* Liquid Shapes */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-blue/10 blur-[100px] animate-liquid"
      />
      <motion.div
        animate={{
          x: [0, -80, 0],
          y: [0, 100, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-pink/10 blur-[120px] animate-liquid"
      />
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, -100, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-brand-mango/10 blur-[80px] animate-liquid"
      />

      {/* Floating Circles */}
      <motion.div
        animate={{
          y: [0, -100, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute top-[40%] left-[15%] w-24 h-24 rounded-full bg-brand-blue/20 blur-xl"
      />
      <motion.div
        animate={{
          y: [0, 150, 0],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{ duration: 15, repeat: Infinity }}
        className="absolute bottom-[30%] left-[40%] w-32 h-32 rounded-full bg-brand-mango/20 blur-2xl"
      />
      <motion.div
        animate={{
          x: [0, 100, 0],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{ duration: 12, repeat: Infinity }}
        className="absolute top-[10%] left-[60%] w-16 h-16 rounded-full bg-brand-pink/20 blur-lg"
      />

      {/* Stars */}
      <motion.div
        className="absolute top-[15%] left-[25%] text-brand-mango/30 animate-star"
      >
        <Star size={40} fill="currentColor" />
      </motion.div>
      <motion.div
        className="absolute bottom-[20%] right-[30%] text-brand-blue/30 animate-star"
        style={{ animationDelay: '1s' }}
      >
        <Star size={60} fill="currentColor" />
      </motion.div>
      <motion.div
        className="absolute top-[60%] right-[15%] text-brand-pink/30 animate-star"
        style={{ animationDelay: '2s' }}
      >
        <Star size={30} fill="currentColor" />
      </motion.div>
      <motion.div
        className="absolute bottom-[40%] left-[10%] text-brand-mango/20 animate-star"
        style={{ animationDelay: '0.5s' }}
      >
        <Star size={25} fill="currentColor" />
      </motion.div>
    </div>
  );
};

export default AnimatedBackground;
