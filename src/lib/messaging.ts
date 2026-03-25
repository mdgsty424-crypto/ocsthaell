import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db, auth } from '../firebase';
import { doc, updateDoc, setDoc } from 'firebase/firestore';

const VAPID_PUBLIC_KEY = 'BL3vTMaTtJoxZbr1eode_zPvediWvQDnEuzlff5mvN9TYTjDgFZ7gYKXSEguYGy-3arT_VveRCqZfQ2LEpYrLhU';

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      const token = await generateToken();
      return token;
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

export const generateToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_PUBLIC_KEY
    });
    
    if (token) {
      console.log('FCM Token:', token);
      // Save token to user profile in Firestore
      if (auth.currentUser) {
        await updateDoc(doc(db, 'users', auth.currentUser.uid), {
          fcmToken: token,
          updatedAt: new Date()
        }).catch(async (err) => {
          // If update fails, try set with merge
          await setDoc(doc(db, 'users', auth.currentUser!.uid), {
            fcmToken: token,
            updatedAt: new Date()
          }, { merge: true });
        });
      }
      return token;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
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
