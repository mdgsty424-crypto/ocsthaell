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
