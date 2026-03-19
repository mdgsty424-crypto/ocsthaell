import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

export const getGeminiApiKey = async (): Promise<string | null> => {
  try {
    const docRef = doc(db, 'systemSettings', 'apiKeys');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.geminiApiKey) {
        return data.geminiApiKey;
      }
    }
  } catch (err) {
    console.error("Error fetching Gemini API key from Firestore:", err);
  }
  
  // Fallback to environment variables
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY || null;
};
