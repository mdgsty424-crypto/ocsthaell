importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCh6w_NnTL42dUUsrhRZrQxUwNnRnA3xAI",
  authDomain: "ocsthael-shopping.firebaseapp.com",
  projectId: "ocsthael-shopping",
  storageBucket: "ocsthael-shopping.firebasestorage.app",
  messagingSenderId: "257861634639",
  appId: "1:257861634639:web:56ff839f3993062148b83a"
});

const messaging = firebase.messaging();

// Background Message Handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new message.',
    icon: payload.data?.icon || 'https://i.postimg.cc/5NYLFxzG/1000000745-removebg-preview.png',
    badge: 'https://i.postimg.cc/5NYLFxzG/1000000745-removebg-preview.png',
    data: {
      url: payload.data?.url || '/oc-chat',
      type: payload.data?.type || 'message'
    },
    tag: payload.data?.tag || 'chat-notification',
    renotify: true
  };

  // Handle Call Actions
  if (payload.data?.type === 'call' || payload.data?.type === 'audio' || payload.data?.type === 'video') {
    notificationOptions.actions = [
      { action: 'accept', title: 'Accept', icon: 'https://cdn-icons-png.flaticon.com/512/190/190411.png' },
      { action: 'decline', title: 'Decline', icon: 'https://cdn-icons-png.flaticon.com/512/190/190406.png' }
    ];
    notificationOptions.requireInteraction = true;
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/oc-chat';

  if (event.action === 'accept') {
    // Handle accept call - maybe open chat with a specific param
    const acceptUrl = `${urlToOpen}?action=accept_call&roomId=${event.notification.data.roomId}`;
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === acceptUrl && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(acceptUrl);
        }
      })
    );
  } else if (event.action === 'decline') {
    // Handle decline call - maybe just close
  } else {
    // Default click - open chat
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});
