import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Firebase Admin Initialization
  if (!admin.apps.length) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
      if (serviceAccount.project_id) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id
        });
        console.log("Firebase Admin Initialized");
      } else {
        console.warn("FIREBASE_SERVICE_ACCOUNT not set or invalid");
      }
    } catch (error) {
      console.error("Firebase Admin Init Error:", error);
    }
  }

  // API Routes
  app.post("/api/notify", async (req, res) => {
    const { tokens, title, body, data } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: "No tokens provided" });
    }

    try {
      const message = {
        notification: { title, body },
        data: data || {},
        tokens: tokens.filter(t => typeof t === 'string' && t.length > 0),
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      res.status(200).json({
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount
      });
    } catch (error: any) {
      console.error("Push Notification Error:", error);
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
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
