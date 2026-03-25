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
