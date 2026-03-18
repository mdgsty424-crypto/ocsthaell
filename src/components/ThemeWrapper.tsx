import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState({
    primaryColor: '#0047ff',
    secondaryColor: '#00ffcc',
    backgroundColor: '#05070a',
    fontFamily: 'Inter, sans-serif',
    headingFont: 'Space Grotesk, sans-serif',
    baseFontSize: '16px',
    backgroundDesign: 'gradient-blobs',
    buttonAnimation: 'glow',
    gridColor: 'rgba(255,255,255,0.05)',
    cardBg: 'rgba(10,15,25,0.8)',
    accentColor: '#8A2BE2',
    faviconUrl: 'https://i.postimg.cc/qRw70X1t/favicon.jpg',
    faviconIcoUrl: 'https://i.postimg.cc/qRw70X1t/favicon.jpg',
    appleTouchIconUrl: 'https://i.postimg.cc/qRw70X1t/favicon.jpg',
    manifestIcon192Url: 'https://i.postimg.cc/qRw70X1t/favicon.jpg',
    manifestIcon512Url: 'https://i.postimg.cc/qRw70X1t/favicon.jpg',
  });

  const [seo, setSeo] = useState({
    siteTitle: 'OCSTHAEL - Your Complete Digital Ecosystem',
    metaDescription: 'OCSTHAEL is building a unified digital platform connecting communication, social networking, online income, browsing and e-commerce in one ecosystem.',
  });

  useEffect(() => {
    const unsubscribeTheme = onSnapshot(doc(db, 'settings', 'theme'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as any;
        setTheme(prev => ({ ...prev, ...data }));
      }
    });

    const unsubscribeSEO = onSnapshot(doc(db, 'settings', 'seo'), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as any;
        setSeo(prev => ({ ...prev, ...data }));
      }
    });

    return () => {
      unsubscribeTheme();
      unsubscribeSEO();
    };
  }, []);

  useEffect(() => {
    // Apply global CSS variables
    document.documentElement.style.setProperty('--color-brand-blue', theme.primaryColor);
    document.documentElement.style.setProperty('--color-brand-pink', theme.secondaryColor);
    document.documentElement.style.setProperty('--bg-color', theme.backgroundColor);
    document.documentElement.style.setProperty('--font-sans', theme.fontFamily);
    document.documentElement.style.setProperty('--font-display', theme.headingFont);
    document.documentElement.style.setProperty('--grid-color', theme.gridColor || 'rgba(0,0,0,0.05)');
    document.documentElement.style.setProperty('--card-bg', theme.cardBg || 'rgba(255,255,255,0.8)');
    document.documentElement.style.setProperty('--accent-color', theme.accentColor || '#8A2BE2');
    
    // Apply background color and font size to body
    document.documentElement.style.fontSize = theme.baseFontSize || '16px';
    document.body.style.backgroundColor = theme.backgroundColor;
    document.body.style.fontFamily = theme.fontFamily;

    // Update Site Title and Description
    if (seo.siteTitle) {
      document.title = seo.siteTitle;
    }
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && seo.metaDescription) {
      metaDesc.setAttribute('content', seo.metaDescription);
    }

    // Update Favicon dynamically
    if (theme.faviconUrl || theme.faviconIcoUrl) {
      const links = document.querySelectorAll("link[rel*='icon']");
      links.forEach(link => {
        const l = link as HTMLLinkElement;
        if (l.rel === 'shortcut icon' || l.href.endsWith('.ico')) {
          l.href = theme.faviconIcoUrl || theme.faviconUrl;
        } else {
          l.href = theme.faviconUrl || theme.faviconIcoUrl;
        }
      });
      
      if (links.length === 0) {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = theme.faviconUrl || theme.faviconIcoUrl;
        document.head.appendChild(link);
      }
    }

    // Update Apple Touch Icon
    if (theme.appleTouchIconUrl) {
      let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleIcon);
      }
      appleIcon.href = theme.appleTouchIconUrl;
    }

    // Update Manifest dynamically
    if (theme.manifestIcon192Url || theme.manifestIcon512Url) {
      const manifest = {
        name: seo.siteTitle || 'OCSTHAEL',
        short_name: 'OCSTHAEL',
        icons: [
          {
            src: theme.manifestIcon192Url || theme.faviconUrl || '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: theme.manifestIcon512Url || theme.faviconUrl || '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        theme_color: theme.primaryColor,
        background_color: theme.backgroundColor,
        display: 'standalone'
      };

      const stringManifest = JSON.stringify(manifest);
      const blob = new Blob([stringManifest], { type: 'application/json' });
      const manifestUrl = URL.createObjectURL(blob);
      
      let manifestLink = document.querySelector("link[rel='manifest']") as HTMLLinkElement;
      if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
      }
      manifestLink.href = manifestUrl;

      return () => {
        URL.revokeObjectURL(manifestUrl);
      };
    }
  }, [theme, seo]);

  return (
    <div className={`theme-wrapper design-${theme.backgroundDesign} btn-anim-${theme.buttonAnimation}`}>
      {/* Background designs */}
      {theme.backgroundDesign === 'gradient-blobs' && (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[var(--color-brand-blue)] rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-blob"></div>
          <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-[var(--color-brand-pink)] rounded-full mix-blend-multiply filter blur-[120px] opacity-10 animate-blob animation-delay-2000"></div>
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
          backgroundImage: `radial-gradient(circle at center, var(--color-brand-blue) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
          animation: 'move-bg 20s linear infinite'
        }}></div>
      )}

      {children}
    </div>
  );
}
