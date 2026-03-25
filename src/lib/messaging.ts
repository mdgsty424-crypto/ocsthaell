import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db, auth } from '../firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'BL3vTMaTtJoxZbr1eode_zPvediWvQDnEuzlff5mvN9TYTjDgFZ7gYKXSEguYGy-3arT_VveRCqZfQ2LEpYrLhU';

export const requestNotificationPermission = async () => {
  try {
    console.log('[Messaging] Requesting permission...');
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('[Messaging] Permission granted.');
      const token = await generateToken();
      return token;
    } else {
      console.warn('[Messaging] Permission denied.');
      return null;
    }
  } catch (error) {
    console.error('[Messaging] Error requesting permission:', error);
    return null;
  }
};

export const generateToken = async () => {
  try {
    console.log('[Messaging] Generating token with VAPID key:', VAPID_PUBLIC_KEY);
    const token = await getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY
    });
    
    if (token) {
      console.log('[Messaging] FCM Token generated:', token);
      // Save token to user profile in Firestore
      if (auth.currentUser) {
        console.log('[Messaging] Saving token to Firestore for user:', auth.currentUser.uid);
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          fcmToken: token,
          updatedAt: new Date()
        }).catch(async (err) => {
          console.warn('[Messaging] updateDoc failed, trying setDoc with merge:', err.message);
          await setDoc(doc(db, 'users', auth.currentUser!.uid), {
            fcmToken: token,
            updatedAt: new Date()
          }, { merge: true });
        });
        console.log('[Messaging] Token saved successfully.');
      } else {
        console.warn('[Messaging] No user logged in. Token not saved to Firestore.');
      }
      return token;
    } else {
      console.warn('[Messaging] No registration token available.');
      return null;
    }
  } catch (error) {
    console.error('[Messaging] Error retrieving token:', error);
    return null;
  }
};

export const onForegroundMessage = () => {
  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    
    // Show a custom toast or notification in the UI
    const { title, body } = payload.notification || {};
    const { icon, url } = payload.data || {};

    if (Notification.permission === 'granted') {
      new Notification(title || 'New Message', {
        body: body || 'You have a new message.',
        icon: icon || 'https://i.postimg.cc/5NYLFxzG/1000000745-removebg-preview.png',
        data: { url: url || '/oc-chat' }
      }).onclick = (event: any) => {
        event.preventDefault();
        window.focus();
        if (url) {
          window.location.href = url;
        }
      };
    }
  });
};

/**
 * Sends a push notification via the Vercel API.
 * This is a "No Computer" alternative to Cloud Functions.
 */
export const sendPushNotification = async (tokens: string[], title: string, body: string, data: any = {}) => {
  if (!tokens || tokens.length === 0) return;

  try {
    const response = await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokens, title, body, data })
    });
    
    const result = await response.json();
    console.log('Notification send result:', result);
    return result;
  } catch (error) {
    console.error('Error calling notify API:', error);
    return null;
  }
};
