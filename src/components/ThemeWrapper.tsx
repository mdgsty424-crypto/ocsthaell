import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState({
    primaryColor: '#0047ff',
    secondaryColor: '#00ffcc',
    backgroundColor: '#ffffff',
    fontFamily: 'Inter, sans-serif',
    headingFont: 'Space Grotesk, sans-serif',
    backgroundDesign: 'gradient-blobs',
    buttonAnimation: 'glow',
    gridColor: 'rgba(0,0,0,0.05)',
    cardBg: 'rgba(255,255,255,0.8)',
    accentColor: '#8A2BE2',
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'theme'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as any;
        setTheme(prev => ({ ...prev, ...data }));
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Apply global CSS variables
    document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
    document.documentElement.style.setProperty('--secondary-color', theme.secondaryColor);
    document.documentElement.style.setProperty('--bg-color', theme.backgroundColor);
    document.documentElement.style.setProperty('--font-body', theme.fontFamily);
    document.documentElement.style.setProperty('--font-heading', theme.headingFont);
    document.documentElement.style.setProperty('--grid-color', theme.gridColor || 'rgba(0,0,0,0.05)');
    document.documentElement.style.setProperty('--card-bg', theme.cardBg || 'rgba(255,255,255,0.8)');
    document.documentElement.style.setProperty('--accent-color', theme.accentColor || '#8A2BE2');
    
    // Apply background color to body
    document.body.style.backgroundColor = theme.backgroundColor;
    document.body.style.fontFamily = theme.fontFamily;
  }, [theme]);

  return (
    <div className={`theme-wrapper design-${theme.backgroundDesign} btn-anim-${theme.buttonAnimation}`}>
      {/* Background designs */}
      {theme.backgroundDesign === 'gradient-blobs' && (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--primary-color)] rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-[var(--secondary-color)] rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-[var(--accent-color)] rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-blob animation-delay-4000"></div>
        </div>
      )}
      
      {theme.backgroundDesign === 'grid' && (
        <div className="fixed inset-0 z-[-1] pointer-events-none" style={{
          backgroundImage: `linear-gradient(to right, var(--grid-color) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}></div>
      )}

      {theme.backgroundDesign === 'particles' && (
        <div className="fixed inset-0 z-[-1] pointer-events-none opacity-20" style={{
          backgroundImage: `radial-gradient(circle at center, var(--primary-color) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          animation: 'move-bg 20s linear infinite'
        }}></div>
      )}

      {children}
    </div>
  );
}
