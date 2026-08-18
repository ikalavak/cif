// cif-admin-panel/src/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const tokenResult = await user.getIdTokenResult(true);
          const userRole = tokenResult.claims.role || null;
          const hasAdminAccess = tokenResult.claims.admin === true || userRole === 'admin';

          setSession(user);
          setIsAdmin(hasAdminAccess);
          setRole(userRole);
        } catch (error) {
          console.error('Error fetching custom claims:', error);
          setSession(user);
          setIsAdmin(false);
          setRole(null);
        }
      } else {
        setSession(null);
        setIsAdmin(false);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const signOut = () => firebaseSignOut(auth);

  return (
    <AuthContext.Provider value={{ session, isAdmin, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}