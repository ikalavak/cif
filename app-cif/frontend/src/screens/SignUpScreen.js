import React, { useState, useRef, useEffect } from "react";
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

// Firebase Auth imports
import { auth } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  PhoneAuthProvider,
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
} from "firebase/auth";

// Expo Auth Tools

import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";

/*GoogleSignin.configure({
  webClientId:
    "574795894327-fsblatou4ahd0hqsp08htj4elhmi5acJ.apps.googleusercontent.com",
  iosClientId:
    "574795894327-oft2jj4plu80g5a1qfjduoojlsbgfn2v.apps.googleusercontent.com",
});*/

export default function SignUpScreen({ navigation }) {
  const [authMode, setAuthMode] = useState("email"); // "email" | "phone"
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Phone form state
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const recaptchaVerifier = useRef(null);
  const { colors } = useTheme();

  /* --- Cross-Platform Google Auth Hook (iOS + Android + Web) ---
 // const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
   // iosClientId: "574795894327-oft2jj4plu80g5a1qfjduoojlsbgfn2v.apps.googleusercontent.com",
    //androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com", // <-- Android Client ID
    //webClientId: "574795894327-fsblatou4ahd0hqsp08htj4elhmi5acj.apps.googleusercontent.com",
  //});

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const { id_token, authentication } = googleResponse.params;
      const token = id_token || authentication?.idToken;

      if (token) {
        handleFirebaseGoogleAuth(token);
      }
    } else if (googleResponse?.type === "error") {
      Alert.alert(
        "Google Sign Up Error",
        googleResponse.error?.message || "Google authentication failed."
      );
      setIsLoading(false);
    }
  }, [googleResponse]); */

  const handleFirebaseGoogleAuth = async (idToken) => {
    setIsLoading(true);
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);

      if (userCredential.user && !userCredential.user.displayName) {
        const googleName = userCredential.user.providerData?.[0]?.displayName;
        if (googleName) {
          await updateProfile(userCredential.user, {
            displayName: googleName,
          });
        }
      }

      navigation.replace("MainApp");
    } catch (error) {
      console.log("Google Firebase Auth error:", error);
      Alert.alert("Google Sign Up Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Email Sign-Up
  const handleEmailSignUp = async () => {
    const trimmedEmail = email.trim();
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !trimmedEmail ||
      !password ||
      !confirmPassword
    ) {
      return Alert.alert("Error", "Please fill in all fields.");
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
        password
      );
      await updateProfile(userCredential.user, {
        displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
      });
      navigation.replace("MainApp");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        Alert.alert(
          "Registration Failed",
          "That email address is already in use."
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

  // 2. Send SMS Verification Code
  const handleSendPhoneCode = async () => {
    const formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+") || formattedPhone.length < 9) {
      return Alert.alert(
        "Invalid Phone Number",
        "Please enter your full number with country code (e.g. +1 555 123 4567 or +44 7123 456789)."
      );
    }

    setIsLoading(true);
    try {
      const phoneProvider = new PhoneAuthProvider(auth);
      const verId = await phoneProvider.verifyPhoneNumber(
        formattedPhone,
        recaptchaVerifier.current
      );
      setVerificationId(verId);
      Alert.alert(
        "Code Sent",
        "Please check your SMS inbox for the 6-digit verification code."
      );
    } catch (error) {
      Alert.alert("Failed to Send SMS", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify OTP & Register
  const handleConfirmPhoneCode = async () => {
    if (!verificationCode.trim() || verificationCode.length !== 6) {
      return Alert.alert(
        "Invalid Code",
        "Please enter the complete 6-digit code."
      );
    }

    setIsLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(
        verificationId,
        verificationCode.trim()
      );
      const userCredential = await signInWithCredential(auth, credential);

      if (firstName.trim() || lastName.trim()) {
        await updateProfile(userCredential.user, {
          displayName: `${firstName.trim()} ${lastName.trim()}`.trim(),
        });
      }

      navigation.replace("MainApp");
    } catch (error) {
      if (error.code === "auth/invalid-verification-code") {
        Alert.alert("Error", "The 6-digit code entered is incorrect.");
      } else if (error.code === "auth/code-expired") {
        Alert.alert("Error", "Code has expired. Please request a new one.");
      } else {
        Alert.alert("Verification Error", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Trigger Google Sign-Up
  const handleGoogleSignUp = async () => {
  if (isLoading) return;

  setIsLoading(true);

  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    const userInfo = await GoogleSignin.signIn();

    const idToken = userInfo?.data?.idToken;

    if (!idToken) {
      throw new Error("Google did not return an ID token.");
    }

    const credential = GoogleAuthProvider.credential(idToken);

    const userCredential = await signInWithCredential(
      auth,
      credential
    );

    const user = userCredential.user;

    if (user && !user.displayName) {
      const googleName =
        userInfo?.data?.user?.name ||
        user.providerData?.[0]?.displayName;

      if (googleName) {
        await updateProfile(user, {
          displayName: googleName,
        });
      }
    }

    navigation.replace("MainApp");
  } catch (error) {
    console.log("Google Sign-In error:", error);

    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // User closed the Google account picker.
      return;
    }

    if (error.code === statusCodes.IN_PROGRESS) {
      Alert.alert(
        "Google Sign-In",
        "Google Sign-In is already in progress."
      );
      return;
    }

    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert(
        "Google Sign-In",
        "Google Play Services is not available on this device."
      );
      return;
    }

    Alert.alert(
      "Google Sign Up Error",
      error?.message || "Unable to sign up with Google."
    );
  } finally {
    setIsLoading(false);
  }
};

  // 5. Microsoft Sign-Up
  const handleMicrosoftSignUp = async () => {
    try {
      setIsLoading(true);

      const clientId = "YOUR_MICROSOFT_APPLICATION_CLIENT_ID";

      const redirectUri = AuthSession.makeRedirectUri({
        scheme: "cifapp",
        path: "oauth",
      });

      const discovery = {
        authorizationEndpoint:
          "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      };

      const request = new AuthSession.AuthRequest({
        clientId: clientId,
        redirectUri: redirectUri,
        usePKCE: false,
        responseType: AuthSession.ResponseType.IdToken,
        scopes: ["openid", "profile", "email"],
        extraParams: {
          nonce: Math.random().toString(36).substring(2),
        },
      });

      const result = await request.promptAsync(discovery);

      if (result.type !== "success") {
        setIsLoading(false);
        return;
      }

      const idToken = result.params?.id_token;
      if (!idToken) {
        throw new Error("Microsoft did not return an ID token.");
      }

      const provider = new OAuthProvider("microsoft.com");
      const credential = provider.credential({
        idToken: idToken,
      });

      const userCredential = await signInWithCredential(auth, credential);

      if (userCredential.user && !userCredential.user.displayName) {
        const microsoftName =
          userCredential.user.providerData?.[0]?.displayName;
        if (microsoftName) {
          await updateProfile(userCredential.user, {
            displayName: microsoftName,
          });
        }
      }

      navigation.replace("MainApp");
    } catch (error) {
      console.log("Microsoft authentication error:", error);
      Alert.alert(
        "Microsoft Sign Up Error",
        error?.message || "Unable to sign up with Microsoft."
      );
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

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              authMode === "email" && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setAuthMode("email")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    authMode === "email" ? colors.primary : colors.textMuted,
                },
              ]}
            >
              Email
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              authMode === "phone" && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => setAuthMode("phone")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    authMode === "phone" ? colors.primary : colors.textMuted,
                },
              ]}
            >
              Phone Number
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.formContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* First & Last Name Inputs */}
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

          {authMode === "email" ? (
            /* Email Sign-Up Form */
            <>
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
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={18}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>

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

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleEmailSignUp}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Sign Up with Email
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            /* Phone Sign-Up Form */
            <>
              <View style={styles.inputContainer}>
                <Feather
                  name="phone"
                  size={18}
                  color={colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="+1 555 123 4567"
                  placeholderTextColor={colors.textMuted}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  editable={!verificationId}
                />
              </View>

              {verificationId && (
                <View style={styles.inputContainer}>
                  <Feather
                    name="check-circle"
                    size={18}
                    color={colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Enter 6-digit Code"
                    placeholderTextColor={colors.textMuted}
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              )}

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={
                  verificationId ? handleConfirmPhoneCode : handleSendPhoneCode
                }
                disabled={isLoading}
              >
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {verificationId ? "Verify & Register" : "Send SMS Code"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {verificationId && (
                <TouchableOpacity
                  onPress={() => {
                    setVerificationId(null);
                    setVerificationCode("");
                  }}
                  style={{ marginTop: 10, alignItems: "center" }}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    Change phone number / Resend SMS
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Social Sign-Up Section */}
          <View style={styles.dividerRow}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
            <Text style={[styles.dividerText, { color: colors.textMuted }]}>
              OR SIGN UP WITH
            </Text>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[
                styles.socialButton,
                { borderColor: colors.border },
                isLoading && { opacity: 0.7 },
             ]}
              onPress={handleGoogleSignUp}
              disabled={isLoading}
            >
              <FontAwesome5 name="google" size={18} color="#EA4335" />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>
                Google
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, { borderColor: colors.border }]}
              onPress={handleMicrosoftSignUp}
              disabled={isLoading}
            >
              <FontAwesome5 name="microsoft" size={18} color="#00A4EF" />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>
                Microsoft
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>
              Already have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={[styles.linkText, { color: colors.accent2 }]}>
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
  rootContainer: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  header: { marginBottom: 20 },
  titleText: { fontSize: 28, fontWeight: "bold", marginBottom: 6 },
  subtitleText: { fontSize: 15 },
  tabContainer: { flexDirection: "row", marginBottom: 16 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabText: { fontSize: 15, fontWeight: "600" },
  formContainer: { borderRadius: 20, padding: 20, borderWidth: 1 },
  nameRow: { flexDirection: "row" },
  nameInput: { flex: 1 },
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
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 14 },
  primaryButton: {
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: { fontSize: 15, fontWeight: "bold", color: "#fff" },
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
    gap: 12,
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
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 14 },
  footerText: { fontSize: 14 },
  linkText: { fontSize: 14, fontWeight: "bold" },
});