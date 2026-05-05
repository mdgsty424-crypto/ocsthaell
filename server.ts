import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import { generateOGImage } from "./src/lib/og-service";
import { notifyGoogle } from "./src/lib/indexing-service";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Firebase Admin Initialization
  if (!admin.apps.length) {
    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountEnv) {
      try {
        const serviceAccount = JSON.parse(serviceAccountEnv);
        if (serviceAccount.project_id) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
          });
          console.log("Firebase Admin Initialized");
        } else {
          console.warn("FIREBASE_SERVICE_ACCOUNT is set but missing project_id");
        }
      } catch (error) {
        console.error("Firebase Admin Init Error: Invalid JSON in FIREBASE_SERVICE_ACCOUNT", error);
      }
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT not set");
    }
  }

  // OG Image API
  app.get("/api/og", async (req, res) => {
    try {
      const title = (req.query.title as string) || "OCSTHAEL News";
      const img = (req.query.img as string) || "https://i.postimg.cc/05ZcC2b1/14.jpg";
      
      const buffer = await generateOGImage(title, img);
      
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      res.send(buffer);
    } catch (err) {
      console.error("OG Generation Error:", err);
      res.status(500).send("Error generating image");
    }
  });

  // OG Image Generation Proxy
  app.get("/newsphoto/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const db = admin.firestore();
      const doc = await db.collection('news').doc(id).get();
      
      let title = "OCSTHAEL News";
      let img = "https://i.postimg.cc/05ZcC2b1/14.jpg";
      
      if (doc.exists) {
        const data = doc.data();
        title = data?.headline || data?.title || title;
        img = data?.imageUrl || data?.photoUrl || data?.image || img;
      }
      
      const buffer = await generateOGImage(title, img);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      res.send(buffer);
    } catch (err) {
      console.error("OG Image Proxy Error:", err);
      res.status(500).send("Error generating image");
    }
  });

  // Sharing Route with Meta Tag and Redirection
  app.get("/share/news/:id", async (req, res) => {
    try {
      const id = req.params.id;
      const db = admin.firestore();
      const doc = await db.collection('news').doc(id).get();
      
      const baseUrl = "https://ocsthael.com";
      const newsUrl = `${baseUrl}/news/${id}`;
      const imageUrl = `${baseUrl}/newsphoto/${id}?t=${Date.now()}`;
      let title = "OCSTHAEL News";
      let description = "Check out this update from OCSTHAEL.";

      if (doc.exists) {
        const data = doc.data();
        title = data?.headline || data?.title || title;
        description = (data?.content || data?.description || description).substring(0, 160);
        
        // Trigger Indexing
        await notifyGoogle(newsUrl, 'URL_UPDATED');
      }

      // Render meta page with refresh
      res.send(`
        <html>
          <head>
            <meta property="og:title" content="${title}" />
            <meta property="og:description" content="${description}" />
            <meta property="og:image" content="${imageUrl}" />
            <meta property="og:url" content="${newsUrl}" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta http-equiv="refresh" content="0;url=${newsUrl}" />
          </head>
          <body>Redirecting to news...</body>
        </html>
      `);
    } catch (err) {
      console.error("Sharing Route Error:", err);
      res.redirect("https://ocsthael.com/news");
    }
  });

  // Google Indexing API
  app.post("/api/index-url", async (req, res) => {
    const { url, type } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });
    
    // Safety check: Only allow indexing our own domain
    if (!url.includes("ocsthael.com")) {
       return res.status(403).json({ error: "Only ocsthael.com URLs are allowed" });
    }

    const result = await notifyGoogle(url, type || 'URL_UPDATED');
    res.json(result);
  });

  // Robots.txt
  app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.send(`User-agent: *
Allow: /
Sitemap: https://ocsthael.com/sitemap.xml
Disallow: /admin
Disallow: /profile/settings
`);
  });

  // Main Sitemap Endpoint
  app.get("/sitemap.xml", async (req, res) => {
    const baseUrl = "https://ocsthael.com";
    const today = new Date().toISOString().split('T')[0];
    const staticPages = [
      '', '/about', '/services', '/news', '/gallery', '/team', '/apps', 
      '/members', '/contact', '/registration', '/shop'
    ];
    
    res.header("Content-Type", "application/xml");
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">`;

    // 1. Add Static Pages
    staticPages.forEach(page => {
      xml += `
  <url>
    <loc>${baseUrl}${page}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    // 2. Add Dynamic Content with Images
    if (admin.apps.length) {
      try {
        const db = admin.firestore();
        
        // Helper to fetch and add to XML
        const collections = [
          { name: 'news', prefix: '/news', priority: '0.9', freq: 'daily' },
          { name: 'products', prefix: '/shop/product', priority: '0.9', freq: 'daily' },
          { name: 'team', prefix: '/team', priority: '0.7', freq: 'monthly' },
          { name: 'staff', prefix: '/staff', priority: '0.7', freq: 'monthly' },
          { name: 'services', prefix: '/services', priority: '0.8', freq: 'weekly' },
          { name: 'apps', prefix: '/apps', priority: '0.8', freq: 'weekly' },
          { name: 'ads', prefix: '/ads', priority: '0.6', freq: 'daily' },
          { name: 'gallery', prefix: '/gallery', priority: '0.6', freq: 'weekly' },
        ];

        for (const col of collections) {
          const snap = await db.collection(col.name).get();
          snap.forEach(doc => {
            const data = doc.data();
            const images: string[] = [];
            const videos: { url: string; title: string; description: string; thumbnail: string }[] = [];
            
            // Extract images
            if (data.imageUrl) images.push(data.imageUrl);
            if (data.photoUrl) images.push(data.photoUrl);
            if (data.iconUrl) images.push(data.iconUrl);
            if (data.image) images.push(data.image);
            if (Array.isArray(data.images)) images.push(...data.images);

            // Extract videos
            const title = data.headline || data.title || data.name || 'OCSTHAEL Content';
            const desc = (data.content || data.description || data.bio || title).substring(0, 200).replace(/[<>&'"]/g, '');
            const rawTitle = title.replace(/[<>&'"]/g, '');
            const thumb = images[0] || "https://ocsthael.com/og-image.jpg";

            if (data.videoUrl || data.youtubeUrl || data.clipUrl) {
              videos.push({
                url: data.videoUrl || data.youtubeUrl || data.clipUrl,
                title: rawTitle,
                description: desc,
                thumbnail: thumb
              });
            }

            xml += `
  <url>
    <loc>${baseUrl}${col.prefix}/${doc.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${col.freq}</changefreq>
    <priority>${col.priority}</priority>
    ${images.length > 0 ? [...new Set(images)].map(img => `
    <image:image>
      <image:loc>${img}</image:loc>
      <image:title>${rawTitle}</image:title>
    </image:image>`).join('') : ''}
    ${videos.length > 0 ? videos.map(v => `
    <video:video>
      <video:thumbnail_loc>${v.thumbnail}</video:thumbnail_loc>
      <video:title>${v.title}</video:title>
      <video:description>${v.description}</video:description>
      <video:content_loc>${v.url}</video:content_loc>
      <video:publication_date>${today}T00:00:00Z</video:publication_date>
    </video:video>`).join('') : ''}
  </url>`;
          });
        }
      } catch (error) {
        console.error("Sitemap Dynamic Fetch Error:", error);
      }
    }

    xml += `\n</urlset>`;
    res.send(xml);
  });

  // Image Sitemap Endpoint
  app.get('/sitemap-images.xml', async (req, res) => {
    try {
      if (!admin.apps.length) return res.status(500).send("Firebase Admin not initialized");
      const db = admin.firestore();
      const gallerySnap = await db.collection('gallery').get();
      const newsSnap = await db.collection('news').get();
      const productsSnap = await db.collection('products').get();

      let imagesXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;

      const baseUrl = "https://ocsthael.com";

      gallerySnap.forEach(doc => {
        const data = doc.data();
        if (data.imageUrl) {
          imagesXml += `
<url>
  <loc>${baseUrl}/gallery</loc>
  <image:image>
    <image:loc>${data.imageUrl}</image:loc>
    <image:title>${data.title || 'OCSTHAEL Gallery'}</image:title>
  </image:image>
</url>`;
        }
      });

      newsSnap.forEach(doc => {
        const data = doc.data();
        if (data.imageUrl) {
          imagesXml += `
<url>
  <loc>${baseUrl}/news/${doc.id}</loc>
  <image:image>
    <image:loc>${data.imageUrl}</image:loc>
    <image:title>${data.title || 'OCSTHAEL News'}</image:title>
  </image:image>
</url>`;
        }
      });

      productsSnap.forEach(doc => {
        const data = doc.data();
        if (data.images && data.images.length > 0) {
          imagesXml += `
<url>
  <loc>${baseUrl}/shop/product/${doc.id}</loc>
  ${data.images.map((img: string) => `
  <image:image>
    <image:loc>${img}</image:loc>
    <image:title>${data.name || 'OCSTHAEL Shop'}</image:title>
  </image:image>`).join('')}
</url>`;
        }
      });

      imagesXml += `\n</urlset>`;
      res.header('Content-Type', 'application/xml');
      res.send(imagesXml);
    } catch (err) {
      console.error("Sitemap Image Error:", err);
      res.status(500).send("Error generating image sitemap");
    }
  });

  app.post("/api/notify", async (req, res) => {
    const { tokens, title, body, data } = req.body;
    console.log(`[API/Notify] Attempting to send to ${tokens?.length || 0} tokens. Title: ${title}`);

    if (!admin.apps.length) {
      console.error("[API/Notify] Firebase Admin not initialized. Check FIREBASE_SERVICE_ACCOUNT.");
      return res.status(500).json({ error: "Firebase Admin not initialized" });
    }

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      console.warn("[API/Notify] No tokens provided in request body.");
      return res.status(400).json({ error: "No tokens provided" });
    }

    try {
      const validTokens = tokens.filter(t => typeof t === 'string' && t.length > 0);
      if (validTokens.length === 0) {
        return res.status(400).json({ error: "No valid tokens provided" });
      }

      const message = {
        notification: { title, body },
        data: data || {},
        tokens: validTokens,
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`[API/Notify] Success: ${response.successCount}, Failure: ${response.failureCount}`);
      
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`[API/Notify] Token ${idx} failed:`, resp.error);
          }
        });
      }

      res.status(200).json({
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      });
    } catch (error: any) {
      console.error("[API/Notify] Critical Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    const indexHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf-8');

    app.use(express.static(distPath, { index: false }));

    app.get('*', async (req, res) => {
      const url = req.originalUrl;
      const host = `${req.protocol}://${req.get('host')}`;
      const fullUrl = `${host}${url}`;
      
      let title = "OCSTHAEL | Digital Ecosystem";
      let description = "Empowering your digital future through a unified ecosystem.";
      let image = "https://i.postimg.cc/05ZcC2b1/14.jpg";
      let jsonLd = "";

      try {
        if (admin.apps.length) {
          const db = admin.firestore();
          
          if (url.startsWith('/news/')) {
            const id = url.split('/news/')[1].split('?')[0];
            const doc = await db.collection('news').doc(id).get();
            if (doc.exists) {
              const data = doc.data();
              const h = data?.headline || data?.title || "News";
              title = `${h} | OCSTHAEL News`;
              description = (data?.content || data?.description || description).substring(0, 160);
              const newsImg = data?.imageUrl || data?.photoUrl || data?.image || "https://i.postimg.cc/05ZcC2b1/14.jpg";
              image = `${host}/api/og?title=${encodeURIComponent(h)}&img=${encodeURIComponent(newsImg)}&t=${Date.now()}`;
              
              jsonLd = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": h,
                "image": [newsImg],
                "datePublished": data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
                "author": [{
                  "@type": "Person",
                  "name": "SAKIBUL HASSAN",
                  "url": "https://ocsthael.com/team"
                }]
              });
            }
          } else if (url.startsWith('/shop/product/')) {
            const id = url.split('/shop/product/')[1].split('?')[0];
            const doc = await db.collection('products').doc(id).get();
            if (doc.exists) {
              const data = doc.data();
              title = `${data?.name} | OCSTHAEL Store`;
              description = (data?.description || description).substring(0, 160);
              image = data?.images?.[0] || data?.imageUrl || data?.image || image;

              jsonLd = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Product",
                "name": data?.name,
                "image": data?.images || [image],
                "description": description,
                "offers": {
                  "@type": "Offer",
                  "price": data?.price,
                  "priceCurrency": "BDT",
                  "availability": "https://schema.org/InStock"
                }
              });
            }
          } else if (url.startsWith('/team/') || url.startsWith('/staff/')) {
            const id = url.split('/').pop()?.split('?')[0] || '';
            const doc = await db.collection('team').doc(id).get();
            if (doc.exists) {
              const data = doc.data();
              title = `${data?.name} - ${data?.role} | OCSTHAEL Team`;
              description = (data?.bio || description).substring(0, 160);
              image = data?.imageUrl || data?.image || data?.photoUrl || image;

              jsonLd = JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Person",
                "name": data?.name,
                "jobTitle": data?.role,
                "image": image,
                "description": description
              });
            }
          } else if (url.startsWith('/services/')) {
            const id = url.split('/services/')[1].split('?')[0];
            const doc = await db.collection('services').doc(id).get();
            if (doc.exists) {
              const data = doc.data();
              title = `${data?.title} | OCSTHAEL Services`;
              description = (data?.description || description).substring(0, 160);
              image = data?.imageUrl || data?.image || image;
            }
          } else if (url.startsWith('/apps/')) {
            const id = url.split('/apps/')[1].split('?')[0];
            const doc = await db.collection('apps').doc(id).get();
            if (doc.exists) {
              const data = doc.data();
              title = `${data?.name} | OCSTHAEL Apps`;
              description = (data?.description || description).substring(0, 160);
              image = data?.iconUrl || data?.image || image;
            }
          } else if (url === '/gallery') {
            title = "Gallery | OCSTHAEL";
            description = "A visual journey through the OCSTHAEL ecosystem, events, and technological milestones.";
          }
        }
      } catch (err) {
        console.error("Meta Injection Error:", err);
      }

      // Add default WebSite schema if none exists
      if (!jsonLd) {
        jsonLd = JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "OCSTHAEL",
          "url": "https://ocsthael.com"
        });
      }

      const finalHtml = indexHtml
        .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
        .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${description}" />`)
        .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${title}" />`)
        .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${description}" />`)
        .replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${image}" />`)
        .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${fullUrl}" />`)
        .replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${title}" />`)
        .replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${description}" />`)
        .replace(/<meta name="twitter:image" content=".*?" \/>/, `<meta name="twitter:image" content="${image}" />`)
        .replace(/<meta name="twitter:url" content=".*?" \/>/, `<meta name="twitter:url" content="${fullUrl}" />`)
        .replace('</head>', `<script type="application/ld+json">${jsonLd}</script></head>`);

      res.send(finalHtml);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
