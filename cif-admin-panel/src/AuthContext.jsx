import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        console.log('Auth state changed:', user);
        setSession(user);
        setLoading(false);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signOut = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
