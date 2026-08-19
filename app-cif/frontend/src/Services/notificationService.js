import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const isExpoGo = Constants?.executionEnvironment === ExecutionEnvironment.StoreClient;
const isDevice = Constants?.isDevice ?? !__DEV__;

export async function registerForPushNotificationsAsync() {
  // Bypass in Expo Go, Simulator, or non-physical devices
  if (isExpoGo || !isDevice) {
    console.log('[Push] Running in Expo Go / Simulator — skipping remote push token generation.');
    return null;
  }

  try {
    const Notifications = await import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Channel',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Notification permission denied.');
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;

    // Save token to Firestore
    if (auth?.currentUser && token && db) {
      await setDoc(
        doc(db, 'users', auth.currentUser.uid),
        {
          expoPushToken: token,
          platform: Platform.OS,
          lastTokenUpdate: serverTimestamp(),
        },
        { merge: true }
      );
    }

    return token;
  } catch (error) {
    console.warn('[Push] Registration skipped:', error.message);
    return null;
  }
}