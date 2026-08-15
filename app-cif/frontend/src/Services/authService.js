import { auth } from "../../../backend/src/config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  PhoneAuthProvider,
  signInWithCustomToken,
} from "firebase/auth";

// --- Email / Password ---
export const registerWithEmail = async (firstName, lastName, email, password) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, {
    displayName: `${firstName} ${lastName}`.trim(),
  });
  return cred.user;
};

export const loginWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

// --- Google Sign-In ---
export const loginWithGoogleCredential = async (idToken) => {
  const credential = GoogleAuthProvider.credential(idToken);
  return await signInWithCredential(auth, credential);
};

// --- Microsoft Sign-In ---
export const loginWithMicrosoftCredential = async (idToken, accessToken) => {
  const provider = new OAuthProvider("microsoft.com");
  const credential = provider.credential({
    idToken,
    accessToken,
  });
  return await signInWithCredential(auth, credential);
};

// --- Phone Auth (Verification Step) ---
export const verifyPhoneCode = async (verificationId, code) => {
  const credential = PhoneAuthProvider.credential(verificationId, code);
  return await signInWithCredential(auth, credential);
};