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
  ScrollView,
} from "react-native";
import SafeScreen from "../components/SafeScreen";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

// Import Firebase dependencies
import { auth } from "../config/firebase"; // Adjust path if needed
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

export default function SignUpScreen({ navigation }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Added loading state

  const { colors } = useTheme();

  const handleRegister = async () => {
    // 1. Validate all fields are filled
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    // 2. Validate password length (Firebase requires 6+ characters)
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters.");
      return;
    }

    // 3. Validate passwords match
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // Attach the full name to their Firebase profile
      await updateProfile(userCredential.user, {
        displayName: `${firstName} ${lastName}`.trim(),
      });

      // Navigate to the main app
      navigation.replace("MainApp");
    } catch (error) {
      // 5. Handle Firebase errors gracefully
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
        Alert.alert("Error", error.message);
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

        <View
          style={[
            styles.formContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {/* Name row: First + Last */}
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.nameInput]}>
              <Feather
                name="user"
                size={20}
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
                size={20}
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

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Feather
              name="mail"
              size={20}
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

          {/* Password Input */}
          <View style={styles.inputContainer}>
            <Feather
              name="lock"
              size={20}
              color={colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
            />
          </View>

          {/* Confirm Password Input */}
          <View style={styles.inputContainer}>
            <Feather
              name="lock"
              size={20}
              color={colors.primary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
            />
          </View>

          {/* Wired up Sign Up Button to Firebase function */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={{ marginTop: 10 }}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.onPrimary || "#ffffff"} />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: colors.onPrimary || "#ffffff" },
                  ]}
                >
                  Sign Up
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Back to Login Link */}
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
    marginBottom: 40,
  },
  titleText: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
  },
  formContainer: {
    borderRadius: 24,
    padding: 24,
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
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  primaryButton: {
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "bold",
  },
});
