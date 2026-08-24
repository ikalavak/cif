// cif-admin-panel/src/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebaseClient";

const AuthContext = createContext(null);
// Primary Root Super Admin email
const ROOT_SUPERADMIN_EMAIL = "nonye_c@hotmail.co.uk";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [role, setRole] = useState(null); // 'admin' | 'superadmin' | null
  const [loading, setLoading] = useState(true);

  const resolveAdminRole = async (user) => {
    if (!user || !user.email) return { isAdmin: false, role: null };

    const normalizedEmail = user.email.trim().toLowerCase();

    // 1. Root Super Admin bootstrap check
    if (normalizedEmail === ROOT_SUPERADMIN_EMAIL) {
      try {
        await setDoc(
          doc(db, "admins", user.uid),
          {
            email: normalizedEmail,
            role: "superadmin",
            lastLogin: serverTimestamp(),
          },
          { merge: true },
        );
      } catch (e) {
        console.warn("Super Admin auto-sync note:", e.message);
      }
      return { isAdmin: true, role: "superadmin" };
    }

    // 2. Direct lookup by UID doc (Complies with match /admins/{uid})
    try {
      const uidSnap = await getDoc(doc(db, "admins", user.uid));
      if (uidSnap.exists()) {
        const data = uidSnap.data();
        const userRole = data.role === "superadmin" ? "superadmin" : "admin";

        // Update last login timestamp safely
        try {
          await updateDoc(doc(db, "admins", user.uid), {
            lastLogin: serverTimestamp(),
          });
        } catch (_) {}

        return { isAdmin: true, role: userRole };
      }
    } catch (e) {
      console.warn("UID admin verification failed:", e.message);
    }

    return { isAdmin: false, role: null };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const status = await resolveAdminRole(user);
        setSession(user);
        setIsAdmin(status.isAdmin);
        setRole(status.role);
      } else {
        setSession(null);
        setIsAdmin(false);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const user = userCredential.user;

    const status = await resolveAdminRole(user);

    if (!status.isAdmin) {
      await firebaseSignOut(auth);
      setSession(null);
      setIsAdmin(false);
      setRole(null);
      throw new Error(
        `Access Denied: ${user.email} is not registered as an Admin.`,
      );
    }

    setSession(user);
    setIsAdmin(true);
    setRole(status.role);
    return user;
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setSession(null);
    setIsAdmin(false);
    setRole(null);
  };

  // Password Reset function
  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        isAdmin,
        role,
        isSuperAdmin: role === "superadmin",
        loading,
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
