import { initializeApp } from 'firebase/app';
// ✅ IMPORT initializeAuth and browserLocalPersistence INSTEAD OF getAuth
import { initializeAuth, browserLocalPersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || 'fake-api-key-for-local-emulator',
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || 'cif-admin-panel.firebaseapp.com',
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || 'cif-admin-panel',
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || 'cif-admin-panel.appspot.com',
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123:web:abc',
};

console.log('Firebase config loaded:', {
  apiKey: firebaseConfig.apiKey ? '***' + firebaseConfig.apiKey.slice(-6) : null,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
});

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error(
    'Missing Firebase env vars. Copy .env.example to .env and fill in your Firebase config values.'
  );
}

let app;
try {
  app = initializeApp(firebaseConfig);
} catch (err) {
  console.error('Firebase initialization failed:', err);
  throw err;
}

// 🚀 ✅ FORCE LOCAL STORAGE SO PLAYWRIGHT CAN CAPTURE IT
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

export const db = getFirestore(app);
export const storage = getStorage(app);

// 🛠️ AUTOMATIC LOCAL EMULATOR CONNECTION
if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
  if (!window._firebaseEmulatorsConnected) {
    try {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectStorageEmulator(storage, '127.0.0.1', 9199);
      
      window._firebaseEmulatorsConnected = true;
      console.log('🛠️ Successfully connected to local Firebase Emulators (Auth, Firestore, Storage)');
    } catch (e) {
      console.log('Emulator connection notice:', e.message);
    }
  }
}