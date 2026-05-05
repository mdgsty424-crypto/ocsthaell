const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Triggers when a new message is created in any chat's 'messages' subcollection.
 * Sends a push notification to the receiver using their stored FCM token.
 */
exports.sendChatNotification = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    const chatId = context.params.chatId;
    
    const { senderName, text, senderId, type } = messageData;

    // Determine the receiverId from the chatId (format: uid1_uid2)
    // For group chats, chatId is the group document ID
    let receiverIds = [];
    
    if (chatId.includes('_')) {
      // One-on-one chat
      receiverIds = chatId.split('_').filter(id => id !== senderId && id !== 'ai_bot');
    } else {
      // Group chat - need to fetch group members
      try {
        const groupDoc = await admin.firestore().collection('groups').doc(chatId).get();
        if (groupDoc.exists) {
          const groupData = groupDoc.data();
          receiverIds = (groupData.members || []).filter(id => id !== senderId);
        }
      } catch (err) {
        console.error('Error fetching group members:', err);
      }
    }

    if (receiverIds.length === 0) {
      console.log('No receivers found for this message.');
      return null;
    }

    const promises = receiverIds.map(async (receiverId) => {
      try {
        const userDoc = await admin.firestore().collection('users').doc(receiverId).get();
        if (!userDoc.exists) return null;

        const fcmToken = userDoc.data()?.fcmToken;
        if (!fcmToken) return null;

        const payload = {
          notification: {
            title: senderName || 'New Message',
            body: text || (messageData.fileUrl ? 'Sent an attachment' : 'You have a new message.'),
            icon: 'https://i.postimg.cc/5NYLFxzG/1000000745-removebg-preview.png',
          },
          data: {
            url: '/oc-chat',
            type: type || 'message',
            senderId: senderId || '',
            chatId: chatId
          }
        };

        return admin.messaging().sendToDevice(fcmToken, payload);
      } catch (error) {
        console.error(`Error sending to ${receiverId}:`, error);
        return null;
      }
    });

    return Promise.all(promises);
  });

/**
 * Triggers when a new global notification is created in 'global_notifications'.
 * Sends a push notification to ALL users who have an FCM token.
 */
exports.sendGlobalNotification = functions.firestore
  .document('global_notifications/{notifId}')
  .onCreate(async (snapshot, context) => {
    const { title, message, type } = snapshot.data();
    const notifId = context.params.notifId;

    try {
      // Fetch all users with an FCM token
      const usersSnapshot = await admin.firestore()
        .collection('users')
        .where('fcmToken', '!=', null)
        .get();

      const tokens = usersSnapshot.docs
        .map(doc => doc.data().fcmToken)
        .filter(token => !!token);

      if (tokens.length === 0) {
        console.log('No users with FCM tokens found.');
        return snapshot.ref.update({ status: 'no_tokens' });
      }

      const payload = {
        notification: {
          title: title || 'System Update',
          body: message || 'You have a new update from OCSTHAEL.',
          icon: 'https://i.postimg.cc/5NYLFxzG/1000000745-removebg-preview.png',
        },
        data: {
          url: '/',
          type: type || 'message',
          global: 'true'
        }
      };

      // Send to all tokens (batching if necessary, but sendToDevice handles arrays)
      const response = await admin.messaging().sendToDevice(tokens, payload);
      
      console.log(`Successfully sent global notification to ${tokens.length} users.`);
      
      return snapshot.ref.update({ 
        status: 'sent', 
        sentCount: tokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount
      });
    } catch (error) {
      console.error('Error sending global notification:', error);
      return snapshot.ref.update({ status: 'error', error: error.message });
    }
  });

const { content } = require('@googleapis/content');
const { indexing } = require('@googleapis/indexing');
const { GoogleAuth } = require('google-auth-library');

const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');

const authClient = new GoogleAuth({
  credentials: serviceAccount,
  scopes: [
    'https://www.googleapis.com/auth/content',
    'https://www.googleapis.com/auth/indexing'
  ],
});

const contentClient = content({ version: 'v2.1', auth: authClient });
const indexingClient = indexing({ version: 'v3', auth: authClient });

async function uploadProductToGoogle(productDetails) {
  const { id, name, description, link, imageUrl, price, availability } = productDetails;
  
  const merchantId = process.env.GOOGLE_MERCHANT_ID || '5781342860';
  const targetCountry = process.env.TARGET_COUNTRY || 'BD';
  const feedLabel = process.env.FEED_LABEL || 'BD';

  const product = {
    offerId: id,
    title: name,
    description: description,
    link: link || `https://ocsthael.com/shop/product/${id}`,
    imageLink: imageUrl,
    contentLanguage: 'en',
    targetCountry: targetCountry,
    feedLabel: feedLabel,
    channel: 'online',
    availability: availability || 'in stock',
    condition: 'new',
    price: {
      value: price.toString(),
      currency: 'BDT',
    },
  };

  return contentClient.products.insert({
    merchantId: merchantId,
    requestBody: product,
  });
}

async function notifyGoogleIndexing(url) {
  if (!url) return;
  try {
    await indexingClient.urlNotifications.publish({
      requestBody: {
        url: url,
        type: 'URL_UPDATED',
      },
    });
    console.log(`Indexing notification sent for: ${url}`);
  } catch (err) {
    console.error(`Indexing API Error for ${url}:`, err);
  }
}

// Product Sync (Create & Update)
exports.syncProductToGoogle = functions.firestore
  .document('products/{productId}')
  .onWrite(async (change, context) => {
    const data = change.after.exists ? change.after.data() : null;
    const oldData = change.before.exists ? change.before.data() : null;

    if (!data) {
      // Handle deletion if needed
      return null;
    }

    try {
      await uploadProductToGoogle({
        id: context.params.productId,
        name: data.name,
        description: data.description,
        link: data.link,
        imageUrl: data.imageUrl || (data.images && data.images[0]),
        price: data.discountPrice || data.price,
        availability: data.stock > 0 ? 'in stock' : 'out of stock',
      });
      console.log(`Product ${context.params.productId} synced to Google Merchant Center.`);
      
      // Also notify Indexing API for the product page
      await notifyGoogleIndexing(`https://ocsthael.com/shop/product/${context.params.productId}`);
    } catch (error) {
      console.error(`Error syncing product ${context.params.productId}:`, error);
    }
  });

// News Indexing
exports.notifyNewsIndexing = functions.firestore
  .document('news/{newsId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;
    const url = `https://ocsthael.com/news/${context.params.newsId}`;
    return notifyGoogleIndexing(url);
  });

// Gallery Media Indexing
exports.notifyGalleryIndexing = functions.firestore
  .document('gallery/{mediaId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;
    // Gallery item doesn't have a unique page yet, but we notify the gallery root
    return notifyGoogleIndexing(`https://ocsthael.com/gallery`);
  });
