import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export async function broadcastPushNotification({ title, body, data = {} }) {
  try {
    // 1. Fetch all registered push tokens from Firestore
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const tokens = [];

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      // Valid Expo tokens begin with ExponentPushToken[...] or ExpoPushToken[...]
      if (userData.expoPushToken && userData.expoPushToken.startsWith('ExponentPushToken')) {
        tokens.push(userData.expoPushToken);
      }
    });

    if (tokens.length === 0) {
      throw new Error('No registered device tokens found in database.');
    }

    // 2. Prepare notification messages array
    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId: 'default', // Matches Android channel created on client
    }));

    // 3. Batch dispatch to Expo Push Gateway (Max 100 per chunk)
    const chunkSize = 100;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      const resData = await response.json();
      console.log('Batch dispatch response:', resData);
    }

    return { success: true, count: tokens.length };
  } catch (error) {
    console.error('Failed to broadcast notification:', error);
    throw error;
  }
}