import { NextApiRequest, NextApiResponse } from 'next';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')),
      databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tokens, title, body, data } = req.body;

  if (!tokens || tokens.length === 0) {
    return res.status(400).json({ error: 'No tokens provided' });
  }

  try {
    const payload = {
      notification: {
        title: title || 'New Message',
        body: body || 'You have a new message.',
      },
      data: data || {},
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    
    return res.status(200).json({ 
      success: true, 
      successCount: response.successCount, 
      failureCount: response.failureCount 
    });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return res.status(500).json({ error: error.message });
  }
}
