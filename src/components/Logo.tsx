import React from 'react';
import { motion } from 'motion/react';
import { MousePointer2, Heart } from 'lucide-react';

interface LogoProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

export default function Logo({ className = "", variant = 'vertical' }: LogoProps) {
  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-pink to-brand-blue rounded-lg rotate-45 opacity-20 group-hover:rotate-90 transition-transform duration-500"></div>
          <Heart className="w-5 h-5 text-brand-pink fill-brand-pink/20" />
          <MousePointer2 className="absolute -bottom-1 -right-1 w-4 h-4 text-brand-blue fill-brand-blue" />
        </div>
        <span className="text-xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-mango tracking-tighter">
          CSTH&EL
        </span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center leading-none ${className}`}>
      <div className="relative w-12 h-12 mb-2 flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-pink to-brand-blue rounded-xl rotate-12 opacity-20 group-hover:rotate-45 transition-transform duration-500"></div>
        <Heart className="w-8 h-8 text-brand-pink fill-brand-pink/20" />
        <MousePointer2 className="absolute -bottom-1 -right-1 w-6 h-6 text-brand-blue fill-brand-blue" />
      </div>
      <div className="flex flex-col items-center">
        <span className="text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-brand-blue to-brand-mango tracking-widest">
          CSTH
        </span>
        <span className="text-lg font-display font-bold text-brand-blue/80 -mt-1">
          &EL
        </span>
      </div>
    </div>
  );
}
