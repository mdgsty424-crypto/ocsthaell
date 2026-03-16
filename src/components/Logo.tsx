import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'horizontal' | 'vertical';
}

export default function Logo({ className = "", variant = 'horizontal' }: LogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src="https://i.postimg.cc/5NYLFxzG/1000000745-removebg-preview.png" 
        alt="Logo" 
        className={variant === 'horizontal' ? "h-12 w-auto object-contain" : "h-20 w-auto object-contain"}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
