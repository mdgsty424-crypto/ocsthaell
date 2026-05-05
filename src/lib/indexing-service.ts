import { google } from 'googleapis';

/**
 * Google Indexing Service
 * Notifies Google about new or updated URLs
 */
export async function notifyGoogle(url: string, type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED') {
  const serviceAccountEnv = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountEnv) {
    console.warn("[Indexing] Google Service Account not found in environment variables.");
    return { success: false, error: "Credentials missing" };
  }

  try {
    const credentials = JSON.parse(serviceAccountEnv);
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing('v3');
    
    console.log(`[Indexing] Notifying Google about: ${url} (${type})`);
    
    const res = await indexing.urlNotifications.publish({
      auth,
      requestBody: {
        url,
        type,
      },
    });

    return { success: true, data: res.data };
  } catch (error: any) {
    console.error("[Indexing] Error notifying Google:", error.message);
    return { success: false, error: error.message };
  }
}
