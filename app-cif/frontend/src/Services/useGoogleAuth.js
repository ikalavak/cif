// app-cif/src/hooks/useGoogleAuth.js
import { useEffect, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase'; // your firebase configuration

// Ensure the browser session completes properly
WebBrowser.maybeCompleteAuthSession();

// Replace with your Web Client ID from Firebase Console -> Authentication -> Sign-in Method -> Google
const WEB_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

export function useGoogleAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Use Google.useAuthRequest with explicit responseType
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: WEB_CLIENT_ID,
    responseType: 'id_token',
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleFirebaseGoogleSignIn(id_token);
      }
    } else if (response?.type === 'error') {
      setError(response.error?.message || 'Google sign in failed');
      setLoading(false);
    } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      setLoading(false);
    }
  }, [response]);

  const handleFirebaseGoogleSignIn = async (idToken) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Create a Firebase credential using Google's ID token
      const credential = GoogleAuthProvider.credential(idToken);
      
      // 2. Sign in to Firebase
      const userCredential = await signInWithCredential(auth, credential);
      const user = userCredential.user;

      // 3. Create user document in Firestore if not already present
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          email: user.email,
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: 'user',
          isAdmin: false,
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.error('Firebase Google Sign-In Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = () => {
    setLoading(true);
    promptAsync();
  };

  return { signInWithGoogle, loading, error, isReady: !!request };
}