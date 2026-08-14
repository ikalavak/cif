import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";

import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";
import { useTheme } from "../context/ThemeContext";

export default function ForgotPasswordScreen({ navigation }) {
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());

      Alert.alert(
        "Password Reset",
        "A password reset link has been sent to your email.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        Alert.alert(
          "Error",
          "No account was found with this email."
        );
      } else if (error.code === "auth/invalid-email") {
        Alert.alert(
          "Error",
          "Please enter a valid email address."
        );
      } else {
        Alert.alert(
          "Error",
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.bg },
      ]}
    >

      {/* Back Button */}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text style={{ color: colors.text }}>
          ← Back
        </Text>
      </TouchableOpacity>

      {/* Title */}
      <Text
        style={[
          styles.title,
          { color: colors.text },
        ]}
      >
        Forgot Password?
      </Text>

      {/* Description */}
      <Text
        style={[
          styles.description,
          { color: colors.textSecondary || colors.text },
        ]}
      >
        Enter your email address and we'll send you a link
        to reset your password.
      </Text>

      {/* Email */}
      <TextInput
        placeholder="Email address"
        placeholderTextColor={colors.textSecondary || "#888"}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.border || "#888",
            backgroundColor: colors.card || colors.bg,
          },
        ]}
      />

      {/* Reset Button */}
      <TouchableOpacity
        onPress={handleResetPassword}
        disabled={loading}
        style={[
          styles.button,
          {
            backgroundColor: colors.primary,
            opacity: loading ? 0.6 : 1,
          },
        ]}
      >
        <Text style={styles.buttonText}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },

  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    padding: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },

  description: {
    fontSize: 15,
    marginBottom: 30,
    lineHeight: 22,
  },

  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    marginBottom: 20,
    fontSize: 16,
  },

  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
}); 