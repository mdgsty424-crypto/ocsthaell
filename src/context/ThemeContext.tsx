import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  fontFamily: string;
  headingFont: string;
  logoUrl: string;
  faviconUrl: string;
  logoZoom: number;
  logoX: number;
  logoY: number;
  backgroundDesign: string;
  buttonAnimation: string;
}

const defaultTheme: ThemeSettings = {
  primaryColor: '#0047ff',
  secondaryColor: '#00ffcc',
  backgroundColor: '#05070a',
  fontFamily: 'Inter, sans-serif',
  headingFont: 'Space Grotesk, sans-serif',
  logoUrl: '',
  faviconUrl: '',
  logoZoom: 1,
  logoX: 0,
  logoY: 0,
  backgroundDesign: 'gradient-blobs',
  buttonAnimation: 'glow',
};

const ThemeContext = createContext<ThemeSettings>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'settings', 'theme'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ThemeSettings;
        setTheme((prev) => ({ ...prev, ...data }));
        
        // Apply CSS variables to document root
        const root = document.documentElement;
        root.style.setProperty('--color-primary', data.primaryColor || defaultTheme.primaryColor);
        root.style.setProperty('--color-secondary', data.secondaryColor || defaultTheme.secondaryColor);
        root.style.setProperty('--color-background', data.backgroundColor || defaultTheme.backgroundColor);
        root.style.setProperty('--font-sans', data.fontFamily || defaultTheme.fontFamily);
        root.style.setProperty('--font-display', data.headingFont || defaultTheme.headingFont);

        // Update favicon
        if (data.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = data.faviconUrl;
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
