import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  browserLocalPersistence,
  getAuth,
  connectAuthEmulator,
} from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// 1. Initialize Firebase App (prevents duplicate app errors on fast refresh)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// 2. Determine persistence based on platform
const persistence =
  Platform.OS === "web"
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage);

// 3. Initialize Firebase Authentication
let auth;
try {
  auth = initializeAuth(app, { persistence });
} catch (e) {
  // Fallback for Fast Refresh / Hot Reloading
  auth = getAuth(app);
}

// 4. Initialize Cloud Firestore
const db = getFirestore(app);

// 5. Connect to local emulators ONLY when explicitly testing.
// Never runs against live Firebase unless EXPO_PUBLIC_USE_EMULATOR=true is set.
if (process.env.EXPO_PUBLIC_USE_EMULATOR === "true") {
  const emulatorHost = Platform.OS === "web" ? "127.0.0.1" : "10.180.114.218";
  connectAuthEmulator(auth, `http://${emulatorHost}:9099`);
  connectFirestoreEmulator(db, emulatorHost, 8080);
  console.log("🔥 Connected to Firebase Emulators (local testing only)");
}

export { app, auth, db };
