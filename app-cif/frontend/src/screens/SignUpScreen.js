import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";

import SafeScreen from "../components/SafeScreen";
import { LinearGradient } from "expo-linear-gradient";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

// Firebase
import { auth, db } from "../config/firebase";

import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function SignUpScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Email form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const { colors } = useTheme();

  // Save user to Firestore
  const syncUserToFirestore = async (user, additionalData = {}) => {
    if (!user || !db) return;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email || additionalData.email || "",

          displayName:
            additionalData.displayName ||
            user.displayName ||
            "Festival Attendee",

          photoURL: user.photoURL || null,

          role: "attendee",
          ticketType: "General Admission",
          bio: "",
          interests: [],

          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        },
        { merge: true },
      );
    } catch (err) {
      console.warn("Could not persist user to Firestore:", err.message);
    }
  };

  // Google Sign-Up
  // Placeholder — replace with a real Terms & Conditions / Privacy Policy
  // screen or web link before launch.
  const showTermsPlaceholder = () => {
    Alert.alert(
      "Terms & Conditions",
      "Full Terms & Conditions and Privacy Policy content will be added here before launch.",
    );
  };

  const handleGoogleSignUp = async () => {
    if (isLoading) return;

    if (!agreedToTerms) {
      Alert.alert(
        "Agreement required",
        "Please agree to the Terms & Conditions to continue.",
      );
      return;
    }

    setIsLoading(true);

    try {
      // Lazy-load native module — only exists in a real dev build, never
      // in Expo Go. Loading it at the top of the file crashes the whole
      // app on startup in Expo Go; loading it here only affects THIS
      // button if tapped inside Expo Go, which we catch below instead.
      const {
        GoogleSignin,
        statusCodes,
      } = require("@react-native-google-signin/google-signin");

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      const idToken = response?.data?.idToken ?? response?.idToken;

      if (!idToken) {
        throw new Error("No ID token returned from Google Sign-In.");
      }

      const credential = GoogleAuthProvider.credential(idToken);

      const userCredential = await signInWithCredential(auth, credential);

      const user = userCredential.user;

      if (user && !user.displayName) {
        const googleName =
          response?.data?.user?.name || user.providerData?.[0]?.displayName;

        if (googleName) {
          await updateProfile(user, {
            displayName: googleName,
          });
        }
      }

      await syncUserToFirestore(user);

      navigation.replace("MainApp");
    } catch (error) {
      if (
        error.message?.includes("could not be found") ||
        error.message?.includes("Requiring module")
      ) {
        Alert.alert(
          "Not available in Expo Go",
          "Google Sign-In requires the full development build, not Expo Go. Use email sign-up for now, or switch to the dev client build.",
        );
      } else if (error.code === "SIGN_IN_CANCELLED") {
        console.log("User cancelled Google sign-up");
      } else if (error.code === "IN_PROGRESS") {
        Alert.alert("Sign-Up", "Google sign-up is already in progress.");
      } else if (error.code === "PLAY_SERVICES_NOT_AVAILABLE") {
        Alert.alert(
          "Error",
          "Google Play Services is not available or outdated on this device.",
        );
      } else {
        console.error("Google Sign-In Error:", error);

        Alert.alert(
          "Google Sign Up Error",
          error?.message || "Unable to sign up with Google.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Email Sign-Up
  const handleEmailSignUp = async () => {
    const trimmedEmail = email.trim();

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !trimmedEmail ||
      !password ||
      !confirmPassword
    ) {
      return Alert.alert("Error", "Please fill in all fields.");
    }

    if (!agreedToTerms) {
      return Alert.alert(
        "Agreement required",
        "Please agree to the Terms & Conditions to continue.",
      );
    }

    if (password.length < 6) {
      return Alert.alert("Error", "Password must be at least 6 characters.");
    }

    if (password !== confirmPassword) {
      return Alert.alert("Error", "Passwords do not match.");
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        trimmedEmail,
        password,
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName,
      });

      await sendEmailVerification(user);

      await syncUserToFirestore(user, {
        displayName: fullName,
        email: trimmedEmail,
      });

      await signOut(auth);

      Alert.alert(
        "Verify Your Email",
        `We sent a verification link to ${trimmedEmail}. Please verify your email before logging in.`,
        [
          {
            text: "Go to Login",
            onPress: () => navigation.replace("Login"),
          },
        ],
      );
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          "Registration Failed",
          "That email address is already in use.",
        );
      } else if (error.code === "auth/invalid-email") {
        Alert.alert("Error", "Please enter a valid email address.");
      } else if (error.code === "auth/weak-password") {
        Alert.alert("Error", "Password is too weak.");
      } else {
        Alert.alert("Registration Error", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeScreen
      scroll
      style={[styles.rootContainer, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <Text style={[styles.titleText, { color: colors.text }]}>
            Create Account
          </Text>

          <Text style={[styles.subtitleText, { color: colors.textMuted }]}>
            Join the Creative Industries Festival
          </Text>
        </View>

        {/* Email only */}
        <View style={styles.tabContainer}>
          <View
            style={[
              styles.tabButton,
              {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Text style={[styles.tabText, { color: colors.primary }]}>
              Email
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.formContainer,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* First & Last Name */}
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.nameInput]}>
              <Feather
                name="user"
                size={18}
                color={colors.primary}
                style={styles.inputIcon}
              />

              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="First Name"
                placeholderTextColor={colors.textMuted}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>

            <View
              style={[
                styles.inputContainer,
                styles.nameInput,
                { marginLeft: 12 },
              ]}
            >
              <Feather
                name="user"
                size={18}
                color={colors.primary}
                style={styles.inputIcon}
              />

              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Last Name"
                placeholderTextColor={colors.textMuted}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Feather
              name="mail"
              size={18}
              color={colors.primary}
              style={styles.inputIcon}
            />

            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email address"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Feather
              name="lock"
              size={18}
              color={colors.primary}
              style={styles.inputIcon}
            />

            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password (min 6 characters)"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />

            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Feather
              name="lock"
              size={18}
              color={colors.primary}
              style={styles.inputIcon}
            />

            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          {/* Terms & Conditions agreement */}
          <TouchableOpacity
            style={styles.termsRow}
            activeOpacity={0.7}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View
              style={[
                styles.checkbox,
                agreedToTerms && { backgroundColor: colors.primary },
                { borderColor: colors.primary },
              ]}
            >
              {agreedToTerms && <Feather name="check" size={12} color="#fff" />}
            </View>

            <Text style={[styles.termsText, { color: colors.textMuted }]}>
              I agree to the{" "}
              <Text
                style={[styles.termsLink, { color: colors.primary }]}
                onPress={showTermsPlaceholder}
              >
                Terms & Conditions
              </Text>{" "}
              and{" "}
              <Text
                style={[styles.termsLink, { color: colors.primary }]}
                onPress={showTermsPlaceholder}
              >
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          {/* Email Sign-Up */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleEmailSignUp}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.primary, colors.accent || colors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign Up with Email</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Social Sign-Up */}
          <View style={styles.dividerRow}>
            <View
              style={[
                styles.dividerLine,
                {
                  backgroundColor: colors.border,
                },
              ]}
            />

            <Text
              style={[
                styles.dividerText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              OR SIGN UP WITH
            </Text>

            <View
              style={[
                styles.dividerLine,
                {
                  backgroundColor: colors.border,
                },
              ]}
            />
          </View>

          {/* Google only */}
          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                {
                  borderColor: colors.border,
                },
                isLoading && {
                  opacity: 0.7,
                },
              ]}
              onPress={handleGoogleSignUp}
              disabled={isLoading}
            >
              <FontAwesome5 name="google" size={18} color="#EA4335" />

              <Text style={[styles.socialButtonText, { color: colors.text }]}>
                Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text
              style={[
                styles.footerText,
                {
                  color: colors.textMuted,
                },
              ]}
            >
              Already have an account?{" "}
            </Text>

            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text
                style={[
                  styles.linkText,
                  {
                    color: colors.accent2 || colors.primary,
                  },
                ]}
              >
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    marginTop: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    marginRight: 10,
    marginTop: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  termsLink: {
    fontWeight: "700",
  },
  rootContainer: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },

  keyboardView: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },

  header: {
    marginBottom: 20,
  },

  titleText: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 6,
  },

  subtitleText: {
    fontSize: 15,
  },

  tabContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },

  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
  },

  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },

  formContainer: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },

  nameRow: {
    flexDirection: "row",
  },

  nameInput: {
    flex: 1,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 14,
  },

  primaryButton: {
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },

  dividerLine: {
    flex: 1,
    height: 1,
  },

  dividerText: {
    fontSize: 11,
    fontWeight: "bold",
    paddingHorizontal: 10,
  },

  socialRow: {
    flexDirection: "row",
    marginBottom: 10,
  },

  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },

  socialButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 14,
  },

  footerText: {
    fontSize: 14,
  },

  linkText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
